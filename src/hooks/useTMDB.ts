import { useState, useCallback } from "react";
import { api } from "../api/client";
import type { TMDBSearchResponse, TMDBShowDetail, TMDBSeasonDetail } from "../types";

export function useTMDBSearch() {
  const [results, setResults] = useState<TMDBSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await api.get<TMDBSearchResponse>(
        `/tmdb/search?query=${encodeURIComponent(query)}`,
      );
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
}

export function useTMDBShow() {
  const [show, setShow] = useState<TMDBShowDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShow = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<TMDBShowDetail>(`/tmdb/show/${id}`);
      setShow(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch show");
      setShow(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { show, loading, error, fetchShow };
}

export function useTMDBSeason() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeason = useCallback(async (showId: number, seasonNumber: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<TMDBSeasonDetail>(`/tmdb/show/${showId}/season/${seasonNumber}`);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch season");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, fetchSeason };
}
