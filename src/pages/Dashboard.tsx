import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { getPosterUrl, getLogoUrl } from "../utils/images";
import { parseStreamingProviders } from "../hooks/useTMDB";
import type { UnwatchedEpisode } from "../types";
import styles from "./Dashboard.module.css";

interface ShowGroup {
  show_id: number;
  show_name: string;
  show_poster_path: string | null;
  show_network: string | null;
  current_season: number | null;
  current_episode: number | null;
  episodes: UnwatchedEpisode[];
}

export function Dashboard() {
  const [episodes, setEpisodes] = useState<UnwatchedEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEpisodes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<UnwatchedEpisode[]>("/episodes/unwatched");
      setEpisodes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load episodes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEpisodes();
  }, [fetchEpisodes]);

  async function handleMarkWatched(episodeId: number) {
    await api.put(`/episodes/${episodeId}`, { watched: true });
    setEpisodes((prev) => prev.filter((ep) => ep.id !== episodeId));
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  // Group episodes by show, sorted by season/episode
  const showGroups = episodes.reduce(
    (acc, ep) => {
      if (!acc[ep.show_id]) {
        acc[ep.show_id] = {
          show_id: ep.show_id,
          show_name: ep.show_name,
          show_poster_path: ep.show_poster_path,
          show_network: ep.show_network,
          current_season: ep.show_current_season,
          current_episode: ep.show_current_episode,
          episodes: [],
        };
      }
      acc[ep.show_id].episodes.push(ep);
      return acc;
    },
    {} as Record<number, ShowGroup>,
  );

  // Sort episodes within each group
  Object.values(showGroups).forEach((group) => {
    group.episodes.sort((a, b) => {
      if (a.season_number !== b.season_number) return a.season_number - b.season_number;
      return a.episode_number - b.episode_number;
    });
  });

  // For each group, find the "Next Up" episode (matches bookmark) and additional episodes
  const groups = Object.values(showGroups).map((group) => {
    // Find the bookmarked episode (Next Up)
    const nextUp = group.episodes.find(
      (ep) =>
        ep.season_number === group.current_season && ep.episode_number === group.current_episode,
    );
    // If no bookmark match, fall back to first episode by order
    const nextUpEpisode = nextUp ?? group.episodes[0];
    // Additional episodes are everything except the Next Up
    const additionalEpisodes = group.episodes.filter((ep) => ep.id !== nextUpEpisode.id);
    return { ...group, nextUpEpisode, additionalEpisodes };
  });

  const showsWithExtra = groups.filter((g) => g.additionalEpisodes.length > 0);

  return (
    <div className={styles.page}>
      {groups.length === 0 ? (
        <div className={styles.empty}>
          <p>You're all caught up!</p>
          <Link to="/watchlist" className={styles.link}>
            Add shows to track
          </Link>
        </div>
      ) : (
        <>
          <section className={styles.section}>
            <h2>Next Up</h2>
            <div className={styles.nextUpList}>
              {groups.map((group) => {
                const ep = group.nextUpEpisode;
                return (
                  <div key={group.show_id} className={styles.nextUpItem}>
                    <Link to={`/show/${group.show_id}`} className={styles.showLink}>
                      {group.show_poster_path && (
                        <img
                          src={getPosterUrl(group.show_poster_path, "w92") ?? ""}
                          alt=""
                          className={styles.poster}
                        />
                      )}
                      <div className={styles.showInfo}>
                        <span className={styles.showName}>{group.show_name}</span>
                        <span className={styles.epInfo}>
                          {ep.season_number}×{String(ep.episode_number).padStart(2, "0")}
                          {ep.name && ` · ${ep.name}`}
                        </span>
                        <span className={styles.epMeta}>
                          {ep.air_date && new Date(ep.air_date).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                    <div className={styles.actions}>
                      {parseStreamingProviders(group.show_network)[0] && (
                        <img
                          src={
                            getLogoUrl(parseStreamingProviders(group.show_network)[0].logo_path) ??
                            ""
                          }
                          alt={parseStreamingProviders(group.show_network)[0].name}
                          title={parseStreamingProviders(group.show_network)[0].name}
                          className={styles.providerLogo}
                        />
                      )}
                      <button
                        className={styles.watchButton}
                        onClick={() => handleMarkWatched(ep.id)}
                        title="Mark as watched"
                        type="button"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {showsWithExtra.length > 0 && (
            <section className={styles.section}>
              <h2>Additional Episodes</h2>
              <div className={styles.additionalList}>
                {showsWithExtra.map((group) => (
                  <details key={group.show_id} className={styles.showDetails}>
                    <summary className={styles.summary}>
                      <span className={styles.summaryName}>{group.show_name}</span>
                      <span className={styles.summaryCount}>
                        +{group.additionalEpisodes.length} more
                      </span>
                    </summary>
                    <div className={styles.episodeList}>
                      {group.additionalEpisodes.map((ep) => (
                        <div key={ep.id} className={styles.episode}>
                          <button
                            className={styles.watchButton}
                            onClick={() => handleMarkWatched(ep.id)}
                            title="Mark as watched"
                            type="button"
                          >
                            ✓
                          </button>
                          <span className={styles.epNumber}>
                            {ep.season_number}×{String(ep.episode_number).padStart(2, "0")}
                          </span>
                          <span className={styles.epName}>{ep.name || "TBA"}</span>
                          <span className={styles.epDate}>
                            {ep.air_date ? new Date(ep.air_date).toLocaleDateString() : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
