import { useState } from "react";
import { AuthProvider } from "./AuthContext";
import Auth from "./Auth";
import Register from "./Register";

function App() {
  const [view, setView] = useState("landing"); // "landing" | "login" | "register"

  return (
    <AuthProvider>
      {view === "landing" && (
        <div>
          <h1>Investing Literacy App</h1>
          <button onClick={() => setView("login")}>Login</button>
          <button onClick={() => setView("register")}>Register</button>
        </div>
      )}
      {view === "login" && (
        <Auth onBack={() => setView("landing")} />
      )}
      {view === "register" && (
        <Register onBack={() => setView("landing")} />
      )}
    </AuthProvider>
  );
}

export default App;