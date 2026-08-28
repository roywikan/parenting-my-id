const fs = require('fs');
let content = fs.readFileSync('src/views/AdminPortal.tsx', 'utf-8');

// Section 0
const section0End = `                ))}
              </div>
            </div>`;

const section0Inject = `                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mode Tema Default (default_theme_mode)
                  </label>
                  <select
                    value={cfgDefaultThemeMode}
                    onChange={(e) => setCfgDefaultThemeMode(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="auto">Auto Detect OS</option>
                    <option value="light">Bright Mode (Light)</option>
                    <option value="dark">Dark Mode (Night)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Skala Kerapatan Tipografi (font_density_scale)
                  </label>
                  <select
                    value={cfgFontDensityScale}
                    onChange={(e) => setCfgFontDensityScale(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="compact">Dense & Compact</option>
                    <option value="standard">Standard Balanced</option>
                    <option value="spacious">Spacious & Accessible</option>
                  </select>
                </div>
              </div>
            </div>`;

if (!content.includes('Mode Tema Default (default_theme_mode)')) {
  content = content.replace(section0End, section0Inject);
}

// Section 1
const section1End = `                  <input
                    type="text"
                    value={cfgSiteTagline}
                    onChange={(e) => setCfgSiteTagline(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>`;

const section1Inject = `                  <input
                    type="text"
                    value={cfgSiteTagline}
                    onChange={(e) => setCfgSiteTagline(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Domain Website (site_domain)
                  </label>
                  <input
                    type="text"
                    value={cfgSiteDomain}
                    onChange={(e) => setCfgSiteDomain(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                    placeholder="parenting.my.id"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Label/Badge Header (header_badge_text)
                  </label>
                  <input
                    type="text"
                    value={cfgHeaderBadgeText}
                    onChange={(e) => setCfgHeaderBadgeText(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>`;

if (!content.includes('Domain Website (site_domain)')) {
  content = content.replace(section1End, section1Inject);
}

// Section 3
const section3End = `                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Hero Banner (hero_title)
                  </label>`;

const section3Inject = `                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Badge/Label Hero (hero_badge_text)
                  </label>
                  <input
                    type="text"
                    value={cfgHeroBadgeText}
                    onChange={(e) => setCfgHeroBadgeText(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500 mb-4"
                  />
                  
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Hero Banner (hero_title)
                  </label>`;
if (!content.includes('Badge/Label Hero (hero_badge_text)')) {
  content = content.replace(section3End, section3Inject);
}

// Section 4
const section4End = `              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Facebook URL</label>`;

const section4Inject = `              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Label Autolink Footer (footer_autolink_label)
                  </label>
                  <input
                    type="text"
                    value={cfgFooterAutolinkLabel}
                    onChange={(e) => setCfgFooterAutolinkLabel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Badge 1</label>
                    <input type="text" value={cfgFooterBadge1} onChange={(e) => setCfgFooterBadge1(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Badge 2</label>
                    <input type="text" value={cfgFooterBadge2} onChange={(e) => setCfgFooterBadge2(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Badge 3</label>
                    <input type="text" value={cfgFooterBadge3} onChange={(e) => setCfgFooterBadge3(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Facebook URL</label>`;
if (!content.includes('Label Autolink Footer (footer_autolink_label)')) {
  content = content.replace(section4End, section4Inject);
}

// Section 5 (or autolink ticker label)
const section5End = `            {/* SECTION 5: LAYOUT & ARTIKEL */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>5. Pengaturan Artikel & Layout</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">`;

const section5Inject = `            {/* SECTION 5: LAYOUT & ARTIKEL */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>5. Pengaturan Artikel & Layout</span>
              </h4>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Label Ticker Autolink (autolink_ticker_label)
                </label>
                <input
                  type="text"
                  value={cfgAutolinkTickerLabel}
                  onChange={(e) => setCfgAutolinkTickerLabel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">`;
if (!content.includes('Label Ticker Autolink (autolink_ticker_label)')) {
  content = content.replace(section5End, section5Inject);
}

fs.writeFileSync('src/views/AdminPortal.tsx', content);
