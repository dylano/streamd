import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import styles from "./Navigation.module.css";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/watchlist", label: "My Shows" },
];

export function Navigation() {
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    try {
      await api.post("/shows/sync", {});
      // Navigate to dashboard to see results (forces refresh)
      navigate("/");
    } catch {
      // Sync failed silently - user can retry
    } finally {
      setSyncing(false);
    }
  }

  return (
    <nav className={styles.nav}>
      <ul className={styles.list}>
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <button
        className={styles.syncButton}
        onClick={handleSync}
        disabled={syncing}
        title="Sync all shows"
        type="button"
      >
        <svg
          className={syncing ? styles.spinning : ""}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      </button>
    </nav>
  );
}
