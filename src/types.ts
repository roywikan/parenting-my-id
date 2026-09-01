export type UserRole = 'admin' | 'writer';

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
  | 'knowledge_base';

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
  comment_engine_mode?: 'both' | 'native' | 'cusdis' | 'none';
  admin_login_title?: string;
  admin_login_subtitle?: string;
  admin_login_btn_text?: string;
  mobile_admin_btn_label?: string;
  mobile_show_logged_username?: boolean;
  active_theme_preset?: string;
  site_domain?: string;
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

  // Performance Metric Box (Customizable by Admin)
  show_performance_box?: boolean;
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
  
  // AdSense & Strategic Ad Placements
  enable_adsense?: boolean;
  adsense_client_id?: string;
  adsense_header_top?: string;
  adsense_article_top?: string;
  adsense_article_middle?: string;
  adsense_article_bottom?: string;
  adsense_sidebar?: string;
  adsense_sticky_footer?: string;

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

  // Model 10: Knowledge Base
  kb_badge_text?: string;
  kb_title?: string;
  kb_subtitle?: string;
  kb_search_placeholder?: string;
  kb_helpdesk_whatsapp?: string;
}

export type PostStatus = 'draft' | 'published';

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
  coAuthors?: User[];
  revisions?: PostRevision[];

  status: PostStatus;
  metaTitle?: string;
  metaDescription?: string;
  tags: string;
  views: number;
  createdAt: string;
  updatedAt: string;
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
