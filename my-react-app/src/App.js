import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import Auth from "./Auth";
import Register from "./Register";
import Dashboard from "./Dashboard";
import Landing from "./pages/landing";
import Setting from "./pages/Settings";
import Learn from "./pages/Learn";
import Performance from "./pages/Performance";

import "./App.css";

function AppShell() {
  const { user, profile, loading, logout } = useAuth();
  const [view, setView] = useState("landing");
  const [pendingLoginRedirect, setPendingLoginRedirect] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (loading) return;

    if (pendingLoginRedirect && user && profile?.accountType) {
      setView("dashboard");
      setPendingLoginRedirect(false);
      return;
    }

    if (!user && view === "dashboard") {
      setView("landing");
    }
  }, [user, profile, loading, view, pendingLoginRedirect]);

  if (loading) {
    return (
      <div className="card auth-card">
        <h1 className="app-title">iLa</h1>
        <p className="app-subtitle">Loading...</p>
      </div>
    );
  }

  const shellClassName =
    view === "landing"
      ? "landing-shell"
      : view === "dashboard"
        ? "card dashboard-shell"
        : view === "settings" || view === "learn" || view === "performance"
          ? ""
          : "card auth-card";

  function handleAuthenticated(nextProfile) {
    if (nextProfile?.accountType) {
      setPendingLoginRedirect(false);
      setView("dashboard");
    }
  }

  async function handleLoginClick() {
    setPendingLoginRedirect(true);
    if (user) await logout();
    setView("login");
  }

  return (
  <>
    {view === "settings" ? (
      <Setting
        onBack={() => setView("dashboard")}
        theme={theme}
        onThemeChange={setTheme}
      />

        ) : view === "learn" ? (
        <div className={`${theme}`}>
        <Learn />
        </div>
      ) : view === "performance" ? (
        <div className={`${theme}`}>
        <Performance />
        </div>
      ) : (

      <div className={`${shellClassName} ${theme}`}>  {/* ← add theme here */}
          {view === "landing" && (
            <Landing
              onLoginClick={handleLoginClick}
              onRegisterClick={() => setView("register")}
            />
          )}
          {view === "login" && (
            <Auth
              onBack={() => setView("landing")}
              onAuthenticated={handleAuthenticated}
            />
          )}
          {view === "register" && <Register onBack={() => setView("landing")} />}
          {view === "dashboard" && (
            <Dashboard onSettingsClick={() => setView("settings")} />
          )}
        </div>
      )}

      {/* Bottom nav — only shows when logged in */}
      {user && (
        <nav className="bottom-nav">
          <button
            className={`bottom-nav-item ${view === "dashboard" ? "active" : ""}`}
            onClick={() => setView("dashboard")}
          >
            <span className="bottom-nav-icon">🏠</span>
            <span className="bottom-nav-label">Dashboard</span>
          </button>
          <button
            className={`bottom-nav-item ${view === "learn" ? "active" : ""}`}
            onClick={() => setView("learn")}
          >
            <span className="bottom-nav-icon">🏫</span>
            <span className="bottom-nav-label">Class</span>
          </button>
          <button
            className={`bottom-nav-item ${view === "performance" ? "active" : ""}`}
            onClick={() => setView("performance")}
          >
            <span className="bottom-nav-icon">📈</span>
            <span className="bottom-nav-label">Performance</span>
          </button>
          <button
            className={`bottom-nav-item ${view === "settings" ? "active" : ""}`}
            onClick={() => setView("settings")}
          >
            <span className="bottom-nav-icon">⚙️</span>
            <span className="bottom-nav-label">Settings</span>
          </button>
        </nav>
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}