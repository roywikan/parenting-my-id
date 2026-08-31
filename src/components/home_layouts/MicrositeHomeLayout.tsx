import { useState } from 'react';
import { Post, SiteConfig } from '../../types';
import { Share2, Check, BookOpen, MessageCircle, Download, ExternalLink, Headphones, ShoppingBag, Sparkles, Heart } from 'lucide-react';
import { optimizeUnsplashUrl, getOptimizedAvatarUrl } from '../../lib/imageUtils';

interface LayoutProps {
  posts: Post[];
  onSelectPost: (slug: string) => void;
  siteConfig?: SiteConfig;
}

export default function MicrositeHomeLayout({ posts, onSelectPost, siteConfig }: LayoutProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickLinks = [
    {
      title: siteConfig?.microsite_wa_label || 'Konsultasi Privat Parenting (WhatsApp)',
      desc: 'Jadwalkan sesi tanya jawab 1-on-1 bersama tim dokter anak & psikolog',
      icon: MessageCircle,
      url: `https://wa.me/${siteConfig?.microsite_wa_number || '6281234567890'}?text=Halo%20Admin%20Parenting%20saya%20ingin%20konsultasi`,
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      badge: 'Respon Cepat',
    },
    {
      title: 'Unduh E-Book Gratis: 50 Resep MPASI Anti-GTM',
      desc: 'Panduan lengkap variasi menu bergizi kaya zat besi dan protein hewani',
      icon: Download,
      url: siteConfig?.microsite_ebook_url || '#',
      color: 'bg-rose-600 hover:bg-rose-500 text-white',
      badge: 'Download Gratis',
    },
    {
      title: 'Gabung Komunitas Telegram Orang Tua Cerdas',
      desc: 'Diskusi harian & sharing pengalaman sesama ayah dan bunda se-Indonesia',
      icon: ExternalLink,
      url: siteConfig?.microsite_telegram_url || 'https://t.me/parentingmyid',
      color: 'bg-sky-600 hover:bg-sky-500 text-white',
      badge: 'Komunitas',
    },
    {
      title: 'Dengarkan Podcast: Cerita Pola Asuh Modern',
      desc: 'Episode mingguan seputar manajemen emosi dan komunikasi dengan anak',
      icon: Headphones,
      url: siteConfig?.microsite_podcast_url || 'https://spotify.com',
      color: 'bg-indigo-600 hover:bg-indigo-500 text-white',
      badge: 'Spotify / Apple',
    },
    {
      title: 'Official Store: Buku & Flashcard Stimulasi Anak',
      desc: 'Media edukasi teruji untuk melatih motorik halus dan perkembangan bahasa',
      icon: ShoppingBag,
      url: siteConfig?.microsite_shop_url || '#',
      color: 'bg-amber-600 hover:bg-amber-500 text-white',
      badge: 'Official Shop',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* PROFILE HEADER CARD */}
      <section className="text-center p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative inline-block">
          <img
            src={siteConfig?.site_logo_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&h=200&fit=crop&q=80'}
            alt="Profile Avatar"
            className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-rose-500 shadow-md"
          />
          <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-rose-600 text-white shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {siteConfig?.microsite_title || siteConfig?.site_name || 'Parenting.my.id Official Hub'}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase">
              Official
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {siteConfig?.microsite_bio || siteConfig?.site_tagline || 'Pusat informasi, konsultasi dokter anak, panduan MPASI, dan komunitas orang tua cerdas di Indonesia.'}
          </p>
        </div>

        {/* SHARE BUTTON */}
        <div className="pt-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tautan Disalin!' : 'Bagikan Halaman'}</span>
          </button>
        </div>
      </section>

      {/* QUICK LINK ACTION BUTTONS */}
      <section className="space-y-3">
        {quickLinks.map((link, idx) => (
          <a
            key={idx}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="group block p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-2xl ${link.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                  <link.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                    {link.title}
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-1">{link.desc}</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase shrink-0">
                {link.badge}
              </span>
            </div>
          </a>
        ))}
      </section>

      {/* FEATURED QUICK ARTICLES */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-rose-500" />
            <span>Artikel Pilihan Terbaru</span>
          </h2>
        </div>

        <div className="space-y-3">
          {posts.slice(0, 4).map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectPost(post.slug)}
              className="cursor-pointer group p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all flex items-center gap-3.5"
            >
              <img
                src={optimizeUnsplashUrl(post.featuredImage, 150, 40)}
                alt={post.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">
                  {post.category}
                </span>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-rose-600 transition-colors">
                  {post.title}
                </h3>
              </div>
              <span className="text-xs font-bold text-rose-600 group-hover:translate-x-1 transition-transform shrink-0">
                →
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
