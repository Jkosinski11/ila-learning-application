import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useAuth } from "./AuthContext";

function Auth({ onBack }) {
  const { user, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function login() {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCred.user.getIdToken();

      const response = await fetch("http://localhost:5000/protected", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMessage("Logged in! Backend says: " + data.message);
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  }

  if (user) {
    return (
      <div>
        <h2>Welcome!</h2>
        <p>Logged in as: {user.email}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Login</h2>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={login}>Login</button>
      <button onClick={onBack}>Back</button>
      <p>{message}</p>
    </div>
  );
}

export default Auth;