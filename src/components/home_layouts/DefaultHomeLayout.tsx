import { Post, AutoLink, SiteConfig } from '../../types';
import { Search, Clock, Eye, Sparkles, ArrowRight, BookOpen, Zap } from 'lucide-react';
import AdSlot from '../AdSlot';
import HeroPerformanceBox from '../HeroPerformanceBox';
import { optimizeUnsplashUrl, getUnsplashSrcSet, getOptimizedAvatarUrl } from '../../lib/imageUtils';

interface LayoutProps {
  posts: Post[];
  autolinks: AutoLink[];
  onSelectPost: (slug: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  siteConfig?: SiteConfig;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredPosts: Post[];
  categories: string[];
  isKeywordMatchFallback?: boolean;
  isLatestFallback?: boolean;
  fallbackPosts?: Post[];
}

export default function DefaultHomeLayout({
  posts,
  autolinks,
  onSelectPost,
  selectedCategory,
  onSelectCategory,
  siteConfig,
  searchQuery,
  setSearchQuery,
  filteredPosts,
  categories,
  isKeywordMatchFallback = false,
  isLatestFallback = false,
  fallbackPosts = [],
}: LayoutProps) {
  const showHero = siteConfig?.show_hero_section ?? true;
  const heroTitle = siteConfig?.hero_title || 'Panduan Pengasuhan Anak Terpercaya';
  const heroSubtitle = siteConfig?.hero_subtitle || 'Temukan artikel, tips nutrisi, dan edukasi tumbuh kembang anak untuk orang tua modern.';
  const heroCtaText = siteConfig?.hero_cta_text || 'Jelajahi Artikel';
  const heroCtaLink = siteConfig?.hero_cta_link || '#artikel-terbaru';

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.length > 0 ? (selectedCategory === 'Semua' && !searchQuery ? filteredPosts.slice(1) : filteredPosts) : [];

  return (
    <div className="space-y-10">
      {/* HERO BANNER SECTION */}
      {showHero && (
        <section className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-rose-500/15 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-rose-100 border border-white/20">
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
                <span>{siteConfig?.tech_badge_hero || 'Cloudflare D1 Edge Architecture • TTFB < 20ms'}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {heroTitle}
              </h1>
              <p className="text-rose-100 text-sm sm:text-base leading-relaxed">
                {heroSubtitle}
              </p>
              {heroCtaText && (
                <div className="pt-2">
                  <a
                    href={heroCtaLink}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-rose-900 font-black text-xs shadow-lg hover:bg-rose-50 transition-all hover:scale-105"
                  >
                    <span>{heroCtaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* PERFORMANCE METRICS BOX */}
            <HeroPerformanceBox siteConfig={siteConfig} />
          </div>
        </section>
      )}

      {/* TRENDING TOPICS TICKER */}
      {autolinks.length > 0 && (
        <div className="bg-rose-50/70 dark:bg-slate-800/60 border border-rose-200 dark:border-slate-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 min-h-[60px]">
          <div className="flex items-center gap-1.5 text-xs font-black text-rose-800 dark:text-rose-300 shrink-0 uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
            <span>{siteConfig?.autolink_ticker_label || 'Topik Trending:'}</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none min-h-[36px]">
            {autolinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  const targetSlug = link.targetUrl.split('/').pop() || '';
                  if (targetSlug) onSelectPost(targetSlug);
                }}
                className="h-[32px] px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 hover:border-rose-500 hover:text-rose-700 dark:hover:text-rose-300 transition-all shadow-2xs font-bold inline-flex items-center gap-1 group shrink-0 whitespace-nowrap leading-none"
              >
                <span>#{link.keyword}</span>
                <span className="text-[10px] text-rose-700 dark:text-rose-300 font-black group-hover:translate-x-0.5 transition-transform">↗</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FEATURED POST */}
      {featuredPost && !searchQuery && selectedCategory === 'Semua' && (
        <section
          className="group cursor-pointer h-auto lg:h-[420px] rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900"
          onClick={() => onSelectPost(featuredPost.slug)}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-auto lg:h-[420px] w-full overflow-hidden">
            <div className="lg:col-span-7 relative aspect-[16/9] lg:aspect-auto h-64 sm:h-72 lg:h-[420px] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
              <img
                src={optimizeUnsplashUrl(featuredPost.featuredImage, 700, 55)}
                srcSet={getUnsplashSrcSet(featuredPost.featuredImage, [400, 700], 55)}
                sizes="(max-width: 1024px) 100vw, 700px"
                alt={featuredPost.title}
                width={700}
                height={394}
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 min-h-[28px] flex items-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-rose-800 text-white text-xs font-black shadow-md uppercase tracking-wider leading-none">
                  UTAMA • {featuredPost.category}
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between h-auto lg:h-[420px] overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 font-semibold shrink-0 min-h-[20px]">
                  <span className="flex items-center gap-1 font-bold">
                    <Clock className="w-3.5 h-3.5 shrink-0 text-slate-600 dark:text-slate-400" />
                    {featuredPost.readTimeMinutes} menit baca
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-bold">
                    <Eye className="w-3.5 h-3.5 shrink-0 text-slate-600 dark:text-slate-400" />
                    {featuredPost.views} pembaca
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors leading-snug">
                  {featuredPost.title}
                </h2>

                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed line-clamp-3 min-h-[3.75rem] sm:min-h-[4.5rem]">
                  {featuredPost.excerpt}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <img
                    src={getOptimizedAvatarUrl(featuredPost.authorAvatar, 60, 60)}
                    alt={featuredPost.authorName}
                    width={36}
                    height={36}
                    decoding="async"
                    className="w-9 h-9 rounded-full object-cover border border-rose-300 shrink-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {featuredPost.authorName}
                    </div>
                    <div className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold">Tim Pakar Parenting</div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-black text-rose-800 dark:text-rose-300 group-hover:translate-x-1 transition-transform shrink-0 whitespace-nowrap self-start sm:self-auto pt-1 sm:pt-0">
                  Baca Selengkapnya
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CUSTOM BANNER: BOTTOM OF FIRST HALF PAGE */}
      {siteConfig?.ad_banner_first_half_code && (
        <AdSlot
          code={siteConfig.ad_banner_first_half_code}
          enableAdsense={siteConfig.ad_banner_first_half_enable ?? true}
          slotLabel="BOTTOM OF FIRST HALF PAGE"
        />
      )}

      {/* SEARCH BAR & CATEGORIES */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari artikel atau kata kunci di ${siteConfig?.site_name || 'website'}...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-rose-700 text-white shadow-sm shadow-rose-500/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-rose-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ARTICLES GRID */}
      <section className="space-y-6" id="artikel-terbaru">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <span>
              {isLatestFallback
                ? `Artikel Terkini Pilihan`
                : isKeywordMatchFallback
                ? `Artikel Terkait ("${selectedCategory}")`
                : searchQuery
                ? `Hasil Pencarian ("${searchQuery}")`
                : selectedCategory === 'Semua'
                ? 'Daftar Artikel Terbaru'
                : `Kategori: ${selectedCategory}`}
            </span>
          </h2>
          <span className="text-xs text-slate-700 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {regularPosts.length} Artikel {isLatestFallback ? 'Terkini' : 'ditemukan'}
          </span>
        </div>

        {/* INFORMATIVE NOTICE BANNER FOR UNMAPPED ROUTE / FALLBACK */}
        {isLatestFallback && (
          <div className="p-4.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3.5 shadow-2xs">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold text-sm">Topik atau halaman yang Anda cari tidak ditemukan</p>
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                Halaman <code className="bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900 dark:text-amber-200">{selectedCategory}</code> tidak tersedia. Berikut 4 artikel pilihan terbaru untuk Anda agar tetap mendapatkan informasi pengasuhan anak yang bermanfaat:
              </p>
            </div>
          </div>
        )}

        {isKeywordMatchFallback && (
          <div className="p-4.5 rounded-2xl bg-rose-50/90 dark:bg-slate-800/80 border border-rose-200 dark:border-slate-700 flex items-start gap-3.5 shadow-2xs">
            <Sparkles className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-bold text-sm text-slate-900 dark:text-white">Artikel Terkait Berdasarkan Kata Kunci</p>
              <p className="leading-relaxed">
                Kategori spesifik untuk <code className="bg-rose-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono font-bold text-rose-700 dark:text-rose-300">{selectedCategory}</code> tidak ditemukan, namun berikut 4 artikel rekomendasi hasil pencocokan kata kunci untuk Anda:
              </p>
            </div>
          </div>
        )}

        {/* ARTICLES LIST CARDS */}
        {regularPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => onSelectPost(post.slug)}
                className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={optimizeUnsplashUrl(post.featuredImage, 400, 50)}
                      srcSet={getUnsplashSrcSet(post.featuredImage, [300, 400], 50)}
                      sizes="(max-width: 768px) 100vw, 400px"
                      alt={post.title}
                      width={400}
                      height={225}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-700/90 text-white text-[10px] font-bold backdrop-blur-xs">
                      {post.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{post.readTimeMinutes} menit baca</span>
                      <span>•</span>
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span>{post.views} pembaca</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60 mt-4 pt-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={getOptimizedAvatarUrl(post.authorAvatar, 40, 40)}
                      alt={post.authorName}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover border border-rose-200 shrink-0"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {post.authorName}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0 whitespace-nowrap">
                    Baca <span>→</span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Tidak ada artikel yang sesuai kata kunci pencarian
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Coba gunakan kata kunci lain atau lihat 4 artikel terbaru pilihan di bawah ini.
              </p>
            </div>

            {/* FALLBACK 4 LATEST ARTICLES INSTEAD OF EMPTY PAGE */}
            {fallbackPosts.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  <span>Rekomendasi 4 Artikel Terbaru Untuk Anda</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {fallbackPosts.slice(0, 4).map((post) => (
                    <article
                      key={post.id}
                      onClick={() => onSelectPost(post.slug)}
                      className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img
                            src={optimizeUnsplashUrl(post.featuredImage, 300, 50)}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                            {post.category}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-rose-600 transition-colors">
                            {post.title}
                          </h4>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* STRATEGIC AD PLACEMENT: SIDEBAR / IN-FEED */}
      <AdSlot
        code={siteConfig?.adsense_sidebar}
        enableAdsense={siteConfig?.enable_adsense}
        slotLabel="IN-FEED STRATEGIC BANNER"
      />
    </div>
  );
}
