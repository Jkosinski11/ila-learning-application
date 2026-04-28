import { useEffect, useState } from "react";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { db } from "./firebase";
import { marketApi } from "./api";
import { formatUSD, STARTING_CASH_CENTS } from "./models/contracts";

function getDisplayName(profile, user) {
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  return fullName || user?.email || "User";
}

function getRoleLabel(accountType) {
  if (accountType === "teacher") return "Teacher";
  if (accountType === "student") return "Student";
  if (accountType === "admin") return "Administrator";
  return "Member";
}

function formatMoney(value) {
  if (typeof value !== "number") return "-";

  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

function formatNumber(value) {
  if (typeof value !== "number") return "-";
  return value.toLocaleString();
}

function normalizeHoldings(holdings) {
  if (!Array.isArray(holdings)) return [];

  return holdings.map((holding) => ({
    symbol: holding.symbol,
    name: holding.name || holding.symbol,
    shares: Number(holding.shares || 0),
    avgPriceCents: Number(holding.avgPriceCents || 0),
    lastPrice: typeof holding.lastPrice === "number" ? holding.lastPrice : null,
  }));
}

function normalizeTradeHistory(tradeHistory) {
  if (!Array.isArray(tradeHistory)) return [];

  return [...tradeHistory]
    .map((trade) => ({
      type: trade.type || "buy",
      symbol: trade.symbol,
      name: trade.name || trade.symbol,
      quantity: Number(trade.quantity || 0),
      priceCents: Number(trade.priceCents || 0),
      executedAt: trade.executedAt || null,
    }))
    .sort((left, right) => {
      const leftTime = left.executedAt ? new Date(left.executedAt).getTime() : 0;
      const rightTime = right.executedAt ? new Date(right.executedAt).getTime() : 0;
      return rightTime - leftTime;
    });
}

function mergeHolding(holdings, quote, quantity, priceCents) {
  const existing = holdings.find((holding) => holding.symbol === quote.symbol);
  if (!existing) {
    return [
      ...holdings,
      {
        symbol: quote.symbol,
        name: quote.name || quote.symbol,
        shares: quantity,
        avgPriceCents: priceCents,
        lastPrice: quote.price,
      },
    ];
  }

  const totalShares = existing.shares + quantity;
  const totalCostCents = existing.avgPriceCents * existing.shares + priceCents * quantity;

  return holdings.map((holding) =>
    holding.symbol === quote.symbol
      ? {
          ...holding,
          name: quote.name || holding.name,
          shares: totalShares,
          avgPriceCents: Math.round(totalCostCents / totalShares),
          lastPrice: quote.price,
        }
      : holding
  );
}

function formatTradeTime(timestamp) {
  if (!timestamp) return "Unknown time";

  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) return "Unknown time";

  return value.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function TradeConfirmModal({ trade, busy, onCancel, onConfirm }) {
  if (!trade) return null;

  const actionLabel = trade.type === "sell" ? "Sell" : "Buy";
  const totalValue = trade.priceCents * trade.quantity;

  return (
    <div className="trade-modal-backdrop" role="presentation">
      <div className="trade-modal">
        <p className="trade-modal-eyebrow">{actionLabel} Confirmation</p>
        <h2>{actionLabel} {trade.symbol}</h2>
        <div className="trade-modal-grid">
          <div className="trade-modal-item">
            <span>Shares</span>
            <b>{trade.quantity}</b>
          </div>
          <div className="trade-modal-item">
            <span>Price</span>
            <b>{formatUSD(trade.priceCents)}</b>
          </div>
          <div className="trade-modal-item">
            <span>Total</span>
            <b>{formatUSD(totalValue)}</b>
          </div>
        </div>
        <p className="muted-copy">
          {trade.type === "sell"
            ? "This will remove shares from the position and credit your wallet."
            : "This will use funds from your wallet and add shares to your holdings."}
        </p>
        <div className="trade-modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={onConfirm} disabled={busy}>
            {busy ? "Processing..." : `${actionLabel} Stock`}
          </button>
        </div>
      </div>
    </div>
  );
}

function StockLookupPanel({ canBuy, onBuy, purchaseBusy }) {
  const [queryText, setQueryText] = useState("");
  const [results, setResults] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [quote, setQuote] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState("1");

  async function runSearch(event) {
    event.preventDefault();
    setError("");
    setQuote(null);
    setSelectedSymbol("");

    const q = queryText.trim();
    if (!q) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      const items = await marketApi.searchStocks(q);
      setResults(items);

      if (items.length > 0) {
        await loadQuote(items[0].symbol);
      }
    } catch (err) {
      setError(err.message || "Failed to search symbols.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function loadQuote(symbol) {
    try {
      setLoadingQuote(true);
      setSelectedSymbol(symbol);
      const data = await marketApi.getStockQuote(symbol);
      setQuote(data);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load quote.");
      setQuote(null);
    } finally {
      setLoadingQuote(false);
    }
  }

  async function handleBuy() {
    const parsedQuantity = Number.parseInt(quantity, 10);
    if (!quote || !Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      setError("Enter a valid whole-share quantity.");
      return;
    }

    try {
      setError("");
      await onBuy?.(quote, parsedQuantity);
      setQuantity("1");
    } catch (err) {
      setError(err.message || "Unable to complete purchase.");
    }
  }

  const change = quote?.change;
  const isUp = typeof change === "number" ? change >= 0 : null;
  const parsedQuantity = Number.parseInt(quantity, 10);
  const estimatedTotal =
    quote && Number.isInteger(parsedQuantity) && parsedQuantity > 0
      ? quote.price * parsedQuantity
      : null;

  return (
    <section className="panel lift-in">
      <div className="panel-title-row">
        <h2>Stock Lookup</h2>
        <span className="muted-copy">US Stocks Only</span>
      </div>

      <form className="stock-search-form" onSubmit={runSearch}>
        <input
          className="stock-input"
          placeholder="Search symbol or company name (e.g. AAPL, Apple)"
          value={queryText}
          onChange={(event) => setQueryText(event.target.value)}
        />
        <button className="btn-primary stock-search-btn" type="submit" disabled={searching}>
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="message error">{error}</p>}

      {results.length > 0 && (
        <div className="stock-results-grid">
          {results.map((item) => (
            <button
              key={item.symbol}
              className={`stock-result-pill ${selectedSymbol === item.symbol ? "active" : ""}`}
              onClick={() => loadQuote(item.symbol)}
              type="button"
            >
              <b>{item.symbol}</b>
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      )}

      {(loadingQuote || quote) && (
        <div className="quote-card">
          {loadingQuote && <p className="muted-copy">Loading quote...</p>}

          {!loadingQuote && quote && (
            <>
              <div className="quote-header">
                <div>
                  <p className="quote-symbol">{quote.symbol}</p>
                  <p className="muted-copy">{quote.name || quote.exchange}</p>
                </div>
                <div className="quote-price-wrap">
                  <p className="quote-price">{formatMoney(quote.price)}</p>
                  <p className={`quote-change ${isUp === null ? "" : isUp ? "up" : "down"}`}>
                    {typeof quote.change === "number" ? `${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)}` : "-"}
                    {" "}
                    {typeof quote.changePercent === "number"
                      ? `(${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%)`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="quote-grid">
                <div className="quote-item">
                  <span>Day Low</span>
                  <b>{formatMoney(quote.dayLow)}</b>
                </div>
                <div className="quote-item">
                  <span>Day High</span>
                  <b>{formatMoney(quote.dayHigh)}</b>
                </div>
                <div className="quote-item">
                  <span>Previous Close</span>
                  <b>{formatMoney(quote.previousClose)}</b>
                </div>
                <div className="quote-item">
                  <span>Volume</span>
                  <b>{formatNumber(quote.volume)}</b>
                </div>
              </div>

              {canBuy && (
                <div className="buy-panel">
                  <label className="buy-quantity-field">
                    <span>Shares</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                    />
                  </label>
                  <div className="buy-summary">
                    <span>Estimated total</span>
                    <b>{estimatedTotal ? formatMoney(estimatedTotal) : "-"}</b>
                  </div>
                  <button
                    className="btn-primary buy-stock-btn"
                    type="button"
                    onClick={handleBuy}
                    disabled={purchaseBusy}
                  >
                    {purchaseBusy ? "Processing..." : "Buy Stock"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function HoldingsPanel({ holdings, visible, onSell, saleBusySymbol }) {
  const normalizedHoldings = normalizeHoldings(holdings);
  const [sellQuantities, setSellQuantities] = useState({});

  if (!visible) return null;

  function getSellQuantity(symbol) {
    return sellQuantities[symbol] || "1";
  }

  function updateSellQuantity(symbol, value) {
    setSellQuantities((current) => ({
      ...current,
      [symbol]: value,
    }));
  }

  async function handleSell(symbol) {
    const parsedQuantity = Number.parseInt(getSellQuantity(symbol), 10);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return;
    }

    await onSell?.(symbol, parsedQuantity);
    updateSellQuantity(symbol, "1");
  }

  return (
    <section className="panel lift-in holdings-panel">
      <div className="panel-title-row">
        <h2>Your Holdings</h2>
        <span className="muted-copy">{normalizedHoldings.length} positions</span>
      </div>

      {normalizedHoldings.length === 0 ? (
        <p className="muted-copy">You have not purchased any stocks yet.</p>
      ) : (
        <div className="holdings-list">
          {normalizedHoldings.map((holding) => {
            const marketValue =
              typeof holding.lastPrice === "number"
                ? holding.lastPrice * holding.shares
                : (holding.avgPriceCents / 100) * holding.shares;

            return (
              <article key={holding.symbol} className="holding-row">
                <div className="holding-main">
                  <div>
                    <p className="holding-symbol">{holding.symbol}</p>
                    <p className="muted-copy">{holding.name}</p>
                  </div>
                  <span className="holding-shares">{holding.shares} shares</span>
                </div>
                <div className="holding-stats">
                  <div>
                    <span>Avg Cost</span>
                    <b>{formatUSD(holding.avgPriceCents)}</b>
                  </div>
                  <div>
                    <span>Position Value</span>
                    <b>{formatMoney(marketValue)}</b>
                  </div>
                </div>
                <div className="holding-actions">
                  <label className="holding-quantity-field">
                    <span>Sell Shares</span>
                    <input
                      type="number"
                      min="1"
                      max={holding.shares}
                      step="1"
                      value={getSellQuantity(holding.symbol)}
                      onChange={(event) => updateSellQuantity(holding.symbol, event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-secondary holding-action-btn"
                    onClick={() => handleSell(holding.symbol)}
                    disabled={saleBusySymbol === holding.symbol}
                  >
                    {saleBusySymbol === holding.symbol ? "Selling..." : "Sell Stock"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TransactionHistoryPanel({ tradeHistory }) {
  const normalizedTrades = normalizeTradeHistory(tradeHistory);

  return (
    <section className="panel lift-in delay-1">
      <div className="panel-title-row">
        <h2>Transaction History</h2>
        <span className="muted-copy">{normalizedTrades.length} trades</span>
      </div>

      {normalizedTrades.length === 0 ? (
        <p className="muted-copy">No trades have been placed yet.</p>
      ) : (
        <div className="transaction-list">
          {normalizedTrades.map((trade, index) => {
            const totalValue = trade.priceCents * trade.quantity;
            return (
              <article key={`${trade.symbol}-${trade.executedAt || index}`} className="transaction-row">
                <div className="transaction-main">
                  <div>
                    <p className="holding-symbol">{trade.symbol}</p>
                    <p className="muted-copy">{trade.name}</p>
                  </div>
                  <span className={`transaction-badge ${trade.type === "sell" ? "sell" : "buy"}`}>
                    {trade.type === "sell" ? "Sell" : "Buy"}
                  </span>
                </div>
                <div className="transaction-stats">
                  <div>
                    <span>Shares</span>
                    <b>{trade.quantity}</b>
                  </div>
                  <div>
                    <span>Price</span>
                    <b>{formatUSD(trade.priceCents)}</b>
                  </div>
                  <div>
                    <span>Total</span>
                    <b>{formatUSD(totalValue)}</b>
                  </div>
                  <div>
                    <span>Placed</span>
                    <b>{formatTradeTime(trade.executedAt)}</b>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TeacherDashboard({ profile }) {
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStudents() {
      setLoadingStudents(true);
      setError("");

      if (!profile?.classCode) {
        setStudents([]);
        setLoadingStudents(false);
        return;
      }

      try {
        const usersRef = collection(db, "users");
        const rosterQuery = query(usersRef, where("classCode", "==", profile.classCode));
        const snapshot = await getDocs(rosterQuery);

        const roster = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item) => item.accountType === "student")
          .sort((left, right) => {
            const leftName = `${left.lastName || ""} ${left.firstName || ""}`.trim();
            const rightName = `${right.lastName || ""} ${right.firstName || ""}`.trim();
            return leftName.localeCompare(rightName);
          });

        setStudents(roster);
      } catch (err) {
        setError("Failed to load class roster.");
      } finally {
        setLoadingStudents(false);
      }
    }

    loadStudents();
  }, [profile?.classCode]);

  const totalStudents = students.length;
  const totalWalletCents = students.reduce((sum, item) => sum + (item.walletCents || 0), 0);
  const avgWalletCents = totalStudents ? Math.round(totalWalletCents / totalStudents) : 0;
  const fundedStudents = students.filter((item) => (item.walletCents || 0) >= STARTING_CASH_CENTS).length;

  return (
    <div className="dashboard-content">
      <section className="panel lift-in">
        <div className="panel-title-row">
          <h2>Class Overview</h2>
          <span className="join-code-chip">Join Code: {profile?.classCode || "Not set"}</span>
        </div>

        <div className="metrics-grid">
          <article className="metric-card">
            <p className="metric-label">Students</p>
            <p className="metric-value">{totalStudents}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Combined Wallets</p>
            <p className="metric-value">{formatUSD(totalWalletCents)}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Average Wallet</p>
            <p className="metric-value">{formatUSD(avgWalletCents)}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Funded at 10,000</p>
            <p className="metric-value">{fundedStudents}</p>
          </article>
        </div>
      </section>

      <section className="panel lift-in delay-1">
        <div className="panel-title-row">
          <h2>Student Wallets</h2>
          {!loadingStudents && !error && <span className="muted-copy">{students.length} in roster</span>}
        </div>

        {loadingStudents && <p className="muted-copy">Loading class roster...</p>}
        {error && <p className="message error">{error}</p>}

        {!loadingStudents && !error && students.length === 0 && (
          <p className="muted-copy">No students have joined this class yet.</p>
        )}

        {!loadingStudents && !error && students.length > 0 && (
          <div className="roster-table-wrap">
            <table className="roster-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Wallet</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase() || "ST";
                  return (
                    <tr key={student.id}>
                      <td>
                        <div className="student-cell">
                          <span className="student-avatar">{initials}</span>
                          <span>
                            {student.firstName} {student.lastName}
                          </span>
                        </div>
                      </td>
                      <td>{student.email || "-"}</td>
                      <td>
                        <span className="wallet-pill">{formatUSD(student.walletCents || STARTING_CASH_CENTS)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StudentDashboard({ user, profile, refreshProfile }) {
  const [showHoldings, setShowHoldings] = useState(false);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [saleBusySymbol, setSaleBusySymbol] = useState("");
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const [purchaseError, setPurchaseError] = useState("");
  const [pendingTrade, setPendingTrade] = useState(null);
  const walletCents = profile?.walletCents ?? STARTING_CASH_CENTS;
  const holdings = normalizeHoldings(profile?.holdings);
  const holdingsCount = holdings.length;
  const tradeHistory = Array.isArray(profile?.tradeHistory) ? profile.tradeHistory : [];

  function requestBuyStock(quote, quantity) {
    if (!user?.uid) {
      throw new Error("You must be signed in to buy stocks.");
    }

    if (typeof quote?.price !== "number" || quote.price <= 0) {
      throw new Error("Quote price is unavailable.");
    }

    const priceCents = Math.round(quote.price * 100);
    const totalCostCents = priceCents * quantity;

    if (totalCostCents > walletCents) {
      throw new Error("You do not have enough in your wallet for this purchase.");
    }

    setPendingTrade({
      type: "buy",
      symbol: quote.symbol,
      name: quote.name || quote.symbol,
      quantity,
      priceCents,
      quote,
    });
  }

  async function handleBuyStock(trade) {
    const { quote, quantity, priceCents } = trade;
    const totalCostCents = priceCents * quantity;

    setPurchaseBusy(true);
    setPurchaseError("");
    setPurchaseMessage("");

    try {
      const nextHoldings = mergeHolding(holdings, quote, quantity, priceCents);
      const nextWalletCents = walletCents - totalCostCents;
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        walletCents: nextWalletCents,
        holdings: nextHoldings,
        tradeHistory: [
          ...tradeHistory,
          {
            type: "buy",
            symbol: quote.symbol,
            name: quote.name || quote.symbol,
            quantity,
            priceCents,
            executedAt: new Date().toISOString(),
          },
        ],
      });

      await refreshProfile();
      setShowHoldings(true);
      setPurchaseMessage(`Purchased ${quantity} share${quantity === 1 ? "" : "s"} of ${quote.symbol}.`);
      setPendingTrade(null);
    } catch (error) {
      setPurchaseError(error.message || "Purchase failed.");
      throw error;
    } finally {
      setPurchaseBusy(false);
    }
  }

  async function requestSellStock(symbol, quantity) {
    if (!user?.uid) {
      throw new Error("You must be signed in to sell stocks.");
    }

    const holding = holdings.find((item) => item.symbol === symbol);
    if (!holding) {
      throw new Error("You do not hold this stock.");
    }

    if (quantity > holding.shares) {
      throw new Error("You cannot sell more shares than you own.");
    }

    const quote = await marketApi.getStockQuote(symbol);
    if (typeof quote?.price !== "number" || quote.price <= 0) {
      throw new Error("Current quote is unavailable for this stock.");
    }

    setPendingTrade({
      type: "sell",
      symbol,
      name: holding.name,
      quantity,
      priceCents: Math.round(quote.price * 100),
      quote,
    });
  }

  async function handleSellStock(trade) {
    const { symbol, quantity, quote, priceCents } = trade;

    setSaleBusySymbol(symbol);
    setPurchaseError("");
    setPurchaseMessage("");

    try {
      const proceedsCents = priceCents * quantity;
      const nextHoldings = holdings
        .map((item) =>
          item.symbol === symbol
            ? {
                ...item,
                shares: item.shares - quantity,
                lastPrice: quote.price,
              }
            : item
        )
        .filter((item) => item.shares > 0);

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        walletCents: walletCents + proceedsCents,
        holdings: nextHoldings,
        tradeHistory: [
          ...tradeHistory,
          {
            type: "sell",
            symbol,
            name: quote.name || symbol,
            quantity,
            priceCents,
            executedAt: new Date().toISOString(),
          },
        ],
      });

      await refreshProfile();
      setPurchaseMessage(`Sold ${quantity} share${quantity === 1 ? "" : "s"} of ${symbol}.`);
      setPendingTrade(null);
    } catch (error) {
      setPurchaseError(error.message || "Sale failed.");
      throw error;
    } finally {
      setSaleBusySymbol("");
    }
  }

  return (
    <div className="dashboard-content">
      <StockLookupPanel
        canBuy
        onBuy={requestBuyStock}
        purchaseBusy={purchaseBusy}
      />

      <div className="dashboard-content two-col">
        <button
          type="button"
          className={`panel wallet-hero wallet-card-button lift-in ${showHoldings ? "active" : ""}`}
          onClick={() => setShowHoldings((current) => !current)}
        >
          <p className="metric-label">Current Wallet</p>
          <p className="wallet-hero-value">{formatUSD(walletCents)}</p>
          <p className="muted-copy">Class: {profile?.classCode || "Not joined"}</p>
          <p className="wallet-card-hint">
            {showHoldings ? "Hide your holdings" : "Click to view your holdings"}
          </p>
        </button>

        <section className="panel lift-in delay-1">
          <h2>Account Snapshot</h2>
          <div className="info-stack">
            <div className="info-row">
              <span>Starting Balance</span>
              <b>{formatUSD(STARTING_CASH_CENTS)}</b>
            </div>
            <div className="info-row">
              <span>Current Balance</span>
              <b>{formatUSD(walletCents)}</b>
            </div>
            <div className="info-row">
              <span>Current Holdings</span>
              <b>{holdingsCount} positions</b>
            </div>
          </div>
          {purchaseMessage && <p className="message success">{purchaseMessage}</p>}
          {purchaseError && <p className="message error">{purchaseError}</p>}
        </section>
      </div>

      <HoldingsPanel
        holdings={holdings}
        visible={showHoldings}
        onSell={requestSellStock}
        saleBusySymbol={saleBusySymbol}
      />

      <TransactionHistoryPanel tradeHistory={tradeHistory} />

      <TradeConfirmModal
        trade={pendingTrade}
        busy={purchaseBusy || Boolean(saleBusySymbol)}
        onCancel={() => setPendingTrade(null)}
        onConfirm={() => {
          if (!pendingTrade) return;
          if (pendingTrade.type === "sell") {
            handleSellStock(pendingTrade);
            return;
          }
          handleBuyStock(pendingTrade);
        }}
      />
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="dashboard-content two-col">
      <section className="panel lift-in">
        <h2>Administrator</h2>
        <p className="muted-copy">Admin tools are ready for API integration in the next step.</p>
      </section>
      <section className="panel lift-in delay-1">
        <h2>Platform Health</h2>
        <p className="muted-copy">Connection widgets can be added here once backend APIs are connected.</p>
      </section>
    </div>
  );
}

export default function Dashboard({ onSettingsClick}) {
  const { user, profile, logout, refreshProfile } = useAuth();

  return (
    <div className="dashboard-root">
      <header className="dashboard-topbar lift-in">
        <div>
          <h1 className="dashboard-title">iLa Dashboard</h1>
          <p className="dashboard-welcome">Welcome, {getDisplayName(profile, user)}</p>
        </div>

        <div className="dashboard-actions">
          <span className="role-badge">{getRoleLabel(profile?.accountType)}</span>
          <button className="btn-danger dashboard-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {profile?.accountType === "teacher" && <TeacherDashboard profile={profile} />}
      {profile?.accountType === "student" && (
        <StudentDashboard
          user={user}
          profile={profile}
          refreshProfile={refreshProfile}
        />
      )}
      {profile?.accountType === "admin" && <AdminDashboard />}
      {!profile?.accountType && (
        <section className="panel lift-in">
          <p className="muted-copy">Setting up your dashboard...</p>
        </section>
      )}

    </div>
  );
}

