from __future__ import annotations

import base64
import Crypto.Cipher.AES
import json
import os
import typing

import CustomMethodsVI.Concurrent as Concurrent
import CustomMethodsVI.FileSystem as FileSystem
import CustomMethodsVI.Misc as Misc
import CustomMethodsVI.Stream as Stream
import CustomMethodsVI.Synchronization as Synchronization


class MyDatabase:
	"""
	Database implementation using JSON files
	"""

	__ROOT: FileSystem.Directory = ...
	__SECTORS: dict[str, MyDatabase] = {}

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
	def open(cls: type[MyDatabase], name: str, *, use_memory: bool = True, create_if_not_found: bool = True, crypt: typing.Optional[str] = None) -> MyDatabase:
		"""
		Opens the specified sector for IO operators
		:param name: The sector name
		:param use_memory: Whether IO will be done on a cached version of sector contents
		:param create_if_not_found: Whether sector file will be created if not found
		:param crypt: The password to decrypt with if encrypted or None if plain JSON
		:return: The new sector interface
		:raises AssertionError: If database is not loaded
		:raises NameError: If sector name is invalid
		:raises FileNotFoundError: If sector does not exist
		"""

		assert cls.is_loaded(), 'Database not loaded'
		sector: MyDatabase = cls.__SECTORS.get(name)

		if sector is None:
			file: FileSystem.File = cls.__file_for(name)

			if not file.exists() and create_if_not_found:
				return cls.create(name, use_memory=use_memory)

			Misc.raise_ifn(file.exists(), FileNotFoundError(f'No such sector: \'{name}\''))
			sector = MyDatabase(file, use_memory, crypt=crypt)
			cls.__SECTORS[name] = sector
			return sector
		else:
			return sector

	@classmethod
	def create(cls: type[MyDatabase], name: str, *, use_memory: bool = True, crypt: typing.Optional[str] = None) -> MyDatabase:
		"""
		Creates a new sector in the database
		:param name: The sector name
		:param use_memory: Whether IO will be done on a cached version of sector contents
		:param crypt: The password to decrypt with if encrypted or None if plain JSON
		:return: The new sector interface
		:raises AssertionError: If database is not loaded
		:raises NameError: If sector name is invalid
		:raises FileExistsError: If sector already exists
		"""

		assert cls.is_loaded(), 'Database not loaded'
		file: FileSystem.File = cls.__file_for(name)
		Misc.raise_if(file.exists() or name in cls.__SECTORS, FileExistsError('Sector already exists'))
		file.parent.create()
		file.create()
		return MyDatabase(file, use_memory, crypt=crypt)

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

	def __init__(self, file: FileSystem.File, use_memory: bool, *, crypt: typing.Optional[str] = None):
		assert isinstance(file, FileSystem.File) and file.exists() and file.extension == 'json', 'Invalid file'
		assert crypt is None or (isinstance(crypt, str) and len(crypt) >= 8), 'Invalid file crypt key'
		self.__handle__: typing.Optional[FileSystem.File] = file
		self.__use_memory__: bool = bool(use_memory)
		self.__contents__: typing.Optional[dict[str, typing.Any]] = None
		self.__crypt__: typing.Optional[None] = crypt
		data: str = file.single_read() if self.cached else None

		if self.cached and len(data) > 0 and self.encrypted:
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
		elif self.cached and len(data) > 0:
			self.__contents__ = json.loads(data)
		elif self.cached:
			self.__contents__ = {}
		elif self.encrypted:
			raise IOError('Encrypted file must be cached')

	def __no_cache_operation__[T](self, callback: typing.Callable[[dict[str, typing.Any], ...], T], *args, **kwargs) -> T:
		with self.__handle__.open('r+') as fstream:
			data: str = fstream.read()
			contents: dict[str, typing.Any] = {} if len(data) == 0 else json.loads(data)
			value: T = callback(contents, *args, **kwargs)
			fstream.seek(0, 0)
			fstream.write(json.dumps(contents))
			return value

	def __read_only_no_cache_operation__[T](self, callback: typing.Callable[[dict[str, typing.Any], ...], T], *args, **kwargs) -> T:
		data: str = self.__handle__.single_read()
		contents: dict[str, typing.Any] = {} if len(data) == 0 else json.loads(data)
		return callback(contents, *args, **kwargs)

	def __setitem__(self, key: str, value: typing.Any) -> None | Concurrent.ThreadedPromise[None]:
		"""
		Sets the specified key to the specified value
		:param key: The key
		:param value: The value
		:raises TypeError: If 'key' is not a string
		:raises IOError: If sector is closed
		"""

		Misc.raise_ifn(isinstance(key, str), TypeError(f'JSON keys must be a string, got object of type \'{type(key).__name__}\''))
		Misc.raise_if(self.closed or not self.exists, IOError('Operation on closed sector'))

		if self.cached:
			self.__contents__[str(key)] = value
			return None
		else:
			return Concurrent.ThreadedFunction(self.__no_cache_operation__)(dict.__setitem__, str(key), value)

	def __delitem__(self, key: str) -> None | Concurrent.ThreadedPromise[None]:
		"""
		Deletes the specified key from the sector
		:param key: The key
		:raises TypeError: If 'key' is not a string
		:raises IOError: If sector is closed
		"""

		Misc.raise_ifn(isinstance(key, str), TypeError(f'JSON keys must be a string, got object of type \'{type(key).__name__}\''))
		Misc.raise_if(self.closed or not self.exists, IOError('Operation on closed sector'))

		if self.cached:
			del self.__contents__[str(key)]
			return None
		else:
			return Concurrent.ThreadedFunction(self.__no_cache_operation__)(dict.__delitem__, str(key))

	def __contains__(self, key: str) -> bool | Concurrent.ThreadedPromise[bool]:
		"""
		Checks if the key exists in this sector map
		:param key: The key
		:return Whether 'key' exists:
		:raises TypeError: If 'key' is not a string
		:raises IOError: If sector is closed
		"""

		Misc.raise_ifn(isinstance(key, str), TypeError(f'JSON keys must be a string, got object of type \'{type(key).__name__}\''))
		Misc.raise_if(self.closed or not self.exists, IOError('Operation on closed sector'))

		if self.cached:
			return str(key) in self.__contents__
		else:
			return Concurrent.ThreadedFunction(self.__read_only_no_cache_operation__)(dict.__contains__, str(key))

	def __getitem__(self, key: str) -> typing.Any | Concurrent.ThreadedPromise[typing.Any]:
		"""
		Gets the value of the specified value
		:param key: The key
		:raises TypeError: If 'key' is not a string
		:raises IOError: If sector is closed
		"""

		Misc.raise_ifn(isinstance(key, str), TypeError(f'JSON keys must be a string, got object of type \'{type(key).__name__}\''))
		Misc.raise_if(self.closed or not self.exists, IOError('Operation on closed sector'))

		if self.cached:
			return self.__contents__[str(key)]
		else:
			return Concurrent.ThreadedFunction(self.__read_only_no_cache_operation__)(dict.__getitem__, str(key))

	def __iter__(self) -> typing.Iterator[tuple[str, typing.Any]] | Concurrent.ThreadedPromise[typing.Iterator[tuple[str, typing.Any]]]:
		"""
		Iterates the key-value pairs of this sector
		:raises IOError: If sector is closed
		"""

		Misc.raise_if(self.closed or not self.exists, IOError('Operation on closed sector'))

		if self.cached:
			return iter(self.__contents__.items())
		else:
			return Concurrent.ThreadedFunction(self.__read_only_no_cache_operation__)(lambda contents: iter(contents.items()))

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
		Does nothing if this sector is not cached
		:param crypt: The password to encrypt with, ... for current password or None for plain JSON
		:raises IOError: If sector is closed
		"""

		if self.closed:
			raise IOError('Operation on closed sector')
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
			self.__handle__.single_write(base64.b64encode(result))
		elif self.cached:
			self.__handle__.single_write(json.dumps(self.__contents__))

	def save_async(self, *, crypt: typing.Optional[str] = ...) -> Concurrent.ThreadedPromise[None]:
		return Concurrent.ThreadedFunction(self.save)(crypt=crypt)

	def get_or_default(self, key: str, default: typing.Any = None) -> typing.Any | Concurrent.ThreadedPromise[typing.Any]:
		"""
		Gets and returns the item with the specified key or 'default' if key does not exist
		:param key: The key
		:param default: The default value
		:return: The bound item or 'default'
		:raises TypeError: If 'key' is not a string
		:raises IOError: If sector is closed
		"""

		Misc.raise_ifn(isinstance(key, str), TypeError(f'JSON keys must be a string, got object of type \'{type(key).__name__}\''))
		Misc.raise_if(self.closed or not self.exists, IOError('Operation on closed sector'))

		if self.cached:
			return self.__contents__.get(str(key), default)
		else:
			return Concurrent.ThreadedFunction(self.__no_cache_operation__)(dict.get, str(key), default)

	def get_or_insert(self, key: str, default: typing.Any = None) -> typing.Any | Concurrent.ThreadedPromise[typing.Any]:
		"""
		Gets and returns the item with the specified key or inserts and returns 'default' if key does not exist
		:param key: The key
		:param default: The default value
		:return: The bound item
		:raises TypeError: If 'key' is not a string
		:raises IOError: If sector is closed
		"""

		Misc.raise_ifn(isinstance(key, str), TypeError(f'JSON keys must be a string, got object of type \'{type(key).__name__}\''))
		Misc.raise_if(self.closed or not self.exists, IOError('Operation on closed sector'))

		if self.cached:
			return self.__contents__.setdefault(str(key), default)
		else:
			return Concurrent.ThreadedFunction(self.__no_cache_operation__)(dict.setdefault, str(key), default)

	def stream(self) -> Stream.LinqStream[tuple[str, typing.Any]]:
		"""
		:return: This collection as a LINQ stream
		"""

		return Stream.LinqStream(iter(self))

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
	def cached(self) -> bool:
		"""
		:return: Whether the sector is using cached file data
		"""

		return self.__use_memory__

	@property
	def encrypted(self) -> bool:
		"""
		:return: Whether this sector is encrypted
		"""

		return self.__crypt__ is not None

	@property
	def password(self) -> str:
		return self.__crypt__
