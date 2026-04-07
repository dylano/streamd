import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api } from "../api/client";
import type { Show, CreateShowInput, UpdateShowInput } from "../types";

interface ShowsContextValue {
  shows: Show[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addShow: (input: CreateShowInput) => Promise<Show>;
  updateShow: (id: number, input: UpdateShowInput) => Promise<Show>;
  deleteShow: (id: number) => Promise<void>;
  getShowsByStatus: (status: Show["status"]) => Show[];
}

const ShowsContext = createContext<ShowsContextValue | null>(null);

export function ShowsProvider({ children }: { children: ReactNode }) {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Show[]>("/shows");
      setShows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch shows");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addShow = useCallback(async (input: CreateShowInput): Promise<Show> => {
    const show = await api.post<Show>("/shows", input);
    setShows((prev) => [show, ...prev]);
    return show;
  }, []);

  const updateShow = useCallback(async (id: number, input: UpdateShowInput): Promise<Show> => {
    const show = await api.put<Show>(`/shows/${id}`, input);
    setShows((prev) => prev.map((s) => (s.id === id ? show : s)));
    return show;
  }, []);

  const deleteShow = useCallback(async (id: number): Promise<void> => {
    await api.delete(`/shows/${id}`);
    setShows((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getShowsByStatus = useCallback(
    (status: Show["status"]) => {
      return shows.filter((s) => s.status === status);
    },
    [shows],
  );

  return (
    <ShowsContext.Provider
      value={{
        shows,
        loading,
        error,
        refresh,
        addShow,
        updateShow,
        deleteShow,
        getShowsByStatus,
      }}
    >
      {children}
    </ShowsContext.Provider>
  );
}

export function useShows() {
  const context = useContext(ShowsContext);
  if (!context) {
    throw new Error("useShows must be used within a ShowsProvider");
  }
  return context;
}
