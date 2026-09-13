import React, { useEffect, useState } from 'react';
import { MessageSquare, Sparkles, Send, CheckCircle2, ShieldAlert, Globe, User, Mail, MessageCircle, RefreshCw } from 'lucide-react';
import { getOptimizedAvatarUrl } from '../lib/imageUtils';
import TurnstileWidget from './TurnstileWidget';

export type CommentEngineMode = 'both' | 'native' | 'cusdis' | 'none';

interface CusdisCommentsProps {
  pageId: string;
  pageUrl: string;
  pageTitle: string;
  appId?: string;
  host?: string;
  engineMode?: CommentEngineMode;
  turnstileSiteKey?: string;
  enableTurnstile?: boolean;
}

declare global {
  interface Window {
    CUSDIS?: {
      renderTo?: (element: HTMLElement) => void;
      initial?: () => void;
    };
    CUSDIS_LOCALE?: any;
  }
}

export interface CommentNode {
  id: number;
  post_slug: string;
  user_name: string;
  user_email?: string;
  user_avatar?: string;
  content: string;
  status: string;
  parent_id: number | null;
  created_at: string;
  replies: CommentNode[];
}

export const buildCommentTree = (comments: any[]): CommentNode[] => {
  const map: { [key: number]: CommentNode } = {};
  const roots: CommentNode[] = [];

  comments.forEach((c) => {
    map[c.id] = { ...c, replies: [] };
  });

  comments.forEach((c) => {
    const node = map[c.id];
    if (c.parent_id) {
      const parent = map[c.parent_id];
      if (parent) {
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  roots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const sortRepliesRecursively = (node: CommentNode) => {
    node.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    node.replies.forEach(sortRepliesRecursively);
  };

  roots.forEach(sortRepliesRecursively);

  return roots;
};

interface ReplyFormProps {
  parentId: number;
  postSlug: string;
  onSuccess: () => void;
  onCancel: () => void;
  turnstileSiteKey?: string;
  enableTurnstile?: boolean;
}

const CommentReplyForm: React.FC<ReplyFormProps> = ({
  parentId,
  postSlug,
  onSuccess,
  onCancel,
  turnstileSiteKey,
  enableTurnstile = true,
}) => {
  const [replyName, setReplyName] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyHoneypot, setReplyHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [replyToken, setReplyToken] = useState('');
  const [turnstileLoadFailed, setTurnstileLoadFailed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (replyHoneypot.trim()) {
      setErrorMsg('Pengiriman spam terdeteksi.');
      return;
    }
    if (!replyName.trim() || !replyContent.trim()) {
      setErrorMsg('Nama dan isi komentar wajib diisi.');
      return;
    }
    if (enableTurnstile !== false && !turnstileLoadFailed && !replyToken) {
      setErrorMsg('Harap selesaikan verifikasi keamanan Turnstile.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_slug: postSlug,
          user_name: replyName.trim(),
          user_email: replyEmail.trim(),
          content: replyContent.trim(),
          parent_id: parentId,
          turnstileToken: replyToken || 'BYPASS_DISABLED',
          website_hp: replyHoneypot,
        }),
      });

      const data = await res.json() as any;
      if (res.ok && data.success) {
        onSuccess();
      } else {
        setErrorMsg(data.error || 'Gagal mengirim balasan.');
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan koneksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 text-xs">
      <div className="font-extrabold text-slate-800 dark:text-slate-200">Balas Komentar:</div>
      {errorMsg && (
        <div className="p-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
          {errorMsg}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          required
          value={replyName}
          onChange={(e) => setReplyName(e.target.value)}
          placeholder="Nama Anda *"
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
        />
        <input
          type="email"
          value={replyEmail}
          onChange={(e) => setReplyEmail(e.target.value)}
          placeholder="Email (Opsional)"
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
        />
      </div>
      <textarea
        required
        rows={2}
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        placeholder="Tulis balasan Anda..."
        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none resize-none"
      />
      
      {/* Honeypot */}
      <input
        type="text"
        value={replyHoneypot}
        onChange={(e) => setReplyHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="hidden opacity-0 pointer-events-none absolute -left-[9999px]"
        aria-hidden="true"
      />

      {enableTurnstile !== false && (
        <div className="scale-90 origin-left">
          <TurnstileWidget
            siteKey={turnstileSiteKey}
            onVerify={(token) => {
              setReplyToken(token);
              setErrorMsg('');
            }}
            onExpire={() => setReplyToken('')}
            onError={(err) => {
              console.warn('Reply Turnstile load notice:', err);
              setTurnstileLoadFailed(true);
            }}
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Mengirim...' : 'Kirim Balasan'}
        </button>
      </div>
    </form>
  );
};

const CommentItem: React.FC<{
  comment: CommentNode;
  depth: number;
  pageId: string;
  turnstileSiteKey?: string;
  enableTurnstile?: boolean;
  onReplySuccess: () => void;
  activeReplyId: number | null;
  setActiveReplyId: (id: number | null) => void;
}> = ({
  comment,
  depth,
  pageId,
  turnstileSiteKey,
  enableTurnstile,
  onReplySuccess,
  activeReplyId,
  setActiveReplyId,
}) => {
  const isCapped = depth >= 3;
  
  return (
    <div className={`p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2.5 ${depth > 0 && depth <= 3 ? 'ml-4 sm:ml-6 pl-4 sm:pl-6 border-l-2 border-rose-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={comment.user_avatar ? getOptimizedAvatarUrl(comment.user_avatar, 40, 50) : `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user_name || 'U')}&size=80`}
            alt={comment.user_name}
            width={32}
            height={32}
            loading="lazy"
            decoding="async"
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
          <div>
            <div className="font-extrabold text-xs text-slate-900 dark:text-white">
              {comment.user_name}
            </div>
            <div className="text-[10px] text-slate-400">
              {new Date(comment.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
          ✓ Disetujui
        </span>
      </div>

      <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed font-medium">
        {comment.content}
      </p>

      <div className="flex flex-col">
        <div className="flex items-center justify-end">
          <button
            onClick={() => setActiveReplyId(activeReplyId === comment.id ? null : comment.id)}
            className="text-[11px] font-black text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 self-end py-1 px-2 rounded-lg bg-rose-50 dark:bg-rose-950/40"
          >
            <span>💬</span>
            <span>Balas</span>
          </button>
        </div>

        {activeReplyId === comment.id && (
          <CommentReplyForm
            parentId={comment.id}
            postSlug={pageId}
            onSuccess={() => {
              setActiveReplyId(null);
              onReplySuccess();
            }}
            onCancel={() => setActiveReplyId(null)}
            turnstileSiteKey={turnstileSiteKey}
            enableTurnstile={enableTurnstile}
          />
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={isCapped ? depth : depth + 1}
              pageId={pageId}
              turnstileSiteKey={turnstileSiteKey}
              enableTurnstile={enableTurnstile}
              onReplySuccess={onReplySuccess}
              activeReplyId={activeReplyId}
              setActiveReplyId={setActiveReplyId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CusdisComments: React.FC<CusdisCommentsProps> = ({
  pageId,
  pageUrl,
  pageTitle,
  appId = 'f4b0713e-4ae1-40c4-a301-f502d7b70249',
  host = 'https://cusdis.com',
  engineMode = 'both',
  turnstileSiteKey,
  enableTurnstile = true,
}) => {
  // If comments are completely disabled in admin config
  if (engineMode === 'none') {
    return null;
  }

  const initialMode = engineMode === 'cusdis' ? 'cusdis' : 'native';
  const [commentMode, setCommentMode] = useState<'native' | 'cusdis'>(initialMode);

  // Sync mode if engineMode prop changes from parent / admin config
  useEffect(() => {
    if (engineMode === 'cusdis') {
      setCommentMode('cusdis');
    } else if (engineMode === 'native') {
      setCommentMode('native');
    }
  }, [engineMode]);

  // Native Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileLoadFailed, setTurnstileLoadFailed] = useState(false);

  // Native Approved Comments State
  const [nativeComments, setNativeComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch Approved Native Comments
  const fetchApprovedComments = async () => {
    if (engineMode === 'cusdis') return;
    setIsLoadingComments(true);
    try {
      const res = await fetch(`/api/comments?post_slug=${encodeURIComponent(pageId)}&status=approved`);
      if (res.ok) {
        const data = await res.json();
        setNativeComments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch native comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    if (engineMode === 'cusdis') return;
    // Defer comments fetching slightly so it doesn't block initial page render & LCP
    const timer = setTimeout(() => {
      fetchApprovedComments();
    }, 500);

    return () => clearTimeout(timer);
  }, [pageId, engineMode]);

  // Handle Native Submit
  const handleNativeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot.trim()) {
      // Invisible honeypot filled by automated bot
      setSubmitError('Pengiriman spam terdeteksi.');
      return;
    }

    if (!name.trim() || !content.trim()) {
      setSubmitError('Nama dan isi komentar wajib diisi.');
      return;
    }

    // Require Turnstile token only if Turnstile is enabled and loaded
    if (enableTurnstile !== false && !turnstileLoadFailed && !turnstileToken) {
      setSubmitError('Harap selesaikan verifikasi keamanan Turnstile sebelum mengirim komentar.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_slug: pageId,
          user_name: name.trim(),
          user_email: email.trim(),
          content: content.trim(),
          turnstileToken: turnstileToken || 'BYPASS_DISABLED',
          website_hp: honeypot,
        }),
      });

      const data = (await res.json()) as any;

      if (res.ok && data.success) {
        setSubmitSuccess(true);
        setName('');
        setEmail('');
        setContent('');
        setHoneypot('');
        setTurnstileToken('');
      } else {
        setSubmitError(data.error || 'Gagal mengirim komentar. Silakan coba lagi.');
      }
    } catch (err: any) {
      setSubmitError('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cusdis Widget Loader (Only when mode is active or enabled)
  useEffect(() => {
    if (engineMode === 'native' || commentMode !== 'cusdis') return;

    const threadEl = document.getElementById('cusdis_thread');
    if (!threadEl) return;

    threadEl.setAttribute('data-host', host);
    threadEl.setAttribute('data-app-id', appId);
    threadEl.setAttribute('data-page-id', pageId);
    threadEl.setAttribute('data-page-url', pageUrl);
    threadEl.setAttribute('data-page-title', pageTitle);

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.from === 'cusdis' && data.type === 'resize') {
          const iframe = document.querySelector('#cusdis_thread iframe') as HTMLIFrameElement;
          if (iframe && data.data) {
            iframe.style.height = `${Math.max(450, Number(data.data))}px`;
          }
        }
      } catch (err) {
        // Safe catch
      }
    };

    window.addEventListener('message', handleMessage);

    const initCusdis = async () => {
      if (!document.getElementById('cusdis-lang-script')) {
        const langScript = document.createElement('script');
        langScript.id = 'cusdis-lang-script';
        langScript.src = `${host}/js/widget/lang/id.js`;
        langScript.defer = true;
        document.body.appendChild(langScript);

        await new Promise((resolve) => {
          langScript.onload = resolve;
          langScript.onerror = resolve;
        });
      }

      if (!document.getElementById('cusdis-main-script')) {
        const mainScript = document.createElement('script');
        mainScript.id = 'cusdis-main-script';
        mainScript.src = `${host}/js/cusdis.es.js`;
        mainScript.async = true;
        mainScript.defer = true;
        document.body.appendChild(mainScript);
      } else if (window.CUSDIS?.renderTo) {
        try {
          window.CUSDIS.renderTo(threadEl);
        } catch (err) {
          console.warn('Cusdis re-render:', err);
        }
      }
    };

    initCusdis();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [commentMode, engineMode, pageId, pageUrl, pageTitle, appId, host]);

  return (
    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
      <style>{`
        #cusdis_thread iframe {
          width: 100% !important;
          min-height: 450px !important;
          border: none !important;
          background: transparent !important;
        }
      `}</style>

      {/* HEADER DISKUSI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-50/80 via-white to-pink-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 p-4 rounded-2xl border border-rose-100 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-sm shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Diskusi &amp; Komentar Pembaca</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-800 dark:text-rose-200 bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 px-2 py-0.5 rounded-md">
                <Sparkles className="w-3 h-3" /> Dimoderasi
              </span>
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
              {engineMode === 'cusdis'
                ? 'Tulis tanggapan via widget diskusi interaktif.'
                : 'Tulis tanggapan, pengalaman, atau pertanyaan Anda terkait artikel ini.'}
            </p>
          </div>
        </div>

        {/* MODE TOGGLE SWITCHER (ONLY SHOWN WHEN engineMode === 'both') */}
        {engineMode === 'both' && (
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setCommentMode('native')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                commentMode === 'native'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Komentar Native</span>
              {nativeComments.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                  {nativeComments.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setCommentMode('cusdis')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                commentMode === 'cusdis'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Widget Cusdis</span>
            </button>
          </div>
        )}
      </div>

      {/* MODE 1: NATIVE SYSTEM (FORM + LIST OF APPROVED COMMENTS) */}
      {(engineMode === 'native' || (engineMode === 'both' && commentMode === 'native')) && (
        <div className="space-y-8">
          {/* NATIVE FORM BOX */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-rose-500" />
              <span>Tulis Komentar Anda</span>
            </h4>

            {submitSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-3 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Komentar Terkirim!</span>
                  <p className="leading-relaxed">
                    Terima kasih telah berpartisipasi! Komentar Anda telah tersimpan dan sedang dalam antrean moderasi admin. Komentar akan tampil di halaman ini setelah disetujui.
                  </p>
                </div>
              </div>
            )}

            {submitError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleNativeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-rose-500" />
                    <span>Nama Anda *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Ibu Rahma"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-rose-500" />
                    <span>Email (Opsional, Rahasia)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahma@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                  <span>Komentar Anda *</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Bagikan pengalaman atau pertanyaan Anda seputar topik ini..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none transition-colors resize-none"
                />
              </div>

              {/* Invisible Honeypot Anti-Spam (Real humans don't fill this) */}
              <input
                type="text"
                name="website_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden opacity-0 pointer-events-none absolute -left-[9999px]"
                aria-hidden="true"
              />

              {enableTurnstile !== false && (
                <div className="space-y-1">
                  <TurnstileWidget
                    siteKey={turnstileSiteKey}
                    onVerify={(token) => {
                      setTurnstileToken(token);
                      setSubmitError('');
                    }}
                    onExpire={() => setTurnstileToken('')}
                    onError={(err) => {
                      console.warn('Turnstile load notice:', err);
                      setTurnstileLoadFailed(true);
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400">
                  🔒 Komentar Anda akan melalui proses moderasi terlebih dahulu.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Komentar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* LIST OF APPROVED COMMENTS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-rose-500" />
                <span>Komentar Disetujui ({nativeComments.length})</span>
              </h4>

              <button
                onClick={fetchApprovedComments}
                disabled={isLoadingComments}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 text-xs transition-colors"
                title="Refresh Komentar"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingComments ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {nativeComments.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Belum ada komentar yang disetujui.
                </p>
                <p className="text-[11px] text-slate-500">
                  Jadilah pembaca pertama yang memberikan tanggapan pada artikel ini!
                </p>
              </div>
            ) : (() => {
              const roots = buildCommentTree(nativeComments);
              const COMMENTS_PER_PAGE = 5;
              const totalPages = Math.ceil(roots.length / COMMENTS_PER_PAGE);
              const paginatedRoots = roots.slice((currentPage - 1) * COMMENTS_PER_PAGE, currentPage * COMMENTS_PER_PAGE);

              return (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {paginatedRoots.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        depth={0}
                        pageId={pageId}
                        turnstileSiteKey={turnstileSiteKey}
                        enableTurnstile={enableTurnstile}
                        onReplySuccess={fetchApprovedComments}
                        activeReplyId={activeReplyId}
                        setActiveReplyId={setActiveReplyId}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="site-pagination-container flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        className="btn-pagination-prev px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-colors disabled:opacity-40"
                      >
                        <span className="arrow">←</span>
                        <span className="text ml-1">Sebelumnya</span>
                      </button>

                      <div className="pagination-numbers flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                              currentPage === page
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        className="btn-pagination-next px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-colors disabled:opacity-40"
                      >
                        <span className="text mr-1">Berikutnya</span>
                        <span className="arrow">→</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODE 2: CUSDIS WIDGET IFRAME */}
      {(engineMode === 'cusdis' || (engineMode === 'both' && commentMode === 'cusdis')) && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs min-h-[480px]">
          <div
            id="cusdis_thread"
            data-host={host}
            data-app-id={appId}
            data-page-id={pageId}
            data-page-url={pageUrl}
            data-page-title={pageTitle}
          />
        </div>
      )}
    </div>
  );
};
