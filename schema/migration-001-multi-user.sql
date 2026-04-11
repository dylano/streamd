-- Migration 001: Multi-user support
-- Migrates existing single-user data to a "dylan" user account

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 2. Create join tables
CREATE TABLE IF NOT EXISTS user_shows (
    user_id INTEGER NOT NULL,
    show_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('watching', 'watchlist', 'completed', 'dropped')) DEFAULT 'watchlist',
    current_season INTEGER,
    current_episode INTEGER,
    added_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, show_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_episodes (
    user_id INTEGER NOT NULL,
    episode_id INTEGER NOT NULL,
    watched INTEGER DEFAULT 0,
    watched_at TEXT,
    PRIMARY KEY (user_id, episode_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
);

-- 3. Create the "dylan" user and migrate existing data
INSERT INTO users (name) VALUES ('dylan');

INSERT INTO user_shows (user_id, show_id, status, current_season, current_episode, added_at, updated_at)
    SELECT 1, id, status, current_season, current_episode, added_at, updated_at FROM shows;

INSERT INTO user_episodes (user_id, episode_id, watched, watched_at)
    SELECT 1, id, watched, watched_at FROM episodes WHERE watched = 1;

-- 4. Recreate shows without per-user columns
CREATE TABLE shows_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    poster_path TEXT,
    overview TEXT,
    first_air_date TEXT,
    streaming_service TEXT,
    total_seasons INTEGER DEFAULT 0,
    total_episodes INTEGER DEFAULT 0,
    added_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO shows_new (id, tmdb_id, name, poster_path, overview, first_air_date, streaming_service, total_seasons, total_episodes, added_at, updated_at)
    SELECT id, tmdb_id, name, poster_path, overview, first_air_date, streaming_service, total_seasons, total_episodes, added_at, updated_at FROM shows;

DROP TABLE shows;
ALTER TABLE shows_new RENAME TO shows;

-- 5. Recreate episodes without per-user columns
CREATE TABLE episodes_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    show_id INTEGER NOT NULL,
    tmdb_id INTEGER,
    season_number INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    name TEXT,
    air_date TEXT,
    runtime INTEGER,
    FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
    UNIQUE(show_id, season_number, episode_number)
);

INSERT INTO episodes_new (id, show_id, tmdb_id, season_number, episode_number, name, air_date, runtime)
    SELECT id, show_id, tmdb_id, season_number, episode_number, name, air_date, runtime FROM episodes;

DROP TABLE episodes;
ALTER TABLE episodes_new RENAME TO episodes;

-- 6. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_episodes_show_id ON episodes(show_id);
CREATE INDEX IF NOT EXISTS idx_episodes_air_date ON episodes(air_date);
CREATE INDEX IF NOT EXISTS idx_user_shows_user ON user_shows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_episodes_user ON user_episodes(user_id);
