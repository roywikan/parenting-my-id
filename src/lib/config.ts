import { SiteConfig } from '../types';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  site_name: 'Parenting.my.id',
  site_tagline: 'Edukasi & Pengasuhan Anak Modern',
  site_description: 'Portal informasi dan panduan pengasuhan anak modern, nutrisi balita, serta kesehatan keluarga Indonesia.',
  site_logo_url: '',
  site_logo_icon: 'Heart',
  site_favicon_url: '/favicon.ico',
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
  admin_login_title: 'Portal Admin Parenting.my.id',
  admin_login_subtitle: 'Sistem Otentikasi Cloudflare D1',
  admin_login_btn_text: 'Masuk Portal CMS',
  mobile_admin_btn_label: 'Portal Admin & Editor',
  mobile_show_logged_username: false,
  active_theme_preset: 'corp-blue',
  site_domain: 'parenting.my.id',
  default_theme_mode: 'auto',
  font_density_scale: 'standard',
  font_size_scale: 'normal',
  age_accessibility_preset: '29-38',
  header_badge_text: 'Cloudflare D1 Edge Engine',
  hero_badge_text: 'Portal Nomor 1',
  autolink_ticker_label: 'Topik Trending:',
  footer_autolink_label: 'Tautan Populer',
  footer_badge_1: 'Aman & Terpercaya',
  footer_badge_2: 'Diperbarui Rutin',
  footer_badge_3: '100% Gratis',

  // Performance Metric Box Defaults
  show_performance_box: true,
  metric1_value: '99+',
  metric1_label: 'Kecepatan',
  metric2_value: '100',
  metric2_label: 'Kualitas',
  metric3_value: '0ms',
  metric3_label: 'Respon Delay',

  // Strategic AdSense Placements
  enable_adsense: true,
  adsense_client_id: '',
  adsense_header_top: '',
  adsense_article_top: '',
  adsense_article_middle: '',
  adsense_article_bottom: '',
  adsense_sidebar: '',
  adsense_sticky_footer: ''
};

export async function loadSiteConfig(): Promise<SiteConfig> {
  // 1. Try local cache first for instant load
  const cached = localStorage.getItem('parenting_site_config');
  let currentConfig: SiteConfig = cached ? { ...DEFAULT_SITE_CONFIG, ...JSON.parse(cached) } : DEFAULT_SITE_CONFIG;

  // 2. Fetch fresh config from API / D1
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        currentConfig = { ...DEFAULT_SITE_CONFIG, ...data };
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
