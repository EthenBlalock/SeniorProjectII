# Handles server API

import datetime
import flask
import typing

import CustomMethodsVI.Connection as Connection
import CustomMethodsVI.Stream as Stream

import Database
import Finance


def get_json_key(json: dict[str, ...], key: str, *types: type, can_be_none: bool = False, acceptor: typing.Callable[[typing.Any], bool] = None, default: typing.Optional[typing.Any] = None) -> typing.Any:
	value: typing.Any = json.get(key, default)
	assert (isinstance(value, types) or (value is None and can_be_none)) and (not callable(acceptor) or acceptor(value)), 'Invalid JSON value'
	return value


def handle_implicit_api(server: flask.Flask) -> None:
	"""
	Handles internal server API communication\n
	API communication with front-end
	:param server: The flask server instance
	"""

	api: Connection.FlaskServerAPI = Connection.FlaskServerAPI(server, '/react', requires_auth=True)
	company_data: Database.MyDatabase = Database.MyDatabase.open('companies', create_if_not_found=False)
	companies: dict[str, typing.Any] = company_data['Stocks'].wait()
	company_data.close()

	@api.connector
	def on_connect(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> int:
		print(f'React-API Connect: {session.token} @ {session.ip}')
		return 200

	@api.disconnector
	def on_disconnect(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> None:
		print(f'React-API Disconnect: {session.token}')

	@api.endpoint('/budget')
	def on_budget(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> dict:
		return NotImplemented

	@api.endpoint('/companies')
	def on_companies(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> list[dict[str, str | float]]:
		page: int = get_json_key(json, 'page', int, default=0)
		page_size: int = 10
		return Stream.LinqStream(companies.items()).skip(page * page_size).take(page_size).sort().transform(lambda pair: {'symbol': pair[0], 'name': pair[1]['Meta Data']['2. Name'], 'price': -1}).collect(list)

	@api.endpoint('/company-current')
	def on_company(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> dict[str, typing.Any]:
		company_code: str = get_json_key(json, 'company', str, can_be_none=False, acceptor=lambda value: len(value) > 0)
		company: Finance.CompanyInfo = Finance.CompanyInfo(company_code)
		return company.frame().to_dict()

	@api.endpoint('/company-history')
	def on_company(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> list[dict[str, typing.Any]]:
		company_code: str = get_json_key(json, 'company', str, can_be_none=False, acceptor=lambda value: len(value) > 0)
		period: Finance.FramePeriod = Finance.FramePeriod[get_json_key(json, 'period', str, can_be_none=False)]
		interval: Finance.FrameInterval = Finance.FrameInterval[get_json_key(json, 'interval', str, can_be_none=False, default='DAY')]
		company: Finance.CompanyInfo = Finance.CompanyInfo(company_code)
		return list(frame.to_dict() for frame in company.frames(period, interval))

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


def init(server: flask.Flask) -> None:
	"""
	Initializes all flask server API endpoints
	:param server: The flask server instance
	"""

	handle_implicit_api(server)
	handle_explicit_api(server)
