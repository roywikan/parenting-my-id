const fs = require('fs');
let content = fs.readFileSync('src/views/AdminPortal.tsx', 'utf-8');

const heroCtaTextEnd = `                  <input
                    type="text"
                    value={cfgHeroCtaText}
                    onChange={(e) => setCfgHeroCtaText(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>`;

const heroCtaInject = `                  <input
                    type="text"
                    value={cfgHeroCtaText}
                    onChange={(e) => setCfgHeroCtaText(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL Tujuan CTA Hero (hero_cta_link)
                </label>
                <input
                  type="text"
                  value={cfgHeroCtaLink}
                  onChange={(e) => setCfgHeroCtaLink(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                />
              </div>`;

if (!content.includes('URL Tujuan CTA Hero')) {
  content = content.replace(heroCtaTextEnd, heroCtaInject);
}

fs.writeFileSync('src/views/AdminPortal.tsx', content);
