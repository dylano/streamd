interface Env {
  DB: D1Database;
}

interface Episode {
  id: number;
  show_id: number;
  tmdb_id: number | null;
  season_number: number;
  episode_number: number;
  name: string | null;
  air_date: string | null;
  runtime: number | null;
  watched: number;
  watched_at: string | null;
}

// GET /api/episodes?show_id=123 - List episodes for a show with user's watch state
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = (context.data as { userId: number }).userId;
  const url = new URL(context.request.url);
  const showId = url.searchParams.get("show_id");

  if (!showId) {
    return Response.json({ error: "show_id parameter is required" }, { status: 400 });
  }

  const result = await context.env.DB.prepare(
    `SELECT e.id, e.show_id, e.tmdb_id, e.season_number, e.episode_number,
            e.name, e.air_date, e.runtime,
            COALESCE(ue.watched, 0) as watched, ue.watched_at
     FROM episodes e
     LEFT JOIN user_episodes ue ON e.id = ue.episode_id AND ue.user_id = ?
     WHERE e.show_id = ?
     ORDER BY e.season_number, e.episode_number`,
  )
    .bind(userId, showId)
    .all<Episode>();

  return Response.json(result.results);
};

// POST /api/episodes - Create or update episodes (batch upsert)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json<{
    show_id: number;
    episodes: Array<{
      tmdb_id?: number | null;
      season_number: number;
      episode_number: number;
      name?: string | null;
      air_date?: string | null;
      runtime?: number | null;
    }>;
  }>();

  if (!body.show_id || !body.episodes?.length) {
    return Response.json({ error: "show_id and episodes are required" }, { status: 400 });
  }

  const statements = body.episodes.map((ep) =>
    context.env.DB.prepare(
      `INSERT INTO episodes (show_id, tmdb_id, season_number, episode_number, name, air_date, runtime)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(show_id, season_number, episode_number) DO UPDATE SET
         tmdb_id = excluded.tmdb_id,
         name = excluded.name,
         air_date = excluded.air_date,
         runtime = excluded.runtime`,
    ).bind(
      body.show_id,
      ep.tmdb_id ?? null,
      ep.season_number,
      ep.episode_number,
      ep.name ?? null,
      ep.air_date ?? null,
      ep.runtime ?? null,
    ),
  );

  await context.env.DB.batch(statements);

  const userId = (context.data as { userId: number }).userId;
  const result = await context.env.DB.prepare(
    `SELECT e.id, e.show_id, e.tmdb_id, e.season_number, e.episode_number,
            e.name, e.air_date, e.runtime,
            COALESCE(ue.watched, 0) as watched, ue.watched_at
     FROM episodes e
     LEFT JOIN user_episodes ue ON e.id = ue.episode_id AND ue.user_id = ?
     WHERE e.show_id = ?
     ORDER BY e.season_number, e.episode_number`,
  )
    .bind(userId, body.show_id)
    .all<Episode>();

  return Response.json(result.results, { status: 201 });
};
