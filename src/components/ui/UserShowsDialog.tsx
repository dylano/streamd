import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { api, userApi } from "../../api/client";
import { useShows } from "../../context/ShowsContext";
import { useTMDBShow, useTMDBSeason, useTMDBWatchProviders } from "../../hooks/useTMDB";
import { ShowCard } from "../shows/ShowCard";
import type { Show, Episode } from "../../types";
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
  const { shows: myShows, addShow } = useShows();
  const { fetchShow } = useTMDBShow();
  const { fetchSeason } = useTMDBSeason();
  const { fetchWatchProviders } = useTMDBWatchProviders();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const myTmdbIds = new Set(myShows.map((s) => s.tmdb_id));

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

  async function handleAdd(show: Show) {
    try {
      const [details, streamingService] = await Promise.all([
        fetchShow(show.tmdb_id),
        fetchWatchProviders(show.tmdb_id),
      ]);
      const latestSeason = details?.number_of_seasons ?? show.total_seasons;

      const added = await addShow({
        tmdb_id: show.tmdb_id,
        name: show.name,
        poster_path: show.poster_path,
        overview: show.overview,
        first_air_date: show.first_air_date,
        status: "watchlist",
        streaming_service: streamingService,
        total_seasons: latestSeason,
        total_episodes: details?.number_of_episodes ?? show.total_episodes,
        current_season: latestSeason,
        current_episode: 1,
      });

      // Sync the most recent season's episodes
      if (details && latestSeason > 0) {
        const seasonData = await fetchSeason(show.tmdb_id, latestSeason);
        if (seasonData?.episodes) {
          await api.post<Episode[]>("/episodes", {
            show_id: added.id,
            episodes: seasonData.episodes.map((ep) => ({
              tmdb_id: ep.id,
              season_number: ep.season_number,
              episode_number: ep.episode_number,
              name: ep.name,
              air_date: ep.air_date,
              runtime: ep.runtime,
            })),
          });
        }
      }

      setAddedIds((prev) => new Set(prev).add(show.tmdb_id));
      setToast(`'${show.name}' added to your shows`);
      setTimeout(() => setToast(null), 1250);
    } catch {
      // Show may already exist — ignore
    }
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
            shows.length === 0 ? (
              <p className={styles.loading}>No shows yet</p>
            ) : (
              <div className={styles.grid}>
                {shows.map((show) => {
                  const alreadyHave = myTmdbIds.has(show.tmdb_id) || addedIds.has(show.tmdb_id);
                  return (
                    <ShowCard
                      key={show.id}
                      show={show}
                      onAdd={alreadyHave ? undefined : handleAdd}
                    />
                  );
                })}
              </div>
            )
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
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>,
    document.body,
  );
}
