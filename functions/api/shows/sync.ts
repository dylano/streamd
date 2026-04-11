interface Env {
  DB: D1Database;
  TMDB_API_KEY: string;
}

interface UserShow {
  id: number;
  tmdb_id: number;
  name: string;
  current_season: number | null;
}

interface TMDBEpisode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  runtime: number | null;
}

interface TMDBSeasonResponse {
  episodes: TMDBEpisode[];
}

interface TMDBShowResponse {
  number_of_seasons: number;
}

const TMDB_BASE = "https://api.themoviedb.org/3";

// POST /api/shows/sync - Sync episodes for this user's tracked shows
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const userId = (context.data as { userId: number }).userId;

  // Get only this user's shows
  const shows = await context.env.DB.prepare(
    `SELECT s.id, s.tmdb_id, s.name, us.current_season
     FROM user_shows us
     JOIN shows s ON us.show_id = s.id
     WHERE us.user_id = ?`,
  )
    .bind(userId)
    .all<UserShow>();

  const results: { show: string; synced: number; error?: string }[] = [];

  for (const show of shows.results) {
    try {
      // Get show details to find total seasons
      const showRes = await fetch(
        `${TMDB_BASE}/tv/${show.tmdb_id}?api_key=${context.env.TMDB_API_KEY}`,
      );
      if (!showRes.ok) {
        results.push({ show: show.name, synced: 0, error: "Failed to fetch show" });
        continue;
      }
      const showData = (await showRes.json()) as TMDBShowResponse;

      // Sync the current season (from bookmark) and the latest season
      const seasonsToSync = new Set<number>();
      if (show.current_season) {
        seasonsToSync.add(show.current_season);
      }
      if (showData.number_of_seasons > 0) {
        seasonsToSync.add(showData.number_of_seasons);
      }

      let totalSynced = 0;

      for (const seasonNum of seasonsToSync) {
        const seasonRes = await fetch(
          `${TMDB_BASE}/tv/${show.tmdb_id}/season/${seasonNum}?api_key=${context.env.TMDB_API_KEY}`,
        );
        if (!seasonRes.ok) continue;

        const seasonData = (await seasonRes.json()) as TMDBSeasonResponse;

        for (const ep of seasonData.episodes) {
          await context.env.DB.prepare(
            `INSERT INTO episodes (show_id, tmdb_id, season_number, episode_number, name, air_date, runtime)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT (show_id, season_number, episode_number)
             DO UPDATE SET name = excluded.name, air_date = excluded.air_date, runtime = excluded.runtime`,
          )
            .bind(
              show.id,
              ep.id,
              ep.season_number,
              ep.episode_number,
              ep.name,
              ep.air_date,
              ep.runtime,
            )
            .run();
          totalSynced++;
        }
      }

      results.push({ show: show.name, synced: totalSynced });
    } catch (err) {
      results.push({ show: show.name, synced: 0, error: String(err) });
    }
  }

  return Response.json({ synced: results });
};
