import { useState } from "react";
import { getPosterUrl } from "../../utils/images";
import { useShows } from "../../context/ShowsContext";
import { useTMDBShow, useTMDBSeason, useTMDBWatchProviders } from "../../hooks/useTMDB";
import { api } from "../../api/client";
import type { TMDBSearchResult, Episode } from "../../types";
import styles from "./SearchResult.module.css";

interface SearchResultProps {
  result: TMDBSearchResult;
  isAdded: boolean;
  onAdded?: () => void;
}

export function SearchResult({ result, isAdded, onAdded }: SearchResultProps) {
  const { addShow } = useShows();
  const { fetchShow } = useTMDBShow();
  const { fetchSeason } = useTMDBSeason();
  const { fetchWatchProviders } = useTMDBWatchProviders();
  const [adding, setAdding] = useState(false);

  const posterUrl = getPosterUrl(result.poster_path, "w154");
  const year = result.first_air_date?.split("-")[0];

  async function handleAdd() {
    if (adding || isAdded) return;

    setAdding(true);
    try {
      const [details, streamingService] = await Promise.all([
        fetchShow(result.id),
        fetchWatchProviders(result.id),
      ]);
      const latestSeason = details?.number_of_seasons ?? 1;

      const show = await addShow({
        tmdb_id: result.id,
        name: result.name,
        poster_path: result.poster_path,
        overview: result.overview,
        first_air_date: result.first_air_date,
        status: "watchlist",
        streaming_service: streamingService,
        total_seasons: latestSeason,
        total_episodes: details?.number_of_episodes ?? 0,
        current_season: latestSeason,
        current_episode: 1,
      });

      // Sync the most recent season's episodes
      if (details && latestSeason > 0) {
        const seasonData = await fetchSeason(result.id, latestSeason);
        if (seasonData?.episodes) {
          await api.post<Episode[]>("/episodes", {
            show_id: show.id,
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

      onAdded?.();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className={styles.result}>
      <div className={styles.poster}>
        {posterUrl ? (
          <img src={posterUrl} alt={result.name} loading="lazy" />
        ) : (
          <div className={styles.placeholder}>{result.name[0]}</div>
        )}
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>
          {result.name}
          {year && <span className={styles.year}> ({year})</span>}
        </h3>
        <p className={styles.overview}>{result.overview || "No description available."}</p>
      </div>
      <button
        className={styles.addButton}
        onClick={handleAdd}
        disabled={adding || isAdded}
        type="button"
      >
        {isAdded ? "Added" : adding ? "Adding..." : "Add"}
      </button>
    </div>
  );
}
