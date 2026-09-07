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

/**
 * RFC 9110 Content Negotiation helper honoring q-values and media type specificity.
 * Supported media representations:
 * - HTML: 'text/html', 'application/xhtml+xml', 'text/*', '*/*'
 * - Markdown: 'text/markdown', 'text/x-markdown', 'text/*', '*/*'
 *
 * Rules:
 * 1. Calculate highest-precedence quality weight (q-value) for each supported representation.
 * 2. More specific media ranges (exact type/subtype) override wildcards (text/*, */*).
 * 3. If q(markdown) > 0 and q(markdown) > q(html), serve Markdown.
 * 4. Otherwise (higher q for HTML, equal q, unsupported probe, or defaults), serve HTML.
 */
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

  // MARKDOWN CONTENT NEGOTIATION FOR AGENTS (RFC 8288, RFC 9110 & Markdown for Agents)
  const acceptHeader = request.headers.get('Accept') || '';
  if (negotiateContent(acceptHeader) === 'markdown') {
    let recentPosts: any[] = [];
    if (env.DB) {
      try {
        const postsRes = await env.DB.prepare(
          "SELECT title, slug, excerpt, category, read_time_minutes as readTimeMinutes FROM posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 15"
        ).all();
        recentPosts = postsRes.results || [];
      } catch (e) {
        console.error('Failed to fetch posts for markdown homepage:', e);
      }
    }

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

    if (recentPosts.length > 0) {
      for (const p of recentPosts) {
        mdLines.push(
          `- [${p.title}](${siteUrl}/baca/${p.slug}) - *${p.category || 'Umum'}* (${p.readTimeMinutes || 5} menit baca)\n  ${p.excerpt || ''}`
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
      'Vary': 'Accept',
      'Link': '</.well-known/api-catalog>; rel="api-catalog", </api/posts>; rel="service-desc"; type="application/json", </llms.txt>; rel="describedby"; type="text/plain", </feed.xml>; rel="alternate"; type="application/rss+xml"',
    },
  });
};
