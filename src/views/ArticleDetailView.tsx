import { useMemo, useState, useEffect } from 'react';
import { Post, AutoLink } from '../types';
import { applyAutoLinks } from '../lib/autolink';
import { marked } from 'marked';
import { Clock, Eye, Calendar, ArrowLeft, Share2, Check, Bookmark, Sparkles, MessageCircle, Twitter, Facebook, Copy } from 'lucide-react';
import SEOHelper from '../components/SEOHelper';

interface ArticleDetailViewProps {
  slug: string;
  posts: Post[];
  autolinks: AutoLink[];
  onBack: () => void;
  onSelectPost: (slug: string) => void;
}

export default function ArticleDetailView({
  slug,
  posts,
  autolinks,
  onBack,
  onSelectPost,
}: ArticleDetailViewProps) {
  const [copied, setCopied] = useState(false);

  const post = useMemo(() => {
    return posts.find((p) => p.slug === slug);
  }, [posts, slug]);

  // Render markdown to HTML + extract TOC items + apply Auto-Links & Heading IDs
  const { parsedHtml, tocItems } = useMemo(() => {
    if (!post) return { parsedHtml: '', tocItems: [] };

    let rawHtml = marked.parse(post.contentMarkdown, { async: false, gfm: true, breaks: true }) as string;
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

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Artikel Tidak Ditemukan</h2>
        <p className="text-slate-600">Artikel dengan slug "{slug}" mungkin telah dihapus atau dipindahkan.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs inline-flex items-center gap-2"
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
    <article className="max-w-4xl mx-auto space-y-8 pb-16">
      <SEOHelper
        title={`${post.title} | Parenting.my.id`}
        description={post.metaDescription || post.excerpt}
        image={post.featuredImage}
        canonicalUrl={articleUrl}
      />

      {/* BREADCRUMB & BACK BUTTON */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span>Parenting.my.id</span>
          <span>/</span>
          <span className="text-rose-600 font-semibold">{post.category}</span>
        </div>
      </div>

      {/* ARTICLE HEADER */}
      <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-xs">
            {post.category}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-md">
            <Sparkles className="w-3 h-3" /> Auto-Linking Active
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {post.title}
        </h1>

        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed italic border-l-4 border-rose-500 pl-4 py-1 bg-rose-50/50 dark:bg-slate-800/40 rounded-r-xl">
          "{post.excerpt}"
        </p>

        {/* AUTHOR & METADATA BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={post.authorAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80'}
              alt={post.authorName}
              className="w-10 h-10 rounded-full object-cover border-2 border-rose-300"
            />
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {post.authorName || 'Dr. Ratna Sari, M.Psi'}
              </div>
              <div className="text-[11px] text-rose-600 font-medium">
                Pakar & Penulis Parenting • {post.authorRole || 'admin'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readTimeMinutes} Mnt Baca
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {post.views} Dibaca
            </span>
          </div>
        </div>
      </header>

      {/* FEATURED IMAGE */}
      <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
        <img
          src={post.featuredImage}
          alt={post.title}
          className="w-full max-h-[480px] object-cover"
        />
      </div>

      {/* TABLE OF CONTENTS (IF HEADINGS EXIST) */}
      {tocItems.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-rose-500" />
            <span>Daftar Isi Artikel</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            {tocItems.map((item, idx) => (
              <li key={idx} className={item.level === 3 ? 'pl-4' : ''}>
                <a
                  href={`#${item.id}`}
                  className="hover:text-rose-600 hover:underline transition-colors block py-0.5"
                >
                  • {item.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ARTICLE CONTENT BODY WITH AUTO-LINKING */}
      <div
        className="prose prose-rose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed text-sm sm:text-base space-y-4"
        dangerouslySetInnerHTML={{ __html: parsedHtml }}
      />

      {/* TAGS & SHARE SECTION */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* TAGS */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Kata Kunci:</span>
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5" /> Bagikan:
            </span>
            
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + ' ' + articleUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
              title="Bagikan ke WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>

            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(articleUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
              title="Bagikan ke Twitter"
            >
              <Twitter className="w-4 h-4" />
            </a>

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors relative"
              title="Salin Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* AUTHOR PROFILE CARD */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-slate-900 dark:to-slate-800/80 rounded-3xl p-6 border border-rose-100 dark:border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <img
          src={post.authorAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'}
          alt={post.authorName}
          className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
        />
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            {post.authorName || 'Dr. Ratna Sari, M.Psi'}
          </h4>
          <p className="text-xs text-rose-600 font-semibold">Spesialis Psikologi Anak & Praktisi Parenting</p>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
            Berkomitmen memberikan edukasi berbasis riset medis dan psikologi untuk membantu orang tua Indonesia membesarkan anak dengan penuh kasih sayang dan pemahaman gizi yang tepat.
          </p>
        </div>
      </div>

      {/* RELATED POSTS */}
      {relatedPosts.length > 0 && (
        <div className="space-y-4 pt-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Artikel Terkait Lainnya</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedPosts.map((rel) => (
              <div
                key={rel.id}
                onClick={() => {
                  onSelectPost(rel.slug);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
              >
                <img
                  src={rel.featuredImage}
                  alt={rel.title}
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                    {rel.category}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors line-clamp-2">
                    {rel.title}
                  </h5>
                  <div className="text-[10px] text-slate-500">{rel.readTimeMinutes} mnt baca</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
