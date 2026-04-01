import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useAuth } from "./AuthContext";

function Auth({ onBack, onAuthenticated }) {
  const { user, logout, refreshProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function handoffExistingSession() {
      if (!user) return;

      const nextProfile = await refreshProfile();
      if (nextProfile?.accountType) {
        onAuthenticated?.(nextProfile);
        return;
      }

      setIsError(true);
      setMessage("Your account is missing profile information.");
    }

    handoffExistingSession();
  }, [user, refreshProfile, onAuthenticated]);

  async function login() {
    setIsSubmitting(true);
    setMessage("");

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCred.user.getIdToken();
      const response = await fetch("http://localhost:5000/protected", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Login validation failed. Please try again.");
      }

      const nextProfile = await refreshProfile();
      if (!nextProfile?.accountType) {
        throw new Error("Your account is missing profile information.");
      }

      setIsError(false);
      setMessage("Logged in successfully!");
      onAuthenticated?.(nextProfile);
    } catch (err) {
      setIsError(true);
      setMessage("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h2>{user ? "Signing you in" : "Login"}</h2>
      {!user && (
        <>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn-primary" onClick={login} disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Login"}
          </button>
          <button className="btn-secondary" onClick={onBack}>Back</button>
        </>
      )}
      {user && (
        <>
          <p className="welcome-email">Loading your dashboard for {user.email}...</p>
          <div className="divider" />
          <button className="btn-danger" onClick={logout}>Logout</button>
        </>
      )}
      {message && <p className={`message ${isError ? "error" : "success"}`}>{message}</p>}
    </>
  );
}

export default Auth;
