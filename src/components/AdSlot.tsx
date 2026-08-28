import React, { useEffect, useRef } from 'react';

interface AdSlotProps {
  code?: string;
  enableAdsense?: boolean;
  className?: string;
  slotLabel?: string;
}

export default function AdSlot({ code, enableAdsense = true, className = '', slotLabel }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !code || enableAdsense === false) return;

    // Clear previous contents
    containerRef.current.innerHTML = '';

    const trimmed = code.trim();
    if (!trimmed) return;

    // Create temporary wrapper to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = trimmed;

    // Append nodes and handle script execution safely
    Array.from(tempDiv.childNodes).forEach((node) => {
      if (node.nodeName === 'SCRIPT') {
        const script = document.createElement('script');
        Array.from((node as HTMLScriptElement).attributes).forEach((attr) => {
          script.setAttribute(attr.name, attr.value);
        });
        if ((node as HTMLScriptElement).innerHTML) {
          script.innerHTML = (node as HTMLScriptElement).innerHTML;
        }
        containerRef.current?.appendChild(script);
      } else {
        containerRef.current?.appendChild(node.cloneNode(true));
      }
    });
  }, [code, enableAdsense]);

  if (enableAdsense === false || !code || !code.trim()) {
    return null;
  }

  return (
    <div className={`my-4 overflow-hidden text-center ad-placement-slot ${className}`}>
      {slotLabel && (
        <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
          IKLAN • {slotLabel}
        </span>
      )}
      <div ref={containerRef} className="flex justify-center items-center min-h-[50px] w-full" />
    </div>
  );
}
