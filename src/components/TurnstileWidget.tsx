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

  // Default Turnstile sitekey for local development & testing (Always Passes)
  const effectiveSiteKey = siteKey || '1x00000000000000000000AA';

  useEffect(() => {
    let active = true;
    let timer: any = null;
    let retries = 0;
    const MAX_RETRIES = 12; // ~3.6s wait time

    const renderWidget = () => {
      if (!containerRef.current || !active) return;

      const turnstile = (window as any).turnstile;
      if (!turnstile) {
        retries++;
        if (retries > MAX_RETRIES) {
          if (onError) onError('Gagal memuat script Turnstile dari Cloudflare.');
          return;
        }
        // Turnstile script not loaded yet, retry in 300ms
        timer = setTimeout(renderWidget, 300);
        return;
      }

      try {
        // Reset any existing widget in this container before rendering
        if (widgetIdRef.current) {
          turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: effectiveSiteKey,
          callback: (token: string) => {
            if (active) onVerify(token);
          },
          'expired-callback': () => {
            if (active && onExpire) onExpire();
          },
          'error-callback': () => {
            if (active && onError) onError('Verifikasi Turnstile mengalami kegagalan.');
          },
        });
      } catch (err: any) {
        console.error('Error rendering Cloudflare Turnstile:', err);
        if (onError) onError(err?.message || 'Gagal memproses widget Turnstile.');
      }
    };

    renderWidget();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      
      const turnstile = (window as any).turnstile;
      if (turnstile && widgetIdRef.current) {
        try {
          turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignore removal errors on unmount
        }
      }
    };
  }, [effectiveSiteKey, onVerify, onExpire, onError]);

  return (
    <div className="flex justify-center my-2">
      <div ref={containerRef} className="cf-turnstile"></div>
    </div>
  );
}
