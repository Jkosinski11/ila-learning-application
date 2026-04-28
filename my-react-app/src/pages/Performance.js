import { useState } from "react";
import { useAuth } from "../AuthContext";
import { formatUSD, STARTING_CASH_CENTS } from "../models/contracts";
import "./Performance.css";

// ── Mock data (replace with real Firestore data later) ──
const MOCK_CHART = [
  { day: "Mon", value: 10000 },
  { day: "Tue", value: 10240 },
  { day: "Wed", value: 10180 },
  { day: "Thu", value: 10560 },
  { day: "Fri", value: 10420 },
  { day: "Mon", value: 10800 },
  { day: "Tue", value: 11200 },
  { day: "Wed", value: 11050 },
  { day: "Thu", value: 11480 },
  { day: "Fri", value: 11750 },
];

const MOCK_LEADERBOARD = [
  { name: "Mia Chen",     wallet: 13200, change: +32.0, avatar: "MC" },
  { name: "Jordan Lee",   wallet: 12800, change: +28.0, avatar: "JL" },
  { name: "You",          wallet: 11750, change: +17.5, avatar: "ME", isMe: true },
  { name: "Sam Rivera",   wallet: 11200, change: +12.0, avatar: "SR" },
  { name: "Alex Kim",     wallet: 10900, change: +9.0,  avatar: "AK" },
  { name: "Taylor Brown", wallet: 10200, change: +2.0,  avatar: "TB" },
];

const MOCK_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.",    gain: +1250, pct: +12.5, shares: 5  },
  { symbol: "TSLA", name: "Tesla Inc.",    gain: +840,  pct: +8.4,  shares: 3  },
  { symbol: "NVDA", name: "Nvidia Corp.",  gain: -320,  pct: -3.2,  shares: 2  },
  { symbol: "META", name: "Meta Platforms",gain: -150,  pct: -1.5,  shares: 4  },
];

const MOCK_TRADES = [
  { type: "buy",  symbol: "AAPL", shares: 5, price: 175.20, date: "Apr 22" },
  { type: "buy",  symbol: "TSLA", shares: 3, price: 242.50, date: "Apr 20" },
  { type: "sell", symbol: "GOOGL",shares: 2, price: 162.80, date: "Apr 18" },
  { type: "buy",  symbol: "NVDA", shares: 2, price: 480.00, date: "Apr 15" },
  { type: "buy",  symbol: "META", shares: 4, price: 510.00, date: "Apr 10" },
];

const BADGES = [
  { id: "first",    emoji: "🎯", label: "First Trade",     earned: true  },
  { id: "profit",   emoji: "💰", label: "In the Green",    earned: true  },
  { id: "diverse",  emoji: "⚖️", label: "Diversified",     earned: true  },
  { id: "streak",   emoji: "🔥", label: "7-Day Streak",    earned: false },
  { id: "big",      emoji: "🐋", label: "Whale Investor",  earned: false },
  { id: "scholar",  emoji: "🎓", label: "Stock Scholar",   earned: false },
];

// ── Mini sparkline chart ──
function SparkLine({ data, positive }) {
  const vals = data.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 280, H = 80;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 10) - 5;
    return `${x},${y}`;
  });
  const color = positive ? "#16a34a" : "#dc2626";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="spark-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Section header ──
function SectionHead({ emoji, title }) {
  return (
    <div className="perf-section-head">
      <span className="section-emoji">{emoji}</span>
      <h2 className="section-title">{title}</h2>
    </div>
  );
}

export default function Performance() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const walletCents  = profile?.walletCents ?? STARTING_CASH_CENTS;
  const gainCents    = walletCents - STARTING_CASH_CENTS;
  const gainPct      = ((gainCents / STARTING_CASH_CENTS) * 100).toFixed(1);
  const isUp         = gainCents >= 0;
  const myRank       = MOCK_LEADERBOARD.findIndex(l => l.isMe) + 1;

  const bestStock  = [...MOCK_STOCKS].sort((a, b) => b.gain - a.gain)[0];
  const worstStock = [...MOCK_STOCKS].sort((a, b) => a.gain - b.gain)[0];
  const earnedBadges = BADGES.filter(b => b.earned).length;

  const TABS = ["overview", "stocks", "leaderboard", "badges"];

  return (
    <div className="perf-root">

      {/* ── Top hero ── */}
      <div className="perf-hero">
        <div className="hero-label">Total Profit / Loss</div>
        <div className={`hero-amount ${isUp ? "up" : "down"}`}>
          {isUp ? "+" : ""}{formatUSD(Math.abs(gainCents))}
        </div>
        <div className={`hero-pct ${isUp ? "up" : "down"}`}>
          {isUp ? "▲" : "▼"} {Math.abs(gainPct)}% from starting balance
        </div>

        {/* sparkline */}
        <div className="hero-chart">
          <SparkLine data={MOCK_CHART} positive={isUp} />
        </div>

        {/* mini stats */}
        <div className="hero-stats">
          <div className="hero-stat">
            <span>Current Balance</span>
            <b>{formatUSD(walletCents)}</b>
          </div>
          <div className="hero-stat">
            <span>Started With</span>
            <b>{formatUSD(STARTING_CASH_CENTS)}</b>
          </div>
          <div className="hero-stat">
            <span>Class Rank</span>
            <b>#{myRank}</b>
          </div>
          <div className="hero-stat">
            <span>Badges</span>
            <b>{earnedBadges} / {BADGES.length}</b>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="perf-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`perf-tab ${activeTab === t ? "active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="perf-content">

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <>
            {/* Best & Worst */}
            <SectionHead emoji="🏅" title="Best & Worst Investments" />
            <div className="bw-grid">
              <div className="bw-card best">
                <div className="bw-tag">🚀 Best</div>
                <div className="bw-symbol">{bestStock.symbol}</div>
                <div className="bw-name">{bestStock.name}</div>
                <div className="bw-gain">+{formatUSD(bestStock.gain * 100)}</div>
                <div className="bw-pct">+{bestStock.pct}%</div>
              </div>
              <div className="bw-card worst">
                <div className="bw-tag">📉 Worst</div>
                <div className="bw-symbol">{worstStock.symbol}</div>
                <div className="bw-name">{worstStock.name}</div>
                <div className="bw-gain">{formatUSD(worstStock.gain * 100)}</div>
                <div className="bw-pct">{worstStock.pct}%</div>
              </div>
            </div>

            {/* Learning Insights */}
            <SectionHead emoji="🧠" title="Learning Insights" />
            <div className="insights-list">
              <div className="insight-card">
                <span className="insight-icon">💡</span>
                <div>
                  <p className="insight-title">You're up {gainPct}%!</p>
                  <p className="insight-desc">The S&P 500 average annual return is ~10%. You're {isUp ? "beating" : "below"} the average.</p>
                </div>
              </div>
              <div className="insight-card">
                <span className="insight-icon">🎯</span>
                <div>
                  <p className="insight-title">Diversification Score</p>
                  <p className="insight-desc">You hold {MOCK_STOCKS.length} different stocks. Aim for 5+ to reduce risk!</p>
                </div>
              </div>
              <div className="insight-card">
                <span className="insight-icon">📅</span>
                <div>
                  <p className="insight-title">Total Trades</p>
                  <p className="insight-desc">You've placed {MOCK_TRADES.length} trades. Active investors learn faster!</p>
                </div>
              </div>
            </div>

            {/* Trade History */}
            <SectionHead emoji="📋" title="Trade History" />
            <div className="trade-list">
              {MOCK_TRADES.map((t, i) => (
                <div key={i} className="trade-row">
                  <span className={`trade-badge ${t.type}`}>{t.type === "buy" ? "BUY" : "SELL"}</span>
                  <div className="trade-info">
                    <p className="trade-symbol">{t.symbol}</p>
                    <p className="trade-detail">{t.shares} shares · {t.date}</p>
                  </div>
                  <div className="trade-price">${t.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── STOCKS ── */}
        {activeTab === "stocks" && (
          <>
            <SectionHead emoji="📊" title="Profit / Loss Per Stock" />
            <div className="stocks-list">
              {MOCK_STOCKS.map((s, i) => {
                const isPos = s.gain >= 0;
                const barWidth = Math.min(Math.abs(s.pct) * 5, 100);
                return (
                  <div key={i} className="stock-perf-row">
                    <div className="stock-perf-top">
                      <div>
                        <span className="stock-perf-symbol">{s.symbol}</span>
                        <span className="stock-perf-name">{s.name}</span>
                      </div>
                      <div className="stock-perf-right">
                        <span className={`stock-perf-gain ${isPos ? "up" : "down"}`}>
                          {isPos ? "+" : ""}{formatUSD(s.gain * 100)}
                        </span>
                        <span className={`stock-perf-pct ${isPos ? "up" : "down"}`}>
                          {isPos ? "+" : ""}{s.pct}%
                        </span>
                      </div>
                    </div>
                    <div className="stock-perf-bar-track">
                      <div
                        className={`stock-perf-bar ${isPos ? "up" : "down"}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <p className="stock-perf-shares">{s.shares} shares held</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── LEADERBOARD ── */}
        {activeTab === "leaderboard" && (
          <>
            <SectionHead emoji="🏆" title="Class Leaderboard" />
            <div className="leaderboard-list">
              {MOCK_LEADERBOARD.map((entry, i) => (
                <div key={i} className={`lb-row ${entry.isMe ? "me" : ""}`}>
                  <div className={`lb-rank rank-${i + 1}`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </div>
                  <div className={`lb-avatar ${entry.isMe ? "me-avatar" : ""}`}>{entry.avatar}</div>
                  <div className="lb-info">
                    <p className="lb-name">{entry.name}{entry.isMe ? " (You)" : ""}</p>
                    <p className="lb-wallet">{formatUSD(entry.wallet * 100)}</p>
                  </div>
                  <div className={`lb-change ${entry.change >= 0 ? "up" : "down"}`}>
                    {entry.change >= 0 ? "+" : ""}{entry.change}%
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── BADGES ── */}
        {activeTab === "badges" && (
          <>
            <SectionHead emoji="🎖️" title="Achievements & Badges" />
            <p className="badges-sub">{earnedBadges} of {BADGES.length} earned</p>
            <div className="badges-grid">
              {BADGES.map(b => (
                <div key={b.id} className={`badge-card ${b.earned ? "earned" : "locked"}`}>
                  <div className="badge-emoji">{b.emoji}</div>
                  <p className="badge-label">{b.label}</p>
                  {!b.earned && <p className="badge-locked">🔒 Locked</p>}
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {/* bottom padding for nav */}
      <div style={{ height: "80px" }} />
    </div>
  );
}