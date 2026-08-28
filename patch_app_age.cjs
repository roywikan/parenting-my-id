const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const styleBlock = `
  // Terapkan Preset Aksesibilitas Usia Pembaca (Age Accessibility Preset)
  let ageStyle = '';
  switch (siteConfig?.age_accessibility_preset) {
    case '18-28':
      ageStyle = \`
        .article-body { font-size: 16px; line-height: 1.625; }
        .main-nav, .main-nav a, .main-nav button { font-size: 16px !important; }
        .text-secondary { font-size: 12px; opacity: 0.8; }
      \`;
      break;
    case '29-38':
      ageStyle = \`
        .article-body { font-size: 18px; line-height: 1.625; }
        .main-nav, .main-nav a, .main-nav button { font-size: 16px !important; }
        .text-secondary { font-size: 14px; }
      \`;
      break;
    case '39-48':
      ageStyle = \`
        .article-body { font-size: 20px; line-height: 2; }
        .main-nav, .main-nav a, .main-nav button { font-size: 18px !important; font-weight: bold; }
        .text-secondary { font-size: 14px; }
      \`;
      break;
    case '49-58':
      ageStyle = \`
        .article-body { font-size: 24px; line-height: 2; }
        .dark .article-body { color: #ffffff !important; }
        .article-body p, .article-body li { color: #000000; }
        .dark .article-body p, .dark .article-body li { color: #ffffff; }
        .main-nav, .main-nav a, .main-nav button { font-size: 20px !important; padding: 12px 16px !important; }
        .text-secondary { font-size: 16px; }
      \`;
      break;
    default:
      // Default to 29-38
      ageStyle = \`
        .article-body { font-size: 18px; line-height: 1.625; }
        .main-nav, .main-nav a, .main-nav button { font-size: 16px !important; }
        .text-secondary { font-size: 14px; }
      \`;
      break;
  }

  return (
    <div className={\`min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors antialiased \${densityClass}\`}>
      <style>{\`\${ageStyle}\`}</style>`;

if (!content.includes('Terapkan Preset Aksesibilitas Usia Pembaca')) {
  content = content.replace(
    '  return (\n    <div className={`min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors antialiased ${densityClass}`}>',
    styleBlock
  );
  fs.writeFileSync('src/App.tsx', content);
}
