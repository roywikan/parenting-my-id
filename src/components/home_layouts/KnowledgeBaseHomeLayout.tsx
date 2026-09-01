import { useState, useMemo } from 'react';
import { Post, SiteConfig } from '../../types';
import { Search, BookOpen, HelpCircle, FileText, ChevronRight, Sparkles, FolderOpen, Tag, ArrowRight } from 'lucide-react';
import HeroPerformanceBox from '../HeroPerformanceBox';
import { optimizeUnsplashUrl } from '../../lib/imageUtils';

interface LayoutProps {
  posts: Post[];
  onSelectPost: (slug: string) => void;
  siteConfig?: SiteConfig;
}

export default function KnowledgeBaseHomeLayout({ posts, onSelectPost, siteConfig }: LayoutProps) {
  const [kbQuery, setKbQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('Semua');

  const topics = [
    { name: 'Semua', count: posts.length, icon: BookOpen },
    { name: 'Gizi & Nutrisi', count: posts.filter(p => p.category.toLowerCase().includes('gizi') || p.category.toLowerCase().includes('nutrisi') || p.category.toLowerCase().includes('mpasi')).length, icon: FileText },
    { name: 'Psikologi Anak', count: posts.filter(p => p.category.toLowerCase().includes('psikologi') || p.category.toLowerCase().includes('emosi') || p.category.toLowerCase().includes('pola')).length, icon: Sparkles },
    { name: 'Kesehatan & Medis', count: posts.filter(p => p.category.toLowerCase().includes('kesehatan') || p.category.toLowerCase().includes('medis') || p.category.toLowerCase().includes('imunisasi')).length, icon: HelpCircle },
    { name: 'Tumbuh Kembang', count: posts.filter(p => p.category.toLowerCase().includes('tumbuh') || p.category.toLowerCase().includes('stimulasi')).length, icon: FolderOpen },
  ];

  const filteredArticles = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(kbQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(kbQuery.toLowerCase()) ||
        post.category.toLowerCase().includes(kbQuery.toLowerCase());
      
      const matchesTopic =
        selectedTopic === 'Semua' ||
        post.category.toLowerCase().includes(selectedTopic.toLowerCase().split(' ')[0]);

      return matchesSearch && matchesTopic;
    });
  }, [posts, kbQuery, selectedTopic]);

  return (
    <div className="space-y-12">
      {/* KNOWLEDGE BASE SEARCH HERO */}
      <section className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-2xl text-center space-y-6 relative overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-rose-300 text-xs font-black uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{siteConfig?.kb_badge_text || 'Ensiklopedia & Pusat Bantuan Parenting'}</span>
        </div>

        <div className="max-w-2xl mx-auto space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {siteConfig?.kb_title || 'Bagaimana Kami Bisa Membantu Pengasuhan Anda?'}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            {siteConfig?.kb_subtitle || 'Cari jawaban terpercaya dari ribuan artikel, panduan medis, dan rekomendasi dokter spesialis anak.'}
          </p>
        </div>

        {/* SEARCH INPUT */}
        <div className="max-w-xl mx-auto relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={kbQuery}
            onChange={(e) => setKbQuery(e.target.value)}
            placeholder={siteConfig?.kb_search_placeholder || 'Ketik topik (misal: jadwal MPASI, anak demam, speech delay, tantrum)...'}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 font-semibold text-sm shadow-2xl focus:outline-hidden focus:ring-4 focus:ring-rose-500/40"
          />
        </div>

        {/* PERFORMANCE METRICS BOX */}
        <div className="pt-2 max-w-xl mx-auto">
          <HeroPerformanceBox siteConfig={siteConfig} />
        </div>
      </section>

      {/* TOPIC SELECTION CARDS */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {topics.map((t) => (
          <button
            key={t.name}
            onClick={() => setSelectedTopic(t.name)}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              selectedTopic === t.name
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-rose-500'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl ${selectedTopic === t.name ? 'bg-white/20' : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'}`}>
                <t.icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${selectedTopic === t.name ? 'bg-white text-rose-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {t.count}
              </span>
            </div>
            <div className="font-bold text-xs sm:text-sm">{t.name}</div>
          </button>
        ))}
      </section>

      {/* SEARCH RESULTS / ARTICLES DIRECTORY */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-rose-500" />
              <span>Direktori Artikel ({filteredArticles.length} Panduan)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan kumpulan modul berbasis sains terkini.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectPost(post.slug)}
              className="cursor-pointer group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:shadow-lg transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {post.readTimeMinutes} menit baca
                  </span>
                </div>

                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">Oleh: {post.authorName}</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Pelajari Panduan</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
