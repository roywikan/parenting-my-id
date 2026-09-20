import { useState, useMemo } from 'react';
import { Post, AutoLink, SiteConfig, Product } from '../types';
import SEOHelper from '../components/SEOHelper';
import { MAIN_CATEGORIES } from '../lib/categories';

// Import all Layout Modes
import DefaultHomeLayout from '../components/home_layouts/DefaultHomeLayout';
import EventHomeLayout from '../components/home_layouts/EventHomeLayout';
import CampaignHomeLayout from '../components/home_layouts/CampaignHomeLayout';
import MicrositeHomeLayout from '../components/home_layouts/MicrositeHomeLayout';
import PortfolioHomeLayout from '../components/home_layouts/PortfolioHomeLayout';
import PersonalBrandingHomeLayout from '../components/home_layouts/PersonalBrandingHomeLayout';
import CorporateHomeLayout from '../components/home_layouts/CorporateHomeLayout';
import ProductLandingHomeLayout from '../components/home_layouts/ProductLandingHomeLayout';
import ClassifiedAdsHomeLayout from '../components/home_layouts/ClassifiedAdsHomeLayout';
import KnowledgeBaseHomeLayout from '../components/home_layouts/KnowledgeBaseHomeLayout';

interface HomeViewProps {
  posts: Post[];
  products?: Product[];
  autolinks: AutoLink[];
  onSelectPost: (slug: string) => void;
  onSelectProduct?: (slug: string) => void;
  selectedCategory?: string;
  onSelectCategory: (category: string) => void;
  siteConfig?: SiteConfig;
  selectedTag?: string;
  onSelectTag?: (tag: string) => void;
}

export default function HomeView({
  posts,
  products = [],
  autolinks,
  onSelectPost,
  onSelectProduct,
  selectedCategory: propSelectedCategory,
  onSelectCategory,
  siteConfig,
  selectedTag = '',
  onSelectTag,
}: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalCategory, setInternalCategory] = useState<string>('Semua');

  const activeCategory = propSelectedCategory !== undefined ? propSelectedCategory : internalCategory;

  const handleCategoryChange = (cat: string) => {
    setInternalCategory(cat);
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
  };

  const isFilteredCategory = activeCategory !== 'Semua';
  const categoryItem = MAIN_CATEGORIES.find(c => c.name.toLowerCase() === activeCategory.toLowerCase());
  const categorySpecificDesc = categoryItem?.description;

  const isTagPage = !!selectedTag;
  const isAllTagsPage = selectedTag === 'all-tags';
  const displayTagName = selectedTag && !isAllTagsPage 
    ? selectedTag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  const defaultSiteName = siteConfig?.site_name || 'Blog Engine';
  const metaTitle = isTagPage
    ? (isAllTagsPage 
        ? `Daftar Semua Tag & Topik Artikel - ${defaultSiteName}`
        : `Artikel Tag #${displayTagName} - ${defaultSiteName}`)
    : (isFilteredCategory
        ? `Artikel Kategori ${activeCategory} - ${defaultSiteName}`
        : siteConfig?.seo_meta_title || (siteConfig?.site_name ? `${siteConfig.site_name} - ${siteConfig.site_tagline || 'Informasi & Wawasan'}` : defaultSiteName));

  const metaDesc = isTagPage
    ? (isAllTagsPage
        ? `Temukan seluruh indeks tag topik dan pembahasan artikel lengkap di ${defaultSiteName}.`
        : `Kumpulan artikel edukatif, tips, dan panduan terbaik yang ditandai dengan tag #${displayTagName} di ${defaultSiteName}.`)
    : (isFilteredCategory
        ? (categorySpecificDesc 
            ? `${categorySpecificDesc} Temukan kumpulan artikel, tips, dan panduan ${activeCategory.toLowerCase()} pilihan di ${defaultSiteName}.`
            : `Kumpulan artikel edukasi dan panduan pilihan seputar ${activeCategory} di ${defaultSiteName}.`)
        : siteConfig?.seo_meta_description || siteConfig?.site_description || `Portal informasi dan artikel terpercaya di ${defaultSiteName}.`);
  const ogImage = siteConfig?.seo_default_og_image || 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?q=15&w=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

  const publishedPosts = useMemo(() => {
    return posts.filter((p) => p.status === 'published');
  }, [posts]);

  const matchingProducts = useMemo(() => {
    if (!searchQuery || !searchQuery.trim() || !products || products.length === 0) {
      return [];
    }
    const s = searchQuery.toLowerCase().trim();
    return products.filter((prod) => {
      const titleMatch = (prod.title || '').toLowerCase().includes(s);
      const descMatch = (prod.description || '').toLowerCase().includes(s);
      const slugMatch = (prod.slug || '').toLowerCase().includes(s);
      const bankMatch = (prod.bankInfo || '').toLowerCase().includes(s);
      return titleMatch || descMatch || slugMatch || bankMatch;
    });
  }, [products, searchQuery]);

  const categories = ['Semua', 'Pola Asuh', 'Tumbuh Kembang', 'Kesehatan & Gizi', 'Balita'];

  const { filteredPosts, isKeywordMatchFallback, isLatestFallback, fallbackPosts } = useMemo(() => {
    const targetCat = activeCategory.trim();
    const targetCatLower = targetCat.toLowerCase();
    const searchLower = searchQuery.toLowerCase().trim();

    // Tag filtering overrides normal list
    if (selectedTag) {
      if (selectedTag === 'all-tags') {
        return {
          filteredPosts: publishedPosts,
          isKeywordMatchFallback: false,
          isLatestFallback: false,
          fallbackPosts: publishedPosts.slice(0, 4),
        };
      }
      const tagLower = selectedTag.toLowerCase().trim();
      const tagFiltered = publishedPosts.filter((post) => {
        const postTags = (post.tags || '').toLowerCase().split(',').map((t) => t.trim());
        return postTags.includes(tagLower) || postTags.some((pt) => pt.includes(tagLower) || tagLower.includes(pt));
      });
      return {
        filteredPosts: tagFiltered,
        isKeywordMatchFallback: false,
        isLatestFallback: false,
        fallbackPosts: publishedPosts.slice(0, 4),
      };
    }

    // 1. Direct Category Matching
    let directMatches = publishedPosts;
    if (targetCatLower !== 'semua') {
      directMatches = publishedPosts.filter((post) => {
        const postCatLower = post.category.toLowerCase();
        return (
          postCatLower === targetCatLower ||
          postCatLower.includes(targetCatLower) ||
          (targetCatLower === 'kesehatan & gizi' && (postCatLower.includes('kesehatan') || postCatLower.includes('gizi'))) ||
          (targetCatLower === 'tumbuh kembang' && postCatLower.includes('tumbuh'))
        );
      });
    }

    // 2. Apply Search Query if present
    if (searchLower) {
      const pool = targetCatLower === 'semua' ? publishedPosts : directMatches;
      const searchFiltered = pool.filter((post) => {
        const titleMatch = (post.title || '').toLowerCase().includes(searchLower);
        const excerptMatch = (post.excerpt || '').toLowerCase().includes(searchLower);
        const tagsMatch = (post.tags || '').toLowerCase().includes(searchLower);
        const catMatch = (post.category || '').toLowerCase().includes(searchLower);
        const contentMatch = (post.contentMarkdown || (post as any).content || '').toLowerCase().includes(searchLower);
        return titleMatch || excerptMatch || tagsMatch || catMatch || contentMatch;
      });
      return {
        filteredPosts: searchFiltered,
        isKeywordMatchFallback: false,
        isLatestFallback: false,
        fallbackPosts: publishedPosts.slice(0, 4),
      };
    }

    // If direct category matches exist or category is 'Semua'
    if (targetCatLower === 'semua' || directMatches.length > 0) {
      return {
        filteredPosts: directMatches,
        isKeywordMatchFallback: false,
        isLatestFallback: false,
        fallbackPosts: publishedPosts.slice(0, 4),
      };
    }

    // 3. Direct Category Match failed (0 matches for targetCat e.g. "Admin", "Admi1223", "UnmappedCategory")
    // Extract keywords from URL / category name
    const rawKeywords = targetCatLower
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .map((k) => k.trim())
      .filter((k) => k.length >= 2);

    const keywordMatches = publishedPosts.filter((post) => {
      const fullText = `${post.title} ${post.excerpt} ${post.content} ${post.tags} ${post.category}`.toLowerCase();
      return rawKeywords.some((kw) => fullText.includes(kw));
    });

    if (keywordMatches.length > 0) {
      // Return top 4 keyword matched articles
      return {
        filteredPosts: keywordMatches.slice(0, 4),
        isKeywordMatchFallback: true,
        isLatestFallback: false,
        fallbackPosts: publishedPosts.slice(0, 4),
      };
    }

    // 4. Keyword matches also 0 (e.g. "admin", "admi1223")
    // Fallback to top 4 latest published articles so website never appears empty!
    return {
      filteredPosts: publishedPosts.slice(0, 4),
      isKeywordMatchFallback: false,
      isLatestFallback: true,
      fallbackPosts: publishedPosts.slice(0, 4),
    };
  }, [publishedPosts, searchQuery, activeCategory]);

  const displayMode = siteConfig?.homepage_display_mode || 'default';

  const renderLayout = () => {
    switch (displayMode) {
      case 'event':
        return (
          <EventHomeLayout
            posts={publishedPosts}
            onSelectPost={onSelectPost}
            siteConfig={siteConfig}
          />
        );
      case 'campaign':
        return (
          <CampaignHomeLayout
            posts={publishedPosts}
            onSelectPost={onSelectPost}
            siteConfig={siteConfig}
          />
        );
      case 'microsite':
        return (
          <MicrositeHomeLayout
            posts={publishedPosts}
            onSelectPost={onSelectPost}
            siteConfig={siteConfig}
          />
        );
      case 'portfolio':
        return (
          <PortfolioHomeLayout
            posts={publishedPosts}
            onSelectPost={onSelectPost}
            siteConfig={siteConfig}
          />
        );
      case 'personal_branding':
        return (
          <PersonalBrandingHomeLayout
            posts={publishedPosts}
            onSelectPost={onSelectPost}
            siteConfig={siteConfig}
          />
        );
      case 'corporate':
        return (
          <CorporateHomeLayout
            posts={publishedPosts}
            onSelectPost={onSelectPost}
            siteConfig={siteConfig}
          />
        );
      case 'product_landing':
        return (
          <ProductLandingHomeLayout
            posts={publishedPosts}
            onSelectPost={onSelectPost}
            siteConfig={siteConfig}
          />
        );
      case 'classified_ads':
        return (
          <ClassifiedAdsHomeLayout
            posts={publishedPosts}
            onSelectPost={onSelectPost}
            siteConfig={siteConfig}
          />
        );
      case 'knowledge_base':
        return (
          <KnowledgeBaseHomeLayout
            posts={publishedPosts}
            onSelectPost={onSelectPost}
            siteConfig={siteConfig}
          />
        );
      case 'default':
      default:
        return (
          <DefaultHomeLayout
            posts={posts}
            autolinks={autolinks}
            onSelectPost={onSelectPost}
            onSelectProduct={onSelectProduct}
            selectedCategory={activeCategory}
            onSelectCategory={handleCategoryChange}
            siteConfig={siteConfig}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredPosts={filteredPosts}
            matchingProducts={matchingProducts}
            categories={categories}
            isKeywordMatchFallback={isKeywordMatchFallback}
            isLatestFallback={isLatestFallback}
            fallbackPosts={fallbackPosts}
          />
        );
    }
  };

  return (
    <div>
      <SEOHelper
        title={metaTitle}
        description={metaDesc}
        ogImage={ogImage}
        canonicalUrl={typeof window !== 'undefined' ? window.location.href : (siteConfig?.site_url || '/')}
        type="website"
        siteName={siteConfig?.site_name || 'Website'}
        siteLogo={siteConfig?.site_logo_url || siteConfig?.site_logo_icon || ''}
        articleData={{
          type: 'website',
          siteName: siteConfig?.site_name || 'Website',
          locale: 'id_ID',
        }}
        posts={posts}
      />
      
      {selectedTag && (
        <div className="max-w-7xl mx-auto mb-6 p-6 rounded-3xl bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-transparent border border-rose-200/40 dark:border-rose-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 text-white text-[10px] font-black tracking-wider uppercase animate-pulse">
              Halaman Tag Arsip
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Menampilkan Artikel dengan Tag:</span>
              <span className="text-rose-600 dark:text-rose-400 font-mono">#{selectedTag === 'all-tags' ? 'Semua Topik' : displayTagName}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedTag === 'all-tags' 
                ? 'Menjelajahi indeks kata kunci pengasuhan anak yang dibahas.'
                : `Temukan tulisan, tips, dan panduan praktis bertema #${displayTagName} untuk mengoptimalkan potensi buah hati.`}
            </p>
          </div>
          <button
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Semua');
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="self-start sm:self-center px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold transition-all shadow-xs hover:shadow-md hover:scale-105 active:scale-95"
          >
            Lihat Semua Artikel &rarr;
          </button>
        </div>
      )}

      {renderLayout()}
    </div>
  );
}
