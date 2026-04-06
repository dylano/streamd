-- StreamD Database Schema

CREATE TABLE IF NOT EXISTS shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    poster_path TEXT,
    status TEXT CHECK(status IN ('watching', 'watchlist', 'completed', 'dropped')) DEFAULT 'watchlist',
    added_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_shows_status ON shows(status);
