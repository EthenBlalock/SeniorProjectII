import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth as firebaseAuth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";
import StockDetailPanel from "../components/StockDetailPanel";
import { useAuth } from "../hooks/AuthContext";
import "./PaperTradingPage.css";

function formatHoldingShares(value) {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(numericValue) ? 0 : 2,
    maximumFractionDigits: 4,
  }).format(numericValue);
}

function formatCurrency(value) {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatPercent(value) {
  const numericValue = Number(value ?? 0);
  const sign = numericValue > 0 ? "+" : "";
  return `${sign}${numericValue.toFixed(2)}%`;
}

function getToneClass(value) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

const CHART_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#14b8a6", "#f97316"];

const PaperTradingPage = () => {
  const navigate = useNavigate();
  const [listStocks, setStocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [amount, setAmount] = useState(0);
  const [balanceInput, setBalanceInput] = useState("0");
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [currentUid, setCurrentUid] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [currentPrices, setCurrentPrices] = useState({});
  const { auth: apiAuth } = useAuth();

  async function getCompanyCurrent(authToken, companyCode) {
    try {
      const res = await fetch("/api/react/company-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth: authToken,
          company: companyCode,
          period: "LAST_DAY",
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const rows = Array.isArray(json) ? json : json?.Year ?? json?.data ?? [];
      if (!Array.isArray(rows) || rows.length === 0) return;

      const last = rows.reduce((left, right) =>
        Number(left?.TimeStamp) > Number(right?.TimeStamp) ? left : right
      );

      const displayedPrice =
        last.ClosePrice != null && Number(last.ClosePrice) !== -1
          ? Number(last.ClosePrice)
          : Number(last.OpenPrice);

      if (!Number.isFinite(displayedPrice)) return;

      setCurrentPrices((prev) => ({
        ...prev,
        [companyCode]: displayedPrice,
      }));
    } catch (err) {
      console.error(`Failed to fetch price for ${companyCode}:`, err);
    }
  }

  async function handleBalanceSubmit(nextAmount) {
    if (!currentUid) return;

    const normalizedAmount = Number(nextAmount ?? 0);
    const docRef = doc(db, "balance", currentUid);
    await setDoc(
      docRef,
      {
        paperTradingBalance: Number.isFinite(normalizedAmount) ? normalizedAmount : 0,
      },
      { merge: true }
    );
    setAmount(Number.isFinite(normalizedAmount) ? normalizedAmount : 0);
  }

  function totalPercentChange(shares, averagePrice, currentPrice) {
    const shareCount = Number(shares ?? 0);
    const entryPrice = Number(averagePrice ?? 0);
    const marketPrice = Number(currentPrice ?? 0);
    const investedAmount = shareCount * entryPrice;

    if (
      !Number.isFinite(investedAmount) ||
      investedAmount <= 0 ||
      !Number.isFinite(marketPrice)
    ) {
      return 0;
    }

    const profitLoss = shareCount * (marketPrice - entryPrice);
    return (profitLoss / investedAmount) * 100;
  }

  function totalReturn(shares, averagePrice, currentPrice) {
    const shareCount = Number(shares ?? 0);
    const entryPrice = Number(averagePrice ?? 0);
    const marketPrice = Number(currentPrice ?? 0);

    if (
      !Number.isFinite(shareCount) ||
      !Number.isFinite(entryPrice) ||
      !Number.isFinite(marketPrice)
    ) {
      return 0;
    }

    return shareCount * (marketPrice - entryPrice);
  }

  async function getBalance(uid) {
    const docRef = doc(db, "balance", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const nextAmount = Number(docSnap.data().paperTradingBalance ?? 0);
      setAmount(nextAmount);
      setBalanceInput(String(nextAmount));
    } else {
      setAmount(0);
      setBalanceInput("0");
    }
  }

  async function getPortfolio(uid) {
    const docRef = doc(db, "paperTradingPortfolio", uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      setHoldings([]);
      return;
    }

    const savedHoldings = Object.values(docSnap.data().holdings ?? {});
    savedHoldings.sort((left, right) => left.symbol.localeCompare(right.symbol));
    setHoldings(savedHoldings);
  }

  function handlePaperTradeStart(company, price) {
    setSelectedCompany(null);
    navigate(`/papertrade/order/${encodeURIComponent(company.symbol)}`, {
      state: {
        company,
        latestPrice: price,
      },
    });
  }

  async function availableStocks() {
    try {
      const res = await fetch("/database.json");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setStocks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  }

  function search(substring, stocks) {
    const searchValue = substring.toLowerCase().trim();

    if (!searchValue) {
      setFilteredStocks([]);
      return;
    }

    const matches = [];

    for (const value of stocks.values()) {
      if (
        value?.symbol?.toLowerCase().startsWith(searchValue) ||
        value?.name?.toLowerCase().includes(searchValue)
      ) {
        matches.push(value);
      }

      if (matches.length >= 8) break;
    }

    setFilteredStocks(matches);
  }

  function handleSearchChange(nextValue) {
    setSearchTerm(nextValue);
    search(nextValue, listStocks);
  }

  useEffect(() => {
    availableStocks();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user?.uid) {
        setCurrentUid(user.uid);
        getBalance(user.uid);
        getPortfolio(user.uid);
      } else {
        setCurrentUid(null);
        setAmount(0);
        setBalanceInput("0");
        setHoldings([]);
        setFilteredStocks([]);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!holdings.length) {
      setCurrentPrices({});
      return;
    }

    async function fetchCurrentPrices() {
      for (const stock of holdings) {
        await getCompanyCurrent(apiAuth, stock.symbol);
      }
    }

    fetchCurrentPrices();
  }, [holdings, apiAuth]);

  const holdingsWithPerformance = holdings.map((stock) => {
    const livePrice = Number(currentPrices[stock.symbol]);
    const currentPrice = Number.isFinite(livePrice) ? livePrice : Number(stock.averagePrice ?? 0);
    const shares = Number(stock.shares ?? 0);
    const averagePrice = Number(stock.averagePrice ?? 0);
    const costBasis = shares * averagePrice;
    const marketValue = shares * currentPrice;
    const gainLoss = totalReturn(shares, averagePrice, currentPrice);
    const gainLossPercent = totalPercentChange(shares, averagePrice, currentPrice);

    return {
      ...stock,
      shares,
      averagePrice,
      currentPrice,
      costBasis,
      marketValue,
      gainLoss,
      gainLossPercent,
    };
  });

  const investedCapital = holdingsWithPerformance.reduce(
    (sum, stock) => sum + stock.costBasis,
    0
  );
  const holdingsValue = holdingsWithPerformance.reduce(
    (sum, stock) => sum + stock.marketValue,
    0
  );
  const totalGain = holdingsWithPerformance.reduce(
    (sum, stock) => sum + (stock.gainLoss > 0 ? stock.gainLoss : 0),
    0
  );
  const totalLoss = holdingsWithPerformance.reduce(
    (sum, stock) => sum + (stock.gainLoss < 0 ? Math.abs(stock.gainLoss) : 0),
    0
  );
  const netReturn = holdingsValue - investedCapital;
  const overallReturnPercent = investedCapital > 0 ? (netReturn / investedCapital) * 100 : 0;
  const totalPortfolioValue = amount + holdingsValue;
  const profitablePositions = holdingsWithPerformance.filter((stock) => stock.gainLoss > 0).length;
  const winRate = holdingsWithPerformance.length
    ? (profitablePositions / holdingsWithPerformance.length) * 100
    : 0;
  const bestPerformer = holdingsWithPerformance.reduce(
    (best, stock) => (best == null || stock.gainLossPercent > best.gainLossPercent ? stock : best),
    null
  );
  const biggestDrawdown = holdingsWithPerformance.reduce(
    (worst, stock) => (worst == null || stock.gainLossPercent < worst.gainLossPercent ? stock : worst),
    null
  );

  const overviewCards = [
    {
      label: "Portfolio Value",
      value: formatCurrency(totalPortfolioValue),
      helper: "Cash + current holdings",
      tone: "neutral",
    },
    {
      label: "Net Return",
      value: formatCurrency(netReturn),
      helper: formatPercent(overallReturnPercent),
      tone: getToneClass(netReturn),
    },
    {
      label: "Total Gains",
      value: formatCurrency(totalGain),
      helper: `${profitablePositions} winning positions`,
      tone: "positive",
    },
    {
      label: "Total Losses",
      value: formatCurrency(totalLoss),
      helper: `${holdingsWithPerformance.length - profitablePositions} lagging positions`,
      tone: totalLoss > 0 ? "negative" : "neutral",
    },
  ];

  const capitalFlowData = [
    { name: "Cash", amount: Math.round(amount) },
    { name: "Invested", amount: Math.round(investedCapital) },
    { name: "Gains", amount: Math.round(totalGain) },
    { name: "Losses", amount: Math.round(totalLoss) },
  ];

  const allocationData = (() => {
    if (!holdingsWithPerformance.length) {
      return [{ name: "Buying Power", value: Math.max(0, Math.round(amount)) }];
    }

    const topPositions = [...holdingsWithPerformance]
      .sort((left, right) => right.marketValue - left.marketValue)
      .slice(0, 4)
      .map((stock) => ({
        name: stock.symbol,
        value: Math.max(0, Math.round(stock.marketValue)),
      }));

    const remainingValue = holdingsWithPerformance
      .slice(4)
      .reduce((sum, stock) => sum + stock.marketValue, 0);

    if (remainingValue > 0) {
      topPositions.push({ name: "Other", value: Math.round(remainingValue) });
    }

    if (amount > 0) {
      topPositions.push({ name: "Cash", value: Math.round(amount) });
    }

    return topPositions;
  })();

  const insights = [
    {
      title: "Win Rate",
      value: `${winRate.toFixed(0)}%`,
      note: "Percent of positions that are currently green.",
    },
    {
      title: "Best Position",
      value: bestPerformer ? `${bestPerformer.symbol} ${formatPercent(bestPerformer.gainLossPercent)}` : "No data yet",
      note: "Your strongest active holding right now.",
    },
    {
      title: "Needs Attention",
      value:
        biggestDrawdown && biggestDrawdown.gainLossPercent < 0
          ? `${biggestDrawdown.symbol} ${formatPercent(biggestDrawdown.gainLossPercent)}`
          : "You're holding steady",
      note: "The biggest drawdown in your portfolio.",
    },
  ];

  return (
    <div className="paper-page">
      <section className="paper-hero">
        <div className="paper-hero-copy">
          <div className="paper-badge">Student Paper Trading Lab</div>
          <h1 className="paper-title">Practice the market without risking your tuition money.</h1>
          <p className="paper-subtitle">
            Track your gains, study your mistakes, and build confidence before you
            ever place a real trade.
          </p>
          <div className="paper-hero-actions">
            <button
              type="button"
              className="paper-primary-btn"
              onClick={() => navigate("/stocks")}
            >
              Explore Stocks
            </button>
            <button
              type="button"
              className="paper-secondary-btn"
              onClick={() => navigate("/papertrade/order/AAPL")}
            >
              Try a Demo Order
            </button>
          </div>
        </div>

        <div className="paper-hero-panel">
          <div className="hero-panel-label">Account Snapshot</div>
          <div className="hero-panel-value">{formatCurrency(totalPortfolioValue)}</div>
          <div className={`hero-panel-change ${getToneClass(netReturn)}`}>
            {formatCurrency(netReturn)} • {formatPercent(overallReturnPercent)}
          </div>
          <div className="hero-panel-grid">
            <div>
              <span>Buying Power</span>
              <strong>{formatCurrency(amount)}</strong>
            </div>
            <div>
              <span>Invested</span>
              <strong>{formatCurrency(investedCapital)}</strong>
            </div>
            <div>
              <span>Positions</span>
              <strong>{holdingsWithPerformance.length}</strong>
            </div>
            <div>
              <span>Win Rate</span>
              <strong>{winRate.toFixed(0)}%</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="paper-overview-grid">
        {overviewCards.map((card) => (
          <article key={card.label} className={`paper-stat-card ${card.tone}`}>
            <span className="paper-stat-label">{card.label}</span>
            <strong className="paper-stat-value">{card.value}</strong>
            <span className="paper-stat-helper">{card.helper}</span>
          </article>
        ))}
      </section>

      <section className="paper-dashboard-grid">
        <article className="paper-card paper-balance-card">
          <div className="paper-card-header">
            <div>
              <p className="paper-card-eyebrow">Funding</p>
              <h2>Adjust your practice balance</h2>
            </div>
            <span className="paper-chip">Current cash {formatCurrency(amount)}</span>
          </div>

          <form
            className="paper-balance-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleBalanceSubmit(balanceInput);
            }}
          >
            <label htmlFor="paper-balance-input">Paper cash balance</label>
            <div className="paper-input-row">
              <input
                id="paper-balance-input"
                type="number"
                step="any"
                min="0"
                value={balanceInput}
                onChange={(event) => setBalanceInput(event.target.value)}
                placeholder="10000"
              />
              <button type="submit" className="paper-primary-btn">
                Save Balance
              </button>
            </div>
          </form>

          <div className="paper-quick-actions">
            {[1000, 5000, 10000].map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                className="paper-ghost-btn"
                onClick={() => setBalanceInput(String(quickAmount))}
              >
                Set {formatCurrency(quickAmount)}
              </button>
            ))}
          </div>
        </article>

        <article className="paper-card paper-search-card">
          <div className="paper-card-header">
            <div>
              <p className="paper-card-eyebrow">Find a stock</p>
              <h2>Build a watchlist like a smart student trader</h2>
            </div>
          </div>

          <label htmlFor="paper-stock-search">Search by symbol or company</label>
          <input
            id="paper-stock-search"
            type="text"
            value={searchTerm}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="AAPL, NVIDIA, Microsoft..."
            className="paper-search-input"
          />

          <div className="paper-results-list">
            {filteredStocks.length > 0 ? (
              filteredStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  type="button"
                  className="paper-result-item"
                  onClick={() => setSelectedCompany(stock)}
                >
                  <span className="paper-result-symbol">{stock.symbol}</span>
                  <span className="paper-result-name">{stock.name}</span>
                  <span className="paper-result-action">View</span>
                </button>
              ))
            ) : (
              <div className="paper-empty-search">
                {searchTerm
                  ? "No matches yet. Try a different symbol or company name."
                  : "Start typing to search stocks and open the trade panel."}
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="paper-charts-grid">
        <article className="paper-card paper-chart-card">
          <div className="paper-card-header">
            <div>
              <p className="paper-card-eyebrow">Capital breakdown</p>
              <h2>Where your paper money is going</h2>
            </div>
          </div>
          <BarChart data={capitalFlowData} color="#22c55e" />
        </article>

        <article className="paper-card paper-chart-card">
          <div className="paper-card-header">
            <div>
              <p className="paper-card-eyebrow">Allocation</p>
              <h2>Top positions in your portfolio</h2>
            </div>
          </div>
          <PieChart data={allocationData} colors={CHART_COLORS} />
        </article>
      </section>

      <section className="paper-insights-grid">
        {insights.map((insight) => (
          <article key={insight.title} className="paper-card paper-insight-card">
            <span className="paper-card-eyebrow">{insight.title}</span>
            <strong className="paper-insight-value">{insight.value}</strong>
            <p>{insight.note}</p>
          </article>
        ))}
      </section>

      <section className="paper-card paper-portfolio-card">
        <div className="paper-card-header">
          <div>
            <p className="paper-card-eyebrow">Open positions</p>
            <h2>Your portfolio scoreboard</h2>
          </div>
          <span className="paper-chip">{holdingsWithPerformance.length} holdings</span>
        </div>

        {holdingsWithPerformance.length > 0 ? (
          <div className="paper-table-shell">
            <table className="paper-table">
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Shares</th>
                  <th>Avg Price</th>
                  <th>Current</th>
                  <th>Market Value</th>
                  <th>P/L</th>
                  <th>P/L %</th>
                </tr>
              </thead>
              <tbody>
                {holdingsWithPerformance.map((stock) => (
                  <tr
                    key={stock.symbol}
                    onClick={() =>
                      setSelectedCompany({
                        ...stock,
                        price: stock.currentPrice,
                      })
                    }
                  >
                    <td>
                      <div className="paper-stock-cell">
                        <strong>{stock.symbol}</strong>
                        <span>{stock.name || "Active position"}</span>
                      </div>
                    </td>
                    <td>{formatHoldingShares(stock.shares)}</td>
                    <td>{formatCurrency(stock.averagePrice)}</td>
                    <td>{formatCurrency(stock.currentPrice)}</td>
                    <td>{formatCurrency(stock.marketValue)}</td>
                    <td className={getToneClass(stock.gainLoss)}>
                      {formatCurrency(stock.gainLoss)}
                    </td>
                    <td className={getToneClass(stock.gainLossPercent)}>
                      {formatPercent(stock.gainLossPercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="paper-empty-portfolio">
            <h3>No positions yet</h3>
            <p>
              Search for a stock above and place your first paper trade to start
              tracking gains, losses, and portfolio growth.
            </p>
            <button
              type="button"
              className="paper-primary-btn"
              onClick={() => navigate("/stocks")}
            >
              Browse Market Data
            </button>
          </div>
        )}
      </section>

      <StockDetailPanel
        company={selectedCompany}
        isOpen={Boolean(selectedCompany)}
        onClose={() => {
          setSelectedCompany(null);
        }}
        paperTradeMode={true}
        onPaperTradeStart={handlePaperTradeStart}
      />
    </div>
  );
};

export default PaperTradingPage;
