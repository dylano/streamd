import { recomputeBookmark } from "./_bookmark";

interface Env {
  DB: D1Database;
}

interface Episode {
  id: number;
  show_id: number;
  tmdb_id: number | null;
  season_number: number;
  episode_number: number;
  name: string | null;
  air_date: string | null;
  runtime: number | null;
}

// PUT /api/episodes/:id - Mark episode watched/unwatched
export const onRequestPut: PagesFunction<Env, "id"> = async (context) => {
  const userId = (context.data as { userId: number }).userId;
  const id = String(context.params.id);
  const body = await context.request.json<{ watched: boolean }>();

  if (typeof body.watched !== "boolean") {
    return Response.json({ error: "watched field is required" }, { status: 400 });
  }

  const episode = await context.env.DB.prepare("SELECT * FROM episodes WHERE id = ?")
    .bind(id)
    .first<Episode>();

  if (!episode) {
    return Response.json({ error: "Episode not found" }, { status: 404 });
  }

  const watchedValue = body.watched ? 1 : 0;
  const watchedAt = body.watched ? new Date().toISOString() : null;

  // Upsert user_episodes for this episode
  await context.env.DB.prepare(
    `INSERT INTO user_episodes (user_id, episode_id, watched, watched_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (user_id, episode_id) DO UPDATE SET watched = ?, watched_at = ?`,
  )
    .bind(userId, episode.id, watchedValue, watchedAt, watchedValue, watchedAt)
    .run();

  // When marking as watched, also mark all earlier episodes in the same season
  if (body.watched) {
    const earlierEpisodes = await context.env.DB.prepare(
      `SELECT id FROM episodes
       WHERE show_id = ? AND season_number = ? AND episode_number < ?`,
    )
      .bind(episode.show_id, episode.season_number, episode.episode_number)
      .all<{ id: number }>();

    for (const ep of earlierEpisodes.results) {
      await context.env.DB.prepare(
        `INSERT INTO user_episodes (user_id, episode_id, watched, watched_at)
         VALUES (?, ?, 1, ?)
         ON CONFLICT (user_id, episode_id) DO UPDATE SET
           watched = 1, watched_at = COALESCE(user_episodes.watched_at, ?)`,
      )
        .bind(userId, ep.id, watchedAt, watchedAt)
        .run();
    }
  }

  // Recompute bookmark
  await recomputeBookmark(context.env.DB, userId, episode.show_id);

  // Return updated episode with user's watch state
  const updated = await context.env.DB.prepare(
    `SELECT e.id, e.show_id, e.tmdb_id, e.season_number, e.episode_number,
            e.name, e.air_date, e.runtime,
            COALESCE(ue.watched, 0) as watched, ue.watched_at
     FROM episodes e
     LEFT JOIN user_episodes ue ON e.id = ue.episode_id AND ue.user_id = ?
     WHERE e.id = ?`,
  )
    .bind(userId, id)
    .first();

  return Response.json(updated);
};
