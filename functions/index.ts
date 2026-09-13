interface Env {
  DB?: any;
  SITE_NAME?: string;
  SITE_URL?: string;
}

function escapeHtml(unsafe: any): string {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isUnsplashUrl(url?: string | null): boolean {
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

function isCloudinaryUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === 'res.cloudinary.com' || hostname.endsWith('.cloudinary.com');
  } catch {
    return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
  }
}

function optimizeUnsplashUrl(
  url?: string | null,
  targetWidth = 600,
  quality = 55,
  format = 'webp',
  targetHeight?: number
): string {
  if (!url) return '';
  if (!isUnsplashUrl(url)) return url;
  try {
    const parsed = new URL(url);
    const constrainedW = Math.min(Math.max(Math.round(targetWidth), 32), 1200);
    parsed.searchParams.set('w', constrainedW.toString());
    parsed.searchParams.set('q', Math.min(Math.max(quality, 50), 65).toString());
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', 'crop');
    parsed.searchParams.set('fm', format);
    if (targetHeight) {
      const constrainedH = Math.min(Math.max(Math.round(targetHeight), 32), 900);
      parsed.searchParams.set('h', constrainedH.toString());
    } else {
      parsed.searchParams.delete('h');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function optimizeCloudinaryUrl(
  url?: string | null,
  targetWidth = 600,
  targetHeight?: number,
  crop = 'limit'
): string {
  if (!url) return '';
  if (!isCloudinaryUrl(url)) return url;

  const constrainedWidth = Math.min(Math.max(Math.round(targetWidth), 32), 1200);
  const marker = url.includes('/image/upload/') ? '/image/upload/' : '/upload/';
  const markerIdx = url.indexOf(marker);
  if (markerIdx === -1) return url;

  const prefix = url.substring(0, markerIdx + marker.length);
  let rest = url.substring(markerIdx + marker.length);

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

  const transforms: string[] = [`w_${constrainedWidth}`];
  if (targetHeight) {
    transforms.push(`h_${Math.min(Math.max(Math.round(targetHeight), 32), 900)}`);
  }
  if (crop) transforms.push(`c_${crop}`);
  transforms.push('f_auto', 'q_auto:low');

  return `${prefix}${transforms.join(',')}/${rest}`;
}

function getOptimizedImageUrl(
  url?: string | null,
  targetWidth = 600,
  targetHeight?: number,
  quality = 55
): string {
  if (!url) return '';
  if (isUnsplashUrl(url)) {
    return optimizeUnsplashUrl(url, targetWidth, quality, 'webp', targetHeight);
  }
  if (isCloudinaryUrl(url)) {
    return optimizeCloudinaryUrl(url, targetWidth, targetHeight, targetHeight ? 'fill' : 'limit');
  }
  return url;
}

function getResponsiveSrcSet(
  url?: string | null,
  widths = [400, 750, 1200],
  quality = 55
): string {
  if (!url) return '';
  if (isUnsplashUrl(url)) {
    return widths
      .map((w) => `${optimizeUnsplashUrl(url, w, quality, 'webp')} ${w}w`)
      .join(', ');
  }
  if (isCloudinaryUrl(url)) {
    return widths
      .map((w) => `${optimizeCloudinaryUrl(url, w, undefined, 'limit')} ${w}w`)
      .join(', ');
  }
  return '';
}

function getOptimizedAvatarUrl(
  url?: string | null,
  targetSize = 40,
  quality = 60
): string {
  if (!url) return 'https://ui-avatars.com/api/?name=U&size=80';
  // Strictly capped at max w=100 (Rule 3)
  const cappedW = Math.min(Math.max(Math.round(targetSize * 1.5), 32), 100);

  if (isUnsplashUrl(url)) {
    return optimizeUnsplashUrl(url, cappedW, quality, 'webp', cappedW);
  }
  if (isCloudinaryUrl(url)) {
    return optimizeCloudinaryUrl(url, cappedW, cappedW, 'fill');
  }
  if (url.includes('ui-avatars.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('size', cappedW.toString());
      return parsed.toString();
    } catch {
      return url;
    }
  }
  return url;
}

// RFC 9110 Content Negotiation helper honoring q-values and media type specificity.
// Supported media representations:
// - HTML: 'text/html', 'application/xhtml+xml', 'text/*', '*/*'
// - Markdown: 'text/markdown', 'text/x-markdown', 'text/*', '*/*'
//
// Rules:
// 1. Calculate highest-precedence quality weight (q-value) for each supported representation.
// 2. More specific media ranges (exact type/subtype) override wildcards.
// 3. If q(markdown) > 0 and q(markdown) > q(html), serve Markdown.
// 4. Otherwise (higher q for HTML, equal q, unsupported probe, or defaults), serve HTML.
function negotiateContent(acceptHeader: string | null | undefined): 'markdown' | 'html' {
  if (!acceptHeader || typeof acceptHeader !== 'string') return 'html';

  const entries = acceptHeader.split(',');
  const items: Array<{ mime: string; type: string; subtype: string; q: number; specificity: number }> = [];

  for (const entry of entries) {
    const parts = entry.trim().split(';');
    const mime = parts[0].trim().toLowerCase();
    if (!mime) continue;

    let q = 1.0;
    for (let i = 1; i < parts.length; i++) {
      const p = parts[i].trim();
      if (p.startsWith('q=')) {
        const val = parseFloat(p.slice(2));
        if (!isNaN(val)) {
          q = Math.max(0, Math.min(1, val));
        }
      }
    }

    const slashIdx = mime.indexOf('/');
    if (slashIdx === -1) continue;
    const type = mime.slice(0, slashIdx);
    const subtype = mime.slice(slashIdx + 1);

    let specificity = 3;
    if (type === '*' && subtype === '*') specificity = 1;
    else if (subtype === '*') specificity = 2;

    items.push({ mime, type, subtype, q, specificity });
  }

  function getBestQ(targets: string[]): { spec: number; q: number } {
    let bestSpec = 0;
    let bestQ = 0;
    for (const it of items) {
      const matches = targets.some((t) => {
        if (it.specificity === 3) return it.mime === t;
        if (it.specificity === 2) return t.startsWith(it.type + '/');
        if (it.specificity === 1) return true;
        return false;
      });
      if (matches) {
        if (it.specificity > bestSpec) {
          bestSpec = it.specificity;
          bestQ = it.q;
        } else if (it.specificity === bestSpec) {
          bestQ = Math.max(bestQ, it.q);
        }
      }
    }
    return { spec: bestSpec, q: bestQ };
  }

  const htmlMatch = getBestQ(['text/html', 'application/xhtml+xml']);
  const mdMatch = getBestQ(['text/markdown', 'text/x-markdown']);

  if (mdMatch.q > 0 && mdMatch.q > htmlMatch.q) {
    return 'markdown';
  }
  return 'html';
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  let siteConfig: Record<string, any> | undefined = undefined;
  let totalPostsCount = 0;
  let publishedPosts: any[] = [];
  let autolinks: any[] = [];

  const urlPage = parseInt(url.searchParams.get('page') || '1', 10);
  const page = isNaN(urlPage) || urlPage < 1 ? 1 : urlPage;

  // 1. Fetch site configurations, posts count, autolinks, and posts from Cloudflare D1
  if (env.DB) {
    try {
      const configRes = await env.DB.prepare('SELECT key, value FROM configs').all();
      if (configRes.results && configRes.results.length > 0) {
        siteConfig = {};
        const SENSITIVE = ['admin_email', 'admin_password', 'admin_name', 'admin_avatar', 'admin_bio', 'password', 'secret', 'token'];
        for (const row of configRes.results) {
          const kLower = String(row.key).toLowerCase();
          if (SENSITIVE.includes(row.key) || kLower.includes('password') || kLower.includes('secret') || kLower.includes('token')) continue;
          try {
            siteConfig[row.key] = JSON.parse(row.value);
          } catch {
            siteConfig[row.key] = row.value;
          }
        }
      }

      // Count total published posts
      const countRes = await env.DB.prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'published'").first();
      totalPostsCount = countRes?.count || 0;

      // Fetch autolinks
      const autolinksRes = await env.DB.prepare("SELECT * FROM autolinks ORDER BY created_at DESC").all();
      autolinks = autolinksRes.results || [];

      // Fetch paginated posts with JOIN for author details
      const postsPerPage = siteConfig?.posts_per_page || 9;
      const offset = (page - 1) * postsPerPage;
      const postsRes = await env.DB.prepare(`
        SELECT 
          p.title, p.slug, p.excerpt, p.category, 
          p.read_time_minutes as readTimeMinutes, p.views, 
          p.featured_image as featuredImage, p.created_at as createdAt,
          u.name as authorName, u.avatar as authorAvatar
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.status = 'published'
        ORDER BY p.id DESC
        LIMIT ? OFFSET ?
      `).bind(postsPerPage, offset).all();
      publishedPosts = postsRes.results || [];
    } catch (e) {
      console.error('D1 error in homepage pre-render:', e);
    }
  }

  // 2. Resolve Dynamic Metadata Values
  const siteName = siteConfig?.site_name || env.SITE_NAME || url.hostname.replace('www.', '') || 'Blog Engine';
  const siteDesc = siteConfig?.site_description || 'Portal berita & informasi terpercaya.';
  const seoTitle = siteConfig?.seo_meta_title || `${siteName} - Beranda`;
  const seoDesc = siteConfig?.seo_meta_description || siteDesc;
  const siteUrl = (env.SITE_URL || url.origin).replace(/\/$/, '');
  const featuredImage = siteConfig?.site_logo || 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&h=630&q=80&fm=webp';

  // MARKDOWN CONTENT NEGOTIATION FOR AGENTS (RFC 8288, RFC 9110 & Markdown for Agents)
  const acceptHeader = request.headers.get('Accept') || '';
  if (negotiateContent(acceptHeader) === 'markdown') {
    const mdLines: string[] = [
      `# ${siteName}`,
      '',
      `> ${siteDesc}`,
      '',
      '## Navigasi & Sumber Daya Mesin',
      `- **Katalog API:** ${siteUrl}/.well-known/api-catalog`,
      `- **Dokumentasi Lengkap LLM:** ${siteUrl}/llms-full.txt`,
      `- **Ringkasan Singkat LLM:** ${siteUrl}/llms.txt`,
      `- **Umpan RSS:** ${siteUrl}/feed.xml`,
      `- **Peta Situs XML:** ${siteUrl}/sitemap.xml`,
      '',
      '## Artikel Terbaru',
    ];

    if (publishedPosts.length > 0) {
      for (const p of publishedPosts) {
        mdLines.push(
          `- [${p.title}](${siteUrl}/baca/${p.slug}) - *${p.category || 'Umum'}* (${p.read_time_minutes || 5} menit baca)\n  ${p.excerpt || ''}`
        );
      }
    } else {
      mdLines.push('- Konten artikel sedang dimuat dari sistem basis data.');
    }

    mdLines.push('', '---', `*Konten disajikan secara otomatis dalam format Markdown untuk agen AI (RFC 8288 & Markdown for Agents).*`);

    const markdownText = mdLines.join('\n');
    const tokenCount = Math.max(1, Math.ceil(markdownText.length / 4));

    return new Response(markdownText, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'x-markdown-tokens': tokenCount.toString(),
        'Vary': 'Accept',
        'Cache-Control': 'public, max-age=60',
        'Link': '</.well-known/api-catalog>; rel="api-catalog", </api/posts>; rel="service-desc"; type="application/json", </llms.txt>; rel="describedby"; type="text/plain", </feed.xml>; rel="alternate"; type="application/rss+xml"',
      },
    });
  }

  // 3. Get static index.html from Cloudflare Pages Asset storage
  let htmlTemplate = '';
  try {
    const assetRes = await env.ASSETS.fetch(new URL('/index.html', request.url));
    htmlTemplate = await assetRes.text();
  } catch (e) {
    console.error('Failed to fetch ASSETS in homepage Function:', e);
    htmlTemplate = `<!doctype html><html lang="id"><head><meta charset="UTF-8"><title>${siteName}</title></head><body><div id="root"></div></body></html>`;
  }

  // 4. Strip any pre-existing static preloads and generic SEO description/OpenGraph tags to prevent duplicates or crawler fallback
  let html = htmlTemplate
    .replace(/<link[^>]*rel="preload"[^>]*as="image"[^>]*>/gi, '')
    .replace(/<meta[^>]*name="description"[^>]*>/gi, '')
    .replace(/<meta[^>]*property="og:[^>]*>/gi, '')
    .replace(/<meta[^>]*name="twitter:[^>]*>/gi, '');

  // 5. Build Unified Head SEO HTML Injection
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': siteName,
    'url': `${siteUrl}/`,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${siteUrl}/?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': siteName,
    'url': `${siteUrl}/`,
    'logo': {
      '@type': 'ImageObject',
      'url': siteConfig?.site_logo || `${siteUrl}/favicon.ico`
    }
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'numberOfItems': publishedPosts.length,
    'itemListElement': publishedPosts.map((p, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'url': `${siteUrl}/baca/${p.slug}`,
      'name': p.title
    }))
  };

  let lcpPreloadTag = '';
  if (publishedPosts && publishedPosts.length > 0) {
    const featured = publishedPosts[0];
    const featuredImgSrc = getOptimizedImageUrl(featured.featuredImage, 1200, 675, 55);
    const featuredSrcSet = getResponsiveSrcSet(featured.featuredImage, [400, 750, 1200], 55);
    lcpPreloadTag = `
    <link rel="preload" as="image" href="${escapeHtml(featuredImgSrc)}" ${featuredSrcSet ? `imagesrcset="${escapeHtml(featuredSrcSet)}"` : ''} imagesizes="(max-width: 640px) 100vw, (max-width: 1024px) 750px, 1200px" fetchpriority="high" />`;
  }

  const seoHeadTags = `
    <title>${escapeHtml(seoTitle)}</title>
    <meta name="description" content="${escapeHtml(seoDesc)}" />
    <link rel="canonical" href="${siteUrl}/" />
    ${lcpPreloadTag}
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:title" content="${escapeHtml(seoTitle)}" />
    <meta property="og:description" content="${escapeHtml(seoDesc)}" />
    <meta property="og:image" content="${escapeHtml(featuredImage)}" />
    <meta property="og:url" content="${siteUrl}/" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(seoTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(seoDesc)}" />
    <meta name="twitter:image" content="${escapeHtml(featuredImage)}" />
    <script type="application/ld+json" id="jsonld-website-schema">${JSON.stringify(websiteSchema)}</script>
    <script type="application/ld+json" id="jsonld-organization-schema">${JSON.stringify(organizationSchema)}</script>
    <script type="application/ld+json" id="jsonld-itemlist-schema">${JSON.stringify(itemListSchema)}</script>
  `;

  // Replace <title> and inject SEO tags into <head>
  if (html.includes('<title>')) {
    html = html.replace(/<title>.*?<\/title>/i, seoHeadTags);
  } else {
    html = html.replace('</head>', `${seoHeadTags}</head>`);
  }

  // 6. Build Static HTML Content for `#root` to deliver ultimate crawlers pre-rendering (SEO Kelas Dunia)
  const showHero = siteConfig?.show_hero_section !== false;
  const heroTitle = siteConfig?.hero_title || 'Panduan Pengasuhan Anak Terpercaya';
  const heroSubtitle = siteConfig?.hero_subtitle || 'Temukan artikel, tips nutrisi, dan edukasi tumbuh kembang anak untuk orang tua modern.';
  const heroCtaText = siteConfig?.hero_cta_text || 'Jelajahi Artikel';
  const heroCtaLink = siteConfig?.hero_cta_link || '#artikel-terbaru';
  const techBadgeHero = siteConfig?.tech_badge_hero || 'Cloudflare D1 Edge Architecture';
  
  let heroHtml = '';
  if (showHero) {
    heroHtml = `
      <section class="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-rose-500/15 relative overflow-hidden min-h-[350px] sm:min-h-[280px] md:min-h-[240px] flex items-center my-8 max-w-7xl mx-auto">
        <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full">
          <div class="space-y-3 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-rose-100 border border-white/20 h-7 min-h-[28px]">
              <span>${escapeHtml(techBadgeHero)}</span>
            </div>
            <h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight min-h-[2rem] sm:min-h-[3rem]">${escapeHtml(heroTitle)}</h1>
            <p class="text-rose-100 text-sm sm:text-base leading-relaxed">${escapeHtml(heroSubtitle)}</p>
            <div class="pt-2">
              <a href="${escapeHtml(heroCtaLink)}" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-rose-900 font-black text-xs shadow-lg hover:bg-rose-50 transition-transform">${escapeHtml(heroCtaText)}</a>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  let autolinksHtml = '';
  if (autolinks.length > 0) {
    autolinksHtml = `
      <div class="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 max-w-7xl mx-auto my-6">
        <div class="flex items-center gap-1.5 text-xs font-black text-rose-800 shrink-0 uppercase tracking-wide">
          <span>Topik Trending:</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          ${autolinks.map(l => `
            <a href="${escapeHtml(l.targetUrl)}" class="px-3 py-1 rounded-lg bg-white border border-rose-300 text-xs text-slate-800 hover:border-rose-500 transition-colors font-bold inline-flex items-center gap-1">
              #${escapeHtml(l.keyword)}
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Slicing Featured Post on Page 1
  let featuredPostHtml = '';
  let displayPosts = publishedPosts;
  if (page === 1 && publishedPosts.length > 0) {
    const featured = publishedPosts[0];
    displayPosts = publishedPosts.slice(1);
    
    const featuredImgSrc = getOptimizedImageUrl(featured.featuredImage, 1200, 675, 55);
    const featuredSrcSet = getResponsiveSrcSet(featured.featuredImage, [400, 750, 1200], 55);
    const featuredAvatarSrc = getOptimizedAvatarUrl(featured.authorAvatar, 36, 60);

    featuredPostHtml = `
      <section class="group cursor-pointer rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm my-8 max-w-7xl mx-auto">
        <a href="/baca/${escapeHtml(featured.slug)}" class="block grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div class="lg:col-span-7 relative aspect-[16/9] lg:aspect-auto h-64 sm:h-72 lg:h-[420px] w-full overflow-hidden bg-slate-100">
            <img src="${featuredImgSrc}" ${featuredSrcSet ? `srcset="${featuredSrcSet}"` : ''} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 750px, 1200px" alt="${escapeHtml(featured.title)}" width="1200" height="675" class="w-full h-full object-cover" loading="eager" fetchpriority="high" decoding="async" />
            <div class="absolute top-4 left-4">
              <span class="inline-flex items-center px-3 py-1 rounded-full bg-rose-800 text-white text-xs font-black shadow-md uppercase">
                UTAMA • ${escapeHtml(featured.category)}
              </span>
            </div>
          </div>
          <div class="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
            <div class="space-y-4">
              <div class="flex items-center gap-3 text-xs text-slate-700 font-semibold">
                <span>${featured.readTimeMinutes || 5} menit baca</span>
                <span>•</span>
                <span>${featured.views || 0} pembaca</span>
              </div>
              <h2 class="text-xl sm:text-2xl font-bold text-slate-900 hover:text-rose-700 transition-colors leading-snug">${escapeHtml(featured.title)}</h2>
              <p class="text-slate-700 text-sm leading-relaxed">${escapeHtml(featured.excerpt)}</p>
            </div>
            <div class="pt-6 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
              <div class="flex items-center gap-3">
                <img src="${featuredAvatarSrc}" alt="${escapeHtml(featured.authorName)}" width="36" height="36" loading="lazy" decoding="async" class="w-9 h-9 rounded-full object-cover border border-rose-300 shrink-0" />
                <div>
                  <div class="text-xs font-bold text-slate-900">${escapeHtml(featured.authorName)}</div>
                  <div class="text-[10px] text-slate-500">Tim Redaksi</div>
                </div>
              </div>
              <span class="inline-flex items-center gap-1 text-xs font-black text-rose-800">Baca Selengkapnya &rarr;</span>
            </div>
          </div>
        </a>
      </section>
    `;
  }

  let postsGridHtml = '';
  if (displayPosts.length > 0) {
    postsGridHtml = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto my-8">
        ${displayPosts.map(p => {
          const pImgSrc = getOptimizedImageUrl(p.featuredImage, 400, 225, 55);
          const pSrcSet = getResponsiveSrcSet(p.featuredImage, [400, 750], 55);
          const pAvatarSrc = getOptimizedAvatarUrl(p.authorAvatar, 24, 60);
          return `
          <article class="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
            <a href="/baca/${escapeHtml(p.slug)}" class="block">
              <div class="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                <img src="${pImgSrc}" ${pSrcSet ? `srcset="${pSrcSet}"` : ''} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px" alt="${escapeHtml(p.title)}" width="400" height="225" class="w-full h-full object-cover" loading="lazy" decoding="async" />
                <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-700 text-white text-[10px] font-bold">
                  ${escapeHtml(p.category)}
                </span>
              </div>
              <div class="p-5 space-y-3">
                <div class="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <span>${p.readTimeMinutes || 5} menit baca</span>
                  <span>•</span>
                  <span>${p.views || 0} pembaca</span>
                </div>
                <h3 class="text-base font-bold text-slate-900 hover:text-rose-600 transition-colors line-clamp-2">${escapeHtml(p.title)}</h3>
                <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed">${escapeHtml(p.excerpt)}</p>
              </div>
            </a>
            <div class="p-5 pt-0 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 mt-4 pt-3">
              <div class="flex items-center gap-2">
                <img src="${pAvatarSrc}" alt="${escapeHtml(p.authorName)}" width="24" height="24" loading="lazy" decoding="async" class="w-6 h-6 rounded-full object-cover border border-rose-200 shrink-0" />
                <span class="text-xs text-slate-700 font-medium">${escapeHtml(p.authorName)}</span>
              </div>
              <a href="/baca/${escapeHtml(p.slug)}" class="text-xs font-bold text-rose-600 hover:underline">Baca &rarr;</a>
            </div>
          </article>
        `;}).join('')}
      </div>
    `;
  } else {
    postsGridHtml = `
      <div class="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3 my-8 max-w-7xl mx-auto">
        <h3 class="text-base font-bold text-slate-800">Tidak ada artikel yang sesuai</h3>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">Silakan hubungi administrator atau kunjungi kategori lain.</p>
      </div>
    `;
  }

  // Pre-rendered Pagination HTML
  let paginationHtml = '';
  const postsPerPage = siteConfig?.posts_per_page || 9;
  const totalPages = Math.ceil(totalPostsCount / postsPerPage);
  if (totalPages > 1) {
    paginationHtml = `
      <div class="flex items-center justify-between border-t border-slate-100 pt-6 my-8 max-w-7xl mx-auto">
        <a href="${page > 1 ? `/?page=${page - 1}` : '#'}" class="px-4 py-2 rounded-2xl border border-slate-200 text-xs font-black transition-colors ${page === 1 ? 'opacity-40 pointer-events-none' : 'hover:bg-slate-50'}">
          &larr; Sebelumnya
        </a>
        <div class="flex items-center gap-1.5">
          ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
            <a href="/?page=${p}" class="w-9 h-9 flex items-center justify-center rounded-xl text-xs font-black transition-all ${page === p ? 'bg-rose-700 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'}">
              ${p}
            </a>
          `).join('')}
        </div>
        <a href="${page < totalPages ? `/?page=${page + 1}` : '#'}" class="px-4 py-2 rounded-2xl border border-slate-200 text-xs font-black transition-colors ${page === totalPages ? 'opacity-40 pointer-events-none' : 'hover:bg-slate-50'}">
          Berikutnya &rarr;
        </a>
      </div>
    `;
  }

  const preRenderedHtml = `
    <header class="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-lg font-black text-rose-600">${escapeHtml(siteName)}</span>
        </div>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 py-6">
      ${heroHtml}
      ${autolinksHtml}
      ${featuredPostHtml}
      <h2 class="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3 max-w-7xl mx-auto" id="artikel-terbaru">Artikel Terbaru</h2>
      ${postsGridHtml}
      ${paginationHtml}
    </main>
  `;

  // Inject Static Pre-rendered Content into `#root`
  const initialDataJson = JSON.stringify({ posts: publishedPosts, autolinks, siteConfig, totalPostsCount }).replace(/</g, '\\u003c');
  const initialDataScript = `<script>window.__INITIAL_DATA__=${initialDataJson};</script>`;

  if (html.includes('<div id="root">')) {
    html = html.replace(/<div\s+id="root"[^>]*>([\s\S]*?)<\/div>/i, `${initialDataScript}<div id="root">${preRenderedHtml}</div>`);
  }

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
      'Vary': 'Accept',
      'Link': '</.well-known/api-catalog>; rel="api-catalog", </api/posts>; rel="service-desc"; type="application/json", </llms.txt>; rel="describedby"; type="text/plain", </feed.xml>; rel="alternate"; type="application/rss+xml"',
    },
  });
};
