import React, { useState, useEffect } from "react";
import "./StockMenu.css";
import { useAuth } from "../hooks/AuthContext";

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
        close: closePrice,
      };
    })
    .filter((row) => Number.isFinite(row.timestamp) && Number.isFinite(row.close))
    .sort((a, b) => a.timestamp - b.timestamp);
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

function buildAreaPath(linePath, width, height, padding) {
  if (!linePath) return "";
  return `${linePath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;
}

const StockMenu = ({ company, onViewDetails }) => {
  const symbol = company?.symbol ?? "—";
  const name = company?.name ?? "";
  const exchange = company?.exchange ?? "";
  const rawPrice = company?.price;
  const price = rawPrice === -1 || rawPrice == null ? "—" : Number(rawPrice).toFixed(2);
  const initial = (symbol?.[0] || name?.[0] || "?").toUpperCase();
  const { auth } = useAuth();
  
  const [history, setHistory] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(false);

  async function getStockGraph(auth) {
    try {
      setChartLoading(true);
      setChartError(false);

      const res = await fetch("/api/react/company-history", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          auth: auth, 
          company: symbol, 
          period: "LAST_DAY", 
          interval: "QUARTER_HOUR" 
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const points = normalizeFrames(json);

      if (!points.length) {
        throw new Error("No history returned");
      }

      setHistory(points);
      setChartLoading(false);
    } catch (err) {
      console.error(`Failed to load chart for ${symbol}:`, err);
      setChartError(true);
      setChartLoading(false);
    }
  }

  useEffect(() => {
    if (company?.symbol) {
      getStockGraph(auth);
    }
  }, [company?.symbol, auth]);

  const handleCardClick = () => {
    onViewDetails?.(company);
  };

  const chartWidth = 520;
  const chartHeight = 220;
  const chartPadding = 10;
  const chartPath = buildChartPath(history, chartWidth, chartHeight, chartPadding);
  const areaPath = buildAreaPath(chartPath, chartWidth, chartHeight, chartPadding);
  const firstPrice = history[0]?.close;
  const lastPrice = history[history.length - 1]?.close;
  const isUp = Number.isFinite(firstPrice) && Number.isFinite(lastPrice) ? lastPrice >= firstPrice : true;
  const strokeColor = isUp ? "#22c55e" : "#ff6b6b";
  const fillId = `stock-card-fill-${symbol.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase() || "default"}`;

  return (
    <div className="stock-card" onClick={handleCardClick}>
      <div className="card-top">
        <div className="card-left">
          <div className="company-initial">
            <p>{initial}</p>
          </div>

          <div className="company-info">
            <div className="symbol">{symbol}</div>
            <div className="name">{name}</div>
            {exchange && <div className="exchange">{exchange}</div>}
          </div>
        </div>

        <div className="card-right">
          <div className="price-container">
            <div className="price">${price}</div>
            {/* You can add change percentage here later */}
          </div>
        </div>
      </div>

      <div className="stock-graph-container">
        {chartLoading && (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <p>Loading chart...</p>
          </div>
        )}
        
        {chartError && !chartLoading && (
          <div className="chart-error">
            <span className="error-icon">📉</span>
            <p>Chart unavailable</p>
          </div>
        )}
        
        {!chartLoading && !chartError && history.length > 0 && (
          <svg
            className="stock-graph-svg"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            aria-label={`${symbol} price history`}
          >
            <defs>
              <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.24" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} className="stock-graph-midline" />
            <path d={areaPath} fill={`url(#${fillId})`} />
            <path
              d={chartPath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <div className="card-footer">
        <button className="action-btn" onClick={(e) => {
          e.stopPropagation();
          onViewDetails?.(company);
        }}>
          View Details
        </button>
        <button className="action-btn secondary" onClick={(e) => {
          e.stopPropagation();
          console.log(`Add ${symbol} to watchlist`);
        }}>
          + Watchlist
        </button>
      </div>
    </div>
  );
};

export default StockMenu;
