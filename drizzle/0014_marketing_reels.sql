CREATE TABLE IF NOT EXISTS marketing_reels (
 id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
 description TEXT NOT NULL, caption TEXT NOT NULL, script TEXT NOT NULL,
 scheduled_at INTEGER NOT NULL, created INTEGER NOT NULL, started_at INTEGER,
 status TEXT NOT NULL DEFAULT 'queued', video_id TEXT, duration REAL,
 published INTEGER NOT NULL DEFAULT 0, published_at INTEGER,
 instagram_container TEXT, instagram_id TEXT, instagram_url TEXT,
 instagram_status TEXT NOT NULL DEFAULT 'pending',
 lease TEXT, lease_until INTEGER NOT NULL DEFAULT 0,
 error TEXT, updated INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS marketing_due ON marketing_reels(status,scheduled_at);
