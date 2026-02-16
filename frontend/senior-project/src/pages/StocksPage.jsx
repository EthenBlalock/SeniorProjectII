import React, { useEffect, useState } from "react";
import StockMenu from "../components/StockMenu";
import "./StockPage.css"
import { useAuth } from "../hooks/AuthContext";

const StockPage = () => {
  const [companies, setCompanies] = useState([]); 
  const [page, setPage] = useState(0);
  const [currentPrices, setCurrentPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { auth, loadingAuth } = useAuth();

  async function postCompanies(auth, nextPage) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/react/companies", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth: auth, page: nextPage }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      setCompanies(Array.isArray(json) ? json : (json.companies ?? []));
      setPage(nextPage);
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function getCompanyCurrent(auth, companyCode) {
    try {
      const res = await fetch("/api/react/company-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth: auth,
          company: companyCode,
          period: "LAST_DAY",
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const rows = Array.isArray(json) ? json : json?.Year ?? json?.data ?? []; 
      if (!Array.isArray(rows) || rows.length === 0) return;

      const last = rows.reduce((a, b) => (a.TimeStamp > b.TimeStamp ? a : b));

      const displayedPrice =
        last.ClosePrice != null && last.ClosePrice !== -1
          ? last.ClosePrice
          : last.OpenPrice;
      
      const displayedPriceNum = Number(displayedPrice);
      const pretty = Number.isFinite(displayedPriceNum)
        ? displayedPriceNum.toFixed(2)
        : displayedPrice;

      setCurrentPrices((prev) => ({ ...prev, [companyCode]: pretty }));
    } catch (err) {
      console.error(`Failed to fetch price for ${companyCode}:`, err);
    }
  }
  
  useEffect(() => {
    postCompanies(auth, 0);
  }, [auth]);

  useEffect(() => {
    if (!companies.length) return;

    setCurrentPrices({});

    companies.forEach((c) => {
      if (c?.symbol) getCompanyCurrent(auth, c.symbol);
    });
  }, [companies, auth]);


  return (
    <div className="div-stock-page">
      <div className="page-header">
        <h1>Stocks</h1>
        <p className="page-subtitle">Explore real-time market data and practice paper trading</p>
      </div>

      <div className="toolbar">
        <div className="pager">
          <button 
            className="pager-btn" 
            onClick={() => postCompanies(auth,page - 1)} 
            disabled={loading || page === 0}
          >
            Prev
          </button>

          <div className="pager-text">Page: {page + 1}</div>

          <button 
            className="pager-btn"
            onClick={() => postCompanies(auth, page + 1)} 
            disabled={loading || page >= 9}
          >
            Next
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️</span> {error}
        </div>
      )}

      {loading ? (
        <div className="stocks-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="stock-skeleton">
              <div className="skeleton-header">
                <div className="skeleton-circle"></div>
                <div className="skeleton-text-group">
                  <div className="skeleton-text short"></div>
                  <div className="skeleton-text long"></div>
                </div>
              </div>
              <div className="skeleton-chart"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="stocks-grid">
          {companies.map((c) => (
            <StockMenu 
              key={c.symbol} 
              company={{ ...c, price: currentPrices[c.symbol] ?? c.price }} 
            />
          ))}
        </div>
      )}

      {!loading && companies.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No stocks found</h3>
          <p>Try a different page or refresh</p>
        </div>
      )}
    </div>
  );
};

export default StockPage;
