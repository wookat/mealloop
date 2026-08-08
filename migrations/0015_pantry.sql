CREATE TABLE IF NOT EXISTS pantry_items (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  label TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'stocked', -- stocked | low | out
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pantry_household ON pantry_items(household_id);
