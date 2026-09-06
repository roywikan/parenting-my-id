import { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (errorMsg: string) => void;
  siteKey?: string;
}

export default function TurnstileWidget({ onVerify, onExpire, onError, siteKey }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Keep latest callbacks in ref to avoid re-triggering effect on every parent re-render
  const callbacksRef = useRef({ onVerify, onExpire, onError });
  useEffect(() => {
    callbacksRef.current = { onVerify, onExpire, onError };
  });

  // Default Turnstile sitekey for local development & testing (Always Passes)
  const effectiveSiteKey = siteKey || '1x00000000000000000000AA';
  const isTestKey = !siteKey || effectiveSiteKey.startsWith('1x') || effectiveSiteKey.startsWith('2x') || effectiveSiteKey.startsWith('3x');

  useEffect(() => {
    let active = true;
    let timer: any = null;
    let retries = 0;
    const MAX_RETRIES = 15; // ~4.5s wait time

    const renderWidget = () => {
      if (!containerRef.current || !active) return;

      const turnstile = (window as any).turnstile;
      if (!turnstile) {
        retries++;
        if (retries > MAX_RETRIES) {
          if (callbacksRef.current.onError) {
            callbacksRef.current.onError('Gagal memuat script Turnstile dari Cloudflare.');
          }
          return;
        }
        // Turnstile script not loaded yet, retry in 300ms
        timer = setTimeout(renderWidget, 300);
        return;
      }

      try {
        // Reset any existing widget in this container before rendering
        if (widgetIdRef.current) {
          const oldId = widgetIdRef.current;
          widgetIdRef.current = null;
          try {
            turnstile.remove(oldId);
          } catch {
            // Ignore removal errors
          }
        }

        // Clean container DOM if any stale elements remain
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: effectiveSiteKey,
          callback: (token: string) => {
            if (active && callbacksRef.current.onVerify) {
              callbacksRef.current.onVerify(token);
            }
          },
          'expired-callback': () => {
            if (active && callbacksRef.current.onExpire) {
              callbacksRef.current.onExpire();
            }
          },
          'error-callback': () => {
            if (active && callbacksRef.current.onError) {
              callbacksRef.current.onError('Verifikasi Turnstile mengalami kegagalan.');
            }
          },
        });
      } catch (err: any) {
        console.error('Error rendering Cloudflare Turnstile:', err);
        if (callbacksRef.current.onError) {
          callbacksRef.current.onError(err?.message || 'Gagal memproses widget Turnstile.');
        }
      }
    };

    renderWidget();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      
      const turnstile = (window as any).turnstile;
      const currentWidgetId = widgetIdRef.current;
      widgetIdRef.current = null;

      if (turnstile && currentWidgetId) {
        try {
          turnstile.remove(currentWidgetId);
        } catch {
          // Ignore removal errors on unmount
        }
      }
    };
  }, [effectiveSiteKey]);

  return (
    <div className="flex flex-col items-center justify-center my-2">
      <div ref={containerRef} className="cf-turnstile"></div>
      {isTestKey && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium text-center mt-1.5 max-w-sm leading-tight">
          💡 Status: Mode Pengetesan (Test Key). Untuk menghapus status pengujian & mengaktifkan proteksi Cloudflare Turnstile resmi, masukkan Site Key produksi di Pengaturan Admin &gt; Config Situs.
        </p>
      )}
    </div>
  );
}
