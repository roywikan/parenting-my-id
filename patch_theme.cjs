const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const themeEffect = `
  // Manage Dark Mode
  useEffect(() => {
    if (!siteConfig) return;
    const mode = siteConfig.default_theme_mode || 'auto';
    const root = document.documentElement;
    
    if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [siteConfig?.default_theme_mode]);
`;

if (!content.includes('// Manage Dark Mode')) {
  content = content.replace('  useEffect(() => {\n    if (siteConfig?.active_theme_preset)', themeEffect + '\n  useEffect(() => {\n    if (siteConfig?.active_theme_preset)');
  fs.writeFileSync('src/App.tsx', content);
}
