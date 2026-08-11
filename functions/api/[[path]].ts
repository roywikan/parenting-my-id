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

  const jsonResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  };

  if (method === 'OPTIONS') {
    return jsonResponse({ ok: true }, 200);
  }

  try {
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
      const image = featuredImage || 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80';
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

    // 7. POST /api/auth/login
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = await request.json() as any;

      if (env.DB) {
        try {
          const user = await env.DB.prepare('SELECT id, email, name, role, avatar, bio FROM users WHERE email = ?').bind(email).first();
          if (user) {
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

      // Hardcoded fallback
      if (email === 'admin@parenting.my.id' && (password === 'admin123' || password === 'admin')) {
        return jsonResponse({
          success: true,
          user: {
            id: 1,
            email: 'admin@parenting.my.id',
            name: 'Dr. Ratna Sari, M.Psi',
            role: 'admin',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
            bio: 'Psikolog anak dan praktisi parenting terkemuka di Indonesia.'
          },
          token: `session_1_${Date.now()}`
        });
      } else if (email === 'penulis@parenting.my.id' && (password === 'writer123' || password === 'writer')) {
        return jsonResponse({
          success: true,
          user: {
            id: 2,
            email: 'penulis@parenting.my.id',
            name: 'Ahmad Zulkarnain, S.Ked',
            role: 'writer',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            bio: 'Edukator kesehatan anak dan spesialis gizi tumbuh kembang balita.'
          },
          token: `session_2_${Date.now()}`
        });
      }

      return jsonResponse({ error: 'Email atau password salah.' }, 401);
    }

    // 8. POST /api/upload-github
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

    return jsonResponse({ error: 'Endpoint tidak ditemukan' }, 404);
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Internal Server Error' }, 500);
  }
};
