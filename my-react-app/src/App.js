import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from "react"

function App() {
   const [health, setHealth] = useState(null);
   const [err, setErr] = useState(null);
   useEffect(() => {
    fetch("/api/health") // uses CRA proxy if you added it
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setHealth)
      .catch((e) => setErr(String(e)));
  }, []);
  return (
     <div style={{ padding: 20 }}>
      <h1>Mock Trading App</h1>
      {err && <p style={{ color: "red" }}>Error: {err}</p>}
      {health ? (
        <pre>{JSON.stringify(health, null, 2)}</pre>
      ) : (
        <p>Loading health check…</p>
      )}
    </div>
  );
}

export default App;
