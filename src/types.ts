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

export interface SiteConfig {
  site_name: string;
  site_tagline: string;
  site_description: string;
  site_logo_url: string;
  site_logo_icon: string;
  site_favicon_url: string;
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
  hero_badge_text?: string;
  autolink_ticker_label?: string;
  footer_autolink_label?: string;
  footer_badge_1?: string;
  footer_badge_2?: string;
  footer_badge_3?: string;

  // Performance Metric Box (Customizable by Admin)
  show_performance_box?: boolean;
  metric1_value?: string;
  metric1_label?: string;
  metric2_value?: string;
  metric2_label?: string;
  metric3_value?: string;
  metric3_label?: string;
  
  // AdSense & Strategic Ad Placements
  enable_adsense?: boolean;
  adsense_client_id?: string;
  adsense_header_top?: string;
  adsense_article_top?: string;
  adsense_article_middle?: string;
  adsense_article_bottom?: string;
  adsense_sidebar?: string;
  adsense_sticky_footer?: string;
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
