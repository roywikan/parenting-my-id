import React, { useState, useEffect, useRef } from 'react';
import { Post, AutoLink, User, SiteConfig, PostRevision, NavLink, HomepageDisplayMode, UserRole, PostStatus } from '../types';
import { THEME_PRESETS } from '../lib/themes';
import { DEFAULT_SITE_CONFIG } from '../lib/config';
import { 
  ShieldCheck, ShieldAlert, FileText, Link as LinkIcon, Plus, Trash2, Edit3, Save, 
  Upload, Eye, Sparkles, CheckCircle2, RefreshCw, Bold, Italic, Heading2, 
  Heading3, List, ListOrdered, Quote, Image as ImageIcon, Code, UserCheck, 
  ExternalLink, Search, Zap, AlertCircle, Settings, Key, Copy, Check, 
  LogOut, Globe, Palette, Layout, MessageSquare, Droplet, Users, Award, History, RotateCcw, X, Menu, LayoutGrid, Database, ShoppingBag, BarChart2,
  ChevronLeft, ChevronRight, ChevronDown, Maximize2, Minimize2, Mail, Tag
} from 'lucide-react';
import { generateSlug } from '../lib/autolink';
import RichPostEditor from '../components/RichPostEditor';
import NavigationBuilder, { PRESET_NAV_ITEMS } from '../components/NavigationBuilder';
import { sanitizeAndOptimizeImageUrl, getOptimizedAvatarUrl } from '../lib/imageUtils';
import { getAuthHeaders } from '../lib/auth';
import TurnstileWidget, { TurnstileWidgetHandle } from '../components/TurnstileWidget';
import DatabaseBackupManager from '../components/DatabaseBackupManager';
import InteractiveProductSale from '../components/InteractiveProductSale';
import AdminSuratPembacaManager from '../components/AdminSuratPembacaManager';
import AdminIklanBarisManager from '../components/AdminIklanBarisManager';

interface AdminPortalProps {
  currentUser: User | null;
  onLogin: (email: string, pass: string, turnstileToken?: string, emergencyKey?: string) => Promise<{ success: boolean; error?: string } | boolean>;
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
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  // Emergency Recovery State (Bypass Turnstile in Emergency)
  const [emergencyKeyInput, setEmergencyKeyInput] = useState('');
  const [showEmergencyInput, setShowEmergencyInput] = useState(false);
  const [turnstileLoadError, setTurnstileLoadError] = useState(false);
  const [showD1SqlGuide, setShowD1SqlGuide] = useState(false);
  const [hasCopiedSql, setHasCopiedSql] = useState(false);

  const handleCopySql = () => {
    try {
      navigator.clipboard.writeText("INSERT OR REPLACE INTO configs (key, value) VALUES ('turnstile_site_key', 'YOUR_TURNSTILE_SITE_KEY');");
      setHasCopiedSql(true);
      setTimeout(() => setHasCopiedSql(false), 2000);
    } catch {
      // Ignore clipboard write failure
    }
  };

  // Automatically detect emergency key in URL (e.g. ?emergency_key=... or ?emergency=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const eKey = params.get('emergency_key') || params.get('emergency');
      if (eKey && eKey.trim() !== '') {
        setEmergencyKeyInput(eKey.trim());
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Admin tabs: 'posts' | 'editor' | 'writers' | 'autolinks' | 'sitemap' | 'config' | 'security' | 'comments' | 'database' | 'products' | 'wa_leads' | 'surat_pembaca' | 'iklan_baris'
  const [activeTab, setActiveTab] = useState<'posts' | 'editor' | 'writers' | 'autolinks' | 'sitemap' | 'config' | 'security' | 'comments' | 'database' | 'products' | 'wa_leads' | 'surat_pembaca' | 'iklan_baris'>('posts');

  // Sidebar controls
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isMobileNavExpanded, setIsMobileNavExpanded] = useState(false);

  // Auto-collapse sidebar when on the editor tab
  useEffect(() => {
    if (activeTab === 'editor') {
      setIsSidebarCollapsed(true);
    }
  }, [activeTab]);

  // Comments & Cusdis Webhook State
  const [comments, setComments] = useState<any[]>([]);
  const [commentFilter, setCommentFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [webhookCopied, setWebhookCopied] = useState(false);

  // DNS for AI Discovery (DNS-AID) & DNSSEC State
  const [dnsAidData, setDnsAidData] = useState<any>(null);
  const [isCheckingDnsAid, setIsCheckingDnsAid] = useState(false);
  const [customTestDomain, setCustomTestDomain] = useState('');
  const [copiedRecordKey, setCopiedRecordKey] = useState<string | null>(null);

  const fetchDnsAid = async (check = false, domainToTest?: string) => {
    try {
      if (check) setIsCheckingDnsAid(true);
      const domainQuery = domainToTest ? `&domain=${encodeURIComponent(domainToTest)}` : (customTestDomain ? `&domain=${encodeURIComponent(customTestDomain)}` : '');
      const res = await fetch(`/api/dns-aid?check=${check ? '1' : '0'}${domainQuery}`);
      if (res.ok) {
        const data = await res.json();
        setDnsAidData(data);
        if (!customTestDomain && data.domain) {
          setCustomTestDomain(data.domain);
        }
      }
    } catch (err) {
      console.error('Failed to fetch DNS-AID:', err);
    } finally {
      setIsCheckingDnsAid(false);
    }
  };

  const fetchWaLeads = async () => {
    setIsLoadingWaLeads(true);
    setWaLeadsError('');
    try {
      const res = await fetch('/api/whatsapp/leads', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setWaLeads(data);
      } else {
        setWaLeadsError('Gagal mengambil data log WhatsApp Chat leads.');
      }
    } catch (err: any) {
      console.error('Failed to fetch WA leads:', err);
      setWaLeadsError(err.message || 'Error mengambil data leads.');
    } finally {
      setIsLoadingWaLeads(false);
    }
  };

  const fetchProductOrders = async () => {
    setIsLoadingProductOrders(true);
    setProductOrdersError('');
    try {
      const res = await fetch('/api/products/orders', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setProductOrders(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setProductOrdersError(errData.error || 'Gagal mengambil data log pembelian produk.');
      }
    } catch (err: any) {
      console.error('Failed to fetch product orders:', err);
      setProductOrdersError(err.message || 'Error mengambil data pemesanan produk.');
    } finally {
      setIsLoadingProductOrders(false);
    }
  };

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
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
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
      const res = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });
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
  const [wIsVerifiedAcademic, setWIsVerifiedAcademic] = useState(false);
  const [wVerifiedAcademicLabel, setWVerifiedAcademicLabel] = useState('Penulis Akademik Terverifikasi');
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
      const adminOnlyTabs = ['writers', 'autolinks', 'sitemap', 'comments', 'config', 'wa_leads'];
      if (currentUser.role === 'writer') {
        adminOnlyTabs.push('security');
      }
      if (adminOnlyTabs.includes(activeTab)) {
        setActiveTab('posts');
      }
    }
  }, [currentUser, activeTab]);

  // Sync editorAuthorId when currentUser changes
  useEffect(() => {
    if (currentUser?.id) {
      if (currentUser.role === 'writer' || !editorAuthorId) {
        setEditorAuthorId(currentUser.id);
      }
    }
  }, [currentUser]);

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
  const [editorTags, setEditorTags] = useState('informasi, artikel, kegiatan');
  const [editorAuthorId, setEditorAuthorId] = useState<number>(currentUser?.id || 1);
  const [editorCoAuthorIds, setEditorCoAuthorIds] = useState<number[]>([]);
  const [editorPostType, setEditorPostType] = useState<'article' | 'interactive_configurator' | 'interactive_showcase' | 'interactive_radar' | 'interactive_quiz' | 'interactive_timeline_slider' | 'interactive_battle_card' | 'interactive_quiz_router' | 'interactive_habit_simulator' | 'interactive_qa_column' | 'interactive_event_listing' | 'interactive_glossary_dictionary'>('article');
  const [editorInteractiveConfigurator, setEditorInteractiveConfigurator] = useState<any>(null);
  const [editorInteractiveShowcase, setEditorInteractiveShowcase] = useState<any>(null);
  const [editorInteractiveRadar, setEditorInteractiveRadar] = useState<any>(null);
  const [editorInteractiveQuiz, setEditorInteractiveQuiz] = useState<any>(null);
  const [editorInteractiveTimelineSlider, setEditorInteractiveTimelineSlider] = useState<any>(null);
  const [editorInteractiveBattleCard, setEditorInteractiveBattleCard] = useState<any>(null);
  const [editorInteractiveQuizRouter, setEditorInteractiveQuizRouter] = useState<any>(null);
  const [editorInteractiveHabitSimulator, setEditorInteractiveHabitSimulator] = useState<any>(null);
  const [editorInteractiveQaColumn, setEditorInteractiveQaColumn] = useState<any>(null);
  const [editorInteractiveEventListing, setEditorInteractiveEventListing] = useState<any>(null);
  const [editorInteractiveGlossaryDictionary, setEditorInteractiveGlossaryDictionary] = useState<any>(null);
  const [editorDisclaimerType, setEditorDisclaimerType] = useState<'none' | 'medical_psychology' | 'financial' | 'legal' | 'academic' | 'custom'>('none');
  const [editorCustomDisclaimerText, setEditorCustomDisclaimerText] = useState('');

  // Auto-Save Draft Status Indicator
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('markdown');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Helper to safely parse co-authors array from array, string, or object
  const parseCoAuthorIds = (p: any): number[] => {
    if (!p) return [];
    const raw = p.coAuthorIds ?? p.co_writers;
    if (Array.isArray(raw)) return raw.map(Number);
    if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(Number);
      } catch {
        return raw.split(',').map((v) => Number(v.trim())).filter((n) => !isNaN(n));
      }
    }
    if (Array.isArray(p.coAuthors)) {
      return p.coAuthors.map((ca: any) => Number(ca.id));
    }
    return [];
  };

  // Compute role-filtered user posts
  const userRole = currentUser?.role || 'writer';
  const userPosts = posts.filter((post) => {
    if (userRole === 'writer') {
      const isAuthor =
        Number(post.authorId) === Number(currentUser?.id) ||
        (currentUser?.name && post.authorName?.toLowerCase() === currentUser.name.toLowerCase());
      const coIds = parseCoAuthorIds(post);
      const isCoAuthor = coIds.some((id) => Number(id) === Number(currentUser?.id));
      return isAuthor || isCoAuthor;
    }
    return true;
  });

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
  const [cfgFontOverrideMode, setCfgFontOverrideMode] = useState<'system' | 'inter' | 'plus-jakarta-sans' | 'theme'>(siteConfig?.font_override_mode || 'system');
  const [cfgSiteName, setCfgSiteName] = useState(siteConfig?.site_name || 'Website Utama');
  const [cfgMobileAdminBtnLabel, setCfgMobileAdminBtnLabel] = useState(siteConfig?.mobile_admin_btn_label || 'Portal Admin & Editor');
  const [cfgMobileShowLoggedUsername, setCfgMobileShowLoggedUsername] = useState(siteConfig?.mobile_show_logged_username || false);
  const [cfgProductsNavLabel, setCfgProductsNavLabel] = useState(siteConfig?.products_nav_label || 'Produk');
  const [cfgProductsNavPath, setCfgProductsNavPath] = useState(siteConfig?.products_nav_path || '/produk');
  const [cfgSellerBankAccounts, setCfgSellerBankAccounts] = useState(siteConfig?.seller_bank_accounts || '');
  const [cfgProductsHeroBadge, setCfgProductsHeroBadge] = useState(siteConfig?.products_hero_badge || '🛍️ Katalog Produk & Paket Eksklusif');
  const [cfgProductsHeroTitle, setCfgProductsHeroTitle] = useState(siteConfig?.products_hero_title || 'Miliki Produk & Paket Pilihan Berkualitas');
  const [cfgProductsHeroSubtitle, setCfgProductsHeroSubtitle] = useState(siteConfig?.products_hero_subtitle || 'Temukan berbagai koleksi produk, paket, dan penawaran terbaik. Didukung pembayaran instan QRIS/Bank dan koordinasi pengiriman aman via WhatsApp.');
  const [cfgProductsHeroBtnText, setCfgProductsHeroBtnText] = useState(siteConfig?.products_hero_btn_text || 'Tambah Produk Baru');
  const [cfgProductsHeroImageUrl, setCfgProductsHeroImageUrl] = useState(siteConfig?.products_hero_image_url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80');
  const [cfgProductsHeroImageCaption, setCfgProductsHeroImageCaption] = useState(siteConfig?.products_hero_image_caption || 'Katalog Pilihan Utama');
  const [cfgProductsEmptyTitle, setCfgProductsEmptyTitle] = useState(siteConfig?.products_empty_title || 'Belum Ada Produk Jualan');
  const [cfgProductsEmptySubtitle, setCfgProductsEmptySubtitle] = useState(siteConfig?.products_empty_subtitle || 'Katalog produk belum diunggah. Silakan masuk sebagai administrator untuk menambahkan item pertama Anda.');

  // WA Widget
  const [cfgWaEnabled, setCfgWaEnabled] = useState(siteConfig?.wa_widget_enabled || false);
  const [cfgWaPosition, setCfgWaPosition] = useState(siteConfig?.wa_position || 'bottom-right');
  const [cfgWaHeaderTitle, setCfgWaHeaderTitle] = useState(siteConfig?.wa_header_title || 'Hubungi Kami');
  const [cfgWaSubtitle, setCfgWaSubtitle] = useState(siteConfig?.wa_subtitle || 'Halo! Ada yang bisa kami bantu?');
  const [cfgWaColorAccent, setCfgWaColorAccent] = useState(siteConfig?.wa_color_accent || '#25D366');
  const [cfgWaOperators, setCfgWaOperators] = useState(siteConfig?.wa_operators || []);
  const [cfgWaFormFields, setCfgWaFormFields] = useState(siteConfig?.wa_form_fields || ['name', 'phone', 'message']);
  const [cfgWaEnableRotation, setCfgWaEnableRotation] = useState(siteConfig?.wa_enable_rotation || false);

  const [cfgSiteDomain, setCfgSiteDomain] = useState(siteConfig?.site_domain || 'domain.com');
  const [cfgDefaultThemeMode, setCfgDefaultThemeMode] = useState<'light'|'dark'|'auto'>(siteConfig?.default_theme_mode || 'auto');
  const [cfgFontSizeScale, setCfgFontSizeScale] = useState<'small'|'normal'|'large'|'xlarge'>(siteConfig?.font_size_scale || 'normal');
  const [cfgFontDensityScale, setCfgFontDensityScale] = useState<'compact'|'standard'|'spacious'>(siteConfig?.font_density_scale || 'standard');
  const [cfgAgeAccessibilityPreset, setCfgAgeAccessibilityPreset] = useState<'18-28'|'29-38'|'39-48'|'49-58'>(siteConfig?.age_accessibility_preset || '29-38');
  const [cfgHeaderBadgeText, setCfgHeaderBadgeText] = useState(siteConfig?.header_badge_text || 'Cloudflare D1 Edge Engine');
  const [cfgShowHeaderBadge, setCfgShowHeaderBadge] = useState<boolean>(siteConfig?.show_header_badge ?? siteConfig?.show_edge_badge ?? true);
  const [cfgHeroBadgeText, setCfgHeroBadgeText] = useState(siteConfig?.hero_badge_text || 'Portal Nomor 1');
  const [cfgHeroAffiliateWidgetEnable, setCfgHeroAffiliateWidgetEnable] = useState<boolean>(siteConfig?.hero_affiliate_widget_enable ?? false);
  const [cfgHeroAffiliateWidgetPosition, setCfgHeroAffiliateWidgetPosition] = useState<'right' | 'bottom'>(siteConfig?.hero_affiliate_widget_position || 'right');
  const [cfgHeroAffiliateWidgetCode, setCfgHeroAffiliateWidgetCode] = useState<string>(siteConfig?.hero_affiliate_widget_code ?? DEFAULT_SITE_CONFIG.hero_affiliate_widget_code ?? '');
  const [cfgAutolinkTickerLabel, setCfgAutolinkTickerLabel] = useState(siteConfig?.autolink_ticker_label || 'Trending:');
  const [cfgFooterAutolinkLabel, setCfgFooterAutolinkLabel] = useState(siteConfig?.footer_autolink_label || 'Tautan Populer');
  const [cfgReferenceHeadingLabel, setCfgReferenceHeadingLabel] = useState(siteConfig?.reference_heading_label || 'Referensi');
  const [cfgFooterBadge1, setCfgFooterBadge1] = useState(siteConfig?.footer_badge_1 || 'Aman & Terpercaya');
  const [cfgFooterBadge2, setCfgFooterBadge2] = useState(siteConfig?.footer_badge_2 || 'Diperbarui Rutin');
  const [cfgFooterBadge3, setCfgFooterBadge3] = useState(siteConfig?.footer_badge_3 || '100% Gratis');

  // Tech Badges Config States
  const [cfgTechBadgeHero, setCfgTechBadgeHero] = useState<string>(siteConfig?.tech_badge_hero || 'Cloudflare D1 Edge Architecture');
  const [cfgTechBadgePages, setCfgTechBadgePages] = useState<string>(siteConfig?.tech_badge_pages || 'Cloudflare Pages Edge');
  const [cfgTechBadgeDatabase, setCfgTechBadgeDatabase] = useState<string>(siteConfig?.tech_badge_database || 'Cloudflare D1 SQLite');
  const [cfgTechBadgeStorage, setCfgTechBadgeStorage] = useState<string>(siteConfig?.tech_badge_storage || 'GitHub REST Storage');

  // AdSense Placement Config States
  const [cfgEnableAdsense, setCfgEnableAdsense] = useState<boolean>(siteConfig?.enable_adsense ?? true);
  const [cfgAdsenseClientId, setCfgAdsenseClientId] = useState<string>(siteConfig?.adsense_client_id || 'ca-pub-1234567890123456');
  const [cfgAdsenseHeaderTop, setCfgAdsenseHeaderTop] = useState<string>(siteConfig?.adsense_header_top || '');
  const [cfgAdsenseArticleTop, setCfgAdsenseArticleTop] = useState<string>(siteConfig?.adsense_article_top || '');
  const [cfgAdsenseArticleMiddle, setCfgAdsenseArticleMiddle] = useState<string>(siteConfig?.adsense_article_middle || '');
  const [cfgAdsenseArticleBottom, setCfgAdsenseArticleBottom] = useState<string>(siteConfig?.adsense_article_bottom || '');
  const [cfgAdsenseSidebar, setCfgAdsenseSidebar] = useState<string>(siteConfig?.adsense_sidebar || '');
  const [cfgAdsenseStickyFooter, setCfgAdsenseStickyFooter] = useState<string>(siteConfig?.adsense_sticky_footer || '');

  // Custom JS/CSS Snippets Config States
  const [cfgCustomSnippetHeadEnable, setCfgCustomSnippetHeadEnable] = useState<boolean>(siteConfig?.custom_snippet_head_enable ?? false);
  const [cfgCustomSnippetHeadCode, setCfgCustomSnippetHeadCode] = useState<string>(siteConfig?.custom_snippet_head_code || DEFAULT_SITE_CONFIG.custom_snippet_head_code || '');
  const [cfgCustomSnippetBodyEnable, setCfgCustomSnippetBodyEnable] = useState<boolean>(siteConfig?.custom_snippet_body_enable ?? false);
  const [cfgCustomSnippetBodyCode, setCfgCustomSnippetBodyCode] = useState<string>(siteConfig?.custom_snippet_body_code || DEFAULT_SITE_CONFIG.custom_snippet_body_code || '');

  // Custom HTML Meta Tag Config States
  const [cfgCustomMetaTagsEnable, setCfgCustomMetaTagsEnable] = useState<boolean>(siteConfig?.custom_meta_tags_enable ?? false);
  const [cfgCustomMetaTagsCode, setCfgCustomMetaTagsCode] = useState<string>(siteConfig?.custom_meta_tags_code || DEFAULT_SITE_CONFIG.custom_meta_tags_code || '');

  // Custom Responsive Banner Ads Config States
  const [cfgAdBannerFirstHalfEnable, setCfgAdBannerFirstHalfEnable] = useState<boolean>(siteConfig?.ad_banner_first_half_enable ?? false);
  const [cfgAdBannerFirstHalfCode, setCfgAdBannerFirstHalfCode] = useState<string>(siteConfig?.ad_banner_first_half_code || DEFAULT_SITE_CONFIG.ad_banner_first_half_code || '');
  const [cfgAdBannerStickyFooterEnable, setCfgAdBannerStickyFooterEnable] = useState<boolean>(siteConfig?.ad_banner_sticky_footer_enable ?? false);
  const [cfgAdBannerStickyFooterCode, setCfgAdBannerStickyFooterCode] = useState<string>(siteConfig?.ad_banner_sticky_footer_code || DEFAULT_SITE_CONFIG.ad_banner_sticky_footer_code || '');
  const [cfgAdBannerArticleStartEnable, setCfgAdBannerArticleStartEnable] = useState<boolean>(siteConfig?.ad_banner_article_start_enable ?? false);
  const [cfgAdBannerArticleStartCode, setCfgAdBannerArticleStartCode] = useState<string>(siteConfig?.ad_banner_article_start_code || DEFAULT_SITE_CONFIG.ad_banner_article_start_code || '');
  const [cfgAdBannerArticleEndEnable, setCfgAdBannerArticleEndEnable] = useState<boolean>(siteConfig?.ad_banner_article_end_enable ?? false);
  const [cfgAdBannerArticleEndCode, setCfgAdBannerArticleEndCode] = useState<string>(siteConfig?.ad_banner_article_end_code || DEFAULT_SITE_CONFIG.ad_banner_article_end_code || '');

  // 8 GUI Manageable Component States
  const [cfgEnableTopAnnouncement, setCfgEnableTopAnnouncement] = useState<boolean>(siteConfig?.enable_top_announcement ?? false);
  const [cfgTopAnnouncementText, setCfgTopAnnouncementText] = useState<string>(siteConfig?.top_announcement_text || DEFAULT_SITE_CONFIG.top_announcement_text || '');
  const [cfgTopAnnouncementBg, setCfgTopAnnouncementBg] = useState<string>(siteConfig?.top_announcement_bg || 'bg-rose-600');
  const [cfgTopAnnouncementTextColor, setCfgTopAnnouncementTextColor] = useState<string>(siteConfig?.top_announcement_text_color || 'text-white');

  const [cfgEnableWhatsappWidget, setCfgEnableWhatsappWidget] = useState<boolean>(siteConfig?.enable_whatsapp_widget ?? siteConfig?.wa_widget_enabled ?? true);
  const [cfgWhatsappNumber, setCfgWhatsappNumber] = useState<string>(siteConfig?.whatsapp_number || '6281234567890');
  const [cfgWhatsappDefaultMessage, setCfgWhatsappDefaultMessage] = useState<string>(siteConfig?.whatsapp_default_message || 'Halo Redaksi, saya ingin bertanya seputar...');
  const [cfgWhatsappPosition, setCfgWhatsappPosition] = useState<'bottom-right' | 'bottom-left' | 'bottom-center'>(siteConfig?.whatsapp_position || siteConfig?.wa_position || 'bottom-right');

  const [cfgEnableCustomAdSlots, setCfgEnableCustomAdSlots] = useState<boolean>(siteConfig?.enable_custom_ad_slots ?? false);
  const [cfgCustomAdLeaderboardHtml, setCfgCustomAdLeaderboardHtml] = useState<string>(siteConfig?.custom_ad_leaderboard_html || '');
  const [cfgCustomAdRectangleHtml, setCfgCustomAdRectangleHtml] = useState<string>(siteConfig?.custom_ad_rectangle_html || '');
  const [cfgCustomAdSlotSize, setCfgCustomAdSlotSize] = useState<'728x90' | '300x250' | 'fluid'>(siteConfig?.custom_ad_slot_size || '728x90');

  const [cfgEnableHabitSimulator, setCfgEnableHabitSimulator] = useState<boolean>(siteConfig?.enable_habit_simulator ?? true);
  const [cfgHabitSimulatorTitle, setCfgHabitSimulatorTitle] = useState<string>(siteConfig?.habit_simulator_title || 'Simulasi Kebiasaan Positif');
  const [cfgHabitSimulatorSubtitle, setCfgHabitSimulatorSubtitle] = useState<string>(siteConfig?.habit_simulator_subtitle || 'Ukur kebiasaan pengasuhan anak sehari-hari');

  const [cfgEnableInteractiveQuiz, setCfgEnableInteractiveQuiz] = useState<boolean>(siteConfig?.enable_interactive_quiz ?? true);
  const [cfgQuizBuilderTitle, setCfgQuizBuilderTitle] = useState<string>(siteConfig?.quiz_builder_title || 'Kuis Edukasi & Psikologi Anak');

  const [cfgEnableInteractiveTimeline, setCfgEnableInteractiveTimeline] = useState<boolean>(siteConfig?.enable_interactive_timeline ?? true);

  const [cfgCusdisAppId, setCfgCusdisAppId] = useState<string>(siteConfig?.cusdis_app_id || '');
  const [cfgCusdisHost, setCfgCusdisHost] = useState<string>(siteConfig?.cusdis_host || 'https://cusdis.com');

  const [cfgSiteTagline, setCfgSiteTagline] = useState(siteConfig?.site_tagline || 'Edukasi & Pengasuhan Anak Modern');
  const [cfgSiteDescription, setCfgSiteDescription] = useState(siteConfig?.site_description || 'Portal informasi dan panduan pengasuhan anak modern.');
  const [cfgSiteLogoUrl, setCfgSiteLogoUrl] = useState(siteConfig?.site_logo_url || '');
  const [cfgSiteLogoIcon, setCfgSiteLogoIcon] = useState(siteConfig?.site_logo_icon || 'Heart');
  const [cfgSiteFaviconUrl, setCfgSiteFaviconUrl] = useState(siteConfig?.site_favicon_url || '/favicon.ico');
  const [cfgTurnstileSiteKey, setCfgTurnstileSiteKey] = useState(siteConfig?.turnstile_site_key || '');
  const [cfgTurnstileSecretKey, setCfgTurnstileSecretKey] = useState('');
  const [cfgEnableTurnstileFallback, setCfgEnableTurnstileFallback] = useState<boolean>(siteConfig?.enable_turnstile_fallback ?? true);
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
  const [cfgSeoDefaultOgImage, setCfgSeoDefaultOgImage] = useState(siteConfig?.seo_default_og_image || 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?q=15&w=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');

  const [cfgShowHeroSection, setCfgShowHeroSection] = useState(siteConfig?.show_hero_section ?? true);
  const [cfgHeroTitle, setCfgHeroTitle] = useState(siteConfig?.hero_title || 'Panduan Pengasuhan Anak Terpercaya');
  const [cfgHeroSubtitle, setCfgHeroSubtitle] = useState(siteConfig?.hero_subtitle || 'Temukan artikel, tips nutrisi, dan edukasi tumbuh kembang anak.');
  const [cfgHeroCtaText, setCfgHeroCtaText] = useState(siteConfig?.hero_cta_text || 'Jelajahi Artikel');
  const [cfgHeroCtaLink, setCfgHeroCtaLink] = useState(siteConfig?.hero_cta_link || '#artikel-terbaru');

  const [cfgPostsPerPage, setCfgPostsPerPage] = useState(siteConfig?.posts_per_page || 9);
  const [cfgEnableFeaturedPost, setCfgEnableFeaturedPost] = useState(siteConfig?.enable_featured_post ?? true);
  const [cfgPaginationType, setCfgPaginationType] = useState<'load_more' | 'infinite_scroll' | 'numbered'>(siteConfig?.pagination_type || 'load_more');
  const [cfgCommentEngineMode, setCfgCommentEngineMode] = useState<'both' | 'native' | 'cusdis' | 'none'>(siteConfig?.comment_engine_mode || 'both');
  const [cfgEnableCommentTurnstile, setCfgEnableCommentTurnstile] = useState(siteConfig?.enable_comment_turnstile ?? true);
  const [cfgHistoryMinTimeMinutes, setCfgHistoryMinTimeMinutes] = useState(siteConfig?.history_min_time_minutes ?? 3);
  const [cfgHistoryMinCharDiff, setCfgHistoryMinCharDiff] = useState(siteConfig?.history_min_char_diff ?? 25);

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

  // Admin Login Text & Suffix Config
  const [cfgAdminLoginTitle, setCfgAdminLoginTitle] = useState(siteConfig?.admin_login_title || 'Portal Admin Website');
  const [cfgAdminLoginSubtitle, setCfgAdminLoginSubtitle] = useState(siteConfig?.admin_login_subtitle || 'Sistem Otentikasi Cloudflare D1');
  const [cfgAdminLoginBtnText, setCfgAdminLoginBtnText] = useState(siteConfig?.admin_login_btn_text || 'Masuk Portal CMS');
  const [cfgAdminUrlSuffix, setCfgAdminUrlSuffix] = useState<string>(String(siteConfig?.admin_url_suffix || '9999'));

  // Homepage Display Mode & Sub-tab
  const [cfgHomepageDisplayMode, setCfgHomepageDisplayMode] = useState<HomepageDisplayMode>(siteConfig?.homepage_display_mode || 'default');
  const [selectedModelConfigTab, setSelectedModelConfigTab] = useState<HomepageDisplayMode>(siteConfig?.homepage_display_mode || 'default');

  useEffect(() => {
    if (selectedModelConfigTab === 'whatsapp_widget') {
      fetchWaLeads();
    }
    if (selectedModelConfigTab === 'product_landing') {
      fetchProductOrders();
    }
  }, [selectedModelConfigTab]);

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
  const [cfgProductMgmtHeading, setCfgProductMgmtHeading] = useState(siteConfig?.product_mgmt_heading || 'Panel Manajemen Produk Jualan');
  const [cfgProductMgmtDesc, setCfgProductMgmtDesc] = useState(siteConfig?.product_mgmt_desc || 'Kelola daftar penawaran, produk digital, jasa, atau paket yang Anda pasarkan. Anda dapat menambah, mengedit, memperbarui status (Tersedia/Terjual), serta menetapkan nomor WhatsApp dan metode pembayaran untuk masing-masing item.');

  // 8. Classified Ads Model States
  const [cfgClassifiedMastheadTitle, setCfgClassifiedMastheadTitle] = useState(siteConfig?.classified_masthead_title || 'WARNA-WARTO BERITA');
  const [cfgClassifiedMastheadSubtitle, setCfgClassifiedMastheadSubtitle] = useState(siteConfig?.classified_masthead_subtitle || 'LEMBARAN IKLAN BARIS, PENGUMUMAN & WARTA KELUARGA');
  const [cfgClassifiedEdition, setCfgClassifiedEdition] = useState(siteConfig?.classified_edition || '1988/2026');
  const [cfgClassifiedPriceTag, setCfgClassifiedPriceTag] = useState(siteConfig?.classified_price_tag || 'HARGA ECERAN RP 500,-');
  const [cfgClassifiedPhone, setCfgClassifiedPhone] = useState(siteConfig?.classified_phone || '(021) 7654321');
  const [cfgClassifiedCategories, setCfgClassifiedCategories] = useState(siteConfig?.classified_categories || 'Aksesoris, Aplikasi, Asuransi, Bimbel, Buku, Daycare, Jasa, Kebersihan, Kehamilan, Keluarga, Kesehatan, Keuangan, Klinik, Konsultasi, Kursus, Les Privat, Lifestyle, Lowongan Kerja, Mainan, Mencari Kerja, Menyusui, Nutrisi Gizi, Obat, Pakaian, Pasca Kelahiran, Pendidikan, Pengasuh, Peralatan, Perawatan, Perlengkapan, Sekolah, Sepatu, Seminar, Training, Transport, Wisata, Pola Asuh, Balita, Psikologi Ibu, Tumbuh Kembang, Umum');
  const [cfgClassifiedNotice, setCfgClassifiedNotice] = useState(siteConfig?.classified_notice || 'Iklan baris gratis : Tautan URL akan otomatis dikonversi menjadi teks biasa. Jika ingin menggunakan URL dan gambar iklan, hubungi redaksi/editor untuk tarif iklan baris berbayar.');

  // 9. Knowledge Base Model States
  const [cfgKbBadgeText, setCfgKbBadgeText] = useState(siteConfig?.kb_badge_text || 'Ensiklopedia & Pusat Bantuan');
  const [cfgKbTitle, setCfgKbTitle] = useState(siteConfig?.kb_title || 'Bagaimana Kami Bisa Membantu Pengasuhan Anda?');
  const [cfgKbSubtitle, setCfgKbSubtitle] = useState(siteConfig?.kb_subtitle || 'Cari jawaban terpercaya dari ribuan artikel, panduan medis, dan rekomendasi dokter spesialis anak.');
  const [cfgKbSearchPlaceholder, setCfgKbSearchPlaceholder] = useState(siteConfig?.kb_search_placeholder || 'Ketik topik (misal: jadwal MPASI, anak demam, speech delay, tantrum)...');

  const [configSuccessMsg, setConfigSuccessMsg] = useState('');
  const [configErrMsg, setConfigErrMsg] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [waLeads, setWaLeads] = useState<any[]>([]);
  const [isLoadingWaLeads, setIsLoadingWaLeads] = useState(false);
  const [waLeadsError, setWaLeadsError] = useState('');

  const [productOrders, setProductOrders] = useState<any[]>([]);
  const [isLoadingProductOrders, setIsLoadingProductOrders] = useState(false);
  const [productOrdersError, setProductOrdersError] = useState('');

  // Local state for WA Operator form management
  const [opFormName, setOpFormName] = useState('');
  const [opFormDept, setOpFormDept] = useState('');
  const [opFormPhone, setOpFormPhone] = useState('');
  const [opFormDesc, setOpFormDesc] = useState('');
  const [opFormStatus, setOpFormStatus] = useState<'online' | 'offline'>('online');
  const [editingOpId, setEditingOpId] = useState<string | null>(null);

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
      const adminOnlyTabs = ['writers', 'autolinks', 'sitemap', 'comments', 'config', 'wa_leads'];
      if (adminOnlyTabs.includes(activeTab)) {
        setActiveTab('posts');
      }
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (siteConfig) {
      setCfgHomepageDisplayMode(siteConfig.homepage_display_mode ?? 'default');
      setCfgActiveThemePreset(siteConfig.active_theme_preset ?? DEFAULT_SITE_CONFIG.active_theme_preset ?? 'corp-blue');
      setCfgFontOverrideMode(siteConfig.font_override_mode ?? DEFAULT_SITE_CONFIG.font_override_mode ?? 'system');
      setCfgSiteName(siteConfig.site_name ?? DEFAULT_SITE_CONFIG.site_name ?? '');
      setCfgTechBadgeHero(siteConfig.tech_badge_hero ?? 'Cloudflare D1 Edge Architecture');
      setCfgTechBadgePages(siteConfig.tech_badge_pages ?? 'Cloudflare Pages Edge');
      setCfgTechBadgeDatabase(siteConfig.tech_badge_database ?? 'Cloudflare D1 SQLite');
      setCfgTechBadgeStorage(siteConfig.tech_badge_storage ?? 'GitHub REST Storage');
      setCfgSiteTagline(siteConfig.site_tagline ?? DEFAULT_SITE_CONFIG.site_tagline ?? '');
      setCfgSiteDescription(siteConfig.site_description ?? DEFAULT_SITE_CONFIG.site_description ?? '');
      setCfgSiteLogoUrl(siteConfig.site_logo_url || '');
      setCfgSiteLogoIcon(siteConfig.site_logo_icon || 'Heart');
      setCfgSiteFaviconUrl(siteConfig.site_favicon_url || '/favicon.ico');
      setCfgTurnstileSiteKey(siteConfig.turnstile_site_key || '');
      setCfgEnableTurnstileFallback(siteConfig.enable_turnstile_fallback ?? true);
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

      setCfgEnableTopAnnouncement(siteConfig.enable_top_announcement ?? false);
      setCfgTopAnnouncementText(siteConfig.top_announcement_text ?? DEFAULT_SITE_CONFIG.top_announcement_text ?? '');
      setCfgTopAnnouncementBg(siteConfig.top_announcement_bg || 'bg-rose-600');
      setCfgTopAnnouncementTextColor(siteConfig.top_announcement_text_color || 'text-white');

      setCfgEnableWhatsappWidget(siteConfig.enable_whatsapp_widget ?? siteConfig.wa_widget_enabled ?? true);
      setCfgWhatsappNumber(siteConfig.whatsapp_number || '6281234567890');
      setCfgWhatsappDefaultMessage(siteConfig.whatsapp_default_message || 'Halo Redaksi, saya ingin bertanya seputar...');
      setCfgWhatsappPosition(siteConfig.whatsapp_position || siteConfig.wa_position || 'bottom-right');

      setCfgEnableCustomAdSlots(siteConfig.enable_custom_ad_slots ?? false);
      setCfgCustomAdLeaderboardHtml(siteConfig.custom_ad_leaderboard_html || '');
      setCfgCustomAdRectangleHtml(siteConfig.custom_ad_rectangle_html || '');
      setCfgCustomAdSlotSize(siteConfig.custom_ad_slot_size || '728x90');

      setCfgEnableHabitSimulator(siteConfig.enable_habit_simulator ?? true);
      setCfgHabitSimulatorTitle(siteConfig.habit_simulator_title || 'Simulasi Kebiasaan Positif');
      setCfgHabitSimulatorSubtitle(siteConfig.habit_simulator_subtitle || 'Ukur kebiasaan pengasuhan anak sehari-hari');

      setCfgEnableInteractiveQuiz(siteConfig.enable_interactive_quiz ?? true);
      setCfgQuizBuilderTitle(siteConfig.quiz_builder_title || 'Kuis Edukasi & Psikologi Anak');

      setCfgEnableInteractiveTimeline(siteConfig.enable_interactive_timeline ?? true);

      setCfgCusdisAppId(siteConfig.cusdis_app_id || '');
      setCfgCusdisHost(siteConfig.cusdis_host || 'https://cusdis.com');

      setCfgSeoMetaTitle(siteConfig.seo_meta_title ?? DEFAULT_SITE_CONFIG.seo_meta_title ?? '');
      setCfgSeoMetaDesc(siteConfig.seo_meta_description ?? DEFAULT_SITE_CONFIG.seo_meta_description ?? '');
      setCfgSeoDefaultOgImage(siteConfig.seo_default_og_image ?? DEFAULT_SITE_CONFIG.seo_default_og_image ?? '');

      setCfgShowHeroSection(siteConfig.show_hero_section ?? true);
      setCfgHeroTitle(siteConfig.hero_title ?? DEFAULT_SITE_CONFIG.hero_title ?? '');
      setCfgHeroSubtitle(siteConfig.hero_subtitle ?? DEFAULT_SITE_CONFIG.hero_subtitle ?? '');
      setCfgHeroCtaText(siteConfig.hero_cta_text ?? DEFAULT_SITE_CONFIG.hero_cta_text ?? '');
      setCfgHeroCtaLink(siteConfig.hero_cta_link ?? DEFAULT_SITE_CONFIG.hero_cta_link ?? '');
      setCfgHeroAffiliateWidgetEnable(siteConfig.hero_affiliate_widget_enable ?? false);
      setCfgHeroAffiliateWidgetPosition(siteConfig.hero_affiliate_widget_position || 'right');
      setCfgHeroAffiliateWidgetCode(siteConfig.hero_affiliate_widget_code ?? DEFAULT_SITE_CONFIG.hero_affiliate_widget_code ?? '');

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
      setCfgEnableCommentTurnstile(siteConfig.enable_comment_turnstile ?? true);
      setCfgHistoryMinTimeMinutes(siteConfig.history_min_time_minutes ?? 3);
      setCfgHistoryMinCharDiff(siteConfig.history_min_char_diff ?? 25);

      setCfgShowSidebar(siteConfig.show_sidebar ?? true);
      setCfgPopularPostsCount(siteConfig.popular_posts_count || 5);
      setCfgCategoriesWidgetLimit(siteConfig.categories_widget_limit || 8);
      setCfgSidebarBannerCode(siteConfig.sidebar_banner_code || '');

      setCfgCustomSnippetHeadEnable(siteConfig.custom_snippet_head_enable ?? false);
      setCfgCustomSnippetHeadCode(siteConfig.custom_snippet_head_code || DEFAULT_SITE_CONFIG.custom_snippet_head_code || '');
      setCfgCustomSnippetBodyEnable(siteConfig.custom_snippet_body_enable ?? false);
      setCfgCustomSnippetBodyCode(siteConfig.custom_snippet_body_code || DEFAULT_SITE_CONFIG.custom_snippet_body_code || '');

      setCfgCustomMetaTagsEnable(siteConfig.custom_meta_tags_enable ?? false);
      setCfgCustomMetaTagsCode(siteConfig.custom_meta_tags_code || DEFAULT_SITE_CONFIG.custom_meta_tags_code || '');

      setCfgAdBannerFirstHalfEnable(siteConfig.ad_banner_first_half_enable ?? false);
      setCfgAdBannerFirstHalfCode(siteConfig.ad_banner_first_half_code || DEFAULT_SITE_CONFIG.ad_banner_first_half_code || '');
      setCfgAdBannerStickyFooterEnable(siteConfig.ad_banner_sticky_footer_enable ?? false);
      setCfgAdBannerStickyFooterCode(siteConfig.ad_banner_sticky_footer_code || DEFAULT_SITE_CONFIG.ad_banner_sticky_footer_code || '');
      setCfgAdBannerArticleStartEnable(siteConfig.ad_banner_article_start_enable ?? false);
      setCfgAdBannerArticleStartCode(siteConfig.ad_banner_article_start_code || DEFAULT_SITE_CONFIG.ad_banner_article_start_code || '');
      setCfgAdBannerArticleEndEnable(siteConfig.ad_banner_article_end_enable ?? false);
      setCfgAdBannerArticleEndCode(siteConfig.ad_banner_article_end_code || DEFAULT_SITE_CONFIG.ad_banner_article_end_code || '');

      setCfgFooterAboutText(siteConfig.footer_about_text || DEFAULT_SITE_CONFIG.footer_about_text);
      setCfgFooterCopyrightText(siteConfig.footer_copyright_text || DEFAULT_SITE_CONFIG.footer_copyright_text);
      setCfgSocialFacebook(siteConfig.social_facebook || '');
      setCfgSocialInstagram(siteConfig.social_instagram || '');
      setCfgSocialTwitter(siteConfig.social_twitter || '');
      
      setCfgAdminLoginTitle(siteConfig.admin_login_title || (siteConfig?.site_name ? `Portal Admin ${siteConfig.site_name}` : 'Portal Admin Website'));
      setCfgAdminLoginSubtitle(siteConfig.admin_login_subtitle || 'Sistem Otentikasi Cloudflare D1');
      setCfgAdminLoginBtnText(siteConfig.admin_login_btn_text || 'Masuk Portal CMS');
      setCfgAdminUrlSuffix(String(siteConfig.admin_url_suffix || '9999'));

      setCfgSiteDomain(siteConfig.site_domain || 'domain.com');
      setCfgHeaderBadgeText(siteConfig.header_badge_text || 'Cloudflare D1 Edge Engine');
      setCfgShowHeaderBadge(siteConfig.show_header_badge ?? siteConfig.show_edge_badge ?? true);
      setCfgMobileAdminBtnLabel(siteConfig.mobile_admin_btn_label || 'Portal Admin & Editor');
      setCfgMobileShowLoggedUsername(siteConfig.mobile_show_logged_username ?? false);
      setCfgProductsNavLabel(siteConfig.products_nav_label || 'Produk');
      setCfgProductsNavPath(siteConfig.products_nav_path || '/produk');
      setCfgSellerBankAccounts(siteConfig.seller_bank_accounts || '');
      setCfgProductsHeroBadge(siteConfig.products_hero_badge || '🛍️ Katalog Produk & Paket Eksklusif');
      setCfgProductsHeroTitle(siteConfig.products_hero_title || 'Miliki Produk & Paket Pilihan Berkualitas');
      setCfgProductsHeroSubtitle(siteConfig.products_hero_subtitle || 'Temukan berbagai koleksi produk, paket, dan penawaran terbaik. Didukung pembayaran instan QRIS/Bank dan koordinasi pengiriman aman via WhatsApp.');
      setCfgProductsHeroBtnText(siteConfig.products_hero_btn_text || 'Tambah Produk Baru');
      setCfgProductsHeroImageUrl(siteConfig.products_hero_image_url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80');
      setCfgProductsHeroImageCaption(siteConfig.products_hero_image_caption || 'Katalog Pilihan Utama');
      setCfgProductsEmptyTitle(siteConfig.products_empty_title || 'Belum Ada Produk Jualan');
      setCfgProductsEmptySubtitle(siteConfig.products_empty_subtitle || 'Katalog produk belum diunggah. Silakan masuk sebagai administrator untuk menambahkan item pertama Anda.');
      setCfgHeroBadgeText(siteConfig.hero_badge_text || 'Portal Nomor 1');
      setCfgAutolinkTickerLabel(siteConfig.autolink_ticker_label || 'Topik Trending:');
      setCfgFooterAutolinkLabel(siteConfig.footer_autolink_label || 'Tautan Populer');
      setCfgReferenceHeadingLabel(siteConfig.reference_heading_label || 'Referensi');
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
      setCfgProductMgmtHeading(siteConfig.product_mgmt_heading || 'Panel Manajemen Produk Jualan');
      setCfgProductMgmtDesc(siteConfig.product_mgmt_desc || 'Kelola daftar penawaran, produk digital, jasa, atau paket yang Anda pasarkan. Anda dapat menambah, mengedit, memperbarui status (Tersedia/Terjual), serta menetapkan nomor WhatsApp dan metode pembayaran untuk masing-masing item.');

      setCfgClassifiedMastheadTitle(siteConfig.classified_masthead_title || 'WARNA-WARTO BERITA');
      setCfgClassifiedMastheadSubtitle(siteConfig.classified_masthead_subtitle || 'LEMBARAN IKLAN BARIS, PENGUMUMAN & WARTA KELUARGA');
      setCfgClassifiedEdition(siteConfig.classified_edition || '1988/2026');
      setCfgClassifiedPriceTag(siteConfig.classified_price_tag || 'HARGA ECERAN RP 500,-');
      setCfgClassifiedPhone(siteConfig.classified_phone || '(021) 7654321');
      setCfgClassifiedCategories(siteConfig.classified_categories || 'Aksesoris, Aplikasi, Asuransi, Bimbel, Buku, Daycare, Jasa, Kebersihan, Kehamilan, Keluarga, Kesehatan, Keuangan, Klinik, Konsultasi, Kursus, Les Privat, Lifestyle, Lowongan Kerja, Mainan, Mencari Kerja, Menyusui, Nutrisi Gizi, Obat, Pakaian, Pasca Kelahiran, Pendidikan, Pengasuh, Peralatan, Perawatan, Perlengkapan, Sekolah, Sepatu, Seminar, Training, Transport, Wisata, Pola Asuh, Balita, Psikologi Ibu, Tumbuh Kembang, Umum');
      setCfgClassifiedNotice(siteConfig.classified_notice || 'Iklan baris gratis : Tautan URL akan otomatis dikonversi menjadi teks biasa. Jika ingin menggunakan URL dan gambar iklan, hubungi redaksi/editor untuk tarif iklan baris berbayar.');

      setCfgKbBadgeText(siteConfig.kb_badge_text || 'Ensiklopedia & Pusat Bantuan');
      setCfgKbTitle(siteConfig.kb_title || 'Bagaimana Kami Bisa Membantu Pengasuhan Anda?');
      setCfgKbSubtitle(siteConfig.kb_subtitle || 'Cari jawaban terpercaya dari ribuan artikel, panduan medis, dan rekomendasi dokter spesialis anak.');
      setCfgKbSearchPlaceholder(siteConfig.kb_search_placeholder || 'Ketik topik (misal: jadwal MPASI, anak demam, speech delay, tantrum)...');

      // WhatsApp Chat Widget Configuration Sync
      setCfgWaEnabled(siteConfig.wa_widget_enabled ?? false);
      setCfgWaPosition(siteConfig.wa_position || 'bottom-right');
      setCfgWaHeaderTitle(siteConfig.wa_header_title || 'Hubungi Kami');
      setCfgWaSubtitle(siteConfig.wa_subtitle || 'Ada yang bisa kami bantu?');
      setCfgWaColorAccent(siteConfig.wa_color_accent || '#25D366');
      setCfgWaOperators(siteConfig.wa_operators || []);
      setCfgWaFormFields(siteConfig.wa_form_fields || ['name', 'phone', 'message']);
      setCfgWaEnableRotation(siteConfig.wa_enable_rotation ?? false);

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
        font_override_mode: cfgFontOverrideMode,
        site_name: cfgSiteName,
        mobile_admin_btn_label: cfgMobileAdminBtnLabel,
        mobile_show_logged_username: cfgMobileShowLoggedUsername,
        products_nav_label: cfgProductsNavLabel,
        products_nav_path: cfgProductsNavPath,
        seller_bank_accounts: cfgSellerBankAccounts,
        products_hero_badge: cfgProductsHeroBadge,
        products_hero_title: cfgProductsHeroTitle,
        products_hero_subtitle: cfgProductsHeroSubtitle,
        products_hero_btn_text: cfgProductsHeroBtnText,
        products_hero_image_url: cfgProductsHeroImageUrl,
        products_hero_image_caption: cfgProductsHeroImageCaption,
        products_empty_title: cfgProductsEmptyTitle,
        products_empty_subtitle: cfgProductsEmptySubtitle,
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
        reference_heading_label: cfgReferenceHeadingLabel,
        footer_badge_1: cfgFooterBadge1,
        footer_badge_2: cfgFooterBadge2,
        footer_badge_3: cfgFooterBadge3,
        turnstile_site_key: cfgTurnstileSiteKey,
        enable_turnstile_fallback: cfgEnableTurnstileFallback,
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
        hero_affiliate_widget_enable: cfgHeroAffiliateWidgetEnable,
        hero_affiliate_widget_position: cfgHeroAffiliateWidgetPosition,
        hero_affiliate_widget_code: cfgHeroAffiliateWidgetCode,
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
        enable_comment_turnstile: cfgEnableCommentTurnstile,
        history_min_time_minutes: Number(cfgHistoryMinTimeMinutes),
        history_min_char_diff: Number(cfgHistoryMinCharDiff),
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
        admin_url_suffix: String(cfgAdminUrlSuffix || '9999').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 10),
        product_mgmt_heading: cfgProductMgmtHeading,
        product_mgmt_desc: cfgProductMgmtDesc,

        enable_adsense: cfgEnableAdsense,
        adsense_client_id: cfgAdsenseClientId,
        adsense_header_top: cfgAdsenseHeaderTop,
        adsense_article_top: cfgAdsenseArticleTop,
        adsense_article_middle: cfgAdsenseArticleMiddle,
        adsense_article_bottom: cfgAdsenseArticleBottom,
        adsense_sidebar: cfgAdsenseSidebar,
        adsense_sticky_footer: cfgAdsenseStickyFooter,

        custom_snippet_head_enable: cfgCustomSnippetHeadEnable,
        custom_snippet_head_code: cfgCustomSnippetHeadCode,
        custom_snippet_body_enable: cfgCustomSnippetBodyEnable,
        custom_snippet_body_code: cfgCustomSnippetBodyCode,

        custom_meta_tags_enable: cfgCustomMetaTagsEnable,
        custom_meta_tags_code: cfgCustomMetaTagsCode,

        ad_banner_first_half_enable: cfgAdBannerFirstHalfEnable,
        ad_banner_first_half_code: cfgAdBannerFirstHalfCode,
        ad_banner_sticky_footer_enable: cfgAdBannerStickyFooterEnable,
        ad_banner_sticky_footer_code: cfgAdBannerStickyFooterCode,
        ad_banner_article_start_enable: cfgAdBannerArticleStartEnable,
        ad_banner_article_start_code: cfgAdBannerArticleStartCode,
        ad_banner_article_end_enable: cfgAdBannerArticleEndEnable,
        ad_banner_article_end_code: cfgAdBannerArticleEndCode,

        enable_top_announcement: cfgEnableTopAnnouncement,
        top_announcement_text: cfgTopAnnouncementText,
        top_announcement_bg: cfgTopAnnouncementBg,
        top_announcement_text_color: cfgTopAnnouncementTextColor,

        enable_whatsapp_widget: cfgEnableWhatsappWidget,
        whatsapp_number: cfgWhatsappNumber,
        whatsapp_default_message: cfgWhatsappDefaultMessage,
        whatsapp_position: cfgWhatsappPosition,

        enable_custom_ad_slots: cfgEnableCustomAdSlots,
        custom_ad_leaderboard_html: cfgCustomAdLeaderboardHtml,
        custom_ad_rectangle_html: cfgCustomAdRectangleHtml,
        custom_ad_slot_size: cfgCustomAdSlotSize,

        enable_habit_simulator: cfgEnableHabitSimulator,
        habit_simulator_title: cfgHabitSimulatorTitle,
        habit_simulator_subtitle: cfgHabitSimulatorSubtitle,

        enable_interactive_quiz: cfgEnableInteractiveQuiz,
        quiz_builder_title: cfgQuizBuilderTitle,

        enable_interactive_timeline: cfgEnableInteractiveTimeline,

        cusdis_app_id: cfgCusdisAppId,
        cusdis_host: cfgCusdisHost,

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
        classified_categories: cfgClassifiedCategories,
        classified_notice: cfgClassifiedNotice,

        kb_badge_text: cfgKbBadgeText,
        kb_title: cfgKbTitle,
        kb_subtitle: cfgKbSubtitle,
        kb_search_placeholder: cfgKbSearchPlaceholder,

        // WhatsApp Chat Widget Configuration
        wa_widget_enabled: cfgWaEnabled,
        wa_position: cfgWaPosition,
        wa_header_title: cfgWaHeaderTitle,
        wa_subtitle: cfgWaSubtitle,
        wa_color_accent: cfgWaColorAccent,
        wa_operators: cfgWaOperators,
        wa_form_fields: cfgWaFormFields,
        wa_enable_rotation: cfgWaEnableRotation,
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
    cfgPaginationType, cfgCommentEngineMode, cfgHistoryMinTimeMinutes, cfgHistoryMinCharDiff, cfgShowSidebar, cfgPopularPostsCount,
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
    cfgKbBadgeText, cfgKbTitle, cfgKbSubtitle, cfgKbSearchPlaceholder,
    cfgProductsNavLabel, cfgProductsNavPath,
    // WA dependencies
    cfgWaEnabled, cfgWaPosition, cfgWaHeaderTitle, cfgWaSubtitle, cfgWaColorAccent, cfgWaOperators, cfgWaFormFields, cfgWaEnableRotation
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

    let cleanEmergency = emergencyKeyInput.trim();
    if (!turnstileToken && !cleanEmergency) {
      if (turnstileLoadError) {
        cleanEmergency = 'darurat123';
        setEmergencyKeyInput('darurat123');
        setShowEmergencyInput(true);
      } else {
        // Auto-provide emergency recovery key if trying default credentials so installation is never blocked
        if (passwordInput.trim() === 'admin123' && (emailInput.trim().toLowerCase() === 'admin' || emailInput.trim().toLowerCase().startsWith('admin@'))) {
          cleanEmergency = 'darurat123';
          setEmergencyKeyInput('darurat123');
          setShowEmergencyInput(true);
        } else {
          setLoginError('Harap selesaikan verifikasi Turnstile atau gunakan Kunci Darurat.');
          setShowEmergencyInput(true);
          setEmergencyKeyInput('darurat123');
          return;
        }
      }
    }

    setIsLoggingIn(true);
    const result = await onLogin(emailInput, passwordInput, turnstileToken, cleanEmergency);
    setIsLoggingIn(false);

    // Single-use token contract: reset Turnstile widget after request completes
    turnstileRef.current?.reset();
    setTurnstileToken('');

    if (typeof result === 'object') {
      if (!result.success) {
        const errMsg = result.error || 'Email/Username atau password salah, atau verifikasi gagal.';
        setLoginError(errMsg);
        setShowEmergencyInput(true);
        if (!emergencyKeyInput.trim()) {
          setEmergencyKeyInput('darurat123');
        }
      }
    } else if (!result) {
      setLoginError('Email/Username atau password salah, atau verifikasi Turnstile/Kunci Darurat gagal.');
      setShowEmergencyInput(true);
      if (!emergencyKeyInput.trim()) {
        setEmergencyKeyInput('darurat123');
      }
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
        font_override_mode: cfgFontOverrideMode,
        site_name: cfgSiteName,
        mobile_admin_btn_label: cfgMobileAdminBtnLabel,
        mobile_show_logged_username: cfgMobileShowLoggedUsername,
        products_nav_label: cfgProductsNavLabel,
        products_nav_path: cfgProductsNavPath,
        seller_bank_accounts: cfgSellerBankAccounts,
        products_hero_badge: cfgProductsHeroBadge,
        products_hero_title: cfgProductsHeroTitle,
        products_hero_subtitle: cfgProductsHeroSubtitle,
        products_hero_btn_text: cfgProductsHeroBtnText,
        products_hero_image_url: cfgProductsHeroImageUrl,
        products_hero_image_caption: cfgProductsHeroImageCaption,
        products_empty_title: cfgProductsEmptyTitle,
        products_empty_subtitle: cfgProductsEmptySubtitle,

        wa_widget_enabled: cfgWaEnabled,
        wa_position: cfgWaPosition,
        wa_header_title: cfgWaHeaderTitle,
        wa_subtitle: cfgWaSubtitle,
        wa_color_accent: cfgWaColorAccent,
        wa_operators: cfgWaOperators,
        wa_form_fields: cfgWaFormFields,
        wa_enable_rotation: cfgWaEnableRotation,

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
        reference_heading_label: cfgReferenceHeadingLabel,
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

        custom_snippet_head_enable: cfgCustomSnippetHeadEnable,
        custom_snippet_head_code: cfgCustomSnippetHeadCode,
        custom_snippet_body_enable: cfgCustomSnippetBodyEnable,
        custom_snippet_body_code: cfgCustomSnippetBodyCode,

        custom_meta_tags_enable: cfgCustomMetaTagsEnable,
        custom_meta_tags_code: cfgCustomMetaTagsCode,

        ad_banner_first_half_enable: cfgAdBannerFirstHalfEnable,
        ad_banner_first_half_code: cfgAdBannerFirstHalfCode,
        ad_banner_sticky_footer_enable: cfgAdBannerStickyFooterEnable,
        ad_banner_sticky_footer_code: cfgAdBannerStickyFooterCode,
        ad_banner_article_start_enable: cfgAdBannerArticleStartEnable,
        ad_banner_article_start_code: cfgAdBannerArticleStartCode,
        ad_banner_article_end_enable: cfgAdBannerArticleEndEnable,
        ad_banner_article_end_code: cfgAdBannerArticleEndCode,

        enable_top_announcement: cfgEnableTopAnnouncement,
        top_announcement_text: cfgTopAnnouncementText,
        top_announcement_bg: cfgTopAnnouncementBg,
        top_announcement_text_color: cfgTopAnnouncementTextColor,

        enable_whatsapp_widget: cfgEnableWhatsappWidget,
        whatsapp_number: cfgWhatsappNumber,
        whatsapp_default_message: cfgWhatsappDefaultMessage,
        whatsapp_position: cfgWhatsappPosition,

        enable_custom_ad_slots: cfgEnableCustomAdSlots,
        custom_ad_leaderboard_html: cfgCustomAdLeaderboardHtml,
        custom_ad_rectangle_html: cfgCustomAdRectangleHtml,
        custom_ad_slot_size: cfgCustomAdSlotSize,

        enable_habit_simulator: cfgEnableHabitSimulator,
        habit_simulator_title: cfgHabitSimulatorTitle,
        habit_simulator_subtitle: cfgHabitSimulatorSubtitle,

        enable_interactive_quiz: cfgEnableInteractiveQuiz,
        quiz_builder_title: cfgQuizBuilderTitle,

        enable_interactive_timeline: cfgEnableInteractiveTimeline,

        cusdis_app_id: cfgCusdisAppId,
        cusdis_host: cfgCusdisHost,

        turnstile_site_key: cfgTurnstileSiteKey,
        enable_turnstile_fallback: cfgEnableTurnstileFallback,
        ...(cfgTurnstileSecretKey.trim() ? { turnstile_secret_key: cfgTurnstileSecretKey.trim() } : {}),

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
        hero_affiliate_widget_enable: cfgHeroAffiliateWidgetEnable,
        hero_affiliate_widget_position: cfgHeroAffiliateWidgetPosition,
        hero_affiliate_widget_code: cfgHeroAffiliateWidgetCode,
        tech_badge_hero: cfgTechBadgeHero,
        tech_badge_pages: cfgTechBadgePages,
        tech_badge_database: cfgTechBadgeDatabase,
        tech_badge_storage: cfgTechBadgeStorage,
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
        enable_comment_turnstile: cfgEnableCommentTurnstile,
        history_min_time_minutes: Number(cfgHistoryMinTimeMinutes),
        history_min_char_diff: Number(cfgHistoryMinCharDiff),

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
        admin_url_suffix: String(cfgAdminUrlSuffix || '9999').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 10),
        product_mgmt_heading: cfgProductMgmtHeading,
        product_mgmt_desc: cfgProductMgmtDesc,

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
        classified_categories: cfgClassifiedCategories,
        classified_notice: cfgClassifiedNotice,

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

  const logoutHardLink = typeof window !== 'undefined' ? `${window.location.origin}/admin-${String(cfgAdminUrlSuffix || '9999')}?logout=true` : `/admin-${String(cfgAdminUrlSuffix || '9999')}?logout=true`;

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
    setEditorCoAuthorIds(parseCoAuthorIds(post));
    setEditorPostType(post.postType || 'article');
    setEditorInteractiveConfigurator(post.interactiveConfigurator || null);
    setEditorInteractiveShowcase(post.interactiveShowcase || null);
    setEditorInteractiveRadar(post.interactiveRadar || null);
    setEditorInteractiveQuiz(post.interactiveQuiz || null);
    setEditorInteractiveTimelineSlider(post.interactiveTimelineSlider || null);
    setEditorInteractiveBattleCard(post.interactiveBattleCard || null);
    setEditorInteractiveQuizRouter(post.interactiveQuizRouter || null);
    setEditorInteractiveHabitSimulator(post.interactiveHabitSimulator || null);
    setEditorInteractiveQaColumn(post.interactiveQaColumn || null);
    setEditorInteractiveEventListing(post.interactiveEventListing || null);
    setEditorInteractiveGlossaryDictionary(post.interactiveGlossaryDictionary || null);
    setEditorDisclaimerType(post.disclaimerType || 'none');
    setEditorCustomDisclaimerText(post.customDisclaimerText || '');
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
    setEditorPostType('article');
    setEditorInteractiveConfigurator(null);
    setEditorInteractiveShowcase(null);
    setEditorInteractiveRadar(null);
    setEditorInteractiveQuiz(null);
    setEditorInteractiveTimelineSlider(null);
    setEditorInteractiveBattleCard(null);
    setEditorInteractiveQuizRouter(null);
    setEditorInteractiveHabitSimulator(null);
    setEditorInteractiveQaColumn(null);
    setEditorInteractiveEventListing(null);
    setEditorInteractiveGlossaryDictionary(null);
    setEditorDisclaimerType('none');
    setEditorCustomDisclaimerText('');
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
      const currentAuthorId = (currentUser?.role === 'writer' && currentUser?.id)
        ? currentUser.id
        : (editorAuthorId || currentUser?.id || 1);

      try {
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
          authorId: currentAuthorId,
          coAuthorIds: editorCoAuthorIds,
          postType: editorPostType,
          interactiveConfigurator: editorInteractiveConfigurator,
          interactiveShowcase: editorInteractiveShowcase,
          interactiveRadar: editorInteractiveRadar,
          interactiveQuiz: editorInteractiveQuiz,
          interactiveTimelineSlider: editorInteractiveTimelineSlider,
          interactiveBattleCard: editorInteractiveBattleCard,
          interactiveQuizRouter: editorInteractiveQuizRouter,
          interactiveHabitSimulator: editorInteractiveHabitSimulator,
          interactiveQaColumn: editorInteractiveQaColumn,
          interactiveEventListing: editorInteractiveEventListing,
          interactiveGlossaryDictionary: editorInteractiveGlossaryDictionary,
          disclaimerType: editorDisclaimerType,
          customDisclaimerText: editorCustomDisclaimerText,
        });

        if (saved && saved.id && !editingPostId) {
          setEditingPostId(saved.id);
        }
        setAutoSaveStatus('saved');
      } catch (err) {
        console.warn('Auto-save draft warning:', err);
        setAutoSaveStatus('dirty');
      }
    }, 3000); // Save automatically 3s after typing pause

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [editorTitle, editorMarkdown, editorExcerpt, editorCategory, editorImage, editorAuthorId, editorCoAuthorIds, editorPostType, editorInteractiveConfigurator, editorInteractiveShowcase, editorInteractiveRadar, editorInteractiveQuiz, editorInteractiveTimelineSlider, editorInteractiveBattleCard, editorInteractiveQuizRouter, editorInteractiveHabitSimulator, editorInteractiveQaColumn, editorDisclaimerType, editorCustomDisclaimerText, currentUser, editingPostId]);

  // Insert Markdown formatting toolbar
  const insertToolbar = (prefix: string, suffix: string = '') => {
    setEditorMarkdown((prev) => `${prev}\n${prefix}Teks Ditambahkan${suffix}`);
  };

  // Cloudinary REST API Image Upload Handler (WebP Format, Tablet Max 1024px Width, Max 3MB)
  const handleImageUploadFile = async (file: File): Promise<string | null> => {
    // 1. Client-side File Size Validation (Max 3MB limit)
    const MAX_SIZE_BYTES = 3 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      alert(`Ukuran file "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas 3 MB. Silakan pilih atau kompres gambar terlebih dahulu agar loading artikel tetap ringan.`);
      return null;
    }

    setUploadingImage(true);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Content = reader.result as string;
        try {
          const res = await fetch('/api/upload-cloudinary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify({
              filename: file.name,
              base64Content,
            }),
          });
          const data: any = await res.json();
          if (data.url) {
            setEditorImage((prev) => prev || data.url);
            resolve(data.url);
          } else if (data.error) {
            alert(`Gagal upload gambar ke Cloudinary: ${data.error}`);
            resolve(null);
          } else {
            resolve(null);
          }
        } catch (err) {
          console.error('Cloudinary image upload failed', err);
          alert('Terjadi kesalahan koneksi saat mengunggah gambar ke server Cloudinary.');
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
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
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
    if (!editorTitle.trim() || !editorMarkdown.trim()) {
      alert('⚠️ Gagal Menyimpan: Judul dan isi konten artikel wajib diisi!');
      return;
    }

    if (!currentUser) {
      setAutoSaveStatus('dirty');
      alert('❌ Gagal menyimpan artikel, Alasan penyebab gagal: pengguna tidak ditemukan atau sesi telah kedaluwarsa.');
      return;
    }

    setAutoSaveStatus('saving');
    const currentAuthorId = (currentUser?.role === 'writer' && currentUser?.id)
      ? currentUser.id
      : (editorAuthorId || currentUser?.id || 1);

    try {
      const saved = await onSavePost({
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
        authorId: currentAuthorId,
        coAuthorIds: editorCoAuthorIds,
        postType: editorPostType,
        interactiveConfigurator: editorInteractiveConfigurator,
        interactiveShowcase: editorInteractiveShowcase,
        interactiveRadar: editorInteractiveRadar,
        interactiveQuiz: editorInteractiveQuiz,
        interactiveTimelineSlider: editorInteractiveTimelineSlider,
        interactiveBattleCard: editorInteractiveBattleCard,
        interactiveQuizRouter: editorInteractiveQuizRouter,
        interactiveHabitSimulator: editorInteractiveHabitSimulator,
        interactiveQaColumn: editorInteractiveQaColumn,
        interactiveEventListing: editorInteractiveEventListing,
        interactiveGlossaryDictionary: editorInteractiveGlossaryDictionary,
        disclaimerType: editorDisclaimerType,
        customDisclaimerText: editorCustomDisclaimerText,
      });

      if (saved && saved.id) {
        setEditingPostId(saved.id);
        setEditorStatus(saved.status || status);
      }
      setAutoSaveStatus('saved');

      if (status === 'draft') {
        setEditorStatus('draft');
        alert('✅ Draf artikel berhasil disimpan!');
      } else if (status === 'pending_approval') {
        alert('🚀 Artikel berhasil dikirim untuk ditinjau oleh Tim Redaksi/Editor!');
        setActiveTab('posts');
      } else if (status === 'published') {
        alert('🎉 Artikel BERHASIL disetujui dan DITERBITKAN secara resmi ke website!');
        setActiveTab('posts');
      } else if (status === 'rejected') {
        alert(' Catatan revisi telah disimpan dan status artikel dikembalikan ke Penulis.');
        setActiveTab('posts');
      } else {
        setActiveTab('posts');
      }
    } catch (err: any) {
      setAutoSaveStatus('dirty');
      const isAuthError = !currentUser || 
                          err.message?.toLowerCase().includes('sesi') || 
                          err.message?.toLowerCase().includes('auth') || 
                          err.message?.toLowerCase().includes('token') || 
                          err.message?.toLowerCase().includes('unauthorized') || 
                          err.message?.toLowerCase().includes('pengguna');
      
      if (isAuthError) {
        alert('❌ Gagal menyimpan artikel, Alasan penyebab gagal: pengguna tidak ditemukan atau sesi telah kedaluwarsa.');
      } else {
        alert(`❌ Gagal ${status === 'published' ? 'menerbitkan' : 'menyimpan'} artikel!\n\nAlasan/Penyebab Gagal: ${err.message || 'Terjadi kesalahan pada jaringan atau server.'}`);
      }
    }
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
    setWIsVerifiedAcademic(false);
    setWVerifiedAcademicLabel('Penulis Akademik Terverifikasi');
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
    setWIsVerifiedAcademic(!!w.isVerifiedAcademic);
    setWVerifiedAcademicLabel(w.verifiedAcademicLabel || 'Penulis Akademik Terverifikasi');
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
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          id: editingWriterId || undefined,
          name: wName,
          email: wEmail,
          password: wPassword || undefined,
          role: wRole,
          avatar: wAvatar,
          title: wTitle,
          bio: wBio,
          isVerifiedAcademic: wIsVerifiedAcademic,
          verifiedAcademicLabel: wVerifiedAcademicLabel,
          socials: {
            instagram: wInstagram || undefined,
            linkedin: wLinkedin || undefined,
            website: wWebsite || undefined,
          },
        }),
      });

      const data: any = await res.json();
      if (res.ok && data.user) {
        setWriterSuccessMsg(writerModalMode === 'create' ? 'Penulis baru telah ditambahkan!' : 'Profil penulis berhasil diperbarui!');
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
        headers: {
          ...getAuthHeaders(),
        },
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
                Email / Username Terdaftar
              </label>
              <input
                type="text"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                placeholder="admin@domain.com atau admin"
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

            {/* Turnstile Widget / Emergency Bypass UI */}
            {emergencyKeyInput && !showEmergencyInput ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-semibold">Kunci Darurat Aktif</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEmergencyKeyInput('')}
                  className="text-[11px] underline text-amber-600 hover:text-amber-800"
                >
                  Gunakan Turnstile
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <TurnstileWidget
                  ref={turnstileRef}
                  siteKey={siteConfig?.turnstile_site_key}
                  action="login"
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken('')}
                  onError={() => {
                    setTurnstileLoadError(true);
                    setShowEmergencyInput(true);
                  }}
                />

                {!showEmergencyInput ? (
                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowEmergencyInput(true)}
                      className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{turnstileLoadError ? 'Turnstile error pada domain baru? Gunakan Kunci Darurat' : 'Opsi Darurat Terkunci dari Luar'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-600" />
                        <span>Kunci Darurat (Emergency Recovery Key)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEmergencyInput(false);
                          setEmergencyKeyInput('');
                        }}
                        className="text-[11px] text-slate-500 hover:text-slate-700"
                      >
                        Batal
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={emergencyKeyInput}
                        onChange={(e) => setEmergencyKeyInput(e.target.value)}
                        placeholder="Default: darurat123 atau ADMIN_EMERGENCY_KEY"
                        className="flex-1 px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setEmergencyKeyInput('darurat123')}
                        className="px-2.5 py-2 text-[11px] font-semibold bg-amber-200/70 hover:bg-amber-300 text-amber-900 rounded-lg whitespace-nowrap transition-colors"
                        title="Isi dengan Kunci Darurat Bawaan"
                      >
                        Isi Bawaan
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400/80 leading-relaxed">
                      Kunci darurat bawaan CMS adalah <code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">darurat123</code> (atau sesuaikan dengan variabel <code className="font-mono">ADMIN_EMERGENCY_KEY</code> di Cloudflare Pages Dashboard). Gunakan opsi ini jika domain baru belum didaftarkan di widget Turnstile.
                    </p>
                  </div>
                )}
              </div>
            )}

            {loginError && (
              <div className="space-y-2">
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium text-center bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60">
                  {loginError}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput('admin@domain.com');
                    setPasswordInput('admin123');
                    setEmergencyKeyInput('darurat123');
                    setShowEmergencyInput(true);
                    setLoginError('');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-amber-300 dark:border-amber-700 shadow-sm"
                >
                  <Key className="w-4 h-4" />
                  <span>Buka Akses Instan dengan Kunci Darurat (darurat123)</span>
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              <span>{siteConfig?.admin_login_btn_text || 'Masuk Portal CMS'}</span>
            </button>
          </form>

          {/* Quick Default Credentials Note */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400 dark:text-slate-500 space-y-2">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Login Default CMS:</span>
              <button
                type="button"
                onClick={() => {
                  setEmailInput('admin@domain.com');
                  setPasswordInput('admin123');
                  setEmergencyKeyInput('darurat123');
                  setShowEmergencyInput(true);
                  setLoginError('');
                }}
                className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-mono font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors shadow-sm"
                title="Klik untuk mengisi email, password, dan kunci darurat default"
              >
                admin@domain.com / admin123 + darurat123 (Isi Otomatis)
              </button>
            </div>
            <p>
              Kunci Darurat: <button type="button" onClick={() => { setShowEmergencyInput(true); setEmergencyKeyInput('darurat123'); }} className="underline font-mono text-amber-600 dark:text-amber-400 font-semibold hover:text-amber-700">darurat123</button> (Gunakan jika Turnstile backend belum disinkronkan)
            </p>

            {/* D1 Database Turnstile & Admin Troubleshooting Guide for New Domain Installers */}
            <div className="pt-2 text-left">
              <button
                type="button"
                onClick={() => setShowD1SqlGuide(!showD1SqlGuide)}
                className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-900 transition-all"
              >
                <span className="flex items-center gap-1.5 text-left">
                  <Database className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Kendala Login Domain Baru? Bantuan SQL D1 Database</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${showD1SqlGuide ? 'rotate-180' : ''}`} />
              </button>

              {showD1SqlGuide && (
                <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      1. Kenapa Turnstile sudah hijau tapi gagal login?
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Widget di layar menggunakan <b>Site Key</b>, sedangkan server memverifikasi menggunakan <b>Secret Key</b>. Jika Secret Key belum disinkronkan ke domain baru, gunakan <b>Kunci Darurat (darurat123)</b> di atas, atau masukkan kedua key ke D1:
                    </p>
                    <div className="mt-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-950 font-mono text-[10px] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div>INSERT OR REPLACE INTO configs (key, value) VALUES ('turnstile_site_key', 'YOUR_SITE_KEY');</div>
                      <div>INSERT OR REPLACE INTO configs (key, value) VALUES ('turnstile_secret_key', 'YOUR_SECRET_KEY');</div>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      2. Reset Password Admin &amp; Buka Blokir Brute Force via D1 Console:
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Jika Anda mencoba berkali-kali dan terblokir 15 menit, atau password di database belum tersinkron, jalankan query ini di <b>Cloudflare D1 &gt; Console</b>:
                    </p>
                    <div className="mt-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-950 font-mono text-[10px] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
                      <code className="break-all whitespace-pre-wrap">DELETE FROM login_attempts; INSERT OR REPLACE INTO users (id, email, password, password_hash, name, role, title, created_at) VALUES (1, 'admin@domain.com', 'admin123', 'admin123', 'Admin', 'admin', 'Administrator Utama', datetime('now'));</code>
                      <button
                        type="button"
                        onClick={handleCopySql}
                        className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-sans font-medium flex items-center gap-1 shrink-0"
                        title="Salin query SQL"
                      >
                        {hasCopiedSql ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{hasCopiedSql ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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
      {!(isZenMode && activeTab === 'editor') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={getOptimizedAvatarUrl(currentUser.avatar, 48, 60)}
              alt={currentUser.name}
              width={48}
              height={48}
              loading="lazy"
              decoding="async"
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
                <span className="relative flex h-2 w-2" title="Database D1 Connected">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-xs text-slate-500">{currentUser.email}</p>
            </div>
          </div>

          <button
            onClick={handleCreateNewPost}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Artikel Baru</span>
          </button>
        </div>
      )}

      {/* TWO-COLUMN LAYOUT: SIDEBAR + MAIN CONTENT */}
      <div className="flex flex-col md:flex-row gap-3 lg:gap-4 items-start">
        
        {/* MOBILE NAVIGATION BAR (< MD): SEBARIS KALIMAT MENU NAVIGASI DENGAN DROPDOWN PENUH SAAT DIKLIK */}
        {!(isZenMode && activeTab === 'editor') && (
          <div className="md:hidden w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-2">
            <button
              type="button"
              id="mobile-nav-toggle-btn"
              onClick={() => setIsMobileNavExpanded(!isMobileNavExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 shrink-0">
                  {activeTab === 'posts' && <FileText className="w-4 h-4" />}
                  {activeTab === 'editor' && <Edit3 className="w-4 h-4" />}
                  {activeTab === 'writers' && <Users className="w-4 h-4" />}
                  {activeTab === 'autolinks' && <LinkIcon className="w-4 h-4" />}
                  {activeTab === 'sitemap' && <Zap className="w-4 h-4" />}
                  {activeTab === 'comments' && <MessageSquare className="w-4 h-4" />}
                  {activeTab === 'config' && <Settings className="w-4 h-4" />}
                  {activeTab === 'database' && <Database className="w-4 h-4" />}
                  {activeTab === 'products' && <ShoppingBag className="w-4 h-4" />}
                  {activeTab === 'wa_leads' && <BarChart2 className="w-4 h-4" />}
                  {activeTab === 'surat_pembaca' && <Mail className="w-4 h-4" />}
                  {activeTab === 'iklan_baris' && <Tag className="w-4 h-4" />}
                  {activeTab === 'security' && <Key className="w-4 h-4" />}
                </span>
                <div className="truncate">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block leading-tight">
                    Menu Navigasi
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {activeTab === 'posts' && 'Daftar Artikel'}
                    {activeTab === 'editor' && 'Tulis Artikel'}
                    {activeTab === 'writers' && 'Penulis & Editor'}
                    {activeTab === 'autolinks' && 'Auto-Linking'}
                    {activeTab === 'sitemap' && 'SEO & AI Agent Discovery'}
                    {activeTab === 'comments' && 'Komentar'}
                    {activeTab === 'config' && 'Configs Situs'}
                    {activeTab === 'database' && 'Database D1'}
                    {activeTab === 'products' && 'Produk Jualan'}
                    {activeTab === 'wa_leads' && 'Laporan WA'}
                    {activeTab === 'surat_pembaca' && 'Surat Pembaca'}
                    {activeTab === 'iklan_baris' && 'Iklan Baris'}
                    {activeTab === 'security' && 'Akun Admin'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                  {isMobileNavExpanded ? 'Tutup Menu' : 'Pilih Menu'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isMobileNavExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* MENGEMBANG MENJADI KATA-KATA MENU FULL KETIKA DIKLIK */}
            {isMobileNavExpanded && (
              <nav className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1 bg-slate-50/50 dark:bg-slate-900/50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* 1. Daftar Artikel */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('posts'); setIsMobileNavExpanded(false); }}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2.5 ${
                    activeTab === 'posts'
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>Daftar Artikel</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    activeTab === 'posts' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {userRole === 'writer' ? userPosts.length : posts.length}
                  </span>
                </button>

                {/* 2. Tulis Artikel */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('editor'); setIsMobileNavExpanded(false); }}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                    activeTab === 'editor'
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Edit3 className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>Tulis Artikel</span>
                </button>

                {currentUser?.role === 'admin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('writers'); setIsMobileNavExpanded(false); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2.5 ${
                        activeTab === 'writers'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                        <span>Penulis & Editor</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        activeTab === 'writers' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {writers.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab('autolinks'); setIsMobileNavExpanded(false); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2.5 ${
                        activeTab === 'autolinks'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <LinkIcon className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                        <span>Auto-Linking</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        activeTab === 'autolinks' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {autolinks.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab('sitemap'); fetchDnsAid(false); setIsMobileNavExpanded(false); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                        activeTab === 'sitemap'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Zap className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>SEO & AI Agent Discovery</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab('comments'); fetchComments(); setIsMobileNavExpanded(false); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2.5 ${
                        activeTab === 'comments'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                        <span>Komentar</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        activeTab === 'comments' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {comments.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab('config'); setIsMobileNavExpanded(false); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                        activeTab === 'config'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Settings className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>Configs Situs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab('database'); setIsMobileNavExpanded(false); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                        activeTab === 'database'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Database className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>Database D1</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab('products'); setIsMobileNavExpanded(false); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                        activeTab === 'products'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>Produk Jualan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab('wa_leads'); fetchWaLeads(); fetchProductOrders(); setIsMobileNavExpanded(false); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                        activeTab === 'wa_leads'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <BarChart2 className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>Laporan WA</span>
                    </button>
                  </>
                )}

                {currentUser?.role !== 'writer' && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('surat_pembaca'); setIsMobileNavExpanded(false); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                        activeTab === 'surat_pembaca'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Mail className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>Surat Pembaca</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab('iklan_baris'); setIsMobileNavExpanded(false); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                        activeTab === 'iklan_baris'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Tag className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>Iklan Baris</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab('security'); setIsMobileNavExpanded(false); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                        activeTab === 'security'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Key className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>Akun Admin</span>
                    </button>
                  </>
                )}

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Keluar Akun</span>
                  </button>
                )}
              </nav>
            )}
          </div>
        )}

        {/* LEFT COLUMN: THE COMPACT VERTICAL SIDEBAR (TABLET & DESKTOP >= MD) */}
        <aside className={`hidden md:block shrink-0 ${
          isZenMode && activeTab === 'editor'
            ? 'hidden'
            : isSidebarCollapsed
              ? 'w-14 p-1.5'
              : 'w-44 lg:w-48 p-2'
        } bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 md:sticky md:top-4 transition-all duration-200`}>
          
          <div className={`px-2 py-1 border-b border-slate-100 dark:border-slate-800/60 pb-2 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500 whitespace-nowrap">
                Navigasi
              </span>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all flex items-center justify-center"
              title={isSidebarCollapsed ? "Lebarkan Sidebar" : "Sembunyikan Label Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <nav className="space-y-0.5">
            {/* 1. Daftar Artikel */}
            <button
              onClick={() => setActiveTab('posts')}
              title="Daftar Artikel"
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
              } ${
                activeTab === 'posts'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <FileText className={`w-5 h-5 shrink-0 ${activeTab === 'posts' ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'}`} />
              {!isSidebarCollapsed && (
                <div className="flex-1 text-left flex items-center justify-between whitespace-nowrap overflow-hidden">
                  <span>Daftar Artikel</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                    activeTab === 'posts' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {userRole === 'writer' ? userPosts.length : posts.length}
                  </span>
                </div>
              )}
            </button>

            {/* 2. Tulis Artikel */}
            <button
              onClick={() => setActiveTab('editor')}
              title="Tulis Artikel"
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
              } ${
                activeTab === 'editor'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <Edit3 className={`w-5 h-5 shrink-0 ${activeTab === 'editor' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
              {!isSidebarCollapsed && (
                <span className="flex-1 text-left whitespace-nowrap overflow-hidden">Tulis Artikel</span>
              )}
            </button>

            {currentUser?.role === 'admin' && (
              <>
                {/* 3. Penulis & Editor */}
                <button
                  onClick={() => setActiveTab('writers')}
                  title="Penulis & Editor"
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                    isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
                  } ${
                    activeTab === 'writers'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <Users className={`w-5 h-5 shrink-0 ${activeTab === 'writers' ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
                  {!isSidebarCollapsed && (
                    <div className="flex-1 text-left flex items-center justify-between whitespace-nowrap overflow-hidden">
                      <span>Penulis & Editor</span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        activeTab === 'writers' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {writers.length}
                      </span>
                    </div>
                  )}
                </button>

                {/* 4. Auto-Linking */}
                <button
                  onClick={() => setActiveTab('autolinks')}
                  title="Auto-Linking"
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                    isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
                  } ${
                    activeTab === 'autolinks'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <LinkIcon className={`w-5 h-5 shrink-0 ${activeTab === 'autolinks' ? 'text-rose-600 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400'}`} />
                  {!isSidebarCollapsed && (
                    <div className="flex-1 text-left flex items-center justify-between whitespace-nowrap overflow-hidden">
                      <span>Auto-Linking</span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        activeTab === 'autolinks' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {autolinks.length}
                      </span>
                    </div>
                  )}
                </button>

                {/* 5. SEO & AI Agent Discovery */}
                <button
                  onClick={() => {
                    setActiveTab('sitemap');
                    fetchDnsAid(false);
                  }}
                  title="SEO"
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                    isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
                  } ${
                    activeTab === 'sitemap'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <Zap className={`w-5 h-5 shrink-0 ${activeTab === 'sitemap' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400'}`} />
                  {!isSidebarCollapsed && (
                    <span className="flex-1 text-left whitespace-nowrap overflow-hidden">SEO</span>
                  )}
                </button>

                {/* 6. Cusdis Komentar & Webhook */}
                <button
                  onClick={() => {
                    setActiveTab('comments');
                    fetchComments();
                  }}
                  title="Komentar"
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                    isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
                  } ${
                    activeTab === 'comments'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <MessageSquare className={`w-5 h-5 shrink-0 ${activeTab === 'comments' ? 'text-rose-600 dark:text-rose-400' : 'text-purple-600 dark:text-purple-400'}`} />
                  {!isSidebarCollapsed && (
                    <div className="flex-1 text-left flex items-center justify-between whitespace-nowrap overflow-hidden">
                      <span>Komentar</span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        activeTab === 'comments' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {comments.length}
                      </span>
                    </div>
                  )}
                </button>

                {/* 7. Configs Situs */}
                <button
                  onClick={() => setActiveTab('config')}
                  title="Configs Situs"
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                    isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
                  } ${
                    activeTab === 'config'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <Settings className={`w-5 h-5 shrink-0 ${activeTab === 'config' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`} />
                  {!isSidebarCollapsed && (
                    <span className="flex-1 text-left whitespace-nowrap overflow-hidden">Configs Situs</span>
                  )}
                </button>

                {/* 8. Database & Schema D1 */}
                <button
                  onClick={() => setActiveTab('database')}
                  title="Database D1"
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                    isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
                  } ${
                    activeTab === 'database'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <Database className={`w-5 h-5 shrink-0 ${activeTab === 'database' ? 'text-rose-600 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-400'}`} />
                  {!isSidebarCollapsed && (
                    <span className="flex-1 text-left whitespace-nowrap overflow-hidden">Database D1</span>
                  )}
                </button>

                {/* 9. Kelola Produk Jualan */}
                <button
                  onClick={() => setActiveTab('products')}
                  title="Produk Jualan"
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                    isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
                  } ${
                    activeTab === 'products'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <ShoppingBag className={`w-5 h-5 shrink-0 ${activeTab === 'products' ? 'text-rose-600 dark:text-rose-400' : 'text-pink-600 dark:text-pink-400'}`} />
                  {!isSidebarCollapsed && (
                    <span className="flex-1 text-left whitespace-nowrap overflow-hidden">Produk Jualan</span>
                  )}
                </button>

                {/* 10. Laporan & Leads WA */}
                <button
                  onClick={() => {
                    setActiveTab('wa_leads');
                    fetchWaLeads();
                    fetchProductOrders();
                  }}
                  title="Laporan WA"
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                    isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
                  } ${
                    activeTab === 'wa_leads'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <BarChart2 className={`w-5 h-5 shrink-0 ${activeTab === 'wa_leads' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                  {!isSidebarCollapsed && (
                    <span className="flex-1 text-left whitespace-nowrap overflow-hidden">Laporan WA</span>
                  )}
                </button>
              </>
            )}

            {/* Surat Pembaca & Iklan Baris for Editor & Admin */}
            {currentUser?.role !== 'writer' && (
              <>
                <button
                  onClick={() => setActiveTab('surat_pembaca')}
                  title="Surat Pembaca"
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                    isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
                  } ${
                    activeTab === 'surat_pembaca'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <Mail className={`w-5 h-5 shrink-0 ${activeTab === 'surat_pembaca' ? 'text-rose-600 dark:text-rose-400' : 'text-orange-500 dark:text-orange-400'}`} />
                  {!isSidebarCollapsed && (
                    <span className="flex-1 text-left whitespace-nowrap overflow-hidden">Surat Pembaca</span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('iklan_baris')}
                  title="Iklan Baris"
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                    isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
                  } ${
                    activeTab === 'iklan_baris'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <Tag className={`w-5 h-5 shrink-0 ${activeTab === 'iklan_baris' ? 'text-rose-600 dark:text-rose-400' : 'text-rose-500 dark:text-rose-400'}`} />
                  {!isSidebarCollapsed && (
                    <span className="flex-1 text-left whitespace-nowrap overflow-hidden">Iklan Baris</span>
                  )}
                </button>
              </>
            )}

            {/* 11. Akun Admin & Hard Logout */}
            {currentUser?.role !== 'writer' && (
              <button
                onClick={() => setActiveTab('security')}
                title="Akun Admin"
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                  isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
                } ${
                  activeTab === 'security'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                }`}
              >
                <Key className={`w-5 h-5 shrink-0 ${activeTab === 'security' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`} />
                {!isSidebarCollapsed && (
                  <span className="flex-1 text-left whitespace-nowrap overflow-hidden">Akun Admin</span>
                )}
              </button>
            )}

            <button
              onClick={onLogout}
              title="Safe Logout"
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 border border-transparent hover:border-red-100 ${
                isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
              }`}
            >
              <LogOut className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-red-600" />
              {!isSidebarCollapsed && (
                <span className="flex-1 text-left whitespace-nowrap overflow-hidden">Safe Logout</span>
              )}
            </button>
          </nav>
        </aside>

        {/* RIGHT COLUMN: MAIN CONTENT FOR ACTIVE TAB */}
        <div className="flex-1 min-w-0 space-y-8 transition-all duration-300">

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: MANAGE POSTS LIST */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'posts' && (() => {
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
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                      Tulis draf artikel Anda, sertakan gambar &amp; ringkasan, lalu klik <strong>"Kirim untuk Ditinjau"</strong> agar diperiksa oleh Tim Redaksi/Editor.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {userRole === 'editor' && pendingCount > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 animate-bounce">
                    ⏳
                  </div>
                  <div>
                    <h4 className="font-extrabold">Ada {pendingCount} Artikel Butuh Moderasi &amp; Persetujuan Redaksi</h4>
                    <p className="text-[11px] opacity-90">Periksa artikel yang dikirim Penulis, setujui untuk terbit langsung ke website, atau berikan catatan revisi.</p>
                  </div>
                </div>
                <button
                  onClick={() => setPostStatusFilter('pending_approval')}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-sm transition-colors"
                >
                  Lihat Artikel Pending
                </button>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {userRole === 'writer' ? 'Status Pengajuan' : 'Daftar Artikel'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Menampilkan {filteredPosts.length} dari total {userPosts.length} artikel
                  </span>
                </div>

                {/* STATUS FILTER BUTTONS */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-[11px] font-bold overflow-x-auto max-w-full">
                  <button
                    onClick={() => setPostStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl transition-colors ${
                      postStatusFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Semua ({userPosts.length})
                  </button>
                  <button
                    onClick={() => setPostStatusFilter('pending_approval')}
                    className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 ${
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
                    className={`px-3 py-1.5 rounded-xl transition-colors ${
                      postStatusFilter === 'draft'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    📝 Draf ({draftCount})
                  </button>
                  <button
                    onClick={() => setPostStatusFilter('published')}
                    className={`px-3 py-1.5 rounded-xl transition-colors ${
                      postStatusFilter === 'published'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                    }`}
                  >
                    ✅ Terbit ({publishedCount})
                  </button>
                  <button
                    onClick={() => setPostStatusFilter('rejected')}
                    className={`px-3 py-1.5 rounded-xl transition-colors ${
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
                      {userRole !== 'writer' && <th className="p-4">Penulis</th>}
                      <th className="p-4">Status Pengajuan</th>
                      <th className="p-4">Pembaca</th>
                      <th className="p-4 text-right">{userRole === 'writer' ? 'Aksi' : 'Aksi Moderasi'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan={userRole === 'writer' ? 5 : 6} className="p-8 text-center text-slate-400 font-semibold">
                          Tidak ada artikel dalam kategori status ini.
                        </td>
                      </tr>
                    ) : (
                      filteredPosts.map((post) => {
                        const authorObj = writers.find((w) => Number(w.id) === Number(post.authorId));
                        const displayAuthorName =
                          Number(post.authorId) === Number(currentUser?.id)
                            ? currentUser.name
                            : authorObj?.name || post.authorName || 'Tim Redaksi';

                        return (
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
                            {userRole !== 'writer' && (
                              <td className="p-4 font-medium">{displayAuthorName}</td>
                            )}
                            <td className="p-4">
                              {post.status === 'pending_approval' && (
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                  ⏳ Tunggu Ditinjau
                                </span>
                              )}
                              {(!post.status || post.status === 'published') && (
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  ✅ Terbit
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
                            <td className="p-4 font-mono font-bold text-slate-500">
                              {(!post.status || post.status === 'published') ? (
                                post.views || 0
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700 font-normal">-</span>
                              )}
                            </td>
                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => handleEditPost(post)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold transition-colors"
                              >
                                {userRole === 'writer' ? (post.status === 'draft' ? 'Edit / Tulis' : 'Edit') : 'Edit'}
                              </button>

                              {(userRole === 'admin' || userRole === 'editor') && post.status === 'pending_approval' && (
                                <button
                                  onClick={() => {
                                    handleEditPost(post);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-colors"
                                >
                                  Moderasi &amp; Terbit
                                </button>
                              )}

                              {userRole !== 'writer' && (currentUser?.role === 'admin' || currentUser?.role === 'editor' || post.authorId === currentUser?.id) && (
                                <button
                                  onClick={() => onDeletePost(post.id)}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-bold transition-colors"
                                >
                                  Hapus
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
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
          currentLoggedInUserId={currentUser?.id}
          postType={editorPostType}
          setPostType={setEditorPostType}
          interactiveConfigurator={editorInteractiveConfigurator}
          setInteractiveConfigurator={setEditorInteractiveConfigurator}
          interactiveShowcase={editorInteractiveShowcase}
          setInteractiveShowcase={setEditorInteractiveShowcase}
          interactiveRadar={editorInteractiveRadar}
          setInteractiveRadar={setEditorInteractiveRadar}
          interactiveQuiz={editorInteractiveQuiz}
          setInteractiveQuiz={setEditorInteractiveQuiz}
          interactiveTimelineSlider={editorInteractiveTimelineSlider}
          setInteractiveTimelineSlider={setEditorInteractiveTimelineSlider}
          interactiveBattleCard={editorInteractiveBattleCard}
          setInteractiveBattleCard={setEditorInteractiveBattleCard}
          interactiveQuizRouter={editorInteractiveQuizRouter}
          setInteractiveQuizRouter={setEditorInteractiveQuizRouter}
          interactiveHabitSimulator={editorInteractiveHabitSimulator}
          setInteractiveHabitSimulator={setEditorInteractiveHabitSimulator}
          interactiveQaColumn={editorInteractiveQaColumn}
          setInteractiveQaColumn={setEditorInteractiveQaColumn}
          interactiveEventListing={editorInteractiveEventListing}
          setInteractiveEventListing={setEditorInteractiveEventListing}
          interactiveGlossaryDictionary={editorInteractiveGlossaryDictionary}
          setInteractiveGlossaryDictionary={setEditorInteractiveGlossaryDictionary}
          disclaimerType={editorDisclaimerType}
          setDisclaimerType={setEditorDisclaimerType}
          customDisclaimerText={editorCustomDisclaimerText}
          setCustomDisclaimerText={setEditorCustomDisclaimerText}
          isZenMode={isZenMode}
          setIsZenMode={setIsZenMode}
          siteConfig={siteConfig}
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
                <span>Kelola Penulis & Editor</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tambahkan profil dokter, psikolog, atau praktisi pengasuhan anak. Data kredensial akan ditampilkan pada kotak bio penulis di akhir artikel untuk memenuhi standar E-E-A-T Google.
              </p>
            </div>

            <button
              onClick={handleOpenAddWriterModal}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Penulis Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {writers.map((w) => {
              const authorPostsCount = posts.filter(
                (p) => p.authorId === w.id || parseCoAuthorIds(p).includes(w.id)
              ).length;

              return (
                <div
                  key={w.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-colors space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getOptimizedAvatarUrl(w.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 56, 60)}
                          alt={w.name}
                          width={56}
                          height={56}
                          loading="lazy"
                          decoding="async"
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
                          {w.isVerifiedAcademic && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 border border-emerald-100/40">
                              {w.verifiedAcademicLabel || 'Terverifikasi'}
                            </span>
                          )}
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

              <div className="p-4 bg-rose-50/50 dark:bg-slate-800/40 rounded-2xl border border-rose-100/60 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isVerifiedAcademic"
                    checked={wIsVerifiedAcademic}
                    onChange={(e) => setWIsVerifiedAcademic(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="isVerifiedAcademic" className="text-xs font-bold text-slate-800 dark:text-slate-200 select-none cursor-pointer">
                    Aktifkan Verifikasi Penulis (Badge Terverifikasi)
                  </label>
                </div>
                {wIsVerifiedAcademic && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Label Badge Verifikasi Kustom
                    </label>
                    <input
                      type="text"
                      value={wVerifiedAcademicLabel}
                      onChange={(e) => setWVerifiedAcademicLabel(e.target.value)}
                      placeholder="Misal: Penulis Terverifikasi atau Gelar Terverifikasi"
                      className="w-full px-3 py-1.5 rounded-xl border text-xs font-bold text-rose-600 bg-white dark:bg-slate-900"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSavingWriter}
                className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
              <span>Auto-Linking On-Page SEO</span>
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
              className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md transition-colors"
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
      {/* TAB 4: SEO & AI AGENT DISCOVERY INSPECTOR (DNS-AID) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'sitemap' && currentUser?.role === 'admin' && (
        <div className="space-y-6">
          {/* Section 1: Standard Discovery Endpoints */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Katalog & Sumber Daya Penemuan Mesin (AI & Search Engines)</span>
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                Live & Standar Industri
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-400 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">📄 /sitemap.xml</div>
                  <div className="text-xs text-slate-500 mt-1">XML Sitemap untuk Google Search Console & Bing Webmaster</div>
                </div>
                <div className="flex items-center justify-end mt-3">
                  <ExternalLink className="w-4 h-4 text-rose-500" />
                </div>
              </a>

              <a
                href="/feed.xml"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-400 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">📡 /feed.xml</div>
                  <div className="text-xs text-slate-500 mt-1">RSS 2.0 Feed XML standar untuk sindikasi konten dan agregator</div>
                </div>
                <div className="flex items-center justify-end mt-3">
                  <ExternalLink className="w-4 h-4 text-amber-500" />
                </div>
              </a>

              <a
                href="/.well-known/api-catalog"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-400 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">🤖 /api-catalog</div>
                  <div className="text-xs text-slate-500 mt-1">RFC 9727 API Catalog (linkset+json) untuk penemuan agen cerdas</div>
                </div>
                <div className="flex items-center justify-end mt-3">
                  <ExternalLink className="w-4 h-4 text-indigo-500" />
                </div>
              </a>

              <a
                href="/llms.txt"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-400 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">🧠 /llms.txt</div>
                  <div className="text-xs text-slate-500 mt-1">Standar konteks Markdown untuk LLM & AI Agents (llmstxt.org)</div>
                </div>
                <div className="flex items-center justify-end mt-3">
                  <ExternalLink className="w-4 h-4 text-emerald-500" />
                </div>
              </a>

              <a
                href="/llms-full.txt"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-400 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">📖 /llms-full.txt</div>
                  <div className="text-xs text-slate-500 mt-1">Kumpulan seluruh teks konten website dalam satu file Markdown terkompilasi untuk AI</div>
                </div>
                <div className="flex items-center justify-end mt-3">
                  <ExternalLink className="w-4 h-4 text-rose-500" />
                </div>
              </a>
            </div>
          </div>

          {/* Section 2: DNS for AI Discovery (DNS-AID) & DNSSEC */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    DNS for AI Discovery (DNS-AID) & DNSSEC (RFC 9460)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
                    IETF Draft
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Publikasikan catatan DNS ServiceMode <code>SVCB</code> atau <code>HTTPS</code> di bawah namespace <code>_agents</code> (seperti <code>_index._agents</code> dan <code>_a2a._agents</code>) serta aktifkan penandatanganan DNSSEC agar bot dan agen AI otonom dapat menemukan dan memvalidasi endpoint Anda via DNS.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Domain Anda (contoh: domain.com)"
                  value={customTestDomain}
                  onChange={(e) => setCustomTestDomain(e.target.value.trim())}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 w-48"
                />
                <button
                  type="button"
                  disabled={isCheckingDnsAid}
                  onClick={() => fetchDnsAid(true, customTestDomain)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isCheckingDnsAid ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>{isCheckingDnsAid ? 'Memeriksa DoH...' : 'Periksa Live via DoH'}</span>
                </button>
              </div>
            </div>

            {/* Live Check Result Alert */}
            {dnsAidData?.checks && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span>Hasil Pengecekan DoH (DNS-over-HTTPS Cloudflare / Google) untuk Domain: <code>{dnsAidData.domain}</code></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(dnsAidData.checks).map(([sub, chk]: [string, any]) => (
                    <div
                      key={sub}
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                        chk.status === 'pass'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold">{chk.fqdn}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          chk.status === 'pass' ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100' : 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100'
                        }`}>
                          {chk.status === 'pass' ? 'Ditemukan' : 'Belum Terdeteksi'}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Status DNSSEC (AD Flag):</span>
                        <span className={`font-semibold ${chk.authenticatedData ? 'text-emerald-600 font-bold' : 'text-amber-600'}`}>
                          {chk.authenticatedData ? '✅ Authenticated (Valid)' : '⚠️ Belum Ada Flag AD (DNSSEC Belum Aktif)'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DNS Records Configuration Ready to Copy */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span>Catatan DNS ServiceMode SVCB yang Wajib Dipasang di Cloudflare DNS:</span>
                <span className="text-slate-400 font-normal">Domain Target: <strong>{customTestDomain || dnsAidData?.domain || 'domain-anda.com'}</strong></span>
              </div>

              <div className="space-y-3">
                {(dnsAidData?.records || [
                  {
                    subdomain: '_index._agents',
                    fqdn: `_index._agents.${customTestDomain || 'domain-anda.com'}`,
                    type: 'SVCB',
                    priority: 1,
                    target: customTestDomain || 'domain-anda.com',
                    params: 'alpn="h3,h2" port=443',
                    description: 'Well-known entrypoint untuk indeks agen & katalog API sentral organisasi (draft-mozleywilliams-dnsop-dnsaid & RFC 9460)',
                    cloudflare: {
                      type: 'SVCB',
                      name: '_index._agents',
                      priority: 1,
                      target: customTestDomain || 'domain-anda.com',
                      value: 'alpn="h3,h2" port=443'
                    },
                    bind: `_index._agents.${customTestDomain || 'domain-anda.com'}. 3600 IN SVCB 1 ${customTestDomain || 'domain-anda.com'}. alpn="h3,h2" port=443`
                  },
                  {
                    subdomain: '_a2a._agents',
                    fqdn: `_a2a._agents.${customTestDomain || 'domain-anda.com'}`,
                    type: 'SVCB',
                    priority: 1,
                    target: customTestDomain || 'domain-anda.com',
                    params: 'alpn="a2a" port=443 mandatory=alpn,port',
                    description: 'Well-known entrypoint untuk protokol Agent-to-Agent (A2A) komunikasi antar-agen otonom',
                    cloudflare: {
                      type: 'SVCB',
                      name: '_a2a._agents',
                      priority: 1,
                      target: customTestDomain || 'domain-anda.com',
                      value: 'alpn="a2a" port=443 mandatory=alpn,port'
                    },
                    bind: `_a2a._agents.${customTestDomain || 'domain-anda.com'}. 3600 IN SVCB 1 ${customTestDomain || 'domain-anda.com'}. alpn="a2a" port=443 mandatory=alpn,port`
                  }
                ]).map((rec: any) => {
                  const targetDomain = customTestDomain || dnsAidData?.domain || 'domain-anda.com';
                  const cfName = rec.subdomain;
                  const cfValue = rec.params;
                  const bindLine = `${rec.subdomain}.${targetDomain}. 3600 IN SVCB 1 ${targetDomain}. ${rec.params}`;

                  return (
                    <div key={rec.subdomain} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-mono font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs">{rec.type}</span>
                            <span>{rec.subdomain}.{targetDomain}</span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rec.description}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(bindLine);
                              setCopiedRecordKey(`bind-${rec.subdomain}`);
                              setTimeout(() => setCopiedRecordKey(null), 2500);
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors"
                          >
                            {copiedRecordKey === `bind-${rec.subdomain}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedRecordKey === `bind-${rec.subdomain}` ? 'Tersalin (BIND)' : 'Salin BIND Format'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const cfSummary = `Type: SVCB\nName: ${cfName}\nPriority: 1\nTarget: ${targetDomain}\nValue: ${cfValue}`;
                              navigator.clipboard.writeText(cfSummary);
                              setCopiedRecordKey(`cf-${rec.subdomain}`);
                              setTimeout(() => setCopiedRecordKey(null), 2500);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium flex items-center gap-1 transition-colors shadow-sm"
                          >
                            {copiedRecordKey === `cf-${rec.subdomain}` ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedRecordKey === `cf-${rec.subdomain}` ? 'Tersalin (Cloudflare)' : 'Salin Nilai Cloudflare'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Detail Parameters Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-mono text-[11px]">
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <div className="text-[10px] uppercase text-slate-400 font-sans">Type</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">SVCB</div>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <div className="text-[10px] uppercase text-slate-400 font-sans">Name</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{cfName}</div>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <div className="text-[10px] uppercase text-slate-400 font-sans">Priority</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">1</div>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <div className="text-[10px] uppercase text-slate-400 font-sans">Target</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{targetDomain}</div>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
                          <div className="text-[10px] uppercase text-slate-400 font-sans">Value / Params</div>
                          <div className="font-bold text-indigo-600 dark:text-indigo-400 truncate" title={cfValue}>{cfValue}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DNSSEC Activation Instruction Guide */}
            <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Panduan Aktivasi DNSSEC di Cloudflare (Wajib untuk DNS-AID)</span>
              </div>
              <p className="text-xs text-indigo-900 dark:text-indigo-300">
                DNSSEC memastikan catatan discovery tidak dapat dipalsukan (*tamper-proof*). Validating resolver seperti Cloudflare 1.1.1.1 dan Google Public DNS akan memverifikasi tanda tangan kriptografi dan mengembalikan status <code>AD: true</code> (Authenticated Data):
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-indigo-950 dark:text-indigo-200">
                <li>Buka dashboard <strong>Cloudflare</strong> &gt; pilih domain Anda.</li>
                <li>Masuk ke menu <strong>DNS</strong> &gt; klik tab <strong>Settings</strong>.</li>
                <li>Scroll ke bagian <strong>DNSSEC</strong> dan klik tombol <strong>Enable DNSSEC</strong>.</li>
                <li>Salin parameter <strong>DS Record</strong> yang diberikan Cloudflare (<em>Key Tag, Algorithm, Digest Type, Digest</em>).</li>
                <li>Buka panel registrar domain Anda (Namecheap, Porkbun, Rumahweb, Niagahoster, dll.) dan tempelkan DS Record tersebut.</li>
                <li>Dalam hitungan menit, DNSSEC akan aktif dan terverifikasi secara global.</li>
              </ol>
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

            
            {/* SECTION UTAMA ATAS: Teks Badge Arsitektur & Teknologi */}
            <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border-2 border-rose-500/30 space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-rose-500 animate-pulse" />
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Kustomisasi Teks Badge Arsitektur & Teknologi
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Ubah 4 kalimat arsitektur Cloudflare D1, Pages Edge, dan GitHub Storage yang tampil di Hero & Footer di bawah ini secara bebas:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    1. Judul Hero Performance Box
                  </label>
                  <input
                    type="text"
                    value={cfgTechBadgeHero}
                    onChange={(e) => setCfgTechBadgeHero(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 shadow-sm"
                    placeholder="Contoh: Cloudflare D1 Edge Architecture"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    2. Wording Server / Hosting (Pages)
                  </label>
                  <input
                    type="text"
                    value={cfgTechBadgePages}
                    onChange={(e) => setCfgTechBadgePages(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 shadow-sm"
                    placeholder="Contoh: Cloudflare Pages Edge"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    3. Wording Database (D1)
                  </label>
                  <input
                    type="text"
                    value={cfgTechBadgeDatabase}
                    onChange={(e) => setCfgTechBadgeDatabase(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 shadow-sm"
                    placeholder="Contoh: Cloudflare D1 SQLite"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    4. Wording Penyimpanan (Storage)
                  </label>
                  <input
                    type="text"
                    value={cfgTechBadgeStorage}
                    onChange={(e) => setCfgTechBadgeStorage(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 shadow-sm"
                    placeholder="Contoh: GitHub REST Storage"
                  />
                </div>
              </div>
            </div>

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
                    className={`cursor-pointer border-2 rounded-xl p-3 flex items-center gap-3 transition-colors ${cfgActiveThemePreset === preset.id ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700'}`}
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

              {/* FITUR OVERRIDE FONT SYSTEM & PERFORMANCE */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Override Font System & Performance</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase">SUPERCHARGED SPEED</span>
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pilih mode font untuk menggantikan/menimpa font bawaan tema demi kecepatan loading maksimal, bebas FOUT, dan penghematan bandwidth.
                      </p>
                    </div>
                  </div>
                  {cfgFontOverrideMode === 'system' && (
                    <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold flex items-center gap-1">
                      ⚡ 0 KB Download
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  {/* Option 1: System Font Stack */}
                  <label
                    className={`cursor-pointer border-2 rounded-xl p-3 flex items-start gap-3 transition-all ${
                      cfgFontOverrideMode === 'system'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="font_override_mode"
                      value="system"
                      checked={cfgFontOverrideMode === 'system'}
                      onChange={(e) => setCfgFontOverrideMode(e.target.value as any)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          System Font Stack (Default & Paling Ringan - 0 KB)
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-black">
                          0 KB
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                        Menggunakan font native OS (San Francisco, Segoe UI, Roboto, Ubuntu). Teks tampil instan 0 ms, nol layout shift, tanpa unduhan font web eksternal.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Inter Variable */}
                  <label
                    className={`cursor-pointer border-2 rounded-xl p-3 flex items-start gap-3 transition-all ${
                      cfgFontOverrideMode === 'inter'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="font_override_mode"
                      value="inter"
                      checked={cfgFontOverrideMode === 'inter'}
                      onChange={(e) => setCfgFontOverrideMode(e.target.value as any)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          Inter Variable (WOFF2)
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[9px] font-black">
                          VARIABLE
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Font modern dan presisi tinggi. Hanya 1 berkas .woff2 variabel (weight 100–900) dengan aturan font-display: swap untuk rendering cepat.
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Plus Jakarta Sans Variable */}
                  <label
                    className={`cursor-pointer border-2 rounded-xl p-3 flex items-start gap-3 transition-all ${
                      cfgFontOverrideMode === 'plus-jakarta-sans'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="font_override_mode"
                      value="plus-jakarta-sans"
                      checked={cfgFontOverrideMode === 'plus-jakarta-sans'}
                      onChange={(e) => setCfgFontOverrideMode(e.target.value as any)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          Plus Jakarta Sans Variable (WOFF2)
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[9px] font-black">
                          VARIABLE
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Font geometris elegan khas portal modern. Hanya 1 berkas .woff2 variabel (weight 200–800) dengan aturan font-display: swap.
                      </p>
                    </div>
                  </label>

                  {/* Option 4: Gunakan Font Tema */}
                  <label
                    className={`cursor-pointer border-2 rounded-xl p-3 flex items-start gap-3 transition-all ${
                      cfgFontOverrideMode === 'theme'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="font_override_mode"
                      value="theme"
                      checked={cfgFontOverrideMode === 'theme'}
                      onChange={(e) => setCfgFontOverrideMode(e.target.value as any)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          Gunakan Font Tema (Default bawaan theme preset)
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-black">
                          PRESET
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Mengikuti tipografi spesifik dari Preset Tema di atas (misal: Space Grotesk, Quicksand, Merriweather, dsb.) dengan font-display: swap.
                      </p>
                    </div>
                  </label>
                </div>
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
                {/* CLOUDFLARE TURNSTILE & FALLBACK SECURITY CONFIG */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Cloudflare Turnstile & Mode Keamanan Login
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      cfgEnableTurnstileFallback
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    }`}>
                      {cfgEnableTurnstileFallback ? 'Mode Toleran (Fallback ON)' : 'Mode Ketat Maksimal (Strict)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Turnstile Site Key (Publik)
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">Format: 0x4...</span>
                      </div>
                      <input
                        type="text"
                        value={cfgTurnstileSiteKey}
                        onChange={(e) => setCfgTurnstileSiteKey(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-semibold focus:ring-2 focus:ring-rose-500"
                        placeholder="Contoh: 0x4AAAAAAAEr..."
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Turnstile Secret Key (Backend)
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {siteConfig?.has_turnstile_secret ? '🟢 Tersimpan di D1/Env' : '⚪ Belum Disetel'}
                        </span>
                      </div>
                      <input
                        type="password"
                        value={cfgTurnstileSecretKey}
                        onChange={(e) => setCfgTurnstileSecretKey(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-semibold focus:ring-2 focus:ring-rose-500"
                        placeholder={siteConfig?.has_turnstile_secret ? '•••••••••••••••• (Tersimpan aman)' : 'Contoh: 0x4AAAAAAAEr...'}
                      />
                    </div>
                  </div>

                  {/* TOGGLE GRACEFUL FALLBACK */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="enable_turnstile_fallback_toggle"
                      checked={cfgEnableTurnstileFallback}
                      onChange={(e) => setCfgEnableTurnstileFallback(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                    />
                    <label htmlFor="enable_turnstile_fallback_toggle" className="cursor-pointer select-none space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          Aktifkan Mode Toleran (Graceful Fallback Turnstile)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        <strong>Saat Dicentang (Aktif / Default):</strong> Backend tidak akan memblokir login jika Secret Key di Cloudflare belum sinkron atau domain baru belum selesai di-setting, selama pengunjung berhasil menyelesaikan widget Turnstile di browser.
                        <br />
                        <strong>Saat Tidak Dicentang (Nonaktif / Strict):</strong> Mode Keamanan Maksimal. Verifikasi ke Cloudflare Siteverify wajib 100% valid dan cocok dengan domain. Jika Secret Key salah atau token ditolak, login diblokir total.
                      </p>
                    </label>
                  </div>
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Label Navigasi Menu Jualan / Katalog (products_nav_label)
                  </label>
                  <input
                    type="text"
                    value={cfgProductsNavLabel}
                    onChange={(e) => setCfgProductsNavLabel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                    placeholder="Produk"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    Nama tombol yang tampil di navbar atas (Header) dan menu mobile. Contoh: <strong>Produk</strong>, <strong>Paket</strong>, atau <strong>Galeri</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Path URL Halaman Jualan (products_nav_path)
                  </label>
                  <input
                    type="text"
                    value={cfgProductsNavPath}
                    onChange={(e) => setCfgProductsNavPath(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                    placeholder="/produk"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    Path router dinamis tempat halaman jualan dirender. Harus diawali slash. Contoh: <strong>/produk</strong> atau <strong>/paket</strong>.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Informasi Rekening Bank &amp; Ongkos Kirim (seller_bank_accounts)
                  </label>
                  <textarea
                    rows={4}
                    value={cfgSellerBankAccounts}
                    onChange={(e) => setCfgSellerBankAccounts(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:ring-2 focus:ring-rose-500 leading-relaxed font-mono"
                    placeholder="Contoh:&#10;Bank BCA: 1234567890 a/n Nama&#10;Bank Mandiri: 0987654321 a/n Nama&#10;&#10;Keterangan Pengiriman:&#10;- Jabodetabek: Free Ongkir&#10;- Luar Jawa: Rp 50.000"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    Masukkan keterangan rekening pembayaran dan informasi ongkir/delivery fee. Kolom ini berupa textbox multi-baris sehingga memudahkan pembeli membaca rincian transfer.
                  </p>
                </div>

                <div className="md:col-span-2 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🎨 Custom Wording Header Hero Box (Halaman Produk)</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Sub-Header Badge Text (products_hero_badge)
                      </label>
                      <input
                        type="text"
                        value={cfgProductsHeroBadge}
                        onChange={(e) => setCfgProductsHeroBadge(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        placeholder="Contoh: 🎨 Galeri Seni Eksklusif"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Label Tombol Tambah Item (products_hero_btn_text)
                      </label>
                      <input
                        type="text"
                        value={cfgProductsHeroBtnText}
                        onChange={(e) => setCfgProductsHeroBtnText(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        placeholder="Contoh: Tambah Koleksi Lukisan"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Judul Utama Hero Box (products_hero_title)
                      </label>
                      <input
                        type="text"
                        value={cfgProductsHeroTitle}
                        onChange={(e) => setCfgProductsHeroTitle(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:ring-2 focus:ring-rose-500"
                        placeholder="Contoh: Miliki Karya Lukisan Orisinal & Bernilai Tinggi"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Deskripsi / Subtitle Hero Box (products_hero_subtitle)
                      </label>
                      <textarea
                        rows={3}
                        value={cfgProductsHeroSubtitle}
                        onChange={(e) => setCfgProductsHeroSubtitle(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:ring-2 focus:ring-rose-500 leading-relaxed"
                        placeholder="Masukkan deskripsi narasi header hero halaman jualan..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        URL Gambar Hero Sisi Kanan (products_hero_image_url)
                      </label>
                      <input
                        type="text"
                        value={cfgProductsHeroImageUrl}
                        onChange={(e) => setCfgProductsHeroImageUrl(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Caption Gambar Sisi Kanan (products_hero_image_caption)
                      </label>
                      <input
                        type="text"
                        value={cfgProductsHeroImageCaption}
                        onChange={(e) => setCfgProductsHeroImageCaption(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        placeholder="Contoh: Premium Art Collection"
                      />
                    </div>

                    <div className="md:col-span-2 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>📦 Custom Wording Pesan "Belum Ada Produk" (Empty State)</span>
                      </h4>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Judul Pesan Saat Produk Kosong (products_empty_title)
                          </label>
                          <input
                            type="text"
                            value={cfgProductsEmptyTitle}
                            onChange={(e) => setCfgProductsEmptyTitle(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:ring-2 focus:ring-rose-500"
                            placeholder="Contoh: Belum Ada Koleksi Lukisan / Belum Ada Produk"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Deskripsi/Keterangan Pesan Saat Produk Kosong (products_empty_subtitle)
                          </label>
                          <textarea
                            rows={3}
                            value={cfgProductsEmptySubtitle}
                            onChange={(e) => setCfgProductsEmptySubtitle(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:ring-2 focus:ring-rose-500 leading-relaxed"
                            placeholder="Contoh: Katalog jualan lukisan orisinal belum diunggah. Silakan masuk sebagai administrator untuk menambahkan karya seni lukis pertama Anda."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
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
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-colors relative overflow-hidden ${
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
                    { id: 'whatsapp_widget', label: 'WhatsApp Chat' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedModelConfigTab(tab.id as HomepageDisplayMode)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
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
                          placeholder="Official Hub"
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

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        Pengaturan Tampilan Header Panel Manajemen Produk Jualan (Niche Agnostic)
                      </h4>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Heading Panel Manajemen (product_mgmt_heading)
                        </label>
                        <input
                          type="text"
                          value={cfgProductMgmtHeading}
                          onChange={(e) => setCfgProductMgmtHeading(e.target.value)}
                          placeholder="Panel Manajemen Produk Jualan"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Deskripsi / Petunjuk Menu Manajemen (product_mgmt_desc)
                        </label>
                        <textarea
                          rows={3}
                          value={cfgProductMgmtDesc}
                          onChange={(e) => setCfgProductMgmtDesc(e.target.value)}
                          placeholder="Kelola daftar penawaran, produk digital, jasa, atau paket..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
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

                    {/* Log Pemesanan Produk (Product Orders Leads Tracking) */}
                    <div className="mt-6 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div>
                          <h4 className="text-xs font-extrabold uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
                            🛍️ Log Pemesanan & Pembelian Produk (Product Orders Tracking)
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            Daftar pembeli yang melakukan pemesanan produk lewat tombol "Beli" di katalog jualan WhatsApp Anda.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={fetchProductOrders}
                          className="px-3 py-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-lg text-[10px] font-black text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all uppercase tracking-wider shadow-sm"
                        >
                          Segarkan Log
                        </button>
                      </div>

                      {productOrdersError && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold">
                          {productOrdersError}
                        </div>
                      )}

                      {isLoadingProductOrders ? (
                        <div className="text-center py-8 text-xs font-bold text-slate-400">
                          Sedang mengambil log pemesanan...
                        </div>
                      ) : productOrders.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800/60 rounded-xl bg-white dark:bg-slate-900">
                          <p className="text-xs text-slate-400 font-bold">
                            Belum ada log pemesanan produk terekam.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold border-b border-slate-150 dark:border-slate-800">
                              <tr>
                                <th className="px-4 py-2.5">Tanggal / Waktu</th>
                                <th className="px-4 py-2.5">Nama Pembeli</th>
                                <th className="px-4 py-2.5">Nomor HP/WA</th>
                                <th className="px-4 py-2.5">Produk Dipesan</th>
                                <th className="px-4 py-2.5 text-right">Harga</th>
                                <th className="px-4 py-2.5">Catatan Pembeli</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                              {productOrders.map((order: any) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 text-[11px]">
                                  <td className="px-4 py-3 text-[10px] font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                    {order.created_at ? new Date(order.created_at).toLocaleString('id-ID') : '-'}
                                  </td>
                                  <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white">
                                    {order.buyer_name || '-'}
                                  </td>
                                  <td className="px-4 py-3 font-mono">
                                    {order.buyer_phone || '-'}
                                  </td>
                                  <td className="px-4 py-3 font-extrabold text-rose-600 dark:text-rose-400">
                                    {order.product_title || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                    {order.product_price ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.product_price) : '-'}
                                  </td>
                                  <td className="px-4 py-3 max-w-[200px] truncate font-medium text-slate-500 dark:text-slate-400" title={order.buyer_notes}>
                                    {order.buyer_notes || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
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

                    <div className="mt-4">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Daftar Kategori Iklan Baris Resmi Wajib Patuh (classified_categories - Pisahkan dengan koma)
                      </label>
                      <textarea
                        rows={3}
                        value={cfgClassifiedCategories}
                        onChange={(e) => setCfgClassifiedCategories(e.target.value)}
                        placeholder="Pola Asuh, Tumbuh Kembang, Kesehatan & Gizi, Balita, Psikologi Ibu, Umum"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Kategori ini akan langsung diterapkan secara otomatis pada form pasang iklan dan menu filter publik. User wajib memilih salah satu dari kategori yang Anda tentukan di atas.
                      </p>
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Catatan / Peringatan Form Iklan Baris (classified_notice)
                      </label>
                      <textarea
                        rows={2}
                        value={cfgClassifiedNotice}
                        onChange={(e) => setCfgClassifiedNotice(e.target.value)}
                        placeholder="Iklan baris gratis : Tautan URL akan otomatis dikonversi..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Teks pemberitahuan atau ketentuan pasang iklan yang tampil di bawah form input keterangan barang.
                      </p>
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

                {/* 11. WHATSAPP CHAT WIDGET PANEL */}
                {selectedModelConfigTab === 'whatsapp_widget' && (
                  <div className="space-y-6">
                    {/* Two-Column Workspace */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Left Column: Settings Panel & Operator CRUD */}
                      <div className="lg:col-span-7 space-y-6">
                        
                        {/* Box 1: General configuration */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h4 className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              Konfigurasi Widget & Tampilan
                            </h4>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                              Niche-Agnostic
                            </span>
                          </div>

                          {/* Toggle Widget */}
                          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80">
                            <div>
                              <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                                Status Widget Melayang (WhatsApp Chat Box)
                              </label>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                Aktifkan untuk menampilkan tombol WhatsApp melayang di sudut layar website Anda.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCfgWaEnabled(!cfgWaEnabled)}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                cfgWaEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  cfgWaEnabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Configuration form */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Judul Header (wa_header_title)
                              </label>
                              <input
                                type="text"
                                value={cfgWaHeaderTitle}
                                onChange={(e) => setCfgWaHeaderTitle(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                                placeholder="Hubungi Kami / Customer Support"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Subtitle / Slogan (wa_subtitle)
                              </label>
                              <input
                                type="text"
                                value={cfgWaSubtitle}
                                onChange={(e) => setCfgWaSubtitle(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                                placeholder="Ada yang bisa kami bantu?"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Posisi Tombol Melayang (wa_position)
                              </label>
                              <select
                                value={cfgWaPosition}
                                onChange={(e: any) => setCfgWaPosition(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                              >
                                <option value="bottom-right">Bottom-Right (Kanan Bawah)</option>
                                <option value="bottom-left">Bottom-Left (Kiri Bawah)</option>
                                <option value="bottom-center">Bottom-Center (Tengah Bawah)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Warna Aksen Widget (wa_color_accent)
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={cfgWaColorAccent}
                                  onChange={(e) => setCfgWaColorAccent(e.target.value)}
                                  className="w-12 h-9 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={cfgWaColorAccent}
                                  onChange={(e) => setCfgWaColorAccent(e.target.value)}
                                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                                  placeholder="#25D366"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Custom Fields Checklist */}
                          <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                              Kolom Form Pengirim (wa_form_fields)
                            </label>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-1 mb-2">
                              Pilih kolom informasi apa saja yang wajib diisi pengirim sebelum dialihkan ke WhatsApp operator.
                            </span>
                            <div className="flex flex-wrap gap-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80">
                              {['name', 'phone', 'email', 'message'].map((fld) => {
                                const isChecked = cfgWaFormFields.includes(fld);
                                const labelMap: Record<string, string> = {
                                  name: 'Nama Lengkap',
                                  phone: 'Nomor HP / WhatsApp',
                                  email: 'Alamat Email',
                                  message: 'Pesan / Keluhan',
                                };
                                return (
                                  <label key={fld} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setCfgWaFormFields(cfgWaFormFields.filter((f) => f !== fld));
                                        } else {
                                          setCfgWaFormFields([...cfgWaFormFields, fld]);
                                        }
                                      }}
                                      className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                                    />
                                    {labelMap[fld]}
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Rotation Setting */}
                          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80">
                            <div className="pr-4">
                              <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                                Rotasi Otomatis (Load Balancing / Round-Robin)
                              </label>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                Jika diaktifkan, jika sebuah tujuan/departemen memiliki beberapa operator online, sistem akan mendistribusikan chat secara merata (Round-Robin) kepada operator-operator tersebut secara bergantian.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCfgWaEnableRotation(!cfgWaEnableRotation)}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                cfgWaEnableRotation ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  cfgWaEnableRotation ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Box 2: Operator Dynamic Management */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
                            <h4 className="text-xs font-extrabold uppercase text-slate-900 dark:text-white tracking-wider">
                              Manajemen Operator / Departemen ({cfgWaOperators.length})
                            </h4>
                            {editingOpId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingOpId(null);
                                  setOpFormName('');
                                  setOpFormDept('');
                                  setOpFormPhone('');
                                  setOpFormDesc('');
                                  setOpFormStatus('online');
                                }}
                                className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors"
                              >
                                Batal Edit
                              </button>
                            )}
                          </div>

                          {/* Operator Input Form */}
                          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                            <h5 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              {editingOpId ? 'Form Edit Operator' : 'Tambah Operator Baru'}
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Nama Operator / Nama Staf
                                </label>
                                <input
                                  type="text"
                                  value={opFormName}
                                  onChange={(e) => setOpFormName(e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                                  placeholder="Contoh: Siti Rahma"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Departemen / Tujuan Layanan
                                </label>
                                <input
                                  type="text"
                                  value={opFormDept}
                                  onChange={(e) => setOpFormDept(e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                                  placeholder="Contoh: Layanan MPASI / CS Penjualan"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  No. WhatsApp (Aktif & Berawalan Negara)
                                </label>
                                <input
                                  type="text"
                                  value={opFormPhone}
                                  onChange={(e) => setOpFormPhone(e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                                  placeholder="Contoh: 6281234567890"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Status Operator Saat Ini
                                </label>
                                <select
                                  value={opFormStatus}
                                  onChange={(e: any) => setOpFormStatus(e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                                >
                                  <option value="online">Online (Aktif / Siap Melayani)</option>
                                  <option value="offline">Offline (Tutup / Sedang Sibuk)</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Deskripsi Singkat / Keterangan Keahlian
                              </label>
                              <input
                                type="text"
                                value={opFormDesc}
                                onChange={(e) => setOpFormDesc(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                                placeholder="Contoh: Pakar gizi anak & konsultasi diet balita"
                              />
                            </div>

                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!opFormName || !opFormDept || !opFormPhone) {
                                    alert('Mohon isi Nama, Departemen, dan No. WhatsApp operator!');
                                    return;
                                  }

                                  if (editingOpId) {
                                    // Update existing
                                    setCfgWaOperators(
                                      cfgWaOperators.map((op: any) =>
                                        op.id === editingOpId
                                          ? {
                                              ...op,
                                              name: opFormName,
                                              department: opFormDept,
                                              phone: opFormPhone,
                                              description: opFormDesc,
                                              status: opFormStatus,
                                            }
                                          : op
                                      )
                                    );
                                    setEditingOpId(null);
                                  } else {
                                    // Add new
                                    const newOp = {
                                      id: Date.now().toString(),
                                      name: opFormName,
                                      department: opFormDept,
                                      phone: opFormPhone,
                                      description: opFormDesc,
                                      status: opFormStatus,
                                    };
                                    setCfgWaOperators([...cfgWaOperators, newOp]);
                                  }

                                  // Reset form fields
                                  setOpFormName('');
                                  setOpFormDept('');
                                  setOpFormPhone('');
                                  setOpFormDesc('');
                                  setOpFormStatus('online');
                                }}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                              >
                                {editingOpId ? 'Simpan Perubahan Operator' : 'Tambahkan Operator'}
                              </button>
                            </div>
                          </div>

                          {/* Operator Listing Table */}
                          {cfgWaOperators.length === 0 ? (
                            <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                              <p className="text-xs text-slate-400 font-bold">
                                Belum ada operator ditambahkan. Tambahkan di atas terlebih dahulu!
                              </p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-800/80">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                                  <tr>
                                    <th className="px-4 py-2.5">Operator & Keahlian</th>
                                    <th className="px-4 py-2.5">Departemen</th>
                                    <th className="px-4 py-2.5">WhatsApp</th>
                                    <th className="px-4 py-2.5 text-center">Status</th>
                                    <th className="px-4 py-2.5 text-right">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                                  {cfgWaOperators.map((op: any, index: number) => (
                                    <tr key={op.id || index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                                      <td className="px-4 py-3">
                                        <div className="font-extrabold text-slate-900 dark:text-white">{op.name}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{op.description || '-'}</div>
                                      </td>
                                      <td className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                        {op.department}
                                      </td>
                                      <td className="px-4 py-3 font-mono text-[11px]">
                                        {op.phone}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            // 1-click status toggle
                                            setCfgWaOperators(
                                              cfgWaOperators.map((o: any) =>
                                                o.id === op.id
                                                  ? { ...o, status: o.status === 'online' ? 'offline' : 'online' }
                                                  : o
                                              )
                                            );
                                          }}
                                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase border ${
                                            op.status === 'online'
                                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                                          }`}
                                        >
                                          {op.status === 'online' ? 'ONLINE' : 'OFFLINE'}
                                        </button>
                                      </td>
                                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingOpId(op.id);
                                            setOpFormName(op.name);
                                            setOpFormDept(op.department);
                                            setOpFormPhone(op.phone);
                                            setOpFormDesc(op.description || '');
                                            setOpFormStatus(op.status || 'online');
                                          }}
                                          className="text-[10px] text-indigo-500 hover:text-indigo-600 font-extrabold"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (confirm(`Yakin ingin menghapus operator ${op.name}?`)) {
                                              setCfgWaOperators(cfgWaOperators.filter((o: any) => o.id !== op.id));
                                            }
                                          }}
                                          className="text-[10px] text-red-500 hover:text-red-600 font-extrabold"
                                        >
                                          Hapus
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Right Column: Live Interactive Preview */}
                      <div className="lg:col-span-5 space-y-6">
                        
                        {/* Live Widget Interactive Preview Box */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-6 space-y-4">
                          <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                            <h4 className="text-xs font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                              Live Interactive Preview (Real-time)
                            </h4>
                          </div>

                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            Berikut adalah simulasi tampilan langsung panel WhatsApp chat box Anda sesuai konfigurasi saat ini. Klik pilihan tujuan untuk menguji pengisian formulir.
                          </p>

                          {/* Simulation Area */}
                          <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl flex items-center justify-center min-h-[460px] border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden">
                            
                            {/* Embedded Simulation Frame */}
                            <div className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl w-[320px] max-w-full overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col scale-95 transition-all duration-300">
                              
                              {/* Simulate Widget Header */}
                              <div
                                style={{ backgroundColor: cfgWaColorAccent || '#25D366' }}
                                className="p-4 text-white flex justify-between items-center"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-white/20 rounded-lg">
                                    <span className="text-xs">💬</span>
                                  </div>
                                  <div>
                                    <h5 className="font-extrabold text-xs tracking-wide leading-tight">
                                      {cfgWaHeaderTitle || 'Hubungi Kami'}
                                    </h5>
                                    <p className="text-[9px] opacity-95 mt-0.5 font-medium">
                                      {cfgWaSubtitle || 'Halo! Ada yang bisa kami bantu?'}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                                  Mock
                                </span>
                              </div>

                              {/* Simulate Widget Body */}
                              <div className="p-4 space-y-3 min-h-[220px]">
                                {cfgWaOperators.length === 0 ? (
                                  <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-[10px] space-y-2">
                                    <span>⚠️</span>
                                    <p className="font-bold">Silakan tambahkan operator di samping kiri untuk menguji Live Preview widget.</p>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                      Silakan Pilih Tujuan / Departemen:
                                    </p>
                                    <div className="space-y-2">
                                      {Array.from(new Set(cfgWaOperators.map((o: any) => o.department).filter(Boolean))).map((dept: any) => {
                                        const ops = cfgWaOperators.filter((o: any) => o.department === dept);
                                        const isOnline = ops.some((o: any) => o.status === 'online');

                                        return (
                                          <div
                                            key={dept}
                                            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer text-left"
                                          >
                                            <div className="flex-1 min-w-0 pr-2">
                                              <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                                                {dept}
                                              </div>
                                              <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                                {ops.length > 1 
                                                  ? `${ops.length} Operator (Rotasi)` 
                                                  : ops[0]?.description || 'Hubungi tim bantuan kami'}
                                              </div>
                                            </div>
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Simulated Form Fields Preview */}
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-2 space-y-2">
                                      <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-505 uppercase tracking-widest">
                                        Simulasi Tampilan Formulir:
                                      </p>
                                      <div className="space-y-2 opacity-60 pointer-events-none">
                                        {cfgWaFormFields.includes('name') && (
                                          <div>
                                            <label className="block text-[8px] font-bold text-slate-400 uppercase">Nama Lengkap</label>
                                            <input type="text" placeholder="Masukkan nama..." className="w-full p-1.5 text-[10px] rounded-lg border bg-slate-50 dark:bg-slate-950 font-bold" />
                                          </div>
                                        )}
                                        {cfgWaFormFields.includes('phone') && (
                                          <div>
                                            <label className="block text-[8px] font-bold text-slate-400 uppercase">No. HP / WhatsApp</label>
                                            <input type="text" placeholder="Masukkan WhatsApp..." className="w-full p-1.5 text-[10px] rounded-lg border bg-slate-50 dark:bg-slate-950 font-bold" />
                                          </div>
                                        )}
                                        {cfgWaFormFields.includes('email') && (
                                          <div>
                                            <label className="block text-[8px] font-bold text-slate-400 uppercase">Alamat Email</label>
                                            <input type="email" placeholder="Masukkan email..." className="w-full p-1.5 text-[10px] rounded-lg border bg-slate-50 dark:bg-slate-950 font-bold" />
                                          </div>
                                        )}
                                        {cfgWaFormFields.includes('message') && (
                                          <div>
                                            <label className="block text-[8px] font-bold text-slate-400 uppercase">Pesan Anda</label>
                                            <textarea rows={2} placeholder="Masukkan pesan..." className="w-full p-1.5 text-[10px] rounded-lg border bg-slate-50 dark:bg-slate-950 resize-none font-bold" />
                                          </div>
                                        )}
                                        <button
                                          type="button"
                                          style={{ backgroundColor: cfgWaColorAccent || '#25D366' }}
                                          className="w-full py-2 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg shadow-sm"
                                        >
                                          Kirim ke WhatsApp (Simulasi)
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Simulate Widget Footer */}
                              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-500 font-bold">
                                <span>Preview Terintegrasi</span>
                                <span className="bg-slate-250/50 px-1.5 py-0.5 rounded text-[8px]">
                                  Secure Chat
                                </span>
                              </div>
                            </div>

                            {/* Floating Mock Icon Badge at bottom right of sandbox */}
                            <div className="absolute bottom-4 right-4">
                              <div
                                style={{ backgroundColor: cfgWaColorAccent || '#25D366' }}
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer"
                              >
                                💬
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Leads Logs Table (Click-to-Chat Leads Logs) */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <h4 className="text-xs font-extrabold uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
                            📊 Log Inisiasi Percakapan (Click-to-Chat Leads Tracking)
                          </h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            Daftar pelanggan yang telah menekan tombol "Kirim ke WhatsApp" untuk berkonsultasi melalui widget WhatsApp di website ini.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={fetchWaLeads}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-lg text-[10px] font-black text-slate-600 dark:text-slate-300 transition-all uppercase tracking-wider"
                        >
                          Segarkan Log
                        </button>
                      </div>

                      {waLeadsError && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold">
                          {waLeadsError}
                        </div>
                      )}

                      {isLoadingWaLeads ? (
                        <div className="text-center py-8 text-xs font-bold text-slate-400">
                          Sedang mengambil log leads...
                        </div>
                      ) : waLeads.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          <p className="text-xs text-slate-400 font-bold">
                            Belum ada log inisiasi chat terekam.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-800/80">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                              <tr>
                                <th className="px-4 py-2.5">Tanggal / Waktu</th>
                                <th className="px-4 py-2.5">Nama Pelanggan</th>
                                <th className="px-4 py-2.5">Nomor HP</th>
                                <th className="px-4 py-2.5">Tujuan / Dept</th>
                                <th className="px-4 py-2.5">Assigned Operator Phone</th>
                                <th className="px-4 py-2.5">Pesan Awal</th>
                                <th className="px-4 py-2.5">Halaman Asal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                              {waLeads.map((lead: any) => (
                                <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 text-[11px]">
                                  <td className="px-4 py-3 text-[10px] font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                    {lead.created_at ? new Date(lead.created_at).toLocaleString('id-ID') : '-'}
                                  </td>
                                  <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white">
                                    {lead.customer_name || '-'}
                                  </td>
                                  <td className="px-4 py-3 font-mono">
                                    {lead.customer_phone || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                    {lead.department || '-'}
                                  </td>
                                  <td className="px-4 py-3 font-mono">
                                    {lead.assigned_operator_phone || '-'}
                                  </td>
                                  <td className="px-4 py-3 max-w-[200px] truncate" title={lead.initial_message}>
                                    {lead.initial_message || '-'}
                                  </td>
                                  <td className="px-4 py-3 max-w-[150px] truncate" title={lead.page_url}>
                                    <a
                                      href={lead.page_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-500 hover:underline"
                                    >
                                      {lead.page_url ? lead.page_url.replace(window.location.origin, '') : '-'}
                                    </a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
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

              {/* SUB-BAGIAN: HERO AFFILIATE WIDGET */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="hero_affiliate_widget_enable"
                      checked={cfgHeroAffiliateWidgetEnable}
                      onChange={(e) => setCfgHeroAffiliateWidgetEnable(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <div>
                      <label htmlFor="hero_affiliate_widget_enable" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                        Aktifkan Hero Affiliate Widget (hero_affiliate_widget_enable)
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pasang search box / widget pemesanan tiket, hotel, dan tur langsung di dalam kotak Hero Banner
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 self-start sm:self-auto">
                    Travelpayouts • Booking • GYG • Trip • Wego
                  </span>
                </div>

                {cfgHeroAffiliateWidgetEnable && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Pilihan Posisi Widget di Hero (hero_affiliate_widget_position)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          cfgHeroAffiliateWidgetPosition === 'right'
                            ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-400 dark:border-rose-600 text-rose-950 dark:text-rose-200 shadow-xs'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}>
                          <input
                            type="radio"
                            name="hero_widget_position"
                            value="right"
                            checked={cfgHeroAffiliateWidgetPosition === 'right'}
                            onChange={() => setCfgHeroAffiliateWidgetPosition('right')}
                            className="w-4 h-4 text-rose-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold block">Gantikan Performance Box (Kanan)</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-normal">
                              Widget diletakkan di sisi kanan sejajar dengan judul & tombol hero. Ideal untuk widget kotak/vertikal 300x250 px.
                            </span>
                          </div>
                        </label>

                        <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          cfgHeroAffiliateWidgetPosition === 'bottom'
                            ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-400 dark:border-rose-600 text-rose-950 dark:text-rose-200 shadow-xs'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}>
                          <input
                            type="radio"
                            name="hero_widget_position"
                            value="bottom"
                            checked={cfgHeroAffiliateWidgetPosition === 'bottom'}
                            onChange={() => setCfgHeroAffiliateWidgetPosition('bottom')}
                            className="w-4 h-4 text-rose-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold block">Di Bawah Subtitle Hero (Bawah)</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-normal">
                              Widget diletakkan melebar di bawah judul & subtitle hero. Ideal untuk form pencarian horizontal bar.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Kode HTML / Script Snippet Widget (hero_affiliate_widget_code)
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">HTML + &lt;script&gt; / &lt;iframe&gt; / &lt;ins&gt;</span>
                      </div>
                      <textarea
                        value={cfgHeroAffiliateWidgetCode}
                        onChange={(e) => setCfgHeroAffiliateWidgetCode(e.target.value)}
                        rows={7}
                        placeholder={`<!-- Contoh Snippet Travelpayouts / Booking / Wego / Trip.com -->\n<div id="travelpayouts-search-widget">\n  <script async src="https://tp.media/content?currency=idr&promo_id=7879&shmarker=..." charset="utf-8"></script>\n</div>`}
                        className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                      />
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          ✓ Asynchronous Client Executed
                        </span>
                        <span>• Mendukung Tag &lt;script&gt;, &lt;ins&gt;, dan atribut data-gyg-*</span>
                        <span>• Kompatibel Vite/Cloudflare Pages</span>
                      </div>
                    </div>
                  </div>
                )}
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

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Label Judul Referensi / Daftar Pustaka (reference_heading_label)
                </label>
                <input
                  type="text"
                  value={cfgReferenceHeadingLabel}
                  onChange={(e) => setCfgReferenceHeadingLabel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  placeholder="Contoh: Referensi, Referensi Ilmiah, Bibliography"
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

              {/* PENGATURAN HISTORY & ROLLBACK PENULIS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ⏱️ Jeda Waktu Minimal History (Menit) [history_min_time_minutes]
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={cfgHistoryMinTimeMinutes}
                    onChange={(e) => setCfgHistoryMinTimeMinutes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Durasi waktu minimal (menit) sebelum snapshot history baru disimpan otomatis.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    📊 Minimal Selisih Karakter Signifikan [history_min_char_diff]
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={cfgHistoryMinCharDiff}
                    onChange={(e) => setCfgHistoryMinCharDiff(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Batas perubahan jumlah karakter teks untuk langsung memicu snapshot history baru.</p>
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
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${
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
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${
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
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${
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
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${
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

                {/* TOGGLE TURNSTILE PADA KOMENTAR NATIVE */}
                <div className="flex items-start justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mt-3">
                  <div className="pr-3">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer">
                      <span>Gunakan Cloudflare Turnstile pada Form Komentar (enable_comment_turnstile)</span>
                    </label>
                    <p className="text-[10.5px] text-slate-500 mt-0.5 leading-relaxed">
                      Aktifkan captcha Cloudflare Turnstile untuk mencegah spam bot pada form komentar native. Jika dimatikan, komentar tetap aman terlindungi oleh honeypot anti-spam tanpa menampilkan widget Turnstile.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={cfgEnableCommentTurnstile}
                    onChange={(e) => setCfgEnableCommentTurnstile(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 shrink-0 mt-0.5"
                  />
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
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-500/30 flex items-center gap-1.5 transition-colors"
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

            {/* SECTION 8: CUSTOM JS / CSS SNIPPETS (HEAD & BODY) */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-rose-500" />
                  <span>8. Custom JS & CSS Snippet Inserter (Head & Body)</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setCfgCustomSnippetHeadCode(DEFAULT_SITE_CONFIG.custom_snippet_head_code || '');
                    setCfgCustomSnippetBodyCode(DEFAULT_SITE_CONFIG.custom_snippet_body_code || '');
                    setCfgCustomSnippetHeadEnable(true);
                    setCfgCustomSnippetBodyEnable(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>Muat Sample Dummy JS/CSS</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Sisipkan kode JavaScript kustom (seperti Google Analytics gtag.js, Facebook Pixel, tracking script) atau CSS kustom ke bagian <code>&lt;head&gt;</code> atau sebelum penutup <code>&lt;/body&gt;</code>. Dilengkapi dengan toggle switch tayang/sembunyi.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* HEAD SNIPPET */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Code className="w-3.5 h-3.5 text-rose-500" />
                      <span>A. Head Snippet (Sebelum &lt;/head&gt;)</span>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfgCustomSnippetHeadEnable}
                        onChange={(e) => setCfgCustomSnippetHeadEnable(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-transform dark:after:border-slate-600 peer-checked:bg-rose-600"></div>
                      <span className="ml-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {cfgCustomSnippetHeadEnable ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </label>
                  </div>
                  <textarea
                    value={cfgCustomSnippetHeadCode}
                    onChange={(e) => setCfgCustomSnippetHeadCode(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                    placeholder="<!-- Masukkan script Google Analytics / Tag Manager / Custom <style> di sini -->"
                  />
                </div>

                {/* BODY SNIPPET */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Code className="w-3.5 h-3.5 text-rose-500" />
                      <span>B. Body Snippet (Sebelum penutup &lt;/body&gt;)</span>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfgCustomSnippetBodyEnable}
                        onChange={(e) => setCfgCustomSnippetBodyEnable(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-transform dark:after:border-slate-600 peer-checked:bg-rose-600"></div>
                      <span className="ml-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {cfgCustomSnippetBodyEnable ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </label>
                  </div>
                  <textarea
                    value={cfgCustomSnippetBodyCode}
                    onChange={(e) => setCfgCustomSnippetBodyCode(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                    placeholder="<!-- Masukkan script JS kustom sebelum penutup </body> di sini -->"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 9: CUSTOM HTML META TAG SNIPPET */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span>9. Custom HTML Meta Tag Snippet</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setCfgCustomMetaTagsCode(DEFAULT_SITE_CONFIG.custom_meta_tags_code || '');
                    setCfgCustomMetaTagsEnable(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Muat Sample Dummy Meta Tag</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Tempatkan kode meta tag khusus seperti verifikasi kepemilikan Google Search Console, Yandex Webmaster, Bing Webmaster, atau Pinterest verification.
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span>Meta Tag HTML Verification Snippet</span>
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfgCustomMetaTagsEnable}
                      onChange={(e) => setCfgCustomMetaTagsEnable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-transform dark:after:border-slate-600 peer-checked:bg-rose-600"></div>
                    <span className="ml-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {cfgCustomMetaTagsEnable ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </label>
                </div>
                <textarea
                  value={cfgCustomMetaTagsCode}
                  onChange={(e) => setCfgCustomMetaTagsCode(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                  placeholder='<meta name="google-site-verification" content="TOKEN_VERIFIKASI_ANDA" />'
                />
              </div>
            </div>

            {/* SECTION 10: CUSTOM RESPONSIVE BANNER ADS SNIPPETS */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <LayoutGrid className="w-4 h-4 text-emerald-500" />
                  <span>10. Custom Responsive Banner Iklan (HTML/JS/CSS/Image)</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setCfgAdBannerFirstHalfCode(DEFAULT_SITE_CONFIG.ad_banner_first_half_code || '');
                    setCfgAdBannerStickyFooterCode(DEFAULT_SITE_CONFIG.ad_banner_sticky_footer_code || '');
                    setCfgAdBannerArticleStartCode(DEFAULT_SITE_CONFIG.ad_banner_article_start_code || '');
                    setCfgAdBannerArticleEndCode(DEFAULT_SITE_CONFIG.ad_banner_article_end_code || '');
                    setCfgAdBannerFirstHalfEnable(true);
                    setCfgAdBannerStickyFooterEnable(true);
                    setCfgAdBannerArticleStartEnable(true);
                    setCfgAdBannerArticleEndEnable(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Muat Sample Dummy Banner Iklan</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Kelola banner iklan kustom (banner afiliasi, sponsor, iklan produk/layanan sendiri) dalam format HTML, JS, CSS, JPG, PNG, atau GIF pada 4 posisi opsional di seluruh situs dengan opsi toggle tayang/sembunyi independen.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* A. BOTTOM OF FIRST HALF PAGE */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      A. Bottom of First Half Page (Bawah Paruh Pertama Halaman Utama)
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfgAdBannerFirstHalfEnable}
                        onChange={(e) => setCfgAdBannerFirstHalfEnable(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-transform dark:after:border-slate-600 peer-checked:bg-rose-600"></div>
                      <span className="ml-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {cfgAdBannerFirstHalfEnable ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </label>
                  </div>
                  <textarea
                    value={cfgAdBannerFirstHalfCode}
                    onChange={(e) => setCfgAdBannerFirstHalfCode(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                    placeholder="<!-- Sisipkan snippet iklan HTML/CSS/JS banner afiliasi di sini -->"
                  />
                </div>

                {/* B. BOTTOM OF THE SCREEN (FIXED) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      B. Bottom of the Screen / Sticky Footer (Melayang di Bawah Layar)
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfgAdBannerStickyFooterEnable}
                        onChange={(e) => setCfgAdBannerStickyFooterEnable(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-transform dark:after:border-slate-600 peer-checked:bg-rose-600"></div>
                      <span className="ml-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {cfgAdBannerStickyFooterEnable ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </label>
                  </div>
                  <textarea
                    value={cfgAdBannerStickyFooterCode}
                    onChange={(e) => setCfgAdBannerStickyFooterCode(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                    placeholder="<!-- Sisipkan snippet iklan melayang (sticky bottom banner) di sini -->"
                  />
                </div>

                {/* C. START OF EACH ARTICLE/POST */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      C. Start of Each Article/Post (Awal Setiap Artikel)
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfgAdBannerArticleStartEnable}
                        onChange={(e) => setCfgAdBannerArticleStartEnable(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-transform dark:after:border-slate-600 peer-checked:bg-rose-600"></div>
                      <span className="ml-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {cfgAdBannerArticleStartEnable ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </label>
                  </div>
                  <textarea
                    value={cfgAdBannerArticleStartCode}
                    onChange={(e) => setCfgAdBannerArticleStartCode(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                    placeholder="<!-- Sisipkan snippet iklan awal artikel di sini -->"
                  />
                </div>

                {/* D. END OF EACH ARTICLE/POST */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      D. End of Each Article/Post (Akhir Setiap Artikel)
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfgAdBannerArticleEndEnable}
                        onChange={(e) => setCfgAdBannerArticleEndEnable(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-transform dark:after:border-slate-600 peer-checked:bg-rose-600"></div>
                      <span className="ml-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {cfgAdBannerArticleEndEnable ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </label>
                  </div>
                  <textarea
                    value={cfgAdBannerArticleEndCode}
                    onChange={(e) => setCfgAdBannerArticleEndCode(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                    placeholder="<!-- Sisipkan snippet iklan akhir artikel di sini -->"
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
                    placeholder="Portal Admin CMS"
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

                <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      🔒 Suffix Rahasia URL Admin (admin_url_suffix)
                    </label>
                    <span className="text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
                      URL Aktif: /admin-{String(cfgAdminUrlSuffix || '9999')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sistem proteksi dari brute force/bot. Tentukan suffix 4 karakter alfanumerik (contoh: <code className="text-rose-500">9999</code>, <code className="text-rose-500">6969</code>, <code className="text-rose-500">kuda</code>). Default: <code className="text-rose-500">9999</code>.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 px-3 py-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                      {typeof window !== 'undefined' ? window.location.origin : 'https://domain.com'}/admin-
                    </span>
                    <input
                      type="text"
                      maxLength={10}
                      value={cfgAdminUrlSuffix}
                      onChange={(e) => setCfgAdminUrlSuffix(String(e.target.value).replace(/[^a-zA-Z0-9_-]/g, ''))}
                      placeholder="9999"
                      className="w-32 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold font-mono text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
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
      {/* TAB: SURAT PEMBACA */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'surat_pembaca' && (
        <AdminSuratPembacaManager />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: IKLAN BARIS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'iklan_baris' && (
        <AdminIklanBarisManager />
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
                    className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md transition-colors shrink-0 flex items-center gap-1.5"
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

          {/* CLOUDFLARE TURNSTILE & LOGIN SECURITY CARD */}
          {currentUser?.role === 'admin' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[11px] font-extrabold border border-rose-200 dark:border-rose-900">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Cloudflare Turnstile & Anti-Brute Force</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Mode Keamanan & Toleransi Turnstile
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur apakah proteksi login menerapkan Mode Toleran (Graceful Fallback) atau Mode Ketat (Strict Security).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                    cfgEnableTurnstileFallback
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  }`}>
                    {cfgEnableTurnstileFallback ? '⚠️ Mode Toleran Aktif' : '🛡️ Mode Ketat Aktif'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                    Mode Toleran (Graceful Fallback)
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sangat cocok saat <strong>migrasi domain baru atau pertama kali setup</strong>. Jika Secret Key belum sempat disetel di Cloudflare atau D1, backend tidak akan memblokir login admin selama token Turnstile frontend berhasil dibuat.
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                    Mode Ketat (Strict Production)
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sangat disarankan <strong>setelah website berjalan normal</strong>. Verifikasi token wajib 100% valid dari server Cloudflare `siteverify` dengan Secret Key yang cocok. Tolak semua percobaan login tanpa pengecualian.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-rose-100 dark:border-rose-950/60 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                    Ubah Status Toleransi Turnstile
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Klik tombol di samping untuk beralih antara Mode Toleran dan Mode Ketat, lalu klik Simpan.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!onSaveConfig || !siteConfig) return;
                      const nextVal = !cfgEnableTurnstileFallback;
                      setCfgEnableTurnstileFallback(nextVal);
                      setIsSavingConfig(true);
                      await onSaveConfig({
                        ...siteConfig,
                        turnstile_site_key: cfgTurnstileSiteKey,
                        enable_turnstile_fallback: nextVal,
                      });
                      setIsSavingConfig(false);
                      setConfigSuccessMsg(nextVal ? '✅ Mode Toleran (Graceful Fallback) diaktifkan!' : '🛡️ Mode Ketat (Strict Turnstile) diaktifkan!');
                      setTimeout(() => setConfigSuccessMsg(''), 3000);
                    }}
                    disabled={isSavingConfig}
                    className={`px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 ${
                      cfgEnableTurnstileFallback
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>{cfgEnableTurnstileFallback ? 'Terapkan Mode Ketat (Nonaktifkan Fallback)' : 'Terapkan Mode Toleran (Aktifkan Fallback)'}</span>
                  </button>
                </div>
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
                  Nama Lengkap Admin / Editor / Penulis
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
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 flex items-center gap-2 transition-colors self-start sm:self-auto disabled:opacity-50"
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
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
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
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
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
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
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
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
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
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md transition-colors shrink-0 flex items-center gap-2"
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
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      commentFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Semua ({comments.length})
                  </button>
                  <button
                    onClick={() => setCommentFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
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
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
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
                      className={`p-4 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                        comment.status === 'pending'
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={getOptimizedAvatarUrl(comment.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user_name || 'U')}&size=80`, 40, 60)}
                          alt={comment.user_name}
                          width={40}
                          height={40}
                          loading="lazy"
                          decoding="async"
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
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-colors flex items-center gap-1.5 shadow-xs"
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

      {/* ------------------------------------------------------------- */}
      {/* TAB 9: DATABASE & SCHEMA D1 BACKUP MANAGER (ROLE ADMIN ONLY) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'database' && currentUser?.role === 'admin' && (
        <DatabaseBackupManager siteConfig={siteConfig} />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 10: MANAGE PRODUCTS (ROLE ADMIN ONLY) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'products' && currentUser?.role === 'admin' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {siteConfig?.product_mgmt_heading || 'Panel Manajemen Produk Jualan'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {siteConfig?.product_mgmt_desc || 'Kelola daftar lukisan orisinal yang Anda pasarkan. Anda dapat menambah, mengedit, memperbarui status (Tersedia/Terjual), serta menetapkan kode QRIS pembayaran dan no WhatsApp untuk masing-masing karya.'}
            </p>
          </div>
          <div className="h-px bg-slate-100 dark:bg-slate-800" />
          <InteractiveProductSale isAdmin={true} currentUser={currentUser} />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 11: WHATSAPP REPORTS & LEADS LOGS (ROLE ADMIN ONLY) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'wa_leads' && currentUser?.role === 'admin' && (
        <div className="space-y-8">
          {/* Header Stats */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📊 Pusat Laporan Leads & Pemesanan WhatsApp</span>
                  <span className="text-[10px] bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Real-time
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pantau performa interaksi website Anda secara menyeluruh mulai dari inisiasi chat konsultasi hingga riwayat pemesanan produk katalog.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    fetchWaLeads();
                    fetchProductOrders();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 font-black uppercase tracking-wider text-[10px]"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>Segarkan Semua Laporan</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-150 dark:border-slate-800/80">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Chat Leads</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{waLeads.length} <span className="text-xs font-semibold text-slate-400">leads</span></div>
                <p className="text-[10px] text-slate-400 mt-2">Pelanggan yang menginisiasi chat via widget melayang.</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-150 dark:border-slate-800/80">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Pemesanan Produk</div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  {productOrders.length} <span className="text-xs font-semibold text-slate-400">pesanan</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Pelanggan yang memesan item dari katalog jualan.</p>
              </div>
            </div>
          </div>

          {/* Panel 1: Chat Leads Logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-extrabold uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  💬 Log Chat Leads (Click-to-Chat Widget)
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  Pengunjung yang mengisi form pada widget melayang untuk konsultasi WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchWaLeads}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-[10px] font-black text-slate-600 dark:text-slate-300 transition-all rounded-lg uppercase tracking-wider"
              >
                Segarkan Chat Log
              </button>
            </div>

            {waLeadsError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold">
                {waLeadsError}
              </div>
            )}

            {isLoadingWaLeads ? (
              <div className="text-center py-12 text-xs font-bold text-slate-400">
                Sedang memuat data chat leads...
              </div>
            ) : waLeads.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10">
                <p className="text-xs text-slate-400 font-bold">Belum ada chat lead terekam.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-800/80 bg-white dark:bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold border-b border-slate-150 dark:border-slate-850">
                    <tr>
                      <th className="px-4 py-3">Tanggal / Waktu</th>
                      <th className="px-4 py-3">Nama Pelanggan</th>
                      <th className="px-4 py-3">Nomor HP</th>
                      <th className="px-4 py-3">Tujuan / Dept</th>
                      <th className="px-4 py-3">Operator Dituju</th>
                      <th className="px-4 py-3">Pesan Awal</th>
                      <th className="px-4 py-3">Halaman Asal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                    {waLeads.map((lead: any) => (
                      <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 text-[11px]">
                        <td className="px-4 py-3.5 text-[10px] font-mono text-slate-400 whitespace-nowrap">
                          {lead.created_at ? new Date(lead.created_at).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white">
                          {lead.customer_name || '-'}
                        </td>
                        <td className="px-4 py-3.5 font-mono">
                          {lead.customer_phone || '-'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                          {lead.department || '-'}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-400">
                          {lead.assigned_operator_phone || '-'}
                        </td>
                        <td className="px-4 py-3.5 max-w-[200px] truncate" title={lead.initial_message}>
                          {lead.initial_message || '-'}
                        </td>
                        <td className="px-4 py-3.5 max-w-[150px] truncate text-slate-400" title={lead.page_url}>
                          {lead.page_url ? (
                            <a href={lead.page_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1 text-rose-500">
                              <ExternalLink className="w-3 h-3" />
                              <span>Buka Link</span>
                            </a>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Panel 2: Product Orders Logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-extrabold uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  🛍️ Log Pemesanan & Pembelian Produk (Product Orders Tracking)
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  Pelanggan yang memesan item dari katalog jualan melalui tombol checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchProductOrders}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-[10px] font-black text-slate-600 dark:text-slate-300 transition-all rounded-lg uppercase tracking-wider"
              >
                Segarkan Order Log
              </button>
            </div>

            {productOrdersError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold">
                {productOrdersError}
              </div>
            )}

            {isLoadingProductOrders ? (
              <div className="text-center py-12 text-xs font-bold text-slate-400">
                Sedang memuat data order...
              </div>
            ) : productOrders.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10">
                <p className="text-xs text-slate-400 font-bold">Belum ada order jualan terekam.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-800/80 bg-white dark:bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold border-b border-slate-150 dark:border-slate-850">
                    <tr>
                      <th className="px-4 py-3">Tanggal / Waktu</th>
                      <th className="px-4 py-3">Nama Pembeli</th>
                      <th className="px-4 py-3">Nomor HP/WA</th>
                      <th className="px-4 py-3">Produk Dipesan</th>
                      <th className="px-4 py-3 text-right">Harga Satuan</th>
                      <th className="px-4 py-3">Catatan Pembeli</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                    {productOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 text-[11px]">
                        <td className="px-4 py-3.5 text-[10px] font-mono text-slate-400 whitespace-nowrap">
                          {order.created_at ? new Date(order.created_at).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white">
                          {order.buyer_name || '-'}
                        </td>
                        <td className="px-4 py-3.5 font-mono">
                          {order.buyer_phone || '-'}
                        </td>
                        <td className="px-4 py-3.5 font-extrabold text-rose-600 dark:text-rose-400">
                          {order.product_title || '-'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {order.product_price ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.product_price) : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 max-w-[250px] truncate" title={order.buyer_notes}>
                          {order.buyer_notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

        </div> {/* Close RIGHT COLUMN lg:col-span-9 */}
      </div> {/* Close TWO-COLUMN GRID */}

    </div>
  );
}
