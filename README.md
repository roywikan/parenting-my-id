# 🚀 Panduan Lengkap Setup & Penggunaan Blog Engine `parenting.my.id`

Sistem Blog Engine modern, ultra-cepat, dan SEO-friendly ini beroperasi sepenuhnya secara **Cloud-Native** menggunakan **Cloudflare Pages / Workers**, **Cloudflare D1 (Serverless SQLite)**, **Unsplash API/Integration**, dan **GitHub REST API**.

Penulis dan Admin dapat mengelola artikel, gambar, SEO meta, serta konfigurasi situs secara interaktif dari browser desktop maupun mobile.

---

## 📋 Prasyarat (100% Gratis)
1. Akun **GitHub** ([github.com](https://github.com))
2. Akun **Cloudflare** ([cloudflare.com](https://cloudflare.com))
3. Domain **parenting.my.id** (atau domain pribadi Anda) yang DNS-nya diarahkan ke Cloudflare.

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
  role TEXT DEFAULT 'writer',
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
  status TEXT DEFAULT 'draft',
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

```

atau yang sudah terisi:

```sql
CREATE TABLE IF NOT EXISTS _cf_KV (
  key TEXT PRIMARY KEY,
  value BLOB
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'writer')) NOT NULL DEFAULT 'writer',
  avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  bio TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  password TEXT,
  title TEXT,
  social_instagram TEXT,
  social_linkedin TEXT,
  social_website TEXT
);

CREATE TABLE IF NOT EXISTS posts (
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
  co_author_ids TEXT,
  revisions TEXT,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS autolinks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  description TEXT,
  click_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configs (
  key TEXT PRIMARY KEY,
  value TEXT
);

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

CREATE TABLE IF NOT EXISTS site_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  config_json TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

```

*(Catatan: Jika Anda meng-upgrade D1 dari versi terdahulu, jalankan `ALTER TABLE users ADD COLUMN title TEXT;` dsb jika ada kolom yang belum tersedia).*

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

---

## ⚙️ LANGKAH 3: Kustomisasi Pengaturan & Navigasi di Admin Panel (`/admin`)

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
   - Tampilan bersih, terpisah murni dari menu mobile hamburger sehingga tidak membingungkan pengunjung desktop.
2. **Menu Hamburger (Mobile Drawer Navigation)**:
   - Mengatur menu khusus yang tampil ketika pengunjung menekan tombol hamburger (☰) di smartphone/layar sentuh.
3. **Footer Navigation (Tautan Navigasi Platform)**:
   - Mengatur tautan halaman penting di bagian bawah website (seperti Kebijakan Privasi, Syarat & Ketentuan, Sitemap XML, RSS Feed).
4. **Setting Kategori Artikel Footer (Tautan Kategori Footer)**:
   - Mengatur daftar kategori artikel interaktif di footer yang dapat diklik langsung oleh pengunjung untuk memfilter artikel berdasarkan kategori.

**Fitur Navigation Builder:**
- ⚡ **Preset 1-Klik**: Pilihan cepat menambahkan menu populer (Beranda, Kategori, Privacy, Sitemap, RSS, dll.).
- ✏️ **Edit & Hapus**: Ubah Label dan URL langsung secara interaktif dengan tombol hapus (🗑️).
- ⬆️⬇️ **Atur Urutan**: Geser posisi menu naik (↑) atau turun (↓).
- 🧩 **Mode JSON Opsional**: Bebas berpindah ke editor JSON jika ingin menyalin/menempel struktur menu secara masal.

---

### C. Jaminan Resiliensi & Notifikasi Admin
- **Structured Array State**: Menggaransi semua tautan diproses sebagai struktur data yang valid.
- **Notifikasi Berhasil**: Banner hijau mengonfirmasi bahwa data berhasil tersimpan ke Cloudflare D1 & `site_config.json`.
- **Notifikasi Gagal & Retry**: Jika terjadi kendala jaringan/server, banner merah beserta tombol **"Coba Simpan Lagi"** akan muncul tanpa menghapus data yang sudah diketik.

---

### D. Panduan Portabilitas & Forking (Theme & Domain Independent)
Aplikasi ini didesain agar mudah **difork** atau digunakan kembali untuk domain dan niche tema lain:
1. **Ubah Niche & Domain**: Di Portal Admin -> Configs Situs, ubah `Nama Situs (site_name)`, `Tagline (site_tagline)`, `Deskripsi (site_description)`, dan `Domain Utama (site_domain)`.
2. **Pencarian Dinamis**: Kolom pencarian otomatis menyesuaikan diri dengan nama situs tanpa teks hardcoded.
3. **Sesuaikan Navigasi**: Gunakan Navigation Builder untuk mengganti tautan menu sesuai kategori niche baru Anda.
## ✍️ LANGKAH 4: Panduan Penulis — Mengisi Artikel & Gambar dari Unsplash.com

Penulis artikel memiliki akses ke **Editor WYSIWYG Rich Editor** lengkap dengan AI Assistant, SEO Auditor, dan Pengelola Gambar.

### A. Menentukan Gambar Sampul (Featured Image)
Gambar sampul akan muncul sebagai kartu di halaman depan, header artikel, dan pratinjau sosial media (Open Graph).

#### Metode 1: Menggunakan Galeri Unsplash.com Terintegrasi (Rekomendasi Utama)
1. Di halaman editor artikel, lihat kartu **Meta SEO & Gambar Sampul** di kolom kanan.
2. Klik tombol **Upload / Pilih Gambar**.
3. Buka tab **Galeri Unsplash**.
4. Anda dapat:
   - Memilih salah satu preset kategori parenting yang tersedia (seperti *Bayi & Balita*, *Pola Asuh*, *Kehamilan*, *Nutrisi & Makanan*, *Sensory Play*, *Keluarga Bahagia*).
   - Atau mengetik kata kunci custom pada kolom pencarian (misal: `toddler`, `breastfeeding`, `parenting`).
5. Klik foto pilihan Anda, lalu klik tombol **🖼️ Jadikan Sampul**. URL Unsplash beresolusi tinggi otomatis terpasang sebagai Gambar Sampul.

#### Metode 2: Menggunakan Direct URL Unsplash.com
1. Buka situs [unsplash.com](https://unsplash.com) di tab baru.
2. Cari foto berkualitas tinggi terkait topik artikel Anda.
3. Klik kanan pada foto -> **Copy image address** (Salin alamat gambar), contoh: `https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80`.
4. Tempelkan URL tersebut pada input **URL Gambar Sampul (Featured Image)** di editor.

#### Metode 3: Mengunggah File Gambar dari Komputer
1. Klik tombol **Upload / Pilih Gambar** -> Buka tab **Upload File**.
2. Klik area unggah atau pilih file PNG, JPG, atau WebP dari laptop/HP Anda.
3. Setelah proses unggah selesai, klik tombol **🖼️ Jadikan Sampul**. Gambar akan tersimpan ke repositori GitHub `/public/uploads/` / Cloudflare D1.

---

### B. Mengunggah & Menyisipkan Gambar ke Dalam Body Artikel
Untuk memasukkan gambar di tengah-tengah teks tulisan artikel:

1. Tempatkan kursor teks di baris tempat Anda ingin menyisipkan gambar.
2. Pada toolbar editor bagian atas, klik icon **Gambar** (Sisipkan Gambar Artikel).
3. Pilih opsi sumber gambar:
   - **Upload File**: Unggah gambar fisik dari komputer Anda.
   - **Galeri Unsplash**: Pilih dari pustaka gambar Unsplash bebas royalti.
   - **URL Direct**: Tempel alamat URL gambar eksternal.
4. Ketik **Deskripsi / Alt Text** gambar (penting untuk SEO & aksesibilitas).
5. Klik tombol **📌 Sisipkan ke Body**. Tag markdown gambar (contoh: `![Deskripsi Gambar](https://...)`) otomatis tersisip tepat di posisi kursor.

---

### C. Alur Kerja Penulisan Artikel yang Optimal
1. **Isi Judul & Kategori Artikel**: Pilih kategori utama (Pola Asuh, Kesehatan, Nutrisi, Pendidikan, Kehamilan, Gaya Hidup).
2. **Gunakan AI Gemini Meta Generator**: Klik tombol **Generate SEO Meta dengan AI** untuk secara otomatis menghasilkan *Excerpt*, *Meta Title*, dan *Meta Description* berstandar Google Search.
3. **Periksa SEO Audit Widget**: Perhatikan skor SEO Audit (0-100%). Pastikan indikator berwarna hijau (Panjang Judul, Meta Desc, Kedalaman Kata > 300 kata, Gambar Sampul, Tag Topik).
4. **Pratinjau Artikel (Tab Preview)**: Buka tab **Pratinjau Artikel** untuk melihat tampilan akhir artikel lengkap dengan Daftar Isi Otomatis (*Table of Contents*) dan Rantai Tautan Otomatis (*Autolinks*).
5. **Publikasikan Artikel**: Pilih status **Dipublikasikan** dan klik **Simpan & Publikasikan Artikel**.

---

## 🛠️ Ringkasan Fitur Unggulan Engine

1. **Dual Storage Cloudflare D1 + GitHub REST API**: Menyimpan artikel dan konfigurasi situs di database SQLite serverless D1 berkecepatan edge, sekaligus menyinkronkan file aset ke GitHub.
2. **In-Page SEO & Structured Data Auto-Generator**: Menghasilkan skema JSON-LD `BlogPosting`, `BreadcrumbList`, `<link rel="canonical">`, dan `<link rel="alternate">` secara otomatis.
3. **Automated `llms.txt` Generator**: Secara otomatis membuat & meng-update endpoint `/llms.txt` untuk optimasi keterbacaan oleh AI Search Engine (Perplexity, ChatGPT, Gemini).
4. **Autolinks Engine**: Otomatis mengubah kata kunci tertentu di seluruh artikel menjadi internal link aktif tanpa perlu mengedit artikel satu per satu.
5. **Histori Revisi & Autosave**: Menyimpan draf artikel dan 3 histori revisi terakhir untuk perlindungan data tulisan penulis.
