from __future__ import annotations

import base64
import copy
import Crypto.Cipher.AES
import json
import os
import typing

import CustomMethodsVI.Concurrent as Concurrent
import CustomMethodsVI.FileSystem as FileSystem
import CustomMethodsVI.Misc as Misc
import CustomMethodsVI.Stream as Stream
import CustomMethodsVI.Synchronization as Synchronization
from CustomMethodsVI.Concurrent import ThreadedFunction


class MyDatabase:
	"""
	Database implementation using JSON files
	"""

	__ROOT: FileSystem.Directory = ...
	__SECTORS: dict[str, MyDatabase] = {}
	__SECTOR_LOCK: Synchronization.SpinLock = Synchronization.SpinLock()

	@classmethod
	def __file_for(cls: type[MyDatabase], sector: str) -> FileSystem.File:
		Misc.raise_ifn(isinstance(sector, str) and len(sector := str(sector)) > 0, NameError('Invalid sector name'))
		sector = sector.replace('.', os.sep).replace('/', os.sep).replace('\\', os.sep)
		Misc.raise_ifn(all(char.isalnum() or char == os.sep for char in sector), NameError('Invalid sector name'))
		file: FileSystem.File = cls.__ROOT.file(f'{sector}.json')
		parent: FileSystem.Directory = file.parent

		for i in range(256):
			if parent == cls.__ROOT:
				return file

			parent = parent.parent

		raise FileNotFoundError(f'No such sector: \'{sector}\'')

	@classmethod
	def __close_sector_handle(cls: type[MyDatabase], sector: MyDatabase) -> None:
		name: str = Stream.LinqStream(cls.__SECTORS.items()).filter(lambda pair: pair[1] is sector).transform(lambda pair: pair[0]).first_or_default(None)
		cls.__SECTORS.pop(name, None)

	@classmethod
	def load(cls: type[MyDatabase], root: FileSystem.Directory | str) -> bool:
		"""
		Loads the database (content is not stored in memory)
		:param root: The database root directory
		:return: Whether database was loaded
		"""

		cls.__ROOT = root if isinstance(root, FileSystem.Directory) else FileSystem.Directory(root)
		return cls.__ROOT.exists()

	@classmethod
	def sector_exists(cls, name: str) -> bool:
		"""
		:param name: The sector name
		:return: Whether the specified sector file exists
		:raises AssertionError: If database is not loaded
		:raises NameError: If sector name is invalid
		:raises FileNotFoundError: If sector does not exist
		"""

		return cls.__file_for(name).exists()

	@classmethod
	def open(cls: type[MyDatabase], name: str, *, create_if_not_found: bool = True, crypt: typing.Optional[str] = None) -> MyDatabase:
		"""
		Opens the specified sector for IO operators
		:param name: The sector name
		:param create_if_not_found: Whether sector file will be created if not found
		:param crypt: The password to decrypt with if encrypted or None if plain JSON
		:return: The new sector interface
		:raises AssertionError: If database is not loaded
		:raises NameError: If sector name is invalid
		:raises FileNotFoundError: If sector does not exist
		"""

		assert cls.is_loaded(), 'Database not loaded'

		with cls.__SECTOR_LOCK:
			sector: MyDatabase = cls.__SECTORS.get(name)

			if sector is None:
				file: FileSystem.File = cls.__file_for(name)

				if not file.exists() and create_if_not_found:
					return cls.create(name)

				Misc.raise_ifn(file.exists(), FileNotFoundError(f'No such sector: \'{name}\''))
				sector = MyDatabase(file, crypt=crypt)
				cls.__SECTORS[name] = sector
				return sector
			else:
				return sector

	@classmethod
	def create(cls: type[MyDatabase], name: str, *, crypt: typing.Optional[str] = None) -> MyDatabase:
		"""
		Creates a new sector in the database
		:param name: The sector name
		:param crypt: The password to decrypt with if encrypted or None if plain JSON
		:return: The new sector interface
		:raises AssertionError: If database is not loaded
		:raises NameError: If sector name is invalid
		:raises FileExistsError: If sector already exists
		"""

		assert cls.is_loaded(), 'Database not loaded'

		with cls.__SECTOR_LOCK:
			file: FileSystem.File = cls.__file_for(name)
			Misc.raise_if(file.exists() or name in cls.__SECTORS, FileExistsError('Sector already exists'))
			file.parent.create()
			file.create()
			return MyDatabase(file, crypt=crypt)

	@classmethod
	def delete(cls: type[MyDatabase], name: str, *, force_close_handles: bool = False) -> None:
		"""
		Deletes a sector from the database
		:param name: The sector name
		:param force_close_handles: If false, will raise an error if this sector is opened, otherwise, closes all handles to this sector
		:raises AssertionError: If database is not loaded
		:raises NameError: If sector name is invalid
		:raises IOError: If sector is opened and 'force_close_handles' is False
		:raises FileNotFoundError: If sector does not exist
		"""

		assert cls.is_loaded(), 'Database not loaded'

		with cls.__SECTOR_LOCK:
			file: FileSystem.File = cls.__file_for(name)
			sector: MyDatabase = cls.__SECTORS.pop(name, None)

			if sector is not None and not force_close_handles:
				raise IOError('Sector is opened')
			elif sector is not None and force_close_handles:
				sector.close()
				file.delete()
			elif not file.exists():
				raise FileNotFoundError(f'No such sector: \'{name}\'')
			else:
				file.delete()

	@classmethod
	def unload(cls: type[MyDatabase], *, save: bool = True) -> None:
		"""
		Closes the database - All sector handles are closed
		:param save: Whether to save sectors before close
		"""

		with cls.__SECTOR_LOCK:
			for sector in tuple(v for k, v in cls.__SECTORS.items()):
				if not sector.closed:
					if save:
						sector.save()

					sector.close()

			cls.__SECTORS.clear()
			cls.__ROOT = ...

	@classmethod
	def is_loaded(cls: type[MyDatabase]) -> bool:
		"""
		:return: Whether database root exists
		"""

		return isinstance(cls.__ROOT, FileSystem.Directory) and cls.__ROOT.exists()

	def __init__(self, file: FileSystem.File, *, crypt: typing.Optional[str] = None):
		assert isinstance(file, FileSystem.File) and file.exists() and file.extension == 'json', 'Invalid file'
		assert crypt is None or (isinstance(crypt, str) and len(crypt) >= 8), 'Invalid file crypt key'
		self.__handle__: typing.Optional[FileSystem.File] = file
		self.__contents__: dict[str, typing.Any] = {}
		self.__crypt__: typing.Optional[None] = crypt
		self.__lock__: Synchronization.ReaderWriterLock = Synchronization.ReaderWriterLock()
		self.__modifications__: int = 0
		data: str = file.single_read()

		if len(data) > 0 and self.encrypted:
			password: bytes = base64.b64encode(crypt.encode())
			remaining: int = max(0, 32 - len(password))
			password += b'\x00' * remaining
			password = password[:32]
			payload: bytes = base64.b64decode(file.single_read(True))
			mac_length: int = int.from_bytes(payload[:8], 'big', signed=False)
			nonce_length: int = int.from_bytes(payload[8:16], 'little', signed=False)
			mac: bytes = payload[16:16 + mac_length]
			cipher: bytes = payload[16 + mac_length:-nonce_length]
			nonce: bytes = payload[-nonce_length:]
			crypter = Crypto.Cipher.AES.new(password, Crypto.Cipher.AES.MODE_EAX, nonce=nonce)

			try:
				payload = crypter.decrypt_and_verify(cipher, mac)
				self.__contents__ = json.loads(payload.decode('utf-8'))
			except ValueError:
				raise PermissionError('Crypt key is incorrect')
		elif len(data) > 0:
			self.__contents__ = json.loads(data)
		else:
			self.__contents__ = {}

	def __len__(self) -> int:
		"""
		:return: The length of this sector
		"""

		return self.length().wait()

	def __repr__(self) -> str:
		return str(self)

	def __str__(self) -> str:
		return str({k: v for k, v in self})

	def __setitem__(self, key: str, value: typing.Any) -> Concurrent.ThreadedPromise[None]:
		"""
		Sets the specified key to the specified value
		:param key: The key
		:param value: The value
		:raises TypeError: If 'key' is not a string
		:raises IOError: If sector is closed
		"""

		Misc.raise_ifn(isinstance(key, str), TypeError(f'JSON keys must be a string, got object of type \'{type(key).__name__}\''))
		Misc.raise_if(self.closed, IOError('Operation on closed sector'))

		@Concurrent.ThreadedFunction
		def __operation__() -> None:
			with self.__lock__.writer():
				self.__modifications__ += 1
				self.__contents__[str(key)] = value

		return __operation__()

	def __delitem__(self, key: str) -> None | Concurrent.ThreadedPromise[None]:
		"""
		Deletes the specified key from the sector
		:param key: The key
		:raises TypeError: If 'key' is not a string
		:raises IOError: If sector is closed
		"""

		Misc.raise_ifn(isinstance(key, str), TypeError(f'JSON keys must be a string, got object of type \'{type(key).__name__}\''))
		Misc.raise_if(self.closed, IOError('Operation on closed sector'))

		@ThreadedFunction
		def __operation__() -> None:
			with self.__lock__.writer():
				self.__modifications__ += 1
				del self.__contents__[str(key)]

		return __operation__()

	def __contains__(self, key: str) -> bool | Concurrent.ThreadedPromise[bool]:
		"""
		Checks if the key exists in this sector map
		:param key: The key
		:return Whether 'key' exists:
		:raises TypeError: If 'key' is not a string
		:raises IOError: If sector is closed
		"""

		Misc.raise_ifn(isinstance(key, str), TypeError(f'JSON keys must be a string, got object of type \'{type(key).__name__}\''))
		Misc.raise_if(self.closed, IOError('Operation on closed sector'))

		@ThreadedFunction
		def __operation__() -> bool:
			with self.__lock__.reader():
				return str(key) in self.__contents__

		return __operation__()

	def __getitem__(self, key: str) -> typing.Any | Concurrent.ThreadedPromise[typing.Any]:
		"""
		Gets the value of the specified value
		:param key: The key
		:raises TypeError: If 'key' is not a string
		:raises IOError: If sector is closed
		"""

		Misc.raise_ifn(isinstance(key, str), TypeError(f'JSON keys must be a string, got object of type \'{type(key).__name__}\''))
		Misc.raise_if(self.closed, IOError('Operation on closed sector'))

		@ThreadedFunction
		def __operation__() -> typing.Any:
			with self.__lock__.reader():
				return copy.deepcopy(self.__contents__[str(key)])

		return __operation__()

	def __iter__(self) -> MyDatabaseIterator:
		"""
		Iterates the key-value pairs of this sector
		:raises IOError: If sector is closed
		"""

		Misc.raise_if(self.closed, IOError('Operation on closed sector'))
		return MyDatabaseIterator(self)

	def close(self) -> None:
		"""
		Closes this sector handle
		"""

		self.__handle__ = None
		self.__contents__ = None
		type(self).__close_sector_handle(self)

	def save(self, *, crypt: typing.Optional[str] = ...) -> None:
		"""
		Saves cached data to file\n
		:param crypt: The password to encrypt with, ... for current password or None for plain JSON
		:raises IOError: If sector is closed
		"""

		if self.closed:
			raise IOError('Operation on closed sector')
		elif self.pending_modifications == 0 and crypt is ...:
			return
		elif crypt is not None:
			password: bytes = base64.b64encode((self.__crypt__ if crypt is ... else str(crypt)).encode())
			remaining: int = max(0, 32 - len(password))
			password += b'\x00' * remaining
			password = password[:32]
			payload: bytes = json.dumps(self.__contents__).encode('utf-8')
			crypter = Crypto.Cipher.AES.new(password, Crypto.Cipher.AES.MODE_EAX)
			nonce: bytes = crypter.nonce
			cipher, mac = crypter.encrypt_and_digest(payload)
			result: bytes = len(mac).to_bytes(8, 'big', signed=False) + len(nonce).to_bytes(8, 'little', signed=False) + mac + cipher + nonce

			with self.__lock__.writer():
				self.__handle__.single_write(base64.b64encode(result))
				self.__modifications__ = 0
		else:
			with self.__lock__.writer():
				self.__handle__.single_write(json.dumps(self.__contents__))
				self.__modifications__ = 0

	def writer(self) -> Synchronization.ReaderWriterLock.Lock:
		"""
		Acquires this sector's internal writer lock\n
		Modification count will be increased regardless of whether a write operation occurred
		:return: The writer lock
		"""
		self.__modifications__ += 1
		return self.__lock__.writer()

	def reader(self) -> Synchronization.ReaderWriterLock.Lock:
		"""
		Acquires this sector's internal reader lock
		:return: The reader lock
		"""

		return self.__lock__.reader()

	def save_async(self, *, crypt: typing.Optional[str] = ...) -> Concurrent.ThreadedPromise[None]:
		return Concurrent.ThreadedFunction(self.save)(crypt=crypt)

	def clear(self) -> Concurrent.ThreadedPromise[None]:
		"""
		Clears all data in this sector
		:raises IOError: If sector is closed
		"""

		Misc.raise_if(self.closed, IOError('Operation on closed sector'))

		@ThreadedFunction
		def __operation__() -> None:
			with self.__lock__.writer():
				self.__modifications__ += 1
				self.__contents__.clear()

		return __operation__()

	def update(self, mapping: typing.Mapping[str, typing.Any]) -> Concurrent.ThreadedPromise[None]:
		"""
		Updates the internal dictionary with the key-value pairs from 'mapping'
		:param mapping: The dictionary to update with
		:raises TypeError: If 'mapping' is not a Mapping
		:raises IOError: If sector is closed
		"""

		Misc.raise_ifn(isinstance(mapping, typing.Mapping), TypeError(f'Specified object must be a mapping instance, got object of type \'{type(mapping).__name__}\''))
		Misc.raise_if(self.closed, IOError('Operation on closed sector'))

		@ThreadedFunction
		def __operation__() -> None:
			with self.__lock__.writer():
				self.__modifications__ += 1
				self.__contents__.update(mapping)

		return __operation__()

	def set(self, mapping: typing.Mapping[str, typing.Any]) -> Concurrent.ThreadedPromise[None]:
		"""
		Sets the internal dictionary to the key-value pairs from 'mapping'\n
		Old data is cleared and replaced with data in 'mapping'
		:param mapping: The dictionary to update with
		:raises TypeError: If 'mapping' is not a Mapping
		:raises IOError: If sector is closed
		"""

		Misc.raise_ifn(isinstance(mapping, typing.Mapping), TypeError(f'Specified object must be a mapping instance, got object of type \'{type(mapping).__name__}\''))
		Misc.raise_if(self.closed, IOError('Operation on closed sector'))

		@ThreadedFunction
		def __operation__() -> None:
			with self.__lock__.writer():
				self.__modifications__ += 1
				self.__contents__.clear()
				self.__contents__.update(mapping)

		return __operation__()

	def length(self) -> Concurrent.ThreadedPromise[int]:
		"""
		:return: The length of this sector
		:raises IOError: If sector is closed
		"""

		Misc.raise_if(self.closed, IOError('Operation on closed sector'))

		@ThreadedFunction
		def __operation__() -> typing.Any:
			with self.__lock__.reader():
				return len(self.__contents__)

		return __operation__()

	def get_or_default(self, key: str, default: typing.Any = None) -> Concurrent.ThreadedPromise[typing.Any]:
		"""
		Gets and returns the item with the specified key or 'default' if key does not exist
		:param key: The key
		:param default: The default value
		:return: The bound item or 'default'
		:raises TypeError: If 'key' is not a string
		:raises IOError: If sector is closed
		"""

		Misc.raise_ifn(isinstance(key, str), TypeError(f'JSON keys must be a string, got object of type \'{type(key).__name__}\''))
		Misc.raise_if(self.closed, IOError('Operation on closed sector'))

		@ThreadedFunction
		def __operation__() -> typing.Any:
			with self.__lock__.reader():
				return copy.deepcopy(self.__contents__.get(str(key)))

		return __operation__()

	def get_or_insert(self, key: str, default: typing.Any = None) -> Concurrent.ThreadedPromise[typing.Any]:
		"""
		Gets and returns the item with the specified key or inserts and returns 'default' if key does not exist
		:param key: The key
		:param default: The default value
		:return: The bound item
		:raises TypeError: If 'key' is not a string
		:raises IOError: If sector is closed
		"""

		Misc.raise_ifn(isinstance(key, str), TypeError(f'JSON keys must be a string, got object of type \'{type(key).__name__}\''))
		Misc.raise_if(self.closed, IOError('Operation on closed sector'))

		@ThreadedFunction
		def __operation__() -> typing.Any:
			with self.__lock__.writer():
				self.__modifications__ += 1
				return copy.deepcopy(self.__contents__.setdefault(str(key)))

		return __operation__()

	def pop(self, key: str, default: typing.Any = ...) -> Concurrent.ThreadedPromise[typing.Any]:
		"""
		Removes and returns the item with the specified key or 'default' if key does not exist
		:param key: The key
		:param default: The default value
		:return: The bound item
		:raises TypeError: If 'key' is not a string
		:raises IOError: If sector is closed
		:raises KeyError: If 'default' is not specified and key is not found
		"""

		Misc.raise_ifn(isinstance(key, str), TypeError(f'JSON keys must be a string, got object of type \'{type(key).__name__}\''))
		Misc.raise_if(self.closed, IOError('Operation on closed sector'))

		@ThreadedFunction
		def __operation__() -> typing.Any:
			with self.__lock__.writer():
				self.__modifications__ += 1
				self.__contents__.pop(str(key), default)

		return __operation__()

	def pop_last(self) -> Concurrent.ThreadedPromise[tuple[str, typing.Any]]:
		"""
		Gets and returns the last key-value pair added to this sector
		:return: The last added key-value pair
		:raises IOError: If sector is closed
		"""

		Misc.raise_if(self.closed, IOError('Operation on closed sector'))

		@ThreadedFunction
		def __operation__() -> tuple[str, typing.Any]:
			with self.__lock__.writer():
				self.__modifications__ += 1
				return self.__contents__.popitem()

		return __operation__()

	def keys(self) -> Concurrent.ThreadedPromise[tuple[str, ...]]:
		"""
		:return: The keys stored in this sector
		:raises IOError: If sector is closed
		"""

		Misc.raise_if(self.closed, IOError('Operation on closed sector'))

		@ThreadedFunction
		def __operation__() -> tuple[str, ...]:
			with self.__lock__.reader():
				return tuple(self.__contents__.keys())

		return __operation__()

	def values(self) -> Concurrent.ThreadedPromise[tuple[typing.Any, ...]]:
		"""
		:return: The values stored in this sector
		:raises IOError: If sector is closed
		"""

		Misc.raise_if(self.closed, IOError('Operation on closed sector'))

		@ThreadedFunction
		def __operation__() -> tuple[typing.Any, ...]:
			with self.__lock__.reader():
				return tuple(self.__contents__.values())

		return __operation__()

	def stream(self) -> Stream.LinqStream[tuple[str, typing.Any]]:
		"""
		:return: This collection as a LINQ stream
		"""

		return Stream.LinqStream(iter(self))

	def copy(self) -> Concurrent.ThreadedPromise[dict[str, typing.Any]]:
		"""
		:return: A copy of this sector's internal mapping
		:raises IOError: If sector is closed
		"""

		Misc.raise_if(self.closed, IOError('Operation on closed sector'))

		@ThreadedFunction
		def __operation__() -> dict[str, typing.Any]:
			with self.__lock__.reader():
				return copy.deepcopy(self.__contents__)

		return __operation__()

	@property
	def closed(self) -> bool:
		"""
		:return: Whether the sector is closed
		"""

		return self.__handle__ is None or not self.exists

	@property
	def exists(self) -> bool:
		"""
		:return: Whether the sector file exists
		"""

		return self.__handle__.exists()

	@property
	def encrypted(self) -> bool:
		"""
		:return: Whether this sector is encrypted
		"""

		return self.__crypt__ is not None

	@property
	def pending_modifications(self) -> int:
		"""
		:return: The number of writes acquired since last save
		"""

		return self.__modifications__

	@property
	def password(self) -> str:
		"""
		:return: The password used to encrypt this sector
		"""

		return self.__crypt__


class MyDatabaseIterator(typing.Iterator[tuple[str, typing.Any]]):
	def __init__(self, sector: MyDatabase):
		self.__keys__: tuple[str, ...] = ...
		self.__iterator__: typing.Iterator[str] = ...
		self.__sector__: MyDatabase = sector

	def __iter__(self) -> MyDatabaseIterator:
		return self

	def __next__(self) -> tuple[str, typing.Any]:
		if self.__iterator__ is ... or self.__keys__ is ...:
			self.__keys__ = self.__sector__.keys().wait()
			self.__iterator__ = iter(self.__keys__)

		while True:
			try:
				key: str = next(self.__iterator__)
				data: typing.Any = self.__sector__[key].wait()
				return key, data
			except KeyError:
				continue

		raise StopIteration
