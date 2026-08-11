/**
 * Cloudflare Worker & Pages Router Entry Point for Parenting.my.id
 * Connects directly to Cloudflare D1 Database and GitHub REST API.
 */

export interface Env {
  DB: D1Database;
  SITE_URL?: string;
  GITHUB_TOKEN?: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const siteUrl = env.SITE_URL || 'https://parenting.my.id';

    // CORS Headers for API
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. DYNAMIC SITEMAP.XML (SEO Requirement)
    if (path === '/sitemap.xml') {
      try {
        const { results } = await env.DB.prepare(
          "SELECT slug, updated_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC"
        ).all();

        const urls = results.map(
          (post: any) => `
  <url>
    <loc>${siteUrl}/baca/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
        ).join('');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${urls}
</urlset>`;

        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        });
      } catch (err) {
        return new Response('Error generating sitemap', { status: 500 });
      }
    }

    // 2. DYNAMIC RSS FEED.XML
    if (path === '/feed.xml' || path === '/rss.xml') {
      try {
        const { results } = await env.DB.prepare(
          "SELECT title, slug, excerpt, created_at FROM posts WHERE status = 'published' ORDER BY created_at DESC LIMIT 20"
        ).all();

        const items = results.map(
          (post: any) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/baca/${post.slug}</link>
      <guid>${siteUrl}/baca/${post.slug}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
    </item>`
        ).join('');

        const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Parenting.my.id - Edukasi &amp; Pola Asuh Anak Modern</title>
    <link>${siteUrl}</link>
    <description>Portal artikel parenting, gizi anak, stimulasi balita, dan pencegahan stunting di Indonesia.</description>
    <language>id-id</language>
    ${items}
  </channel>
</rss>`;

        return new Response(rss, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } catch (err) {
        return new Response('Error generating RSS feed', { status: 500 });
      }
    }

    // 3. API ENDPOINTS FOR FRONTEND / ADMIN
    if (path.startsWith('/api/')) {
      // GET /api/posts
      if (path === '/api/posts' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          `SELECT p.*, u.name as author_name, u.avatar as author_avatar, u.role as author_role
           FROM posts p
           LEFT JOIN users u ON p.author_id = u.id
           ORDER BY p.created_at DESC`
        ).all();
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /api/autolinks
      if (path === '/api/autolinks' && request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM autolinks ORDER BY keyword ASC').all();
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // POST /api/upload-github (Direct GitHub REST API Commit for Images)
      if (path === '/api/upload-github' && request.method === 'POST') {
        try {
          const body = await request.json() as any;
          const { filename, base64Content } = body;

          const token = env.GITHUB_TOKEN;
          const owner = env.GITHUB_OWNER;
          const repo = env.GITHUB_REPO;
          const branch = env.GITHUB_BRANCH || 'main';

          if (!token || !owner || !repo) {
            // Fallback for mock upload when token isn't configured yet
            const mockUrl = `https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80`;
            return new Response(JSON.stringify({
              success: true,
              url: mockUrl,
              message: 'Demo mode: Silakan konfigurasikan GITHUB_TOKEN di Cloudflare Dashboard untuk upload fisik ke GitHub repo.'
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          const filePath = `public/uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

          const ghRes = await fetch(githubApiUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Parenting-Cloudflare-Worker'
            },
            body: JSON.stringify({
              message: `upload: ${filename} via Parenting.my.id CMS`,
              content: base64Content.replace(/^data:image\/\w+;base64,/, ''),
              branch
            })
          });

          if (!ghRes.ok) {
            const errText = await ghRes.text();
            throw new Error(`GitHub API Error: ${errText}`);
          }

          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
          return new Response(JSON.stringify({ success: true, url: rawUrl }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Default static file request passthrough
    return new Response('Parenting.my.id Cloudflare Worker Running', { status: 200 });
  },
};
