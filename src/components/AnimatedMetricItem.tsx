import React, { useState, useEffect, useRef } from 'react';

interface AnimatedMetricItemProps {
  label: string;
  value?: string;
  animType?: 'fixed' | 'count_up' | 'count_down';
  startVal?: number;
  endVal?: number;
  duration?: number;
  unit?: string;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}

export default function AnimatedMetricItem({
  label,
  value,
  animType = 'fixed',
  startVal = 0,
  endVal = 0,
  duration = 2000,
  unit = '',
  className = '',
  valueClassName = 'text-xl sm:text-2xl font-black text-emerald-400',
  labelClassName = 'text-[10px] text-rose-200 uppercase font-semibold',
}: AnimatedMetricItemProps) {
  const getFixedDisplay = () => {
    if (endVal !== undefined && endVal !== null) {
      return endVal;
    }
    return value ?? '';
  };

  const [currentDisplay, setCurrentDisplay] = useState<number | string>(
    animType === 'fixed' ? getFixedDisplay() : (startVal ?? 0)
  );
  
  const elementRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset animation flag when props change so live preview in AdminPortal re-triggers animation
    hasAnimatedRef.current = false;

    if (animType === 'fixed') {
      setCurrentDisplay(getFixedDisplay());
      return;
    }

    const start = startVal ?? 0;
    const end = endVal ?? 0;
    const animDur = Math.max(100, duration ?? 2000);

    const el = elementRef.current;
    if (!el) return;

    let startTime: number | null = null;

    const runAnimation = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animDur, 1);
      
      // Easing out quadratic curve for smooth natural counter motion
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const val = Math.round(start + (end - start) * easeProgress);

      setCurrentDisplay(val);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(runAnimation);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          animationFrameRef.current = requestAnimationFrame(runAnimation);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animType, startVal, endVal, duration, value]);

  const displayString = String(currentDisplay);
  const safeUnit = unit ?? '';
  // Avoid duplicate suffix if value string already includes unit
  const formattedText = safeUnit && displayString.endsWith(safeUnit)
    ? displayString
    : `${displayString}${safeUnit}`;

  return (
    <div ref={elementRef} className={className}>
      <div className={valueClassName}>
        {formattedText}
      </div>
      <div className={labelClassName}>
        {label}
      </div>
    </div>
  );
}
