interface Env {
  DB: D1Database;
}

// GET /api/users/:id/shows - List a user's shows (read-only, public)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const userId = Number(context.params.id);
    if (isNaN(userId)) {
      return Response.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const result = await context.env.DB.prepare(
      `SELECT s.id, s.tmdb_id, s.name, s.poster_path, s.overview, s.first_air_date,
             s.streaming_service, s.total_seasons, s.total_episodes,
             us.status, us.current_season, us.current_episode,
             us.added_at, us.updated_at
      FROM user_shows us
      JOIN shows s ON us.show_id = s.id
      WHERE us.user_id = ?
      ORDER BY us.updated_at DESC`,
    )
      .bind(userId)
      .all();

    return Response.json(result.results);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
};
