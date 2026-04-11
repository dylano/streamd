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

// GET /api/episodes/unwatched - Get all unwatched aired episodes for this user
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const userId = (context.data as { userId: number }).userId;
    const url = new URL(context.request.url);
    const tz = url.searchParams.get("tz") || "UTC";
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const y = parts.find((p) => p.type === "year")!.value;
    const m = parts.find((p) => p.type === "month")!.value;
    const d = parts.find((p) => p.type === "day")!.value;
    const today = `${y}-${m}-${d}`;

    const result = await context.env.DB.prepare(
      `SELECT
        e.id, e.show_id, e.tmdb_id, e.season_number, e.episode_number,
        e.name, e.air_date, e.runtime,
        s.name as show_name, s.poster_path as show_poster_path,
        s.streaming_service as show_network,
        us.current_season as show_current_season,
        us.current_episode as show_current_episode
      FROM user_shows us
      JOIN shows s ON us.show_id = s.id
      JOIN episodes e ON e.show_id = s.id
      LEFT JOIN user_episodes ue ON e.id = ue.episode_id AND ue.user_id = ?
      WHERE us.user_id = ?
        AND COALESCE(ue.watched, 0) = 0
        AND e.air_date IS NOT NULL
        AND e.air_date <= ?
      ORDER BY e.air_date DESC, s.name, e.season_number, e.episode_number`,
    )
      .bind(userId, userId, today)
      .all<UnwatchedEpisode>();

    return Response.json(result.results);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
};
