const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const injectClassCode = `  // Terapkan Skala Tipografi
  let densityClass = 'text-base leading-relaxed tracking-normal'; // Standard
  if (siteConfig?.font_density_scale === 'compact') {
    densityClass = 'text-sm leading-snug tracking-tight';
  } else if (siteConfig?.font_density_scale === 'spacious') {
    densityClass = 'text-[17px] md:text-lg leading-loose tracking-wide';
  }

  return (
    <div className={\`min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors antialiased \${densityClass}\`}>`;

if (!content.includes('densityClass')) {
  content = content.replace(
    '  return (\n    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors antialiased">',
    injectClassCode
  );
  fs.writeFileSync('src/App.tsx', content);
}
