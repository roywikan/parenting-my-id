import React from 'react';
import { Heart, ShieldCheck, Zap, Database, GitBranch, ArrowUpRight } from 'lucide-react';
import { SiteConfig } from '../types';

interface FooterProps {
  siteConfig?: SiteConfig;
  onNavigate?: (view: string, param?: string) => void;
}

export default function Footer({ siteConfig, onNavigate }: FooterProps) {
  const siteName = siteConfig?.site_name || 'Parenting.my.id';
  const aboutText = siteConfig?.footer_about_text || 'Parenting.my.id menghadirkan bacaan berkualitas seputar dunia pengasuhan anak, kesehatan keluarga, dan pendidikan anak usia dini.';
  const copyrightText = siteConfig?.footer_copyright_text || `© ${new Date().getFullYear()} Parenting.my.id. Hak Cipta Dilindungi Undang-Undang.`;
  const footerLinks = siteConfig?.footer_menu_links || [
    { label: 'Dynamic Sitemap.xml', url: '/sitemap.xml' },
    { label: 'Dynamic RSS Feed', url: '/feed.xml' },
  ];

  const categoryLinks = siteConfig?.footer_category_links && siteConfig.footer_category_links.length > 0
    ? siteConfig.footer_category_links
    : [
        { label: 'Pola Asuh', url: '/kategori/pola-asuh' },
        { label: 'Tumbuh Kembang', url: '/kategori/tumbuh-kembang' },
        { label: 'Kesehatan & Gizi', url: '/kategori/kesehatan-gizi' },
        { label: 'Balita', url: '/balita' },
      ];

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    if (!onNavigate) return;
    if (url === '/' || url === '/home') {
      e.preventDefault();
      onNavigate('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (url.startsWith('/kategori/')) {
      e.preventDefault();
      const slug = url.replace('/kategori/', '');
      const catMap: Record<string, string> = {
        'pola-asuh': 'Pola Asuh',
        'tumbuh-kembang': 'Tumbuh Kembang',
        'kesehatan-gizi': 'Kesehatan & Gizi',
        'balita': 'Balita'
      };
      onNavigate('category', catMap[slug] || slug);
    } else if (url === '/balita') {
      e.preventDefault();
      onNavigate('category', 'Balita');
    } else if (url === '/pola-asuh') {
      e.preventDefault();
      onNavigate('category', 'Pola Asuh');
    } else if (url === '/tumbuh-kembang') {
      e.preventDefault();
      onNavigate('category', 'Tumbuh Kembang');
    } else if (url === '/kesehatan-gizi') {
      e.preventDefault();
      onNavigate('category', 'Kesehatan & Gizi');
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* BRAND COLUMN */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center text-white">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                {siteName}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              {aboutText}
            </p>

            {/* TECH STACK BADGES */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-rose-300 font-medium">
                <Zap className="w-3 h-3 text-amber-400" /> Cloudflare Pages Edge
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-sky-300 font-medium">
                <Database className="w-3 h-3 text-sky-400" /> Cloudflare D1 SQLite
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-purple-300 font-medium">
                <GitBranch className="w-3 h-3 text-purple-400" /> GitHub REST Storage
              </span>
            </div>
          </div>

          {/* QUICK LINKS / KATEGORI ARTIKEL */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
              Kategori Artikel
            </h4>
            <ul className="space-y-2.5 text-sm">
              {categoryLinks.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.url}
                    onClick={(e) => handleLinkClick(item.url, e)}
                    target={item.url.startsWith('http') || item.url.endsWith('.xml') ? '_blank' : '_self'}
                    rel="noreferrer"
                    className="text-slate-400 hover:text-rose-400 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>• {item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* SEO & INFRASTRUCTURE */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
              Tautan Navigasi Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              {footerLinks.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.url}
                    target={item.url.startsWith('http') || item.url.endsWith('.xml') ? '_blank' : '_self'}
                    rel="noreferrer"
                    className="text-slate-400 hover:text-rose-400 transition-colors inline-flex items-center gap-1"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>{copyrightText}</p>
          <div className="flex items-center gap-4">
            {siteConfig?.social_facebook && (
              <a href={siteConfig.social_facebook} target="_blank" rel="noreferrer" className="hover:text-rose-400">Facebook</a>
            )}
            {siteConfig?.social_instagram && (
              <a href={siteConfig.social_instagram} target="_blank" rel="noreferrer" className="hover:text-rose-400">Instagram</a>
            )}
            {siteConfig?.social_twitter && (
              <a href={siteConfig.social_twitter} target="_blank" rel="noreferrer" className="hover:text-rose-400">Twitter/X</a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
