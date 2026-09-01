import { useState } from 'react';
import { Post, SiteConfig } from '../../types';
import { Sparkles, Eye, ArrowRight, ExternalLink, Award, CheckCircle2, BookOpen } from 'lucide-react';
import HeroPerformanceBox from '../HeroPerformanceBox';
import { optimizeUnsplashUrl } from '../../lib/imageUtils';

interface LayoutProps {
  posts: Post[];
  onSelectPost: (slug: string) => void;
  siteConfig?: SiteConfig;
}

export default function PortfolioHomeLayout({ posts, onSelectPost, siteConfig }: LayoutProps) {
  const [activeFilter, setActiveFilter] = useState('Semua');

  const filters = ['Semua', 'Publikasi Riset', 'Program Edukasi', 'Konsultasi Klinis', 'Buku Panduan'];

  const portfolioItems = [
    {
      title: 'Program Modul MPASI Terpadu 100 Desa',
      category: 'Program Edukasi',
      client: 'Kementerian Kesehatan & NGO Mitra',
      image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&h=400&fit=crop&q=80',
      stats: '15.000+ Balita Teredukasi',
      desc: 'Pengembangan kurikulum nutrisi padat protein hewani berbasis pangan lokal untuk kader posyandu.',
    },
    {
      title: 'Buku Pedoman: Pengasuhan Positif Tanpa Emosi',
      category: 'Buku Panduan',
      client: 'Penerbit Edukasi Keluarga',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=400&fit=crop&q=80',
      stats: 'Best Seller 25.000 Eksemplar',
      desc: 'Karya literasi panduan psikologi perkembangan emosi anak usia dini bagi orang tua milenial.',
    },
    {
      title: 'Studi Klinis Intervensi Sensori Integrasi Balita',
      category: 'Publikasi Riset',
      client: 'Jurnal Pediatrik Terakreditasi',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop&q=80',
      stats: '94% Peningkatan Fokus',
      desc: 'Penelitian efektivitas stimulasi taktil dan vestibular terhadap konsentrasi belajar anak pra-sekolah.',
    },
    {
      title: 'Layanan Tele-Konseling Parenting 24/7',
      category: 'Konsultasi Klinis',
      client: 'Yayasan Peduli Anak Sehat',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=400&fit=crop&q=80',
      stats: '8.500+ Sesi Terlayani',
      desc: 'Platform konsultasi psikologi dan medis respons cepat bagi ibu dengan sindrom baby blues.',
    },
  ];

  const filteredItems = activeFilter === 'Semua'
    ? portfolioItems
    : portfolioItems.filter((item) => item.category === activeFilter);

  return (
    <div className="space-y-12">
      {/* PORTFOLIO HERO */}
      <section className="text-center max-w-3xl mx-auto space-y-4 py-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-black uppercase tracking-wider">
          <Award className="w-3.5 h-3.5" />
          <span>{siteConfig?.portfolio_badge_text || 'Showcase Portofolio & Rekam Jejak'}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {siteConfig?.portfolio_title || 'Karya, Program Edukasi & Penelitian Parenting'}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
          {siteConfig?.portfolio_subtitle || 'Dedikasi nyata dalam merancang program edukasi keluarga, publikasi ilmiah terakreditasi, dan buku panduan pengasuhan berstandar medis.'}
        </p>

        {/* METRICS ROW */}
        <div className="grid grid-cols-3 gap-4 pt-4 max-w-lg mx-auto">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-2xl font-black text-rose-600">{siteConfig?.portfolio_stat1_val || '50K+'}</div>
            <div className="text-[11px] font-bold text-slate-500">{siteConfig?.portfolio_stat1_lbl || 'Keluarga Terbantu'}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-2xl font-black text-rose-600">{siteConfig?.portfolio_stat2_val || '120+'}</div>
            <div className="text-[11px] font-bold text-slate-500">{siteConfig?.portfolio_stat2_lbl || 'Workshop Nasional'}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-2xl font-black text-rose-600">{siteConfig?.portfolio_stat3_val || '15+'}</div>
            <div className="text-[11px] font-bold text-slate-500">{siteConfig?.portfolio_stat3_lbl || 'Riset Terpublikasi'}</div>
          </div>
        </div>

        {/* PERFORMANCE METRICS BOX */}
        <div className="pt-2 max-w-lg mx-auto">
          <HeroPerformanceBox
            siteConfig={siteConfig}
            containerClassName="gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm text-center"
            valueClassName="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400"
            labelClassName="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase"
          />
        </div>
      </section>

      {/* FILTER BUTTONS */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeFilter === f
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-500'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* PORTFOLIO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredItems.map((item, idx) => (
          <div
            key={idx}
            className="group rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all space-y-4"
          >
            <div className="aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase shadow-md">
                  {item.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                  {item.stats}
                </span>
              </div>
            </div>

            <div className="p-6 pt-0 space-y-3">
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Klien: {item.client}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CASE STUDIES ARTICLES */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <span>Dokumentasi Studi Kasus & Tulisan Terbaru</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.slice(0, 3).map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectPost(post.slug)}
              className="cursor-pointer group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all space-y-3"
            >
              <div className="aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={optimizeUnsplashUrl(post.featuredImage, 400, 50)}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">
                {post.category}
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-rose-600 transition-colors">
                {post.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
