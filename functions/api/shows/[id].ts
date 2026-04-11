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

function getShowForUser(db: D1Database, userId: number, showId: string) {
  return db
    .prepare(
      `SELECT s.id, s.tmdb_id, s.name, s.poster_path, s.overview, s.first_air_date,
              s.streaming_service, s.total_seasons, s.total_episodes,
              us.status, us.current_season, us.current_episode,
              us.added_at, us.updated_at
       FROM user_shows us
       JOIN shows s ON us.show_id = s.id
       WHERE us.user_id = ? AND s.id = ?`,
    )
    .bind(userId, showId)
    .first<Show>();
}

// GET /api/shows/:id - Get a single show for this user
export const onRequestGet: PagesFunction<Env, "id"> = async (context) => {
  const userId = (context.data as { userId: number }).userId;
  const id = String(context.params.id);

  const show = await getShowForUser(context.env.DB, userId, id);

  if (!show) {
    return Response.json({ error: "Show not found" }, { status: 404 });
  }

  return Response.json(show);
};

// PUT /api/shows/:id - Update a show
export const onRequestPut: PagesFunction<Env, "id"> = async (context) => {
  const userId = (context.data as { userId: number }).userId;
  const id = String(context.params.id);
  const body = await context.request.json<{
    status?: string;
    streaming_service?: string | null;
    current_season?: number | null;
    current_episode?: number | null;
  }>();

  // Update user_shows fields (status, bookmark)
  const userUpdates: string[] = [];
  const userValues: (string | number | null)[] = [];

  if (body.status !== undefined) {
    userUpdates.push("status = ?");
    userValues.push(body.status);
  }
  if (body.current_season !== undefined) {
    userUpdates.push("current_season = ?");
    userValues.push(body.current_season);
  }
  if (body.current_episode !== undefined) {
    userUpdates.push("current_episode = ?");
    userValues.push(body.current_episode);
  }

  if (userUpdates.length > 0) {
    userUpdates.push("updated_at = datetime('now')");
    await context.env.DB.prepare(
      `UPDATE user_shows SET ${userUpdates.join(", ")} WHERE user_id = ? AND show_id = ?`,
    )
      .bind(...userValues, userId, id)
      .run();
  }

  // Update shows fields (shared metadata like streaming_service)
  if (body.streaming_service !== undefined) {
    await context.env.DB.prepare(
      "UPDATE shows SET streaming_service = ?, updated_at = datetime('now') WHERE id = ?",
    )
      .bind(body.streaming_service, id)
      .run();
  }

  if (userUpdates.length === 0 && body.streaming_service === undefined) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const result = await getShowForUser(context.env.DB, userId, id);

  if (!result) {
    return Response.json({ error: "Show not found" }, { status: 404 });
  }

  return Response.json(result);
};

// DELETE /api/shows/:id - Remove show from user's list
export const onRequestDelete: PagesFunction<Env, "id"> = async (context) => {
  const userId = (context.data as { userId: number }).userId;
  const id = String(context.params.id);

  // Delete user_episodes for this user + show's episodes
  await context.env.DB.prepare(
    `DELETE FROM user_episodes WHERE user_id = ? AND episode_id IN (
       SELECT id FROM episodes WHERE show_id = ?
     )`,
  )
    .bind(userId, id)
    .run();

  // Delete user_shows relationship
  const result = await context.env.DB.prepare(
    "DELETE FROM user_shows WHERE user_id = ? AND show_id = ?",
  )
    .bind(userId, id)
    .run();

  if (result.meta.changes === 0) {
    return Response.json({ error: "Show not found" }, { status: 404 });
  }

  return Response.json({ success: true });
};
