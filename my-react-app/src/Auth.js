import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useAuth } from "./AuthContext";

function Auth({ onBack }) {
  const { user, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function login() {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCred.user.getIdToken();
      await fetch("http://localhost:5000/protected", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsError(false);
      setMessage("Logged in successfully!");
    } catch (err) {
      setIsError(true);
      setMessage("Error: " + err.message);
    }
  }

  if (user) {
    return (
      <>
        <h2>Welcome back!</h2>
        <p className="welcome-email">{user.email}</p>
        <div className="divider" />
        <button className="btn-danger" onClick={logout}>Logout</button>
      </>
    );
  }

  return (
    <>
      <h2>Login</h2>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="btn-primary" onClick={login}>Login</button>
      <button className="btn-secondary" onClick={onBack}>Back</button>
      {message && <p className={`message ${isError ? "error" : "success"}`}>{message}</p>}
    </>
  );
}

export default Auth;