import React, { useEffect, useState } from "react";
import { api } from "../api";
import { formatUSD } from "../models/contracts";

export default function JoinClassPanel() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const inviteId = new URLSearchParams(window.location.search).get("inviteId");
    if (!inviteId) return;

    (async () => {
      try {
        setStatus("joining");
        const resp = await api.joinClass({ inviteId });
        setResult(resp);
        setStatus("joined");
      } catch (e) {
        setError(e.message || "Failed to join");
        setStatus("error");
      }
    })();
  }, []);

  const inviteId = new URLSearchParams(window.location.search).get("inviteId");

  if (!inviteId) {
    return (
      <div style={{ border: "1px solid #ccc", padding: 16 }}>
        <h3>Student: Join Class</h3>
        <p>No invite link detected.</p>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: 16 }}>
      <h3>Student: Join Class</h3>

      {status === "joining" && <p>Joining…</p>}
      {status === "error" && <p style={{ color: "red" }}>{error}</p>}

      {status === "joined" && result && (
        <>
          <p><b>Joined Class:</b> {result.classId}</p>
          <p><b>User ID:</b> {result.uid}</p>
          <p><b>Wallet Balance:</b> {formatUSD(result.cashCents)}</p>
        </>
      )}
    </div>
  );
}
