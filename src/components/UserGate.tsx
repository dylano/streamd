import { useState, useEffect, useRef, type ReactNode, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { userApi, ApiError } from "../api/client";
import styles from "./UserGate.module.css";

export function UserGate({ children }: { children: ReactNode }) {
  const { user, loading, login } = useUser();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const prevUser = useRef(user);

  // Reset form state and navigate home on logout
  useEffect(() => {
    if (prevUser.current && !user) {
      setName("");
      setConfirming(false);
      setPendingName("");
      setError("");
      setSubmitting(false);
      navigate("/");
    }
    prevUser.current = user;
  }, [user, navigate]);

  if (loading) {
    return null;
  }

  if (user) {
    return <>{children}</>;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setError("");
    setSubmitting(true);
    try {
      const found = await userApi.lookup(trimmed);
      login(found);
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setPendingName(trimmed);
        setConfirming(true);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmCreate() {
    setError("");
    setSubmitting(true);
    try {
      const created = await userApi.create(pendingName);
      login(created);
      navigate("/");
    } catch {
      setError("Failed to create user. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDenyCreate() {
    setConfirming(false);
    setPendingName("");
    setName("");
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.brand}>streamd</h1>

        {confirming ? (
          <div className={styles.panel}>
            <p className={styles.prompt}>
              Start tracking as <strong>{pendingName}</strong>?
            </p>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.actions}>
              <button
                className={styles.link}
                onClick={handleDenyCreate}
                disabled={submitting}
                type="button"
              >
                Not me
              </button>
              <button
                className={styles.go}
                onClick={handleConfirmCreate}
                disabled={submitting}
                type="button"
              >
                {submitting ? "..." : "Let's go"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.panel}>
            <div className={styles.field}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Who's watching?"
                className={styles.input}
                autoFocus
                disabled={submitting}
              />
              <button
                type="submit"
                className={styles.arrow}
                disabled={!name.trim() || submitting}
                aria-label="Continue"
              >
                {submitting ? "..." : "\u2192"}
              </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
