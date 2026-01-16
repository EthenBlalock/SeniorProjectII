# Main flask app

import flask

import CustomMethodsVI.Connection as Connection

import Socketio
import ServerAPI

app: flask.Flask = flask.Flask(__name__, static_folder='Static', template_folder='Template')
server: Connection.FlaskSocketioServer = Connection.FlaskSocketioServer(app)
Socketio.init(server)
ServerAPI.init(app)


@app.route('/')
def index() -> flask.Response:
    return flask.Response('Hello World', 200)


def main() -> None:
    server.listen()


if __name__ == '__main__':
    main()
