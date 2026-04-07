import { useState, useEffect } from "react";
import { useTMDBSearch } from "../hooks/useTMDB";
import { useShows } from "../context/ShowsContext";
import { SearchResult } from "../components/shows";
import styles from "./Search.module.css";

export function Search() {
  const [query, setQuery] = useState("");
  const { results, loading, error, search } = useTMDBSearch();
  const { shows } = useShows();

  const addedTmdbIds = new Set(shows.map((s) => s.tmdb_id));

  useEffect(() => {
    const timeout = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, search]);

  return (
    <div className={styles.page}>
      <h1>Search Shows</h1>

      <input
        type="search"
        className={styles.input}
        placeholder="Search for a TV show..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {loading && <p className={styles.status}>Searching...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {results && results.results.length === 0 && (
        <p className={styles.status}>No results found for "{query}"</p>
      )}

      {results && results.results.length > 0 && (
        <div className={styles.results}>
          {results.results.map((result) => (
            <SearchResult key={result.id} result={result} isAdded={addedTmdbIds.has(result.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
