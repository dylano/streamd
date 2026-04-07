import { useState, useCallback } from "react";
import { api } from "../api/client";
import type { Episode } from "../types";

interface EpisodeInput {
  tmdb_id?: number | null;
  season_number: number;
  episode_number: number;
  name?: string | null;
  air_date?: string | null;
  runtime?: number | null;
}

export function useEpisodes(showId: number | null) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEpisodes = useCallback(async () => {
    if (!showId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Episode[]>(`/episodes?show_id=${showId}`);
      setEpisodes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch episodes");
    } finally {
      setLoading(false);
    }
  }, [showId]);

  const syncEpisodes = useCallback(
    async (episodeInputs: EpisodeInput[]) => {
      if (!showId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await api.post<Episode[]>("/episodes", {
          show_id: showId,
          episodes: episodeInputs,
        });
        setEpisodes(data);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to sync episodes");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [showId],
  );

  const markWatched = useCallback(async (episodeId: number, watched: boolean) => {
    try {
      const updated = await api.put<Episode>(`/episodes/${episodeId}`, { watched });
      setEpisodes((prev) => prev.map((ep) => (ep.id === episodeId ? updated : ep)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update episode");
      throw err;
    }
  }, []);

  const getEpisodesBySeason = useCallback(
    (seasonNumber: number) => {
      return episodes.filter((ep) => ep.season_number === seasonNumber);
    },
    [episodes],
  );

  return {
    episodes,
    loading,
    error,
    fetchEpisodes,
    syncEpisodes,
    markWatched,
    getEpisodesBySeason,
  };
}
