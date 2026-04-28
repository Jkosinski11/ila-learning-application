import { useState } from "react";
import "./Learn.css";

const TOPICS = [
  {
    id: "stocks",
    emoji: "📈",
    title: "What is a Stock?",
    color: "teal",
    xp: 100,
    lessons: [
      {
        id: "stocks-1",
        title: "Owning a Piece of a Company",
        content: "When a company wants to grow, it can sell small pieces of itself to the public. These pieces are called stocks or shares. When you buy a stock, you become a part-owner of that company!",
        fact: "🍕 Imagine a pizza shop splits into 100 slices. If you buy 10 slices, you own 10% of the shop!",
      },
      {
        id: "stocks-2",
        title: "Why Do Prices Change?",
        content: "Stock prices go up when more people want to buy them, and down when more people want to sell. If a company makes a great product, more people want to own it — pushing the price up!",
        fact: "📱 When Apple releases a new iPhone and it sells out, their stock price often rises!",
      },
    ],
    quiz: [
      {
        q: "What does buying a stock mean?",
        options: ["Lending money to a company", "Becoming a part-owner of a company", "Buying products from a company", "Donating to a company"],
        answer: 1,
      },
      {
        q: "What happens to a stock price when more people want to buy it?",
        options: ["It stays the same", "It goes down", "It goes up", "It disappears"],
        answer: 2,
      },
      {
        q: "A company splits into 1000 shares. You buy 100. What % do you own?",
        options: ["1%", "100%", "50%", "10%"],
        answer: 3,
      },
    ],
  },
  {
    id: "buysell",
    emoji: "💰",
    title: "How to Buy & Sell",
    color: "green",
    xp: 120,
    lessons: [
      {
        id: "buysell-1",
        title: "The Stock Market",
        content: "The stock market is like a giant store where stocks are bought and sold every day. In the US, the two biggest are the NYSE and NASDAQ. They're open Monday–Friday from 9:30am to 4pm.",
        fact: "🏛️ The New York Stock Exchange (NYSE) is located on Wall Street in New York City!",
      },
      {
        id: "buysell-2",
        title: "Buy Low, Sell High",
        content: "The basic goal of investing is to buy stocks at a low price and sell them later at a higher price. The difference is your profit! But timing the market is very hard — even experts get it wrong.",
        fact: "📊 Warren Buffett, one of the richest investors ever, says his favorite holding time is 'forever'!",
      },
    ],
    quiz: [
      {
        q: "When are US stock markets open?",
        options: ["24/7", "Mon–Fri 9:30am–4pm", "Weekends only", "Mon–Fri 6am–8pm"],
        answer: 1,
      },
      {
        q: "What is the basic goal of stock investing?",
        options: ["Buy high, sell low", "Hold forever no matter what", "Buy low, sell high", "Avoid all risk"],
        answer: 2,
      },
    ],
  },
  {
    id: "risk",
    emoji: "🎲",
    title: "Risk & Diversification",
    color: "orange",
    xp: 150,
    lessons: [
      {
        id: "risk-1",
        title: "Don't Put All Eggs in One Basket",
        content: "Risk means the chance that an investment loses value. Diversification means spreading your money across many different stocks so that if one fails, you don't lose everything.",
        fact: "🧺 If you carry all your eggs in one basket and drop it — you lose everything. Spread them out!",
      },
      {
        id: "risk-2",
        title: "Risk vs Reward",
        content: "Higher risk investments can give you bigger rewards, but can also lose more money. Lower risk investments are safer but grow more slowly. Finding your balance is key!",
        fact: "🎢 Stocks are like a roller coaster — thrilling ups and downs. Bonds are more like a slow train — steady and calm.",
      },
    ],
    quiz: [
      {
        q: "What does diversification mean?",
        options: ["Buying only one stock", "Spreading money across many investments", "Selling all your stocks", "Investing only in bonds"],
        answer: 1,
      },
      {
        q: "Which is generally true about higher-risk investments?",
        options: ["They always make money", "They have potential for bigger gains AND bigger losses", "They are the safest option", "They never change in value"],
        answer: 1,
      },
    ],
  },
  {
    id: "charts",
    emoji: "📊",
    title: "Reading Charts",
    color: "blue",
    xp: 130,
    lessons: [
      {
        id: "charts-1",
        title: "Candlestick Charts",
        content: "A candlestick chart shows a stock's price movement. Each candle shows the open, close, high, and low price for a time period. Green candles mean the price went up. Red means it went down.",
        fact: "🕯️ Candlestick charts were invented by Japanese rice traders in the 1700s — long before modern stock markets!",
      },
      {
        id: "charts-2",
        title: "Trends & Patterns",
        content: "When a stock price keeps going up over time, that's called an uptrend. Going down is a downtrend. Investors look for patterns to predict where prices might go next.",
        fact: "📉 Even the best stocks in history have had big drops. Amazon fell 90% in 2001 — then rose 10,000% over the next 20 years!",
      },
    ],
    quiz: [
      {
        q: "What does a green candlestick mean?",
        options: ["The price went down", "The price stayed the same", "The price went up", "The market was closed"],
        answer: 2,
      },
      {
        q: "What is an uptrend?",
        options: ["A stock price falling over time", "A stock price staying flat", "A stock price rising over time", "A stock being delisted"],
        answer: 2,
      },
    ],
  },
  {
    id: "investors",
    emoji: "🏆",
    title: "Famous Investors",
    color: "purple",
    xp: 110,
    lessons: [
      {
        id: "investors-1",
        title: "Warren Buffett",
        content: "Warren Buffett started investing at age 11 and bought his first stock for $38. Today he's worth over $100 billion. His strategy: buy great companies and hold them for a long time.",
        fact: "🎂 Buffett bought his first stock at age 11. If you're 11-20, you're right in his footsteps!",
      },
      {
        id: "investors-2",
        title: "Cathie Wood & Peter Lynch",
        content: "Cathie Wood bets big on future technologies like AI and electric cars. Peter Lynch ran the best-performing mutual fund for 13 years by investing in companies he saw in everyday life.",
        fact: "🛒 Peter Lynch said 'invest in what you know' — if you love a product, the company behind it might be worth investigating!",
      },
    ],
    quiz: [
      {
        q: "How old was Warren Buffett when he bought his first stock?",
        options: ["18", "21", "11", "25"],
        answer: 2,
      },
      {
        q: "What is Peter Lynch's famous investing advice?",
        options: ["Buy only tech stocks", "Invest in what you know", "Never sell anything", "Only buy cheap stocks"],
        answer: 1,
      },
    ],
  },
];

const COLOR_MAP = {
  teal:   { bg: "#e6faf8", accent: "#0d9488", light: "#ccfbf1", badge: "#0f766e" },
  green:  { bg: "#f0fdf4", accent: "#16a34a", light: "#bbf7d0", badge: "#15803d" },
  orange: { bg: "#fff7ed", accent: "#ea580c", light: "#fed7aa", badge: "#c2410c" },
  blue:   { bg: "#eff6ff", accent: "#2563eb", light: "#bfdbfe", badge: "#1d4ed8" },
  purple: { bg: "#faf5ff", accent: "#9333ea", light: "#e9d5ff", badge: "#7e22ce" },
};

function XPBar({ xp, maxXp = 500 }) {
  const pct = Math.min((xp / maxXp) * 100, 100);
  return (
    <div className="xp-bar-wrap">
      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="xp-label">{xp} / {maxXp} XP</span>
    </div>
  );
}

function TopicCard({ topic, completed, locked, onStart }) {
  const colors = COLOR_MAP[topic.color];
  return (
    <div
      className={`topic-card ${completed ? "completed" : ""} ${locked ? "locked" : ""}`}
      style={{ "--accent": colors.accent, "--light": colors.light, "--bg": colors.bg }}
      onClick={() => !locked && onStart(topic)}
    >
      <div className="topic-emoji">{topic.emoji}</div>
      <div className="topic-info">
        <h3 className="topic-title">{topic.title}</h3>
        <div className="topic-meta">
          <span className="topic-xp">+{topic.xp} XP</span>
          <span className="topic-lessons">{topic.lessons.length} lessons · {topic.quiz.length} questions</span>
        </div>
      </div>
      <div className="topic-status">
        {completed ? "✅" : locked ? "🔒" : "▶"}
      </div>
    </div>
  );
}

function LessonView({ topic, onFinish }) {
  const [step, setStep] = useState(0);
  const colors = COLOR_MAP[topic.color];
  const lesson = topic.lessons[step];
  const isLast = step === topic.lessons.length - 1;

  return (
    <div className="lesson-view" style={{ "--accent": colors.accent, "--light": colors.light, "--bg": colors.bg }}>
      <div className="lesson-progress-dots">
        {topic.lessons.map((_, i) => (
          <div key={i} className={`dot ${i <= step ? "active" : ""}`} />
        ))}
      </div>

      <div className="lesson-card">
        <p className="lesson-step">Lesson {step + 1} of {topic.lessons.length}</p>
        <h2 className="lesson-title">{lesson.title}</h2>
        <p className="lesson-content">{lesson.content}</p>
        <div className="lesson-fact">
          <p>{lesson.fact}</p>
        </div>
      </div>

      <div className="lesson-actions">
        {step > 0 && (
          <button className="btn-back-lesson" onClick={() => setStep(step - 1)}>← Back</button>
        )}
        <button
          className="btn-next-lesson"
          onClick={() => isLast ? onFinish() : setStep(step + 1)}
        >
          {isLast ? "Take the Quiz! 🎯" : "Next →"}
        </button>
      </div>
    </div>
  );
}

function QuizView({ topic, onComplete }) {
  const colors = COLOR_MAP[topic.color];
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [done, setDone] = useState(false);

  const q = topic.quiz[current];

  function handleAnswer(idx) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.answer) setScore(score + 1);
  }

  function handleNext() {
    if (current + 1 >= topic.quiz.length) {
      setDone(true);
    } else {
      setCurrent(current + 1);
      setSelected(null);
      setAnswered(false);
    }
  }

  if (done) {
    const perfect = score === topic.quiz.length;
    const earned = Math.round((score / topic.quiz.length) * topic.xp);
    return (
      <div className="quiz-result" style={{ "--accent": colors.accent, "--light": colors.light }}>
        <div className="result-emoji">{perfect ? "🏆" : score >= topic.quiz.length / 2 ? "⭐" : "📚"}</div>
        <h2 className="result-title">{perfect ? "Perfect Score!" : score >= topic.quiz.length / 2 ? "Great Job!" : "Keep Practicing!"}</h2>
        <p className="result-score">{score} / {topic.quiz.length} correct</p>
        <div className="result-xp">+{earned} XP earned</div>
        <button className="btn-next-lesson" onClick={() => onComplete(earned)}>
          {perfect ? "Collect Reward 🎁" : "Continue →"}
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-view" style={{ "--accent": colors.accent, "--light": colors.light, "--bg": colors.bg }}>
      <div className="quiz-header">
        <span className="quiz-counter">Question {current + 1} of {topic.quiz.length}</span>
        <span className="quiz-score">Score: {score}</span>
      </div>

      <div className="quiz-card">
        <h2 className="quiz-question">{q.q}</h2>
        <div className="quiz-options">
          {q.options.map((opt, idx) => {
            let cls = "quiz-option";
            if (answered) {
              if (idx === q.answer) cls += " correct";
              else if (idx === selected) cls += " wrong";
            } else if (idx === selected) {
              cls += " selected";
            }
            return (
              <button key={idx} className={cls} onClick={() => handleAnswer(idx)}>
                <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                {opt}
              </button>
            );
          })}
        </div>
        {answered && (
          <div className={`quiz-feedback ${selected === q.answer ? "correct-fb" : "wrong-fb"}`}>
            {selected === q.answer ? "✅ Correct!" : `❌ The answer was: ${q.options[q.answer]}`}
          </div>
        )}
      </div>

      {answered && (
        <button className="btn-next-lesson" onClick={handleNext}>
          {current + 1 >= topic.quiz.length ? "See Results 🎯" : "Next Question →"}
        </button>
      )}
    </div>
  );
}

export default function Learn() {
  const [totalXp, setTotalXp] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [activeTopic, setActiveTopic] = useState(null);
  const [phase, setPhase] = useState("lesson"); // lesson | quiz

  function handleStartTopic(topic) {
    setActiveTopic(topic);
    setPhase("lesson");
  }

  function handleLessonDone() {
    setPhase("quiz");
  }

  function handleQuizComplete(earned) {
    setTotalXp(totalXp + earned);
    setCompleted([...completed, activeTopic.id]);
    setActiveTopic(null);
  }

  const streak = completed.length;

  if (activeTopic) {
    return (
      <div className="learn-root">
        <div className="learn-topbar">
          <button className="back-to-learn" onClick={() => setActiveTopic(null)}>← Exit</button>
          <span className="topbar-topic">{activeTopic.emoji} {activeTopic.title}</span>
          <span className="topbar-xp">⚡ {totalXp} XP</span>
        </div>
        {phase === "lesson"
          ? <LessonView topic={activeTopic} onFinish={handleLessonDone} />
          : <QuizView topic={activeTopic} onComplete={handleQuizComplete} />
        }
      </div>
    );
  }

  return (
    <div className="learn-root">
      {/* Header */}
      <div className="learn-header">
        <div>
          <h1 className="learn-title">📚 iLa Stock Academy</h1>
          <p className="learn-sub">Learn investing — level up your knowledge</p>
        </div>
        <div className="learn-stats">
          <div className="stat-chip">🔥 {streak} streak</div>
          <div className="stat-chip xp-chip">⚡ {totalXp} XP</div>
        </div>
      </div>

      {/* XP Bar */}
      <XPBar xp={totalXp} />

      {/* Progress banner */}
      {completed.length > 0 && (
        <div className="progress-banner">
          🎉 You've completed {completed.length} of {TOPICS.length} topics! Keep going!
        </div>
      )}

      {/* Topic cards */}
      <div className="topics-list">
        {TOPICS.map((topic, idx) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            completed={completed.includes(topic.id)}
            locked={false}
            onStart={handleStartTopic}
          />
        ))}
      </div>

      {/* Bottom padding for nav bar */}
      <div style={{ height: "80px" }} />
    </div>
  );
}