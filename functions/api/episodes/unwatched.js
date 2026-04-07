// GET /api/episodes/unwatched - Get all unwatched aired episodes
export const onRequestGet = async (context) => {
  const today = new Date().toISOString().split("T")[0];
  const result = await context.env.DB.prepare(`SELECT
      e.id, e.show_id, e.tmdb_id, e.season_number, e.episode_number,
      e.name, e.air_date, e.runtime,
      s.name as show_name, s.poster_path as show_poster_path
    FROM episodes e
    JOIN shows s ON e.show_id = s.id
    WHERE e.watched = 0 AND e.air_date IS NOT NULL AND e.air_date <= ?
    ORDER BY e.air_date DESC, s.name, e.season_number, e.episode_number`)
    .bind(today)
    .all();
  return Response.json(result.results);
};
