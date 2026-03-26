import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { auth as firebaseAuth, db } from "../firebase";
import { useAuth } from "../hooks/AuthContext";
import "./PaperTradeOrderPage.css";

const QUICK_VALUES = {
  dollars: [25, 100, 500],
  shares: [1, 5, 10],
};

const DECIMAL_LIMITS = {
  dollars: 2,
  shares: 4,
};

function roundTo(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatShareAmount(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function sanitizeNumericInput(rawValue, mode) {
  const decimalLimit = DECIMAL_LIMITS[mode];
  const cleaned = String(rawValue).replace(/[^\d.]/g, "");
  const [whole = "", ...decimalParts] = cleaned.split(".");
  const normalizedWhole = whole.replace(/^0+(?=\d)/, "") || "0";

  if (decimalParts.length === 0) {
    return normalizedWhole;
  }

  const decimal = decimalParts.join("").slice(0, decimalLimit);
  return decimal.length ? `${normalizedWhole}.${decimal}` : `${normalizedWhole}.`;
}

function appendKey(currentValue, key, mode) {
  if (key === ".") {
    if (currentValue.includes(".")) return currentValue;
    return `${currentValue || "0"}.`;
  }

  const baseValue = currentValue === "0" ? "" : currentValue;
  return sanitizeNumericInput(`${baseValue}${key}`, mode);
}

function deleteKey(currentValue, mode) {
  if (!currentValue || currentValue === "0") return "0";

  const nextValue = currentValue.slice(0, -1);
  if (!nextValue) return "0";
  if (nextValue.endsWith(".")) return nextValue;

  return sanitizeNumericInput(nextValue, mode);
}

function extractLatestPrice(payload) {
  const rows = Array.isArray(payload) ? payload : payload?.Year ?? payload?.data ?? [];
  if (!Array.isArray(rows) || rows.length === 0) return NaN;

  const latestRow = rows.reduce((latest, row) =>
    Number(row?.TimeStamp) > Number(latest?.TimeStamp) ? row : latest
  );

  const displayedPrice =
    latestRow?.ClosePrice != null && Number(latestRow.ClosePrice) !== -1
      ? Number(latestRow.ClosePrice)
      : Number(latestRow?.OpenPrice);

  return Number.isFinite(displayedPrice) ? displayedPrice : NaN;
}

const PaperTradeOrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { symbol: routeSymbol } = useParams();
  const { auth: apiAuth } = useAuth();
  const routedCompany = location.state?.company;
  const normalizedSymbol = (routeSymbol || routedCompany?.symbol || "").toUpperCase();
  const [company, setCompany] = useState(
    routedCompany?.symbol?.toUpperCase() === normalizedSymbol
      ? routedCompany
      : normalizedSymbol
        ? { symbol: normalizedSymbol, name: normalizedSymbol }
        : null
  );
  const [currentUid, setCurrentUid] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [latestPrice, setLatestPrice] = useState(() => {
    const seededPrice = Number(location.state?.latestPrice ?? routedCompany?.price);
    return Number.isFinite(seededPrice) ? seededPrice : NaN;
  });
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [entryMode, setEntryMode] = useState("dollars");
  const [inputValue, setInputValue] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState("neutral");

  async function loadBalance(uid) {
    setLoadingBalance(true);

    try {
      const docRef = doc(db, "balance", uid);
      const docSnap = await getDoc(docRef);
      setBalance(docSnap.exists() ? Number(docSnap.data().paperTradingBalance ?? 0) : 0);
    } finally {
      setLoadingBalance(false);
    }
  }

  useEffect(() => {
    if (!normalizedSymbol) {
      setCompany(null);
      return;
    }

    if (routedCompany?.symbol?.toUpperCase() === normalizedSymbol) {
      setCompany(routedCompany);
      return;
    }

    setCompany((current) =>
      current?.symbol?.toUpperCase() === normalizedSymbol
        ? current
        : { symbol: normalizedSymbol, name: normalizedSymbol }
    );
  }, [normalizedSymbol, routedCompany]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user?.uid) {
        setCurrentUid(user.uid);
        loadBalance(user.uid);
      } else {
        setCurrentUid(null);
        setBalance(0);
        setLoadingBalance(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!normalizedSymbol) return undefined;

    let ignore = false;

    async function hydrateCompany() {
      try {
        const res = await fetch("/database.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const match = Array.isArray(data)
          ? data.find((item) => item?.symbol?.toUpperCase() === normalizedSymbol)
          : null;

        if (!ignore && match) {
          setCompany((current) => ({
            ...(current ?? {}),
            ...match,
            symbol: normalizedSymbol,
            price: current?.price ?? match.price,
          }));
        }
      } catch (error) {
        if (!ignore) {
          console.error(`Failed to load details for ${normalizedSymbol}:`, error);
        }
      }
    }

    hydrateCompany();

    return () => {
      ignore = true;
    };
  }, [normalizedSymbol]);

  useEffect(() => {
    if (!normalizedSymbol) return undefined;

    let ignore = false;

    async function fetchLatestPrice() {
      setLoadingPrice(true);

      try {
        const res = await fetch("/api/react/company-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth: apiAuth,
            company: normalizedSymbol,
            period: "LAST_DAY",
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const nextPrice = extractLatestPrice(json);

        if (!ignore && Number.isFinite(nextPrice) && nextPrice > 0) {
          setLatestPrice(nextPrice);
          setCompany((current) => ({
            ...(current ?? { symbol: normalizedSymbol, name: normalizedSymbol }),
            symbol: normalizedSymbol,
            price: nextPrice,
          }));
        }
      } catch (error) {
        if (!ignore) {
          console.error(`Failed to load latest price for ${normalizedSymbol}:`, error);
        }
      } finally {
        if (!ignore) {
          setLoadingPrice(false);
        }
      }
    }

    fetchLatestPrice();

    return () => {
      ignore = true;
    };
  }, [apiAuth, normalizedSymbol]);

  const inputNumber = Number(inputValue);
  const hasValidInput = Number.isFinite(inputNumber) && inputNumber > 0;
  const hasValidPrice = Number.isFinite(latestPrice) && latestPrice > 0;
  const estimatedCost =
    hasValidInput && hasValidPrice
      ? entryMode === "dollars"
        ? roundTo(inputNumber, 2)
        : roundTo(inputNumber * latestPrice, 2)
      : 0;
  const estimatedShares =
    hasValidInput && hasValidPrice
      ? entryMode === "dollars"
        ? roundTo(inputNumber / latestPrice, 4)
        : roundTo(inputNumber, 4)
      : 0;
  const remainingBalance = roundTo(balance - estimatedCost, 2);
  const insufficientFunds = estimatedCost > balance;
  const displayName = company?.name || normalizedSymbol || "Paper Trade";
  const orderDisabled =
    submitting ||
    !currentUid ||
    !hasValidPrice ||
    !hasValidInput ||
    estimatedCost <= 0 ||
    insufficientFunds;
  const presets = QUICK_VALUES[entryMode];
  const displayValue =
    entryMode === "dollars"
      ? formatCurrency(hasValidInput ? inputNumber : 0)
      : `${formatShareAmount(hasValidInput ? inputNumber : 0)} ${Number(inputNumber) === 1 ? "share" : "shares"}`;

  function resetStatus() {
    setStatusMessage("");
    setStatusTone("neutral");
  }

  function handleModeChange(mode) {
    setEntryMode(mode);
    setInputValue("0");
    resetStatus();
  }

  function handlePresetSelect(value) {
    setInputValue(sanitizeNumericInput(String(value), entryMode));
    resetStatus();
  }

  function handleKeypadPress(key) {
    setInputValue((current) => appendKey(current, key, entryMode));
    resetStatus();
  }

  function handleDelete() {
    setInputValue((current) => deleteKey(current, entryMode));
    resetStatus();
  }

  async function handlePlaceOrder() {
    if (!currentUid) {
      setStatusMessage("Sign in to place a paper trade.");
      setStatusTone("error");
      return;
    }

    if (!hasValidPrice) {
      setStatusMessage("Live pricing is unavailable for this stock right now.");
      setStatusTone("error");
      return;
    }

    if (!hasValidInput || estimatedCost <= 0 || estimatedShares <= 0) {
      setStatusMessage("Enter a valid dollar amount or share count to continue.");
      setStatusTone("error");
      return;
    }

    setSubmitting(true);
    resetStatus();

    try {
      await runTransaction(db, async (transaction) => {
        const balanceRef = doc(db, "balance", currentUid);
        const portfolioRef = doc(db, "paperTradingPortfolio", currentUid);
        const balanceSnap = await transaction.get(balanceRef);
        const portfolioSnap = await transaction.get(portfolioRef);

        const currentBalance = balanceSnap.exists()
          ? Number(balanceSnap.data().paperTradingBalance ?? 0)
          : 0;

        if (currentBalance < estimatedCost) {
          throw new Error(`Not enough paper trading balance to invest ${formatCurrency(estimatedCost)}.`);
        }

        const currentHoldings = portfolioSnap.exists()
          ? portfolioSnap.data().holdings ?? {}
          : {};
        const existingHolding = currentHoldings[normalizedSymbol] ?? {};
        const currentShares = Number(existingHolding.shares ?? 0);
        const currentTotalCost = Number(existingHolding.totalCost ?? 0);
        const nextShares = roundTo(currentShares + estimatedShares, 4);
        const nextTotalCost = roundTo(currentTotalCost + estimatedCost, 2);

        transaction.set(
          balanceRef,
          {
            paperTradingBalance: roundTo(currentBalance - estimatedCost, 2),
          },
          { merge: true }
        );

        transaction.set(
          portfolioRef,
          {
            holdings: {
              ...currentHoldings,
              [normalizedSymbol]: {
                symbol: normalizedSymbol,
                name: displayName,
                price: latestPrice,
                shares: nextShares,
                averagePrice: nextShares > 0 ? roundTo(nextTotalCost / nextShares, 2) : 0,
                totalCost: nextTotalCost,
                updatedAt: new Date(),
              },
            },
          },
          { merge: true }
        );
      });

      await loadBalance(currentUid);
      setInputValue("0");
      setStatusMessage(
        `Order filled: ${formatShareAmount(estimatedShares)} ${estimatedShares === 1 ? "share" : "shares"} of ${normalizedSymbol} for ${formatCurrency(estimatedCost)}.`
      );
      setStatusTone("success");
    } catch (error) {
      setStatusMessage(error.message || "Unable to complete paper trade.");
      setStatusTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!normalizedSymbol) {
    return (
      <div className="paper-order-page">
        <div className="paper-order-empty">
          <h1>No stock selected</h1>
          <p>Choose a company from Paper Trading first, then open the buy flow again.</p>
          <button type="button" className="paper-order-back-btn" onClick={() => navigate("/papertrade")}>
            Return to Paper Trading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="paper-order-page">
      <div className="paper-order-shell">
        <section className="paper-order-ticket">
          <div className="paper-order-topbar">
            <button type="button" className="paper-order-back-btn" onClick={() => navigate("/papertrade")}>
              ← Back to portfolio
            </button>
            <div className="paper-order-badge">Paper Trade</div>
          </div>

          <header className="paper-order-header">
            <p className="paper-order-eyebrow">Market order</p>
            <h1>Buy {normalizedSymbol}</h1>
            <p className="paper-order-subtitle">
              Set your amount below, then place the order at the current market price.
            </p>
          </header>

          <div className="paper-order-company-strip">
            <div>
              <span className="paper-order-company-label">Company</span>
              <strong>{displayName}</strong>
            </div>
            <div>
              <span className="paper-order-company-label">Live price</span>
              <strong>{loadingPrice && !hasValidPrice ? "Loading..." : formatCurrency(latestPrice)}</strong>
            </div>
          </div>

          <div className="paper-order-mode-switch" role="tablist" aria-label="Order amount mode">
            <button
              type="button"
              className={`paper-order-mode-btn ${entryMode === "dollars" ? "active" : ""}`}
              onClick={() => handleModeChange("dollars")}
              disabled={submitting}
            >
              Dollars
            </button>
            <button
              type="button"
              className={`paper-order-mode-btn ${entryMode === "shares" ? "active" : ""}`}
              onClick={() => handleModeChange("shares")}
              disabled={submitting}
            >
              Shares
            </button>
          </div>

          <div className="paper-order-display-card">
            <span className="paper-order-display-label">
              {entryMode === "dollars" ? "You are investing" : "You are buying"}
            </span>
            <div className="paper-order-display-value">{displayValue}</div>
            <p className="paper-order-display-caption">
              {entryMode === "dollars"
                ? "Fractional shares are calculated from your dollar amount."
                : "Enter the exact number of shares you want to purchase."}
            </p>
          </div>

          <div className="paper-order-preset-grid">
            {presets.map((value) => (
              <button
                key={`${entryMode}-${value}`}
                type="button"
                className="paper-order-preset-btn"
                onClick={() => handlePresetSelect(value)}
                disabled={submitting}
              >
                {entryMode === "dollars" ? formatCurrency(value) : `${value} ${value === 1 ? "share" : "shares"}`}
              </button>
            ))}
          </div>

          <div className="paper-order-keypad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((key) => (
              <button
                key={key}
                type="button"
                className="paper-order-key-btn"
                onClick={() => handleKeypadPress(key)}
                disabled={submitting}
              >
                {key}
              </button>
            ))}

            <button
              type="button"
              className="paper-order-key-btn paper-order-key-btn-delete"
              onClick={handleDelete}
              disabled={submitting}
            >
              ←
            </button>
          </div>

          {statusMessage && (
            <div className={`paper-order-status is-${statusTone}`}>
              {statusMessage}
            </div>
          )}
        </section>

        <aside className="paper-order-sidebar">
          <section className="paper-order-summary-card">
            <div className="paper-order-summary-header">
              <h2>Order summary</h2>
              <p>Everything updates instantly as you type.</p>
            </div>

            <div className="paper-order-summary-grid">
              <div className="paper-order-summary-row">
                <span>Buying power</span>
                <strong>{loadingBalance ? "Loading..." : formatCurrency(balance)}</strong>
              </div>
              <div className="paper-order-summary-row">
                <span>Estimated shares</span>
                <strong>{hasValidPrice ? formatShareAmount(estimatedShares) : "—"}</strong>
              </div>
              <div className="paper-order-summary-row">
                <span>Estimated cost</span>
                <strong>{hasValidPrice ? formatCurrency(estimatedCost) : "—"}</strong>
              </div>
              <div className="paper-order-summary-row">
                <span>Remaining balance</span>
                <strong className={remainingBalance < 0 ? "is-negative" : ""}>
                  {hasValidPrice ? formatCurrency(remainingBalance) : "—"}
                </strong>
              </div>
            </div>

            {!currentUid && (
              <p className="paper-order-inline-note">
                Sign in with your account to place paper trades.
              </p>
            )}

            {insufficientFunds && hasValidPrice && (
              <p className="paper-order-inline-note is-warning">
                This order is larger than your available paper trading balance.
              </p>
            )}

            {!hasValidPrice && (
              <p className="paper-order-inline-note is-warning">
                Live pricing must load before this order can be submitted.
              </p>
            )}

            <button
              type="button"
              className="paper-order-submit-btn"
              onClick={handlePlaceOrder}
              disabled={orderDisabled}
            >
              {submitting ? "Placing order..." : "Review & Buy"}
            </button>
          </section>

          
        </aside>
      </div>
    </div>
  );
};

export default PaperTradeOrderPage;
