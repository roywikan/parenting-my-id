import React from 'react';
import { User, Post, SiteConfig } from '../types';
import { BookOpen, Globe, Instagram, Linkedin, ArrowLeft, GraduationCap, Award, Calendar } from 'lucide-react';
import SEOHelper from '../components/SEOHelper';

interface AuthorViewProps {
  username: string;
  users: User[];
  posts: Post[];
  siteConfig?: SiteConfig | any;
  onSelectPost: (slug: string) => void;
  onBack: () => void;
}

export function userToUsername(user: User): string {
  const cleanName = user.name
    .toLowerCase()
    .replace(/^(dr\.|dr|prof\.|prof|dra\.|dra|psi\.)\s+/g, '') // remove titles
    .replace(/,\s*[a-z.\s]+$/i, '') // remove degree suffixes like M.Psi, S.Psi, S.Ked, S.Gz
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  if (cleanName) return cleanName;
  return user.email.split('@')[0];
}

export default function AuthorView({
  username,
  users,
  posts,
  siteConfig,
  onSelectPost,
  onBack,
}: AuthorViewProps) {
  // Find the user matching the sanitized username slug
  const author = users.find((u) => userToUsername(u) === username.toLowerCase().trim());
  const defaultSiteName = siteConfig?.site_name || 'Website';

  if (!author) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 space-y-6">
        <SEOHelper
          title={`Penulis Tidak Ditemukan | ${defaultSiteName}`}
          description={`Profil penulis dengan username @${username} tidak ditemukan.`}
          canonicalUrl={typeof window !== 'undefined' ? window.location.href : `/author/${username}`}
          siteName={defaultSiteName}
        />
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <GraduationCap size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">Halaman Penulis Tidak Ditemukan</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            Profil penulis dengan nama pengguna <span className="font-mono text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded">@{username}</span> belum terdaftar di sistem kami atau sedang dalam proses peninjauan akademik.
          </p>
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold transition-all shadow-xs hover:shadow-md"
        >
          <ArrowLeft size={14} /> Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Filter posts written by this specific author
  const authorPosts = posts.filter(
    (post) => post.authorId === author.id || post.authorName?.toLowerCase().trim() === author.name.toLowerCase().trim()
  );

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 space-y-12">
      <SEOHelper
        title={`Profil Penulis: ${author.name} | ${defaultSiteName}`}
        description={author.bio || `Profil dan artikel karya ${author.name} (${author.title || 'Penulis'}) di ${defaultSiteName}.`}
        image={author.avatar}
        canonicalUrl={typeof window !== 'undefined' ? window.location.href : `/author/${username}`}
        type="profile"
        authorName={author.name}
        authorRole={author.title || 'Penulis & Kontributor'}
        siteName={defaultSiteName}
      />
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Artikel
      </button>

      {/* Profile Card Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full pointer-events-none" />

        {/* Profile Avatar */}
        <div className="relative group shrink-0 mx-auto md:mx-0">
          <div className="absolute inset-0 bg-rose-500/10 rounded-2xl rotate-3 scale-102 transition-transform group-hover:rotate-6" />
          <img
            src={author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=50'}
            alt={author.name}
            className="relative w-28 h-28 sm:w-36 sm:h-36 object-cover rounded-2xl border-2 border-white dark:border-slate-800 shadow-sm"
          />
        </div>

        {/* Biography and Academic Details */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="space-y-1">
            {author.isVerifiedAcademic && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold tracking-wider uppercase">
                {author.verifiedAcademicLabel || 'Penulis Akademik Terverifikasi'}
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {author.name}
            </h1>
            {author.title && (
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                {author.title}
              </p>
            )}
          </div>

          {author.bio && (
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
              {author.bio}
            </p>
          )}

          {/* Core Info Badges */}
          <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2 text-xs">
            {author.isVerifiedAcademic && (
              <>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <GraduationCap size={14} className="text-slate-400" />
                  <span>Gelar Terverifikasi</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <Award size={14} className="text-slate-400" />
                  <span>Kontributor Terpercaya</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 rounded-xl">
              <BookOpen size={14} className="text-slate-400" />
              <span>{authorPosts.length} Artikel Terbit</span>
            </div>
          </div>

          {/* Social Profiles */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2.5 pt-3">
            {author.socialInstagram && (
              <a
                href={author.socialInstagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-400 border border-slate-100 dark:border-slate-800 transition-colors"
              >
                <Instagram size={14} />
                <span>Instagram</span>
              </a>
            )}
            {author.socialLinkedin && (
              <a
                href={author.socialLinkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-100 dark:border-slate-800 transition-colors"
              >
                <Linkedin size={14} />
                <span>LinkedIn</span>
              </a>
            )}
            {(author.socialWebsite || author.socials?.website) && (
              <a
                href={author.socialWebsite || author.socials?.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-100 dark:border-slate-800 transition-colors"
              >
                <Globe size={14} />
                <span>Situs Web</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Contributed Articles */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-2">
          <div className="space-y-0.5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Kontribusi
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Kumpulan tulisan yang disusun oleh {author.name}
            </p>
          </div>
          <span className="self-start sm:self-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold font-mono">
            {authorPosts.length} Tulisan
          </span>
        </div>

        {authorPosts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              Belum ada artikel ilmiah yang diterbitkan oleh penulis ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {authorPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => onSelectPost(post.slug)}
                className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider">
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                      <Calendar size={11} />
                      <span>
                        {new Date(post.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-50 dark:border-slate-800/40">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {post.readTimeMinutes} menit baca
                  </span>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform">
                    Baca Selengkapnya &rarr;
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
