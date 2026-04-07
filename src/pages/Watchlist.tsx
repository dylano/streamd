import { useShows } from "../context/ShowsContext";
import { ShowGrid, ShowSearch } from "../components/shows";
import styles from "./Watchlist.module.css";

export function Watchlist() {
  const { shows, loading } = useShows();
  const sortedShows = [...shows].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={styles.page}>
      <h1>Watchlist</h1>
      <ShowSearch />
      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <ShowGrid shows={sortedShows} emptyMessage="No shows yet. Search above to add some!" />
      )}
    </div>
  );
}
