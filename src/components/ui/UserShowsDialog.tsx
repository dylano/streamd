import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { userApi } from "../../api/client";
import { ShowGrid } from "../shows";
import type { Show } from "../../types";
import styles from "./UserShowsDialog.module.css";

interface User {
  id: number;
  name: string;
}

interface UserShowsDialogProps {
  onClose: () => void;
  currentUserId: number;
}

export function UserShowsDialog({ onClose, currentUserId }: UserShowsDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.listAll().then((all) => {
      setUsers(all.filter((u) => u.id !== currentUserId));
      setLoading(false);
    });
  }, [currentUserId]);

  useEffect(() => {
    if (!selectedUser) return;
    setLoading(true);
    userApi.getUserShows(selectedUser.id).then((result) => {
      setShows(result.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });
  }, [selectedUser]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function handleBack() {
    setSelectedUser(null);
    setShows([]);
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          {selectedUser && (
            <button className={styles.backButton} onClick={handleBack} type="button" title="Back">
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
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className={styles.title}>
            {selectedUser ? `${selectedUser.name}'s Shows` : "Browse Users"}
          </h2>
          <button className={styles.closeButton} onClick={onClose} type="button" title="Close">
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
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>
          {loading ? (
            <p className={styles.loading}>Loading...</p>
          ) : selectedUser ? (
            <div className={styles.readOnlyGrid}>
              <ShowGrid shows={shows} emptyMessage="No shows yet" />
            </div>
          ) : users.length === 0 ? (
            <p className={styles.loading}>No other users yet</p>
          ) : (
            <ul className={styles.userList}>
              {users.map((user) => (
                <li key={user.id}>
                  <button
                    className={styles.userItem}
                    onClick={() => setSelectedUser(user)}
                    type="button"
                  >
                    {user.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
