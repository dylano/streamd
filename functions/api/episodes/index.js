// GET /api/episodes?show_id=123 - List episodes for a show
export const onRequestGet = async (context) => {
  const url = new URL(context.request.url);
  const showId = url.searchParams.get("show_id");
  if (!showId) {
    return Response.json({ error: "show_id parameter is required" }, { status: 400 });
  }
  const result = await context.env.DB.prepare(
    "SELECT * FROM episodes WHERE show_id = ? ORDER BY season_number, episode_number",
  )
    .bind(showId)
    .all();
  return Response.json(result.results);
};
// POST /api/episodes - Create or update episodes (batch upsert)
export const onRequestPost = async (context) => {
  const body = await context.request.json();
  if (!body.show_id || !body.episodes?.length) {
    return Response.json({ error: "show_id and episodes are required" }, { status: 400 });
  }
  const statements = body.episodes.map((ep) =>
    context.env.DB.prepare(`INSERT INTO episodes (show_id, tmdb_id, season_number, episode_number, name, air_date, runtime)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(show_id, season_number, episode_number) DO UPDATE SET
         tmdb_id = excluded.tmdb_id,
         name = excluded.name,
         air_date = excluded.air_date,
         runtime = excluded.runtime`).bind(
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
  const result = await context.env.DB.prepare(
    "SELECT * FROM episodes WHERE show_id = ? ORDER BY season_number, episode_number",
  )
    .bind(body.show_id)
    .all();
  return Response.json(result.results, { status: 201 });
};
