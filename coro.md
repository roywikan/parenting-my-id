# 🚀 Panduan Lengkap Setup, Penggunaan, & Dokumentasi Teknikal Blog Engine `parenting.my.id`

Sistem Blog Engine modern, ultra-cepat, dan SEO-friendly ini beroperasi sepenuhnya secara **Cloud-Native** menggunakan **Cloudflare Pages / Workers**, **Cloudflare D1 (Serverless SQLite)**, **Cloudinary API (Master Admin)**, **Unsplash API/Integration**, dan **GitHub REST API**.

Penulis dan Admin dapat mengelola artikel, gambar, SEO meta, serta konfigurasi situs secara interaktif dari browser desktop maupun mobile.

---

## 📋 Fitur Utama & Kepatuhan Google AdSense Publisher

1. **Halaman Legalitas Wajib Google AdSense (Complete Legal Compliance):**
   - **`/privacy` (Kebijakan Privasi):** Penjelasan Cookie, Google DoubleClick DART Cookie, Opsi Opt-out periklanan terarah, vendor periklanan pihak ketiga, dan log files.
   - **`/about` (Tentang Kami):** Profil situs, 4 pilar utama edukasi redaksi, standar E-E-A-T, dan transparansi pengelola.
   - **`/contact` (Hubungi Kami):** Formulir kontak interaktif, email resmi redaksi (`redaksi@parenting.my.id`), lokasi, dan jaminan waktu respon 1x24 jam.
   - **`/disclaimer` (Penafian):** Batasan tanggung jawab informasi medis/pengasuhan, tautan eksternal, dan akurasi materi.
   - **`/terms` (Syarat & Ketentuan):** Perlindungan hak cipta DMCA, aturan larangan plagiarisme/copy-paste, dan batasan usia.

2. **Infrastruktur Periklanan High-CTR AdSense:**
   - Header Top Banner Slot
   - In-Feed & Inside Article Ad Slots
   - Floating Sticky Footer Ad Banner with Toggle & Close
   - Custom Scripts Injector untuk Kode Auto Ads Google AdSense

3. **Infrastruktur Synchronized Dynamic Generators (`llms.txt`, `sitemap.xml`, `feed.xml`):**
   - **Real-Time Database Fetch:** Seluruh artikel yang terbit di Cloudflare D1 langsung terrefleksi secara otomatis pada endpoint `/llms.txt`, `/sitemap.xml`, dan `/feed.xml`.
   - **GitHub Auto-Sync:** Ketika artikel terbit, diperbarui, atau dihapus dari Panel Admin (`/admin`), file statis di repositori GitHub di-update secara otomatis via GitHub REST API.

---

## 📋 Prasyarat (100% Gratis)
1. Akun **GitHub** ([github.com](https://github.com))
2. Akun **Cloudflare** ([cloudflare.com](https://cloudflare.com))
3. Akun **Cloudinary** ([cloudinary.com](https://cloudinary.com)) untuk manajemen media & WebP
4. Domain **parenting.my.id** (atau domain pribadi Anda) yang DNS-nya diarahkan ke Cloudflare.

---


## 🍴 LANGKAH 1: Cloning / Fork Repo GitHub & Token Akses

### A. Fork / Clone Repositori
1. Buka repositori kode di GitHub ([github.com/roywikan/parenting-my-id](https://github.com/roywikan/parenting-my-id)).
2. Klik tombol **Fork** di pojok kanan atas untuk menyalin repositori ke akun GitHub Anda.
3. Beri nama repositori, misalnya `parenting-my-id`.
4. *(Opsional)* Jika ingin mengedit kode di laptop secara lokal, jalankan perintah clone di terminal Anda:
   ```bash
   git clone https://github.com/<username-github-anda>/parenting-my-id.git
   cd parenting-my-id
   npm install
   npm run dev
   ```

### B. Membuat Personal Access Token (PAT) GitHub
Personal Access Token digunakan agar backend CMS di Cloudflare Worker dapat mengunggah file gambar fisik ke `/public/uploads/` dan menyinkronkan file konfigurasi (`site_config.json`, `llms.txt`) secara otomatis ke GitHub.

1. Buka [github.com/settings/tokens](https://github.com/settings/tokens).
2. Klik **Generate new token (classic)**.
3. Isikan Note: `Cloudflare Parenting CMS Token`.
4. Beri centang pada centang hak akses **`repo`** (Full control of private repositories).
5. Klik **Generate token**.
6. Salin kode token yang muncul (contoh: `ghp_xxxxxxxxxxxxxxxxxxxx`). *Simpan token ini karena tidak akan ditampilkan lagi.*

---

## ☁️ LANGKAH 2: Instalasi di Cloudflare (DNS, D1, Workers/Pages, Secrets)

### A. Konfigurasi DNS & Custom Domain
1. Masuk ke Dashboard Cloudflare ([dash.cloudflare.com](https://dash.cloudflare.com)).
2. Tambahkan domain Anda (contoh: `parenting.my.id`) dan ikuti petunjuk pengubahan Nameservers di registrar domain Anda.
3. Pastikan SSL/TLS Encryption Mode disetel ke **Full** atau **Flexible**.

### B. Membuat Database Cloudflare D1
1. Di Dashboard Cloudflare, buka menu **Workers & Pages** -> **D1 SQL Database**.
2. Klik tombol **Create Database**.
3. Isi Nama Database: `parenting-db`, lalu klik **Create**.
4. Salin **Database ID** yang dibuat (contoh: `a1b2c3d4-e5f6-7890-abcd-1234567890ab`).
5. Masuk ke tab **Console** pada database `parenting-db` Anda.
6. Tempel skrip SQL berikut untuk membuat skema tabel awal, lalu klik **Execute**:

```sql
-- 1. Tabel Users / Penulis & Tim Editorial
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  role TEXT DEFAULT 'writer', -- Menerima: 'admin', 'editor', 'writer'
  avatar TEXT,
  bio TEXT,
  social_instagram TEXT,
  social_linkedin TEXT,
  social_website TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Posts / Artikel CMS
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
  status TEXT DEFAULT 'draft', -- Menerima: 'draft', 'pending_approval', 'published', 'rejected'
  rejection_reason TEXT,
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT,
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- 3. Tabel Autolinks
CREATE TABLE IF NOT EXISTS autolinks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  description TEXT,
  click_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Site Config / Pengaturan Global Website
CREATE TABLE IF NOT EXISTS site_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  config_json TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Comments / Komentar Diskusi
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_avatar TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'approved',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### ⚡ Skrip Migrasi SQL (Bila Meng-upgrade Database D1 Lama)
Jika Anda meng-upgrade database Cloudflare D1 yang **sudah dibuat sebelumnya** dan mengalami kendala constraint `CHECK constraint failed: status IN ('draft', 'published')`, jalankan skrip perbaikan berikut di Console Cloudflare D1 untuk memperbarui struktur tabel `posts`:

```sql
-- 1. Tambahkan kolom rejection_reason jika belum ada
ALTER TABLE posts ADD COLUMN rejection_reason TEXT;

-- 2. Jika tabel D1 Anda memiliki pembatasan CHECK constraint kaku pada status ('draft', 'published'), jalankan skrip migrasi berikut di D1 Console:
ALTER TABLE posts RENAME TO posts_old;

CREATE TABLE posts (
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO posts (id, title, slug, content_markdown, excerpt, featured_image, category, read_time_minutes, author_id, co_author_ids, status, rejection_reason, meta_title, meta_description, tags, views, created_at, updated_at)
SELECT id, title, slug, content_markdown, excerpt, featured_image, category, read_time_minutes, author_id, co_author_ids, status, rejection_reason, meta_title, meta_description, tags, views, created_at, updated_at
FROM posts_old;

DROP TABLE posts_old;
```

### C. Deploy ke Cloudflare Pages / Workers
1. Kembali ke Cloudflare Dashboard -> **Workers & Pages**.
2. Klik **Create application** -> Tab **Pages** -> **Connect to Git**.
3. Hubungkan akun GitHub Anda dan pilih repositori `parenting-my-id`.
4. Klik **Begin setup**.
5. Pada bagian **Build settings**:
   - **Framework preset**: `Vite` (atau `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Buka bagian **Environment variables (advanced)** dan tambahkan variabel rahasia berikut:
   - `SITE_URL`: `https://parenting.my.id`
   - `CLOUDINARY_CLOUD_NAME`: `harga-promo-diskon` *(atau nama cloud Cloudinary Anda)*
   - `CLOUDINARY_API_KEY`: `945558876687176` *(API Key Cloudinary Master Admin)*
   - `CLOUDINARY_API_SECRET`: `6TBtS1kzFgoNg_4SHmzmSImyPlE` 🔒 *(Pilih tipe Secret / Encrypted)*
   - `CLOUDINARY_FOLDER`: `parenting-my-id` *(Folder penyimpanan gambar)*
   - `GITHUB_TOKEN`: *(Kode token GitHub `ghp_...` dari Langkah 1B)*
   - `GITHUB_OWNER`: *(Username GitHub Anda)*
   - `GITHUB_REPO`: `parenting-my-id`
   - `GITHUB_BRANCH`: `main`
   - `JWT_SECRET`: *(String acak rahasia untuk otentikasi session)*
7. Klik **Save and Deploy**.

### D. Menghubungkan D1 Binding & Custom Domain
1. Setelah deployment pertama selesai, buka proyek Pages Anda di Cloudflare -> Tab **Settings** -> **Functions**.
2. Gulir ke bawah ke bagian **D1 database bindings**.
3. Klik **Add binding**:
   - **Variable name**: `DB`
   - **D1 database**: Pilih `parenting-db`
4. Klik **Save**. *(Lakukan re-deploy project di tab Deployments jika diperlukan agar binding aktif).*
5. Masuk ke tab **Custom domains** -> Klik **Set up a custom domain**.
6. Ketik `parenting.my.id` dan klik **Continue**. Cloudflare akan memverifikasi DNS dan mengaktifkan sertifikat SSL HTTPS.

### E. Penanganan Cache Cloudflare & Penerbitan Artikel ("Setujui & Terbitkan")
Apabila terjadi kondisi di mana notifikasi penerbitan berhasil muncul namun status artikel belum langsung ter-update di publik, hal ini umumnya disebabkan oleh dua faktor pada lingkungan Cloudflare:
1. **Cloudflare Edge Cache / Browser HTTP Cache**:
   - Fungsi API backend Cloudflare Pages Function `/api/posts` telah dilengkapi dengan header pencegah cache ketat: `Cache-Control: no-cache, no-store, must-revalidate, max-age=0`.
   - Permintaan data artikel di peramban secara otomatis menambahkan parameter *cache buster* timestamp (`/api/posts?_t=TIMESTAMP`) untuk memaksa Cloudflare selalu mengambil data artikel paling segar (*fresh state*) dari D1 Database.
2. **Pencocokan ID & Slug pada Database D1**:
   - Query `UPDATE` di Cloudflare D1 sekarang melakukan perbandingan fleksibel pada ID (tipe *integer* maupun *string*) serta kecocokan `slug` artikel (`WHERE (id = ? OR id = ?) OR slug = ?`).
   - Apabila artikel belum ada di D1 (misalnya draf lama sebelum D1 aktif), sistem secara otomatis melakukan `INSERT INTO posts` dengan status `published`, sehingga editan tidak pernah hilang.

---

## 🎨 LANGKAH 3: Logika Tampilan & Tema (Dark/Light Mode)

### **Hierarki & Kebijakan Tema (Admin Config Precedence)**
Sistem menentukan tema tampilan situs berdasarkan aturan baku terpusat:
- **Pengaturan Konfigurasi Situs oleh Admin Adalah Otoritas Utama**: Preferensi mode gelap/terang (*dark/light mode*) dari sistem operasi atau perangkat peramban pengguna **wajib tunduk dan patuh sepenuhnya** pada konfigurasi yang ditentukan oleh Admin di Portal Admin (`/admin`).
- **Mode Tampilan Admin (`default_theme_mode`)**:
  - Jika Admin memilih `light` ➔ Situs **wajib dan dipaksa** tampil dalam Mode Terang (Light Mode). Preferensi perangkat pengguna diabaikan.
  - Jika Admin memilih `dark` ➔ Situs **wajib dan dipaksa** tampil dalam Mode Gelap (Dark Mode). Preferensi perangkat pengguna diabaikan.
  - Jika Admin memilih `auto` ➔ Sistem baru akan membaca dan menyesuaikan diri dengan preferensi tema peramban/perangkat pengguna (`prefers-color-scheme`).
- **Toggle Mode Tema (`enable_theme_toggle`)**:
  - Jika Admin mengaktifkan opsi toggle (`enable_theme_toggle = true`), tombol pengubah tema matahari/bulan di header aktif dan memungkinkan pengguna mengganti tema secara sementara di browser mereka.
  - Jika Admin menonaktifkan opsi toggle (`enable_theme_toggle = false`), tombol pengubah tema disembunyikan dan peramban pengunjung tidak diizinkan menimpa tema yang telah ditentukan oleh Admin.

---

## 🔑 LANGKAH 4: Panduan Integrasi & Keamanan Cloudinary untuk Webmaster

Mekanisme unggah gambar artikel pada CMS memanfaatkan **Cloudinary REST API** server-side pipeline (`/api/upload-cloudinary` & `/api/upload`):

### 1. Kebutuhan Teknis & Izin Master Admin pada API Key Cloudinary
Untuk mengaktifkan fitur unggah foto, preview popup, dan generasi sintaks Markdown body artikel secara mulus, Webmaster wajib memastikan pengaturan berikut:

1. **Akses Dashboard Cloudinary**:
   - Login ke akun [Cloudinary Console](https://console.cloudinary.com/).
   - Catat **Cloud Name**, **API Key**, dan **API Secret**.
2. **⚠️ KEBUTUHAN WAJIB: API Key Berperan Master Admin (Write Access)**:
   - API Key Cloudinary yang digunakan **WAJIB MEMILIKI AKSES PERAN MASTER ADMIN / HAK AKSES WRITE (`actions=["create"]`)**.
   - **Catatan Penting**: Apabila API Key yang dimasukkan diset *Read-Only* atau dibatasi, server Cloudinary akan menolak proses unggah gambar dengan pesan kesalahan `Request forbidden due to missing permissions (actions=["create"])`.
   - **Cara Memeriksa / Mengatur di Cloudinary**:
     Buka **Cloudinary Console** ➔ **Settings** (Ikon Roda Gigi) ➔ **API Keys** ➔ Pastikan API Key yang digunakan memiliki peranan/role **Master Admin** atau hak akses penuh untuk mengunggah & mengelola aset media.
3. **Penyimpanan Folder Media**:
   - Tentukan folder target pada variabel `CLOUDINARY_FOLDER` (contoh: `parenting-my-id`) agar seluruh aset foto artikel tersimpan rapi di direktori terdedikasi.

### 2. Langkah-Langkah Menyimpan Kredensial Cloudinary Secara Aman di Cloudflare (Secrets)
Keamanan kredensial adalah prioritas utama (Security First). **API Secret Cloudinary** tidak boleh terekspos di kode frontend peramban maupun repositori GitHub publik.

**Petunjuk Langkah demi Langkah Menyimpan di Cloudflare Pages / Workers**:
1. Masuk ke [Cloudflare Dashboard](https://dash.cloudflare.com/) ➔ **Workers & Pages**.
2. Pilih nama proyek Pages Anda (contoh: `parenting-my-id`).
3. Klik tab **Settings** ➔ pilih menu **Environment variables**.
4. Klik **Add variable** / **Edit variables** dan masukkan variabel rahasia berikut:
   - `CLOUDINARY_CLOUD_NAME` = `harga-promo-diskon` *(nama cloud Anda)*
   - `CLOUDINARY_API_KEY` = `945558876687176` *(API Key Master Admin Anda)*
   - `CLOUDINARY_API_SECRET` = `6TBtS1kzFgoNg_4SHmzmSImyPlE` 🔒 **(PILIH TIPE: Encrypted / Secret)**
   - `CLOUDINARY_FOLDER` = `parenting-my-id`
5. Klik **Save**.
6. **Alasan Keamanan**:
   - Variabel bertipe **Encrypted / Secret** dienkripsi secara ketat di infrastruktur Cloudflare dan nilainya tersembunyi total dari siapapun yang mengakses dashboard.
   - Hanya fungsi server-side Cloudflare Pages Functions (`/functions/api/[[path]].ts`) yang dapat membaca kredensial ini secara internal saat memproses unggahan gambar. Client JS peramban pengunjung **tidak dapat mengintip** `CLOUDINARY_API_SECRET`.

### 3. Pemrosesan WebP Otomatis & Dimensi Tablet
- Setiap foto yang diunggah dikonversi secara otomatis menjadi format **`.webp`** ultra-ringan.
- Lebar gambar dibatasi maksimal **1024px** (selebar layar tablet) melalui transformasi Cloudinary `c_limit,w_1024,q_auto`.
- Ukuran file dibatasi maksimal **3 MB** pada validasi peramban sebelum diunggah.
- **Automatic Fallback Pipeline**: Jika server Cloudinary mengalami kendala jaringan, sistem secara otomatis mengalihkan penyimpanan foto ke GitHub Storage (`public/uploads/`).

---

## ⚙️ LANGKAH 5: Kustomisasi Pengaturan & Navigasi di Admin Panel (`/admin`)

### A. Penyimpanan Konfigurasi Multi-Layer & Permanen
Setiap perubahan konfigurasi yang Anda simpan di **Config Situs** (Portal Admin) ditulis dan disimpan secara multi-layer (berlapis) ke 3-4 lokasi utama secara sinkron (*dual-write persistence*):

1. **Peramban Lokal (`localStorage`)**:
   - **Lokasi**: Browser pengunjung (`localStorage.getItem('parenting_site_config')`).
   - **Fungsi**: Disimpan secara instan agar perubahan tampilan (Theme, Navigasi, Badge, Banner) langsung terasa seketika (*instant preview*) tanpa *delay* jaringan.
2. **Database Cloudflare D1 (Tabel `configs`)**:
   - **Lokasi**: Tabel SQL `configs` pada Cloudflare D1 Database.
   - **Fungsi**: Merekam seluruh 65+ parameter sebagai *single source of truth* permanen di server edge. Tidak akan hilang meskipun cache browser dihapus.
3. **File Server Disk (`public/site_config.json` & `dist/site_config.json`)**:
   - **Lokasi**: `/public/site_config.json` dan `/dist/site_config.json`.
   - **Fungsi**: Acuan (*fallback*) static CDN utama untuk pengunjung baru yang belum memiliki cache lokal.
4. **Sinkronisasi Otomatis ke Repository GitHub (Opsional bila GitHub Token aktif)**:
   - **Fungsi**: Memperbarui file `public/site_config.json` di repositori Git Anda melalui komit otomatis untuk riwayat versi (*version control*).

---

### B. Visual Navigation Builder (Pengelola Navigasi Visual)
Tanpa perlu mengetik struktur JSON manual, Portal Admin dilengkapi dengan **Visual Navigation Builder** untuk 4 lokasi menu utama:

1. **Top Bar Navigation (Header Desktop & Tablet)**:
   - Mengatur daftar menu utama di bagian atas website untuk layar lebar/laptop.
2. **Menu Hamburger (Mobile Drawer Navigation)**:
   - Mengatur menu khusus yang tampil ketika pengunjung menekan tombol hamburger (☰) di smartphone.
3. **Footer Navigation (Tautan Navigasi Platform)**:
   - Mengatur tautan halaman penting di bagian bawah website (seperti Kebijakan Privasi, Syarat & Ketentuan, Sitemap XML, RSS Feed).
4. **Setting Kategori Artikel Footer (Tautan Kategori Footer)**:
   - Mengatur daftar kategori artikel interaktif di footer.

---

### C. Pengaturan Mesin Komentar (Comment Engine Modes)
Portal Admin menyediakan 4 opsi fleksibel untuk pengaturan kolom komentar artikel (`comment_engine_mode`):
1. **🔥 Keduanya Aktif (`both`)**: Form komentar internal Native (D1) dan Widget Cusdis Embed aktif bersamaan.
2. **⚡ Native D1 Saja (`native`)**: Menggunakan form komentar bawaan website yang cepat, aman dengan Anti-XSS, dan tersimpan langsung di tabel SQL `comments` Cloudflare D1.
3. **💬 Cusdis Embed Saja (`cusdis`)**: Hanya menampilkan widget komentar embed Cusdis pihak ketiga.
4. **🚫 Nonaktifkan (`none`)**: Menutup kolom komentar secara menyeluruh di semua artikel.

---

### D. Hak Akses Berbasis Peran (Role-Based Access Control - RBAC)
- 🚫 **Dilarang Akses (Hanya untuk Admin / `role: 'admin'`)**:
  - Kelola Tim & Penulis, Auto-Linking Engine, SEO Inspector, Configs Komentar, Configs Terpusat Website.
- ✅ **Hak Akses Penulis (`role: 'writer'`)**:
  - Menulis, mengedit, dan mengelola artikel milik sendiri di Rich WYSIWYG Editor.
  - Mengubah profil pribadi (nama, bio, avatar, password) di Tab Profil & Password Saya.

---

## 🎨 LANGKAH 6: Panduan Kustomisasi 10 Model Display Frontpage / Home Layout

Sistem **parenting.my.id** menyediakan **10 Pilihan Model Tampilan Beranda (Frontpage Display Modes)** yang dapat diganti secara instan via Portal Admin (`/admin` ➔ Tab Config Situs):

1. **Default Blog & Majalah Parenting**: Tata letak portal berita/majalah lengkap dengan hero banner, filter kategori, auto-links & arsip grid artikel.
2. **Event, Konferensi & Seminar**: Tata letak kegiatan/summit nasional dengan hitung mundur (*countdown timer*), narasumber, agenda sesi, dan formulir pendaftaran/tiket WA.
3. **Campaign, Petisi & Aksi Sosial**: Halaman advokasi sosial (misal: Gerakan Bebas Stunting) dengan target donasi interaktif, petisi, dan pilar aksi.
4. **Microsite / Bio Links**: Halaman mobile-first tautan cepat (WhatsApp Konsultasi, E-Book Gratis, Grup Telegram Parenting, Podcast).
5. **Portofolio Karya & Riset**: Showcase program riset, buku panduan & karya dengan filter topik visual dan metrik dampak.
6. **Personal Branding Pakar / Dokter**: Profil resmi dokter anak/psikolog dengan spotlight sertifikasi, jadwal praktek/konsultasi privat, dan materi terpublikasi.
7. **Corporate & B2B Profile**: Profil layanan korporat B2B (*Employee Assistance Program*, *Daycare* kantor) lengkap dengan proposal RFQ.
8. **Product Landing Page**: Landing page komersial paket produk MPASI & stimulasi anak lengkap dengan rating bintang, pricing tier, dan order WA.
9. **Iklan Baris Koran Jaman Dulu (Vintage Newspaper Classifieds)**: Tata letak bernuansa koran cetak klasik nostalgia dengan frame ganda antik dan kolom iklan baris.
10. **Knowledge Base & Ensiklopedia**: Pusat bantuan dan direktori panduan pengasuhan terstruktur berdasarkan topik terpadu (Gizi, Emosi, Kesehatan, Tumbuh Kembang).

---

## 🔒 LANGKAH 7: Fitur Keamanan Eksklusif (Security First Architecture)

Sistem telah dilengkapi dengan 3 lapisan proteksi keamanan aktif untuk menjamin stabilitas area Portal Admin (`/admin`):
1. **Proteksi Anti Brute Force**: Pembatasan batas percobaan login (*rate limiting*) pada endpoint otentikasi admin `/api/login` untuk mencegah serangan kamus atau peretasan kata sandi secara masal.
2. **Proteksi Anti XSS (Cross-Site Scripting)**: Seluruh input teks, deskripsi, komentar, dan konten markdown dibersihkan secara otomatis (*sanitized*) sebelum disimpan ke database D1 atau dirender ke DOM peramban.
3. **Proteksi Anti Leech & Hotlinking**: Endpoint gambar dan file pendukung menggunakan validasi referer dan header keaslian untuk mencegah pencurian bandwidth CDN oleh situs pihak ketiga.

---

## 🤖 LANGKAH 8: Optimasi SEO Googlebot & Aksesibilitas Mesin Pencari

Seluruh halaman dan endpoint render statis/dinamis telah diuji dan digaransi **100% ramah SEO (SEO-Friendly)** dan dapat di-crawl oleh Googlebot tanpa error:
- **Homepage (`/`)**: Mendukung SSR / static rendering dengan tag meta OpenGraph lengkap dan structured data JSON-LD.
- **Kategori (`/category/[slug]`)**: Render HTML bersih tanpa dependensi JavaScript yang menghambat crawler.
- **Tag (`/tags/[tag]`)**: Indeks kata kunci terstruktur untuk pengelompokan topik artikel.
- **Detail Artikel (`/baca/[slug]`)**: Menghasilkan skema `BlogPosting` dan `BreadcrumbList` otomatis.
- **File XML & Teks Mesin (Otomatis Terupdate dalam Satu Gerakan)**: `/sitemap.xml`, `/feed.xml`, `/robots.txt`, `/llms.txt`, dan `/llms-full.txt` dirender secara real-time dari database D1. Saat artikel terbit, diperbarui, atau dihapus, file fisik di `public/llms.txt`, `public/llms-full.txt`, `public/sitemap.xml`, dan `public/feed.xml` secara otomatis dikomit langsung ke repositori GitHub via `syncStaticFilesToGitHub`.

---

## ✍️ LANGKAH 9: Panduan Penulis — Mengisi Artikel & Gambar

Penulis artikel memiliki akses ke **Editor WYSIWYG Rich Editor** lengkap dengan AI Assistant, SEO Auditor, dan Pengelola Gambar.

### A. Menentukan Gambar Sampul (Featured Image)
1. **Galeri Unsplash.com Terintegrasi**: Pilih dari preset kategori parenting atau cari kata kunci custom.
2. **Upload File / Cloudinary**: Unggah file dari laptop/HP (Max 3 MB) yang otomatis dikonversi ke WebP max 1024px.
3. **Direct URL**: Tempel alamat URL gambar eksternal.

### B. Mengunggah & Menyisipkan Gambar ke Dalam Body Artikel
1. Tempatkan kursor teks di baris yang diinginkan.
2. Klik ikon **Gambar** pada toolbar editor.
3. Pilih file gambar, Unsplash, atau URL Direct.
4. Tampilan popup preview instant akan muncul dengan opsi:
   - **Sisipkan Langsung ke Body Artikel** (Menyisipkan markdown `![Alt](url)` di kursor).
   - **Salin Markdown** / **Salin URL WebP**.
   - **Jadikan Gambar Sampul Artikel**.
5. Gambar otomatis memiliki atribut `loading="lazy"` dan `decoding="async"`.

---

## 🏷️ LANGKAH 10: Petunjuk Cara Membuat & Mengelola Kategori Artikel Baru

1. **Membuat Kategori Baru Saat Penulisan Artikel**: Ketikkan nama kategori baru langsung pada kolom input **Kategori Artikel** di editor. Setelah artikel diterbitkan, kategori otomatis terdaftar di sistem.
2. **Penampilan Kategori di Beranda**: Kategori aktif otomatis muncul pada **Bilah Filter Kategori** di Beranda.
3. **Mengatur Kategori Default**: Ditentukan di Portal Admin (`/admin`) ➔ Tab Pengaturan Situs.

---

## 💡 LANGKAH 12: Panduan Admin (Do, Don'ts & Tips) Pengisian Custom JS/CSS Snippets, Meta Tags & Banner Iklan

Portal Admin (`/admin` ➔ Tab **Config Situs**) dilengkapi dengan 3 kelompok fitur penyisipan kode kustom yang fleksibel. Agar situs tetap aman, cepat (PageSpeed score tinggi), dan bebas dari error tampilan, ikuti panduan **Do's**, **Don'ts**, dan **Tips Teknis** berikut:

---

### A. Custom JS / CSS Snippet Inserter (Head & Body)

Penyisipan script JavaScript pelacak (Google Analytics `gtag.js`, Facebook Pixel, Google Tag Manager) serta kode CSS kustom tambahan.

- **✅ DO'S (Sangat Direkomendasikan)**:
  1. **Sertakan Tag Pembungkus HTML Lengkap**: Selalu bungkus kode JavaScript dengan `<script>...</script>` dan kode CSS dengan `<style>...</style>`.
  2. **Gunakan Atribut Async / Defer**: Untuk script pelacak seperti Google Analytics, selalu sertakan atribut `async` atau `defer` agar peramban tidak menunda pemuatan visual halaman (*non-blocking*).
  3. **Manfaatkan Toggle Switch**: Gunakan toggle switch **Aktif/Nonaktif** untuk mematikan atau menguji script tanpa harus menghapus kode yang telah diketik.
  4. **Gunakan Tombol "Muat Sample Dummy JS/CSS"**: Klik tombol sampel untuk melihat contoh sintaksis yang valid dan siap pakai.

- **🚫 DON'TS (Larangan & Hal yang Harus Dihindari)**:
  1. **Jangan Masukkan Teks Polos Tanpa Tag**: Memasukkan kode JavaScript atau CSS langsung tanpa tag `<script>` atau `<style>` akan menyebabkan teks tersebut bocor dan muncul sebagai tulisan mentah di halaman web.
  2. **Jangan Meng-copy Script dari Sumber Tak Terpercaya**: Hindari menyisipkan script JavaScript acak dari domain tidak dikenal untuk mencegah serangan *Cross-Site Scripting* (XSS) atau kebocoran data.
  3. **Jangan Menyisipkan Script Synchronous Heavy**: Hindari script yang melakukan loop panjang atau manipulasi DOM berlebihan yang dapat menurunkan skor LCP dan INP pada Google PageSpeed.

- **💡 TIPS TEKNIS**:
  Sistem AI Studio menyuntikkan (*inject*) node `<script>` dan `<style>` secara dinamis ke `document.head` (Head Snippet) dan sebelum penutup `document.body` (Body Snippet). Saat toggle dinonaktifkan, seluruh elemen yang disuntikkan akan dibersihkan (*cleanup*) secara instan dari memori DOM.

---

### B. Custom HTML Meta Tag Snippet

Penyisipan tag meta HTML khusus untuk verifikasi kepemilikan domain (seperti Google Search Console, Yandex Webmaster, Bing Webmaster, Pinterest verification).

- **✅ DO'S (Sangat Direkomendasikan)**:
  1. **Gunakan Tag Meta Standar HTML5**: Contoh yang benar: `<meta name="google-site-verification" content="TOKEN_KODE_VERIFIKASI" />`.
  2. **Multi Meta Tag**: Anda dapat memasukkan beberapa tag meta sekaligus (misal Google Search Console + Yandex) dalam satu kotak textarea dengan memisahkan tiap tag di baris baru.
  3. **Gunakan Tombol "Muat Sample Dummy Meta Tag"**: Memudahkan verifikasi format meta tag yang benar.

- **🚫 DON'TS (Larangan & Hal yang Harus Dihindari)**:
  1. **Jangan Masukkan Tag Non-Meta**: Tempatkan tag `<script>` atau `<style>` di kolom Head/Body Snippet, bukan di kolom Meta Tag ini.
  2. **Jangan Mengubah Atribut Verification Token**: Pastikan nilai `content="..."` persis sesuai dengan yang diberikan oleh konsol Google/Yandex agar verifikasi tidak gagal.

- **💡 TIPS TEKNIS**:
  Setiap tag meta yang diaktifkan akan disuntikkan secara otomatis ke dalam `<head>` dengan penanda atribut `data-custom-meta-tag="true"`.

---

### C. Custom Responsive Banner Iklan (HTML/JS/CSS/JPG/PNG/GIF)

Pengelolaan banner promosi mandiri, banner afiliasi, sponsor, atau iklan gambar pada 4 posisi strategis:
- **Posisi A**: *Bottom of First Half Page* (Bawah Paruh Pertama Halaman Utama)
- **Posisi B**: *Bottom of the Screen / Fixed Sticky Footer* (Melayang di Bawah Layar)
- **Posisi C**: *Start of Each Article/Post* (Awal Setiap Artikel)
- **Posisi D**: *End of Each Article/Post* (Akhir Setiap Artikel)

- **✅ DO'S (Sangat Direkomendasikan)**:
  1. **Gunakan Inline CSS Responsif**: Selalu gunakan atribut CSS responsif seperti `max-width: 100%; height: auto;` atau kelas Tailwind (`w-full max-w-full h-auto`) agar banner menyesuaikan ukuran layar HP dan Desktop secara sempurna.
  2. **Bungkus Gambar dengan Link Afiliasi**: Format standar banner gambar yang benar:
     ```html
     <a href="https://tautan-afiliasi-anda.com" target="_blank" rel="noopener noreferrer">
       <img src="https://domain-anda.com/banner.webp" alt="Promo Buku MPASI" style="width:100%; max-width:728px; height:auto; border-radius:12px;" loading="lazy" />
     </a>
     ```
  3. **Gunakan Tombol "Muat Sample Dummy Banner Iklan"**: Klik tombol sampel untuk memuat template banner HTML/CSS modern dengan warna gradien, badge promo, dan tombol CTA yang indah & responsif.
  4. **Atur Toggle Independen**: Setiap dari 4 posisi banner memiliki switch *Aktif/Nonaktif* terpisah yang memudahkan promosi berkala.

- **🚫 DON'TS (Larangan & Hal yang Harus Dihindari)**:
  1. **Jangan Gunakan Fixed Pixel Width Besar**: Hindari menentukan lebar tetap seperti `width: 1200px;` tanpa `max-width: 100%` karena akan membuat tampilan di layar HP terpotong secara horisontal (*horizontal scrollbar overflow*).
  2. **Jangan Gunakan Gambar Berukuran Sangat Besar**: Hindari mengunggah file JPG/PNG berukuran di atas 1 MB tanpa kompresi. Gunakan format WebP atau kompresi gambar agar loading artikel tetap kilat.
  3. **Jangan Membiarkan Script Iklan Merusak Layout**: Hindari script iklan yang memicu pergeseran tata letak (*Cumulative Layout Shift / CLS*).

- **💡 TIPS TEKNIS**:
  Jika toggle posisi banner dalam keadaan **Nonaktif** atau kolom textarea kosong, slot iklan akan menyusut (*collapse*) secara otomatis. Tidak akan ada kotak kosong, border bermasalah, atau teks developer yang tersisa di halaman publik, sehingga estetika website tetap 100% rapi dan profesional.

---

## ✍️ LANGKAH 13: Panduan Penulis (Writer's Guide), Gambar Unsplash & Otomatisasi AI

> **Status Relevansi:** 🟢 **100% Relevan dengan Codebase Saat Ini**.
> **Kapan Relevan?** Digunakan oleh Penulis (*Writer*) dan Editor setiap kali membuat, mengedit, atau mempublikasikan artikel melalui **Post Editor** di `/admin`.

---

### A. Cara Mendapatkan URL Gambar Unsplash Gratis & Cepat (Optimized WebP)

Unsplash menyediakan jutaan foto berkualitas tinggi secara bebas royalti. Untuk mendapatkan URL gambar yang cepat dimuat dan ramah SEO:

1. **Buka Unsplash:** Kunjungi [unsplash.com](https://unsplash.com) dan cari foto menggunakan kata kunci bahasa Inggris (contoh: *toddler playing*, *mother baby*, *healthy kids food*).
2. **Salin Alamat Gambar (*Copy Image Address*):** Klik kanan pada gambar -> Pilih **Copy Image Address** / **Salin Alamat Gambar**.
3. **Format URL Unsplash yang Direkomendasikan:**
   - Standar Gratis: `https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80`
   - Unsplash Plus / Premium (Free to use): `https://plus.unsplash.com/premium_photo-1733513144502-fe838554b0ca?auto=format&fit=crop&w=1200&q=80`

💡 **Parameter URL Unsplash untuk SEO & Speed:**
- **`w=1200`**: Membatasi lebar gambar maksimal 1200px (ukuran ideal *Featured Image* & Google Discover).
- **`auto=format`**: Otomatis mengonversi gambar ke format **WebP / AVIF** yang super ringan.
- **`q=80`**: Mengatur kompresi kualitas gambar di tingkat 80% (seimbang antara ketajaman & kecepatan pemuatan).

---

### B. Petunjuk Pengisian Post Editor untuk Penulis

Setiap elemen pada Post Editor memiliki peran vital dalam tingkat keterbacaan (*readability*) dan SEO di Google:

#### 1. Kolom Utama Konten
- **Judul Artikel:** Tulis judul yang menarik dan solutif (ideal: 50–70 karakter). *Contoh:* "5 Cara Mengatasi Tantrum Balita Tanpa Harus Marah-Marah".
- **URL Slug:** Terisi otomatis dari judul (`/baca/url-slug-anda`). Menggunakan huruf kecil dan tanda hubung `-`.
- **Kategori Artikel:** Pilih kategori utama (Pola Asuh, Tumbuh Kembang, Kesehatan & Gizi, Psikologi Ibu) atau ketikkan kategori baru.
- **Editor Konten (Markdown & WYSIWYG):**
  - **Subjudul Utama (`H2` / `##`):** Untuk membagi bab utama.
  - **Subjudul Kecil (`H3` / `###`):** Untuk poin-poin turunan.
  - **Cetak Tebal (`Bold`):** Untuk menekankan istilah penting (misal: **ASI Eksklusif**, **Motorik Halus**).
  - **Kutipan (`Blockquote` / `>`):** Untuk nasihat medis, saran psikolog, atau kutipan penting.
- **Split View:** Manfaatkan mode bagi layar untuk melihat pratinjau hasil artikel secara *real-time* di sebelah kanan.

#### 2. Sidebar Metadata & SEO (Kanan)
- **Gambar Sampul (*Featured Image*):** Tempelkan URL Unsplash yang dioptimalkan atau unggah dari komputer ke repositori media.
- **Ringkasan (*Excerpt*):** Uraian singkat 1–2 kalimat (100–150 karakter) yang muncul di kartu artikel halaman depan.
- **Meta Title SEO:** Judul khusus yang dibaca Googlebot (50–60 karakter agar tidak terpotong `...`).
- **Meta Description SEO:** Kalimat ajakan (*Call to Action*) yang muncul di bawah judul pada pencarian Google (120–155 karakter).
- **Tags / Kata Kunci:** Masukkan kata kunci terkait dipisahkan koma (contoh: `pola asuh, balita, tantrum anak, psikologi`).

---

### C. Fitur Otomatisasi & Asisten AI untuk Penulis

Penulis dapat menghemat waktu dengan bantuan otomatisasi sistem:
1. ✨ **Parenting AI Assistant:** Cukup isi Judul & Konten Artikel, lalu klik **"Generate SEO Meta dengan AI"**. Gemini AI akan mengisi 4 kolom sekaligus: Meta Title, Meta Description, Excerpt, dan Tags SEO.
2. 💾 **Auto-Save Cloudflare D1:** Draf artikel tersimpan secara otomatis setiap kali ada perubahan teks sehingga aman dari koneksi terputus.
3. 🔗 **Auto-Links Engine:** Teks artikel yang memuat kata kunci seperti "stunting", "pola asuh", "sensory play" otomatis diubah menjadi *internal link* ke artikel terkait.
4. ⏱️ **Estimasi Waktu Baca:** Durasi baca dihitung secara *real-time* (misal: "5 menit baca").
5. 📊 **Schema.org & Meta Tags:** Serverless edge secara otomatis memproduksi kode terstruktur `BlogPosting` & `BreadcrumbList` bersertifikat Google Rich Results.

---

## 🧩 LANGKAH 14: Panduan Lokasi File & Cara Edit (Header, Footer, & Homepage)

> **Status Relevansi:** 🟢 **Relevan dengan Catatan Kondisi (GUI vs Source Code)**.
> **Kapan Relevan?** 
> - **Kondisi A (Pengaturan GUI Admin - Tanpa Koding):** Jika Anda ingin merubah logo, tagline, kalimat footer, menu navigasi, atau mengganti model layout homepage (tersedia 10 model layout), lakukan melalui **Portal Admin (`/admin` ➔ Tab Config Situs)** tanpa perlu menyentuh file kode.
> - **Kondisi B (Developer Code Level - Editing via GitHub):** Jika Developer ingin menambah komponen UI baru, mengalihkan struktur HTML, atau melakukan kustomisasi kode mendalam, gunakan file source code berikut:

### 1. 🎯 Header & Navigasi
- **File Kode:** `src/components/Header.tsx` (dan `src/components/Navbar.tsx`)
- **Fungsi:** Bagian paling atas website (Logo, tagline, pencarian, mode gelap/terang, dan menu navigasi utama).

### 2. 🦶 Footer (Kaki Halaman)
- **File Kode:** `src/components/Footer.tsx`
- **Fungsi:** Bagian paling bawah website (Hak cipta, deskripsi blog, navigasi footer, tautan media sosial, Kebijakan Privasi & Syarat Ketentuan).

### 3. 🏠 Homepage (Halaman Utama)
- **File Kode:** `src/views/HomeView.tsx` dan `src/components/home_layouts/*`
- **Fungsi:** Mengatur tata letak beranda, Hero Section, Grid Artikel, dan Sidebar.

💡 **Cara Edit Manual via GitHub (Developer Mode):**
1. Buka repositori di GitHub (`roywikan/parenting-my-id`).
2. Masuk ke folder `src/components/` atau `src/views/`.
3. Klik ikon **Pensil** (*Edit this file*) -> Ubah teks atau komponen -> Klik **Commit changes...** (Cloudflare Pages akan melakukan *auto-deploy*).

---

## 🌐 LANGKAH 15: Panduan Pengelolaan Meta Tags Global, Favicon, & Default OG Image

> **Status Relevansi:** 🟢 **Relevan dengan Catatan Arsitektur 3-Layer (Static HTML ➔ React Client ➔ Serverless SSR)**.
> **Kapan Relevan?**
> - **Kondisi Admin Live (Relevansi Utama):** Pengaturan Meta Title, Description, dan Default OG Image dapat langsung diubah secara dinamis dari **Portal Admin (`/admin` ➔ Config Situs)** tanpa *deploy* ulang.
> - **Kondisi Static Fallback (Relevansi Developer):** Jika database D1 belum terhubung atau dalam kondisi *fallback* pertama kali, 3 lokasi file berikut menjadi garda pertahanan terakhir:

### 3 Lokasi File Metadata Global & Default OG Image:

1. 📄 **`index.html` (Entry Point HTML Statis Utama)**
   - **Lokasi:** `/index.html`
   - **Elemen:**
     - Favicon: `<link rel="icon" type="image/svg+xml" href="..." />`
     - Title Utama: `<title>...</title>`
     - Meta Description: `<meta name="description" content="..." />`
     - Default OG & Twitter Image: `<meta property="og:image" content="..." />`

2. ⚛️ **`src/components/SEOHelper.tsx` (Metadata Fallback Sisi Client / React)**
   - **Lokasi:** `src/components/SEOHelper.tsx`
   - **Fungsi:** Menyimpan nilai cadangan (*fallback*) metadata saat halaman dimuat di browser pengunjung jika data API belum siap:
   ```typescript
   export const DEFAULT_SEO = {
     title: 'Parenting.my.id - Edukasi & Pengasuhan Anak Modern',
     description: 'Portal informasi dan panduan pengasuhan anak modern, nutrisi balita, serta kesehatan keluarga Indonesia.',
     imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200&h=630', // <-- Default OG Image
     url: 'https://parenting.my.id',
   };
   ```

3. ⚡ **`functions/baca/[slug].ts` (Cloudflare Workers Serverless / SSR Edge)**
   - **Lokasi:** `functions/baca/[slug].ts`
   - **Fungsi:** Menyediakan gambar pratinjau OG Image saat tautan artikel dibagikan ke WhatsApp, Facebook, atau Twitter jika artikel tersebut tidak memiliki *featured image*:
   ```typescript
   const defaultOgImage = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200&h=630';
   ```

---

💡 **Rekomendasi Format & Ukuran Asset:**
- **Favicon:** Gunakan file SVG atau PNG (ukuran **32x32px** atau **128x128px**) di folder `public/`, lalu atur rutenya di `index.html`.
- **Default OG Image:** Gunakan gambar berasio **16:9** (ukuran standar **1200x630px**) format WebP, JPG, atau PNG agar tampil presisi dan menarik saat dibagikan di WhatsApp, Telegram, dan media sosial.


