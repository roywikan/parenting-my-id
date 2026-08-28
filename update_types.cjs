const fs = require('fs');

let content = fs.readFileSync('src/types.ts', 'utf-8');

if (!content.includes('site_domain?: string;')) {
  content = content.replace(
    "active_theme_preset?: string;",
    `active_theme_preset?: string;
  site_domain?: string;
  default_theme_mode?: 'light' | 'dark' | 'auto';
  font_density_scale?: 'compact' | 'standard' | 'spacious';
  header_badge_text?: string;
  hero_badge_text?: string;
  autolink_ticker_label?: string;
  footer_autolink_label?: string;
  footer_badge_1?: string;
  footer_badge_2?: string;
  footer_badge_3?: string;`
  );
  fs.writeFileSync('src/types.ts', content);
}
