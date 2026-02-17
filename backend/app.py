# Main flask app

import atexit
import flask
import sys

import CustomMethodsVI.Connection as Connection
import CustomMethodsVI.FileSystem as FileSystem
import CustomMethodsVI.Logger as Logger

import Database
import Socketio
import ServerAPI
import Logging

# Setup
logger: Logger.Logger = Logging.init()
app: flask.Flask = flask.Flask(__name__, static_folder='Static', template_folder='Template')
Database.MyDatabase.load(FileSystem.File(__file__).parent.directory('database'))
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
    waitress.serve(app, port=5004)


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
