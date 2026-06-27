// Recompute a user's bookmark (current_season / current_episode) for a show.
// The bookmark points at the first episode after the highest watched one, or
// the first episode if nothing is watched, or NULL when there is no next
// episode (caught up). This must run not only when watch state changes but also
// after new episodes are synced in — otherwise a "caught up" (NULL) bookmark
// goes stale when a new episode airs. See issue #24.
export async function recomputeBookmark(db: D1Database, userId: number, showId: number) {
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
