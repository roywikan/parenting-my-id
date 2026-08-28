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

    // 0. DYNAMIC LLMS.TXT (AI Engine Crawler Requirement)
    if (path === '/llms.txt') {
      try {
        const { results } = await env.DB.prepare(
          "SELECT title, slug, excerpt FROM posts WHERE status = 'published' ORDER BY created_at DESC"
        ).all();

        const articleLinks = results.map(
          (post: any) => `* [${post.title}](${siteUrl}/baca/${post.slug}): ${post.excerpt || ''}`
        ).join('\n');

        const content = `# Parenting.my.id

> Portal berita dan informasi parenting terpercaya di Indonesia. Menyajikan edukasi pola asuh anak, kesehatan, serta nutrisi keluarga.

## Artikel Terkait & Panduan Utama

${articleLinks}
`.trim();

        return new Response(content, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      } catch (err) {
        return new Response('Error generating llms.txt', { status: 500 });
      }
    }

    // 1. DYNAMIC SITEMAP.XML (SEO Requirement)
    if (path === '/sitemap.xml') {
      try {
        const { results } = await env.DB.prepare(
          "SELECT slug, updated_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC"
        ).all();

        const urls = results.map(
          (post: any) => `<url><loc>${siteUrl}/baca/${post.slug}</loc><lastmod>${new Date(post.updated_at || Date.now()).toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
        ).join('');

        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>${urls}</urlset>`.trim();

        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
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
      // GET /api/config
      if (path === '/api/config' && request.method === 'GET') {
        try {
          await env.DB.prepare(
            `CREATE TABLE IF NOT EXISTS site_config (
              id INTEGER PRIMARY KEY,
              config_json TEXT NOT NULL,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
          ).run();

          const result: any = await env.DB.prepare('SELECT config_json FROM site_config WHERE id = 1 LIMIT 1').first();
          if (result && result.config_json) {
            return new Response(result.config_json, {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({}), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // POST /api/config
      if (path === '/api/config' && request.method === 'POST') {
        try {
          const configData = await request.json() as any;
          const configJson = JSON.stringify(configData);

          await env.DB.prepare(
            `CREATE TABLE IF NOT EXISTS site_config (
              id INTEGER PRIMARY KEY,
              config_json TEXT NOT NULL,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
          ).run();

          await env.DB.prepare(
            `INSERT INTO site_config (id, config_json, updated_at)
             VALUES (1, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(id) DO UPDATE SET config_json = excluded.config_json, updated_at = CURRENT_TIMESTAMP`
          ).bind(configJson).run();

          // GitHub REST API Sync for public/site_config.json if token is provided
          if (env.GITHUB_TOKEN && env.GITHUB_OWNER && env.GITHUB_REPO) {
            try {
              const owner = env.GITHUB_OWNER;
              const repo = env.GITHUB_REPO;
              const branch = env.GITHUB_BRANCH || 'main';
              const filePath = 'public/site_config.json';
              const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

              let currentSha = '';
              const getShaRes = await fetch(`${githubApiUrl}?ref=${branch}`, {
                headers: {
                  'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
                  'User-Agent': 'Parenting-Cloudflare-Worker'
                }
              });
              if (getShaRes.ok) {
                const shaData: any = await getShaRes.json();
                currentSha = shaData.sha;
              }

              const base64Content = btoa(unescape(encodeURIComponent(JSON.stringify(configData, null, 2))));
              await fetch(githubApiUrl, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
                  'Content-Type': 'application/json',
                  'User-Agent': 'Parenting-Cloudflare-Worker'
                },
                body: JSON.stringify({
                  message: 'chore(config): update site_config.json via Admin Portal',
                  content: base64Content,
                  sha: currentSha || undefined,
                  branch
                })
              });
            } catch (ghErr) {
              console.warn('GitHub site_config sync warning:', ghErr);
            }
          }

          return new Response(JSON.stringify({ success: true, message: 'Konfigurasi berhasil disimpan ke Cloudflare D1 & synced!' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
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

      // GET /api/comments
      if (path === '/api/comments' && request.method === 'GET') {
        try {
          await env.DB.prepare(
            `CREATE TABLE IF NOT EXISTS comments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              post_slug TEXT NOT NULL,
              user_name TEXT NOT NULL,
              user_email TEXT NOT NULL,
              user_avatar TEXT NOT NULL,
              content TEXT NOT NULL,
              status TEXT DEFAULT 'approved',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
          ).run();

          const { results } = await env.DB.prepare('SELECT * FROM comments ORDER BY created_at DESC LIMIT 100').all();
          return new Response(JSON.stringify(results), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // DELETE /api/comments/:id
      if (path.startsWith('/api/comments/') && request.method === 'DELETE') {
        try {
          const id = path.split('/')[3];
          await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // GET /api/webhooks/cusdis or GET /api/cusdis-webhook (Health Check)
      if ((path === '/api/webhooks/cusdis' || path === '/api/cusdis-webhook') && request.method === 'GET') {
        return new Response(
          JSON.stringify({
            status: 'online',
            success: true,
            message: 'Cusdis Webhook Endpoint Cloudflare Worker aktif dan siap menerima payload POST dari Cusdis!',
            endpoint: 'https://parenting.my.id/api/webhooks/cusdis',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // POST /api/webhooks/cusdis or POST /api/cusdis-webhook (Cusdis Comment Webhook Auto-Sync to D1 DB)
      if ((path === '/api/webhooks/cusdis' || path === '/api/cusdis-webhook') && request.method === 'POST') {
        try {
          const payload = await request.json() as any;
          if (payload && payload.type === 'new_comment' && payload.data) {
            const { by_nickname, by_email, content, page_id } = payload.data;
            const avatarName = encodeURIComponent(by_nickname || 'Pembaca');
            const avatar = `https://ui-avatars.com/api/?name=${avatarName}&background=f43f5e&color=fff`;

            await env.DB.prepare(
              `CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_slug TEXT NOT NULL,
                user_name TEXT NOT NULL,
                user_email TEXT NOT NULL,
                user_avatar TEXT NOT NULL,
                content TEXT NOT NULL,
                status TEXT DEFAULT 'approved',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )`
            ).run();

            await env.DB.prepare(
              `INSERT INTO comments (post_slug, user_name, user_email, user_avatar, content, status)
               VALUES (?, ?, ?, ?, ?, 'approved')`
            ).bind(
              page_id || '',
              by_nickname || 'Pembaca Anonim',
              by_email || '',
              avatar,
              content || ''
            ).run();

            return new Response(
              JSON.stringify({ success: true, message: 'Komentar Cusdis berhasil disinkronisasi ke D1 Database via Webhook!' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, message: 'Webhook payload diterima.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // GET /api/comments (Fetch comments from D1 DB with filtering)
      if (path === '/api/comments' && request.method === 'GET') {
        try {
          await env.DB.prepare(
            `CREATE TABLE IF NOT EXISTS comments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              post_slug TEXT NOT NULL,
              user_name TEXT NOT NULL,
              user_email TEXT NOT NULL,
              user_avatar TEXT NOT NULL,
              content TEXT NOT NULL,
              status TEXT DEFAULT 'pending',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
          ).run();

          const postSlug = url.searchParams.get('post_slug');
          const statusParam = url.searchParams.get('status');

          let query = 'SELECT * FROM comments';
          const bindings: any[] = [];
          const whereClauses: string[] = [];

          if (postSlug) {
            whereClauses.push('post_slug = ?');
            bindings.push(postSlug);
          }

          if (statusParam) {
            whereClauses.push('status = ?');
            bindings.push(statusParam);
          } else if (postSlug) {
            whereClauses.push("status = 'approved'");
          }

          if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
          }

          query += ' ORDER BY created_at DESC LIMIT 100';

          const stmt = env.DB.prepare(query);
          const { results } = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all();

          return new Response(JSON.stringify(results || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // POST /api/comments (Native reader comment submission)
      if (path === '/api/comments' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const { post_slug, user_name, user_email, content } = body;

          if (!post_slug || !user_name || !content) {
            return new Response(
              JSON.stringify({ error: 'Nama, komentar, dan artikel tujuan wajib diisi.' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const avatarName = encodeURIComponent(user_name.trim());
          const avatar = `https://ui-avatars.com/api/?name=${avatarName}&background=f43f5e&color=fff`;

          await env.DB.prepare(
            `CREATE TABLE IF NOT EXISTS comments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              post_slug TEXT NOT NULL,
              user_name TEXT NOT NULL,
              user_email TEXT NOT NULL,
              user_avatar TEXT NOT NULL,
              content TEXT NOT NULL,
              status TEXT DEFAULT 'pending',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
          ).run();

          await env.DB.prepare(
            `INSERT INTO comments (post_slug, user_name, user_email, user_avatar, content, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`
          ).bind(post_slug, user_name.trim(), (user_email || '').trim(), avatar, content.trim()).run();

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Terima kasih! Komentar Anda telah berhasil dikirim dan sedang menunggu persetujuan (moderasi) admin.',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // PUT /api/comments/:id (Admin Approve / Status Update)
      if (path.startsWith('/api/comments/') && request.method === 'PUT') {
        try {
          const id = path.split('/')[3];
          const body = (await request.json().catch(() => ({}))) as any;
          const newStatus = body.status || 'approved';

          await env.DB.prepare('UPDATE comments SET status = ? WHERE id = ?').bind(newStatus, id).run();

          return new Response(
            JSON.stringify({ success: true, message: `Komentar #${id} berhasil diupdate.` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // DELETE /api/comments/:id (Admin Delete Comment)
      if (path.startsWith('/api/comments/') && request.method === 'DELETE') {
        try {
          const id = path.split('/')[3];
          await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();

          return new Response(
            JSON.stringify({ success: true, message: 'Komentar berhasil dihapus.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
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
              content: base64Content.replace(/^data:.*?;base64,/, ''),
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
