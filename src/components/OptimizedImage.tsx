import React from 'react';
import {
  getOptimizedImageUrl,
  getResponsiveSrcSet,
} from '../lib/imageUtils';

export interface OptimizedImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | undefined | null;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  widths?: number[];
  isLcp?: boolean;
  crop?: string;
}

/**
 * Reusable Optimized Responsive Image component for Unsplash, Cloudinary & web assets.
 * Automatically fulfills Google PageSpeed Insights criteria:
 * - Responsive srcset (e.g. 400w, 750w, 1200w) & sizes attribute
 * - CDN parameter tuning (WebP format, q=50-60, dynamic w)
 * - Explicit width & height to eliminate CLS (Cumulative Layout Shift)
 * - loading="lazy" & decoding="async" (or loading="eager" & fetchPriority="high" for LCP)
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 750,
  height,
  quality = 55,
  widths = [400, 750, 1200],
  isLcp = false,
  crop = 'crop',
  className = 'w-full h-full object-cover',
  sizes,
  ...restProps
}) => {
  if (!src) return null;

  const optimizedSrc = getOptimizedImageUrl(src, {
    width,
    height,
    quality,
    crop,
  });

  const srcSetString = getResponsiveSrcSet(src, widths, quality);
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 750px, 1200px';

  return (
    <img
      src={optimizedSrc}
      srcSet={srcSetString}
      sizes={defaultSizes}
      alt={alt}
      width={width}
      height={height || (width ? Math.round((width * 9) / 16) : undefined)}
      loading={isLcp ? 'eager' : 'lazy'}
      fetchPriority={isLcp ? 'high' : undefined}
      decoding="async"
      className={className}
      {...restProps}
    />
  );
};

export default OptimizedImage;
