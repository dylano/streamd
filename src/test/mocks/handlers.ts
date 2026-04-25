import { http, HttpResponse } from "msw";
import type { Show } from "../../types/show";
import type { UnwatchedEpisode, Episode } from "../../types/episode";

// Mock user
export const mockUser = { id: 1, name: "TestUser" };

// Mock data
export const mockShows: Show[] = [
  {
    id: 1,
    tmdb_id: 4556,
    name: "Scrubs",
    poster_path: "/scrubs.jpg",
    overview: "A comedy about hospital life",
    first_air_date: "2001-10-02",
    status: "watchlist",
    streaming_service: JSON.stringify([{ name: "Hulu", logo_path: "/hulu.png" }]),
    total_seasons: 9,
    total_episodes: 182,
    current_season: 1,
    current_episode: 6,
    added_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    tmdb_id: 1418,
    name: "The Big Bang Theory",
    poster_path: "/tbbt.jpg",
    overview: "Physicists and their neighbor",
    first_air_date: "2007-09-24",
    status: "watchlist",
    streaming_service: null,
    total_seasons: 12,
    total_episodes: 279,
    current_season: 3,
    current_episode: 1,
    added_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
];

export const mockUnwatchedEpisodes: UnwatchedEpisode[] = [
  {
    id: 1,
    show_id: 1,
    show_name: "Scrubs",
    show_poster_path: "/scrubs.jpg",
    show_network: JSON.stringify([{ name: "Hulu", logo_path: "/hulu.png" }]),
    show_current_season: 1,
    show_current_episode: 6,
    tmdb_id: 101,
    season_number: 1,
    episode_number: 6,
    name: "My Bad",
    air_date: "2024-03-01",
    runtime: 22,
  },
  {
    id: 2,
    show_id: 1,
    show_name: "Scrubs",
    show_poster_path: "/scrubs.jpg",
    show_network: JSON.stringify([{ name: "Hulu", logo_path: "/hulu.png" }]),
    show_current_season: 1,
    show_current_episode: 6,
    tmdb_id: 102,
    season_number: 1,
    episode_number: 7,
    name: "My Super Ego",
    air_date: "2024-03-08",
    runtime: 22,
  },
  {
    id: 3,
    show_id: 2,
    show_name: "The Big Bang Theory",
    show_poster_path: "/tbbt.jpg",
    show_network: JSON.stringify([{ name: "Max", logo_path: "/max.png" }]),
    show_current_season: 3,
    show_current_episode: 1,
    tmdb_id: 201,
    season_number: 3,
    episode_number: 1,
    name: "The Electric Can Opener Fluctuation",
    air_date: "2024-02-15",
    runtime: 22,
  },
];

export const mockEpisodes: Episode[] = [
  {
    id: 1,
    show_id: 1,
    tmdb_id: 101,
    season_number: 1,
    episode_number: 1,
    name: "My First Day",
    air_date: "2001-10-02",
    runtime: 22,
    watched: true,
    watched_at: "2024-01-15T00:00:00Z",
  },
  {
    id: 2,
    show_id: 1,
    tmdb_id: 102,
    season_number: 1,
    episode_number: 2,
    name: "My Mentor",
    air_date: "2001-10-04",
    runtime: 22,
    watched: false,
    watched_at: null,
  },
];

// Other mock users (for social/browse feature)
export const mockOtherUsers = [
  { id: 2, name: "Alice" },
  { id: 3, name: "Bob" },
];

export const mockOtherUserShows: Show[] = [
  {
    id: 3,
    tmdb_id: 1399,
    name: "Breaking Bad",
    poster_path: "/bb.jpg",
    overview: "A high school chemistry teacher turned meth producer",
    first_air_date: "2008-01-20",
    status: "completed",
    streaming_service: null,
    total_seasons: 5,
    total_episodes: 62,
    current_season: null,
    current_episode: null,
    added_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
  },
  {
    id: 1,
    tmdb_id: 4556,
    name: "Scrubs",
    poster_path: "/scrubs.jpg",
    overview: "A comedy about hospital life",
    first_air_date: "2001-10-02",
    status: "watching",
    streaming_service: null,
    total_seasons: 9,
    total_episodes: 182,
    current_season: 2,
    current_episode: 3,
    added_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

export const handlers = [
  // Users
  http.get("/api/users/all", () => {
    return HttpResponse.json([mockUser, ...mockOtherUsers]);
  }),

  http.get("/api/users/:id/shows", ({ params }) => {
    const userId = Number(params.id);
    if (userId === 2) {
      return HttpResponse.json(mockOtherUserShows);
    }
    return HttpResponse.json([]);
  }),

  http.get("/api/users", ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get("name");
    if (name?.toLowerCase() === mockUser.name.toLowerCase()) {
      return HttpResponse.json(mockUser);
    }
    return HttpResponse.json({ error: "User not found" }, { status: 404 });
  }),

  http.get("/api/users/:id", ({ params }) => {
    if (Number(params.id) === mockUser.id) {
      return HttpResponse.json(mockUser);
    }
    return HttpResponse.json({ error: "User not found" }, { status: 404 });
  }),

  http.post("/api/users", async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json({ id: 2, name: body.name }, { status: 201 });
  }),

  // Health check
  http.get("/api/health", () => {
    return HttpResponse.json({
      status: "mock",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        showCount: mockShows.length,
      },
    });
  }),

  // Shows
  http.get("/api/shows", () => {
    return HttpResponse.json(mockShows);
  }),

  http.get("/api/shows/:id", ({ params }) => {
    const show = mockShows.find((s) => s.id === Number(params.id));
    if (!show) {
      return HttpResponse.json({ error: "Show not found" }, { status: 404 });
    }
    return HttpResponse.json(show);
  }),

  http.post("/api/shows", async ({ request }) => {
    const body = (await request.json()) as Partial<Show>;
    const newShow: Show = {
      id: mockShows.length + 1,
      tmdb_id: body.tmdb_id!,
      name: body.name!,
      poster_path: body.poster_path ?? null,
      overview: body.overview ?? null,
      first_air_date: body.first_air_date ?? null,
      status: body.status ?? "watchlist",
      streaming_service: body.streaming_service ?? null,
      total_seasons: body.total_seasons ?? 0,
      total_episodes: body.total_episodes ?? 0,
      current_season: body.current_season ?? 1,
      current_episode: body.current_episode ?? 1,
      added_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(newShow, { status: 201 });
  }),

  http.delete("/api/shows/:id", ({ params }) => {
    const index = mockShows.findIndex((s) => s.id === Number(params.id));
    if (index === -1) {
      return HttpResponse.json({ error: "Show not found" }, { status: 404 });
    }
    return HttpResponse.json({ success: true });
  }),

  // Episodes
  http.get("/api/episodes/unwatched", () => {
    return HttpResponse.json(mockUnwatchedEpisodes);
  }),

  http.get("/api/shows/:showId/episodes", ({ params }) => {
    const episodes = mockEpisodes.filter((e) => e.show_id === Number(params.showId));
    return HttpResponse.json(episodes);
  }),

  http.put("/api/episodes/:id", async ({ params, request }) => {
    const body = (await request.json()) as { watched: boolean };
    const episode = mockEpisodes.find((e) => e.id === Number(params.id));
    if (!episode) {
      return HttpResponse.json({ error: "Episode not found" }, { status: 404 });
    }
    return HttpResponse.json({
      ...episode,
      watched: body.watched,
      watched_at: body.watched ? new Date().toISOString() : null,
    });
  }),

  // Sync
  http.post("/api/shows/sync", () => {
    return HttpResponse.json({
      synced: mockShows.map((s) => ({ show: s.name, synced: 10 })),
    });
  }),

  // TMDB
  http.get("/api/tmdb/search", ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("query") ?? "";
    return HttpResponse.json({
      page: 1,
      results: [
        {
          id: 12345,
          name: `${query} Show`,
          poster_path: "/test.jpg",
          overview: "A test show",
          first_air_date: "2024-01-01",
          vote_average: 8.5,
          popularity: 100,
        },
      ],
      total_pages: 1,
      total_results: 1,
    });
  }),

  http.get("/api/tmdb/show/:id", ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      name: "Test Show",
      overview: "A test show",
      poster_path: "/test.jpg",
      backdrop_path: "/backdrop.jpg",
      first_air_date: "2024-01-01",
      last_air_date: "2024-12-01",
      status: "Returning Series",
      number_of_seasons: 3,
      number_of_episodes: 30,
      seasons: [
        { id: 1, name: "Season 1", season_number: 1, episode_count: 10 },
        { id: 2, name: "Season 2", season_number: 2, episode_count: 10 },
        { id: 3, name: "Season 3", season_number: 3, episode_count: 10 },
      ],
      vote_average: 8.5,
      genres: [{ id: 35, name: "Comedy" }],
      networks: [{ id: 1, name: "ABC", logo_path: "/abc.png" }],
    });
  }),

  http.get("/api/tmdb/show/:showId/season/:seasonNumber", ({ params }) => {
    return HttpResponse.json({
      id: 1,
      name: `Season ${params.seasonNumber}`,
      overview: "A season",
      season_number: Number(params.seasonNumber),
      air_date: "2024-01-01",
      poster_path: "/season.jpg",
      episodes: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Episode ${i + 1}`,
        overview: `Episode ${i + 1} overview`,
        episode_number: i + 1,
        season_number: Number(params.seasonNumber),
        air_date: `2024-0${Math.min(i + 1, 9)}-01`,
        runtime: 22,
        still_path: `/still${i + 1}.jpg`,
      })),
    });
  }),

  http.get("/api/tmdb/trending", () => {
    return HttpResponse.json({
      page: 1,
      results: [
        {
          id: 101,
          name: "Trending Show 1",
          poster_path: "/trend1.jpg",
          overview: "Trending 1",
          first_air_date: "2024-01-01",
          vote_average: 8.5,
          popularity: 200,
        },
        {
          id: 102,
          name: "Trending Show 2",
          poster_path: "/trend2.jpg",
          overview: "Trending 2",
          first_air_date: "2024-02-01",
          vote_average: 8.2,
          popularity: 180,
        },
        {
          id: 103,
          name: "Trending Show 3",
          poster_path: "/trend3.jpg",
          overview: "Trending 3",
          first_air_date: "2024-03-01",
          vote_average: 8.0,
          popularity: 160,
        },
        {
          id: 104,
          name: "Trending Show 4",
          poster_path: "/trend4.jpg",
          overview: "Trending 4",
          first_air_date: "2024-04-01",
          vote_average: 7.8,
          popularity: 140,
        },
      ],
      total_pages: 1,
      total_results: 4,
    });
  }),

  // Admin
  http.get("/api/admin/stats", () => {
    return HttpResponse.json({
      users: 3,
      shows: 5,
      episodes: 120,
      watchedEpisodes: 45,
    });
  }),

  http.get("/api/admin/users", () => {
    return HttpResponse.json([
      {
        id: 1,
        name: "doliver",
        created_at: "2024-01-01T00:00:00",
        show_count: 3,
        watched_count: 20,
      },
      { id: 2, name: "Alice", created_at: "2024-02-15T00:00:00", show_count: 1, watched_count: 5 },
      { id: 3, name: "Bob", created_at: "2024-03-10T00:00:00", show_count: 2, watched_count: 10 },
    ]);
  }),

  http.delete("/api/admin/users/:id", ({ params }) => {
    if (Number(params.id) === 1) {
      return HttpResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }
    return HttpResponse.json({ ok: true });
  }),

  // Dev
  http.post("/api/dev/reset", () => {
    return HttpResponse.json({ success: true, message: "Database reset complete" });
  }),
];
