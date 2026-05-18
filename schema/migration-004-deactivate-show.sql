ALTER TABLE user_shows RENAME TO user_shows_archive;

CREATE TABLE IF NOT EXISTS user_shows (
    user_id INTEGER NOT NULL,
    show_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('watchlist', 'deactivated')) DEFAULT 'watchlist',
    current_season INTEGER,
    current_episode INTEGER,
    rating INTEGER,
    added_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, show_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
);

INSERT INTO user_shows (user_id, show_id, status, current_season, current_episode, rating, added_at, updated_at)
SELECT user_id, show_id, status, current_season, current_episode, rating, added_at, updated_at
FROM user_shows_archive;
