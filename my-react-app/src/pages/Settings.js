import { useState } from "react";
import { useAuth } from "../AuthContext";
import "./Settings.css";

function Settings({ onBack, theme, onThemeChange }) {
  const { profile, user } = useAuth();

  const [role] = useState("student");

  const [message, setMessage] = useState("");

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  };

  // 👤 PROFILE
  const [profileState, setProfileState] = useState({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    email: profile?.email || user?.email || "",
  });

  // 🎮 LEARNING
  const [learning, setLearning] = useState({
    dailyLessons: true,
    difficulty: "easy",
    sound: true,
  });

  // 💰 VIRTUAL MONEY
  const [portfolio, setPortfolio] = useState({
    startingBalance: 1000,
  });

  const canEditMoney = role === "teacher" || role === "admin";

  // 🔔 NOTIFICATIONS
  const [notifications, setNotifications] = useState({
    email: true,
    tradeAlerts: true,
    leaderboard: true,
    weeklyReport: true,
    achievements: true,
  });

  // 🛡️ PRIVACY
  const [privacy, setPrivacy] = useState({
    privateProfile: false,
    showPortfolio: true,
    allowMessages: true,
  });

  // 🔒 PARENT / ADMIN CONTROL
  const [system, setSystem] = useState({
    screenTime: 60,
  });

  return (
    <div className={`settings-container ${theme}`}>

      {/* HEADER */}
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
        <button onClick={onBack}>← Back</button>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="settings-content">

        {/* 👤 PROFILE */}
        <section className="card">
          <h2>👤 Profile</h2>

          <input
            placeholder="First Name"
            value={profileState.firstName}
            onChange={(e) => setProfileState({ ...profileState, firstName: e.target.value })}
          />

          <input
            placeholder="Last Name"
            value={profileState.lastName}
            onChange={(e) => setProfileState({ ...profileState, lastName: e.target.value })}
          />

          <input
            placeholder="Email"
            value={profileState.email}
            onChange={(e) => setProfileState({ ...profileState, email: e.target.value })}
          />

          <button onClick={() => showMessage("🎉 Profile updated!")}>
            Save Profile
          </button>
        </section>

        {/* 🎮 LEARNING SYSTEM */}
        <section className="card">
          <h2>🎮 Learning Mode</h2>

          <label>
            Daily Lessons 📘
            <input
              type="checkbox"
              checked={learning.dailyLessons}
              onChange={() =>
                setLearning({ ...learning, dailyLessons: !learning.dailyLessons })
              }
            />
          </label>

          <label>
            Sound Effects 🔊
            <input
              type="checkbox"
              checked={learning.sound}
              onChange={() =>
                setLearning({ ...learning, sound: !learning.sound })
              }
            />
          </label>

          <select
            value={learning.difficulty}
            onChange={(e) =>
              setLearning({ ...learning, difficulty: e.target.value })
            }
          >
            <option value="easy">Easy 🟢</option>
            <option value="medium">Medium 🟡</option>
            <option value="hard">Hard 🔴</option>
          </select>
        </section>

        {/* 💰 VIRTUAL MONEY */}
        <section className="card">
          <h2>💰 Virtual Money</h2>

          <input
            type="number"
            value={portfolio.startingBalance}
            disabled={!canEditMoney}
            onChange={(e) =>
              setPortfolio({ ...portfolio, startingBalance: e.target.value })
            }
          />

          {!canEditMoney && (
            <p className="lock-text">
              🔒 Only teachers and admins can change money
            </p>
          )}

          {canEditMoney && (
            <button onClick={() => showMessage("💰 Balance updated!")}>
              Update Balance
            </button>
          )}
        </section>

        {/* 🔔 NOTIFICATIONS */}
        <section className="card">
          <h2>🔔 Notifications</h2>

          <label>
            Email Updates 📧
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={() =>
                setNotifications({ ...notifications, email: !notifications.email })
              }
            />
          </label>

          <label>
            Trade Alerts 📈
            <input
              type="checkbox"
              checked={notifications.tradeAlerts}
              onChange={() =>
                setNotifications({ ...notifications, tradeAlerts: !notifications.tradeAlerts })
              }
            />
          </label>

          <label>
            Weekly Report 📊
            <input
              type="checkbox"
              checked={notifications.weeklyReport}
              onChange={() =>
                setNotifications({ ...notifications, weeklyReport: !notifications.weeklyReport })
              }
            />
          </label>

          <label>
            Achievements 🏆
            <input
              type="checkbox"
              checked={notifications.achievements}
              onChange={() =>
                setNotifications({ ...notifications, achievements: !notifications.achievements })
              }
            />
          </label>
        </section>

        {/* 🛡️ PRIVACY */}
        <section className="card">
          <h2>🛡️ Privacy</h2>

          <label>
            Private Profile 🔒
            <input
              type="checkbox"
              checked={privacy.privateProfile}
              onChange={() =>
                setPrivacy({ ...privacy, privateProfile: !privacy.privateProfile })
              }
            />
          </label>

          <label>
            Show Portfolio 💵
            <input
              type="checkbox"
              checked={privacy.showPortfolio}
              onChange={() =>
                setPrivacy({ ...privacy, showPortfolio: !privacy.showPortfolio })
              }
            />
          </label>

          <label>
            Allow Messages 💬
            <input
              type="checkbox"
              checked={privacy.allowMessages}
              onChange={() =>
                setPrivacy({ ...privacy, allowMessages: !privacy.allowMessages })
              }
            />
          </label>
        </section>

        {/* 🔒 SYSTEM (ADMIN ONLY) */}
        {role === "admin" && (
          <section className="card">
            <h2>🧠 System Control</h2>

            <input
              type="number"
              value={system.screenTime}
              onChange={(e) =>
                setSystem({ ...system, screenTime: e.target.value })
              }
            />

            <button onClick={() => showMessage("🧠 System updated!")}>
              Apply Settings
            </button>
          </section>
        )}

        {/* 🎨 THEME */}
        <section className="card">
          <h2>🎨 Theme</h2>

          <button onClick={() => onThemeChange("light")}>
            Light 🌞
          </button>

          <button onClick={() => onThemeChange("dark")}>
            Dark 🌙
          </button>

          <button onClick={() => onThemeChange("auto")}>
            Auto ⚡
          </button>
        </section>

      </div>
    </div>
  );
}

export default Settings;