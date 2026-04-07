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

// GET /api/shows/:id - Get a single show
export const onRequestGet: PagesFunction<Env, "id"> = async (context) => {
  const id = String(context.params.id);

  const show = await context.env.DB.prepare("SELECT * FROM shows WHERE id = ?")
    .bind(id)
    .first<Show>();

  if (!show) {
    return Response.json({ error: "Show not found" }, { status: 404 });
  }

  return Response.json(show);
};

// PUT /api/shows/:id - Update a show
export const onRequestPut: PagesFunction<Env, "id"> = async (context) => {
  const id = String(context.params.id);
  const body = await context.request.json<{
    status?: string;
    streaming_service?: string | null;
    current_season?: number | null;
    current_episode?: number | null;
  }>();

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.status !== undefined) {
    updates.push("status = ?");
    values.push(body.status);
  }
  if (body.streaming_service !== undefined) {
    updates.push("streaming_service = ?");
    values.push(body.streaming_service);
  }
  if (body.current_season !== undefined) {
    updates.push("current_season = ?");
    values.push(body.current_season);
  }
  if (body.current_episode !== undefined) {
    updates.push("current_episode = ?");
    values.push(body.current_episode);
  }

  if (updates.length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  const result = await context.env.DB.prepare(
    `UPDATE shows SET ${updates.join(", ")} WHERE id = ? RETURNING *`,
  )
    .bind(...values)
    .first<Show>();

  if (!result) {
    return Response.json({ error: "Show not found" }, { status: 404 });
  }

  return Response.json(result);
};

// DELETE /api/shows/:id - Delete a show
export const onRequestDelete: PagesFunction<Env, "id"> = async (context) => {
  const id = String(context.params.id);

  const result = await context.env.DB.prepare("DELETE FROM shows WHERE id = ? RETURNING id")
    .bind(id)
    .first();

  if (!result) {
    return Response.json({ error: "Show not found" }, { status: 404 });
  }

  return Response.json({ success: true });
};
