const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const themeEffect = `
  // Manage Dark Mode
  useEffect(() => {
    if (!siteConfig) return;
    const mode = siteConfig.default_theme_mode || 'auto';
    const root = document.documentElement;
    const override = localStorage.getItem('theme_override');
    
    if (override === 'dark') {
      root.classList.add('dark');
    } else if (override === 'light') {
      root.classList.remove('dark');
    } else if (mode === 'dark') {
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

content = content.replace(
/  \/\/ Manage Dark Mode[\s\S]*?\}, \[siteConfig\?\.default_theme_mode\]\);/g,
  themeEffect.trim()
);

fs.writeFileSync('src/App.tsx', content);
