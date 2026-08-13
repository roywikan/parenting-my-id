import React, { useState, useEffect, useRef } from 'react';
import { Post, AutoLink, User, SiteConfig } from '../types';
import { 
  ShieldCheck, FileText, Link as LinkIcon, Plus, Trash2, Edit3, Save, 
  Upload, Eye, Sparkles, CheckCircle2, RefreshCw, Bold, Italic, Heading2, 
  Heading3, List, ListOrdered, Quote, Image as ImageIcon, Code, UserCheck, 
  ExternalLink, Search, Zap, AlertCircle, Settings, Key, Copy, Check, 
  LogOut, Globe, Palette, Layout, MessageSquare
} from 'lucide-react';
import { generateSlug } from '../lib/autolink';
import RichPostEditor from '../components/RichPostEditor';

interface AdminPortalProps {
  currentUser: User | null;
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onLogout?: () => void;
  posts: Post[];
  autolinks: AutoLink[];
  onSavePost: (postData: Partial<Post>) => Promise<Post | void>;
  onDeletePost: (id: number) => Promise<void>;
  onAddAutolink: (link: Partial<AutoLink>) => Promise<void>;
  onDeleteAutolink: (id: number) => Promise<void>;
  siteConfig?: SiteConfig;
  onSaveConfig?: (config: SiteConfig) => Promise<boolean>;
  onUpdateCredentials?: (id: number, data: { name: string; email: string; password?: string; avatar?: string; bio?: string }) => Promise<{ success: boolean; user?: User; error?: string }>;
}

export default function AdminPortal({
  currentUser,
  onLogin,
  onLogout,
  posts,
  autolinks,
  onSavePost,
  onDeletePost,
  onAddAutolink,
  onDeleteAutolink,
  siteConfig,
  onSaveConfig,
  onUpdateCredentials,
}: AdminPortalProps) {
  // Login form state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin tabs: 'posts' | 'editor' | 'autolinks' | 'sitemap' | 'config' | 'security'
  const [activeTab, setActiveTab] = useState<'posts' | 'editor' | 'autolinks' | 'sitemap' | 'config' | 'security'>('posts');

  // Editor State
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorSlug, setEditorSlug] = useState('');
  const [editorCategory, setEditorCategory] = useState('Pola Asuh');
  const [editorMarkdown, setEditorMarkdown] = useState('');
  const [editorExcerpt, setEditorExcerpt] = useState('');
  const [editorImage, setEditorImage] = useState('');
  const [editorStatus, setEditorStatus] = useState<'draft' | 'published'>('draft');
  const [editorMetaTitle, setEditorMetaTitle] = useState('');
  const [editorMetaDesc, setEditorMetaDesc] = useState('');
  const [editorTags, setEditorTags] = useState('parenting, anak, keluarga');

  // Auto-Save Draft Status Indicator
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('markdown');
  const [uploadingImage, setUploadingImage] = useState(false);

  // New Autolink Form State
  const [newKeyword, setNewKeyword] = useState('');
  const [newTargetUrl, setNewTargetUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Credentials / Account Edit State
  const [credName, setCredName] = useState(currentUser?.name || '');
  const [credEmail, setCredEmail] = useState(currentUser?.email || '');
  const [credPassword, setCredPassword] = useState('');
  const [credAvatar, setCredAvatar] = useState(currentUser?.avatar || '');
  const [credBio, setCredBio] = useState(currentUser?.bio || '');
  const [credSuccessMsg, setCredSuccessMsg] = useState('');
  const [credErrMsg, setCredErrMsg] = useState('');
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [copiedLogoutLink, setCopiedLogoutLink] = useState(false);

  // Site Config Form State
  const [cfgSiteName, setCfgSiteName] = useState(siteConfig?.site_name || 'Parenting.my.id');
  const [cfgSiteTagline, setCfgSiteTagline] = useState(siteConfig?.site_tagline || 'Edukasi & Pengasuhan Anak Modern');
  const [cfgSiteDescription, setCfgSiteDescription] = useState(siteConfig?.site_description || 'Portal informasi dan panduan pengasuhan anak modern.');
  const [cfgSiteLogoUrl, setCfgSiteLogoUrl] = useState(siteConfig?.site_logo_url || '');
  const [cfgSiteLogoIcon, setCfgSiteLogoIcon] = useState(siteConfig?.site_logo_icon || 'Heart');
  const [cfgSiteFaviconUrl, setCfgSiteFaviconUrl] = useState(siteConfig?.site_favicon_url || '/favicon.ico');
  const [cfgHeaderNavLinks, setCfgHeaderNavLinks] = useState(JSON.stringify(siteConfig?.header_nav_links || [], null, 2));
  const [cfgEnableSearchBar, setCfgEnableSearchBar] = useState(siteConfig?.enable_search_bar ?? true);
  const [cfgEnableThemeToggle, setCfgEnableThemeToggle] = useState(siteConfig?.enable_theme_toggle ?? true);

  const [cfgSeoMetaTitle, setCfgSeoMetaTitle] = useState(siteConfig?.seo_meta_title || 'Parenting.my.id - Edukasi & Pengasuhan Anak');
  const [cfgSeoMetaDesc, setCfgSeoMetaDesc] = useState(siteConfig?.seo_meta_description || 'Portal informasi & panduan pengasuhan anak modern.');
  const [cfgSeoDefaultOgImage, setCfgSeoDefaultOgImage] = useState(siteConfig?.seo_default_og_image || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&h=630');

  const [cfgShowHeroSection, setCfgShowHeroSection] = useState(siteConfig?.show_hero_section ?? true);
  const [cfgHeroTitle, setCfgHeroTitle] = useState(siteConfig?.hero_title || 'Panduan Pengasuhan Anak Terpercaya');
  const [cfgHeroSubtitle, setCfgHeroSubtitle] = useState(siteConfig?.hero_subtitle || 'Temukan artikel, tips nutrisi, dan edukasi tumbuh kembang anak.');
  const [cfgHeroCtaText, setCfgHeroCtaText] = useState(siteConfig?.hero_cta_text || 'Jelajahi Artikel');
  const [cfgHeroCtaLink, setCfgHeroCtaLink] = useState(siteConfig?.hero_cta_link || '#artikel-terbaru');

  const [cfgPostsPerPage, setCfgPostsPerPage] = useState(siteConfig?.posts_per_page || 9);
  const [cfgEnableFeaturedPost, setCfgEnableFeaturedPost] = useState(siteConfig?.enable_featured_post ?? true);
  const [cfgPaginationType, setCfgPaginationType] = useState<'load_more' | 'infinite_scroll' | 'numbered'>(siteConfig?.pagination_type || 'load_more');

  const [cfgShowSidebar, setCfgShowSidebar] = useState(siteConfig?.show_sidebar ?? true);
  const [cfgPopularPostsCount, setCfgPopularPostsCount] = useState(siteConfig?.popular_posts_count || 5);
  const [cfgCategoriesWidgetLimit, setCfgCategoriesWidgetLimit] = useState(siteConfig?.categories_widget_limit || 8);
  const [cfgSidebarBannerCode, setCfgSidebarBannerCode] = useState(siteConfig?.sidebar_banner_code || '');

  const [cfgFooterAboutText, setCfgFooterAboutText] = useState(siteConfig?.footer_about_text || 'Parenting.my.id menghadirkan bacaan berkualitas seputar dunia pengasuhan anak.');
  const [cfgFooterCopyrightText, setCfgFooterCopyrightText] = useState(siteConfig?.footer_copyright_text || '© 2026 Parenting.my.id. Hak Cipta Dilindungi.');
  const [cfgSocialFacebook, setCfgSocialFacebook] = useState(siteConfig?.social_facebook || 'https://facebook.com/parentingmyid');
  const [cfgSocialInstagram, setCfgSocialInstagram] = useState(siteConfig?.social_instagram || 'https://instagram.com/parentingmyid');
  const [cfgSocialTwitter, setCfgSocialTwitter] = useState(siteConfig?.social_twitter || 'https://x.com/parentingmyid');
  const [cfgFooterMenuLinks, setCfgFooterMenuLinks] = useState(JSON.stringify(siteConfig?.footer_menu_links || [], null, 2));

  const [configSuccessMsg, setConfigSuccessMsg] = useState('');
  const [configErrMsg, setConfigErrMsg] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Sync state when props arrive
  useEffect(() => {
    if (currentUser) {
      setCredName(currentUser.name);
      setCredEmail(currentUser.email);
      setCredAvatar(currentUser.avatar || '');
      setCredBio(currentUser.bio || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (siteConfig) {
      setCfgSiteName(siteConfig.site_name);
      setCfgSiteTagline(siteConfig.site_tagline);
      setCfgSiteDescription(siteConfig.site_description);
      setCfgSiteLogoUrl(siteConfig.site_logo_url || '');
      setCfgSiteLogoIcon(siteConfig.site_logo_icon || 'Heart');
      setCfgSiteFaviconUrl(siteConfig.site_favicon_url || '/favicon.ico');
      setCfgHeaderNavLinks(JSON.stringify(siteConfig.header_nav_links || [], null, 2));
      setCfgEnableSearchBar(siteConfig.enable_search_bar ?? true);
      setCfgEnableThemeToggle(siteConfig.enable_theme_toggle ?? true);

      setCfgSeoMetaTitle(siteConfig.seo_meta_title);
      setCfgSeoMetaDesc(siteConfig.seo_meta_description);
      setCfgSeoDefaultOgImage(siteConfig.seo_default_og_image);

      setCfgShowHeroSection(siteConfig.show_hero_section ?? true);
      setCfgHeroTitle(siteConfig.hero_title);
      setCfgHeroSubtitle(siteConfig.hero_subtitle);
      setCfgHeroCtaText(siteConfig.hero_cta_text);
      setCfgHeroCtaLink(siteConfig.hero_cta_link);

      setCfgPostsPerPage(siteConfig.posts_per_page || 9);
      setCfgEnableFeaturedPost(siteConfig.enable_featured_post ?? true);
      setCfgPaginationType(siteConfig.pagination_type || 'load_more');

      setCfgShowSidebar(siteConfig.show_sidebar ?? true);
      setCfgPopularPostsCount(siteConfig.popular_posts_count || 5);
      setCfgCategoriesWidgetLimit(siteConfig.categories_widget_limit || 8);
      setCfgSidebarBannerCode(siteConfig.sidebar_banner_code || '');

      setCfgFooterAboutText(siteConfig.footer_about_text);
      setCfgFooterCopyrightText(siteConfig.footer_copyright_text);
      setCfgSocialFacebook(siteConfig.social_facebook || '');
      setCfgSocialInstagram(siteConfig.social_instagram || '');
      setCfgSocialTwitter(siteConfig.social_twitter || '');
      setCfgFooterMenuLinks(JSON.stringify(siteConfig.footer_menu_links || [], null, 2));
    }
  }, [siteConfig]);

  // Auto-Save Draft Debounce Timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    const success = await onLogin(emailInput, passwordInput);
    setIsLoggingIn(false);
    if (!success) {
      setLoginError('Email atau password tidak terdaftar.');
    }
  };

  // Save Config Handler
  const handleSaveConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveConfig) return;
    setIsSavingConfig(true);
    setConfigSuccessMsg('');
    setConfigErrMsg('');

    try {
      let navParsed = [];
      let footerParsed = [];
      try {
        navParsed = JSON.parse(cfgHeaderNavLinks);
      } catch (err) {
        throw new Error('Format JSON Header Nav Links tidak valid.');
      }
      try {
        footerParsed = JSON.parse(cfgFooterMenuLinks);
      } catch (err) {
        throw new Error('Format JSON Footer Menu Links tidak valid.');
      }

      const updatedCfg: SiteConfig = {
        site_name: cfgSiteName,
        site_tagline: cfgSiteTagline,
        site_description: cfgSiteDescription,
        site_logo_url: cfgSiteLogoUrl,
        site_logo_icon: cfgSiteLogoIcon,
        site_favicon_url: cfgSiteFaviconUrl,
        header_nav_links: navParsed,
        enable_search_bar: cfgEnableSearchBar,
        enable_theme_toggle: cfgEnableThemeToggle,

        seo_meta_title: cfgSeoMetaTitle,
        seo_meta_description: cfgSeoMetaDesc,
        seo_default_og_image: cfgSeoDefaultOgImage,

        show_hero_section: cfgShowHeroSection,
        hero_title: cfgHeroTitle,
        hero_subtitle: cfgHeroSubtitle,
        hero_cta_text: cfgHeroCtaText,
        hero_cta_link: cfgHeroCtaLink,

        posts_per_page: Number(cfgPostsPerPage),
        enable_featured_post: cfgEnableFeaturedPost,
        pagination_type: cfgPaginationType,

        show_sidebar: cfgShowSidebar,
        popular_posts_count: Number(cfgPopularPostsCount),
        categories_widget_limit: Number(cfgCategoriesWidgetLimit),
        sidebar_banner_code: cfgSidebarBannerCode,

        footer_about_text: cfgFooterAboutText,
        footer_copyright_text: cfgFooterCopyrightText,
        social_facebook: cfgSocialFacebook,
        social_instagram: cfgSocialInstagram,
        social_twitter: cfgSocialTwitter,
        footer_menu_links: footerParsed,
      };

      const ok = await onSaveConfig(updatedCfg);
      if (ok) {
        setConfigSuccessMsg('Semua konfigurasi situs berhasil diperbarui dan disimpan!');
      } else {
        setConfigErrMsg('Gagal menyimpan konfigurasi situs.');
      }
    } catch (err: any) {
      setConfigErrMsg(err.message || 'Terjadi kesalahan saat menyimpan config.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Update Credentials Handler
  const handleUpdateCredsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !onUpdateCredentials) return;
    setIsSavingCreds(true);
    setCredSuccessMsg('');
    setCredErrMsg('');

    try {
      const res = await onUpdateCredentials(currentUser.id, {
        name: credName,
        email: credEmail,
        password: credPassword.trim() ? credPassword.trim() : undefined,
        avatar: credAvatar,
        bio: credBio,
      });

      if (res.success) {
        setCredSuccessMsg('Kredensial dan profil admin berhasil diperbarui!');
        setCredPassword('');
      } else {
        setCredErrMsg(res.error || 'Gagal memperbarui kredensial.');
      }
    } catch (err: any) {
      setCredErrMsg(err.message || 'Gagal memperbarui kredensial.');
    } finally {
      setIsSavingCreds(false);
    }
  };

  const logoutHardLink = typeof window !== 'undefined' ? `${window.location.origin}/admin?logout=true` : 'https://parenting.my.id/admin?logout=true';

  const copyLogoutLink = () => {
    navigator.clipboard.writeText(logoutHardLink);
    setCopiedLogoutLink(true);
    setTimeout(() => setCopiedLogoutLink(false), 2000);
  };

  // Open Post in Editor
  const handleEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditorTitle(post.title);
    setEditorSlug(post.slug);
    setEditorCategory(post.category);
    setEditorMarkdown(post.contentMarkdown);
    setEditorExcerpt(post.excerpt);
    setEditorImage(post.featuredImage);
    setEditorStatus(post.status);
    setEditorMetaTitle(post.metaTitle || `${post.title} | Parenting.my.id`);
    setEditorMetaDesc(post.metaDescription || post.excerpt);
    setEditorTags(post.tags || 'parenting, anak');
    setActiveTab('editor');
    setAutoSaveStatus('saved');
  };

  // Create New Blank Post
  const handleCreateNewPost = () => {
    setEditingPostId(null);
    setEditorTitle('');
    setEditorSlug('');
    setEditorCategory('Pola Asuh');
    setEditorMarkdown('## Judul Bagian Baru\n\nTulis isi konten artikel parenting Anda di sini...');
    setEditorExcerpt('');
    setEditorImage('https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80');
    setEditorStatus('draft');
    setEditorMetaTitle('');
    setEditorMetaDesc('');
    setEditorTags('parenting, anak, keluarga');
    setActiveTab('editor');
    setAutoSaveStatus('saved');
  };

  // Auto-Save Draft Trigger (Runs when content or title changes)
  useEffect(() => {
    if (activeTab !== 'editor' || !editorTitle) return;

    setAutoSaveStatus('dirty');

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      setAutoSaveStatus('saving');
      const saved = await onSavePost({
        id: editingPostId || undefined,
        title: editorTitle,
        slug: editorSlug || generateSlug(editorTitle),
        category: editorCategory,
        contentMarkdown: editorMarkdown,
        excerpt: editorExcerpt || editorMarkdown.slice(0, 150) + '...',
        featuredImage: editorImage,
        status: 'draft', // Auto-save keeps it as draft until explicitly published
        metaTitle: editorMetaTitle,
        metaDescription: editorMetaDesc,
        tags: editorTags,
        authorId: currentUser?.id || 1,
      });

      if (saved && !editingPostId) {
        setEditingPostId(saved.id);
      }
      setAutoSaveStatus('saved');
    }, 3000); // Save automatically 3s after typing pause

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [editorTitle, editorMarkdown, editorExcerpt, editorCategory, editorImage]);

  // Insert Markdown formatting toolbar
  const insertToolbar = (prefix: string, suffix: string = '') => {
    setEditorMarkdown((prev) => `${prev}\n${prefix}Teks Ditambahkan${suffix}`);
  };

  // GitHub REST API Image Upload Handler
  const handleImageUploadFile = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Content = reader.result as string;
        try {
          const res = await fetch('/api/upload-github', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              base64Content,
            }),
          });
          const data: any = await res.json();
          if (data.url) {
            setEditorImage((prev) => prev || data.url);
            resolve(data.url);
          } else {
            resolve(null);
          }
        } catch (err) {
          console.error('Image upload failed', err);
          resolve(null);
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // AI Gemini Meta Generator
  const handleAiGenerateMeta = async () => {
    if (!editorTitle) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editorTitle,
          content: editorMarkdown,
        }),
      });
      const data: any = await res.json();
      if (data.metaTitle) setEditorMetaTitle(data.metaTitle);
      if (data.metaDescription) setEditorMetaDesc(data.metaDescription);
      if (data.excerpt) setEditorExcerpt(data.excerpt);
      if (data.tags) setEditorTags(data.tags);
    } catch (err) {
      console.error('AI generation error', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save / Publish Post Form Submit
  const handlePublishSubmit = async (status: 'draft' | 'published') => {
    if (!editorTitle || !editorMarkdown) return;

    await onSavePost({
      id: editingPostId || undefined,
      title: editorTitle,
      slug: editorSlug || generateSlug(editorTitle),
      category: editorCategory,
      contentMarkdown: editorMarkdown,
      excerpt: editorExcerpt || editorMarkdown.slice(0, 150) + '...',
      featuredImage: editorImage,
      status: status,
      metaTitle: editorMetaTitle || `${editorTitle} | Parenting.my.id`,
      metaDescription: editorMetaDesc || editorExcerpt,
      tags: editorTags,
      authorId: currentUser?.id || 1,
    });

    setActiveTab('posts');
  };

  // Submit New Autolink
  const handleAddAutolinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword || !newTargetUrl) return;
    await onAddAutolink({
      keyword: newKeyword,
      targetUrl: newTargetUrl,
      description: newDescription,
    });
    setNewKeyword('');
    setNewTargetUrl('');
    setNewDescription('');
  };

  // -------------------------------------------------------------
  // RENDER LOGIN SCREEN IF NOT AUTHENTICATED
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-500/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Portal Admin Parenting.my.id
            </h2>
            <p className="text-xs text-slate-500">
              Sistem Otentikasi Cloudflare D1
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Terdaftar
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                placeholder="admin@parenting.my.id"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-600 font-medium text-center bg-rose-50 p-2 rounded-lg">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              <span>Masuk Portal CMS</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER ADMIN DASHBOARD WORKSPACE
  // -------------------------------------------------------------
  return (
    <div className="space-y-8 pb-16">
      
      {/* HEADER STATUS BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-12 h-12 rounded-2xl object-cover border-2 border-rose-500 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {currentUser.name}
              </h2>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                currentUser.role === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500">{currentUser.email} • Cloudflare D1 Connected</p>
          </div>
        </div>

        <button
          onClick={handleCreateNewPost}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Artikel Parenting Baru</span>
        </button>
      </div>

      {/* DASHBOARD NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'posts'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Kelola Artikel ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'editor'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Rich WYSIWYG Editor</span>
        </button>

        <button
          onClick={() => setActiveTab('autolinks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'autolinks'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>Auto-Linking Engine ({autolinks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sitemap')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'sitemap'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>SEO Inspector</span>
        </button>

        {currentUser?.role === 'admin' && (
          <>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'config'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>⚙️ Configs Situs</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>🔐 Akun Admin & Hard Logout</span>
            </button>
          </>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: MANAGE POSTS LIST */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'posts' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Daftar Artikel di Cloudflare D1 Database
            </h3>
            <span className="text-xs text-slate-500">
              Total {posts.length} Artikel
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Judul Artikel</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Penulis</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Pembaca</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                      {post.title}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-rose-50 text-rose-600 font-semibold text-[10px]">
                        {post.category}
                      </span>
                    </td>
                    <td className="p-4">{post.authorName || 'Dr. Ratna Sari'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono">{post.views}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditPost(post)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 font-bold"
                      >
                        Edit
                      </button>
                      {(currentUser.role === 'admin' || post.authorId === currentUser.id) && (
                        <button
                          onClick={() => onDeletePost(post.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-bold"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: RICH WYSIWYG & MARKDOWN EDITOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'editor' && (
        <RichPostEditor
          title={editorTitle}
          setTitle={setEditorTitle}
          slug={editorSlug}
          setSlug={setEditorSlug}
          category={editorCategory}
          setCategory={setEditorCategory}
          markdown={editorMarkdown}
          setMarkdown={setEditorMarkdown}
          excerpt={editorExcerpt}
          setExcerpt={setEditorExcerpt}
          featuredImage={editorImage}
          setFeaturedImage={setEditorImage}
          metaTitle={editorMetaTitle}
          setMetaTitle={setEditorMetaTitle}
          metaDesc={editorMetaDesc}
          setMetaDesc={setEditorMetaDesc}
          tags={editorTags}
          setTags={setEditorTags}
          autoSaveStatus={autoSaveStatus}
          isAiLoading={isAiLoading}
          onAiGenerateMeta={handleAiGenerateMeta}
          onPublishSubmit={handlePublishSubmit}
          uploadingImage={uploadingImage}
          onImageUpload={handleImageUploadFile}
          autolinks={autolinks}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: AUTO-LINKING ENGINE MANAGER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'autolinks' && (
        <div className="space-y-6">
          <div className="bg-rose-50 dark:bg-slate-800/60 p-6 rounded-3xl border border-rose-100 dark:border-slate-700 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-600" />
              <span>Auto-Linking Engine On-Page (SEO Automation)</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Sistem ini secara otomatis memindai seluruh kata dalam artikel dan mengubah kata kunci terdaftar menjadi internal link menuju artikel pilihan Anda tanpa perlu mengedit artikel satu per satu.
            </p>
          </div>

          {/* ADD NEW AUTOLINK FORM */}
          <form onSubmit={handleAddAutolinkSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              + Tambah Kata Kunci Autolink Baru
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Kata Kunci / Keyword
                </label>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Misal: 'stunting'"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Target Internal URL
                </label>
                <input
                  type="text"
                  value={newTargetUrl}
                  onChange={(e) => setNewTargetUrl(e.target.value)}
                  placeholder="/baca/mengenal-bahaya-stunting"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Keterangan Tooltip
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Panduan gizi stunting anak"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md transition-all"
            >
              Simpan Kata Kunci Autolink
            </button>
          </form>

          {/* AUTOLINKS TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Kata Kunci (Keyword)</th>
                  <th className="p-4">Target URL Artikel</th>
                  <th className="p-4">Deskripsi Tooltip</th>
                  <th className="p-4">Total Klik</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {autolinks.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50/80">
                    <td className="p-4 font-bold text-rose-600">#{link.keyword}</td>
                    <td className="p-4 font-mono text-[11px]">{link.targetUrl}</td>
                    <td className="p-4 text-slate-500">{link.description || '-'}</td>
                    <td className="p-4 font-bold text-emerald-600">{link.clickCount} kali</td>
                    <td className="p-4 text-right">
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => onDeleteAutolink(link.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-bold"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: SEO & SITEMAP INSPECTOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'sitemap' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Inspector Dynamic Sitemap & RSS Feed</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-400 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">📄 Live /sitemap.xml</div>
                  <div className="text-xs text-slate-500">Otomatis diindeks oleh Google Search Console</div>
                </div>
                <ExternalLink className="w-4 h-4 text-rose-500" />
              </a>

              <a
                href="/feed.xml"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-400 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">📡 Live /feed.xml</div>
                  <div className="text-xs text-slate-500">RSS Feed XML standar untuk sindikasi konten</div>
                </div>
                <ExternalLink className="w-4 h-4 text-amber-500" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: CENTRALIZED CONFIGS FORM */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfigSubmit} className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-rose-500" />
                  <span>Pengaturan Terpusat (Admin Site Configs)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Kelola variabel global website (Header, Brand, SEO Meta, Hero, Layout, & Footer). Disimpan di Cloudflare D1 + synced to site_config.json
                </p>
              </div>

              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingConfig ? 'Memproses...' : 'Simpan Semua Konfigurasi'}</span>
              </button>
            </div>

            {configSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{configSuccessMsg}</span>
              </div>
            )}

            {configErrMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{configErrMsg}</span>
              </div>
            )}

            {/* SECTION 1: HEADER & IDENTITY */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>1. Identitas Website & Header</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Utama Situs (site_name)
                  </label>
                  <input
                    type="text"
                    value={cfgSiteName}
                    onChange={(e) => setCfgSiteName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tagline Situs (site_tagline)
                  </label>
                  <input
                    type="text"
                    value={cfgSiteTagline}
                    onChange={(e) => setCfgSiteTagline(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Icon Logo (site_logo_icon: Heart, Baby, Sparkles, BookOpen)
                  </label>
                  <select
                    value={cfgSiteLogoIcon}
                    onChange={(e) => setCfgSiteLogoIcon(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Heart">Heart (Default)</option>
                    <option value="Baby">Baby</option>
                    <option value="Sparkles">Sparkles</option>
                    <option value="BookOpen">BookOpen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Favicon URL (site_favicon_url)
                  </label>
                  <input
                    type="text"
                    value={cfgSiteFaviconUrl}
                    onChange={(e) => setCfgSiteFaviconUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Singkat Website (site_description)
                </label>
                <textarea
                  value={cfgSiteDescription}
                  onChange={(e) => setCfgSiteDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Menu Navigasi Header (header_nav_links dalam Format JSON)
                </label>
                <textarea
                  value={cfgHeaderNavLinks}
                  onChange={(e) => setCfgHeaderNavLinks(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* SECTION 2: SEO & DEFAULT OG */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-4 h-4" />
                <span>2. SEO Meta & Og Image Default</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Meta Title Default (seo_meta_title)
                  </label>
                  <input
                    type="text"
                    value={cfgSeoMetaTitle}
                    onChange={(e) => setCfgSeoMetaTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Default Open Graph Image URL (seo_default_og_image)
                  </label>
                  <input
                    type="text"
                    value={cfgSeoDefaultOgImage}
                    onChange={(e) => setCfgSeoDefaultOgImage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Meta Description Default (seo_meta_description)
                </label>
                <textarea
                  value={cfgSeoMetaDesc}
                  onChange={(e) => setCfgSeoMetaDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* SECTION 3: HERO BANNER */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layout className="w-4 h-4" />
                <span>3. Hero Banner Homepage</span>
              </h4>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="show_hero"
                  checked={cfgShowHeroSection}
                  onChange={(e) => setCfgShowHeroSection(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                />
                <label htmlFor="show_hero" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tampilkan Hero Section Banner di Homepage (show_hero_section)
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Hero Banner (hero_title)
                  </label>
                  <input
                    type="text"
                    value={cfgHeroTitle}
                    onChange={(e) => setCfgHeroTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teks Tombol CTA Hero (hero_cta_text)
                  </label>
                  <input
                    type="text"
                    value={cfgHeroCtaText}
                    onChange={(e) => setCfgHeroCtaText(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sub-Judul Hero Banner (hero_subtitle)
                </label>
                <textarea
                  value={cfgHeroSubtitle}
                  onChange={(e) => setCfgHeroSubtitle(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* SECTION 4: FOOTER */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>4. Footer & Social Media Links</span>
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teks Tentang di Footer (footer_about_text)
                </label>
                <textarea
                  value={cfgFooterAboutText}
                  onChange={(e) => setCfgFooterAboutText(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teks Hak Cipta (footer_copyright_text)
                </label>
                <input
                  type="text"
                  value={cfgFooterCopyrightText}
                  onChange={(e) => setCfgFooterCopyrightText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Facebook URL</label>
                  <input
                    type="text"
                    value={cfgSocialFacebook}
                    onChange={(e) => setCfgSocialFacebook(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Instagram URL</label>
                  <input
                    type="text"
                    value={cfgSocialInstagram}
                    onChange={(e) => setCfgSocialInstagram(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Twitter / X URL</label>
                  <input
                    type="text"
                    value={cfgSocialTwitter}
                    onChange={(e) => setCfgSocialTwitter(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingConfig ? 'Memproses...' : 'Simpan Semua Konfigurasi'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: SECURITY, ACCOUNT CREDENTIALS & HARD LOGOUT LINK */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'security' && (
        <div className="space-y-8">
          
          {/* HARD LOGOUT DIRECT LINK INFO BOX */}
          <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 text-white p-6 rounded-3xl border border-rose-800 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold border border-rose-500/30">
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Hard Link Admin Logout</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  URL Logout Langsung (Hard Link)
                </h3>
                <p className="text-xs text-slate-300">
                  Anda bisa logout langsung kapan saja tanpa menekan tombol di UI dengan membuka URL hard link berikut di browser:
                </p>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md transition-all shrink-0 flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Sekarang</span>
                </button>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3 font-mono text-xs text-rose-300">
              <span className="truncate">{logoutHardLink}</span>
              <button
                type="button"
                onClick={copyLogoutLink}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-sans font-bold flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedLogoutLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* EDIT CREDENTIALS FORM */}
          <form onSubmit={handleUpdateCredsSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <span>Ubah Username, Email, & Password Admin</span>
              </h3>
              <p className="text-xs text-slate-500">
                Kredensial disimpan dengan aman di Cloudflare D1 SQLite Database (bebas dari file hardcoded di GitHub).
              </p>
            </div>

            {credSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{credSuccessMsg}</span>
              </div>
            )}

            {credErrMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{credErrMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Admin / Penulis
                </label>
                <input
                  type="text"
                  value={credName}
                  onChange={(e) => setCredName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email / Username Login
                </label>
                <input
                  type="email"
                  value={credEmail}
                  onChange={(e) => setCredEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password Baru (Biarkan kosong jika tidak ingin diubah)
                </label>
                <input
                  type="password"
                  value={credPassword}
                  onChange={(e) => setCredPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Foto Avatar URL
                </label>
                <input
                  type="text"
                  value={credAvatar}
                  onChange={(e) => setCredAvatar(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bio Singkat Penulis
              </label>
              <textarea
                value={credBio}
                onChange={(e) => setCredBio(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingCreds}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingCreds ? 'Menyimpan...' : 'Simpan Kredensial Baru'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
