import React from 'react';
import {
  getOptimizedUnsplashUrl,
  getUnsplashSrcSet,
  UnsplashOptions,
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
}

/**
 * Reusable Optimized Image component for Unsplash & web assets.
 * Automatically handles:
 * - Domain verification (images.unsplash.com & plus.unsplash.com)
 * - fm=webp & q=55 optimal compression
 * - decoding="async" & loading="lazy" (or fetchpriority="high" for LCP)
 * - Responsive srcset generation
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 600,
  height,
  quality = 55,
  widths,
  isLcp = false,
  className = 'w-full h-full object-cover',
  sizes,
  ...restProps
}) => {
  if (!src) return null;

  const options: UnsplashOptions = {
    width,
    height,
    quality,
    format: 'webp',
  };

  const optimizedSrc = getOptimizedUnsplashUrl(src, options);
  const srcSetString = widths && widths.length > 0
    ? getUnsplashSrcSet(src, widths, quality, 'webp')
    : undefined;

  return (
    <img
      src={optimizedSrc}
      srcSet={srcSetString}
      sizes={sizes || (widths ? '(max-width: 768px) 100vw, 600px' : undefined)}
      alt={alt}
      width={width}
      height={height}
      loading={isLcp ? undefined : 'lazy'}
      fetchPriority={isLcp ? 'high' : undefined}
      decoding="async"
      className={className}
      {...restProps}
    />
  );
};

export default OptimizedImage;
