import { describe, it, expect } from "vite-plus/test";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";
import { useEpisodes } from "./useEpisodes";

describe("useEpisodes", () => {
  it("initializes with empty state", () => {
    const { result } = renderHook(() => useEpisodes(null));
    expect(result.current.episodes).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("fetches episodes for a show", async () => {
    server.use(
      http.get("/api/episodes", ({ request }) => {
        const url = new URL(request.url);
        const showId = url.searchParams.get("show_id");
        if (showId === "1") {
          return HttpResponse.json([
            { id: 1, show_id: 1, season_number: 1, episode_number: 1, name: "Pilot" },
            { id: 2, show_id: 1, season_number: 1, episode_number: 2, name: "Second" },
          ]);
        }
        return HttpResponse.json([]);
      }),
    );

    const { result } = renderHook(() => useEpisodes(1));

    await act(async () => {
      await result.current.fetchEpisodes();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.episodes).toHaveLength(2);
    expect(result.current.episodes[0].name).toBe("Pilot");
  });

  it("does not fetch when showId is null", async () => {
    const { result } = renderHook(() => useEpisodes(null));

    await act(async () => {
      await result.current.fetchEpisodes();
    });

    expect(result.current.episodes).toEqual([]);
  });

  it("syncs episodes", async () => {
    server.use(
      http.post("/api/episodes", async ({ request }) => {
        const body = (await request.json()) as { show_id: number; episodes: unknown[] };
        return HttpResponse.json([
          { id: 1, show_id: body.show_id, season_number: 1, episode_number: 1, name: "Synced" },
        ]);
      }),
    );

    const { result } = renderHook(() => useEpisodes(1));

    await act(async () => {
      await result.current.syncEpisodes([{ season_number: 1, episode_number: 1, name: "Synced" }]);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.episodes).toHaveLength(1);
    expect(result.current.episodes[0].name).toBe("Synced");
  });

  it("marks episode as watched", async () => {
    server.use(
      http.get("/api/episodes", () => {
        return HttpResponse.json([
          { id: 1, show_id: 1, season_number: 1, episode_number: 1, name: "Test", watched: false },
        ]);
      }),
      http.put("/api/episodes/:id", () => {
        return HttpResponse.json({
          id: 1,
          show_id: 1,
          season_number: 1,
          episode_number: 1,
          name: "Test",
          watched: true,
        });
      }),
    );

    const { result } = renderHook(() => useEpisodes(1));

    await act(async () => {
      await result.current.fetchEpisodes();
    });

    await act(async () => {
      await result.current.markWatched(1, true);
    });

    expect(result.current.episodes[0].watched).toBe(true);
  });

  it("filters episodes by season", async () => {
    server.use(
      http.get("/api/episodes", () => {
        return HttpResponse.json([
          { id: 1, show_id: 1, season_number: 1, episode_number: 1, name: "S1E1" },
          { id: 2, show_id: 1, season_number: 1, episode_number: 2, name: "S1E2" },
          { id: 3, show_id: 1, season_number: 2, episode_number: 1, name: "S2E1" },
        ]);
      }),
    );

    const { result } = renderHook(() => useEpisodes(1));

    await act(async () => {
      await result.current.fetchEpisodes();
    });

    const season1Episodes = result.current.getEpisodesBySeason(1);
    expect(season1Episodes).toHaveLength(2);

    const season2Episodes = result.current.getEpisodesBySeason(2);
    expect(season2Episodes).toHaveLength(1);
  });

  it("handles fetch error", async () => {
    server.use(
      http.get("/api/episodes", () => {
        return HttpResponse.json({ error: "Server error" }, { status: 500 });
      }),
    );

    const { result } = renderHook(() => useEpisodes(1));

    await act(async () => {
      await result.current.fetchEpisodes();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
  });
});
