const fs = require('fs');
let content = fs.readFileSync('src/views/AdminPortal.tsx', 'utf-8');

// 1. Add site_logo_url, enable_search_bar, enable_theme_toggle to Section 1
const section1End = `              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Singkat Website (site_description)
                </label>`;

const section1Inject = `              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Logo URL (site_logo_url)
                  </label>
                  <input
                    type="text"
                    value={cfgSiteLogoUrl}
                    onChange={(e) => setCfgSiteLogoUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                    placeholder="https://.../logo.png"
                  />
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={cfgEnableSearchBar}
                      onChange={(e) => setCfgEnableSearchBar(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Aktifkan Kolom Pencarian (enable_search_bar)</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={cfgEnableThemeToggle}
                      onChange={(e) => setCfgEnableThemeToggle(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Aktifkan Toggle Tema (enable_theme_toggle)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Singkat Website (site_description)
                </label>`;

if (!content.includes('Logo URL (site_logo_url)')) {
  content = content.replace(section1End, section1Inject);
}

// 2. Add footer_menu_links to Section 4
const section4End = `              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">`;
const section4Inject = `              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Menu Footer (footer_menu_links dalam Format JSON)
                </label>
                <textarea
                  value={cfgFooterMenuLinks}
                  onChange={(e) => setCfgFooterMenuLinks(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">`;

if (!content.includes('Menu Footer (footer_menu_links dalam Format JSON)')) {
  content = content.replace(section4End, section4Inject);
}

// 3. Add Section 5: Layout & Articles and Section 6: Sidebar before the Login Admin section
const sectionLoginAdminStart = `            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-rose-500" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Teks Halaman Login Admin</h4>`;

const sections56Inject = `            {/* SECTION 5: LAYOUT & ARTIKEL */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>5. Pengaturan Artikel & Layout</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Artikel Per Halaman (posts_per_page)
                  </label>
                  <input
                    type="number"
                    value={cfgPostsPerPage}
                    onChange={(e) => setCfgPostsPerPage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipe Pagination (pagination_type)
                  </label>
                  <select
                    value={cfgPaginationType}
                    onChange={(e) => setCfgPaginationType(e.target.value as 'load_more' | 'infinite_scroll' | 'numbered')}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="load_more">Load More Button</option>
                    <option value="numbered">Numbered Pages (1, 2, 3)</option>
                    <option value="infinite_scroll">Infinite Scroll</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={cfgEnableFeaturedPost}
                      onChange={(e) => setCfgEnableFeaturedPost(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tampilkan Artikel Pilihan (enable_featured_post)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* SECTION 6: SIDEBAR */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layout className="w-4 h-4" />
                <span>6. Pengaturan Sidebar</span>
              </h4>
              
              <div className="flex items-center mb-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={cfgShowSidebar}
                    onChange={(e) => setCfgShowSidebar(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tampilkan Sidebar (show_sidebar)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Artikel Populer Widget (popular_posts_count)
                  </label>
                  <input
                    type="number"
                    value={cfgPopularPostsCount}
                    onChange={(e) => setCfgPopularPostsCount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Batas Widget Kategori (categories_widget_limit)
                  </label>
                  <input
                    type="number"
                    value={cfgCategoriesWidgetLimit}
                    onChange={(e) => setCfgCategoriesWidgetLimit(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kode HTML Banner Iklan Sidebar (sidebar_banner_code)
                </label>
                <textarea
                  value={cfgSidebarBannerCode}
                  onChange={(e) => setCfgSidebarBannerCode(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                  placeholder="<!-- Masukkan Script Banner HTML/Adsense disini -->"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-rose-500" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Teks Halaman Login Admin</h4>`;

if (!content.includes('Pengaturan Artikel & Layout')) {
  content = content.replace(sectionLoginAdminStart, sections56Inject);
}

fs.writeFileSync('src/views/AdminPortal.tsx', content);
