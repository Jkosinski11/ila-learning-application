import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import Auth from "./Auth";
import Register from "./Register";
import Dashboard from "./Dashboard";
import Landing from "./pages/landing";
import "./App.css";

function AppShell() {
  const { user, profile, loading, logout } = useAuth();
  const [view, setView] = useState("landing"); // landing | login | register | dashboard
  const [pendingLoginRedirect, setPendingLoginRedirect] = useState(false);

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
        : "card auth-card";

  function handleAuthenticated(nextProfile) {
    if (nextProfile?.accountType) {
      setPendingLoginRedirect(false);
      setView("dashboard");
    }
  }

  async function handleLoginClick() {
    setPendingLoginRedirect(true);

    if (user) {
      await logout();
    }

    setView("login");
  }

  return (
    <div className={shellClassName}>
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
      {view === "dashboard" && <Dashboard />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
