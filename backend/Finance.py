from __future__ import annotations

import enum
import pandas
import typing
import yfinance


class FramePeriod(enum.StrEnum):
	LAST_DAY = '1d'
	LAST_WEEK = '5d'
	LAST_FULL_WEEK = '7d'
	LAST_MONTH = '1mo'
	LAST_QUARTER = '3mo'
	LAST_HALF = '6mo'
	LAST_YEAR = '1y'
	LAST_YEAR_2 = '2y'
	LAST_HALF_DECADE = '5y'
	LAST_DECADE = '10yr'
	PAST_YEAR = 'ytd'
	ALL = 'max'


class FrameInterval(enum.StrEnum):
	MINUTES_1 = '1m'
	MINUTES_5 = '5m'
	QUARTER_HOUR = '15m'
	HALF_HOUR = '30m'
	HOUR = '60m'
	DAY = '1d'
	WEEK = '5d'
	FULL_WEEK = '1wk'
	MONTH = '1mo'
	QUARTER = '3mo'


class StockPriceFrame:
	"""
	Class holding a single company's stock price for a given timestamp
	"""

	def __init__(self, source: CompanyInfo, timestamp: pandas.Timestamp, open_price: float, close_price: float, high: float, low: float, current: float):
		"""
		Class holding a single company's stock price for a given timestamp\n
		- Constructor -
		:param source: The source company info
		:param timestamp: The timestamp
		:param open_price: The stock open price
		:param close_price: The stock close price
		:param high: The stock high price
		:param low: The stock low price
		:param current: The current stock price
		"""

		assert isinstance(source, CompanyInfo)
		assert isinstance(timestamp, pandas.Timestamp)

		self.__company__: CompanyInfo = source
		self.__timestamp__: pandas.Timestamp = timestamp
		self.__open_price__: float = float(open_price)
		self.__close_price__: float = float(close_price)
		self.__high__: float = float(high)
		self.__low__: float = float(low)
		self.__current__: float = float(current)

	def __repr__(self) -> str:
		return str(self)

	def __str__(self) -> str:
		return f'<StockPrice-{self.company.code}: OPEN={self.open}, CLOSE={self.close}, RANGE=[{self.low}, {self.high}]>'

	def to_dict(self) -> dict[str, float]:
		"""
		:return: This stock frame as a dictionary
		"""

		return {
			'TimeStamp': self.timestamp.value,
			'OpenPrice': self.open,
			'ClosePrice': self.close,
			'MomentHigh': self.high,
			'MomentLow': self.low
		}

	@property
	def closed(self) -> bool:
		"""
		:return: Whether stock day is closed
		"""

		return self.close < 0

	@property
	def company(self) -> CompanyInfo:
		"""
		:return: This frame's calling company info
		"""

		return self.__company__

	@property
	def timestamp(self) -> pandas.Timestamp:
		"""
		:return: Stock timestamp
		"""

		return self.__timestamp__

	@property
	def open(self) -> float:
		"""
		:return: Stock open price
		"""

		return self.__open_price__

	@property
	def close(self) -> float:
		"""
		:return: Stock close price
		"""

		return self.__close_price__

	@property
	def low(self) -> float:
		"""
		:return: Stock low price
		"""

		return self.__low__

	@property
	def high(self) -> float:
		"""
		:return: Stock high price
		"""

		return self.__high__

	@property
	def current(self) -> float:
		"""
		:return: Current stock price or -1 if closed
		"""

		return -1 if self.closed else self.__current__


class CompanyInfo:
	"""
	A new company stock ticker
	"""

	def __init__(self, company_code: str):
		"""
		A new company stock ticker\n
		- Constructor -
		:param company_code: The company code
		"""

		self.__ticker__: yfinance.Ticker = yfinance.Ticker(company_code)
		self.__company_code__: str = str(company_code)

	def frame(self) -> StockPriceFrame:
		"""
		Gets the current company stock information from Yahoo
		:return: A StockPrice instance
		"""

		data: dict[str, typing.Any] = self.__ticker__.info
		price_current: float = data.get('currentPrice')
		price_open: float = data.get('open')
		price_high: float = data.get('dayHigh')
		price_low: float = data.get('dayLow')
		return StockPriceFrame(self, pandas.Timestamp.now(), price_open, -1, price_high, price_low, price_current)

	def frames(self, period: FramePeriod = FramePeriod.ALL, interval: FrameInterval = FrameInterval.DAY) -> typing.Generator[StockPriceFrame]:
		"""
		* This function is a generator *\n
		Gets the previous company stock information from Yahoo
		:param period: The amount of time to retrieve from database
		:param interval: The time interval between points
		:return: A StockPrice generator
		"""

		frame: pandas.DataFrame = self.__ticker__.history(period=period.value, interval=interval.value)
		keys: tuple[str, ...] = tuple(frame)
		open_index: int = keys.index('Open') + 1
		close_index: int = keys.index('Close') + 1
		low_index: int = keys.index('Low') + 1
		high_index: int = keys.index('High') + 1

		for row in frame.itertuples():
			date: pandas.Timestamp = row[0]
			open_price: float = row[open_index]
			close_price: float = row[close_index]
			low_price: float = row[low_index]
			high_price: float = row[high_index]
			yield StockPriceFrame(self, date, open_price, close_price, high_price, low_price, -1)

	@property
	def code(self) -> str:
		"""
		:return: The tracker company code
		"""

		return self.__company_code__
