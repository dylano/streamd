// GET /api/shows - List all shows, optionally filtered by status
export const onRequestGet = async (context) => {
  const url = new URL(context.request.url);
  const status = url.searchParams.get("status");
  let query = "SELECT * FROM shows";
  const params = [];
  if (status) {
    query += " WHERE status = ?";
    params.push(status);
  }
  query += " ORDER BY updated_at DESC";
  const result = await context.env.DB.prepare(query)
    .bind(...params)
    .all();
  return Response.json(result.results);
};
// POST /api/shows - Create a new show
export const onRequestPost = async (context) => {
  const body = await context.request.json();
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
  const result = await context.env.DB.prepare(`INSERT INTO shows (
      tmdb_id, name, poster_path, overview, first_air_date,
      status, streaming_service, total_seasons, total_episodes,
      current_season, current_episode
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *`)
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
    .first();
  return Response.json(result, { status: 201 });
};
