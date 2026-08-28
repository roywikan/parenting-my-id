import React, { useEffect } from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';

interface CusdisCommentsProps {
  pageId: string;
  pageUrl: string;
  pageTitle: string;
  appId?: string;
  host?: string;
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
}) => {
  useEffect(() => {
    const threadEl = document.getElementById('cusdis_thread');
    if (!threadEl) return;

    // Set dataset attributes
    threadEl.setAttribute('data-host', host);
    threadEl.setAttribute('data-app-id', appId);
    threadEl.setAttribute('data-page-id', pageId);
    threadEl.setAttribute('data-page-url', pageUrl);
    threadEl.setAttribute('data-page-title', pageTitle);

    // Dynamic iframe auto-resize listener from Cusdis window postMessage
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.from === 'cusdis' && data.type === 'resize') {
          const iframe = document.querySelector('#cusdis_thread iframe') as HTMLIFrameElement;
          if (iframe && data.data) {
            iframe.style.height = `${Math.max(420, Number(data.data))}px`;
          }
        }
      } catch (err) {
        // Safe catch for unrelated window messages
      }
    };

    window.addEventListener('message', handleMessage);

    const initCusdis = async () => {
      // 1. Ensure Indonesian language script (id.js) is loaded FIRST
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

      // 2. Ensure main Cusdis SDK (cusdis.es.js) is loaded
      if (!document.getElementById('cusdis-main-script')) {
        const mainScript = document.createElement('script');
        mainScript.id = 'cusdis-main-script';
        mainScript.src = `${host}/js/cusdis.es.js`;
        mainScript.async = true;
        mainScript.defer = true;
        document.body.appendChild(mainScript);
      } else if (window.CUSDIS?.renderTo) {
        // If Cusdis script already loaded, re-render for current article
        try {
          window.CUSDIS.renderTo(threadEl);
        } catch (err) {
          console.warn('Cusdis re-render warning:', err);
        }
      }
    };

    initCusdis();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [pageId, pageUrl, pageTitle, appId, host]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-rose-50/80 via-white to-pink-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 p-4 rounded-2xl border border-rose-100 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500 text-white shadow-sm shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Diskusi &amp; Komentar Pembaca</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                <Sparkles className="w-3 h-3" /> Dimoderasi
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tulis tanggapan, pengalaman, atau pertanyaan Anda terkait artikel ini.
            </p>
          </div>
        </div>
      </div>

      {/* CUSDIS THREAD CONTAINER */}
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
    </div>
  );
};

