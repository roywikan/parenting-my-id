-- Schema Cloudflare D1 Database (SQLite) - Complete & Merged Version (SSOT)
-- Single Source of Truth for all Cloudflare D1 tables, columns, indexes, and initial seeds

CREATE TABLE IF NOT EXISTS _cf_KV (
  key TEXT PRIMARY KEY,
  value BLOB
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS autolinks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  url TEXT,
  description TEXT,
  click_count INTEGER DEFAULT 0,
  rel TEXT DEFAULT 'dofollow',
  target TEXT DEFAULT '_self',
  max_replacements INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configs (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  post_id INTEGER DEFAULT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_avatar TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'approved',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  parent_id INTEGER DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS site_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  config_json TEXT NOT NULL,
  hero_affiliate_widget_enable INTEGER DEFAULT 0,
  hero_affiliate_widget_position TEXT DEFAULT 'right',
  hero_affiliate_widget_code TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hero_affiliate_widgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT DEFAULT 'Hero Affiliate Widget Slot',
  provider TEXT DEFAULT 'custom',
  snippet_code TEXT NOT NULL,
  position TEXT DEFAULT 'right' CHECK(position IN ('right', 'bottom')),
  is_enabled INTEGER DEFAULT 0,
  target_pages TEXT DEFAULT 'home',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content_markdown TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  cover_image TEXT,
  category TEXT,
  read_time_minutes INTEGER DEFAULT 5,
  author_id INTEGER,
  author_name TEXT,
  author_avatar TEXT,
  co_author_ids TEXT,
  revisions TEXT,
  status TEXT DEFAULT 'draft',
  rejection_reason TEXT,
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT,
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  post_type TEXT DEFAULT 'article',
  interactive_configurator TEXT,
  interactive_showcase TEXT,
  interactive_radar TEXT,
  interactive_quiz TEXT,
  interactive_timeline_slider TEXT,
  interactive_battle_card TEXT,
  interactive_quiz_router TEXT,
  interactive_habit_simulator TEXT,
  interactive_qa_column TEXT,
  interactive_event_listing TEXT,
  interactive_glossary_dictionary TEXT,
  disclaimer_type TEXT DEFAULT 'none',
  custom_disclaimer_text TEXT
);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY,
  attempts INTEGER DEFAULT 0,
  last_attempt INTEGER,
  blocked_until INTEGER
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT,
  "password_hash" TEXT NOT NULL,
  "name" TEXT,
  "role" TEXT DEFAULT 'writer' CHECK(role IN ('admin', 'writer', 'editor', 'guest')),
  "avatar" TEXT,
  "avatar_url" TEXT,
  "bio" TEXT,
  "title" TEXT,
  "social_instagram" TEXT,
  "social_linkedin" TEXT,
  "social_website" TEXT,
  "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  image_url TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  qris_image_url TEXT,
  status TEXT DEFAULT 'available',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  bank_info TEXT,
  payment_mode TEXT DEFAULT 'all',
  third_party_checkout_url TEXT
);

CREATE TABLE IF NOT EXISTS chat_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT,
  customer_phone TEXT,
  department TEXT NOT NULL,
  assigned_operator_phone TEXT,
  initial_message TEXT,
  page_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_name TEXT,
  buyer_phone TEXT,
  buyer_notes TEXT,
  product_id INTEGER,
  product_title TEXT,
  product_slug TEXT,
  product_price REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS surat_pembaca (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  kota TEXT NOT NULL,
  pekerjaan TEXT NOT NULL,
  tahun_lahir INTEGER NOT NULL,
  phone TEXT NOT NULL,
  ip_address TEXT,
  judul TEXT NOT NULL,
  isi_surat TEXT NOT NULL,
  kategori TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iklan_baris (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  kota TEXT NOT NULL,
  pekerjaan TEXT NOT NULL,
  tahun_lahir INTEGER NOT NULL,
  phone TEXT NOT NULL,
  ip_address TEXT,
  kategori TEXT NOT NULL,
  keterangan_barang TEXT NOT NULL,
  harga TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'published' | 'rejected' | 'expired'
  rejection_reason TEXT,
  expires_at TEXT,
  image_url TEXT,
  is_admin_ad INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Indexes (Performance & Uniqueness)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_autolinks_keyword ON autolinks(keyword);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments(post_slug);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_surat_pembaca_status ON surat_pembaca(status);
CREATE INDEX IF NOT EXISTS idx_iklan_baris_status ON iklan_baris(status);
CREATE INDEX IF NOT EXISTS idx_iklan_baris_kategori ON iklan_baris(kategori);
CREATE INDEX IF NOT EXISTS idx_hero_affiliate_is_enabled ON hero_affiliate_widgets(is_enabled);
CREATE INDEX IF NOT EXISTS idx_hero_affiliate_position ON hero_affiliate_widgets(position);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- Default Initial Seeds (Clean Install Seed)
-- ============================================================
INSERT OR IGNORE INTO users (id, email, password, password_hash, name, role, title, created_at)
VALUES 
  (1, 'admin@domain.com', 'admin123', 'admin123', 'Admin', 'admin', 'Administrator Utama', datetime('now')),
  (2, 'editor@domain.com', 'editor123', 'editor123', 'Editor', 'editor', 'Senior Editor', datetime('now')),
  (3, 'penulis@domain.com', 'writer123', 'writer123', 'Penulis', 'writer', 'Content Writer', datetime('now'));

INSERT OR IGNORE INTO configs (key, value)
VALUES 
  ('turnstile_site_key', '0x4AAAAAAE8nGvnUYOz8qCjM'),
  ('enable_turnstile_fallback', 'true'),
  ('d1_bootstrap_version', '2026.09.20'),
  ('hero_affiliate_widget_enable', 'false'),
  ('hero_affiliate_widget_position', 'right'),
  ('hero_affiliate_widget_code', '<!-- Contoh Widget Affiliate Travelpayouts / Booking.com / GetYourGuide / Wego / Trip.com -->
<div id="tp-hero-search" style="text-align: center; padding: 10px; color: #fff;">
  <p style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">✈️ Cari & Bandingkan Tiket Pesawat & Hotel</p>
  <!-- Tempelkan kode script asinkron dari dashboard affiliate Anda di sini -->
</div>');

INSERT OR IGNORE INTO hero_affiliate_widgets (id, title, provider, snippet_code, position, is_enabled)
VALUES (
  1,
  'Hero Affiliate Banner Slot',
  'generic',
  '<!-- Contoh Widget Affiliate Travelpayouts / Booking.com / GetYourGuide / Wego / Trip.com -->
<div id="tp-hero-search" style="text-align: center; padding: 10px; color: #fff;">
  <p style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">✈️ Cari & Bandingkan Tiket Pesawat & Hotel</p>
  <!-- Tempelkan kode script asinkron dari dashboard affiliate Anda di sini -->
</div>',
  'right',
  0
);

-- ============================================================
-- Migration DDL Reference for Existing D1 Databases
-- (Executed automatically by auto-bootstrap engine)
-- ============================================================
-- ALTER TABLE site_config ADD COLUMN hero_affiliate_widget_enable INTEGER DEFAULT 0;
-- ALTER TABLE site_config ADD COLUMN hero_affiliate_widget_position TEXT DEFAULT 'right';
-- ALTER TABLE site_config ADD COLUMN hero_affiliate_widget_code TEXT;
-- ALTER TABLE hero_affiliate_widgets ADD COLUMN position TEXT DEFAULT 'right';
-- ALTER TABLE hero_affiliate_widgets ADD COLUMN is_enabled INTEGER DEFAULT 0;
-- ALTER TABLE hero_affiliate_widgets ADD COLUMN snippet_code TEXT;
-- ALTER TABLE users ADD COLUMN password TEXT;
-- ALTER TABLE users ADD COLUMN password_hash TEXT;
-- ALTER TABLE users ADD COLUMN avatar_url TEXT;
-- ALTER TABLE users ADD COLUMN updated_at TEXT;
-- ALTER TABLE posts ADD COLUMN content TEXT;
-- ALTER TABLE posts ADD COLUMN cover_image TEXT;
-- ALTER TABLE posts ADD COLUMN author_name TEXT;
-- ALTER TABLE posts ADD COLUMN author_avatar TEXT;
-- ALTER TABLE posts ADD COLUMN revisions TEXT;
-- ALTER TABLE posts ADD COLUMN post_type TEXT DEFAULT 'article';
-- ALTER TABLE posts ADD COLUMN interactive_configurator TEXT;
-- ALTER TABLE posts ADD COLUMN interactive_showcase TEXT;
-- ALTER TABLE posts ADD COLUMN interactive_radar TEXT;
-- ALTER TABLE posts ADD COLUMN interactive_quiz TEXT;
-- ALTER TABLE posts ADD COLUMN interactive_timeline_slider TEXT;
-- ALTER TABLE posts ADD COLUMN interactive_battle_card TEXT;
-- ALTER TABLE posts ADD COLUMN interactive_quiz_router TEXT;
-- ALTER TABLE posts ADD COLUMN interactive_habit_simulator TEXT;
-- ALTER TABLE posts ADD COLUMN interactive_qa_column TEXT;
-- ALTER TABLE posts ADD COLUMN interactive_event_listing TEXT;
-- ALTER TABLE posts ADD COLUMN interactive_glossary_dictionary TEXT;
-- ALTER TABLE posts ADD COLUMN disclaimer_type TEXT DEFAULT 'none';
-- ALTER TABLE posts ADD COLUMN custom_disclaimer_text TEXT;
-- ALTER TABLE products ADD COLUMN bank_info TEXT;
-- ALTER TABLE products ADD COLUMN payment_mode TEXT DEFAULT 'all';
-- ALTER TABLE products ADD COLUMN third_party_checkout_url TEXT;
-- ALTER TABLE iklan_baris ADD COLUMN expires_at TEXT;
-- ALTER TABLE iklan_baris ADD COLUMN image_url TEXT;
-- ALTER TABLE iklan_baris ADD COLUMN is_admin_ad INTEGER DEFAULT 0;
-- ALTER TABLE comments ADD COLUMN post_id INTEGER DEFAULT NULL;
-- ALTER TABLE autolinks ADD COLUMN url TEXT;
-- ALTER TABLE autolinks ADD COLUMN rel TEXT DEFAULT 'dofollow';
-- ALTER TABLE autolinks ADD COLUMN target TEXT DEFAULT '_self';
-- ALTER TABLE autolinks ADD COLUMN max_replacements INTEGER DEFAULT 1;


