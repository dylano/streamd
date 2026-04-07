import { Link } from "react-router-dom";
import { getPosterUrl } from "../../utils/images";
import type { Show } from "../../types";
import styles from "./ShowCard.module.css";

interface ShowCardProps {
  show: Show;
}

export function ShowCard({ show }: ShowCardProps) {
  const posterUrl = getPosterUrl(show.poster_path, "w342");

  return (
    <Link to={`/show/${show.id}`} className={styles.card}>
      <div className={styles.poster}>
        {posterUrl ? (
          <img src={posterUrl} alt={show.name} loading="lazy" />
        ) : (
          <div className={styles.placeholder}>{show.name[0]}</div>
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
      </div>
    </Link>
  );
}
