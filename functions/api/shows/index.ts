interface Env {
  DB: D1Database;
}

interface Show {
  id: number;
  tmdb_id: number;
  name: string;
  poster_path: string | null;
  overview: string | null;
  first_air_date: string | null;
  status: string;
  streaming_service: string | null;
  total_seasons: number;
  total_episodes: number;
  current_season: number | null;
  current_episode: number | null;
  added_at: string;
  updated_at: string;
}

// GET /api/shows - List all shows, optionally filtered by status
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const status = url.searchParams.get("status");

    let query = "SELECT * FROM shows";
    const params: string[] = [];

    if (status) {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY updated_at DESC";

    const result = await context.env.DB.prepare(query)
      .bind(...params)
      .all<Show>();

    return Response.json(result.results);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
};

// POST /api/shows - Create a new show
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json<{
      tmdb_id: number;
      name: string;
      poster_path?: string | null;
      overview?: string | null;
      first_air_date?: string | null;
      status?: string;
      streaming_service?: string | null;
      total_seasons?: number;
      total_episodes?: number;
      current_season?: number | null;
      current_episode?: number | null;
    }>();

    if (!body.tmdb_id || !body.name) {
      return Response.json({ error: "tmdb_id and name are required" }, { status: 400 });
    }

    // Check if show already exists
    const existing = await context.env.DB.prepare("SELECT id FROM shows WHERE tmdb_id = ?")
      .bind(body.tmdb_id)
      .first();

    if (existing) {
      return Response.json({ error: "Show already exists" }, { status: 409 });
    }

    await context.env.DB.prepare(
      `INSERT INTO shows (
        tmdb_id, name, poster_path, overview, first_air_date,
        status, streaming_service, total_seasons, total_episodes,
        current_season, current_episode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        body.tmdb_id,
        body.name,
        body.poster_path ?? null,
        body.overview ?? null,
        body.first_air_date ?? null,
        body.status ?? "watchlist",
        body.streaming_service ?? null,
        body.total_seasons ?? 0,
        body.total_episodes ?? 0,
        body.current_season ?? null,
        body.current_episode ?? null,
      )
      .run();

    // Fetch the inserted show
    const result = await context.env.DB.prepare("SELECT * FROM shows WHERE tmdb_id = ?")
      .bind(body.tmdb_id)
      .first<Show>();

    return Response.json(result, { status: 201 });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
};
