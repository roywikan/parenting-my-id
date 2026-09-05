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
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...extraHeaders,
      },
    });
  };

  if (method === 'OPTIONS') {
    return jsonResponse({ ok: true }, 200);
  }

  const siteUrl = 'https://parenting.my.id';

  const escapeXml = (unsafe: any): string => {
    if (unsafe == null) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const escapeCdata = (text: any): string => {
    if (text == null) return '';
    return String(text).replace(/\]\]>/g, ']]]]><![CDATA[>');
  };

  // Security: Authenticate Bearer or session token against D1 users and default credentials
  const authenticateRequest = async (allowedRoles?: string[]): Promise<{ user?: any; errorResponse?: Response }> => {
    const authHeader = request.headers.get('Authorization') || request.headers.get('x-session-token') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return {
        errorResponse: jsonResponse({ error: 'Akses ditolak: Token autentikasi diperlukan.' }, 401),
      };
    }

    const tokenMatch = token.match(/^session_(\d+)(?:_([a-zA-Z0-9]+))?_(\d+)$/);
    if (!tokenMatch) {
      return {
        errorResponse: jsonResponse({ error: 'Token sesi tidak valid.' }, 401),
      };
    }

    const userId = Number(tokenMatch[1]);
    let user: any = null;

    if (env.DB) {
      try {
        const dbUser = await env.DB.prepare('SELECT id, email, role, name FROM users WHERE id = ?').bind(userId).first();
        if (dbUser) {
          user = {
            id: Number(dbUser.id),
            email: dbUser.email,
            role: dbUser.role || 'writer',
            name: dbUser.name,
          };
        }
      } catch (e) {
        console.error('Error fetching user for auth in D1:', e);
      }
    }

    if (!user) {
      if (userId === 1) {
        user = { id: 1, email: 'admin@parenting.my.id', role: 'admin', name: 'Dr. Ratna Sari, M.Psi' };
      } else if (userId === 2) {
        user = { id: 2, email: 'editor@parenting.my.id', role: 'editor', name: 'Maya Putri, S.Psi' };
      } else if (userId === 3) {
        user = { id: 3, email: 'penulis@parenting.my.id', role: 'writer', name: 'Ahmad Zulkarnain, S.Ked' };
      } else {
        const tokenRole = tokenMatch[2] || 'writer';
        user = {
          id: userId,
          email: `${tokenRole}_${userId}@parenting.my.id`,
          role: tokenRole,
          name: `Penulis ${userId}`,
        };
      }
    }

    if (!user) {
      return {
        errorResponse: jsonResponse({ error: 'Pengguna tidak ditemukan atau sesi telah kedaluwarsa.' }, 401),
      };
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return {
        errorResponse: jsonResponse({ error: 'Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.' }, 403),
      };
    }

    return { user };
  };

  // Slug generator with collision avoidance
  const getUniqueSlugD1 = async (baseText: string, excludeId?: number | string | null): Promise<string> => {
    let cleanBase = (baseText || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!cleanBase) cleanBase = 'artikel';

    if (!env.DB) return cleanBase;

    let candidate = cleanBase;
    let counter = 2;
    const numExcludeId = excludeId ? Number(excludeId) : null;

    while (true) {
      try {
        let query = 'SELECT id FROM posts WHERE slug = ?';
        const bindings: any[] = [candidate];
        if (numExcludeId && !isNaN(numExcludeId)) {
          query += ' AND id != ?';
          bindings.push(numExcludeId);
        }
        const existing = await env.DB.prepare(query).bind(...bindings).first();
        if (!existing) {
          return candidate;
        }
        candidate = `${cleanBase}-${counter}`;
        counter++;
      } catch {
        return candidate;
      }
    }
  };

  try {
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
          (post: any) => {
            const loc = escapeXml(`${siteUrl}/baca/${encodeURIComponent(post.slug)}`);
            const lastMod = escapeXml(new Date(post.updated_at || Date.now()).toISOString().split('T')[0]);
            return `<url><loc>${loc}</loc><lastmod>${lastMod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
          }
        ).join('');

        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeXml(siteUrl)}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>${urls}</urlset>`.trim();

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
          (post: any) => {
            const link = escapeXml(`${siteUrl}/baca/${encodeURIComponent(post.slug)}`);
            return `
    <item>
      <title><![CDATA[${escapeCdata(post.title || '')}]]></title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description><![CDATA[${escapeCdata(post.excerpt || '')}]]></description>
      <pubDate>${escapeXml(new Date(post.created_at || Date.now()).toUTCString())}</pubDate>
    </item>`;
          }
        ).join('');

        const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Parenting.my.id - Edukasi &amp; Pola Asuh Anak Modern</title>
    <link>${escapeXml(siteUrl)}</link>
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
          .map((p: any) => {
            const cleanTitle = (p.title || '').replace(/[\[\]]/g, '').trim();
            const cleanDesc = (p.excerpt || '')
              .replace(/[\r\n]+/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            return `- [${cleanTitle}](${siteUrl}/baca/${p.slug})${cleanDesc ? `: ${cleanDesc}` : ''}`;
          })
          .join('\n');

        const llmsTxt = `# Parenting.my.id

> Portal berita dan informasi parenting terpercaya di Indonesia. Menyajikan edukasi pola asuh anak, kesehatan, serta nutrisi keluarga.

## Artikel Terkait & Panduan Utama

${articleLinks}

## Sumber Daya Tambahan

- [Konten Lengkap LLMs](${siteUrl}/llms-full.txt): Kumpulan teks lengkap artikel untuk konsumsi dan inferensi model bahasa (LLM).
- [Sitemap XML](${siteUrl}/sitemap.xml): Peta situs terstruktur untuk crawler.
- [RSS Feed](${siteUrl}/feed.xml): Umpan sindikasi artikel terbaru.
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

    // 0e. GET /api/users
    if (path === '/api/users' && method === 'GET') {
      const defaultUsers = [
        {
          id: 1,
          email: 'admin@parenting.my.id',
          name: 'Dr. Ratna Sari, M.Psi',
          role: 'admin',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=75&fm=webp',
          title: 'Psikolog Anak & Pakar Parenting',
          bio: 'Psikolog anak dan praktisi parenting terkemuka di Indonesia.',
          socialInstagram: 'https://instagram.com',
          socialLinkedin: 'https://linkedin.com',
          socialWebsite: 'https://parenting.my.id'
        },
        {
          id: 2,
          email: 'penulis@parenting.my.id',
          name: 'Ahmad Zulkarnain, S.Ked',
          role: 'writer',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=75&fm=webp',
          title: 'Edukator Kesehatan Anak & Balita',
          bio: 'Edukator kesehatan anak dan spesialis gizi tumbuh kembang balita.',
          socialInstagram: 'https://instagram.com',
          socialLinkedin: '',
          socialWebsite: ''
        }
      ];

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
              title TEXT,
              social_instagram TEXT,
              social_linkedin TEXT,
              social_website TEXT,
              created_at TEXT
            )
          `).run();

          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN title TEXT").run(); } catch {}
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN social_instagram TEXT").run(); } catch {}
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN social_linkedin TEXT").run(); } catch {}
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN social_website TEXT").run(); } catch {}

          const { results } = await env.DB.prepare(`
            SELECT 
              id, email, name, role, avatar, bio, title,
              social_instagram as socialInstagram,
              social_linkedin as socialLinkedin,
              social_website as socialWebsite,
              created_at as createdAt
            FROM users
            ORDER BY id ASC
          `).all();

          if (results && results.length > 0) {
            return jsonResponse(results);
          }
        } catch (e) {
          console.error('Error fetching users from D1:', e);
        }
      }
      return jsonResponse(defaultUsers);
    }

    // 0f. POST /api/users
    if (path === '/api/users' && method === 'POST') {
      const auth = await authenticateRequest(['admin']);
      if (auth.errorResponse) return auth.errorResponse;

      const body = await request.json() as any;
      const { id, name, email, password, role, avatar, title, bio, socials } = body;

      if (!name || !email) {
        return jsonResponse({ error: 'Nama dan Email wajib diisi.' }, 400);
      }

      const instagram = socials?.instagram || body.socialInstagram || '';
      const linkedin = socials?.linkedin || body.socialLinkedin || '';
      const website = socials?.website || body.socialWebsite || '';
      const userRole = role || 'writer';
      const userAvatar = avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
      const userTitle = title || 'Edukator Parenting';
      const userBio = bio || 'Penulis dan kontributor artikel.';
      const now = new Date().toISOString();

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
              title TEXT,
              social_instagram TEXT,
              social_linkedin TEXT,
              social_website TEXT,
              created_at TEXT
            )
          `).run();

          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN title TEXT").run(); } catch {}
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN social_instagram TEXT").run(); } catch {}
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN social_linkedin TEXT").run(); } catch {}
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN social_website TEXT").run(); } catch {}

          if (id) {
            const existing = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();
            if (existing) {
              if (password && String(password).trim().length > 0) {
                await env.DB.prepare(`
                  UPDATE users SET name = ?, email = ?, password = ?, role = ?, avatar = ?, title = ?, bio = ?, social_instagram = ?, social_linkedin = ?, social_website = ?
                  WHERE id = ?
                `).bind(name, email, String(password), userRole, userAvatar, userTitle, userBio, instagram, linkedin, website, id).run();
              } else {
                await env.DB.prepare(`
                  UPDATE users SET name = ?, email = ?, role = ?, avatar = ?, title = ?, bio = ?, social_instagram = ?, social_linkedin = ?, social_website = ?
                  WHERE id = ?
                `).bind(name, email, userRole, userAvatar, userTitle, userBio, instagram, linkedin, website, id).run();
              }

              return jsonResponse({
                success: true,
                user: { id: Number(id), name, email, role: userRole, avatar: userAvatar, title: userTitle, bio: userBio, socialInstagram: instagram, socialLinkedin: linkedin, socialWebsite: website }
              });
            }
          }

          const insertRes = await env.DB.prepare(`
            INSERT INTO users (name, email, password, role, avatar, title, bio, social_instagram, social_linkedin, social_website, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(name, email, password || 'writer123', userRole, userAvatar, userTitle, userBio, instagram, linkedin, website, now).run();

          const newId = insertRes.meta?.last_row_id || Date.now();

          return jsonResponse({
            success: true,
            user: { id: newId, name, email, role: userRole, avatar: userAvatar, title: userTitle, bio: userBio, socialInstagram: instagram, socialLinkedin: linkedin, socialWebsite: website, createdAt: now }
          });
        } catch (e: any) {
          console.error('Error saving user to D1:', e);
          return jsonResponse({ error: 'Gagal menyimpan user ke D1: ' + e.message }, 500);
        }
      }

      return jsonResponse({
        success: true,
        user: { id: id || Date.now(), name, email, role: userRole, avatar: userAvatar, title: userTitle, bio: userBio, socialInstagram: instagram, socialLinkedin: linkedin, socialWebsite: website }
      });
    }

    // 0g. DELETE /api/users
    if ((path === '/api/users' || path.startsWith('/api/users/')) && method === 'DELETE') {
      const auth = await authenticateRequest(['admin']);
      if (auth.errorResponse) return auth.errorResponse;

      const urlObj = new URL(request.url);
      let userIdParam = urlObj.searchParams.get('id');
      if (!userIdParam && path.startsWith('/api/users/')) {
        userIdParam = path.split('/')[3];
      }

      const numId = userIdParam ? Number(userIdParam) : null;
      if (numId === 1) {
        return jsonResponse({ error: 'Admin Utama tidak dapat dihapus.' }, 400);
      }

      if (env.DB && numId) {
        try {
          await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(numId).run();
        } catch (e: any) {
          console.error('Error deleting user from D1:', e);
        }
      }

      return jsonResponse({ success: true, message: 'Penulis / User berhasil dihapus.' });
    }

    // 1. GET /api/posts
    if (path === '/api/posts' && method === 'GET') {
      if (env.DB) {
        try {
          const { results } = await env.DB.prepare(`
            SELECT 
              p.id, p.title, p.slug, p.content_markdown as contentMarkdown, p.excerpt, 
              p.featured_image as featuredImage, p.category, p.read_time_minutes as readTimeMinutes, 
              p.author_id as authorId, p.co_author_ids as coAuthorIds, p.status, p.rejection_reason as rejectionReason, 
              p.meta_title as metaTitle, p.meta_description as metaDescription, p.tags, p.views, 
              p.created_at as createdAt, p.updated_at as updatedAt,
              u.name as authorName, u.avatar as authorAvatar, u.role as authorRole
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            ORDER BY p.id DESC
          `).all();

          if (results) {
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
      const auth = await authenticateRequest(['admin', 'editor', 'writer']);
      if (auth.errorResponse) return auth.errorResponse;

      const body = await request.json() as any;
      const { id, title, slug, contentMarkdown, excerpt, featuredImage, category, readTimeMinutes, authorId, coAuthorIds, status, rejectionReason, metaTitle, metaDescription, tags } = body;

      if (!title || !contentMarkdown) {
        return jsonResponse({ error: 'Judul dan konten markdown wajib diisi.' }, 400);
      }

      const generatedSlug = await getUniqueSlugD1(slug || title, id);
      const postExcerpt = excerpt || contentMarkdown.slice(0, 150) + '...';
      const image = featuredImage || 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=700&q=75&fm=webp';
      const cat = category || 'Pola Asuh';
      const readMin = readTimeMinutes || Math.max(1, Math.ceil(contentMarkdown.split(' ').length / 200));
      const postStatus = status || 'draft';
      const rejReason = rejectionReason || null;
      const mTitle = metaTitle || `${title} | Parenting.my.id`;
      const mDesc = metaDescription || postExcerpt;
      const tagList = tags || 'parenting, anak';
      const coAuthorsStr = Array.isArray(coAuthorIds) ? JSON.stringify(coAuthorIds) : null;
      const now = new Date().toISOString();

      const numId = id ? Number(id) : null;
      const validNumId = numId && !isNaN(numId) ? numId : null;
      const strId = id ? String(id) : null;

      if (env.DB) {
        try {
          if (validNumId || strId || generatedSlug) {
            const updateRes = await env.DB.prepare(`
              UPDATE posts SET 
                title = ?, slug = ?, content_markdown = ?, excerpt = ?, featured_image = ?,
                category = ?, read_time_minutes = ?, status = ?, rejection_reason = ?, meta_title = ?, meta_description = ?,
                tags = ?, co_author_ids = ?, updated_at = ?
              WHERE (id IS NOT NULL AND (id = ? OR id = ?)) OR slug = ?
            `).bind(title, generatedSlug, contentMarkdown, postExcerpt, image, cat, readMin, postStatus, rejReason, mTitle, mDesc, tagList, coAuthorsStr, now, validNumId || -1, strId || '', generatedSlug).run();

            if (updateRes.meta?.changes && updateRes.meta.changes > 0) {
              syncStaticFilesToGitHub(env, context.waitUntil ? context.waitUntil.bind(context) : undefined);
              return jsonResponse({
                success: true,
                post: {
                  ...body,
                  id: validNumId || id,
                  slug: generatedSlug,
                  status: postStatus,
                  rejectionReason: rejReason,
                  updatedAt: now
                }
              });
            }
          }

          // Fallback to INSERT if new post or ID/Slug not found in D1
          const insertResult = await env.DB.prepare(`
            INSERT INTO posts (title, slug, content_markdown, excerpt, featured_image, category, read_time_minutes, author_id, co_author_ids, status, rejection_reason, meta_title, meta_description, tags, views, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
          `).bind(title, generatedSlug, contentMarkdown, postExcerpt, image, cat, readMin, authorId || 1, coAuthorsStr, postStatus, rejReason, mTitle, mDesc, tagList, now, now).run();

          const newId = insertResult.meta?.last_row_id || validNumId || id || Date.now();

          syncStaticFilesToGitHub(env, context.waitUntil ? context.waitUntil.bind(context) : undefined);

          return jsonResponse({
            success: true,
            post: {
              id: typeof newId === 'number' ? newId : Number(newId),
              title,
              slug: generatedSlug,
              contentMarkdown,
              excerpt: postExcerpt,
              featuredImage: image,
              category: cat,
              readTimeMinutes: readMin,
              authorId: authorId || 1,
              coAuthorIds: coAuthorIds || [],
              status: postStatus,
              rejectionReason: rejReason,
              metaTitle: mTitle,
              metaDescription: mDesc,
              tags: tagList,
              views: 0,
              createdAt: now,
              updatedAt: now
            }
          });
        } catch (e: any) {
          console.error('Error saving post to D1:', e);
          
          // If D1 table has a strict CHECK constraint (e.g. CHECK (status IN ('draft', 'published'))), retry using 'draft' for DB compatibility
          if (e.message && (e.message.includes('CHECK constraint failed') || e.message.includes('SQLITE_CONSTRAINT'))) {
            try {
              const safeStatus = postStatus === 'published' ? 'published' : 'draft';
              if (validNumId || strId || generatedSlug) {
                const updateRes = await env.DB.prepare(`
                  UPDATE posts SET 
                    title = ?, slug = ?, content_markdown = ?, excerpt = ?, featured_image = ?,
                    category = ?, read_time_minutes = ?, status = ?, rejection_reason = ?, meta_title = ?, meta_description = ?,
                    tags = ?, co_author_ids = ?, updated_at = ?
                  WHERE (id IS NOT NULL AND (id = ? OR id = ?)) OR slug = ?
                `).bind(title, generatedSlug, contentMarkdown, postExcerpt, image, cat, readMin, safeStatus, rejReason, mTitle, mDesc, tagList, coAuthorsStr, now, validNumId || -1, strId || '', generatedSlug).run();

                if (updateRes.meta?.changes && updateRes.meta.changes > 0) {
                  syncStaticFilesToGitHub(env, context.waitUntil ? context.waitUntil.bind(context) : undefined);
                  return jsonResponse({
                    success: true,
                    post: {
                      ...body,
                      id: validNumId || id,
                      slug: generatedSlug,
                      status: postStatus,
                      rejectionReason: rejReason,
                      updatedAt: now
                    }
                  });
                }
              }

              const insertResult = await env.DB.prepare(`
                INSERT INTO posts (title, slug, content_markdown, excerpt, featured_image, category, read_time_minutes, author_id, co_author_ids, status, rejection_reason, meta_title, meta_description, tags, views, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
              `).bind(title, generatedSlug, contentMarkdown, postExcerpt, image, cat, readMin, authorId || 1, coAuthorsStr, safeStatus, rejReason, mTitle, mDesc, tagList, now, now).run();

              const newId = insertResult.meta?.last_row_id || validNumId || id || Date.now();
              syncStaticFilesToGitHub(env, context.waitUntil ? context.waitUntil.bind(context) : undefined);
              return jsonResponse({
                success: true,
                post: {
                  ...body,
                  id: typeof newId === 'number' ? newId : Number(newId),
                  slug: generatedSlug,
                  status: postStatus,
                  updatedAt: now
                }
              });
            } catch (retryErr: any) {
              console.error('Retry error on fallback:', retryErr);
            }
          }

          return jsonResponse({ error: 'Gagal menyimpan artikel ke D1 Database: ' + e.message }, 500);
        }
      }

      syncStaticFilesToGitHub(env, context.waitUntil ? context.waitUntil.bind(context) : undefined);
      return jsonResponse({ success: true, post: { ...body, id: validNumId || id || Date.now(), slug: generatedSlug, status: postStatus } });
    }

    // 3. DELETE /api/posts/:id
    if (path.startsWith('/api/posts/') && method === 'DELETE') {
      const auth = await authenticateRequest(['admin', 'editor', 'writer']);
      if (auth.errorResponse) return auth.errorResponse;

      const parts = path.split('/');
      const id = parts[parts.length - 1];
      if (env.DB && id) {
        try {
          await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
          syncStaticFilesToGitHub(env, context.waitUntil ? context.waitUntil.bind(context) : undefined);
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
      const auth = await authenticateRequest(['admin', 'editor']);
      if (auth.errorResponse) return auth.errorResponse;

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
      const auth = await authenticateRequest(['admin', 'editor']);
      if (auth.errorResponse) return auth.errorResponse;

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
      const auth = await authenticateRequest(['admin']);
      if (auth.errorResponse) return auth.errorResponse;

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
      const auth = await authenticateRequest(['admin', 'editor', 'writer']);
      if (auth.errorResponse) return auth.errorResponse;

      const { id, name, email, oldPassword, password, avatar, bio } = await request.json() as any;

      if (!email || !id) {
        return jsonResponse({ error: 'ID dan Email wajib diisi.' }, 400);
      }

      const numId = Number(id);
      // Security: Non-admin users can only update their own profile
      if (auth.user?.role !== 'admin' && auth.user?.id !== numId) {
        return jsonResponse({ error: 'Akses ditolak: Anda hanya dapat memperbarui profil akun Anda sendiri.' }, 403);
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

          const existingUser = await env.DB.prepare('SELECT id, email, password, role FROM users WHERE id = ? OR LOWER(email) = LOWER(?)').bind(numId, email).first();

          if (existingUser) {
            if (password && String(password).trim().length > 0) {
              // Security: Verify old password before updating
              if (existingUser.password && (!oldPassword || existingUser.password !== oldPassword)) {
                return jsonResponse({ error: 'Password lama salah. Verifikasi keamanan gagal.' }, 400);
              }

              await env.DB.prepare(`
                UPDATE users SET name = ?, email = ?, password = ?, avatar = ?, bio = ?
                WHERE id = ?
              `).bind(name || 'User', email, String(password), avatar || '', bio || '', existingUser.id).run();
            } else {
              await env.DB.prepare(`
                UPDATE users SET name = ?, email = ?, avatar = ?, bio = ?
                WHERE id = ?
              `).bind(name || 'User', email, avatar || '', bio || '', existingUser.id).run();
            }
          } else {
            await env.DB.prepare(`
              INSERT INTO users (id, email, password, name, role, avatar, bio, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(numId, email, password || 'writer123', name || 'User', 'writer', avatar || '', bio || '', new Date().toISOString()).run();
          }

          const updatedUser = await env.DB.prepare('SELECT id, email, name, role, avatar, bio FROM users WHERE id = ? OR LOWER(email) = LOWER(?)').bind(numId, email).first();

          return jsonResponse({
            success: true,
            user: updatedUser || { id: numId, email, name, role: 'writer', avatar, bio },
            message: 'Kredensial berhasil diperbarui di D1 Database.'
          });
        } catch (e: any) {
          console.error('Error updating user credentials in D1:', e);
          return jsonResponse({ error: 'Gagal memperbarui kredensial: ' + e.message }, 500);
        }
      }

      return jsonResponse({
        success: true,
        user: { id: numId, email, name, role: 'writer', avatar, bio },
        message: 'Kredensial diperbarui secara lokal.'
      });
    }

    // 10. POST /api/auth/login
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = await request.json() as any;

      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return jsonResponse({ error: 'Email dan password wajib diisi.' }, 400);
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

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
          const user = await env.DB.prepare('SELECT id, email, password, name, role, avatar, bio FROM users WHERE LOWER(email) = LOWER(?)').bind(cleanEmail).first();
          
          if (user) {
            // Strict absolute password check
            if (!cleanPass || user.password !== cleanPass) {
              return jsonResponse({ error: 'Email atau password salah.' }, 401);
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
              token: `session_${user.id}_${user.role || 'writer'}_${Date.now()}`
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
            const cEmail = String(customEmail.value).replace(/^"|"$/g, '').trim().toLowerCase();
            const cPass = String(customPass.value).replace(/^"|"$/g, '').trim();

            if (cleanEmail === cEmail) {
              if (!cleanPass || cleanPass !== cPass) {
                return jsonResponse({ error: 'Email atau password salah.' }, 401);
              }
              return jsonResponse({
                success: true,
                user: {
                  id: 1,
                  email: cEmail,
                  name: 'Admin Utama',
                  role: 'admin',
                  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=75&fm=webp',
                  bio: 'Administrator Utama Parenting.my.id'
                },
                token: `session_1_admin_${Date.now()}`
              });
            }
          }
        } catch (e) {
          console.error('Error checking config credentials:', e);
        }
      }

      // Default initial login check
      if (cleanEmail === 'admin@parenting.my.id') {
        if (!cleanPass || cleanPass !== 'admin123') {
          return jsonResponse({ error: 'Email atau password salah.' }, 401);
        }
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
          token: `session_1_admin_${Date.now()}`
        });
      } else if (cleanEmail === 'editor@parenting.my.id') {
        if (!cleanPass || cleanPass !== 'editor123') {
          return jsonResponse({ error: 'Email atau password salah.' }, 401);
        }
        return jsonResponse({
          success: true,
          user: {
            id: 2,
            email: 'editor@parenting.my.id',
            name: 'Maya Putri, S.Psi',
            role: 'editor',
            avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=100&q=75&fm=webp',
            bio: 'Editor konten kesehatan dan pengasuhan anak dengan sertifikasi jurnalistik edukasi keluarga.'
          },
          token: `session_2_editor_${Date.now()}`
        });
      } else if (cleanEmail === 'penulis@parenting.my.id') {
        if (!cleanPass || cleanPass !== 'writer123') {
          return jsonResponse({ error: 'Email atau password salah.' }, 401);
        }
        return jsonResponse({
          success: true,
          user: {
            id: 3,
            email: 'penulis@parenting.my.id',
            name: 'Ahmad Zulkarnain, S.Ked',
            role: 'writer',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=75&fm=webp',
            bio: 'Edukator kesehatan anak dan spesialis gizi tumbuh kembang balita.'
          },
          token: `session_3_writer_${Date.now()}`
        });
      }

      return jsonResponse({ error: 'Email atau password salah.' }, 401);
    }

    // 8a. POST /api/upload-cloudinary & /api/upload (Cloudinary WebP Pipeline with GitHub Fallback)
    if ((path === '/api/upload-cloudinary' || path === '/api/upload') && method === 'POST') {
      const auth = await authenticateRequest(['admin', 'editor', 'writer']);
      if (auth.errorResponse) return auth.errorResponse;

      let filename = '';
      let base64Content = '';
      try {
        const body = await request.json() as any;
        filename = body.filename || '';
        base64Content = body.base64Content || '';

        if (!filename || !base64Content) {
          return jsonResponse({ error: 'Filename dan Base64 content wajib diisi' }, 400);
        }

        // Limit upload size to 5MB (Base64 string length roughly ~6.8MB)
        if (base64Content.length > 7 * 1024 * 1024) {
          return jsonResponse({ error: 'Ukuran file terlalu besar. Maksimal 5MB.' }, 400);
        }

        const cloudName = (env as any).CLOUDINARY_CLOUD_NAME;
        const apiKey = (env as any).CLOUDINARY_API_KEY;
        const apiSecret = (env as any).CLOUDINARY_API_SECRET;
        const folder = (env as any).CLOUDINARY_FOLDER || 'parenting-my-id';

        if (cloudName && apiKey && apiSecret) {
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
        }
      } catch (err: any) {
        console.warn('Cloudinary CF exception, using GitHub fallback:', err);
      }

      // GitHub Storage Fallback
      try {
        const token = env.GITHUB_TOKEN;
        const owner = env.GITHUB_OWNER || 'roywikan';
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
      const auth = await authenticateRequest(['admin', 'editor', 'writer']);
      if (auth.errorResponse) return auth.errorResponse;

      const { filename, base64Content } = await request.json() as any;
      if (!filename || !base64Content) {
        return jsonResponse({ error: 'Filename dan Base64 content wajib diisi.' }, 400);
      }

      if (base64Content.length > 7 * 1024 * 1024) {
        return jsonResponse({ error: 'Ukuran file terlalu besar. Maksimal 5MB.' }, 400);
      }

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
          content: base64Content.replace(/^data:image\/\w+;base64,/, ''),
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

    // 8c. POST /api/ai/generate-meta (AI Gemini SEO Helper with Smart Fallback)
    if (path === '/api/ai/generate-meta' && method === 'POST') {
      const auth = await authenticateRequest(['admin', 'editor', 'writer']);
      if (auth.errorResponse) return auth.errorResponse;

      let title = '';
      let content = '';
      try {
        const body = await request.json() as any;
        title = body.title || '';
        content = body.content || '';
      } catch (e) {
        return jsonResponse({ error: 'Body JSON tidak valid.' }, 400);
      }

      if (!title) {
        return jsonResponse({ error: 'Judul wajib diisi untuk menghasilkan SEO metadata.' }, 400);
      }

      const apiKey = (env as any).GEMINI_API_KEY;

      const getSmartFallback = (t: string, c: string) => {
        const cleanContent = (c || '')
          .replace(/[#*`_\[\]()]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        const sentenceMatch = cleanContent.match(/^[^.!?]+[.!?]/);
        let firstSentence = sentenceMatch ? sentenceMatch[0] : '';

        if (firstSentence.length < 40 || firstSentence.length > 200) {
          firstSentence = cleanContent.slice(0, 150);
          if (cleanContent.length > 150) {
            firstSentence += '...';
          }
        }

        let excerpt = cleanContent.slice(0, 180);
        if (cleanContent.length > 180) {
          excerpt += '...';
        }

        return {
          metaTitle: `${t} | Parenting.my.id`,
          metaDescription: firstSentence,
          tags: 'parenting, anak, keluarga, kesehatan anak, balita',
          excerpt: excerpt,
          aiGenerated: false,
        };
      };

      if (!apiKey) {
        return jsonResponse(getSmartFallback(title, content));
      }

      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const prompt = `Anda adalah seorang Senior SEO Specialist & Parenting Content Strategist untuk website parenting.my.id.
Berdasarkan judul artikel: "${title}" dan isi: "${(content || '').slice(0, 500)}", hasilkan format JSON persis seperti ini tanpa markdown codeblock:
{
  "metaTitle": "${title} | Parenting.my.id",
  "metaDescription": "Deskripsi Meta SEO membujuk yang memuat kata kunci utama tentang parenting (120-155 karakter).",
  "tags": "5 kata kunci dipisahkan koma",
  "excerpt": "Ringkasan artikel 2 kalimat yang hangat dan empatik untuk orang tua Indonesia."
}`;

        const gRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        });

        if (gRes.ok) {
          const gData = await gRes.json() as any;
          const text = gData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return jsonResponse({ ...parsed, aiGenerated: true });
          }
        }
      } catch (err) {
        console.error('Gemini Edge API Error:', err);
      }

      return jsonResponse(getSmartFallback(title, content));
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

        const sanitizedName = String(user_name).replace(/<[^>]*>?/gm, '').trim();
        const sanitizedContent = String(content).replace(/<[^>]*>?/gm, '').trim();
        const sanitizedEmail = String(user_email || '').replace(/<[^>]*>?/gm, '').trim();

        if (!sanitizedName || !sanitizedContent) {
          return jsonResponse({ error: 'Nama dan komentar tidak boleh kosong.' }, 400);
        }

        const avatarName = encodeURIComponent(sanitizedName);
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
            sanitizedName,
            sanitizedEmail,
            avatar,
            sanitizedContent
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
      const auth = await authenticateRequest(['admin', 'editor']);
      if (auth.errorResponse) return auth.errorResponse;

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
      const auth = await authenticateRequest(['admin', 'editor']);
      if (auth.errorResponse) return auth.errorResponse;

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
          const sanitizedName = String(by_nickname || 'Pembaca Anonim').replace(/<[^>]*>?/gm, '').trim();
          const sanitizedContent = String(content || '').replace(/<[^>]*>?/gm, '').trim();
          const sanitizedEmail = String(by_email || '').replace(/<[^>]*>?/gm, '').trim();

          const avatarName = encodeURIComponent(sanitizedName || 'Pembaca');
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
              sanitizedName || 'Pembaca Anonim',
              sanitizedEmail,
              avatar,
              sanitizedContent
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

async function syncStaticFilesToGitHub(env: Env, waitUntil?: (promise: Promise<any>) => void) {
  const token = env.GITHUB_TOKEN;
  if (!token || !env.DB) return;

  const doSync = async () => {
    try {
      const owner = env.GITHUB_OWNER || 'roywikan';
      const repo = env.GITHUB_REPO || 'parenting-my-id';
      const branch = env.GITHUB_BRANCH || 'main';
      const siteUrl = 'https://parenting.my.id';

      const { results } = await env.DB.prepare(
        `SELECT p.title, p.slug, p.excerpt, p.content_markdown as contentMarkdown, p.category, p.updated_at as updatedAt, p.created_at as createdAt, u.name as authorName 
         FROM posts p 
         LEFT JOIN users u ON p.author_id = u.id 
         WHERE p.status = 'published' 
         ORDER BY p.created_at DESC`
      ).all();

      const postsList = results || [];

      // 1. generate feed.xml
      const items = postsList.map(
        (post: any) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/baca/${post.slug}</link>
      <guid>${siteUrl}/baca/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      <pubDate>${new Date(post.created_at || Date.now()).toUTCString()}</pubDate>
    </item>`
      ).join('');

      const feedXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Parenting.my.id - Edukasi &amp; Pola Asuh Anak Modern</title>
    <link>${siteUrl}</link>
    <description>Portal artikel parenting, gizi anak, stimulasi balita, dan pencegahan stunting di Indonesia.</description>
    <language>id-id</language>
    ${items}
  </channel>
</rss>`.trim();

      // 2. generate sitemap.xml
      const urls = postsList.map(
        (post: any) => `<url><loc>${siteUrl}/baca/${post.slug}</loc><lastmod>${new Date(post.updatedAt || post.createdAt || Date.now()).toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
      ).join('');
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>${urls}</urlset>`.trim();

      // 3. generate llms.txt
      const articleLinks = postsList
        .map((p: any) => {
          const cleanTitle = (p.title || '').replace(/[\[\]]/g, '').trim();
          const cleanDesc = (p.excerpt || '')
            .replace(/[\r\n]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          return `- [${cleanTitle}](${siteUrl}/baca/${p.slug})${cleanDesc ? `: ${cleanDesc}` : ''}`;
        })
        .join('\n');

      const llmsTxt = `# Parenting.my.id

> Portal berita dan informasi parenting terpercaya di Indonesia. Menyajikan edukasi pola asuh anak, kesehatan, serta nutrisi keluarga.

## Artikel Terkait & Panduan Utama

${articleLinks || '- [Panduan Parenting Utama](' + siteUrl + '): Edukasi pola asuh anak dan kesehatan.'}

## Sumber Daya Tambahan

- [Konten Lengkap LLMs](${siteUrl}/llms-full.txt): Kumpulan teks lengkap artikel untuk konsumsi dan inferensi model bahasa (LLM).
- [Sitemap XML](${siteUrl}/sitemap.xml): Peta situs terstruktur untuk crawler.
- [RSS Feed](${siteUrl}/feed.xml): Umpan sindikasi artikel terbaru.
`.trim();

      // 4. generate llms-full.txt
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

Dokumen ini memuat kumpulan artikel lengkap dalam format Markdown for Large Language Models (LLMs).

${fullArticles}
`.trim();

      // Commit files to GitHub sequentially
      const filesToCommit = [
        { path: 'public/feed.xml', content: feedXml, msg: 'auto-update: sync feed.xml via CMS D1' },
        { path: 'public/sitemap.xml', content: sitemapXml, msg: 'auto-update: sync sitemap.xml via CMS D1' },
        { path: 'public/llms.txt', content: llmsTxt, msg: 'auto-update: sync llms.txt via CMS D1' },
        { path: 'public/llms-full.txt', content: llmsFullTxt, msg: 'auto-update: sync llms-full.txt via CMS D1' },
      ];

      for (const f of filesToCommit) {
        try {
          const ghUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${f.path}`;
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

          const contentBase64 = btoa(unescape(encodeURIComponent(f.content)));
          await fetch(ghUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'CloudflarePages-ParentingApp',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: f.msg,
              content: contentBase64,
              branch,
              ...(sha ? { sha } : {})
            })
          });
        } catch (fErr) {
          console.error(`Error committing ${f.path} to GitHub:`, fErr);
        }
      }
    } catch (err) {
      console.error('Error in syncStaticFilesToGitHub:', err);
    }
  };

  if (waitUntil) {
    waitUntil(doSync());
  } else {
    await doSync();
  }
}
