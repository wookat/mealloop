-- Anonymous family reactions (👍/👎) on planned meals, voted from the share link.
CREATE TABLE IF NOT EXISTS plan_reactions (
  id TEXT PRIMARY KEY,
  plan_entry_id TEXT NOT NULL REFERENCES plan_entries(id),
  voter TEXT NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('up','down')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(plan_entry_id, voter)
);
CREATE INDEX IF NOT EXISTS idx_plan_reactions_entry ON plan_reactions(plan_entry_id);
