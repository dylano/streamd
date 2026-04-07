import { describe, it, expect } from "vite-plus/test";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";
import { ShowsProvider, useShows } from "./ShowsContext";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <ShowsProvider>{children}</ShowsProvider>;
}

describe("ShowsContext", () => {
  describe("useShows", () => {
    it("throws error when used outside provider", () => {
      expect(() => {
        renderHook(() => useShows());
      }).toThrow("useShows must be used within a ShowsProvider");
    });

    it("fetches shows on mount", async () => {
      const { result } = renderHook(() => useShows(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.shows).toHaveLength(2);
      expect(result.current.shows[0].name).toBe("Scrubs");
    });

    it("adds a new show", async () => {
      const { result } = renderHook(() => useShows(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addShow({
          tmdb_id: 9999,
          name: "New Show",
          status: "watchlist",
        });
      });

      expect(result.current.shows).toHaveLength(3);
      expect(result.current.shows[0].name).toBe("New Show");
    });

    it("updates a show", async () => {
      server.use(
        http.put("/api/shows/:id", async ({ params, request }) => {
          const body = (await request.json()) as { status: string };
          return HttpResponse.json({
            id: Number(params.id),
            tmdb_id: 4556,
            name: "Scrubs",
            poster_path: "/scrubs.jpg",
            overview: "A comedy about hospital life",
            first_air_date: "2001-10-02",
            status: body.status,
            streaming_service: "Hulu",
            total_seasons: 9,
            total_episodes: 182,
            current_season: 1,
            current_episode: 6,
            added_at: "2024-01-01T00:00:00Z",
            updated_at: new Date().toISOString(),
          });
        }),
      );

      const { result } = renderHook(() => useShows(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateShow(1, { status: "watching" });
      });

      const updatedShow = result.current.shows.find((s) => s.id === 1);
      expect(updatedShow?.status).toBe("watching");
    });

    it("deletes a show", async () => {
      const { result } = renderHook(() => useShows(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCount = result.current.shows.length;

      await act(async () => {
        await result.current.deleteShow(1);
      });

      expect(result.current.shows).toHaveLength(initialCount - 1);
      expect(result.current.shows.find((s) => s.id === 1)).toBeUndefined();
    });

    it("filters shows by status", async () => {
      const { result } = renderHook(() => useShows(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const watchlistShows = result.current.getShowsByStatus("watchlist");
      expect(watchlistShows.length).toBeGreaterThan(0);
      expect(watchlistShows.every((s) => s.status === "watchlist")).toBe(true);
    });

    it("can refresh shows", async () => {
      const { result } = renderHook(() => useShows(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.shows).toHaveLength(2);
    });

    it("handles fetch error", async () => {
      server.use(
        http.get("/api/shows", () => {
          return HttpResponse.json({ error: "Server error" }, { status: 500 });
        }),
      );

      const { result } = renderHook(() => useShows(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
    });
  });
});
