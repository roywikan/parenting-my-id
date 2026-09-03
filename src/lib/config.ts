import { SiteConfig } from '../types';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  site_name: 'Parenting.my.id',
  site_tagline: 'Edukasi & Pengasuhan Anak Modern',
  site_description: 'Portal informasi dan panduan pengasuhan anak modern, nutrisi balita, serta kesehatan keluarga Indonesia.',
  site_logo_url: '',
  site_logo_icon: 'Heart',
  site_favicon_url: '/favicon.ico',
  homepage_display_mode: 'default',
  header_nav_links: [
    { label: 'Pola Asuh', url: '/kategori/pola-asuh' },
    { label: 'Tumbuh Kembang', url: '/kategori/tumbuh-kembang' },
    { label: 'Kesehatan & Gizi', url: '/kategori/kesehatan-gizi' },
    { label: 'Balita', url: '/balita' },
    { label: 'Sitemap', url: '/sitemap.xml' },
    { label: 'RSS Feed', url: '/feed.xml' }
  ],
  hamburger_nav_links: [
    { label: 'Beranda', url: '/' },
    { label: 'Pola Asuh', url: '/kategori/pola-asuh' },
    { label: 'Tumbuh Kembang', url: '/kategori/tumbuh-kembang' },
    { label: 'Kesehatan & Gizi', url: '/kategori/kesehatan-gizi' },
    { label: 'Balita', url: '/balita' },
    { label: 'Sitemap XML', url: '/sitemap.xml' },
    { label: 'RSS Feed', url: '/feed.xml' }
  ],
  enable_search_bar: true,
  enable_theme_toggle: true,
  seo_meta_title: 'Parenting.my.id - Edukasi & Pengasuhan Anak Modern',
  seo_meta_description: 'Portal informasi dan panduan pengasuhan anak modern, nutrisi balita, serta kesehatan keluarga Indonesia.',
  seo_default_og_image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200&h=630',
  show_hero_section: true,
  hero_title: 'Panduan Pengasuhan Anak Terpercaya',
  hero_subtitle: 'Temukan artikel, tips nutrisi, dan edukasi tumbuh kembang anak untuk orang tua modern.',
  hero_cta_text: 'Jelajahi Artikel',
  hero_cta_link: '#artikel-terbaru',
  posts_per_page: 9,
  enable_featured_post: true,
  pagination_type: 'load_more',
  show_sidebar: true,
  popular_posts_count: 5,
  categories_widget_limit: 8,
  sidebar_banner_code: '',
  footer_about_text: 'Parenting.my.id menghadirkan bacaan berkualitas seputar dunia pengasuhan anak, kesehatan keluarga, dan pendidikan anak usia dini.',
  footer_copyright_text: '© 2026 Parenting.my.id. Hak Cipta Dilindungi Undang-Undang.',
  social_facebook: 'https://facebook.com/parentingmyid',
  social_instagram: 'https://instagram.com/parentingmyid',
  social_twitter: 'https://x.com/parentingmyid',
  footer_menu_links: [
    { label: 'Kebijakan Privasi', url: '/privacy' },
    { label: 'Tentang Kami', url: '/about' },
    { label: 'Hubungi Kami', url: '/contact' },
    { label: 'Disclaimer', url: '/disclaimer' },
    { label: 'Syarat & Ketentuan', url: '/terms' },
    { label: 'Sitemap XML', url: '/sitemap.xml' },
    { label: 'RSS Feed', url: '/feed.xml' }
  ],
  footer_category_links: [
    { label: 'Pola Asuh', url: '/kategori/pola-asuh' },
    { label: 'Tumbuh Kembang', url: '/kategori/tumbuh-kembang' },
    { label: 'Kesehatan & Gizi', url: '/kategori/kesehatan-gizi' },
    { label: 'Balita', url: '/balita' }
  ],
  comment_engine_mode: 'both',
  admin_login_title: 'Portal Admin Parenting.my.id',
  admin_login_subtitle: 'Sistem Otentikasi Cloudflare D1',
  admin_login_btn_text: 'Masuk Portal CMS',
  admin_url_suffix: '9999',
  mobile_admin_btn_label: 'Portal Admin & Editor',
  mobile_show_logged_username: false,
  active_theme_preset: 'corp-blue',
  site_domain: 'parenting.my.id',
  default_theme_mode: 'auto',
  font_density_scale: 'standard',
  font_size_scale: 'normal',
  age_accessibility_preset: '29-38',
  header_badge_text: 'Cloudflare D1 Edge Engine',
  show_header_badge: true,
  show_edge_badge: true,
  hero_badge_text: 'Portal Nomor 1',
  autolink_ticker_label: 'Topik Trending:',
  footer_autolink_label: 'Tautan Populer',
  footer_badge_1: 'Aman & Terpercaya',
  footer_badge_2: 'Diperbarui Rutin',
  footer_badge_3: '100% Gratis',

  // Performance Metric Box Defaults
  show_performance_box: true,
  show_tech_badges: true,
  tech_badge_hero: 'Cloudflare D1 Edge Architecture • TTFB < 20ms',
  tech_badge_pages: 'Cloudflare Pages Edge',
  tech_badge_database: 'Cloudflare D1 SQLite',
  tech_badge_storage: 'GitHub REST Storage',
  metric_1_show: true,
  metric_2_show: true,
  metric_3_show: true,
  metric1_show: true,
  metric2_show: true,
  metric3_show: true,
  metric1_value: '99+',
  metric1_label: 'Kecepatan',
  metric1_anim_type: 'fixed',
  metric1_start_val: 0,
  metric1_end_val: 99,
  metric1_duration: 2000,
  metric1_unit: '+',

  metric2_value: '100',
  metric2_label: 'Kualitas',
  metric2_anim_type: 'fixed',
  metric2_start_val: 0,
  metric2_end_val: 100,
  metric2_duration: 2000,
  metric2_unit: '',

  metric3_value: '0ms',
  metric3_label: 'Respon Delay',
  metric3_anim_type: 'fixed',
  metric3_start_val: 100,
  metric3_end_val: 0,
  metric3_duration: 2000,
  metric3_unit: 'ms',

  // Strategic AdSense Placements
  enable_adsense: true,
  adsense_client_id: '',
  adsense_header_top: '',
  adsense_article_top: '',
  adsense_article_middle: '',
  adsense_article_bottom: '',
  adsense_sidebar: '',
  adsense_sticky_footer: '',

  // Custom JS/CSS Snippets (Head & Body)
  custom_snippet_head_enable: false,
  custom_snippet_head_code: `<!-- Sample Google Analytics (gtag.js) & Custom CSS Snippet -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-SAMPLE12345"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-SAMPLE12345');
</script>
<style>
  /* Sample Custom CSS Snippet */
  .custom-accent-border { border-left: 4px solid #e11d48; padding-left: 12px; }
</style>`,
  custom_snippet_body_enable: false,
  custom_snippet_body_code: `<!-- Sample Custom JS Snippet Sebelum Penutup Tag </body> -->
<script>
  console.log('✅ Custom Body Script Active - Parenting.my.id');
</script>`,

  // Custom HTML Meta Tag Snippet
  custom_meta_tags_enable: false,
  custom_meta_tags_code: `<!-- Sample Google Search Console Ownership Verification -->
<meta name="google-site-verification" content="GSC-SAMPLE-DUMMY-VERIFICATION-TOKEN-987654321" />
<meta name="yandex-verification" content="yandex-sample-verification-code-1234" />`,

  // Custom Responsive Banner Ads Snippets
  ad_banner_first_half_enable: false,
  ad_banner_first_half_code: `<div style="background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%); border: 1px solid #fecdd3; border-radius: 16px; padding: 16px; text-align: center; max-width: 728px; margin: 20px auto; font-family: sans-serif;">
  <span style="background: #e11d48; color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 9999px; text-transform: uppercase;">PROMO PARENTING</span>
  <h4 style="margin: 8px 0 4px; font-size: 16px; font-weight: 800; color: #881337;">Diskon 50% Buku Panduan MPASI & Tumbuh Kembang 2026</h4>
  <p style="margin: 0 0 12px; font-size: 12px; color: #9f1239;">Dapatkan paket komplit gizi balita & stimulasi otak anak sekarang juga!</p>
  <a href="#" style="display: inline-block; background: #e11d48; color: white; font-weight: bold; font-size: 12px; padding: 8px 18px; border-radius: 9999px; text-decoration: none;">Lihat Promo Sekarang &rarr;</a>
</div>`,
  ad_banner_sticky_footer_enable: false,
  ad_banner_sticky_footer_code: `<div id="sticky-bottom-banner" style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999; background: #881337; color: white; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; box-shadow: 0 -4px 20px rgba(0,0,0,0.15); font-family: sans-serif;">
  <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 250px;">
    <span style="font-size: 20px;">👶</span>
    <div>
      <strong style="font-size: 13px; display: block;">Konsultasi Dokter Anak & Gizi Balita Gratis</strong>
      <span style="font-size: 11px; opacity: 0.9;">Gabung komunitas WhatsApp 15.000+ Orang Tua Hebat</span>
    </div>
  </div>
  <div style="display: flex; align-items: center; gap: 8px;">
    <a href="#" style="background: #ffffff; color: #881337; font-weight: 800; font-size: 11px; padding: 6px 14px; border-radius: 20px; text-decoration: none;">Gabung WA &rarr;</a>
    <button onclick="document.getElementById('sticky-bottom-banner').style.display='none'" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-weight: bold;">✕</button>
  </div>
</div>`,
  ad_banner_article_start_enable: false,
  ad_banner_article_start_code: `<div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 16px 0; border-radius: 0 12px 12px 0; font-family: sans-serif; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
  <div style="font-size: 12px; color: #1e40af; font-weight: 600;">
    📢 <strong>Sponsor Info:</strong> Dapatkan suplemen nutrisi balita dengan cashback hingga 30%!
  </div>
  <a href="#" style="font-size: 11px; font-weight: 800; color: #2563eb; text-decoration: underline;">Klaim Promo &rarr;</a>
</div>`,
  ad_banner_article_end_enable: false,
  ad_banner_article_end_code: `<div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; font-family: sans-serif;">
  <p style="font-size: 11px; color: #64748b; font-weight: 700; margin: 0 0 6px; text-transform: uppercase;">REKOMENDASI EDITOR</p>
  <h4 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 8px;">Ingin Anak Tumbuh Cerdas & Bebas Stunting?</h4>
  <p style="font-size: 12px; color: #475569; margin: 0 0 12px;">Unduh e-Book Gratis "100 resep MPASI Kaya Protein Hewani" edisi terbaru.</p>
  <a href="#" style="background: #2563eb; color: white; font-weight: 700; font-size: 12px; padding: 8px 16px; border-radius: 8px; text-decoration: none; display: inline-block;">Unduh e-Book Gratis &rarr;</a>
</div>`,

  // --- CUSTOMIZABLE FRONTPAGE WORDING & DATA (10 Models) ---
  // Model 1: Default Blog & Magz
  default_hero_badge: 'Portal Nomor 1',
  default_hero_title: 'Panduan Pengasuhan Anak Terpercaya',
  default_hero_subtitle: 'Temukan artikel, tips nutrisi, dan edukasi tumbuh kembang anak untuk orang tua modern.',
  default_newsletter_title: 'Dapatkan Panduan Parenting Mingguan',
  default_newsletter_subtitle: 'Bergabunglah bersama 25.000+ orang tua hebat lainnya untuk tips eksklusif.',

  // Model 2: Event & Konferensi
  event_badge_text: 'Summit Nasional Parenting 2026',
  event_title: 'Konferensi Nasional Pola Asuh & Tumbuh Kembang Anak Indonesia 2026',
  event_subtitle: 'Forum edukasi parenting terbesar yang menghadirkan dokter spesialis anak, psikolog perkembangan, dan praktisi pendidikan.',
  event_date_location: '16-18 Oktober 2026 • Grand Ballroom Jakarta & Live Streaming',
  event_cta_text: 'Daftar & Pesan Tiket',
  event_whatsapp: '6281234567890',

  // Model 3: Campaign & Petisi
  campaign_badge_text: 'Aksi Sosial Nasional',
  campaign_title: 'Gerakan Bersama Bebas Stunting: Lindungi 1000 Hari Pertama Anak',
  campaign_subtitle: 'Bantu 50.000 balita di pelosok negeri mendapatkan asupan protein hewani dan suplemen mikronutrien penting.',
  campaign_target_amount: '500.000.000',
  campaign_current_amount: '342.850.000',
  campaign_donor_count: '1.428',
  campaign_cta_text: 'Salurkan Donasi Sekarang',
  campaign_whatsapp: '6281234567890',

  // Model 4: Microsite / Bio Links
  microsite_title: 'Parenting.my.id Official Hub',
  microsite_bio: 'Pusat informasi, konsultasi dokter anak, panduan MPASI, dan komunitas orang tua cerdas di Indonesia.',
  microsite_wa_number: '6281234567890',
  microsite_wa_label: 'Konsultasi Privat Parenting (WhatsApp)',
  microsite_telegram_url: 'https://t.me/parentingmyid',
  microsite_ebook_url: '#',
  microsite_podcast_url: 'https://spotify.com',
  microsite_shop_url: '#',

  // Model 5: Portofolio & Karya
  portfolio_badge_text: 'Rekam Jejak & Publikasi',
  portfolio_title: 'Portofolio Riset, Kurikulum & Program Edukasi',
  portfolio_subtitle: 'Dokumentasi hasil karya ilmiah, program pendampingan keluarga, dan modul nutrisi yang telah kami kembangkan.',
  portfolio_stat1_val: '120+',
  portfolio_stat1_lbl: 'Modul & E-Book Terbit',
  portfolio_stat2_val: '45+',
  portfolio_stat2_lbl: 'Riset Klinis Tumbuh Kembang',
  portfolio_stat3_val: '85.000+',
  portfolio_stat3_lbl: 'Keluarga Terbantu',
  portfolio_whatsapp: '6281234567890',

  // Model 6: Personal Branding Dokter / Pakar
  doctor_badge_text: 'Pakar & Praktisi Terpercaya',
  doctor_name: 'dr. Siti Rahma, Sp.A(K), M.Kes',
  doctor_title: 'Dokter Spesialis Anak & Konsultan Nutrisi Pediatrik',
  doctor_bio: 'Berpengalaman lebih dari 15 tahun mendampingi ribuan orang tua dalam mengoptimalkan 1000 Hari Pertama Kehidupan (HPK) dan penanganan masalah makan anak.',
  doctor_experience_years: '15+ Tahun Pengalaman',
  doctor_consultation_rate: 'Rp 250.000 / Sesi',
  doctor_whatsapp: '6281234567890',
  doctor_avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&h=500&fit=crop&q=80',

  // Model 7: Corporate & B2B
  corporate_badge_text: 'Solusi Korporasi & Institusi Edukasi',
  corporate_title: 'Meningkatkan Produktivitas Karyawan Melalui Dukungan Pengasuhan Terpercaya',
  corporate_subtitle: 'Kami bermitra dengan perusahaan terdepan untuk menyediakan program Employee Assistance Parenting (EAP), konsultasi daycare in-house, dan lokakarya kesehatan anak bagi karyawan.',
  corporate_stat1_val: '98.4%',
  corporate_stat1_lbl: 'Kepuasan Klien B2B',
  corporate_stat2_val: '45%',
  corporate_stat2_lbl: 'Penurunan Absenteeism',
  corporate_whatsapp: '6281234567890',
  corporate_email: 'b2b@parenting.my.id',

  // Model 8: Product Landing Page
  product_badge_text: 'Best Seller • Rekomendasi Dokter',
  product_title: 'Paket Lengkap MPASI Cerdas & Stimulasi Sensori Balita',
  product_subtitle: 'Solusi praktis anti-GTM lengkap dengan buku resep 1000 hari pertama, kartu sensorik motorik, dan konsultasi gizi.',
  product_price: 'Rp 189.000',
  product_original_price: 'Rp 299.000',
  product_discount_tag: 'HEMAT 37%',
  product_whatsapp: '6281234567890',
  product_cta_text: 'Pesan Paket Sekarang via WhatsApp',

  // Model 9: Iklan Baris Koran Dulu
  newspaper_name: 'WARTA PARENTING NUSANTARA',
  newspaper_edition: 'EDISI SPESIAL • TAHUN KE-XXIV',
  newspaper_motto: 'Harian Suara Orang Tua & Keluarga Bijak — Terbit Sejak 1985',
  newspaper_ads_phone: '0812-3456-7890 / 021-5551234',
  newspaper_rate_text: 'Tarif Pasang Iklan: Rp 25.000 / Baris',

  // Model 10: Knowledge Base
  kb_badge_text: 'Pusat Panduan Terpadu',
  kb_title: 'Ensiklopedia & Pusat Pengetahuan Pengasuhan Anak',
  kb_subtitle: 'Temukan jawaban medis dan psikologis terpercaya untuk setiap tahap tumbuh kembang buah hati.',
  kb_search_placeholder: 'Cari panduan (contoh: MPASI 6 bulan, demam anak, tantrum)...',
  kb_helpdesk_whatsapp: '6281234567890'
};

export async function loadSiteConfig(): Promise<SiteConfig> {
  // 0. Check SSR injected initial data
  const ssrConfig = typeof window !== 'undefined' ? (window as any).__INITIAL_DATA__?.siteConfig : undefined;
  if (ssrConfig && typeof ssrConfig === 'object' && Object.keys(ssrConfig).length > 0) {
    const merged = { ...DEFAULT_SITE_CONFIG, ...ssrConfig };
    localStorage.setItem('parenting_site_config', JSON.stringify(merged));
    return merged;
  }

  // 1. Try local cache first for instant load
  const cached = localStorage.getItem('parenting_site_config');
  let currentConfig: SiteConfig = cached ? { ...DEFAULT_SITE_CONFIG, ...JSON.parse(cached) } : DEFAULT_SITE_CONFIG;

  // 2. Fetch fresh config from API / D1 (Edge Cached)
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        currentConfig = { ...DEFAULT_SITE_CONFIG, ...data };

        // Ensure array navigation fields fall back to defaults if empty or missing
        if (!Array.isArray(currentConfig.header_nav_links) || currentConfig.header_nav_links.length === 0) {
          currentConfig.header_nav_links = DEFAULT_SITE_CONFIG.header_nav_links;
        }
        if (!Array.isArray(currentConfig.hamburger_nav_links) || currentConfig.hamburger_nav_links.length === 0) {
          currentConfig.hamburger_nav_links = DEFAULT_SITE_CONFIG.hamburger_nav_links;
        }
        if (!Array.isArray(currentConfig.footer_menu_links) || currentConfig.footer_menu_links.length === 0) {
          currentConfig.footer_menu_links = DEFAULT_SITE_CONFIG.footer_menu_links;
        }
        if (!Array.isArray(currentConfig.footer_category_links) || currentConfig.footer_category_links.length === 0) {
          currentConfig.footer_category_links = DEFAULT_SITE_CONFIG.footer_category_links;
        }

        localStorage.setItem('parenting_site_config', JSON.stringify(currentConfig));
      }
    }
  } catch (err) {
    console.warn('Could not fetch remote config, using cached/default config:', err);
  }

  return currentConfig;
}

export const getSiteConfig = loadSiteConfig;

export async function saveSiteConfig(config: SiteConfig): Promise<boolean> {
  // Save to localStorage immediately
  localStorage.setItem('parenting_site_config', JSON.stringify(config));

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.ok;
  } catch (err) {
    console.error('Error saving site config to API:', err);
    return false;
  }
}
