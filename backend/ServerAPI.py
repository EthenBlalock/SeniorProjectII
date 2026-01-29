# Handles server API

import datetime
import flask
import typing
import uuid

import CustomMethodsVI.Connection as Connection

import Database


def get_json_key(json: dict[str, ...], key: str, *types: type, can_be_none: bool = False, acceptor: typing.Callable[[typing.Any], bool] = None) -> typing.Any:
	value: typing.Any = json.get(key)
	assert (isinstance(value, types) or (value is None and can_be_none)) and (not callable(acceptor) or acceptor(value)), 'Invalid JSON value'
	return value


def handle_implicit_api(server: flask.Flask) -> None:
	"""
	Handles internal server API communication\n
	API communication with front-end
	:param server: The flask server instance
	"""

	api: Connection.FlaskServerAPI = Connection.FlaskServerAPI(server, '/react', requires_auth=True)

	@api.connector
	def on_connect(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> int:
		print(f'React-API Connect: {session.token} @ {session.ip}')
		print(json)
		return 501

	@api.disconnector
	def on_disconnect(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> None:
		print(f'React-API Disconnect: {session.token}')

	@api.endpoint('/budget')
	def on_budget(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> dict:
		return NotImplemented

	@api.endpoint('/stock')
	def on_stock(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> dict:
		monthly_bill_cost: float = get_json_key(json, 'bills', float, int)
		monthly_salary: float = get_json_key(json, 'salary', float, int)
		monthly_time_frame: float = get_json_key(json, 'months', int, acceptor=lambda v: v > 0)
		return {
			'returns': (monthly_salary - monthly_bill_cost) * monthly_time_frame
		}


def handle_explicit_api(server: flask.Flask) -> None:
	"""
	Handles external server API communication\n
	API communication with external clients
	:param server: The flask server instance
	"""

	api: Connection.FlaskServerAPI = Connection.FlaskServerAPI(server, '/api', requires_auth=False)

	@api.endpoint('/test')
	def on_test(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> dict[str, ...]:
		print(f'API Request @ \'/test\': {session.token}')
		return {
			'purpose': 'This is a test of the API system',
			'time': datetime.datetime.now(datetime.timezone.utc).timestamp()
		}


def handle_user_api(server: flask.Flask) -> None:
	"""
	Handles internal server API communication\n
	API communication with front-end
	:param server: The flask server instance
	"""

	api: Connection.FlaskServerAPI = Connection.FlaskServerAPI(server, '/users', requires_auth=True)
	users: dict[uuid.UUID, Database.MyDatabase] = {}

	@api.connector
	def on_connect(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> int:
		print(f'User-API Connect: {session.token} @ {session.ip}')
		is_signup: str = get_json_key(json, 'is-sign-up', bool)

		if is_signup:
			username: str = get_json_key(json, 'username', str)
			email: str = get_json_key(json, 'email', str)
			password: str = get_json_key(json, 'password', str).rjust(16, ' ')
			result: dict | int = 500

			try:
				user: Database.MyDatabase = Database.MyDatabase.create(f'users.{username}', use_memory=True, crypt=password)
				users[session.token] = user
				user['email'] = email
				user.save_async().then(lambda p: print(f'New user created: \'{username}\''))
				result = {'error': None, 'user': user.stream().to_dictionary()}
			except FileExistsError:
				result = {'error': 'UserExists'}
			finally:
				return result
		else:
			username: str = get_json_key(json, 'username', str)
			password: str = get_json_key(json, 'password', str).rjust(16, ' ')
			result: dict | int = 500

			try:
				user: Database.MyDatabase = Database.MyDatabase.open(f'users.{username}', use_memory=True, create_if_not_found=False, crypt=password)
				users[session.token] = user
				result = {'error': None, 'user': user.stream().to_dictionary()}
			except FileNotFoundError:
				result = {'error': 'NoSuchUser'}
			except PermissionError:
				result = {'error': 'InvalidPassword'}
			finally:
				return result

	@api.disconnector
	def on_disconnect(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> None:
		user: Database.MyDatabase = users.pop(session.token, None)

		if user is not None and not user.closed:
			user.save()
			user.close()

		print(f'User-API Disconnect: {session.token}')


def init(server: flask.Flask) -> None:
	"""
	Initializes all flask server API endpoints
	:param server: The flask server instance
	"""

	handle_implicit_api(server)
	handle_explicit_api(server)
	handle_user_api(server)
