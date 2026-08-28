import React, { useState, useEffect, useRef } from 'react';
import { Post, AutoLink, User, SiteConfig, PostRevision } from '../types';
import { THEME_PRESETS } from '../lib/themes';
import { DEFAULT_SITE_CONFIG } from '../lib/config';
import { 
  ShieldCheck, FileText, Link as LinkIcon, Plus, Trash2, Edit3, Save, 
  Upload, Eye, Sparkles, CheckCircle2, RefreshCw, Bold, Italic, Heading2, 
  Heading3, List, ListOrdered, Quote, Image as ImageIcon, Code, UserCheck, 
  ExternalLink, Search, Zap, AlertCircle, Settings, Key, Copy, Check, 
  LogOut, Globe, Palette, Layout, MessageSquare, Droplet, Users, Award, History, RotateCcw, X
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

  // Admin tabs: 'posts' | 'editor' | 'writers' | 'autolinks' | 'sitemap' | 'config' | 'security'
  const [activeTab, setActiveTab] = useState<'posts' | 'editor' | 'writers' | 'autolinks' | 'sitemap' | 'config' | 'security'>('posts');

  // Writers / Editorial Team State
  const [writers, setWriters] = useState<User[]>([]);
  const [showWriterModal, setShowWriterModal] = useState(false);
  const [writerModalMode, setWriterModalMode] = useState<'create' | 'edit'>('create');
  const [editingWriterId, setEditingWriterId] = useState<number | null>(null);
  
  // Writer Form States
  const [wName, setWName] = useState('');
  const [wEmail, setWEmail] = useState('');
  const [wPassword, setWPassword] = useState('');
  const [wRole, setWRole] = useState<'admin' | 'writer'>('writer');
  const [wAvatar, setWAvatar] = useState('');
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
  }, []);

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
  const [cfgSiteName, setCfgSiteName] = useState(siteConfig?.site_name || 'Parenting.my.id');
  const [cfgMobileAdminBtnLabel, setCfgMobileAdminBtnLabel] = useState(siteConfig?.mobile_admin_btn_label || 'Portal Admin & Editor');
  const [cfgMobileShowLoggedUsername, setCfgMobileShowLoggedUsername] = useState(siteConfig?.mobile_show_logged_username || false);

  const [cfgSiteDomain, setCfgSiteDomain] = useState(siteConfig?.site_domain || 'parenting.my.id');
  const [cfgDefaultThemeMode, setCfgDefaultThemeMode] = useState<'light'|'dark'|'auto'>(siteConfig?.default_theme_mode || 'auto');
  const [cfgFontSizeScale, setCfgFontSizeScale] = useState<'small'|'normal'|'large'|'xlarge'>(siteConfig?.font_size_scale || 'normal');
  const [cfgFontDensityScale, setCfgFontDensityScale] = useState<'compact'|'standard'|'spacious'>(siteConfig?.font_density_scale || 'standard');
  const [cfgAgeAccessibilityPreset, setCfgAgeAccessibilityPreset] = useState<'18-28'|'29-38'|'39-48'|'49-58'>(siteConfig?.age_accessibility_preset || '29-38');
  const [cfgHeaderBadgeText, setCfgHeaderBadgeText] = useState(siteConfig?.header_badge_text || 'Beta v1.0');
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
  const [cfgHeaderNavLinks, setCfgHeaderNavLinks] = useState(
    JSON.stringify(siteConfig?.header_nav_links && siteConfig.header_nav_links.length > 0 ? siteConfig.header_nav_links : DEFAULT_SITE_CONFIG.header_nav_links, null, 2)
  );
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
  const [cfgFooterMenuLinks, setCfgFooterMenuLinks] = useState(
    JSON.stringify(siteConfig?.footer_menu_links && siteConfig.footer_menu_links.length > 0 ? siteConfig.footer_menu_links : DEFAULT_SITE_CONFIG.footer_menu_links, null, 2)
  );

  // Performance Metric Box Config States
  const [cfgShowPerformanceBox, setCfgShowPerformanceBox] = useState<boolean>(siteConfig?.show_performance_box ?? true);
  const [cfgMetric1Value, setCfgMetric1Value] = useState<string>(siteConfig?.metric1_value || '99+');
  const [cfgMetric1Label, setCfgMetric1Label] = useState<string>(siteConfig?.metric1_label || 'Kecepatan');
  const [cfgMetric2Value, setCfgMetric2Value] = useState<string>(siteConfig?.metric2_value || '100');
  const [cfgMetric2Label, setCfgMetric2Label] = useState<string>(siteConfig?.metric2_label || 'Kualitas');
  const [cfgMetric3Value, setCfgMetric3Value] = useState<string>(siteConfig?.metric3_value || '0ms');
  const [cfgMetric3Label, setCfgMetric3Label] = useState<string>(siteConfig?.metric3_label || 'Respon Delay');

  // Admin Login Text Config
  const [cfgAdminLoginTitle, setCfgAdminLoginTitle] = useState(siteConfig?.admin_login_title || 'Portal Admin Parenting.my.id');
  const [cfgAdminLoginSubtitle, setCfgAdminLoginSubtitle] = useState(siteConfig?.admin_login_subtitle || 'Sistem Otentikasi Cloudflare D1');
  const [cfgAdminLoginBtnText, setCfgAdminLoginBtnText] = useState(siteConfig?.admin_login_btn_text || 'Masuk Portal CMS');

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
      setCfgActiveThemePreset(siteConfig.active_theme_preset || 'corp-blue');
      setCfgSiteName(siteConfig.site_name);
      setCfgSiteTagline(siteConfig.site_tagline);
      setCfgSiteDescription(siteConfig.site_description);
      setCfgSiteLogoUrl(siteConfig.site_logo_url || '');
      setCfgSiteLogoIcon(siteConfig.site_logo_icon || 'Heart');
      setCfgSiteFaviconUrl(siteConfig.site_favicon_url || '/favicon.ico');
      setCfgHeaderNavLinks(JSON.stringify(siteConfig.header_nav_links && siteConfig.header_nav_links.length > 0 ? siteConfig.header_nav_links : DEFAULT_SITE_CONFIG.header_nav_links, null, 2));
      setCfgEnableSearchBar(siteConfig.enable_search_bar ?? true);
      setCfgEnableThemeToggle(siteConfig.enable_theme_toggle ?? true);

      setCfgDefaultThemeMode(siteConfig.default_theme_mode || 'auto');
      setCfgFontSizeScale(siteConfig.font_size_scale || 'normal');
      setCfgFontDensityScale(siteConfig.font_density_scale || 'standard');
      setCfgAgeAccessibilityPreset(siteConfig.age_accessibility_preset || '29-38');

      setCfgEnableAdsense(siteConfig.enable_adsense ?? true);
      setCfgAdsenseClientId(siteConfig.adsense_client_id || 'ca-pub-1234567890123456');
      setCfgAdsenseHeaderTop(siteConfig.adsense_header_top || '');
      setCfgAdsenseArticleTop(siteConfig.adsense_article_top || '');
      setCfgAdsenseArticleMiddle(siteConfig.adsense_article_middle || '');
      setCfgAdsenseArticleBottom(siteConfig.adsense_article_bottom || '');
      setCfgAdsenseSidebar(siteConfig.adsense_sidebar || '');
      setCfgAdsenseStickyFooter(siteConfig.adsense_sticky_footer || '');

      setCfgSeoMetaTitle(siteConfig.seo_meta_title);
      setCfgSeoMetaDesc(siteConfig.seo_meta_description);
      setCfgSeoDefaultOgImage(siteConfig.seo_default_og_image);

      setCfgShowHeroSection(siteConfig.show_hero_section ?? true);
      setCfgHeroTitle(siteConfig.hero_title);
      setCfgHeroSubtitle(siteConfig.hero_subtitle);
      setCfgHeroCtaText(siteConfig.hero_cta_text);
      setCfgHeroCtaLink(siteConfig.hero_cta_link);

      setCfgShowPerformanceBox(siteConfig.show_performance_box ?? true);
      setCfgMetric1Value(siteConfig.metric1_value || '99+');
      setCfgMetric1Label(siteConfig.metric1_label || 'Kecepatan');
      setCfgMetric2Value(siteConfig.metric2_value || '100');
      setCfgMetric2Label(siteConfig.metric2_label || 'Kualitas');
      setCfgMetric3Value(siteConfig.metric3_value || '0ms');
      setCfgMetric3Label(siteConfig.metric3_label || 'Respon Delay');

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
      setCfgFooterMenuLinks(JSON.stringify(siteConfig.footer_menu_links && siteConfig.footer_menu_links.length > 0 ? siteConfig.footer_menu_links : DEFAULT_SITE_CONFIG.footer_menu_links, null, 2));
      
      setCfgAdminLoginTitle(siteConfig.admin_login_title || 'Portal Admin Parenting.my.id');
      setCfgAdminLoginSubtitle(siteConfig.admin_login_subtitle || 'Sistem Otentikasi Cloudflare D1');
      setCfgAdminLoginBtnText(siteConfig.admin_login_btn_text || 'Masuk Portal CMS');

      setCfgSiteDomain(siteConfig.site_domain || 'parenting.my.id');
      setCfgHeaderBadgeText(siteConfig.header_badge_text || 'Cloudflare D1 Edge Engine');
      setCfgMobileAdminBtnLabel(siteConfig.mobile_admin_btn_label || 'Portal Admin & Editor');
      setCfgMobileShowLoggedUsername(siteConfig.mobile_show_logged_username ?? false);
      setCfgHeroBadgeText(siteConfig.hero_badge_text || 'Portal Nomor 1');
      setCfgAutolinkTickerLabel(siteConfig.autolink_ticker_label || 'Topik Trending:');
      setCfgFooterAutolinkLabel(siteConfig.footer_autolink_label || 'Tautan Populer');
      setCfgFooterBadge1(siteConfig.footer_badge_1 || 'Aman & Terpercaya');
      setCfgFooterBadge2(siteConfig.footer_badge_2 || 'Diperbarui Rutin');
      setCfgFooterBadge3(siteConfig.footer_badge_3 || '100% Gratis');
    }
  }, [siteConfig]);

  // REAL-TIME INSTANT PREVIEW EFFECT
  useEffect(() => {
    if (!onLivePreviewChange) return;

    let navParsed = [];
    let footerParsed = [];
    try { navParsed = JSON.parse(cfgHeaderNavLinks); } catch (e) {}
    try { footerParsed = JSON.parse(cfgFooterMenuLinks); } catch (e) {}

    const draftConfig: SiteConfig = {
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
      header_nav_links: navParsed.length ? navParsed : (siteConfig?.header_nav_links || []),
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
      metric1_value: cfgMetric1Value,
      metric1_label: cfgMetric1Label,
      metric2_value: cfgMetric2Value,
      metric2_label: cfgMetric2Label,
      metric3_value: cfgMetric3Value,
      metric3_label: cfgMetric3Label,
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
      footer_menu_links: footerParsed.length ? footerParsed : (siteConfig?.footer_menu_links || []),
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
    };

    onLivePreviewChange(draftConfig);
  }, [
    cfgActiveThemePreset, cfgDefaultThemeMode, cfgFontSizeScale, cfgFontDensityScale,
    cfgAgeAccessibilityPreset, cfgHeaderBadgeText, cfgHeroBadgeText, cfgShowHeroSection,
    cfgHeroTitle, cfgHeroSubtitle, cfgEnableAdsense, cfgAdsenseClientId,
    cfgAdsenseHeaderTop, cfgAdsenseArticleTop, cfgAdsenseArticleMiddle,
    cfgAdsenseArticleBottom, cfgAdsenseSidebar, cfgAdsenseStickyFooter
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
        show_performance_box: cfgShowPerformanceBox,
        metric1_value: cfgMetric1Value,
        metric1_label: cfgMetric1Label,
        metric2_value: cfgMetric2Value,
        metric2_label: cfgMetric2Label,
        metric3_value: cfgMetric3Value,
        metric3_label: cfgMetric3Label,

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
        admin_login_title: cfgAdminLoginTitle,
        admin_login_subtitle: cfgAdminLoginSubtitle,
        admin_login_btn_text: cfgAdminLoginBtnText
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
    setEditorCategory('Pola Asuh');
    setEditorMarkdown('## Judul Bagian Baru\n\nTulis isi konten artikel parenting Anda di sini...');
    setEditorExcerpt('');
    setEditorImage('https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80');
    setEditorStatus('draft');
    setEditorMetaTitle('');
    setEditorMetaDesc('');
    setEditorTags('parenting, anak, keluarga');
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
    setWTitle('Pakar Parenting & Kesehatan Anak');
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
              {siteConfig?.admin_login_title || 'Portal Admin Parenting.my.id'}
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

        {currentUser?.role === 'admin' && (
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
          writers={writers}
          authorId={editorAuthorId}
          setAuthorId={setEditorAuthorId}
          coAuthorIds={editorCoAuthorIds}
          setCoAuthorIds={setEditorCoAuthorIds}
          revisions={posts.find(p => p.id === editingPostId)?.revisions || []}
          onRestoreRevision={handleRestoreRevision}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: KELOLA TIM EDITORIAL & PENULIS (E-E-A-T) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'writers' && (
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
                            {w.title || 'Penulis Artikel Parenting'}
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
                    placeholder="ratna@parenting.my.id"
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
                    <option value="writer">Penulis / Kontributor</option>
                    <option value="admin">Administrator (Akses Penuh)</option>
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
                  placeholder="Misal: Spesialis Psikologi Anak & Praktisi Parenting"
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
                  onChange={(e) => setWAvatar(e.target.value)}
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
                  placeholder="Deskripsikan keahlian dan pengalaman penulis di bidang parenting & kesehatan anak..."
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
                    placeholder="parenting.my.id"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teks Badge Samping Logo Header (header_badge_text)
                  </label>
                  <input
                    type="text"
                    value={cfgHeaderBadgeText}
                    onChange={(e) => setCfgHeaderBadgeText(e.target.value)}
                    placeholder="Cloudflare D1 Edge Engine"
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
                    onChange={(e) => setCfgSiteLogoUrl(e.target.value)}
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

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">Kustomisasi Angka & Label Metrik Performa</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Metric 1 */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Metrik 1 (Nilai & Label)</label>
                      <input
                        type="text"
                        value={cfgMetric1Value}
                        onChange={(e) => setCfgMetric1Value(e.target.value)}
                        placeholder="Misal: 99+"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold mb-1"
                      />
                      <input
                        type="text"
                        value={cfgMetric1Label}
                        onChange={(e) => setCfgMetric1Label(e.target.value)}
                        placeholder="Misal: Kecepatan"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                      />
                    </div>
                    {/* Metric 2 */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Metrik 2 (Nilai & Label)</label>
                      <input
                        type="text"
                        value={cfgMetric2Value}
                        onChange={(e) => setCfgMetric2Value(e.target.value)}
                        placeholder="Misal: 100"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold mb-1"
                      />
                      <input
                        type="text"
                        value={cfgMetric2Label}
                        onChange={(e) => setCfgMetric2Label(e.target.value)}
                        placeholder="Misal: Kualitas"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                      />
                    </div>
                    {/* Metric 3 */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Metrik 3 (Nilai & Label)</label>
                      <input
                        type="text"
                        value={cfgMetric3Value}
                        onChange={(e) => setCfgMetric3Value(e.target.value)}
                        placeholder="Misal: 0ms"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold mb-1"
                      />
                      <input
                        type="text"
                        value={cfgMetric3Label}
                        onChange={(e) => setCfgMetric3Label(e.target.value)}
                        placeholder="Misal: Respon Delay"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                      />
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

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Menu Footer (footer_menu_links dalam Format JSON)
                </label>
                <textarea
                  value={cfgFooterMenuLinks}
                  onChange={(e) => setCfgFooterMenuLinks(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
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
