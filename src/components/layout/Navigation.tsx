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
      <div className={styles.actions}>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive ? `${styles.iconButton} ${styles.active}` : styles.iconButton
          }
          title="Settings"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </NavLink>
        <button
          className={styles.iconButton}
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
      </div>
    </nav>
  );
}
