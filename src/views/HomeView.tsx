import { useState, useMemo } from 'react';
import { Post, AutoLink, SiteConfig } from '../types';
import { Search, Clock, Eye, Sparkles, ArrowRight, ShieldCheck, Zap, BookOpen, Tag } from 'lucide-react';
import SEOHelper from '../components/SEOHelper';
import AdSlot from '../components/AdSlot';

interface HomeViewProps {
  posts: Post[];
  autolinks: AutoLink[];
  onSelectPost: (slug: string) => void;
  selectedCategory?: string;
  onSelectCategory: (category: string) => void;
  siteConfig?: SiteConfig;
}

export default function HomeView({ posts, autolinks, onSelectPost, selectedCategory: propSelectedCategory, onSelectCategory, siteConfig }: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalCategory, setInternalCategory] = useState<string>('Semua');

  const activeCategory = propSelectedCategory !== undefined ? propSelectedCategory : internalCategory;

  const handleCategoryChange = (cat: string) => {
    setInternalCategory(cat);
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
  };

  const showHero = siteConfig?.show_hero_section ?? true;
  const heroTitle = siteConfig?.hero_title || 'Panduan Pengasuhan Anak Terpercaya';
  const heroSubtitle = siteConfig?.hero_subtitle || 'Temukan artikel, tips nutrisi, dan edukasi tumbuh kembang anak untuk orang tua modern.';
  const heroCtaText = siteConfig?.hero_cta_text || 'Jelajahi Artikel';
  const heroCtaLink = siteConfig?.hero_cta_link || '#artikel-terbaru';

  const isFilteredCategory = activeCategory !== 'Semua';
  const metaTitle = isFilteredCategory
    ? `Artikel Kategori ${activeCategory} - ${siteConfig?.site_name || 'Parenting.my.id'}`
    : siteConfig?.seo_meta_title || 'Parenting.my.id - Edukasi Pola Asuh & Kesehatan Anak Indonesia';
  const metaDesc = isFilteredCategory
    ? `Kumpulan artikel, tips, dan panduan seputar ${activeCategory} untuk orang tua modern.`
    : siteConfig?.seo_meta_description || 'Portal artikel parenting modern, panduan pola asuh, nutrisi balita, dan pencegahan stunting. Cepat, akurat, dan terpercaya.';
  const ogImage = siteConfig?.seo_default_og_image || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200&h=630';

  const publishedPosts = useMemo(() => {
    return posts.filter((p) => p.status === 'published');
  }, [posts]);

  // Categories list
  const categories = ['Semua', 'Pola Asuh', 'Tumbuh Kembang', 'Kesehatan & Gizi', 'Balita'];

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return publishedPosts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.toLowerCase().includes(searchQuery.toLowerCase());
      
      const targetCat = activeCategory.toLowerCase();
      const matchesCategory =
        activeCategory === 'Semua' ||
        post.category.toLowerCase() === targetCat ||
        post.tags.toLowerCase().includes(targetCat);

      return matchesSearch && matchesCategory;
    });
  }, [publishedPosts, searchQuery, activeCategory]);

  const featuredPost = publishedPosts[0];
  const regularPosts = filteredPosts.length > 0 ? (activeCategory === 'Semua' && !searchQuery ? filteredPosts.slice(1) : filteredPosts) : [];

  return (
    <div className="space-y-12 pb-16">
      <SEOHelper
        title={metaTitle}
        description={metaDesc}
        image={ogImage}
      />

      {/* HERO BANNER SECTION */}
      {showHero && (
        <section className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-rose-500/15 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-rose-100 border border-white/20">
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
                <span>Cloudflare D1 Edge Architecture • TTFB &lt; 20ms</span>
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-rose-600 font-extrabold text-xs shadow-lg hover:bg-rose-50 transition-all hover:scale-105"
                  >
                    <span>{heroCtaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* PERFORMANCE METRICS BOX (CUSTOMIZABLE BY ADMIN) */}
            {siteConfig?.show_performance_box !== false && (
              <div className="grid grid-cols-3 gap-3 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center w-full md:w-auto shrink-0">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">
                    {siteConfig?.metric1_value ?? '99+'}
                  </div>
                  <div className="text-[10px] text-rose-200 uppercase font-semibold">
                    {siteConfig?.metric1_label ?? 'Kecepatan'}
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">
                    {siteConfig?.metric2_value ?? '100'}
                  </div>
                  <div className="text-[10px] text-rose-200 uppercase font-semibold">
                    {siteConfig?.metric2_label ?? 'Kualitas'}
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">
                    {siteConfig?.metric3_value ?? '0ms'}
                  </div>
                  <div className="text-[10px] text-rose-200 uppercase font-semibold">
                    {siteConfig?.metric3_label ?? 'Respon Delay'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TRENDING TOPICS TICKER */}
      {autolinks.length > 0 && (
        <div className="bg-rose-50/70 dark:bg-slate-800/60 border border-rose-100 dark:border-slate-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 min-h-[60px]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 shrink-0 uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
            <span>{siteConfig?.autolink_ticker_label || 'Topik Trending:'}</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
            {autolinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  const targetSlug = link.targetUrl.split('/').pop() || '';
                  if (targetSlug) onSelectPost(targetSlug);
                }}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 hover:border-rose-400 hover:text-rose-600 transition-all shadow-2xs font-medium flex items-center gap-1 group shrink-0 whitespace-nowrap"
              >
                <span>#{link.keyword}</span>
                <span className="text-[10px] text-rose-500 font-bold group-hover:translate-x-0.5 transition-transform">↗</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FEATURED POST (HERO ITEM) */}
      {featuredPost && !searchQuery && activeCategory === 'Semua' && (
        <section className="group cursor-pointer min-h-[380px]" onClick={() => onSelectPost(featuredPost.slug)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[380px]">
            <div className="lg:col-span-7 relative aspect-[16/9] lg:aspect-none h-64 sm:h-72 lg:h-full min-h-[256px] lg:min-h-[380px] overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
              <img
                src={featuredPost.featuredImage}
                alt={featuredPost.title}
                width={1200}
                height={675}
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold shadow-md uppercase tracking-wider">
                  UTAMA • {featuredPost.category}
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between min-h-[320px] lg:min-h-[380px]">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    {featuredPost.readTimeMinutes} menit baca
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    {featuredPost.views} pembaca
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors leading-snug">
                  {featuredPost.title}
                </h2>

                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-3">
                  {featuredPost.excerpt}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between min-h-[58px] shrink-0">
                <div className="flex items-center gap-3 shrink-0">
                  <img
                    src={featuredPost.authorAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80'}
                    alt={featuredPost.authorName}
                    width={36}
                    height={36}
                    decoding="async"
                    className="w-9 h-9 rounded-full object-cover border border-rose-200 shrink-0"
                  />
                  <div className="shrink-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {featuredPost.authorName}
                    </div>
                    <div className="text-[10px] text-slate-500">Tim Pakar Parenting</div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform shrink-0">
                  Baca Selengkapnya
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SEARCH BAR & CATEGORIES */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* SEARCH INPUT */}
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

          {/* CATEGORY PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-rose-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ARTICLES GRID */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <span>
              {searchQuery
                ? `Hasil Pencarian ("${searchQuery}")`
                : activeCategory === 'Semua'
                ? 'Daftar Artikel Terbaru'
                : `Kategori: ${activeCategory}`}
            </span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {regularPosts.length} Artikel ditemukan
          </span>
        </div>

        {/* SIDEBAR / GRID AD SLOT */}
        <AdSlot
          code={siteConfig?.adsense_sidebar}
          enableAdsense={siteConfig?.enable_adsense}
          slotLabel="SIDEBAR / IN-FEED AD (HIGH CTR)"
        />

        {regularPosts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <Tag className="w-10 h-10 text-rose-400 mx-auto opacity-80" />
            <p className="text-slate-700 dark:text-slate-300 font-medium">
              Tidak ada artikel yang cocok dengan pencarian Anda.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                handleCategoryChange('Semua');
              }}
              className="text-xs text-rose-600 font-bold underline hover:text-rose-700"
            >
              Reset Filter Pencarian
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => onSelectPost(post.slug)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      width={600}
                      height={338}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {post.readTimeMinutes} mnt
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.views}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors leading-snug line-clamp-2">
                      {post.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-2 flex items-center justify-between text-xs pt-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={post.authorAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80'}
                      alt={post.authorName}
                      width={24}
                      height={24}
                      decoding="async"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                      {post.authorName}
                    </span>
                  </div>
                  <span className="text-rose-600 font-bold group-hover:translate-x-0.5 transition-transform">
                    Baca ↗
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
