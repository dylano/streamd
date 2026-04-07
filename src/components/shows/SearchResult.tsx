import { useState } from "react";
import { getPosterUrl } from "../../utils/images";
import { useShows } from "../../context/ShowsContext";
import { useTMDBShow } from "../../hooks/useTMDB";
import type { TMDBSearchResult } from "../../types";
import styles from "./SearchResult.module.css";

interface SearchResultProps {
  result: TMDBSearchResult;
  isAdded: boolean;
  onAdded?: () => void;
}

export function SearchResult({ result, isAdded, onAdded }: SearchResultProps) {
  const { addShow } = useShows();
  const { fetchShow } = useTMDBShow();
  const [adding, setAdding] = useState(false);

  const posterUrl = getPosterUrl(result.poster_path, "w154");
  const year = result.first_air_date?.split("-")[0];

  async function handleAdd() {
    if (adding || isAdded) return;

    setAdding(true);
    try {
      const details = await fetchShow(result.id);
      const network = details?.networks?.map((n) => n.name).join(", ") || null;
      await addShow({
        tmdb_id: result.id,
        name: result.name,
        poster_path: result.poster_path,
        overview: result.overview,
        first_air_date: result.first_air_date,
        status: "watchlist",
        streaming_service: network,
        total_seasons: details?.number_of_seasons ?? 0,
        total_episodes: details?.number_of_episodes ?? 0,
        current_season: 1,
        current_episode: 1,
      });
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
