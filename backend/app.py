# Main flask app

import atexit
import flask
import psutil
import sys

import CustomMethodsVI.Connection as Connection
import CustomMethodsVI.FileSystem as FileSystem
import CustomMethodsVI.Logger as Logger

import Database
import Socketio
import ServerAPI
import Logging

# Setup
CORS: dict[str, str] = {
    'Access-Control-Allow-Origin': 'senior-project-ii.vercel.app',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*'
}

logger: Logger.Logger = Logging.init(False)
app: flask.Flask = flask.Flask(__name__, static_folder='static', template_folder='template')
Database.MyDatabase.load(FileSystem.File(__file__).parent.directory('database'))
server: Connection.FlaskSocketioServer = Connection.FlaskSocketioServer(app)
Socketio.init(server)
ServerAPI.init(app, CORS, {})


# Routing
@app.route('/')
def index() -> flask.Response:
    return flask.Response('Hello World', 200)


@app.route('/candlestick')
def candlestick() -> flask.Response:
    return flask.Response(flask.render_template('candlestick.html'), status=200, headers=CORS)


# General Functions
def main() -> None:
    import waitress
    waitress.serve(app, port=5004, threads=max(psutil.cpu_count(False) >> 1, 4))


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
