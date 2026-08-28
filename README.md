# 🚀 Panduan Setup Cloud-Native Blog Engine `parenting.my.id` (100% Browser / Tanpa Terminal / Tanpa Software Lokal)

Sistem Blog Engine modern, ultra-cepat, dan SEO-friendly ini beroperasi sepenuhnya secara **cloud-native** menggunakan **Cloudflare Pages / Workers**, **Cloudflare D1 (Serverless SQLite)**, dan **GitHub API**. 

Penulis dan Admin dapat mengelola artikel, gambar, SEO meta, serta sistem auto-linking langsung dari browser tanpa pernah menginstall Node.js, npm, Git, atau Terminal di laptop.

---

## 📋 Prasyarat (Semua Gratis)
1. Akun **GitHub** ([github.com](https://github.com))
2. Akun **Cloudflare** ([cloudflare.com](https://cloudflare.com))
3. Domain **parenting.my.id** yang DNS-nya sudah terhubung ke Cloudflare.

---

## 🛠️ LANGKAH 1: Duplikasi Repository di GitHub (1 Menit)
1. Buka repositori kode ini di GitHub.
2. Klik tombol **Fork** di pojok kanan atas untuk menyalin repositori ke akun GitHub Anda.
3. Beri nama repositori, contoh: `parenting-my-id`.
4. Selesai! Repositori Anda sekarang siap digunakan sebagai sumber deployment otomatis.

---

## 🗄️ LANGKAH 2: Buat Database Cloudflare D1 via Browser (2 Menit)
1. Buka Dashboard Cloudflare ([dash.cloudflare.com](https://dash.cloudflare.com)).
2. Pilih menu **Workers & Pages** -> **D1 SQL Database**.
3. Klik tombol **Create Database**.
4. Isi Nama Database: `parenting-db`, lalu klik **Create**.
5. Salin **Database ID** yang muncul (contoh: `a1b2c3d4-e5f6-7890-abcd-1234567890ab`).
6. Masuk ke tab **Console** di dalam halaman database `parenting-db` tersebut.

### 📜 Skrip Pembuatan Database & Migrasi Kolom Baru (Execute di D1 Console):
```sql
-- Tabel Users / Penulis & Tim Editorial
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

-- Tabel Posts / Artikel CMS
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
  co_author_ids TEXT, -- Array JSON ID Penulis Bersama
  revisions TEXT, -- Array JSON Snapshot Histori Revisi (Max 3)
  status TEXT DEFAULT 'draft',
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT,
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Tabel Autolinks
CREATE TABLE IF NOT EXISTS autolinks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  description TEXT,
  click_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Site Config / Pengaturan Global Website
CREATE TABLE IF NOT EXISTS site_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  config_json TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 💡 Catatan Tambahan bagi Admin (Migrasi Database D1 Opsional):
Jika Anda meng-upgrade D1 dari versi terdahulu, jalankan perintah `ALTER TABLE` berikut di Cloudflare D1 Console untuk menambahkan kolom kredensial penulis dan multi-author:
```sql
ALTER TABLE users ADD COLUMN title TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN social_instagram TEXT;
ALTER TABLE users ADD COLUMN social_linkedin TEXT;
ALTER TABLE users ADD COLUMN social_website TEXT;
ALTER TABLE posts ADD COLUMN co_author_ids TEXT;
ALTER TABLE posts ADD COLUMN revisions TEXT;
```

---

## 🔑 LANGKAH 3: Buat Personal Access Token GitHub untuk Unggah Gambar (1 Menit)
Penulis dapat mengunggah gambar langsung di Editor WYSIWYG, yang akan disimpan secara otomatis ke repositori GitHub `/public/uploads/`:
1. Buka [github.com/settings/tokens](https://github.com/settings/tokens).
2. Klik **Generate new token (classic)**.
3. Beri nama Note: `Cloudflare Image Uploader`.
4. Beri centang pada centang hak akses **`repo`** (Full control of private repositories).
5. Klik **Generate token** dan salin kode tokennya (contoh: `ghp_xxxxxxx`).

---

## ⚡ LANGKAH 4: Deploy ke Cloudflare Pages / Workers via Browser (3 Menit)
1. Kembali ke Dashboard Cloudflare -> **Workers & Pages**.
2. Klik **Create application** -> Tab **Pages** -> **Connect to Git**.
3. Pilih akun GitHub Anda dan pilih repositori `parenting-my-id`.
4. Klik **Begin setup**.
5. Pada bagian **Build settings**:
   - **Framework preset**: `Vite` (atau `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Buka bagian **Environment variables (advanced)** dan tambahkan variabel berikut:
   - `SITE_URL`: `https://parenting.my.id`
   - `GITHUB_TOKEN`: *(Paste Token GitHub dari Langkah 3)*
   - `GITHUB_OWNER`: *(Username GitHub Anda)*
   - `GITHUB_REPO`: `parenting-my-id`
   - `GITHUB_BRANCH`: `main`
7. Klik **Save and Deploy**. Cloudflare akan membangun dan mempublikasikan situs Anda secara otomatis!

---

## 🔗 LANGKAH 5: Hubungkan Binding Database D1 & Domain `parenting.my.id`
1. Setelah deployment pertama selesai, buka proyek Pages Anda di Cloudflare -> Tab **Settings** -> **Functions**.
2. Gulir ke bawah ke bagian **D1 database bindings**.
3. Klik **Add binding**:
   - **Variable name**: `DB`
   - **D1 database**: Pilih `parenting-db`
4. Simpan perubahan.
5. Masuk ke tab **Custom domains** -> Klik **Set up a custom domain**.
6. Ketik `parenting.my.id` dan klik **Continue**. Cloudflare akan mengurus sertifikat SSL HTTPS secara otomatis!

---

## 🤖 OTOMATISASI `llms.txt` UNTUK AI SEARCH ENGINE
Setiap kali ada artikel baru yang dipublikasikan atau diperbarui lewat CMS:
1. Endpoint `/llms.txt` secara otomatis ter-generate secara real-time dari database.
2. File fisik `public/llms.txt` dan `dist/llms.txt` langsung diperbarui secara otomatis.
3. Jika `GITHUB_TOKEN` diisi, file `public/llms.txt` dan `public/sitemap.xml` akan otomatis di-commit kembali ke repositori GitHub.

---

## ✨ FITUR UNGGULAN ENGINE
1. **Auto In-Page SEO Engine (Di Belakang Layar & Muka Layar):**
   - **In-Code / JSON-LD Structured Data Schema.org**: Otomatis menghasilkan skema `BlogPosting`, `BreadcrumbList`, `FAQPage` (di-parse otomatis dari heading pertanyaan), `WebSite`, dan `Organization`.
   - **Canonical & Hreflang Dynamic Injection**: Injeksi otomatis `<link rel="canonical">` dan `<link rel="alternate" hreflang="id-ID">`.
   - **Admin Real-Time SEO Auditor (0-100%)**: Panel auditor di editor artikel yang menguji panjang judul, meta desc, kedalaman kata, struktur heading, gambar utama, tag topik, dan keyword focus secara real-time.
   - **Optimasikan Meta SEO Otomatis**: Tombol 1-klik untuk membangun Meta Title & Meta Description standar Google Search.
   - **Daftar Isi Otomatis (Interactive Table of Contents)**: Navigasi daftar isi interaktif dengan fragment anchor links (`#heading-id`) untuk memicu Google Sitelinks / Fragment Snippets.
   - **Smart Related Articles**: Menghitung relevansi artikel berdasarkan kesamaan kategori dan tag untuk mengoptimalkan internal link juice dan dwell time.
2. **Otomatisasi Tautan (Autolinks):** Semua kata kunci terdaftar (seperti *"pola asuh"*, *"balita"*, *"stunting"*) secara otomatis menjadi internal link aktif.
3. **Fitur Bagikan Multi-Platform:** Mendukung berbagi artikel ke WhatsApp, Facebook, Instagram, Twitter/X, dan Salin Link.
4. **Pencatatan Pembaca Real-Human:** Penghitung dibaca hanya bertambah jika pengunjung manusia (bukan bot) membaca hingga pertengahan artikel.
5. **Kustomisasi Box Metrik Performa:** Admin dapat mengatur angka dan label metrik performa di halaman utama sesuai kebutuhan.
6. **Autosave & Histori Revisi (Snapshot Rollback):** Menyimpan otomatis draf artikel serta 3 histori revisi terakhir untuk kemudahan rollback.
