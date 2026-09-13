/**
 * High-Performance Client-Side Automatic Image Optimizer Script
 * Meets strict Google PageSpeed Insights criteria:
 * 1. Responsive images with srcset (400w, 750w, 1200w) & sizes
 * 2. Dynamic CDN parameter tuning for Unsplash: fm=webp, q=50-60, dynamic w=
 * 3. Avatar / profile picture constraints: max w=100, fm=webp, q=60
 * 4. Cloudinary dynamic transformation: w_400, w_800, w_1200, f_auto, q_auto:low
 * 5. Explicit width, height, loading="lazy", and decoding="async" (or loading="eager"/fetchpriority="high" for LCP)
 * 6. MutationObserver for continuous zero-lag optimization of newly injected DOM elements
 */

export function initGlobalImageOptimizer() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const isUnsplash = (url: string) =>
    url.includes('images.unsplash.com') || url.includes('plus.unsplash.com');

  const isCloudinary = (url: string) =>
    url.includes('cloudinary.com') || url.includes('res.cloudinary.com');

  const isUiAvatar = (url: string) => url.includes('ui-avatars.com');

  function getCleanUnsplashBase(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return url.split('?')[0];
    }
  }

  function parseCloudinaryParts(url: string): { prefix: string; rest: string } | null {
    const marker = url.includes('/image/upload/') ? '/image/upload/' : '/upload/';
    const markerIdx = url.indexOf(marker);
    if (markerIdx === -1) return null;

    const prefix = url.substring(0, markerIdx + marker.length);
    let rest = url.substring(markerIdx + marker.length);

    // If already has transformation segment, strip it
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

    return { prefix, rest };
  }

  function isAvatarElement(img: HTMLImageElement): boolean {
    // 1. Explicit classes
    const classList = img.className || '';
    if (
      classList.includes('rounded-full') ||
      classList.includes('avatar') ||
      classList.includes('profile') ||
      classList.includes('author')
    ) {
      return true;
    }

    // 2. Explicit width / height <= 120
    const attrW = parseInt(img.getAttribute('width') || '0', 10);
    const attrH = parseInt(img.getAttribute('height') || '0', 10);
    if ((attrW > 0 && attrW <= 100) || (attrH > 0 && attrH <= 100)) {
      return true;
    }

    // 3. Parent container check
    const parent = img.parentElement;
    if (parent) {
      const pClass = parent.className || '';
      if (
        pClass.includes('rounded-full') ||
        pClass.includes('w-6') ||
        pClass.includes('w-8') ||
        pClass.includes('w-9') ||
        pClass.includes('w-10') ||
        pClass.includes('w-11') ||
        pClass.includes('w-12') ||
        pClass.includes('w-14') ||
        pClass.includes('w-16') ||
        pClass.includes('w-20') ||
        pClass.includes('w-24')
      ) {
        return true;
      }
    }

    return false;
  }

  function optimizeDomImage(img: HTMLImageElement) {
    if (!img || img.dataset.imgAutoOptimized === 'true') return;

    const currentSrc = img.getAttribute('src');
    if (!currentSrc || currentSrc.startsWith('data:') || currentSrc.startsWith('blob:')) {
      return;
    }

    const screenWidth = Math.max(window.innerWidth || 0, window.screen?.width || 0);
    const isMobile = screenWidth <= 640;
    const isTablet = screenWidth > 640 && screenWidth <= 1024;

    const isAvatar = isAvatarElement(img);
    const isLcp =
      img.getAttribute('loading') === 'eager' ||
      img.getAttribute('fetchpriority') === 'high' ||
      img.hasAttribute('data-lcp');

    // Rule 5: Ensure loading and decoding attributes
    if (!img.getAttribute('loading')) {
      img.setAttribute('loading', isLcp ? 'eager' : 'lazy');
    }
    if (!img.getAttribute('decoding')) {
      img.setAttribute('decoding', 'async');
    }
    if (isLcp && !img.getAttribute('fetchpriority')) {
      img.setAttribute('fetchpriority', 'high');
    }

    // -------------------------------------------------------------
    // AVATAR / PROFILE PICTURE OPTIMIZATION (Rule 3)
    // Capped strictly at max w=100, fm=webp, q=60
    // -------------------------------------------------------------
    if (isAvatar) {
      if (isUnsplash(currentSrc)) {
        const base = getCleanUnsplashBase(currentSrc);
        img.src = `${base}?auto=format&fit=crop&w=100&h=100&q=60&fm=webp`;
      } else if (isCloudinary(currentSrc)) {
        const parts = parseCloudinaryParts(currentSrc);
        if (parts) {
          img.src = `${parts.prefix}w_100,h_100,c_fill,f_auto,q_auto:low/${parts.rest}`;
        }
      } else if (isUiAvatar(currentSrc)) {
        try {
          const parsed = new URL(currentSrc);
          parsed.searchParams.set('size', '100');
          img.src = parsed.toString();
        } catch {
          // keep existing
        }
      }

      // Default avatar width/height if missing
      if (!img.getAttribute('width')) img.setAttribute('width', '40');
      if (!img.getAttribute('height')) img.setAttribute('height', '40');

      img.dataset.imgAutoOptimized = 'true';
      return;
    }

    // -------------------------------------------------------------
    // CONTENT / HERO / CARD IMAGE OPTIMIZATION (Rules 1, 2, 4)
    // -------------------------------------------------------------
    if (isUnsplash(currentSrc)) {
      const base = getCleanUnsplashBase(currentSrc);

      // Rule 1 & 2: Responsive srcset with 400w, 750w, 1200w, fm=webp, q=50-60
      if (!img.getAttribute('srcset')) {
        const srcSet = `${base}?auto=format&fit=crop&w=400&q=50&fm=webp 400w, ${base}?auto=format&fit=crop&w=750&q=55&fm=webp 750w, ${base}?auto=format&fit=crop&w=1200&q=55&fm=webp 1200w`;
        img.setAttribute('srcset', srcSet);
      }

      if (!img.getAttribute('sizes')) {
        img.setAttribute('sizes', '(max-width: 640px) 100vw, (max-width: 1024px) 750px, 1200px');
      }

      // Auto-modify primary src to fit current user screen as lightweight as possible
      const optimalWidth = isMobile ? 400 : isTablet ? 750 : 1200;
      const optimalQuality = isMobile ? 50 : 55;
      img.src = `${base}?auto=format&fit=crop&w=${optimalWidth}&q=${optimalQuality}&fm=webp`;
    } else if (isCloudinary(currentSrc)) {
      const parts = parseCloudinaryParts(currentSrc);
      if (parts) {
        // Rule 4: Responsive Cloudinary srcset with w_400, w_800, w_1200, f_auto, q_auto:low
        if (!img.getAttribute('srcset')) {
          const srcSet = `${parts.prefix}w_400,c_limit,f_auto,q_auto:low/${parts.rest} 400w, ${parts.prefix}w_800,c_limit,f_auto,q_auto:low/${parts.rest} 800w, ${parts.prefix}w_1200,c_limit,f_auto,q_auto:low/${parts.rest} 1200w`;
          img.setAttribute('srcset', srcSet);
        }

        if (!img.getAttribute('sizes')) {
          img.setAttribute('sizes', '(max-width: 640px) 100vw, (max-width: 1024px) 800px, 1200px');
        }

        const optimalWidth = isMobile ? 400 : isTablet ? 800 : 1200;
        img.src = `${parts.prefix}w_${optimalWidth},c_limit,f_auto,q_auto:low/${parts.rest}`;
      }
    }

    // Ensure explicit dimensions to prevent CLS
    if (!img.getAttribute('width')) {
      img.setAttribute('width', isLcp ? '1200' : '400');
    }
    if (!img.getAttribute('height')) {
      img.setAttribute('height', isLcp ? '675' : '225');
    }

    img.dataset.imgAutoOptimized = 'true';
  }

  function processAllImages() {
    const images = document.querySelectorAll<HTMLImageElement>('img:not([data-img-auto-optimized="true"])');
    images.forEach(optimizeDomImage);
  }

  // 1. Run immediately on current images
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processAllImages);
  } else {
    processAllImages();
  }

  // 2. MutationObserver to intercept dynamically rendered components, markdown, comments
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.tagName === 'IMG') {
              optimizeDomImage(el as HTMLImageElement);
            } else if (el.getElementsByTagName) {
              const nestedImgs = el.getElementsByTagName('img');
              if (nestedImgs.length > 0) {
                for (let j = 0; j < nestedImgs.length; j++) {
                  optimizeDomImage(nestedImgs[j]);
                }
              }
            }
          }
        }
      } else if (
        mutation.type === 'attributes' &&
        mutation.target.nodeName === 'IMG' &&
        mutation.attributeName === 'src'
      ) {
        optimizeDomImage(mutation.target as HTMLImageElement);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src'],
  });

  // Re-scan on window resize / orientation change
  let resizeTimer: any = null;
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(processAllImages, 250);
    },
    { passive: true }
  );
}
