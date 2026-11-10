CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial_no INTEGER,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'affiliate' CHECK(type IN ('affiliate','digital')),
  category TEXT,
  season TEXT,
  video_number INTEGER,
  video_title TEXT,
  image_url TEXT,
  price_text TEXT,
  purchase_url TEXT,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_serial ON products(serial_no);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_season ON products(season);
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  season TEXT,
  publish_date TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('published','upcoming')),
  video_url TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','upcoming','archived')),
  image_url TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS upcoming (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'video' CHECK(type IN ('video','season','category','collection')),
  season TEXT,
  expected_date TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'coming_soon' CHECK(status IN ('coming_soon','in_progress')),
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Starter seasonal collections; edit or archive these from the admin dashboard.
INSERT OR IGNORE INTO seasons (name, slug, start_date, end_date, status, description)
VALUES
('Christmas 2026', 'christmas-2026', '2026-11-09', '2026-12-25', 'active', 'Gift ideas, festive finds and thoughtful discoveries for Christmas 2026.'),
('New Year 2027', 'new-year-2027', '2026-12-26', '2027-01-01', 'upcoming', 'Fresh-start finds, planners and celebration picks for welcoming 2027.');
