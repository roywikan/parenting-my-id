const fs = require('fs');

let content = fs.readFileSync('src/lib/config.ts', 'utf-8');

if (!content.includes('site_domain:')) {
  content = content.replace(
    "active_theme_preset: 'corp-blue'",
    `active_theme_preset: 'corp-blue',
  site_domain: 'parenting.my.id',
  default_theme_mode: 'auto',
  font_density_scale: 'standard',
  header_badge_text: 'Beta v1.0',
  hero_badge_text: 'Portal Nomor 1',
  autolink_ticker_label: 'Trending:',
  footer_autolink_label: 'Tautan Populer',
  footer_badge_1: 'Aman & Terpercaya',
  footer_badge_2: 'Diperbarui Rutin',
  footer_badge_3: '100% Gratis'`
  );
  fs.writeFileSync('src/lib/config.ts', content);
}
