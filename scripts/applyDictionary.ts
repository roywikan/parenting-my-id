import fs from 'fs';
import path from 'path';

/**
 * Interface definition for each entry in the dictionary.
 */
export interface DictionaryEntry {
  key: string;
  value: string;
  maxLen: number;
  flag: 'M' | 'D' | 'U';
  description: string;
}

export interface DictionaryApplyOptions {
  filePath?: string;
  dryRun?: boolean;
  strict?: boolean;
  generateSqlOnly?: boolean;
}

/**
 * Truncates string safely at word boundary if exceeding max length.
 */
function safeTruncate(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str;
  const truncated = str.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.7) {
    return truncated.slice(0, lastSpace).trim();
  }
  return truncated.trim();
}

/**
 * Escapes SQL string literals for SQLite / Cloudflare D1.
 */
function escapeSql(val: string | null | undefined): string {
  if (val === null || val === undefined) return "''";
  return `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Main application logic for validating and applying dictionary data.
 */
export async function applyDictionary(options: DictionaryApplyOptions = {}) {
  const rootDir = process.cwd();
  const dryRun = !!options.dryRun;
  const strict = !!options.strict;

  // 1. Determine input file
  let dictPath = options.filePath;
  if (!dictPath) {
    const customNichePath = path.join(rootDir, 'nicheDictionary.json');
    const defaultDictPath = path.join(rootDir, 'defaultDictionary.json');
    if (fs.existsSync(customNichePath)) {
      dictPath = customNichePath;
    } else {
      dictPath = defaultDictPath;
    }
  }

  if (!fs.existsSync(dictPath)) {
    console.error(`❌ [Error] File kamus tidak ditemukan: ${dictPath}`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`  🚀 AUTOMATED NICHE DICTIONARY REPLACEMENT SYSTEM  `);
  console.log(`======================================================`);
  console.log(`📂 Membaca kamus dari: ${dictPath}`);
  console.log(`⚙️  Mode Dry-Run: ${dryRun ? 'AKTIF (Tanpa menulis berkas)' : 'NON-AKTIF (Menulis berkas)'}`);
  console.log(`🛡️  Mode Strict: ${strict ? 'AKTIF' : 'NON-AKTIF (Auto-trim jika melebihi maxLen)'}\n`);

  const rawData = fs.readFileSync(dictPath, 'utf-8');
  let entries: DictionaryEntry[] = [];
  try {
    entries = JSON.parse(rawData);
    if (!Array.isArray(entries)) {
      throw new Error('Format root harus berupa array JSON');
    }
  } catch (err) {
    console.error(`❌ [Error] Gagal membaca JSON dictionary:`, err);
    process.exit(1);
  }

  // 2. Validate all entries
  const dictMap = new Map<string, DictionaryEntry>();
  const validationWarnings: string[] = [];
  const validationErrors: string[] = [];

  for (const entry of entries) {
    if (!entry.key) continue;

    const valStr = String(entry.value ?? '');
    const currentLen = valStr.length;

    if (entry.maxLen && currentLen > entry.maxLen) {
      const msg = `Key '${entry.key}' melebihi maxLen (${currentLen} > ${entry.maxLen}). Nilai: "${valStr}"`;
      if (strict) {
        validationErrors.push(msg);
      } else {
        const trimmed = safeTruncate(valStr, entry.maxLen);
        validationWarnings.push(`${msg} -> Auto-trimmed menjadi: "${trimmed}"`);
        entry.value = trimmed;
      }
    }

    dictMap.set(entry.key, entry);
  }

  if (validationWarnings.length > 0) {
    console.log(`⚠️  [PERINGATAN VALIDASI PANJANG TEKS] (${validationWarnings.length} entri):`);
    validationWarnings.forEach((w) => console.log(`   - ${w}`));
    console.log('');
  }

  if (validationErrors.length > 0) {
    console.error(`❌ [ERROR VALIDASI STRICT] (${validationErrors.length} entri melebihi maxLen):`);
    validationErrors.forEach((e) => console.error(`   - ${e}`));
    console.error(`\nProses dibatalkan karena mode --strict aktif. Harap perbaiki panjang teks.`);
    process.exit(1);
  }

  const getVal = (key: string, fallback = ''): string => {
    return dictMap.get(key)?.value ?? fallback;
  };

  // 3. Update public/site_config.json
  const siteConfigPath = path.join(rootDir, 'public', 'site_config.json');
  let siteConfig: Record<string, any> = {};
  if (fs.existsSync(siteConfigPath)) {
    try {
      siteConfig = JSON.parse(fs.readFileSync(siteConfigPath, 'utf-8'));
    } catch (e) {
      console.warn('⚠️  Gagal mem-parse public/site_config.json, membuat template baru.');
    }
  }

  // Update site configuration fields
  if (dictMap.has('SITE_NAME')) siteConfig.site_name = getVal('SITE_NAME');
  if (dictMap.has('SITE_TAGLINE')) siteConfig.site_tagline = getVal('SITE_TAGLINE');
  if (dictMap.has('SITE_DOMAIN')) siteConfig.site_domain = getVal('SITE_DOMAIN');
  if (dictMap.has('SITE_DESCRIPTION')) siteConfig.site_description = getVal('SITE_DESCRIPTION');
  if (dictMap.has('SITE_LOGO_ICON')) siteConfig.site_logo_icon = getVal('SITE_LOGO_ICON');
  if (dictMap.has('SEO_META_TITLE')) siteConfig.seo_meta_title = getVal('SEO_META_TITLE');
  if (dictMap.has('SEO_META_DESCRIPTION')) siteConfig.seo_meta_description = getVal('SEO_META_DESCRIPTION');
  if (dictMap.has('SEO_DEFAULT_OG_IMAGE') && getVal('SEO_DEFAULT_OG_IMAGE')) {
    siteConfig.seo_default_og_image = getVal('SEO_DEFAULT_OG_IMAGE');
  }

  // Hero section
  if (dictMap.has('HERO_BADGE_TEXT')) siteConfig.hero_badge_text = getVal('HERO_BADGE_TEXT');
  if (dictMap.has('HERO_TITLE')) siteConfig.hero_title = getVal('HERO_TITLE');
  if (dictMap.has('HERO_SUBTITLE')) siteConfig.hero_subtitle = getVal('HERO_SUBTITLE');
  if (dictMap.has('HERO_CTA_TEXT')) siteConfig.hero_cta_text = getVal('HERO_CTA_TEXT');

  // Tech / trust badges
  if (dictMap.has('TECH_BADGE_HERO')) siteConfig.tech_badge_hero = getVal('TECH_BADGE_HERO');
  if (dictMap.has('TECH_BADGE_PAGES')) siteConfig.tech_badge_pages = getVal('TECH_BADGE_PAGES');
  if (dictMap.has('TECH_BADGE_DATABASE')) siteConfig.tech_badge_database = getVal('TECH_BADGE_DATABASE');
  if (dictMap.has('TECH_BADGE_STORAGE')) siteConfig.tech_badge_storage = getVal('TECH_BADGE_STORAGE');

  // Footer text & badges
  if (dictMap.has('FOOTER_ABOUT_TEXT')) siteConfig.footer_about_text = getVal('FOOTER_ABOUT_TEXT');
  if (dictMap.has('FOOTER_COPYRIGHT_TEXT')) siteConfig.footer_copyright_text = getVal('FOOTER_COPYRIGHT_TEXT');
  if (dictMap.has('FOOTER_BADGE_1')) siteConfig.footer_badge_1 = getVal('FOOTER_BADGE_1');
  if (dictMap.has('FOOTER_BADGE_2')) siteConfig.footer_badge_2 = getVal('FOOTER_BADGE_2');
  if (dictMap.has('FOOTER_BADGE_3')) siteConfig.footer_badge_3 = getVal('FOOTER_BADGE_3');

  // Classified Ads Module
  if (dictMap.has('CLASSIFIED_MASTHEAD_TITLE')) siteConfig.classified_masthead_title = getVal('CLASSIFIED_MASTHEAD_TITLE');
  if (dictMap.has('CLASSIFIED_MASTHEAD_SUBTITLE')) siteConfig.classified_masthead_subtitle = getVal('CLASSIFIED_MASTHEAD_SUBTITLE');
  if (dictMap.has('CLASSIFIED_PRICE_TAG')) siteConfig.classified_price_tag = getVal('CLASSIFIED_PRICE_TAG');
  if (dictMap.has('CLASSIFIED_PHONE')) siteConfig.classified_phone = getVal('CLASSIFIED_PHONE');
  if (dictMap.has('CLASSIFIED_CATEGORIES')) siteConfig.classified_categories = getVal('CLASSIFIED_CATEGORIES');
  if (dictMap.has('CLASSIFIED_NOTICE')) siteConfig.classified_notice = getVal('CLASSIFIED_NOTICE');

  // Knowledge Base
  if (dictMap.has('KB_BADGE_TEXT')) siteConfig.kb_badge_text = getVal('KB_BADGE_TEXT');
  if (dictMap.has('KB_TITLE')) siteConfig.kb_title = getVal('KB_TITLE');
  if (dictMap.has('KB_SUBTITLE')) siteConfig.kb_subtitle = getVal('KB_SUBTITLE');
  if (dictMap.has('KB_SEARCH_PLACEHOLDER')) siteConfig.kb_search_placeholder = getVal('KB_SEARCH_PLACEHOLDER');

  // Expert / Consultant Profile
  if (dictMap.has('DOCTOR_NAME')) siteConfig.doctor_name = getVal('DOCTOR_NAME');
  if (dictMap.has('DOCTOR_TITLE')) siteConfig.doctor_title = getVal('DOCTOR_TITLE');
  if (dictMap.has('DOCTOR_BADGE_TEXT')) siteConfig.doctor_badge_text = getVal('DOCTOR_BADGE_TEXT');
  if (dictMap.has('DOCTOR_BIO')) siteConfig.doctor_bio = getVal('DOCTOR_BIO');
  if (dictMap.has('DOCTOR_EXPERIENCE_YEARS')) siteConfig.doctor_experience_years = getVal('DOCTOR_EXPERIENCE_YEARS');

  // Corporate B2B
  if (dictMap.has('CORPORATE_BADGE_TEXT')) siteConfig.corporate_badge_text = getVal('CORPORATE_BADGE_TEXT');
  if (dictMap.has('CORPORATE_TITLE')) siteConfig.corporate_title = getVal('CORPORATE_TITLE');
  if (dictMap.has('CORPORATE_SUBTITLE')) siteConfig.corporate_subtitle = getVal('CORPORATE_SUBTITLE');
  if (dictMap.has('CORPORATE_CTA_PROPOSAL')) siteConfig.corporate_cta_proposal = getVal('CORPORATE_CTA_PROPOSAL');
  if (dictMap.has('CORPORATE_CTA_CONSULT')) siteConfig.corporate_cta_consult = getVal('CORPORATE_CTA_CONSULT');
  if (dictMap.has('CORPORATE_STAT1_VAL')) siteConfig.corporate_stat1_val = getVal('CORPORATE_STAT1_VAL');
  if (dictMap.has('CORPORATE_STAT1_LBL')) siteConfig.corporate_stat1_lbl = getVal('CORPORATE_STAT1_LBL');
  if (dictMap.has('CORPORATE_STAT2_VAL')) siteConfig.corporate_stat2_val = getVal('CORPORATE_STAT2_VAL');
  if (dictMap.has('CORPORATE_STAT2_LBL')) siteConfig.corporate_stat2_lbl = getVal('CORPORATE_STAT2_LBL');
  if (dictMap.has('CORPORATE_STAT3_VAL')) siteConfig.corporate_stat3_val = getVal('CORPORATE_STAT3_VAL');
  if (dictMap.has('CORPORATE_STAT3_LBL')) siteConfig.corporate_stat3_lbl = getVal('CORPORATE_STAT3_LBL');

  // Products & Commerce
  if (dictMap.has('PRODUCTS_HERO_BADGE')) siteConfig.products_hero_badge = getVal('PRODUCTS_HERO_BADGE');
  if (dictMap.has('PRODUCTS_HERO_TITLE')) siteConfig.products_hero_title = getVal('PRODUCTS_HERO_TITLE');
  if (dictMap.has('PRODUCTS_HERO_SUBTITLE')) siteConfig.products_hero_subtitle = getVal('PRODUCTS_HERO_SUBTITLE');
  if (dictMap.has('PRODUCTS_EMPTY_TITLE')) siteConfig.products_empty_title = getVal('PRODUCTS_EMPTY_TITLE');
  if (dictMap.has('PRODUCTS_EMPTY_SUBTITLE')) siteConfig.products_empty_subtitle = getVal('PRODUCTS_EMPTY_SUBTITLE');
  if (dictMap.has('PRODUCT_SAMPLE_BADGE')) siteConfig.product_badge_text = getVal('PRODUCT_SAMPLE_BADGE');
  if (dictMap.has('PRODUCT_SAMPLE_TITLE')) siteConfig.product_title = getVal('PRODUCT_SAMPLE_TITLE');
  if (dictMap.has('PRODUCT_SAMPLE_SUBTITLE')) siteConfig.product_subtitle = getVal('PRODUCT_SAMPLE_SUBTITLE');
  if (dictMap.has('PRODUCT_SAMPLE_PRICE')) siteConfig.product_price = getVal('PRODUCT_SAMPLE_PRICE');
  if (dictMap.has('PRODUCT_SAMPLE_ORIGINAL_PRICE')) siteConfig.product_original_price = getVal('PRODUCT_SAMPLE_ORIGINAL_PRICE');
  if (dictMap.has('PRODUCT_SAMPLE_DISCOUNT_TAG')) siteConfig.product_discount_tag = getVal('PRODUCT_SAMPLE_DISCOUNT_TAG');
  if (dictMap.has('PRODUCT_SAMPLE_CTA')) siteConfig.product_cta_text = getVal('PRODUCT_SAMPLE_CTA');

  // Events & Campaigns
  if (dictMap.has('EVENT_BADGE_TEXT')) siteConfig.event_badge_text = getVal('EVENT_BADGE_TEXT');
  if (dictMap.has('EVENT_DATE_LOCATION')) siteConfig.event_date_location = getVal('EVENT_DATE_LOCATION');
  if (dictMap.has('EVENT_TITLE')) siteConfig.event_title = getVal('EVENT_TITLE');
  if (dictMap.has('EVENT_SUBTITLE')) siteConfig.event_subtitle = getVal('EVENT_SUBTITLE');
  if (dictMap.has('EVENT_CTA_TEXT')) siteConfig.event_cta_text = getVal('EVENT_CTA_TEXT');
  if (dictMap.has('CAMPAIGN_BADGE_TEXT')) siteConfig.campaign_badge_text = getVal('CAMPAIGN_BADGE_TEXT');
  if (dictMap.has('CAMPAIGN_TITLE')) siteConfig.campaign_title = getVal('CAMPAIGN_TITLE');
  if (dictMap.has('CAMPAIGN_SUBTITLE')) siteConfig.campaign_subtitle = getVal('CAMPAIGN_SUBTITLE');

  // Microsite & Portfolio
  if (dictMap.has('MICROSITE_TITLE')) siteConfig.microsite_title = getVal('MICROSITE_TITLE');
  if (dictMap.has('MICROSITE_BIO')) siteConfig.microsite_bio = getVal('MICROSITE_BIO');
  if (dictMap.has('MICROSITE_WA_LABEL')) siteConfig.microsite_wa_label = getVal('MICROSITE_WA_LABEL');
  if (dictMap.has('PORTFOLIO_BADGE_TEXT')) siteConfig.portfolio_badge_text = getVal('PORTFOLIO_BADGE_TEXT');
  if (dictMap.has('PORTFOLIO_TITLE')) siteConfig.portfolio_title = getVal('PORTFOLIO_TITLE');
  if (dictMap.has('PORTFOLIO_SUBTITLE')) siteConfig.portfolio_subtitle = getVal('PORTFOLIO_SUBTITLE');
  if (dictMap.has('PORTFOLIO_STAT1_LBL')) siteConfig.portfolio_stat1_lbl = getVal('PORTFOLIO_STAT1_LBL');
  if (dictMap.has('PORTFOLIO_STAT2_LBL')) siteConfig.portfolio_stat2_lbl = getVal('PORTFOLIO_STAT2_LBL');
  if (dictMap.has('PORTFOLIO_STAT3_LBL')) siteConfig.portfolio_stat3_lbl = getVal('PORTFOLIO_STAT3_LBL');

  // Interactive & Admin
  if (dictMap.has('HABIT_SIMULATOR_TITLE')) siteConfig.habit_simulator_title = getVal('HABIT_SIMULATOR_TITLE');
  if (dictMap.has('HABIT_SIMULATOR_SUBTITLE')) siteConfig.habit_simulator_subtitle = getVal('HABIT_SIMULATOR_SUBTITLE');
  if (dictMap.has('QUIZ_BUILDER_TITLE')) siteConfig.quiz_builder_title = getVal('QUIZ_BUILDER_TITLE');
  if (dictMap.has('ADMIN_LOGIN_TITLE')) siteConfig.admin_login_title = getVal('ADMIN_LOGIN_TITLE');
  if (dictMap.has('WHATSAPP_DEFAULT_MESSAGE')) siteConfig.whatsapp_default_message = getVal('WHATSAPP_DEFAULT_MESSAGE');
  if (dictMap.has('PRODUCTS_NAV_LABEL')) siteConfig.products_nav_label = getVal('PRODUCTS_NAV_LABEL');
  if (dictMap.has('AUTOLINK_TICKER_LABEL')) siteConfig.autolink_ticker_label = getVal('AUTOLINK_TICKER_LABEL');
  if (dictMap.has('FOOTER_AUTOLINK_LABEL')) siteConfig.footer_autolink_label = getVal('FOOTER_AUTOLINK_LABEL');
  if (dictMap.has('REFERENCE_HEADING_LABEL')) siteConfig.reference_heading_label = getVal('REFERENCE_HEADING_LABEL');

  // Dynamic Navigation Categories Mapping
  const categoriesList = [
    { label: getVal('NAV_CATEGORY_1_LABEL', 'Kategori 1'), slug: getVal('NAV_CATEGORY_1_SLUG', 'kategori-1') },
    { label: getVal('NAV_CATEGORY_2_LABEL', 'Kategori 2'), slug: getVal('NAV_CATEGORY_2_SLUG', 'kategori-2') },
    { label: getVal('NAV_CATEGORY_3_LABEL', 'Kategori 3'), slug: getVal('NAV_CATEGORY_3_SLUG', 'kategori-3') },
    { label: getVal('NAV_CATEGORY_4_LABEL', 'Kategori 4'), slug: getVal('NAV_CATEGORY_4_SLUG', 'kategori-4') },
  ];

  siteConfig.hamburger_nav_links = [
    { label: 'IKLAN BARIS', url: '/iklan-baris' },
    { label: 'SURAT PEMBACA', url: '/surat-pembaca' },
    ...categoriesList.map((cat) => ({
      label: cat.label,
      url: `/kategori/${cat.slug}`,
    })),
  ];

  siteConfig.footer_category_links = categoriesList.map((cat) => ({
    label: cat.label,
    url: `/kategori/${cat.slug}`,
  }));

  if (!dryRun) {
    fs.writeFileSync(siteConfigPath, JSON.stringify(siteConfig, null, 2), 'utf-8');
    console.log(`✅ [Tersimpan] Berhasil memperbarui: ${siteConfigPath}`);
  } else {
    console.log(`🔎 [Dry-Run] Melewati penulisan: ${siteConfigPath}`);
  }

  // 4. Update .env if present
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf-8');
    let envUpdated = false;

    if (dictMap.has('SITE_NAME')) {
      envContent = envContent.replace(/^SITE_NAME=.*$/m, `SITE_NAME=${getVal('SITE_NAME')}`);
      envUpdated = true;
    }
    if (dictMap.has('SITE_DESCRIPTION')) {
      envContent = envContent.replace(/^SITE_DESCRIPTION=.*$/m, `SITE_DESCRIPTION="${getVal('SITE_DESCRIPTION')}"`);
      envUpdated = true;
    }
    if (dictMap.has('SITE_URL')) {
      envContent = envContent.replace(/^SITE_URL=.*$/m, `SITE_URL=${getVal('SITE_URL')}`);
      envUpdated = true;
    }

    if (envUpdated) {
      if (!dryRun) {
        fs.writeFileSync(envPath, envContent, 'utf-8');
        console.log(`✅ [Tersimpan] Berhasil menyinkronkan variabel ke: ${envPath}`);
      } else {
        console.log(`🔎 [Dry-Run] Melewati penulisan: ${envPath}`);
      }
    }
  }

  // 5. Update sample posts in data/posts.json
  const postsJsonPath = path.join(rootDir, 'data', 'posts.json');
  if (fs.existsSync(postsJsonPath)) {
    try {
      const postsData = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
      if (Array.isArray(postsData) && postsData.length > 0) {
        if (dictMap.has('SAMPLE_POST_1_TITLE')) {
          postsData[0].title = getVal('SAMPLE_POST_1_TITLE');
          postsData[0].excerpt = getVal('SAMPLE_POST_1_EXCERPT', postsData[0].excerpt);
          postsData[0].category = getVal('SAMPLE_POST_1_CATEGORY', postsData[0].category);
          postsData[0].tags = getVal('SAMPLE_POST_1_TAGS', postsData[0].tags);
        }
        if (postsData.length > 1 && dictMap.has('SAMPLE_POST_2_TITLE')) {
          postsData[1].title = getVal('SAMPLE_POST_2_TITLE');
          postsData[1].excerpt = getVal('SAMPLE_POST_2_EXCERPT', postsData[1].excerpt);
          postsData[1].category = getVal('SAMPLE_POST_2_CATEGORY', postsData[1].category);
          postsData[1].tags = getVal('SAMPLE_POST_2_TAGS', postsData[1].tags);
        }
        if (postsData.length > 2 && dictMap.has('SAMPLE_POST_3_TITLE')) {
          postsData[2].title = getVal('SAMPLE_POST_3_TITLE');
          postsData[2].excerpt = getVal('SAMPLE_POST_3_EXCERPT', postsData[2].excerpt);
          postsData[2].category = getVal('SAMPLE_POST_3_CATEGORY', postsData[2].category);
          postsData[2].tags = getVal('SAMPLE_POST_3_TAGS', postsData[2].tags);
        }

        if (!dryRun) {
          fs.writeFileSync(postsJsonPath, JSON.stringify(postsData, null, 2), 'utf-8');
          console.log(`✅ [Tersimpan] Berhasil menyelaraskan artikel sampel di: ${postsJsonPath}`);
        } else {
          console.log(`🔎 [Dry-Run] Melewati penulisan: ${postsJsonPath}`);
        }
      }
    } catch (e) {
      console.warn('⚠️  Gagal memperbarui data/posts.json:', e);
    }
  }

  // 6. Generate Cloudflare D1 SQL Seed Script (data/seed_niche.sql)
  const sqlStatements: string[] = [
    '-- =====================================================================',
    '-- CLOUDFLARE D1 AUTOMATED NICHE SEED SCRIPT',
    `-- Generated on: ${new Date().toISOString()}`,
    `-- Target Niche Domain: ${getVal('SITE_DOMAIN', 'example.com')}`,
    '-- =====================================================================\n',
  ];

  // Insert into configs table (Key-Value)
  sqlStatements.push('-- 1. SEED / UPDATE TABLE configs');
  for (const [k, v] of Object.entries(siteConfig)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      sqlStatements.push(
        `INSERT OR REPLACE INTO configs (key, value) VALUES (${escapeSql(k)}, ${escapeSql(String(v))});`
      );
    }
  }

  // Insert into site_config table (Complete JSON snapshot)
  sqlStatements.push('\n-- 2. SEED / UPDATE TABLE site_config (Single JSON Row)');
  const siteConfigJsonString = JSON.stringify(siteConfig);
  sqlStatements.push(
    `INSERT OR REPLACE INTO site_config (id, config_json, updated_at) VALUES (1, ${escapeSql(siteConfigJsonString)}, CURRENT_TIMESTAMP);`
  );

  // Update sample posts in D1 database
  sqlStatements.push('\n-- 3. UPDATE SAMPLE POSTS IN TABLE posts (Top 3)');
  if (dictMap.has('SAMPLE_POST_1_TITLE')) {
    sqlStatements.push(
      `UPDATE posts SET title = ${escapeSql(getVal('SAMPLE_POST_1_TITLE'))}, excerpt = ${escapeSql(getVal('SAMPLE_POST_1_EXCERPT'))}, category = ${escapeSql(getVal('SAMPLE_POST_1_CATEGORY'))}, tags = ${escapeSql(getVal('SAMPLE_POST_1_TAGS'))} WHERE id = 1;`
    );
  }
  if (dictMap.has('SAMPLE_POST_2_TITLE')) {
    sqlStatements.push(
      `UPDATE posts SET title = ${escapeSql(getVal('SAMPLE_POST_2_TITLE'))}, excerpt = ${escapeSql(getVal('SAMPLE_POST_2_EXCERPT'))}, category = ${escapeSql(getVal('SAMPLE_POST_2_CATEGORY'))}, tags = ${escapeSql(getVal('SAMPLE_POST_2_TAGS'))} WHERE id = 2;`
    );
  }
  if (dictMap.has('SAMPLE_POST_3_TITLE')) {
    sqlStatements.push(
      `UPDATE posts SET title = ${escapeSql(getVal('SAMPLE_POST_3_TITLE'))}, excerpt = ${escapeSql(getVal('SAMPLE_POST_3_EXCERPT'))}, category = ${escapeSql(getVal('SAMPLE_POST_3_CATEGORY'))}, tags = ${escapeSql(getVal('SAMPLE_POST_3_TAGS'))} WHERE id = 3;`
    );
  }

  const sqlOutputDir = path.join(rootDir, 'data');
  if (!fs.existsSync(sqlOutputDir)) {
    fs.mkdirSync(sqlOutputDir, { recursive: true });
  }
  const sqlOutputFile = path.join(sqlOutputDir, 'seed_niche.sql');

  if (!dryRun) {
    fs.writeFileSync(sqlOutputFile, sqlStatements.join('\n'), 'utf-8');
    console.log(`✅ [SQL D1 Siap Pakai] Berhasil membuat berkas migrasi: ${sqlOutputFile}`);
    console.log(`   💡 Cara eksekusi ke Cloudflare D1:`);
    console.log(`      wrangler d1 execute <NAMA_DATABASE_D1> --file=data/seed_niche.sql`);
  } else {
    console.log(`🔎 [Dry-Run] Melewati penulisan: ${sqlOutputFile}`);
  }

  console.log(`\n🎉 Proses injeksi kamus selesai dengan sukses!`);
  console.log(`   - Total Entri Diproses: ${entries.length}`);
  console.log(`   - Peringatan Panjang Teks: ${validationWarnings.length}`);
  console.log(`   - Status Berkas: Sinkron 100% dengan skema aplikasi.`);
}

// CLI Execution Handler
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  let filePath: string | undefined;
  let dryRun = false;
  let strict = false;

  for (const arg of args) {
    if (arg.startsWith('--file=')) {
      filePath = arg.replace('--file=', '').trim();
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--strict') {
      strict = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Penggunaan CLI:
  tsx scripts/applyDictionary.ts [opsi]

Opsi:
  --file=<path>   Tentukan path berkas dictionary kustom (default: nicheDictionary.json atau defaultDictionary.json)
  --dry-run       Jalankan validasi dan simulasi tanpa menulis ke disk
  --strict        Gagalkan proses jika ada teks melebihi maxLen (tanpa auto-trim)
  --help, -h      Tampilkan pesan bantuan ini

Contoh:
  npx tsx scripts/applyDictionary.ts --file=myNiche.json
  npm run apply-dictionary
      `);
      process.exit(0);
    }
  }

  applyDictionary({ filePath, dryRun, strict }).catch((err) => {
    console.error('Fatal Error executing applyDictionary:', err);
    process.exit(1);
  });
}
