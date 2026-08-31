import { useMemo, useState, useEffect } from 'react';
import { Post, AutoLink, SiteConfig } from '../types';
import { applyAutoLinks, preprocessMarkdownLineBreaks } from '../lib/autolink';
import { marked } from 'marked';
import { Clock, Eye, Calendar, ArrowLeft, Share2, Check, Bookmark, Sparkles, MessageCircle, Twitter, Facebook, Copy, Award, CheckCircle2, Linkedin, Instagram, Globe, Users, ShieldCheck } from 'lucide-react';
import SEOHelper from '../components/SEOHelper';
import Breadcrumbs from '../components/Breadcrumbs';
import AutoTableOfContents from '../components/AutoTableOfContents';
import SmartRelatedArticles from '../components/SmartRelatedArticles';
import AdSlot from '../components/AdSlot';
import { CusdisComments } from '../components/CusdisComments';
import { optimizeUnsplashUrl, getUnsplashSrcSet, getOptimizedAvatarUrl } from '../lib/imageUtils';

interface ArticleDetailViewProps {
  slug: string;
  posts: Post[];
  autolinks: AutoLink[];
  onBack: () => void;
  onSelectPost: (slug: string) => void;
  onSelectCategory?: (category: string) => void;
  siteConfig?: SiteConfig;
  isPostsLoading?: boolean;
  onRefreshPosts?: () => Promise<void>;
}

export default function ArticleDetailView({
  slug,
  posts,
  autolinks,
  onBack,
  onSelectPost,
  onSelectCategory,
  siteConfig,
  isPostsLoading = false,
  onRefreshPosts,
}: ArticleDetailViewProps) {
  const [copied, setCopied] = useState(false);
  const [fetchedPost, setFetchedPost] = useState<Post | null>(null);
  const [isFetchingSingle, setIsFetchingSingle] = useState<boolean>(false);
  const [attemptedFetch, setAttemptedFetch] = useState<boolean>(false);

  // Reset local fetch state when slug changes
  useEffect(() => {
    setFetchedPost(null);
    setIsFetchingSingle(false);
    setAttemptedFetch(false);
  }, [slug]);

  const post = useMemo(() => {
    return posts.find((p) => p.slug === slug) || fetchedPost || undefined;
  }, [posts, slug, fetchedPost]);

  // If post is not found in props and initial load finished, try a targeted refresh
  useEffect(() => {
    if (!post && !isPostsLoading && !isFetchingSingle && !attemptedFetch) {
      setIsFetchingSingle(true);
      setAttemptedFetch(true);

      const fetchSingle = async () => {
        try {
          if (onRefreshPosts) {
            await onRefreshPosts();
          } else {
            const res = await fetch('/api/posts');
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                const found = data.find((p: Post) => p.slug === slug);
                if (found) {
                  setFetchedPost(found);
                }
              }
            }
          }
        } catch (err) {
          console.error('Error fetching post:', err);
        } finally {
          setIsFetchingSingle(false);
        }
      };

      fetchSingle();
    }
  }, [post, isPostsLoading, isFetchingSingle, attemptedFetch, slug, onRefreshPosts]);

  const [currentViews, setCurrentViews] = useState(post ? post.views : 0);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  useEffect(() => {
    if (post) {
      setCurrentViews(post.views);
      setHasTrackedView(false);
    }
  }, [post?.id, post?.views]);

  // Reader/Viewer Counter Tracking (Human reader scrolls past article midpoint)
  useEffect(() => {
    if (!post || hasTrackedView) return;

    const sessionKey = `viewed_article_${post.id}`;
    if (sessionStorage.getItem(sessionKey)) {
      setHasTrackedView(true);
      return;
    }

    const handleScroll = () => {
      // Bot detection guard
      const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
      if (isBot) return;

      const articleEl = document.getElementById('article-content-body');
      if (!articleEl) return;

      const rect = articleEl.getBoundingClientRect();
      const elementTopRelativeToWindow = rect.top + window.scrollY;
      const elementHeight = rect.height;
      const midPoint = elementTopRelativeToWindow + (elementHeight * 0.45); // 45% midpoint of content

      const currentScrollPosition = window.scrollY + window.innerHeight;

      if (currentScrollPosition >= midPoint) {
        sessionStorage.setItem(sessionKey, 'true');
        setHasTrackedView(true);

        fetch(`/api/posts/${post.id}/view`, { method: 'POST' })
          .then((res) => res.json())
          .then((data: any) => {
            if (data && typeof data.views === 'number') {
              setCurrentViews(data.views);
              post.views = data.views;
            } else {
              setCurrentViews((prev) => prev + 1);
              post.views += 1;
            }
          })
          .catch(() => {
            setCurrentViews((prev) => prev + 1);
            post.views += 1;
          });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [post, hasTrackedView]);

  // Render markdown to HTML + extract TOC items + apply Auto-Links & Heading IDs
  const { parsedHtml, tocItems } = useMemo(() => {
    if (!post) return { parsedHtml: '', tocItems: [] };

    const preparedMd = preprocessMarkdownLineBreaks(post.contentMarkdown);
    let rawHtml = marked.parse(preparedMd, { async: false, gfm: true, breaks: true }) as string;
    const items: { id: string; text: string; level: number }[] = [];

    // Inject id attributes into <h2> and <h3> tags for TOC scrolling, and build tocItems
    rawHtml = rawHtml.replace(/<(h[23])>(.*?)<\/\1>/gi, (match, tag, content) => {
      const cleanText = content.replace(/<[^>]+>/g, '').trim();

      // Safety check: headings must be reasonable in length (e.g. <= 120 chars)
      if (!cleanText || cleanText.length > 120) {
        return match;
      }

      const level = tag.toLowerCase() === 'h2' ? 2 : 3;
      const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Avoid duplicates in TOC
      if (!items.some((item) => item.id === id)) {
        items.push({ id, text: cleanText, level });
      }

      return `<${tag} id="${id}" class="scroll-mt-24">${content}</${tag}>`;
    });

    const finalHtml = applyAutoLinks(rawHtml, autolinks);
    return { parsedHtml: finalHtml, tocItems: items };
  }, [post, autolinks]);

  // Handle Autolink Clicks inside article body
  useEffect(() => {
    const handleAutolinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.getAttribute('href')?.startsWith('/baca/')) {
        e.preventDefault();
        const targetSlug = target.getAttribute('href')?.replace('/baca/', '');
        if (targetSlug) {
          onSelectPost(targetSlug);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    document.addEventListener('click', handleAutolinkClick);
    return () => document.removeEventListener('click', handleAutolinkClick);
  }, [onSelectPost]);

  // 1. Loading State (Data fetching in progress)
  if (!post && (isPostsLoading || isFetchingSingle)) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-pulse min-h-[900px]">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>

        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-28 bg-rose-200 dark:bg-rose-950/40 rounded-full" />
          <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-8 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="flex items-center gap-4 pt-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
          </div>
        </div>

        {/* Featured Image Skeleton */}
        <div className="w-full aspect-[16/9] max-h-[480px] rounded-3xl bg-slate-200 dark:bg-slate-800" />

        {/* Content Skeleton Lines */}
        <div className="space-y-4 pt-4">
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-11/12 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-4/5 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  // 2. Not Found State (Data fetching completed and post truly does not exist)
  if (!post) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4 min-h-[500px]">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Artikel Tidak Ditemukan</h2>
        <p className="text-slate-600 dark:text-slate-400">Artikel dengan slug "{slug}" mungkin telah dihapus atau dipindahkan.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs inline-flex items-center gap-2 hover:bg-rose-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </button>
      </div>
    );
  }

  const articleUrl = `https://parenting.my.id/baca/${post.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(articleUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const relatedPosts = posts.filter((p) => p.slug !== post.slug && p.status === 'published').slice(0, 2);

  return (
    <article className="max-w-4xl mx-auto space-y-8 pb-16 min-h-[900px]">
      <SEOHelper
        title={`${post.title} | Parenting.my.id`}
        description={post.metaDescription || post.excerpt}
        image={post.featuredImage}
        canonicalUrl={articleUrl}
        type="article"
        authorName={post.authorName || 'Dr. Ratna Sari, M.Psi'}
        authorRole={post.authorTitle || 'Spesialis Psikologi Anak & Praktisi Parenting'}
        datePublished={post.createdAt}
        dateModified={post.updatedAt || post.createdAt}
        category={post.category || 'Parenting'}
        keywords={post.tags ? post.tags.split(',').map((t) => t.trim()) : []}
        contentMarkdown={post.contentMarkdown}
        siteName={siteConfig?.site_name || 'Parenting.my.id'}
        siteLogo={siteConfig?.site_logo_icon || 'https://parenting.my.id/favicon-32x32.png'}
      />

      {/* BREADCRUMB & BACK NAVIGATION */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-secondary text-slate-500">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 font-medium transition-colors text-xs sm:text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>

        <Breadcrumbs
          items={[
            {
              label: post.category || 'Artikel',
              onClick: () => {
                if (onSelectCategory && post.category) {
                  onSelectCategory(post.category);
                } else {
                  onBack();
                }
              },
            },
            { label: post.title, active: true },
          ]}
        />
      </div>

      {/* ARTICLE HEADER */}
      <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onSelectCategory && post.category) {
                onSelectCategory(post.category);
              } else {
                onBack();
              }
            }}
            className="px-3.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-black text-xs transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
          >
            {post.category}
          </button>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {post.title}
        </h1>

        <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed italic border-l-4 border-rose-600 pl-4 py-1 bg-rose-50/70 dark:bg-slate-800/60 rounded-r-xl font-medium">
          "{post.excerpt}"
        </p>

        {/* AUTHOR & METADATA BAR (WITH MULTI-AUTHOR DISPLAY) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-4">
            {/* Primary Author */}
            <div className="flex items-center gap-3">
              <img
                src={getOptimizedAvatarUrl(post.authorAvatar, 60, 60)}
                alt={post.authorName}
                width={40}
                height={40}
                decoding="async"
                className="w-10 h-10 rounded-full object-cover border-2 border-rose-400 shadow-2xs"
              />
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                  <span>{post.authorName || 'Dr. Ratna Sari, M.Psi'}</span>
                </div>
                <div className="text-[11px] text-rose-800 dark:text-rose-300 font-bold">
                  {post.authorTitle || 'Spesialis Psikologi Anak & Praktisi Parenting'}
                </div>
              </div>
            </div>

            {/* Co-Authors Header Badges */}
            {post.coAuthors && post.coAuthors.length > 0 && (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700">
                <Users className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Co-Author:</span>
                <div className="flex -space-x-2 overflow-hidden">
                  {post.coAuthors.map((co) => (
                    <img
                      key={co.id}
                      src={getOptimizedAvatarUrl(co.avatar, 60, 60)}
                      alt={co.name}
                      title={`${co.name} (${co.title || 'Co-Author'})`}
                      width={28}
                      height={28}
                      decoding="async"
                      className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {post.coAuthors.map(c => c.name).join(', ')}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300 font-semibold text-xs">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              {new Date(post.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              {post.readTimeMinutes} Mnt Baca
            </span>
            <span>•</span>
            <span className="flex items-center gap-1" title="Pertambahan terbaca dihitung setelah pembaca melihat hingga pertengahan artikel">
              <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              {currentViews} Dibaca
            </span>
          </div>
        </div>
      </header>

      {/* FEATURED IMAGE (LCP OPTIMIZED - ZERO CLS) */}
      <div className="w-full aspect-[16/9] max-h-[480px] rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
        <img
          src={optimizeUnsplashUrl(post.featuredImage, 700, 55)}
          srcSet={getUnsplashSrcSet(post.featuredImage, [400, 700], 55)}
          sizes="(max-width: 1024px) 100vw, 700px"
          alt={post.title}
          width={700}
          height={394}
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>

      {/* STRATEGIC AD PLACEMENT: IN-ARTICLE TOP */}
      <AdSlot
        code={siteConfig?.adsense_article_top}
        enableAdsense={siteConfig?.enable_adsense}
        slotLabel="IN-ARTICLE TOP (HIGH CTR)"
      />

      {/* TABLE OF CONTENTS (IF HEADINGS EXIST) */}
      <AutoTableOfContents items={tocItems} />

      {/* STRATEGIC AD PLACEMENT: IN-ARTICLE MIDDLE */}
      <AdSlot
        code={siteConfig?.adsense_article_middle}
        enableAdsense={siteConfig?.enable_adsense}
        slotLabel="IN-ARTICLE MIDDLE (HIGH CTR)"
      />

      {/* ARTICLE CONTENT BODY WITH AUTO-LINKING */}
      <div
        id="article-content-body"
        className="article-body prose prose-rose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 space-y-4"
        dangerouslySetInnerHTML={{ __html: parsedHtml }}
      />

      {/* STRATEGIC AD PLACEMENT: IN-ARTICLE BOTTOM */}
      <AdSlot
        code={siteConfig?.adsense_article_bottom}
        enableAdsense={siteConfig?.enable_adsense}
        slotLabel="IN-ARTICLE BOTTOM (MATCHED CONTENT)"
      />

      {/* TAGS & SHARE SECTION */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* TAGS */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Topik Utama:</span>
            <div className="flex flex-wrap gap-1.5">
              {post.tags.split(',').map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* SHARE BUTTONS */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5" /> Bagikan:
            </span>
            
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + ' ' + articleUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
              title="Bagikan ke WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 hover:bg-blue-100 transition-colors"
              title="Bagikan ke Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>

            <button
              onClick={() => {
                navigator.clipboard.writeText(`${post.title} - ${articleUrl}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
                window.open('https://www.instagram.com', '_blank');
              }}
              className="p-2 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/60 dark:text-pink-400 hover:bg-pink-100 transition-colors"
              title="Bagikan ke Instagram (Salin link & buka Instagram)"
            >
              <Instagram className="w-4 h-4" />
            </button>

            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(articleUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 hover:bg-sky-100 transition-colors"
              title="Bagikan ke Twitter / X"
            >
              <Twitter className="w-4 h-4" />
            </a>

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors relative"
              title="Salin Link Artikel"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* EDITORIAL MULTI-AUTHOR BIO BOX */}
      <div className="space-y-4 pt-4">
        {/* PRIMARY AUTHOR BIO BOX */}
        <div className="bg-gradient-to-br from-rose-50/80 via-white to-pink-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/90 rounded-3xl p-6 border border-rose-200/60 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <img
              src={getOptimizedAvatarUrl(post.authorAvatar, 80, 60)}
              alt={post.authorName}
              width={80}
              height={80}
              decoding="async"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-rose-400 shadow-md shrink-0"
            />
            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {post.authorName || 'Dr. Ratna Sari, M.Psi'}
                    </h3>
                  </div>
                  <p className="text-xs text-rose-700 dark:text-rose-300 font-bold pt-0.5">
                    {post.authorTitle || 'Spesialis Psikologi Anak & Praktisi Parenting'}
                  </p>
                </div>

                {/* SOCIAL LINKS */}
                <div className="flex items-center justify-center sm:justify-end gap-2 text-slate-600 dark:text-slate-400">
                  {post.authorSocials?.instagram && (
                    <a
                      href={post.authorSocials.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-rose-50 dark:bg-slate-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
                      title="Instagram Penulis"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {post.authorSocials?.linkedin && (
                    <a
                      href={post.authorSocials.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition-colors"
                      title="LinkedIn Penulis"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {post.authorSocials?.website && (
                    <a
                      href={post.authorSocials.website}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                      title="Situs Resmi Penulis"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {post.authorBio || 'Berkomitmen memberikan edukasi berbasis riset medis dan psikologi untuk membantu orang tua Indonesia membesarkan anak dengan penuh kasih sayang dan pemahaman gizi yang tepat.'}
              </p>
            </div>
          </div>
        </div>

        {/* CO-AUTHORS & REVIEWERS SECTION (IF ANY) */}
        {post.coAuthors && post.coAuthors.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-rose-600" />
              <span>Co-Author & Tim Kontributor Editorial</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {post.coAuthors.map((co) => (
                <div
                  key={co.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs"
                >
                  <img
                    src={getOptimizedAvatarUrl(co.avatar, 60, 60)}
                    alt={co.name}
                    width={48}
                    height={48}
                    decoding="async"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {co.name}
                    </div>
                    <div className="text-[11px] text-rose-600 font-medium truncate">
                      {co.title || 'Edukator Kesehatan Anak'}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                      {co.bio || 'Kontributor riset dan edukasi parenting.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CUSDIS COMMENTS SECTION */}
      <CusdisComments
        pageId={post.slug || String(post.id)}
        pageUrl={articleUrl}
        pageTitle={post.title}
      />

      {/* SMART RELATED ARTICLES (AUTO RELEVANCE & INTERNAL LINK JUICE) */}
      <SmartRelatedArticles
        currentPost={post}
        allPosts={posts}
        onSelectPost={onSelectPost}
      />
    </article>
  );
}
