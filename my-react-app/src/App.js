import { useState } from "react";
import { AuthProvider } from "./AuthContext";
import Auth from "./Auth";
import Register from "./Register";
import Landing from "./pages/landing";
import "./App.css";

function App() {
  const [view, setView] = useState("landing");

  return (
    <AuthProvider>
      {view === "landing" ? (
        <Landing onLoginClick={() => setView("login")} onRegisterClick={() => setView("register")} />
      ) : (
        <div className="card">
          {view === "login" && <Auth onBack={() => setView("landing")} />}
          {view === "register" && <Register onBack={() => setView("landing")} />}
        </div>
      )}
    </AuthProvider>
  );
}

export default App;