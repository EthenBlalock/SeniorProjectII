import React from "react";
import "./StockMenu.css";
import defaultImg from "../assets/stock-graph.png";

const StockMenu = ({ company, graphSrc }) => {
  const symbol = company?.symbol ?? "—";
  const name = company?.name ?? "";
  const exchange = company?.exchange ?? "";
  const rawPrice = company?.price;
  const price = rawPrice === -1 || rawPrice == null ? "—" : Number(rawPrice).toFixed(2);
  const initial = (symbol?.[0] || name?.[0] || "?").toUpperCase();

  return (
  <div className="div-container">
    <div className="card-top">
      <div className="card-left">
        <div className="company-initial">
          <p>{initial}</p>
        </div>

        <div className="company-name-symbol">
          <div className="symbol">{symbol}</div>
          <div className="name">{name}</div>
          {exchange && <div className="exchange">{exchange}</div>}
        </div>
      </div>

      <div className="card-right">
        <div className="price">{price}</div>
        {/* later you can add change pill here */}
      </div>
    </div>

    <div className="stock-graph">
      <img src={defaultImg} alt={`${symbol} graph`} />
    </div>
  </div>
);
};

export default StockMenu;
