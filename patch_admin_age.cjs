const fs = require('fs');
let content = fs.readFileSync('src/views/AdminPortal.tsx', 'utf-8');

if (!content.includes('cfgAgeAccessibilityPreset')) {
  // State
  content = content.replace(
    "const [cfgFontDensityScale, setCfgFontDensityScale] = useState<'compact'|'standard'|'spacious'>(siteConfig?.font_density_scale || 'standard');",
    "const [cfgFontDensityScale, setCfgFontDensityScale] = useState<'compact'|'standard'|'spacious'>(siteConfig?.font_density_scale || 'standard');\n  const [cfgAgeAccessibilityPreset, setCfgAgeAccessibilityPreset] = useState<'18-28'|'29-38'|'39-48'|'49-58'>(siteConfig?.age_accessibility_preset || '29-38');"
  );

  // set
  content = content.replace(
    "setCfgFontDensityScale(siteConfig.font_density_scale || 'standard');",
    "setCfgFontDensityScale(siteConfig.font_density_scale || 'standard');\n      setCfgAgeAccessibilityPreset(siteConfig.age_accessibility_preset || '29-38');"
  );

  // save
  content = content.replace(
    "font_density_scale: cfgFontDensityScale,",
    "font_density_scale: cfgFontDensityScale,\n        age_accessibility_preset: cfgAgeAccessibilityPreset,"
  );

  // UI
  const uiEnd = `                  </select>
                </div>
              </div>
            </div>`;
  const uiInject = `                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Preset Aksesibilitas Usia Pembaca (age_accessibility_preset)
                  </label>
                  <select
                    value={cfgAgeAccessibilityPreset}
                    onChange={(e) => setCfgAgeAccessibilityPreset(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="18-28">18–28 Tahun (Muda/Compact)</option>
                    <option value="29-38">29–38 Tahun (Dewasa/Standar)</option>
                    <option value="39-48">39–48 Tahun (Nyaman/Lega)</option>
                    <option value="49-58">49–58+ Tahun (Mata Tua / Senior Accessible)</option>
                  </select>
                </div>
              </div>
            </div>`;
  content = content.replace(uiEnd, uiInject);

  fs.writeFileSync('src/views/AdminPortal.tsx', content);
}
