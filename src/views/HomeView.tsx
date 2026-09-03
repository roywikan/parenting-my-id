import { useState, useMemo } from 'react';
import { Post, AutoLink, SiteConfig } from '../types';
import SEOHelper from '../components/SEOHelper';

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
  autolinks: AutoLink[];
  onSelectPost: (slug: string) => void;
  selectedCategory?: string;
  onSelectCategory: (category: string) => void;
  siteConfig?: SiteConfig;
}

export default function HomeView({
  posts,
  autolinks,
  onSelectPost,
  selectedCategory: propSelectedCategory,
  onSelectCategory,
  siteConfig,
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
  const metaTitle = isFilteredCategory
    ? `Artikel Kategori ${activeCategory} - ${siteConfig?.site_name || 'Parenting.my.id'}`
    : siteConfig?.seo_meta_title || 'Parenting.my.id - Edukasi Pola Asuh & Kesehatan Anak Indonesia';
  const metaDesc = isFilteredCategory
    ? `Kumpulan artikel, tips, dan panduan seputar ${activeCategory} untuk orang tua modern.`
    : siteConfig?.seo_meta_description || 'Portal artikel parenting modern, panduan pola asuh, nutrisi balita, dan pencegahan stunting. Cepat, akurat, dan terpercaya.';
  const ogImage = siteConfig?.seo_default_og_image || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200&h=630';

  const publishedPosts = useMemo(() => {
    return posts.filter((p) => p.status === 'published');
  }, [posts]);

  const categories = ['Semua', 'Pola Asuh', 'Tumbuh Kembang', 'Kesehatan & Gizi', 'Balita'];

  const { filteredPosts, isKeywordMatchFallback, isLatestFallback, fallbackPosts } = useMemo(() => {
    const targetCat = activeCategory.trim();
    const targetCatLower = targetCat.toLowerCase();
    const searchLower = searchQuery.toLowerCase().trim();

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
      const searchFiltered = directMatches.filter((post) => {
        return (
          post.title.toLowerCase().includes(searchLower) ||
          post.excerpt.toLowerCase().includes(searchLower) ||
          post.tags.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower)
        );
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
            selectedCategory={activeCategory}
            onSelectCategory={handleCategoryChange}
            siteConfig={siteConfig}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredPosts={filteredPosts}
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
        canonicalUrl={typeof window !== 'undefined' ? window.location.href : 'https://parenting.my.id/'}
        articleData={{
          type: 'website',
          siteName: siteConfig?.site_name || 'Parenting.my.id',
          locale: 'id_ID',
        }}
      />
      {renderLayout()}
    </div>
  );
}
