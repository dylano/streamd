interface Env {
  DB: D1Database;
}

async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS shows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tmdb_id INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        poster_path TEXT,
        overview TEXT,
        first_air_date TEXT,
        status TEXT CHECK(status IN ('watching', 'watchlist', 'completed', 'dropped')) DEFAULT 'watchlist',
        streaming_service TEXT,
        total_seasons INTEGER DEFAULT 0,
        total_episodes INTEGER DEFAULT 0,
        current_season INTEGER,
        current_episode INTEGER,
        added_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS episodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        show_id INTEGER NOT NULL,
        tmdb_id INTEGER,
        season_number INTEGER NOT NULL,
        episode_number INTEGER NOT NULL,
        name TEXT,
        air_date TEXT,
        runtime INTEGER,
        watched INTEGER DEFAULT 0,
        watched_at TEXT,
        FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
        UNIQUE(show_id, season_number, episode_number)
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tmdb_cache (
        cache_key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )
    `),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_shows_status ON shows(status)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_episodes_show_id ON episodes(show_id)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_episodes_air_date ON episodes(air_date)`),
  ]);
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await ensureSchema(context.env.DB);

    const result = await context.env.DB.prepare("SELECT COUNT(*) as count FROM shows").first<{
      count: number;
    }>();

    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        showCount: result?.count ?? 0,
      },
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    );
  }
};
