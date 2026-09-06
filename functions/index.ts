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
  const seoTitle = siteConfig?.seo_meta_title || `${siteName} - Modern Edge Blog Engine`;
  const seoDesc = siteConfig?.seo_meta_description || siteDesc;
  const siteUrl = (env.SITE_URL || url.origin).replace(/\/$/, '');
  const featuredImage = siteConfig?.site_logo || 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&h=630&q=80&fm=webp';

  // 3. Get static index.html from Cloudflare Pages Asset storage
  let htmlTemplate = '';
  try {
    const assetRes = await env.ASSETS.fetch(request);
    htmlTemplate = await assetRes.text();
  } catch (e) {
    console.error('Failed to fetch ASSETS in homepage Function:', e);
    htmlTemplate = `<!doctype html><html lang="id"><head><meta charset="UTF-8"><title>${siteName}</title></head><body><div id="root"></div></body></html>`;
  }

  // 4. Inject Real SEO Meta & Open Graph Tags for WhatsApp / Crawler
  let html = htmlTemplate;

  // Replace default title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(seoTitle)}</title>`);

  // Replace default descriptions and open graph tags
  html = html.replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${escapeHtml(seoDesc)}" />`);
  html = html.replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${escapeHtml(seoTitle)}" />`);
  html = html.replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${escapeHtml(seoDesc)}" />`);

  // Inject additional precise social media tags for social sharing previews
  const seoHeadTags = `
    <link rel="canonical" href="${siteUrl}/" />
    <meta property="og:url" content="${siteUrl}/" />
    <meta property="og:image" content="${escapeHtml(featuredImage)}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(seoTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(seoDesc)}" />
    <meta name="twitter:image" content="${escapeHtml(featuredImage)}" />
  `;

  html = html.replace('</head>', `${seoHeadTags}</head>`);

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
};
