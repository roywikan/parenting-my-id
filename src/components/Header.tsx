import { useState } from 'react';
import { Heart, Zap, Menu, X, FileText, Rss } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export default function Header({ currentView, onNavigate }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-rose-100 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO BRAND */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  Parenting<span className="text-rose-500 font-extrabold">.my.id</span>
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                  EDUKASI ANAK DAN ORTU
                </span>
              </div>
            </button>

            {/* EDGE PERFORMANCE BADGE */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium ml-3">
              <Zap className="w-3.5 h-3.5 fill-current text-emerald-500" />
              <span>Cloudflare D1 Edge Engine</span>
            </div>
          </div>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'home'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Beranda
            </button>

            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Sitemap</span>
            </a>

            <a
              href="/feed.xml"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Rss className="w-3.5 h-3.5 text-amber-500" />
              <span>RSS Feed</span>
            </a>
          </nav>

          {/* MOBILE MENU TOGGLE */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-2">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950"
          >
            Beranda Artikel
          </button>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50"
          >
            📄 Live Sitemap.xml
          </a>
          <a
            href="/feed.xml"
            target="_blank"
            rel="noreferrer"
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50"
          >
            📡 Live RSS Feed.xml
          </a>
        </div>
      )}
    </header>
  );
}
