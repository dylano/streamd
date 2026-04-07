interface Env {
  DB: D1Database;
}

interface UnwatchedEpisode {
  id: number;
  show_id: number;
  show_name: string;
  show_poster_path: string | null;
  show_network: string | null;
  show_current_season: number | null;
  show_current_episode: number | null;
  tmdb_id: number | null;
  season_number: number;
  episode_number: number;
  name: string | null;
  air_date: string | null;
  runtime: number | null;
}

// GET /api/episodes/unwatched - Get all unwatched aired episodes
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const today = new Date().toISOString().split("T")[0];

  const result = await context.env.DB.prepare(
    `SELECT
      e.id, e.show_id, e.tmdb_id, e.season_number, e.episode_number,
      e.name, e.air_date, e.runtime,
      s.name as show_name, s.poster_path as show_poster_path,
      s.streaming_service as show_network,
      s.current_season as show_current_season,
      s.current_episode as show_current_episode
    FROM episodes e
    JOIN shows s ON e.show_id = s.id
    WHERE e.watched = 0 AND e.air_date IS NOT NULL AND e.air_date <= ?
    ORDER BY e.air_date DESC, s.name, e.season_number, e.episode_number`,
  )
    .bind(today)
    .all<UnwatchedEpisode>();

  return Response.json(result.results);
};
