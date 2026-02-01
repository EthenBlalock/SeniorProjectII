# Logging
import datetime
import gzip
import sys

import CustomMethodsVI.FileSystem as FileSystem
import CustomMethodsVI.Logger as Logger
import CustomMethodsVI.Stream as Stream
import CustomMethodsVI.Terminal.Struct as Struct


def init() -> Logger.Logger:
	backend: FileSystem.Directory = FileSystem.File(__file__).parent
	logdir: FileSystem.Directory = backend.directory('logs')

	if not logdir.exists():
		logdir.create()

	logfile: FileSystem.File = logdir.file('latest.log')

	if logfile.exists():
		ctime: datetime.datetime = logfile.time_modified

		with logfile.open('rb') as input_stream:
			with gzip.open(logdir.file(ctime.strftime('%m-%d-%Y_%H-%M-%S.log.gz')).filepath, 'wb') as output_stream:
				while len(chunk := input_stream.read(1024)) > 0:
					output_stream.write(chunk)

	logstream: Stream.FileStream = logfile.open('w')
	logger: Logger.Logger = Logger.Logger(logstream)
	stdout: Stream.EventedStream[str] = Stream.EventedStream()
	stderr: Stream.EventedStream[str] = Stream.EventedStream()
	sys.stdout = stdout
	sys.stderr = stderr
	stdout_buffer: list[str] = []
	stderr_buffer: list[str] = []

	@stdout.on('write')
	def on_stdout_write(data: str) -> None:
		if not isinstance(data, str):
			return

		for char in data:
			if char == '\n':
				msg: str = ''.join(stdout_buffer) + '\n'
				stdout_buffer.clear()
				sys.__stdout__.write(msg)
				no_ansi: str = Struct.AnsiStr(msg).raw

				if len(no_ansi.strip()):
					logger.debug(no_ansi, end='')
					logstream.flush()
			else:
				stdout_buffer.append(char)

	@stderr.on('write')
	def on_stderr_write(data: str) -> None:
		if not isinstance(data, str):
			return

		for char in data:
			if char == '\n':
				msg: str = ''.join(stderr_buffer) + '\n'
				stderr_buffer.clear()
				sys.__stderr__.write(msg)
				no_ansi: str = Struct.AnsiStr(msg).raw

				if len(no_ansi.strip()):
					logger.error(no_ansi, end='')
					logstream.flush()
			else:
				stderr_buffer.append(char)

	return logger
