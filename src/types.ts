export type UserRole = 'admin' | 'editor' | 'writer' | 'guest';

export interface SuratPembaca {
  id: number;
  judul: string;
  isi: string;
  nama: string;
  kota: string;
  pekerjaan: string;
  tahunLahir: number;
  phone: string;
  ipAddress?: string;
  status: 'pending' | 'published' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

export interface IklanBarisItem {
  id: number;
  kategori: string;
  keteranganBarang: string;
  harga: string;
  nama: string;
  kota: string;
  pekerjaan: string;
  tahunLahir: number;
  phone: string;
  ipAddress?: string;
  status: 'pending' | 'published' | 'rejected' | 'expired';
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string; // Tanggal iklan harus diturunkan / berakhir (opsional)
  imageUrl?: string;
  isAdminAd?: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
  title?: string; // Credentials / Title (e.g. "Dr. Ratna Sari, M.Psi - Psikolog Anak")
  role: UserRole;
  avatar: string;
  bio?: string;
  socialInstagram?: string;
  socialLinkedin?: string;
  socialWebsite?: string;
  socials?: { instagram?: string; linkedin?: string; website?: string };
  isVerifiedAcademic?: boolean;
  verifiedAcademicLabel?: string;
  createdAt?: string;
}

export interface PostRevision {
  id: string;
  timestamp: string;
  updatedAt?: string;
  title: string;
  contentMarkdown: string;
  excerpt: string;
  updatedByName?: string;
}

export interface NavLink {
  label: string;
  url: string;
}

export type HomepageDisplayMode =
  | 'default'
  | 'event'
  | 'campaign'
  | 'microsite'
  | 'portfolio'
  | 'personal_branding'
  | 'corporate'
  | 'product_landing'
  | 'classified_ads'
  | 'knowledge_base'
  | 'whatsapp_widget';

export interface SiteConfig {
  site_name: string;
  site_tagline: string;
  site_description: string;
  site_logo_url: string;
  site_logo_icon: string;
  site_favicon_url: string;
  homepage_display_mode?: HomepageDisplayMode;
  header_nav_links: NavLink[];
  hamburger_nav_links?: NavLink[];
  enable_search_bar: boolean;
  enable_theme_toggle: boolean;
  
  seo_meta_title: string;
  seo_meta_description: string;
  seo_default_og_image: string;

  show_hero_section: boolean;
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  hero_cta_link: string;
  hero_affiliate_widget_enable?: boolean;
  hero_affiliate_widget_position?: 'right' | 'bottom';
  hero_affiliate_widget_code?: string;

  posts_per_page: number;
  enable_featured_post: boolean;
  pagination_type: 'load_more' | 'infinite_scroll' | 'numbered';

  show_sidebar: boolean;
  popular_posts_count: number;
  categories_widget_limit: number;
  sidebar_banner_code: string;

  footer_about_text: string;
  footer_copyright_text: string;
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  footer_menu_links: NavLink[];
  footer_category_links?: NavLink[];
  footer_category_heading?: string;
  footer_quick_links_heading?: string;
  mobile_menu_label?: string;
  article_share_label?: string;
  related_articles_heading?: string;
  classified_max_chars?: string;
  surat_pembaca_title?: string;
  surat_pembaca_subtitle?: string;
  surat_pembaca_guidelines?: string;
  comment_engine_mode?: 'both' | 'native' | 'cusdis' | 'none';
  admin_login_title?: string;
  admin_login_subtitle?: string;
  admin_login_btn_text?: string;
  admin_url_suffix?: string;
  mobile_admin_btn_label?: string;
  mobile_show_logged_username?: boolean;
  active_theme_preset?: string;
  font_override_mode?: 'system' | 'inter' | 'plus-jakarta-sans' | 'theme';
  site_domain?: string;
  site_url?: string;
  history_min_time_minutes?: number;
  history_min_char_diff?: number;
  default_theme_mode?: 'light' | 'dark' | 'auto';
  font_density_scale?: 'compact' | 'standard' | 'spacious';
  font_size_scale?: 'small' | 'normal' | 'large' | 'xlarge';
  age_accessibility_preset?: '18-28' | '29-38' | '39-48' | '49-58';
  header_badge_text?: string;
  show_header_badge?: boolean;
  show_edge_badge?: boolean;
  hero_badge_text?: string;
  autolink_ticker_label?: string;
  footer_autolink_label?: string;
  footer_badge_1?: string;
  footer_badge_2?: string;
  footer_badge_3?: string;
  turnstile_site_key?: string;
  turnstile_secret_key?: string;
  enable_comment_turnstile?: boolean;
  enable_turnstile_fallback?: boolean;
  has_turnstile_secret?: boolean;

  // 8 GUI Manageable Component Configs
  enable_top_announcement?: boolean;
  top_announcement_text?: string;
  top_announcement_bg?: string;
  top_announcement_text_color?: string;

  enable_whatsapp_widget?: boolean;
  whatsapp_number?: string;
  whatsapp_default_message?: string;
  whatsapp_position?: 'bottom-right' | 'bottom-left' | 'bottom-center';

  enable_custom_ad_slots?: boolean;
  custom_ad_leaderboard_html?: string;
  custom_ad_rectangle_html?: string;
  custom_ad_slot_size?: '728x90' | '300x250' | 'fluid';

  enable_habit_simulator?: boolean;
  habit_simulator_title?: string;
  habit_simulator_subtitle?: string;

  enable_interactive_quiz?: boolean;
  quiz_builder_title?: string;

  enable_interactive_glossary?: boolean;
  glossary_builder_title?: string;

  enable_interactive_timeline?: boolean;

  cusdis_app_id?: string;
  cusdis_host?: string;

  // Performance Metric Box (Customizable by Admin)
  show_performance_box?: boolean;
  show_tech_badges?: boolean;
  tech_badge_hero?: string;
  tech_badge_pages?: string;
  tech_badge_database?: string;
  tech_badge_storage?: string;
  metric_1_show?: boolean;
  metric_2_show?: boolean;
  metric_3_show?: boolean;
  metric1_show?: boolean;
  metric2_show?: boolean;
  metric3_show?: boolean;

  metric1_value?: string;
  metric1_label?: string;
  metric1_anim_type?: 'fixed' | 'count_up' | 'count_down';
  metric1_start_val?: number;
  metric1_end_val?: number;
  metric1_duration?: number;
  metric1_unit?: string;

  metric2_value?: string;
  metric2_label?: string;
  metric2_anim_type?: 'fixed' | 'count_up' | 'count_down';
  metric2_start_val?: number;
  metric2_end_val?: number;
  metric2_duration?: number;
  metric2_unit?: string;

  metric3_value?: string;
  metric3_label?: string;
  metric3_anim_type?: 'fixed' | 'count_up' | 'count_down';
  metric3_start_val?: number;
  metric3_end_val?: number;
  metric3_duration?: number;
  metric3_unit?: string;
  reference_heading_label?: string;
  
  // AdSense & Strategic Ad Placements
  enable_adsense?: boolean;
  adsense_client_id?: string;
  adsense_header_top?: string;
  adsense_article_top?: string;
  adsense_article_middle?: string;
  adsense_article_bottom?: string;
  adsense_sidebar?: string;
  adsense_sticky_footer?: string;

  // Custom JS/CSS Snippets (Head & Body)
  custom_snippet_head_enable?: boolean;
  custom_snippet_head_code?: string;
  custom_snippet_body_enable?: boolean;
  custom_snippet_body_code?: string;

  // Custom HTML Meta Tag Snippet
  custom_meta_tags_enable?: boolean;
  custom_meta_tags_code?: string;

  // Custom Responsive Banner Ads Snippets
  ad_banner_first_half_enable?: boolean;
  ad_banner_first_half_code?: string;
  ad_banner_sticky_footer_enable?: boolean;
  ad_banner_sticky_footer_code?: string;
  ad_banner_article_start_enable?: boolean;
  ad_banner_article_start_code?: string;
  ad_banner_article_end_enable?: boolean;
  ad_banner_article_end_code?: string;

  // --- CUSTOMIZABLE FRONTPAGE WORDING & DATA (10 Models) ---
  // Model 1: Default Blog & Magz
  default_hero_badge?: string;
  default_hero_title?: string;
  default_hero_subtitle?: string;
  default_newsletter_title?: string;
  default_newsletter_subtitle?: string;

  // Model 2: Event & Konferensi
  event_badge_text?: string;
  event_title?: string;
  event_subtitle?: string;
  event_date_location?: string;
  event_cta_text?: string;
  event_whatsapp?: string;

  // Model 3: Campaign & Petisi
  campaign_badge_text?: string;
  campaign_title?: string;
  campaign_subtitle?: string;
  campaign_target_amount?: string;
  campaign_current_amount?: string;
  campaign_donor_count?: string;
  campaign_cta_text?: string;
  campaign_whatsapp?: string;

  // Model 4: Microsite / Bio Links
  microsite_title?: string;
  microsite_bio?: string;
  microsite_wa_number?: string;
  microsite_wa_label?: string;
  microsite_telegram_url?: string;
  microsite_ebook_url?: string;
  microsite_podcast_url?: string;
  microsite_shop_url?: string;

  // Model 5: Portofolio & Karya
  portfolio_badge_text?: string;
  portfolio_title?: string;
  portfolio_subtitle?: string;
  portfolio_stat1_val?: string;
  portfolio_stat1_lbl?: string;
  portfolio_stat2_val?: string;
  portfolio_stat2_lbl?: string;
  portfolio_stat3_val?: string;
  portfolio_stat3_lbl?: string;
  portfolio_whatsapp?: string;

  // Model 6: Personal Branding Dokter / Pakar
  doctor_badge_text?: string;
  doctor_name?: string;
  doctor_title?: string;
  doctor_bio?: string;
  doctor_experience_years?: string;
  doctor_consultation_rate?: string;
  doctor_whatsapp?: string;
  doctor_booking_whatsapp?: string;
  doctor_avatar_url?: string;

  // Model 7: Corporate & B2B
  corporate_badge_text?: string;
  corporate_title?: string;
  corporate_subtitle?: string;
  corporate_cta_proposal?: string;
  corporate_cta_consult?: string;
  corporate_stat1_val?: string;
  corporate_stat1_lbl?: string;
  corporate_stat2_val?: string;
  corporate_stat2_lbl?: string;
  corporate_stat3_val?: string;
  corporate_stat3_lbl?: string;
  corporate_whatsapp?: string;
  corporate_email?: string;

  // Model 8: Product Landing Page
  product_badge_text?: string;
  product_title?: string;
  product_subtitle?: string;
  product_price?: string;
  product_original_price?: string;
  product_discount_tag?: string;
  product_whatsapp?: string;
  product_cta_text?: string;
  product_mgmt_heading?: string;
  product_mgmt_desc?: string;

  // Model 9: Iklan Baris Koran Dulu
  newspaper_name?: string;
  newspaper_edition?: string;
  newspaper_motto?: string;
  newspaper_ads_phone?: string;
  newspaper_rate_text?: string;
  classified_masthead_title?: string;
  classified_masthead_subtitle?: string;
  classified_edition?: string;
  classified_price_tag?: string;
  classified_phone?: string;
  classified_categories?: string;
  classified_notice?: string;

  // Surat Pembaca Config
  surat_pembaca_channel_label?: string;
  surat_pembaca_login_info?: string;
  surat_pembaca_notice?: string;

  // Model 10: Knowledge Base
  kb_badge_text?: string;
  kb_title?: string;
  kb_subtitle?: string;
  kb_search_placeholder?: string;
  kb_helpdesk_whatsapp?: string;

  // Dynamic Sales Catalog Navigation Wording & Path
  products_nav_label?: string;
  products_nav_path?: string;
  seller_bank_accounts?: string;
  products_hero_badge?: string;
  products_hero_title?: string;
  products_hero_subtitle?: string;
  products_hero_btn_text?: string;
  products_hero_image_url?: string;
  products_hero_image_caption?: string;
  products_empty_title?: string;
  products_empty_subtitle?: string;

  // WhatsApp Chat Widget Configuration
  wa_widget_enabled?: boolean;
  wa_position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  wa_header_title?: string;
  wa_subtitle?: string;
  wa_color_accent?: string;
  wa_operators?: {
    id: string;
    name: string;
    department: string;
    phone: string;
    status: 'online' | 'offline';
    description: string;
  }[];
  wa_form_fields?: string[]; // ["name", "phone", "message"]
  wa_enable_rotation?: boolean;
}

export type PostStatus = 'draft' | 'pending_approval' | 'published' | 'rejected';

export interface Post {
  id: number;
  title: string;
  slug: string;
  contentMarkdown: string;
  contentHtml?: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  readTimeMinutes: number;
  authorId: number;
  authorName?: string;
  authorAvatar?: string;
  authorRole?: string;
  authorTitle?: string;
  authorBio?: string;
  authorSocials?: { instagram?: string; linkedin?: string; website?: string };
  
  coAuthorIds?: number[];
  co_writers?: number[];
  coAuthors?: User[];
  revisions?: PostRevision[];

  status: PostStatus;
  rejectionReason?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  postType?: 'article' | 'interactive_configurator' | 'interactive_showcase' | 'interactive_radar' | 'interactive_quiz' | 'interactive_timeline_slider' | 'interactive_battle_card' | 'interactive_quiz_router' | 'interactive_habit_simulator' | 'interactive_qa_column' | 'interactive_event_listing' | 'interactive_glossary_dictionary';
  interactiveConfigurator?: InteractiveConfiguratorData;
  interactiveShowcase?: InteractiveShowcaseData;
  interactiveRadar?: RadarWidgetConfig;
  interactiveQuiz?: QuizWidgetConfig;
  interactiveTimelineSlider?: TimelineSliderWidgetData;
  interactiveBattleCard?: BattleCardWidgetData;
  interactiveQuizRouter?: QuizRouterWidgetData;
  interactiveHabitSimulator?: HabitSimulatorWidgetData;
  interactiveQaColumn?: InteractiveQAColumnData;
  interactiveEventListing?: InteractiveEventListingData;
  interactiveGlossaryDictionary?: InteractiveGlossaryDictionaryData;
  disclaimerType?: 'none' | 'medical_psychology' | 'financial' | 'legal' | 'academic' | 'custom';
  customDisclaimerText?: string;
}

export interface BattleOption {
  name: string;
  badge: string;
  image: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  bestFor: string;
  rating: number; // 0-5
}

export interface BattleCardWidgetData {
  widgetTitle: string;
  widgetDescription: string;
  comparisonCriteria: string[];
  optionA: BattleOption;
  optionB: BattleOption;
  verdictTitle: string;
  verdictContent: string;
}

export interface QuizRouterOutcome {
  id: string;
  title: string;
  description: string;
  actionSteps: string[];
  badgeColor: string;
}

export interface QuizRouterOption {
  text: string;
  targetOutcomeId: string;
}

export interface QuizRouterQuestion {
  id: string;
  text: string;
  options: QuizRouterOption[];
}

export interface QuizRouterWidgetData {
  widgetTitle: string;
  widgetDescription: string;
  questions: QuizRouterQuestion[];
  outcomes: QuizRouterOutcome[];
}

export interface HabitTask {
  id: string;
  label: string;
  impactScore: number; // positive or negative
  cue: string;
  response: string;
  reward: string;
}

export interface HabitSimulatorWidgetData {
  widgetTitle: string;
  widgetDescription: string;
  baselineScore: number;
  habits: HabitTask[];
  habitTips: string[];
}

export interface TimelinePhase {
  id: string;
  label: string;
  timeLabel: string;
  fase: string;
  kondisi_biologis_anak: string;
  tantangan_orang_tua: string;
  visual_hex_color: string;
  langkah_transisi_damai: string[];
}

export interface TimelineSliderWidgetData {
  widgetTitle: string;
  widgetDescription: string;
  phases: TimelinePhase[];
}

export interface InteractiveRecommendation {
  judul: string;
  deskripsi: string;
  langkah_implementasi: string[];
  tips_tambahan: string;
  visual_hex_color: string;
}

export interface InteractiveConfiguratorCriterion {
  id: string;
  name: string;
  placeholder?: string;
  options: string[];
}

export interface InteractiveConfiguratorRecommendation {
  title: string;
  category?: string;
  recommendation: string;
  [key: string]: any;
}

export interface InteractiveConfiguratorData {
  title?: string;
  description?: string;
  criteria: InteractiveConfiguratorCriterion[];
  recommendations: InteractiveConfiguratorRecommendation[] | any;
  // Backwards compatibility legacy fields
  criterion1Name?: string;
  criterion1Options?: string[];
  criterion2Name?: string;
  criterion2Options?: string[];
  criterion3Name?: string;
  criterion3Options?: string[];
}

export interface CorePillar {
  id?: string;
  title: string;
  icon: string; // Lucide icon name
  desc: string; // Short desc for left tab
  longDesc: string; // Long desc for right panel
  content?: string; // Backwards compatibility content
  challenge: string; // Daily tactical challenge
  tips: string[]; // List of practical tips
  challengeTitle?: string;
  footnote?: string;
  methodology?: string;
}

export interface InteractiveShowcaseData {
  title?: string;
  description?: string;
  pillars: CorePillar[];
}

export interface RadarAxis {
  id: string;          // e.g. 'axis_1', 'kesabaran'
  label: string;       // e.g. 'Kesabaran'
  defaultValue: number; // Scale 1 - 10
}

export interface RadarProfileResult {
  profileName: string;         // Profiling title
  minScores?: Record<string, number>; // Minimum score boundaries for each axis (key: axis.id, value: minimum score)
  description: string;         // Analysis text
  primaryStrength: string;     // Key strength
  criticalWeakness: string;    // Key weakness
  actionSteps: string[];       // Action recommendations
  cardThemeHex?: string;       // Custom pastel background
}

export interface RadarWidgetConfig {
  widgetTitle: string;         // Main title
  widgetDescription: string;   // Short description
  axes: RadarAxis[];           // 5-6 dimensions
  profiles: RadarProfileResult[]; // Logic mapping for profiling results
}

export interface AutoLink {
  id: number;
  keyword: string;
  targetUrl: string;
  description?: string;
  clickCount: number;
  createdAt?: string;
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token?: string;
}

export interface SEOInfo {
  title: string;
  description: string;
  ogImage: string;
  canonicalUrl: string;
  keywords: string[];
}

export interface DatabaseTableInfo {
  name: string;
  rowCount: number;
  description?: string;
  columns?: string[];
}

export interface DatabaseDumpOptions {
  tables: string[];
  includeSchema: boolean;
  includeData: boolean;
  insertMode: 'INSERT OR REPLACE INTO' | 'INSERT INTO';
  addDropTable: boolean;
  format: 'sql' | 'json';
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  category: string;
}

export interface QuizWidgetConfig {
  widgetTitle: string;
  widgetDescription: string;
  baseScore: number;
  pointsPerCorrect: number;
  questions: QuizQuestion[];
}

export interface QAColumnCase {
  id: string;
  category: string;
  title: string;
  senderAgeGender?: string;
  questionText: string;
  expertName: string;
  expertTitle: string;
  expertAvatar?: string;
  analysisMarkdown: string;
  adviceSteps: string[];
  createdAt?: string;
}

export interface InteractiveQAColumnData {
  widgetTitle: string;
  widgetDescription: string;
  buttonText: string;
  cases: QAColumnCase[];
  submissionPlaceholder?: string;
}

export type EventTimezone = 'WIB' | 'WITA' | 'WIT' | 'UTC';
export type EventFormat = 'online' | 'offline' | 'hybrid';
export type EventQuotaStatus = 'early_bird' | 'open' | 'limited' | 'sold_out' | 'closed';

export interface EventSpeaker {
  name: string;
  role: string;
  avatar?: string;
  bio?: string;
}

export interface EventScheduleItem {
  time: string;
  topic: string;
  speaker?: string;
}

export interface InteractiveEventListingData {
  eventTitle: string;
  eventType: 'webinar' | 'workshop' | 'seminar' | 'conference' | 'live_qa';
  eventFormat: EventFormat;
  startDate: string; // ISO date string or "YYYY-MM-DDTHH:mm"
  endDate: string;   // ISO date string or "YYYY-MM-DDTHH:mm"
  timezone: EventTimezone;
  locationName: string; // e.g. "Zoom Webinar Room" or "Ballroom Hotel Indonesia"
  locationAddress?: string; // Physical address
  mapUrl?: string; // Google Maps URL
  onlineJoinUrl?: string; // Direct Zoom / Google Meet URL
  quotaStatus: EventQuotaStatus;
  quotaCapacity?: number;
  quotaRegistered?: number;
  price: string; // e.g. "Gratis (Free)" or "Rp 150.000"
  originalPrice?: string; // e.g. "Rp 250.000" (for strike-through in early bird)
  registrationUrl?: string; // Google Forms / Website / WA Link
  registrationCtaText?: string; // e.g. "Daftar Sekarang (Gratis)"
  registrationDeadline?: string;
  speakers: EventSpeaker[];
  agenda?: EventScheduleItem[];
  benefits?: string[];
  contactPersonPhone?: string; // WhatsApp number
  contactPersonName?: string;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  whatsappNumber: string;
  qrisImageUrl?: string;
  bankInfo?: string;
  paymentMode?: 'all' | 'qris' | 'bank' | 'third_party' | 'whatsapp';
  thirdPartyCheckoutUrl?: string;
  status: 'available' | 'sold';
  createdAt?: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  slug: string;
  letter: string;
  shortDefinition: string;
  longDefinition?: string;
  aliases?: string[];
  relatedTermIds?: string[];
  category?: string;
  examples?: string[];
  sources?: string[];
  seoKeywords?: string[];
  isPublished?: boolean;
}

export interface InteractiveGlossaryDictionaryData {
  widgetTitle: string;
  widgetDescription: string;
  emptyStateText?: string;
  searchPlaceholder?: string;
  tooltipEnabled?: boolean;
  autoLinkEnabled?: boolean;
  autoLinkMaxPerTerm?: number;
  minTermLength?: number;
  caseSensitive?: boolean;
  terms: GlossaryTerm[];
}
