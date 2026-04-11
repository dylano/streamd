import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { getPosterUrl, getLogoUrl } from "../utils/images";
import { parseStreamingProviders, useTMDBTrending } from "../hooks/useTMDB";
import { useSettings } from "../context/SettingsContext";
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
  const [markingIds, setMarkingIds] = useState<Set<number>>(new Set());
  const { results: trending, fetchTrending } = useTMDBTrending();
  const { settings } = useSettings();

  const fetchEpisodes = useCallback(async () => {
    try {
      setLoading(true);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const data = await api.get<UnwatchedEpisode[]>(
        `/episodes/unwatched?tz=${encodeURIComponent(tz)}`,
      );
      setEpisodes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load episodes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEpisodes();
    void fetchTrending();
  }, [fetchEpisodes, fetchTrending]);

  async function handleMarkWatched(episodeId: number) {
    if (markingIds.has(episodeId)) return;
    setMarkingIds((prev) => new Set(prev).add(episodeId));
    await api.put(`/episodes/${episodeId}`, { watched: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    setEpisodes((prev) => prev.filter((ep) => ep.id !== episodeId));
    setMarkingIds((prev) => {
      const next = new Set(prev);
      next.delete(episodeId);
      return next;
    });
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
  const groups = Object.values(showGroups)
    .map((group) => {
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
    })
    // Sort by air date of next up episode (newest first)
    .sort((a, b) => {
      const dateA = a.nextUpEpisode.air_date ? new Date(a.nextUpEpisode.air_date).getTime() : 0;
      const dateB = b.nextUpEpisode.air_date ? new Date(b.nextUpEpisode.air_date).getTime() : 0;
      return dateB - dateA;
    });

  const showsWithExtra = groups
    .filter((g) => g.additionalEpisodes.length > 0)
    .sort((a, b) => a.show_name.localeCompare(b.show_name));

  const showTrending = settings.showTrending && trending && trending.results.length > 0;

  const trendingSection = showTrending && (
    <section className={styles.trendingSection}>
      <h2>Trending</h2>
      <div className={styles.trendingGrid}>
        {trending.results.slice(0, 4).map((show) => (
          <Link
            key={show.id}
            to={`/watchlist?search=${encodeURIComponent(show.name)}`}
            className={styles.trendingItem}
          >
            {show.poster_path && (
              <img
                src={getPosterUrl(show.poster_path, "w185") ?? ""}
                alt={show.name}
                className={styles.trendingPoster}
              />
            )}
          </Link>
        ))}
      </div>
    </section>
  );

  const pageClass = showTrending ? `${styles.page} ${styles.hasTrending}` : styles.page;

  return (
    <div className={pageClass}>
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
                const isMarking = markingIds.has(ep.id);
                return (
                  <div
                    key={ep.id}
                    className={`${styles.nextUpItem} ${isMarking ? styles.marking : ""}`}
                  >
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
                        <span className={styles.epInfo}>{ep.name || "TBA"}</span>
                        <span className={styles.epMeta}>
                          <span>
                            {ep.season_number}×{String(ep.episode_number).padStart(2, "0")}
                          </span>
                          <span className={styles.epMetaDate}>
                            {ep.air_date && new Date(ep.air_date).toLocaleDateString()}
                          </span>
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
                        className={`${styles.watchButton} ${isMarking ? styles.checked : ""}`}
                        onClick={() => handleMarkWatched(ep.id)}
                        disabled={isMarking}
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
                          <div className={styles.epDetails}>
                            <span className={styles.epName}>{ep.name || "TBA"}</span>
                            <div className={styles.epMeta}>
                              <span className={styles.epNumber}>
                                {ep.season_number}×{String(ep.episode_number).padStart(2, "0")}
                              </span>
                              <span className={styles.epDate}>
                                {ep.air_date ? new Date(ep.air_date).toLocaleDateString() : ""}
                              </span>
                            </div>
                          </div>
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
      {trendingSection}
    </div>
  );
}
