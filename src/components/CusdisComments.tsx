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

export const CusdisComments: React.FC<CusdisCommentsProps> = ({
  pageId,
  pageUrl,
  pageTitle,
  appId = 'f4b0713e-4ae1-40c4-a301-f502d7b70249',
  host = 'https://cusdis.com',
  engineMode = 'both',
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  // Native Approved Comments State
  const [nativeComments, setNativeComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

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
    if (!name.trim() || !content.trim()) {
      setSubmitError('Nama dan isi komentar wajib diisi.');
      return;
    }
    if (!turnstileToken) {
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
          turnstileToken,
        }),
      });

      const data = (await res.json()) as any;

      if (res.ok && data.success) {
        setSubmitSuccess(true);
        setName('');
        setEmail('');
        setContent('');
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

              <TurnstileWidget
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken('')}
              />

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
            ) : (
              <div className="space-y-4">
                {nativeComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={comment.user_avatar ? getOptimizedAvatarUrl(comment.user_avatar, 80) : `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user_name || 'U')}`}
                          alt={comment.user_name}
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
                  </div>
                ))}
              </div>
            )}
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
