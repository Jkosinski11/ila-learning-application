import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

// Hardcoded valid class codes
const VALID_CLASS_CODES = ["UHS001", "UHS002", "UHS003"];

// Secret codes live in backend, but we verify via backend call
// These are just placeholders so the form knows what fields to show

function Register({ onBack }) {
  const [accountType, setAccountType] = useState(""); // "student" | "teacher" | "admin"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [message, setMessage] = useState("");
   const [isError, setIsError] = useState(false)

  async function register() {
    setMessage("");

    // Validate shared fields 
    if (!email || !password || !firstName || !lastName) {
      setIsError(true);
      setMessage("Please fill out all fields.");
      return;
    }

    // Student validation 
    if (accountType === "student") {
      if (!VALID_CLASS_CODES.includes(classCode.toUpperCase())) {
        setIsError(true);
        setMessage("Invalid class code. Please check with your teacher.");
        return;
      }
    }

    // Teacher / Admin secret code validation
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

    // Create Firebase Auth account
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // Save profile to Firestore
      await setDoc(doc(db, "users", uid), {
        firstName,
        lastName,
        email,
        accountType,
        classCode: accountType === "student" ? classCode.toUpperCase() : 
                   accountType === "teacher" ? classCode.toUpperCase() : "",
        createdAt: new Date(),
      });

        setIsError(false);
      setMessage("Account created successfully!");
    } catch (err) {
      setIsError(true);
      setMessage("Error: " + err.message);
    }
  }

return (
    
    <>
      <h2>Register</h2>

      {/* Account type selector */}
      {!accountType && (
        
        <>
          <p className="app-subtitle">Select your account type</p> 
          <div className="account-type-grid"> 
            <button className="btn-account-type" onClick={() => setAccountType("student")}>Student</button> 
            <button className="btn-account-type" onClick={() => setAccountType("teacher")}>Teacher</button> 
            <button className="btn-account-type" onClick={() => setAccountType("admin")}>Administrator</button> 
          </div>
        </>
      )}

      {/* Shared fields */}
      {accountType && (
        
        <>
          <span className="account-badge">{accountType}</span> 
          <input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {/* Student only */}
          {accountType === "student" && (
            <input placeholder="Class Code (e.g. UHS001)" value={classCode} onChange={(e) => setClassCode(e.target.value)} />
          )}

          {/* Teacher only */}
          {accountType === "teacher" && (
            <>
              <input placeholder="Your Class Code (e.g. UHS001)" value={classCode} onChange={(e) => setClassCode(e.target.value)} />
              <input placeholder="Teacher Registration Code" value={secretCode} onChange={(e) => setSecretCode(e.target.value)} />
            </>
          )}

          {/* Admin only */}
          {accountType === "admin" && (
            <input placeholder="Administrator Registration Code" value={secretCode} onChange={(e) => setSecretCode(e.target.value)} />
          )}

          <button className="btn-primary" onClick={register}>Create Account</button> 
          <button className="btn-secondary" onClick={() => setAccountType("")}>Back to account type</button> 
        </>
      )}

      <div className="divider" /> 
      <button className="btn-secondary" onClick={onBack}>Back to Home</button> 
      <p className={`message ${isError ? "error" : "success"}`}>{message}</p> 
    </> 
  );
}


export default Register;