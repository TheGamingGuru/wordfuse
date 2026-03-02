import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://zznhpbacuxeusaogvjtg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bmhwYmFjdXhldXNhb2d2anRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTY0NzEsImV4cCI6MjA4NzQzMjQ3MX0.PZCulp9d0aGF-OAv6_lkNGs6elB6Q3hYH7U4XniydLk';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TOTAL_TIME = 180;
const MAX_WRONG = 4;
const APP_CACHE_VERSION = "2026-03-02";

// ─── FALLBACK PUZZLE ─────────────────────────────────────────────────────────
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
const formatDateInTimeZone = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const getTodayEST = () => formatDateInTimeZone(new Date(), "America/New_York");

const shiftDate = (isoDate, deltaDays) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const next = new Date(Date.UTC(year, month - 1, day));
  next.setUTCDate(next.getUTCDate() + deltaDays);
  return next.toISOString().split("T")[0];
};

const clampDateToToday = (isoDate, today) => (isoDate > today ? today : isoDate);
const isISODate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const writeDateParam = (url, date, today) => {
  if (date === today) {
    url.searchParams.delete("date");
    return;
  }
  url.searchParams.set("date", date);
};

const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const WIN_SPARKS = ["✨", "🎉", "⭐", "💫", "🥳", "🎊", "✨", "⭐"];

const getUserId = () => {
  let id = localStorage.getItem("wl_user_id");
  if (!id) {
    id = "u_" + Math.random().toString(36).slice(2, 11);
    localStorage.setItem("wl_user_id", id);
  }
  return id;
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&family=Nunito:wght@700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0f0e17;
    --surface: #1a1927;
    --surface2: #231f35;
    --border: #2e2a45;
    --accent: #e8c547;
    --accent2: #ff6b6b;
    --green: #52d68a;
    --text: #f0ede8;
    --text-muted: #8b8799;
    --font-display: 'Playfair Display', serif;
    --font-word: 'Nunito', sans-serif;
    --font-mono: 'DM Mono', monospace;
    --font-body: 'DM Sans', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-body); }

  html, body, #root {
    width: 100%;
    min-height: 100vh;
  }

  .wl-root {
    min-height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 16px 48px;
    background: var(--bg);
    background-image: radial-gradient(ellipse at 20% 0%, #1e1540 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 100%, #1a2840 0%, transparent 60%);
  }

  .wl-header-wrap {
    position: sticky;
    top: 0;
    z-index: 20;
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 8px 0 12px;
    margin-bottom: 20px;
    background: linear-gradient(to bottom, rgba(15, 14, 23, 0.98), rgba(15, 14, 23, 0.92), rgba(15, 14, 23, 0.74), rgba(15, 14, 23, 0));
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(46, 42, 69, 0.45);
  }

  .wl-header {
    width: 100%;
    max-width: 560px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0;
  }
  .wl-calendar-btn {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 14px;
    transition: border-color 0.2s, color 0.2s;
  }
  .wl-calendar-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .wl-archive-popover {
    position: absolute;
    right: 0;
    top: calc(100% + 10px);
    width: 240px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  }
  .wl-archive-label {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  .wl-date-input {
    width: 100%;
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 10px;
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .wl-logo {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: var(--text);
  }
  .wl-logo span { color: var(--accent); }
  .wl-date {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .wl-mini-btn {
    height: 30px;
    border-radius: 8px;
    padding: 0 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 11px;
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    transition: border-color 0.2s, color 0.2s;
  }
  .wl-mini-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .wl-mini-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* HUD */
  .wl-hud {
    width: 100%;
    max-width: 560px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    margin: 0 auto 28px;
  }
  .wl-hud-sticky {
    width: 100%;
    position: sticky;
    top: 70px;
    z-index: 15;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(to bottom, rgba(15, 14, 23, 0.95), rgba(15, 14, 23, 0.82), rgba(15, 14, 23, 0));
    padding-top: 4px;
  }
  .wl-hud-cell {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .wl-hud-label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .wl-hud-value {
    font-family: var(--font-mono);
    font-size: 24px;
    font-weight: 500;
    color: var(--text);
    line-height: 1;
  }
  .wl-hud-value.warning { color: var(--accent); }
  .wl-hud-value.danger  { color: var(--accent2); }

  /* TIMER BAR */
  .wl-timer-bar-wrap {
    width: 100%;
    max-width: 560px;
    height: 3px;
    background: var(--border);
    border-radius: 2px;
    margin: 0 auto 28px;
    overflow: hidden;
  }
  .wl-timer-bar {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width 1s linear, background 0.4s;
  }
  .wl-timer-bar.low { background: var(--accent2); }

  /* ROUNDS */
  .wl-rounds {
    width: 100%;
    max-width: 560px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .wl-round {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  .wl-round.solved {
    border-color: var(--green);
    box-shadow: 0 0 0 1px var(--green), 0 4px 24px rgba(82,214,138,0.08);
  }
  .wl-round.active {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px rgba(232, 197, 71, 0.5), 0 8px 20px rgba(232, 197, 71, 0.08);
  }
  .wl-round.solved.active {
    border-color: var(--green);
    box-shadow: 0 0 0 1px var(--green), 0 4px 24px rgba(82,214,138,0.08);
  }
  .wl-round.pulse {
    animation: roundFocusPulse 0.55s ease;
  }
  .wl-round.shaking {
    animation: shake 0.45s cubic-bezier(.36,.07,.19,.97) both;
  }

  @keyframes roundFocusPulse {
    0% { transform: translateY(0) scale(1); }
    40% { transform: translateY(-2px) scale(1.008); }
    100% { transform: translateY(0) scale(1); }
  }

  @keyframes shake {
    0%,100% { transform: translateX(0); }
    15%      { transform: translateX(-6px); }
    30%      { transform: translateX(6px); }
    45%      { transform: translateX(-5px); }
    60%      { transform: translateX(5px); }
    75%      { transform: translateX(-3px); }
    90%      { transform: translateX(3px); }
  }

  .wl-round-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .wl-round-num {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .wl-round-solved-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1px;
    color: var(--green);
    text-transform: uppercase;
  }

  .wl-words {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }
  .wl-word {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 8px;
    text-align: center;
    font-family: var(--font-word);
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 1px;
    line-height: 1.05;
    color: var(--text);
    text-transform: uppercase;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.24);
  }

  .wl-answer-entry {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .wl-input-row {
    display: flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
  }
  .wl-letter-input {
    width: 42px;
    height: 42px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    font-family: var(--font-mono);
    font-size: 18px;
    color: var(--text);
    text-transform: uppercase;
    text-align: center;
    outline: none;
    transition: border-color 0.2s, transform 0.1s, background 0.2s, color 0.2s;
  }
  .wl-letter-input:focus {
    border-color: var(--accent);
    transform: translateY(-1px);
  }
  .wl-letter-input.gold {
    background: color-mix(in srgb, var(--accent) 22%, var(--surface2));
    border-color: var(--accent);
    color: var(--accent);
    font-weight: 600;
  }
  .wl-letter-input:disabled {
    opacity: 0.8;
    cursor: not-allowed;
  }

  .wl-submit {
    background: var(--accent);
    color: var(--bg);
    border: none;
    border-radius: 10px;
    padding: 10px 18px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.3px;
    transition: opacity 0.15s, transform 0.1s;
    white-space: nowrap;
  }
  .wl-submit:hover:not(:disabled) { opacity: 0.88; transform: scale(0.98); }
  .wl-submit:disabled { opacity: 0.3; cursor: not-allowed; }

  .wl-error-msg {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--accent2);
    margin-top: 8px;
    letter-spacing: 0.5px;
    min-height: 16px;
  }

  .wl-answer-reveal {
    text-align: center;
    padding: 10px;
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 3px;
    color: var(--green);
    text-transform: uppercase;
  }
  .wl-answer-reveal.missed {
    color: var(--accent2);
  }

  /* MODAL OVERLAY */
  .wl-overlay {
    position: fixed; inset: 0;
    background: rgba(10,9,20,0.82);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 20px;
    animation: fadeIn 0.25s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .wl-modal {
    position: relative;
    overflow: hidden;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 32px 28px;
    max-width: 420px;
    width: 100%;
    animation: slideUp 0.3s cubic-bezier(0.22,1,0.36,1);
  }
  .wl-modal.wl-results-modal {
    max-width: 380px;
    padding: 24px 20px 18px;
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  .wl-win-burst {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .wl-win-spark {
    position: absolute;
    top: -14%;
    font-size: 20px;
    opacity: 0;
    animation: fallCelebrate 2.6s ease-out 1 forwards;
  }
  @keyframes fallCelebrate {
    0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(0.8); opacity: 0; }
    12% { opacity: 1; }
    100% { transform: translate3d(var(--drift), 520px, 0) rotate(520deg) scale(1.15); opacity: 0; }
  }

  .wl-modal-title {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 900;
    margin-bottom: 6px;
    line-height: 1.1;
  }
  .wl-modal-sub {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 24px;
  }
  .wl-results-modal .wl-modal-title {
    font-size: 28px;
    text-align: center;
    margin-bottom: 4px;
  }
  .wl-results-modal .wl-modal-sub {
    text-align: center;
    margin-bottom: 16px;
    line-height: 1.45;
  }

  /* HOW TO PLAY */
  .wl-howto-example {
    background: var(--surface2);
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 18px;
  }
  .wl-howto-example p {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 6px;
  }
  .wl-howto-example .ex-words {
    display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px;
  }
  .wl-howto-example .ex-word {
    background: var(--border);
    border-radius: 6px;
    padding: 4px 10px;
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .wl-howto-example .ex-answer {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--accent);
  }

  .wl-rules {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
  }
  .wl-rule {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--text-muted);
  }
  .wl-rule-icon {
    width: 28px; height: 28px;
    background: var(--surface2);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  /* RESULTS */
  .wl-result-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 14px;
  }
  .wl-result-cell {
    background: var(--surface2);
    border-radius: 10px;
    padding: 11px 10px;
    text-align: center;
  }
  .wl-result-val {
    font-family: var(--font-mono);
    font-size: 22px;
    font-weight: 500;
    color: var(--text);
    margin-bottom: 2px;
  }
  .wl-result-label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .wl-answer-list {
    background: var(--surface2);
    border-radius: 10px;
    padding: 10px 12px;
    margin-bottom: 14px;
  }
  .wl-answer-list-title {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 8px;
  }
  .wl-answer-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 3px;
    padding: 5px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }
  .wl-answer-row:last-child { border-bottom: none; }
  .wl-answer-row-words { color: var(--text-muted); font-size: 12px; }
  .wl-results-modal .wl-answer-row-words {
    font-family: var(--font-word);
    font-weight: 700;
    letter-spacing: 0.3px;
  }
  .wl-answer-row-ans {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .wl-answer-row-ans.correct { color: var(--green); }
  .wl-answer-row-ans.missed  { color: var(--accent2); }

  /* BUTTONS */
  .wl-btn {
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    border: none;
    font-family: var(--font-body);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    letter-spacing: 0.2px;
  }
  .wl-btn:hover { opacity: 0.88; transform: scale(0.99); }
  .wl-btn-primary { background: var(--accent); color: var(--bg); }
  .wl-btn-ghost {
    background: transparent;
    color: var(--text-muted);
    border: 1px solid var(--border);
    margin-top: 8px;
    font-size: 13px;
  }
  .wl-results-modal .wl-btn-ghost {
    margin-top: 6px;
  }
  .wl-archive-modal {
    max-width: 420px;
  }
  .wl-archive-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 20px 0;
    max-height: 320px;
    overflow-y: auto;
  }
  .wl-archive-date-btn {
    width: 100%;
    text-align: left;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text);
    border-radius: 10px;
    padding: 10px 14px;
    font-family: var(--font-mono);
    font-size: 13px;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .wl-archive-date-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .wl-archive-date-btn.today {
    border-color: var(--accent);
  }
  .wl-archive-date-tag {
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--accent);
  }
  .wl-archive-empty {
    margin: 18px 0;
    text-align: center;
    color: var(--text-muted);
    font-family: var(--font-body);
    font-size: 14px;
  }
  .wl-result-nav-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 10px;
  }

  /* STATS */
  .wl-stats-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px;
  }

  /* COPIED TOAST */
  .wl-toast {
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--green);
    color: var(--bg);
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.5px;
    padding: 12px 24px;
    border-radius: 40px;
    z-index: 200;
    animation: toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
    white-space: nowrap;
  }
  @keyframes toastIn {
    from { transform: translateX(-50%) translateY(16px); opacity: 0; }
    to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
  }

  /* LOADING */
  .wl-loading {
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 12px;
    background: var(--bg);
    font-family: var(--font-mono);
    color: var(--text-muted);
    font-size: 12px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .wl-spinner {
    width: 28px; height: 28px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ─── RESULTS MODAL ────────────────────────────────────────────────────────────
const ResultsModal = ({
  gameStatus,
  timeLeft,
  wrongGuesses,
  completed,
  stats,
  puzzle,
  onShareResults,
  onViewStats,
  onGoHome,
  onViewArchived,
}) => (
  <div className="wl-overlay">
    <div className="wl-modal wl-results-modal">
      {gameStatus === "won" && (
        <div className="wl-win-burst" aria-hidden="true">
          {WIN_SPARKS.map((spark, idx) => (
            <span
              key={`${spark}-${idx}`}
              className="wl-win-spark"
              style={{
                left: `${8 + idx * 12}%`,
                animationDelay: `${idx * 0.15}s`,
                "--drift": `${(idx % 2 === 0 ? 1 : -1) * (18 + idx * 2)}px`,
              }}
            >
              {spark}
            </span>
          ))}
        </div>
      )}
      <div className="wl-modal-title" style={{ color: gameStatus === "won" ? "var(--green)" : "var(--accent2)" }}>
        {gameStatus === "won" ? "You got it!" : "Game Over"}
      </div>
      <div className="wl-modal-sub">
        {gameStatus === "won"
          ? `Solved in ${formatTime(TOTAL_TIME - timeLeft)} with ${wrongGuesses} wrong guess${wrongGuesses !== 1 ? "es" : ""}`
          : "Better luck tomorrow!"}
      </div>
      <div className="wl-result-grid">
        <div className="wl-result-cell">
          <div className="wl-result-val">{formatTime(TOTAL_TIME - timeLeft)}</div>
          <div className="wl-result-label">Time Taken</div>
        </div>
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
      <button className="wl-btn wl-btn-primary" onClick={onShareResults}>Share Results</button>
      {stats && (
        <button className="wl-btn wl-btn-ghost" onClick={onViewStats}>View Stats</button>
      )}
      <div className="wl-result-nav-actions">
        <button className="wl-btn wl-btn-ghost" onClick={onGoHome} aria-label="Go home">🏠</button>
        <button className="wl-btn wl-btn-ghost" onClick={onViewArchived} aria-label="Browse past puzzles">📅 Past Puzzles</button>
      </div>
    </div>
  </div>
);

// ─── ARCHIVE MODAL ────────────────────────────────────────────────────────────
const ArchiveDatesModal = ({ archivedDates, loadingArchiveDates, today, onSelectDate, onClose }) => (
  <div className="wl-overlay" onClick={onClose}>
    <div className="wl-modal wl-archive-modal" onClick={(e) => e.stopPropagation()}>
      <div className="wl-stats-header">
        <div className="wl-modal-title" style={{ fontSize: 24 }}>Past Puzzles</div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 22 }}
          aria-label="Close"
        >×</button>
      </div>
      <div className="wl-modal-sub" style={{ marginTop: -8, marginBottom: 0 }}>
        Choose any date to play that puzzle.
      </div>
      {loadingArchiveDates ? (
        <div className="wl-archive-empty">Loading puzzles…</div>
      ) : archivedDates.length === 0 ? (
        <div className="wl-archive-empty">No past puzzles found.</div>
      ) : (
        <div className="wl-archive-list">
          {archivedDates.map((date) => (
            <button
              key={date}
              className={`wl-archive-date-btn ${date === today ? "today" : ""}`}
              onClick={() => onSelectDate(date)}
            >
              <span>{date}</span>
              {date === today && <span className="wl-archive-date-tag">Today</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function WordLinkGame() {
  useEffect(() => {
    const savedVersion = localStorage.getItem("wl_cache_version");
    if (savedVersion === APP_CACHE_VERSION) return;
    Object.keys(localStorage)
      .filter((key) => key.startsWith("wl_") && key !== "wl_seen_help" && key !== "wl_user_id")
      .forEach((key) => localStorage.removeItem(key));
    localStorage.setItem("wl_cache_version", APP_CACHE_VERSION);
  }, []);

  useEffect(() => {
    document.title = "WordFuse";
  }, []);

  const today = getTodayEST();
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDate, setActiveDate] = useState(() => {
    const urlDate = new URLSearchParams(window.location.search).get("date");
    if (!urlDate || !isISODate(urlDate)) return today;
    return clampDateToToday(urlDate, today);
  });
  const [showArchivePicker, setShowArchivePicker] = useState(false);
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
  const [showHelp, setShowHelp] = useState(() => {
    const seen = localStorage.getItem("wl_seen_help");
    return !seen;
  });
  const [showCopied, setShowCopied] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archivedDates, setArchivedDates] = useState([]);
  const [loadingArchiveDates, setLoadingArchiveDates] = useState(false);
  const [hintLetters, setHintLetters] = useState(["", "", "", ""]);
  const [wrongPerRound, setWrongPerRound] = useState([0, 0, 0, 0]);
  const [activeRoundIdx, setActiveRoundIdx] = useState(0);
  const timerRef = useRef(null);
  const letterInputRefs = useRef([[], [], [], []]);
  const roundRefs = useRef([]);
  const gameStatusRef = useRef("playing");
  const archivePickerRef = useRef(null);

  useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (showArchivePicker) { setShowArchivePicker(false); return; }
      if (showArchiveModal) { setShowArchiveModal(false); return; }
      if (showHelp) { setShowHelp(false); localStorage.setItem("wl_seen_help", "1"); return; }
      if (showCopied) { setShowCopied(false); return; }
      if (screen === "stats") { setScreen("results"); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showArchivePicker, showArchiveModal, showHelp, showCopied, screen]);

  useEffect(() => {
    if (!showArchivePicker) return;
    const handleOutsideClick = (event) => {
      if (!archivePickerRef.current?.contains(event.target)) {
        setShowArchivePicker(false);
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("touchstart", handleOutsideClick);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showArchivePicker]);

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

  const focusLetter = useCallback((roundIdx, letterIdx) => {
    letterInputRefs.current[roundIdx]?.[letterIdx]?.focus();
  }, []);

  // ── Open archive modal — fetch ALL puzzle dates up to today ──
  const openArchiveModal = useCallback(async () => {
    setShowArchiveModal(true);
    setLoadingArchiveDates(true);
    try {
      const { data } = await supabase
        .from("puzzles")
        .select("puzzle_date")
        .lte("puzzle_date", today)
        .order("puzzle_date", { ascending: false });

      const dates = (data || []).map((row) => row.puzzle_date).filter(Boolean);
      setArchivedDates(dates);
    } catch (_) {
      setArchivedDates([]);
    } finally {
      setLoadingArchiveDates(false);
    }
  }, [today]);

  // ── Load puzzle ──
  useEffect(() => {
    (async () => {
      setLoading(true);
      setArchiveMsg("");
      let p = null;
      try {
        const { data, error } = await supabase
          .from("puzzles")
          .select("*")
          .eq("puzzle_date", activeDate)
          .single();
        if (!error && data) p = data;
      } catch (_) {}

      if (!p) {
        p = { ...FALLBACK_PUZZLE, puzzle_date: activeDate };
        setArchiveMsg(activeDate === today
          ? "Today's live puzzle is unavailable — using practice puzzle."
          : "No puzzle found for this date — showing practice puzzle.");
      }

      p = {
        ...p,
        rounds: p.rounds.map((r) => ({
          ...r,
          words: r.words.map((w) => w.toUpperCase()),
        })),
      };
      setPuzzle(p);
      resetBoard();

      const url = new URL(window.location.href);
      writeDateParam(url, activeDate, today);
      window.history.replaceState({}, "", url);

      const savedResult = activeDate === today ? localStorage.getItem(`wl_played_${today}`) : null;
      if (savedResult) {
        const saved = JSON.parse(savedResult);
        setCompleted(saved.completed);
        setWrongGuesses(saved.wrongGuesses);
        setTimeLeft(saved.timeLeft);
        setHintLetters(saved.hintLetters || ["", "", "", ""]);
        setGameStatus(saved.gameStatus);
      }

      setLoading(false);
      loadStats();
    })();
  }, [activeDate, today]);

  useEffect(() => {
    if (screen !== "game" || gameStatus !== "playing") return;
    if (guesses.some((guess) => guess.length > 0)) return;
    const frame = requestAnimationFrame(() => focusLetter(0, 0));
    return () => cancelAnimationFrame(frame);
  }, [screen, gameStatus, guesses, focusLetter]);

  useEffect(() => {
    if (screen !== "game" || gameStatus !== "playing") return;
    const firstUnsolvedIdx = completed.findIndex((isDone) => !isDone);
    if (firstUnsolvedIdx === -1) return;
    if (completed[activeRoundIdx]) setActiveRoundIdx(firstUnsolvedIdx);
  }, [activeRoundIdx, completed, gameStatus, screen]);

  useEffect(() => {
    if (screen !== "game" || gameStatus !== "playing") return;
    const activeRoundEl = roundRefs.current[activeRoundIdx];
    if (!activeRoundEl) return;
    setPulseRoundIdx(activeRoundIdx);
    const pulseTimer = setTimeout(() => setPulseRoundIdx(null), 560);
    activeRoundEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    return () => clearTimeout(pulseTimer);
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

  // ── Timer ──
  useEffect(() => {
    if (screen !== "game" || gameStatus !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          triggerEndGame("lost");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, gameStatus]);

  // ── End game ──
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
    const snapshot = {
      completed: finalCompleted,
      wrongGuesses: finalWrongGuesses,
      timeLeft: finalTimeLeft,
      hintLetters: finalHintLetters,
      gameStatus: status,
    };
    if (activeDate === today) localStorage.setItem(`wl_played_${today}`, JSON.stringify(snapshot));

    const uid = getUserId();
    const timeTaken = TOTAL_TIME - finalTimeLeft;
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
      await supabase.from("user_stats").upsert(updated);
      setStats(updated);

      await supabase.from("game_results").insert({
        user_id: uid,
        puzzle_date: puzzle.puzzle_date,
        completed: isWin,
        time_taken: timeTaken,
        wrong_guesses: finalWrongGuesses,
      });
    } catch (_) {}
  }, [timeLeft, wrongGuesses, puzzle, activeDate, today, completed, hintLetters]);

  // ── Submit guess ──
  const submitGuess = useCallback((roundIdx) => {
    if (gameStatus !== "playing" || completed[roundIdx] || !guesses[roundIdx].trim()) return;

    const guess = guesses[roundIdx].trim().toLowerCase();
    const answer = puzzle.rounds[roundIdx].answer.toLowerCase();

    if (guess.length !== answer.length) {
      setErrorMsgs((e) => e.map((m, i) => (i === roundIdx ? `Enter all ${answer.length} letters` : m)));
      return;
    }

    if (guess === answer) {
      const newCompleted = completed.map((c, i) => (i === roundIdx ? true : c));
      setCompleted(newCompleted);
      setErrorMsgs((e) => e.map((m, i) => (i === roundIdx ? "" : m)));
      setHintLetters((h) => h.map((l, i) => (i === roundIdx ? "" : l)));
      const nextRound = newCompleted.findIndex((isDone) => !isDone);
      if (nextRound !== -1) {
        setActiveRoundIdx(nextRound);
        setTimeout(() => focusLetter(nextRound, hintLetters[nextRound].length), 10);
      }
      if (newCompleted.every(Boolean)) triggerEndGame("won", { completed: newCompleted });
    } else {
      setShakingRound(roundIdx);
      setTimeout(() => setShakingRound(null), 500);

      const newWrongPerRound = wrongPerRound.map((w, i) => (i === roundIdx ? w + 1 : w));
      setWrongPerRound(newWrongPerRound);
      const totalWrongNext = wrongGuesses + 1;

      const lettersRevealed = newWrongPerRound[roundIdx];
      const hintChar = answer[lettersRevealed - 1] ?? null;
      const isLosingGuess = totalWrongNext >= MAX_WRONG;

      if (hintChar && !isLosingGuess) {
        const revealed = answer.slice(0, lettersRevealed);
        setHintLetters((h) => h.map((l, i) => (i === roundIdx ? revealed.toUpperCase() : l)));
        setGuesses((g) => g.map((value, i) => (i === roundIdx ? revealed : value)));
        setErrorMsgs((e) => e.map((m, i) => (i === roundIdx ? `Hint: starts with "${revealed.toUpperCase()}"` : m)));
        setTimeout(() => focusLetter(roundIdx, Math.min(revealed.length, answer.length - 1)), 10);
      } else if (!isLosingGuess) {
        setErrorMsgs((e) => e.map((m, i) => (i === roundIdx ? "Not quite — try again" : m)));
      }

      setWrongGuesses((prev) => {
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
      let writeIdx = letterIdx;
      for (const token of rawValue.toLowerCase()) {
        if (!/[a-z]/.test(token)) continue;
        if (writeIdx >= answerLen) break;
        if (writeIdx < lockedCount) {
          writeIdx = lockedCount;
          if (writeIdx >= answerLen) break;
        }
        chars[writeIdx] = token;
        writeIdx += 1;
      }
      const nextGuess = chars.join("");
      setGuesses((g) => g.map((value, i) => (i === roundIdx ? nextGuess : value)));
      if (errorMsgs[roundIdx]) setErrorMsgs((em) => em.map((m, i) => (i === roundIdx ? "" : m)));
      if (writeIdx < answerLen) focusLetter(roundIdx, writeIdx);
      return;
    }

    const value = rawValue.toLowerCase();
    chars[letterIdx] = /[a-z]/.test(value) ? value : "";
    const nextGuess = chars.join("");
    setGuesses((g) => g.map((guess, i) => (i === roundIdx ? nextGuess : guess)));
    if (errorMsgs[roundIdx]) setErrorMsgs((em) => em.map((m, i) => (i === roundIdx ? "" : m)));
    if (value && letterIdx < answerLen - 1) focusLetter(roundIdx, letterIdx + 1);
  };

  const handleLetterKey = (e, roundIdx, letterIdx) => {
    const lockedCount = hintLetters[roundIdx].length;
    if (e.key === "Enter") { submitGuess(roundIdx); return; }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusLetter(roundIdx, Math.max(lockedCount, letterIdx - 1));
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusLetter(roundIdx, Math.min(puzzle.rounds[roundIdx].answer.length - 1, letterIdx + 1));
      return;
    }
    if (e.key === "Backspace" && !guesses[roundIdx][letterIdx] && letterIdx > lockedCount) {
      e.preventDefault();
      const previousIdx = letterIdx - 1;
      setGuesses((g) => {
        const chars = g[roundIdx].slice(0, puzzle.rounds[roundIdx].answer.length).split("");
        chars[previousIdx] = "";
        return g.map((guess, i) => (i === roundIdx ? chars.join("") : guess));
      });
      if (errorMsgs[roundIdx]) setErrorMsgs((em) => em.map((m, i) => (i === roundIdx ? "" : m)));
      focusLetter(roundIdx, previousIdx);
    }
  };

  const shareResults = () => {
    const gameUrl = new URL(window.location.href);
    writeDateParam(gameUrl, activeDate, today);
    const text = [
      `🔗 Play WordFuse: ${gameUrl.toString()}`,
      `📅 Puzzle: ${puzzle.puzzle_date}`,
      gameStatus === "won" ? `✅ Solved in ${formatTime(TOTAL_TIME - timeLeft)}!` : `❌ Game Over`,
      completed.map((c) => (c ? "🟩" : "🟥")).join(" "),
      `Wrong guesses: ${wrongGuesses}/${MAX_WRONG}`,
    ].join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2500);
  };

  const timerPct = (timeLeft / TOTAL_TIME) * 100;
  const isLow = timeLeft < 30;
  const wrongDanger = wrongGuesses >= MAX_WRONG - 1;

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="wl-loading">
          <div className="wl-spinner" />
          Loading today's puzzle
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="wl-root">

        {/* HEADER */}
        <div className="wl-header-wrap">
          <header className="wl-header">
            <button
              type="button"
              className="wl-logo"
              onClick={() => setScreen("home")}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              aria-label="Return to home"
            >
              Word<span style={{ color: "var(--accent)" }}>Fuse</span>
            </button>
            <div ref={archivePickerRef} style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
              <div className="wl-date">{activeDate === today ? "Daily Game" : puzzle.puzzle_date}</div>
              <button className="wl-calendar-btn" onClick={openArchiveModal} aria-label="Browse past puzzles">📅</button>
              <button
                onClick={() => setShowHelp(true)}
                style={{
                  width: 30, height: 30,
                  borderRadius: "50%",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  transition: "border-color 0.2s, color 0.2s",
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                aria-label="How to play"
              >?</button>
            </div>
          </header>
        </div>

        {archiveMsg && (
          <div className="wl-date" style={{ marginBottom: 12, maxWidth: 560, width: "100%", color: "var(--accent2)" }}>
            {archiveMsg}
          </div>
        )}

        {/* HOME SCREEN */}
        {screen === "home" && (
          <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 48 }}>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 16,
            }}>Daily Puzzle</div>

            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 1,
              marginBottom: 8,
              color: "var(--text)",
            }}>Word<span style={{ color: "var(--accent)" }}>Fuse</span></div>

            <div style={{
              fontFamily: "var(--font-body)",
              fontSize: 15,
              color: "var(--text-muted)",
              marginBottom: 56,
              maxWidth: 280,
              lineHeight: 1.6,
            }}>Find the word that links three clues. New puzzle every day.</div>

            <div style={{ display: "flex", gap: 24, marginBottom: 56, width: "100%", justifyContent: "center" }}>
              {[["⏱", "3 min"], ["❌", "4 wrong"], ["🎯", "4 rounds"]].map(([icon, label]) => (
                <div key={label} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  fontFamily: "var(--font-mono)", fontSize: 11,
                  letterSpacing: "1px", color: "var(--text-muted)",
                  textTransform: "uppercase",
                }}>
                  <div style={{
                    width: 44, height: 44,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20,
                  }}>{icon}</div>
                  {label}
                </div>
              ))}
            </div>

            <button className="wl-btn wl-btn-primary" style={{ maxWidth: 320 }} onClick={() => setScreen("game")}>
              {activeDate === today ? "Play Today's Puzzle" : `Play Game from ${activeDate}`}
            </button>
          </div>
        )}

        {/* HUD */}
        {screen === "game" && (
          <div className="wl-hud-sticky">
            <div className="wl-hud">
              <div className="wl-hud-cell">
                <div className="wl-hud-label">Time</div>
                <div className={`wl-hud-value ${isLow ? "danger" : timeLeft < 60 ? "warning" : ""}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
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
            <div className="wl-timer-bar-wrap">
              <div className={`wl-timer-bar ${isLow ? "low" : ""}`} style={{ width: `${timerPct}%` }} />
            </div>
          </div>
        )}

        {/* ROUNDS */}
        {screen === "game" && (
          <div className="wl-rounds">
            {puzzle.rounds.map((round, idx) => (
              <div
                key={idx}
                ref={(el) => { roundRefs.current[idx] = el; }}
                className={`wl-round ${completed[idx] ? "solved" : ""} ${activeRoundIdx === idx ? "active" : ""} ${pulseRoundIdx === idx ? "pulse" : ""} ${shakingRound === idx ? "shaking" : ""}`}
              >
                <div className="wl-round-header">
                  <div className="wl-round-num">Round {idx + 1}</div>
                  {completed[idx] && <div className="wl-round-solved-badge">✓ Solved</div>}
                </div>
                <div className="wl-words">
                  {round.words.map((w, wi) => (
                    <div key={wi} className="wl-word">{w}</div>
                  ))}
                </div>
                {completed[idx] ? (
                  <div className="wl-answer-reveal">{round.answer.toUpperCase()}</div>
                ) : gameStatus !== "playing" ? (
                  <div className="wl-answer-reveal missed">{round.answer.toUpperCase()}</div>
                ) : (
                  <>
                    <div className="wl-answer-entry">
                      <div className="wl-input-row">
                        {Array.from({ length: round.answer.length }).map((_, letterIdx) => {
                          const guessLetters = guesses[idx].slice(0, round.answer.length).split("");
                          const letterValue = (guessLetters[letterIdx] || "").toUpperCase();
                          const lockedCount = hintLetters[idx].length;
                          const isLockedGold = letterIdx < lockedCount;
                          return (
                            <input
                              key={letterIdx}
                              ref={(el) => {
                                if (!letterInputRefs.current[idx]) letterInputRefs.current[idx] = [];
                                letterInputRefs.current[idx][letterIdx] = el;
                              }}
                              className={`wl-letter-input ${isLockedGold ? "gold" : ""}`}
                              type="text"
                              inputMode="text"
                              maxLength={1}
                              value={isLockedGold ? hintLetters[idx][letterIdx] || "" : letterValue}
                              onFocus={() => setActiveRoundIdx(idx)}
                              onChange={(e) => handleLetterChange(idx, letterIdx, e.target.value)}
                              onKeyDown={(e) => handleLetterKey(e, idx, letterIdx)}
                              disabled={gameStatus !== "playing" || isLockedGold}
                              autoComplete="off"
                              autoCapitalize="none"
                              aria-label={`Round ${idx + 1} letter ${letterIdx + 1}`}
                            />
                          );
                        })}
                      </div>
                      <button
                        className="wl-submit"
                        onClick={() => {
                          setActiveRoundIdx(idx);
                          submitGuess(idx);
                        }}
                        disabled={guesses[idx].trim().length !== round.answer.length}
                      >
                        Submit
                      </button>
                    </div>
                    <div className="wl-error-msg">{errorMsgs[idx]}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* RESULTS SCREEN */}
        {screen === "results" && (
          <ResultsModal
            gameStatus={gameStatus}
            timeLeft={timeLeft}
            wrongGuesses={wrongGuesses}
            completed={completed}
            stats={stats}
            puzzle={puzzle}
            onShareResults={shareResults}
            onViewStats={() => setScreen("stats")}
            onGoHome={() => {
              setShowArchiveModal(false);
              setScreen("home");
            }}
            onViewArchived={openArchiveModal}
          />
        )}

        {/* ARCHIVE MODAL */}
        {showArchiveModal && (
          <ArchiveDatesModal
            archivedDates={archivedDates}
            loadingArchiveDates={loadingArchiveDates}
            today={today}
            onSelectDate={(date) => {
              setShowArchiveModal(false);
              setScreen("game");
              setActiveDate(date);
            }}
            onClose={() => setShowArchiveModal(false)}
          />
        )}

        {/* STATS SCREEN */}
        {screen === "stats" && stats && (
          <div className="wl-overlay">
            <div className="wl-modal">
              <div className="wl-stats-header">
                <div className="wl-modal-title" style={{ fontSize: 24 }}>Statistics</div>
                <button
                  onClick={() => setScreen("results")}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 22 }}
                  aria-label="Close"
                >×</button>
              </div>
              <div className="wl-result-grid">
                <div className="wl-result-cell">
                  <div className="wl-result-val">{stats.games_played}</div>
                  <div className="wl-result-label">Played</div>
                </div>
                <div className="wl-result-cell">
                  <div className="wl-result-val">
                    {stats.games_played ? Math.round((stats.games_won / stats.games_played) * 100) : 0}%
                  </div>
                  <div className="wl-result-label">Win Rate</div>
                </div>
                <div className="wl-result-cell">
                  <div className="wl-result-val">{stats.current_streak}</div>
                  <div className="wl-result-label">Streak</div>
                </div>
                <div className="wl-result-cell">
                  <div className="wl-result-val">{stats.max_streak}</div>
                  <div className="wl-result-label">Best Streak</div>
                </div>
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

        {showHelp && (
          <div className="wl-overlay" onClick={() => { setShowHelp(false); localStorage.setItem("wl_seen_help", "1"); }}>
            <div className="wl-modal" onClick={e => e.stopPropagation()}>
              <div className="wl-stats-header" style={{ marginBottom: 16 }}>
                <div className="wl-modal-title" style={{ fontSize: 24 }}>How to Play</div>
                <button
                  onClick={() => { setShowHelp(false); localStorage.setItem("wl_seen_help", "1"); }}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 22 }}
                >×</button>
              </div>
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--text-muted)",
                lineHeight: 1.6,
                marginBottom: 16,
              }}>
                Enter one word per round that can pair with all three clues, either before or after each clue word.
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
                <div className="wl-rule"><div className="wl-rule-icon">⏱</div> You have <strong>&nbsp;3 minutes</strong></div>
                <div className="wl-rule"><div className="wl-rule-icon">❌</div> Only <strong>&nbsp;4 wrong guesses</strong> allowed</div>
                <div className="wl-rule"><div className="wl-rule-icon">🔗</div> Word can come before OR after each clue</div>
                <div className="wl-rule"><div className="wl-rule-icon">🎯</div> Solve all 4 rounds to win</div>
              </div>
              <button className="wl-btn wl-btn-ghost" onClick={() => { setShowHelp(false); localStorage.setItem("wl_seen_help", "1"); }} style={{ marginTop: 16 }}>Got it</button>
            </div>
          </div>
        )}

        {/* COPIED TOAST */}
        {showCopied && (
          <div className="wl-toast">✓ Copied to clipboard</div>
        )}

      </div>
    </>
  );
}
