import { useEffect } from 'react';
import { optimizeUnsplashUrl, getUnsplashSrcSet } from '../lib/imageUtils';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  ogImage?: string;
  canonicalUrl?: string;
  type?: string;
  authorName?: string;
  authorRole?: string;
  datePublished?: string;
  dateModified?: string;
  category?: string;
  keywords?: string[];
  contentMarkdown?: string;
  siteName?: string;
  siteLogo?: string;
  articleData?: any;
}

export default function SEOHelper({
  title,
  description,
  image,
  ogImage,
  canonicalUrl = 'https://parenting.my.id',
  type = 'article',
  authorName = 'Tim Redaksi Parenting.my.id',
  authorRole = 'Editor & Pakar Pengasuhan',
  datePublished,
  dateModified,
  category = 'Parenting',
  keywords = [],
  contentMarkdown = '',
  siteName = 'Parenting.my.id',
  siteLogo = 'https://parenting.my.id/favicon-32x32.png',
  articleData,
}: SEOProps) {
  const finalImage = ogImage || image || 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80';
  useEffect(() => {
    // 1. Document Title
    document.title = title;

    // Helper function to set or update meta tags
    const updateMeta = (selector: string, content: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (selector.startsWith('meta[name=')) {
          const name = selector.match(/name="([^"]+)"/)?.[1];
          if (name) el.setAttribute('name', name);
        } else if (selector.startsWith('meta[property=')) {
          const prop = selector.match(/property="([^"]+)"/)?.[1];
          if (prop) el.setAttribute('property', prop);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    updateMeta('meta[name="description"]', description);
    updateMeta('meta[name="keywords"]', keywords.join(', '));
    updateMeta('meta[name="author"]', authorName);

    const optimizedOgImage = optimizeUnsplashUrl(finalImage, 1200, 75, 'webp', 630);

    // 3. OpenGraph Meta Tags
    updateMeta('meta[property="og:title"]', title);
    updateMeta('meta[property="og:description"]', description);
    updateMeta('meta[property="og:image"]', optimizedOgImage);
    updateMeta('meta[property="og:type"]', type);
    updateMeta('meta[property="og:site_name"]', siteName);
    updateMeta('meta[property="og:url"]', canonicalUrl);
    updateMeta('meta[property="og:locale"]', 'id_ID');

    if (datePublished) {
      updateMeta('meta[property="article:published_time"]', datePublished);
    }
    if (dateModified || datePublished) {
      updateMeta('meta[property="article:modified_time"]', dateModified || datePublished || '');
    }
    updateMeta('meta[property="article:section"]', category);
    if (keywords.length > 0) {
      updateMeta('meta[property="article:tag"]', keywords.join(', '));
    }

    // 4. Twitter Card Meta Tags
    updateMeta('meta[name="twitter:card"]', 'summary_large_image');
    updateMeta('meta[name="twitter:title"]', title);
    updateMeta('meta[name="twitter:description"]', description);
    updateMeta('meta[name="twitter:image"]', optimizedOgImage);

    // 5. Canonical Link & Alternate Hreflang & LCP Image Preload Tags
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonicalUrl);

    let hreflangEl = document.querySelector('link[rel="alternate"][hreflang="id-ID"]');
    if (!hreflangEl) {
      hreflangEl = document.createElement('link');
      hreflangEl.setAttribute('rel', 'alternate');
      hreflangEl.setAttribute('hreflang', 'id-ID');
      document.head.appendChild(hreflangEl);
    }
    hreflangEl.setAttribute('href', canonicalUrl);

    if (image) {
      const heroImageSrc = optimizeUnsplashUrl(image, 700, 55, 'webp');
      const heroSrcSet = getUnsplashSrcSet(image, [400, 700], 55, 'webp');

      let preloadEl = document.querySelector('link[rel="preload"][as="image"]');
      if (!preloadEl) {
        preloadEl = document.createElement('link');
        preloadEl.setAttribute('rel', 'preload');
        preloadEl.setAttribute('as', 'image');
        preloadEl.setAttribute('fetchpriority', 'high');
        document.head.appendChild(preloadEl);
      }
      preloadEl.setAttribute('href', heroImageSrc);
      if (heroSrcSet) {
        preloadEl.setAttribute('imagesrcset', heroSrcSet);
        preloadEl.setAttribute('imagesizes', '(max-width: 1024px) 100vw, 700px');
      }
    }

    // 6. JSON-LD Structured Data Schema Injection
    const injectJsonLd = (id: string, jsonObj: object) => {
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonObj, null, 2);
    };

    // A. Article Schema
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
      'headline': title,
      'description': description,
      'image': [image],
      'datePublished': datePublished || new Date().toISOString(),
      'dateModified': dateModified || datePublished || new Date().toISOString(),
      'author': {
        '@type': 'Person',
        'name': authorName,
        'jobTitle': authorRole,
      },
      'publisher': {
        '@type': 'Organization',
        'name': siteName,
        'logo': {
          '@type': 'ImageObject',
          'url': siteLogo,
        },
      },
      'articleSection': category,
      'keywords': keywords.join(', '),
      'inLanguage': 'id-ID',
    };
    injectJsonLd('jsonld-article-schema', articleSchema);

    // B. BreadcrumbList Schema
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Beranda',
          'item': 'https://parenting.my.id',
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': category,
          'item': `https://parenting.my.id/#${category.toLowerCase()}`,
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': title,
          'item': canonicalUrl,
        },
      ],
    };
    injectJsonLd('jsonld-breadcrumb-schema', breadcrumbSchema);

    // C. Auto FAQ Schema (Parses Q&A headings from markdown)
    if (contentMarkdown) {
      const faqItems: { question: string; answer: string }[] = [];
      const headingMatches = contentMarkdown.match(/^(##|###)\s+(.*?\?)/gm);
      if (headingMatches && headingMatches.length > 0) {
        headingMatches.forEach((match) => {
          const questionText = match.replace(/^(##|###)\s+/, '').trim();
          if (questionText) {
            faqItems.push({
              question: questionText,
              answer: `Penjelasan mengenai ${questionText} disajikan secara ringkas dan praktis dalam artikel ini.`,
            });
          }
        });
      }

      if (faqItems.length > 0) {
        const faqSchema = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': faqItems.map((item) => ({
            '@type': 'Question',
            'name': item.question,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': item.answer,
            },
          })),
        };
        injectJsonLd('jsonld-faq-schema', faqSchema);
      }
    }
  }, [
    title,
    description,
    image,
    canonicalUrl,
    type,
    authorName,
    authorRole,
    datePublished,
    dateModified,
    category,
    keywords,
    contentMarkdown,
    siteName,
    siteLogo,
  ]);

  return null;
}
