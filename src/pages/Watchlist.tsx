import { useState } from "react";
import { useShows } from "../context/ShowsContext";
import { useUser } from "../context/UserContext";
import { ShowGrid, ShowSearch } from "../components/shows";
import { UserShowsDialog } from "../components/ui/UserShowsDialog";
import styles from "./Watchlist.module.css";

// remove leading a/an/the from show title
function buildSortString(str: string) {
  return str.replace(/^(a|an|the)\s+/i, "");
}

export function Watchlist() {
  const { shows, loading } = useShows();
  const { user } = useUser();
  const [showSocial, setShowSocial] = useState(false);
  const sortedShows = [...shows].sort((a, b) => {
    return buildSortString(a.name).localeCompare(buildSortString(b.name));
  });

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
