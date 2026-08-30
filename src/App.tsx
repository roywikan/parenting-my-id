import { useState, useEffect, lazy, Suspense } from 'react';
import { Post, AutoLink, User, SiteConfig } from './types';
import { INITIAL_POSTS, INITIAL_AUTOLINKS, INITIAL_USERS } from './data/initialData';
import { getSiteConfig, saveSiteConfig } from './lib/config';
import { THEME_PRESETS } from './lib/themes';
import { categoryToSlug, slugToCategory } from './lib/categories';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './views/HomeView';
import ArticleDetailView from './views/ArticleDetailView';
import AdSlot from './components/AdSlot';

const AdminPortal = lazy(() => import('./views/AdminPortal'));

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'article' | 'admin'>('home');
  const [activeSlug, setActiveSlug] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [autolinks, setAutolinks] = useState<AutoLink[]>(INITIAL_AUTOLINKS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | undefined>(undefined);
  const [liveDraftConfig, setLiveDraftConfig] = useState<SiteConfig | undefined>(undefined);

  const effectiveConfig = liveDraftConfig || siteConfig;

  // Fetch Posts, Autolinks & Config on initial mount
  useEffect(() => {
    fetchPosts();
    fetchAutolinks();
    fetchConfig();

    // Check saved session
    const savedUser = localStorage.getItem('parenting_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('parenting_user');
      }
    }
  }, []);

// Manage Dark Mode
  useEffect(() => {
    if (!effectiveConfig) return;
    const mode = effectiveConfig.default_theme_mode || 'auto';
    const root = document.documentElement;
    const override = localStorage.getItem('theme_override');
    
    if (override === 'dark') {
      root.classList.add('dark');
    } else if (override === 'light') {
      root.classList.remove('dark');
    } else if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [effectiveConfig?.default_theme_mode]);

  useEffect(() => {
    if (effectiveConfig?.active_theme_preset) {
      const theme = THEME_PRESETS.find(t => t.id === effectiveConfig.active_theme_preset);
      if (theme) {
        document.documentElement.style.setProperty('--color-primary', theme.colors.primary);
        document.documentElement.style.setProperty('--color-secondary', theme.colors.secondary);
        document.documentElement.style.setProperty('--font-sans', theme.fonts.sans);
        document.documentElement.style.setProperty('--font-heading', theme.fonts.heading);
      }
    } else {
      document.documentElement.style.removeProperty('--color-primary');
      document.documentElement.style.removeProperty('--color-secondary');
      document.documentElement.style.removeProperty('--font-sans');
      document.documentElement.style.removeProperty('--font-heading');
    }
  }, [effectiveConfig?.active_theme_preset]);

  const fetchConfig = async () => {
    try {
      const cfg = await getSiteConfig();
      setSiteConfig(cfg);
    } catch (err) {
      console.error('Error fetching site config:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPosts(data);
        }
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const fetchAutolinks = async () => {
    try {
      const res = await fetch('/api/autolinks');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAutolinks(data);
        }
      }
    } catch (err) {
      console.error('Error fetching autolinks:', err);
    }
  };

  // Handle Login
  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data: any = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('parenting_user', JSON.stringify(data.user));
          return true;
        }
      }
    } catch (err) {
      console.error('Login error:', err);
    }

    // Client-side fallback (e.g. for static Cloudflare Pages / GitHub Pages)
    if (email === 'admin@parenting.my.id' && pass === 'admin123') {
      const adminUser = INITIAL_USERS[0];
      setCurrentUser(adminUser);
      localStorage.setItem('parenting_user', JSON.stringify(adminUser));
      return true;
    } else if (email === 'penulis@parenting.my.id' && pass === 'writer123') {
      const writerUser = INITIAL_USERS[1];
      setCurrentUser(writerUser);
      localStorage.setItem('parenting_user', JSON.stringify(writerUser));
      return true;
    }

    return false;
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('parenting_user');
    setCurrentView('home');
  };

  // Handle Save Config
  const handleSaveConfig = async (newConfig: SiteConfig): Promise<boolean> => {
    const ok = await saveSiteConfig(newConfig);
    if (ok) {
      setSiteConfig(newConfig);
    }
    return ok;
  };

  // Handle Update Admin Credentials in D1
  const handleUpdateCredentials = async (id: number, data: { name: string; email: string; password?: string; avatar?: string; bio?: string }) => {
    try {
      const res = await fetch('/api/auth/update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const result: any = await res.json();
        if (result.user) {
          setCurrentUser(result.user);
          localStorage.setItem('parenting_user', JSON.stringify(result.user));
          return { success: true, user: result.user };
        }
      }
      return { success: false, error: 'Gagal memperbarui kredensial.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Terjadi kesalahan jaringan.' };
    }
  };

  // Handle Save Post (Create / Update / Draft)
  const handleSavePost = async (postData: Partial<Post>): Promise<Post | void> => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      if (res.ok) {
        const data: any = await res.json();
        await fetchPosts();
        return data.post;
      }
    } catch (err) {
      console.error('Error saving post:', err);
    }
  };

  // Handle Delete Post
  const handleDeletePost = async (id: number) => {
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchPosts();
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  // Handle Add Autolink
  const handleAddAutolink = async (linkData: Partial<AutoLink>) => {
    try {
      const res = await fetch('/api/autolinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkData),
      });
      if (res.ok) {
        await fetchAutolinks();
      }
    } catch (err) {
      console.error('Error adding autolink:', err);
    }
  };

  // Handle Delete Autolink
  const handleDeleteAutolink = async (id: number) => {
    try {
      const res = await fetch(`/api/autolinks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAutolinks();
      }
    } catch (err) {
      console.error('Error deleting autolink:', err);
    }
  };

  // Parse route from URL on mount and popstate
  useEffect(() => {
    const syncRouteFromUrl = () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('logout') === 'true') {
        handleLogout();
        window.history.replaceState({}, '', '/admin');
        setCurrentView('admin');
        return;
      }

      const path = window.location.pathname;
      if (path === '/admin') {
        setCurrentView('admin');
      } else if (path.startsWith('/baca/')) {
        const slug = path.replace('/baca/', '');
        if (slug) {
          setActiveSlug(slug);
          setCurrentView('article');
        } else {
          setCurrentView('home');
          setSelectedCategory('Semua');
        }
      } else if (path.startsWith('/kategori/')) {
        const catSlug = path.replace('/kategori/', '');
        const availableCats = posts.map((p) => p.category);
        const resolved = slugToCategory(catSlug, availableCats);
        setSelectedCategory(resolved);
        setCurrentView('home');
      } else if (path !== '/' && !path.includes('.')) {
        // Direct route e.g. /balita, /pola-asuh, /tumbuh-kembang
        const rawSlug = path.replace(/^\//, '');
        const availableCats = posts.map((p) => p.category);
        const resolved = slugToCategory(rawSlug, availableCats);
        if (resolved && resolved !== 'Semua') {
          setSelectedCategory(resolved);
          setCurrentView('home');
        } else {
          setCurrentView('home');
          setSelectedCategory('Semua');
        }
      } else {
        setCurrentView('home');
        setSelectedCategory('Semua');
        setActiveSlug('');
      }
    };

    syncRouteFromUrl();
    window.addEventListener('popstate', syncRouteFromUrl);
    return () => window.removeEventListener('popstate', syncRouteFromUrl);
  }, [posts]);

  // Navigation Helper
  const handleNavigate = (view: string, param?: string) => {
    if (view === 'article' && param) {
      setActiveSlug(param);
      setCurrentView('article');
      window.history.pushState({}, '', `/baca/${param}`);
    } else if (view === 'category' && param) {
      if (param === 'Semua') {
        setSelectedCategory('Semua');
        setCurrentView('home');
        window.history.pushState({}, '', '/');
      } else {
        setSelectedCategory(param);
        setCurrentView('home');
        const catSlug = categoryToSlug(param);
        window.history.pushState({}, '', `/kategori/${catSlug}`);
      }
    } else if (view === 'admin') {
      setCurrentView('admin');
      window.history.pushState({}, '', '/admin');
    } else {
      setCurrentView('home');
      setSelectedCategory('Semua');
      setActiveSlug('');
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Terapkan Skala Tipografi
  let densityClass = 'text-base leading-relaxed tracking-normal'; // Standard
  if (effectiveConfig?.font_density_scale === 'compact') {
    densityClass = 'text-sm leading-snug tracking-tight';
  } else if (effectiveConfig?.font_density_scale === 'spacious') {
    densityClass = 'text-[17px] md:text-lg leading-loose tracking-wide';
  }

  // Terapkan Ukuran Font Direct & Preset Aksesibilitas Usia Pembaca
  let fontScaleCss = '';
  if (effectiveConfig?.font_size_scale) {
    switch (effectiveConfig.font_size_scale) {
      case 'small': fontScaleCss = 'html { font-size: 14px !important; }'; break;
      case 'normal': fontScaleCss = 'html { font-size: 16px !important; }'; break;
      case 'large': fontScaleCss = 'html { font-size: 18px !important; }'; break;
      case 'xlarge': fontScaleCss = 'html { font-size: 20px !important; }'; break;
    }
  }

  let ageStyle = '';
  switch (effectiveConfig?.age_accessibility_preset) {
    case '18-28':
      ageStyle = `
        .article-body { font-size: 1.05rem; line-height: 1.625; }
        .main-nav, .main-nav a, .main-nav button { font-size: 1rem !important; }
        .text-secondary { font-size: 0.8rem; opacity: 0.8; }
      `;
      break;
    case '29-38':
      ageStyle = `
        .article-body { font-size: 1.15rem; line-height: 1.65; }
        .main-nav, .main-nav a, .main-nav button { font-size: 1rem !important; }
        .text-secondary { font-size: 0.875rem; }
      `;
      break;
    case '39-48':
      ageStyle = `
        .article-body { font-size: 1.25rem; line-height: 1.8; }
        .main-nav, .main-nav a, .main-nav button { font-size: 1.1rem !important; font-weight: bold; }
        .text-secondary { font-size: 0.9rem; }
      `;
      break;
    case '49-58':
      ageStyle = `
        .article-body { font-size: 1.4rem; line-height: 2; }
        .dark .article-body { color: #ffffff !important; }
        .article-body p, .article-body li { color: #000000; }
        .dark .article-body p, .dark .article-body li { color: #ffffff; }
        .main-nav, .main-nav a, .main-nav button { font-size: 1.25rem !important; padding: 12px 16px !important; }
        .text-secondary { font-size: 1rem; }
      `;
      break;
    default:
      ageStyle = `
        .article-body { font-size: 1.125rem; line-height: 1.625; }
        .main-nav, .main-nav a, .main-nav button { font-size: 1rem !important; }
        .text-secondary { font-size: 0.875rem; }
      `;
      break;
  }

  return (
    <div className={`min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors antialiased ${densityClass}`}>
      <style>{`${fontScaleCss} ${ageStyle}`}</style>
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        siteConfig={effectiveConfig}
      />

      {/* STRATEGIC AD PLACEMENT: HEADER TOP BANNER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <AdSlot
          code={effectiveConfig?.adsense_header_top}
          enableAdsense={effectiveConfig?.enable_adsense}
          slotLabel="HEADER TOP BANNER (STRATEGIC HIGH CTR)"
        />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {currentView === 'home' && (
          <HomeView
            posts={posts}
            autolinks={autolinks}
            onSelectPost={(slug) => handleNavigate('article', slug)}
            selectedCategory={selectedCategory}
            onSelectCategory={(category) => handleNavigate('category', category)}
            siteConfig={effectiveConfig}
          />
        )}

        {currentView === 'article' && (
          <ArticleDetailView
            slug={activeSlug}
            posts={posts}
            autolinks={autolinks}
            onBack={() => handleNavigate('home')}
            onSelectPost={(slug) => handleNavigate('article', slug)}
            onSelectCategory={(category) => handleNavigate('category', category)}
            siteConfig={effectiveConfig}
          />
        )}

        {currentView === 'admin' && (
          <Suspense fallback={
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500 font-bold">Memuat Portal Admin & Editor CMS...</p>
            </div>
          }>
            <AdminPortal
              currentUser={currentUser}
              onLogin={handleLogin}
              onLogout={handleLogout}
              posts={posts}
              autolinks={autolinks}
              onSavePost={handleSavePost}
              onDeletePost={handleDeletePost}
              onAddAutolink={handleAddAutolink}
              onDeleteAutolink={handleDeleteAutolink}
              siteConfig={effectiveConfig}
              onSaveConfig={handleSaveConfig}
              onUpdateCredentials={handleUpdateCredentials}
              onLivePreviewChange={setLiveDraftConfig}
            />
          </Suspense>
        )}
      </main>

      <Footer siteConfig={effectiveConfig} onNavigate={(view, param) => handleNavigate(view, param)} />

      {/* STICKY FOOTER AD BANNER */}
      {effectiveConfig?.enable_adsense !== false && effectiveConfig?.adsense_sticky_footer && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 shadow-2xl p-2 flex items-center justify-center">
          <div className="relative max-w-4xl w-full flex items-center justify-center">
            <AdSlot
              code={effectiveConfig.adsense_sticky_footer}
              enableAdsense={effectiveConfig.enable_adsense}
              slotLabel="STICKY FOOTER BANNER"
            />
          </div>
        </div>
      )}
    </div>
  );
} 
