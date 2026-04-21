import { useState } from "react";
import { useShows } from "../context/ShowsContext";
import { useUser } from "../context/UserContext";
import { ShowGrid, ShowSearch } from "../components/shows";
import { UserShowsDialog } from "../components/ui/UserShowsDialog";
import styles from "./Watchlist.module.css";

export function Watchlist() {
  const { shows, loading } = useShows();
  const { user } = useUser();
  const [showSocial, setShowSocial] = useState(false);
  const sortedShows = [...shows].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={styles.page}>
      <ShowSearch />
      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <ShowGrid shows={sortedShows} emptyMessage="No shows yet. Search above to add some!" />
      )}
      <button className={styles.socialLink} onClick={() => setShowSocial(true)} type="button">
        What's everyone else watching?
      </button>
      {showSocial && (
        <UserShowsDialog onClose={() => setShowSocial(false)} currentUserId={user!.id} />
      )}
    </div>
  );
}
