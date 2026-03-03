import { useState } from "react";
import { AuthProvider } from "./AuthContext";
import Auth from "./Auth";
import Register from "./Register";
import "./App.css";

function App() {
  const [view, setView] = useState("landing");

  return (
    <AuthProvider>
      <div className="card">
        {view === "landing" && (
          <>
            <h1 className="app-title">Investing Literacy App</h1>
            <p className="app-subtitle">Learn how to build toward your financial future</p>
            <div className="divider" />
            <button className="btn-primary" onClick={() => setView("login")}>Login</button>
            <button className="btn-secondary" onClick={() => setView("register")}>Register</button>
          </>
        )}
        {view === "login" && <Auth onBack={() => setView("landing")} />}
        {view === "register" && <Register onBack={() => setView("landing")} />}
      </div>
    </AuthProvider>
  );
}

export default App;