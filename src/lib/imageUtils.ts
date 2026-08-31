/**
 * Utility to transform, optimize, and constrain external image URLs (especially Unsplash)
 * for maximum web performance, applying WebP format, lightweight compression (q=50-65),
 * and strictly capped dimensions (preventing oversized query parameters).
 */

export interface UnsplashOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  fit?: string;
}

export type ImageContext = 'featured' | 'body' | 'avatar' | 'og' | 'thumbnail' | 'general';

const MAX_FEATURED_WIDTH = 960;
const MAX_BODY_WIDTH = 750;
const MAX_AVATAR_WIDTH = 140;
const MAX_THUMBNAIL_WIDTH = 500;
const MAX_OG_WIDTH = 1200;
const MAX_GENERAL_WIDTH = 800;

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
 * Optimizes Unsplash image URLs dynamically with strict dimension boundaries.
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

  // Cap width to maximum sensible layout dimension (never exceed 1200px)
  const constrainedWidth = Math.min(Math.max(width, 40), 1200);

  try {
    const parsed = new URL(url);
    parsed.searchParams.set('w', constrainedWidth.toString());
    parsed.searchParams.set('q', quality.toString());
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', fit);
    parsed.searchParams.set('fm', format);

    if (height) {
      const constrainedHeight = Math.min(Math.max(height, 40), 800);
      parsed.searchParams.set('h', constrainedHeight.toString());
    } else {
      parsed.searchParams.delete('h');
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Sanitizes and enforces lean, optimized dimension query variables for user-inputted image URLs.
 * Especially effective for Unsplash URLs pasted from browser or raw links.
 */
export function sanitizeAndOptimizeImageUrl(
  url: string | undefined | null,
  context: ImageContext = 'general'
): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (!isUnsplashUrl(trimmed)) {
    // If not Unsplash, return clean trimmed URL
    return trimmed;
  }

  let targetWidth = MAX_GENERAL_WIDTH;
  let targetHeight: number | undefined = undefined;
  let quality = 60;

  switch (context) {
    case 'featured':
      targetWidth = MAX_FEATURED_WIDTH;
      quality = 65;
      break;
    case 'body':
      targetWidth = MAX_BODY_WIDTH;
      quality = 60;
      break;
    case 'avatar':
      targetWidth = MAX_AVATAR_WIDTH;
      quality = 55;
      break;
    case 'thumbnail':
      targetWidth = MAX_THUMBNAIL_WIDTH;
      quality = 55;
      break;
    case 'og':
      targetWidth = MAX_OG_WIDTH;
      targetHeight = 630;
      quality = 70;
      break;
    case 'general':
    default:
      targetWidth = MAX_GENERAL_WIDTH;
      quality = 60;
      break;
  }

  return getOptimizedUnsplashUrl(trimmed, {
    width: targetWidth,
    height: targetHeight,
    quality,
    format: 'webp',
    fit: 'crop',
  });
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
 * Scans markdown text and normalizes/constrains all embedded Unsplash image URLs to lightweight dimensions.
 */
export function sanitizeMarkdownImageUrls(markdown: string): string {
  if (!markdown) return '';

  // 1. Match Markdown images: ![alt](url)
  const markdownImgRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s\)]+)\)/g;
  let updated = markdown.replace(markdownImgRegex, (match, alt, url) => {
    if (isUnsplashUrl(url)) {
      const sanitized = sanitizeAndOptimizeImageUrl(url, 'body');
      return `![${alt}](${sanitized})`;
    }
    return match;
  });

  // 2. Match HTML <img> tags: <img ... src="url" ...>
  const htmlImgRegex = /<img\s+([^>]*?)src=["'](https?:\/\/[^"'\s]+)["']([^>]*?)>/gi;
  updated = updated.replace(htmlImgRegex, (match, before, url, after) => {
    if (isUnsplashUrl(url)) {
      const sanitized = sanitizeAndOptimizeImageUrl(url, 'body');
      return `<img ${before}src="${sanitized}"${after}>`;
    }
    return match;
  });

  return updated;
}

/**
 * Generates a responsive srcset string for Unsplash images
 */
export function getUnsplashSrcSet(
  url: string | undefined | null,
  widths: number[] = [360, 640, 840],
  quality = 55,
  format = 'webp'
): string | undefined {
  if (!url || !isUnsplashUrl(url)) return undefined;
  return widths
    .map((w) => `${getOptimizedUnsplashUrl(url, { width: w, quality, format })} ${w}w`)
    .join(', ');
}

/**
 * Helper for avatar/profile images (small footprint ~36px-80px, w=80-120, q=55)
 */
export function getOptimizedAvatarUrl(
  url: string | undefined | null,
  defaultWidth = 100,
  quality = 55,
  fallback = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'
): string {
  const targetUrl = url || fallback;
  return sanitizeAndOptimizeImageUrl(targetUrl, 'avatar');
}
