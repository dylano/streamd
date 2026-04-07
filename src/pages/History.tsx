import { useShows } from "../context/ShowsContext";
import { ShowGrid } from "../components/shows";
import styles from "./History.module.css";

export function History() {
  const { shows, loading } = useShows();
  const historyShows = shows.filter((s) => s.status === "completed" || s.status === "dropped");

  return (
    <div className={styles.page}>
      <h1>History</h1>
      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <ShowGrid shows={historyShows} emptyMessage="No completed or dropped shows yet." />
      )}
    </div>
  );
}
