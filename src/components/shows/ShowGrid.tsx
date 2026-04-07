import { ShowCard } from "./ShowCard";
import type { Show } from "../../types";
import styles from "./ShowGrid.module.css";

interface ShowGridProps {
  shows: Show[];
  emptyMessage?: string;
}

export function ShowGrid({ shows, emptyMessage = "No shows" }: ShowGridProps) {
  if (shows.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.grid}>
      {shows.map((show) => (
        <ShowCard key={show.id} show={show} />
      ))}
    </div>
  );
}
