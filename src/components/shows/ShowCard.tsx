import { Link } from "react-router-dom";
import { getPosterUrl, getLogoUrl } from "../../utils/images";
import { parseStreamingProviders } from "../../hooks/useTMDB";
import type { Show } from "../../types";
import styles from "./ShowCard.module.css";

interface ShowCardProps {
  show: Show;
  onAdd?: (show: Show) => void;
}

export function ShowCard({ show, onAdd }: ShowCardProps) {
  const posterUrl = getPosterUrl(show.poster_path, "w342");
  const provider = parseStreamingProviders(show.streaming_service)[0];

  const content = (
    <>
      <div className={styles.poster}>
        {posterUrl ? (
          <img src={posterUrl} alt={show.name} loading="lazy" />
        ) : (
          <div className={styles.placeholder}>{show.name[0]}</div>
        )}
        {provider && (
          <div className={styles.providerBadge}>
            <img src={getLogoUrl(provider.logo_path) ?? ""} alt={provider.name} />
          </div>
        )}
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{show.name}</h3>
        {show.current_season && show.current_episode ? (
          <p className={styles.progress}>
            S{show.current_season}E{show.current_episode}
          </p>
        ) : (
          <p className={styles.progress}>Caught up</p>
        )}
        {onAdd && (
          <button
            className={styles.addButton}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd(show);
            }}
            type="button"
            title="Add to my shows"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
        )}
      </div>
    </>
  );

  if (onAdd) {
    return <div className={styles.card}>{content}</div>;
  }

  return (
    <Link to={`/show/${show.id}`} className={styles.card}>
      {content}
    </Link>
  );
}
