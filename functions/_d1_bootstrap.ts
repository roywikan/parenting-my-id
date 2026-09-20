// =========================================================================
// Cloudflare D1 Database Auto-Bootstrap & Self-Healing Migration Engine
// =========================================================================
// Single Source of Truth (SSOT) Alignment with schema.sql
// Automatically verifies, creates, and repairs tables, columns, indexes,
// and default seeds on incoming requests or explicit API triggers.

export interface BootstrapReport {
  success: boolean;
  alreadyBootstrapped?: boolean;
  timestamp: string;
  durationMs: number;
  tablesChecked: string[];
  tablesCreated: string[];
  columnsAdded: { table: string; column: string }[];
  indexesCreated: string[];
  seedsApplied: string[];
  warnings?: string[];
  message: string;
}

// Global state in Worker isolate memory to eliminate redundant D1 calls
let isBootstrapped = false;
let activeBootstrapPromise: Promise<BootstrapReport> | null = null;
let lastReport: BootstrapReport | null = null;

// =========================================================================
// Table Specifications (Derived directly from schema.sql)
// =========================================================================
interface TableSpec {
  name: string;
  createSql: string;
  requiredColumns: { name: string; definition: string }[];
}

const TABLE_SPECS: TableSpec[] = [
  {
    name: '_cf_KV',
    createSql: `CREATE TABLE IF NOT EXISTS _cf_KV (
      key TEXT PRIMARY KEY,
      value BLOB
    ) WITHOUT ROWID;`,
    requiredColumns: [
      { name: 'key', definition: 'TEXT PRIMARY KEY' },
      { name: 'value', definition: 'BLOB' }
    ]
  },
  {
    name: 'autolinks',
    createSql: `CREATE TABLE IF NOT EXISTS autolinks (
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
    );`,
    requiredColumns: [
      { name: 'id', definition: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
      { name: 'keyword', definition: 'TEXT UNIQUE NOT NULL' },
      { name: 'target_url', definition: 'TEXT NOT NULL' },
      { name: 'url', definition: 'TEXT' },
      { name: 'description', definition: 'TEXT' },
      { name: 'click_count', definition: 'INTEGER DEFAULT 0' },
      { name: 'rel', definition: "TEXT DEFAULT 'dofollow'" },
      { name: 'target', definition: "TEXT DEFAULT '_self'" },
      { name: 'max_replacements', definition: 'INTEGER DEFAULT 1' },
      { name: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
    ]
  },
  {
    name: 'categories',
    createSql: `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    requiredColumns: [
      { name: 'id', definition: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
      { name: 'name', definition: 'TEXT NOT NULL' },
      { name: 'slug', definition: 'TEXT UNIQUE NOT NULL' },
      { name: 'description', definition: 'TEXT' },
      { name: 'icon', definition: 'TEXT' },
      { name: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
    ]
  },
  {
    name: 'configs',
    createSql: `CREATE TABLE IF NOT EXISTS configs (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    requiredColumns: [
      { name: 'key', definition: 'TEXT PRIMARY KEY' },
      { name: 'value', definition: 'TEXT' },
      { name: 'updated_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
    ]
  },
  {
    name: 'comments',
    createSql: `CREATE TABLE IF NOT EXISTS comments (
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
    );`,
    requiredColumns: [
      { name: 'id', definition: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
      { name: 'post_slug', definition: 'TEXT NOT NULL' },
      { name: 'post_id', definition: 'INTEGER DEFAULT NULL' },
      { name: 'user_name', definition: 'TEXT NOT NULL' },
      { name: 'user_email', definition: 'TEXT NOT NULL' },
      { name: 'user_avatar', definition: 'TEXT NOT NULL' },
      { name: 'content', definition: 'TEXT NOT NULL' },
      { name: 'status', definition: "TEXT DEFAULT 'approved'" },
      { name: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
      { name: 'parent_id', definition: 'INTEGER DEFAULT NULL' }
    ]
  },
  {
    name: 'site_config',
    createSql: `CREATE TABLE IF NOT EXISTS site_config (
      id INTEGER PRIMARY KEY DEFAULT 1,
      config_json TEXT NOT NULL,
      hero_affiliate_widget_enable INTEGER DEFAULT 0,
      hero_affiliate_widget_position TEXT DEFAULT 'right',
      hero_affiliate_widget_code TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    requiredColumns: [
      { name: 'id', definition: 'INTEGER PRIMARY KEY DEFAULT 1' },
      { name: 'config_json', definition: 'TEXT NOT NULL' },
      { name: 'hero_affiliate_widget_enable', definition: 'INTEGER DEFAULT 0' },
      { name: 'hero_affiliate_widget_position', definition: "TEXT DEFAULT 'right'" },
      { name: 'hero_affiliate_widget_code', definition: 'TEXT' },
      { name: 'updated_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
    ]
  },
  {
    name: 'posts',
    createSql: `CREATE TABLE IF NOT EXISTS posts (
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
    );`,
    requiredColumns: [
      { name: 'id', definition: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
      { name: 'title', definition: 'TEXT NOT NULL' },
      { name: 'slug', definition: 'TEXT UNIQUE NOT NULL' },
      { name: 'content_markdown', definition: 'TEXT NOT NULL' },
      { name: 'content', definition: 'TEXT' },
      { name: 'excerpt', definition: 'TEXT' },
      { name: 'featured_image', definition: 'TEXT' },
      { name: 'cover_image', definition: 'TEXT' },
      { name: 'category', definition: 'TEXT' },
      { name: 'read_time_minutes', definition: 'INTEGER DEFAULT 5' },
      { name: 'author_id', definition: 'INTEGER' },
      { name: 'author_name', definition: 'TEXT' },
      { name: 'author_avatar', definition: 'TEXT' },
      { name: 'co_author_ids', definition: 'TEXT' },
      { name: 'revisions', definition: 'TEXT' },
      { name: 'status', definition: "TEXT DEFAULT 'draft'" },
      { name: 'rejection_reason', definition: 'TEXT' },
      { name: 'meta_title', definition: 'TEXT' },
      { name: 'meta_description', definition: 'TEXT' },
      { name: 'tags', definition: 'TEXT' },
      { name: 'views', definition: 'INTEGER DEFAULT 0' },
      { name: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
      { name: 'post_type', definition: "TEXT DEFAULT 'article'" },
      { name: 'interactive_configurator', definition: 'TEXT' },
      { name: 'interactive_showcase', definition: 'TEXT' },
      { name: 'interactive_radar', definition: 'TEXT' },
      { name: 'interactive_quiz', definition: 'TEXT' },
      { name: 'interactive_timeline_slider', definition: 'TEXT' },
      { name: 'interactive_battle_card', definition: 'TEXT' },
      { name: 'interactive_quiz_router', definition: 'TEXT' },
      { name: 'interactive_habit_simulator', definition: 'TEXT' },
      { name: 'interactive_qa_column', definition: 'TEXT' },
      { name: 'interactive_event_listing', definition: 'TEXT' },
      { name: 'interactive_glossary_dictionary', definition: 'TEXT' },
      { name: 'disclaimer_type', definition: "TEXT DEFAULT 'none'" },
      { name: 'custom_disclaimer_text', definition: 'TEXT' }
    ]
  },
  {
    name: 'login_attempts',
    createSql: `CREATE TABLE IF NOT EXISTS login_attempts (
      ip TEXT PRIMARY KEY,
      attempts INTEGER DEFAULT 0,
      last_attempt INTEGER,
      blocked_until INTEGER
    );`,
    requiredColumns: [
      { name: 'ip', definition: 'TEXT PRIMARY KEY' },
      { name: 'attempts', definition: 'INTEGER DEFAULT 0' },
      { name: 'last_attempt', definition: 'INTEGER' },
      { name: 'blocked_until', definition: 'INTEGER' }
    ]
  },
  {
    name: 'users',
    createSql: `CREATE TABLE IF NOT EXISTS "users" (
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
    );`,
    requiredColumns: [
      { name: 'id', definition: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
      { name: 'email', definition: 'TEXT UNIQUE NOT NULL' },
      { name: 'password', definition: 'TEXT' },
      { name: 'password_hash', definition: 'TEXT NOT NULL' },
      { name: 'name', definition: 'TEXT' },
      { name: 'role', definition: "TEXT DEFAULT 'writer'" },
      { name: 'avatar', definition: 'TEXT' },
      { name: 'avatar_url', definition: 'TEXT' },
      { name: 'bio', definition: 'TEXT' },
      { name: 'title', definition: 'TEXT' },
      { name: 'social_instagram', definition: 'TEXT' },
      { name: 'social_linkedin', definition: 'TEXT' },
      { name: 'social_website', definition: 'TEXT' },
      { name: 'created_at', definition: 'TEXT DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', definition: 'TEXT DEFAULT CURRENT_TIMESTAMP' }
    ]
  },
  {
    name: 'products',
    createSql: `CREATE TABLE IF NOT EXISTS products (
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
    );`,
    requiredColumns: [
      { name: 'id', definition: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
      { name: 'title', definition: 'TEXT NOT NULL' },
      { name: 'slug', definition: 'TEXT UNIQUE NOT NULL' },
      { name: 'description', definition: 'TEXT NOT NULL' },
      { name: 'price', definition: 'REAL NOT NULL' },
      { name: 'image_url', definition: 'TEXT NOT NULL' },
      { name: 'whatsapp_number', definition: 'TEXT NOT NULL' },
      { name: 'qris_image_url', definition: 'TEXT' },
      { name: 'status', definition: "TEXT DEFAULT 'available'" },
      { name: 'created_at', definition: 'TEXT DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', definition: 'TEXT DEFAULT CURRENT_TIMESTAMP' },
      { name: 'bank_info', definition: 'TEXT' },
      { name: 'payment_mode', definition: "TEXT DEFAULT 'all'" },
      { name: 'third_party_checkout_url', definition: 'TEXT' }
    ]
  },
  {
    name: 'chat_leads',
    createSql: `CREATE TABLE IF NOT EXISTS chat_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      customer_phone TEXT,
      department TEXT NOT NULL,
      assigned_operator_phone TEXT,
      initial_message TEXT,
      page_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    requiredColumns: [
      { name: 'id', definition: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
      { name: 'customer_name', definition: 'TEXT' },
      { name: 'customer_phone', definition: 'TEXT' },
      { name: 'department', definition: 'TEXT NOT NULL' },
      { name: 'assigned_operator_phone', definition: 'TEXT' },
      { name: 'initial_message', definition: 'TEXT' },
      { name: 'page_url', definition: 'TEXT' },
      { name: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
    ]
  },
  {
    name: 'product_orders',
    createSql: `CREATE TABLE IF NOT EXISTS product_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_name TEXT,
      buyer_phone TEXT,
      buyer_notes TEXT,
      product_id INTEGER,
      product_title TEXT,
      product_slug TEXT,
      product_price REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    requiredColumns: [
      { name: 'id', definition: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
      { name: 'buyer_name', definition: 'TEXT' },
      { name: 'buyer_phone', definition: 'TEXT' },
      { name: 'buyer_notes', definition: 'TEXT' },
      { name: 'product_id', definition: 'INTEGER' },
      { name: 'product_title', definition: 'TEXT' },
      { name: 'product_slug', definition: 'TEXT' },
      { name: 'product_price', definition: 'REAL' },
      { name: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
    ]
  },
  {
    name: 'surat_pembaca',
    createSql: `CREATE TABLE IF NOT EXISTS surat_pembaca (
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
    );`,
    requiredColumns: [
      { name: 'id', definition: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
      { name: 'nama', definition: 'TEXT NOT NULL' },
      { name: 'kota', definition: 'TEXT NOT NULL' },
      { name: 'pekerjaan', definition: 'TEXT NOT NULL' },
      { name: 'tahun_lahir', definition: 'INTEGER NOT NULL' },
      { name: 'phone', definition: 'TEXT NOT NULL' },
      { name: 'ip_address', definition: 'TEXT' },
      { name: 'judul', definition: 'TEXT NOT NULL' },
      { name: 'isi_surat', definition: 'TEXT NOT NULL' },
      { name: 'kategori', definition: 'TEXT NOT NULL' },
      { name: 'status', definition: "TEXT DEFAULT 'pending'" },
      { name: 'rejection_reason', definition: 'TEXT' },
      { name: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
    ]
  },
  {
    name: 'iklan_baris',
    createSql: `CREATE TABLE IF NOT EXISTS iklan_baris (
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
      status TEXT DEFAULT 'pending',
      rejection_reason TEXT,
      expires_at TEXT,
      image_url TEXT,
      is_admin_ad INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    requiredColumns: [
      { name: 'id', definition: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
      { name: 'nama', definition: 'TEXT NOT NULL' },
      { name: 'kota', definition: 'TEXT NOT NULL' },
      { name: 'pekerjaan', definition: 'TEXT NOT NULL' },
      { name: 'tahun_lahir', definition: 'INTEGER NOT NULL' },
      { name: 'phone', definition: 'TEXT NOT NULL' },
      { name: 'ip_address', definition: 'TEXT' },
      { name: 'kategori', definition: 'TEXT NOT NULL' },
      { name: 'keterangan_barang', definition: 'TEXT NOT NULL' },
      { name: 'harga', definition: 'TEXT NOT NULL' },
      { name: 'status', definition: "TEXT DEFAULT 'pending'" },
      { name: 'rejection_reason', definition: 'TEXT' },
      { name: 'expires_at', definition: 'TEXT' },
      { name: 'image_url', definition: 'TEXT' },
      { name: 'is_admin_ad', definition: 'INTEGER DEFAULT 0' },
      { name: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
    ]
  },
  {
    name: 'hero_affiliate_widgets',
    createSql: `CREATE TABLE IF NOT EXISTS hero_affiliate_widgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT DEFAULT 'Hero Affiliate Widget Slot',
      provider TEXT DEFAULT 'custom',
      snippet_code TEXT NOT NULL,
      position TEXT DEFAULT 'right' CHECK(position IN ('right', 'bottom')),
      is_enabled INTEGER DEFAULT 0,
      target_pages TEXT DEFAULT 'home',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    requiredColumns: [
      { name: 'id', definition: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
      { name: 'title', definition: "TEXT DEFAULT 'Hero Affiliate Widget Slot'" },
      { name: 'provider', definition: "TEXT DEFAULT 'custom'" },
      { name: 'snippet_code', definition: 'TEXT NOT NULL' },
      { name: 'position', definition: "TEXT DEFAULT 'right'" },
      { name: 'is_enabled', definition: 'INTEGER DEFAULT 0' },
      { name: 'target_pages', definition: "TEXT DEFAULT 'home'" },
      { name: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
    ]
  }
];

const INDEX_SPECS = [
  'CREATE INDEX IF NOT EXISTS idx_autolinks_keyword ON autolinks(keyword);',
  'CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);',
  'CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments(post_slug);',
  'CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);',
  'CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);',
  'CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);',
  'CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);',
  'CREATE INDEX IF NOT EXISTS idx_surat_pembaca_status ON surat_pembaca(status);',
  'CREATE INDEX IF NOT EXISTS idx_iklan_baris_status ON iklan_baris(status);',
  'CREATE INDEX IF NOT EXISTS idx_iklan_baris_kategori ON iklan_baris(kategori);',
  'CREATE INDEX IF NOT EXISTS idx_hero_affiliate_is_enabled ON hero_affiliate_widgets(is_enabled);',
  'CREATE INDEX IF NOT EXISTS idx_hero_affiliate_position ON hero_affiliate_widgets(position);',
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);'
];

/**
 * Fast auto-bootstrap check: if already executed in this Worker isolate, returns immediately.
 * Otherwise triggers bootstrapD1Database safely.
 */
export async function ensureD1Bootstrap(db: any): Promise<BootstrapReport> {
  if (!db) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      durationMs: 0,
      tablesChecked: [],
      tablesCreated: [],
      columnsAdded: [],
      indexesCreated: [],
      seedsApplied: [],
      message: 'Cloudflare D1 database binding tidak tersedia pada environment.'
    };
  }

  if (isBootstrapped && lastReport) {
    return { ...lastReport, alreadyBootstrapped: true };
  }

  if (activeBootstrapPromise) {
    return activeBootstrapPromise;
  }

  activeBootstrapPromise = bootstrapD1Database(db, false)
    .then((rep) => {
      isBootstrapped = true;
      lastReport = rep;
      activeBootstrapPromise = null;
      return rep;
    })
    .catch((err) => {
      activeBootstrapPromise = null;
      throw err;
    });

  return activeBootstrapPromise;
}

/**
 * Runs full schema verification and auto-migration against Cloudflare D1.
 * - Creates missing tables
 * - Checks PRAGMA table_info for every table and adds any missing columns
 * - Creates missing indexes
 * - Injects initial default seeds (users & configs) if absent
 */
export async function bootstrapD1Database(db: any, force = false): Promise<BootstrapReport> {
  const startTime = Date.now();
  const tablesChecked: string[] = [];
  const tablesCreated: string[] = [];
  const columnsAdded: { table: string; column: string }[] = [];
  const indexesCreated: string[] = [];
  const seedsApplied: string[] = [];
  const warnings: string[] = [];

  if (!db) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      durationMs: 0,
      tablesChecked,
      tablesCreated,
      columnsAdded,
      indexesCreated,
      seedsApplied,
      message: 'Cloudflare D1 database binding tidak ditemukan.'
    };
  }

  try {
    // 1. Check existing tables in sqlite_master
    let existingTableSet = new Set<string>();
    try {
      const { results } = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
      if (results && Array.isArray(results)) {
        for (const row of results) {
          if (row.name) existingTableSet.add(String(row.name).toLowerCase());
        }
      }
    } catch (eMaster: any) {
      warnings.push(`Warning querying sqlite_master: ${eMaster.message}`);
    }

    // 2. Iterate through all table specs
    for (const spec of TABLE_SPECS) {
      tablesChecked.push(spec.name);
      const isNew = !existingTableSet.has(spec.name.toLowerCase());

      if (isNew) {
        try {
          await db.prepare(spec.createSql).run();
          tablesCreated.push(spec.name);
          existingTableSet.add(spec.name.toLowerCase());
        } catch (eCreate: any) {
          warnings.push(`Gagal membuat tabel ${spec.name}: ${eCreate.message}`);
        }
      }

      // 3. Inspect columns with PRAGMA table_info
      try {
        const colInfo = await db.prepare(`PRAGMA table_info("${spec.name}")`).all();
        const existingCols = new Set<string>(
          (colInfo?.results || []).map((c: any) => String(c.name).toLowerCase())
        );

        for (const col of spec.requiredColumns) {
          const colNameLower = col.name.toLowerCase();
          if (!existingCols.has(colNameLower)) {
            try {
              await db.prepare(`ALTER TABLE "${spec.name}" ADD COLUMN ${col.name} ${col.definition.replace(/PRIMARY\s+KEY|AUTOINCREMENT|UNIQUE/gi, '')}`).run();
              columnsAdded.push({ table: spec.name, column: col.name });
              existingCols.add(colNameLower);
            } catch (eAlter: any) {
              // Ignore if already added concurrently or duplicate column error
              if (!String(eAlter.message).includes('duplicate column')) {
                warnings.push(`Warning ALTER TABLE ${spec.name} ADD ${col.name}: ${eAlter.message}`);
              }
            }
          }
        }
      } catch (ePragma: any) {
        warnings.push(`Warning PRAGMA table_info(${spec.name}): ${ePragma.message}`);
      }
    }

    // 4. Create all indexes
    for (const indexSql of INDEX_SPECS) {
      try {
        await db.prepare(indexSql).run();
        const match = indexSql.match(/INDEX IF NOT EXISTS\s+([a-zA-Z0-9_]+)/i);
        if (match && match[1]) {
          indexesCreated.push(match[1]);
        }
      } catch (eIdx: any) {
        warnings.push(`Warning creating index: ${eIdx.message}`);
      }
    }

    // 5. Check & seed default users (Niche-Agnostic admin, editor, writer)
    try {
      const userCountRow: any = await db.prepare('SELECT COUNT(*) as cnt FROM users').first();
      const userCount = Number(userCountRow?.cnt || 0);

      if (userCount === 0) {
        await db.prepare(`
          INSERT OR IGNORE INTO users (id, email, password, password_hash, name, role, title, created_at)
          VALUES 
            (1, 'admin@domain.com', 'admin123', 'admin123', 'Admin', 'admin', 'Administrator Utama', datetime('now')),
            (2, 'editor@domain.com', 'editor123', 'editor123', 'Editor', 'editor', 'Senior Editor', datetime('now')),
            (3, 'penulis@domain.com', 'writer123', 'writer123', 'Penulis', 'writer', 'Content Writer', datetime('now'))
        `).run();
        seedsApplied.push('Initial users seeded (admin, editor, writer)');
      } else {
        // Ensure Admin user exists with valid credentials
        const adminUser: any = await db.prepare("SELECT id, password, password_hash FROM users WHERE role = 'admin' OR id = 1").first();
        if (!adminUser) {
          await db.prepare(`
            INSERT OR IGNORE INTO users (id, email, password, password_hash, name, role, title, created_at)
            VALUES (1, 'admin@domain.com', 'admin123', 'admin123', 'Admin', 'admin', 'Administrator Utama', datetime('now'))
          `).run();
          seedsApplied.push('Default admin account ensured');
        } else if (!adminUser.password && !adminUser.password_hash) {
          await db.prepare("UPDATE users SET password = 'admin123', password_hash = 'admin123' WHERE id = ?").bind(adminUser.id).run();
          seedsApplied.push('Admin password auto-healed');
        }
      }
    } catch (eUsers: any) {
      warnings.push(`Warning seeding users: ${eUsers.message}`);
    }

    // 6. Check & seed default configs
    try {
      const nowIso = new Date().toISOString();
      await db.prepare(`
        INSERT OR IGNORE INTO configs (key, value, updated_at) VALUES 
          ('turnstile_site_key', '0x4AAAAAAE8nGvnUYOz8qCjM', datetime('now')),
          ('enable_turnstile_fallback', 'true', datetime('now')),
          ('d1_bootstrap_version', '2026.09.20', datetime('now')),
          ('d1_last_bootstrap_at', ?, datetime('now'))
      `).bind(nowIso).run();

      // Update last bootstrap timestamp
      await db.prepare(`
        INSERT INTO configs (key, value, updated_at) VALUES ('d1_last_bootstrap_at', ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
      `).bind(nowIso).run();

      seedsApplied.push('Default system configs and bootstrap version registered');
    } catch (eCfg: any) {
      warnings.push(`Warning seeding configs: ${eCfg.message}`);
    }

    // 7. Check & seed default Hero Affiliate Widget Slot
    try {
      const defaultSnippet = `<!-- Contoh Widget Affiliate Travelpayouts / Booking.com / GetYourGuide / Wego / Trip.com -->
<div id="tp-hero-search" style="text-align: center; padding: 10px; color: #fff;">
  <p style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">✈️ Cari & Bandingkan Tiket Pesawat & Hotel</p>
  <!-- Tempelkan kode script asinkron dari dashboard affiliate Anda di sini -->
</div>`;

      const heroWidgetCount: any = await db.prepare('SELECT COUNT(*) as cnt FROM hero_affiliate_widgets').first();
      if (Number(heroWidgetCount?.cnt || 0) === 0) {
        await db.prepare(`
          INSERT OR IGNORE INTO hero_affiliate_widgets (id, title, provider, snippet_code, position, is_enabled)
          VALUES (1, 'Hero Affiliate Banner Slot', 'generic', ?, 'right', 0)
        `).bind(defaultSnippet).run();
        seedsApplied.push('Default Hero Affiliate Widget slot seeded (snippet_code, position: right, is_enabled: 0)');
      }

      // Seed default configs for hero affiliate widget if not present
      await db.prepare(`
        INSERT OR IGNORE INTO configs (key, value, updated_at) VALUES 
          ('hero_affiliate_widget_enable', 'false', datetime('now')),
          ('hero_affiliate_widget_position', 'right', datetime('now')),
          ('hero_affiliate_widget_code', ?, datetime('now'))
      `).bind(defaultSnippet).run();
    } catch (eHeroAff: any) {
      warnings.push(`Warning seeding hero_affiliate_widgets: ${eHeroAff.message}`);
    }

    const durationMs = Date.now() - startTime;
    const report: BootstrapReport = {
      success: true,
      timestamp: new Date().toISOString(),
      durationMs,
      tablesChecked,
      tablesCreated,
      columnsAdded,
      indexesCreated,
      seedsApplied,
      warnings: warnings.length > 0 ? warnings : undefined,
      message: `Auto-bootstrap D1 berhasil dijalankan dalam ${durationMs}ms. ${tablesChecked.length} tabel diperiksa, ${tablesCreated.length} tabel dibuat baru, ${columnsAdded.length} kolom ditambahkan, ${indexesCreated.length} indeks disinkronkan.`
    };

    isBootstrapped = true;
    lastReport = report;
    return report;
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const failReport: BootstrapReport = {
      success: false,
      timestamp: new Date().toISOString(),
      durationMs,
      tablesChecked,
      tablesCreated,
      columnsAdded,
      indexesCreated,
      seedsApplied,
      warnings: [err.message, ...warnings],
      message: `Gagal menjalankan auto-bootstrap D1: ${err.message}`
    };
    lastReport = failReport;
    return failReport;
  }
}

export function getLastBootstrapReport(): BootstrapReport | null {
  return lastReport;
}
