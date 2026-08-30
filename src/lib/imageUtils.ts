/**
 * Utility to transform and optimize Unsplash image URLs for performance,
 * preventing over-resizing, applying WebP format, and adjusting compression quality.
 */

export function optimizeUnsplashUrl(
  url: string | undefined | null,
  targetWidth = 600,
  quality = 65,
  format = 'webp',
  targetHeight?: number
): string {
  if (!url) return '';
  if (!url.includes('unsplash.com')) return url;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set('w', targetWidth.toString());
    parsed.searchParams.set('q', quality.toString());
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', 'crop');
    parsed.searchParams.set('fm', format);
    if (targetHeight) {
      parsed.searchParams.set('h', targetHeight.toString());
    } else {
      parsed.searchParams.delete('h');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Helper to generate responsive srcset string for Unsplash images
 */
export function getUnsplashSrcSet(
  url: string | undefined | null,
  widths: number[] = [400, 600],
  quality = 65,
  format = 'webp'
): string | undefined {
  if (!url || !url.includes('unsplash.com')) return undefined;
  return widths
    .map((w) => `${optimizeUnsplashUrl(url, w, quality, format)} ${w}w`)
    .join(', ');
}

/**
 * Helper for avatar images (small profile pictures ~24px-80px)
 */
export function getOptimizedAvatarUrl(
  url: string | undefined | null,
  defaultWidth = 60,
  quality = 60,
  fallback = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'
): string {
  const targetUrl = url || fallback;
  return optimizeUnsplashUrl(targetUrl, defaultWidth, quality, 'webp');
}
