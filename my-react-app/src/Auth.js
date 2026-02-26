import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function login() {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCred.user.getIdToken();
      setMessage("Logged in!");

      await fetch("http://localhost:5000/protected", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function register() {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage("Account created!");
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div>
      <h2>Login / Register</h2>

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
      <button onClick={register}>Register</button>

      <p>{message}</p>
    </div>
  );
}

export default Auth;