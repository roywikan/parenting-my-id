import React, { useState, useEffect, useRef } from 'react';
import { Post, AutoLink, User, SiteConfig, PostRevision, NavLink, HomepageDisplayMode, UserRole, PostStatus } from '../types';
import { THEME_PRESETS } from '../lib/themes';
import { DEFAULT_SITE_CONFIG } from '../lib/config';
import { 
  ShieldCheck, FileText, Link as LinkIcon, Plus, Trash2, Edit3, Save, 
  Upload, Eye, Sparkles, CheckCircle2, RefreshCw, Bold, Italic, Heading2, 
  Heading3, List, ListOrdered, Quote, Image as ImageIcon, Code, UserCheck, 
  ExternalLink, Search, Zap, AlertCircle, Settings, Key, Copy, Check, 
  LogOut, Globe, Palette, Layout, MessageSquare, Droplet, Users, Award, History, RotateCcw, X, Menu
} from 'lucide-react';
import { generateSlug } from '../lib/autolink';
import RichPostEditor from '../components/RichPostEditor';
import NavigationBuilder, { PRESET_NAV_ITEMS } from '../components/NavigationBuilder';
import { sanitizeAndOptimizeImageUrl } from '../lib/imageUtils';

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
  onLivePreviewChange?: (config: SiteConfig) => void;
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
  onLivePreviewChange,
}: AdminPortalProps) {
  // Login form state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin tabs: 'posts' | 'editor' | 'writers' | 'autolinks' | 'sitemap' | 'config' | 'security' | 'comments'
  const [activeTab, setActiveTab] = useState<'posts' | 'editor' | 'writers' | 'autolinks' | 'sitemap' | 'config' | 'security' | 'comments'>('posts');

  // Comments & Cusdis Webhook State
  const [comments, setComments] = useState<any[]>([]);
  const [commentFilter, setCommentFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [webhookCopied, setWebhookCopied] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/comments');
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleApproveComment = async (id: number) => {
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: 'approved' } : c))
        );
      }
    } catch (err) {
      console.error('Failed to approve comment:', err);
    }
  };

  const handleDeleteComment = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus komentar ini dari database?')) return;
    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // Writers / Editorial Team State
  const [writers, setWriters] = useState<User[]>([]);
  const [showWriterModal, setShowWriterModal] = useState(false);
  const [writerModalMode, setWriterModalMode] = useState<'create' | 'edit'>('create');
  const [editingWriterId, setEditingWriterId] = useState<number | null>(null);
  
  // Writer Form States
  const [wName, setWName] = useState('');
  const [wEmail, setWEmail] = useState('');
  const [wPassword, setWPassword] = useState('');
  const [wRole, setWRole] = useState<UserRole>('writer');
  const [wAvatar, setWAvatar] = useState('');

  // Post list filter state
  const [postStatusFilter, setPostStatusFilter] = useState<'all' | 'pending_approval' | 'draft' | 'published' | 'rejected'>('all');
  const [wTitle, setWTitle] = useState('');
  const [wBio, setWBio] = useState('');
  const [wInstagram, setWInstagram] = useState('');
  const [wLinkedin, setWLinkedin] = useState('');
  const [wWebsite, setWWebsite] = useState('');
  const [writerSuccessMsg, setWriterSuccessMsg] = useState('');
  const [writerErrMsg, setWriterErrMsg] = useState('');
  const [isSavingWriter, setIsSavingWriter] = useState(false);

  // Fetch writers list from /api/users
  const fetchWriters = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setWriters(data);
      }
    } catch (err) {
      console.error('Failed to fetch writers:', err);
    }
  };

  useEffect(() => {
    fetchWriters();
    fetchComments();
  }, []);

  // Guard effect: Non-admin users (non role admin) cannot access restricted features
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      const adminOnlyTabs = ['writers', 'autolinks', 'sitemap', 'comments', 'config'];
      if (adminOnlyTabs.includes(activeTab)) {
        setActiveTab('posts');
      }
    }
  }, [currentUser, activeTab]);

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
  const [editorAuthorId, setEditorAuthorId] = useState<number>(currentUser?.id || 1);
  const [editorCoAuthorIds, setEditorCoAuthorIds] = useState<number[]>([]);

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
  const [cfgActiveThemePreset, setCfgActiveThemePreset] = useState(siteConfig?.active_theme_preset || 'corp-blue');
  const [cfgSiteName, setCfgSiteName] = useState(siteConfig?.site_name || 'Website Utama');
  const [cfgMobileAdminBtnLabel, setCfgMobileAdminBtnLabel] = useState(siteConfig?.mobile_admin_btn_label || 'Portal Admin & Editor');
  const [cfgMobileShowLoggedUsername, setCfgMobileShowLoggedUsername] = useState(siteConfig?.mobile_show_logged_username || false);

  const [cfgSiteDomain, setCfgSiteDomain] = useState(siteConfig?.site_domain || 'domain.com');
  const [cfgDefaultThemeMode, setCfgDefaultThemeMode] = useState<'light'|'dark'|'auto'>(siteConfig?.default_theme_mode || 'auto');
  const [cfgFontSizeScale, setCfgFontSizeScale] = useState<'small'|'normal'|'large'|'xlarge'>(siteConfig?.font_size_scale || 'normal');
  const [cfgFontDensityScale, setCfgFontDensityScale] = useState<'compact'|'standard'|'spacious'>(siteConfig?.font_density_scale || 'standard');
  const [cfgAgeAccessibilityPreset, setCfgAgeAccessibilityPreset] = useState<'18-28'|'29-38'|'39-48'|'49-58'>(siteConfig?.age_accessibility_preset || '29-38');
  const [cfgHeaderBadgeText, setCfgHeaderBadgeText] = useState(siteConfig?.header_badge_text || 'Cloudflare D1 Edge Engine');
  const [cfgShowHeaderBadge, setCfgShowHeaderBadge] = useState<boolean>(siteConfig?.show_header_badge ?? siteConfig?.show_edge_badge ?? true);
  const [cfgHeroBadgeText, setCfgHeroBadgeText] = useState(siteConfig?.hero_badge_text || 'Portal Nomor 1');
  const [cfgAutolinkTickerLabel, setCfgAutolinkTickerLabel] = useState(siteConfig?.autolink_ticker_label || 'Trending:');
  const [cfgFooterAutolinkLabel, setCfgFooterAutolinkLabel] = useState(siteConfig?.footer_autolink_label || 'Tautan Populer');
  const [cfgFooterBadge1, setCfgFooterBadge1] = useState(siteConfig?.footer_badge_1 || 'Aman & Terpercaya');
  const [cfgFooterBadge2, setCfgFooterBadge2] = useState(siteConfig?.footer_badge_2 || 'Diperbarui Rutin');
  const [cfgFooterBadge3, setCfgFooterBadge3] = useState(siteConfig?.footer_badge_3 || '100% Gratis');

  // AdSense Placement Config States
  const [cfgEnableAdsense, setCfgEnableAdsense] = useState<boolean>(siteConfig?.enable_adsense ?? true);
  const [cfgAdsenseClientId, setCfgAdsenseClientId] = useState<string>(siteConfig?.adsense_client_id || 'ca-pub-1234567890123456');
  const [cfgAdsenseHeaderTop, setCfgAdsenseHeaderTop] = useState<string>(siteConfig?.adsense_header_top || '');
  const [cfgAdsenseArticleTop, setCfgAdsenseArticleTop] = useState<string>(siteConfig?.adsense_article_top || '');
  const [cfgAdsenseArticleMiddle, setCfgAdsenseArticleMiddle] = useState<string>(siteConfig?.adsense_article_middle || '');
  const [cfgAdsenseArticleBottom, setCfgAdsenseArticleBottom] = useState<string>(siteConfig?.adsense_article_bottom || '');
  const [cfgAdsenseSidebar, setCfgAdsenseSidebar] = useState<string>(siteConfig?.adsense_sidebar || '');
  const [cfgAdsenseStickyFooter, setCfgAdsenseStickyFooter] = useState<string>(siteConfig?.adsense_sticky_footer || '');

  const [cfgSiteTagline, setCfgSiteTagline] = useState(siteConfig?.site_tagline || 'Edukasi & Pengasuhan Anak Modern');
  const [cfgSiteDescription, setCfgSiteDescription] = useState(siteConfig?.site_description || 'Portal informasi dan panduan pengasuhan anak modern.');
  const [cfgSiteLogoUrl, setCfgSiteLogoUrl] = useState(siteConfig?.site_logo_url || '');
  const [cfgSiteLogoIcon, setCfgSiteLogoIcon] = useState(siteConfig?.site_logo_icon || 'Heart');
  const [cfgSiteFaviconUrl, setCfgSiteFaviconUrl] = useState(siteConfig?.site_favicon_url || '/favicon.ico');
  const [cfgHeaderNavLinksArray, setCfgHeaderNavLinksArray] = useState<NavLink[]>(() => {
    if (siteConfig?.header_nav_links && Array.isArray(siteConfig.header_nav_links)) {
      return siteConfig.header_nav_links;
    }
    return DEFAULT_SITE_CONFIG.header_nav_links || [];
  });
  const [cfgHamburgerNavLinksArray, setCfgHamburgerNavLinksArray] = useState<NavLink[]>(() => {
    if (siteConfig?.hamburger_nav_links && Array.isArray(siteConfig.hamburger_nav_links)) {
      return siteConfig.hamburger_nav_links;
    }
    return DEFAULT_SITE_CONFIG.hamburger_nav_links || [];
  });
  const [cfgFooterMenuLinksArray, setCfgFooterMenuLinksArray] = useState<NavLink[]>(() => {
    if (siteConfig?.footer_menu_links && Array.isArray(siteConfig.footer_menu_links)) {
      return siteConfig.footer_menu_links;
    }
    return DEFAULT_SITE_CONFIG.footer_menu_links || [];
  });
  const [cfgFooterCategoryLinksArray, setCfgFooterCategoryLinksArray] = useState<NavLink[]>(() => {
    if (siteConfig?.footer_category_links && Array.isArray(siteConfig.footer_category_links)) {
      return siteConfig.footer_category_links;
    }
    return DEFAULT_SITE_CONFIG.footer_category_links || [];
  });
  const [cfgEnableSearchBar, setCfgEnableSearchBar] = useState(siteConfig?.enable_search_bar ?? true);
  const [cfgEnableThemeToggle, setCfgEnableThemeToggle] = useState(siteConfig?.enable_theme_toggle ?? true);

  const [cfgSeoMetaTitle, setCfgSeoMetaTitle] = useState(siteConfig?.seo_meta_title || 'Portal Berita & Edukasi Informasi Terpercaya');
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
  const [cfgCommentEngineMode, setCfgCommentEngineMode] = useState<'both' | 'native' | 'cusdis' | 'none'>(siteConfig?.comment_engine_mode || 'both');

  const [cfgShowSidebar, setCfgShowSidebar] = useState(siteConfig?.show_sidebar ?? true);
  const [cfgPopularPostsCount, setCfgPopularPostsCount] = useState(siteConfig?.popular_posts_count || 5);
  const [cfgCategoriesWidgetLimit, setCfgCategoriesWidgetLimit] = useState(siteConfig?.categories_widget_limit || 8);
  const [cfgSidebarBannerCode, setCfgSidebarBannerCode] = useState(siteConfig?.sidebar_banner_code || '');

  const [cfgFooterAboutText, setCfgFooterAboutText] = useState(siteConfig?.footer_about_text || 'Menghadirkan artikel berkualitas, berita terkini, dan panduan edukatif terpercaya.');
  const [cfgFooterCopyrightText, setCfgFooterCopyrightText] = useState(siteConfig?.footer_copyright_text || `© ${new Date().getFullYear()} Website Utama. Hak Cipta Dilindungi.`);
  const [cfgSocialFacebook, setCfgSocialFacebook] = useState(siteConfig?.social_facebook || 'https://facebook.com/parentingmyid');
  const [cfgSocialInstagram, setCfgSocialInstagram] = useState(siteConfig?.social_instagram || 'https://instagram.com/parentingmyid');
  const [cfgSocialTwitter, setCfgSocialTwitter] = useState(siteConfig?.social_twitter || 'https://x.com/parentingmyid');

  // Performance Metric Box Config States
  const [cfgShowPerformanceBox, setCfgShowPerformanceBox] = useState<boolean>(siteConfig?.show_performance_box ?? true);
  const [cfgMetric1Show, setCfgMetric1Show] = useState<boolean>((siteConfig?.metric_1_show ?? siteConfig?.metric1_show) !== false);
  const [cfgMetric2Show, setCfgMetric2Show] = useState<boolean>((siteConfig?.metric_2_show ?? siteConfig?.metric2_show) !== false);
  const [cfgMetric3Show, setCfgMetric3Show] = useState<boolean>((siteConfig?.metric_3_show ?? siteConfig?.metric3_show) !== false);
  const [cfgMetric1Value, setCfgMetric1Value] = useState<string>(siteConfig?.metric1_value || '99+');
  const [cfgMetric1Label, setCfgMetric1Label] = useState<string>(siteConfig?.metric1_label || 'Kecepatan');
  const [cfgMetric1AnimType, setCfgMetric1AnimType] = useState<'fixed' | 'count_up' | 'count_down'>(siteConfig?.metric1_anim_type || 'fixed');
  const [cfgMetric1StartVal, setCfgMetric1StartVal] = useState<number>(siteConfig?.metric1_start_val ?? 0);
  const [cfgMetric1EndVal, setCfgMetric1EndVal] = useState<number>(siteConfig?.metric1_end_val ?? 99);
  const [cfgMetric1Duration, setCfgMetric1Duration] = useState<number>(siteConfig?.metric1_duration ?? 2000);
  const [cfgMetric1Unit, setCfgMetric1Unit] = useState<string>(siteConfig?.metric1_unit ?? '+');

  const [cfgMetric2Value, setCfgMetric2Value] = useState<string>(siteConfig?.metric2_value || '100');
  const [cfgMetric2Label, setCfgMetric2Label] = useState<string>(siteConfig?.metric2_label || 'Kualitas');
  const [cfgMetric2AnimType, setCfgMetric2AnimType] = useState<'fixed' | 'count_up' | 'count_down'>(siteConfig?.metric2_anim_type || 'fixed');
  const [cfgMetric2StartVal, setCfgMetric2StartVal] = useState<number>(siteConfig?.metric2_start_val ?? 0);
  const [cfgMetric2EndVal, setCfgMetric2EndVal] = useState<number>(siteConfig?.metric2_end_val ?? 100);
  const [cfgMetric2Duration, setCfgMetric2Duration] = useState<number>(siteConfig?.metric2_duration ?? 2000);
  const [cfgMetric2Unit, setCfgMetric2Unit] = useState<string>(siteConfig?.metric2_unit ?? '');

  const [cfgMetric3Value, setCfgMetric3Value] = useState<string>(siteConfig?.metric3_value || '0ms');
  const [cfgMetric3Label, setCfgMetric3Label] = useState<string>(siteConfig?.metric3_label || 'Respon Delay');
  const [cfgMetric3AnimType, setCfgMetric3AnimType] = useState<'fixed' | 'count_up' | 'count_down'>(siteConfig?.metric3_anim_type || 'fixed');
  const [cfgMetric3StartVal, setCfgMetric3StartVal] = useState<number>(siteConfig?.metric3_start_val ?? 100);
  const [cfgMetric3EndVal, setCfgMetric3EndVal] = useState<number>(siteConfig?.metric3_end_val ?? 0);
  const [cfgMetric3Duration, setCfgMetric3Duration] = useState<number>(siteConfig?.metric3_duration ?? 2000);
  const [cfgMetric3Unit, setCfgMetric3Unit] = useState<string>(siteConfig?.metric3_unit ?? 'ms');

  // Admin Login Text Config
  const [cfgAdminLoginTitle, setCfgAdminLoginTitle] = useState(siteConfig?.admin_login_title || 'Portal Admin Website');
  const [cfgAdminLoginSubtitle, setCfgAdminLoginSubtitle] = useState(siteConfig?.admin_login_subtitle || 'Sistem Otentikasi Cloudflare D1');
  const [cfgAdminLoginBtnText, setCfgAdminLoginBtnText] = useState(siteConfig?.admin_login_btn_text || 'Masuk Portal CMS');

  // Homepage Display Mode & Sub-tab
  const [cfgHomepageDisplayMode, setCfgHomepageDisplayMode] = useState<HomepageDisplayMode>(siteConfig?.homepage_display_mode || 'default');
  const [selectedModelConfigTab, setSelectedModelConfigTab] = useState<HomepageDisplayMode>(siteConfig?.homepage_display_mode || 'default');

  // 1. Event Model States
  const [cfgEventBadgeText, setCfgEventBadgeText] = useState(siteConfig?.event_badge_text || 'Summit Nasional 2026');
  const [cfgEventDateLocation, setCfgEventDateLocation] = useState(siteConfig?.event_date_location || '16 - 18 Oktober 2026 • JCC Senayan, Jakarta');
  const [cfgEventTitle, setCfgEventTitle] = useState(siteConfig?.event_title || 'Indonesia National Summit 2026: Membangun Fondasi Emas Masa Depan');
  const [cfgEventSubtitle, setCfgEventSubtitle] = useState(siteConfig?.event_subtitle || 'Konferensi & lokakarya terbesar di Indonesia. Dapatkan wawasan ilmiah terdepan langsung dari para pakar dan narasumber profesional.');
  const [cfgEventCtaText, setCfgEventCtaText] = useState(siteConfig?.event_cta_text || 'Daftar / Dapatkan Tiket');
  const [cfgEventWhatsapp, setCfgEventWhatsapp] = useState(siteConfig?.event_whatsapp || '6281234567890');

  // 2. Campaign Model States
  const [cfgCampaignBadgeText, setCfgCampaignBadgeText] = useState(siteConfig?.campaign_badge_text || 'Aksi Sosial Nasional');
  const [cfgCampaignTitle, setCfgCampaignTitle] = useState(siteConfig?.campaign_title || 'Gerakan 1.000 Hari Pertama: Wujudkan Generasi Bebas Stunting');
  const [cfgCampaignSubtitle, setCfgCampaignSubtitle] = useState(siteConfig?.campaign_subtitle || 'Setiap anak Indonesia berhak mendapatkan nutrisi optimal dan kasih sayang sejak hari pertama kehidupan.');
  const [cfgCampaignTargetAmount, setCfgCampaignTargetAmount] = useState(siteConfig?.campaign_target_amount || '500000000');
  const [cfgCampaignCurrentAmount, setCfgCampaignCurrentAmount] = useState(siteConfig?.campaign_current_amount || '388500000');
  const [cfgCampaignDonorCount, setCfgCampaignDonorCount] = useState(siteConfig?.campaign_donor_count || '1.428');

  // 3. Microsite Model States
  const [cfgMicrositeTitle, setCfgMicrositeTitle] = useState(siteConfig?.microsite_title || 'Official Hub Website');
  const [cfgMicrositeBio, setCfgMicrositeBio] = useState(siteConfig?.microsite_bio || 'Pusat informasi, konsultasi privat, panduan terpadu, dan portal edukasi cerdas.');
  const [cfgMicrositeWaLabel, setCfgMicrositeWaLabel] = useState(siteConfig?.microsite_wa_label || 'Konsultasi Privat (WhatsApp)');
  const [cfgMicrositeWaNumber, setCfgMicrositeWaNumber] = useState(siteConfig?.microsite_wa_number || '6281234567890');
  const [cfgMicrositeEbookUrl, setCfgMicrositeEbookUrl] = useState(siteConfig?.microsite_ebook_url || '#');
  const [cfgMicrositeTelegramUrl, setCfgMicrositeTelegramUrl] = useState(siteConfig?.microsite_telegram_url || 'https://t.me/official');
  const [cfgMicrositePodcastUrl, setCfgMicrositePodcastUrl] = useState(siteConfig?.microsite_podcast_url || 'https://spotify.com');
  const [cfgMicrositeShopUrl, setCfgMicrositeShopUrl] = useState(siteConfig?.microsite_shop_url || '#');

  // 4. Portfolio Model States
  const [cfgPortfolioBadgeText, setCfgPortfolioBadgeText] = useState(siteConfig?.portfolio_badge_text || 'Showcase Portofolio & Rekam Jejak');
  const [cfgPortfolioTitle, setCfgPortfolioTitle] = useState(siteConfig?.portfolio_title || 'Karya, Program Edukasi & Penelitian');
  const [cfgPortfolioSubtitle, setCfgPortfolioSubtitle] = useState(siteConfig?.portfolio_subtitle || 'Dedikasi nyata dalam merancang program edukasi keluarga, publikasi ilmiah terakreditasi, dan buku panduan pengasuhan.');
  const [cfgPortfolioStat1Val, setCfgPortfolioStat1Val] = useState(siteConfig?.portfolio_stat1_val || '50K+');
  const [cfgPortfolioStat1Lbl, setCfgPortfolioStat1Lbl] = useState(siteConfig?.portfolio_stat1_lbl || 'Keluarga Terbantu');
  const [cfgPortfolioStat2Val, setCfgPortfolioStat2Val] = useState(siteConfig?.portfolio_stat2_val || '120+');
  const [cfgPortfolioStat2Lbl, setCfgPortfolioStat2Lbl] = useState(siteConfig?.portfolio_stat2_lbl || 'Workshop Nasional');
  const [cfgPortfolioStat3Val, setCfgPortfolioStat3Val] = useState(siteConfig?.portfolio_stat3_val || '15+');
  const [cfgPortfolioStat3Lbl, setCfgPortfolioStat3Lbl] = useState(siteConfig?.portfolio_stat3_lbl || 'Riset Terpublikasi');

  // 5. Personal Branding Model States
  const [cfgDoctorName, setCfgDoctorName] = useState(siteConfig?.doctor_name || 'dr. Siti Rahma, Sp.A(K), M.Kes');
  const [cfgDoctorTitle, setCfgDoctorTitle] = useState(siteConfig?.doctor_title || 'Dokter Spesialis Anak & Konsultan Nutrisi Pediatrik');
  const [cfgDoctorBadgeText, setCfgDoctorBadgeText] = useState(siteConfig?.doctor_badge_text || 'Dokter Spesialis Anak & Konsultan Pengasuhan');
  const [cfgDoctorBio, setCfgDoctorBio] = useState(siteConfig?.doctor_bio || 'Membantu ratusan ribu orang tua muda di Indonesia menavigasi fase emas tumbuh kembang buah hati dengan pendekatan medis berbasis bukti.');
  const [cfgDoctorAvatarUrl, setCfgDoctorAvatarUrl] = useState(siteConfig?.doctor_avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=600&fit=crop&q=80');
  const [cfgDoctorExperienceYears, setCfgDoctorExperienceYears] = useState(siteConfig?.doctor_experience_years || '15+ Tahun Pengalaman');
  const [cfgDoctorBookingWhatsapp, setCfgDoctorBookingWhatsapp] = useState(siteConfig?.doctor_booking_whatsapp || '6281234567890');

  // 6. Corporate & B2B Model States
  const [cfgCorporateBadgeText, setCfgCorporateBadgeText] = useState(siteConfig?.corporate_badge_text || 'Solusi Korporasi & Employee Wellbeing');
  const [cfgCorporateTitle, setCfgCorporateTitle] = useState(siteConfig?.corporate_title || 'Meningkatkan Produktivitas Karyawan Melalui Dukungan Pengasuhan Terpercaya');
  const [cfgCorporateSubtitle, setCfgCorporateSubtitle] = useState(siteConfig?.corporate_subtitle || 'Program kemitraan Employee Assistance Program (EAP), konsultasi organisasi, dan webinar eksklusif untuk korporasi.');
  const [cfgCorporateCtaProposal, setCfgCorporateCtaProposal] = useState(siteConfig?.corporate_cta_proposal || 'Unduh Proposal & Rate Card B2B');
  const [cfgCorporateCtaConsult, setCfgCorporateCtaConsult] = useState(siteConfig?.corporate_cta_consult || 'Jadwalkan Konsultasi Korporasi');
  const [cfgCorporateWhatsapp, setCfgCorporateWhatsapp] = useState(siteConfig?.corporate_whatsapp || '6281234567890');
  const [cfgCorporateStat1Val, setCfgCorporateStat1Val] = useState(siteConfig?.corporate_stat1_val || '85+');
  const [cfgCorporateStat1Lbl, setCfgCorporateStat1Lbl] = useState(siteConfig?.corporate_stat1_lbl || 'Korporasi Mitra');
  const [cfgCorporateStat2Val, setCfgCorporateStat2Val] = useState(siteConfig?.corporate_stat2_val || '98%');
  const [cfgCorporateStat2Lbl, setCfgCorporateStat2Lbl] = useState(siteConfig?.corporate_stat2_lbl || 'Retensi Karyawan');
  const [cfgCorporateStat3Val, setCfgCorporateStat3Val] = useState(siteConfig?.corporate_stat3_val || '12.000+');
  const [cfgCorporateStat3Lbl, setCfgCorporateStat3Lbl] = useState(siteConfig?.corporate_stat3_lbl || 'Karyawan Terbantu');

  // 7. Product Landing Model States
  const [cfgProductBadgeText, setCfgProductBadgeText] = useState(siteConfig?.product_badge_text || 'Edisi Spesial Panduan Pengasuhan Emas 2026');
  const [cfgProductTitle, setCfgProductTitle] = useState(siteConfig?.product_title || 'Paket Komplit MPASI & Stimulasi Anak Anti-GTM');
  const [cfgProductSubtitle, setCfgProductSubtitle] = useState(siteConfig?.product_subtitle || 'Solusi tuntas mengatasi Gerakan Tutup Mulut, memastikan asupan zat besi tercukupi, dan menstimulasi kecerdasan motorik balita.');
  const [cfgProductPrice, setCfgProductPrice] = useState(siteConfig?.product_price || 'Rp 189.000');
  const [cfgProductOriginalPrice, setCfgProductOriginalPrice] = useState(siteConfig?.product_original_price || 'Rp 299.000');
  const [cfgProductDiscountTag, setCfgProductDiscountTag] = useState(siteConfig?.product_discount_tag || 'HEMAT 37%');
  const [cfgProductCtaText, setCfgProductCtaText] = useState(siteConfig?.product_cta_text || 'Pesan Sekarang & Dapatkan Bonus');
  const [cfgProductWhatsapp, setCfgProductWhatsapp] = useState(siteConfig?.product_whatsapp || '6281234567890');

  // 8. Classified Ads Model States
  const [cfgClassifiedMastheadTitle, setCfgClassifiedMastheadTitle] = useState(siteConfig?.classified_masthead_title || 'WARNA-WARTO BERITA');
  const [cfgClassifiedMastheadSubtitle, setCfgClassifiedMastheadSubtitle] = useState(siteConfig?.classified_masthead_subtitle || 'LEMBARAN IKLAN BARIS, PENGUMUMAN & WARTA KELUARGA');
  const [cfgClassifiedEdition, setCfgClassifiedEdition] = useState(siteConfig?.classified_edition || '1988/2026');
  const [cfgClassifiedPriceTag, setCfgClassifiedPriceTag] = useState(siteConfig?.classified_price_tag || 'HARGA ECERAN RP 500,-');
  const [cfgClassifiedPhone, setCfgClassifiedPhone] = useState(siteConfig?.classified_phone || '(021) 7654321');

  // 9. Knowledge Base Model States
  const [cfgKbBadgeText, setCfgKbBadgeText] = useState(siteConfig?.kb_badge_text || 'Ensiklopedia & Pusat Bantuan');
  const [cfgKbTitle, setCfgKbTitle] = useState(siteConfig?.kb_title || 'Bagaimana Kami Bisa Membantu Pengasuhan Anda?');
  const [cfgKbSubtitle, setCfgKbSubtitle] = useState(siteConfig?.kb_subtitle || 'Cari jawaban terpercaya dari ribuan artikel, panduan medis, dan rekomendasi dokter spesialis anak.');
  const [cfgKbSearchPlaceholder, setCfgKbSearchPlaceholder] = useState(siteConfig?.kb_search_placeholder || 'Ketik topik (misal: jadwal MPASI, anak demam, speech delay, tantrum)...');

  const [configSuccessMsg, setConfigSuccessMsg] = useState('');
  const [configErrMsg, setConfigErrMsg] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const hasInitializedFromPropsRef = useRef(false);

  // Sync state when props arrive
  useEffect(() => {
    if (currentUser) {
      setCredName(currentUser.name);
      setCredEmail(currentUser.email);
      setCredAvatar(currentUser.avatar || '');
      setCredBio(currentUser.bio || '');
    }
  }, [currentUser]);

  // RBAC Tab Security Guard for Non-Admin Users
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role !== 'admin') {
      const adminOnlyTabs = ['writers', 'autolinks', 'sitemap', 'comments', 'config'];
      if (adminOnlyTabs.includes(activeTab)) {
        setActiveTab('posts');
      }
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (siteConfig) {
      setCfgHomepageDisplayMode(siteConfig.homepage_display_mode || 'default');
      setCfgActiveThemePreset(siteConfig.active_theme_preset || DEFAULT_SITE_CONFIG.active_theme_preset || 'corp-blue');
      setCfgSiteName(siteConfig.site_name || DEFAULT_SITE_CONFIG.site_name);
      setCfgSiteTagline(siteConfig.site_tagline || DEFAULT_SITE_CONFIG.site_tagline);
      setCfgSiteDescription(siteConfig.site_description || DEFAULT_SITE_CONFIG.site_description);
      setCfgSiteLogoUrl(siteConfig.site_logo_url || '');
      setCfgSiteLogoIcon(siteConfig.site_logo_icon || 'Heart');
      setCfgSiteFaviconUrl(siteConfig.site_favicon_url || '/favicon.ico');
      if (siteConfig.header_nav_links && Array.isArray(siteConfig.header_nav_links) && siteConfig.header_nav_links.length > 0) {
        setCfgHeaderNavLinksArray(siteConfig.header_nav_links);
      } else if (!hasInitializedFromPropsRef.current) {
        setCfgHeaderNavLinksArray(DEFAULT_SITE_CONFIG.header_nav_links);
      }
      if (siteConfig.hamburger_nav_links && Array.isArray(siteConfig.hamburger_nav_links) && siteConfig.hamburger_nav_links.length > 0) {
        setCfgHamburgerNavLinksArray(siteConfig.hamburger_nav_links);
      } else if (!hasInitializedFromPropsRef.current) {
        setCfgHamburgerNavLinksArray(DEFAULT_SITE_CONFIG.hamburger_nav_links || []);
      }
      if (siteConfig.footer_menu_links && Array.isArray(siteConfig.footer_menu_links) && siteConfig.footer_menu_links.length > 0) {
        setCfgFooterMenuLinksArray(siteConfig.footer_menu_links);
      } else if (!hasInitializedFromPropsRef.current) {
        setCfgFooterMenuLinksArray(DEFAULT_SITE_CONFIG.footer_menu_links);
      }
      if (siteConfig.footer_category_links && Array.isArray(siteConfig.footer_category_links) && siteConfig.footer_category_links.length > 0) {
        setCfgFooterCategoryLinksArray(siteConfig.footer_category_links);
      } else if (!hasInitializedFromPropsRef.current) {
        setCfgFooterCategoryLinksArray(DEFAULT_SITE_CONFIG.footer_category_links || []);
      }
      setCfgEnableSearchBar(siteConfig.enable_search_bar ?? true);
      setCfgEnableThemeToggle(siteConfig.enable_theme_toggle ?? true);

      setCfgDefaultThemeMode(siteConfig.default_theme_mode || 'auto');
      setCfgFontSizeScale(siteConfig.font_size_scale || 'normal');
      setCfgFontDensityScale(siteConfig.font_density_scale || 'standard');
      setCfgAgeAccessibilityPreset(siteConfig.age_accessibility_preset || '29-38');

      setCfgEnableAdsense(siteConfig.enable_adsense ?? true);
      setCfgAdsenseClientId(siteConfig.adsense_client_id || '');
      setCfgAdsenseHeaderTop(siteConfig.adsense_header_top || '');
      setCfgAdsenseArticleTop(siteConfig.adsense_article_top || '');
      setCfgAdsenseArticleMiddle(siteConfig.adsense_article_middle || '');
      setCfgAdsenseArticleBottom(siteConfig.adsense_article_bottom || '');
      setCfgAdsenseSidebar(siteConfig.adsense_sidebar || '');
      setCfgAdsenseStickyFooter(siteConfig.adsense_sticky_footer || '');

      setCfgSeoMetaTitle(siteConfig.seo_meta_title || DEFAULT_SITE_CONFIG.seo_meta_title);
      setCfgSeoMetaDesc(siteConfig.seo_meta_description || DEFAULT_SITE_CONFIG.seo_meta_description);
      setCfgSeoDefaultOgImage(siteConfig.seo_default_og_image || DEFAULT_SITE_CONFIG.seo_default_og_image);

      setCfgShowHeroSection(siteConfig.show_hero_section ?? true);
      setCfgHeroTitle(siteConfig.hero_title || DEFAULT_SITE_CONFIG.hero_title);
      setCfgHeroSubtitle(siteConfig.hero_subtitle || DEFAULT_SITE_CONFIG.hero_subtitle);
      setCfgHeroCtaText(siteConfig.hero_cta_text || DEFAULT_SITE_CONFIG.hero_cta_text);
      setCfgHeroCtaLink(siteConfig.hero_cta_link || DEFAULT_SITE_CONFIG.hero_cta_link);

      setCfgShowPerformanceBox(siteConfig.show_performance_box ?? true);
      setCfgMetric1Show((siteConfig.metric_1_show ?? siteConfig.metric1_show) !== false);
      setCfgMetric2Show((siteConfig.metric_2_show ?? siteConfig.metric2_show) !== false);
      setCfgMetric3Show((siteConfig.metric_3_show ?? siteConfig.metric3_show) !== false);
      setCfgMetric1Value(siteConfig.metric1_value || '99+');
      setCfgMetric1Label(siteConfig.metric1_label || 'Kecepatan');
      setCfgMetric1AnimType(siteConfig.metric1_anim_type || 'fixed');
      setCfgMetric1StartVal(siteConfig.metric1_start_val ?? 0);
      setCfgMetric1EndVal(siteConfig.metric1_end_val ?? 99);
      setCfgMetric1Duration(siteConfig.metric1_duration ?? 2000);
      setCfgMetric1Unit(siteConfig.metric1_unit ?? '+');

      setCfgMetric2Value(siteConfig.metric2_value || '100');
      setCfgMetric2Label(siteConfig.metric2_label || 'Kualitas');
      setCfgMetric2AnimType(siteConfig.metric2_anim_type || 'fixed');
      setCfgMetric2StartVal(siteConfig.metric2_start_val ?? 0);
      setCfgMetric2EndVal(siteConfig.metric2_end_val ?? 100);
      setCfgMetric2Duration(siteConfig.metric2_duration ?? 2000);
      setCfgMetric2Unit(siteConfig.metric2_unit ?? '');

      setCfgMetric3Value(siteConfig.metric3_value || '0ms');
      setCfgMetric3Label(siteConfig.metric3_label || 'Respon Delay');
      setCfgMetric3AnimType(siteConfig.metric3_anim_type || 'fixed');
      setCfgMetric3StartVal(siteConfig.metric3_start_val ?? 100);
      setCfgMetric3EndVal(siteConfig.metric3_end_val ?? 0);
      setCfgMetric3Duration(siteConfig.metric3_duration ?? 2000);
      setCfgMetric3Unit(siteConfig.metric3_unit ?? 'ms');

      setCfgPostsPerPage(siteConfig.posts_per_page || 9);
      setCfgEnableFeaturedPost(siteConfig.enable_featured_post ?? true);
      setCfgPaginationType(siteConfig.pagination_type || 'load_more');
      setCfgCommentEngineMode(siteConfig.comment_engine_mode || 'both');

      setCfgShowSidebar(siteConfig.show_sidebar ?? true);
      setCfgPopularPostsCount(siteConfig.popular_posts_count || 5);
      setCfgCategoriesWidgetLimit(siteConfig.categories_widget_limit || 8);
      setCfgSidebarBannerCode(siteConfig.sidebar_banner_code || '');

      setCfgFooterAboutText(siteConfig.footer_about_text || DEFAULT_SITE_CONFIG.footer_about_text);
      setCfgFooterCopyrightText(siteConfig.footer_copyright_text || DEFAULT_SITE_CONFIG.footer_copyright_text);
      setCfgSocialFacebook(siteConfig.social_facebook || '');
      setCfgSocialInstagram(siteConfig.social_instagram || '');
      setCfgSocialTwitter(siteConfig.social_twitter || '');
      
      setCfgAdminLoginTitle(siteConfig.admin_login_title || (siteConfig?.site_name ? `Portal Admin ${siteConfig.site_name}` : 'Portal Admin Website'));
      setCfgAdminLoginSubtitle(siteConfig.admin_login_subtitle || 'Sistem Otentikasi Cloudflare D1');
      setCfgAdminLoginBtnText(siteConfig.admin_login_btn_text || 'Masuk Portal CMS');

      setCfgSiteDomain(siteConfig.site_domain || 'domain.com');
      setCfgHeaderBadgeText(siteConfig.header_badge_text || 'Cloudflare D1 Edge Engine');
      setCfgShowHeaderBadge(siteConfig.show_header_badge ?? siteConfig.show_edge_badge ?? true);
      setCfgMobileAdminBtnLabel(siteConfig.mobile_admin_btn_label || 'Portal Admin & Editor');
      setCfgMobileShowLoggedUsername(siteConfig.mobile_show_logged_username ?? false);
      setCfgHeroBadgeText(siteConfig.hero_badge_text || 'Portal Nomor 1');
      setCfgAutolinkTickerLabel(siteConfig.autolink_ticker_label || 'Topik Trending:');
      setCfgFooterAutolinkLabel(siteConfig.footer_autolink_label || 'Tautan Populer');
      setCfgFooterBadge1(siteConfig.footer_badge_1 || 'Aman & Terpercaya');
      setCfgFooterBadge2(siteConfig.footer_badge_2 || 'Diperbarui Rutin');
      setCfgFooterBadge3(siteConfig.footer_badge_3 || '100% Gratis');

      // 10 Model Display Values Sync
      setCfgEventBadgeText(siteConfig.event_badge_text || 'Summit Nasional 2026');
      setCfgEventDateLocation(siteConfig.event_date_location || '16 - 18 Oktober 2026 • JCC Senayan, Jakarta');
      setCfgEventTitle(siteConfig.event_title || 'Indonesia National Summit 2026: Membangun Fondasi Emas Masa Depan');
      setCfgEventSubtitle(siteConfig.event_subtitle || 'Konferensi & lokakarya terbesar di Indonesia. Dapatkan wawasan ilmiah terdepan langsung dari para pakar dan narasumber profesional.');
      setCfgEventCtaText(siteConfig.event_cta_text || 'Daftar / Dapatkan Tiket');
      setCfgEventWhatsapp(siteConfig.event_whatsapp || '6281234567890');

      setCfgCampaignBadgeText(siteConfig.campaign_badge_text || 'Aksi Sosial Nasional');
      setCfgCampaignTitle(siteConfig.campaign_title || 'Gerakan 1.000 Hari Pertama: Wujudkan Generasi Bebas Stunting');
      setCfgCampaignSubtitle(siteConfig.campaign_subtitle || 'Setiap anak Indonesia berhak mendapatkan nutrisi optimal dan kasih sayang sejak hari pertama kehidupan.');
      setCfgCampaignTargetAmount(siteConfig.campaign_target_amount || '500000000');
      setCfgCampaignCurrentAmount(siteConfig.campaign_current_amount || '388500000');
      setCfgCampaignDonorCount(siteConfig.campaign_donor_count || '1.428');

      setCfgMicrositeTitle(siteConfig.microsite_title || (siteConfig?.site_name ? `${siteConfig.site_name} Official Hub` : 'Official Hub Website'));
      setCfgMicrositeBio(siteConfig.microsite_bio || 'Pusat informasi, konsultasi privat, panduan terpadu, dan portal edukasi cerdas.');
      setCfgMicrositeWaLabel(siteConfig.microsite_wa_label || 'Konsultasi Privat (WhatsApp)');
      setCfgMicrositeWaNumber(siteConfig.microsite_wa_number || '6281234567890');
      setCfgMicrositeEbookUrl(siteConfig.microsite_ebook_url || '#');
      setCfgMicrositeTelegramUrl(siteConfig.microsite_telegram_url || 'https://t.me/official');
      setCfgMicrositePodcastUrl(siteConfig.microsite_podcast_url || 'https://spotify.com');
      setCfgMicrositeShopUrl(siteConfig.microsite_shop_url || '#');

      setCfgPortfolioBadgeText(siteConfig.portfolio_badge_text || 'Showcase Portofolio & Rekam Jejak');
      setCfgPortfolioTitle(siteConfig.portfolio_title || 'Karya, Program Edukasi & Penelitian');
      setCfgPortfolioSubtitle(siteConfig.portfolio_subtitle || 'Dedikasi nyata dalam merancang program edukasi keluarga, publikasi ilmiah terakreditasi, dan buku panduan pengasuhan.');
      setCfgPortfolioStat1Val(siteConfig.portfolio_stat1_val || '50K+');
      setCfgPortfolioStat1Lbl(siteConfig.portfolio_stat1_lbl || 'Keluarga Terbantu');
      setCfgPortfolioStat2Val(siteConfig.portfolio_stat2_val || '120+');
      setCfgPortfolioStat2Lbl(siteConfig.portfolio_stat2_lbl || 'Workshop Nasional');
      setCfgPortfolioStat3Val(siteConfig.portfolio_stat3_val || '15+');
      setCfgPortfolioStat3Lbl(siteConfig.portfolio_stat3_lbl || 'Riset Terpublikasi');

      setCfgDoctorName(siteConfig.doctor_name || 'dr. Siti Rahma, Sp.A(K), M.Kes');
      setCfgDoctorTitle(siteConfig.doctor_title || 'Dokter Spesialis Anak & Konsultan Nutrisi Pediatrik');
      setCfgDoctorBadgeText(siteConfig.doctor_badge_text || 'Dokter Spesialis Anak & Konsultan Pengasuhan');
      setCfgDoctorBio(siteConfig.doctor_bio || 'Membantu ratusan ribu orang tua muda di Indonesia menavigasi fase emas tumbuh kembang buah hati dengan pendekatan medis berbasis bukti.');
      setCfgDoctorAvatarUrl(siteConfig.doctor_avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=600&fit=crop&q=80');
      setCfgDoctorExperienceYears(siteConfig.doctor_experience_years || '15+ Tahun Pengalaman');
      setCfgDoctorBookingWhatsapp(siteConfig.doctor_booking_whatsapp || '6281234567890');

      setCfgCorporateBadgeText(siteConfig.corporate_badge_text || 'Solusi Korporasi & Employee Wellbeing');
      setCfgCorporateTitle(siteConfig.corporate_title || 'Meningkatkan Produktivitas Karyawan Melalui Dukungan Pengasuhan Terpercaya');
      setCfgCorporateSubtitle(siteConfig.corporate_subtitle || 'Program kemitraan Employee Assistance Program (EAP), konsultasi organisasi, dan webinar eksklusif untuk korporasi.');
      setCfgCorporateCtaProposal(siteConfig.corporate_cta_proposal || 'Unduh Proposal & Rate Card B2B');
      setCfgCorporateCtaConsult(siteConfig.corporate_cta_consult || 'Jadwalkan Konsultasi Korporasi');
      setCfgCorporateWhatsapp(siteConfig.corporate_whatsapp || '6281234567890');
      setCfgCorporateStat1Val(siteConfig.corporate_stat1_val || '85+');
      setCfgCorporateStat1Lbl(siteConfig.corporate_stat1_lbl || 'Korporasi Mitra');
      setCfgCorporateStat2Val(siteConfig.corporate_stat2_val || '98%');
      setCfgCorporateStat2Lbl(siteConfig.corporate_stat2_lbl || 'Retensi Karyawan');
      setCfgCorporateStat3Val(siteConfig.corporate_stat3_val || '12.000+');
      setCfgCorporateStat3Lbl(siteConfig.corporate_stat3_lbl || 'Karyawan Terbantu');

      setCfgProductBadgeText(siteConfig.product_badge_text || 'Edisi Spesial Panduan Emas 2026');
      setCfgProductTitle(siteConfig.product_title || 'Paket Komplit MPASI & Stimulasi Anak Anti-GTM');
      setCfgProductSubtitle(siteConfig.product_subtitle || 'Solusi tuntas mengatasi Gerakan Tutup Mulut, memastikan asupan zat besi tercukupi, dan menstimulasi kecerdasan motorik balita.');
      setCfgProductPrice(siteConfig.product_price || 'Rp 189.000');
      setCfgProductOriginalPrice(siteConfig.product_original_price || 'Rp 299.000');
      setCfgProductDiscountTag(siteConfig.product_discount_tag || 'HEMAT 37%');
      setCfgProductCtaText(siteConfig.product_cta_text || 'Pesan Sekarang & Dapatkan Bonus');
      setCfgProductWhatsapp(siteConfig.product_whatsapp || '6281234567890');

      setCfgClassifiedMastheadTitle(siteConfig.classified_masthead_title || 'WARNA-WARTO BERITA');
      setCfgClassifiedMastheadSubtitle(siteConfig.classified_masthead_subtitle || 'LEMBARAN IKLAN BARIS, PENGUMUMAN & WARTA KELUARGA');
      setCfgClassifiedEdition(siteConfig.classified_edition || '1988/2026');
      setCfgClassifiedPriceTag(siteConfig.classified_price_tag || 'HARGA ECERAN RP 500,-');
      setCfgClassifiedPhone(siteConfig.classified_phone || '(021) 7654321');

      setCfgKbBadgeText(siteConfig.kb_badge_text || 'Ensiklopedia & Pusat Bantuan');
      setCfgKbTitle(siteConfig.kb_title || 'Bagaimana Kami Bisa Membantu Pengasuhan Anda?');
      setCfgKbSubtitle(siteConfig.kb_subtitle || 'Cari jawaban terpercaya dari ribuan artikel, panduan medis, dan rekomendasi dokter spesialis anak.');
      setCfgKbSearchPlaceholder(siteConfig.kb_search_placeholder || 'Ketik topik (misal: jadwal MPASI, anak demam, speech delay, tantrum)...');

      hasInitializedFromPropsRef.current = true;
    }
  }, [siteConfig]);

  // REAL-TIME INSTANT PREVIEW EFFECT (Debounced)
  useEffect(() => {
    if (!onLivePreviewChange) return;

    const timer = setTimeout(() => {
      const draftConfig: SiteConfig = {
        homepage_display_mode: cfgHomepageDisplayMode,
        active_theme_preset: cfgActiveThemePreset,
        site_name: cfgSiteName,
        mobile_admin_btn_label: cfgMobileAdminBtnLabel,
        mobile_show_logged_username: cfgMobileShowLoggedUsername,
        site_domain: cfgSiteDomain,
        default_theme_mode: cfgDefaultThemeMode,
        font_size_scale: cfgFontSizeScale,
        font_density_scale: cfgFontDensityScale,
        age_accessibility_preset: cfgAgeAccessibilityPreset,
        header_badge_text: cfgHeaderBadgeText,
        show_header_badge: cfgShowHeaderBadge,
        show_edge_badge: cfgShowHeaderBadge,
        hero_badge_text: cfgHeroBadgeText,
        autolink_ticker_label: cfgAutolinkTickerLabel,
        footer_autolink_label: cfgFooterAutolinkLabel,
        footer_badge_1: cfgFooterBadge1,
        footer_badge_2: cfgFooterBadge2,
        footer_badge_3: cfgFooterBadge3,
        site_tagline: cfgSiteTagline,
        site_description: cfgSiteDescription,
        site_logo_url: cfgSiteLogoUrl,
        site_logo_icon: cfgSiteLogoIcon,
        site_favicon_url: cfgSiteFaviconUrl,
        header_nav_links: cfgHeaderNavLinksArray,
        hamburger_nav_links: cfgHamburgerNavLinksArray,
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
        show_performance_box: cfgShowPerformanceBox,
        metric_1_show: cfgMetric1Show,
        metric_2_show: cfgMetric2Show,
        metric_3_show: cfgMetric3Show,
        metric1_show: cfgMetric1Show,
        metric2_show: cfgMetric2Show,
        metric3_show: cfgMetric3Show,
        metric1_value: cfgMetric1Value,
        metric1_label: cfgMetric1Label,
        metric1_anim_type: cfgMetric1AnimType,
        metric1_start_val: Number(cfgMetric1StartVal),
        metric1_end_val: Number(cfgMetric1EndVal),
        metric1_duration: Number(cfgMetric1Duration),
        metric1_unit: cfgMetric1Unit,

        metric2_value: cfgMetric2Value,
        metric2_label: cfgMetric2Label,
        metric2_anim_type: cfgMetric2AnimType,
        metric2_start_val: Number(cfgMetric2StartVal),
        metric2_end_val: Number(cfgMetric2EndVal),
        metric2_duration: Number(cfgMetric2Duration),
        metric2_unit: cfgMetric2Unit,

        metric3_value: cfgMetric3Value,
        metric3_label: cfgMetric3Label,
        metric3_anim_type: cfgMetric3AnimType,
        metric3_start_val: Number(cfgMetric3StartVal),
        metric3_end_val: Number(cfgMetric3EndVal),
        metric3_duration: Number(cfgMetric3Duration),
        metric3_unit: cfgMetric3Unit,
        posts_per_page: Number(cfgPostsPerPage),
        enable_featured_post: cfgEnableFeaturedPost,
        pagination_type: cfgPaginationType,
        comment_engine_mode: cfgCommentEngineMode,
        show_sidebar: cfgShowSidebar,
        popular_posts_count: Number(cfgPopularPostsCount),
        categories_widget_limit: Number(cfgCategoriesWidgetLimit),
        sidebar_banner_code: cfgSidebarBannerCode,
        footer_about_text: cfgFooterAboutText,
        footer_copyright_text: cfgFooterCopyrightText,
        social_facebook: cfgSocialFacebook,
        social_instagram: cfgSocialInstagram,
        social_twitter: cfgSocialTwitter,
        footer_menu_links: cfgFooterMenuLinksArray,
        footer_category_links: cfgFooterCategoryLinksArray,
        admin_login_title: cfgAdminLoginTitle,
        admin_login_subtitle: cfgAdminLoginSubtitle,
        admin_login_btn_text: cfgAdminLoginBtnText,

        enable_adsense: cfgEnableAdsense,
        adsense_client_id: cfgAdsenseClientId,
        adsense_header_top: cfgAdsenseHeaderTop,
        adsense_article_top: cfgAdsenseArticleTop,
        adsense_article_middle: cfgAdsenseArticleMiddle,
        adsense_article_bottom: cfgAdsenseArticleBottom,
        adsense_sidebar: cfgAdsenseSidebar,
        adsense_sticky_footer: cfgAdsenseStickyFooter,

        // 10 Model Display Values
        event_badge_text: cfgEventBadgeText,
        event_date_location: cfgEventDateLocation,
        event_title: cfgEventTitle,
        event_subtitle: cfgEventSubtitle,
        event_cta_text: cfgEventCtaText,
        event_whatsapp: cfgEventWhatsapp,

        campaign_badge_text: cfgCampaignBadgeText,
        campaign_title: cfgCampaignTitle,
        campaign_subtitle: cfgCampaignSubtitle,
        campaign_target_amount: cfgCampaignTargetAmount,
        campaign_current_amount: cfgCampaignCurrentAmount,
        campaign_donor_count: cfgCampaignDonorCount,

        microsite_title: cfgMicrositeTitle,
        microsite_bio: cfgMicrositeBio,
        microsite_wa_label: cfgMicrositeWaLabel,
        microsite_wa_number: cfgMicrositeWaNumber,
        microsite_ebook_url: cfgMicrositeEbookUrl,
        microsite_telegram_url: cfgMicrositeTelegramUrl,
        microsite_podcast_url: cfgMicrositePodcastUrl,
        microsite_shop_url: cfgMicrositeShopUrl,

        portfolio_badge_text: cfgPortfolioBadgeText,
        portfolio_title: cfgPortfolioTitle,
        portfolio_subtitle: cfgPortfolioSubtitle,
        portfolio_stat1_val: cfgPortfolioStat1Val,
        portfolio_stat1_lbl: cfgPortfolioStat1Lbl,
        portfolio_stat2_val: cfgPortfolioStat2Val,
        portfolio_stat2_lbl: cfgPortfolioStat2Lbl,
        portfolio_stat3_val: cfgPortfolioStat3Val,
        portfolio_stat3_lbl: cfgPortfolioStat3Lbl,

        doctor_name: cfgDoctorName,
        doctor_title: cfgDoctorTitle,
        doctor_badge_text: cfgDoctorBadgeText,
        doctor_bio: cfgDoctorBio,
        doctor_avatar_url: cfgDoctorAvatarUrl,
        doctor_experience_years: cfgDoctorExperienceYears,
        doctor_booking_whatsapp: cfgDoctorBookingWhatsapp,

        corporate_badge_text: cfgCorporateBadgeText,
        corporate_title: cfgCorporateTitle,
        corporate_subtitle: cfgCorporateSubtitle,
        corporate_cta_proposal: cfgCorporateCtaProposal,
        corporate_cta_consult: cfgCorporateCtaConsult,
        corporate_whatsapp: cfgCorporateWhatsapp,
        corporate_stat1_val: cfgCorporateStat1Val,
        corporate_stat1_lbl: cfgCorporateStat1Lbl,
        corporate_stat2_val: cfgCorporateStat2Val,
        corporate_stat2_lbl: cfgCorporateStat2Lbl,
        corporate_stat3_val: cfgCorporateStat3Val,
        corporate_stat3_lbl: cfgCorporateStat3Lbl,

        product_badge_text: cfgProductBadgeText,
        product_title: cfgProductTitle,
        product_subtitle: cfgProductSubtitle,
        product_price: cfgProductPrice,
        product_original_price: cfgProductOriginalPrice,
        product_discount_tag: cfgProductDiscountTag,
        product_cta_text: cfgProductCtaText,
        product_whatsapp: cfgProductWhatsapp,

        classified_masthead_title: cfgClassifiedMastheadTitle,
        classified_masthead_subtitle: cfgClassifiedMastheadSubtitle,
        classified_edition: cfgClassifiedEdition,
        classified_price_tag: cfgClassifiedPriceTag,
        classified_phone: cfgClassifiedPhone,

        kb_badge_text: cfgKbBadgeText,
        kb_title: cfgKbTitle,
        kb_subtitle: cfgKbSubtitle,
        kb_search_placeholder: cfgKbSearchPlaceholder,
      };

      onLivePreviewChange(draftConfig);
    }, 60);

    return () => clearTimeout(timer);
  }, [
    cfgActiveThemePreset, cfgSiteName, cfgMobileAdminBtnLabel, cfgMobileShowLoggedUsername,
    cfgSiteDomain, cfgDefaultThemeMode, cfgFontSizeScale, cfgFontDensityScale,
    cfgAgeAccessibilityPreset, cfgHeaderBadgeText, cfgHeroBadgeText, cfgAutolinkTickerLabel,
    cfgFooterAutolinkLabel, cfgFooterBadge1, cfgFooterBadge2, cfgFooterBadge3,
    cfgSiteTagline, cfgSiteDescription, cfgSiteLogoUrl, cfgSiteLogoIcon, cfgSiteFaviconUrl,
    cfgHeaderNavLinksArray, cfgHamburgerNavLinksArray, cfgEnableSearchBar, cfgEnableThemeToggle,
    cfgSeoMetaTitle, cfgSeoMetaDesc, cfgSeoDefaultOgImage, cfgShowHeroSection,
    cfgHeroTitle, cfgHeroSubtitle, cfgHeroCtaText, cfgHeroCtaLink,
    cfgShowPerformanceBox, cfgMetric1Show, cfgMetric2Show, cfgMetric3Show, cfgMetric1Value, cfgMetric1Label, cfgMetric1AnimType, cfgMetric1StartVal, cfgMetric1EndVal, cfgMetric1Duration, cfgMetric1Unit,
    cfgMetric2Value, cfgMetric2Label, cfgMetric2AnimType, cfgMetric2StartVal, cfgMetric2EndVal, cfgMetric2Duration, cfgMetric2Unit,
    cfgMetric3Value, cfgMetric3Label, cfgMetric3AnimType, cfgMetric3StartVal, cfgMetric3EndVal, cfgMetric3Duration, cfgMetric3Unit,
    cfgPostsPerPage, cfgEnableFeaturedPost,
    cfgPaginationType, cfgCommentEngineMode, cfgShowSidebar, cfgPopularPostsCount,
    cfgCategoriesWidgetLimit, cfgSidebarBannerCode, cfgFooterAboutText, cfgFooterCopyrightText,
    cfgSocialFacebook, cfgSocialInstagram, cfgSocialTwitter, cfgFooterMenuLinksArray,
    cfgFooterCategoryLinksArray, cfgAdminLoginTitle, cfgAdminLoginSubtitle, cfgAdminLoginBtnText,
    cfgEnableAdsense, cfgAdsenseClientId, cfgAdsenseHeaderTop, cfgAdsenseArticleTop,
    cfgAdsenseArticleMiddle, cfgAdsenseArticleBottom, cfgAdsenseSidebar, cfgAdsenseStickyFooter,
    cfgHomepageDisplayMode,
    cfgEventBadgeText, cfgEventDateLocation, cfgEventTitle, cfgEventSubtitle, cfgEventCtaText, cfgEventWhatsapp,
    cfgCampaignBadgeText, cfgCampaignTitle, cfgCampaignSubtitle, cfgCampaignTargetAmount, cfgCampaignCurrentAmount, cfgCampaignDonorCount,
    cfgMicrositeTitle, cfgMicrositeBio, cfgMicrositeWaLabel, cfgMicrositeWaNumber, cfgMicrositeEbookUrl, cfgMicrositeTelegramUrl, cfgMicrositePodcastUrl, cfgMicrositeShopUrl,
    cfgPortfolioBadgeText, cfgPortfolioTitle, cfgPortfolioSubtitle, cfgPortfolioStat1Val, cfgPortfolioStat1Lbl, cfgPortfolioStat2Val, cfgPortfolioStat2Lbl, cfgPortfolioStat3Val, cfgPortfolioStat3Lbl,
    cfgDoctorName, cfgDoctorTitle, cfgDoctorBadgeText, cfgDoctorBio, cfgDoctorAvatarUrl, cfgDoctorExperienceYears, cfgDoctorBookingWhatsapp,
    cfgCorporateBadgeText, cfgCorporateTitle, cfgCorporateSubtitle, cfgCorporateCtaProposal, cfgCorporateCtaConsult, cfgCorporateWhatsapp, cfgCorporateStat1Val, cfgCorporateStat1Lbl, cfgCorporateStat2Val, cfgCorporateStat2Lbl, cfgCorporateStat3Val, cfgCorporateStat3Lbl,
    cfgProductBadgeText, cfgProductTitle, cfgProductSubtitle, cfgProductPrice, cfgProductOriginalPrice, cfgProductDiscountTag, cfgProductCtaText, cfgProductWhatsapp,
    cfgClassifiedMastheadTitle, cfgClassifiedMastheadSubtitle, cfgClassifiedEdition, cfgClassifiedPriceTag, cfgClassifiedPhone,
    cfgKbBadgeText, cfgKbTitle, cfgKbSubtitle, cfgKbSearchPlaceholder
  ]);

  // Autofill Demo High-CTR AdSense Snippets
  const handleFillDemoAdsense = () => {
    const pubId = cfgAdsenseClientId || 'ca-pub-1234567890123456';
    setCfgEnableAdsense(true);
    setCfgAdsenseHeaderTop(`<div style="background:#fff border:1px solid #e2e8f0;padding:12px;text-align:center;border-radius:12px;"><span style="font-size:10px;color:#94a3b8;font-weight:bold;letter-spacing:1px;display:block;margin-bottom:4px;">IKLAN SPONSOR TOP BANNER (728x90)</span><ins class="adsbygoogle" style="display:block" data-ad-client="${pubId}" data-ad-slot="1111111111" data-ad-format="auto" data-full-width-responsive="true"></ins></div>`);
    setCfgAdsenseArticleTop(`<div style="background:#f8fafc;border:1px dashed #cbd5e1;padding:16px;text-align:center;border-radius:12px;margin:16px 0;"><span style="font-size:10px;color:#64748b;font-weight:bold;display:block;margin-bottom:6px;">REKOMENDASI BACAAN SPONSOR (ATAS ARTIKEL)</span><ins class="adsbygoogle" style="display:inline-block;width:336px;height:280px" data-ad-client="${pubId}" data-ad-slot="2222222222"></ins></div>`);
    setCfgAdsenseArticleMiddle(`<div style="background:#f1f5f9;border-left:4px solid #f43f5e;padding:16px;text-align:center;border-radius:8px;margin:20px 0;"><span style="font-size:10px;color:#f43f5e;font-weight:bold;display:block;margin-bottom:6px;">IKLAN TENGAH ARTIKEL (HIGH CTR IN-FEED)</span><ins class="adsbygoogle" style="display:block" data-ad-format="fluid" data-ad-layout-key="-fb+5w+4e-db+86" data-ad-client="${pubId}" data-ad-slot="3333333333"></ins></div>`);
    setCfgAdsenseArticleBottom(`<div style="background:#fafafa;border:1px solid #e5e5e5;padding:16px;text-align:center;border-radius:12px;margin:20px 0;"><span style="font-size:10px;color:#737373;font-weight:bold;display:block;margin-bottom:6px;">IKLAN REKOMENDASI BAWAH ARTIKEL (MATCHED CONTENT)</span><ins class="adsbygoogle" style="display:block" data-ad-client="${pubId}" data-ad-slot="4444444444" data-ad-format="autorelaxed"></ins></div>`);
    setCfgAdsenseSidebar(`<div style="background:#ffffff;border:1px border-slate-200;padding:12px;text-align:center;border-radius:12px;margin-bottom:16px;"><span style="font-size:10px;color:#64748b;font-weight:bold;display:block;margin-bottom:4px;">SIDEBAR AD (300x250)</span><ins class="adsbygoogle" style="display:inline-block;width:300px;height:250px" data-ad-client="${pubId}" data-ad-slot="5555555555"></ins></div>`);
    setCfgAdsenseStickyFooter(`<div style="padding:4px;text-align:center;width:100%;"><span style="font-size:9px;color:#94a3b8;font-weight:bold;">STICKY FOOTER MOBILE BANNER</span><ins class="adsbygoogle" style="display:inline-block;width:320px;height:50px" data-ad-client="${pubId}" data-ad-slot="6666666666"></ins></div>`);
  };

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
      const updatedCfg: SiteConfig = {
        homepage_display_mode: cfgHomepageDisplayMode,
        active_theme_preset: cfgActiveThemePreset,
        site_name: cfgSiteName,
        mobile_admin_btn_label: cfgMobileAdminBtnLabel,
        mobile_show_logged_username: cfgMobileShowLoggedUsername,

        site_domain: cfgSiteDomain,
        default_theme_mode: cfgDefaultThemeMode,
        font_size_scale: cfgFontSizeScale,
        font_density_scale: cfgFontDensityScale,
        age_accessibility_preset: cfgAgeAccessibilityPreset,
        header_badge_text: cfgHeaderBadgeText,
        show_header_badge: cfgShowHeaderBadge,
        show_edge_badge: cfgShowHeaderBadge,
        hero_badge_text: cfgHeroBadgeText,
        autolink_ticker_label: cfgAutolinkTickerLabel,
        footer_autolink_label: cfgFooterAutolinkLabel,
        footer_badge_1: cfgFooterBadge1,
        footer_badge_2: cfgFooterBadge2,
        footer_badge_3: cfgFooterBadge3,

        enable_adsense: cfgEnableAdsense,
        adsense_client_id: cfgAdsenseClientId,
        adsense_header_top: cfgAdsenseHeaderTop,
        adsense_article_top: cfgAdsenseArticleTop,
        adsense_article_middle: cfgAdsenseArticleMiddle,
        adsense_article_bottom: cfgAdsenseArticleBottom,
        adsense_sidebar: cfgAdsenseSidebar,
        adsense_sticky_footer: cfgAdsenseStickyFooter,

        site_tagline: cfgSiteTagline,
        site_description: cfgSiteDescription,
        site_logo_url: cfgSiteLogoUrl,
        site_logo_icon: cfgSiteLogoIcon,
        site_favicon_url: cfgSiteFaviconUrl,
        header_nav_links: cfgHeaderNavLinksArray,
        hamburger_nav_links: cfgHamburgerNavLinksArray,
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
        show_performance_box: cfgShowPerformanceBox,
        metric_1_show: cfgMetric1Show,
        metric_2_show: cfgMetric2Show,
        metric_3_show: cfgMetric3Show,
        metric1_show: cfgMetric1Show,
        metric2_show: cfgMetric2Show,
        metric3_show: cfgMetric3Show,
        metric1_value: cfgMetric1Value,
        metric1_label: cfgMetric1Label,
        metric1_anim_type: cfgMetric1AnimType,
        metric1_start_val: Number(cfgMetric1StartVal),
        metric1_end_val: Number(cfgMetric1EndVal),
        metric1_duration: Number(cfgMetric1Duration),
        metric1_unit: cfgMetric1Unit,

        metric2_value: cfgMetric2Value,
        metric2_label: cfgMetric2Label,
        metric2_anim_type: cfgMetric2AnimType,
        metric2_start_val: Number(cfgMetric2StartVal),
        metric2_end_val: Number(cfgMetric2EndVal),
        metric2_duration: Number(cfgMetric2Duration),
        metric2_unit: cfgMetric2Unit,

        metric3_value: cfgMetric3Value,
        metric3_label: cfgMetric3Label,
        metric3_anim_type: cfgMetric3AnimType,
        metric3_start_val: Number(cfgMetric3StartVal),
        metric3_end_val: Number(cfgMetric3EndVal),
        metric3_duration: Number(cfgMetric3Duration),
        metric3_unit: cfgMetric3Unit,

        posts_per_page: Number(cfgPostsPerPage),
        enable_featured_post: cfgEnableFeaturedPost,
        pagination_type: cfgPaginationType,
        comment_engine_mode: cfgCommentEngineMode,

        show_sidebar: cfgShowSidebar,
        popular_posts_count: Number(cfgPopularPostsCount),
        categories_widget_limit: Number(cfgCategoriesWidgetLimit),
        sidebar_banner_code: cfgSidebarBannerCode,

        footer_about_text: cfgFooterAboutText,
        footer_copyright_text: cfgFooterCopyrightText,
        social_facebook: cfgSocialFacebook,
        social_instagram: cfgSocialInstagram,
        social_twitter: cfgSocialTwitter,
        footer_menu_links: cfgFooterMenuLinksArray,
        footer_category_links: cfgFooterCategoryLinksArray,
        admin_login_title: cfgAdminLoginTitle,
        admin_login_subtitle: cfgAdminLoginSubtitle,
        admin_login_btn_text: cfgAdminLoginBtnText,

        // 10 Model Display Values
        event_badge_text: cfgEventBadgeText,
        event_date_location: cfgEventDateLocation,
        event_title: cfgEventTitle,
        event_subtitle: cfgEventSubtitle,
        event_cta_text: cfgEventCtaText,
        event_whatsapp: cfgEventWhatsapp,

        campaign_badge_text: cfgCampaignBadgeText,
        campaign_title: cfgCampaignTitle,
        campaign_subtitle: cfgCampaignSubtitle,
        campaign_target_amount: cfgCampaignTargetAmount,
        campaign_current_amount: cfgCampaignCurrentAmount,
        campaign_donor_count: cfgCampaignDonorCount,

        microsite_title: cfgMicrositeTitle,
        microsite_bio: cfgMicrositeBio,
        microsite_wa_label: cfgMicrositeWaLabel,
        microsite_wa_number: cfgMicrositeWaNumber,
        microsite_ebook_url: cfgMicrositeEbookUrl,
        microsite_telegram_url: cfgMicrositeTelegramUrl,
        microsite_podcast_url: cfgMicrositePodcastUrl,
        microsite_shop_url: cfgMicrositeShopUrl,

        portfolio_badge_text: cfgPortfolioBadgeText,
        portfolio_title: cfgPortfolioTitle,
        portfolio_subtitle: cfgPortfolioSubtitle,
        portfolio_stat1_val: cfgPortfolioStat1Val,
        portfolio_stat1_lbl: cfgPortfolioStat1Lbl,
        portfolio_stat2_val: cfgPortfolioStat2Val,
        portfolio_stat2_lbl: cfgPortfolioStat2Lbl,
        portfolio_stat3_val: cfgPortfolioStat3Val,
        portfolio_stat3_lbl: cfgPortfolioStat3Lbl,

        doctor_name: cfgDoctorName,
        doctor_title: cfgDoctorTitle,
        doctor_badge_text: cfgDoctorBadgeText,
        doctor_bio: cfgDoctorBio,
        doctor_avatar_url: cfgDoctorAvatarUrl,
        doctor_experience_years: cfgDoctorExperienceYears,
        doctor_booking_whatsapp: cfgDoctorBookingWhatsapp,

        corporate_badge_text: cfgCorporateBadgeText,
        corporate_title: cfgCorporateTitle,
        corporate_subtitle: cfgCorporateSubtitle,
        corporate_cta_proposal: cfgCorporateCtaProposal,
        corporate_cta_consult: cfgCorporateCtaConsult,
        corporate_whatsapp: cfgCorporateWhatsapp,
        corporate_stat1_val: cfgCorporateStat1Val,
        corporate_stat1_lbl: cfgCorporateStat1Lbl,
        corporate_stat2_val: cfgCorporateStat2Val,
        corporate_stat2_lbl: cfgCorporateStat2Lbl,
        corporate_stat3_val: cfgCorporateStat3Val,
        corporate_stat3_lbl: cfgCorporateStat3Lbl,

        product_badge_text: cfgProductBadgeText,
        product_title: cfgProductTitle,
        product_subtitle: cfgProductSubtitle,
        product_price: cfgProductPrice,
        product_original_price: cfgProductOriginalPrice,
        product_discount_tag: cfgProductDiscountTag,
        product_cta_text: cfgProductCtaText,
        product_whatsapp: cfgProductWhatsapp,

        classified_masthead_title: cfgClassifiedMastheadTitle,
        classified_masthead_subtitle: cfgClassifiedMastheadSubtitle,
        classified_edition: cfgClassifiedEdition,
        classified_price_tag: cfgClassifiedPriceTag,
        classified_phone: cfgClassifiedPhone,

        kb_badge_text: cfgKbBadgeText,
        kb_title: cfgKbTitle,
        kb_subtitle: cfgKbSubtitle,
        kb_search_placeholder: cfgKbSearchPlaceholder
      };

      const ok = await onSaveConfig(updatedCfg);
      if (ok) {
        setConfigSuccessMsg('✅ PERUBAHAN DISIMPAN SINKRON! Semua 65+ parameter konfigurasi situs telah berhasil disimpan ke Database Cloudflare D1 (tabel configs) & public/site_config.json.');
        setConfigErrMsg('');
      } else {
        setConfigErrMsg('⚠️ GAGAL MENYIMPAN KONFIGURASI SITUS: Server mengembalikan respon error. Silakan periksa koneksi internet Anda atau coba lagi.');
        setConfigSuccessMsg('');
      }
    } catch (err: any) {
      setConfigErrMsg('⚠️ GAGAL MENYIMPAN KONFIGURASI: ' + (err?.message || 'Terjadi kesalahan sistem saat menghubungi backend server.'));
      setConfigSuccessMsg('');
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

  const logoutHardLink = typeof window !== 'undefined' ? `${window.location.origin}/admin?logout=true` : '/admin?logout=true';

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
    setEditorMetaTitle(post.metaTitle || `${post.title} | ${siteConfig?.site_name || 'Website'}`);
    setEditorMetaDesc(post.metaDescription || post.excerpt);
    setEditorTags(post.tags || 'berita, edukasi');
    setEditorAuthorId(post.authorId || 1);
    setEditorCoAuthorIds(post.coAuthors ? post.coAuthors.map(c => c.id) : []);
    setActiveTab('editor');
    setAutoSaveStatus('saved');
  };

  // Create New Blank Post
  const handleCreateNewPost = () => {
    setEditingPostId(null);
    setEditorTitle('');
    setEditorSlug('');
    setEditorCategory('Edukasi & Panduan');
    setEditorMarkdown('## Judul Bagian Baru\n\nTulis isi konten artikel Anda di sini...');
    setEditorExcerpt('');
    setEditorImage('https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80');
    setEditorStatus('draft');
    setEditorMetaTitle('');
    setEditorMetaDesc('');
    setEditorTags('berita, edukasi, informasi');
    setEditorAuthorId(currentUser?.id || 1);
    setEditorCoAuthorIds([]);
    setActiveTab('editor');
    setAutoSaveStatus('saved');
  };

  // Restore Revision Handler (Rollback)
  const handleRestoreRevision = (rev: PostRevision) => {
    setEditorTitle(rev.title);
    setEditorMarkdown(rev.contentMarkdown);
    setEditorExcerpt(rev.excerpt);
    alert(`Konten berhasil dikembalikan ke revisi versi (${new Date(rev.updatedAt || rev.timestamp).toLocaleTimeString()})!`);
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
        authorId: editorAuthorId,
        coAuthorIds: editorCoAuthorIds,
      });

      if (saved && !editingPostId) {
        setEditingPostId(saved.id);
      }
      setAutoSaveStatus('saved');
    }, 3000); // Save automatically 3s after typing pause

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [editorTitle, editorMarkdown, editorExcerpt, editorCategory, editorImage, editorAuthorId, editorCoAuthorIds]);

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
  const handlePublishSubmit = async (status: PostStatus, rejectionReason?: string) => {
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
      rejectionReason: rejectionReason,
      metaTitle: editorMetaTitle || `${editorTitle} | ${siteConfig?.site_name || 'Website'}`,
      metaDescription: editorMetaDesc || editorExcerpt,
      tags: editorTags,
      authorId: editorAuthorId,
      coAuthorIds: editorCoAuthorIds,
    });

    setActiveTab('posts');
  };

  // Writer Management CRUD Handlers
  const handleOpenAddWriterModal = () => {
    setWriterModalMode('create');
    setEditingWriterId(null);
    setWName('');
    setWEmail('');
    setWPassword('');
    setWRole('writer');
    setWAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400');
    setWTitle('Penulis & Kontributor Konten');
    setWBio('Praktisi kesehatan dan penulis edukasi keluarga.');
    setWInstagram('');
    setWLinkedin('');
    setWWebsite('');
    setWriterSuccessMsg('');
    setWriterErrMsg('');
    setShowWriterModal(true);
  };

  const handleOpenEditWriterModal = (w: User) => {
    setWriterModalMode('edit');
    setEditingWriterId(w.id);
    setWName(w.name);
    setWEmail(w.email);
    setWPassword('');
    setWRole(w.role || 'writer');
    setWAvatar(w.avatar || '');
    setWTitle(w.title || '');
    setWBio(w.bio || '');
    setWInstagram(w.socials?.instagram || '');
    setWLinkedin(w.socials?.linkedin || '');
    setWWebsite(w.socials?.website || '');
    setWriterSuccessMsg('');
    setWriterErrMsg('');
    setShowWriterModal(true);
  };

  const handleSaveWriterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWriter(true);
    setWriterSuccessMsg('');
    setWriterErrMsg('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingWriterId || undefined,
          name: wName,
          email: wEmail,
          password: wPassword || undefined,
          role: wRole,
          avatar: wAvatar,
          title: wTitle,
          bio: wBio,
          socials: {
            instagram: wInstagram || undefined,
            linkedin: wLinkedin || undefined,
            website: wWebsite || undefined,
          },
        }),
      });

      const data: any = await res.json();
      if (res.ok && data.user) {
        setWriterSuccessMsg(writerModalMode === 'create' ? 'Penulis baru berhasil ditambahkan!' : 'Profil penulis berhasil diperbarui!');
        fetchWriters();
        setTimeout(() => setShowWriterModal(false), 1200);
      } else {
        setWriterErrMsg(data.error || 'Gagal menyimpan data penulis.');
      }
    } catch (err: any) {
      setWriterErrMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSavingWriter(false);
    }
  };

  const handleDeleteWriter = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus profil penulis ini?')) return;

    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchWriters();
      } else {
        const data: any = await res.json();
        alert(data.error || 'Gagal menghapus penulis.');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus penulis.');
    }
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
              {siteConfig?.admin_login_title || 'Portal Admin Website'}
            </h2>
            <p className="text-xs text-slate-500">
              {siteConfig?.admin_login_subtitle || 'Sistem Otentikasi Cloudflare D1'}
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
                placeholder="admin@domain.com"
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
              <span>{siteConfig?.admin_login_btn_text || 'Masuk Portal CMS'}</span>
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
          <span>Tulis Artikel Baru</span>
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
          <span>{currentUser?.role === 'writer' ? 'Artikel Saya' : currentUser?.role === 'editor' ? 'Moderasi Artikel Redaksi' : 'Kelola Artikel'} ({posts.length})</span>
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
          <span>Editor Draf Artikel</span>
        </button>

        {currentUser?.role === 'admin' && (
          <>
            <button
              onClick={() => setActiveTab('writers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'writers'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Kelola Tim & Penulis ({writers.length})</span>
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

            <button
              onClick={() => {
                setActiveTab('comments');
                fetchComments();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'comments'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>💬 Cusdis Komentar & Webhook ({comments.length})</span>
            </button>

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
          </>
        )}

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Key className="w-4 h-4 text-amber-400" />
          <span>🔐 {currentUser?.role === 'admin' ? 'Akun Admin & Hard Logout' : 'Profil & Password Saya'}</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: MANAGE POSTS LIST */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'posts' && (() => {
        const userRole = currentUser?.role || 'writer';
        const userPosts = posts.filter((post) => {
          if (userRole === 'writer') {
            const isAuthor = post.authorId === currentUser?.id;
            const isCoAuthor = (post.coAuthorIds || post.co_writers || []).includes(currentUser?.id || -1);
            return isAuthor || isCoAuthor;
          }
          return true;
        });

        const filteredPosts = userPosts.filter((post) => {
          if (postStatusFilter === 'all') return true;
          const status = post.status || 'published';
          return status === postStatusFilter;
        });

        const pendingCount = userPosts.filter(p => p.status === 'pending_approval').length;
        const draftCount = userPosts.filter(p => p.status === 'draft').length;
        const publishedCount = userPosts.filter(p => !p.status || p.status === 'published').length;
        const rejectedCount = userPosts.filter(p => p.status === 'rejected').length;

        return (
          <div className="space-y-4">
            {/* WRITER / EDITOR ANNOUNCEMENT BANNER */}
            {userRole === 'writer' && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border border-rose-200 dark:border-rose-900/50 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    ✍️
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white">Portal Khusus Penulis (Distraction-Free)</h4>
                    <p className="text-[11px] text-slate-500">Tulis draf artikel Anda, sertakan gambar &amp; ringkasan, lalu klik <strong>"Kirim untuk Ditinjau"</strong> agar diperiksa oleh Tim Redaksi/Editor.</p>
                  </div>
                </div>
                <button
                  onClick={handleCreateNewPost}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 shadow-sm transition-all"
                >
                  + Tulis Draf Baru
                </button>
              </div>
            )}

            {userRole === 'editor' && pendingCount > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 animate-bounce">
                    ⏳
                  </div>
                  <div>
                    <h4 className="font-extrabold">Ada {pendingCount} Artikel Menunggu Moderasi &amp; Persetujuan Redaksi</h4>
                    <p className="text-[11px] opacity-90">Periksa artikel yang dikirim Penulis, setujui untuk terbit langsung ke website, atau berikan catatan revisi.</p>
                  </div>
                </div>
                <button
                  onClick={() => setPostStatusFilter('pending_approval')}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-sm transition-all"
                >
                  Lihat Artikel Pending
                </button>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {userRole === 'writer' ? 'Daftar Artikel Draf & Status Pengajuan' : 'Daftar Artikel Website (Cloudflare D1)'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Menampilkan {filteredPosts.length} dari total {userPosts.length} artikel
                  </span>
                </div>

                {/* STATUS FILTER BUTTONS */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-[11px] font-bold overflow-x-auto max-w-full">
                  <button
                    onClick={() => setPostStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      postStatusFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Semua ({userPosts.length})
                  </button>
                  <button
                    onClick={() => setPostStatusFilter('pending_approval')}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                      postStatusFilter === 'pending_approval'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
                    }`}
                  >
                    <span>⏳ Menunggu</span>
                    {pendingCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[9px] font-extrabold">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setPostStatusFilter('draft')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      postStatusFilter === 'draft'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    📝 Draf ({draftCount})
                  </button>
                  <button
                    onClick={() => setPostStatusFilter('published')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      postStatusFilter === 'published'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                    }`}
                  >
                    ✅ Diterbitkan ({publishedCount})
                  </button>
                  <button
                    onClick={() => setPostStatusFilter('rejected')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      postStatusFilter === 'rejected'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                    }`}
                  >
                    ❌ Revisi ({rejectedCount})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Judul Artikel</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4">Penulis</th>
                      <th className="p-4">Status Pengajuan</th>
                      <th className="p-4">Pembaca</th>
                      <th className="p-4 text-right">Aksi Moderasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                          Tidak ada artikel dalam kategori status ini.
                        </td>
                      </tr>
                    ) : (
                      filteredPosts.map((post) => (
                        <tr key={post.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-bold text-slate-900 dark:text-white max-w-xs">
                            <div className="truncate font-semibold">{post.title}</div>
                            {post.status === 'rejected' && post.rejectionReason && (
                              <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 bg-rose-50 dark:bg-rose-950/50 p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 font-normal">
                                💬 <strong>Catatan Revisi Editor:</strong> {post.rejectionReason}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold text-[10px]">
                              {post.category}
                            </span>
                          </td>
                          <td className="p-4 font-medium">{post.authorName || 'Dr. Ratna Sari'}</td>
                          <td className="p-4">
                            {post.status === 'pending_approval' && (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                ⏳ Menunggu Ditinjau
                              </span>
                            )}
                            {(!post.status || post.status === 'published') && (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                ✅ Diterbitkan
                              </span>
                            )}
                            {post.status === 'draft' && (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                📝 Draf
                              </span>
                            )}
                            {post.status === 'rejected' && (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                ❌ Perlu Revisi
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-500">{post.views || 0}</td>
                          <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleEditPost(post)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold transition-all"
                            >
                              {userRole === 'writer' ? 'Edit & Tinjau' : 'Edit Artikel'}
                            </button>

                            {(userRole === 'admin' || userRole === 'editor') && post.status === 'pending_approval' && (
                              <button
                                onClick={() => {
                                  handleEditPost(post);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-all"
                              >
                                Moderasi &amp; Terbit
                              </button>
                            )}

                            {(currentUser.role === 'admin' || post.authorId === currentUser.id) && (
                              <button
                                onClick={() => onDeletePost(post.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-bold transition-all"
                              >
                                Hapus
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

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
          writers={writers}
          authorId={editorAuthorId}
          setAuthorId={setEditorAuthorId}
          coAuthorIds={editorCoAuthorIds}
          setCoAuthorIds={setEditorCoAuthorIds}
          revisions={posts.find(p => p.id === editingPostId)?.revisions || []}
          onRestoreRevision={handleRestoreRevision}
          userRole={currentUser?.role || 'writer'}
          currentStatus={editorStatus}
          rejectionReason={posts.find(p => p.id === editingPostId)?.rejectionReason}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: KELOLA TIM EDITORIAL & PENULIS (E-E-A-T) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'writers' && currentUser?.role === 'admin' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-600" />
                <span>Kelola Tim Penulis & Editor (E-E-A-T Compliance)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tambahkan profil dokter, psikolog, atau praktisi pengasuhan anak. Data kredensial akan ditampilkan pada kotak bio penulis di akhir artikel untuk memenuhi standar E-E-A-T Google.
              </p>
            </div>

            <button
              onClick={handleOpenAddWriterModal}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Penulis Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {writers.map((w) => {
              const authorPostsCount = posts.filter(
                (p) => p.authorId === w.id || (p.coAuthors && p.coAuthors.some((ca) => ca.id === w.id))
              ).length;

              return (
                <div
                  key={w.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={w.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                          alt={w.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-500/20 shadow-sm"
                        />
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{w.name}</span>
                            <ShieldCheck className="w-4 h-4 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                          </h4>
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block">
                            {w.title || 'Penulis Artikel'}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase shrink-0 ${
                        w.role === 'admin' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {w.role}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {w.bio || 'Praktisi dan penulis edukasi kesehatan serta pengasuhan anak.'}
                    </p>

                    {/* SOCIAL LINKS */}
                    <div className="flex items-center gap-3 pt-2 text-xs text-slate-500">
                      {w.socials?.instagram && (
                        <a
                          href={w.socials.instagram}
                          target="_blank"
                          rel="noreferrer"
                          className="text-pink-600 hover:underline font-semibold"
                        >
                          Instagram
                        </a>
                      )}
                      {w.socials?.linkedin && (
                        <a
                          href={w.socials.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          LinkedIn
                        </a>
                      )}
                      {w.socials?.website && (
                        <a
                          href={w.socials.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:underline font-semibold"
                        >
                          Website
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      📚 {authorPostsCount} Artikel
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditWriterModal(w)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold transition-colors"
                      >
                        Edit
                      </button>
                      {currentUser?.role === 'admin' && w.id !== currentUser.id && (
                        <button
                          onClick={() => handleDeleteWriter(w.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-bold transition-colors"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WRITER FORM MODAL */}
      {showWriterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-600" />
                <span>{writerModalMode === 'create' ? 'Tambah Penulis Baru' : 'Edit Profil Penulis'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowWriterModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWriterSubmit} className="space-y-4">
              {writerSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{writerSuccessMsg}</span>
                </div>
              )}

              {writerErrMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{writerErrMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap & Gelar *
                  </label>
                  <input
                    type="text"
                    value={wName}
                    onChange={(e) => setWName(e.target.value)}
                    required
                    placeholder="Misal: Dr. Ratna Sari, M.Psi"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Login Terdaftar *
                  </label>
                  <input
                    type="email"
                    value={wEmail}
                    onChange={(e) => setWEmail(e.target.value)}
                    required
                    placeholder="penulis@domain.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password {writerModalMode === 'edit' && '(Kosongkan jika tidak ubah)'}
                  </label>
                  <input
                    type="password"
                    value={wPassword}
                    onChange={(e) => setWPassword(e.target.value)}
                    required={writerModalMode === 'create'}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Peran / Role Sistem
                  </label>
                  <select
                    value={wRole}
                    onChange={(e: any) => setWRole(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  >
                    <option value="writer">Writer (Penulis - Hanya Draf & Pengajuan)</option>
                    <option value="editor">Editor (Redaksi & Moderasi Persetujuan)</option>
                    <option value="admin">Administrator (Akses Penuh Seluruh Config)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kredensial & Jabatan Penulis (Gelar / Spesialisasi)
                </label>
                <input
                  type="text"
                  value={wTitle}
                  onChange={(e) => setWTitle(e.target.value)}
                  placeholder="Misal: Senior Content Creator & Practical Writer"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL Foto Profil / Avatar
                </label>
                <input
                  type="text"
                  value={wAvatar}
                  onChange={(e) => setWAvatar(sanitizeAndOptimizeImageUrl(e.target.value, 'avatar'))}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Biografi Singkat Penulis (Author Bio Box)
                </label>
                <textarea
                  rows={3}
                  value={wBio}
                  onChange={(e) => setWBio(e.target.value)}
                  placeholder="Deskripsikan keahlian dan pengalaman penulis..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Instagram URL
                  </label>
                  <input
                    type="text"
                    value={wInstagram}
                    onChange={(e) => setWInstagram(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full px-3 py-1.5 rounded-xl border text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="text"
                    value={wLinkedin}
                    onChange={(e) => setWLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-1.5 rounded-xl border text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={wWebsite}
                    onChange={(e) => setWWebsite(e.target.value)}
                    placeholder="https://dr-ratna.com"
                    className="w-full px-3 py-1.5 rounded-xl border text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingWriter}
                className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSavingWriter ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{writerModalMode === 'create' ? 'Simpan Penulis Baru' : 'Perbarui Profil Penulis'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: AUTO-LINKING ENGINE MANAGER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'autolinks' && currentUser?.role === 'admin' && (
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
      {activeTab === 'sitemap' && currentUser?.role === 'admin' && (
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
      {activeTab === 'config' && currentUser?.role === 'admin' && (
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

            
            {/* SECTION 0: TEMA (TAMPILAN & PALET) */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/20">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Preview Perubahan Visual & AdSense Instant</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">LIVE</span>
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Ubah font size, tema, mode terang/gelap, atau snippet iklan di bawah ini — perubahan akan langsung terlihat seketika di halaman tanpa perlu reload!
                    </p>
                  </div>
                </div>
              </div>

              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Droplet className="w-4 h-4" />
                <span>0. Tema, Tampilan & Tipografi Instant</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {THEME_PRESETS.map((preset) => (
                  <label
                    key={preset.id}
                    className={`cursor-pointer border-2 rounded-xl p-3 flex items-center gap-3 transition-all ${cfgActiveThemePreset === preset.id ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700'}`}
                  >
                    <input
                      type="radio"
                      name="theme_preset"
                      value={preset.id}
                      checked={cfgActiveThemePreset === preset.id}
                      onChange={(e) => setCfgActiveThemePreset(e.target.value)}
                      className="hidden"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{preset.name}</span>
                        <div className="flex">
                          <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: preset.colors.primary }}></span>
                          <span className="w-4 h-4 rounded-full border border-black/10 -ml-1" style={{ backgroundColor: preset.colors.secondary }}></span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                        <span>{preset.category.replace('_', ' ').toUpperCase()}</span>
                        <span className="truncate max-w-[80px]" title={preset.fonts.sans.split(',')[0].replace(/"/g, '')}>{preset.fonts.sans.split(',')[0].replace(/"/g, '')}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mode Tema Default (default_theme_mode)
                  </label>
                  <select
                    value={cfgDefaultThemeMode}
                    onChange={(e) => setCfgDefaultThemeMode(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="auto">Auto Detect OS</option>
                    <option value="light">Bright Mode (Light)</option>
                    <option value="dark">Dark Mode (Night)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ukuran Font Utama / Direct Font Scale (font_size_scale)
                  </label>
                  <select
                    value={cfgFontSizeScale}
                    onChange={(e) => setCfgFontSizeScale(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="small">Kecil (14px Base)</option>
                    <option value="normal">Standar (16px Base Default)</option>
                    <option value="large">Besar (18px Base)</option>
                    <option value="xlarge">Sangat Besar / Mata Tua (20px Base)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Skala Kerapatan Tipografi (font_density_scale)
                  </label>
                  <select
                    value={cfgFontDensityScale}
                    onChange={(e) => setCfgFontDensityScale(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="compact">Dense & Compact</option>
                    <option value="standard">Standard Balanced</option>
                    <option value="spacious">Spacious & Accessible</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Preset Aksesibilitas Usia Pembaca (age_accessibility_preset)
                </label>
                <select
                  value={cfgAgeAccessibilityPreset}
                  onChange={(e) => setCfgAgeAccessibilityPreset(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                >
                  <option value="18-28">18–28 Tahun (Muda/Compact)</option>
                  <option value="29-38">29–38 Tahun (Dewasa/Standar)</option>
                  <option value="39-48">39–48 Tahun (Nyaman/Lega)</option>
                  <option value="49-58">49–58+ Tahun (Mata Tua / Senior Accessible)</option>
                </select>
              </div>
            </div>

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
                    Domain Website (site_domain)
                  </label>
                  <input
                    type="text"
                    value={cfgSiteDomain}
                    onChange={(e) => setCfgSiteDomain(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                    placeholder="domain.com"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Teks Badge Samping Logo Header (header_badge_text)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfgShowHeaderBadge}
                        onChange={(e) => setCfgShowHeaderBadge(e.target.checked)}
                        className="w-3.5 h-3.5 text-rose-600 rounded focus:ring-rose-500"
                      />
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Tampilkan Badge
                      </span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={cfgHeaderBadgeText}
                    onChange={(e) => setCfgHeaderBadgeText(e.target.value)}
                    placeholder="Cloudflare D1 Edge Engine"
                    disabled={!cfgShowHeaderBadge}
                    className={`w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500 ${!cfgShowHeaderBadge ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {cfgShowHeaderBadge
                      ? '✓ Badge `<span>` "Cloudflare D1 Edge Engine" akan ditampilkan di samping logo header.'
                      : '✗ Badge `<span>` "Cloudflare D1 Edge Engine" disembunyikan dari header.'}
                  </p>
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
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Label Tombol Portal Admin Header & Mobile (mobile_admin_btn_label)
                  </label>
                  <input
                    type="text"
                    value={cfgMobileAdminBtnLabel}
                    onChange={(e) => setCfgMobileAdminBtnLabel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                    placeholder="Portal Admin & Editor"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfgMobileShowLoggedUsername}
                      onChange={(e) => setCfgMobileShowLoggedUsername(e.target.checked)}
                      className="w-5 h-5 text-rose-600 rounded border-slate-300 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tampilkan Nama User Saat Login di Tombol Admin Mobile (mobile_show_logged_username)
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Logo URL (site_logo_url)
                  </label>
                  <input
                    type="text"
                    value={cfgSiteLogoUrl}
                    onChange={(e) => setCfgSiteLogoUrl(sanitizeAndOptimizeImageUrl(e.target.value, 'avatar'))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                    placeholder="https://.../logo.png"
                  />
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={cfgEnableSearchBar}
                      onChange={(e) => setCfgEnableSearchBar(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Aktifkan Kolom Pencarian (enable_search_bar)</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={cfgEnableThemeToggle}
                      onChange={(e) => setCfgEnableThemeToggle(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Aktifkan Toggle Tema (enable_theme_toggle)</span>
                  </label>
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

            </div>

            {/* SECTION HOMEPAGE DISPLAY MODE SELECTOR */}
            <div className="space-y-4 pt-6 border-t-2 border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20 p-5 rounded-3xl border border-rose-200/80 dark:border-rose-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-md">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Model Display Website (Homepage Layout Mode)</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                      10 Pilihan Model
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Pilih tampilan beranda (frontpage) yang ingin disajikan kepada pengunjung. Sistem akan menyesuaikan tata letak dan fitur sesuai model yang Anda pilih.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                {[
                  {
                    id: 'default',
                    label: 'Default (Blog & Magz)',
                    desc: 'Portal majalah edukasi & berita standar dengan hero banner, filter topik, auto-links & grid artikel.',
                    badge: 'Standar',
                  },
                  {
                    id: 'event',
                    label: 'Event & Konferensi',
                    desc: 'Tata letak seminar/summit dengan countdown timer, daftar narasumber, jadwal sesi & tiket.',
                    badge: 'Summit',
                  },
                  {
                    id: 'campaign',
                    label: 'Campaign & Petisi',
                    desc: 'Gerakan sosial bebas stunting dengan bar target donasi, form petisi & pilar aksi nyata.',
                    badge: 'Aksi Sosial',
                  },
                  {
                    id: 'microsite',
                    label: 'Microsite / Bio Links',
                    desc: 'Halaman profil ringkas tautan cepat (WA konsultasi, e-book, grup telegram, podcast).',
                    badge: 'Link in Bio',
                  },
                  {
                    id: 'portfolio',
                    label: 'Portofolio & Karya',
                    desc: 'Showcase portofolio program riset, buku panduan & karya dengan filter kategori visual.',
                    badge: 'Showcase',
                  },
                  {
                    id: 'personal_branding',
                    label: 'Personal Branding',
                    desc: 'Profil resmi pakar / personal branding dengan kredensial, form booking privat & karya tulis.',
                    badge: 'Profil Pakar',
                  },
                  {
                    id: 'corporate',
                    label: 'Corporate & B2B',
                    desc: 'Profil solusi perusahaan (EAP, Daycare kantor) lengkap dengan proposal form & metrik B2B.',
                    badge: 'Bisnis',
                  },
                  {
                    id: 'product_landing',
                    label: 'Product Landing Page',
                    desc: 'Showcase paket produk MPASI & stimulasi anak lengkap dengan rating, paket harga & FAQ.',
                    badge: 'Penjualan',
                  },
                  {
                    id: 'classified_ads',
                    label: 'Iklan Baris Koran Dulu',
                    desc: 'Nuansa vintage koran cetak nostalgia, frame ganda antik, kolom iklan & formulir pasang iklan.',
                    badge: 'Nostalgia',
                  },
                  {
                    id: 'knowledge_base',
                    label: 'Knowledge Base',
                    desc: 'Pusat bantuan & ensiklopedia pengasuhan terstruktur berdasarkan kategori topik terpadu.',
                    badge: 'Ensiklopedia',
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setCfgHomepageDisplayMode(mode.id as HomepageDisplayMode)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden ${
                      cfgHomepageDisplayMode === mode.id
                        ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/30 ring-2 ring-rose-400'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-rose-400 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          cfgHomepageDisplayMode === mode.id
                            ? 'bg-white text-rose-700'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}>
                          {mode.badge}
                        </span>
                        {cfgHomepageDisplayMode === mode.id && (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <h5 className="font-extrabold text-xs mb-1.5">{mode.label}</h5>
                      <p className={`text-[11px] leading-relaxed ${
                        cfgHomepageDisplayMode === mode.id ? 'text-rose-100' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {mode.desc}
                      </p>
                    </div>

                    <div className="pt-3 mt-2 border-t border-current/15 text-[10px] font-bold">
                      {cfgHomepageDisplayMode === mode.id ? '✓ Sedang Aktif' : 'Klik untuk Mengaktifkan'}
                    </div>
                  </button>
                ))}
              </div>

              {/* DEDICATED INPUT SECTION: WORDING & DATA KUSTOMISASI UNTUK 10 MODEL HOMEPAGE */}
              <div className="mt-6 p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500 text-white shadow-sm">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Kustomisasi Teks & Data Model Frontpage</span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          10 Model Siap Pakai
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Ubah judul banner, sub-judul, target donasi, harga promo, atau nomor WhatsApp tiap model tanpa mengedit file kode.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span>Model Aktif:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                      {cfgHomepageDisplayMode}
                    </span>
                  </div>
                </div>

                {/* TAB SWITCHER MODEL YANG INGIN DIKUSTOMISASI */}
                <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-200/60 dark:bg-slate-800/80 rounded-2xl">
                  {[
                    { id: 'default', label: 'Default' },
                    { id: 'event', label: 'Event' },
                    { id: 'campaign', label: 'Campaign' },
                    { id: 'microsite', label: 'Microsite' },
                    { id: 'portfolio', label: 'Portofolio' },
                    { id: 'personal_branding', label: 'Personal' },
                    { id: 'corporate', label: 'Corporate B2B' },
                    { id: 'product_landing', label: 'Product Landing' },
                    { id: 'classified_ads', label: 'Iklan Baris' },
                    { id: 'knowledge_base', label: 'Knowledge Base' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedModelConfigTab(tab.id as HomepageDisplayMode)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        selectedModelConfigTab === tab.id
                          ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {cfgHomepageDisplayMode === tab.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      )}
                    </button>
                  ))}
                </div>

                {/* 1. DEFAULT (BLOG & MAGZ) PANEL */}
                {selectedModelConfigTab === 'default' && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-rose-600 dark:text-rose-400">
                        1. Pengaturan Teks Model Default (Blog & Magz)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">hero_title / hero_subtitle</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Badge Teks Hero (hero_badge_text)
                        </label>
                        <input
                          type="text"
                          value={cfgHeroBadgeText}
                          onChange={(e) => setCfgHeroBadgeText(e.target.value)}
                          placeholder="Misal: Portal Nomor 1"
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
                          placeholder="Misal: Jelajahi Artikel"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Judul Utama Hero Banner (hero_title)
                      </label>
                      <input
                        type="text"
                        value={cfgHeroTitle}
                        onChange={(e) => setCfgHeroTitle(e.target.value)}
                        placeholder="Misal: Panduan Pengasuhan Anak Terpercaya"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Sub-Judul Hero Banner (hero_subtitle)
                      </label>
                      <textarea
                        rows={2}
                        value={cfgHeroSubtitle}
                        onChange={(e) => setCfgHeroSubtitle(e.target.value)}
                        placeholder="Misal: Temukan artikel, tips nutrisi, dan edukasi tumbuh kembang anak."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                )}

                {/* 2. EVENT & SUMMIT PANEL */}
                {selectedModelConfigTab === 'event' && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-rose-600 dark:text-rose-400">
                        2. Pengaturan Wording & Data Model Event & Konferensi
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">event_*</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Badge Acara (event_badge_text)
                        </label>
                        <input
                          type="text"
                          value={cfgEventBadgeText}
                          onChange={(e) => setCfgEventBadgeText(e.target.value)}
                          placeholder="Summit Nasional Parenting 2026"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Tanggal & Lokasi Acara (event_date_location)
                        </label>
                        <input
                          type="text"
                          value={cfgEventDateLocation}
                          onChange={(e) => setCfgEventDateLocation(e.target.value)}
                          placeholder="16 - 18 Oktober 2026 • JCC Senayan, Jakarta"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Judul Utama Acara (event_title)
                      </label>
                      <input
                        type="text"
                        value={cfgEventTitle}
                        onChange={(e) => setCfgEventTitle(e.target.value)}
                        placeholder="Indonesia Parenting Summit 2026: Membangun Fondasi Emas Keluarga Tangguh"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Sub-Judul & Narasi Acara (event_subtitle)
                      </label>
                      <textarea
                        rows={2}
                        value={cfgEventSubtitle}
                        onChange={(e) => setCfgEventSubtitle(e.target.value)}
                        placeholder="Konferensi & lokakarya parenting terbesar di Indonesia. Dapatkan wawasan ilmiah terdepan..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Teks Tombol Tiket (event_cta_text)
                        </label>
                        <input
                          type="text"
                          value={cfgEventCtaText}
                          onChange={(e) => setCfgEventCtaText(e.target.value)}
                          placeholder="Daftar / Dapatkan Tiket"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          WhatsApp Tiket/Panitia (event_whatsapp)
                        </label>
                        <input
                          type="text"
                          value={cfgEventWhatsapp}
                          onChange={(e) => setCfgEventWhatsapp(e.target.value)}
                          placeholder="6281234567890"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CAMPAIGN & PETISI PANEL */}
                {selectedModelConfigTab === 'campaign' && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-rose-600 dark:text-rose-400">
                        3. Pengaturan Wording & Metrik Donasi Campaign
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">campaign_*</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Badge Kampanye (campaign_badge_text)
                      </label>
                      <input
                        type="text"
                        value={cfgCampaignBadgeText}
                        onChange={(e) => setCfgCampaignBadgeText(e.target.value)}
                        placeholder="Aksi Sosial Nasional"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Judul Utama Kampanye (campaign_title)
                      </label>
                      <input
                        type="text"
                        value={cfgCampaignTitle}
                        onChange={(e) => setCfgCampaignTitle(e.target.value)}
                        placeholder="Gerakan 1.000 Hari Pertama: Wujudkan Generasi Bebas Stunting"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Sub-Judul & Narasi Kampanye (campaign_subtitle)
                      </label>
                      <textarea
                        rows={2}
                        value={cfgCampaignSubtitle}
                        onChange={(e) => setCfgCampaignSubtitle(e.target.value)}
                        placeholder="Setiap anak Indonesia berhak mendapatkan nutrisi optimal dan kasih sayang..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Target Donasi (campaign_target_amount)
                        </label>
                        <input
                          type="text"
                          value={cfgCampaignTargetAmount}
                          onChange={(e) => setCfgCampaignTargetAmount(e.target.value)}
                          placeholder="500000000"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Donasi Terkumpul (campaign_current_amount)
                        </label>
                        <input
                          type="text"
                          value={cfgCampaignCurrentAmount}
                          onChange={(e) => setCfgCampaignCurrentAmount(e.target.value)}
                          placeholder="388500000"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Jumlah Donatur (campaign_donor_count)
                        </label>
                        <input
                          type="text"
                          value={cfgCampaignDonorCount}
                          onChange={(e) => setCfgCampaignDonorCount(e.target.value)}
                          placeholder="1.428"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. MICROSITE / BIO LINKS PANEL */}
                {selectedModelConfigTab === 'microsite' && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-rose-600 dark:text-rose-400">
                        4. Pengaturan Tautan & Kontak Microsite / Bio Links
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">microsite_*</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Judul Profil Hub (microsite_title)
                        </label>
                        <input
                          type="text"
                          value={cfgMicrositeTitle}
                          onChange={(e) => setCfgMicrositeTitle(e.target.value)}
                          placeholder="Parenting.my.id Official Hub"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nomor WhatsApp Utama (microsite_wa_number)
                        </label>
                        <input
                          type="text"
                          value={cfgMicrositeWaNumber}
                          onChange={(e) => setCfgMicrositeWaNumber(e.target.value)}
                          placeholder="6281234567890"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Bio Singkat Pengantar (microsite_bio)
                      </label>
                      <textarea
                        rows={2}
                        value={cfgMicrositeBio}
                        onChange={(e) => setCfgMicrositeBio(e.target.value)}
                        placeholder="Pusat informasi, konsultasi dokter anak, panduan MPASI..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Label Tombol WhatsApp (microsite_wa_label)
                      </label>
                      <input
                        type="text"
                        value={cfgMicrositeWaLabel}
                        onChange={(e) => setCfgMicrositeWaLabel(e.target.value)}
                        placeholder="Konsultasi Privat Parenting (WhatsApp)"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          URL Download E-Book (microsite_ebook_url)
                        </label>
                        <input
                          type="text"
                          value={cfgMicrositeEbookUrl}
                          onChange={(e) => setCfgMicrositeEbookUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          URL Komunitas Telegram (microsite_telegram_url)
                        </label>
                        <input
                          type="text"
                          value={cfgMicrositeTelegramUrl}
                          onChange={(e) => setCfgMicrositeTelegramUrl(e.target.value)}
                          placeholder="https://t.me/parentingmyid"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          URL Podcast Spotify (microsite_podcast_url)
                        </label>
                        <input
                          type="text"
                          value={cfgMicrositePodcastUrl}
                          onChange={(e) => setCfgMicrositePodcastUrl(e.target.value)}
                          placeholder="https://spotify.com"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          URL Toko / Belanja (microsite_shop_url)
                        </label>
                        <input
                          type="text"
                          value={cfgMicrositeShopUrl}
                          onChange={(e) => setCfgMicrositeShopUrl(e.target.value)}
                          placeholder="https://tokopedia.com/..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. PORTFOLIO PANEL */}
                {selectedModelConfigTab === 'portfolio' && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-rose-600 dark:text-rose-400">
                        5. Pengaturan Wording & Metrik Portofolio Showcase
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">portfolio_*</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Badge Portofolio (portfolio_badge_text)
                      </label>
                      <input
                        type="text"
                        value={cfgPortfolioBadgeText}
                        onChange={(e) => setCfgPortfolioBadgeText(e.target.value)}
                        placeholder="Showcase Portofolio & Rekam Jejak"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Judul Utama Portofolio (portfolio_title)
                      </label>
                      <input
                        type="text"
                        value={cfgPortfolioTitle}
                        onChange={(e) => setCfgPortfolioTitle(e.target.value)}
                        placeholder="Karya, Program Edukasi & Penelitian Parenting"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Sub-Judul Portofolio (portfolio_subtitle)
                      </label>
                      <textarea
                        rows={2}
                        value={cfgPortfolioSubtitle}
                        onChange={(e) => setCfgPortfolioSubtitle(e.target.value)}
                        placeholder="Dedikasi nyata dalam merancang program edukasi keluarga..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Statistik 1 (Nilai & Label)</label>
                        <input
                          type="text"
                          value={cfgPortfolioStat1Val}
                          onChange={(e) => setCfgPortfolioStat1Val(e.target.value)}
                          placeholder="50K+"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold mb-1"
                        />
                        <input
                          type="text"
                          value={cfgPortfolioStat1Lbl}
                          onChange={(e) => setCfgPortfolioStat1Lbl(e.target.value)}
                          placeholder="Keluarga Terbantu"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Statistik 2 (Nilai & Label)</label>
                        <input
                          type="text"
                          value={cfgPortfolioStat2Val}
                          onChange={(e) => setCfgPortfolioStat2Val(e.target.value)}
                          placeholder="120+"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold mb-1"
                        />
                        <input
                          type="text"
                          value={cfgPortfolioStat2Lbl}
                          onChange={(e) => setCfgPortfolioStat2Lbl(e.target.value)}
                          placeholder="Workshop Nasional"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Statistik 3 (Nilai & Label)</label>
                        <input
                          type="text"
                          value={cfgPortfolioStat3Val}
                          onChange={(e) => setCfgPortfolioStat3Val(e.target.value)}
                          placeholder="15+"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold mb-1"
                        />
                        <input
                          type="text"
                          value={cfgPortfolioStat3Lbl}
                          onChange={(e) => setCfgPortfolioStat3Lbl(e.target.value)}
                          placeholder="Riset Terpublikasi"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. PERSONAL BRANDING PANEL */}
                {selectedModelConfigTab === 'personal_branding' && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-rose-600 dark:text-rose-400">
                        6. Pengaturan Profil Personal Branding (Dokter / Pakar)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">doctor_*</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nama Lengkap & Gelar (doctor_name)
                        </label>
                        <input
                          type="text"
                          value={cfgDoctorName}
                          onChange={(e) => setCfgDoctorName(e.target.value)}
                          placeholder="dr. Siti Rahma, Sp.A(K), M.Kes"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Spesialisasi / Gelar Singkat (doctor_title)
                        </label>
                        <input
                          type="text"
                          value={cfgDoctorTitle}
                          onChange={(e) => setCfgDoctorTitle(e.target.value)}
                          placeholder="Dokter Spesialis Anak & Konsultan Nutrisi Pediatrik"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Badge / Status Kategori (doctor_badge_text)
                        </label>
                        <input
                          type="text"
                          value={cfgDoctorBadgeText}
                          onChange={(e) => setCfgDoctorBadgeText(e.target.value)}
                          placeholder="Dokter Spesialis Anak & Konsultan Pengasuhan"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Tahun Pengalaman (doctor_experience_years)
                        </label>
                        <input
                          type="text"
                          value={cfgDoctorExperienceYears}
                          onChange={(e) => setCfgDoctorExperienceYears(e.target.value)}
                          placeholder="15+ Tahun Pengalaman"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Biografi & Narasi Dokter (doctor_bio)
                      </label>
                      <textarea
                        rows={2}
                        value={cfgDoctorBio}
                        onChange={(e) => setCfgDoctorBio(e.target.value)}
                        placeholder="Membantu ratusan ribu orang tua muda di Indonesia..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          URL Foto Profil Dokter (doctor_avatar_url)
                        </label>
                        <input
                          type="text"
                          value={cfgDoctorAvatarUrl}
                          onChange={(e) => setCfgDoctorAvatarUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          WhatsApp Booking Privat (doctor_booking_whatsapp)
                        </label>
                        <input
                          type="text"
                          value={cfgDoctorBookingWhatsapp}
                          onChange={(e) => setCfgDoctorBookingWhatsapp(e.target.value)}
                          placeholder="6281234567890"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. CORPORATE & B2B PANEL */}
                {selectedModelConfigTab === 'corporate' && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-rose-600 dark:text-rose-400">
                        7. Pengaturan Solusi Corporate & B2B Kemitraan
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">corporate_*</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Badge Solusi Bisnis (corporate_badge_text)
                        </label>
                        <input
                          type="text"
                          value={cfgCorporateBadgeText}
                          onChange={(e) => setCfgCorporateBadgeText(e.target.value)}
                          placeholder="Solusi Korporasi & Employee Wellbeing"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          WhatsApp Kemitraan Korporasi (corporate_whatsapp)
                        </label>
                        <input
                          type="text"
                          value={cfgCorporateWhatsapp}
                          onChange={(e) => setCfgCorporateWhatsapp(e.target.value)}
                          placeholder="6281234567890"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Judul Utama Solusi Korporasi (corporate_title)
                      </label>
                      <input
                        type="text"
                        value={cfgCorporateTitle}
                        onChange={(e) => setCfgCorporateTitle(e.target.value)}
                        placeholder="Meningkatkan Produktivitas Karyawan Melalui Dukungan Pengasuhan Terpercaya"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Sub-Judul & Program Korporasi (corporate_subtitle)
                      </label>
                      <textarea
                        rows={2}
                        value={cfgCorporateSubtitle}
                        onChange={(e) => setCfgCorporateSubtitle(e.target.value)}
                        placeholder="Program kemitraan Employee Assistance Program (EAP), daycare kantor..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Teks Tombol Proposal B2B (corporate_cta_proposal)
                        </label>
                        <input
                          type="text"
                          value={cfgCorporateCtaProposal}
                          onChange={(e) => setCfgCorporateCtaProposal(e.target.value)}
                          placeholder="Unduh Proposal & Rate Card B2B"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Teks Tombol Konsultasi (corporate_cta_consult)
                        </label>
                        <input
                          type="text"
                          value={cfgCorporateCtaConsult}
                          onChange={(e) => setCfgCorporateCtaConsult(e.target.value)}
                          placeholder="Jadwalkan Konsultasi Korporasi"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Metrik 1 (Nilai & Label)</label>
                        <input
                          type="text"
                          value={cfgCorporateStat1Val}
                          onChange={(e) => setCfgCorporateStat1Val(e.target.value)}
                          placeholder="85+"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold mb-1"
                        />
                        <input
                          type="text"
                          value={cfgCorporateStat1Lbl}
                          onChange={(e) => setCfgCorporateStat1Lbl(e.target.value)}
                          placeholder="Korporasi Mitra"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Metrik 2 (Nilai & Label)</label>
                        <input
                          type="text"
                          value={cfgCorporateStat2Val}
                          onChange={(e) => setCfgCorporateStat2Val(e.target.value)}
                          placeholder="98%"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold mb-1"
                        />
                        <input
                          type="text"
                          value={cfgCorporateStat2Lbl}
                          onChange={(e) => setCfgCorporateStat2Lbl(e.target.value)}
                          placeholder="Retensi Karyawan"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Metrik 3 (Nilai & Label)</label>
                        <input
                          type="text"
                          value={cfgCorporateStat3Val}
                          onChange={(e) => setCfgCorporateStat3Val(e.target.value)}
                          placeholder="12.000+"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold mb-1"
                        />
                        <input
                          type="text"
                          value={cfgCorporateStat3Lbl}
                          onChange={(e) => setCfgCorporateStat3Lbl(e.target.value)}
                          placeholder="Karyawan Terbantu"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. PRODUCT LANDING PAGE PANEL */}
                {selectedModelConfigTab === 'product_landing' && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-rose-600 dark:text-rose-400">
                        8. Pengaturan Penjualan Paket Produk Landing Page
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">product_*</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Badge Produk Promo (product_badge_text)
                        </label>
                        <input
                          type="text"
                          value={cfgProductBadgeText}
                          onChange={(e) => setCfgProductBadgeText(e.target.value)}
                          placeholder="Edisi Spesial Panduan Pengasuhan Emas 2026"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nomor WhatsApp Order (product_whatsapp)
                        </label>
                        <input
                          type="text"
                          value={cfgProductWhatsapp}
                          onChange={(e) => setCfgProductWhatsapp(e.target.value)}
                          placeholder="6281234567890"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nama / Judul Paket Produk (product_title)
                      </label>
                      <input
                        type="text"
                        value={cfgProductTitle}
                        onChange={(e) => setCfgProductTitle(e.target.value)}
                        placeholder="Paket Komplit MPASI & Stimulasi Anak Anti-GTM"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Sub-Judul / Manfaat Utama (product_subtitle)
                      </label>
                      <textarea
                        rows={2}
                        value={cfgProductSubtitle}
                        onChange={(e) => setCfgProductSubtitle(e.target.value)}
                        placeholder="Solusi tuntas mengatasi Gerakan Tutup Mulut, memastikan asupan zat besi..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Harga Promo (product_price)
                        </label>
                        <input
                          type="text"
                          value={cfgProductPrice}
                          onChange={(e) => setCfgProductPrice(e.target.value)}
                          placeholder="Rp 189.000"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Harga Coret (product_original_price)
                        </label>
                        <input
                          type="text"
                          value={cfgProductOriginalPrice}
                          onChange={(e) => setCfgProductOriginalPrice(e.target.value)}
                          placeholder="Rp 299.000"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Tag Diskon (product_discount_tag)
                        </label>
                        <input
                          type="text"
                          value={cfgProductDiscountTag}
                          onChange={(e) => setCfgProductDiscountTag(e.target.value)}
                          placeholder="HEMAT 37%"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Teks Tombol Order (product_cta_text)
                        </label>
                        <input
                          type="text"
                          value={cfgProductCtaText}
                          onChange={(e) => setCfgProductCtaText(e.target.value)}
                          placeholder="Pesan Sekarang & Dapatkan Bonus"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. CLASSIFIED ADS VINTAGE NEWSPAPER PANEL */}
                {selectedModelConfigTab === 'classified_ads' && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-rose-600 dark:text-rose-400">
                        9. Pengaturan Wording Iklan Baris Koran Jaman Dulu
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">classified_*</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Judul Kepala Koran / Masthead (classified_masthead_title)
                        </label>
                        <input
                          type="text"
                          value={cfgClassifiedMastheadTitle}
                          onChange={(e) => setCfgClassifiedMastheadTitle(e.target.value)}
                          placeholder="WARNA-WARTO PARENTING"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Sub-Judul Masthead Koran (classified_masthead_subtitle)
                        </label>
                        <input
                          type="text"
                          value={cfgClassifiedMastheadSubtitle}
                          onChange={(e) => setCfgClassifiedMastheadSubtitle(e.target.value)}
                          placeholder="LEMBARAN IKLAN BARIS, PENGUMUMAN & WARTA KELUARGA"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          No. Edisi & Tahun (classified_edition)
                        </label>
                        <input
                          type="text"
                          value={cfgClassifiedEdition}
                          onChange={(e) => setCfgClassifiedEdition(e.target.value)}
                          placeholder="1988/2026"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Label Harga Eceran (classified_price_tag)
                        </label>
                        <input
                          type="text"
                          value={cfgClassifiedPriceTag}
                          onChange={(e) => setCfgClassifiedPriceTag(e.target.value)}
                          placeholder="HARGA ECERAN RP 500,-"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Telepon Redaksi Iklan (classified_phone)
                        </label>
                        <input
                          type="text"
                          value={cfgClassifiedPhone}
                          onChange={(e) => setCfgClassifiedPhone(e.target.value)}
                          placeholder="(021) 7654321"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 10. KNOWLEDGE BASE PANEL */}
                {selectedModelConfigTab === 'knowledge_base' && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-rose-600 dark:text-rose-400">
                        10. Pengaturan Wording Knowledge Base & Ensiklopedia
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">kb_*</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Badge Ensiklopedia (kb_badge_text)
                      </label>
                      <input
                        type="text"
                        value={cfgKbBadgeText}
                        onChange={(e) => setCfgKbBadgeText(e.target.value)}
                        placeholder="Ensiklopedia & Pusat Bantuan Parenting"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Judul Utama Pusat Bantuan (kb_title)
                      </label>
                      <input
                        type="text"
                        value={cfgKbTitle}
                        onChange={(e) => setCfgKbTitle(e.target.value)}
                        placeholder="Bagaimana Kami Bisa Membantu Pengasuhan Anda?"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Sub-Judul & Panduan Cari (kb_subtitle)
                      </label>
                      <textarea
                        rows={2}
                        value={cfgKbSubtitle}
                        onChange={(e) => setCfgKbSubtitle(e.target.value)}
                        placeholder="Cari jawaban terpercaya dari ribuan artikel, panduan medis..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Placeholder Kolom Pencarian (kb_search_placeholder)
                      </label>
                      <input
                        type="text"
                        value={cfgKbSearchPlaceholder}
                        onChange={(e) => setCfgKbSearchPlaceholder(e.target.value)}
                        placeholder="Ketik topik (misal: jadwal MPASI, anak demam, speech delay, tantrum)..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION NAV BUILDER: TOP BAR, HAMBURGER & FOOTER */}
            <div className="space-y-6 pt-6 border-t-2 border-rose-500/20 bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-md">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Pengaturan Visual Menu Navigasi Website</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold uppercase tracking-wider border border-rose-500/20">Mudah & Visual</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Atur menu Top Bar Header, Mobile Hamburger Drawer, dan Footer tanpa mengetik JSON manual. Tambah, edit, hapus, dan atur urutan menu secara visual!
                  </p>
                </div>
              </div>

              {/* 1. TOP BAR NAV BUILDER */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-rose-500" />
                    <span>1. Setting Top Bar Navigation (Desktop Header)</span>
                  </h5>
                  <span className="text-[10px] font-semibold text-slate-500">Tampil di Komputer / Laptop</span>
                </div>
                <NavigationBuilder
                  links={cfgHeaderNavLinksArray}
                  onChange={setCfgHeaderNavLinksArray}
                  title="Menu Top Bar Header"
                  description="Atur tautan menu yang tampil di baris atas header website."
                />
              </div>

              {/* 2. HAMBURGER MENU BUILDER */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Menu className="w-4 h-4 text-amber-500" />
                    <span>2. Setting Menu Hamburger (Mobile Navigation Drawer)</span>
                  </h5>
                  <span className="text-[10px] font-semibold text-slate-500">Tampil saat menekan menu ☰ di HP</span>
                </div>
                <NavigationBuilder
                  links={cfgHamburgerNavLinksArray}
                  onChange={setCfgHamburgerNavLinksArray}
                  title="Menu Hamburger Drawer"
                  description="Atur tautan menu khusus yang tampil saat pengunjung membuka drawer mobile di HP."
                />
              </div>

              {/* 3. FOOTER NAV BUILDER */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Layout className="w-4 h-4 text-emerald-500" />
                    <span>3. Setting Footer Navigation (Tautan Navigasi Platform)</span>
                  </h5>
                  <span className="text-[10px] font-semibold text-slate-500">Tampil di bagian paling bawah website</span>
                </div>
                <NavigationBuilder
                  links={cfgFooterMenuLinksArray}
                  onChange={setCfgFooterMenuLinksArray}
                  title="Menu Footer Website"
                  description="Atur daftar tautan navigasi platform di bagian bawah (Footer)."
                />
              </div>

              {/* 4. FOOTER CATEGORY LINKS BUILDER */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <span>4. Setting Kategori Artikel Footer (Tautan Kategori Footer)</span>
                  </h5>
                  <span className="text-[10px] font-semibold text-slate-500">Daftar Kategori yang dapat diklik di Footer</span>
                </div>
                <NavigationBuilder
                  links={cfgFooterCategoryLinksArray}
                  onChange={setCfgFooterCategoryLinksArray}
                  title="Tautan Kategori Footer"
                  description="Atur daftar tautan kategori artikel di Footer agar pengunjung bisa langsung menglik kategori tersebut."
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
                    onChange={(e) => setCfgSeoDefaultOgImage(sanitizeAndOptimizeImageUrl(e.target.value, 'og'))}
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
                    Badge/Label Hero (hero_badge_text)
                  </label>
                  <input
                    type="text"
                    value={cfgHeroBadgeText}
                    onChange={(e) => setCfgHeroBadgeText(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500 mb-4"
                  />
                  
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
                  URL Tujuan CTA Hero (hero_cta_link)
                </label>
                <input
                  type="text"
                  value={cfgHeroCtaLink}
                  onChange={(e) => setCfgHeroCtaLink(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                />
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

              {/* PERFORMANCE METRIC BOX CONFIGURATION */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="show_performance_box"
                    checked={cfgShowPerformanceBox}
                    onChange={(e) => setCfgShowPerformanceBox(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                  />
                  <label htmlFor="show_performance_box" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tampilkan Box Metric / Performa di Samping Hero Banner (show_performance_box)
                  </label>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">Kustomisasi Angka, Animasi & Satuan Metrik Performa</span>
                    <span className="text-[10px] font-semibold text-slate-500">Live Animasi Saat Scroll (requestAnimationFrame)</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Metric 1 */}
                    <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cfgMetric1Show}
                            onChange={(e) => setCfgMetric1Show(e.target.checked)}
                            className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                          />
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Tampilkan Metrik 1</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">metric_1_show</span>
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Label Metrik</label>
                        <input
                          type="text"
                          value={cfgMetric1Label}
                          onChange={(e) => setCfgMetric1Label(e.target.value)}
                          placeholder="Kecepatan"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Mode Animasi</label>
                        <select
                          value={cfgMetric1AnimType}
                          onChange={(e) => setCfgMetric1AnimType(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                        >
                          <option value="fixed">Statis / Fixed</option>
                          <option value="count_up">Count Up (Naik)</option>
                          <option value="count_down">Count Down (Turun)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Angka Awal</label>
                          <input
                            type="number"
                            value={cfgMetric1StartVal}
                            onChange={(e) => setCfgMetric1StartVal(Number(e.target.value))}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Angka Akhir</label>
                          <input
                            type="number"
                            value={cfgMetric1EndVal}
                            onChange={(e) => setCfgMetric1EndVal(Number(e.target.value))}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-emerald-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Durasi (ms)</label>
                          <input
                            type="number"
                            step="100"
                            value={cfgMetric1Duration}
                            onChange={(e) => setCfgMetric1Duration(Number(e.target.value))}
                            placeholder="2000"
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Satuan / Unit</label>
                          <input
                            type="text"
                            value={cfgMetric1Unit}
                            onChange={(e) => setCfgMetric1Unit(e.target.value)}
                            placeholder="misal: +, %, ms"
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Metric 2 */}
                    <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cfgMetric2Show}
                            onChange={(e) => setCfgMetric2Show(e.target.checked)}
                            className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                          />
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Tampilkan Metrik 2</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">metric_2_show</span>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Label Metrik</label>
                        <input
                          type="text"
                          value={cfgMetric2Label}
                          onChange={(e) => setCfgMetric2Label(e.target.value)}
                          placeholder="Kualitas"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Mode Animasi</label>
                        <select
                          value={cfgMetric2AnimType}
                          onChange={(e) => setCfgMetric2AnimType(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                        >
                          <option value="fixed">Statis / Fixed</option>
                          <option value="count_up">Count Up (Naik)</option>
                          <option value="count_down">Count Down (Turun)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Angka Awal</label>
                          <input
                            type="number"
                            value={cfgMetric2StartVal}
                            onChange={(e) => setCfgMetric2StartVal(Number(e.target.value))}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Angka Akhir</label>
                          <input
                            type="number"
                            value={cfgMetric2EndVal}
                            onChange={(e) => setCfgMetric2EndVal(Number(e.target.value))}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-emerald-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Durasi (ms)</label>
                          <input
                            type="number"
                            step="100"
                            value={cfgMetric2Duration}
                            onChange={(e) => setCfgMetric2Duration(Number(e.target.value))}
                            placeholder="2000"
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Satuan / Unit</label>
                          <input
                            type="text"
                            value={cfgMetric2Unit}
                            onChange={(e) => setCfgMetric2Unit(e.target.value)}
                            placeholder="misal: %, users"
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Metric 3 */}
                    <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cfgMetric3Show}
                            onChange={(e) => setCfgMetric3Show(e.target.checked)}
                            className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                          />
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Tampilkan Metrik 3</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">metric_3_show</span>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Label Metrik</label>
                        <input
                          type="text"
                          value={cfgMetric3Label}
                          onChange={(e) => setCfgMetric3Label(e.target.value)}
                          placeholder="Respon Delay"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Mode Animasi</label>
                        <select
                          value={cfgMetric3AnimType}
                          onChange={(e) => setCfgMetric3AnimType(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                        >
                          <option value="fixed">Statis / Fixed</option>
                          <option value="count_up">Count Up (Naik)</option>
                          <option value="count_down">Count Down (Turun)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Angka Awal</label>
                          <input
                            type="number"
                            value={cfgMetric3StartVal}
                            onChange={(e) => setCfgMetric3StartVal(Number(e.target.value))}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Angka Akhir</label>
                          <input
                            type="number"
                            value={cfgMetric3EndVal}
                            onChange={(e) => setCfgMetric3EndVal(Number(e.target.value))}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-emerald-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Durasi (ms)</label>
                          <input
                            type="number"
                            step="100"
                            value={cfgMetric3Duration}
                            onChange={(e) => setCfgMetric3Duration(Number(e.target.value))}
                            placeholder="2000"
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Satuan / Unit</label>
                          <input
                            type="text"
                            value={cfgMetric3Unit}
                            onChange={(e) => setCfgMetric3Unit(e.target.value)}
                            placeholder="misal: ms, dt, view"
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Label Autolink Footer (footer_autolink_label)
                  </label>
                  <input
                    type="text"
                    value={cfgFooterAutolinkLabel}
                    onChange={(e) => setCfgFooterAutolinkLabel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Badge 1</label>
                    <input type="text" value={cfgFooterBadge1} onChange={(e) => setCfgFooterBadge1(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Badge 2</label>
                    <input type="text" value={cfgFooterBadge2} onChange={(e) => setCfgFooterBadge2(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Badge 3</label>
                    <input type="text" value={cfgFooterBadge3} onChange={(e) => setCfgFooterBadge3(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500" />
                  </div>
                </div>
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

            {/* SECTION 5: LAYOUT & ARTIKEL */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>5. Pengaturan Artikel & Layout</span>
              </h4>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Label Ticker Autolink (autolink_ticker_label)
                </label>
                <input
                  type="text"
                  value={cfgAutolinkTickerLabel}
                  onChange={(e) => setCfgAutolinkTickerLabel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Artikel Per Halaman (posts_per_page)
                  </label>
                  <input
                    type="number"
                    value={cfgPostsPerPage}
                    onChange={(e) => setCfgPostsPerPage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipe Pagination (pagination_type)
                  </label>
                  <select
                    value={cfgPaginationType}
                    onChange={(e) => setCfgPaginationType(e.target.value as 'load_more' | 'infinite_scroll' | 'numbered')}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="load_more">Load More Button</option>
                    <option value="numbered">Numbered Pages (1, 2, 3)</option>
                    <option value="infinite_scroll">Infinite Scroll</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={cfgEnableFeaturedPost}
                      onChange={(e) => setCfgEnableFeaturedPost(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tampilkan Artikel Pilihan (enable_featured_post)</span>
                  </label>
                </div>
              </div>

              {/* PENGATURAN MESIN KOMENTAR (COMMENT ENGINE MODE) */}
              <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Pilihan Mesin Komentar Artikel (comment_engine_mode)
                    </label>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold">
                    Opsi Fleksibel
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Pilih mesin komentar yang aktif di bagian bawah setiap artikel: pasang salah satu saja (Native D1 / Cusdis) atau aktifkan keduanya sekaligus.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {/* OPTION 1: BOTH */}
                  <div
                    onClick={() => setCfgCommentEngineMode('both')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      cfgCommentEngineMode === 'both'
                        ? 'border-rose-500 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-rose-200 dark:ring-rose-900/40'
                        : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>🔥 Keduanya (Both)</span>
                      </span>
                      <input
                        type="radio"
                        name="comment_engine_mode"
                        value="both"
                        checked={cfgCommentEngineMode === 'both'}
                        onChange={() => setCfgCommentEngineMode('both')}
                        className="w-4 h-4 text-rose-600"
                      />
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-snug">
                      Form internal Native (D1) + Widget Cusdis Embed aktif bersamaan.
                    </p>
                  </div>

                  {/* OPTION 2: NATIVE ONLY */}
                  <div
                    onClick={() => setCfgCommentEngineMode('native')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      cfgCommentEngineMode === 'native'
                        ? 'border-rose-500 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-rose-200 dark:ring-rose-900/40'
                        : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>⚡ Native D1 Saja</span>
                      </span>
                      <input
                        type="radio"
                        name="comment_engine_mode"
                        value="native"
                        checked={cfgCommentEngineMode === 'native'}
                        onChange={() => setCfgCommentEngineMode('native')}
                        className="w-4 h-4 text-rose-600"
                      />
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-snug">
                      Hanya form komentar bawaan website, data tersimpan di Cloudflare D1.
                    </p>
                  </div>

                  {/* OPTION 3: CUSDIS ONLY */}
                  <div
                    onClick={() => setCfgCommentEngineMode('cusdis')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      cfgCommentEngineMode === 'cusdis'
                        ? 'border-rose-500 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-rose-200 dark:ring-rose-900/40'
                        : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>💬 Cusdis Embed Saja</span>
                      </span>
                      <input
                        type="radio"
                        name="comment_engine_mode"
                        value="cusdis"
                        checked={cfgCommentEngineMode === 'cusdis'}
                        onChange={() => setCfgCommentEngineMode('cusdis')}
                        className="w-4 h-4 text-rose-600"
                      />
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-snug">
                      Hanya widget komentar embed Cusdis pihak ketiga.
                    </p>
                  </div>

                  {/* OPTION 4: NONE (DISABLED) */}
                  <div
                    onClick={() => setCfgCommentEngineMode('none')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      cfgCommentEngineMode === 'none'
                        ? 'border-rose-500 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-rose-200 dark:ring-rose-900/40'
                        : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>🚫 Nonaktifkan (None)</span>
                      </span>
                      <input
                        type="radio"
                        name="comment_engine_mode"
                        value="none"
                        checked={cfgCommentEngineMode === 'none'}
                        onChange={() => setCfgCommentEngineMode('none')}
                        className="w-4 h-4 text-rose-600"
                      />
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-snug">
                      Tutup seluruh kolom komentar di semua artikel.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 6: SIDEBAR */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layout className="w-4 h-4" />
                <span>6. Pengaturan Sidebar</span>
              </h4>
              
              <div className="flex items-center mb-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={cfgShowSidebar}
                    onChange={(e) => setCfgShowSidebar(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tampilkan Sidebar (show_sidebar)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Artikel Populer Widget (popular_posts_count)
                  </label>
                  <input
                    type="number"
                    value={cfgPopularPostsCount}
                    onChange={(e) => setCfgPopularPostsCount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Batas Widget Kategori (categories_widget_limit)
                  </label>
                  <input
                    type="number"
                    value={cfgCategoriesWidgetLimit}
                    onChange={(e) => setCfgCategoriesWidgetLimit(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kode HTML Banner Iklan Sidebar (sidebar_banner_code)
                </label>
                <textarea
                  value={cfgSidebarBannerCode}
                  onChange={(e) => setCfgSidebarBannerCode(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                  placeholder="<!-- Masukkan Script Banner HTML/Adsense disini -->"
                />
              </div>
            </div>

            {/* SECTION 7: ADSENSE HIGH CTR STRATEGIC PLACEMENT CONFIGURATION */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>7. Strategi Iklan AdSense (Spot Strategis High CTR)</span>
                </h4>
                <button
                  type="button"
                  onClick={handleFillDemoAdsense}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-500/30 flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Isi Demo Snippet AdSense High-CTR</span>
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Tips Pengajuan AdSense & Tampilan Profesional:
                </span>
                <p className="text-[11px] leading-relaxed opacity-90">
                  • <strong>Jika belum/sedang pengajuan AdSense:</strong> Cukup <strong>kosongkan seluruh textboxes</strong> atau hilangkan centang <em>Aktifkan Penempatan Iklan AdSense</em>. Sistem akan menyembunyikan (collapse) seluruh slot iklan secara otomatis tanpa meninggalkan kotak kosong, tulisan developer, atau layout rusak. Website Anda akan terlihat 100% rapi, profesional, dan siap di-review oleh Google.
                  <br />
                  • <strong>Kode saat Pengajuan AdSense:</strong> Jika Google meminta memasukkan script AdSense Auto-Ads saat review, cukup tempelkan script utama <code>&lt;script async src="https://pagead2.googlesyndication.com/..."&gt;&lt;/script&gt;</code> ke dalam kotak <strong>1. Header Top Banner</strong> dan isi Publisher ID Anda.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfgEnableAdsense}
                      onChange={(e) => setCfgEnableAdsense(e.target.checked)}
                      className="w-5 h-5 text-rose-600 rounded border-slate-300 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-950"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Aktifkan Penempatan Iklan AdSense (enable_adsense)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Mengaktifkan/mematikan penayangan iklan AdSense di seluruh titik website.
                      </span>
                    </div>
                  </label>

                  <div className="w-full sm:w-auto">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Google AdSense Publisher ID</label>
                    <input
                      type="text"
                      value={cfgAdsenseClientId}
                      onChange={(e) => setCfgAdsenseClientId(e.target.value)}
                      placeholder="ca-pub-1234567890123456"
                      className="w-full sm:w-56 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-rose-600 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. HEADER TOP BANNER */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>1. Header Top Banner (728x90)</span>
                    <span className="text-[10px] text-slate-500 font-normal">adsense_header_top</span>
                  </label>
                  <textarea
                    value={cfgAdsenseHeaderTop}
                    onChange={(e) => setCfgAdsenseHeaderTop(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                    placeholder="<ins class='adsbygoogle' ...></ins>"
                  />
                </div>

                {/* 2. IN-ARTICLE TOP */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>2. In-Article Top (Atas Paragraf 1)</span>
                    <span className="text-[10px] text-slate-500 font-normal">adsense_article_top</span>
                  </label>
                  <textarea
                    value={cfgAdsenseArticleTop}
                    onChange={(e) => setCfgAdsenseArticleTop(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                    placeholder="<ins class='adsbygoogle' ...></ins>"
                  />
                </div>

                {/* 3. IN-ARTICLE MIDDLE */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>3. In-Article Middle (Sela-sela Paragraf / High CTR)</span>
                    <span className="text-[10px] text-slate-500 font-normal">adsense_article_middle</span>
                  </label>
                  <textarea
                    value={cfgAdsenseArticleMiddle}
                    onChange={(e) => setCfgAdsenseArticleMiddle(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                    placeholder="<ins class='adsbygoogle' ...></ins>"
                  />
                </div>

                {/* 4. IN-ARTICLE BOTTOM */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>4. In-Article Bottom (Bawah Artikel / Matched Content)</span>
                    <span className="text-[10px] text-slate-500 font-normal">adsense_article_bottom</span>
                  </label>
                  <textarea
                    value={cfgAdsenseArticleBottom}
                    onChange={(e) => setCfgAdsenseArticleBottom(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                    placeholder="<ins class='adsbygoogle' ...></ins>"
                  />
                </div>

                {/* 5. SIDEBAR STICKY */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>5. Sidebar Ad Unit (300x250 / 300x600)</span>
                    <span className="text-[10px] text-slate-500 font-normal">adsense_sidebar</span>
                  </label>
                  <textarea
                    value={cfgAdsenseSidebar}
                    onChange={(e) => setCfgAdsenseSidebar(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                    placeholder="<ins class='adsbygoogle' ...></ins>"
                  />
                </div>

                {/* 6. STICKY FOOTER MOBILE BANNER */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>6. Sticky Footer Banner (Anchor Mobile Ad)</span>
                    <span className="text-[10px] text-slate-500 font-normal">adsense_sticky_footer</span>
                  </label>
                  <textarea
                    value={cfgAdsenseStickyFooter}
                    onChange={(e) => setCfgAdsenseStickyFooter(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                    placeholder="<ins class='adsbygoogle' ...></ins>"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-rose-500" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Teks Halaman Login Admin</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Portal (admin_login_title)
                  </label>
                  <input
                    type="text"
                    value={cfgAdminLoginTitle}
                    onChange={(e) => setCfgAdminLoginTitle(e.target.value)}
                    placeholder="Portal Admin Parenting.my.id"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sub-judul (admin_login_subtitle)
                  </label>
                  <input
                    type="text"
                    value={cfgAdminLoginSubtitle}
                    onChange={(e) => setCfgAdminLoginSubtitle(e.target.value)}
                    placeholder="Sistem Otentikasi Cloudflare D1"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teks Tombol Login (admin_login_btn_text)
                  </label>
                  <input
                    type="text"
                    value={cfgAdminLoginBtnText}
                    onChange={(e) => setCfgAdminLoginBtnText(e.target.value)}
                    placeholder="Masuk Portal CMS"
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
          {currentUser?.role === 'admin' && (
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
          )}

          {/* EDIT CREDENTIALS FORM */}
          <form onSubmit={handleUpdateCredsSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <span>{currentUser?.role === 'admin' ? 'Ubah Username, Email, & Password Admin' : 'Ubah Nama, Email, & Password Saya'}</span>
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
                  onChange={(e) => setCredAvatar(sanitizeAndOptimizeImageUrl(e.target.value, 'avatar'))}
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

      {/* ------------------------------------------------------------- */}
      {/* TAB 8: CUSDIS COMMENTS & WEBHOOK MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'comments' && currentUser?.role === 'admin' && (
        <div className="space-y-8">
          {/* COMMENT ENGINE MODE SELECTION CARD */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Pilihan Mesin Komentar Website
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilih mesin komentar mana yang akan aktif di halaman artikel: pasang salah satu atau pasang keduanya.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!onSaveConfig || !siteConfig) return;
                  setIsSavingConfig(true);
                  await onSaveConfig({
                    ...siteConfig,
                    comment_engine_mode: cfgCommentEngineMode
                  });
                  setIsSavingConfig(false);
                  setConfigSuccessMsg('✅ Mesin komentar berhasil diperbarui!');
                  setTimeout(() => setConfigSuccessMsg(''), 3000);
                }}
                disabled={isSavingConfig}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 flex items-center gap-2 transition-all self-start sm:self-auto disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingConfig ? 'Menyimpan...' : 'Terapkan Pilihan'}</span>
              </button>
            </div>

            {configSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{configSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* OPTION 1: BOTH */}
              <div
                onClick={() => setCfgCommentEngineMode('both')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  cfgCommentEngineMode === 'both'
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 shadow-sm ring-2 ring-rose-200 dark:ring-rose-900/40'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🔥 Keduanya Aktif (Both)</span>
                  </span>
                  <input
                    type="radio"
                    name="comment_engine_mode_tab7"
                    value="both"
                    checked={cfgCommentEngineMode === 'both'}
                    onChange={() => setCfgCommentEngineMode('both')}
                    className="w-4 h-4 text-rose-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Form komentar internal Native D1 + Widget Cusdis Embed aktif bersamaan di artikel.
                </p>
              </div>

              {/* OPTION 2: NATIVE ONLY */}
              <div
                onClick={() => setCfgCommentEngineMode('native')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  cfgCommentEngineMode === 'native'
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 shadow-sm ring-2 ring-rose-200 dark:ring-rose-900/40'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>⚡ Hanya Native D1</span>
                  </span>
                  <input
                    type="radio"
                    name="comment_engine_mode_tab7"
                    value="native"
                    checked={cfgCommentEngineMode === 'native'}
                    onChange={() => setCfgCommentEngineMode('native')}
                    className="w-4 h-4 text-rose-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Hanya form komentar internal website, data tersimpan cepat & aman di Cloudflare D1.
                </p>
              </div>

              {/* OPTION 3: CUSDIS ONLY */}
              <div
                onClick={() => setCfgCommentEngineMode('cusdis')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  cfgCommentEngineMode === 'cusdis'
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 shadow-sm ring-2 ring-rose-200 dark:ring-rose-900/40'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>💬 Hanya Cusdis Embed</span>
                  </span>
                  <input
                    type="radio"
                    name="comment_engine_mode_tab7"
                    value="cusdis"
                    checked={cfgCommentEngineMode === 'cusdis'}
                    onChange={() => setCfgCommentEngineMode('cusdis')}
                    className="w-4 h-4 text-rose-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Hanya widget diskusi Cusdis pihak ketiga yang tampil di bawah artikel.
                </p>
              </div>

              {/* OPTION 4: NONE (DISABLED) */}
              <div
                onClick={() => setCfgCommentEngineMode('none')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  cfgCommentEngineMode === 'none'
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 shadow-sm ring-2 ring-rose-200 dark:ring-rose-900/40'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🚫 Nonaktifkan (None)</span>
                  </span>
                  <input
                    type="radio"
                    name="comment_engine_mode_tab7"
                    value="none"
                    checked={cfgCommentEngineMode === 'none'}
                    onChange={() => setCfgCommentEngineMode('none')}
                    className="w-4 h-4 text-rose-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Tutup seluruh fitur dan kolom komentar di semua artikel website.
                </p>
              </div>
            </div>
          </div>

          {/* CUSDIS WEBHOOK CONFIG & INSTRUCTIONS BOX */}
          <div className="bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-rose-800/80 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold border border-rose-500/30">
                  <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                  <span>Cusdis Webhook Endpoint</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  Integrasi Webhook Auto-Sync Komentar Cusdis
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Setiap kali pembaca mengirim komentar baru di widget Cusdis, Webhook ini secara cerdas akan menyimpan backup data komentar secara otomatis ke database Cloudflare D1 / SQLite Anda.
                </p>
              </div>

              <button
                onClick={() => {
                  const url = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/cusdis` : '/api/webhooks/cusdis';
                  navigator.clipboard.writeText(url);
                  setWebhookCopied(true);
                  setTimeout(() => setWebhookCopied(false), 2500);
                }}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md transition-all shrink-0 flex items-center gap-2"
              >
                {webhookCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{webhookCopied ? 'Webhook URL Tersalin!' : 'Salin Webhook URL'}</span>
              </button>
            </div>

            {/* WEBHOOK URL DISPLAY BOX */}
            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Webhook URL Produksi (Paste ke Cusdis Dashboard):
              </span>
              <div className="font-mono text-xs text-rose-300 font-bold break-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/cusdis` : '/api/webhooks/cusdis'}
              </div>
            </div>

            {/* INTEGRATION STEPS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/10">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1.5">
                <div className="text-xs font-bold text-rose-400">1. Buka Cusdis Settings</div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Masuk ke dashboard Cusdis di <strong>cusdis.com</strong> dan pilih proyek situs Anda.
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1.5">
                <div className="text-xs font-bold text-rose-400">2. Paste Webhook URL</div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Buka menu <strong>Project -&gt; Settings</strong>, lalu tempel URL Webhook di atas ke kolom <strong>Webhook URL</strong>.
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1.5">
                <div className="text-xs font-bold text-rose-400">3. Aktifkan &amp; Simpan</div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Nyalakan toggle saklar <strong>Enable Webhook</strong> lalu klik <strong>Save</strong>. Komentar baru akan otomatis tersinkron.
                </p>
              </div>
            </div>
          </div>

          {/* LIST OF SYNCED & NATIVE COMMENTS WITH MODERATION */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-rose-600" />
                  <span>Moderasi Komentar Pembaca ({comments.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola komentar masuk dari form native website maupun webhook Cusdis. Setujui komentar untuk menampilkannya di artikel.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* FILTER TABS */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold">
                  <button
                    onClick={() => setCommentFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      commentFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Semua ({comments.length})
                  </button>
                  <button
                    onClick={() => setCommentFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      commentFilter === 'pending'
                        ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>Pending</span>
                    {comments.filter((c) => c.status === 'pending').length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] animate-pulse">
                        {comments.filter((c) => c.status === 'pending').length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setCommentFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      commentFilter === 'approved'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Disetujui ({comments.filter((c) => c.status === 'approved').length})
                  </button>
                </div>

                <button
                  onClick={fetchComments}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-colors"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {(() => {
              const filteredComments = comments.filter((c) => {
                if (commentFilter === 'pending') return c.status === 'pending';
                if (commentFilter === 'approved') return c.status === 'approved';
                return true;
              });

              if (filteredComments.length === 0) {
                return (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                    <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                      Tidak ada komentar dalam kategori ini.
                    </p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Komentar baru dari pembaca akan muncul secara otomatis di sini.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredComments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                        comment.status === 'pending'
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={comment.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user_name || 'U')}`}
                          alt={comment.user_name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {comment.user_name}
                            </span>
                            {comment.user_email && (
                              <span className="text-[11px] text-slate-400">
                                ({comment.user_email})
                              </span>
                            )}

                            {comment.status === 'pending' ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold border border-amber-300/60 dark:border-amber-800 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                ⏳ Menunggu Moderasi
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-300/60 dark:border-emerald-800">
                                ✓ Disetujui
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 leading-relaxed font-medium">
                            {comment.content}
                          </p>

                          <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-0.5">
                            <span>Artikel: <strong className="text-rose-600 dark:text-rose-400">/baca/{comment.post_slug}</strong></span>
                            <span>•</span>
                            <span>{new Date(comment.created_at).toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                        {comment.status === 'pending' && (
                          <button
                            onClick={() => handleApproveComment(comment.id)}
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-xs"
                            title="Setujui komentar agar tampil di website"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition-colors"
                          title="Hapus Komentar dari DB"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
