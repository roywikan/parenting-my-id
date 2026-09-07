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

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  let siteConfig: Record<string, any> | undefined = undefined;

  // 1. Fetch site configurations from Cloudflare D1
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
  const seoHeadTags = `
    <title>${escapeHtml(seoTitle)}</title>
    <meta name="description" content="${escapeHtml(seoDesc)}" />
    <link rel="canonical" href="${siteUrl}/" />
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
  `;

  // Replace <title> and inject SEO tags into <head>
  if (html.includes('<title>')) {
    html = html.replace(/<title>.*?<\/title>/i, seoHeadTags);
  } else {
    html = html.replace('</head>', `${seoHeadTags}</head>`);
  }

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
      'Link': '</.well-known/api-catalog>; rel="api-catalog", </api/posts>; rel="service-desc"; type="application/json", </llms.txt>; rel="describedby"; type="text/plain", </feed.xml>; rel="alternate"; type="application/rss+xml"',
    },
  });
};
