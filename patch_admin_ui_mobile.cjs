const fs = require('fs');
let content = fs.readFileSync('src/views/AdminPortal.tsx', 'utf-8');

const targetStr = `                  <input
                    type="text"
                    value={cfgSiteFaviconUrl}
                    onChange={(e) => setCfgSiteFaviconUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>`;

const newStr = `                  <input
                    type="text"
                    value={cfgSiteFaviconUrl}
                    onChange={(e) => setCfgSiteFaviconUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Label Tombol Admin Mobile (mobile_admin_btn_label)
                  </label>
                  <input
                    type="text"
                    value={cfgMobileAdminBtnLabel}
                    onChange={(e) => setCfgMobileAdminBtnLabel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                    placeholder="Portal Admin & Editor"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfgMobileShowLoggedUsername}
                      onChange={(e) => setCfgMobileShowLoggedUsername(e.target.checked)}
                      className="w-5 h-5 text-rose-600 rounded border-slate-300 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tampilkan Nama User Saat Login di Tombol Admin Mobile (mobile_show_logged_username)
                    </span>
                  </label>
                </div>
              </div>`;

if (!content.includes('Tampilkan Nama User Saat Login')) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync('src/views/AdminPortal.tsx', content);
}
