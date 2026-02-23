import React, { useState, useEffect, useRef } from 'react';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm';

// Supabase Configuration
const SUPABASE_URL = 'https://zznhpbacuxeusaogvjtg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bmhwYmFjdXhldXNhb2d2anRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTY0NzEsImV4cCI6MjA4NzQzMjQ3MX0.PZCulp9d0aGF-OAv6_lkNGs6elB6Q3hYH7U4XniydLk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const WordLinkGame = () => {
  const [puzzle, setPuzzle] = useState(null);
  const [guesses, setGuesses] = useState(['', '', '', '']);
  const [completed, setCompleted] = useState([false, false, false, false]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const timerRef = useRef(null);
  const inputRefs = useRef([]);

  // Get today's puzzle date (EST)
  const getTodayPuzzleDate = () => {
    const now = new Date();
    const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    return est.toISOString().split('T')[0];
  };

  // Load puzzle from Supabase
  useEffect(() => {
    loadTodaysPuzzle();
    loadStats();
  }, []);

  const loadTodaysPuzzle = async () => {
    const puzzleDate = getTodayPuzzleDate();
    
    try {
      const { data, error } = await supabase
        .from('puzzles')
        .select('*')
        .eq('puzzle_date', puzzleDate)
        .single();

      if (error) {
        console.error('Error loading puzzle:', error);
        // Fallback puzzle if database isn't set up yet
        setPuzzle({
          puzzle_date: puzzleDate,
          rounds: [
            { words: ['heart', 'fast', 'down'], answer: 'break' },
            { words: ['water', 'house', 'back'], answer: 'light' },
            { words: ['sun', 'eye', 'ball'], answer: 'fire' },
            { words: ['tooth', 'hair', 'hand'], answer: 'brush' }
          ]
        });
        return;
      }

      setPuzzle(data);

      // Check if user has already played today
      const savedState = localStorage.getItem(`puzzle_${puzzleDate}`);
      if (savedState) {
        const state = JSON.parse(savedState);
        setGuesses(state.guesses);
        setCompleted(state.completed);
        setWrongGuesses(state.wrongGuesses);
        setTimeLeft(state.timeLeft);
        setGameStatus(state.gameStatus);
        
        if (state.gameStatus !== 'playing') {
          setShowInstructions(false);
        }
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const loadStats = async () => {
    const userId = getUserId();
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data) {
        setStats(data);
      } else {
        // Initialize stats
        const newStats = {
          user_id: userId,
          games_played: 0,
          games_won: 0,
          current_streak: 0,
          max_streak: 0,
          best_time: null
        };
        setStats(newStats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const getUserId = () => {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_id', userId);
    }
    return userId;
  };

  // Timer
  useEffect(() => {
    if (gameStatus === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame('lost');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStatus, timeLeft]);

  // Save game state
  useEffect(() => {
    if (puzzle && gameStatus !== 'playing') {
      const puzzleDate = getTodayPuzzleDate();
      const state = {
        guesses,
        completed,
        wrongGuesses,
        timeLeft,
        gameStatus
      };
      localStorage.setItem(`puzzle_${puzzleDate}`, JSON.stringify(state));
    }
  }, [gameStatus, guesses, completed, wrongGuesses, timeLeft, puzzle]);

  const handleGuess = (roundIndex, value) => {
    if (gameStatus !== 'playing' || completed[roundIndex]) return;

    const newGuesses = [...guesses];
    newGuesses[roundIndex] = value.toLowerCase().trim();
    setGuesses(newGuesses);
  };

  const submitGuess = (roundIndex) => {
    if (gameStatus !== 'playing' || completed[roundIndex] || !guesses[roundIndex]) return;

    const guess = guesses[roundIndex].toLowerCase().trim();
    const answer = puzzle.rounds[roundIndex].answer.toLowerCase();

    if (guess === answer) {
      const newCompleted = [...completed];
      newCompleted[roundIndex] = true;
      setCompleted(newCompleted);

      // Check if all rounds completed
      if (newCompleted.every(c => c)) {
        endGame('won');
      }
    } else {
      const newWrongGuesses = wrongGuesses + 1;
      setWrongGuesses(newWrongGuesses);

      if (newWrongGuesses >= 4) {
        endGame('lost');
      }
    }
  };

  const endGame = async (status) => {
    setGameStatus(status);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Update stats
    const userId = getUserId();
    const timeTaken = 120 - timeLeft;
    
    try {
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      const isWin = status === 'won';
      const newStreak = isWin ? (currentStats?.current_streak || 0) + 1 : 0;
      
      const updatedStats = {
        user_id: userId,
        games_played: (currentStats?.games_played || 0) + 1,
        games_won: (currentStats?.games_won || 0) + (isWin ? 1 : 0),
        current_streak: newStreak,
        max_streak: Math.max(newStreak, currentStats?.max_streak || 0),
        best_time: isWin && (!currentStats?.best_time || timeTaken < currentStats.best_time) 
          ? timeTaken 
          : currentStats?.best_time
      };

      await supabase
        .from('user_stats')
        .upsert(updatedStats);

      setStats(updatedStats);

      // Save game result
      await supabase
        .from('game_results')
        .insert({
          user_id: userId,
          puzzle_date: puzzle.puzzle_date,
          completed: isWin,
          time_taken: timeTaken,
          wrong_guesses: wrongGuesses
        });

    } catch (err) {
      console.error('Error updating stats:', err);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const shareResults = () => {
    const timeTaken = 120 - timeLeft;
    const emoji = gameStatus === 'won' ? '🟢' : '🔴';
    const roundsEmoji = completed.map(c => c ? '✅' : '❌').join(' ');
    
    const text = `Word Link Daily ${puzzle.puzzle_date}
${emoji} ${gameStatus === 'won' ? 'Solved' : 'Failed'}
Time: ${formatTime(timeTaken)}
Wrong: ${wrongGuesses}/4
${roundsEmoji}`;

    navigator.clipboard.writeText(text);
    alert('Results copied to clipboard!');
  };

  if (!puzzle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-xl text-gray-600">Loading puzzle...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">Word Link</h1>
          <p className="text-gray-600">Find the connecting word for each round</p>
        </div>

        {/* Instructions Modal */}
        {showInstructions && gameStatus === 'playing' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold text-indigo-900 mb-4">How to Play</h2>
              <div className="space-y-3 text-gray-700">
                <p>Find one word that can come <strong>before or after</strong> each set of three words.</p>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <p className="font-semibold">Example:</p>
                  <p className="text-sm">heart, fast, down → <strong>BREAK</strong></p>
                  <p className="text-xs text-gray-600 mt-1">(breakfast, heartbreak, breakdown)</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>⏱️ You have <strong>2 minutes</strong></li>
                  <li>❌ You can make <strong>4 wrong guesses</strong></li>
                  <li>🎯 Solve all 4 rounds to win</li>
                  <li>🔀 Complete rounds in any order</li>
                </ul>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Start Playing
              </button>
            </div>
          </div>
        )}

        {/* Stats and Timer */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-6">
              <div>
                <div className="text-xs text-gray-500 uppercase">Time</div>
                <div className={`text-2xl font-bold ${timeLeft < 30 ? 'text-red-600' : 'text-indigo-900'}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Wrong</div>
                <div className={`text-2xl font-bold ${wrongGuesses >= 3 ? 'text-red-600' : 'text-indigo-900'}`}>
                  {wrongGuesses}/4
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowStats(true)}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-semibold"
            >
              Stats
            </button>
          </div>
        </div>

        {/* Rounds */}
        <div className="space-y-4">
          {puzzle.rounds.map((round, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-xl shadow-lg p-6 transition-all ${
                completed[idx] ? 'ring-4 ring-green-400' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-700">Round {idx + 1}</h3>
                {completed[idx] && (
                  <span className="text-green-600 font-semibold text-sm">✓ Completed</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {round.words.map((word, wordIdx) => (
                  <div
                    key={wordIdx}
                    className="bg-indigo-50 rounded-lg p-3 text-center"
                  >
                    <span className="text-lg font-semibold text-indigo-900 uppercase">
                      {word}
                    </span>
                  </div>
                ))}
              </div>

              {gameStatus === 'playing' && !completed[idx] ? (
                <div className="flex gap-2">
                  <input
                    ref={el => inputRefs.current[idx] = el}
                    type="text"
                    value={guesses[idx]}
                    onChange={(e) => handleGuess(idx, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        submitGuess(idx);
                      }
                    }}
                    placeholder="Enter linking word..."
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-lg"
                    disabled={gameStatus !== 'playing'}
                  />
                  <button
                    onClick={() => submitGuess(idx)}
                    disabled={!guesses[idx]}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Submit
                  </button>
                </div>
              ) : (
                <div className="text-center py-3">
                  <span className="text-xl font-bold text-green-600 uppercase">
                    {round.answer}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Game Over Modal */}
        {gameStatus !== 'playing' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md shadow-2xl">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {gameStatus === 'won' ? '🎉' : '😔'}
                </div>
                <h2 className="text-3xl font-bold text-indigo-900 mb-2">
                  {gameStatus === 'won' ? 'Congratulations!' : 'Game Over'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {gameStatus === 'won' 
                    ? `You solved it in ${formatTime(120 - timeLeft)}!` 
                    : 'Better luck tomorrow!'}
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Answers:</h3>
                  <div className="space-y-2 text-sm">
                    {puzzle.rounds.map((round, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-gray-600">Round {idx + 1}:</span>
                        <span className="font-bold text-indigo-900 uppercase">{round.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={shareResults}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Share Results
                  </button>
                  <button
                    onClick={() => setShowStats(true)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    View Stats
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Modal */}
        {showStats && stats && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold text-indigo-900 mb-6 text-center">Your Statistics</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-indigo-900">{stats.games_played}</div>
                  <div className="text-xs text-gray-600 uppercase mt-1">Played</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-700">{stats.games_won}</div>
                  <div className="text-xs text-gray-600 uppercase mt-1">Won</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-700">{stats.current_streak}</div>
                  <div className="text-xs text-gray-600 uppercase mt-1">Current Streak</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-orange-700">{stats.max_streak}</div>
                  <div className="text-xs text-gray-600 uppercase mt-1">Max Streak</div>
                </div>
              </div>

              {stats.best_time && (
                <div className="bg-yellow-50 rounded-lg p-4 text-center mb-6">
                  <div className="text-2xl font-bold text-yellow-700">{formatTime(stats.best_time)}</div>
                  <div className="text-xs text-gray-600 uppercase mt-1">Best Time</div>
                </div>
              )}

              <button
                onClick={() => setShowStats(false)}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordLinkGame;