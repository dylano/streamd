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
        status TEXT CHECK(status IN ('watching', 'watchlist', 'completed', 'dropped')) DEFAULT 'watchlist',
        added_at TEXT DEFAULT (datetime('now'))
      )
    `),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_shows_status ON shows(status)`),
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
