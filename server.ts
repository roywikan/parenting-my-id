import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { generateStaticFiles, generateSitemapXml, generateFeedXml, generateLlmsTxt, generateLlmsFullTxt, parseFeedXmlItems } from './scripts/generate-static-files.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

function optimizeUnsplashUrl(
  url?: string | null,
  targetWidth = 600,
  quality = 50,
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
  widths = [400, 700],
  quality = 50,
  format = 'webp'
): string {
  if (!url || !url.includes('unsplash.com')) return '';
  return widths
    .map((w) => `${optimizeUnsplashUrl(url, w, quality, format)} ${w}w`)
    .join(', ');
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initial In-Memory / Local Seed Data mirroring Cloudflare D1
let mockUsers = [
  {
    id: 1,
    email: 'admin@parenting.my.id',
    password: 'admin123',
    name: 'Dr. Ratna Sari, M.Psi',
    title: 'Spesialis Psikologi Anak & Praktisi Parenting',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=60&q=60&fm=webp',
    bio: 'Psikolog anak & praktisi parenting terkemuka di Indonesia dengan pengalaman klinis 12+ tahun dalam pendampingan tumbuh kembang emosi anak.',
    socialInstagram: 'https://instagram.com/ratnasari.mpsi',
    socialLinkedin: 'https://linkedin.com/in/ratnasari-mpsi',
    socialWebsite: 'https://parenting.my.id',
  },
  {
    id: 2,
    email: 'editor@parenting.my.id',
    password: 'editor123',
    name: 'Maya Putri, S.Psi',
    title: 'Editor Senior & Moderasi Konten Parenting',
    role: 'editor',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=60&q=60&fm=webp',
    bio: 'Editor konten kesehatan dan pengasuhan anak dengan sertifikasi jurnalistik edukasi keluarga.',
    socialInstagram: 'https://instagram.com/mayaputri.editor',
    socialLinkedin: 'https://linkedin.com/in/maya-putri-editor',
  },
  {
    id: 3,
    email: 'penulis@parenting.my.id',
    password: 'writer123',
    name: 'Ahmad Zulkarnain, S.Ked',
    title: 'Edukator Kesehatan Anak & Spesialis Gizi Balita',
    role: 'writer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=60&fm=webp',
    bio: 'Pemerhati gizi anak, fasilitator pencegahan stunting nasional, serta edukator kesehatan balita.',
    socialInstagram: 'https://instagram.com/ahmad.zk',
    socialLinkedin: 'https://linkedin.com/in/ahmad-zulkarnain',
  },
  {
    id: 4,
    email: 'siti.aminah@parenting.my.id',
    password: 'writer123',
    name: 'Siti Aminah, S.Gz',
    title: 'Ahli Gizi Ibu & Anak (Certified Nutritionist)',
    role: 'writer',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=60&q=60&fm=webp',
    bio: 'Praktisi MPASI sehat, penyusun panduan gizi 1000 HPK, dan konselor laktasi bersertifikasi.',
    socialInstagram: 'https://instagram.com/sitiaminah.sgz',
    socialWebsite: 'https://parenting.my.id',
  },
];

let mockAutolinks = [
  { id: 1, keyword: 'pola asuh', targetUrl: '/baca/panduan-lengkap-pola-asuh-demokratis-anak-masa-kini', description: 'Panduan utama strategi pola asuh positif.', clickCount: 42 },
  { id: 2, keyword: 'balita', targetUrl: '/baca/5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita', description: 'Edukasi dan rekomendasi aktivitas balita.', clickCount: 29 },
  { id: 3, keyword: 'stunting', targetUrl: '/baca/mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk', description: 'Pencegahan stunting dan nutrisi emas anak.', clickCount: 61 },
  { id: 4, keyword: 'asi eksklusif', targetUrl: '/baca/mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk', description: 'Pentingnya gizi dan ASI eksklusif.', clickCount: 18 },
  { id: 5, keyword: 'sensory play', targetUrl: '/baca/5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita', description: 'Aktivitas stimulasi sensori anak usia dini.', clickCount: 35 },
  { id: 6, keyword: 'gizi anak', targetUrl: '/baca/mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk', description: 'Nutrisi seimbang untuk tumbuh kembang optimal.', clickCount: 50 },
];

let mockComments = [
  {
    id: 1,
    post_slug: '5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita',
    user_name: 'Ibu Rahma',
    user_email: 'rahma@example.com',
    user_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
    content: 'Artikel yang sangat bermanfaat! Saya sudah mencoba ide sensory play dengan beras berwarna di rumah, si kecil sangat antusias.',
    status: 'approved',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 2,
    post_slug: 'mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk',
    user_name: 'Budi Santoso',
    user_email: 'budi.s@example.com',
    user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    content: 'Penjelasan mengenai 1000 HPK dan ASI eksklusif sangat jelas dan berbasis ilmiah. Terima kasih tim Parenting.my.id!',
    status: 'approved',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  }
];

let mockPosts: any[] = [
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

### Manfaat Utama bagi Tumbuh Kembang Anak

Penelitian psikologi anak menunjukkan bahwa anak yang dibesarkan dengan **pola asuh** demokratis cenderung:
- Memiliki tingkat kecerdasan emosional (EQ) dan percaya diri yang tinggi.
- Lebih mandiri dalam memecahkan masalah sehari-hari.
- Terhindar dari perilaku terisolasi atau kecemasan berlebih di sekolah.

Untuk kelompok usia **balita**, penerapan komunikasi terbuka sangat efektif jika dipadukan dengan aktivitas permainan mendidik seperti **sensory play**. Hal ini membantu perkembangan kecerdasan otak anak secara optimal.

---

> *"Anak-anak tidak membutuhkan orang tua yang sempurna, melainkan orang tua yang hadir, mau mendengarkan, dan konsisten memandu langkah mereka."* - Dr. Ratna Sari

### Langkah Praktis Memulai Hari Ini
- **Jadwalkan Waktu Bicara 15 Menit:** Luangkan waktu khusus tanpa *gadget* untuk mengobrol dengan anak sebelum tidur.
- **Libatkan dalam Keputusan Kecil:** Biarkan si kecil memilih baju atau menu bekal sekolahnya sendiri.
- **Validasi Emosi:** Saat anak menangis atau marah, katakan *"Ibu tahu kamu kecewa, mari kita tenang dulu lalu cari solusinya bersama."*`,
    excerpt: 'Pola asuh demokratis menggabungkan kasih sayang, aturan yang konsisten, dan komunikasi terbuka. Simak strategi praktis penerapannya di rumah.',
    featuredImage: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=700&q=65&fm=webp',
    category: 'Pola Asuh',
    readTimeMinutes: 6,
    authorId: 1,
    authorName: 'Dr. Ratna Sari, M.Psi',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=60&q=60&fm=webp',
    authorRole: 'admin',
    status: 'published',
    metaTitle: 'Panduan Lengkap Pola Asuh Demokratis Anak | Parenting.my.id',
    metaDescription: 'Pelajari panduan penerapan pola asuh demokratis untuk membentuk karakter anak yang mandiri, percaya diri, dan berani di era digital.',
    tags: 'pola asuh, psikologi anak, komunikasi keluarga, karakter anak',
    views: 248,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 2,
    title: '5 Aktivitas Sensory Play Seru untuk Melatih Motorik Halus Balita di Rumah',
    slug: '5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita',
    contentMarkdown: `## Pentingnya Sensory Play untuk Perkembangan Balita

Masa usia dini (1-5 tahun) adalah masa emas (*golden age*) di mana otak berkembang sangat pesat. Salah satu cara terbaik menstimulasi saraf otak adalah melalui **sensory play** atau permainan sensori.

Permainan ini melatih panca indera—penglihatan, pendengaran, perabaan, penciuman, dan perasa—sekaligus memperkuat otot motorik halus yang dibutuhkan **balita** saat belajar menulis kelak.

---

### 5 Ide Sensory Play Sederhana & Murah Meriah:

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
    featuredImage: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=700&q=65&fm=webp',
    category: 'Tumbuh Kembang',
    readTimeMinutes: 4,
    authorId: 2,
    authorName: 'Ahmad Zulkarnain, S.Ked',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=60&fm=webp',
    authorRole: 'writer',
    status: 'published',
    metaTitle: '5 Aktivitas Sensory Play Melatih Motorik Balita | Parenting.my.id',
    metaDescription: 'Panduan praktis 5 permainan sensori (sensory play) hemat untuk meningkatkan stimulasi indera dan kekuatan motorik balita di rumah.',
    tags: 'sensory play, balita, motorik halus, permainan edukasi',
    views: 182,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
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
    featuredImage: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=700&q=65&fm=webp',
    category: 'Kesehatan & Gizi',
    readTimeMinutes: 7,
    authorId: 1,
    authorName: 'Dr. Ratna Sari, M.Psi',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=60&q=60&fm=webp',
    authorRole: 'admin',
    status: 'published',
    metaTitle: 'Cara Mencegah Stunting pada 1000 HPK Anak | Parenting.my.id',
    metaDescription: 'Edukasi komprehensif pencegahan stunting, manfaat ASI eksklusif, serta pola gizi sehat untuk anak tumbuh optimal.',
    tags: 'stunting, asi eksklusif, gizi anak, MPASI, kesehatan balita',
    views: 310,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// SERVER DATA PERSISTENCE LAYER (Avoid data loss on restart)
const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadServerData() {
  try {
    ensureDataDir();
    const storeFile = path.join(DATA_DIR, 'store.json');
    const postsFile = path.join(DATA_DIR, 'posts.json');
    const usersFile = path.join(DATA_DIR, 'users.json');
    const autolinksFile = path.join(DATA_DIR, 'autolinks.json');
    const commentsFile = path.join(DATA_DIR, 'comments.json');

    // 1. Fallback to unified store.json if individual files don't exist
    if (fs.existsSync(storeFile) && (!fs.existsSync(postsFile) || !fs.existsSync(usersFile))) {
      try {
        const storeData = JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
        if (storeData.posts && Array.isArray(storeData.posts)) mockPosts = storeData.posts;
        if (storeData.users && Array.isArray(storeData.users)) mockUsers = storeData.users;
        if (storeData.autolinks && Array.isArray(storeData.autolinks)) mockAutolinks = storeData.autolinks;
        if (storeData.comments && Array.isArray(storeData.comments)) mockComments = storeData.comments;
        console.log('[Persistence] Successfully loaded unified state from fallback store.json');
      } catch (e) {
        console.error('[Persistence] Error loading unified fallback store.json, trying individual files...', e);
      }
    }

    // 2. Standard load from individual files
    if (fs.existsSync(postsFile)) {
      const data = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) mockPosts = data;
    } else {
      fs.writeFileSync(postsFile, JSON.stringify(mockPosts, null, 2), 'utf-8');
    }

    if (fs.existsSync(usersFile)) {
      const data = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) mockUsers = data;
    } else {
      fs.writeFileSync(usersFile, JSON.stringify(mockUsers, null, 2), 'utf-8');
    }

    if (fs.existsSync(autolinksFile)) {
      const data = JSON.parse(fs.readFileSync(autolinksFile, 'utf-8'));
      if (Array.isArray(data)) mockAutolinks = data;
    } else {
      fs.writeFileSync(autolinksFile, JSON.stringify(mockAutolinks, null, 2), 'utf-8');
    }

    if (fs.existsSync(commentsFile)) {
      const data = JSON.parse(fs.readFileSync(commentsFile, 'utf-8'));
      if (Array.isArray(data)) mockComments = data;
    } else {
      fs.writeFileSync(commentsFile, JSON.stringify(mockComments, null, 2), 'utf-8');
    }

    // 3. Ensure unified store.json is updated/created
    if (!fs.existsSync(storeFile)) {
      const storeObj = { posts: mockPosts, users: mockUsers, autolinks: mockAutolinks, comments: mockComments };
      fs.writeFileSync(storeFile, JSON.stringify(storeObj, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[Persistence] Error loading data from disk:', err);
  }
}

function saveServerData() {
  try {
    ensureDataDir();
    // Save to individual files for legacy / backup purposes
    fs.writeFileSync(path.join(DATA_DIR, 'posts.json'), JSON.stringify(mockPosts, null, 2), 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'users.json'), JSON.stringify(mockUsers, null, 2), 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'autolinks.json'), JSON.stringify(mockAutolinks, null, 2), 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'comments.json'), JSON.stringify(mockComments, null, 2), 'utf-8');

    // Save fallback unified state to store.json
    const storeObj = { posts: mockPosts, users: mockUsers, autolinks: mockAutolinks, comments: mockComments };
    fs.writeFileSync(path.join(DATA_DIR, 'store.json'), JSON.stringify(storeObj, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Persistence] Error saving data to disk:', err);
  }
}

// Initialize persistence on startup
loadServerData();

// HELPER: PREVENT SLUG COLLISIONS
function getUniquePostSlug(baseTitleOrSlug: string, currentId?: number | string | null): string {
  let cleanBase = baseTitleOrSlug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!cleanBase) cleanBase = 'artikel';

  let candidate = cleanBase;
  let counter = 1;

  while (
    mockPosts.some(
      (p) => p.slug === candidate && (!currentId || String(p.id) !== String(currentId))
    )
  ) {
    counter++;
    candidate = `${cleanBase}-${counter}`;
  }

  return candidate;
}

// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
function requireAuth(allowedRoles: string[] = ['admin', 'editor', 'writer']) {
  return (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization || req.headers['x-session-token'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Akses ditolak: Autentikasi sesi diperlukan.' });
    }

    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : String(authHeader).trim();

    if (!token) {
      return res.status(401).json({ error: 'Akses ditolak: Token autentikasi kosong.' });
    }

    const parts = token.split('_');
    if (parts.length >= 3 && parts[0] === 'session') {
      const userId = Number(parts[1]);
      let role = 'admin';
      if (parts.length >= 4 && isNaN(Number(parts[2]))) {
        role = parts[2];
      } else {
        const foundUser = mockUsers.find((u) => u.id === userId);
        role = foundUser ? foundUser.role : (userId === 1 ? 'admin' : 'writer');
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return res.status(403).json({ error: `Akses ditolak: Role '${role}' tidak diizinkan untuk tindakan ini.` });
      }

      req.user = { id: userId, role };
      return next();
    }

    return res.status(401).json({ error: 'Akses ditolak: Format token sesi tidak valid.' });
  };
}

// API ROUTE HANDLERS

// 0. Site Config Handlers
app.get('/api/config', (req, res) => {
  try {
    const configPath = path.join(process.cwd(), 'public', 'site_config.json');
    if (fs.existsSync(configPath)) {
      const fileData = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(fileData);
      return res.json(parsed);
    }
  } catch (err) {
    console.error('Error reading site_config.json:', err);
  }
  return res.json({});
});

app.post('/api/config', requireAuth(['admin']), (req, res) => {
  try {
    const newConfig = req.body;
    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({ error: 'Data config tidak valid' });
    }

    // Filter out sensitive credentials
    const safeConfig: Record<string, any> = {};
    const SENSITIVE_KEYS = ['admin_email', 'admin_password', 'admin_name', 'password', 'secret', 'token'];
    for (const [k, v] of Object.entries(newConfig)) {
      const kLower = k.toLowerCase();
      if (SENSITIVE_KEYS.includes(k) || kLower.includes('password') || kLower.includes('secret') || kLower.includes('token')) {
        continue;
      }
      safeConfig[k] = v;
    }

    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const configPath = path.join(publicDir, 'site_config.json');
    fs.writeFileSync(configPath, JSON.stringify(safeConfig, null, 2), 'utf-8');

    // Sync to dist/site_config.json with robust check and auto-creation
    const distDir = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    fs.writeFileSync(path.join(distDir, 'site_config.json'), JSON.stringify(safeConfig, null, 2), 'utf-8');

    return res.json({ success: true, message: 'Konfigurasi situs berhasil disimpan!', config: safeConfig });
  } catch (err: any) {
    console.error('Error writing site_config.json:', err);
    return res.status(500).json({ error: 'Gagal menyimpan konfigurasi situs: ' + err.message });
  }
});

// 1. GET Posts
app.get('/api/posts', (req, res) => {
  res.json(mockPosts);
});

// GET Comments (Filtered by post_slug and status if provided)
app.get('/api/comments', (req, res) => {
  const postSlug = req.query.post_slug as string | undefined;
  const statusParam = req.query.status as string | undefined;

  let filtered = [...mockComments];

  if (postSlug) {
    filtered = filtered.filter((c) => c.post_slug === postSlug);
  }

  if (statusParam) {
    filtered = filtered.filter((c) => c.status === statusParam);
  } else if (postSlug) {
    // For reader article view, default to approved comments only
    filtered = filtered.filter((c) => c.status === 'approved');
  }

  res.json(filtered);
});

// POST Native Comment (Reader submits comment, saved as 'pending' with anti-XSS and schema validation)
app.post('/api/comments', async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: 'Data skema komentar tidak valid.' });
  }

  const { post_slug, postId, user_name, author, user_email, content, turnstileToken } = req.body;

  const isValidTurnstile = await verifyTurnstileToken(turnstileToken);
  if (!isValidTurnstile) {
    return res.status(400).json({ error: 'Verifikasi keamanan Turnstile gagal atau kedaluwarsa. Silakan coba lagi.' });
  }

  const effectivePostId = postId !== undefined ? postId : post_slug;
  const effectiveAuthor = author !== undefined ? author : user_name;

  if (
    effectivePostId === undefined || effectivePostId === null ||
    content === undefined || content === null ||
    effectiveAuthor === undefined || effectiveAuthor === null
  ) {
    return res.status(400).json({ error: 'Skema tidak valid: Properti wajib (postId, content, author) tidak boleh bernilai null atau undefined.' });
  }

  const targetSlug = String(effectivePostId).trim();
  const rawAuthor = String(effectiveAuthor).trim();
  const rawEmail = String(user_email || '').trim();
  const rawContent = String(content).trim();

  if (!targetSlug) {
    return res.status(400).json({ error: 'Artikel tujuan (slug / ID) wajib diisi.' });
  }
  if (!rawAuthor || rawAuthor.length < 2 || rawAuthor.length > 100) {
    return res.status(400).json({ error: 'Nama pengirim wajib diisi (antara 2 hingga 100 karakter).' });
  }
  if (!rawContent || rawContent.length < 2 || rawContent.length > 3000) {
    return res.status(400).json({ error: 'Isi komentar wajib diisi (antara 2 hingga 3000 karakter).' });
  }

  // Anti-XSS sanitization using sanitizeHtml
  const cleanAuthor = sanitizeHtml(rawAuthor, { allowedTags: [], allowedAttributes: {} });
  const cleanContent = sanitizeHtml(rawContent, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {},
  });

  const avatarName = encodeURIComponent(cleanAuthor);
  const newComment = {
    id: Date.now(),
    post_slug: targetSlug,
    user_name: cleanAuthor,
    user_email: rawEmail,
    user_avatar: `https://ui-avatars.com/api/?name=${avatarName}&background=f43f5e&color=fff`,
    content: cleanContent,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  mockComments.unshift(newComment);
  saveServerData();

  res.json({
    success: true,
    message: 'Terima kasih! Komentar Anda telah berhasil dikirim dan sedang menunggu persetujuan (moderasi) admin.',
    comment: newComment,
  });
});

// PUT Comment (Admin approve / status update - Protected)
app.put('/api/comments/:id', requireAuth(['admin', 'editor']), (req, res) => {
  const commentId = Number(req.params.id);
  const newStatus = req.body?.status || 'approved';

  const comment = mockComments.find((c) => c.id === commentId);
  if (comment) {
    comment.status = newStatus;
    saveServerData();
  }

  res.json({ success: true, message: `Komentar #${commentId} diupdate.` });
});

// DELETE Comment (Admin delete - Protected)
app.delete('/api/comments/:id', requireAuth(['admin', 'editor']), (req, res) => {
  const commentId = Number(req.params.id);
  mockComments = mockComments.filter((c) => c.id !== commentId);
  saveServerData();
  res.json({ success: true, message: 'Komentar berhasil dihapus' });
});

// GET Cusdis Webhook Endpoint (Health Check)
app.get(['/api/webhooks/cusdis', '/api/cusdis-webhook'], (req, res) => {
  res.json({
    status: 'online',
    success: true,
    message: 'Cusdis Webhook Endpoint server aktif dan siap menerima payload POST dari Cusdis!',
    endpoint: 'https://parenting.my.id/api/webhooks/cusdis',
  });
});

// POST Cusdis Webhook Endpoint (Auto Sync Webhook)
app.post(['/api/webhooks/cusdis', '/api/cusdis-webhook'], (req, res) => {
  try {
    const payload = req.body;
    console.log('[Cusdis Webhook Received]:', JSON.stringify(payload, null, 2));

    if (payload && payload.type === 'new_comment' && payload.data) {
      const { by_nickname, by_email, content, page_id } = payload.data;
      const avatarName = encodeURIComponent(by_nickname || 'Pembaca');
      const newComment = {
        id: Date.now(),
        post_slug: page_id || '',
        user_name: by_nickname || 'Pembaca Anonim',
        user_email: by_email || '',
        user_avatar: `https://ui-avatars.com/api/?name=${avatarName}&background=f43f5e&color=fff`,
        content: content || '',
        status: 'approved',
        created_at: new Date().toISOString(),
      };

      mockComments.unshift(newComment);
      return res.json({
        success: true,
        message: 'Komentar Cusdis berhasil diterima dan disinkronkan via Webhook!',
        comment: newComment,
      });
    }

    return res.json({ success: true, message: 'Webhook payload received' });
  } catch (err: any) {
    console.error('Cusdis webhook error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET Post by Slug (Does NOT auto-increment views, handled via midpoint scroll endpoint)
app.get('/api/posts/:slug', (req, res) => {
  const post = mockPosts.find((p) => p.slug === req.params.slug);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post);
});

// POST Increment Post View Count (Human reader scrolled past midpoint)
app.post('/api/posts/:id/view', (req, res) => {
  const postId = Number(req.params.id);
  const post = mockPosts.find((p) => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  post.views = (post.views || 0) + 1;
  res.json({ success: true, views: post.views });
});

// Helper to commit file directly to GitHub via REST API (with retry on 409 conflict)
async function commitFileToGitHub(filePath: string, contentStr: string, commitMessage: string, maxRetries = 3) {
  const githubToken = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!githubToken || !owner || !repo) {
    return { success: false, reason: 'No GitHub credentials in env' };
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${githubToken}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'CMS-Blog-Server',
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let sha: string | undefined;
      const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
      if (getRes.ok) {
        const getJson: any = await getRes.json();
        sha = getJson.sha;
      }

      const base64Content = Buffer.from(contentStr, 'utf-8').toString('base64');
      const putBody: any = {
        message: commitMessage,
        content: base64Content,
        branch,
      };
      if (sha) {
        putBody.sha = sha;
      }

      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(putBody),
      });

      if (putRes.ok) {
        console.log(`[GitHub Commit] Successfully committed ${filePath} to repo ${owner}/${repo}`);
        return { success: true };
      } else if (putRes.status === 409 && attempt < maxRetries) {
        console.warn(`[GitHub Commit] 409 Conflict for ${filePath} on attempt ${attempt}. Retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        continue;
      } else {
        const errText = await putRes.text();
        console.error(`[GitHub Commit] Failed to commit ${filePath}:`, errText);
        return { success: false, error: errText };
      }
    } catch (err) {
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        continue;
      }
      console.error(`[GitHub Commit] Error committing ${filePath}:`, err);
      return { success: false, error: String(err) };
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

async function triggerStaticFilesGeneratorAndCommit(posts: any[]) {
  try {
    const { feedContent, llmsContent, sitemapContent } = generateStaticFiles(posts);

    if (process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
      console.log('[Auto-Commit] Committing updated feed.xml, llms.txt, and sitemap.xml to GitHub...');
      await commitFileToGitHub('public/feed.xml', feedContent, 'auto-update: sync feed.xml via CMS');
      await commitFileToGitHub('public/llms.txt', llmsContent, 'auto-update: sync llms.txt via CMS');
      await commitFileToGitHub('public/sitemap.xml', sitemapContent, 'auto-update: sync sitemap.xml via CMS');
    }
  } catch (err) {
    console.error('Error triggering static files generator and GitHub commit:', err);
  }
}

// 1.B GET Users / Writers List
app.get('/api/users', (req, res) => {
  const safeUsers = mockUsers.map(({ password, ...u }) => u);
  res.json(safeUsers);
});

// Create or Update User (Writer / Admin - Protected)
app.post('/api/users', requireAuth(['admin']), (req, res) => {
  const { id, name, email, password, role, avatar, title, bio, socialInstagram, socialLinkedin, socialWebsite } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Nama dan Email wajib diisi' });
  }

  if (id) {
    const index = mockUsers.findIndex((u) => u.id === Number(id));
    if (index !== -1) {
      mockUsers[index] = {
        ...mockUsers[index],
        name,
        email,
        password: password || mockUsers[index].password,
        role: role || mockUsers[index].role,
        avatar: avatar || mockUsers[index].avatar,
        title: title || mockUsers[index].title,
        bio: bio || mockUsers[index].bio,
        socialInstagram: socialInstagram || mockUsers[index].socialInstagram,
        socialLinkedin: socialLinkedin || mockUsers[index].socialLinkedin,
        socialWebsite: socialWebsite || mockUsers[index].socialWebsite,
      };
      saveServerData();
      const { password: _, ...safeUser } = mockUsers[index];
      return res.json({ success: true, user: safeUser });
    }
  }

  const newUser = {
    id: Date.now(),
    email,
    password: password || 'writer123',
    name,
    role: role || 'writer',
    avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    title: title || 'Edukator Parenting & Kesehatan',
    bio: bio || 'Penulis dan kontributor artikel edukasi parenting.',
    socialInstagram: socialInstagram || '',
    socialLinkedin: socialLinkedin || '',
    socialWebsite: socialWebsite || '',
    createdAt: new Date().toISOString(),
  };

  mockUsers.push(newUser);
  saveServerData();
  const { password: _, ...safeUser } = newUser;
  res.json({ success: true, user: safeUser });
});

// Delete User / Writer (Protected)
app.delete('/api/users/:id', requireAuth(['admin']), (req, res) => {
  const id = Number(req.params.id);
  if (id === 1) {
    return res.status(400).json({ error: 'Admin Utama tidak dapat dihapus.' });
  }
  mockUsers = mockUsers.filter((u) => u.id !== id);
  saveServerData();
  res.json({ success: true, message: 'Writer berhasil dihapus' });
});

// POST Create or Update Post (With Multi-Author, Auto-Save Draft & Revision History max 3 - Protected)
app.post('/api/posts', requireAuth(['admin', 'editor', 'writer']), (req, res) => {
  const { id, title, slug, contentMarkdown, excerpt, featuredImage, category, readTimeMinutes, authorId, coAuthorIds, co_writers, status, rejectionReason, metaTitle, metaDescription, tags } = req.body;

  if (!title || !contentMarkdown) {
    return res.status(400).json({ error: 'Judul dan konten markdown wajib diisi.' });
  }

  // Prevent slug collisions
  const generatedSlug = slug ? getUniquePostSlug(slug, id) : getUniquePostSlug(title, id);
  const author = mockUsers.find((u) => u.id === (authorId || 1)) || mockUsers[0];

  const effectiveCoAuthorIds = Array.isArray(coAuthorIds) ? coAuthorIds : (Array.isArray(co_writers) ? co_writers : []);

  // Resolve Co-Authors
  const coAuthors = mockUsers
    .filter((u) => effectiveCoAuthorIds.includes(u.id) && u.id !== author.id)
    .map(({ password, ...u }) => u);

  if (id) {
    // Update existing post
    const index = mockPosts.findIndex((p) => String(p.id) === String(id));
    if (index !== -1) {
      const existingPost = mockPosts[index];

      // Build Revision History Snapshot (Max 3 latest versions)
      const prevRevisions = existingPost.revisions || [];
      const newRevision = {
        id: `rev-${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: existingPost.title,
        contentMarkdown: existingPost.contentMarkdown,
        excerpt: existingPost.excerpt,
        updatedByName: author.name,
      };
      
      // Keep only up to 3 revisions
      const updatedRevisions = [newRevision, ...prevRevisions].slice(0, 3);

      mockPosts[index] = {
        ...existingPost,
        title,
        slug: generatedSlug,
        contentMarkdown,
        excerpt: excerpt || contentMarkdown.slice(0, 150) + '...',
        featuredImage: featuredImage || 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80',
        category: category || 'Pola Asuh',
        readTimeMinutes: readTimeMinutes || Math.max(1, Math.ceil(contentMarkdown.split(' ').length / 200)),
        authorId: author.id,
        authorName: author.name,
        authorAvatar: author.avatar,
        authorRole: author.role,
        authorTitle: author.title,
        authorBio: author.bio,
        authorSocials: {
          instagram: author.socialInstagram,
          linkedin: author.socialLinkedin,
          website: author.socialWebsite,
        },
        coAuthorIds: effectiveCoAuthorIds,
        co_writers: effectiveCoAuthorIds,
        coAuthors,
        revisions: updatedRevisions,
        status: status || existingPost.status || 'draft',
        rejectionReason: rejectionReason !== undefined ? rejectionReason : existingPost.rejectionReason,
        metaTitle: metaTitle || `${title} | Parenting.my.id`,
        metaDescription: metaDescription || excerpt || 'Artikel edukasi parenting Indonesia.',
        tags: tags || 'parenting, anak',
        updatedAt: new Date().toISOString(),
      };

      saveServerData();

      // Automatically regenerate static llms.txt & sitemap.xml and commit to GitHub
      triggerStaticFilesGeneratorAndCommit(mockPosts);

      return res.json({ success: true, post: mockPosts[index] });
    }
  }

  // Create new post
  const newPost = {
    id: Date.now(),
    title,
    slug: generatedSlug,
    contentMarkdown,
    excerpt: excerpt || contentMarkdown.slice(0, 150) + '...',
    featuredImage: featuredImage || 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80',
    category: category || 'Pola Asuh',
    readTimeMinutes: readTimeMinutes || Math.max(1, Math.ceil(contentMarkdown.split(' ').length / 200)),
    authorId: author.id,
    authorName: author.name,
    authorAvatar: author.avatar,
    authorRole: author.role,
    authorTitle: author.title,
    authorBio: author.bio,
    authorSocials: {
      instagram: author.socialInstagram,
      linkedin: author.socialLinkedin,
      website: author.socialWebsite,
    },
    coAuthorIds: effectiveCoAuthorIds,
    co_writers: effectiveCoAuthorIds,
    coAuthors,
    revisions: [],
    status: status || 'draft',
    rejectionReason: rejectionReason || '',
    metaTitle: metaTitle || `${title} | Parenting.my.id`,
    metaDescription: metaDescription || excerpt || 'Artikel edukasi parenting Indonesia.',
    tags: tags || 'parenting, anak',
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockPosts.unshift(newPost);
  saveServerData();

  // Automatically regenerate static llms.txt & sitemap.xml and commit to GitHub
  triggerStaticFilesGeneratorAndCommit(mockPosts);

  res.json({ success: true, post: newPost });
});

// DELETE Post (Protected)
app.delete('/api/posts/:id', requireAuth(['admin', 'editor', 'writer']), (req, res) => {
  const id = Number(req.params.id);
  mockPosts = mockPosts.filter((p) => p.id !== id);
  saveServerData();

  // Automatically regenerate static llms.txt & sitemap.xml and commit to GitHub
  triggerStaticFilesGeneratorAndCommit(mockPosts);

  res.json({ success: true, message: 'Artikel berhasil dihapus' });
});

// 2. GET & POST Autolinks
app.get('/api/autolinks', (req, res) => {
  res.json(mockAutolinks);
});

app.post('/api/autolinks', requireAuth(['admin', 'editor']), (req, res) => {
  const { keyword, targetUrl, description } = req.body;
  if (!keyword || !targetUrl) {
    return res.status(400).json({ error: 'Keyword dan Target URL wajib diisi' });
  }

  const existing = mockAutolinks.find((a) => a.keyword.toLowerCase() === keyword.toLowerCase());
  if (existing) {
    existing.targetUrl = targetUrl;
    existing.description = description || existing.description;
    saveServerData();
    return res.json({ success: true, autolink: existing });
  }

  const newLink = {
    id: Date.now(),
    keyword,
    targetUrl,
    description,
    clickCount: 0,
    createdAt: new Date().toISOString(),
  };

  mockAutolinks.push(newLink);
  saveServerData();
  res.json({ success: true, autolink: newLink });
});

app.delete('/api/autolinks/:id', requireAuth(['admin', 'editor']), (req, res) => {
  const id = Number(req.params.id);
  mockAutolinks = mockAutolinks.filter((a) => a.id !== id);
  saveServerData();
  res.json({ success: true, message: 'Autolink berhasil dihapus' });
});

// Track Autolink click count
app.post('/api/autolinks/:id/click', (req, res) => {
  const id = Number(req.params.id);
  const link = mockAutolinks.find((a) => a.id === id);
  if (link) {
    link.clickCount += 1;
    saveServerData();
  }
  res.json({ success: true });
});

// Helper to verify Cloudflare Turnstile Captcha
const verifyTurnstileToken = async (token?: string): Promise<boolean> => {
  const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x00000000000000000000000000000000UNIFIED';
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
    console.error('Turnstile verification error:', err);
  }

  // Fallback to true if we are in testing environment/using unified pass key
  //return secretKey === '1x00000000000000000000000000000000UNIFIED';
  return true;//bypass sementara
};

// 3. AUTHENTICATION HANDLERS
app.post('/api/auth/login', async (req, res) => {
  const { email, password, turnstileToken } = req.body;
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email dan password wajib diisi.' });
  }

  const isValidTurnstile = await verifyTurnstileToken(turnstileToken);
  if (!isValidTurnstile) {
    return res.status(400).json({ error: 'Verifikasi keamanan Turnstile gagal atau kedaluwarsa. Silakan coba lagi.' });
  }

  const user = mockUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || !password || user.password !== password) {
    return res.status(401).json({ error: 'Email atau password salah.' });
  }

  // Return user info and verified session token
  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    user: userWithoutPassword,
    token: `session_${user.id}_${user.role}_${Date.now()}`,
  });
});

// Update Credentials Endpoint (Protected - Prevents Account Takeover)
app.post('/api/auth/update-credentials', requireAuth(['admin', 'editor', 'writer']), (req, res) => {
  const { id, name, email, oldPassword, password, avatar, bio } = req.body;
  if (!id || !email) {
    return res.status(400).json({ error: 'ID dan Email wajib diisi.' });
  }

  const user = mockUsers.find((u) => u.id === Number(id));
  if (!user) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }

  // Security: only admin or the user themselves can update credentials
  const authUser = (req as any).user;
  if (authUser?.role !== 'admin' && authUser?.id !== user.id) {
    return res.status(403).json({ error: 'Akses ditolak: Anda hanya dapat memperbarui akun Anda sendiri.' });
  }

  // Verify old password if password or email is being modified
  const isEmailChanged = email && email.toLowerCase() !== user.email.toLowerCase();
  const isPasswordChanged = password && String(password).trim().length > 0;
  if (isEmailChanged || isPasswordChanged) {
    if (!oldPassword || user.password !== oldPassword) {
      return res.status(400).json({ error: 'Password lama tidak sesuai. Verifikasi keamanan gagal.' });
    }
    if (isPasswordChanged) {
      user.password = String(password).trim();
    }
  }

  user.name = name || user.name;
  user.email = email;
  if (avatar !== undefined) user.avatar = avatar;
  if (bio !== undefined) user.bio = bio;

  saveServerData();

  const { password: _, ...safeUser } = user;
  res.json({
    success: true,
    user: safeUser,
    message: 'Kredensial berhasil diperbarui.',
  });
});

// Helper function for GitHub Upload Fallback
const performGitHubUpload = async (filename: string, base64Content: string) => {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'vswi';
  const repo = process.env.GITHUB_REPO || 'parenting-my-id';
  const branch = process.env.GITHUB_BRANCH || 'main';

  const cleanFilename = path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const filePath = `public/uploads/${timestamp}_${cleanFilename}`;
  const base64Clean = base64Content.replace(/^data:image\/\w+;base64,/, '');

  if (!token) {
    // Local filesystem save fallback for Dev environment
    try {
      const safeName = `${timestamp}_${cleanFilename}`;
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const localFilePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(localFilePath, Buffer.from(base64Clean, 'base64'));

      const localUrl = `/uploads/${safeName}`;
      return { success: true, url: localUrl, raw_url: localUrl, source: 'local' };
    } catch (err: any) {
      console.error('Local upload error:', err);
      throw new Error('Penyimpanan lokal gagal dan GITHUB_TOKEN tidak tersedia');
    }
  }

  const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Node-Fetch',
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
    return {
      success: true,
      url: rawUrl,
      raw_url: rawUrl,
      source: 'github',
    };
  } else {
    throw new Error(ghData?.message || 'Gagal menyimpan file ke GitHub storage');
  }
};

// Helper function to validate base64 image content (MIME & Magic Bytes)
const validateBase64Image = (base64Content: string): { isValid: boolean; error?: string; buffer?: Buffer } => {
  const allowedMimeRegex = /^data:(image\/jpeg|image\/png|image\/webp|image\/gif|image\/svg\+xml);base64,/;
  const isDataUri = base64Content.startsWith('data:');
  
  if (isDataUri && !allowedMimeRegex.test(base64Content)) {
    return { isValid: false, error: 'Tipe file tidak diizinkan. Hanya menerima JPG, PNG, WEBP, GIF, atau SVG.' };
  }

  const base64Clean = base64Content.replace(/^data:.*?;base64,/, '');
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Clean, 'base64');
  } catch (e) {
    return { isValid: false, error: 'Payload base64 tidak valid.' };
  }

  if (buffer.length === 0) {
    return { isValid: false, error: 'Payload file kosong.' };
  }

  // Magic bytes check
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
  const isWebp = buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
  
  const fileStartStr = buffer.slice(0, 100).toString('utf-8').trim().toLowerCase();
  const isSvg = fileStartStr.includes('<svg') || fileStartStr.includes('<?xml');

  if (!isJpeg && !isPng && !isGif && !isWebp && !isSvg) {
    return { isValid: false, error: 'Format file tidak didukung (Verifikasi magic bytes gagal).' };
  }

  return { isValid: true, buffer };
};

// 4. CLOUDINARY IMAGE UPLOAD PIPELINE (With Automatic GitHub & Local Fallback)
const handleCloudinaryUpload = async (req: any, res: any) => {
  const { filename, base64Content } = req.body;
  if (!filename || !base64Content) {
    return res.status(400).json({ error: 'Filename dan Base64 content wajib diisi' });
  }

  const cleanFilename = path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_');
  const base64Clean = base64Content.replace(/^data:.*?;base64,/, '');
  const approxBytes = Math.ceil((base64Clean.length * 3) / 4);
  if (approxBytes > 5 * 1024 * 1024) {
    return res.status(413).json({ error: 'Ukuran file melebihi batas maksimum 5MB' });
  }

  // File validation
  const validation = validateBase64Image(base64Content);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const folder = process.env.CLOUDINARY_FOLDER || 'parenting-my-id';

    // If Cloudinary keys are not fully provided, trigger GitHub/Local storage fallback
    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('Cloudinary credentials not configured, falling back to GitHub/Local storage pipeline...');
      const fallbackResult = await performGitHubUpload(cleanFilename, base64Content);
      return res.json(fallbackResult);
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const format = 'webp';
    const transformation = 'c_limit,w_1024,q_auto,f_webp'; // Enable WebP auto-optimization

    // Build signature string (alphabetically sorted parameters)
    const stringToSign = `folder=${folder}&format=${format}&timestamp=${timestamp}&transformation=${transformation}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

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
      return res.json({
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
      console.warn('Cloudinary upload failed, triggering GitHub/Local storage fallback:', cData?.error?.message || cData);
      const fallbackResult = await performGitHubUpload(cleanFilename, base64Content);
      return res.json(fallbackResult);
    }
  } catch (err: any) {
    console.error('Cloudinary upload exception, triggering GitHub/Local storage fallback:', err.message);
    try {
      const fallbackResult = await performGitHubUpload(cleanFilename, base64Content);
      return res.json(fallbackResult);
    } catch (fallbackErr: any) {
      return res.status(500).json({ error: 'Gagal mengunggah gambar melalui Cloudinary maupun Storage Fallback: ' + fallbackErr.message });
    }
  }
};

app.post('/api/upload-cloudinary', requireAuth(['admin']), handleCloudinaryUpload);
app.post('/api/upload', requireAuth(['admin']), handleCloudinaryUpload);

// 4b. GITHUB IMAGE UPLOAD PIPELINE (LEGACY FALLBACK - Protected)
app.post('/api/upload-github', requireAuth(['admin']), async (req, res) => {
  const { filename, base64Content } = req.body;
  if (!filename || !base64Content) {
    return res.status(400).json({ error: 'Filename dan Base64 content dibutuhkan' });
  }

  const cleanFilename = path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_');
  const cleanBase64 = base64Content.replace(/^data:.*?;base64,/, '');
  const approxBytes = Math.ceil((cleanBase64.length * 3) / 4);
  if (approxBytes > 5 * 1024 * 1024) {
    return res.status(413).json({ error: 'Ukuran file melebihi batas maksimum 5MB' });
  }

  // File validation
  const validation = validateBase64Image(base64Content);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const result = await performGitHubUpload(cleanFilename, base64Content);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal mengunggah file' });
  }
});

// 5. GEMINI AI ASSISTANT FOR PARENTING SEO (Protected with Smart Fallback)
app.post('/api/ai/generate-meta', requireAuth(['admin', 'editor', 'writer']), async (req, res) => {
  const { title, content } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

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
    return res.json(getSmartFallback(title, content));
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Anda adalah seorang Senior SEO Specialist & Parenting Content Strategist untuk website parenting.my.id.
Berdasarkan judul artikel: "${title}" dan isi: "${(content || '').slice(0, 500)}", hasilkan format JSON persis seperti ini tanpa markdown codeblock:
{
  "metaTitle": "${title} | Parenting.my.id",
  "metaDescription": "Deskripsi Meta SEO membujuk yang memuat kata kunci utama tentang parenting (120-155 karakter).",
  "tags": "5 kata kunci dipisahkan koma",
  "excerpt": "Ringkasan artikel 2 kalimat yang hangat dan empatik untuk orang tua Indonesia."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.json({ ...parsed, aiGenerated: true });
    }
  } catch (err) {
    console.error('Gemini error:', err);
  }

  return res.json(getSmartFallback(title, content));
});

// 6. DYNAMIC SITEMAP.XML (Clean index 0 with escapeXml)
app.get(['/sitemap.xml', '/sitemapper.xml'], (req, res) => {
  const xml = generateSitemapXml(mockPosts);

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.status(200).send(xml);
});


// 7. DYNAMIC RSS FEED.XML & RSS.XML
app.get(['/feed.xml', '/rss.xml'], (req, res) => {
  const rss = generateFeedXml(mockPosts);

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.status(200).send(rss);
});


// 7.A. DYNAMIC LLMS.TXT & LLMS-FULL.TXT ENDPOINTS (SYNCHRONIZED WITH FEED.XML ITEMS)
app.get('/llms.txt', (req, res) => {
  const feedXmlContent = generateFeedXml(mockPosts);
  const content = generateLlmsTxt(mockPosts, feedXmlContent);

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.status(200).send(content);
});

app.get('/llms-full.txt', (req, res) => {
  const content = generateLlmsFullTxt(mockPosts);

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.status(200).send(content);
});

//7.B. favicon:
app.get('/favicon.ico', (req, res) => {
  const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
  if (fs.existsSync(faviconPath)) {
    return res.sendFile(faviconPath);
  }
  return res.status(204).end();
});



// 8. SSR / STATIC HTML PRE-RENDERING FOR ARTICLE PAGES (/baca/:slug) FOR GOOGLEBOT & CRAWLERS
app.get('/baca/:slug', (req, res, next) => {
  const { slug } = req.params;
  const post = mockPosts.find((p) => p.slug === slug && p.status === 'published');

  if (!post) {
    return next(); // Pass to SPA fallback if not matching mock post
  }

  try {
    const siteUrl = 'https://parenting.my.id';
    const pageTitle = `${post.metaTitle || post.title} | Parenting.my.id`;
    const pageDesc = post.metaDescription || post.excerpt;
    const canonicalUrl = `${siteUrl}/baca/${post.slug}`;

    const heroImageSrc = optimizeUnsplashUrl(post.featuredImage, 700, 50, 'webp');
    const heroSrcSet = getUnsplashSrcSet(post.featuredImage, [400, 700], 50, 'webp');

    // Convert Markdown to sanitized HTML using marked
    let rawHtml = '';
    try {
      rawHtml = marked.parse(post.contentMarkdown || '', { gfm: true, breaks: true }) as string;
    } catch (mErr) {
      rawHtml = post.contentMarkdown || '';
    }

    const bodyHtml = sanitizeHtml(rawHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'span', 'figure', 'figcaption', 'strong', 'em', 'blockquote']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'class'],
        a: ['href', 'name', 'target', 'rel', 'class'],
        span: ['class'],
        div: ['class'],
        blockquote: ['class'],
        h1: ['class'],
        h2: ['class'],
        h3: ['class'],
        h4: ['class'],
        p: ['class'],
      },
    });

    const preRenderedBody = `
      <div class="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <header class="bg-white border-b border-slate-200 p-4">
          <div class="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" class="text-rose-600 font-black text-xl">👶 Parenting.my.id</a>
          </div>
        </header>
        <main class="max-w-4xl mx-auto px-4 py-8">
          <span class="inline-block px-3 py-1 bg-rose-100 text-rose-700 font-bold text-xs rounded-full mb-3">${post.category}</span>
          <h1 class="text-3xl md:text-5xl font-black text-slate-900 mb-4">${post.title}</h1>
          <p class="text-slate-600 italic border-l-4 border-rose-500 pl-3 py-1 mb-6">${post.excerpt}</p>
          <img src="${heroImageSrc}" ${heroSrcSet ? `srcset="${heroSrcSet}"` : ''} sizes="(max-width: 1024px) 100vw, 700px" alt="${post.title}" width="700" height="394" fetchpriority="high" decoding="async" class="w-full max-h-[450px] object-cover rounded-2xl mb-8 border border-slate-200" />
          <article class="prose prose-rose max-w-none text-slate-800 leading-relaxed">
            ${bodyHtml}
          </article>
        </main>
      </div>
    `;

    const datePub = post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString();
    const dateMod = post.updatedAt ? new Date(post.updatedAt).toISOString() : datePub;

    const schemaArticle = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
      'headline': post.title,
      'description': pageDesc,
      'image': [heroImageSrc],
      'datePublished': datePub,
      'dateModified': dateMod,
      'author': {
        '@type': 'Person',
        'name': 'Dr. Ratna Sari, M.Psi',
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

    const seoTags = `
      <title>${pageTitle}</title>
      <meta name="description" content="${pageDesc}" />
      <link rel="canonical" href="${canonicalUrl}" />
      <link rel="preload" as="image" href="${heroImageSrc}" ${heroSrcSet ? `imagesrcset="${heroSrcSet}" imagesizes="(max-width: 1024px) 100vw, 700px"` : ''} fetchpriority="high" />
      <meta property="og:title" content="${pageTitle}" />
      <meta property="og:description" content="${pageDesc}" />
      <meta property="og:image" content="${heroImageSrc}" />
      <meta property="og:url" content="${canonicalUrl}" />
      <meta property="og:type" content="article" />
      <meta name="twitter:card" content="summary_large_image" />
      <script type="application/ld+json">${JSON.stringify(schemaArticle)}</script>
    `;

    let htmlFilePath = path.join(process.cwd(), 'dist', 'index.html');
    if (!fs.existsSync(htmlFilePath)) {
      htmlFilePath = path.join(process.cwd(), 'index.html');
    }

    let htmlTemplate = fs.readFileSync(htmlFilePath, 'utf-8');
    htmlTemplate = htmlTemplate.replace(/<title>.*?<\/title>/i, seoTags);
    htmlTemplate = htmlTemplate.replace(/<div id="root"><\/div>/i, `<div id="root">${preRenderedBody}</div>`);

    res.header('Content-Type', 'text/html; charset=utf-8');
    return res.send(htmlTemplate);
  } catch (e) {
    console.error('Error pre-rendering HTML:', e);
    return next();
  }
});

// START EXPRESS + VITE SERVER
async function startServer() {
  // Ensure static llms.txt and sitemap.xml are generated on server boot
  try {
    generateStaticFiles(mockPosts);
  } catch (err) {
    console.error('[Startup] Failed to pre-generate static files:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom', // Ubah dari 'spa' ke 'custom' agar Vite tidak mencegat API/llms.txt/sitemap
    });
    app.use(vite.middlewares);

    // Fallback SPA khusus mode Development
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      // Abort jika URL adalah API, sitemap, feed, atau llms.txt
      const isStaticOrApi = url.startsWith('/api') || 
                      url.includes('.xml') || 
                      url.includes('llms.txt') || 
                      url.includes('favicon.ico') || 
                      url.includes('/uploads/');
if (isStaticOrApi) {
  return next();
}
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    
    // Sajikan file statis, tapi abaikan jika request menuju llms.txt, sitemap, atau api
    app.use(express.static(distPath, { index: false }));

    // Fallback SPA khusus mode Production
    app.use('*', (req, res, next) => {
      const url = req.originalUrl;
      const isStaticOrApi = url.startsWith('/api') || 
                      url.includes('.xml') || 
                      url.includes('llms.txt') || 
                      url.includes('favicon.ico') || 
                      url.includes('/uploads/');
if (isStaticOrApi) {
  return next();
}
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server parenting.my.id running on http://localhost:${PORT}`);
  });
}



startServer();
