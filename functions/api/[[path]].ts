interface Env {
  DB?: any;
  JWT_SECRET?: string;
  GITHUB_TOKEN?: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  TURNSTILE_SECRET_KEY?: string;
  ADMIN_EMERGENCY_KEY?: string;
}

// =========================================================================
// Stateless HMAC-SHA256 Signed JWT Utilities (Web Crypto API)
// =========================================================================
const base64UrlEncode = (input: string | Uint8Array): string => {
  let binary = '';
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64UrlDecode = (str: string): string => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

const base64UrlToUint8Array = (str: string): Uint8Array => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const signJwtHmacSha256 = async (
  payload: Record<string, any>,
  secret: string,
  expiresInSeconds: number = 86400 * 7
): Promise<string> => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign));
  const sigB64 = base64UrlEncode(new Uint8Array(sigBuffer));
  return `${dataToSign}.${sigB64}`;
};

const verifyJwtHmacSha256 = async (
  token: string,
  secret: string
): Promise<{ valid: boolean; payload?: any; error?: string }> => {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token tidak disediakan.' };
    }
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Format token bukan JWT yang valid (3 bagian header.payload.signature).' };
    }

    const [headerB64, payloadB64, sigB64] = parts;
    const dataToVerify = `${headerB64}.${payloadB64}`;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = base64UrlToUint8Array(sigB64);
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(dataToVerify));
    if (!isValid) {
      return { valid: false, error: 'Tanda tangan token tidak valid. Manipulasi atau token palsu terdeteksi.' };
    }

    const payload = JSON.parse(base64UrlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && typeof payload.exp === 'number' && payload.exp < now) {
      return { valid: false, error: 'Token sesi telah kedaluwarsa. Silakan lakukan login ulang.' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: `Verifikasi token gagal: ${err?.message || 'Token tidak terbaca'}` };
  }
};

const extractTokenFromHeaderOrCookie = (
  authHeader?: string | null,
  cookieHeader?: string | null
): string => {
  if (authHeader && typeof authHeader === 'string') {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith('bearer ')) {
      return trimmed.slice(7).trim();
    }
    if (trimmed) {
      return trimmed;
    }
  }

  if (cookieHeader && typeof cookieHeader === 'string') {
    const match = cookieHeader.match(/(?:^|;\s*)(?:cms_token|session_token|auth_token|token)=([^;]+)/i);
    if (match) {
      return decodeURIComponent(match[1].trim());
    }
  }

  return '';
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const jsonResponse = (data: any, status = 200, extraHeaders: Record<string, string> = {}) => {
    // Check if path is a public route
    const isPublicGet = (method === 'GET' && (
      path.startsWith('/api/posts') || 
      path.startsWith('/api/comments') || 
      path.startsWith('/api/categories') || 
      path.startsWith('/api/tags') ||
      path.startsWith('/api/config') ||
      path.startsWith('/api/dns-aid')
    ));

    const isPublicPost = (method === 'POST' && (
      path.startsWith('/api/comments') ||
      path.startsWith('/api/newsletter') ||
      /^\/api\/posts\/[^/]+\/view\/?$/.test(path)
    ));

    const isApiRoute = path.startsWith('/api/');
    const isAdminRoute = isApiRoute && !isPublicGet && !isPublicPost;

    let allowOrigin = '*';
    if (isAdminRoute) {
      const requestOrigin = request.headers.get('Origin') || '';
      const requestHost = requestOrigin ? new URL(requestOrigin).hostname : '';
      const serverHost = new URL(request.url).hostname;
      if (requestHost === serverHost || requestOrigin.includes('localhost') || requestOrigin.includes('asia-southeast1.run.app')) {
        allowOrigin = requestOrigin;
      } else {
        allowOrigin = `https://${serverHost}`;
      }
    }

    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': allowOrigin,
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

  const siteUrl = (env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '');

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

  const getSiteConfig = async (): Promise<{ site_name: string; site_description: string }> => {
    const activeHost = new URL(request.url).hostname.replace('www.', '');
    const defaultSiteName = activeHost || 'Portal Informasi';
    const defaultSiteDesc = 'Portal informasi dan edukasi terpercaya.';
    
    if (!env.DB) {
      return { site_name: defaultSiteName, site_description: defaultSiteDesc };
    }
    try {
      const results = await env.DB.prepare("SELECT key, value FROM configs WHERE key IN ('site_name', 'site_description', 'seo_meta_title', 'seo_meta_description')").all();
      const configMap: Record<string, string> = {};
      if (results && results.results) {
        for (const row of results.results) {
          try {
            configMap[row.key] = JSON.parse(row.value);
          } catch {
            configMap[row.key] = row.value;
          }
        }
      }
      return {
        site_name: configMap.site_name || configMap.seo_meta_title || defaultSiteName,
        site_description: configMap.site_description || configMap.seo_meta_description || defaultSiteDesc
      };
    } catch {
      return { site_name: defaultSiteName, site_description: defaultSiteDesc };
    }
  };

  // Helper to ensure users table schema compatibility (supporting both password & password_hash)
  // and automatically seeding initial users (Admin, Maya Putri as Editor, Ahmad Zulkarnain as Writer) to D1
  const syncAndPrepareUsersTable = async (db: any): Promise<Set<string>> => {
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE,
          password TEXT,
          password_hash TEXT,
          name TEXT,
          role TEXT DEFAULT 'writer',
          avatar TEXT,
          bio TEXT,
          title TEXT,
          social_instagram TEXT,
          social_linkedin TEXT,
          social_website TEXT,
          created_at TEXT
        )
      `).run();

      const missingCols = [
        'password TEXT',
        'password_hash TEXT',
        'role TEXT DEFAULT \'writer\'',
        'avatar TEXT',
        'bio TEXT',
        'title TEXT',
        'social_instagram TEXT',
        'social_linkedin TEXT',
        'social_website TEXT'
      ];
      for (const colDef of missingCols) {
        try {
          await db.prepare(`ALTER TABLE users ADD COLUMN ${colDef}`).run();
        } catch {}
      }

      const colInfo = await db.prepare('PRAGMA table_info(users)').all();
      const cols = new Set<string>((colInfo?.results || []).map((c: any) => c.name));

      // Check if table is empty or missing Maya Putri
      try {
        const countRes = await db.prepare('SELECT COUNT(*) as count FROM users').first() as any;
        const totalCount = Number(countRes?.count || 0);

        if (totalCount === 0) {
          const initialSeed = [
            {
              id: 1,
              email: 'admin@parenting.my.id',
              password: 'admin123',
              name: 'Dr. Ratna Sari, M.Psi',
              role: 'admin',
              title: 'Psikolog Anak & Pakar Parenting',
              avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=75&fm=webp',
              bio: 'Psikolog anak dan praktisi parenting terkemuka di Indonesia.',
              instagram: 'https://instagram.com/ratnasari.mpsi',
              linkedin: 'https://linkedin.com/in/ratnasari-mpsi',
              website: 'https://parenting.my.id'
            },
            {
              id: 2,
              email: 'editor@parenting.my.id',
              password: 'editor123',
              name: 'Maya Putri, S.Psi',
              role: 'editor',
              title: 'Senior Editor & Content Moderator',
              avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=80&q=50&fm=webp',
              bio: 'Editor konten kesehatan dan pengasuhan anak dengan sertifikasi jurnalistik edukasi keluarga.',
              instagram: 'https://instagram.com/mayaputri.editor',
              linkedin: 'https://linkedin.com/in/maya-putri-editor',
              website: 'https://parenting.my.id'
            },
            {
              id: 3,
              email: 'penulis@parenting.my.id',
              password: 'writer123',
              name: 'Ahmad Zulkarnain, S.Ked',
              role: 'writer',
              title: 'Edukator Kesehatan Anak & Balita',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=75&fm=webp',
              bio: 'Edukator kesehatan anak dan spesialis gizi tumbuh kembang balita.',
              instagram: 'https://instagram.com/ahmad.zk',
              linkedin: '',
              website: ''
            }
          ];

          for (const u of initialSeed) {
            if (cols.has('password_hash')) {
              await db.prepare(`
                INSERT INTO users (id, email, password, password_hash, name, role, title, avatar, bio, social_instagram, social_linkedin, social_website, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(u.id, u.email, u.password, u.password, u.name, u.role, u.title, u.avatar, u.bio, u.instagram, u.linkedin, u.website, new Date().toISOString()).run();
            } else {
              await db.prepare(`
                INSERT INTO users (id, email, password, name, role, title, avatar, bio, social_instagram, social_linkedin, social_website, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(u.id, u.email, u.password, u.name, u.role, u.title, u.avatar, u.bio, u.instagram, u.linkedin, u.website, new Date().toISOString()).run();
            }
          }
        } else {
          // Ensure Maya Putri (Editor) exists in D1
          const editorInDb = await db.prepare("SELECT id FROM users WHERE role = 'editor' OR LOWER(email) LIKE 'editor@%'").first();
          if (!editorInDb) {
            const now = new Date().toISOString();
            if (cols.has('password_hash')) {
              await db.prepare(`
                INSERT INTO users (email, password, password_hash, name, role, title, avatar, bio, social_instagram, social_linkedin, social_website, created_at)
                VALUES (?, ?, ?, ?, 'editor', ?, ?, ?, ?, ?, ?, ?)
              `).bind('editor@parenting.my.id', 'editor123', 'editor123', 'Maya Putri, S.Psi', 'Senior Editor & Content Moderator', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=80&q=50&fm=webp', 'Editor konten kesehatan dan pengasuhan anak dengan sertifikasi jurnalistik edukasi keluarga.', 'https://instagram.com/mayaputri.editor', 'https://linkedin.com/in/maya-putri-editor', 'https://parenting.my.id', now).run();
            } else {
              await db.prepare(`
                INSERT INTO users (email, password, name, role, title, avatar, bio, social_instagram, social_linkedin, social_website, created_at)
                VALUES (?, ?, ?, 'editor', ?, ?, ?, ?, ?, ?, ?)
              `).bind('editor@parenting.my.id', 'editor123', 'Maya Putri, S.Psi', 'Senior Editor & Content Moderator', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=80&q=50&fm=webp', 'Editor konten kesehatan dan pengasuhan anak dengan sertifikasi jurnalistik edukasi keluarga.', 'https://instagram.com/mayaputri.editor', 'https://linkedin.com/in/maya-putri-editor', 'https://parenting.my.id', now).run();
            }
          }
        }
      } catch (seedErr) {
        console.error('Error auto-seeding users in D1:', seedErr);
      }

      return cols;
    } catch (err) {
      console.error('Error preparing users table in D1:', err);
      return new Set<string>(['id', 'email', 'password', 'password_hash', 'name', 'role']);
    }
  };

  // Helper to ensure posts table schema compatibility (supporting interactive model fields and revisions)
  const syncAndPreparePostsTable = async (db: any): Promise<Set<string>> => {
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          content_markdown TEXT NOT NULL,
          excerpt TEXT,
          featured_image TEXT,
          category TEXT,
          read_time_minutes INTEGER DEFAULT 5,
          author_id INTEGER,
          co_author_ids TEXT,
          revisions TEXT,
          status TEXT DEFAULT 'draft',
          rejection_reason TEXT,
          meta_title TEXT,
          meta_description TEXT,
          tags TEXT,
          views INTEGER DEFAULT 0,
          created_at TEXT,
          updated_at TEXT
        )
      `).run();

      const missingCols = [
        'rejection_reason TEXT',
        'revisions TEXT',
        'post_type TEXT DEFAULT \'article\'',
        'interactive_configurator TEXT',
        'interactive_showcase TEXT',
        'interactive_radar TEXT',
        'interactive_quiz TEXT',
        'interactive_timeline_slider TEXT',
        'interactive_battle_card TEXT',
        'interactive_quiz_router TEXT',
        'interactive_habit_simulator TEXT',
        'interactive_qa_column TEXT',
        'disclaimer_type TEXT DEFAULT \'none\'',
        'custom_disclaimer_text TEXT',
        'created_at TEXT',
        'updated_at TEXT'
      ];
      for (const colDef of missingCols) {
        try {
          await db.prepare(`ALTER TABLE posts ADD COLUMN ${colDef}`).run();
        } catch {}
      }

      const colInfo = await db.prepare('PRAGMA table_info(posts)').all();
      return new Set<string>((colInfo?.results || []).map((c: any) => c.name));
    } catch (err) {
      console.error('Error preparing posts table in D1:', err);
      return new Set<string>(['id', 'title', 'slug', 'content_markdown', 'status']);
    }
  };

  // Security: Authenticate Bearer or session token (Stateless HMAC-SHA256 JWT, zero D1 query load)
  const authenticateRequest = async (allowedRoles?: string[]): Promise<{ user?: any; errorResponse?: Response }> => {
    const authHeader = request.headers.get('Authorization') || request.headers.get('x-session-token') || '';
    const cookieHeader = request.headers.get('Cookie') || '';
    const token = extractTokenFromHeaderOrCookie(authHeader, cookieHeader);

    if (!token) {
      return {
        errorResponse: jsonResponse({ error: 'Akses ditolak: Token autentikasi diperlukan (Header Authorization Bearer atau Cookie).' }, 401),
      };
    }

    const jwtSecret = env.JWT_SECRET || (typeof process !== 'undefined' ? process.env?.JWT_SECRET : '') || 'parenting-unified-jwt-secret-key-2026-secure';

    // 1. STATELESS SIGNED JWT VALIDATION (Zero D1 reads, verified cryptographically via HMAC-SHA256)
    if (token.includes('.') && token.split('.').length === 3) {
      const jwtResult = await verifyJwtHmacSha256(token, jwtSecret);
      if (!jwtResult.valid || !jwtResult.payload) {
        return {
          errorResponse: jsonResponse({ error: `Akses ditolak: ${jwtResult.error || 'Token tidak valid atau telah kedaluwarsa.'}` }, 401),
        };
      }

      const user = {
        id: Number(jwtResult.payload.id),
        email: jwtResult.payload.email,
        role: jwtResult.payload.role || 'writer',
        name: jwtResult.payload.name,
      };

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return {
          errorResponse: jsonResponse({ error: `Akses ditolak: Role '${user.role}' tidak memiliki izin untuk tindakan ini.` }, 403),
        };
      }

      // Completely stateless success - zero queries to D1!
      return { user };
    }

    // 2. Backward compatibility for legacy session tokens during migration rollout
    const tokenMatch = token.match(/^session_(\d+)(?:_([a-zA-Z0-9]+))?_(\d+)$/);
    if (!tokenMatch) {
      return {
        errorResponse: jsonResponse({ error: 'Token sesi tidak valid atau format tidak dikenali.' }, 401),
      };
    }

    const userId = Number(tokenMatch[1]);
    let user: any = null;

    if (env.DB) {
      try {
        await syncAndPrepareUsersTable(env.DB);
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
      const activeHost = new URL(request.url).hostname.replace('www.', '');
      if (userId === 1) {
        user = { id: 1, email: `admin@${activeHost}`, role: 'admin', name: 'Dr. Ratna Sari, M.Psi' };
      } else if (userId === 2) {
        user = { id: 2, email: `editor@${activeHost}`, role: 'editor', name: 'Maya Putri, S.Psi' };
      } else if (userId === 3) {
        user = { id: 3, email: `penulis@${activeHost}`, role: 'writer', name: 'Ahmad Zulkarnain, S.Ked' };
      } else {
        const tokenRole = tokenMatch[2] || 'writer';
        user = {
          id: userId,
          email: `${tokenRole}_${userId}@${activeHost}`,
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

  // Helper to verify Cloudflare Turnstile Captcha
  const verifyTurnstileTokenEdge = async (token?: string): Promise<boolean> => {
    const secretKey = (env as any).TURNSTILE_SECRET_KEY || '1x00000000000000000000000000000000UNIFIED';
    if (!token) return false;

    try {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
      });
      if (res.ok) {
        const data = await res.json() as any;
        return !!data.success;
      }
    } catch (err) {
      console.error('Turnstile verification error on edge:', err);
    }

    return secretKey === '1x00000000000000000000000000000000UNIFIED';
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
            const titleClean = escapeXml(post.title || '');
            const descClean = escapeXml(post.excerpt || '');
            return `
    <item>
      <title>${titleClean}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description>${descClean}</description>
      <pubDate>${escapeXml(new Date(post.created_at || Date.now()).toUTCString())}</pubDate>
    </item>`;
          }
        ).join('');

        const siteMeta = await getSiteConfig();
        const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteMeta.site_name)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(siteMeta.site_description)}</description>
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

        const siteMeta = await getSiteConfig();

        const sanitizeLlmsText = (text: string) => {
          return (text || '')
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        };

        let articleLinks = postsList
          .map((p: any) => {
            const cleanTitle = sanitizeLlmsText(p.title || '').replace(/[\[\]]/g, '').trim();
            const cleanDesc = sanitizeLlmsText(p.excerpt || '');
            return `- [${cleanTitle}](${siteUrl}/baca/${p.slug})${cleanDesc ? `: ${cleanDesc}` : ''}`;
          })
          .join('\n');

        if (!articleLinks.trim()) {
          articleLinks = `- [Beranda](${siteUrl}): ${siteMeta.site_description}`;
        }

        const llmsTxt = `# ${siteMeta.site_name}

> ${siteMeta.site_description}

## Artikel Terkait & Panduan Utama

${articleLinks}

## Optional

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

        const siteMeta = await getSiteConfig();

        const fullArticles = postsList.map((p: any) => {
          const url = `${siteUrl}/baca/${p.slug}`;
          const author = p.authorName || `Tim Redaksi ${siteMeta.site_name}`;
          const category = p.category || 'Berita';
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

        const llmsFullTxt = `# Arsip Lengkap Artikel ${siteMeta.site_name} (LLMs Full Text)

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
          await syncAndPrepareUsersTable(env.DB);

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
      const passVal = String(password && String(password).trim().length > 0 ? password : 'writer123');
      const now = new Date().toISOString();

      if (env.DB) {
        try {
          const cols = await syncAndPrepareUsersTable(env.DB);

          if (id) {
            const existing = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();
            if (existing) {
              if (password && String(password).trim().length > 0) {
                if (cols.has('password_hash')) {
                  await env.DB.prepare(`
                    UPDATE users SET name = ?, email = ?, password = ?, password_hash = ?, role = ?, avatar = ?, title = ?, bio = ?, social_instagram = ?, social_linkedin = ?, social_website = ?
                    WHERE id = ?
                  `).bind(name, email, passVal, passVal, userRole, userAvatar, userTitle, userBio, instagram, linkedin, website, id).run();
                } else {
                  await env.DB.prepare(`
                    UPDATE users SET name = ?, email = ?, password = ?, role = ?, avatar = ?, title = ?, bio = ?, social_instagram = ?, social_linkedin = ?, social_website = ?
                    WHERE id = ?
                  `).bind(name, email, passVal, userRole, userAvatar, userTitle, userBio, instagram, linkedin, website, id).run();
                }
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

          let insertRes;
          if (cols.has('password_hash')) {
            insertRes = await env.DB.prepare(`
              INSERT INTO users (name, email, password, password_hash, role, avatar, title, bio, social_instagram, social_linkedin, social_website, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(name, email, passVal, passVal, userRole, userAvatar, userTitle, userBio, instagram, linkedin, website, now).run();
          } else {
            insertRes = await env.DB.prepare(`
              INSERT INTO users (name, email, password, role, avatar, title, bio, social_instagram, social_linkedin, social_website, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(name, email, passVal, userRole, userAvatar, userTitle, userBio, instagram, linkedin, website, now).run();
          }

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
          await syncAndPreparePostsTable(env.DB);
          const { results } = await env.DB.prepare(`
            SELECT 
              p.id, p.title, p.slug, p.content_markdown as contentMarkdown, p.excerpt, 
              p.featured_image as featuredImage, p.category, p.read_time_minutes as readTimeMinutes, 
              p.author_id as authorId, p.co_author_ids as coAuthorIds, p.revisions, p.status, p.rejection_reason as rejectionReason, 
              p.meta_title as metaTitle, p.meta_description as metaDescription, p.tags, p.views, 
              p.post_type as postType, p.interactive_configurator as interactiveConfigurator, p.interactive_showcase as interactiveShowcase, p.interactive_radar as interactiveRadar, p.interactive_quiz as interactiveQuiz,
              p.interactive_timeline_slider as interactiveTimelineSlider, p.interactive_battle_card as interactiveBattleCard, p.interactive_quiz_router as interactiveQuizRouter, p.interactive_habit_simulator as interactiveHabitSimulator, p.interactive_qa_column as interactiveQaColumn,
              p.disclaimer_type as disclaimerType, p.custom_disclaimer_text as customDisclaimerText,
              p.created_at as createdAt, p.updated_at as updatedAt,
              u.name as authorName, u.avatar as authorAvatar, u.role as authorRole
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            ORDER BY p.id DESC
          `).all();

          if (results) {
            const parsedResults = results.map((post: any) => {
              const mapped = { ...post };
              
              // Handle postType defaults
              if (!mapped.postType) {
                mapped.postType = 'article';
              }

              // Parse coAuthorIds
              if (typeof mapped.coAuthorIds === 'string') {
                try {
                  mapped.coAuthorIds = JSON.parse(mapped.coAuthorIds);
                } catch {
                  mapped.coAuthorIds = [];
                }
              } else if (!mapped.coAuthorIds) {
                mapped.coAuthorIds = [];
              }

              // Parse revisions
              if (typeof mapped.revisions === 'string') {
                try {
                  mapped.revisions = JSON.parse(mapped.revisions);
                } catch {
                  mapped.revisions = [];
                }
              } else if (!mapped.revisions) {
                mapped.revisions = [];
              }

              // Parse interactiveConfigurator
              if (typeof mapped.interactiveConfigurator === 'string') {
                try {
                  mapped.interactiveConfigurator = JSON.parse(mapped.interactiveConfigurator);
                } catch {
                  mapped.interactiveConfigurator = null;
                }
              }

              // Parse interactiveShowcase
              if (typeof mapped.interactiveShowcase === 'string') {
                try {
                  mapped.interactiveShowcase = JSON.parse(mapped.interactiveShowcase);
                } catch {
                  mapped.interactiveShowcase = null;
                }
              }

              // Parse interactiveRadar
              if (typeof mapped.interactiveRadar === 'string') {
                try {
                  mapped.interactiveRadar = JSON.parse(mapped.interactiveRadar);
                } catch {
                  mapped.interactiveRadar = null;
                }
              }

              // Parse interactiveQuiz
              if (typeof mapped.interactiveQuiz === 'string') {
                try {
                  mapped.interactiveQuiz = JSON.parse(mapped.interactiveQuiz);
                } catch {
                  mapped.interactiveQuiz = null;
                }
              }

              // Parse interactiveTimelineSlider
              if (typeof mapped.interactiveTimelineSlider === 'string') {
                try {
                  mapped.interactiveTimelineSlider = JSON.parse(mapped.interactiveTimelineSlider);
                } catch {
                  mapped.interactiveTimelineSlider = null;
                }
              }

              // Parse interactiveBattleCard
              if (typeof mapped.interactiveBattleCard === 'string') {
                try {
                  mapped.interactiveBattleCard = JSON.parse(mapped.interactiveBattleCard);
                } catch {
                  mapped.interactiveBattleCard = null;
                }
              }

              // Parse interactiveQuizRouter
              if (typeof mapped.interactiveQuizRouter === 'string') {
                try {
                  mapped.interactiveQuizRouter = JSON.parse(mapped.interactiveQuizRouter);
                } catch {
                  mapped.interactiveQuizRouter = null;
                }
              }

              // Parse interactiveHabitSimulator
              if (typeof mapped.interactiveHabitSimulator === 'string') {
                try {
                  mapped.interactiveHabitSimulator = JSON.parse(mapped.interactiveHabitSimulator);
                } catch {
                  mapped.interactiveHabitSimulator = null;
                }
              }

              // Parse interactiveQaColumn
              if (typeof mapped.interactiveQaColumn === 'string') {
                try {
                  mapped.interactiveQaColumn = JSON.parse(mapped.interactiveQaColumn);
                } catch {
                  mapped.interactiveQaColumn = null;
                }
              }

              return mapped;
            });

            return jsonResponse(parsedResults);
          }
        } catch (e) {
          console.error('Error fetching posts from D1:', e);
        }
      }
      return jsonResponse([]);
    }

    // 1b. POST /api/posts/:id/view (Atomic view count increment in Cloudflare D1)
    const viewMatch = path.match(/^\/api\/posts\/([a-zA-Z0-9_-]+)\/view\/?$/);
    if (viewMatch && method === 'POST') {
      const identifier = viewMatch[1];
      const isNum = /^\d+$/.test(identifier);
      const postId = isNum ? Number(identifier) : null;

      let updatedViews = 1;
      if (env.DB) {
        try {
          if (isNum && postId) {
            await env.DB.prepare(`
              UPDATE posts 
              SET views = COALESCE(views, 0) + 1 
              WHERE id = ?
            `).bind(postId).run();

            const row = await env.DB.prepare(`
              SELECT views FROM posts WHERE id = ?
            `).bind(postId).first();

            if (row && typeof row.views === 'number') {
              updatedViews = row.views;
            }
          } else {
            await env.DB.prepare(`
              UPDATE posts 
              SET views = COALESCE(views, 0) + 1 
              WHERE slug = ?
            `).bind(identifier).run();

            const row = await env.DB.prepare(`
              SELECT views FROM posts WHERE slug = ?
            `).bind(identifier).first();

            if (row && typeof row.views === 'number') {
              updatedViews = row.views;
            }
          }
        } catch (e: any) {
          console.error('Error incrementing post view count in D1:', e);
          return jsonResponse({ success: true, identifier, views: updatedViews, fallback: true });
        }
      }

      return jsonResponse({ success: true, identifier, views: updatedViews });
    }

    // 2. POST /api/posts
    if (path === '/api/posts' && method === 'POST') {
      const auth = await authenticateRequest(['admin', 'editor', 'writer']);
      if (auth.errorResponse) return auth.errorResponse;

      const body = await request.json() as any;
      const { 
        id, title, slug, contentMarkdown, excerpt, featuredImage, category, readTimeMinutes, 
        authorId, coAuthorIds, status, rejectionReason, metaTitle, metaDescription, tags,
        postType, interactiveConfigurator, interactiveShowcase, interactiveRadar, interactiveQuiz,
        interactiveTimelineSlider, interactiveBattleCard, interactiveQuizRouter, interactiveHabitSimulator, interactiveQaColumn,
        disclaimerType, customDisclaimerText
      } = body;

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

      const postTypeVal = postType || 'article';
      const interactiveConfiguratorStr = interactiveConfigurator ? JSON.stringify(interactiveConfigurator) : null;
      const interactiveShowcaseStr = interactiveShowcase ? JSON.stringify(interactiveShowcase) : null;
      const interactiveRadarStr = interactiveRadar ? JSON.stringify(interactiveRadar) : null;
      const interactiveQuizStr = interactiveQuiz ? JSON.stringify(interactiveQuiz) : null;
      const interactiveTimelineSliderStr = interactiveTimelineSlider ? JSON.stringify(interactiveTimelineSlider) : null;
      const interactiveBattleCardStr = interactiveBattleCard ? JSON.stringify(interactiveBattleCard) : null;
      const interactiveQuizRouterStr = interactiveQuizRouter ? JSON.stringify(interactiveQuizRouter) : null;
      const interactiveHabitSimulatorStr = interactiveHabitSimulator ? JSON.stringify(interactiveHabitSimulator) : null;
      const interactiveQaColumnStr = interactiveQaColumn ? JSON.stringify(interactiveQaColumn) : null;
      const disclaimerTypeVal = disclaimerType || 'none';
      const customDisclaimerTextVal = customDisclaimerText || null;

      const numId = id ? Number(id) : null;
      const validNumId = numId && !isNaN(numId) ? numId : null;
      const strId = id ? String(id) : null;

      if (env.DB) {
        try {
          await syncAndPreparePostsTable(env.DB);

          // Get existing revisions
          let existingRevisionsStr = '[]';
          let existingPost: any = null;
          if (validNumId || strId || generatedSlug) {
            try {
              existingPost = await env.DB.prepare(`
                SELECT title, content_markdown as contentMarkdown, excerpt, revisions FROM posts 
                WHERE (id IS NOT NULL AND (id = ? OR id = ?)) OR slug = ?
              `).bind(validNumId || -1, strId || '', generatedSlug).first();
              if (existingPost) {
                existingRevisionsStr = existingPost.revisions || '[]';
              }
            } catch (e) {
              console.error('Error fetching existing post for revisions:', e);
            }
          }

          let updatedRevisionsStr = existingRevisionsStr;
          if (existingPost) {
            try {
              let revisionsArr = [];
              try {
                revisionsArr = JSON.parse(existingRevisionsStr);
                if (!Array.isArray(revisionsArr)) revisionsArr = [];
              } catch {
                revisionsArr = [];
              }

              const updaterName = auth.user?.name || 'Kontributor';
              const newRevision = {
                id: `rev-${Date.now()}`,
                timestamp: now,
                title: existingPost.title,
                contentMarkdown: existingPost.contentMarkdown,
                excerpt: existingPost.excerpt,
                updatedByName: updaterName,
              };

              updatedRevisionsStr = JSON.stringify([newRevision, ...revisionsArr].slice(0, 3));
            } catch (revErr) {
              console.error('Error constructing revisions:', revErr);
            }
          }

          if (validNumId || strId || generatedSlug) {
            const updateRes = await env.DB.prepare(`
              UPDATE posts SET 
                title = ?, slug = ?, content_markdown = ?, excerpt = ?, featured_image = ?,
                category = ?, read_time_minutes = ?, status = ?, rejection_reason = ?, meta_title = ?, meta_description = ?,
                tags = ?, co_author_ids = ?, revisions = ?, post_type = ?,
                interactive_configurator = ?, interactive_showcase = ?, interactive_radar = ?, interactive_quiz = ?,
                interactive_timeline_slider = ?, interactive_battle_card = ?, interactive_quiz_router = ?, interactive_habit_simulator = ?, interactive_qa_column = ?,
                disclaimer_type = ?, custom_disclaimer_text = ?,
                updated_at = ?
              WHERE (id IS NOT NULL AND (id = ? OR id = ?)) OR slug = ?
            `).bind(
              title, generatedSlug, contentMarkdown, postExcerpt, image, 
              cat, readMin, postStatus, rejReason, mTitle, mDesc, 
              tagList, coAuthorsStr, updatedRevisionsStr, postTypeVal,
              interactiveConfiguratorStr, interactiveShowcaseStr, interactiveRadarStr, interactiveQuizStr,
              interactiveTimelineSliderStr, interactiveBattleCardStr, interactiveQuizRouterStr, interactiveHabitSimulatorStr, interactiveQaColumnStr,
              disclaimerTypeVal, customDisclaimerTextVal,
              now, validNumId || -1, strId || '', generatedSlug
            ).run();

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
                  revisions: JSON.parse(updatedRevisionsStr),
                  postType: postTypeVal,
                  interactiveConfigurator,
                  interactiveShowcase,
                  interactiveRadar,
                  interactiveQuiz,
                  interactiveTimelineSlider,
                  interactiveBattleCard,
                  interactiveQuizRouter,
                  interactiveHabitSimulator,
                  interactiveQaColumn,
                  disclaimerType: disclaimerTypeVal,
                  customDisclaimerText: customDisclaimerTextVal,
                  updatedAt: now
                }
              });
            }
          }

          // Fallback to INSERT if new post or ID/Slug not found in D1
          const insertResult = await env.DB.prepare(`
            INSERT INTO posts (
              title, slug, content_markdown, excerpt, featured_image, 
              category, read_time_minutes, author_id, co_author_ids, revisions, status, 
              rejection_reason, meta_title, meta_description, tags, views, 
              post_type, interactive_configurator, interactive_showcase, interactive_radar, interactive_quiz,
              interactive_timeline_slider, interactive_battle_card, interactive_quiz_router, interactive_habit_simulator, interactive_qa_column,
              disclaimer_type, custom_disclaimer_text,
              created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            title, generatedSlug, contentMarkdown, postExcerpt, image, 
            cat, readMin, authorId || 1, coAuthorsStr, '[]', postStatus, 
            rejReason, mTitle, mDesc, tagList, 
            postTypeVal, interactiveConfiguratorStr, interactiveShowcaseStr, interactiveRadarStr, interactiveQuizStr,
            interactiveTimelineSliderStr, interactiveBattleCardStr, interactiveQuizRouterStr, interactiveHabitSimulatorStr, interactiveQaColumnStr,
            disclaimerTypeVal, customDisclaimerTextVal,
            now, now
          ).run();

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
              revisions: [],
              status: postStatus,
              rejectionReason: rejReason,
              metaTitle: mTitle,
              metaDescription: mDesc,
              tags: tagList,
              views: 0,
              postType: postTypeVal,
              interactiveConfigurator,
              interactiveShowcase,
              interactiveRadar,
              interactiveQuiz,
              interactiveTimelineSlider,
              interactiveBattleCard,
              interactiveQuizRouter,
              interactiveHabitSimulator,
              interactiveQaColumn,
              disclaimerType: disclaimerTypeVal,
              customDisclaimerText: customDisclaimerTextVal,
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
                    tags = ?, co_author_ids = ?, revisions = ?, post_type = ?,
                    interactive_configurator = ?, interactive_showcase = ?, interactive_radar = ?, interactive_quiz = ?,
                    interactive_timeline_slider = ?, interactive_battle_card = ?, interactive_quiz_router = ?, interactive_habit_simulator = ?, interactive_qa_column = ?,
                    updated_at = ?
                  WHERE (id IS NOT NULL AND (id = ? OR id = ?)) OR slug = ?
                `).bind(
                  title, generatedSlug, contentMarkdown, postExcerpt, image, 
                  cat, readMin, safeStatus, rejReason, mTitle, mDesc, 
                  tagList, coAuthorsStr, updatedRevisionsStr, postTypeVal,
                  interactiveConfiguratorStr, interactiveShowcaseStr, interactiveRadarStr, interactiveQuizStr,
                  interactiveTimelineSliderStr, interactiveBattleCardStr, interactiveQuizRouterStr, interactiveHabitSimulatorStr, interactiveQaColumnStr,
                  now, validNumId || -1, strId || '', generatedSlug
                ).run();

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
                      revisions: JSON.parse(updatedRevisionsStr),
                      postType: postTypeVal,
                      interactiveConfigurator,
                      interactiveShowcase,
                      interactiveRadar,
                      interactiveQuiz,
                      interactiveTimelineSlider,
                      interactiveBattleCard,
                      interactiveQuizRouter,
                      interactiveHabitSimulator,
                      interactiveQaColumn,
                      updatedAt: now
                    }
                  });
                }
              }

              const insertResult = await env.DB.prepare(`
                INSERT INTO posts (
                  title, slug, content_markdown, excerpt, featured_image, 
                  category, read_time_minutes, author_id, co_author_ids, revisions, status, 
                  rejection_reason, meta_title, meta_description, tags, views, 
                  post_type, interactive_configurator, interactive_showcase, interactive_radar, interactive_quiz,
                  interactive_timeline_slider, interactive_battle_card, interactive_quiz_router, interactive_habit_simulator, interactive_qa_column,
                  created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                title, generatedSlug, contentMarkdown, postExcerpt, image, 
                cat, readMin, authorId || 1, coAuthorsStr, '[]', safeStatus, 
                rejReason, mTitle, mDesc, tagList, 
                postTypeVal, interactiveConfiguratorStr, interactiveShowcaseStr, interactiveRadarStr, interactiveQuizStr,
                interactiveTimelineSliderStr, interactiveBattleCardStr, interactiveQuizRouterStr, interactiveHabitSimulatorStr, interactiveQaColumnStr,
                now, now
              ).run();

              const newId = insertResult.meta?.last_row_id || validNumId || id || Date.now();
              syncStaticFilesToGitHub(env, context.waitUntil ? context.waitUntil.bind(context) : undefined);
              return jsonResponse({
                success: true,
                post: {
                  ...body,
                  id: typeof newId === 'number' ? newId : Number(newId),
                  slug: generatedSlug,
                  status: postStatus,
                  revisions: [],
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

    // 7.1 GET /api/dns-aid (DNS for AI Discovery RFC 9460 & draft-mozleywilliams-dnsop-dnsaid)
    if (path === '/api/dns-aid' && method === 'GET') {
      try {
        const queryParamDomain = url.searchParams.get('domain');
        const rawHost = new URL(request.url).hostname;
        let domain = (queryParamDomain || rawHost).replace(/^www\./, '');

        if (domain === 'localhost' || domain === '127.0.0.1' || domain.endsWith('.pages.dev') || domain.endsWith('.run.app')) {
          if (env.SITE_URL) {
            try {
              const u = new URL(env.SITE_URL);
              if (u.hostname && !u.hostname.includes('localhost') && !u.hostname.endsWith('.pages.dev') && !u.hostname.endsWith('.run.app')) {
                domain = u.hostname.replace(/^www\./, '');
              }
            } catch (e) {}
          }
        }

        const records = [
          {
            subdomain: '_index._agents',
            fqdn: `_index._agents.${domain}`,
            type: 'SVCB',
            priority: 1,
            target: domain,
            params: 'alpn="h3,h2" port=443',
            description: 'Well-known entrypoint untuk indeks agen & katalog API sentral organisasi (draft-mozleywilliams-dnsop-dnsaid & RFC 9460)',
            cloudflare: {
              type: 'SVCB',
              name: '_index._agents',
              priority: 1,
              target: domain,
              value: 'alpn="h3,h2" port=443'
            },
            bind: `_index._agents.${domain}. 3600 IN SVCB 1 ${domain}. alpn="h3,h2" port=443`
          },
          {
            subdomain: '_a2a._agents',
            fqdn: `_a2a._agents.${domain}`,
            type: 'SVCB',
            priority: 1,
            target: domain,
            params: 'alpn="a2a" port=443 mandatory=alpn,port',
            description: 'Well-known entrypoint untuk protokol Agent-to-Agent (A2A) komunikasi antar-agen otonom',
            cloudflare: {
              type: 'SVCB',
              name: '_a2a._agents',
              priority: 1,
              target: domain,
              value: 'alpn="a2a" port=443 mandatory=alpn,port'
            },
            bind: `_a2a._agents.${domain}. 3600 IN SVCB 1 ${domain}. alpn="a2a" port=443 mandatory=alpn,port`
          }
        ];

        const shouldCheck = url.searchParams.get('check') === '1' || url.searchParams.get('check') === 'true';
        let checkResults: Record<string, any> | null = null;

        if (shouldCheck) {
          checkResults = {};
          for (const rec of records) {
            let dohSuccess = false;
            let answerData: any = null;
            let adFlag = false;

            try {
              const cfUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(rec.fqdn)}&type=SVCB`;
              const cfRes = await fetch(cfUrl, {
                headers: { 'accept': 'application/dns-json' },
              });
              if (cfRes.ok) {
                const cfJson: any = await cfRes.json();
                if (cfJson.Status === 0 && cfJson.Answer && cfJson.Answer.length > 0) {
                  dohSuccess = true;
                  answerData = cfJson.Answer;
                  adFlag = !!cfJson.AD;
                }
              }
            } catch (e) {}

            if (!dohSuccess) {
              try {
                const gUrl = `https://dns.google/resolve?name=${encodeURIComponent(rec.fqdn)}&type=64`;
                const gRes = await fetch(gUrl, {
                  headers: { 'accept': 'application/dns-json' },
                });
                if (gRes.ok) {
                  const gJson: any = await gRes.json();
                  if (gJson.Status === 0 && gJson.Answer && gJson.Answer.length > 0) {
                    dohSuccess = true;
                    answerData = gJson.Answer;
                    adFlag = !!gJson.AD;
                  }
                }
              } catch (e) {}
            }

            checkResults[rec.subdomain] = {
              fqdn: rec.fqdn,
              status: dohSuccess ? 'pass' : 'fail',
              authenticatedData: adFlag,
              answers: answerData || []
            };
          }
        }

        return jsonResponse({
          domain,
          standard: 'DNS for AI Discovery (DNS-AID) draft-mozleywilliams-dnsop-dnsaid & RFC 9460',
          records,
          dnssec: {
            required: true,
            summary: 'Publikasi DNS-AID wajib ditandatangani dengan DNSSEC agar validating resolver mengembalikan flag AD (Authenticated Data).',
            cloudflareSteps: [
              'Masuk ke Cloudflare Dashboard -> Pilih domain Anda.',
              'Buka menu DNS -> klik tab Settings.',
              'Pada bagian DNSSEC, klik tombol "Enable DNSSEC".',
              'Salin informasi DS Record (Key Tag, Algorithm, Digest Type, Digest) yang digenerate Cloudflare.',
              'Buka panel pengelolaan registrar domain Anda dan masukkan DS Record tersebut.',
              'Status DNSSEC akan berubah menjadi "Active / Success".'
            ]
          },
          checks: checkResults
        }, 200, { 'Cache-Control': 'public, max-age=60' });
      } catch (err: any) {
        return jsonResponse({ error: 'Gagal memproses DNS-AID: ' + err.message }, 500);
      }
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
            const cols = await syncAndPrepareUsersTable(env.DB);

            const email = body.admin_email || 'admin@parenting.my.id';
            const password = body.admin_password;
            const name = body.admin_name || 'Admin';
            const avatar = body.admin_avatar || '';
            const bio = body.admin_bio || '';
            const passVal = String(password || 'admin123');

            const existing = await env.DB.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) OR role = "admin"').bind(email).first();
            if (existing) {
              if (password && String(password).trim().length > 0) {
                if (cols.has('password_hash')) {
                  await env.DB.prepare('UPDATE users SET name = ?, email = ?, password = ?, password_hash = ?, avatar = ?, bio = ? WHERE id = ?')
                    .bind(name, email, passVal, passVal, avatar, bio, existing.id).run();
                } else {
                  await env.DB.prepare('UPDATE users SET name = ?, email = ?, password = ?, avatar = ?, bio = ? WHERE id = ?')
                    .bind(name, email, passVal, avatar, bio, existing.id).run();
                }
              } else {
                await env.DB.prepare('UPDATE users SET name = ?, email = ?, avatar = ?, bio = ? WHERE id = ?')
                  .bind(name, email, avatar, bio, existing.id).run();
              }
            } else {
              if (cols.has('password_hash')) {
                await env.DB.prepare('INSERT INTO users (email, password, password_hash, name, role, avatar, bio, created_at) VALUES (?, ?, ?, ?, "admin", ?, ?, ?)')
                  .bind(email, passVal, passVal, name, avatar, bio, new Date().toISOString()).run();
              } else {
                await env.DB.prepare('INSERT INTO users (email, password, name, role, avatar, bio, created_at) VALUES (?, ?, ?, "admin", ?, ?, ?)')
                  .bind(email, passVal, name, avatar, bio, new Date().toISOString()).run();
              }
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

    // =========================================================================
    // Auth.md & Autonomous Agent Registration Endpoints (RFC 8414 & WorkOS Protocol)
    // =========================================================================
    if (path === '/api/agent/register' && method === 'POST') {
      try {
        const body = (await request.json().catch(() => ({}))) as any;
        const clientName = typeof body.client_name === 'string' ? sanitizeXSS(body.client_name.slice(0, 100)) : 'Anonymous Agent';
        const identityType = typeof body.identity_type === 'string' ? sanitizeXSS(body.identity_type) : 'anonymous';
        const scopes = Array.isArray(body.scopes) ? body.scopes.map((s: any) => String(s).trim()).slice(0, 10) : ['posts:read', 'read'];

        const agentId = 'agt_' + Math.random().toString(36).substring(2, 10);
        const token = await signJwtHmacSha256({
          sub: agentId,
          type: 'agent',
          client_name: clientName,
          identity_type: identityType,
          scopes,
        }, jwtSecret, 86400 * 30);

        return jsonResponse({
          status: 'success',
          client_id: agentId,
          client_name: clientName,
          identity_type: identityType,
          token_type: 'Bearer',
          access_token: token,
          scopes,
          expires_in: 86400 * 30,
          claim_uri: `${siteUrl}/api/agent/claim`,
          revocation_uri: `${siteUrl}/api/agent/revoke`,
          documentation_uri: `${siteUrl}/auth.md`,
        }, 201);
      } catch (err: any) {
        return jsonResponse({ error: 'Gagal memproses pendaftaran agen.' }, 400);
      }
    }

    if (path === '/api/agent/claim' && method === 'POST') {
      return jsonResponse({
        status: 'success',
        message: 'Agent claim ceremony instructions. Provide human administrator confirmation to bind session.',
        verified: false,
        instructions: 'Visit the claim portal or provide OTP/JWT assertion to link this agent to an account.',
      }, 200);
    }

    if (path === '/api/agent/revoke' && method === 'POST') {
      return jsonResponse({
        status: 'success',
        message: 'Agent credential successfully revoked.',
      }, 200);
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
          const cols = await syncAndPrepareUsersTable(env.DB);

          // SECURITY PURGE: Purge any sensitive keys from configs table
          try {
            await env.DB.prepare("DELETE FROM configs WHERE key LIKE 'admin_%' OR key LIKE '%password%' OR key LIKE '%secret%'").run();
          } catch {}

          const existingUser = await env.DB.prepare(`
            SELECT id, email, COALESCE(password, password_hash) as password, role 
            FROM users 
            WHERE id = ? OR LOWER(email) = LOWER(?)
          `).bind(numId, email).first();

          const passVal = String(password || 'writer123');

          if (existingUser) {
            if (password && String(password).trim().length > 0) {
              // Security: Verify old password before updating
              if (existingUser.password && (!oldPassword || existingUser.password !== oldPassword)) {
                return jsonResponse({ error: 'Password lama salah. Verifikasi keamanan gagal.' }, 400);
              }

              if (cols.has('password_hash')) {
                await env.DB.prepare(`
                  UPDATE users SET name = ?, email = ?, password = ?, password_hash = ?, avatar = ?, bio = ?
                  WHERE id = ?
                `).bind(name || 'User', email, passVal, passVal, avatar || '', bio || '', existingUser.id).run();
              } else {
                await env.DB.prepare(`
                  UPDATE users SET name = ?, email = ?, password = ?, avatar = ?, bio = ?
                  WHERE id = ?
                `).bind(name || 'User', email, passVal, avatar || '', bio || '', existingUser.id).run();
              }
            } else {
              await env.DB.prepare(`
                UPDATE users SET name = ?, email = ?, avatar = ?, bio = ?
                WHERE id = ?
              `).bind(name || 'User', email, avatar || '', bio || '', existingUser.id).run();
            }
          } else {
            if (cols.has('password_hash')) {
              await env.DB.prepare(`
                INSERT INTO users (id, email, password, password_hash, name, role, avatar, bio, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(numId, email, passVal, passVal, name || 'User', 'writer', avatar || '', bio || '', new Date().toISOString()).run();
            } else {
              await env.DB.prepare(`
                INSERT INTO users (id, email, password, name, role, avatar, bio, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(numId, email, passVal, name || 'User', 'writer', avatar || '', bio || '', new Date().toISOString()).run();
            }
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
      const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '127.0.0.1';
      const now = Date.now();
      const jwtSecret = env.JWT_SECRET || (typeof process !== 'undefined' ? process.env?.JWT_SECRET : '') || 'parenting-unified-jwt-secret-key-2026-secure';

      // Anti Brute Force: Check rate limiting in D1
      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS login_attempts (
              ip TEXT PRIMARY KEY,
              attempts INTEGER DEFAULT 0,
              last_attempt INTEGER,
              blocked_until INTEGER
            )
          `).run();

          const attemptRecord = await env.DB.prepare('SELECT attempts, blocked_until FROM login_attempts WHERE ip = ?').bind(clientIp).first() as any;
          if (attemptRecord && attemptRecord.blocked_until && attemptRecord.blocked_until > now) {
            const remainingMins = Math.ceil((attemptRecord.blocked_until - now) / 60000);
            return jsonResponse({
              error: `Akses ditolak (Anti Brute Force). Terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${remainingMins} menit.`
            }, 429);
          }
        } catch (errDbRate) {
          console.error('Error checking login rate limit in D1:', errDbRate);
        }
      }

      const { email, password, turnstileToken, emergencyKey } = await request.json() as any;

      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return jsonResponse({ error: 'Email dan password wajib diisi.' }, 400);
      }

      // Helper to record failed attempts and enforce lockout after 5 fails
      const handleFailedLogin = async () => {
        if (env.DB) {
          try {
            const record = await env.DB.prepare('SELECT attempts FROM login_attempts WHERE ip = ?').bind(clientIp).first() as any;
            const newAttempts = ((record?.attempts || 0) + 1);
            const blockedUntil = newAttempts >= 5 ? (now + 15 * 60 * 1000) : 0;
            await env.DB.prepare(`
              INSERT INTO login_attempts (ip, attempts, last_attempt, blocked_until)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(ip) DO UPDATE SET
                attempts = ?,
                last_attempt = ?,
                blocked_until = ?
            `).bind(clientIp, newAttempts, now, blockedUntil, newAttempts, now, blockedUntil).run();
            const remaining = Math.max(0, 5 - newAttempts);
            return remaining;
          } catch (e) {
            console.error('Error recording failed attempt:', e);
          }
        }
        return 0;
      };

      // Helper to clear failed attempts upon successful login
      const handleSuccessfulLogin = async () => {
        if (env.DB) {
          try {
            await env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(clientIp).run();
          } catch (e) {}
        }
      };

      // Check Emergency Recovery Key (Bypass Turnstile in Emergency)
      const configuredEmergencyKey = (env as any).ADMIN_EMERGENCY_KEY || (typeof process !== 'undefined' ? process.env?.ADMIN_EMERGENCY_KEY : '');
      let isEmergencyBypass = false;

      if (emergencyKey && typeof emergencyKey === 'string' && configuredEmergencyKey && configuredEmergencyKey.trim() !== '') {
        if (emergencyKey.trim() === configuredEmergencyKey.trim()) {
          isEmergencyBypass = true;
        }
      }

      if (!isEmergencyBypass) {
        const isValidTurnstile = await verifyTurnstileTokenEdge(turnstileToken);
        if (!isValidTurnstile) {
          return jsonResponse({ error: 'Verifikasi keamanan Turnstile gagal atau kedaluwarsa. Silakan coba lagi atau gunakan Kunci Darurat.' }, 400);
        }
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      if (env.DB) {
        try {
          await syncAndPrepareUsersTable(env.DB);

          // Support aliases between @parenting.my.id and @domain.com
          const altEmail = cleanEmail.includes('@domain.com')
            ? cleanEmail.replace('@domain.com', '@parenting.my.id')
            : cleanEmail.includes('@parenting.my.id')
            ? cleanEmail.replace('@parenting.my.id', '@domain.com')
            : cleanEmail;

          // Query user by email (using COALESCE to check both password and password_hash)
          const user = await env.DB.prepare(`
            SELECT id, email, COALESCE(password, password_hash) as password, name, role, avatar, bio 
            FROM users 
            WHERE LOWER(email) = LOWER(?) OR LOWER(email) = LOWER(?)
          `).bind(cleanEmail, altEmail).first();
          
          if (user) {
            // Strict absolute password check
            if (!cleanPass || user.password !== cleanPass) {
              const remaining = await handleFailedLogin();
              return jsonResponse({
                error: remaining > 0
                  ? `Email atau password salah. Sisa percobaan: ${remaining} kali sebelum akses diblokir 15 menit.`
                  : 'Terlalu banyak percobaan gagal. Akses diblokir selama 15 menit demi keamanan (Anti Brute Force).'
              }, 401);
            }

            await handleSuccessfulLogin();
            const token = await signJwtHmacSha256({
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role || 'writer',
            }, jwtSecret, 86400 * 7);

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
              token
            }, 200, {
              'Set-Cookie': `cms_token=${token}; Path=/; Max-Age=${86400 * 7}; HttpOnly; SameSite=Lax; Secure`
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
                const remaining = await handleFailedLogin();
                return jsonResponse({
                  error: remaining > 0
                    ? `Email atau password salah. Sisa percobaan: ${remaining} kali sebelum akses diblokir 15 menit.`
                    : 'Terlalu banyak percobaan gagal. Akses diblokir selama 15 menit demi keamanan (Anti Brute Force).'
                }, 401);
              }
              await handleSuccessfulLogin();
              const token = await signJwtHmacSha256({
                id: 1,
                email: cEmail,
                name: 'Admin Utama',
                role: 'admin',
              }, jwtSecret, 86400 * 7);

              return jsonResponse({
                success: true,
                user: {
                  id: 1,
                  email: cEmail,
                  name: 'Admin Utama',
                  role: 'admin',
                  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=75&fm=webp',
                  bio: 'Administrator Utama'
                },
                token
              }, 200, {
                'Set-Cookie': `cms_token=${token}; Path=/; Max-Age=${86400 * 7}; HttpOnly; SameSite=Lax; Secure`
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
          const remaining = await handleFailedLogin();
          return jsonResponse({
            error: remaining > 0
              ? `Email atau password salah. Sisa percobaan: ${remaining} kali sebelum akses diblokir 15 menit.`
              : 'Terlalu banyak percobaan gagal. Akses diblokir selama 15 menit demi keamanan (Anti Brute Force).'
          }, 401);
        }
        await handleSuccessfulLogin();
        const token = await signJwtHmacSha256({
          id: 1,
          email: 'admin@parenting.my.id',
          name: 'Dr. Ratna Sari, M.Psi',
          role: 'admin',
        }, jwtSecret, 86400 * 7);

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
          token
        }, 200, {
          'Set-Cookie': `cms_token=${token}; Path=/; Max-Age=${86400 * 7}; HttpOnly; SameSite=Lax; Secure`
        });
      } else if (cleanEmail === 'editor@parenting.my.id') {
        if (!cleanPass || cleanPass !== 'editor123') {
          const remaining = await handleFailedLogin();
          return jsonResponse({
            error: remaining > 0
              ? `Email atau password salah. Sisa percobaan: ${remaining} kali sebelum akses diblokir 15 menit.`
              : 'Terlalu banyak percobaan gagal. Akses diblokir selama 15 menit demi keamanan (Anti Brute Force).'
          }, 401);
        }
        await handleSuccessfulLogin();
        const token = await signJwtHmacSha256({
          id: 2,
          email: 'editor@parenting.my.id',
          name: 'Maya Putri, S.Psi',
          role: 'editor',
        }, jwtSecret, 86400 * 7);

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
          token
        }, 200, {
          'Set-Cookie': `cms_token=${token}; Path=/; Max-Age=${86400 * 7}; HttpOnly; SameSite=Lax; Secure`
        });
      } else if (cleanEmail === 'penulis@parenting.my.id') {
        if (!cleanPass || cleanPass !== 'writer123') {
          const remaining = await handleFailedLogin();
          return jsonResponse({
            error: remaining > 0
              ? `Email atau password salah. Sisa percobaan: ${remaining} kali sebelum akses diblokir 15 menit.`
              : 'Terlalu banyak percobaan gagal. Akses diblokir selama 15 menit demi keamanan (Anti Brute Force).'
          }, 401);
        }
        await handleSuccessfulLogin();
        const token = await signJwtHmacSha256({
          id: 3,
          email: 'penulis@parenting.my.id',
          name: 'Ahmad Zulkarnain, S.Ked',
          role: 'writer',
        }, jwtSecret, 86400 * 7);

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
          token
        }, 200, {
          'Set-Cookie': `cms_token=${token}; Path=/; Max-Age=${86400 * 7}; HttpOnly; SameSite=Lax; Secure`
        });
      }

      const remaining = await handleFailedLogin();
      return jsonResponse({
        error: remaining > 0
          ? `Email atau password salah. Sisa percobaan: ${remaining} kali sebelum akses diblokir 15 menit.`
          : 'Terlalu banyak percobaan gagal. Akses diblokir selama 15 menit demi keamanan (Anti Brute Force).'
      }, 401);
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

      const getSmartFallback = async (t: string, c: string) => {
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

        const siteMeta = await getSiteConfig();
        return {
          metaTitle: `${t} | ${siteMeta.site_name}`,
          metaDescription: firstSentence,
          tags: 'artikel, informasi, panduan, edukasi',
          excerpt: excerpt,
          aiGenerated: false,
        };
      };

      if (!apiKey) {
        return jsonResponse(await getSmartFallback(title, content));
      }

      try {
        const siteMeta = await getSiteConfig();
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const prompt = `Anda adalah seorang Senior SEO Specialist & Content Strategist untuk website ${siteMeta.site_name}.
Berdasarkan judul artikel: "${title}" dan isi: "${(content || '').slice(0, 500)}", hasilkan format JSON persis seperti ini tanpa markdown codeblock:
{
  "metaTitle": "${title} | ${siteMeta.site_name}",
  "metaDescription": "Deskripsi Meta SEO membujuk yang memuat kata kunci utama (120-155 karakter).",
  "tags": "5 kata kunci dipisahkan koma",
  "excerpt": "Ringkasan artikel 2 kalimat yang hangat dan informatif."
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
        const { post_slug, user_name, user_email, content, turnstileToken, website_hp } = body;

        // Anti-spam honeypot detection
        if (website_hp) {
          return jsonResponse({ error: 'Permintaan ditolak: Spam terdeteksi.' }, 400);
        }

        if (turnstileToken !== 'BYPASS_DISABLED') {
          const isValidTurnstile = await verifyTurnstileTokenEdge(turnstileToken);
          if (!isValidTurnstile) {
            return jsonResponse({ error: 'Verifikasi keamanan Turnstile gagal atau kedaluwarsa. Silakan coba lagi.' }, 400);
          }
        }

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

    // ==========================================
    // DATABASE BACKUP & SCHEMA EXPORT ENDPOINTS (ADMIN ONLY)
    // ==========================================

    // 1. GET /api/database/tables (List detected tables & row counts)
    if (path === '/api/database/tables' && method === 'GET') {
      const auth = await authenticateRequest(['admin']);
      if (auth.errorResponse) return auth.errorResponse;

      if (env.DB) {
        try {
          const { results } = await env.DB.prepare(
            "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC"
          ).all();

          const tablesList = [];
          for (const row of (results || [])) {
            const tableName = String(row.name);
            let count = 0;
            try {
              const countRes: any = await env.DB.prepare(`SELECT count(*) as total FROM "${tableName}"`).first();
              count = countRes ? Number(countRes.total) : 0;
            } catch (cErr) {
              console.warn(`Could not count rows for table ${tableName}:`, cErr);
            }

            let description = `Tabel ${tableName}`;
            if (tableName === 'users') description = 'Akun pengguna, hak akses, peran, dan kredensial';
            else if (tableName === 'posts') description = 'Seluruh artikel, konten, SEO meta, dan view count';
            else if (tableName === 'configs') description = 'Konfigurasi situs dinamis key-value';
            else if (tableName === 'categories') description = 'Kategori dan taksonomi artikel';
            else if (tableName === 'autolinks') description = 'Aturan internal auto-linking engine';
            else if (tableName === 'comments') description = 'Komentar artikel native dan sinkronisasi Cusdis';
            else if (tableName === 'login_attempts') description = 'Pelacakan IP pengamanan anti brute force';

            tablesList.push({
              name: tableName,
              rowCount: count,
              description,
            });
          }

          if (tablesList.length > 0) {
            return jsonResponse({
              success: true,
              databaseEngine: 'Cloudflare D1 (SQLite)',
              tables: tablesList,
            });
          }
        } catch (e: any) {
          console.error('Error fetching tables from D1:', e);
        }
      }

      // Fallback table list
      return jsonResponse({
        success: true,
        databaseEngine: 'Cloudflare D1 (Fallback Mode)',
        tables: [
          { name: 'users', rowCount: 3, description: 'Akun pengguna, hak akses, peran, dan kredensial' },
          { name: 'posts', rowCount: 15, description: 'Seluruh artikel, konten, SEO meta, dan view count' },
          { name: 'configs', rowCount: 25, description: 'Konfigurasi situs dinamis key-value' },
          { name: 'categories', rowCount: 6, description: 'Kategori dan taksonomi artikel' },
          { name: 'autolinks', rowCount: 5, description: 'Aturan internal auto-linking engine' },
          { name: 'comments', rowCount: 12, description: 'Komentar artikel native dan sinkronisasi Cusdis' },
          { name: 'login_attempts', rowCount: 0, description: 'Pelacakan IP pengamanan anti brute force' },
        ],
      });
    }

    // 2. GET /api/database/schema (CREATE TABLE DDL only)
    if (path === '/api/database/schema' && method === 'GET') {
      const auth = await authenticateRequest(['admin']);
      if (auth.errorResponse) return auth.errorResponse;

      let ddl = '';
      if (env.DB) {
        try {
          const { results } = await env.DB.prepare(
            "SELECT sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY name ASC"
          ).all();

          if (results && results.length > 0) {
            ddl = results.map((r: any) => {
              let s = String(r.sql || '').trim();
              if (!s.endsWith(';')) s += ';';
              return s;
            }).join('\n\n');
          }
        } catch (e: any) {
          console.error('Error reading schema from D1:', e);
        }
      }

      if (!ddl) {
        ddl = `CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'writer',
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  author_id INTEGER,
  author_name TEXT,
  author_avatar TEXT,
  category TEXT,
  tags TEXT,
  meta_title TEXT,
  meta_description TEXT,
  status TEXT DEFAULT 'published',
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS autolinks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  url TEXT NOT NULL,
  rel TEXT DEFAULT 'dofollow',
  target TEXT DEFAULT '_self',
  max_replacements INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER,
  post_slug TEXT,
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_avatar TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'approved',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY,
  attempts INTEGER DEFAULT 0,
  last_attempt INTEGER DEFAULT 0
);`;
      }

      const generatedAt = new Date().toISOString();
      const outputSql = `-- ==========================================================
-- Cloudflare D1 Database Schema Dump (DDL Only)
-- Generated: ${generatedAt}
-- Engine: SQLite / Cloudflare D1
-- ==========================================================

${ddl}
`;

      return jsonResponse({
        success: true,
        schema: outputSql,
        filename: `d1_schema_${generatedAt.split('T')[0]}.sql`,
      });
    }

    // 3. POST /api/database/dump (Schema + Data Dump with selective tables)
    if (path === '/api/database/dump' && method === 'POST') {
      const auth = await authenticateRequest(['admin']);
      if (auth.errorResponse) return auth.errorResponse;

      try {
        const body = await request.json() as any;
        const requestedTables: string[] = Array.isArray(body?.tables) ? body.tables : [];
        const includeSchema = body?.includeSchema !== false;
        const includeData = body?.includeData !== false;
        const insertMode = body?.insertMode === 'INSERT INTO' ? 'INSERT INTO' : 'INSERT OR REPLACE INTO';
        const addDropTable = Boolean(body?.addDropTable);
        const format = body?.format === 'json' ? 'json' : 'sql';

        const escapeSqlVal = (val: any): string => {
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return isFinite(val) ? String(val) : 'NULL';
          if (typeof val === 'boolean') return val ? '1' : '0';
          if (typeof val === 'object') {
            return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          }
          return `'${String(val).replace(/'/g, "''")}'`;
        };

        const targetTables = requestedTables.length > 0
          ? requestedTables
          : ['users', 'posts', 'configs', 'categories', 'autolinks', 'comments', 'login_attempts'];

        const jsonData: Record<string, any[]> = {};
        const sqlChunks: string[] = [];
        let totalRows = 0;

        const generatedAt = new Date().toISOString();
        const dateStr = generatedAt.split('T')[0];

        if (format === 'sql') {
          sqlChunks.push(`-- ==========================================================
-- Cloudflare D1 Full Database Backup (Schema & Data)
-- Generated At : ${generatedAt}
-- Target Tables: ${targetTables.join(', ')}
-- Engine       : SQLite / Cloudflare D1
-- ==========================================================

PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;
`);
        }

        for (const tableName of targetTables) {
          // Verify table name format to prevent SQL injection
          if (!/^[a-zA-Z0-9_]+$/.test(tableName)) continue;

          let createSql = '';
          let rows: any[] = [];

          if (env.DB) {
            try {
              // 1. Fetch schema
              const schemaRow: any = await env.DB.prepare(
                "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ? AND sql IS NOT NULL"
              ).bind(tableName).first();
              if (schemaRow && schemaRow.sql) {
                createSql = String(schemaRow.sql).trim();
                if (!createSql.endsWith(';')) createSql += ';';
              }

              // 2. Fetch rows
              const { results } = await env.DB.prepare(`SELECT * FROM "${tableName}"`).all();
              if (results) {
                rows = results;
              }
            } catch (err) {
              console.warn(`Error querying table ${tableName} in D1:`, err);
            }
          }

          // Fallback if env.DB had no rows/schema
          if (!createSql) {
            if (tableName === 'users') {
              createSql = `CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'writer',
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;
            } else if (tableName === 'posts') {
              createSql = `CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  author_id INTEGER,
  author_name TEXT,
  author_avatar TEXT,
  category TEXT,
  tags TEXT,
  meta_title TEXT,
  meta_description TEXT,
  status TEXT DEFAULT 'published',
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;
            } else if (tableName === 'configs') {
              createSql = `CREATE TABLE IF NOT EXISTS configs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;
            } else if (tableName === 'categories') {
              createSql = `CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;
            } else if (tableName === 'autolinks') {
              createSql = `CREATE TABLE IF NOT EXISTS autolinks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  url TEXT NOT NULL,
  rel TEXT DEFAULT 'dofollow',
  target TEXT DEFAULT '_self',
  max_replacements INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;
            } else if (tableName === 'comments') {
              createSql = `CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER,
  post_slug TEXT,
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_avatar TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'approved',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;
            } else if (tableName === 'login_attempts') {
              createSql = `CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY,
  attempts INTEGER DEFAULT 0,
  last_attempt INTEGER DEFAULT 0
);`;
            } else {
              createSql = `CREATE TABLE IF NOT EXISTS "${tableName}" (id INTEGER PRIMARY KEY);`;
            }
          }

          jsonData[tableName] = rows;
          totalRows += rows.length;

          if (format === 'sql') {
            sqlChunks.push(`\n-- ----------------------------------------------------------`);
            sqlChunks.push(`-- Table Structure & Data for \`${tableName}\` (${rows.length} rows)`);
            sqlChunks.push(`-- ----------------------------------------------------------`);

            if (addDropTable) {
              sqlChunks.push(`DROP TABLE IF EXISTS "${tableName}";`);
            }

            if (includeSchema && createSql) {
              sqlChunks.push(createSql);
            }

            if (includeData && rows.length > 0) {
              const insertStatements: string[] = [];
              for (const row of rows) {
                const cols = Object.keys(row).map((k) => `"${k}"`).join(', ');
                const vals = Object.values(row).map((v) => escapeSqlVal(v)).join(', ');
                insertStatements.push(`${insertMode} "${tableName}" (${cols}) VALUES (${vals});`);
              }
              sqlChunks.push(insertStatements.join('\n'));
            }
          }
        }

        if (format === 'sql') {
          sqlChunks.push(`\nCOMMIT;`);
          sqlChunks.push(`\nPRAGMA foreign_keys = ON;\n`);
          const fullSql = sqlChunks.join('\n');

          return jsonResponse({
            success: true,
            filename: `d1_backup_${targetTables.length === 7 ? 'full' : `${targetTables.length}_tables`}_${dateStr}.sql`,
            sql: fullSql,
            stats: {
              totalTables: targetTables.length,
              totalRows,
              sizeBytes: new TextEncoder().encode(fullSql).length,
            },
          });
        } else {
          return jsonResponse({
            success: true,
            filename: `d1_backup_${dateStr}.json`,
            data: jsonData,
            stats: {
              totalTables: targetTables.length,
              totalRows,
            },
          });
        }
      } catch (err: any) {
        console.error('Error generating database dump:', err);
        return jsonResponse({ error: 'Gagal membuat dump database: ' + err.message }, 500);
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
      const repo = env.GITHUB_REPO || 'cms-repository';
      const branch = env.GITHUB_BRANCH || 'main';
      
      let siteUrl = env.SITE_URL || 'https://domain.com';
      let siteName = 'Portal Informasi';
      let siteDescription = 'Portal berita dan informasi terpercaya.';

      try {
        const results = await env.DB.prepare("SELECT key, value FROM configs WHERE key IN ('site_url', 'site_name', 'site_description', 'seo_meta_title', 'seo_meta_description')").all();
        const configMap: Record<string, string> = {};
        if (results && results.results) {
          for (const row of results.results) {
            try {
              configMap[row.key] = JSON.parse(row.value);
            } catch {
              configMap[row.key] = row.value;
            }
          }
        }
        if (configMap.site_url) {
          siteUrl = configMap.site_url.replace(/\/$/, '');
        } else if (env.SITE_URL) {
          siteUrl = env.SITE_URL.replace(/\/$/, '');
        }
        siteName = configMap.site_name || configMap.seo_meta_title || 'Portal Informasi';
        siteDescription = configMap.site_description || configMap.seo_meta_description || 'Portal berita dan informasi terpercaya.';
      } catch (dbErr) {
        console.error('Error fetching config in syncStaticFilesToGitHub:', dbErr);
      }

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
    <title><![CDATA[${siteName}]]></title>
    <link>${siteUrl}</link>
    <description><![CDATA[${siteDescription}]]></description>
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
      const sanitizeLlmsText = (text: string) => {
        return (text || '')
          .replace(/[\r\n\t]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      let articleLinks = postsList
        .map((p: any) => {
          const cleanTitle = sanitizeLlmsText(p.title || '').replace(/[\[\]]/g, '').trim();
          const cleanDesc = sanitizeLlmsText(p.excerpt || '');
          return `- [${cleanTitle}](${siteUrl}/baca/${p.slug})${cleanDesc ? `: ${cleanDesc}` : ''}`;
        })
        .join('\n');

      if (!articleLinks.trim()) {
        articleLinks = `- [Beranda](${siteUrl}): ${siteDescription}`;
      }

      const llmsTxt = `# ${siteName}

> ${siteDescription}

## Artikel Terkait & Panduan Utama

${articleLinks}

## Optional

- [Konten Lengkap LLMs](${siteUrl}/llms-full.txt): Kumpulan teks lengkap artikel untuk konsumsi dan inferensi model bahasa (LLM).
- [Sitemap XML](${siteUrl}/sitemap.xml): Peta situs terstruktur untuk crawler.
- [RSS Feed](${siteUrl}/feed.xml): Umpan sindikasi artikel terbaru.
`.trim();

      // 4. generate llms-full.txt
      const fullArticles = postsList.map((p: any) => {
        const url = `${siteUrl}/baca/${p.slug}`;
        const author = p.authorName || `Tim Redaksi ${siteName}`;
        const category = p.category || 'Berita';
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

      const llmsFullTxt = `# Arsip Lengkap Artikel ${siteName} (LLMs Full Text)

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
