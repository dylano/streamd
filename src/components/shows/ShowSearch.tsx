import { useState, useEffect, useRef } from "react";
import { useTMDBSearch } from "../../hooks/useTMDB";
import { useShows } from "../../context/ShowsContext";
import { SearchResult } from "./SearchResult";
import styles from "./ShowSearch.module.css";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 400;

export function ShowSearch() {
  const [query, setQuery] = useState("");
  const { results, loading, error, search, clear } = useTMDBSearch();
  const { shows } = useShows();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const addedTmdbIds = new Set(shows.map((s) => s.tmdb_id));

  function handleAdded() {
    setQuery("");
    clear();
  }

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < MIN_QUERY_LENGTH) {
      clear();
      return;
    }

    debounceRef.current = setTimeout(() => {
      search(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, search, clear]);

  return (
    <div className={styles.search}>
      <input
        type="search"
        className={styles.input}
        placeholder="Search TMDB to add a show..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && <p className={styles.status}>Searching...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && query.length >= MIN_QUERY_LENGTH && results?.results.length === 0 && (
        <p className={styles.status}>No results found for "{query}"</p>
      )}

      {results && results.results.length > 0 && (
        <div className={styles.results}>
          {results.results.map((result) => (
            <SearchResult
              key={result.id}
              result={result}
              isAdded={addedTmdbIds.has(result.id)}
              onAdded={handleAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
