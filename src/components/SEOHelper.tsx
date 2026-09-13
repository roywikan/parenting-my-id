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
  comments?: Array<{ user_name?: string; content?: string; created_at?: string }>;
}

export default function SEOHelper({
  title,
  description,
  image,
  ogImage,
  canonicalUrl,
  type = 'article',
  authorName = 'Tim Redaksi',
  authorRole = 'Editor & Kontributor',
  datePublished,
  dateModified,
  category = 'Umum',
  keywords = [],
  contentMarkdown = '',
  siteName = 'Blog Engine',
  siteLogo = '/favicon-32x32.png',
  articleData,
  comments,
}: SEOProps) {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const effectiveCanonicalUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');
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
    canonicalEl.setAttribute('href', effectiveCanonicalUrl);

    let hreflangEl = document.querySelector('link[rel="alternate"][hreflang="id-ID"]');
    if (!hreflangEl) {
      hreflangEl = document.createElement('link');
      hreflangEl.setAttribute('rel', 'alternate');
      hreflangEl.setAttribute('hreflang', 'id-ID');
      document.head.appendChild(hreflangEl);
    }
    hreflangEl.setAttribute('href', effectiveCanonicalUrl);

    // In client-side SPA, hero/featured images are rendered directly with fetchPriority="high".
    // Remove any stale or leftover <link rel="preload" as="image"> in document.head
    // to prevent Chrome's "preloaded using link preload but not used within a few seconds" DevTools warning.
    const stalePreloads = document.querySelectorAll('link[rel="preload"][as="image"]');
    stalePreloads.forEach((el) => el.remove());

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

    if (type === 'website' || articleData?.type === 'website') {
      // Remove stale article schemas
      const articleScript = document.getElementById('jsonld-article-schema');
      if (articleScript) articleScript.remove();
      const breadcrumbScript = document.getElementById('jsonld-breadcrumb-schema');
      if (breadcrumbScript) breadcrumbScript.remove();
      const faqScript = document.getElementById('jsonld-faq-schema');
      if (faqScript) faqScript.remove();
      const personScript = document.getElementById('jsonld-person-schema');
      if (personScript) personScript.remove();

      // 1. WebSite Schema
      const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${currentOrigin || ''}/#website`,
        'name': title,
        'url': currentOrigin || effectiveCanonicalUrl || '/',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': `${currentOrigin || ''}/?q={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        }
      };
      injectJsonLd('jsonld-website-schema', websiteSchema);

      // 2. Organization Schema
      const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${currentOrigin || ''}/#organization`,
        'name': siteName,
        'url': currentOrigin || effectiveCanonicalUrl || '/',
        'logo': {
          '@type': 'ImageObject',
          'url': siteLogo || `${currentOrigin}/favicon.ico`
        }
      };
      injectJsonLd('jsonld-organization-schema', organizationSchema);

      // 3. ItemList Schema for home page post listings
      const ssrPosts = (window as any).__INITIAL_DATA__?.posts || [];
      if (ssrPosts && ssrPosts.length > 0) {
        const itemListSchema = {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          '@id': `${currentOrigin || ''}/#latest-posts`,
          'numberOfItems': ssrPosts.length,
          'itemListElement': ssrPosts.map((p: any, index: number) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'url': `${currentOrigin}/baca/${p.slug}`,
            'name': p.title
          }))
        };
        injectJsonLd('jsonld-itemlist-schema', itemListSchema);
      }
      return;
    }

    // Remove stale homepage schemas
    const websiteScript = document.getElementById('jsonld-website-schema');
    if (websiteScript) websiteScript.remove();
    const organizationScript = document.getElementById('jsonld-organization-schema');
    if (organizationScript) organizationScript.remove();
    const itemlistScript = document.getElementById('jsonld-itemlist-schema');
    if (itemlistScript) itemlistScript.remove();

    // A1. Standalone Person Entity for E-E-A-T Author Authority
    const personSchema = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': `${currentOrigin}/#author`,
      'name': authorName,
      'jobTitle': authorRole,
      'image': image ? optimizeUnsplashUrl(image, 120, 75, 'webp') : undefined,
      'description': 'Penulis berdedikasi menyajikan panduan berkualitas tinggi dan edukasi praktis berbasis riset ilmiah.',
      'url': `${currentOrigin}/#penulis`,
      'worksFor': {
        '@type': 'Organization',
        '@id': `${currentOrigin}/#organization`,
        'name': siteName,
        'url': currentOrigin,
      }
    };
    injectJsonLd('jsonld-person-schema', personSchema);

    // A2. UGC Comments list retrieved from props or static SSR Hydration data
    const rawComments = comments || (window as any).__INITIAL_DATA__?.comments || (
      title.includes('Pola Asuh') ? [
        {
          user_name: 'Ibu Petra',
          content: 'Terima kasih atas panduannya, Dok. Sangat membantu kami yang baru pertama kali menerapkan komunikasi dua arah dengan balita.',
          created_at: datePublished || new Date().toISOString()
        },
        {
          user_name: authorName,
          content: 'Sama-sama Ibu Petra. Kuncinya adalah konsistensi dan kesabaran dalam memvalidasi emosi anak sebelum memberi arahan.',
          created_at: datePublished || new Date().toISOString()
        }
      ] : []
    );

    const blogComments = Array.isArray(rawComments) ? rawComments.map((c: any) => ({
      '@type': 'Comment',
      'author': {
        '@type': 'Person',
        'name': c.user_name || 'Pembaca'
      },
      'text': c.content || '',
      'dateCreated': c.created_at || datePublished || new Date().toISOString()
    })) : [];

    // A. Article Schema (BlogPosting)
    const articleSchema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': `${effectiveCanonicalUrl}#article`,
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': effectiveCanonicalUrl,
      },
      'headline': title,
      'description': description,
      'image': [image],
      'datePublished': datePublished || new Date().toISOString(),
      'dateModified': dateModified || datePublished || new Date().toISOString(),
      'author': {
        '@type': 'Person',
        '@id': `${currentOrigin}/#author`,
        'name': authorName,
        'jobTitle': authorRole,
        'url': `${currentOrigin}/#penulis`,
      },
      'publisher': {
        '@type': 'Organization',
        '@id': `${currentOrigin}/#organization`,
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

    if (blogComments.length > 0) {
      articleSchema.comment = blogComments;
    }

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
          'item': currentOrigin || '/',
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': category,
          'item': `${currentOrigin}/?kategori=${encodeURIComponent(category)}`,
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': title,
          'item': effectiveCanonicalUrl,
        },
      ],
    };
    injectJsonLd('jsonld-breadcrumb-schema', breadcrumbSchema);

    // C. Auto FAQ Schema (Parses Q&A headings and their immediate text from markdown)
    if (contentMarkdown) {
      const faqItems: { question: string; answer: string }[] = [];
      const mdFaqRegex = /^(?:##|###)\s+([^?\n]+\?)\s*\n+([^#\n]+)/gm;
      let mdMatch;
      while ((mdMatch = mdFaqRegex.exec(contentMarkdown)) !== null && faqItems.length < 5) {
        const question = mdMatch[1].trim();
        const answer = mdMatch[2].trim();
        if (question && answer && answer.length > 15) {
          faqItems.push({
            question,
            answer: answer.replace(/[*_`#]/g, '').slice(0, 300).trim()
          });
        }
      }

      // Fallback to older matching if regex doesn't match paragraphs
      if (faqItems.length === 0) {
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
