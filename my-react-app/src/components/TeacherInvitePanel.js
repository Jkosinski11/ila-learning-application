import React, { useState } from "react";
import { api } from "../api";

export default function TeacherInvitePanel() {
  const [classId, setClassId] = useState("testClass");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteId, setInviteId] = useState("");
  const [status, setStatus] = useState("idle"); // idle | creating | done | error
  const [error, setError] = useState("");

  async function handleCreateInvite() {
    try {
      setStatus("creating");
      setError("");
      setInviteLink("");
      setInviteId("");

      const resp = await api.createInvite({ classId: classId.trim() });
      const newInviteId = resp.inviteId;

      const url = new URL(window.location.href);
      url.searchParams.set("inviteId", newInviteId);

      setInviteId(newInviteId);
      setInviteLink(url.toString());
      setStatus("done");
    } catch (e) {
      setError(e?.message || "Failed to create invite");
      setStatus("error");
    }
  }

  function handleCopy() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>Teacher: Create Invite</h3>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label>
          Class ID:{" "}
          <input
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            placeholder="e.g. cs430-section1"
            style={{ padding: 6, width: 220 }}
          />
        </label>

        <button onClick={handleCreateInvite} disabled={status === "creating"}>
          {status === "creating" ? "Creating..." : "Create Invite Link"}
        </button>
      </div>

      {status === "error" && (
        <p style={{ color: "red", marginTop: 10 }}>{error}</p>
      )}

      {status === "done" && inviteLink && (
        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 6 }}>
            <b>Invite ID:</b> {inviteId}
          </div>

          <div style={{ marginBottom: 6 }}>
            <b>Invite Link:</b>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={inviteLink}
              readOnly
              style={{ width: "100%", padding: 6 }}
            />
            <button onClick={handleCopy}>Copy</button>
          </div>

          <div style={{ marginTop: 8 }}>
            <a href={inviteLink}>Open invite link</a>
          </div>

          <p style={{ marginTop: 10, opacity: 0.8 }}>
            (Mock/local only — later Firebase will generate & validate invites.)
          </p>
        </div>
      )}
    </div>
  );
}
