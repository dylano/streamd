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

// Helper to recompute bookmark after watch state changes
async function recomputeBookmark(db: D1Database, userId: number, showId: number) {
  // Find the highest watched episode for this user
  const highestWatched = await db
    .prepare(
      `SELECT e.season_number, e.episode_number FROM user_episodes ue
       JOIN episodes e ON ue.episode_id = e.id
       WHERE e.show_id = ? AND ue.user_id = ? AND ue.watched = 1
       ORDER BY e.season_number DESC, e.episode_number DESC
       LIMIT 1`,
    )
    .bind(showId, userId)
    .first<{ season_number: number; episode_number: number }>();

  if (!highestWatched) {
    // No watched episodes - set bookmark to first episode (S1E1)
    const firstEp = await db
      .prepare(
        `SELECT season_number, episode_number FROM episodes
         WHERE show_id = ?
         ORDER BY season_number, episode_number
         LIMIT 1`,
      )
      .bind(showId)
      .first<{ season_number: number; episode_number: number }>();

    if (firstEp) {
      await db
        .prepare(
          `UPDATE user_shows SET current_season = ?, current_episode = ?, updated_at = datetime('now')
           WHERE user_id = ? AND show_id = ?`,
        )
        .bind(firstEp.season_number, firstEp.episode_number, userId, showId)
        .run();
    }
    return;
  }

  // Find the next episode after the highest watched
  const nextEp = await db
    .prepare(
      `SELECT season_number, episode_number FROM episodes
       WHERE show_id = ?
         AND (season_number > ? OR (season_number = ? AND episode_number > ?))
       ORDER BY season_number, episode_number
       LIMIT 1`,
    )
    .bind(
      showId,
      highestWatched.season_number,
      highestWatched.season_number,
      highestWatched.episode_number,
    )
    .first<{ season_number: number; episode_number: number }>();

  if (nextEp) {
    // Set bookmark to next episode
    await db
      .prepare(
        `UPDATE user_shows SET current_season = ?, current_episode = ?, updated_at = datetime('now')
         WHERE user_id = ? AND show_id = ?`,
      )
      .bind(nextEp.season_number, nextEp.episode_number, userId, showId)
      .run();
  } else {
    // No next episode - user is caught up (NULL bookmark)
    await db
      .prepare(
        `UPDATE user_shows SET current_season = NULL, current_episode = NULL, updated_at = datetime('now')
         WHERE user_id = ? AND show_id = ?`,
      )
      .bind(userId, showId)
      .run();
  }
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
