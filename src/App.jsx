import { useState, useEffect } from 'react';
import { tanks } from './tanks';
import './App.css';



// Deterministically select a tank for the day based on EST date
function getDailyTank() {
  // Get current time in UTC, then convert to EST (UTC-5 or UTC-4 for DST)
  const now = new Date();
  // EST is UTC-5, but for simplicity, always use UTC-5 (no DST handling)
  const estOffset = -5 * 60; // in minutes
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const est = new Date(utc + estOffset * 60000);
  const y = est.getUTCFullYear();
  const m = est.getUTCMonth();
  const d = est.getUTCDate();
  // Use a simple hash of the date to pick a tank
  const seed = y * 10000 + (m + 1) * 100 + d;
  const idx = seed % tanks.length;
  return tanks[idx];
}

function getNextMidnightEST() {
  const now = new Date();
  // EST is UTC-5, but for simplicity, always use UTC-5 (no DST handling)
  const estOffset = -5 * 60; // in minutes
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const est = new Date(utc + estOffset * 60000);
  est.setUTCHours(24, 0, 0, 0); // set to next midnight
  return est.getTime() - (utc + estOffset * 60000 - now.getTime());
}

function App() {
  const [guess, setGuess] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [incorrectGuesses, setIncorrectGuesses] = useState(0); // NEW

  useEffect(() => {
    setAnswer(getDailyTank());
    setIncorrectGuesses(0); // Reset on new day
    // Calculate time left until next midnight EST
    const updateCountdown = () => {
      const now = new Date();
      // EST is UTC-5
      const estOffset = -5 * 60;
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const est = new Date(utc + estOffset * 60000);
      const nextMidnight = new Date(est);
      nextMidnight.setUTCHours(24, 0, 0, 0);
      const diff = nextMidnight.getTime() - est.getTime();
      setTimeLeft(diff);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setGuess(value);
    setFeedback(null);
    if (value.length > 0) {
      const filtered = tanks.filter(tank =>
        tank.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (name) => {
    setGuess(name);
    setSuggestions([]);
    setFeedback(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!guess.trim()) return;
    if (answer && guess.trim().toLowerCase() === answer.name.toLowerCase()) {
      setFeedback({ correct: true, message: "🎉 Correct! You guessed the tank!" });
    } else {
      setFeedback({ correct: false, message: "❌ Incorrect. Try again!" });
      setIncorrectGuesses((prev) => prev + 1); // Increment on incorrect
    }
  };

  // Format time left as HH:MM:SS
  const formatTime = (ms) => {
    let totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    totalSeconds %= 3600;
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="tankdle-container">
      <h1>Tankdle</h1>
      <form onSubmit={handleSubmit} autoComplete="off">
        <label htmlFor="tank-guess">Guess the War Thunder Tank:</label>
        <input
          id="tank-guess"
          type="text"
          value={guess}
          onChange={handleChange}
          autoComplete="off"
          placeholder="Start typing a tank name..."
        />
        {suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map((tank) => (
              <li
                key={tank.name}
                onClick={() => handleSuggestionClick(tank.name)}
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
              >
                <img
                  src={tank.image}
                  alt={tank.name}
                  style={{ width: 48, height: 32, objectFit: 'cover', marginRight: 8, borderRadius: 4, background: '#222' }}
                />
                {tank.name}
              </li>
            ))}
          </ul>
        )}
        <button type="submit" style={{ marginTop: '1rem', width: '100%' }}>
          Submit Guess
        </button>
      </form>
      {feedback && (
        <div
          style={{
            marginTop: '1rem',
            color: feedback.correct ? '#4BB543' : '#FF5252',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}
        >
          {feedback.message}
        </div>
      )}
      {answer && (
        <div className="hint" style={{ marginTop: '2rem' }}>
          <strong>Hint 1:</strong> Battle Rating: <span>{answer.battleRating}</span>
          {incorrectGuesses >= 1 && (
            <div style={{ marginTop: '0.5rem' }}>
              <strong>Hint 2:</strong> Country: <span>{answer.country}</span>
            </div>
          )}
          {incorrectGuesses >= 2 && (
            <div style={{ marginTop: '0.5rem' }}>
              <strong>Hint 3:</strong> Type: <span>{answer.type}</span>
            </div>
          )}
          {incorrectGuesses >= 3 && (
            <div style={{ marginTop: '0.5rem' }}>
              <strong>Hint 4:</strong> <img src={answer.image} alt="Tank" style={{ width: 120, borderRadius: 8, marginTop: 4 }} />
            </div>
          )}
        </div>
      )}
      <div className="countdown" style={{ marginTop: '1rem', fontWeight: 'bold' }}>
        Next tank available in: {formatTime(timeLeft)}
      </div>
    </div>
  );
}

export default App;
