import React, { useMemo, useState } from "react";
import "./BudgetPage.css";
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";

const NC_RANGES = {
  housing: { min: 700, max: 1200 },
  utilities: { min: 0, max: 150 },
  groceries: { min: 20, max: 250 },
  transportation: { min: 25, max: 500 },
  books: { min: 0, max: 150 },
  entertainment: { min: 50, max: 250 },
};

const clampNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const compareToRange = (value, range) => {
  if (!range) return { label: "—", tone: "neutral" };
  if (value === 0) return { label: "—", tone: "neutral" };
  if (value < range.min) return { label: "Below avg", tone: "good" };
  if (value > range.max) return { label: "Above avg", tone: "warn" };
  return { label: "In range", tone: "ok" };
};

const FieldRow = ({ label, name, value, onChange, hint, range }) => {
  const cmp = compareToRange(clampNum(value), range);

  return (
    <div className="bp-row">
      <div className="bp-row-left">
        <label className="bp-label" htmlFor={name}>
          {label}
        </label>
        {hint && <div className="bp-hint">{hint}</div>}
      </div>

      <div className="bp-row-right">
        <div className="bp-input-wrap">
          <span className="bp-dollar">$</span>
          <input
            id={name}
            name={name}
            className="bp-input"
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            placeholder="0"
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
          />
        </div>

        <div className={`bp-badge ${cmp.tone}`}>
          {cmp.label}
          {range ? (
            <span className="bp-badge-range">
              (${range.min}–${range.max})
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const BudgetPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  const [meta, setMeta] = useState({
    monthlyIncome: "",
    budgetStyle: "student",
  });

  const [form, setForm] = useState({
    housing: "",
    utilities: "",
    groceries: "",
    transportation: "",
    phone: "",
    medical: "",
    books: "",
    diningOut: "",
    entertainment: "",
    subscriptions: "",
    shopping: "",
    emergency: "",
    investing: "",
    savingsGoal: "",
  });

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setMetaField = (name, value) => {
    setMeta((prev) => ({ ...prev, [name]: value }));
  };

  const totals = useMemo(() => {
    const needs =
      clampNum(form.housing) +
      clampNum(form.utilities) +
      clampNum(form.groceries) +
      clampNum(form.transportation) +
      clampNum(form.phone) +
      clampNum(form.medical) +
      clampNum(form.books);

    const wants =
      clampNum(form.diningOut) +
      clampNum(form.entertainment) +
      clampNum(form.subscriptions) +
      clampNum(form.shopping);

    const savings =
      clampNum(form.emergency) +
      clampNum(form.investing) +
      clampNum(form.savingsGoal);

    const total = needs + wants + savings;
    const income = clampNum(meta.monthlyIncome);
    const leftover = income - total;

    return { needs, wants, savings, total, income, leftover };
  }, [form, meta.monthlyIncome]);

  const guideline = useMemo(() => {
    const income = totals.income;
    if (!income) return null;
    return {
      needs: Math.round(income * 0.5),
      wants: Math.round(income * 0.3),
      savings: Math.round(income * 0.2),
    };
  }, [totals.income]);

  // Chart Data
  const pieData = [
    { name: "Needs", value: totals.needs },
    { name: "Wants", value: totals.wants },
    { name: "Savings", value: totals.savings },
  ];

  const PIE_COLORS = ["#22c55e", "rgba(46,204,113,0.6)", "rgba(255,255,255,0.3)"];

  const RANGE_FIELDS = [
    { key: "housing", label: "Housing", rangeKey: "housing" },
    { key: "utilities", label: "Utilities", rangeKey: "utilities" },
    { key: "groceries", label: "Groceries", rangeKey: "groceries" },
    { key: "transportation", label: "Transport", rangeKey: "transportation" },
    { key: "books", label: "Books", rangeKey: "books" },
    { key: "entertainment", label: "Fun", rangeKey: "entertainment" },
  ];

  const rangeData = RANGE_FIELDS.map((f) => {
    const user = clampNum(form[f.key]);
    const r = NC_RANGES[f.rangeKey];
    const min = r?.min ?? 0;
    const max = r?.max ?? 0;

    return {
      name: f.label,
      min,
      band: Math.max(0, max - min),
      user,
    };
  });

  const spendingData = [
    { name: "Income", amount: totals.income },
    { name: "Spending", amount: totals.total },
    { name: totals.leftover >= 0 ? "Leftover" : "Over", amount: Math.abs(totals.leftover) },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const progressPercent = totals.income > 0 
    ? Math.min((totals.total / totals.income) * 100, 100) 
    : 0;

  return (
    <div className="bp-page">
      <header className="bp-header">
        <h1 className="bp-title">Budget Builder</h1>
        <p className="bp-subtitle">
          Track your spending, compare to student averages, and build healthy financial habits
        </p>
        
        {/* Progress Bar */}
        {totals.income > 0 && (
          <div className="budget-progress-container">
            <div className="budget-progress-bar">
              <div 
                className={`budget-progress-fill ${totals.leftover < 0 ? 'over' : ''}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="budget-progress-text">
              <span>${totals.total} of ${totals.income}</span>
              <span className={totals.leftover < 0 ? 'text-warn' : 'text-good'}>
                {totals.leftover >= 0 ? `$${totals.leftover} left` : `$${Math.abs(totals.leftover)} over`}
              </span>
            </div>
          </div>
        )}
      </header>

      <form className="bp-grid" onSubmit={handleSubmit}>
        {/* Meta card */}
        <section className="bp-card bp-meta">
          <div className="bp-card-header">
            <div className="bp-card-icon">💰</div>
            <div className="bp-card-title">Start Here</div>
          </div>

          <div className="bp-row">
            <div className="bp-row-left">
              <label className="bp-label" htmlFor="monthlyIncome">
                Monthly Income
              </label>
              <div className="bp-hint">Paychecks, support, scholarships, etc.</div>
            </div>

            <div className="bp-row-right">
              <div className="bp-input-wrap">
                <span className="bp-dollar">$</span>
                <input
                  id="monthlyIncome"
                  className="bp-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={meta.monthlyIncome}
                  onChange={(e) => setMetaField("monthlyIncome", e.target.value)}
                />
              </div>
              <div className="bp-badge neutral">Monthly</div>
            </div>
          </div>

          <div className="bp-row">
            <div className="bp-row-left">
              <label className="bp-label" htmlFor="budgetStyle">
                Budget Mode
              </label>
              <div className="bp-hint">Choose a guideline to compare against</div>
            </div>

            <div className="bp-row-right">
              <select
                id="budgetStyle"
                className="bp-select"
                value={meta.budgetStyle}
                onChange={(e) => setMetaField("budgetStyle", e.target.value)}
              >
                <option value="student">Student (NC averages)</option>
                <option value="50-30-20">50 / 30 / 20 rule</option>
              </select>
              <div className="bp-badge neutral">Guide</div>
            </div>
          </div>

          {meta.budgetStyle === "50-30-20" && guideline && (
            <div className="bp-guideline">
              <div className="bp-guideline-title">💡 50/30/20 Monthly Targets</div>
              <div className="bp-guideline-grid">
                <div className="guideline-item">
                  <span className="guideline-percent">50%</span>
                  <span className="guideline-label">Needs</span>
                  <span className="guideline-value">${guideline.needs}</span>
                </div>
                <div className="guideline-item">
                  <span className="guideline-percent">30%</span>
                  <span className="guideline-label">Wants</span>
                  <span className="guideline-value">${guideline.wants}</span>
                </div>
                <div className="guideline-item">
                  <span className="guideline-percent">20%</span>
                  <span className="guideline-label">Savings</span>
                  <span className="guideline-value">${guideline.savings}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Needs */}
        <section 
          className={`bp-card ${activeSection === 'needs' ? 'active' : ''}`}
          onMouseEnter={() => setActiveSection('needs')}
          onMouseLeave={() => setActiveSection(null)}
        >
          <div className="bp-card-header">
            <div className="bp-card-icon">🏠</div>
            <div>
              <div className="bp-card-title">Needs</div>
              <div className="bp-card-subtitle">${totals.needs}</div>
            </div>
          </div>

          <FieldRow label="Housing (rent)" name="housing" value={form.housing} onChange={setField} hint="Off-campus rent + fees" range={NC_RANGES.housing} />
          <FieldRow label="Utilities" name="utilities" value={form.utilities} onChange={setField} hint="Power, water, trash" range={NC_RANGES.utilities} />
          <FieldRow label="Groceries" name="groceries" value={form.groceries} onChange={setField} hint="Food you cook" range={NC_RANGES.groceries} />
          <FieldRow label="Transportation" name="transportation" value={form.transportation} onChange={setField} hint="Gas, bus, parking" range={NC_RANGES.transportation} />
          <FieldRow label="Phone / Internet" name="phone" value={form.phone} onChange={setField} hint="Phone or internet" />
          <FieldRow label="Medical" name="medical" value={form.medical} onChange={setField} hint="Copays, meds" />
          <FieldRow label="Books & Supplies" name="books" value={form.books} onChange={setField} hint="Textbooks, fees" range={NC_RANGES.books} />
        </section>

        {/* Wants */}
        <section 
          className={`bp-card ${activeSection === 'wants' ? 'active' : ''}`}
          onMouseEnter={() => setActiveSection('wants')}
          onMouseLeave={() => setActiveSection(null)}
        >
          <div className="bp-card-header">
            <div className="bp-card-icon">🎉</div>
            <div>
              <div className="bp-card-title">Wants</div>
              <div className="bp-card-subtitle">${totals.wants}</div>
            </div>
          </div>

          <FieldRow label="Dining Out" name="diningOut" value={form.diningOut} onChange={setField} hint="Restaurants, coffee" />
          <FieldRow label="Entertainment" name="entertainment" value={form.entertainment} onChange={setField} hint="Movies, events, fun" range={NC_RANGES.entertainment} />
          <FieldRow label="Subscriptions" name="subscriptions" value={form.subscriptions} onChange={setField} hint="Spotify, Netflix" />
          <FieldRow label="Shopping / Misc" name="shopping" value={form.shopping} onChange={setField} hint="Clothes, random buys" />
        </section>

        {/* Savings */}
        <section 
          className={`bp-card bp-savings ${activeSection === 'savings' ? 'active' : ''}`}
          onMouseEnter={() => setActiveSection('savings')}
          onMouseLeave={() => setActiveSection(null)}
        >
          <div className="bp-card-header">
            <div className="bp-card-icon">💎</div>
            <div>
              <div className="bp-card-title">Savings & Goals</div>
              <div className="bp-card-subtitle">${totals.savings}</div>
            </div>
          </div>

          <FieldRow label="Emergency Fund" name="emergency" value={form.emergency} onChange={setField} hint="Start with $25–$50" />
          <FieldRow label="Investing" name="investing" value={form.investing} onChange={setField} hint="Paper trading practice" />
          <FieldRow label="Savings Goal" name="savingsGoal" value={form.savingsGoal} onChange={setField} hint="Tuition, trip, laptop" />

          <div className="bp-summary">
            <div className="bp-summary-row">
              <span>Needs</span>
              <b>${totals.needs}</b>
            </div>
            <div className="bp-summary-row">
              <span>Wants</span>
              <b>${totals.wants}</b>
            </div>
            <div className="bp-summary-row">
              <span>Savings</span>
              <b>${totals.savings}</b>
            </div>
            <div className="bp-summary-row total">
              <span>Total Budget</span>
              <b>${totals.total}</b>
            </div>

            <div className={`bp-leftover ${totals.leftover < 0 ? "warn" : "good"}`}>
              <span>{totals.leftover < 0 ? "⚠️ Over Budget" : "✓ Leftover"}</span>
              <b>${Math.abs(totals.leftover)}</b>
            </div>
          </div>

          <button className="bp-submit" type="submit">
            📊 Generate Budget Visuals
          </button>
        </section>

        {submitted && totals.total > 0 && (
          <div className="bp-charts">
            <div className="bp-chart-card">
              <div className="bp-chart-header">
                <div className="bp-chart-title">Budget Breakdown</div>
                <div className="bp-chart-subtitle">How you're allocating your money</div>
              </div>
              <PieChart data={pieData} colors={PIE_COLORS} size={220} />
            </div>

            <div className="bp-chart-card">
              <div className="bp-chart-header">
                <div className="bp-chart-title">NC Student Comparison</div>
                <div className="bp-chart-subtitle">Your spending vs typical range</div>
              </div>
              <BarChart data={rangeData} color="#22c55e" showRange={true} />
            </div>

            <div className="bp-chart-card bp-chart-wide">
              <div className="bp-chart-header">
                <div className="bp-chart-title">Income vs Spending</div>
                <div className="bp-chart-subtitle">
                  {totals.leftover >= 0 
                    ? "✓ You're staying within budget!" 
                    : "⚠️ You're over budget — try cutting wants or increasing income"}
                </div>
              </div>
              <BarChart data={spendingData} color="rgba(46, 204, 113, 0.8)" />
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default BudgetPage;
