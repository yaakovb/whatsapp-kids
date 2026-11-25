import { useState } from "react";

const DEFAULT_API = "http://127.0.0.1:8787";

export default function App() {
  const [apiBase, setApiBase] = useState(DEFAULT_API);
  const [displayName, setDisplayName] = useState("Parent");
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [purged, setPurged] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${apiBase.replace(/\/$/, "")}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "parent", displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setToken(data.token);
      setUser(data.user);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function loadMessages() {
    if (!token) {
      setError("Log in first");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${apiBase.replace(/\/$/, "")}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setMessages(data.messages || []);
      setPurged(data.purged || null);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <p className="brand">WhatsApp Kids</p>
      <h1>Parent review</h1>
      <p className="lede">
        Stub inbox for the family messenger. Content review is parent-side — kids
        do not share. Not connected to WhatsApp.
      </p>

      <section className="panel">
        <label htmlFor="api">API base URL</label>
        <input
          id="api"
          value={apiBase}
          onChange={(e) => setApiBase(e.target.value)}
        />
        <label htmlFor="name">Display name</label>
        <input
          id="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <button type="button" onClick={login} disabled={busy}>
          Log in as parent
        </button>
        <button
          type="button"
          className="secondary"
          onClick={loadMessages}
          disabled={busy || !token}
        >
          Refresh messages
        </button>
        {user && (
          <p className="meta">
            Signed in as {user.displayName} ({user.role}) · retention 30 days
          </p>
        )}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Inbox</h2>
        {purged && (
          <p className="meta">
            Last purge: removed {purged.deleted} message(s) older than{" "}
            {purged.retentionDays} days
          </p>
        )}
        {messages.length === 0 ? (
          <p className="empty">No messages yet. Send some from the Android kid mode or API.</p>
        ) : (
          <ul className="messages">
            {messages.map((m) => (
              <li key={m.id}>
                <span className="who">{m.senderName}</span>
                <span className="when">{new Date(m.createdAt).toLocaleString()}</span>
                <p className="body">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
