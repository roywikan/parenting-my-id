const fs = require('fs');
let content = fs.readFileSync('src/views/AdminPortal.tsx', 'utf-8');

const newStates = `
  const [cfgSiteDomain, setCfgSiteDomain] = useState(siteConfig?.site_domain || 'parenting.my.id');
  const [cfgDefaultThemeMode, setCfgDefaultThemeMode] = useState<'light'|'dark'|'auto'>(siteConfig?.default_theme_mode || 'auto');
  const [cfgFontDensityScale, setCfgFontDensityScale] = useState<'compact'|'standard'|'spacious'>(siteConfig?.font_density_scale || 'standard');
  const [cfgHeaderBadgeText, setCfgHeaderBadgeText] = useState(siteConfig?.header_badge_text || 'Beta v1.0');
  const [cfgHeroBadgeText, setCfgHeroBadgeText] = useState(siteConfig?.hero_badge_text || 'Portal Nomor 1');
  const [cfgAutolinkTickerLabel, setCfgAutolinkTickerLabel] = useState(siteConfig?.autolink_ticker_label || 'Trending:');
  const [cfgFooterAutolinkLabel, setCfgFooterAutolinkLabel] = useState(siteConfig?.footer_autolink_label || 'Tautan Populer');
  const [cfgFooterBadge1, setCfgFooterBadge1] = useState(siteConfig?.footer_badge_1 || 'Aman & Terpercaya');
  const [cfgFooterBadge2, setCfgFooterBadge2] = useState(siteConfig?.footer_badge_2 || 'Diperbarui Rutin');
  const [cfgFooterBadge3, setCfgFooterBadge3] = useState(siteConfig?.footer_badge_3 || '100% Gratis');
`;

if (!content.includes('cfgSiteDomain')) {
  content = content.replace(
    "const [cfgSiteName, setCfgSiteName] = useState(siteConfig?.site_name || 'Parenting.my.id');",
    "const [cfgSiteName, setCfgSiteName] = useState(siteConfig?.site_name || 'Parenting.my.id');" + newStates
  );
}

const effectUpdates = `
      setCfgSiteDomain(siteConfig.site_domain || 'parenting.my.id');
      setCfgDefaultThemeMode(siteConfig.default_theme_mode || 'auto');
      setCfgFontDensityScale(siteConfig.font_density_scale || 'standard');
      setCfgHeaderBadgeText(siteConfig.header_badge_text || 'Beta v1.0');
      setCfgHeroBadgeText(siteConfig.hero_badge_text || 'Portal Nomor 1');
      setCfgAutolinkTickerLabel(siteConfig.autolink_ticker_label || 'Trending:');
      setCfgFooterAutolinkLabel(siteConfig.footer_autolink_label || 'Tautan Populer');
      setCfgFooterBadge1(siteConfig.footer_badge_1 || 'Aman & Terpercaya');
      setCfgFooterBadge2(siteConfig.footer_badge_2 || 'Diperbarui Rutin');
      setCfgFooterBadge3(siteConfig.footer_badge_3 || '100% Gratis');
`;

if (!content.includes('setCfgSiteDomain(siteConfig.site_domain')) {
  content = content.replace(
    "setCfgSiteName(siteConfig.site_name || 'Parenting.my.id');",
    "setCfgSiteName(siteConfig.site_name || 'Parenting.my.id');" + effectUpdates
  );
}

const saveUpdates = `
        site_domain: cfgSiteDomain,
        default_theme_mode: cfgDefaultThemeMode,
        font_density_scale: cfgFontDensityScale,
        header_badge_text: cfgHeaderBadgeText,
        hero_badge_text: cfgHeroBadgeText,
        autolink_ticker_label: cfgAutolinkTickerLabel,
        footer_autolink_label: cfgFooterAutolinkLabel,
        footer_badge_1: cfgFooterBadge1,
        footer_badge_2: cfgFooterBadge2,
        footer_badge_3: cfgFooterBadge3,
`;

if (!content.includes('site_domain: cfgSiteDomain')) {
  content = content.replace(
    "site_name: cfgSiteName,",
    "site_name: cfgSiteName," + saveUpdates
  );
}

fs.writeFileSync('src/views/AdminPortal.tsx', content);
