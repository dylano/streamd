import { useState, useCallback } from "react";
import { api } from "../api/client";
import type {
  TMDBSearchResponse,
  TMDBShowDetail,
  TMDBSeasonDetail,
  TMDBWatchProvidersResponse,
} from "../types";

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

export interface StreamingProvider {
  name: string;
  logo_path: string;
}

export function useTMDBWatchProviders() {
  const fetchWatchProviders = useCallback(async (showId: number, region = "US") => {
    try {
      const data = await api.get<TMDBWatchProvidersResponse>(
        `/tmdb/show/${showId}/watch-providers`,
      );
      const regionData = data.results[region];
      if (regionData?.flatrate && regionData.flatrate.length > 0) {
        // Sort by display_priority (lower = more prominent) and take top 3
        const sorted = [...regionData.flatrate].sort(
          (a, b) => a.display_priority - b.display_priority,
        );
        const top3 = sorted.slice(0, 3).map((p) => ({
          name: p.provider_name,
          logo_path: p.logo_path,
        }));
        return JSON.stringify(top3);
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  return { fetchWatchProviders };
}

export function parseStreamingProviders(json: string | null): StreamingProvider[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as StreamingProvider[];
  } catch {
    return [];
  }
}

export function useTMDBTrending() {
  const [results, setResults] = useState<TMDBSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTrending = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<TMDBSearchResponse>("/tmdb/trending");
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, fetchTrending };
}
