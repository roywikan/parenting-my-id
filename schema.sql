-- ============================================================
-- SKEMA DATABASE CLOUDFLARE D1 (SQLite) UNTUK PARENTING.MY.ID
-- Eksekusi file ini langsung melalui Cloudflare D1 Console di Browser
-- ============================================================

-- Drop table jika sudah ada (Opsional untuk Reset)
DROP TABLE IF EXISTS autolinks;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;

-- 1. Tabel Users (Manajemen Admin & Penulis / Editor)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'writer')) NOT NULL DEFAULT 'writer',
    avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Posts (Artikel & Draf Parenting)
CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content_markdown TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    featured_image TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Pola Asuh',
    read_time_minutes INTEGER DEFAULT 5,
    author_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('draft', 'published')) NOT NULL DEFAULT 'draft',
    meta_title TEXT,
    meta_description TEXT,
    tags TEXT DEFAULT 'parenting, anak, keluarga',
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Tabel Autolinks (Otomatisasi SEO On-Page Internal Links)
CREATE TABLE autolinks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT UNIQUE NOT NULL,
    target_url TEXT NOT NULL,
    description TEXT,
    click_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk Optimasi Performa Query di Edge Cloudflare D1
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_autolinks_keyword ON autolinks(keyword);

-- ============================================================
-- DATA AWAL (SEED DATA) RESMI PARENTING.MY.ID
-- ============================================================

-- Seed Users (Password default: "admin123" & "writer123")
INSERT INTO users (id, email, password_hash, name, role, avatar, bio) VALUES
(1, 'admin@parenting.my.id', '$2a$10$wT0Xo.gO5lZ7cW5q7S9g.O3f/1wH1sA/yGZ1zY2zX3w4v5u6t7s8r', 'Dr. Ratna Sari, M.Psi', 'admin', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80', 'Psikolog anak dan praktisi parenting terkemuka di Indonesia.'),
(2, 'penulis@parenting.my.id', '$2a$10$xU1Yp.hP6mA8dX6r8T0h.P4g/2xI2tB/zHA2zA3zA4x5w6v7w8t9s', 'Ahmad Zulkarnain, S.Ked', 'writer', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', 'Edukator kesehatan anak dan spesialis gizi tumbuh kembang balita.');

-- Seed Autolinks (Sistem Auto-Linking SEO On-Page)
INSERT INTO autolinks (keyword, target_url, description) VALUES
('pola asuh', '/baca/panduan-lengkap-pola-asuh-demokratis-anak-masa-kini', 'Panduan utama strategi pola asuh positif.'),
('balita', '/baca/5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita', 'Edukasi dan rekomendasi aktivitas balita.'),
('stunting', '/baca/mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk', 'Pencegahan stunting dan nutrisi emas anak.'),
('asi eksklusif', '/baca/mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk', 'Pentingnya gizi dan ASI eksklusif.'),
('sensory play', '/baca/5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita', 'Aktivitas stimulasi sensori anak usia dini.'),
('gizi anak', '/baca/mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk', 'Nutrisi seimbang untuk tumbuh kembang optimal.');

-- Seed Posts (Artikel Parenting Ber Kualitas Tinggi)
INSERT INTO posts (id, title, slug, content_markdown, excerpt, featured_image, category, read_time_minutes, author_id, status, meta_title, meta_description, tags, views) VALUES
(1, 
'Panduan Lengkap Pola Asuh Demokratis untuk Mendidik Anak Tangguh Masa Kini', 
'panduan-lengkap-pola-asuh-demokratis-anak-masa-kini', 
'## Mengapa Pola Asuh Demokratis Sangat Penting?

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
- **Validasi Emosi:** Saat anak menangis atau marah, katakan *"Ibu tahu kamu kecewa, mari kita tenang dulu lalu cari solusinya bersama."*', 
'Pola asuh demokratis menggabungkan kasih sayang, aturan yang konsisten, dan komunikasi terbuka. Simak strategi praktis penerapannya di rumah.', 
'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80', 
'Pola Asuh', 
6, 
1, 
'published', 
'Panduan Lengkap Pola Asuh Demokratis Anak | Parenting.my.id', 
'Pelajari panduan penerapan pola asuh demokratis untuk membentuk karakter anak yang mandiri, percaya diri, dan berani di era digital.', 
'pola asuh, psikologi anak, komunikasi keluarga, karakter anak', 
248),

(2, 
'5 Aktivitas Sensory Play Seru untuk Melatih Motorik Halus Balita di Rumah', 
'5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita', 
'## Pentingnya Sensory Play untuk Perkembangan Balita

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

Jika anak sudah menunjukkan tanda-tanda kelelahan, istirahatlah dan pastikan kebutuhan **gizi anak** serta asupan nutrisi hariannya sudah terpenuhi dengan baik.', 
'Temukan 5 ide permainan sensory play mudah dan hemat bahan untuk mengasah indera serta ketangkasan motorik balita di rumah.', 
'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1200&q=80', 
'Tumbuh Kembang', 
4, 
2, 
'published', 
'5 Aktivitas Sensory Play Melatih Motorik Balita | Parenting.my.id', 
'Panduan praktis 5 permainan sensori (sensory play) hemat untuk meningkatkan stimulasi indera dan kekuatan motorik balita di rumah.', 
'sensory play, balita, motorik halus, permainan edukasi', 
182),

(3, 
'Mengenal Bahaya Stunting dan Cara Pencegahannya Sejak 1000 Hari Pertama Kehidupan', 
'mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk', 
'## Masalah Stunting di Indonesia: Apa yang Perlu Orang Tua Ketahui?

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

Ajak juga **balita** aktif bergerak lewat permainan ringan seperti **sensory play** untuk menjaga daya tahan tubuh dan kebugaran fisiknya.', 
'Stunting berpengaruh besar pada kecerdasan anak. Pelajari langkah pencegahan stunting melalui pemberian ASI eksklusif dan MPASI tinggi protein.', 
'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1200&q=80', 
'Kesehatan & Gizi', 
7, 
1, 
'published', 
'Cara Mencegah Stunting pada 1000 HPK Anak | Parenting.my.id', 
'Edukasi komprehensif pencegahan stunting, manfaat ASI eksklusif, serta pola gizi sehat untuk anak tumbuh optimal.', 
'stunting, asi eksklusif, gizi anak, MPASI, kesehatan balita', 
310);
