import React, { useMemo } from 'react';
import { Post } from '../types';
import { Sparkles, Clock, Eye, ArrowRight } from 'lucide-react';
import { optimizeUnsplashUrl, getUnsplashSrcSet } from '../lib/imageUtils';

interface SmartRelatedArticlesProps {
  currentPost: Post;
  allPosts: Post[];
  onSelectPost: (slug: string) => void;
}

export default function SmartRelatedArticles({
  currentPost,
  allPosts,
  onSelectPost,
}: SmartRelatedArticlesProps) {
  const relatedPosts = useMemo(() => {
    if (!currentPost || !allPosts) return [];

    const currentTags = (typeof currentPost.tags === 'string' ? currentPost.tags : '')
      .split(',')
      .map((t) => t.toLowerCase().trim())
      .filter(Boolean);

    // Score other published posts based on shared category and tag overlap
    const scored = allPosts
      .filter((p) => p.id !== currentPost.id && p.status === 'published')
      .map((post) => {
        let score = 0;
        // Category match (+5 points)
        if (post.category && post.category.toLowerCase() === currentPost.category?.toLowerCase()) {
          score += 5;
        }

        // Shared tag matches (+3 points per tag)
        const postTags = (typeof post.tags === 'string' ? post.tags : '')
          .split(',')
          .map((t) => t.toLowerCase().trim());
        currentTags.forEach((ct) => {
          if (postTags.includes(ct)) {
            score += 3;
          }
        });

        // Author match (+1 point)
        if (post.authorId === currentPost.authorId) {
          score += 1;
        }

        return { post, score };
      });

    // Sort descending by score, take top 3
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map((item) => item.post);
  }, [currentPost, allPosts]);

  if (!relatedPosts || relatedPosts.length === 0) return null;

  return (
    <section className="my-10 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            Artikel Terkait Rekomendasi
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Relevansi Topik Otomatis
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {relatedPosts.map((post) => (
          <article
            key={post.id}
            onClick={() => {
              onSelectPost(post.slug);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group cursor-pointer bg-white dark:bg-slate-900/90 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              {post.featuredImage && (
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800">
                  <img
                    src={optimizeUnsplashUrl(post.featuredImage, 400)}
                    srcSet={getUnsplashSrcSet(post.featuredImage, [300, 400, 600])}
                    sizes="(max-width: 640px) 100vw, 300px"
                    alt={post.title}
                    width={400}
                    height={225}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {post.category && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-sm">
                      {post.category}
                    </span>
                  )}
                </div>
              )}

              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 line-clamp-2 leading-snug transition-colors mb-2">
                {post.title}
              </h4>

              {post.excerpt && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                  {post.excerpt}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {post.readTimeMinutes || 5} mnt
              </span>
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold group-hover:translate-x-0.5 transition-transform">
                Baca <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
