/**
 * Utility to transform and optimize Unsplash image URLs for maximum performance,
 * applying WebP format, q=50-55 compression, and dynamic dimension sizing.
 */

export interface UnsplashOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  fit?: string;
}

/**
 * Validates if the given URL originates from Unsplash (images.unsplash.com or plus.unsplash.com)
 */
export function isUnsplashUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return (
      hostname === 'images.unsplash.com' ||
      hostname === 'plus.unsplash.com' ||
      hostname.endsWith('.unsplash.com')
    );
  } catch {
    return url.includes('unsplash.com');
  }
}

/**
 * Optimizes Unsplash image URLs dynamically.
 * Default settings: w=600, q=55, fm=webp, fit=crop, auto=format
 */
export function getOptimizedUnsplashUrl(
  url: string | undefined | null,
  options: UnsplashOptions = {}
): string {
  if (!url) return '';
  if (!isUnsplashUrl(url)) return url;

  const {
    width = 600,
    height,
    quality = 55,
    format = 'webp',
    fit = 'crop',
  } = options;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set('w', width.toString());
    parsed.searchParams.set('q', quality.toString());
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', fit);
    parsed.searchParams.set('fm', format);

    if (height) {
      parsed.searchParams.set('h', height.toString());
    } else {
      parsed.searchParams.delete('h');
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Positional argument overload for backward compatibility with existing codebase
 */
export function optimizeUnsplashUrl(
  url: string | undefined | null,
  targetWidth = 600,
  quality = 55,
  format = 'webp',
  targetHeight?: number
): string {
  return getOptimizedUnsplashUrl(url, {
    width: targetWidth,
    height: targetHeight,
    quality,
    format,
  });
}

/**
 * Generates a responsive srcset string for Unsplash images
 */
export function getUnsplashSrcSet(
  url: string | undefined | null,
  widths: number[] = [400, 600],
  quality = 55,
  format = 'webp'
): string | undefined {
  if (!url || !isUnsplashUrl(url)) return undefined;
  return widths
    .map((w) => `${getOptimizedUnsplashUrl(url, { width: w, quality, format })} ${w}w`)
    .join(', ');
}

/**
 * Helper for avatar/profile images (small footprint ~36px-80px, w=80, q=50)
 */
export function getOptimizedAvatarUrl(
  url: string | undefined | null,
  defaultWidth = 80,
  quality = 50,
  fallback = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'
): string {
  const targetUrl = url || fallback;
  return getOptimizedUnsplashUrl(targetUrl, {
    width: defaultWidth,
    quality,
    format: 'webp',
  });
}

