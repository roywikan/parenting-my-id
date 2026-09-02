interface Env {
  DB?: any;
  GITHUB_TOKEN?: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const jsonResponse = (data: any, status = 200, extraHeaders: Record<string, string> = {}) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...extraHeaders,
      },
    });
  };

  if (method === 'OPTIONS') {
    return jsonResponse({ ok: true }, 200);
  }

  const siteUrl = 'https://parenting.my.id';

  try {
    // 0a. DYNAMIC LLMS.TXT
    if (path === '/llms.txt' && method === 'GET') {
      try {
        let postsList: any[] = [];
        if (env.DB) {
          const { results } = await env.DB.prepare(
            "SELECT title, slug, excerpt FROM posts WHERE status = 'published' ORDER BY created_at DESC"
          ).all();
          postsList = results || [];
        }

        const articleLinks = postsList.map(
          (post: any) => `* [${post.title}](${siteUrl}/baca/${post.slug}): ${post.excerpt || ''}`
        ).join('\n');

        const content = `# Parenting.my.id

> Portal berita dan informasi parenting terpercaya di Indonesia. Menyajikan edukasi pola asuh anak, kesehatan, serta nutrisi keluarga.

## Artikel Terkait & Panduan Utama

${articleLinks || '* [Panduan Parenting Utama](' + siteUrl + '): Edukasi pola asuh anak dan kesehatan.'}
`.trim();

        return new Response(content, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (err: any) {
        return new Response('Error generating llms.txt: ' + err.message, { status: 500 });
      }
    }

    // 0b. DYNAMIC SITEMAP.XML
    if (path === '/sitemap.xml' && method === 'GET') {
      try {
        let postsList: any[] = [];
        if (env.DB) {
          const { results } = await env.DB.prepare(
            "SELECT slug, updated_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC"
          ).all();
          postsList = results || [];
        }

        const urls = postsList.map(
          (post: any) => `<url><loc>${siteUrl}/baca/${post.slug}</loc><lastmod>${new Date(post.updated_at || Date.now()).toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
        ).join('');

        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>${urls}</urlset>`.trim();

        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (err: any) {
        return new Response('Error generating sitemap.xml', { status: 500 });
      }
    }

    // 0c. DYNAMIC RSS FEED.XML
    if ((path === '/feed.xml' || path === '/rss.xml') && method === 'GET') {
      try {
        let postsList: any[] = [];
        if (env.DB) {
          const { results } = await env.DB.prepare(
            "SELECT title, slug, excerpt, created_at FROM posts WHERE status = 'published' ORDER BY created_at DESC LIMIT 25"
          ).all();
          postsList = results || [];
        }

        const items = postsList.map(
          (post: any) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/baca/${post.slug}</link>
      <guid>${siteUrl}/baca/${post.slug}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.created_at || Date.now()).toUTCString()}</pubDate>
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
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (err: any) {
        return new Response('Error generating RSS feed.xml', { status: 500 });
      }
    }

    // 0c-1. DYNAMIC LLMS.TXT (AI Context & Feed-derived Index)
    if (path === '/llms.txt' && method === 'GET') {
      try {
        let postsList: any[] = [];
        if (env.DB) {
          const { results } = await env.DB.prepare(
            "SELECT title, slug, excerpt FROM posts WHERE status = 'published' ORDER BY created_at DESC LIMIT 50"
          ).all();
          postsList = results || [];
        }

        const articleLinks = postsList
          .map((p: any) => `* [${p.title}](${siteUrl}/baca/${p.slug}): ${p.excerpt || ''}`)
          .join('\n');

        const llmsTxt = `# Parenting.my.id

> Portal berita dan informasi parenting terpercaya di Indonesia. Menyajikan edukasi pola asuh anak, kesehatan, serta nutrisi keluarga.

## Artikel Terkait & Panduan Utama

${articleLinks}

## Sumber Daya Tambahan

* [Konten Lengkap LLMs](${siteUrl}/llms-full.txt): Kumpulan teks lengkap artikel untuk konsumsi dan inferensi model bahasa (LLM).
* [Sitemap XML](${siteUrl}/sitemap.xml): Peta situs terstruktur untuk crawler.
* [RSS Feed](${siteUrl}/feed.xml): Umpan sindikasi artikel terbaru.
`.trim();

        return new Response(llmsTxt, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (err: any) {
        return new Response('Error generating llms.txt', { status: 500 });
      }
    }

    // 0c-2. DYNAMIC LLMS-FULL.TXT (Full Text Content for LLMs)
    if (path === '/llms-full.txt' && method === 'GET') {
      try {
        let postsList: any[] = [];
        if (env.DB) {
          const { results } = await env.DB.prepare(
            `SELECT p.title, p.slug, p.excerpt, p.content_markdown as contentMarkdown, p.category, p.updated_at as updatedAt, p.created_at as createdAt, u.name as authorName
             FROM posts p
             LEFT JOIN users u ON p.author_id = u.id
             WHERE p.status = 'published'
             ORDER BY p.created_at DESC`
          ).all();
          postsList = results || [];
        }

        const fullArticles = postsList.map((p: any) => {
          const url = `${siteUrl}/baca/${p.slug}`;
          const author = p.authorName || 'Tim Redaksi Parenting.my.id';
          const category = p.category || 'Parenting';
          const date = p.updatedAt || p.createdAt || new Date().toISOString();
          return `---

# ${p.title}

* **URL:** ${url}
* **Penulis:** ${author}
* **Kategori:** ${category}
* **Terakhir Diperbarui:** ${date}
* **Ringkasan:** ${p.excerpt || ''}

${p.contentMarkdown || ''}
`;
        }).join('\n\n');

        const llmsFullTxt = `# Arsip Lengkap Artikel Parenting.my.id (LLMs Full Text)

Dokumen ini memuat kumpulan artikel lengkap dalam format Markdown untuk Large Language Models (LLMs).

${fullArticles}
`.trim();

        return new Response(llmsFullTxt, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (err: any) {
        return new Response('Error generating llms-full.txt', { status: 500 });
      }
    }

    // 0d. ROBOTS.TXT
    if (path === '/robots.txt' && method === 'GET') {
      const robots = `User-agent: *
Allow: /
Sitemap: ${siteUrl}/sitemap.xml
`.trim();
      return new Response(robots, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // 1. GET /api/posts
    if (path === '/api/posts' && method === 'GET') {
      if (env.DB) {
        try {
          const { results } = await env.DB.prepare(`
            SELECT 
              p.id, p.title, p.slug, p.content_markdown as contentMarkdown, p.excerpt, 
              p.featured_image as featuredImage, p.category, p.read_time_minutes as readTimeMinutes, 
              p.author_id as authorId, p.status, p.meta_title as metaTitle, 
              p.meta_description as metaDescription, p.tags, p.views, p.created_at as createdAt, p.updated_at as updatedAt,
              u.name as authorName, u.avatar as authorAvatar, u.role as authorRole
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            ORDER BY p.id DESC
          `).all();

          if (results && results.length > 0) {
            return jsonResponse(results);
          }
        } catch (e) {
          console.error('Error fetching posts from D1:', e);
        }
      }
      return jsonResponse([]);
    }

    // 2. POST /api/posts
    if (path === '/api/posts' && method === 'POST') {
      const body = await request.json() as any;
      const { id, title, slug, contentMarkdown, excerpt, featuredImage, category, readTimeMinutes, authorId, status, metaTitle, metaDescription, tags } = body;

      if (!title || !contentMarkdown) {
        return jsonResponse({ error: 'Judul dan konten markdown wajib diisi.' }, 400);
      }

      const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const postExcerpt = excerpt || contentMarkdown.slice(0, 150) + '...';
      const image = featuredImage || 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=700&q=75&fm=webp';
      const cat = category || 'Pola Asuh';
      const readMin = readTimeMinutes || Math.max(1, Math.ceil(contentMarkdown.split(' ').length / 200));
      const postStatus = status || 'draft';
      const mTitle = metaTitle || `${title} | Parenting.my.id`;
      const mDesc = metaDescription || postExcerpt;
      const tagList = tags || 'parenting, anak';
      const now = new Date().toISOString();

      if (env.DB) {
        try {
          if (id) {
            await env.DB.prepare(`
              UPDATE posts SET 
                title = ?, slug = ?, content_markdown = ?, excerpt = ?, featured_image = ?,
                category = ?, read_time_minutes = ?, status = ?, meta_title = ?, meta_description = ?,
                tags = ?, updated_at = ?
              WHERE id = ?
            `).bind(title, generatedSlug, contentMarkdown, postExcerpt, image, cat, readMin, postStatus, mTitle, mDesc, tagList, now, id).run();

            return jsonResponse({ success: true, post: { ...body, id, slug: generatedSlug, updatedAt: now } });
          } else {
            const insertResult = await env.DB.prepare(`
              INSERT INTO posts (title, slug, content_markdown, excerpt, featured_image, category, read_time_minutes, author_id, status, meta_title, meta_description, tags, views, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
            `).bind(title, generatedSlug, contentMarkdown, postExcerpt, image, cat, readMin, authorId || 1, postStatus, mTitle, mDesc, tagList, now, now).run();

            const newId = insertResult.meta?.last_row_id || Date.now();

            return jsonResponse({
              success: true,
              post: {
                id: newId,
                title,
                slug: generatedSlug,
                contentMarkdown,
                excerpt: postExcerpt,
                featuredImage: image,
                category: cat,
                readTimeMinutes: readMin,
                authorId: authorId || 1,
                status: postStatus,
                metaTitle: mTitle,
                metaDescription: mDesc,
                tags: tagList,
                views: 0,
                createdAt: now,
                updatedAt: now
              }
            });
          }
        } catch (e: any) {
          console.error('Error saving post to D1:', e);
          return jsonResponse({ error: 'Gagal menyimpan artikel ke D1 Database: ' + e.message }, 500);
        }
      }

      return jsonResponse({ success: true, post: { ...body, id: id || Date.now(), slug: generatedSlug } });
    }

    // 3. DELETE /api/posts/:id
    if (path.startsWith('/api/posts/') && method === 'DELETE') {
      const parts = path.split('/');
      const id = parts[parts.length - 1];
      if (env.DB && id) {
        try {
          await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
        } catch (e) {
          console.error('Error deleting post from D1:', e);
        }
      }
      return jsonResponse({ success: true, message: 'Artikel berhasil dihapus' });
    }

    // 4. GET /api/autolinks
    if (path === '/api/autolinks' && method === 'GET') {
      if (env.DB) {
        try {
          const { results } = await env.DB.prepare('SELECT id, keyword, target_url as targetUrl, description, click_count as clickCount FROM autolinks ORDER BY id DESC').all();
          if (results && results.length > 0) {
            return jsonResponse(results);
          }
        } catch (e) {
          console.error('Error fetching autolinks from D1:', e);
        }
      }
      return jsonResponse([]);
    }

    // 5. POST /api/autolinks
    if (path === '/api/autolinks' && method === 'POST') {
      const body = await request.json() as any;
      const { keyword, targetUrl, description } = body;
      if (!keyword || !targetUrl) {
        return jsonResponse({ error: 'Keyword dan Target URL wajib diisi' }, 400);
      }

      if (env.DB) {
        try {
          const existing = await env.DB.prepare('SELECT id FROM autolinks WHERE LOWER(keyword) = LOWER(?)').bind(keyword).first();
          if (existing) {
            await env.DB.prepare('UPDATE autolinks SET target_url = ?, description = ? WHERE id = ?').bind(targetUrl, description || '', existing.id).run();
            return jsonResponse({ success: true, autolink: { id: existing.id, keyword, targetUrl, description } });
          } else {
            const insertRes = await env.DB.prepare('INSERT INTO autolinks (keyword, target_url, description) VALUES (?, ?, ?)').bind(keyword, targetUrl, description || '').run();
            return jsonResponse({ success: true, autolink: { id: insertRes.meta?.last_row_id || Date.now(), keyword, targetUrl, description, clickCount: 0 } });
          }
        } catch (e: any) {
          console.error('Error saving autolink to D1:', e);
        }
      }

      return jsonResponse({ success: true, autolink: { id: Date.now(), keyword, targetUrl, description, clickCount: 0 } });
    }

    // 6. DELETE /api/autolinks/:id
    if (path.startsWith('/api/autolinks/') && method === 'DELETE') {
      const parts = path.split('/');
      const id = parts[parts.length - 1];
      if (env.DB && id) {
        try {
          await env.DB.prepare('DELETE FROM autolinks WHERE id = ?').bind(id).run();
        } catch (e) {
          console.error('Error deleting autolink from D1:', e);
        }
      }
      return jsonResponse({ success: true, message: 'Autolink berhasil dihapus' });
    }

    // 7. GET /api/config (Public site settings ONLY - Accelerated & Edge Cached)
    if (path === '/api/config' && method === 'GET') {
      const cacheHeaders = {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
      };
      if (env.DB) {
        try {
          const { results } = await env.DB.prepare('SELECT key, value FROM configs').all();
          if (results && results.length > 0) {
            const configObj: Record<string, any> = {};
            const SENSITIVE_KEYS = ['admin_email', 'admin_password', 'admin_name', 'admin_avatar', 'admin_bio', 'password', 'secret', 'token'];
            
            for (const row of results) {
              const kLower = String(row.key).toLowerCase();
              if (SENSITIVE_KEYS.includes(row.key) || kLower.includes('password') || kLower.includes('secret') || kLower.includes('token')) {
                continue; // STRIKT: Exclude credential keys from public site config response
              }
              try {
                configObj[row.key] = JSON.parse(row.value);
              } catch {
                configObj[row.key] = row.value;
              }
            }
            return jsonResponse(configObj, 200, cacheHeaders);
          }
        } catch (e) {
          console.error('Error fetching site configs from D1:', e);
        }
      }
      return jsonResponse({}, 200, cacheHeaders);
    }

    // 8. POST /api/config
    if (path === '/api/config' && method === 'POST') {
      const body = await request.json() as Record<string, any>;
      if (!body || typeof body !== 'object') {
        return jsonResponse({ error: 'Data konfigurasi tidak valid.' }, 400);
      }

      // If body contains admin user credentials, update the users table directly instead of storing in configs
      if (body.admin_email || body.admin_password || body.admin_name) {
        if (env.DB) {
          try {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password TEXT,
                name TEXT,
                role TEXT,
                avatar TEXT,
                bio TEXT,
                created_at TEXT
              )
            `).run();
            try { await env.DB.prepare("ALTER TABLE users ADD COLUMN password TEXT").run(); } catch {}
            try { await env.DB.prepare("ALTER TABLE users ADD COLUMN avatar TEXT").run(); } catch {}
            try { await env.DB.prepare("ALTER TABLE users ADD COLUMN bio TEXT").run(); } catch {}

            const email = body.admin_email;
            const password = body.admin_password;
            const name = body.admin_name;
            const avatar = body.admin_avatar;
            const bio = body.admin_bio;

            const existing = await env.DB.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) OR role = "admin"').bind(email || '').first();
            if (existing) {
              if (password && String(password).trim().length > 0) {
                await env.DB.prepare('UPDATE users SET name = ?, email = ?, password = ?, avatar = ?, bio = ? WHERE id = ?')
                  .bind(name || 'Admin', email || 'admin@parenting.my.id', String(password), avatar || '', bio || '', existing.id).run();
              } else {
                await env.DB.prepare('UPDATE users SET name = ?, email = ?, avatar = ?, bio = ? WHERE id = ?')
                  .bind(name || 'Admin', email || 'admin@parenting.my.id', avatar || '', bio || '', existing.id).run();
              }
            } else {
              await env.DB.prepare('INSERT INTO users (email, password, name, role, avatar, bio, created_at) VALUES (?, ?, ?, "admin", ?, ?, ?)')
                .bind(email || 'admin@parenting.my.id', String(password || 'admin123'), name || 'Admin', avatar || '', bio || '', new Date().toISOString()).run();
            }
          } catch (uErr) {
            console.error('Error syncing admin user from config payload:', uErr);
          }
        }
      }

      // Filter out sensitive credential keys from being written to configs table or public/site_config.json
      const safeConfigObj: Record<string, any> = {};
      const SENSITIVE_KEYS = ['admin_email', 'admin_password', 'admin_name', 'admin_avatar', 'admin_bio', 'password', 'secret', 'token'];

      for (const [key, value] of Object.entries(body)) {
        const kLower = key.toLowerCase();
        if (SENSITIVE_KEYS.includes(key) || kLower.includes('password') || kLower.includes('secret') || kLower.includes('token')) {
          continue; // DO NOT SAVE SENSITIVE CREDENTIALS INTO CONFIGS TABLE
        }
        safeConfigObj[key] = value;
      }

      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS configs (
              key TEXT PRIMARY KEY,
              value TEXT
            )
          `).run();

          // Delete any existing credential keys in DB
          try {
            await env.DB.prepare("DELETE FROM configs WHERE key IN ('admin_email', 'admin_password', 'admin_name', 'admin_avatar', 'admin_bio') OR key LIKE '%password%' OR key LIKE '%secret%' OR key LIKE '%token%'").run();
          } catch {}

          for (const [key, value] of Object.entries(safeConfigObj)) {
            const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
            await env.DB.prepare(`
              INSERT INTO configs (key, value) VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value
            `).bind(key, strVal).run();
          }
        } catch (e: any) {
          console.error('Error saving site configs to D1:', e);
        }
      }

      // Sync ONLY safeConfigObj to public/site_config.json via GitHub API if GITHUB_TOKEN exists
      const token = env.GITHUB_TOKEN;
      if (token) {
        try {
          const owner = env.GITHUB_OWNER || 'roywikan';
          const repo = env.GITHUB_REPO || 'parenting-my-id';
          const branch = env.GITHUB_BRANCH || 'main';
          const filePath = 'public/site_config.json';
          const ghUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

          let sha = '';
          const getRes = await fetch(ghUrl, {
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'CloudflarePages-ParentingApp',
            }
          });
          if (getRes.ok) {
            const getData: any = await getRes.json();
            sha = getData.sha;
          }

          const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(safeConfigObj, null, 2))));
          await fetch(ghUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'CloudflarePages-ParentingApp',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: 'update: site_config.json via Admin Portal',
              content: contentBase64,
              branch,
              ...(sha ? { sha } : {})
            }),
          });
        } catch (err) {
          console.error('Failed to sync site_config.json to GitHub:', err);
        }
      }

      return jsonResponse({ success: true, message: 'Konfigurasi situs berhasil diperbarui.' });
    }

    // 9. POST /api/auth/update-credentials
    if (path === '/api/auth/update-credentials' && method === 'POST') {
      const { id, name, email, password, avatar, bio } = await request.json() as any;

      if (!email || !id) {
        return jsonResponse({ error: 'ID dan Email wajib diisi.' }, 400);
      }

      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT UNIQUE,
              password TEXT,
              name TEXT,
              role TEXT,
              avatar TEXT,
              bio TEXT,
              created_at TEXT
            )
          `).run();

          // Ensure missing columns exist in existing D1 table
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN password TEXT").run(); } catch {}
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN avatar TEXT").run(); } catch {}
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN bio TEXT").run(); } catch {}

          // SECURITY PURGE: Purge any sensitive keys from configs table
          try {
            await env.DB.prepare("DELETE FROM configs WHERE key LIKE 'admin_%' OR key LIKE '%password%' OR key LIKE '%secret%'").run();
          } catch {}

          const existingUser = await env.DB.prepare('SELECT id FROM users WHERE id = ? OR LOWER(email) = LOWER(?)').bind(id, email).first();

          if (existingUser) {
            if (password && password.trim().length > 0) {
              await env.DB.prepare(`
                UPDATE users SET name = ?, email = ?, password = ?, avatar = ?, bio = ?
                WHERE id = ?
              `).bind(name || 'Admin', email, password, avatar || '', bio || '', existingUser.id).run();
            } else {
              await env.DB.prepare(`
                UPDATE users SET name = ?, email = ?, avatar = ?, bio = ?
                WHERE id = ?
              `).bind(name || 'Admin', email, avatar || '', bio || '', existingUser.id).run();
            }
          } else {
            await env.DB.prepare(`
              INSERT INTO users (id, email, password, name, role, avatar, bio, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(id, email, password || 'admin123', name || 'Admin', 'admin', avatar || '', bio || '', new Date().toISOString()).run();
          }

          const updatedUser = await env.DB.prepare('SELECT id, email, name, role, avatar, bio FROM users WHERE id = ? OR LOWER(email) = LOWER(?)').bind(id, email).first();

          return jsonResponse({
            success: true,
            user: updatedUser || { id, email, name, role: 'admin', avatar, bio },
            message: 'Kredensial berhasil diperbarui di D1 Database.'
          });
        } catch (e: any) {
          console.error('Error updating user credentials in D1:', e);
          return jsonResponse({ error: 'Gagal memperbarui kredensial: ' + e.message }, 500);
        }
      }

      return jsonResponse({
        success: true,
        user: { id, email, name, role: 'admin', avatar, bio },
        message: 'Kredensial diperbarui secara lokal.'
      });
    }

    // 10. POST /api/auth/login
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = await request.json() as any;

      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT UNIQUE,
              password TEXT,
              name TEXT,
              role TEXT,
              avatar TEXT,
              bio TEXT,
              created_at TEXT
            )
          `).run();

          // Ensure missing columns exist in existing D1 table
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN password TEXT").run(); } catch {}
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN avatar TEXT").run(); } catch {}
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN bio TEXT").run(); } catch {}

          // Query user by email
          const user = await env.DB.prepare('SELECT id, email, password, name, role, avatar, bio FROM users WHERE LOWER(email) = LOWER(?)').bind(email).first();
          
          if (user) {
            // Check password if set in D1
            if (user.password && password && user.password !== password) {
              return jsonResponse({ error: 'Password yang Anda masukkan salah.' }, 401);
            }

            return jsonResponse({
              success: true,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                bio: user.bio,
              },
              token: `session_${user.id}_${Date.now()}`
            });
          }
        } catch (e) {
          console.error('Error logging in via D1:', e);
        }
      }

      // Check D1 config override if set
      if (env.DB) {
        try {
          const customEmail = await env.DB.prepare("SELECT value FROM configs WHERE key = 'admin_email'").first();
          const customPass = await env.DB.prepare("SELECT value FROM configs WHERE key = 'admin_password'").first();

          if (customEmail?.value && customPass?.value) {
            const cleanEmail = String(customEmail.value).replace(/^"|"$/g, '');
            const cleanPass = String(customPass.value).replace(/^"|"$/g, '');

            if (email.toLowerCase() === cleanEmail.toLowerCase() && password === cleanPass) {
              return jsonResponse({
                success: true,
                user: {
                  id: 1,
                  email: cleanEmail,
                  name: 'Admin Utama',
                  role: 'admin',
                  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=75&fm=webp',
                  bio: 'Administrator Utama Parenting.my.id'
                },
                token: `session_1_${Date.now()}`
              });
            }
          }
        } catch (e) {
          console.error('Error checking config credentials:', e);
        }
      }

      // Default initial login check
      if (email.toLowerCase() === 'admin@parenting.my.id' && (password === 'admin123' || password === 'admin')) {
        return jsonResponse({
          success: true,
          user: {
            id: 1,
            email: 'admin@parenting.my.id',
            name: 'Dr. Ratna Sari, M.Psi',
            role: 'admin',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=75&fm=webp',
            bio: 'Psikolog anak dan praktisi parenting terkemuka di Indonesia.'
          },
          token: `session_1_${Date.now()}`
        });
      } else if (email.toLowerCase() === 'penulis@parenting.my.id' && (password === 'writer123' || password === 'writer')) {
        return jsonResponse({
          success: true,
          user: {
            id: 2,
            email: 'penulis@parenting.my.id',
            name: 'Ahmad Zulkarnain, S.Ked',
            role: 'writer',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=75&fm=webp',
            bio: 'Edukator kesehatan anak dan spesialis gizi tumbuh kembang balita.'
          },
          token: `session_2_${Date.now()}`
        });
      }

      return jsonResponse({ error: 'Email atau password salah.' }, 401);
    }

    // 8a. POST /api/upload-cloudinary & /api/upload (Cloudinary WebP Pipeline with GitHub Fallback)
    if ((path === '/api/upload-cloudinary' || path === '/api/upload') && method === 'POST') {
      let filename = '';
      let base64Content = '';
      try {
        const body = await request.json() as any;
        filename = body.filename || '';
        base64Content = body.base64Content || '';

        if (!filename || !base64Content) {
          return jsonResponse({ error: 'Filename dan Base64 content wajib diisi' }, 400);
        }

        const cloudName = (env as any).CLOUDINARY_CLOUD_NAME || 'harga-promo-diskon';
        const apiKey = (env as any).CLOUDINARY_API_KEY || '945558876687176';
        const apiSecret = (env as any).CLOUDINARY_API_SECRET || '6TBtS1kzFgoNg_4SHmzmSImyPlE';
        const folder = (env as any).CLOUDINARY_FOLDER || 'parenting-my-id';

        const timestamp = Math.floor(Date.now() / 1000).toString();
        const format = 'webp';
        const transformation = 'c_limit,w_1024,q_auto';

        const stringToSign = `folder=${folder}&format=${format}&timestamp=${timestamp}&transformation=${transformation}${apiSecret}`;

        const encoder = new TextEncoder();
        const data = encoder.encode(stringToSign);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const formData = new URLSearchParams();
        const filePayload = base64Content.startsWith('data:') ? base64Content : `data:image/jpeg;base64,${base64Content}`;
        formData.append('file', filePayload);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp);
        formData.append('folder', folder);
        formData.append('format', format);
        formData.append('transformation', transformation);
        formData.append('signature', signature);

        const cRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });

        const cData: any = await cRes.json();
        if (cRes.ok && cData.secure_url) {
          let webpUrl = cData.secure_url;
          if (!webpUrl.toLowerCase().endsWith('.webp')) {
            webpUrl = webpUrl.replace(/\.[a-z0-9]+$/i, '.webp');
          }
          return jsonResponse({
            success: true,
            url: webpUrl,
            raw_url: cData.secure_url,
            format: 'webp',
            width: cData.width,
            height: cData.height,
            source: 'cloudinary',
            bytes: cData.bytes,
          });
        } else {
          console.warn('Cloudinary CF error, using GitHub fallback:', cData);
        }
      } catch (err: any) {
        console.warn('Cloudinary CF exception, using GitHub fallback:', err);
      }

      // GitHub Storage Fallback
      try {
        const token = env.GITHUB_TOKEN;
        const owner = env.GITHUB_OWNER || 'vswi';
        const repo = env.GITHUB_REPO || 'parenting-my-id';
        const branch = env.GITHUB_BRANCH || 'main';

        if (!token) {
          return jsonResponse({ error: 'Gagal upload: Token storage tidak dikonfigurasi.' }, 500);
        }

        const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const timestamp = Date.now();
        const filePath = `public/uploads/${timestamp}_${cleanFilename}`;
        const base64Clean = base64Content.replace(/^data:image\/\w+;base64,/, '');

        const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CloudflareWorker',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Upload image ${cleanFilename} (Auto Storage)`,
            content: base64Clean,
            branch: branch,
          }),
        });

        const ghData: any = await ghRes.json();
        if (ghRes.ok && (ghData.content?.download_url || ghData.content?.html_url)) {
          const rawUrl = ghData.content?.download_url || `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
          return jsonResponse({
            success: true,
            url: rawUrl,
            raw_url: rawUrl,
            source: 'github',
          });
        } else {
          return jsonResponse({ error: ghData?.message || 'Gagal menyimpan gambar ke penyimpanan.' }, 500);
        }
      } catch (ghErr: any) {
        return jsonResponse({ error: ghErr.message || 'Error koneksi server penyimpanan gambar.' }, 500);
      }
    }

    // 8b. POST /api/upload-github (Legacy Fallback)
    if (path === '/api/upload-github' && method === 'POST') {
      const { filename, base64Content } = await request.json() as any;
      const token = env.GITHUB_TOKEN;
      const owner = env.GITHUB_OWNER || 'roywikan';
      const repo = env.GITHUB_REPO || 'parenting-my-id';
      const branch = env.GITHUB_BRANCH || 'main';

      if (!token) {
        return jsonResponse({ error: 'GITHUB_TOKEN belum diset di Cloudflare Pages Variables & Secrets.' }, 500);
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const cleanName = (filename || 'image.png').toLowerCase().replace(/[^a-z0-9.-]/g, '-');
      const filePath = `public/uploads/${dateStr}/${Date.now()}-${cleanName}`;
      const message = `upload: image ${filename} via Parenting CMS`;

      const ghUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
      const ghRes = await fetch(ghUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CloudflarePages-ParentingApp',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          content: base64Content,
          branch,
        }),
      });

      if (ghRes.ok) {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
        return jsonResponse({ success: true, url: rawUrl, path: filePath });
      } else {
        const errData = await ghRes.json() as any;
        return jsonResponse({ error: errData.message || 'Gagal mengunggah gambar ke GitHub.' }, 500);
      }
    }

    // 9. GET /api/comments
    if (path === '/api/comments' && method === 'GET') {
      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS comments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              post_slug TEXT NOT NULL,
              user_name TEXT NOT NULL,
              user_email TEXT NOT NULL,
              user_avatar TEXT NOT NULL,
              content TEXT NOT NULL,
              status TEXT DEFAULT 'pending',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `).run();

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
            // For public article view, default to showing only approved comments
            whereClauses.push("status = 'approved'");
          }

          if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
          }

          query += ' ORDER BY created_at DESC LIMIT 100';

          const stmt = env.DB.prepare(query);
          const { results } = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all();

          return jsonResponse(results || []);
        } catch (e: any) {
          console.error('Error fetching comments from D1:', e);
          return jsonResponse([]);
        }
      }
      return jsonResponse([]);
    }

    // 9b. POST /api/comments (Native Comment Submission from Readers)
    if (path === '/api/comments' && method === 'POST') {
      try {
        const body = await request.json() as any;
        const { post_slug, user_name, user_email, content } = body;

        if (!post_slug || !user_name || !content) {
          return jsonResponse({ error: 'Nama, komentar, dan artikel tujuan wajib diisi.' }, 400);
        }

        const avatarName = encodeURIComponent(user_name.trim());
        const avatar = `https://ui-avatars.com/api/?name=${avatarName}&background=f43f5e&color=fff`;

        if (env.DB) {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS comments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              post_slug TEXT NOT NULL,
              user_name TEXT NOT NULL,
              user_email TEXT NOT NULL,
              user_avatar TEXT NOT NULL,
              content TEXT NOT NULL,
              status TEXT DEFAULT 'pending',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `).run();

          await env.DB.prepare(`
            INSERT INTO comments (post_slug, user_name, user_email, user_avatar, content, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
          `).bind(
            post_slug,
            user_name.trim(),
            (user_email || '').trim(),
            avatar,
            content.trim()
          ).run();
        }

        return jsonResponse({
          success: true,
          message: 'Terima kasih! Komentar Anda telah berhasil dikirim dan sedang menunggu persetujuan (moderasi) admin.',
        });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 9c. PUT /api/comments/:id or /api/comments/:id/approve (Admin Approve / Update Comment)
    if (path.startsWith('/api/comments/') && method === 'PUT') {
      if (env.DB) {
        try {
          const id = path.split('/')[3];
          const body = await request.json().catch(() => ({})) as any;
          const newStatus = body.status || 'approved';

          await env.DB.prepare('UPDATE comments SET status = ? WHERE id = ?').bind(newStatus, id).run();
          return jsonResponse({ success: true, message: `Komentar #${id} berhasil diupdate menjadi ${newStatus}.` });
        } catch (e: any) {
          return jsonResponse({ error: e.message }, 500);
        }
      }
      return jsonResponse({ success: true });
    }

    // 10. DELETE /api/comments/:id
    if (path.startsWith('/api/comments/') && method === 'DELETE') {
      if (env.DB) {
        try {
          const id = path.split('/')[3];
          await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Komentar berhasil dihapus.' });
        } catch (e: any) {
          return jsonResponse({ error: e.message }, 500);
        }
      }
      return jsonResponse({ success: true });
    }

    // 11. GET /api/webhooks/cusdis or GET /api/cusdis-webhook (Health / Browser Check)
    if ((path === '/api/webhooks/cusdis' || path === '/api/cusdis-webhook') && method === 'GET') {
      return jsonResponse({
        status: 'online',
        success: true,
        message: 'Cusdis Webhook Endpoint Cloudflare Pages aktif dan siap menerima payload POST dari Cusdis!',
        endpoint: 'https://parenting.my.id/api/webhooks/cusdis',
      });
    }

    // 12. POST /api/webhooks/cusdis or POST /api/cusdis-webhook (Cusdis Comment Webhook Auto-Sync to D1 DB)
    if ((path === '/api/webhooks/cusdis' || path === '/api/cusdis-webhook') && method === 'POST') {
      try {
        const payload = await request.json() as any;
        console.log('[Cusdis Webhook Received]:', JSON.stringify(payload));

        if (payload && payload.type === 'new_comment' && payload.data) {
          const { by_nickname, by_email, content, page_id } = payload.data;
          const avatarName = encodeURIComponent(by_nickname || 'Pembaca');
          const avatar = `https://ui-avatars.com/api/?name=${avatarName}&background=f43f5e&color=fff`;

          if (env.DB) {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_slug TEXT NOT NULL,
                user_name TEXT NOT NULL,
                user_email TEXT NOT NULL,
                user_avatar TEXT NOT NULL,
                content TEXT NOT NULL,
                status TEXT DEFAULT 'approved',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `).run();

            await env.DB.prepare(`
              INSERT INTO comments (post_slug, user_name, user_email, user_avatar, content, status)
              VALUES (?, ?, ?, ?, ?, 'approved')
            `).bind(
              page_id || '',
              by_nickname || 'Pembaca Anonim',
              by_email || '',
              avatar,
              content || ''
            ).run();
          }

          return jsonResponse({
            success: true,
            message: 'Komentar Cusdis berhasil disinkronkan ke Cloudflare D1 Database!',
          });
        }

        return jsonResponse({ success: true, message: 'Webhook payload diterima.' });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err.message }, 500);
      }
    }

    return jsonResponse({ error: 'Endpoint tidak ditemukan' }, 404);
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Internal Server Error' }, 500);
  }
};
