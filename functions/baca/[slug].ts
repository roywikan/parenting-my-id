import { marked } from 'marked';

function optimizeUnsplashUrl(
  url?: string | null,
  targetWidth = 700,
  quality = 75,
  format = 'webp',
  targetHeight?: number
): string {
  if (!url) return '';
  if (!url.includes('unsplash.com')) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('w', targetWidth.toString());
    parsed.searchParams.set('q', quality.toString());
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', 'crop');
    parsed.searchParams.set('fm', format);
    if (targetHeight) {
      parsed.searchParams.set('h', targetHeight.toString());
    } else {
      parsed.searchParams.delete('h');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function getUnsplashSrcSet(
  url?: string | null,
  widths = [400, 700, 1200],
  quality = 75,
  format = 'webp'
): string {
  if (!url || !url.includes('unsplash.com')) return '';
  return widths
    .map((w) => `${optimizeUnsplashUrl(url, w, quality, format)} ${w}w`)
    .join(', ');
}

interface Env {
  DB?: any;
  ASSETS: {
    fetch: (request: Request | string) => Promise<Response>;
  };
  SITE_URL?: string;
}

interface Post {
  id: number;
  title: string;
  slug: string;
  contentMarkdown: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  readTimeMinutes: number;
  authorId: number;
  authorName?: string;
  authorAvatar?: string;
  authorRole?: string;
  status: string;
  metaTitle?: string;
  metaDescription?: string;
  tags: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface AutoLink {
  id: number;
  keyword: string;
  targetUrl: string;
  description?: string;
  clickCount: number;
}

const INITIAL_AUTOLINKS: AutoLink[] = [
  { id: 1, keyword: 'pola asuh', targetUrl: '/baca/panduan-lengkap-pola-asuh-demokratis-anak-masa-kini', description: 'Panduan utama strategi pola asuh positif.', clickCount: 42 },
  { id: 2, keyword: 'balita', targetUrl: '/baca/5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita', description: 'Edukasi dan rekomendasi aktivitas balita.', clickCount: 29 },
  { id: 3, keyword: 'stunting', targetUrl: '/baca/mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk', description: 'Pencegahan stunting dan nutrisi emas anak.', clickCount: 61 },
  { id: 4, keyword: 'asi eksklusif', targetUrl: '/baca/mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk', description: 'Pentingnya gizi dan ASI eksklusif.', clickCount: 18 },
  { id: 5, keyword: 'sensory play', targetUrl: '/baca/5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita', description: 'Aktivitas stimulasi sensori anak usia dini.', clickCount: 35 },
  { id: 6, keyword: 'gizi anak', targetUrl: '/baca/mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk', description: 'Nutrisi seimbang untuk tumbuh kembang optimal.', clickCount: 50 },
];

const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    title: 'Panduan Lengkap Pola Asuh Demokratis untuk Mendidik Anak Tangguh Masa Kini',
    slug: 'panduan-lengkap-pola-asuh-demokratis-anak-masa-kini',
    contentMarkdown: `## Mengapa Pola Asuh Demokratis Sangat Penting?

Memilih **pola asuh** yang tepat merupakan salah satu keputusan terbesar dalam perjalanan menjadi orang tua. Di era digital saat ini, pendekatan yang otoriter sering kali memicu resistensi pada anak, sementara pola asuh permisif bisa membuat anak kehilangan kedisiplinan.

Pola asuh demokratis (*authoritative parenting*) hadir sebagai jalan tengah yang ideal. Metode ini mengombinasikan kehangatan emosional, komunikasi dua arah, serta batasan aturan yang jelas.

---

### Ciri-Ciri Utama Pola Asuh Demokratis:
1. **Mendengarkan Pendapat Anak:** Orang tua bersedia mendengarkan keluh kesah dan sudut pandang si kecil tanpa langsung menghakimi.
2. **Aturan yang Jelas dan Beralasan:** Ketika membuat aturan, orang tua menjelaskan *mengapa* aturan tersebut penting.
3. **Pemberian Apresiasi & Konsekuensi Logis:** Menghargai usaha anak serta menerapkan konsekuensi yang mendidik, bukan hukuman fisik.

---

## Manfaat Utama bagi Tumbuh Kembang Anak

Penelitian psikologi anak menunjukkan bahwa anak yang dibesarkan dengan **pola asuh** demokratis cenderung:
- Memiliki tingkat kecerdasan emosional (EQ) dan percaya diri yang tinggi.
- Lebih mandiri dalam memecahkan masalah sehari-hari.
- Terhindar dari perilaku terisolasi atau kecemasan berlebih di sekolah.

Untuk kelompok usia **balita**, penerapan komunikasi terbuka sangat efektif jika dipadukan dengan aktivitas permainan mendidik seperti **sensory play**. Hal ini membantu perkembangan kecerdasan otak anak secara optimal.

---

> *"Anak-anak tidak membutuhkan orang tua yang sempurna, melainkan orang tua yang hadir, mau mendengarkan, dan konsisten memandu langkah mereka."* — **Dr. Ratna Sari**

---

## Langkah Praktis Memulai Hari Ini
- **Jadwalkan Waktu Bicara 15 Menit:** Luangkan waktu khusus tanpa *gadget* untuk mengobrol dengan anak sebelum tidur.
- **Libatkan dalam Keputusan Kecil:** Biarkan si kecil memilih baju atau menu bekal sekolahnya sendiri.
- **Validasi Emosi:** Saat anak menangis atau marah, katakan *"Ibu tahu kamu kecewa, mari kita tenang dulu lalu cari solusinya bersama."*`,
    excerpt: 'Pola asuh demokratis menggabungkan kasih sayang, aturan yang konsisten, dan komunikasi terbuka. Simak strategi praktis penerapannya di rumah.',
    featuredImage: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=700&q=75&fm=webp',
    category: 'Pola Asuh',
    readTimeMinutes: 6,
    authorId: 1,
    authorName: 'Dr. Ratna Sari, M.Psi',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=75&fm=webp',
    authorRole: 'admin',
    status: 'published',
    metaTitle: 'Panduan Lengkap Pola Asuh Demokratis Anak | Parenting.my.id',
    metaDescription: 'Pelajari panduan penerapan pola asuh demokratis untuk membentuk karakter anak yang mandiri, percaya diri, dan berani di era digital.',
    tags: 'pola asuh, psikologi anak, komunikasi keluarga, karakter anak',
    views: 248,
    createdAt: '2026-08-08T08:00:00.000Z',
    updatedAt: '2026-08-08T08:00:00.000Z',
  },
  {
    id: 2,
    title: '5 Aktivitas Sensory Play Seru untuk Melatih Motorik Halus Balita di Rumah',
    slug: '5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita',
    contentMarkdown: `## Pentingnya Sensory Play untuk Perkembangan Balita

Masa usia dini (1-5 tahun) adalah masa emas (*golden age*) di mana otak berkembang sangat pesat. Salah satu cara terbaik menstimulasi saraf otak adalah melalui **sensory play** atau permainan sensori.

Permainan ini melatih panca indera—penglihatan, pendengaran, perabaan, penciuman, dan perasa—sekaligus memperkuat otot motorik halus yang dibutuhkan **balita** saat belajar menulis kelak.

---

### 5 Ide Sensory Play Sederhana & Murah Meriah

#### 1. Rice Digging (Beras Warna-Warni)
- **Bahan:** Beras, pewarna makanan alami, dan wadah plastik.
- **Cara Bermain:** Sembunyikan mainan kecil di bawah beras. Minta si kecil mencarinya menggunakan sendok atau tangannya.
- **Manfaat:** Melatih genggaman jari dan pemahaman tekstur.

#### 2. Edible Finger Painting (Cat Aman Dimakan)
- **Bahan:** Yoghurt polos dipadukan dengan pewarna makanan dari buah naga atau kunyit.
- **Manfaat:** Mengembangkan kreativitas tanpa khawatir bahan kimia berbahaya jika tertelan.

#### 3. Water Transfer with Sponge (Pindah Air dengan Spons)
- **Bahan:** Dua mangkuk dan spons cuci piring.
- **Manfaat:** Menguatkan otot telapak tangan dan jari jemari balita.

---

### Kaitan Sensory Play dan Pola Asuh yang Tepat

Saat mendampingi si kecil bermain, beri kebebasan eksplorasi tanpa terlalu takut rumah menjadi kotor. Pendekatan **pola asuh** yang suportif akan meningkatkan rasa ingin tahu dan keberanian anak.

Jika anak sudah menunjukkan tanda-tanda kelelahan, istirahatlah dan pastikan kebutuhan **gizi anak** serta asupan nutrisi hariannya sudah terpenuhi dengan baik.`,
    excerpt: 'Temukan 5 ide permainan sensory play mudah dan hemat bahan untuk mengasah indera serta ketangkasan motorik balita di rumah.',
    featuredImage: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=700&q=75&fm=webp',
    category: 'Tumbuh Kembang',
    readTimeMinutes: 4,
    authorId: 2,
    authorName: 'Ahmad Zulkarnain, S.Ked',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=75&fm=webp',
    authorRole: 'writer',
    status: 'published',
    metaTitle: '5 Aktivitas Sensory Play Melatih Motorik Balita | Parenting.my.id',
    metaDescription: 'Panduan praktis 5 permainan sensori (sensory play) hemat untuk meningkatkan stimulasi indera dan kekuatan motorik balita di rumah.',
    tags: 'sensory play, balita, motorik halus, permainan edukasi',
    views: 182,
    createdAt: '2026-08-09T10:00:00.000Z',
    updatedAt: '2026-08-09T10:00:00.000Z',
  },
  {
    id: 3,
    title: 'Mengenal Bahaya Stunting dan Cara Pencegahannya Sejak 1000 Hari Pertama Kehidupan',
    slug: 'mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk',
    contentMarkdown: `## Masalah Stunting di Indonesia: Apa yang Perlu Orang Tua Ketahui?

**Stunting** adalah kondisi gagal tumbuh pada anak balita akibat kekurangan gizi kronis, terutama pada 1000 Hari Pertama Kehidupan (HPK)—dimulai sejak konsepsi di dalam kandungan hingga anak berusia 2 tahun.

Dampak stunting bukan hanya perkara tinggi badan anak yang lebih pendek dari standar, tetapi juga hambatan perkembangan kognitif dan kecerdasan otak yang bersifat permanen.

---

### Tiga Pilar Utama Pencegahan Stunting:
1. **Pemenuhan Nutrisi Ibu Hamil:** Ibu hamil wajib mengonsumsi makanan bergizi seimbang, asam folat, serta zat besi.
2. **Pemberian ASI Eksklusif:** Memberikan **asi eksklusif** selama 6 bulan pertama tanpa tambahan cairan atau makanan lain.
3. **MPASI Bergizi & Protein Hewani:** Memulai MPASI tepat di usia 6 bulan dengan mengutamakan kecukupan protein hewani (telur, ikan, daging ayam/sapi).

---

### Peran Penting Gizi Anak dan Perawatan Harian

Memastikan **gizi anak** terpenuhi secara optimal mensyaratkan edukasi orang tua yang berkelanjutan. Terapkan **pola asuh** makan yang menyenangkan (*feeding rules*) agar anak terhindar dari Gerakan Tutup Mulut (GTM).

Ajak juga **balita** aktif bergerak lewat permainan ringan seperti **sensory play** untuk menjaga daya tahan tubuh dan kebugaran fisiknya.`,
    excerpt: 'Stunting berpengaruh besar pada kecerdasan anak. Pelajari langkah pencegahan stunting melalui pemberian ASI eksklusif dan MPASI tinggi protein.',
    featuredImage: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=700&q=75&fm=webp',
    category: 'Kesehatan & Gizi',
    readTimeMinutes: 7,
    authorId: 1,
    authorName: 'Dr. Ratna Sari, M.Psi',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=75&fm=webp',
    authorRole: 'admin',
    status: 'published',
    metaTitle: 'Cara Mencegah Stunting pada 1000 HPK Anak | Parenting.my.id',
    metaDescription: 'Edukasi komprehensif pencegahan stunting, manfaat ASI eksklusif, serta pola gizi sehat untuk anak tumbuh optimal.',
    tags: 'stunting, asi eksklusif, gizi anak, MPASI, kesehatan balita',
    views: 310,
    createdAt: '2026-08-10T12:00:00.000Z',
    updatedAt: '2026-08-10T12:00:00.000Z',
  },
];

function formatIsoWithTimezone(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function preprocessMarkdownLineBreaks(markdown: string): string {
  if (!markdown) return '';
  let normalized = markdown.replace(/\r\n/g, '\n');
  const parts = normalized.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, index) => {
      if (index % 2 === 1) return part;
      let text = part.replace(/\n[ \t]+\n/g, '\n\n');
      text = text.replace(/\n{2,}/g, (match) => {
        const extraLines = match.length - 1;
        return '\n\n' + '<br />'.repeat(extraLines) + '\n\n';
      });
      return text;
    })
    .join('');
}

function renderMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  try {
    const preparedMd = preprocessMarkdownLineBreaks(markdown);
    return marked.parse(preparedMd, { async: false, gfm: true, breaks: true }) as string;
  } catch (e) {
    // Simple regex fallback parser
    let html = markdown;
    html = html.replace(/## (.*)/g, '<h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">$1</h2>');
    html = html.replace(/### (.*)/g, '<h3 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h3>');
    html = html.replace(/#### (.*)/g, '<h4 class="text-lg font-bold text-slate-900 mt-4 mb-2">$1</h4>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^> (.*)/gm, '<blockquote class="border-l-4 border-rose-500 pl-4 py-2 my-4 italic bg-rose-50 text-slate-700 rounded-r-xl">$1</blockquote>');
    html = html.replace(/^- (.*)/gm, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(/\n\n/g, '</p><p class="my-4 leading-relaxed">');
    return `<p class="my-4 leading-relaxed">${html}</p>`;
  }
}

function applyAutoLinks(htmlContent: string, autolinks: AutoLink[]): string {
  if (!htmlContent || !autolinks || autolinks.length === 0) return htmlContent;
  const sorted = [...autolinks].sort((a, b) => b.keyword.length - a.keyword.length);
  let processed = htmlContent;

  for (const link of sorted) {
    if (!link.keyword || !link.targetUrl) continue;
    const keywordEscaped = link.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tagOrKeywordRegex = new RegExp(
      `(<a\\b[^>]*?>[\\s\\S]*?<\\/a>|<code\\b[^>]*?>[\\s\\S]*?<\\/code>|<h[1-6]\\b[^>]*?>[\\s\\S]*?<\\/h[1-6]>|<[^>]+>)|(\\b${keywordEscaped}\\b)`,
      'gi'
    );
    let replacedCount = 0;
    processed = processed.replace(tagOrKeywordRegex, (match, htmlTag, keywordMatch) => {
      if (htmlTag) return htmlTag;
      if (keywordMatch && replacedCount < 2) {
        replacedCount++;
        return `<a href="${link.targetUrl}" class="inline-flex items-center gap-0.5 text-rose-600 font-semibold underline decoration-rose-300 underline-offset-4 hover:bg-rose-50 px-1 py-0.5 rounded transition-all" title="Artikel terkait: ${escapeHtml(link.description || link.keyword)}">${keywordMatch}↗</a>`;
      }
      return match;
    });
  }
  return processed;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const siteUrl = env.SITE_URL || 'https://parenting.my.id';

  const rawSlug = params.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug.join('/') : String(rawSlug || '');

  let post: Post | null = null;
  let autolinks: AutoLink[] = INITIAL_AUTOLINKS;
  let siteConfig: Record<string, any> | undefined = undefined;

  // 1. Fetch from D1 database if bound
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
        WHERE p.slug = ? AND p.status = 'published'
        LIMIT 1
      `).bind(slug).all();

      if (results && results.length > 0) {
        const r: any = results[0];
        post = {
          id: r.id,
          title: r.title,
          slug: r.slug,
          contentMarkdown: r.contentMarkdown,
          excerpt: r.excerpt,
          featuredImage: r.featuredImage,
          category: r.category,
          readTimeMinutes: r.readTimeMinutes || 5,
          authorId: r.authorId,
          authorName: r.authorName || 'Dr. Ratna Sari, M.Psi',
          authorAvatar: r.authorAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
          authorRole: r.authorRole || 'admin',
          status: r.status,
          metaTitle: r.metaTitle,
          metaDescription: r.metaDescription,
          tags: r.tags || 'parenting, anak',
          views: r.views || 0,
          createdAt: r.createdAt || new Date().toISOString(),
          updatedAt: r.updatedAt || new Date().toISOString(),
        };
      }

      // Fetch autolinks from DB
      const autolinkRes = await env.DB.prepare('SELECT id, keyword, target_url as targetUrl, description, click_count as clickCount FROM autolinks').all();
      if (autolinkRes.results && autolinkRes.results.length > 0) {
        autolinks = autolinkRes.results;
      }

      // Fetch siteConfig from DB for SSR
      try {
        const configRes = await env.DB.prepare('SELECT key, value FROM configs').all();
        if (configRes.results && configRes.results.length > 0) {
          siteConfig = {};
          const SENSITIVE = ['admin_email', 'admin_password', 'admin_name', 'admin_avatar', 'admin_bio', 'password', 'secret', 'token'];
          for (const row of configRes.results) {
            const kLower = String(row.key).toLowerCase();
            if (SENSITIVE.includes(row.key) || kLower.includes('password') || kLower.includes('secret') || kLower.includes('token')) continue;
            try { siteConfig[row.key] = JSON.parse(row.value); } catch { siteConfig[row.key] = row.value; }
          }
        }
      } catch {}
    } catch (e) {
      console.error('D1 error in /baca/[slug]:', e);
    }
  }

  // Fallback to initial seed posts if not in DB
  if (!post) {
    post = INITIAL_POSTS.find((p) => p.slug === slug) || null;
  }

  // Get base HTML asset
  let htmlTemplate = '';
  try {
    const assetRes = await env.ASSETS.fetch(new URL('/', request.url));
    htmlTemplate = await assetRes.text();
  } catch (e) {
    console.error('Failed to fetch ASSETS in Cloudflare Pages Function:', e);
    htmlTemplate = `<!doctype html><html lang="id"><head><meta charset="UTF-8"><title>Parenting.my.id</title></head><body><div id="root"></div></body></html>`;
  }

  // IF POST NOT FOUND (404 Page)
  if (!post) {
    const notFoundHtml = `
      <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div class="text-center max-w-md bg-white p-8 rounded-3xl shadow-lg border border-slate-200">
          <div class="text-5xl mb-4">🔍</div>
          <h1 class="text-2xl font-black text-slate-900 mb-2">Artikel Tidak Ditemukan</h1>
          <p class="text-sm text-slate-600 mb-6">Maaf, artikel parenting yang Anda cari tidak tersedia atau telah dipindahkan.</p>
          <a href="/" class="inline-block px-6 py-3 rounded-2xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-colors">Kembali ke Beranda Utama</a>
        </div>
      </div>
    `;

    const rendered404 = htmlTemplate
      .replace(/<title>.*?<\/title>/i, `<title>Artikel Tidak Ditemukan (404) | Parenting.my.id</title>`)
      .replace(/<div id="root"><\/div>/i, `<div id="root">${notFoundHtml}</div>`);

    return new Response(rendered404, {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  // Render Markdown & Auto-Links
  let parsedHtml = renderMarkdownToHtml(post.contentMarkdown);

  // Inject IDs into H2 and H3 tags for TOC anchors
  parsedHtml = parsedHtml.replace(/<(h[23])>(.*?)<\/\1>/gi, (match, tag, content) => {
    const cleanText = content.replace(/<[^>]+>/g, '').trim();
    if (!cleanText || cleanText.length > 120) return match;
    const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `<${tag} id="${id}">${content}</${tag}>`;
  });

  parsedHtml = applyAutoLinks(parsedHtml, autolinks);

  // Format Date
  const pubDateFormatted = new Date(post.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const pageTitle = `${post.metaTitle || post.title} | Parenting.my.id`;
  const pageDesc = post.metaDescription || post.excerpt;
  const canonicalUrl = `${siteUrl}/baca/${post.slug}`;
  const tagsList = post.tags ? post.tags.split(',').map((t) => t.trim()) : ['parenting', 'anak'];

  // Tags HTML
  const tagsHtml = tagsList
    .map(
      (t) =>
        `<a href="/?search=${encodeURIComponent(t)}" class="px-3 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-semibold rounded-full border border-slate-200 transition-colors">#${escapeHtml(
          t
        )}</a>`
    )
    .join(' ');

  // Schema.org JSON-LD (BlogPosting + Breadcrumb)
  const datePub = formatIsoWithTimezone(post.createdAt);
  const dateMod = formatIsoWithTimezone(post.updatedAt || post.createdAt);

  const schemaArticle = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    'headline': post.title,
    'description': pageDesc,
    'image': [post.featuredImage],
    'datePublished': datePub,
    'dateModified': dateMod,
    'author': {
      '@type': 'Person',
      'name': post.authorName || 'Dr. Ratna Sari, M.Psi',
      'url': `${siteUrl}/#penulis`,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Parenting.my.id',
      'url': siteUrl,
      'logo': {
        '@type': 'ImageObject',
        'url': `${siteUrl}/favicon.ico`,
      },
    },
    'articleSection': post.category,
    'keywords': post.tags,
  };

  const schemaBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Beranda',
        'item': siteUrl,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': post.category,
        'item': `${siteUrl}/?kategori=${encodeURIComponent(post.category)}`,
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': post.title,
        'item': canonicalUrl,
      },
    ],
  };

  // Image Optimization for SSR HTML
  const heroImageSrc = optimizeUnsplashUrl(post.featuredImage, 700, 75, 'webp');
  const heroSrcSet = getUnsplashSrcSet(post.featuredImage, [400, 700, 1200], 75, 'webp');
  const avatarImageSrc = optimizeUnsplashUrl(post.authorAvatar, 100, 75, 'webp');
  const ogImageSrc = optimizeUnsplashUrl(post.featuredImage, 1200, 75, 'webp', 630);

  // Static HTML Content to inject into <div id="root">
  const preRenderedBody = `
    <div class="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <!-- HEADER NAVBAR -->
      <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" class="flex items-center gap-2 text-rose-600 font-black text-xl tracking-tight">
            <span class="bg-rose-600 text-white p-2 rounded-2xl shadow-sm">👶</span>
            <span>Parenting.my.id</span>
          </a>
          <nav class="hidden md:flex items-center gap-6 text-xs font-bold text-slate-700">
            <a href="/" class="hover:text-rose-600 transition-colors">Beranda</a>
            <a href="/?kategori=Pola%20Asuh" class="hover:text-rose-600 transition-colors">Pola Asuh</a>
            <a href="/?kategori=Tumbuh%20Kembang" class="hover:text-rose-600 transition-colors">Tumbuh Kembang</a>
            <a href="/?kategori=Kesehatan%20%26%20Gizi" class="hover:text-rose-600 transition-colors">Kesehatan & Gizi</a>
            <a href="/peta-situs" class="hover:text-rose-600 transition-colors">Peta Situs</a>
          </nav>
        </div>
      </header>

      <!-- MAIN CONTENT -->
      <main class="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <!-- BREADCRUMB NAV -->
        <nav class="flex items-center gap-2 text-xs text-slate-700 mb-6 flex-wrap font-medium" aria-label="Breadcrumb">
          <a href="/" class="hover:underline text-slate-800 font-semibold">Beranda</a>
          <span>/</span>
          <a href="/?kategori=${encodeURIComponent(post.category)}" class="hover:underline font-extrabold text-rose-800">${escapeHtml(post.category)}</a>
          <span>/</span>
          <span class="text-slate-900 font-semibold truncate max-w-xs">${escapeHtml(post.title)}</span>
        </nav>

        <!-- TITLE & META BANNER -->
        <header class="mb-8">
          <span class="inline-block px-3.5 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-black uppercase tracking-wider mb-4 border border-rose-200">
            ${escapeHtml(post.category)}
          </span>
          <h1 class="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight mb-4">
            ${escapeHtml(post.title)}
          </h1>
          <p class="text-base md:text-lg text-slate-700 leading-relaxed font-medium mb-6 border-l-4 border-rose-600 pl-4 py-2 italic bg-rose-50/70 rounded-r-2xl">
            "${escapeHtml(post.excerpt)}"
          </p>

          <!-- AUTHOR & PUBLISH DATE -->
          <div class="flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 py-4 text-xs text-slate-700 font-medium">
            <div class="flex items-center gap-3">
              <img src="${avatarImageSrc}" alt="${escapeHtml(post.authorName || '')}" width="44" height="44" decoding="async" class="w-11 h-11 rounded-full object-cover border-2 border-rose-500 shadow-sm" />
              <div>
                <div class="font-extrabold text-sm text-slate-900">${escapeHtml(post.authorName || 'Dr. Ratna Sari, M.Psi')}</div>
                <div class="text-slate-700 font-semibold">${post.authorRole === 'admin' ? 'Psikolog Anak & Tim Redaksi' : 'Penulis Konten Medis'}</div>
              </div>
            </div>
            <div class="text-right">
              <div>Dipublikasikan: <time datetime="${post.createdAt}" class="font-bold text-slate-900">${pubDateFormatted}</time></div>
              <div class="text-rose-800 font-black mt-0.5">⏱️ ${post.readTimeMinutes} menit baca</div>
            </div>
          </div>
        </header>

        <!-- FEATURED IMAGE (LCP OPTIMIZED - ZERO CLS) -->
        <div class="mb-10 w-full aspect-[16/9] max-h-[500px] rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-slate-100">
          <img src="${heroImageSrc}" ${heroSrcSet ? `srcset="${heroSrcSet}"` : ''} sizes="(max-width: 768px) 100vw, 700px" alt="${escapeHtml(post.title)}" width="700" height="394" fetchpriority="high" decoding="async" class="w-full h-full object-cover" />
        </div>

        <!-- RENDERED ARTICLE CONTENT HTML -->
        <article class="prose prose-rose max-w-none text-slate-900 text-base leading-relaxed space-y-6">
          ${parsedHtml}
        </article>

        <!-- TAGS -->
        <div class="mt-12 pt-6 border-t border-slate-200">
          <span class="text-xs font-black text-slate-700 uppercase tracking-wider block mb-3">Topik Kata Kunci Terkait:</span>
          <div class="flex flex-wrap gap-2">
            ${tagsHtml}
          </div>
        </div>

        <!-- AUTHOR BIO BOX -->
        <div class="mt-10 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
          <img src="${avatarImageSrc}" alt="${escapeHtml(post.authorName || '')}" width="56" height="56" decoding="async" class="w-14 h-14 rounded-full object-cover border-2 border-rose-500" />
          <div class="space-y-1">
            <h4 class="font-black text-sm text-slate-900">${escapeHtml(post.authorName || 'Dr. Ratna Sari, M.Psi')}</h4>
            <p class="text-xs text-rose-800 font-extrabold">${post.authorRole === 'admin' ? 'Psikolog Anak & Tim Redaksi Utama' : 'Penulis Konten Kesehatan'}</p>
            <p class="text-xs text-slate-700 leading-relaxed font-medium">Penulis berdedikasi menyajikan panduan parenting berbasis riset ilmiah dan edukasi praktis untuk keluarga Indonesia.</p>
          </div>
        </div>
      </main>

      <!-- FOOTER -->
      <footer class="bg-slate-900 text-slate-200 py-12 mt-16 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 text-center space-y-3">
          <p class="font-black text-xl text-white tracking-tight">Parenting.my.id</p>
          <p class="text-xs text-slate-300 max-w-md mx-auto font-medium">Portal Media Edukasi Pola Asuh, Gizi Balita, & Tumbuh Kembang Anak Terpercaya di Indonesia.</p>
          <p class="text-[11px] text-slate-300 pt-4 font-medium">© 2026 Parenting.my.id. Seluruh hak cipta dilindungi undang-undang.</p>
        </div>
      </footer>
    </div>
  `;

  // Build Head SEO HTML Injection
  const seoHeadTags = `
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(pageDesc)}" />
    <meta name="keywords" content="${escapeHtml(post.tags || 'parenting, anak, gizi')}" />
    <link rel="preconnect" href="https://images.unsplash.com" crossorigin />
    <link rel="dns-prefetch" href="https://images.unsplash.com" />
    <link rel="canonical" href="${canonicalUrl}" />
    <link rel="preload" as="image" href="${heroImageSrc}" ${heroSrcSet ? `imagesrcset="${heroSrcSet}" imagesizes="(max-width: 768px) 100vw, 700px"` : ''} fetchpriority="high" />

    <!-- OpenGraph Meta Tags -->
    <meta property="og:site_name" content="Parenting.my.id" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(pageDesc)}" />
    <meta property="og:image" content="${ogImageSrc}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="article" />
    <meta property="article:published_time" content="${post.createdAt}" />
    <meta property="article:section" content="${escapeHtml(post.category)}" />

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(pageDesc)}" />
    <meta name="twitter:image" content="${ogImageSrc}" />

    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json">${JSON.stringify(schemaArticle)}</script>
    <script type="application/ld+json">${JSON.stringify(schemaBreadcrumb)}</script>
  `;

  // Replace <title> and inject SEO tags into <head>
  let finalHtml = htmlTemplate;

  if (finalHtml.includes('<title>')) {
    finalHtml = finalHtml.replace(/<title>.*?<\/title>/i, seoHeadTags);
  } else {
    finalHtml = finalHtml.replace('</head>', `${seoHeadTags}</head>`);
  }

  // Inject pre-rendered static HTML into <div id="root">
  const initialDataJson = JSON.stringify({ post, autolinks, siteConfig }).replace(/</g, '\\u003c');
  const initialDataScript = `<script>window.__INITIAL_DATA__=${initialDataJson};</script>`;
  finalHtml = finalHtml.replace(/<div id="root"><\/div>/i, `${initialDataScript}<div id="root">${preRenderedBody}</div>`);

  return new Response(finalHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};
