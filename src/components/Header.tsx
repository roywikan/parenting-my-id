import React, { useState } from 'react';
import { Heart, ShieldCheck, Zap, Menu, X, UserCheck, FileText, Rss, Baby, Sparkles, BookOpen, Moon, Sun } from 'lucide-react';
import { User, SiteConfig } from '../types';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  siteConfig?: SiteConfig;
}

export default function Header({ currentView, onNavigate, currentUser, onLogout, siteConfig }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const siteName = siteConfig?.site_name || 'Parenting.my.id';
  const siteTagline = siteConfig?.site_tagline || 'PORTAL EDUKASI POLA ASUH & GIZI ANAK';
  const rawHeaderLinks = siteConfig?.header_nav_links && siteConfig.header_nav_links.length > 0
    ? siteConfig.header_nav_links
    : [
        { label: 'Beranda', url: '/' },
        { label: 'Pola Asuh', url: '/kategori/pola-asuh' },
        { label: 'Tumbuh Kembang', url: '/kategori/tumbuh-kembang' },
        { label: 'Kesehatan & Gizi', url: '/kategori/kesehatan-gizi' },
        { label: 'Balita', url: '/balita' },
        { label: 'Sitemap', url: '/sitemap.xml' },
        { label: 'RSS Feed', url: '/feed.xml' }
      ];

  const customHamburgerLinks = siteConfig?.hamburger_nav_links && siteConfig.hamburger_nav_links.length > 0
    ? siteConfig.hamburger_nav_links
    : null;

  const handleMobileNavClick = (url: string, e?: React.MouseEvent) => {
    setMobileMenuOpen(false);
    if (url === '/' || url === '/home') {
      if (e) e.preventDefault();
      onNavigate('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (url.startsWith('/kategori/')) {
      if (e) e.preventDefault();
      const slug = url.replace('/kategori/', '');
      const catMap: Record<string, string> = {
        'pola-asuh': 'Pola Asuh',
        'tumbuh-kembang': 'Tumbuh Kembang',
        'kesehatan-gizi': 'Kesehatan & Gizi',
        'balita': 'Balita'
      };
      onNavigate('category', catMap[slug] || slug);
    } else if (url === '/balita') {
      if (e) e.preventDefault();
      onNavigate('category', 'Balita');
    } else if (url === '/pola-asuh') {
      if (e) e.preventDefault();
      onNavigate('category', 'Pola Asuh');
    } else if (url === '/tumbuh-kembang') {
      if (e) e.preventDefault();
      onNavigate('category', 'Tumbuh Kembang');
    } else if (url === '/kesehatan-gizi') {
      if (e) e.preventDefault();
      onNavigate('category', 'Kesehatan & Gizi');
    } else if (url === '/admin') {
      if (e) e.preventDefault();
      onNavigate('admin');
    }
  };

  
  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      localStorage.setItem('theme_override', 'light');
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme_override', 'dark');
    }
  };

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Baby': return <Baby className="w-5 h-5 fill-current" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 fill-current" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 fill-current" />;
      default: return <Heart className="w-5 h-5 fill-current" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-rose-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO BRAND */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                {renderIcon(siteConfig?.site_logo_icon)}
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  {siteName}
                </span>
                <span className="block text-[10px] text-slate-700 dark:text-slate-300 font-semibold tracking-wide uppercase">
                  {siteTagline}
                </span>
              </div>
            </button>

            {/* EDGE PERFORMANCE BADGE */}
            {(siteConfig?.show_header_badge ?? siteConfig?.show_edge_badge ?? true) && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-[11px] text-emerald-900 dark:text-emerald-200 font-bold ml-3">
                <Zap className="w-3.5 h-3.5 fill-current text-emerald-700 dark:text-emerald-400" />
                <span>{siteConfig?.header_badge_text || 'Cloudflare D1 Edge Engine'}</span>
              </div>
            )}
          </div>

          {/* DESKTOP NAVIGATION (TOP BAR) */}
          <nav className="main-nav hidden md:flex items-center gap-1 min-h-[40px] h-[40px]">
            {rawHeaderLinks.map((link, idx) => {
              const isExternalOrXml = link.url.startsWith('http') || link.url.endsWith('.xml');
              const isHome = link.url === '/' || link.url === '/home' || link.label === 'Beranda';
              const isActive = isHome && currentView === 'home';

              if (isExternalOrXml) {
                return (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                  >
                    <span>{link.label}</span>
                  </a>
                );
              }

              return (
                <a
                  key={idx}
                  href={link.url}
                  onClick={(e) => handleMobileNavClick(link.url, e)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 font-extrabold border border-rose-200/80 dark:border-rose-900'
                      : 'font-semibold text-slate-800 dark:text-slate-100 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}

            {siteConfig?.enable_theme_toggle !== false && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-2"
                aria-label="Toggle Theme"
              >
                <Sun className="w-5 h-5 hidden dark:block" />
                <Moon className="w-5 h-5 block dark:hidden" />
              </button>
            )}
            
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2" />


            {/* ADMIN PORTAL BUTTON */}
            {currentUser && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('admin')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all ${
                    currentView === 'admin'
                      ? 'bg-rose-600 text-white shadow-rose-500/25'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-600'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                  <span>{siteConfig?.mobile_admin_btn_label || 'Portal Admin'} ({currentUser.role.toUpperCase()})</span>
                </button>
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white dark:bg-rose-950/50 transition-colors"
                  title="Keluar / Logout (Hard Link: /admin?logout=true)"
                >
                  Keluar
                </button>
              </div>
            )}
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
          {customHamburgerLinks ? (
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Menu Utama (Navigasi Mobile)
              </span>
              {customHamburgerLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  onClick={(e) => handleMobileNavClick(link.url, e)}
                  target={link.url.startsWith('http') || link.url.endsWith('.xml') ? '_blank' : '_self'}
                  rel="noreferrer"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-600 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  onNavigate('home');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm font-extrabold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-slate-800"
              >
                Beranda
              </button>

              <div className="pt-1 pb-1 border-t border-b border-slate-100 dark:border-slate-800 space-y-1">
                <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Kategori Artikel</span>
                {[
                  { label: 'Pola Asuh', name: 'Pola Asuh' },
                  { label: 'Tumbuh Kembang', name: 'Tumbuh Kembang' },
                  { label: 'Kesehatan & Gizi', name: 'Kesehatan & Gizi' },
                  { label: 'Balita', name: 'Balita' },
                ].map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => {
                      onNavigate('category', cat.name);
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-slate-800"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {rawHeaderLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  onClick={(e) => handleMobileNavClick(link.url, e)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50"
                >
                  {link.label}
                </a>
              ))}
            </>
          )}
          {currentUser && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-rose-600 text-white shadow-md"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {siteConfig?.mobile_show_logged_username && currentUser ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : siteConfig?.mobile_admin_btn_label || 'Portal Admin & Editor'}
                </span>
              </button>
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 rounded-xl text-xs font-bold bg-slate-100 text-rose-600 dark:bg-slate-800"
              >
                Logout / Keluar
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
