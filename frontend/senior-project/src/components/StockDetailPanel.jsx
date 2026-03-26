import { useEffect, useId, useState } from "react";
import { useAuth } from "../hooks/AuthContext";
import "./StockDetailPanel.css";

const RANGE_OPTIONS = [
  { label: "1D", period: "LAST_DAY", interval: "QUARTER_HOUR" },
  { label: "1W", period: "LAST_WEEK", interval: "HOUR" },
  { label: "1M", period: "LAST_MONTH", interval: "DAY" },
  { label: "3M", period: "LAST_QUARTER", interval: "DAY" },
  { label: "YTD", period: "PAST_YEAR", interval: "WEEK" },
  { label: "1Y", period: "LAST_YEAR", interval: "WEEK" },
];

function normalizeFrames(payload) {
  const rows = Array.isArray(payload) ? payload : payload?.data ?? payload?.Year ?? [];

  return rows
    .map((row) => {
      const closePrice =
        row?.ClosePrice != null && Number(row.ClosePrice) !== -1
          ? Number(row.ClosePrice)
          : Number(row?.OpenPrice);

      return {
        timestamp: Number(row?.TimeStamp) * 1000,
        open: Number(row?.OpenPrice),
        close: closePrice,
        high: Number(row?.MomentHigh),
        low: Number(row?.MomentLow),
      };
    })
    .filter(
      (row) =>
        Number.isFinite(row.timestamp) &&
        Number.isFinite(row.open) &&
        Number.isFinite(row.close) &&
        Number.isFinite(row.high) &&
        Number.isFinite(row.low)
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAbsolutePercent(value) {
  if (!Number.isFinite(value)) return "—";
  return `${Math.abs(value).toFixed(2)}%`;
}

function formatDateLabel(timestamp) {
  if (!Number.isFinite(timestamp)) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

function buildChartPath(points, width, height, padding) {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const y = height / 2;
    return `M ${padding} ${y} L ${width - padding} ${y}`;
  }

  const values = points.map((point) => point.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x = padding + (index / (points.length - 1)) * (width - padding * 2);
      const y = height - padding - ((point.close - min) / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildAreaPath(linePath, points, width, height, padding) {
  if (!linePath || points.length === 0) return "";
  if (points.length === 1) {
    return `${linePath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;
  }

  return `${linePath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;
}

const StockDetailPanel = ({
  company,
  isOpen,
  onClose,
  paperTradeMode = false,
  onPaperTradeStart,
}) => {
  const { auth } = useAuth();
  const titleId = useId();
  const safeId = titleId.replace(/[^a-zA-Z0-9_-]/g, "");
  const [selectedRange, setSelectedRange] = useState(RANGE_OPTIONS[0]);
  const [viewMode, setViewMode] = useState("line");
  const [history, setHistory] = useState([]);
  const [summaryHistory, setSummaryHistory] = useState([]);
  const [chartImage, setChartImage] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !company?.symbol) return;
    setSelectedRange(RANGE_OPTIONS[0]);
    setViewMode("line");
  }, [company?.symbol, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !auth || !company?.symbol) return;

    let ignore = false;

    async function fetchHistory() {
      setLoadingHistory(true);
      setError(null);

      try {
        const [rangeRes, summaryRes] = await Promise.all([
          fetch("/api/react/company-history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              auth,
              company: company.symbol,
              period: selectedRange.period,
              interval: selectedRange.interval,
            }),
          }),
          fetch("/api/react/company-history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              auth,
              company: company.symbol,
              period: "LAST_YEAR",
              interval: "DAY",
            }),
          }),
        ]);

        if (!rangeRes.ok) throw new Error(`HTTP ${rangeRes.status}`);
        if (!summaryRes.ok) throw new Error(`HTTP ${summaryRes.status}`);

        const [rangeJson, summaryJson] = await Promise.all([rangeRes.json(), summaryRes.json()]);

        if (ignore) return;

        setHistory(normalizeFrames(rangeJson));
        setSummaryHistory(normalizeFrames(summaryJson));
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load stock history");
          setHistory([]);
          setSummaryHistory([]);
        }
      } finally {
        if (!ignore) setLoadingHistory(false);
      }
    }

    fetchHistory();

    return () => {
      ignore = true;
    };
  }, [auth, company?.symbol, isOpen, selectedRange]);

  useEffect(() => {
    if (!isOpen || !auth || !company?.symbol || viewMode !== "advanced") return;

    let ignore = false;

    async function fetchChartImage() {
      setLoadingImage(true);

      try {
        const res = await fetch("/api/react/company-history-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth,
            company: company.symbol,
            period: selectedRange.period,
            interval: selectedRange.interval,
            size: 900,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const base64 = json["image-base64"];
        const mime = json["image-type"] || "image/jpeg";

        if (!ignore) {
          setChartImage(base64 ? `data:${mime};base64,${base64}` : null);
        }
      } catch (err) {
        if (!ignore) setChartImage(null);
      } finally {
        if (!ignore) setLoadingImage(false);
      }
    }

    fetchChartImage();

    return () => {
      ignore = true;
    };
  }, [auth, company?.symbol, isOpen, selectedRange, viewMode]);

  if (!isOpen || !company) return null;

  const displayName = company?.name || company?.symbol || "Stock";
  const activeHistory = history.length ? history : summaryHistory;
  const latestPoint = activeHistory[activeHistory.length - 1];
  const firstPoint = activeHistory[0];
  const latestPrice = latestPoint?.close ?? Number(company?.price);
  const openingPrice = firstPoint?.open ?? latestPrice;
  const priceChange = Number.isFinite(latestPrice) && Number.isFinite(openingPrice) ? latestPrice - openingPrice : NaN;
  const percentChange =
    Number.isFinite(priceChange) && Number.isFinite(openingPrice) && openingPrice !== 0
      ? (priceChange / openingPrice) * 100
      : NaN;
  const trendUp = priceChange >= 0;
  const accentClass = trendUp ? "is-up" : "is-down";
  const lineColor = trendUp ? "#00c805" : "#ff5000";
  const values = activeHistory.map((point) => point.close);
  const summaryValues = summaryHistory.map((point) => point.close);
  const dayHigh = history.length ? Math.max(...history.map((point) => point.high)) : NaN;
  const dayLow = history.length ? Math.min(...history.map((point) => point.low)) : NaN;
  const yearHigh = summaryValues.length ? Math.max(...summaryValues) : NaN;
  const yearLow = summaryValues.length ? Math.min(...summaryValues) : NaN;
  const rangeHigh = values.length ? Math.max(...values) : NaN;
  const rangeLow = values.length ? Math.min(...values) : NaN;
  const canPaperTrade = paperTradeMode && typeof onPaperTradeStart === "function";
  const paperTradeDisabled = !Number.isFinite(latestPrice) || latestPrice <= 0;
  const chartWidth = 760;
  const chartHeight = 340;
  const chartPadding = 12;
  const chartPath = buildChartPath(activeHistory, chartWidth, chartHeight, chartPadding);
  const areaPath = buildAreaPath(chartPath, activeHistory, chartWidth, chartHeight, chartPadding);
  const infoItems = [
    { label: "Exchange", value: company?.exchange || "—" },
    { label: `${selectedRange.label} range`, value: `${formatCurrency(rangeLow)} - ${formatCurrency(rangeHigh)}` },
    { label: "Open", value: formatCurrency(openingPrice) },
    { label: "Latest high", value: formatCurrency(dayHigh) },
    { label: "Latest low", value: formatCurrency(dayLow) },
    { label: "52-week high", value: formatCurrency(yearHigh) },
    { label: "52-week low", value: formatCurrency(yearLow) },
    { label: "Last updated", value: latestPoint ? formatDateLabel(latestPoint.timestamp) : "—" },
  ];

  return (
    <div className="stock-detail-overlay" onClick={onClose}>
      <aside
        className={`stock-detail-panel ${accentClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="stock-detail-shell">
          <div className="stock-detail-topbar">
            <button className="stock-detail-icon-btn" type="button" onClick={onClose} aria-label="Close stock details">
              ←
            </button>
            <div className="stock-detail-actions">
              <button
                className={`stock-detail-chip ${viewMode === "line" ? "active" : ""}`}
                type="button"
                onClick={() => setViewMode("line")}
              >
                Line
              </button>
              <button
                className={`stock-detail-chip ${viewMode === "advanced" ? "active" : ""}`}
                type="button"
                onClick={() => setViewMode("advanced")}
              >
                Advanced
              </button>
            </div>
          </div>

          <div className="stock-detail-header">
            <p className="stock-detail-symbol">{company.symbol}</p>
            <h2 id={titleId}>{displayName}</h2>
            <div className="stock-detail-price-row">
              <span className="stock-detail-price">{formatCurrency(latestPrice)}</span>
            </div>
            <p className={`stock-detail-change ${accentClass}`}>
              <span>{priceChange >= 0 ? "▲" : "▼"}</span>
              <span>{formatCurrency(Math.abs(priceChange))}</span>
              <span>({formatAbsolutePercent(percentChange)})</span>
              <span>{selectedRange.label}</span>
            </p>
          </div>

          <div className="stock-detail-chart-card">
            {loadingHistory ? (
              <div className="stock-detail-chart-state">Loading chart...</div>
            ) : error ? (
              <div className="stock-detail-chart-state">{error}</div>
            ) : viewMode === "advanced" ? (
              loadingImage ? (
                <div className="stock-detail-chart-state">Loading candlestick view...</div>
              ) : chartImage ? (
                <div className="stock-detail-chart-image-stage">
                  <img className="stock-detail-chart-image" src={chartImage} alt={`${company.symbol} candlestick chart`} />
                </div>
              ) : (
                <div className="stock-detail-chart-state">Advanced chart unavailable for this range.</div>
              )
            ) : activeHistory.length ? (
              <svg className="stock-detail-chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`stock-fill-${safeId}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} className="stock-detail-midline" />
                <path d={areaPath} fill={`url(#stock-fill-${safeId})`} />
                <path d={chartPath} fill="none" stroke={lineColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <div className="stock-detail-chart-state">No chart data returned for this company.</div>
            )}
          </div>

          <div className="stock-detail-range-bar">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                className={`stock-detail-range-btn ${selectedRange.label === option.label ? "active" : ""}`}
                onClick={() => setSelectedRange(option)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {canPaperTrade && (
            <section className="stock-detail-trade-card">
              <div className="stock-detail-trade-copy">
                <h3>Paper Trade</h3>
                <p>Open a dedicated order ticket and buy by dollars or by share count.</p>
              </div>

              <div className="stock-detail-trade-row">
                <div className="stock-detail-trade-cost">
                  <span>Current market price</span>
                  <strong>{formatCurrency(latestPrice)}</strong>
                </div>

                <button
                  type="button"
                  className="stock-detail-buy-btn"
                  onClick={() => onPaperTradeStart(company, latestPrice)}
                  disabled={paperTradeDisabled}
                >
                  Open Order Ticket
                </button>
              </div>
            </section>
          )}

          <section className="stock-detail-about">
            <div className="stock-detail-about-header">
              <h3>About {displayName}</h3>
              <p>Quick stats from the selected range and trailing year history.</p>
            </div>

            <div className="stock-detail-stats-grid">
              {infoItems.map((item) => (
                <div key={item.label} className="stock-detail-stat">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
};

export default StockDetailPanel;
