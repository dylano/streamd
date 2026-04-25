import { requireAdmin } from "./_guard";

interface Env {
  DB: D1Database;
}

interface UserRow {
  id: number;
  name: string;
  created_at: string;
  show_count: number;
  watched_count: number;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  const { results } = await context.env.DB.prepare(`
    SELECT
      u.id, u.name, u.created_at,
      COUNT(DISTINCT us.show_id) as show_count,
      COUNT(DISTINCT CASE WHEN ue.watched = 1 THEN ue.episode_id END) as watched_count
    FROM users u
    LEFT JOIN user_shows us ON us.user_id = u.id
    LEFT JOIN user_episodes ue ON ue.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at
  `).all<UserRow>();

  return Response.json(results);
};
