CREATE TABLE IF NOT EXISTS staples (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_staples_household ON staples(household_id);

CREATE TABLE IF NOT EXISTS menus (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_menus_household ON menus(household_id);

CREATE TABLE IF NOT EXISTS menu_entries (
  id TEXT PRIMARY KEY,
  menu_id TEXT NOT NULL REFERENCES menus(id),
  dow INTEGER NOT NULL,          -- 0 = Monday
  meal TEXT NOT NULL,
  recipe_id TEXT REFERENCES recipes(id),
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_menu_entries_menu ON menu_entries(menu_id);
