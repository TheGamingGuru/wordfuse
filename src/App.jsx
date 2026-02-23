import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://zznhpbacuxeusaogvjtg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bmhwYmFjdXhldXNhb2d2anRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTY0NzEsImV4cCI6MjA4NzQzMjQ3MX0.PZCulp9d0aGF-OAv6_lkNGs6elB6Q3hYH7U4XniydLk';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TOTAL_TIME = 120;
const MAX_WRONG = 4;

// ─── FALLBACK PUZZLE (used if Supabase isn't connected yet) ──────────────────
const FALLBACK_PUZZLE = {
  puzzle_date: "2024-01-01",
  rounds: [
    { words: ["HEART", "FAST", "DOWN"], answer: "break" },
    { words: ["WATER", "HOUSE", "BACK"], answer: "light" },
    { words: ["SUN", "EYE", "BALL"], answer: "fire" },
    { words: ["TOOTH", "HAIR", "HAND"], answer: "brush" },
  ],
};

// ─── UTILS ───────────────────────────────────────────────────────────────────
const getTodayEST = () => {
  const est = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  return new Date(est).toISOString().split("T")[0];
};

const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

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
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');

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

  /* HEADER */
  .wl-header {
    width: 100%;
    max-width: 560px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
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

  /* HUD */
  .wl-hud {
    width: 100%;
    max-width: 560px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    margin-bottom: 28px;
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
    margin-bottom: 28px;
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
  .wl-round.shaking {
    animation: shake 0.45s cubic-bezier(.36,.07,.19,.97) both;
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
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: var(--text);
    text-transform: uppercase;
  }

  .wl-input-row {
    display: flex;
    gap: 8px;
    align-items: stretch;
  }
  .wl-input {
    flex: 1;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 14px;
    font-family: var(--font-mono);
    font-size: 15px;
    color: var(--text);
    outline: none;
    transition: border-color 0.2s;
    text-transform: lowercase;
  }
  .wl-input::placeholder { color: var(--text-muted); }
  .wl-input:focus { border-color: var(--accent); }

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
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 32px 28px;
    max-width: 420px;
    width: 100%;
    animation: slideUp 0.3s cubic-bezier(0.22,1,0.36,1);
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
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
    gap: 10px;
    margin-bottom: 20px;
  }
  .wl-result-cell {
    background: var(--surface2);
    border-radius: 10px;
    padding: 14px 12px;
    text-align: center;
  }
  .wl-result-val {
    font-family: var(--font-mono);
    font-size: 26px;
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
    padding: 14px;
    margin-bottom: 20px;
  }
  .wl-answer-list-title {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  .wl-answer-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }
  .wl-answer-row:last-child { border-bottom: none; }
  .wl-answer-row-words { color: var(--text-muted); font-size: 12px; }
  .wl-answer-row-ans {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .wl-answer-row-ans.correct { color: var(--green); }
  .wl-answer-row-ans.missed  { color: var(--accent2); }

  /* BUTTONS */
  .wl-btn {
    width: 100%;
    padding: 14px;
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

  /* STATS */
  .wl-stats-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px;
  }

  /* HINT LETTERS */
  .wl-hint {
    display: flex;
    gap: 5px;
    margin-top: 8px;
    align-items: center;
  }
  .wl-hint-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-right: 4px;
  }
  .wl-hint-letter {
    width: 28px; height: 28px;
    background: var(--surface2);
    border: 1px solid var(--accent);
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: 0;
    animation: popIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
  }
  .wl-hint-blank {
    width: 28px; height: 28px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  @keyframes popIn {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
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

// ─── SUPABASE SCHEMA (paste into Supabase SQL editor):
/*
create table puzzles (
  id uuid primary key default gen_random_uuid(),
  puzzle_date date unique not null,
  rounds jsonb not null
);

create table user_stats (
  user_id text primary key,
  games_played int default 0,
  games_won int default 0,
  current_streak int default 0,
  max_streak int default 0,
  best_time int
);

create table game_results (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  puzzle_date date,
  completed boolean,
  time_taken int,
  wrong_guesses int,
  created_at timestamptz default now()
);
*/

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function WordLinkGame() {
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guesses, setGuesses] = useState(["", "", "", ""]);
  const [completed, setCompleted] = useState([false, false, false, false]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [gameStatus, setGameStatus] = useState("playing"); // playing | won | lost
  const [shakingRound, setShakingRound] = useState(null);
  const [errorMsgs, setErrorMsgs] = useState(["", "", "", ""]);
  const [stats, setStats] = useState(null);
  const [screen, setScreen] = useState("home"); // home | game | stats | results
  const [showHelp, setShowHelp] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [hintLetters, setHintLetters] = useState(["", "", "", ""]);
  const [wrongPerRound, setWrongPerRound] = useState([0, 0, 0, 0]);
  const timerRef = useRef(null);
  const inputRefs = useRef([]);
  const gameStatusRef = useRef("playing");

  // Keep ref in sync
  useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);

  // ESC closes any open modal/overlay
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (showHelp)  { setShowHelp(false); return; }
      if (showCopied){ setShowCopied(false); return; }
      if (screen === "stats") { setScreen("results"); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showHelp, showCopied, screen]);

  // ── Load puzzle ──
  useEffect(() => {
    (async () => {
      const today = getTodayEST();
      let p = null;
      try {
        const { data, error } = await supabase
          .from("puzzles")
          .select("*")
          .eq("puzzle_date", today)
          .single();
        if (!error && data) p = data;
      } catch (_) {}

      if (!p) p = { ...FALLBACK_PUZZLE, puzzle_date: today };

      // Normalise words to uppercase
      p = {
        ...p,
        rounds: p.rounds.map((r) => ({
          ...r,
          words: r.words.map((w) => w.toUpperCase()),
        })),
      };
      setPuzzle(p);

      // Check if user already played today
      const savedResult = localStorage.getItem(`wl_played_${today}`);
      if (savedResult) {
        const saved = JSON.parse(savedResult);
        setCompleted(saved.completed);
        setWrongGuesses(saved.wrongGuesses);
        setTimeLeft(saved.timeLeft);
        setHintLetters(saved.hintLetters || ["", "", "", ""]);
        setGameStatus(saved.gameStatus);
        setScreen("results");
      }

      setLoading(false);
      loadStats();
    })();
  }, []);

  // ── Load stats ──
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
  const triggerEndGame = useCallback(async (status) => {
    if (gameStatusRef.current !== "playing") return;
    setGameStatus(status);
    gameStatusRef.current = status;
    clearInterval(timerRef.current);

    setTimeout(() => setScreen("results"), 600);

    // Persist result so user can't replay today
    const today = getTodayEST();
    const snapshot = {
      completed,
      wrongGuesses,
      timeLeft,
      hintLetters,
      gameStatus: status,
    };
    localStorage.setItem(`wl_played_${today}`, JSON.stringify(snapshot));

    const uid = getUserId();
    const timeTaken = TOTAL_TIME - timeLeft;
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
        wrong_guesses: wrongGuesses,
      });
    } catch (_) {}
  }, [timeLeft, wrongGuesses, puzzle]);

  // ── Submit guess ──
  const submitGuess = useCallback((roundIdx) => {
    if (gameStatus !== "playing" || completed[roundIdx] || !guesses[roundIdx].trim()) return;

    const guess = guesses[roundIdx].trim().toLowerCase();
    const answer = puzzle.rounds[roundIdx].answer.toLowerCase();

    if (guess === answer) {
      const newCompleted = completed.map((c, i) => (i === roundIdx ? true : c));
      setCompleted(newCompleted);
      setErrorMsgs((e) => e.map((m, i) => (i === roundIdx ? "" : m)));
      setHintLetters((h) => h.map((l, i) => (i === roundIdx ? "" : l)));
      if (newCompleted.every(Boolean)) triggerEndGame("won");
    } else {
      // Shake
      setShakingRound(roundIdx);
      setTimeout(() => setShakingRound(null), 500);

      // Count wrong guesses for this round and reveal next hint letter
      const newWrongPerRound = wrongPerRound.map((w, i) => (i === roundIdx ? w + 1 : w));
      setWrongPerRound(newWrongPerRound);
      const totalWrongNext = wrongGuesses + 1;

      // Reveal hint: wrongPerRound[roundIdx] tells us how many wrong for this round
      // Reveal letter at index = newWrongPerRound[roundIdx] - 1, but not on the losing guess
      const lettersRevealed = newWrongPerRound[roundIdx]; // 1 after first wrong
      const hintChar = answer[lettersRevealed - 1] ?? null;
      const isLosingGuess = totalWrongNext >= MAX_WRONG;

      if (hintChar && !isLosingGuess) {
        const revealed = answer.slice(0, lettersRevealed);
        setHintLetters((h) => h.map((l, i) => (i === roundIdx ? revealed.toUpperCase() : l)));
        setErrorMsgs((e) => e.map((m, i) => (i === roundIdx ? `Hint: starts with "${revealed.toUpperCase()}"` : m)));
      } else if (!isLosingGuess) {
        setErrorMsgs((e) => e.map((m, i) => (i === roundIdx ? "Not quite — try again" : m)));
      }

      setWrongGuesses((prev) => {
        const next = prev + 1;
        if (next >= MAX_WRONG) triggerEndGame("lost");
        return next;
      });
    }
  }, [gameStatus, completed, guesses, puzzle, triggerEndGame, wrongGuesses, wrongPerRound]);

  const handleKey = (e, idx) => {
    if (e.key === "Enter") submitGuess(idx);
  };

  const timerPct = (timeLeft / TOTAL_TIME) * 100;
  const isLow = timeLeft < 30;
  const wrongDanger = wrongGuesses >= MAX_WRONG - 1;

  // ── SHARE ──
  const shareResults = () => {
    const text = [
      `🔗 Word Link — ${puzzle.puzzle_date}`,
      gameStatus === "won" ? `✅ Solved in ${formatTime(TOTAL_TIME - timeLeft)}!` : `❌ Game Over`,
      completed.map((c) => (c ? "🟩" : "🟥")).join(" "),
      `Wrong guesses: ${wrongGuesses}/${MAX_WRONG}`,
    ].join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2500);
  };

  // ─── SCREENS ────────────────────────────────────────────────────────────────

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
        <header className="wl-header">
          <div className="wl-logo">Word<span>.</span>Link</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="wl-date">{puzzle.puzzle_date}</div>
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
            }}>Word<span style={{ color: "var(--accent)" }}>.</span><br/>Link</div>

            <div style={{
              fontFamily: "var(--font-body)",
              fontSize: 15,
              color: "var(--text-muted)",
              marginBottom: 56,
              maxWidth: 280,
              lineHeight: 1.6,
            }}>Find the word that links three clues. New puzzle every day.</div>

            <div style={{ display: "flex", gap: 24, marginBottom: 56, width: "100%", justifyContent: "center" }}>
              {[["⏱", "2 min"], ["❌", "4 wrong"], ["🎯", "4 rounds"]].map(([icon, label]) => (
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
              Play Today's Puzzle
            </button>
          </div>
        )}

        {/* HUD */}
        {screen === "game" && (
          <>
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
          </>
        )}

        {/* ROUNDS */}
        {screen === "game" && (
          <div className="wl-rounds">
            {puzzle.rounds.map((round, idx) => (
              <div
                key={idx}
                className={`wl-round ${completed[idx] ? "solved" : ""} ${shakingRound === idx ? "shaking" : ""}`}
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
                    <div className="wl-input-row">
                      <input
                        ref={(el) => (inputRefs.current[idx] = el)}
                        className="wl-input"
                        type="text"
                        placeholder="linking word…"
                        value={guesses[idx]}
                        onChange={(e) => {
                          const next = [...guesses];
                          next[idx] = e.target.value;
                          setGuesses(next);
                          if (errorMsgs[idx]) setErrorMsgs((em) => em.map((m, i) => (i === idx ? "" : m)));
                        }}
                        onKeyDown={(e) => handleKey(e, idx)}
                        disabled={gameStatus !== "playing"}
                        autoComplete="off"
                        autoCapitalize="none"
                      />
                      <button
                        className="wl-submit"
                        onClick={() => submitGuess(idx)}
                        disabled={!guesses[idx].trim()}
                      >Submit</button>
                    </div>
                    <div className="wl-error-msg">{errorMsgs[idx]}</div>
                    {hintLetters[idx] && (
                      <div className="wl-hint">
                        <span className="wl-hint-label">Hint</span>
                        {hintLetters[idx].split("").map((letter, li) => (
                          <div key={li} className="wl-hint-letter">{letter}</div>
                        ))}
                        {Array.from({ length: Math.max(0, puzzle.rounds[idx].answer.length - hintLetters[idx].length) }).map((_, li) => (
                          <div key={"b" + li} className="wl-hint-blank" />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* RESULTS SCREEN */}
        {screen === "results" && (
          <div className="wl-overlay">
            <div className="wl-modal">
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
                    <div className="wl-result-val">{stats.current_streak} {stats.current_streak > 1 ? "🔥" : ""}</div>
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
              <button className="wl-btn wl-btn-primary" onClick={shareResults}>Share Results</button>
              {stats && (
                <button className="wl-btn wl-btn-ghost" onClick={() => setScreen("stats")}>View Stats</button>
              )}
            </div>
          </div>
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

        {/* HELP MODAL */}
        {showHelp && (
          <div className="wl-overlay" onClick={() => setShowHelp(false)}>
            <div className="wl-modal" onClick={e => e.stopPropagation()}>
              <div className="wl-stats-header" style={{ marginBottom: 16 }}>
                <div className="wl-modal-title" style={{ fontSize: 24 }}>How to Play</div>
                <button
                  onClick={() => setShowHelp(false)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 22 }}
                >×</button>
              </div>

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
                <div className="wl-rule"><div className="wl-rule-icon">⏱</div> You have <strong>&nbsp;2 minutes</strong></div>
                <div className="wl-rule"><div className="wl-rule-icon">❌</div> Only <strong>&nbsp;4 wrong guesses</strong> allowed</div>
                <div className="wl-rule"><div className="wl-rule-icon">🔗</div> Word can come before OR after each clue</div>
                <div className="wl-rule"><div className="wl-rule-icon">🎯</div> Solve all 4 rounds to win</div>
              </div>

              <button className="wl-btn wl-btn-ghost" onClick={() => setShowHelp(false)} style={{ marginTop: 16 }}>Got it</button>
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