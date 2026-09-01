import React from 'react';
import { SiteConfig } from '../types';
import AnimatedMetricItem from './AnimatedMetricItem';

interface HeroPerformanceBoxProps {
  siteConfig?: SiteConfig;
  containerClassName?: string;
  valueClassName?: string;
  labelClassName?: string;
}

export default function HeroPerformanceBox({
  siteConfig,
  containerClassName = '',
  valueClassName = 'text-xl sm:text-2xl font-black text-emerald-400',
  labelClassName = 'text-[10px] text-rose-200 uppercase font-semibold',
}: HeroPerformanceBoxProps) {
  if (siteConfig?.show_performance_box === false) return null;

  const show1 = (siteConfig?.metric_1_show ?? siteConfig?.metric1_show) !== false;
  const show2 = (siteConfig?.metric_2_show ?? siteConfig?.metric2_show) !== false;
  const show3 = (siteConfig?.metric_3_show ?? siteConfig?.metric3_show) !== false;

  if (!show1 && !show2 && !show3) return null;

  const visibleCount = (show1 ? 1 : 0) + (show2 ? 1 : 0) + (show3 ? 1 : 0);
  const gridCols = visibleCount === 3 ? 'grid-cols-3' : visibleCount === 2 ? 'grid-cols-2' : 'grid-cols-1';

  const defaultContainerStyle = 'grid gap-3 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center w-full md:w-auto shrink-0 min-w-[180px]';
  const finalContainerClass = containerClassName
    ? `grid ${gridCols} ${containerClassName}`
    : `${defaultContainerStyle} ${gridCols}`;

  return (
    <div className={finalContainerClass}>
      {show1 && (
        <AnimatedMetricItem
          label={siteConfig?.metric1_label ?? 'Kecepatan'}
          value={siteConfig?.metric1_value ?? '99+'}
          animType={siteConfig?.metric1_anim_type ?? 'fixed'}
          startVal={siteConfig?.metric1_start_val ?? 0}
          endVal={siteConfig?.metric1_end_val ?? 99}
          duration={siteConfig?.metric1_duration ?? 2000}
          unit={siteConfig?.metric1_unit ?? '+'}
          valueClassName={valueClassName}
          labelClassName={labelClassName}
        />
      )}
      {show2 && (
        <AnimatedMetricItem
          label={siteConfig?.metric2_label ?? 'Kualitas'}
          value={siteConfig?.metric2_value ?? '100'}
          animType={siteConfig?.metric2_anim_type ?? 'fixed'}
          startVal={siteConfig?.metric2_start_val ?? 0}
          endVal={siteConfig?.metric2_end_val ?? 100}
          duration={siteConfig?.metric2_duration ?? 2000}
          unit={siteConfig?.metric2_unit ?? ''}
          valueClassName={valueClassName}
          labelClassName={labelClassName}
        />
      )}
      {show3 && (
        <AnimatedMetricItem
          label={siteConfig?.metric3_label ?? 'Respon Delay'}
          value={siteConfig?.metric3_value ?? '0ms'}
          animType={siteConfig?.metric3_anim_type ?? 'fixed'}
          startVal={siteConfig?.metric3_start_val ?? 100}
          endVal={siteConfig?.metric3_end_val ?? 0}
          duration={siteConfig?.metric3_duration ?? 2000}
          unit={siteConfig?.metric3_unit ?? 'ms'}
          valueClassName={valueClassName}
          labelClassName={labelClassName}
        />
      )}
    </div>
  );
}
