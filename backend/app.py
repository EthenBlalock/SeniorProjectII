# Main flask app

import atexit
import flask
import sys

import CustomMethodsVI.Connection as Connection
import CustomMethodsVI.FileSystem as FileSystem
import CustomMethodsVI.Logger as Logger
import CustomMethodsVI.Stream as Stream
import CustomMethodsVI.Terminal.Struct as Struct

import Database
import Socketio
import ServerAPI

# Logging
logfile: FileSystem.File = FileSystem.File('logs/latest.log')
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


# Setup
app: flask.Flask = flask.Flask(__name__, static_folder='Static', template_folder='Template')
Database.MyDatabase.load('database')
server: Connection.FlaskSocketioServer = Connection.FlaskSocketioServer(app)
Socketio.init(server)
ServerAPI.init(app)


# Routing
@app.route('/')
def index() -> flask.Response:
    return flask.Response('Hello World', 200)


# General Functions
def main() -> None:
    import waitress
    waitress.serve(app, port=5000)


def nomain() -> None:
    print('=' * 100)
    print('\033[38;2;255;224;128m[!] Closing...\033[0m')
    Database.MyDatabase.unload(save=True)
    print('\033[38;2;255;128;128m[!] Server closed.\033[0m')
    sys.stdout = sys.__stdout__
    sys.stderr = sys.__stderr__
    logger.close()


# Cleanup
atexit.register(nomain)
print('\n\033[38;2;128;255;128m[*] Server ready.\033[0m')
print('=' * 100)


# Entry Point
if __name__ == '__main__':
    main()
