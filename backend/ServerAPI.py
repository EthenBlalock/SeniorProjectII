# Handles server API

import base64
import cv2
import datetime
import flask
import numpy
import os
import requests
import typing

import CustomMethodsVI.Connection as Connection
import CustomMethodsVI.Math.Plotter.Plot2D as Plot2D
import CustomMethodsVI.Stream as Stream

import Database
import Finance


def get_json_key(json: dict[str, ...], key: str, *types: type, can_be_none: bool = False, acceptor: typing.Callable[[typing.Any], bool] = None, default: typing.Optional[typing.Any] = None) -> typing.Any:
	"""
	Gets a JSON key's associated value ensuring data type and presence
	:param json: The JSON structure to read from
	:param key: The JSON key
	:param types: The applicable types
	:param can_be_none: Whether the JSON value can be null
	:param acceptor: An accepter validating the read JSON value (value will be rejected if this function returns False)
	:param default: The default value used if key is not present
	:return: The associated value
	:raises AssertionError: If read JSON value is not one of 'types' or value doesn't pass nullality check
	"""

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
		"""
		Primary API authenticator called when client connects
		:param session: The new client session
		:param json: The request JSON
		:return: HTTP success code (200 = OK)
		"""

		print(f'React-API Connect: {session.token} @ {session.ip}')
		return 200

	@api.disconnector
	def on_disconnect(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> None:
		"""
		Primary API de-authenticator called when client disconnects
		:param session: The client session to close
		:param json: The request JSON
		"""

		print(f'React-API Disconnect: {session.token}')

	@api.endpoint('/companies')
	def on_companies(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> list[dict[str, str | float]]:
		"""
		*API endpoint*\n
		Retrieves a list of company data from internal DB
		:param session: The client session
		:param json: The request JSON
		:return: A list of company info
		"""

		page: int = get_json_key(json, 'page', int, default=0)
		page_size: int = 10
		return Stream.LinqStream(companies.items()).skip(page * page_size).take(page_size).sort().transform(lambda pair: {'symbol': pair[0], 'name': pair[1]['Meta Data']['2. Name'], 'price': -1}).collect(list)

	@api.endpoint('/company-current')
	def on_company_current(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> dict[str, typing.Any]:
		"""
		*API endpoint*\n
		Retrieves a single company's current stock price
		:param session: The client session
		:param json: The request JSON
		:return: A single company stock frame containing open/close/high/low prices
		"""

		company_code: str = get_json_key(json, 'company', str, can_be_none=False, acceptor=lambda value: len(value) > 0)
		company: Finance.CompanyInfo = Finance.CompanyInfo(company_code)
		return company.frame().to_dict()

	@api.endpoint('/company-history')
	def on_company_history(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> list[dict[str, typing.Any]]:
		"""
		*API endpoint*\n
		Retrieves a single company's stock history
		:param session: The client session
		:param json: The request JSON
		:return: A list of stock price frames for the specified period and interval
		"""

		company_code: str = get_json_key(json, 'company', str, can_be_none=False, acceptor=lambda value: len(value) > 0)
		period: Finance.FramePeriod = Finance.FramePeriod[get_json_key(json, 'period', str, can_be_none=False)]
		interval: Finance.FrameInterval = Finance.FrameInterval[get_json_key(json, 'interval', str, can_be_none=False, default='DAY')]
		company: Finance.CompanyInfo = Finance.CompanyInfo(company_code)
		return list(frame.to_dict() for frame in company.frames(period, interval))

	@api.endpoint('/company-history-image')
	def on_company_candlestick(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> dict[str, str]:
		"""
		*API endpoint*\n
		Retrieves a single company's stock history as a candlestick chart
		:param session: The client session
		:param json: The request JSON
		:return: A base-64 encoded JPG image
		"""

		company_code: str = get_json_key(json, 'company', str, can_be_none=False, acceptor=lambda value: len(value) > 0)
		period: Finance.FramePeriod = Finance.FramePeriod[get_json_key(json, 'period', str, can_be_none=False)]
		interval: Finance.FrameInterval = Finance.FrameInterval[get_json_key(json, 'interval', str, can_be_none=False, default='DAY')]
		square_size: int = get_json_key(json, 'size', int, can_be_none=False, default=256)
		company: Finance.CompanyInfo = Finance.CompanyInfo(company_code)
		candlestick: Plot2D.CandlestickPlot2D = Plot2D.CandlestickPlot2D()
		candlestick.add_points(*[Plot2D.CandlestickPlot2D.CandleFrame(frame.timestamp.to_pydatetime(), frame.open, frame.high, frame.low, frame.close) for frame in company.frames(period, interval)])
		miny, maxy = candlestick.bounds[2:4]
		candlestick.axes_info('time', minor_spacing=interval.seconds(), center=(0, miny))
		candlestick.axes_info('price', minor_spacing=(maxy - miny) / 100)
		rendered: numpy.ndarray = candlestick.as_image(square_size=square_size)
		rendered = cv2.cvtColor(rendered, cv2.COLOR_BGR2RGB)
		ret, buffer = cv2.imencode('.jpg', rendered)

		if not ret:
			raise IOError('Failed to encode image')
		else:
			return {'image-base64': base64.b64encode(buffer).decode()}

	@api.endpoint('/news')
	def on_news(session: Connection.FlaskServerAPI.APISessionInfo, json: dict[str, ...]) -> int | dict:
		"""
		*API endpoint*\n
		Retrieves a list of recent news articles from an external API
		:param session: The client session
		:param json: The request JSON
		:return: A list of JSON articles
		"""

		is_everything: bool = get_json_key(json, 'is-everything', bool, can_be_none=False, default=False)
		url: str = f'https://newsapi.org/v2/{'everything?domains=wsj.com' if is_everything else 'top-headlines?country=us'}&apiKey={os.getenv('newsapikey')}'
		response: requests.Response = requests.get(url)

		if not response.ok:
			return 502

		content: dict[str, ...] = response.json()

		if content['status'] != 'ok':
			return 503

		return content['articles']


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
