-- Aggregate external referrer hosts (host only, no paths or query strings).
CREATE TABLE IF NOT EXISTS referrers_daily (
  day TEXT NOT NULL,
  host TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, host)
);
