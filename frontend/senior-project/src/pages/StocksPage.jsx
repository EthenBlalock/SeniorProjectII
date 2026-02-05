import React, { useEffect, useState } from "react";
import StockMenu from "../components/StockMenu";
import "./StockPage.css"

const StockPage = () => {
  const [companies, setCompanies] = useState([]); 
  const [page, setPage] = useState(0);
const [currentPrices, setCurrentPrices] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function postCompanies(nextPage) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/react/companies", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth: "327536389939325150492294747390342686615", page: nextPage }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      // Your API returns an array like: [{symbol,name,price}, ...]
      setCompanies(Array.isArray(json) ? json : (json.companies ?? []));
      setPage(nextPage);
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

async function getCompanyCurrent(companyCode) {
  try {
    const res = await fetch("/api/react/company-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth: "327536389939325150492294747390342686615",
        company: companyCode,
        period: "LAST_DAY",
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    // Expecting: [{ TimeStamp, OpenPrice, ClosePrice, MomentHigh, MomentLow }, ...]
    const rows = Array.isArray(json) ? json : json?.Year ?? json?.data ?? []; 
    if (!Array.isArray(rows) || rows.length === 0) return;

    // Pick the most recent bar (usually last). If not guaranteed sorted, sort by TimeStamp.
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
    setError(err.message || "Request failed");
  }
}



  
  useEffect(() => {
    postCompanies(0);
  }, []);

  useEffect(() => {
    if (!companies.length) return;

    setCurrentPrices({});

    companies.forEach((c) => {
      if (c?.symbol) getCompanyCurrent(c.symbol);
    });
  }, [companies]);

  return (
  <div className="div-stock-page">
    <h1>Stocks</h1>
    <div className="pager">
    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
      <button onClick={() => postCompanies(page - 1)} disabled={loading || page === 0}>
        Prev
      </button>

      <div style={{ alignSelf: "center" }}>Page: {page + 1}</div>

      <button onClick={() => postCompanies(page + 1)} disabled={loading || page >= 9}>
        Next
      </button>
    </div>
    </div>

    {loading && <div>Loading...</div>}
    {error && <div style={{ color: "red" }}>{error}</div>}

    <div className="stocks-grid">
      {companies.map((c) => (
        <StockMenu key={c.symbol} company={{ ...c, price: currentPrices[c.symbol] ?? c.price }} />
      ))}
    </div>


  </div>
);

};

export default StockPage;
