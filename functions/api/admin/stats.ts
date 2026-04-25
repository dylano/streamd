import { requireAdmin } from "./_guard";

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  const [users, shows, episodes, watched] = await Promise.all([
    context.env.DB.prepare("SELECT COUNT(*) as count FROM users").first<{ count: number }>(),
    context.env.DB.prepare("SELECT COUNT(*) as count FROM shows").first<{ count: number }>(),
    context.env.DB.prepare("SELECT COUNT(*) as count FROM episodes").first<{ count: number }>(),
    context.env.DB.prepare("SELECT COUNT(*) as count FROM user_episodes WHERE watched = 1").first<{
      count: number;
    }>(),
  ]);

  return Response.json({
    users: users?.count ?? 0,
    shows: shows?.count ?? 0,
    episodes: episodes?.count ?? 0,
    watchedEpisodes: watched?.count ?? 0,
  });
};
