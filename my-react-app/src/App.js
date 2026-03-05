import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import Auth from "./Auth";
import Register from "./Register";
import Dashboard from "./Dashboard";
import "./App.css";

function AppShell() {
  const { user, profile, loading } = useAuth();
  const [view, setView] = useState("landing"); // landing | login | register | dashboard

  useEffect(() => {
    if (loading) return;

    if (user && profile) {
      setView("dashboard");
      return;
    }

    if (!user) {
      setView("landing");
    }
  }, [user, profile, loading]);

  if (loading) {
    return (
      <div className="card auth-card">
        <h1 className="app-title">iLa</h1>
        <p className="app-subtitle">Loading...</p>
      </div>
    );
  }

  const shellClassName = view === "dashboard" ? "card dashboard-shell" : "card auth-card";

  return (
    <div className={shellClassName}>
      {view === "landing" && (
        <>
          <h1 className="app-title">iLa</h1>
          <p className="app-subtitle">Learn how to build toward your financial future</p>
          <div className="divider" />
          <button className="btn-primary" onClick={() => setView("login")}>
            Login
          </button>
          <button className="btn-secondary" onClick={() => setView("register")}>
            Register
          </button>
        </>
      )}

      {view === "login" && <Auth onBack={() => setView("landing")} />}
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
