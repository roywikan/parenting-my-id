import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '';
const __dirname = typeof import.meta !== 'undefined' && import.meta.url && __filename ? path.dirname(__filename) : process.cwd();
const rootDir = path.resolve(__dirname, '..');

const SITE_URL = 'https://parenting.my.id';

/**
 * Load initial posts from src/data/initialData.ts if no posts array is provided
 */
export function loadPostsFromInitialData() {
  try {
    const initialDataPath = path.join(rootDir, 'src', 'data', 'initialData.ts');
    if (fs.existsSync(initialDataPath)) {
      const content = fs.readFileSync(initialDataPath, 'utf-8');
      const cleanContent = content
        .replace(/^import\s+.*?;/gm, '')
        .replace(/:\s*User\[\]/g, '')
        .replace(/:\s*AutoLink\[\]/g, '')
        .replace(/:\s*Post\[\]/g, '')
        .replace(/export\s+const/g, 'const');

      const fn = new Function(`${cleanContent}; return INITIAL_POSTS;`);
      const posts = fn();
      if (Array.isArray(posts) && posts.length > 0) {
        return posts;
      }
    }
  } catch (err) {
    console.error('Error loading posts from initialData.ts:', err);
  }

  // Fallback posts if reading fails
  return [
    {
      title: 'Panduan Lengkap Pola Asuh Demokratis untuk Mendidik Anak Tangguh Masa Kini',
      slug: 'panduan-lengkap-pola-asuh-demokratis-anak-masa-kini',
      excerpt: 'Pola asuh demokratis menggabungkan kasih sayang, aturan yang konsisten, dan komunikasi terbuka. Simak strategi praktis penerapannya di rumah.',
      status: 'published',
      updatedAt: '2026-08-24T00:00:00.000Z',
    },
    {
      title: '5 Aktivitas Sensory Play Seru untuk Melatih Motorik Halus Balita di Rumah',
      slug: '5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita',
      excerpt: 'Temukan 5 ide permainan sensory play mudah dan hemat bahan untuk mengasah indera serta ketangkasan motorik balita di rumah.',
      status: 'published',
      updatedAt: '2026-08-25T00:00:00.000Z',
    },
    {
      title: 'Mengenal Bahaya Stunting dan Cara Pencegahannya Sejak 1000 Hari Pertama Kehidupan',
      slug: 'mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk',
      excerpt: 'Stunting berpengaruh besar pada kecerdasan anak. Pelajari langkah pencegahan stunting melalui pemberian ASI eksklusif dan MPASI tinggi protein.',
      status: 'published',
      updatedAt: '2026-08-26T00:00:00.000Z',
    },
  ];
}

export function escapeXml(unsafe) {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function escapeCdata(text) {
  if (text == null) return '';
  return String(text).replace(/\]\]>/g, ']]]]><![CDATA[>');
}

/**
 * Generate feed.xml (RSS 2.0) string
 * CRITICAL: Tag <?xml version="1.0" encoding="UTF-8"?> MUST be at index 0 (character 0).
 */
export function generateFeedXml(posts) {
  const publishedPosts = (posts || []).filter((p) => p.status === 'published');

  const items = publishedPosts
    .map((p) => {
      const pubDate = p.createdAt ? new Date(p.createdAt).toUTCString() : (p.updatedAt ? new Date(p.updatedAt).toUTCString() : new Date().toUTCString());
      const link = escapeXml(`${SITE_URL}/baca/${encodeURIComponent(p.slug)}`);
      const titleClean = escapeXml(p.title || '');
      const descClean = escapeXml(p.excerpt || '');
      return `    <item>
      <title>${titleClean}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description>${descClean}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml('Parenting.my.id - Edukasi & Pola Asuh Anak Modern')}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml('Portal artikel parenting, gizi anak, stimulasi balita, dan pencegahan stunting di Indonesia.')}</description>
    <language>id-id</language>
${items}
  </channel>
</rss>`;

  return rss.trim();
}

/**
 * Parse items directly from a feed.xml (RSS 2.0) string
 */
export function parseFeedXmlItems(feedXmlContent) {
  if (!feedXmlContent || typeof feedXmlContent !== 'string') return [];
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(feedXmlContent)) !== null) {
    const itemBlock = match[1];

    // Extract title (handles both CDATA and plain text)
    const titleMatch = itemBlock.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract link
    const linkMatch = itemBlock.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const link = linkMatch ? linkMatch[1].trim() : '';

    // Extract description
    const descMatch = itemBlock.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const description = descMatch ? descMatch[1].trim() : '';

    if (title && link) {
      items.push({ title, link, description });
    }
  }
  return items;
}

/**
 * Sanitize text to remove newlines, carriage returns, tabs, and duplicate spaces.
 * This guarantees single-line list entries for the llms.txt parser.
 */
function sanitizeLlmsText(text) {
  return (text || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate llms.txt string taken directly from feed.xml items (Summary index format)
 */
export function generateLlmsTxt(posts, feedXmlContent) {
  let items = [];

  if (feedXmlContent) {
    items = parseFeedXmlItems(feedXmlContent);
  }

  // If no items found from feedXmlContent, fallback to posts directly
  if (items.length === 0 && posts) {
    const publishedPosts = (posts || []).filter((p) => p.status === 'published');
    items = publishedPosts.map((p) => ({
      title: p.title,
      link: `${SITE_URL}/baca/${p.slug}`,
      description: p.excerpt || '',
    }));
  }

  let articleLinks = items
    .map((item) => {
      const cleanTitle = sanitizeLlmsText(item.title || '').replace(/[\[\]]/g, '').trim();
      const cleanDesc = sanitizeLlmsText(item.description || '');
      return `- [${cleanTitle}](${item.link})${cleanDesc ? `: ${cleanDesc}` : ''}`;
    })
    .join('\n');

  // Fallback item to ensure H2 section is never empty
  if (!articleLinks.trim()) {
    articleLinks = `- [Beranda](${SITE_URL}): Portal berita dan informasi parenting terpercaya di Indonesia. Menyajikan edukasi pola asuh anak, kesehatan, serta nutrisi keluarga.`;
  }

  return `# Parenting.my.id

> Portal berita dan informasi parenting terpercaya di Indonesia. Menyajikan edukasi pola asuh anak, kesehatan, serta nutrisi keluarga.

## Artikel Terkait & Panduan Utama

${articleLinks}

## Optional

- [Konten Lengkap LLMs](${SITE_URL}/llms-full.txt): Kumpulan teks lengkap artikel untuk konsumsi dan inferensi model bahasa (LLM).
- [Sitemap XML](${SITE_URL}/sitemap.xml): Peta situs terstruktur untuk crawler.
- [RSS Feed](${SITE_URL}/feed.xml): Umpan sindikasi artikel terbaru.
`.trim();
}

/**
 * Generate llms-full.txt string containing full markdown content of published posts
 */
export function generateLlmsFullTxt(posts) {
  const publishedPosts = (posts || []).filter((p) => p.status === 'published');

  const fullArticles = publishedPosts.map((p) => {
    const url = `${SITE_URL}/baca/${p.slug}`;
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

  return `# Arsip Lengkap Artikel Parenting.my.id (LLMs Full Text)

Dokumen ini memuat kumpulan artikel lengkap dalam format Markdown untuk Large Language Models (LLMs).

${fullArticles}
`.trim();
}

/**
 * Generate sitemap.xml string
 * CRITICAL: Tag <?xml version="1.0" encoding="UTF-8"?> MUST be at index 0 (character 0).
 */
export function generateSitemapXml(posts) {
  const publishedPosts = (posts || []).filter((p) => p.status === 'published');

  const urls = publishedPosts
    .map((p) => {
      const lastMod = p.updatedAt ? p.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0];
      const safeLoc = escapeXml(`${SITE_URL}/baca/${encodeURIComponent(p.slug)}`);
      return `<url><loc>${safeLoc}</loc><lastmod>${lastMod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeXml(SITE_URL)}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>${urls}</urlset>`;

  return xml.trim();
}

/**
 * Main generator function that writes files to public/ and dist/
 */
export function generateStaticFiles(customPosts) {
  const posts = customPosts || loadPostsFromInitialData();

  // 1. Generate feed.xml first
  const feedContent = generateFeedXml(posts);

  // 2. Generate llms.txt strictly derived from feed.xml items & llms-full.txt
  const llmsContent = generateLlmsTxt(posts, feedContent);
  const llmsFullContent = generateLlmsFullTxt(posts);

  // 3. Generate sitemap.xml
  const sitemapContent = generateSitemapXml(posts);

  // Validate XML index 0 rules
  if (sitemapContent.indexOf('<?xml') !== 0) {
    throw new Error('Sitemap XML declaration must start at index 0 without leading whitespace or newlines!');
  }
  if (feedContent.indexOf('<?xml') !== 0) {
    throw new Error('Feed XML declaration must start at index 0 without leading whitespace or newlines!');
  }

  const publicDir = path.join(rootDir, 'public');
  const distDir = path.join(rootDir, 'dist');

  // Ensure directories exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write to public/
  const publicFeedPath = path.join(publicDir, 'feed.xml');
  const publicLlmsPath = path.join(publicDir, 'llms.txt');
  const publicLlmsFullPath = path.join(publicDir, 'llms-full.txt');
  const publicSitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(publicFeedPath, feedContent, 'utf-8');
  fs.writeFileSync(publicLlmsPath, llmsContent, 'utf-8');
  fs.writeFileSync(publicLlmsFullPath, llmsFullContent, 'utf-8');
  fs.writeFileSync(publicSitemapPath, sitemapContent, 'utf-8');
  console.log(`[Static Generator] Updated ${publicFeedPath}, ${publicLlmsPath}, ${publicLlmsFullPath}, and ${publicSitemapPath}`);

  // Write to dist/ if dist directory exists or generate it
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  const distFeedPath = path.join(distDir, 'feed.xml');
  const distLlmsPath = path.join(distDir, 'llms.txt');
  const distLlmsFullPath = path.join(distDir, 'llms-full.txt');
  const distSitemapPath = path.join(distDir, 'sitemap.xml');
  fs.writeFileSync(distFeedPath, feedContent, 'utf-8');
  fs.writeFileSync(distLlmsPath, llmsContent, 'utf-8');
  fs.writeFileSync(distLlmsFullPath, llmsFullContent, 'utf-8');
  fs.writeFileSync(distSitemapPath, sitemapContent, 'utf-8');
  console.log(`[Static Generator] Updated ${distFeedPath}, ${distLlmsPath}, ${distLlmsFullPath}, and ${distSitemapPath}`);

  return { feedContent, llmsContent, llmsFullContent, sitemapContent };
}

/**
 * Optimize dist/index.html post-build for non-blocking CSS preloading
 */
export function postBuildOptimizeDistHtml() {
  const distHtmlPath = path.join(rootDir, 'dist', 'index.html');
  if (!fs.existsSync(distHtmlPath)) {
    console.log('[Post-Build Optimizer] dist/index.html not found, skipping.');
    return;
  }

  let html = fs.readFileSync(distHtmlPath, 'utf-8');
  const originalHtml = html;

  // Convert render-blocking <link rel="stylesheet" ... href="/assets/index-....css"> to preloaded CSS
  html = html.replace(
    /<link rel="stylesheet"([^>]*?)href="(\/assets\/[^"]+\.css)"([^>]*?)>/gi,
    '<link rel="preload" href="$2" as="style" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="$2"></noscript>'
  );

  if (html !== originalHtml) {
    fs.writeFileSync(distHtmlPath, html, 'utf-8');
    console.log('[Post-Build Optimizer] Successfully updated dist/index.html for non-blocking CSS rendering.');
  }
}

// Execute generator if script is executed directly via `node scripts/generate-static-files.js`
if (process.argv[1] && (process.argv[1].endsWith('generate-static-files.js') || process.argv[1].includes('generate-static-files'))) {
  try {
    generateStaticFiles();
    if (process.argv.includes('postbuild')) {
      postBuildOptimizeDistHtml();
    }
    console.log('[Static Generator] Build static files generated successfully.');
  } catch (err) {
    console.error('[Static Generator] Failed to generate static files:', err);
    process.exit(1);
  }
}
