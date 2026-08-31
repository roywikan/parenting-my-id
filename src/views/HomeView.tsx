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

  const filteredPosts = useMemo(() => {
    return publishedPosts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.toLowerCase().includes(searchQuery.toLowerCase());
      
      const targetCat = activeCategory.toLowerCase();
      const matchesCategory =
        targetCat === 'semua' ||
        post.category.toLowerCase().includes(targetCat) ||
        (targetCat === 'kesehatan & gizi' && (post.category.toLowerCase().includes('kesehatan') || post.category.toLowerCase().includes('gizi'))) ||
        (targetCat === 'tumbuh kembang' && post.category.toLowerCase().includes('tumbuh'));

      return matchesSearch && matchesCategory;
    });
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
