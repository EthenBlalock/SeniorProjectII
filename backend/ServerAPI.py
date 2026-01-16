# Handles server API

import datetime
import flask

import CustomMethodsVI.Connection as Connection


def init(server: flask.Flask) -> None:
	api: Connection.FlaskServerAPI = Connection.FlaskServerAPI(server, '/api', requires_auth=True)

	@api.connector
	def on_connect(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> int:
		print(f'API Connect: {session.token} @ {session.ip}')
		return 200

	@api.disconnector
	def on_disconnect(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> None:
		print(f'API Disconnect: {session.token}')

	@api.endpoint('/test')
	def on_test(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> dict[str, ...]:
		print(f'API Request @ \'/test\': {session.token}')
		return {
			'purpose': 'This is a test of the API system',
			'time': datetime.datetime.now(datetime.timezone.utc).timestamp()
		}
