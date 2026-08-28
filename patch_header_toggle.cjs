const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf-8');

if (!content.includes('Moon, Sun')) {
  content = content.replace(
    "import { Heart, ShieldCheck, Zap, Menu, X, UserCheck, FileText, Rss, Baby, Sparkles, BookOpen } from 'lucide-react';",
    "import { Heart, ShieldCheck, Zap, Menu, X, UserCheck, FileText, Rss, Baby, Sparkles, BookOpen, Moon, Sun } from 'lucide-react';"
  );
}

const toggleThemeFn = `
  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      localStorage.setItem('theme_override', 'light');
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme_override', 'dark');
    }
  };
`;

if (!content.includes('toggleTheme')) {
  content = content.replace(
    'const renderIcon = (iconName?: string) => {',
    toggleThemeFn + '\n  const renderIcon = (iconName?: string) => {'
  );
}

const toggleButton = `
            {siteConfig?.enable_theme_toggle !== false && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-2"
                aria-label="Toggle Theme"
              >
                <Sun className="w-5 h-5 hidden dark:block" />
                <Moon className="w-5 h-5 block dark:hidden" />
              </button>
            )}
            
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
`;

if (!content.includes('Toggle Theme')) {
  content = content.replace(
    '<div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2" />',
    toggleButton
  );
  fs.writeFileSync('src/components/Header.tsx', content);
}

