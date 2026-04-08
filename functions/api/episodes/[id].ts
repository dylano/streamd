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
  watched: number;
  watched_at: string | null;
}

// Helper to recompute bookmark after watch state changes
async function recomputeBookmark(db: D1Database, showId: number) {
  // Find the highest watched episode
  const highestWatched = await db
    .prepare(
      `SELECT season_number, episode_number FROM episodes
       WHERE show_id = ? AND watched = 1
       ORDER BY season_number DESC, episode_number DESC
       LIMIT 1`,
    )
    .bind(showId)
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
          `UPDATE shows SET current_season = ?, current_episode = ?, updated_at = datetime('now') WHERE id = ?`,
        )
        .bind(firstEp.season_number, firstEp.episode_number, showId)
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
        `UPDATE shows SET current_season = ?, current_episode = ?, updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(nextEp.season_number, nextEp.episode_number, showId)
      .run();
  } else {
    // No next episode - user is caught up (NULL bookmark)
    await db
      .prepare(
        `UPDATE shows SET current_season = NULL, current_episode = NULL, updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(showId)
      .run();
  }
}

// PUT /api/episodes/:id - Mark episode watched/unwatched
export const onRequestPut: PagesFunction<Env, "id"> = async (context) => {
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

  await context.env.DB.prepare("UPDATE episodes SET watched = ?, watched_at = ? WHERE id = ?")
    .bind(watchedValue, watchedAt, id)
    .run();

  // When marking as watched, also mark all earlier episodes in the same season
  if (body.watched) {
    await context.env.DB.prepare(
      `UPDATE episodes SET watched = 1, watched_at = COALESCE(watched_at, ?)
       WHERE show_id = ? AND season_number = ? AND episode_number < ? AND watched = 0`,
    )
      .bind(watchedAt, episode.show_id, episode.season_number, episode.episode_number)
      .run();
  }

  // Recompute bookmark
  await recomputeBookmark(context.env.DB, episode.show_id);

  const updated = await context.env.DB.prepare("SELECT * FROM episodes WHERE id = ?")
    .bind(id)
    .first<Episode>();

  return Response.json(updated);
};
