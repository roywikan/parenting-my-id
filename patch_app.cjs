const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Add import THEME_PRESETS
if (!content.includes('import { THEME_PRESETS }')) {
  content = content.replace("import { getSiteConfig, saveSiteConfig } from './lib/config';", "import { getSiteConfig, saveSiteConfig } from './lib/config';\nimport { THEME_PRESETS } from './lib/themes';");
}

// Add useEffect for applying theme
const themeEffectCode = `
  useEffect(() => {
    if (siteConfig?.active_theme_preset) {
      const theme = THEME_PRESETS.find(t => t.id === siteConfig.active_theme_preset);
      if (theme) {
        document.documentElement.style.setProperty('--color-primary', theme.colors.primary);
        document.documentElement.style.setProperty('--color-secondary', theme.colors.secondary);
        document.documentElement.style.setProperty('--font-sans', theme.fonts.sans);
        document.documentElement.style.setProperty('--font-heading', theme.fonts.heading);
      }
    } else {
      document.documentElement.style.removeProperty('--color-primary');
      document.documentElement.style.removeProperty('--color-secondary');
      document.documentElement.style.removeProperty('--font-sans');
      document.documentElement.style.removeProperty('--font-heading');
    }
  }, [siteConfig?.active_theme_preset]);
`;

if (!content.includes('siteConfig?.active_theme_preset) {')) {
  content = content.replace("const fetchConfig = async () => {", themeEffectCode + "\n  const fetchConfig = async () => {");
}

fs.writeFileSync('src/App.tsx', content);
