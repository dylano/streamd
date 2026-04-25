import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useUser } from "../context/UserContext";
import { isAdmin } from "../utils/admin";
import styles from "./Admin.module.css";

interface AdminUser {
  id: number;
  name: string;
  created_at: string;
  show_count: number;
  watched_count: number;
}

interface Stats {
  users: number;
  shows: number;
  episodes: number;
  watchedEpisodes: number;
}

export function Admin() {
  const { user } = useUser();

  if (!isAdmin(user?.name)) {
    return <Navigate to="/" replace />;
  }

  return <AdminContent user={user!} />;
}

function AdminContent({ user }: { user: { id: number; name: string } }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    try {
      const [usersData, statsData] = await Promise.all([
        api.get<AdminUser[]>("/admin/users"),
        api.get<Stats>("/admin/stats"),
      ]);
      setUsers(usersData);
      setStats(statsData);
      setError(null);
    } catch {
      setError("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete user");
      setDeleteTarget(null);
    }
  }

  if (loading)
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Loading…</p>
      </div>
    );
  if (error)
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error}</p>
      </div>
    );

  return (
    <div className={styles.page}>
      <h1>Admin</h1>

      <h2 className={styles.sectionTitle}>Database</h2>
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.users}</div>
            <div className={styles.statLabel}>Users</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.shows}</div>
            <div className={styles.statLabel}>Shows</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.episodes}</div>
            <div className={styles.statLabel}>Episodes</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.watchedEpisodes}</div>
            <div className={styles.statLabel}>Watched</div>
          </div>
        </div>
      )}

      <h2 className={styles.sectionTitle}>Users</h2>
      <div className={styles.userList}>
        {users.map((u) => (
          <div key={u.id} className={styles.userRow}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{u.name}</span>
              <span className={styles.userMeta}>
                {u.show_count} shows · {u.watched_count} watched · joined{" "}
                {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                  new Date(u.created_at + "Z"),
                )}
              </span>
            </div>
            {u.id !== user?.id && (
              <button
                className={styles.deleteButton}
                onClick={() => setDeleteTarget(u)}
                type="button"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete user "${deleteTarget.name}"? This will remove all their shows and watch history.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
