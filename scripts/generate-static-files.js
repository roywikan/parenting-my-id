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

/**
 * Generate llms.txt string
 */
export function generateLlmsTxt(posts) {
  const publishedPosts = (posts || []).filter((p) => p.status === 'published');

  const articleLinks = publishedPosts
    .map((p) => `* [${p.title}](${SITE_URL}/baca/${p.slug}): ${p.excerpt || ''}`)
    .join('\n');

  return `# Parenting.my.id

> Portal berita dan informasi parenting terpercaya di Indonesia. Menyajikan edukasi pola asuh anak, kesehatan, serta nutrisi keluarga.

## Artikel Terkait & Panduan Utama

${articleLinks}
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
      return `<url><loc>${SITE_URL}/baca/${p.slug}</loc><lastmod>${lastMod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>${urls}</urlset>`;

  return xml.trim();
}

/**
 * Main generator function that writes files to public/ and dist/
 */
export function generateStaticFiles(customPosts) {
  const posts = customPosts || loadPostsFromInitialData();

  const llmsContent = generateLlmsTxt(posts);
  const sitemapContent = generateSitemapXml(posts);

  // Validate sitemap index 0 rule
  if (sitemapContent.indexOf('<?xml') !== 0) {
    throw new Error('Sitemap XML declaration must start at index 0 without leading whitespace or newlines!');
  }

  const publicDir = path.join(rootDir, 'public');
  const distDir = path.join(rootDir, 'dist');

  // Ensure directories exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write to public/
  const publicLlmsPath = path.join(publicDir, 'llms.txt');
  const publicSitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(publicLlmsPath, llmsContent, 'utf-8');
  fs.writeFileSync(publicSitemapPath, sitemapContent, 'utf-8');
  console.log(`[Static Generator] Updated ${publicLlmsPath} and ${publicSitemapPath}`);

  // Write to dist/ if dist directory exists or generate it
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  const distLlmsPath = path.join(distDir, 'llms.txt');
  const distSitemapPath = path.join(distDir, 'sitemap.xml');
  fs.writeFileSync(distLlmsPath, llmsContent, 'utf-8');
  fs.writeFileSync(distSitemapPath, sitemapContent, 'utf-8');
  console.log(`[Static Generator] Updated ${distLlmsPath} and ${distSitemapPath}`);

  return { llmsContent, sitemapContent };
}

// Execute generator if script is executed directly via `node scripts/generate-static-files.js`
if (process.argv[1] && (process.argv[1].endsWith('generate-static-files.js') || process.argv[1].includes('generate-static-files'))) {
  try {
    generateStaticFiles();
    console.log('[Static Generator] Build static files generated successfully.');
  } catch (err) {
    console.error('[Static Generator] Failed to generate static files:', err);
    process.exit(1);
  }
}
