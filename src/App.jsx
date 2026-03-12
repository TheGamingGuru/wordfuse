import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://zznhpbacuxeusaogvjtg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bmhwYmFjdXhldXNhb2d2anRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTY0NzEsImV4cCI6MjA4NzQzMjQ3MX0.PZCulp9d0aGF-OAv6_lkNGs6elB6Q3hYH7U4XniydLk';
const supabase = (() => {
  if (window._wfSupabase) return window._wfSupabase;
  window._wfSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return window._wfSupabase;
})();

const TOTAL_TIME = 180;
const MAX_WRONG = 4;
const APP_CACHE_VERSION = "2026-03-02";

const FALLBACK_PUZZLE = {
  puzzle_date: "2024-01-01",
  rounds: [
    { words: ["PAY", "SPOT", "MATE"], answer: "check" },
    { words: ["BASKET", "BLANKET", "TABLE"], answer: "picnic" },
    { words: ["CASH", "BALL", "HUSH"], answer: "money" },
    { words: ["BLUE", "LINE", "DIVE"], answer: "sky" },
  ],
};

// ─── UTILS ───────────────────────────────────────────────────────────────────
const formatDateInTimeZone = (date, tz) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const v = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${v.year}-${v.month}-${v.day}`;
};
const getTodayEST = () => formatDateInTimeZone(new Date(), "America/New_York");
const clampDateToToday = (d, today) => (d > today ? today : d);
const isISODate = v => /^\d{4}-\d{2}-\d{2}$/.test(v);
const writeDateParam = (url, date, today) => {
  if (date === today) { url.searchParams.delete("date"); return; }
  url.searchParams.set("date", date);
};
const formatTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const formatCountdown = s => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};
const WIN_SPARKS = ["✨", "🎉", "⭐", "💫", "🥳", "🎊", "✨", "⭐"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS = ["S","M","T","W","T","F","S"];

const getUserId = () => {
  let id = localStorage.getItem("wl_user_id");
  if (!id) { id = "u_" + Math.random().toString(36).slice(2, 11); localStorage.setItem("wl_user_id", id); }
  return id;
};

// Seconds until midnight EST
const secondsUntilMidnightEST = () => {
  const now = new Date();
  const estStr = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const estNow = new Date(estStr);
  const midnight = new Date(estNow);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight - estNow) / 1000));
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&family=Nunito:wght@700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0f0e17;
    --surface: #1a1927;
    --surface2: #231f35;
    --surface3: #2e2a42;
    --border: #3a3555;
    --accent: #e8c547;
    --accent2: #ff6b6b;
    --green: #52d68a;
    --text: #f0ede8;
    --text-muted: #8b8799;
    --font-display: 'Playfair Display', serif;
    --font-word: 'Nunito', sans-serif;
    --font-mono: 'DM Mono', monospace;
    --font-body: 'DM Sans', sans-serif;
    --header-bg-top: rgba(15,14,23,0.98);
    --header-bg-mid: rgba(15,14,23,0.92);
    --header-bg-bot: rgba(15,14,23,0.74);
    --hud-bg-top: rgba(15,14,23,0.95);
    --hud-bg-mid: rgba(15,14,23,0.82);
  }
  .wl-light {
    --bg: #f4f2ed;
    --surface: #ffffff;
    --surface2: #ede9df;
    --border: #d5cfc2;
    --accent: #c49b00;
    --accent2: #d93030;
    --green: #1e9a5a;
    --text: #1a1825;
    --text-muted: #6b6478;
    --header-bg-top: rgba(244,242,237,0.98);
    --header-bg-mid: rgba(244,242,237,0.92);
    --header-bg-bot: rgba(244,242,237,0.74);
    --hud-bg-top: rgba(244,242,237,0.96);
    --hud-bg-mid: rgba(244,242,237,0.84);
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
  html, body, #root { width: 100%; min-height: 100vh; }

  .wl-root {
    min-height: 100vh; width: 100%;
    display: flex; flex-direction: column; align-items: center;
    /* FIX 1: removed 24px top padding that was causing whitespace above the sticky header */
    padding: 0 16px 48px;
    background: var(--bg);
    background-image: radial-gradient(ellipse at 20% 0%, #1e1540 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 100%, #1a2840 0%, transparent 60%);
    transition: background-color 0.3s;
  }
  .wl-light.wl-root {
    background-image: radial-gradient(ellipse at 20% 0%, #e4ddf8 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 100%, #d5e8f8 0%, transparent 60%);
  }

  /* HEADER */
  .wl-header-wrap {
    position: sticky; top: 0; z-index: 20; width: 100%;
    display: flex; justify-content: center;
    /* FIX 2: removed margin-bottom: 20px that was causing the gap between header and HUD */
    padding: 8px 0 12px; margin-bottom: 0;
    background: linear-gradient(to bottom, var(--header-bg-top), var(--header-bg-mid), var(--header-bg-bot), rgba(0,0,0,0));
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(46,42,69,0.45);
  }
  .wl-light .wl-header-wrap { border-bottom-color: rgba(213,207,194,0.6); }
  .wl-header { width: 100%; max-width: 560px; display: flex; justify-content: space-between; align-items: center; }
  .wl-logo {
    font-family: var(--font-display); font-size: 28px; font-weight: 900;
    letter-spacing: -0.5px; color: var(--text);
    background: none; border: none; padding: 0; cursor: pointer;
  }
  .wl-logo span { color: var(--accent); }
  .wl-date { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; }

  /* HAMBURGER */
  .wl-hamburger {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text);
    cursor: pointer;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 4px; padding: 0; flex-shrink: 0;
    transition: border-color 0.2s, background 0.2s;
  }
  .wl-hamburger:hover { border-color: var(--accent); }
  .wl-hamburger-line {
    width: 14px; height: 1.5px;
    background: var(--text);
    border-radius: 2px;
    transition: background 0.2s;
  }
  .wl-hamburger:hover .wl-hamburger-line { background: var(--accent); }

  /* NAV DRAWER */
  .wl-nav-backdrop {
    position: fixed; inset: 0;
    background: rgba(10,9,20,0.6);
    backdrop-filter: blur(4px);
    z-index: 90;
    animation: fadeIn 0.2s ease;
  }
  .wl-light .wl-nav-backdrop { background: rgba(200,196,188,0.6); }
  .wl-nav-drawer {
    position: fixed; top: 0; right: 0; bottom: 0;
    width: min(320px, 85vw);
    background: var(--surface);
    border-left: 1px solid var(--border);
    z-index: 95;
    display: flex; flex-direction: column;
    padding: 24px 0 32px;
    animation: drawerSlideIn 0.28s cubic-bezier(0.22,1,0.36,1);
    box-shadow: -12px 0 40px rgba(0,0,0,0.25);
  }
  @keyframes drawerSlideIn {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  .wl-nav-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px 20px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 8px;
  }
  .wl-nav-title {
    font-family: var(--font-display); font-size: 20px; font-weight: 900; color: var(--text);
  }
  .wl-nav-close {
    width: 32px; height: 32px; min-width: 32px; min-height: 32px;
    padding: 0; line-height: 1; flex-shrink: 0;
    border-radius: 50%;
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text-muted); cursor: pointer; font-size: 18px;
    display: flex; align-items: center; justify-content: center;
    transition: border-color 0.2s, color 0.2s;
  }
  .wl-nav-close:hover { border-color: var(--accent2); color: var(--accent2); }
  .wl-nav-item {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 20px;
    background: none; border: none; width: 100%; text-align: left;
    cursor: pointer; color: var(--text);
    font-family: var(--font-body); font-size: 15px; font-weight: 500;
    transition: background 0.15s, color 0.15s;
    border-radius: 0;
  }
  .wl-nav-item:hover { background: var(--surface2); color: var(--accent); }
  .wl-nav-item-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
    transition: border-color 0.15s;
  }
  .wl-nav-item:hover .wl-nav-item-icon { border-color: var(--accent); }
  .wl-nav-divider { height: 1px; background: var(--border); margin: 8px 20px; }

  /* HUD */
  .wl-hud { width: 100%; max-width: 560px; display: grid; gap: 10px; margin: 0 auto 12px; }
  .wl-hud-sticky {
    width: 100%; position: sticky; top: 70px; z-index: 15;
    display: flex; flex-direction: column; align-items: center;
    background: linear-gradient(to bottom, var(--hud-bg-top) 0%, var(--hud-bg-top) 80%, rgba(0,0,0,0) 100%);
    padding-top: 4px;
    padding-bottom: 28px;
  }
  .wl-hud-cell { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; display: flex; flex-direction: column; gap: 2px; }
  .wl-hud-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-muted); }
  .wl-hud-value { font-family: var(--font-mono); font-size: 24px; font-weight: 500; color: var(--text); line-height: 1; }
  .wl-hud-value.warning { color: var(--accent); }
  .wl-hud-value.danger  { color: var(--accent2); }

  /* TIMER BAR */
  .wl-timer-bar-wrap { width: 100%; max-width: 560px; height: 4px; background: var(--border); border-radius: 2px; margin: 0 auto; overflow: hidden; }
  .wl-timer-bar { height: 100%; background: var(--accent); border-radius: 2px; transition: width 1s linear, background 0.4s; }
  .wl-timer-bar.low { background: var(--accent2); }

  /* ROUNDS */
  .wl-rounds { width: 100%; max-width: 560px; display: flex; flex-direction: column; gap: 14px; }
  .wl-round { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; transition: border-color 0.3s, box-shadow 0.3s; }
  .wl-round.solved { border-color: var(--green); box-shadow: 0 0 0 1px var(--green), 0 4px 24px rgba(82,214,138,0.08); }
  .wl-round.active { border-color: var(--accent); box-shadow: 0 0 0 1px rgba(232,197,71,0.5), 0 8px 20px rgba(232,197,71,0.08); }
  .wl-round.solved.active { border-color: var(--green); box-shadow: 0 0 0 1px var(--green), 0 4px 24px rgba(82,214,138,0.08); }
  .wl-round.pulse { animation: roundFocusPulse 0.55s ease; }
  .wl-round.shaking { animation: shake 0.45s cubic-bezier(.36,.07,.19,.97) both; }
  @keyframes roundFocusPulse { 0% { transform: translateY(0) scale(1); } 40% { transform: translateY(-2px) scale(1.008); } 100% { transform: translateY(0) scale(1); } }
  @keyframes shake { 0%,100% { transform: translateX(0); } 15% { transform: translateX(-6px); } 30% { transform: translateX(6px); } 45% { transform: translateX(-5px); } 60% { transform: translateX(5px); } 75% { transform: translateX(-3px); } 90% { transform: translateX(3px); } }

  .wl-round-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .wl-round-num { font-family: var(--font-mono); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-muted); }
  .wl-round-solved-badge { font-family: var(--font-mono); font-size: 10px; letter-spacing: 1px; color: var(--green); text-transform: uppercase; }
  .wl-words { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
  .wl-word { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 12px 8px 12px; text-align: center; font-family: var(--font-word); font-size: 16px; font-weight: 800; letter-spacing: 1px; line-height: 1.05; color: var(--text); text-transform: uppercase; text-shadow: 0 1px 0 rgba(0,0,0,0.12); position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0; }
  .wl-word-label { flex: 1; display: flex; align-items: center; justify-content: center; padding: 4px 0; }
  .wl-dir-bar { width: 60%; height: 4px; border-radius: 2px; flex-shrink: 0; animation: fadeIn 0.3s ease; }
  .wl-dir-bar.before { background: var(--accent); }
  .wl-dir-bar.after  { background: var(--green); }
  .wl-dir-spacer { height: 4px; flex-shrink: 0; }

  .wl-answer-entry { display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .wl-input-row { display: flex; gap: 8px; justify-content: center; align-items: center; }
  .wl-letter-input { width: 42px; height: 42px; background: var(--surface3, var(--surface2)); border: 1px solid var(--border); border-radius: 10px; font-family: var(--font-mono); font-size: 18px; color: var(--text); text-transform: uppercase; text-align: center; outline: none; transition: border-color 0.2s, transform 0.1s, background 0.2s, color 0.2s; }
  .wl-light .wl-letter-input { background: var(--surface2); }
  .wl-letter-input:focus { border-color: var(--accent); transform: translateY(-1px); }
  .wl-letter-input.gold { background: color-mix(in srgb, var(--accent) 22%, var(--surface2)); border-color: var(--accent); color: var(--accent); font-weight: 600; }
  .wl-light .wl-letter-input.gold { background: color-mix(in srgb, var(--accent) 18%, var(--surface2)); border-color: var(--accent); color: #7a5a00; font-weight: 700; }
  .wl-letter-input:disabled { opacity: 0.8; cursor: not-allowed; }

  .wl-submit { background: var(--accent); color: var(--bg); border: none; border-radius: 10px; padding: 10px 18px; font-family: var(--font-body); font-size: 13px; font-weight: 600; cursor: pointer; letter-spacing: 0.3px; transition: opacity 0.15s, transform 0.1s; white-space: nowrap; }
  .wl-submit:hover:not(:disabled) { opacity: 0.88; transform: scale(0.98); }
  .wl-submit:disabled { opacity: 0.3; cursor: not-allowed; }
  .wl-error-msg { font-family: var(--font-mono); font-size: 11px; color: var(--accent2); margin-top: 8px; letter-spacing: 0.5px; min-height: 16px; }
  .wl-answer-reveal { text-align: center; padding: 10px; font-family: var(--font-display); font-size: 20px; font-weight: 700; letter-spacing: 3px; color: var(--green); text-transform: uppercase; }
  .wl-answer-reveal.missed { color: var(--accent2); }

  /* MODAL */
  .wl-overlay { position: fixed; inset: 0; background: rgba(10,9,20,0.82); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; animation: fadeIn 0.25s ease; }
  .wl-light .wl-overlay { background: rgba(210,206,198,0.82); }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .wl-modal { position: relative; overflow: hidden; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 32px 28px; max-width: 420px; width: 100%; animation: slideUp 0.3s cubic-bezier(0.22,1,0.36,1); }
  .wl-modal.wl-results-modal { max-width: 400px; padding: 24px 20px 18px; }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .wl-win-burst { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .wl-win-spark { position: absolute; top: -14%; font-size: 20px; opacity: 0; animation: fallCelebrate 2.6s ease-out 1 forwards; }
  @keyframes fallCelebrate { 0% { transform: translate3d(0,0,0) rotate(0deg) scale(0.8); opacity: 0; } 12% { opacity: 1; } 100% { transform: translate3d(var(--drift),520px,0) rotate(520deg) scale(1.15); opacity: 0; } }

  .wl-modal-title { font-family: var(--font-display); font-size: 32px; font-weight: 900; margin-bottom: 6px; line-height: 1.1; color: var(--text); }
  .wl-modal-sub { font-size: 14px; color: var(--text-muted); margin-bottom: 24px; }
  .wl-results-modal .wl-modal-title { font-size: 28px; text-align: center; margin-bottom: 4px; }
  .wl-results-modal .wl-modal-sub { text-align: center; margin-bottom: 16px; line-height: 1.45; }

  /* HOW TO PLAY */
  .wl-howto-example { background: var(--surface2); border-radius: 10px; padding: 14px; margin-bottom: 18px; }
  .wl-howto-example p { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
  .wl-howto-example .ex-words { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
  .wl-howto-example .ex-word { background: var(--border); border-radius: 6px; padding: 4px 10px; font-family: var(--font-display); font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text); }
  .wl-howto-example .ex-answer { font-family: var(--font-mono); font-size: 13px; color: var(--accent); }
  .wl-rules { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
  .wl-rule { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-muted); }
  .wl-rule-icon { width: 28px; height: 28px; background: var(--surface2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }

  /* RESULTS */
  .wl-result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
  .wl-result-cell { background: var(--surface2); border-radius: 10px; padding: 11px 10px; text-align: center; }
  .wl-result-val { font-family: var(--font-mono); font-size: 22px; font-weight: 500; color: var(--text); margin-bottom: 2px; }
  .wl-result-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-muted); }
  .wl-answer-list { background: var(--surface2); border-radius: 10px; padding: 10px 12px; margin-bottom: 14px; }
  .wl-answer-list-title { font-family: var(--font-mono); font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
  .wl-answer-row { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 3px; padding: 5px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
  .wl-answer-row:last-child { border-bottom: none; }
  .wl-answer-row-words { color: var(--text-muted); font-size: 12px; }
  .wl-results-modal .wl-answer-row-words { font-family: var(--font-word); font-weight: 700; letter-spacing: 0.3px; }
  .wl-answer-row-ans { font-family: var(--font-mono); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
  .wl-answer-row-ans.correct { color: var(--green); }
  .wl-answer-row-ans.missed  { color: var(--accent2); }

  /* COUNTDOWN BANNER */
  .wl-countdown-banner {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 12px;
    text-align: center;
  }
  .wl-countdown-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; }
  .wl-countdown-value { font-family: var(--font-mono); font-size: 26px; font-weight: 500; color: var(--accent); letter-spacing: 2px; }

  /* BUTTONS */
  .wl-btn { width: 100%; padding: 12px; border-radius: 12px; border: none; font-family: var(--font-body); font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity 0.15s, transform 0.1s; letter-spacing: 0.2px; }
  .wl-btn:hover { opacity: 0.88; transform: scale(0.99); }
  .wl-btn-primary { background: var(--accent); color: var(--bg); }
  .wl-btn-ghost { background: transparent; color: var(--text-muted); border: 1px solid var(--border); margin-top: 8px; font-size: 13px; }
  .wl-results-modal .wl-btn-ghost { margin-top: 6px; }
  .wl-result-nav-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }

  /* SETTINGS */
  .wl-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .wl-settings-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid var(--border); }
  .wl-settings-row:last-of-type { border-bottom: none; }
  .wl-settings-label { display: flex; flex-direction: column; gap: 4px; }
  .wl-settings-label-title { font-family: var(--font-body); font-size: 14px; font-weight: 600; color: var(--text); }
  .wl-settings-label-sub { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); letter-spacing: 0.3px; }

  /* TOGGLE */
  .wl-toggle { position: relative; width: 46px; height: 26px; flex-shrink: 0; cursor: pointer; }
  .wl-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
  .wl-toggle-track { position: absolute; inset: 0; border-radius: 13px; background: var(--border); transition: background 0.25s; cursor: pointer; }
  .wl-toggle input:checked + .wl-toggle-track { background: var(--accent); }
  .wl-toggle-thumb { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.25); transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1); pointer-events: none; }
  .wl-toggle input:checked ~ .wl-toggle-thumb { transform: translateX(20px); }

  /* CALENDAR ARCHIVE */
  .wl-cal-modal { max-width: 520px; max-height: 88vh; overflow-y: auto; padding: 24px 20px; }
  .wl-cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .wl-cal-month-title { font-family: var(--font-display); font-size: 20px; font-weight: 900; color: var(--text); }
  .wl-cal-nav-btn {
    width: 34px; height: 34px; border-radius: 50%;
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text-muted); cursor: pointer; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    transition: border-color 0.2s, color 0.2s;
  }
  .wl-cal-nav-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .wl-cal-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .wl-cal-day-headers { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 6px; }
  .wl-cal-day-header { text-align: center; font-family: var(--font-mono); font-size: 10px; letter-spacing: 1px; color: var(--text-muted); padding: 4px 0; text-transform: uppercase; }
  .wl-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
  .wl-cal-cell {
    aspect-ratio: 1;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface2);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    cursor: pointer; position: relative;
    transition: border-color 0.15s, background 0.15s, transform 0.1s;
    min-height: 52px;
    padding: 4px;
    overflow: hidden;
  }
  .wl-cal-cell:hover { border-color: var(--accent); transform: scale(1.04); }
  .wl-cal-cell.empty { background: transparent; border-color: transparent; cursor: default; pointer-events: none; }
  .wl-cal-cell.future { opacity: 0.3; cursor: not-allowed; pointer-events: none; }
  .wl-cal-cell.today { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--surface2)); }
  .wl-cal-cell.completed { border-color: var(--green); background: color-mix(in srgb, var(--green) 10%, var(--surface2)); }
  .wl-light .wl-cal-cell.completed { background: color-mix(in srgb, var(--green) 16%, var(--surface2)); }
  .wl-cal-cell.today:hover { border-color: var(--accent); }
  .wl-cal-cell-day { font-family: var(--font-mono); font-size: 9px; color: var(--text-muted); position: absolute; top: 5px; right: 6px; }
  .wl-cal-cell-num { font-family: var(--font-mono); font-size: 11px; font-weight: 500; color: var(--accent); letter-spacing: 0.5px; }
  .wl-cal-cell.completed .wl-cal-cell-num { color: var(--green); }
  .wl-light .wl-cal-cell.completed .wl-cal-cell-num { color: #0f5c34; }
  .wl-cal-cell-check { font-size: 11px; color: var(--green); margin-top: 1px; }
  .wl-light .wl-cal-cell-check { color: #0f5c34; }
  .wl-cal-cell-today-label { font-family: var(--font-mono); font-size: 8px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px; }
  .wl-cal-no-puzzles { text-align: center; padding: 32px 0; color: var(--text-muted); font-family: var(--font-body); font-size: 14px; }

  /* TOAST */
  .wl-toast { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); background: var(--green); color: var(--bg); font-family: var(--font-mono); font-size: 13px; font-weight: 500; letter-spacing: 0.5px; padding: 12px 24px; border-radius: 40px; z-index: 200; animation: toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1); white-space: nowrap; }
  @keyframes toastIn { from { transform: translateX(-50%) translateY(16px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }

  /* LOADING */
  .wl-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: var(--bg); font-family: var(--font-mono); color: var(--text-muted); font-size: 12px; letter-spacing: 2px; text-transform: uppercase; }
  .wl-spinner { width: 28px; height: 28px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ─── TOGGLE ───────────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <label className="wl-toggle">
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    <div className="wl-toggle-track" />
    <div className="wl-toggle-thumb" />
  </label>
);

// ─── CLOSE BUTTON ─────────────────────────────────────────────────────────────
const CloseBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 22, lineHeight: 1 }} aria-label="Close">×</button>
);

// ─── COUNTDOWN HOOK ───────────────────────────────────────────────────────────
const useCountdown = (active) => {
  const [secs, setSecs] = useState(() => secondsUntilMidnightEST());
  useEffect(() => {
    if (!active) return;
    setSecs(secondsUntilMidnightEST());
    const id = setInterval(() => setSecs(secondsUntilMidnightEST()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return secs;
};

// ─── NAV DRAWER ───────────────────────────────────────────────────────────────
const NavDrawer = ({ onClose, onSettings, onArchive, onHome, showArchive }) => (
  <>
    <div className="wl-nav-backdrop" onClick={onClose} />
    <nav className="wl-nav-drawer" role="dialog" aria-label="Navigation menu">
      <div className="wl-nav-header">
        <div className="wl-nav-title">Word<span style={{ color: "var(--accent)" }}>Fuse</span></div>
        <button className="wl-nav-close" onClick={onClose} aria-label="Close menu">×</button>
      </div>

      <button className="wl-nav-item" onClick={() => { onHome(); onClose(); }}>
        <div className="wl-nav-item-icon">🏠</div>
        Daily Puzzle
      </button>

      {showArchive && (
        <button className="wl-nav-item" onClick={() => { onArchive(); onClose(); }}>
          <div className="wl-nav-item-icon">📅</div>
          Play Archive
        </button>
      )}

      <div className="wl-nav-divider" />

      <button className="wl-nav-item" onClick={() => { onSettings(); onClose(); }}>
        <div className="wl-nav-item-icon">⚙️</div>
        Settings
      </button>
    </nav>
  </>
);

// ─── SETTINGS MODAL ───────────────────────────────────────────────────────────
const SettingsModal = ({ lightMode, timerEnabled, onToggleLight, onToggleTimer, onClose }) => (
  <div className="wl-overlay" onClick={onClose}>
    <div className="wl-modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
      <div className="wl-modal-header">
        <div className="wl-modal-title" style={{ fontSize: 24 }}>Settings</div>
        <CloseBtn onClick={onClose} />
      </div>
      <div className="wl-settings-row">
        <div className="wl-settings-label">
          <div className="wl-settings-label-title">🌙 Dark Mode</div>
          <div className="wl-settings-label-sub">Switch to a dark theme</div>
        </div>
        <Toggle checked={!lightMode} onChange={val => onToggleLight(!val)} />
      </div>
      <div className="wl-settings-row">
        <div className="wl-settings-label">
          <div className="wl-settings-label-title">⏱ Timer</div>
          <div className="wl-settings-label-sub">{timerEnabled ? "3-minute countdown is active" : "Play at your own pace"}</div>
        </div>
        <Toggle checked={timerEnabled} onChange={onToggleTimer} />
      </div>
      <button className="wl-btn wl-btn-ghost" style={{ marginTop: 20 }} onClick={onClose}>Done</button>
    </div>
  </div>
);

// ─── RESULTS MODAL ────────────────────────────────────────────────────────────
const ResultsModal = ({ gameStatus, timeTaken, wrongGuesses, completed, stats, puzzle, timerEnabled, isToday, onShareResults, onViewStats, onGoHome, onViewArchived }) => {
  const countdownSecs = useCountdown(isToday);

  return (
    <div className="wl-overlay">
      <div className="wl-modal wl-results-modal">
        {gameStatus === "won" && (
          <div className="wl-win-burst" aria-hidden="true">
            {WIN_SPARKS.map((spark, idx) => (
              <span key={`${spark}-${idx}`} className="wl-win-spark" style={{ left: `${8 + idx * 12}%`, animationDelay: `${idx * 0.15}s`, "--drift": `${(idx % 2 === 0 ? 1 : -1) * (18 + idx * 2)}px` }}>{spark}</span>
            ))}
          </div>
        )}
        <div className="wl-modal-title" style={{ color: gameStatus === "won" ? "var(--green)" : "var(--accent2)" }}>
          {gameStatus === "won" ? "You got it!" : "Game Over"}
        </div>
        <div className="wl-modal-sub">
          {gameStatus === "won"
            ? `Solved in ${formatTime(timeTaken)} with ${wrongGuesses} wrong guess${wrongGuesses !== 1 ? "es" : ""}`
            : "Better luck tomorrow!"}
        </div>

        <div className="wl-result-grid">
          {gameStatus === "won" && (
            <div className="wl-result-cell">
              <div className="wl-result-val">{formatTime(timeTaken)}</div>
              <div className="wl-result-label">Time Taken</div>
            </div>
          )}
          <div className="wl-result-cell">
            <div className="wl-result-val">{wrongGuesses}/{MAX_WRONG}</div>
            <div className="wl-result-label">Wrong Guesses</div>
          </div>
          <div className="wl-result-cell">
            <div className="wl-result-val">{completed.filter(Boolean).length}/4</div>
            <div className="wl-result-label">Rounds Solved</div>
          </div>
          {stats && (
            <div className="wl-result-cell">
              <div className="wl-result-val">{stats.current_streak}{stats.current_streak > 1 ? " 🔥" : ""}</div>
              <div className="wl-result-label">Win Streak</div>
            </div>
          )}
        </div>

        <div className="wl-answer-list">
          <div className="wl-answer-list-title">Answers</div>
          {puzzle.rounds.map((round, i) => (
            <div key={i} className="wl-answer-row">
              <span className="wl-answer-row-words">{round.words.join(" · ")}</span>
              <span className={`wl-answer-row-ans ${completed[i] ? "correct" : "missed"}`}>
                {completed[i] ? "✓ " : "✗ "}{round.answer.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {isToday && (
          <div className="wl-countdown-banner">
            <div className="wl-countdown-label">Next puzzle in</div>
            <div className="wl-countdown-value">{formatCountdown(countdownSecs)}</div>
          </div>
        )}

        <button className="wl-btn wl-btn-primary" onClick={onShareResults}>Share Results</button>
        {stats && <button className="wl-btn wl-btn-ghost" onClick={onViewStats}>View Stats</button>}
        <div className="wl-result-nav-actions">
          <button className="wl-btn wl-btn-ghost" onClick={onGoHome} aria-label="Go home">🏠 Home</button>
          <button className="wl-btn wl-btn-ghost" onClick={onViewArchived} aria-label="Browse past puzzles">📅 Archive</button>
        </div>
      </div>
    </div>
  );
};

// ─── CALENDAR ARCHIVE ─────────────────────────────────────────────────────────
const CalendarArchive = ({ archivedDates, loadingArchiveDates, today, completedDates, onSelectDate, onClose }) => {
  // Build a map of date → puzzle number (sorted ascending = #1 is earliest)
  const sortedDates = [...archivedDates].sort((a, b) => a < b ? -1 : 1);
  const puzzleNumbers = Object.fromEntries(sortedDates.map((d, i) => [d, i + 1]));

  const todayYM = today.slice(0, 7); // "YYYY-MM"
  const [viewYM, setViewYM] = useState(() => {
    return todayYM;
  });

  const [viewYear, viewMonthIdx] = viewYM.split("-").map(Number);

  const firstDayOfMonth = new Date(viewYear, viewMonthIdx - 1, 1);
  const daysInMonth = new Date(viewYear, viewMonthIdx, 0).getDate();
  const startDow = firstDayOfMonth.getDay();

  const monthPrefix = viewYM;
  const monthDates = new Set(archivedDates.filter(d => d.startsWith(monthPrefix)));

  const prevYM = (() => {
    const d = new Date(viewYear, viewMonthIdx - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();
  const nextYM = (() => {
    const d = new Date(viewYear, viewMonthIdx, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  const hasPrev = archivedDates.some(d => d.startsWith(prevYM));
  const hasNext = nextYM <= todayYM;

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push({ empty: true, key: `e-${i}` });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${viewYM}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, iso });
  }

  return (
    <div className="wl-overlay" onClick={onClose}>
      <div className="wl-modal wl-cal-modal" onClick={e => e.stopPropagation()}>
        <div className="wl-modal-header" style={{ marginBottom: 16 }}>
          <div className="wl-modal-title" style={{ fontSize: 22 }}>Archive</div>
          <CloseBtn onClick={onClose} />
        </div>

        {loadingArchiveDates ? (
          <div className="wl-cal-no-puzzles">Loading puzzles…</div>
        ) : (
          <>
            <div className="wl-cal-nav">
              <button className="wl-cal-nav-btn" onClick={() => setViewYM(prevYM)} disabled={!hasPrev} aria-label="Previous month">‹</button>
              <div className="wl-cal-month-title">{MONTH_NAMES[viewMonthIdx - 1]} {viewYear}</div>
              <button className="wl-cal-nav-btn" onClick={() => setViewYM(nextYM)} disabled={!hasNext} aria-label="Next month">›</button>
            </div>

            <div className="wl-cal-day-headers">
              {DAY_LABELS.map((l, i) => <div key={i} className="wl-cal-day-header">{l}</div>)}
            </div>

            <div className="wl-cal-grid">
              {cells.map(cell => {
                if (cell.empty) return <div key={cell.key} className="wl-cal-cell empty" />;
                const { day, iso } = cell;
                const hasPuzzle = monthDates.has(iso);
                const isFuture = iso > today;
                const isToday = iso === today;
                const isDone = completedDates.has(iso);
                const pNum = puzzleNumbers[iso];

                if (!hasPuzzle || isFuture) {
                  return (
                    <div key={iso} className={`wl-cal-cell ${isFuture ? "future" : "empty"}`} style={{ opacity: isFuture ? 0.2 : 0.22, cursor: "default", pointerEvents: "none" }}>
                      <div className="wl-cal-cell-day">{day}</div>
                    </div>
                  );
                }

                return (
                  <button
                    key={iso}
                    className={`wl-cal-cell ${isToday ? "today" : ""} ${isDone ? "completed" : ""}`}
                    onClick={() => onSelectDate(iso)}
                    aria-label={`Puzzle #${pNum} — ${iso}`}
                  >
                    <div className="wl-cal-cell-day">{day}</div>
                    <div className="wl-cal-cell-num">#{pNum}</div>
                    {isDone
                      ? <div className="wl-cal-cell-check">✓</div>
                      : isToday
                        ? <div className="wl-cal-cell-today-label">Today</div>
                        : null
                    }
                  </button>
                );
              })}
            </div>

            {!monthDates.size && (
              <div className="wl-cal-no-puzzles">No puzzles this month.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function WordLinkGame() {
  useEffect(() => {
    const savedVersion = localStorage.getItem("wl_cache_version");
    if (savedVersion === APP_CACHE_VERSION) return;
    Object.keys(localStorage)
      .filter(k => k.startsWith("wl_") && k !== "wl_seen_help" && k !== "wl_user_id")
      .forEach(k => localStorage.removeItem(k));
    localStorage.setItem("wl_cache_version", APP_CACHE_VERSION);
  }, []);

  useEffect(() => { document.title = "WordFuse"; }, []);

  // FIX 3: Use useState so `today` is computed once at mount and never changes.
  // Previously `const today = getTodayEST()` recomputed every render, causing
  // the puzzle-loading useEffect (which had `today` as a dependency) to re-fire
  // at midnight, resetting an in-progress game.
  const [today] = useState(() => getTodayEST());

  const [lightMode, setLightMode] = useState(() => localStorage.getItem("wl_light_mode") !== "false");
  const [timerEnabled, setTimerEnabled] = useState(() => localStorage.getItem("wl_timer_enabled") === "true");

  const toggleLightMode = useCallback(val => { setLightMode(val); localStorage.setItem("wl_light_mode", String(val)); }, []);
  const toggleTimerEnabled = useCallback(val => { setTimerEnabled(val); localStorage.setItem("wl_timer_enabled", String(val)); }, []);

  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDate, setActiveDate] = useState(() => {
    const urlDate = new URLSearchParams(window.location.search).get("date");
    if (!urlDate || !isISODate(urlDate)) return today;
    return clampDateToToday(urlDate, today);
  });
  const [archiveMsg, setArchiveMsg] = useState("");
  const [guesses, setGuesses] = useState(["", "", "", ""]);
  const [completed, setCompleted] = useState([false, false, false, false]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [gameStatus, setGameStatus] = useState("playing");
  const [shakingRound, setShakingRound] = useState(null);
  const [pulseRoundIdx, setPulseRoundIdx] = useState(null);
  const [errorMsgs, setErrorMsgs] = useState(["", "", "", ""]);
  const [stats, setStats] = useState(null);
  const [screen, setScreen] = useState("home");
  const [showHelp, setShowHelp] = useState(() => !localStorage.getItem("wl_seen_help"));
  const [showCopied, setShowCopied] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [archivedDates, setArchivedDates] = useState([]);
  const [loadingArchiveDates, setLoadingArchiveDates] = useState(false);
  const [completedDates, setCompletedDates] = useState(new Set());
  const [hintLetters, setHintLetters] = useState(["", "", "", ""]);
  const [wrongPerRound, setWrongPerRound] = useState([0, 0, 0, 0]);
  const [activeRoundIdx, setActiveRoundIdx] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [directionHints, setDirectionHints] = useState([null, null, null, null]);

  const timerRef = useRef(null);
  const gameStartTimeRef = useRef(null);
  const letterInputRefs = useRef([[], [], [], []]);
  const roundRefs = useRef([]);
  const gameStatusRef = useRef("playing");

  useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);

  useEffect(() => {
    const handler = e => {
      if (e.key !== "Escape") return;
      if (showMenu) { setShowMenu(false); return; }
      if (showLeaveConfirm) { setShowLeaveConfirm(false); return; }
      if (showSettings) { setShowSettings(false); return; }
      if (showArchiveModal) { setShowArchiveModal(false); return; }
      if (showHelp) { setShowHelp(false); localStorage.setItem("wl_seen_help", "1"); return; }
      if (showCopied) { setShowCopied(false); return; }
      if (screen === "stats") { setScreen("results"); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showMenu, showLeaveConfirm, showSettings, showArchiveModal, showHelp, showCopied, screen]);

  const resetBoard = () => {
    setGuesses(["", "", "", ""]);
    setCompleted([false, false, false, false]);
    setWrongGuesses(0);
    setTimeLeft(TOTAL_TIME);
    setGameStatus("playing");
    setShakingRound(null);
    setErrorMsgs(["", "", "", ""]);
    setHintLetters(["", "", "", ""]);
    setWrongPerRound([0, 0, 0, 0]);
    setActiveRoundIdx(0);
    letterInputRefs.current = [[], [], [], []];
    roundRefs.current = [];
  };

  const focusLetter = useCallback((ri, li) => {
    letterInputRefs.current[ri]?.[li]?.focus();
  }, []);

  const openArchiveModal = useCallback(async () => {
    setShowArchiveModal(true);
    setLoadingArchiveDates(true);
    try {
      const { data: puzzleDates } = await supabase.from("puzzles").select("puzzle_date").lte("puzzle_date", today).order("puzzle_date", { ascending: false });
      setArchivedDates((puzzleDates || []).map(r => r.puzzle_date).filter(Boolean));
      const uid = getUserId();
      const { data: results } = await supabase.from("game_results").select("puzzle_date").eq("user_id", uid).eq("completed", true);
      const remoteWins = (results || []).map(r => r.puzzle_date).filter(Boolean);
      const localWins = Object.keys(localStorage)
        .filter(k => k.startsWith("wl_played_"))
        .map(k => {
          try {
            const saved = JSON.parse(localStorage.getItem(k));
            const date = k.replace("wl_played_", "");
            return saved?.gameStatus === "won" ? date : null;
          } catch (_) { return null; }
        })
        .filter(Boolean);
      setCompletedDates(new Set([...remoteWins, ...localWins]));
    } catch (_) {
      setArchivedDates([]);
      const localWins = Object.keys(localStorage)
        .filter(k => k.startsWith("wl_played_"))
        .map(k => {
          try {
            const saved = JSON.parse(localStorage.getItem(k));
            return saved?.gameStatus === "won" ? k.replace("wl_played_", "") : null;
          } catch (_) { return null; }
        })
        .filter(Boolean);
      setCompletedDates(new Set(localWins));
    } finally {
      setLoadingArchiveDates(false);
    }
  }, [today]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setArchiveMsg("");
      let p = null;
      try {
        const { data, error } = await supabase.from("puzzles").select("*").eq("puzzle_date", activeDate).single();
        if (!error && data) p = data;
      } catch (_) {}

      if (!p) {
        p = { ...FALLBACK_PUZZLE, puzzle_date: activeDate };
        setArchiveMsg(activeDate === today
          ? "Today's live puzzle is unavailable — using practice puzzle."
          : "No puzzle found for this date — showing practice puzzle.");
      }

      p = { ...p, rounds: p.rounds.map(r => ({ ...r, words: r.words.map(w => w.toUpperCase()) })) };
      setPuzzle(p);
      resetBoard();

      const url = new URL(window.location.href);
      writeDateParam(url, activeDate, today);
      window.history.replaceState({}, "", url);

      const savedResult = localStorage.getItem(`wl_played_${activeDate}`);
      if (savedResult) {
        const saved = JSON.parse(savedResult);
        setCompleted(saved.completed);
        setWrongGuesses(saved.wrongGuesses);
        setTimeLeft(saved.timeLeft);
        setHintLetters(saved.hintLetters || ["", "", "", ""]);
        setGameStatus(saved.gameStatus);
        if (saved.timeTaken) setTimeTaken(saved.timeTaken);
        if (saved.directionHints) setDirectionHints(saved.directionHints);
      }

      setLoading(false);
      loadStats();
    })();
  }, [activeDate, today]);

  useEffect(() => {
    if (screen === "game") window.scrollTo({ top: 0, behavior: "instant" });
  }, [screen]);

  useEffect(() => {
    if (screen !== "game" || gameStatus !== "playing") return;
    if (guesses.some(g => g.length > 0)) return;
    const frame = requestAnimationFrame(() => focusLetter(0, 0));
    return () => cancelAnimationFrame(frame);
  }, [screen, gameStatus, guesses, focusLetter]);

  useEffect(() => {
    if (screen !== "game" || gameStatus !== "playing") return;
    const first = completed.findIndex(d => !d);
    if (first === -1) return;
    if (completed[activeRoundIdx]) setActiveRoundIdx(first);
  }, [activeRoundIdx, completed, gameStatus, screen]);

  useEffect(() => {
    if (screen !== "game" || gameStatus !== "playing") return;
    const el = roundRefs.current[activeRoundIdx];
    if (!el) return;
    setPulseRoundIdx(activeRoundIdx);
    const t = setTimeout(() => setPulseRoundIdx(null), 560);
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    return () => clearTimeout(t);
  }, [activeRoundIdx, gameStatus, screen]);

  const loadStats = async () => {
    const uid = getUserId();
    try {
      const { data } = await supabase.from("user_stats").select("*").eq("user_id", uid).single();
      setStats(data || { user_id: uid, games_played: 0, games_won: 0, current_streak: 0, max_streak: 0, best_time: null });
    } catch (_) {
      setStats({ user_id: uid, games_played: 0, games_won: 0, current_streak: 0, max_streak: 0, best_time: null });
    }
  };

  useEffect(() => {
    if (screen !== "game" || gameStatus !== "playing" || !timerEnabled) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); triggerEndGame("lost"); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, gameStatus, timerEnabled]);

  const triggerEndGame = useCallback(async (status, overrides = {}) => {
    if (gameStatusRef.current !== "playing") return;
    setGameStatus(status);
    gameStatusRef.current = status;
    clearInterval(timerRef.current);
    setTimeout(() => setScreen("results"), 600);

    const finalCompleted = overrides.completed ?? completed;
    const finalWrongGuesses = overrides.wrongGuesses ?? wrongGuesses;
    const finalTimeLeft = overrides.timeLeft ?? timeLeft;
    const finalHintLetters = overrides.hintLetters ?? hintLetters;

    const timerElapsed = TOTAL_TIME - finalTimeLeft;
    const wallElapsed = gameStartTimeRef.current
      ? Math.round((Date.now() - gameStartTimeRef.current) / 1000)
      : 0;
    const timeTaken = timerEnabled ? timerElapsed : wallElapsed;

    localStorage.setItem(`wl_played_${activeDate}`, JSON.stringify({
      completed: finalCompleted, wrongGuesses: finalWrongGuesses,
      timeLeft: finalTimeLeft, hintLetters: finalHintLetters, gameStatus: status,
      timeTaken, directionHints,
    }));
    setTimeTaken(timeTaken);

    const uid = getUserId();
    const isWin = status === "won";
    try {
      const { data: cur } = await supabase.from("user_stats").select("*").eq("user_id", uid).single();
      const newStreak = isWin ? (cur?.current_streak || 0) + 1 : 0;
      const updated = {
        user_id: uid,
        games_played: (cur?.games_played || 0) + 1,
        games_won: (cur?.games_won || 0) + (isWin ? 1 : 0),
        current_streak: newStreak,
        max_streak: Math.max(newStreak, cur?.max_streak || 0),
        best_time: isWin && (!cur?.best_time || timeTaken < cur.best_time) ? timeTaken : cur?.best_time,
      };
      await supabase.from("user_stats").upsert(updated, { onConflict: "user_id" });
      setStats(updated);
      await supabase.from("game_results").upsert({
        user_id: uid, puzzle_date: puzzle.puzzle_date,
        completed: isWin, time_taken: timeTaken,
        wrong_guesses: finalWrongGuesses,
      }, { onConflict: "user_id,puzzle_date" });
    } catch (_) {}
  }, [timeLeft, wrongGuesses, puzzle, activeDate, today, completed, hintLetters, timerEnabled]);

  const submitGuess = useCallback(roundIdx => {
    if (gameStatus !== "playing" || completed[roundIdx] || !guesses[roundIdx].trim()) return;
    const guess = guesses[roundIdx].trim().toLowerCase();
    const answer = puzzle.rounds[roundIdx].answer.toLowerCase();

    if (guess.length !== answer.length) {
      setErrorMsgs(e => e.map((m, i) => i === roundIdx ? `Enter all ${answer.length} letters` : m));
      return;
    }
    if (guess === answer) {
      const newCompleted = completed.map((c, i) => i === roundIdx ? true : c);
      setCompleted(newCompleted);
      setErrorMsgs(e => e.map((m, i) => i === roundIdx ? "" : m));
      setHintLetters(h => h.map((l, i) => i === roundIdx ? "" : l));
      setDirectionHints(d => d.map((v, i) => i === roundIdx ? null : v));
      const next = newCompleted.findIndex(d => !d);
      if (next !== -1) { setActiveRoundIdx(next); setTimeout(() => focusLetter(next, hintLetters[next].length), 10); }
      if (newCompleted.every(Boolean)) triggerEndGame("won", { completed: newCompleted });
    } else {
      setShakingRound(roundIdx);
      setTimeout(() => setShakingRound(null), 500);
      const newWPR = wrongPerRound.map((w, i) => i === roundIdx ? w + 1 : w);
      setWrongPerRound(newWPR);
      const totalNext = wrongGuesses + 1;
      const roundWrong = newWPR[roundIdx];
      const isLosing = totalNext >= MAX_WRONG;

      if (roundWrong === 1 && !isLosing) {
        const positions = puzzle.rounds[roundIdx].positions ?? [];
        setDirectionHints(d => d.map((v, i) => i === roundIdx ? positions : v));
        setErrorMsgs(e => e.map((m, i) => i === roundIdx ? "Hint: see position arrows on each word" : m));
      } else if (roundWrong === 2 && !isLosing) {
        const rev = answer.slice(0, 1).toUpperCase();
        setHintLetters(h => h.map((l, i) => i === roundIdx ? rev : l));
        setGuesses(g => g.map((v, i) => i === roundIdx ? rev.toLowerCase() : v));
        setErrorMsgs(e => e.map((m, i) => i === roundIdx ? `Hint: starts with "${rev}"` : m));
        setTimeout(() => focusLetter(roundIdx, Math.min(1, answer.length - 1)), 10);
      } else if (roundWrong === 3 && !isLosing) {
        const rev = answer.slice(0, 2).toUpperCase();
        setHintLetters(h => h.map((l, i) => i === roundIdx ? rev : l));
        setGuesses(g => g.map((v, i) => i === roundIdx ? rev.toLowerCase() : v));
        setErrorMsgs(e => e.map((m, i) => i === roundIdx ? `Hint: starts with "${rev}"` : m));
        setTimeout(() => focusLetter(roundIdx, Math.min(2, answer.length - 1)), 10);
      } else if (!isLosing) {
        setErrorMsgs(e => e.map((m, i) => i === roundIdx ? "Not quite — try again" : m));
      }
      setWrongGuesses(prev => {
        const next = prev + 1;
        if (next >= MAX_WRONG) triggerEndGame("lost");
        return next;
      });
    }
  }, [gameStatus, completed, guesses, puzzle, triggerEndGame, wrongGuesses, wrongPerRound, focusLetter, hintLetters]);

  const handleLetterChange = (roundIdx, letterIdx, rawValue) => {
    const answerLen = puzzle.rounds[roundIdx].answer.length;
    const lockedCount = hintLetters[roundIdx].length;
    if (letterIdx < lockedCount) return;
    const chars = guesses[roundIdx].slice(0, answerLen).split("");
    if (rawValue.length > 1) {
      let wi = letterIdx;
      for (const token of rawValue.toLowerCase()) {
        if (!/[a-z]/.test(token)) continue;
        if (wi >= answerLen) break;
        if (wi < lockedCount) { wi = lockedCount; if (wi >= answerLen) break; }
        chars[wi] = token; wi++;
      }
      setGuesses(g => g.map((v, i) => i === roundIdx ? chars.join("") : v));
      if (errorMsgs[roundIdx]) setErrorMsgs(em => em.map((m, i) => i === roundIdx ? "" : m));
      if (wi < answerLen) focusLetter(roundIdx, wi);
      return;
    }
    const value = rawValue.toLowerCase();
    chars[letterIdx] = /[a-z]/.test(value) ? value : "";
    setGuesses(g => g.map((v, i) => i === roundIdx ? chars.join("") : v));
    if (errorMsgs[roundIdx]) setErrorMsgs(em => em.map((m, i) => i === roundIdx ? "" : m));
    if (value && letterIdx < answerLen - 1) focusLetter(roundIdx, letterIdx + 1);
  };

  const handleLetterKey = (e, roundIdx, letterIdx) => {
    const lockedCount = hintLetters[roundIdx].length;
    if (e.key === "Enter") { submitGuess(roundIdx); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); focusLetter(roundIdx, Math.max(lockedCount, letterIdx - 1)); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); focusLetter(roundIdx, Math.min(puzzle.rounds[roundIdx].answer.length - 1, letterIdx + 1)); return; }
    if (e.key === "Backspace" && !guesses[roundIdx][letterIdx] && letterIdx > lockedCount) {
      e.preventDefault();
      const prev = letterIdx - 1;
      setGuesses(g => {
        const chars = g[roundIdx].slice(0, puzzle.rounds[roundIdx].answer.length).split("");
        chars[prev] = "";
        return g.map((v, i) => i === roundIdx ? chars.join("") : v);
      });
      if (errorMsgs[roundIdx]) setErrorMsgs(em => em.map((m, i) => i === roundIdx ? "" : m));
      focusLetter(roundIdx, prev);
    }
  };

  const shareResults = () => {
    const gameUrl = new URL(window.location.href);
    writeDateParam(gameUrl, activeDate, today);
    const text = [
      `🔗 Play WordFuse: ${gameUrl.toString()}`,
      `📅 Puzzle: ${puzzle.puzzle_date}`,
      gameStatus === "won" ? `✅ Solved${timerEnabled ? ` in ${formatTime(TOTAL_TIME - timeLeft)}` : ""}!` : `❌ Game Over`,
      completed.map(c => c ? "🟩" : "🟥").join(" "),
      `Wrong guesses: ${wrongGuesses}/${MAX_WRONG}`,
    ].join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2500);
  };

  const goHome = useCallback(() => {
    setShowArchiveModal(false);
    if (activeDate !== today) setActiveDate(today);
    const url = new URL(window.location.href);
    url.searchParams.delete("date");
    window.history.replaceState({}, "", url);
    setScreen("home");
  }, [activeDate, today]);

  const timerPct = (timeLeft / TOTAL_TIME) * 100;
  const isLow = timerEnabled && timeLeft < 30;
  const wrongDanger = wrongGuesses >= MAX_WRONG - 1;
  const rootClass = `wl-root${lightMode ? " wl-light" : ""}`;

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className={`wl-loading${lightMode ? " wl-light" : ""}`}>
          <div className="wl-spinner" />Loading today's puzzle
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className={rootClass}>

        {/* ── HEADER ── */}
        <div className="wl-header-wrap">
          <header className="wl-header">
            <button
              type="button" className="wl-logo"
              onClick={() => {
                if (screen === "game" && gameStatus === "playing") setShowLeaveConfirm(true);
                else goHome();
              }}
              aria-label="Return to home"
            >
              Word<span style={{ color: "var(--accent)" }}>Fuse</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="wl-date">{activeDate === today ? "Daily Game" : puzzle.puzzle_date}</div>
              <button
                className="wl-hamburger"
                onClick={() => { setShowHelp(true); localStorage.setItem("wl_seen_help", "1"); }}
                aria-label="How to play"
                title="How to play"
              >
                <span style={{ fontSize: 15, lineHeight: 1, fontWeight: 700, fontFamily: "var(--font-mono)" }}>?</span>
              </button>
              <button
                className="wl-hamburger"
                onClick={() => setShowMenu(true)}
                aria-label="Open menu"
              >
                <div className="wl-hamburger-line" />
                <div className="wl-hamburger-line" />
                <div className="wl-hamburger-line" />
              </button>
            </div>
          </header>
        </div>

        {archiveMsg && (
          <div className="wl-date" style={{ marginBottom: 12, maxWidth: 560, width: "100%", color: "var(--accent2)" }}>
            {archiveMsg}
          </div>
        )}

        {/* ── HOME ── */}
        {screen === "home" && (
          <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 48 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16 }}>Daily Puzzle</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 64, fontWeight: 900, lineHeight: 1, marginBottom: 8, color: "var(--text)" }}>
              Word<span style={{ color: "var(--accent)" }}>Fuse</span>
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-muted)", marginBottom: 56, maxWidth: 280, lineHeight: 1.6 }}>
              Find the word that links three clues. New puzzle every day.
            </div>
            <div style={{ display: "flex", gap: 24, marginBottom: 56, width: "100%", justifyContent: "center" }}>
              {[["⏱", timerEnabled ? "3 min" : "No timer"], ["🔎", "4 attempts"], ["🎯", "4 rounds"]].map(([icon, label]) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "1px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  <div style={{ width: 44, height: 44, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
                  {label}
                </div>
              ))}
            </div>
            <button className="wl-btn wl-btn-primary" style={{ maxWidth: 320 }} onClick={() => { gameStartTimeRef.current = Date.now(); setScreen("game"); }}>
              {activeDate === today ? "Play Today's Puzzle" : `Play Puzzle from ${activeDate}`}
            </button>
          </div>
        )}

        {/* ── HUD ── */}
        {screen === "game" && (
          <div className="wl-hud-sticky">
            <div className="wl-hud" style={{ gridTemplateColumns: timerEnabled ? "1fr 1fr 1fr" : "1fr 1fr", maxWidth: timerEnabled ? 560 : 380 }}>
              {timerEnabled && (
              <div className="wl-hud-cell">
                <div className="wl-hud-label">Time</div>
                <div className={`wl-hud-value ${isLow ? "danger" : timeLeft < 60 ? "warning" : ""}`}>{formatTime(timeLeft)}</div>
              </div>
              )}
              <div className="wl-hud-cell">
                <div className="wl-hud-label">Wrong</div>
                <div className={`wl-hud-value ${wrongDanger ? "danger" : wrongGuesses > 0 ? "warning" : ""}`}>
                  {wrongGuesses}<span style={{ fontSize: 14, color: "var(--text-muted)" }}>/{MAX_WRONG}</span>
                </div>
              </div>
              <div className="wl-hud-cell">
                <div className="wl-hud-label">Solved</div>
                <div className="wl-hud-value">
                  {completed.filter(Boolean).length}<span style={{ fontSize: 14, color: "var(--text-muted)" }}>/4</span>
                </div>
              </div>
            </div>
            {timerEnabled && (
              <div className="wl-timer-bar-wrap">
                <div className={`wl-timer-bar ${isLow ? "low" : ""}`} style={{ width: `${timerPct}%` }} />
              </div>
            )}
          </div>
        )}

        {/* ── ROUNDS ── */}
        {screen === "game" && (
          <div className="wl-rounds" style={{ marginTop: timerEnabled ? 0 : 16 }}>
            {puzzle.rounds.map((round, idx) => (
              <div
                key={idx}
                ref={el => { roundRefs.current[idx] = el; }}
                className={`wl-round ${completed[idx] ? "solved" : ""} ${activeRoundIdx === idx ? "active" : ""} ${pulseRoundIdx === idx ? "pulse" : ""} ${shakingRound === idx ? "shaking" : ""}`}
              >
                <div className="wl-round-header">
                  <div className="wl-round-num">Round {idx + 1}</div>
                  {completed[idx] && <div className="wl-round-solved-badge">✓ Solved</div>}
                </div>
                <div className="wl-words">
                  {round.words.map((w, wi) => {
                    const dir = directionHints[idx]?.[wi];
                    return (
                      <div key={wi} className="wl-word">
                        {dir === "before"
                          ? <div className="wl-dir-bar before" title="Answer goes before this word" />
                          : <div className="wl-dir-spacer" />}
                        <div className="wl-word-label">{w}</div>
                        {dir === "after"
                          ? <div className="wl-dir-bar after" title="Answer goes after this word" />
                          : <div className="wl-dir-spacer" />}
                      </div>
                    );
                  })}
                </div>
                {completed[idx] ? (
                  <div className="wl-answer-reveal">{round.answer.toUpperCase()}</div>
                ) : gameStatus !== "playing" ? (
                  <div className="wl-answer-reveal missed">{round.answer.toUpperCase()}</div>
                ) : (
                  <>
                    <div className="wl-answer-entry">
                      <div className="wl-input-row">
                        {Array.from({ length: round.answer.length }).map((_, li) => {
                          const guessLetters = guesses[idx].slice(0, round.answer.length).split("");
                          const letterValue = (guessLetters[li] || "").toUpperCase();
                          const lockedCount = hintLetters[idx].length;
                          const isGold = li < lockedCount;
                          return (
                            <input
                              key={li}
                              ref={el => { if (!letterInputRefs.current[idx]) letterInputRefs.current[idx] = []; letterInputRefs.current[idx][li] = el; }}
                              className={`wl-letter-input ${isGold ? "gold" : ""}`}
                              type="text" inputMode="text" maxLength={1}
                              value={isGold ? hintLetters[idx][li] || "" : letterValue}
                              onFocus={() => setActiveRoundIdx(idx)}
                              onChange={e => handleLetterChange(idx, li, e.target.value)}
                              onKeyDown={e => handleLetterKey(e, idx, li)}
                              disabled={gameStatus !== "playing" || isGold}
                              autoComplete="off" autoCapitalize="none"
                              aria-label={`Round ${idx + 1} letter ${li + 1}`}
                            />
                          );
                        })}
                      </div>
                      <button
                        className="wl-submit"
                        onClick={() => { setActiveRoundIdx(idx); submitGuess(idx); }}
                        disabled={guesses[idx].trim().length !== round.answer.length}
                      >Submit</button>
                    </div>
                    <div className="wl-error-msg">{errorMsgs[idx]}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── RESULTS ── */}
        {screen === "results" && (
          <ResultsModal
            gameStatus={gameStatus} timeTaken={timeTaken} wrongGuesses={wrongGuesses}
            completed={completed} stats={stats} puzzle={puzzle} timerEnabled={timerEnabled}
            isToday={activeDate === today}
            onShareResults={shareResults}
            onViewStats={() => setScreen("stats")}
            onGoHome={goHome}
            onViewArchived={openArchiveModal}
          />
        )}

        {/* ── STATS ── */}
        {screen === "stats" && stats && (
          <div className="wl-overlay">
            <div className="wl-modal">
              <div className="wl-modal-header">
                <div className="wl-modal-title" style={{ fontSize: 24 }}>Statistics</div>
                <CloseBtn onClick={() => setScreen("results")} />
              </div>
              <div className="wl-result-grid">
                <div className="wl-result-cell"><div className="wl-result-val">{stats.games_played}</div><div className="wl-result-label">Played</div></div>
                <div className="wl-result-cell"><div className="wl-result-val">{stats.games_played ? Math.round((stats.games_won / stats.games_played) * 100) : 0}%</div><div className="wl-result-label">Win Rate</div></div>
                <div className="wl-result-cell"><div className="wl-result-val">{stats.current_streak}</div><div className="wl-result-label">Streak</div></div>
                <div className="wl-result-cell"><div className="wl-result-val">{stats.max_streak}</div><div className="wl-result-label">Best Streak</div></div>
              </div>
              {stats.best_time && (
                <div className="wl-result-cell" style={{ marginBottom: 20, textAlign: "center", padding: 16 }}>
                  <div className="wl-result-val" style={{ color: "var(--accent)" }}>{formatTime(stats.best_time)}</div>
                  <div className="wl-result-label">Best Time</div>
                </div>
              )}
              <button className="wl-btn wl-btn-primary" onClick={() => setScreen("results")}>Back</button>
            </div>
          </div>
        )}

        {/* ── ARCHIVE CALENDAR ── */}
        {showArchiveModal && (
          <CalendarArchive
            archivedDates={archivedDates}
            loadingArchiveDates={loadingArchiveDates}
            today={today}
            completedDates={completedDates}
            onSelectDate={date => { setShowArchiveModal(false); gameStartTimeRef.current = Date.now(); setScreen("game"); setActiveDate(date); }}
            onClose={() => setShowArchiveModal(false)}
          />
        )}

        {/* ── NAV MENU ── */}
        {showMenu && (
          <NavDrawer
            onClose={() => setShowMenu(false)}
            onSettings={() => setShowSettings(true)}
            onArchive={openArchiveModal}
            onHome={() => {
              if (screen === "game" && gameStatus === "playing") setShowLeaveConfirm(true);
              else goHome();
            }}
            showArchive={screen !== "game"}
          />
        )}

        {/* ── HOW TO PLAY ── */}
        {showHelp && (
          <div className="wl-overlay" onClick={() => { setShowHelp(false); localStorage.setItem("wl_seen_help", "1"); }}>
            <div className="wl-modal" onClick={e => e.stopPropagation()}>
              <div className="wl-modal-header" style={{ marginBottom: 16 }}>
                <div className="wl-modal-title" style={{ fontSize: 24 }}>How to Play</div>
                <CloseBtn onClick={() => { setShowHelp(false); localStorage.setItem("wl_seen_help", "1"); }} />
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 16 }}>
                Enter one word per round that can pair with all three clues, either before or after each clue word to form a compound word or common phrase.
              </p>
              <div className="wl-howto-example">
                <p>Example:</p>
                <div className="ex-words">
                  <div className="ex-word">Heart</div>
                  <div className="ex-word">Fast</div>
                  <div className="ex-word">Down</div>
                </div>
                <div className="ex-answer">→ BREAK &nbsp;<span style={{ color: "var(--text-muted)", fontSize: 11 }}>heartbreak · breakfast · breakdown</span></div>
              </div>
              <div className="wl-rules" style={{ marginBottom: 8 }}>
                <div className="wl-rule"><div className="wl-rule-icon">⏱</div> {timerEnabled ? <>You have <strong>&nbsp;3 minutes</strong></> : <>No timer — play at your own pace. <span style={{ color: "var(--accent)" }}>Enable in ☰ Settings.</span></>}</div>
                <div className="wl-rule"><div className="wl-rule-icon">❌</div> Only <strong>&nbsp;4 wrong guesses</strong> allowed across all rounds</div>
                <div className="wl-rule"><div className="wl-rule-icon">🔗</div> The secret word combines with each clue to form a compound word</div>
                <div className="wl-rule"><div className="wl-rule-icon">💡</div> <span>Wrong guess 1: <strong>position bars</strong> appear — <span style={{ color: "var(--accent)", fontWeight: 700 }}>gold bar on top</span> means secret word goes <em>before</em> that clue, <span style={{ color: "var(--green)", fontWeight: 700 }}>green bar on bottom</span> means it goes <em>after</em></span></div>
                <div className="wl-rule"><div className="wl-rule-icon">🔤</div> Wrong guess 2 &amp; 3: letter hints are revealed one at a time</div>
                <div className="wl-rule"><div className="wl-rule-icon">🎯</div> Solve all 4 rounds to win</div>
              </div>
              <button className="wl-btn wl-btn-ghost" style={{ marginTop: 16 }} onClick={() => { setShowHelp(false); localStorage.setItem("wl_seen_help", "1"); }}>Got it</button>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {showSettings && (
          <SettingsModal
            lightMode={lightMode} timerEnabled={timerEnabled}
            onToggleLight={toggleLightMode} onToggleTimer={toggleTimerEnabled}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* ── LEAVE CONFIRM ── */}
        {showLeaveConfirm && (
          <div className="wl-overlay" onClick={() => setShowLeaveConfirm(false)}>
            <div className="wl-modal" style={{ maxWidth: 340, textAlign: "center" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🚪</div>
              <div className="wl-modal-title" style={{ fontSize: 22, textAlign: "center", marginBottom: 8 }}>Leave game?</div>
              <div className="wl-modal-sub" style={{ marginBottom: 24 }}>Your progress will be lost. Are you sure you want to go back to the home screen?</div>
              <button className="wl-btn wl-btn-primary" onClick={() => { setShowLeaveConfirm(false); setShowMenu(false); goHome(); }}>Yes, leave game</button>
              <button className="wl-btn wl-btn-ghost" onClick={() => setShowLeaveConfirm(false)}>Keep playing</button>
            </div>
          </div>
        )}

        {showCopied && <div className="wl-toast">✓ Copied to clipboard</div>}

      </div>
    </>
  );
}
