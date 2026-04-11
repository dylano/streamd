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

// GET /api/shows - List user's shows, optionally filtered by status
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const userId = (context.data as { userId: number }).userId;
    const url = new URL(context.request.url);
    const status = url.searchParams.get("status");

    let query = `
      SELECT s.id, s.tmdb_id, s.name, s.poster_path, s.overview, s.first_air_date,
             s.streaming_service, s.total_seasons, s.total_episodes,
             us.status, us.current_season, us.current_episode,
             us.added_at, us.updated_at
      FROM user_shows us
      JOIN shows s ON us.show_id = s.id
      WHERE us.user_id = ?`;
    const params: (string | number)[] = [userId];

    if (status) {
      query += " AND us.status = ?";
      params.push(status);
    }

    query += " ORDER BY us.updated_at DESC";

    const result = await context.env.DB.prepare(query)
      .bind(...params)
      .all<Show>();

    return Response.json(result.results);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
};

// POST /api/shows - Add a show to user's list
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const userId = (context.data as { userId: number }).userId;
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

    // Insert the show if it doesn't exist (another user may have added it already)
    await context.env.DB.prepare(
      `INSERT OR IGNORE INTO shows (
        tmdb_id, name, poster_path, overview, first_air_date,
        streaming_service, total_seasons, total_episodes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        body.tmdb_id,
        body.name,
        body.poster_path ?? null,
        body.overview ?? null,
        body.first_air_date ?? null,
        body.streaming_service ?? null,
        body.total_seasons ?? 0,
        body.total_episodes ?? 0,
      )
      .run();

    // Get the show ID (whether just inserted or already existed)
    const show = await context.env.DB.prepare("SELECT id FROM shows WHERE tmdb_id = ?")
      .bind(body.tmdb_id)
      .first<{ id: number }>();

    if (!show) {
      return Response.json({ error: "Failed to find or create show" }, { status: 500 });
    }

    // Check if this user already tracks this show
    const existing = await context.env.DB.prepare(
      "SELECT 1 FROM user_shows WHERE user_id = ? AND show_id = ?",
    )
      .bind(userId, show.id)
      .first();

    if (existing) {
      return Response.json({ error: "Show already exists" }, { status: 409 });
    }

    // Create the user-show relationship
    await context.env.DB.prepare(
      `INSERT INTO user_shows (user_id, show_id, status, current_season, current_episode)
       VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(
        userId,
        show.id,
        body.status ?? "watchlist",
        body.current_season ?? null,
        body.current_episode ?? null,
      )
      .run();

    // Return the combined show data
    const result = await context.env.DB.prepare(
      `SELECT s.id, s.tmdb_id, s.name, s.poster_path, s.overview, s.first_air_date,
              s.streaming_service, s.total_seasons, s.total_episodes,
              us.status, us.current_season, us.current_episode,
              us.added_at, us.updated_at
       FROM user_shows us
       JOIN shows s ON us.show_id = s.id
       WHERE us.user_id = ? AND s.id = ?`,
    )
      .bind(userId, show.id)
      .first<Show>();

    return Response.json(result, { status: 201 });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
};
