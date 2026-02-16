import React, { useState, useEffect } from "react";
import "./StockMenu.css";
import { useAuth } from "../hooks/AuthContext";


const StockMenu = ({ company }) => {
  const symbol = company?.symbol ?? "—";
  const name = company?.name ?? "";
  const exchange = company?.exchange ?? "";
  const rawPrice = company?.price;
  const price = rawPrice === -1 || rawPrice == null ? "—" : Number(rawPrice).toFixed(2);
  const initial = (symbol?.[0] || name?.[0] || "?").toUpperCase();
  const { auth, loadingAuth } = useAuth();
  
  const [img, setImage] = useState(null);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  async function getStockGraph(auth) {
    try {
      setImgLoading(true);
      setImgError(false);

      const res = await fetch("/api/react/company-history-image", { 
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
      const base64 = json['image-base64'];
      const mime = json['image-type'] || 'image/jpeg';
      
      if (!base64) {
        throw new Error('No image returned');
      }
      
      const dataUrl = `data:${mime};base64,${base64}`;
      setImage(dataUrl);
      setImgLoading(false);
    } catch (err) {
      console.error(`Failed to load chart for ${symbol}:`, err);
      setImgError(true);
      setImgLoading(false);
    }
  }

  useEffect(() => {
    if (company?.symbol) {
      getStockGraph(auth);
    }
  }, [company?.symbol, auth]);

  const handleCardClick = () => {
    // TODO: Navigate to detailed stock view
    console.log(`Clicked on ${symbol}`);
  };

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
        {imgLoading && (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <p>Loading chart...</p>
          </div>
        )}
        
        {imgError && !imgLoading && (
          <div className="chart-error">
            <span className="error-icon">📉</span>
            <p>Chart unavailable</p>
          </div>
        )}
        
        {img && !imgLoading && !imgError && (
          <img 
            src={img} 
            alt={`${symbol} candlestick chart`} 
            className="stock-graph-img"
          />
        )}
      </div>

      <div className="card-footer">
        <button className="action-btn" onClick={(e) => {
          e.stopPropagation();
          console.log(`View details for ${symbol}`);
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
