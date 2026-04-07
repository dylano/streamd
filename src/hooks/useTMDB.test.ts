import { describe, it, expect } from "vite-plus/test";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useTMDBSearch, useTMDBShow, useTMDBSeason } from "./useTMDB";

describe("useTMDBSearch", () => {
  it("initializes with null results", () => {
    const { result } = renderHook(() => useTMDBSearch());
    expect(result.current.results).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("searches and returns results", async () => {
    const { result } = renderHook(() => useTMDBSearch());

    await act(async () => {
      await result.current.search("test");
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.results).not.toBeNull();
    expect(result.current.results?.results[0].name).toBe("test Show");
  });

  it("does not search with empty query", async () => {
    const { result } = renderHook(() => useTMDBSearch());

    await act(async () => {
      await result.current.search("");
    });

    expect(result.current.results).toBeNull();
  });

  it("clears results", async () => {
    const { result } = renderHook(() => useTMDBSearch());

    await act(async () => {
      await result.current.search("test");
    });

    await waitFor(() => {
      expect(result.current.results).not.toBeNull();
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.results).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

describe("useTMDBShow", () => {
  it("initializes with null show", () => {
    const { result } = renderHook(() => useTMDBShow());
    expect(result.current.show).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("fetches show details", async () => {
    const { result } = renderHook(() => useTMDBShow());

    await act(async () => {
      await result.current.fetchShow(12345);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.show).not.toBeNull();
    expect(result.current.show?.id).toBe(12345);
    expect(result.current.show?.name).toBe("Test Show");
  });

  it("returns show data from fetchShow", async () => {
    const { result } = renderHook(() => useTMDBShow());

    let returnedShow;
    await act(async () => {
      returnedShow = await result.current.fetchShow(12345);
    });

    expect(returnedShow).not.toBeNull();
    expect(returnedShow?.name).toBe("Test Show");
  });
});

describe("useTMDBSeason", () => {
  it("initializes with no loading state", () => {
    const { result } = renderHook(() => useTMDBSeason());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("fetches season with episodes", async () => {
    const { result } = renderHook(() => useTMDBSeason());

    let season;
    await act(async () => {
      season = await result.current.fetchSeason(12345, 1);
    });

    expect(season).not.toBeNull();
    expect(season?.season_number).toBe(1);
    expect(season?.episodes).toHaveLength(10);
    expect(season?.episodes[0].name).toBe("Episode 1");
  });
});
