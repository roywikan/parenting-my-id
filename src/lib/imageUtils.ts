/**
 * Utility to transform, optimize, and constrain external image URLs (Unsplash & Cloudinary)
 * for maximum Google PageSpeed Insights performance and responsiveness across mobile, tablet, and desktop:
 * - Dynamic srcset & sizes generation (e.g., 400w, 750w, 1200w)
 * - CDN parameter tuning (Unsplash: fm=webp, q=50-60, dynamic w; Cloudinary: w_*, f_auto, q_auto:low)
 * - Strict avatar constraints (max w=100, fm=webp, q=60)
 * - Standard loading="lazy", decoding="async", width, height injection
 */

export interface UnsplashOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  fit?: string;
}

export interface CloudinaryOptions {
  width?: number;
  height?: number;
  quality?: string;
  format?: string;
  crop?: string;
}

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  crop?: string;
}

export type ImageContext = 'featured' | 'body' | 'avatar' | 'og' | 'thumbnail' | 'general';

export const MAX_FEATURED_WIDTH = 1200;
export const MAX_BODY_WIDTH = 750;
export const MAX_AVATAR_WIDTH = 100; // Strictly capped at 100px for avatars
export const MAX_THUMBNAIL_WIDTH = 400;
export const MAX_OG_WIDTH = 1200;
export const MAX_GENERAL_WIDTH = 800;

/**
 * Validates if the given URL originates from Unsplash
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
 * Validates if the given URL originates from Cloudinary
 */
export function isCloudinaryUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === 'res.cloudinary.com' || hostname.endsWith('.cloudinary.com');
  } catch {
    return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
  }
}

/**
 * Checks if the image URL can be dynamically optimized via CDN parameters
 */
export function isOptimizableImageUrl(url: string | undefined | null): boolean {
  return isUnsplashUrl(url) || isCloudinaryUrl(url);
}

/**
 * Optimizes Unsplash image URLs dynamically with strict dimension boundaries.
 * Enforces fm=webp, q=50-60, and exact w parameters.
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

  // Constrain width to 40 - 1200px
  const constrainedWidth = Math.min(Math.max(Math.round(width), 32), 1200);

  try {
    const parsed = new URL(url);
    parsed.searchParams.set('w', constrainedWidth.toString());
    parsed.searchParams.set('q', Math.min(Math.max(quality, 50), 65).toString());
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', fit);
    parsed.searchParams.set('fm', format);

    if (height) {
      const constrainedHeight = Math.min(Math.max(Math.round(height), 32), 900);
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
 * Optimizes Cloudinary image URLs dynamically with responsive transformation parameters:
 * f_auto, q_auto:low, w_<width>, c_limit (or c_fill for avatars)
 */
export function getOptimizedCloudinaryUrl(
  url: string | undefined | null,
  options: CloudinaryOptions = {}
): string {
  if (!url) return '';
  if (!isCloudinaryUrl(url)) return url;

  const {
    width = 600,
    height,
    quality = 'auto:low',
    format = 'auto',
    crop = 'limit',
  } = options;

  const constrainedWidth = Math.min(Math.max(Math.round(width), 32), 1200);

  // Cloudinary upload pattern: /image/upload/...
  const uploadIndex = url.indexOf('/image/upload/');
  if (uploadIndex === -1) {
    const simpleUploadIndex = url.indexOf('/upload/');
    if (simpleUploadIndex === -1) return url;
  }

  const marker = url.includes('/image/upload/') ? '/image/upload/' : '/upload/';
  const markerIdx = url.indexOf(marker);
  const prefix = url.substring(0, markerIdx + marker.length);
  let rest = url.substring(markerIdx + marker.length);

  // Remove existing transformation segment if present
  const segments = rest.split('/');
  if (
    segments.length > 1 &&
    (segments[0].includes('w_') ||
      segments[0].includes('h_') ||
      segments[0].includes('f_') ||
      segments[0].includes('q_') ||
      segments[0].includes('c_'))
  ) {
    segments.shift();
    rest = segments.join('/');
  }

  const transforms: string[] = [];
  transforms.push(`w_${constrainedWidth}`);
  if (height) {
    const constrainedHeight = Math.min(Math.max(Math.round(height), 32), 900);
    transforms.push(`h_${constrainedHeight}`);
  }
  if (crop) transforms.push(`c_${crop}`);
  if (format) transforms.push(`f_${format}`);
  if (quality) transforms.push(`q_${quality}`);

  return `${prefix}${transforms.join(',')}/${rest}`;
}

/**
 * Universal dynamic image optimizer for Unsplash, Cloudinary, and general URLs
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  options: ImageOptimizationOptions = {}
): string {
  if (!url) return '';
  if (isUnsplashUrl(url)) {
    return getOptimizedUnsplashUrl(url, {
      width: options.width,
      height: options.height,
      quality: options.quality || 55,
      format: options.format || 'webp',
      fit: options.crop || 'crop',
    });
  }
  if (isCloudinaryUrl(url)) {
    return getOptimizedCloudinaryUrl(url, {
      width: options.width,
      height: options.height,
      quality: 'auto:low',
      format: options.format || 'auto',
      crop: options.crop || 'limit',
    });
  }
  return url;
}

/**
 * Generates a responsive srcset string for Unsplash, Cloudinary, or supported CDNs
 * Default breakpoints: 400w (mobile), 750w (tablet), 1200w (desktop)
 */
export function getResponsiveSrcSet(
  url: string | undefined | null,
  widths: number[] = [400, 750, 1200],
  quality = 55
): string | undefined {
  if (!url) return undefined;

  if (isUnsplashUrl(url)) {
    return widths
      .map((w) => `${getOptimizedUnsplashUrl(url, { width: w, quality, format: 'webp' })} ${w}w`)
      .join(', ');
  }

  if (isCloudinaryUrl(url)) {
    return widths
      .map((w) => `${getOptimizedCloudinaryUrl(url, { width: w, quality: 'auto:low', format: 'auto' })} ${w}w`)
      .join(', ');
  }

  return undefined;
}

/**
 * Generates a responsive srcset string specifically for Unsplash images (backward compatibility)
 */
export function getUnsplashSrcSet(
  url: string | undefined | null,
  widths: number[] = [400, 750, 1200],
  quality = 55,
  format = 'webp'
): string | undefined {
  if (!url || !isUnsplashUrl(url)) return undefined;
  return widths
    .map((w) => `${getOptimizedUnsplashUrl(url, { width: w, quality, format })} ${w}w`)
    .join(', ');
}

/**
 * Generates a responsive srcset string specifically for Cloudinary images
 */
export function getCloudinarySrcSet(
  url: string | undefined | null,
  widths: number[] = [400, 800, 1200]
): string | undefined {
  if (!url || !isCloudinaryUrl(url)) return undefined;
  return widths
    .map((w) => `${getOptimizedCloudinaryUrl(url, { width: w, quality: 'auto:low', format: 'auto' })} ${w}w`)
    .join(', ');
}

/**
 * Helper for avatar/profile images (Rule 3):
 * Strictly capped at max w=100 with WebP format and quality q=60.
 * Prevents loading massive images for 24px-36px UI avatars.
 */
export function getOptimizedAvatarUrl(
  url: string | undefined | null,
  targetSize = 60,
  quality = 60,
  fallback = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'
): string {
  const targetUrl = url && url.trim() ? url.trim() : fallback;

  // Cap size strictly at 100px (Rule 3)
  const cappedWidth = Math.min(Math.max(Math.round(targetSize * 1.5), 32), MAX_AVATAR_WIDTH);

  if (isUnsplashUrl(targetUrl)) {
    return getOptimizedUnsplashUrl(targetUrl, {
      width: cappedWidth,
      height: cappedWidth,
      quality: Math.min(Math.max(quality, 50), 60),
      format: 'webp',
      fit: 'crop',
    });
  }

  if (isCloudinaryUrl(targetUrl)) {
    return getOptimizedCloudinaryUrl(targetUrl, {
      width: cappedWidth,
      height: cappedWidth,
      quality: 'auto:low',
      format: 'auto',
      crop: 'fill',
    });
  }

  // Optimize ui-avatars.com if used
  if (targetUrl.includes('ui-avatars.com')) {
    try {
      const parsed = new URL(targetUrl);
      parsed.searchParams.set('size', cappedWidth.toString());
      return parsed.toString();
    } catch {
      return targetUrl;
    }
  }

  return targetUrl;
}

/**
 * Sanitizes and enforces lean, optimized dimension query variables for user-inputted image URLs.
 */
export function sanitizeAndOptimizeImageUrl(
  url: string | undefined | null,
  context: ImageContext = 'general'
): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  let targetWidth = MAX_GENERAL_WIDTH;
  let targetHeight: number | undefined = undefined;
  let quality = 60;

  switch (context) {
    case 'featured':
      targetWidth = MAX_FEATURED_WIDTH;
      quality = 60;
      break;
    case 'body':
      targetWidth = MAX_BODY_WIDTH;
      quality = 55;
      break;
    case 'avatar':
      targetWidth = MAX_AVATAR_WIDTH;
      quality = 60;
      break;
    case 'thumbnail':
      targetWidth = MAX_THUMBNAIL_WIDTH;
      quality = 55;
      break;
    case 'og':
      targetWidth = MAX_OG_WIDTH;
      targetHeight = 630;
      quality = 65;
      break;
    case 'general':
    default:
      targetWidth = MAX_GENERAL_WIDTH;
      quality = 55;
      break;
  }

  if (context === 'avatar') {
    return getOptimizedAvatarUrl(trimmed, 60, quality);
  }

  return getOptimizedImageUrl(trimmed, {
    width: targetWidth,
    height: targetHeight,
    quality,
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
  if (!url) return '';
  if (isCloudinaryUrl(url)) {
    return getOptimizedCloudinaryUrl(url, {
      width: targetWidth,
      height: targetHeight,
      quality: 'auto:low',
      format: 'auto',
      crop: targetHeight ? 'fill' : 'limit',
    });
  }
  return getOptimizedUnsplashUrl(url, {
    width: targetWidth,
    height: targetHeight,
    quality,
    format,
  });
}

/**
 * Scans markdown text and normalizes/constrains all embedded image URLs to lightweight dimensions.
 */
export function sanitizeMarkdownImageUrls(markdown: string): string {
  if (!markdown) return '';

  // 1. Match Markdown images: ![alt](url)
  const markdownImgRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s\)]+)\)/g;
  let updated = markdown.replace(markdownImgRegex, (match, alt, url) => {
    if (isOptimizableImageUrl(url)) {
      const sanitized = sanitizeAndOptimizeImageUrl(url, 'body');
      return `![${alt}](${sanitized})`;
    }
    return match;
  });

  // 2. Match HTML <img> tags: <img ... src="url" ...>
  const htmlImgRegex = /<img\s+([^>]*?)src=["'](https?:\/\/[^"'\s]+)["']([^>]*?)>/gi;
  updated = updated.replace(htmlImgRegex, (match, before, url, after) => {
    if (isOptimizableImageUrl(url)) {
      const sanitized = sanitizeAndOptimizeImageUrl(url, 'body');
      return `<img ${before}src="${sanitized}"${after}>`;
    }
    return match;
  });

  return updated;
}

/**
 * Intercepts every <img> tag in HTML output (e.g. rendered markdown articles)
 * and enhances it with responsive srcset (400w, 750w, 1200w), sizes, width, height,
 * loading="lazy", and decoding="async" to meet strict Google PageSpeed Insights standards.
 */
export function transformHtmlImgTags(
  html: string,
  options: {
    defaultSizes?: string;
    isLcp?: boolean;
  } = {}
): string {
  if (!html) return '';

  const {
    defaultSizes = '(max-width: 640px) 100vw, (max-width: 1024px) 750px, 1200px',
    isLcp = false,
  } = options;

  return html.replace(/<img\b([^>]*?)>/gi, (match, attrs) => {
    // Extract src
    const srcMatch = attrs.match(/\bsrc=["']([^"']+)["']/i);
    if (!srcMatch) return match;

    const rawSrc = srcMatch[1];
    let newAttrs = attrs;

    const isAvatar =
      /\b(rounded-full|avatar|profile|author)\b/i.test(attrs) ||
      /\bwidth=["']([1-9]|[1-9][0-9]|100)["']/i.test(attrs);

    if (isAvatar) {
      const optimizedAvatar = getOptimizedAvatarUrl(rawSrc, 60, 60);
      newAttrs = newAttrs.replace(srcMatch[0], `src="${optimizedAvatar}"`);
      if (!/\bwidth=["'][^"']*["']/i.test(newAttrs)) newAttrs += ' width="48"';
      if (!/\bheight=["'][^"']*["']/i.test(newAttrs)) newAttrs += ' height="48"';
      if (!/\bloading=["'][^"']*["']/i.test(newAttrs)) newAttrs += ' loading="lazy"';
      if (!/\bdecoding=["'][^"']*["']/i.test(newAttrs)) newAttrs += ' decoding="async"';
      return `<img ${newAttrs.trim()}>`;
    }

    // 1. Responsive srcset & sizes for Unsplash / Cloudinary
    if (isOptimizableImageUrl(rawSrc)) {
      const responsiveSrcSet = getResponsiveSrcSet(rawSrc, [400, 750, 1200], 55);
      if (responsiveSrcSet) {
        if (/\bsrcset=["'][^"']*["']/i.test(newAttrs)) {
          newAttrs = newAttrs.replace(/\bsrcset=["'][^"']*["']/i, `srcset="${responsiveSrcSet}"`);
        } else {
          newAttrs += ` srcset="${responsiveSrcSet}"`;
        }

        if (!/\bsizes=["'][^"']*["']/i.test(newAttrs)) {
          newAttrs += ` sizes="${defaultSizes}"`;
        }
      }

      // Optimize base src
      const optimizedBaseSrc = getOptimizedImageUrl(rawSrc, { width: 750, quality: 55 });
      newAttrs = newAttrs.replace(srcMatch[0], `src="${optimizedBaseSrc}"`);
    }

    // 2. Ensure loading attribute
    if (!/\bloading=["'][^"']*["']/i.test(newAttrs)) {
      newAttrs += isLcp ? ' loading="eager"' : ' loading="lazy"';
    }

    // 3. Ensure decoding attribute
    if (!/\bdecoding=["'][^"']*["']/i.test(newAttrs)) {
      newAttrs += ' decoding="async"';
    }

    // 4. Ensure fetchpriority for LCP
    if (isLcp && !/\bfetchpriority=["'][^"']*["']/i.test(newAttrs)) {
      newAttrs += ' fetchpriority="high"';
    }

    // 5. Ensure width & height to eliminate CLS (Cumulative Layout Shift) if missing
    if (!/\bwidth=["'][^"']*["']/i.test(newAttrs)) {
      newAttrs += ' width="750"';
    }
    if (!/\bheight=["'][^"']*["']/i.test(newAttrs)) {
      newAttrs += ' height="422"';
    }

    return `<img ${newAttrs.trim()}>`;
  });
}
