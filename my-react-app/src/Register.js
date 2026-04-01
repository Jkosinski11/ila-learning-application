import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { STARTING_CASH_CENTS } from "./models/contracts";

function makeClassCode() {
  return `CLS${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function Register({ onBack }) {
  const [accountType, setAccountType] = useState(""); // "student" | "teacher" | "admin"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function classCodeExists(code) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("classCode", "==", code), limit(20));
    const snapshot = await getDocs(q);

    return snapshot.docs.some((item) => item.data()?.accountType === "teacher");
  }

  async function register() {
    setMessage("");

    if (!accountType) {
      setIsError(true);
      setMessage("Please select an account type.");
      return;
    }

    if (!email || !password || !firstName || !lastName) {
      setIsError(true);
      setMessage("Please fill out all fields.");
      return;
    }

    let normalizedClassCode = classCode.trim().toUpperCase();

    if (accountType === "student") {
      if (!normalizedClassCode) {
        setIsError(true);
        setMessage("Enter the class join code from your teacher.");
        return;
      }

      try {
        const validCode = await classCodeExists(normalizedClassCode);
        if (!validCode) {
          setIsError(true);
          setMessage("Join code not found. Check with your teacher.");
          return;
        }
      } catch (err) {
        setIsError(true);
        setMessage("Could not verify join code right now.");
        return;
      }
    }

    if (accountType === "teacher") {
      if (!normalizedClassCode) {
        normalizedClassCode = makeClassCode();
      }

      try {
        const taken = await classCodeExists(normalizedClassCode);
        if (taken) {
          setIsError(true);
          setMessage("That class code is already in use by another teacher.");
          return;
        }
      } catch (err) {
        setIsError(true);
        setMessage("Could not validate class code right now.");
        return;
      }
    }

    if (accountType === "teacher" || accountType === "admin") {
      try {
        const response = await fetch("http://localhost:5000/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountType, secretCode }),
        });
        const data = await response.json();
        if (!data.valid) {
          setIsError(true);
          setMessage("Invalid registration code.");
          return;
        }
      } catch (err) {
        setIsError(true);
        setMessage("Could not verify code. Is the backend running?");
        return;
      }
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      await setDoc(doc(db, "users", uid), {
        firstName,
        lastName,
        email,
        accountType,
        classCode:
          accountType === "student" || accountType === "teacher"
            ? normalizedClassCode
            : "",
        walletCents: accountType === "student" ? STARTING_CASH_CENTS : 0,
        holdings: accountType === "student" ? [] : [],
        tradeHistory: accountType === "student" ? [] : [],
        createdAt: new Date(),
      });

      setIsError(false);
      if (accountType === "teacher") {
        setMessage(`Account created. Your class join code is ${normalizedClassCode}.`);
      } else if (accountType === "student") {
        setMessage("Account created successfully! Starting wallet: $10,000.");
      } else {
        setMessage("Account created successfully!");
      }
    } catch (err) {
      setIsError(true);
      setMessage("Error: " + err.message);
    }
  }

  return (
    <>
      <h2>Register</h2>

      {!accountType && (
        <>
          <p className="app-subtitle">Select your account type</p>
          <div className="account-type-grid">
            <button className="btn-account-type" onClick={() => setAccountType("student")}>
              Student
            </button>
            <button className="btn-account-type" onClick={() => setAccountType("teacher")}>
              Teacher
            </button>
            <button className="btn-account-type" onClick={() => setAccountType("admin")}>
              Administrator
            </button>
          </div>
        </>
      )}

      {accountType && (
        <>
          <span className="account-badge">{accountType}</span>
          <input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {accountType === "student" && (
            <input
              placeholder="Class Join Code"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
            />
          )}

          {accountType === "teacher" && (
            <>
              <input
                placeholder="Class Code (leave blank to auto-generate)"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
              />
              <input
                placeholder="Teacher Registration Code"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
              />
            </>
          )}

          {accountType === "admin" && (
            <input
              placeholder="Administrator Registration Code"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
            />
          )}

          <button className="btn-primary" onClick={register}>
            Create Account
          </button>
          <button className="btn-secondary" onClick={() => setAccountType("")}>
            Back to account type
          </button>
        </>
      )}

      <div className="divider" />
      <button className="btn-secondary" onClick={onBack}>
        Back to Home
      </button>
      <p className={`message ${isError ? "error" : "success"}`}>{message}</p>
    </>
  );
}

export default Register;

