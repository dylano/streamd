import styles from "./NewEpisodes.module.css";

export function NewEpisodes() {
  return (
    <div className={styles.page}>
      <h1>New Episodes</h1>
      <p className={styles.empty}>No unwatched episodes.</p>
    </div>
  );
}
