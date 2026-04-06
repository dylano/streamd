import { useState, useEffect } from "react";
import "./App.css";

interface HealthResponse {
  status: string;
  timestamp: string;
  database: {
    connected: boolean;
    showCount?: number;
    error?: string;
  };
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <main className="container">
      <h1>StreamD</h1>
      <p className="subtitle">TV Show Tracker</p>

      <div className="status-card">
        <h2>System Status</h2>
        {loading && <p className="loading">Checking connection...</p>}
        {error && <p className="error">Error: {error}</p>}
        {health && (
          <dl className="status-list">
            <dt>API Status</dt>
            <dd className={health.status === "ok" ? "success" : "error"}>{health.status}</dd>

            <dt>Database</dt>
            <dd className={health.database.connected ? "success" : "error"}>
              {health.database.connected ? "Connected" : "Disconnected"}
            </dd>

            {health.database.connected && (
              <>
                <dt>Shows in DB</dt>
                <dd>{health.database.showCount}</dd>
              </>
            )}

            <dt>Timestamp</dt>
            <dd>{new Date(health.timestamp).toLocaleString()}</dd>
          </dl>
        )}
      </div>

      <p className="attribution">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </main>
  );
}

export default App;
