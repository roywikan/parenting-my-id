import React, { useEffect, useRef } from 'react';

export interface HeroAffiliateWidgetSlotProps {
  code?: string;
  enabled?: boolean;
  position?: 'right' | 'bottom';
  className?: string;
  themeContext?: 'hero' | 'surface' | 'glass' | 'card' | 'classified';
}

/**
 * HeroAffiliateWidgetSlot
 * Merender snippet kode widget affiliate (Travelpayouts, Booking.com, GetYourGuide, Trip.com, Wego, Traveloka, dsb.)
 * secara asinkron dan aman di client-side (SPA).
 * Mendukung script eksternal, inline executable script, styling responsif, serta styling container glassmorphism yang serasi dengan Hero.
 */
export default function HeroAffiliateWidgetSlot({
  code,
  enabled = true,
  position = 'right',
  className = '',
  themeContext = 'hero',
}: HeroAffiliateWidgetSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !code || enabled === false) return;

    const trimmed = code.trim();
    if (!trimmed) {
      containerRef.current.innerHTML = '';
      return;
    }

    // Bersihkan kontainer sebelum injeksi
    containerRef.current.innerHTML = '';

    // Buat wrapper sementara untuk parsing elemen HTML dan script
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = trimmed;

    const scriptNodes: HTMLScriptElement[] = [];

    // Pisahkan elemen non-script dan script
    Array.from(tempDiv.childNodes).forEach((node) => {
      if (node.nodeName === 'SCRIPT') {
        scriptNodes.push(node as HTMLScriptElement);
      } else {
        containerRef.current?.appendChild(node.cloneNode(true));
      }
    });

    // Jalankan skrip secara aman dan berurutan
    scriptNodes.forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (oldScript.innerHTML) {
        newScript.innerHTML = oldScript.innerHTML;
      }
      containerRef.current?.appendChild(newScript);
    });

    // Trigger event DOMContentLoaded sintetis jika widget (seperti Trip.com) menggunakannya
    try {
      window.dispatchEvent(new Event('DOMContentLoaded'));
    } catch {
      // Abaikan jika tidak didukung
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [code, enabled]);

  if (!enabled || !code || !code.trim()) {
    return null;
  }

  // Base container styles sesuai posisi dan theme context
  const containerBaseClass = position === 'right'
    ? 'w-full md:w-auto md:max-w-md lg:max-w-lg shrink-0'
    : 'w-full my-4';

  const visualCardClass = themeContext === 'hero'
    ? 'bg-black/25 dark:bg-black/35 backdrop-blur-md rounded-2xl border border-white/20 p-4 shadow-xl'
    : themeContext === 'glass'
    ? 'bg-white/10 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/15 p-4 shadow-lg'
    : themeContext === 'classified'
    ? 'bg-[#f2ebd9] dark:bg-[#25221d] rounded-xl border-2 border-[#3c362e] dark:border-[#5c5448] p-4 shadow-md'
    : 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-md';

  return (
    <div
      id="hero-affiliate-widget-slot"
      className={`hero-affiliate-widget-slot ${containerBaseClass} ${className}`}
    >
      <div className={`${visualCardClass} overflow-x-auto w-full transition-all duration-300`}>
        <div
          ref={containerRef}
          className="hero-affiliate-content min-h-[50px] w-full flex flex-col justify-center items-center text-slate-900 dark:text-slate-100"
        />
      </div>
    </div>
  );
}
