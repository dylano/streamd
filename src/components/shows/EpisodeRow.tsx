import type { Episode } from "../../types";
import { parseLocalDate, formatAirDate } from "../../utils/dates";
import styles from "./EpisodeRow.module.css";

interface EpisodeRowProps {
  episode: Episode;
  onToggleWatched: (id: number, watched: boolean) => void;
}

export function EpisodeRow({ episode, onToggleWatched }: EpisodeRowProps) {
  const isAired = episode.air_date ? parseLocalDate(episode.air_date) <= new Date() : false;
  const formattedDate = formatAirDate(episode.air_date);

  return (
    <div className={`${styles.row} ${episode.watched ? styles.watched : ""}`}>
      <button
        className={styles.checkbox}
        onClick={() => onToggleWatched(episode.id, !episode.watched)}
        disabled={!isAired}
        aria-label={episode.watched ? "Mark as unwatched" : "Mark as watched"}
        type="button"
      >
        {episode.watched ? "✓" : ""}
      </button>
      <div className={styles.details}>
        <span className={styles.name}>{episode.name || "TBA"}</span>
        <div className={styles.meta}>
          <span className={styles.number}>
            {episode.season_number}×{String(episode.episode_number).padStart(2, "0")}
          </span>
          <span className={styles.date}>{formattedDate}</span>
          {episode.runtime && <span className={styles.runtime}>{episode.runtime}m</span>}
        </div>
      </div>
    </div>
  );
}
