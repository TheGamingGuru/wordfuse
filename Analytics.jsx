import { useState, useEffect, useCallback } from "react";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://zznhpbacuxeusaogvjtg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bmhwYmFjdXhldXNhb2d2anRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTY0NzEsImV4cCI6MjA4NzQzMjQ3MX0.PZCulp9d0aGF-OAv6_lkNGs6elB6Q3hYH7U4XniydLk';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PASSCODE = "wordfuse2026";

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0912;
    --surface: #13111f;
    --surface2: #1c1930;
    --surface3: #242040;
    --border: #2a2542;
    --accent: #e8c547;
    --accent2: #ff6b6b;
    --accent3: #7c6aff;
    --green: #52d68a;
    --blue: #5bc8f5;
    --text: #f0ede8;
    --text-muted: #8b8799;
    --text-dim: #5a5570;
    --font-display: 'Playfair Display', serif;
    --font-mono: 'DM Mono', monospace;
    --font-body: 'DM Sans', sans-serif;
  }

  html, body, #root {
    width: 100%; min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
  }

  .an-root {
    min-height: 100vh;
    background: var(--bg);
    background-image:
      radial-gradient(ellipse at 10% 0%, rgba(124,106,255,0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 90% 100%, rgba(82,214,138,0.07) 0%, transparent 50%);
  }

  /* ── LOGIN ── */
  .an-login {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 24px;
    padding: 20px;
  }
  .an-login-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 40px 36px;
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.4);
  }
  .an-login-title {
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: 900;
    color: var(--text);
  }
  .an-login-title span { color: var(--accent); }
  .an-login-sub {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: -12px;
  }
  .an-input {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
    font-family: var(--font-mono);
    font-size: 14px;
    color: var(--text);
    outline: none;
    letter-spacing: 2px;
    transition: border-color 0.2s;
  }
  .an-input:focus { border-color: var(--accent3); }
  .an-login-btn {
    width: 100%;
    padding: 13px;
    background: var(--accent);
    color: var(--bg);
    border: none;
    border-radius: 10px;
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.3px;
    transition: opacity 0.15s;
  }
  .an-login-btn:hover { opacity: 0.88; }
  .an-login-error {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--accent2);
    text-align: center;
    letter-spacing: 0.5px;
  }

  /* ── HEADER ── */
  .an-header {
    padding: 24px 32px 0;
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .an-logo {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 900;
    color: var(--text);
  }
  .an-logo span { color: var(--accent); }
  .an-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--accent3);
    background: rgba(124,106,255,0.12);
    border: 1px solid rgba(124,106,255,0.3);
    border-radius: 20px;
    padding: 4px 10px;
  }
  .an-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .an-refresh-btn {
    height: 34px;
    padding: 0 14px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .an-refresh-btn:hover { border-color: var(--accent); color: var(--accent); }
  .an-refresh-btn.spinning svg { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .an-last-updated {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 0.5px;
  }

  /* ── MAIN ── */
  .an-main {
    max-width: 1280px;
    margin: 0 auto;
    padding: 28px 32px 60px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  /* ── SECTION TITLE ── */
  .an-section-title {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 14px;
  }

  /* ── STAT CARDS ── */
  .an-stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 14px;
  }
  .an-stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px 20px 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s, transform 0.15s;
  }
  .an-stat-card:hover { border-color: var(--border); transform: translateY(-1px); }
  .an-stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--card-accent, var(--accent3));
    opacity: 0.7;
  }
  .an-stat-icon {
    font-size: 18px;
    line-height: 1;
  }
  .an-stat-value {
    font-family: var(--font-mono);
    font-size: 32px;
    font-weight: 500;
    color: var(--text);
    line-height: 1;
    letter-spacing: -1px;
  }
  .an-stat-label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .an-stat-delta {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--green);
    margin-top: 2px;
  }

  /* ── CHART CARD ── */
  .an-chart-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
  }
  .an-chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .an-chart-title {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .an-chart-tabs {
    display: flex;
    gap: 4px;
  }
  .an-chart-tab {
    padding: 4px 10px;
    border-radius: 6px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid transparent;
    color: var(--text-dim);
    background: transparent;
    transition: all 0.15s;
  }
  .an-chart-tab.active {
    background: var(--surface3);
    border-color: var(--border);
    color: var(--text-muted);
  }
  .an-chart-tab:hover:not(.active) { color: var(--text-muted); }

  /* ── BAR CHART ── */
  .an-bar-chart {
    width: 100%;
    overflow-x: auto;
  }
  .an-bar-chart-inner {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 160px;
    min-width: 100%;
    padding-bottom: 28px;
    position: relative;
  }
  .an-bar-chart-inner::after {
    content: '';
    position: absolute;
    bottom: 28px; left: 0; right: 0;
    height: 1px;
    background: var(--border);
  }
  .an-bar-col {
    flex: 1;
    min-width: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    height: 100%;
    justify-content: flex-end;
    position: relative;
  }
  .an-bar {
    width: 100%;
    border-radius: 4px 4px 0 0;
    background: var(--accent3);
    opacity: 0.75;
    transition: opacity 0.15s, height 0.4s ease;
    cursor: default;
    position: relative;
  }
  .an-bar:hover { opacity: 1; }
  .an-bar-tooltip {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface3);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px 8px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    z-index: 10;
    transition: opacity 0.15s;
  }
  .an-bar:hover .an-bar-tooltip { opacity: 1; }
  .an-bar-label {
    position: absolute;
    bottom: 0;
    font-family: var(--font-mono);
    font-size: 8px;
    color: var(--text-dim);
    text-align: center;
    white-space: nowrap;
    transform: translateY(16px);
  }

  /* ── TWO COL ── */
  .an-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  @media (max-width: 768px) {
    .an-two-col { grid-template-columns: 1fr; }
    .an-main { padding: 20px 16px 60px; }
    .an-header { padding: 20px 16px 0; }
  }

  /* ── TABLE ── */
  .an-table-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }
  .an-table-header {
    padding: 18px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .an-table {
    width: 100%;
    border-collapse: collapse;
  }
  .an-table th {
    padding: 10px 16px;
    text-align: left;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
  }
  .an-table td {
    padding: 11px 16px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-muted);
    border-bottom: 1px solid rgba(46,37,66,0.5);
    vertical-align: middle;
  }
  .an-table tr:last-child td { border-bottom: none; }
  .an-table tr:hover td { background: rgba(255,255,255,0.015); }
  .an-table td.highlight { color: var(--text); font-weight: 500; }
  .an-table td.green { color: var(--green); }
  .an-table td.red { color: var(--accent2); }
  .an-table td.gold { color: var(--accent); }

  /* ── WIN RATE BAR ── */
  .an-win-bar-wrap {
    width: 100%;
    height: 5px;
    background: var(--surface3);
    border-radius: 3px;
    overflow: hidden;
    margin-top: 4px;
  }
  .an-win-bar-fill {
    height: 100%;
    border-radius: 3px;
    background: var(--green);
    transition: width 0.5s ease;
  }

  /* ── PILL ── */
  .an-pill {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 20px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.5px;
  }
  .an-pill-green { background: rgba(82,214,138,0.15); color: var(--green); }
  .an-pill-red { background: rgba(255,107,107,0.15); color: var(--accent2); }
  .an-pill-gold { background: rgba(232,197,71,0.15); color: var(--accent); }

  /* ── SPARKLINE ── */
  .an-sparkline {
    width: 60px;
    height: 24px;
    display: inline-block;
    vertical-align: middle;
  }

  /* ── DONUT ── */
  .an-donut-wrap {
    display: flex;
    align-items: center;
    gap: 28px;
    padding: 8px 0;
  }
  .an-donut-legend {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .an-donut-legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
  }
  .an-donut-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── LOADING / EMPTY ── */
  .an-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 160px;
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    gap: 10px;
  }
  .an-spinner {
    width: 18px; height: 18px;
    border: 2px solid var(--border);
    border-top-color: var(--accent3);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  .an-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 120px;
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1px;
  }

  /* ── HORIZONTAL BAR (difficulty) ── */
  .an-h-bar-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(46,37,66,0.5);
  }
  .an-h-bar-row:last-child { border-bottom: none; }
  .an-h-bar-date {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
    width: 90px;
    flex-shrink: 0;
  }
  .an-h-bar-track {
    flex: 1;
    height: 6px;
    background: var(--surface3);
    border-radius: 3px;
    overflow: hidden;
  }
  .an-h-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
  }
  .an-h-bar-pct {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
    width: 36px;
    text-align: right;
    flex-shrink: 0;
  }
`;

// ─── UTILS ───────────────────────────────────────────────────────────────────
const fmtTime = (s) => {
  if (!s && s !== 0) return "—";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const fmtNum = (n) => {
  if (n === null || n === undefined) return "—";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
};

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

// ─── SPARKLINE SVG ───────────────────────────────────────────────────────────
function Sparkline({ data, color = "#7c6aff", width = 60, height = 24 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} className="an-sparkline" style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── DONUT CHART ─────────────────────────────────────────────────────────────
function Donut({ win, lose, size = 100 }) {
  const total = win + lose;
  if (!total) return <div className="an-empty">No data</div>;
  const winPct = win / total;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const winDash = winPct * circ;
  return (
    <div className="an-donut-wrap">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface3)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r}
          fill="none" stroke="var(--green)" strokeWidth="10"
          strokeDasharray={`${winDash} ${circ}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x="50" y="47" textAnchor="middle" fill="var(--text)" fontFamily="DM Mono, monospace" fontSize="14" fontWeight="500">{pct(win, total)}%</text>
        <text x="50" y="60" textAnchor="middle" fill="var(--text-dim)" fontFamily="DM Mono, monospace" fontSize="7">win rate</text>
      </svg>
      <div className="an-donut-legend">
        <div className="an-donut-legend-item">
          <div className="an-donut-dot" style={{ background: "var(--green)" }} />
          <span>Won — <strong style={{ color: "var(--text)" }}>{fmtNum(win)}</strong></span>
        </div>
        <div className="an-donut-legend-item">
          <div className="an-donut-dot" style={{ background: "var(--accent2)" }} />
          <span>Lost — <strong style={{ color: "var(--text)" }}>{fmtNum(lose)}</strong></span>
        </div>
        <div className="an-donut-legend-item">
          <div className="an-donut-dot" style={{ background: "var(--text-dim)" }} />
          <span>Total — <strong style={{ color: "var(--text)" }}>{fmtNum(total)}</strong></span>
        </div>
      </div>
    </div>
  );
}

// ─── BAR CHART ───────────────────────────────────────────────────────────────
function BarChart({ data, color = "var(--accent3)", labelKey = "date", valueKey = "count" }) {
  if (!data || !data.length) return <div className="an-empty">No data yet</div>;
  const max = Math.max(...data.map(d => d[valueKey])) || 1;
  return (
    <div className="an-bar-chart">
      <div className="an-bar-chart-inner">
        {data.map((d, i) => {
          const heightPct = (d[valueKey] / max) * 100;
          const label = d[labelKey];
          const shortLabel = label?.length > 5 ? label.slice(5) : label; // strip year
          return (
            <div key={i} className="an-bar-col">
              <div
                className="an-bar"
                style={{ height: `${Math.max(heightPct, 2)}%`, background: color }}
              >
                <div className="an-bar-tooltip">{label}: {d[valueKey]}</div>
              </div>
              {(i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 10) === 0) && (
                <div className="an-bar-label">{shortLabel}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const attempt = () => {
    if (pass === PASSCODE) {
      onLogin();
    } else {
      setError("Incorrect passcode");
      setTimeout(() => setError(""), 2000);
    }
  };

  return (
    <div className="an-login">
      <div className="an-login-card">
        <div>
          <div className="an-login-title">Word<span>Fuse</span></div>
          <div className="an-login-sub" style={{ marginTop: 4 }}>Analytics Dashboard</div>
        </div>
        <input
          className="an-input"
          type="password"
          placeholder="Passcode"
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === "Enter" && attempt()}
          autoFocus
        />
        {error && <div className="an-login-error">{error}</div>}
        <button className="an-login-btn" onClick={attempt}>Enter Dashboard →</button>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Analytics() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("wf_admin") === "1");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [chartRange, setChartRange] = useState("30"); // "7" | "30" | "all"

  // ── Data state ──
  const [totals, setTotals] = useState(null);           // { games, wins, losses, players }
  const [dailyGames, setDailyGames] = useState([]);     // [{ date, count }]
  const [dailyWins, setDailyWins] = useState([]);       // [{ date, count }]
  const [puzzleStats, setPuzzleStats] = useState([]);   // per-puzzle difficulty
  const [topPlayers, setTopPlayers] = useState([]);     // top by streak / wins
  const [avgMetrics, setAvgMetrics] = useState(null);   // avg time, wrong guesses
  const [recentGames, setRecentGames] = useState([]);   // last 20 games

  const handleLogin = () => {
    sessionStorage.setItem("wf_admin", "1");
    setAuthed(true);
  };

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      // 1. All game results
      const { data: results } = await supabase
        .from("game_results")
        .select("*")
        .order("created_at", { ascending: false });

      const allResults = results || [];
      const wins = allResults.filter(r => r.completed);
      const losses = allResults.filter(r => !r.completed);
      const uniquePlayers = new Set(allResults.map(r => r.user_id)).size;

      setTotals({
        games: allResults.length,
        wins: wins.length,
        losses: losses.length,
        players: uniquePlayers,
      });

      // 2. Daily aggregation
      const byDate = {};
      const winByDate = {};
      allResults.forEach(r => {
        const d = r.puzzle_date || (r.created_at ? r.created_at.slice(0, 10) : null);
        if (!d) return;
        byDate[d] = (byDate[d] || 0) + 1;
        if (r.completed) winByDate[d] = (winByDate[d] || 0) + 1;
      });

      const sortedDates = Object.keys(byDate).sort();
      const dailyArr = sortedDates.map(d => ({ date: d, count: byDate[d] }));
      const dailyWinArr = sortedDates.map(d => ({ date: d, count: winByDate[d] || 0 }));
      setDailyGames(dailyArr);
      setDailyWins(dailyWinArr);

      // 3. Per-puzzle stats
      const puzzleMap = {};
      allResults.forEach(r => {
        const d = r.puzzle_date;
        if (!d) return;
        if (!puzzleMap[d]) puzzleMap[d] = { date: d, total: 0, wins: 0, totalTime: 0, totalWrong: 0 };
        puzzleMap[d].total++;
        if (r.completed) {
          puzzleMap[d].wins++;
          puzzleMap[d].totalTime += r.time_taken || 0;
        }
        puzzleMap[d].totalWrong += r.wrong_guesses || 0;
      });

      const pStats = Object.values(puzzleMap)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 20)
        .map(p => ({
          ...p,
          winRate: pct(p.wins, p.total),
          avgTime: p.wins ? Math.round(p.totalTime / p.wins) : 0,
          avgWrong: p.total ? (p.totalWrong / p.total).toFixed(1) : 0,
        }));
      setPuzzleStats(pStats);

      // 4. Average metrics (won games only)
      const wonWithTime = wins.filter(r => r.time_taken);
      const avgTime = wonWithTime.length
        ? Math.round(wonWithTime.reduce((s, r) => s + r.time_taken, 0) / wonWithTime.length)
        : null;
      const avgWrong = allResults.length
        ? (allResults.reduce((s, r) => s + (r.wrong_guesses || 0), 0) / allResults.length).toFixed(1)
        : null;
      setAvgMetrics({ avgTime, avgWrong });

      // 5. Recent games
      setRecentGames(allResults.slice(0, 25));

      // 6. Top players (from user_stats)
      const { data: statsData } = await supabase
        .from("user_stats")
        .select("*")
        .order("games_won", { ascending: false })
        .limit(10);
      setTopPlayers(statsData || []);

    } catch (err) {
      console.error("Analytics fetch error", err);
    } finally {
      setRefreshing(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [authed, fetchAll]);

  if (!authed) return (
    <>
      <style>{css}</style>
      <div className="an-root"><LoginScreen onLogin={handleLogin} /></div>
    </>
  );

  // ── Filter chart data by range ──
  const filterByRange = (arr) => {
    if (chartRange === "all" || !arr.length) return arr;
    const days = parseInt(chartRange);
    return arr.slice(-days);
  };

  const chartData = filterByRange(dailyGames);
  const chartWinData = filterByRange(dailyWins);

  // ── Today's numbers ──
  const today = new Date().toISOString().slice(0, 10);
  const todayGames = dailyGames.find(d => d.date === today)?.count || 0;
  const todayWins = dailyWins.find(d => d.date === today)?.count || 0;

  const winRateColor = (wr) => {
    if (wr >= 70) return "var(--green)";
    if (wr >= 40) return "var(--accent)";
    return "var(--accent2)";
  };

  return (
    <>
      <style>{css}</style>
      <div className="an-root">

        {/* HEADER */}
        <div className="an-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="an-logo">Word<span>Fuse</span></div>
            <div className="an-badge">Analytics</div>
          </div>
          <div className="an-header-right">
            {lastUpdated && (
              <div className="an-last-updated">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
            <button
              className={`an-refresh-btn ${refreshing ? "spinning" : ""}`}
              onClick={fetchAll}
              disabled={refreshing}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10.5 6A4.5 4.5 0 1 1 6 1.5" />
                <polyline points="10.5,1.5 10.5,4.5 7.5,4.5" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <div className="an-main">
          {loading ? (
            <div className="an-loading"><div className="an-spinner" /> Loading analytics…</div>
          ) : (
            <>
              {/* ── OVERVIEW STATS ── */}
              <div>
                <div className="an-section-title">Overview</div>
                <div className="an-stat-grid">
                  <div className="an-stat-card" style={{ "--card-accent": "var(--accent3)" }}>
                    <div className="an-stat-icon">🎮</div>
                    <div className="an-stat-value">{fmtNum(totals?.games)}</div>
                    <div className="an-stat-label">Total Games</div>
                    <div className="an-stat-delta">+{todayGames} today</div>
                  </div>
                  <div className="an-stat-card" style={{ "--card-accent": "var(--green)" }}>
                    <div className="an-stat-icon">✅</div>
                    <div className="an-stat-value">{fmtNum(totals?.wins)}</div>
                    <div className="an-stat-label">Games Won</div>
                    <div className="an-stat-delta">+{todayWins} today</div>
                  </div>
                  <div className="an-stat-card" style={{ "--card-accent": "var(--accent2)" }}>
                    <div className="an-stat-icon">❌</div>
                    <div className="an-stat-value">{fmtNum(totals?.losses)}</div>
                    <div className="an-stat-label">Games Lost</div>
                    <div className="an-stat-delta" style={{ color: "var(--text-dim)" }}>
                      {totals ? pct(totals.losses, totals.games) : 0}% loss rate
                    </div>
                  </div>
                  <div className="an-stat-card" style={{ "--card-accent": "var(--blue)" }}>
                    <div className="an-stat-icon">👥</div>
                    <div className="an-stat-value">{fmtNum(totals?.players)}</div>
                    <div className="an-stat-label">Unique Players</div>
                  </div>
                  <div className="an-stat-card" style={{ "--card-accent": "var(--accent)" }}>
                    <div className="an-stat-icon">⏱</div>
                    <div className="an-stat-value">{fmtTime(avgMetrics?.avgTime)}</div>
                    <div className="an-stat-label">Avg Win Time</div>
                  </div>
                  <div className="an-stat-card" style={{ "--card-accent": "var(--accent)" }}>
                    <div className="an-stat-icon">🔢</div>
                    <div className="an-stat-value">{avgMetrics?.avgWrong ?? "—"}</div>
                    <div className="an-stat-label">Avg Wrong Guesses</div>
                  </div>
                </div>
              </div>

              {/* ── DAILY CHART + DONUT ── */}
              <div className="an-two-col">
                <div className="an-chart-card" style={{ gridColumn: "1 / -1" }}>
                  <div className="an-chart-header">
                    <div className="an-chart-title">Daily Games Played</div>
                    <div className="an-chart-tabs">
                      {["7", "30", "all"].map(r => (
                        <button
                          key={r}
                          className={`an-chart-tab ${chartRange === r ? "active" : ""}`}
                          onClick={() => setChartRange(r)}
                        >
                          {r === "all" ? "All" : `${r}d`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <BarChart data={chartData} color="var(--accent3)" />
                </div>
              </div>

              {/* ── WIN RATE + TOP PLAYERS ── */}
              <div className="an-two-col">
                <div className="an-chart-card">
                  <div className="an-chart-header">
                    <div className="an-chart-title">Win / Loss Split</div>
                  </div>
                  <Donut win={totals?.wins || 0} lose={totals?.losses || 0} />
                </div>

                <div className="an-table-card">
                  <div className="an-table-header">
                    <div className="an-chart-title">Top Players by Wins</div>
                  </div>
                  {topPlayers.length === 0 ? (
                    <div className="an-empty">No player data</div>
                  ) : (
                    <table className="an-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Player ID</th>
                          <th>Wins</th>
                          <th>Streak 🔥</th>
                          <th>Best Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topPlayers.map((p, i) => (
                          <tr key={p.user_id}>
                            <td className="gold">{i + 1}</td>
                            <td className="highlight" style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
                              {p.user_id?.slice(0, 12)}…
                            </td>
                            <td className="green">{p.games_won}</td>
                            <td>{p.current_streak > 0 ? `${p.current_streak}🔥` : p.current_streak}</td>
                            <td className="gold">{fmtTime(p.best_time)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* ── PER-PUZZLE DIFFICULTY ── */}
              <div>
                <div className="an-section-title">Puzzle Difficulty (recent 20)</div>
                <div className="an-two-col">
                  <div className="an-chart-card">
                    <div className="an-chart-header">
                      <div className="an-chart-title">Win Rate by Puzzle Date</div>
                    </div>
                    {puzzleStats.length === 0 ? (
                      <div className="an-empty">No data yet</div>
                    ) : (
                      <div>
                        {puzzleStats.slice(0, 10).map(p => (
                          <div key={p.date} className="an-h-bar-row">
                            <div className="an-h-bar-date">{p.date.slice(5)}</div>
                            <div className="an-h-bar-track">
                              <div
                                className="an-h-bar-fill"
                                style={{
                                  width: `${p.winRate}%`,
                                  background: winRateColor(p.winRate),
                                }}
                              />
                            </div>
                            <div className="an-h-bar-pct">{p.winRate}%</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="an-table-card">
                    <div className="an-table-header">
                      <div className="an-chart-title">Puzzle Stats Detail</div>
                    </div>
                    {puzzleStats.length === 0 ? (
                      <div className="an-empty">No data yet</div>
                    ) : (
                      <table className="an-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Plays</th>
                            <th>Win %</th>
                            <th>Avg Time</th>
                            <th>Avg Wrong</th>
                          </tr>
                        </thead>
                        <tbody>
                          {puzzleStats.slice(0, 10).map(p => (
                            <tr key={p.date}>
                              <td className="highlight">{p.date}</td>
                              <td>{p.total}</td>
                              <td style={{ color: winRateColor(p.winRate) }}>{p.winRate}%</td>
                              <td className="gold">{fmtTime(p.avgTime)}</td>
                              <td>{p.avgWrong}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* ── RECENT ACTIVITY ── */}
              <div>
                <div className="an-section-title">Recent Game Activity</div>
                <div className="an-table-card">
                  <table className="an-table">
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Puzzle Date</th>
                        <th>Result</th>
                        <th>Time Taken</th>
                        <th>Wrong Guesses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentGames.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: "center" }}>No games yet</td></tr>
                      ) : recentGames.map((g, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
                            {g.user_id?.slice(0, 10)}…
                          </td>
                          <td className="highlight">{g.puzzle_date}</td>
                          <td>
                            <span className={`an-pill ${g.completed ? "an-pill-green" : "an-pill-red"}`}>
                              {g.completed ? "Won" : "Lost"}
                            </span>
                          </td>
                          <td className="gold">{fmtTime(g.time_taken)}</td>
                          <td style={{ color: g.wrong_guesses >= 4 ? "var(--accent2)" : "var(--text-muted)" }}>
                            {g.wrong_guesses ?? "—"} / 4
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </>
  );
}
