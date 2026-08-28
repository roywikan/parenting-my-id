const fs = require('fs');

let content = fs.readFileSync('src/views/AdminPortal.tsx', 'utf-8');

// 1. Add THEME_PRESETS import
if (!content.includes('THEME_PRESETS')) {
  content = content.replace(
    "import { Heart, ShieldCheck, Settings, BookOpen, PenTool, LayoutTemplate, Share2, LogOut, Search, Plus, Edit3, Trash2, X, Link, CheckCircle2, AlertCircle, Save, HelpCircle, Eye, EyeOff, Layout, List, Globe, Navigation, Search as SearchIcon, FileText, Image as ImageIcon, Menu, Palette, RefreshCw, UserCheck } from 'lucide-react';",
    "import { Heart, ShieldCheck, Settings, BookOpen, PenTool, LayoutTemplate, Share2, LogOut, Search, Plus, Edit3, Trash2, X, Link, CheckCircle2, AlertCircle, Save, HelpCircle, Eye, EyeOff, Layout, List, Globe, Navigation, Search as SearchIcon, FileText, Image as ImageIcon, Menu, Palette, RefreshCw, UserCheck, Droplet } from 'lucide-react';\nimport { THEME_PRESETS } from '../lib/themes';"
  );
}

// 2. Add cfgActiveThemePreset state
if (!content.includes('cfgActiveThemePreset')) {
  content = content.replace(
    "const [cfgSiteName, setCfgSiteName] = useState(siteConfig?.site_name || 'Parenting.my.id');",
    "const [cfgActiveThemePreset, setCfgActiveThemePreset] = useState(siteConfig?.active_theme_preset || 'corp-blue');\n  const [cfgSiteName, setCfgSiteName] = useState(siteConfig?.site_name || 'Parenting.my.id');"
  );
  
  content = content.replace(
    "setCfgSiteName(siteConfig.site_name || 'Parenting.my.id');",
    "setCfgActiveThemePreset(siteConfig.active_theme_preset || 'corp-blue');\n      setCfgSiteName(siteConfig.site_name || 'Parenting.my.id');"
  );
  
  content = content.replace(
    "site_name: cfgSiteName,",
    "active_theme_preset: cfgActiveThemePreset,\n        site_name: cfgSiteName,"
  );
}

// 3. Add UI for Theme selection
const themeSection = `
            {/* SECTION 0: TEMA (TAMPILAN & PALET) */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Droplet className="w-4 h-4" />
                <span>0. Tema, Tampilan & Tipografi</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {THEME_PRESETS.map((preset) => (
                  <label
                    key={preset.id}
                    className={\`cursor-pointer border-2 rounded-xl p-3 flex items-center gap-3 transition-all \${cfgActiveThemePreset === preset.id ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700'}\`}
                  >
                    <input
                      type="radio"
                      name="theme_preset"
                      value={preset.id}
                      checked={cfgActiveThemePreset === preset.id}
                      onChange={(e) => setCfgActiveThemePreset(e.target.value)}
                      className="hidden"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{preset.name}</span>
                        <div className="flex">
                          <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: preset.colors.primary }}></span>
                          <span className="w-4 h-4 rounded-full border border-black/10 -ml-1" style={{ backgroundColor: preset.colors.secondary }}></span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                        <span>{preset.category.replace('_', ' ').toUpperCase()}</span>
                        <span className="truncate max-w-[80px]" title={preset.fonts.sans.split(',')[0].replace(/"/g, '')}>{preset.fonts.sans.split(',')[0].replace(/"/g, '')}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
`;

if (!content.includes('SECTION 0: TEMA')) {
  content = content.replace(
    "{/* SECTION 1: HEADER & IDENTITY */}",
    themeSection + "\n            {/* SECTION 1: HEADER & IDENTITY */}"
  );
}

fs.writeFileSync('src/views/AdminPortal.tsx', content);
