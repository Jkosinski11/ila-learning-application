import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
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

function StockLookupPanel() {
  const [queryText, setQueryText] = useState("");
  const [results, setResults] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [quote, setQuote] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [error, setError] = useState("");

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
        loadQuote(items[0].symbol);
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

  const change = quote?.change;
  const isUp = typeof change === "number" ? change >= 0 : null;

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
          onChange={(e) => setQueryText(e.target.value)}
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
            </>
          )}
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
        const q = query(usersRef, where("classCode", "==", profile.classCode));
        const snapshot = await getDocs(q);

        const roster = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item) => item.accountType === "student")
          .sort((a, b) => {
            const aName = `${a.lastName || ""} ${a.firstName || ""}`.trim();
            const bName = `${b.lastName || ""} ${b.firstName || ""}`.trim();
            return aName.localeCompare(bName);
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

  const metrics = useMemo(() => {
    const totalStudents = students.length;
    const totalWalletCents = students.reduce((sum, item) => sum + (item.walletCents || 0), 0);
    const avgWalletCents = totalStudents ? Math.round(totalWalletCents / totalStudents) : 0;
    const fundedStudents = students.filter((item) => (item.walletCents || 0) >= STARTING_CASH_CENTS).length;

    return {
      totalStudents,
      totalWalletCents,
      avgWalletCents,
      fundedStudents,
    };
  }, [students]);

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
            <p className="metric-value">{metrics.totalStudents}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Combined Wallets</p>
            <p className="metric-value">{formatUSD(metrics.totalWalletCents)}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Average Wallet</p>
            <p className="metric-value">{formatUSD(metrics.avgWalletCents)}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Funded at 10,000</p>
            <p className="metric-value">{metrics.fundedStudents}</p>
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

function StudentDashboard({ profile }) {
  const walletCents = profile?.walletCents ?? STARTING_CASH_CENTS;

  return (
    <div className="dashboard-content two-col">
      <section className="panel wallet-hero lift-in">
        <p className="metric-label">Current Wallet</p>
        <p className="wallet-hero-value">{formatUSD(walletCents)}</p>
        <p className="muted-copy">Class: {profile?.classCode || "Not joined"}</p>
      </section>

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
            <span>Class Code</span>
            <b>{profile?.classCode || "N/A"}</b>
          </div>
        </div>
      </section>
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

export default function Dashboard() {
  const { user, profile, logout } = useAuth();

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

      <StockLookupPanel />

      {profile?.accountType === "teacher" && <TeacherDashboard profile={profile} />}
      {profile?.accountType === "student" && <StudentDashboard profile={profile} />}
      {profile?.accountType === "admin" && <AdminDashboard />}
      {!profile?.accountType && (
        <section className="panel lift-in">
          <p className="muted-copy">Setting up your dashboard...</p>
        </section>
      )}
    </div>
  );
}
