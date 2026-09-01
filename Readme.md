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

---

### E. Pengaturan Mesin Komentar (Comment Engine Modes)
Portal Admin menyediakan 4 opsi fleksibel untuk pengaturan kolom komentar artikel (`comment_engine_mode`):
1. **🔥 Keduanya Aktif (`both`)**: Form komentar internal Native (D1) dan Widget Cusdis Embed aktif bersamaan, dilengkapi tombol *switcher* interaktif bagi pembaca.
2. **⚡ Native D1 Saja (`native`)**: Menggunakan form komentar bawaan website yang cepat, aman dengan Anti-XSS, dan tersimpan langsung di tabel SQL `comments` Cloudflare D1.
3. **💬 Cusdis Embed Saja (`cusdis`)**: Hanya menampilkan widget komentar embed Cusdis pihak ketiga.
4. **🚫 Nonaktifkan (`none`)**: Menutup kolom komentar secara menyeluruh di semua artikel.

*Catatan Integrasi Webhook Cusdis:* Tersedia endpoint webhook `/api/webhooks/cusdis` yang secara otomatis menyinkronkan komentar baru dari Cusdis ke database Cloudflare D1 sebagai backup data.

---

### F. Hak Akses Berbasis Peran (Role-Based Access Control - RBAC)
Untuk menjaga keamanan dan integritas sistem, akun dengan peran non-admin (`role: 'writer'`) secara ketat dibatasi dari fitur-fitur administratif sensitif:
- 🚫 **Dilarang Akses (Hanya untuk Admin / `role: 'admin'`)**:
  - **Kelola Tim & Penulis** (Tab Manajemen Penulis/Editor)
  - **Auto-Linking Engine** (Tab Manajemen Auto-Link SEO)
  - **SEO Inspector** (Tab Inspector Sitemap & Feed XML)
  - **Cusdis Komentar & Webhook** (Tab Moderasi & Config Komentar)
  - **Hard Link Admin Logout** (Box URL Logout Langsung di Tab Security)
  - **Configs Situs** (Tab Pengaturan Terpusat Website)
- ✅ **Hak Akses Penulis (`role: 'writer'`)**:
  - Menulis, mengedit, dan mengelola artikel milik sendiri di **Rich WYSIWYG Editor**.
  - Mengubah profil pribadi (nama, bio, avatar, password) di Tab **Profil & Password Saya**.

---

## 🎨 Panduan Kustomisasi 10 Model Display Frontpage / Home Layout

Sistem **parenting.my.id** menyediakan **10 Pilihan Model Tampilan Beranda (Frontpage Display Modes)** yang dapat diganti secara instan tanpa perlu mengubah atau mengedit file kode program. Seluruh teks judul, narasi, badge, metrik statistik, hingga nomor WhatsApp kontak dapat diubah secara interaktif melalui **Portal Admin (`/admin`)**.

### A. Cara Mengganti Model Display Beranda
1. Buka dan masuk ke **Portal Admin** pada URL `/admin`.
2. Klik tab **Config Situs** pada sidebar/menu admin.
3. Gulir ke bagian **Pilih Model Display Frontpage (Layout Beranda)**.
4. Pilih salah satu dari 10 model display yang tersedia (Default Blog, Event, Campaign, Microsite, Portfolio, Personal Branding Dokter, Corporate B2B, Product Landing Page, Vintage Newspaper Classifieds, atau Knowledge Base).
5. Pada bagian **Pengaturan Wording & Variable Wajah Beranda**, klik tab model yang sesuai untuk mengisi teks dan nomor WhatsApp khusus.
6. Klik tombol **Simpan Konfigurasi Situs** di bagian bawah. Perubahan akan langsung aktif secara otomatis di seluruh peramban pengunjung.

---

### B. Pemetaan Variabel Wording & WhatsApp Tiap Model di Portal Admin

| No | Nama Model Display | Tab di Portal Admin (`/admin`) | Variabel `siteConfig` yang Dipetakan | Fungsi & Kustomisasi Wording |
|---|---|---|---|---|
| **1** | **Default Blog & Majalah** | `1. Default Majalah` | `hero_badge_text`, `hero_title`, `hero_subtitle`, `hero_cta_text`, `hero_cta_link`, `show_hero_section`, `show_performance_box`, `metric_1_show`, `metric_2_show`, `metric_3_show`, `metric{i}_label`, `metric{i}_anim_type`, `metric{i}_start_val`, `metric{i}_end_val`, `metric{i}_duration`, `metric{i}_unit` | Mengatur badge promo header, judul utama majalah parenting, sub-judul deskripsi, tautan tombol CTA hero, serta 3 indikator metrik performa situs lengkap dengan checkbox visibilitas individu (`metric_1_show`, `metric_2_show`, `metric_3_show`), animasi angka halus (*count up* / *count down* / *fixed*), durasi (ms), dan kustomisasi satuan unit (+, %, ms, dt, view). |
| **2** | **Event, Konferensi & Seminar** | `2. Event & Summit` | `event_badge_text`, `event_date_location`, `event_title`, `event_subtitle`, `event_cta_text`, `event_whatsapp` | Mengatur nama kegiatan/summit, tanggal & lokasi acara, judul utama event, deskripsi lokakarya, teks tombol pendaftaran, dan **Nomor WhatsApp Panitia Tiket** (misal: `6281234567890`). |
| **3** | **Campaign, Petisi & Aksi Sosial** | `3. Aksi Sosial Campaign` | `campaign_badge_text`, `campaign_title`, `campaign_subtitle`, `campaign_target_amount`, `campaign_current_amount`, `campaign_donor_count` | Mengatur badge gerakan sosial (misal: *Bebas Stunting*), judul advokasi, deskripsi aksi, target donasi (dalam Rupiah), jumlah dana terkumpul saat ini, dan total donatur/pendukung. |
| **4** | **Microsite / Bio Links** | `4. Microsite Bio Link` | `microsite_title`, `microsite_bio`, `microsite_wa_label`, `microsite_wa_number`, `microsite_ebook_url`, `microsite_telegram_url`, `microsite_podcast_url`, `microsite_shop_url` | Mengatur nama portal/hub, biografi singkat, label & **Nomor WhatsApp Konsultasi Privat**, serta URL tautan cepat untuk E-Book Gratis, Komunitas Telegram, Spotify Podcast, dan Toko Online. |
| **5** | **Portofolio Karya & Riset** | `5. Portofolio & Riset` | `portfolio_badge_text`, `portfolio_title`, `portfolio_subtitle`, `portfolio_stat1_val`, `portfolio_stat1_lbl`, `portfolio_stat2_val`, `portfolio_stat2_lbl`, `portfolio_stat3_val`, `portfolio_stat3_lbl` | Mengatur badge showcase karya, judul portofolio riset, narasi latar belakang, serta 3 metrik statistik dampak (misal: *Keluarga Terbantu*, *Workshop*, *Riset Terpublikasi*). |
| **6** | **Personal Branding Dokter / Pakar** | `6. Profil Personal Branding` | `doctor_name`, `doctor_title`, `doctor_badge_text`, `doctor_bio`, `doctor_avatar_url`, `doctor_experience_years`, `doctor_booking_whatsapp` | Mengatur nama lengkap & gelar dokter/psikolog, spesialisasi medis, badge profil, biografi naratif, URL foto profil, tahun pengalaman, dan **Nomor WhatsApp Booking Konsultasi Privat**. |
| **7** | **Corporate & B2B Profile** | `7. Solusi Corporate B2B` | `corporate_badge_text`, `corporate_title`, `corporate_subtitle`, `corporate_cta_proposal`, `corporate_cta_consult`, `corporate_whatsapp`, `corporate_stat1_*`, `corporate_stat2_*`, `corporate_stat3_*` | Mengatur badge solusi bisnis korporasi, judul program *Employee Wellbeing*, sub-judul EAP/daycare kantor, teks tombol proposal B2B, teks tombol jadwal konsultasi, **Nomor WhatsApp Kemitraan B2B**, dan metrik statistik mitra. |
| **8** | **Product Landing Page** | `8. Penjualan Produk Landing Page` | `product_badge_text`, `product_title`, `product_subtitle`, `product_price`, `product_original_price`, `product_discount_tag`, `product_cta_text`, `product_whatsapp` | Mengatur badge promo produk, nama paket produk MPASI/buku, deskripsi manfaat, harga promo (Rp), harga coret (Rp), tag persentase diskon (misal: *HEMAT 37%*), teks tombol order, dan **Nomor WhatsApp Pemesanan Direct**. |
| **9** | **Iklan Baris Koran Jaman Dulu** | `9. Wording Iklan Baris Koran` | `classified_masthead_title`, `classified_masthead_subtitle`, `classified_edition`, `classified_price_tag`, `classified_phone` | Mengatur judul kepala koran (*Masthead*), sub-judul lembaran iklan baris, nomor edisi & tahun nostalgia, label harga eceran klasik, dan nomor telepon redaksi/iklan baris. |
| **10** | **Knowledge Base & Ensiklopedia** | `10. Wording Knowledge Base` | `kb_badge_text`, `kb_title`, `kb_subtitle`, `kb_search_placeholder` | Mengatur badge ensiklopedia parenting, judul utama pusat bantuan pengasuhan, sub-judul panduan cari, dan teks *placeholder* di dalam kolom pencarian topik. |

---

## 🔒 Fitur Keamanan Eksklusif (Security First Architecture)

Sistem telah dilengkapi dengan 3 lapisan proteksi keamanan aktif untuk menjamin stabilitas area Portal Admin (`/admin`):
1. **Proteksi Anti Brute Force**: Pembatasan batas percobaan login (rate limiting) pada endpoint otentikasi admin `/api/login` untuk mencegah serangan kamus atau peretasan kata sandi secara masal.
2. **Proteksi Anti XSS (Cross-Site Scripting)**: Seluruh input teks, deskripsi, komentar, dan konten markdown dibersihkan secara otomatis (*sanitized*) sebelum disimpan ke database D1 atau dirender ke DOM peramban.
3. **Proteksi Anti Leech & Hotlinking**: Endpoint gambar dan file pendukung menggunakan validasi referer dan header keaslian untuk mencegah pencurian bandwidth CDN oleh situs pihak ketiga.

---

## 🤖 Optimasi SEO Googlebot & Aksesibilitas Mesin Pencari

Seluruh halaman dan endpoint render statis/dinamis telah diuji dan digaransi **100% ramah SEO (SEO-Friendly)** dan dapat di-crawl oleh Googlebot tanpa error:
- **Homepage (`/`)**: Mendukung SSR / static rendering dengan tag meta OpenGraph lengkap dan structured data JSON-LD.
- **Kategori (`/category/[slug]`)**: Render HTML bersih tanpa dependensi JavaScript yang menghambat crawler.
- **Tag (`/tags/[tag]`)**: Indeks kata kunci terstruktur untuk pengelompokan topik artikel.
- **Detail Artikel (`/baca/[slug]`)**: Menghasilkan skema `BlogPosting` dan `BreadcrumbList` otomatis.
- **File XML & Teks Mesin**: `/sitemap.xml`, `/feed.xml`, `/robots.txt`, `/llms.txt`, dan `/llms-full.txt` dirender secara real-time dari database D1.

---

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

1. **Multi-Model Homepage Layouts (10 Pilihan Model Display Beranda)**:
   Admin dapat memilih gaya tampilan beranda secara instan melalui Portal Admin (`/admin`) pada tab **Pengaturan Situs**:
   - **Default (Blog & Majalah Parenting)**: Tata letak portal berita/majalah lengkap dengan hero banner, filter kategori, auto-links & arsip grid artikel.
   - **Event, Konferensi & Seminar**: Tata letak kegiatan/summit nasional dengan hitung mundur (*countdown timer*), profil narasumber (*keynote speakers*), jadwal agenda sesi, dan formulir pendaftaran/tiket.
   - **Campaign, Petisi & Gerakan Sosial**: Halaman advokasi sosial (misal: Gerakan Bebas Stunting) dengan target donasi interaktif, formulir petisi, pilar aksi, dan pembaruan berkala.
   - **Microsite / Bio Links / Profil Cepat**: Halaman mobile-first tautan cepat (WhatsApp Konsultasi, E-Book Gratis, Grup Telegram Parenting, Podcast).
   - **Portofolio Karya, Penelitian & Program**: Showcase program riset, buku panduan & karya dengan filter topik visual dan metrik dampak.
   - **Personal Branding Pakar / Dokter**: Profil resmi dokter anak atau psikolog dengan spotlight sertifikasi, jadwal praktek/konsultasi privat, dan materi terpublikasi.
   - **Corporate & Business Profile**: Profil layanan korporat B2B (*Employee Assistance Program*, *Daycare* kantor) lengkap dengan proposal RFQ & studi kasus bisnis.
   - **Product Landing Page**: Landing page komersial paket produk MPASI & stimulasi anak lengkap dengan rating bintang, pricing tier, dan FAQ interaktif.
   - **Iklan Baris Koran Jaman Dulu (Vintage Newspaper Classifieds)**: Tata letak bernuansa koran cetak klasik nostalgia dengan frame ganda antik, kolom iklan baris terklasifikasi, dan form pasang iklan.
   - **Knowledge Base & Ensiklopedia**: Pusat bantuan dan direktori panduan pengasuhan terstruktur berdasarkan topik terpadu (Gizi, Emosi, Kesehatan, Tumbuh Kembang).

2. **Dual Storage Cloudflare D1 + GitHub REST API**: Menyimpan artikel dan konfigurasi situs di database SQLite serverless D1 berkecepatan edge, sekaligus menyinkronkan file aset ke GitHub.
3. **In-Page SEO & Structured Data Auto-Generator**: Menghasilkan skema JSON-LD `BlogPosting`, `BreadcrumbList`, `<link rel="canonical">`, dan `<link rel="alternate">` secara otomatis.
4. **Automated `llms.txt`, `llms-full.txt` & `feed.xml` RSS Synchronization**:
   - `/feed.xml`: File umpan RSS 2.0 standar.
   - `/llms.txt`: Ringkasan indeks daftar artikel terstruktur yang disinkronkan langsung dari `feed.xml` untuk AI crawler (Perplexity, ChatGPT, Claude, Gemini).
   - `/llms-full.txt`: Kumpulan teks lengkap seluruh artikel dalam format Markdown murni untuk inferensi mendalam dan konsumsi model bahasa besar (LLM).
5. **Header Badge Customization (`show_header_badge`)**: Opsi toggle di Portal Admin (`/admin`) untuk menampilkan atau menyembunyikan elemen `<span>` badge "Cloudflare D1 Edge Engine" di samping logo header.
6. **Autolinks Engine**: Otomatis mengubah kata kunci tertentu di seluruh artikel menjadi internal link aktif tanpa perlu mengedit artikel satu per satu.
7. **Histori Revisi & Autosave**: Menyimpan draf artikel dan 3 histori revisi terakhir untuk perlindungan data tulisan penulis.

---

## ⚡ Optimasi Performa & PageSpeed Insights

Sistem ini dikonfigurasi secara khusus untuk mencapai skor **95-100** pada **Google PageSpeed Insights / Lighthouse**:

1. **Eliminasi Cumulative Layout Shift (Zero CLS Target = 0.000)**:
   - **Hero Container Stabilization**: Mengunci dimensi kontainer dan rasio aspek gambar hero (`aspect-[16/9]` pada mobile dan `lg:h-[420px]` pada desktop) dengan `object-cover`, mencegah lonjakan 0.317 CLS saat data dimuat.
   - **Full-Fidelity Article Skeleton**: Menghindari pergeseran footer 0.522 CLS dengan menerapkan `min-h-[900px]` pada `<main>` dan render skeleton berstruktur identik pada *Suspense Fallback* dan `ArticleDetailView`.
   - **Font Loading & Metric Stabilization**: Menetapkan `font-display: swap;` dan `text-rendering: optimizeLegibility` untuk mencegah *FOIT/FOUT* dan pergeseran hierarki teks.
   - **Fixed-height Ticker & Tags**: Mengunci dimensi vertikal tombol tag/ticker (`h-[32px]`) dan `min-h` pada deskripsi ringkasan kartu artikel.

2. **Largest Contentful Paint (LCP < 1.2s)**:
   - **High-Priority Image Preloading**: Header SSR (`/baca/[slug]` dan `/`) menyuntikkan tag `<link rel="preload" as="image" href="..." fetchpriority="high">` langsung di `<head>` HTML awal.
   - **Non-blocking CSS Preloading**: File CSS kritis dimuat secara asinkron (`<link rel="preload" as="style" onload="...">`) dengan fallback `<noscript>` untuk mengeliminasi *Render-Blocking Resources*.
   - **Responsive Image Optimization (WebP/AVIF)**:
     - Utilitas Unsplash dikompresi ke kualitas `q=55` dan format `fm=webp` secara otomatis di CDN Edge.
     - Menggunakan atribut `srcset` dengan ukuran kontainer presisi (`400w`, `600w`, `700w`) dan `sizes="(max-width: 1024px) 100vw, 700px"`.
     - Avatar dikompresi secara ketat pada dimensi `w=60` & `q=60` (ukuran file < 2 KiB).

3. **Composited Animations & GPU Acceleration**:
   - Menghapus animasi `transition-colors` / `border-bottom-color` pada elemen sticky `<header>` untuk mencegah *layout reflows* pada thread utama peramban mobile.

4. **Aksesibilitas (WCAG AA Contrast & Heading Sequence)**:
   - Kontras warna teks sekunder, badge ("Dimoderasi", "9 mnt", kategori) ditingkatkan ke tingkat kontras tinggi (`rose-700/800`, `slate-700/800`, `emerald-900`).
   - Hierarki Heading berurutan rapi: `<h1>` (Judul Halaman/Artikel) ➔ `<h2>` (Daftar Isi, Bagian Konten, Komentar, Rekomendasi) ➔ `<h3>` (Subbagian, Penulis, Kartu Artikel).

5. **Tipografi Ramah Baca Mobile (High Readability for Parents)**:
   - **Ukuran & Spasi Paragraf**: Teks isi artikel berukuran 17px (`1.0625rem`) di mobile dengan *line-height* renggang `1.6` (27px) dan jarak paragraf 18px (`1.125rem`).
   - **Skalabilitas Judul**: H1 (26px), H2 (21px), H3 (19px) di layar sentuh dengan ketebalan 700-800 dan *line-height* rapat `1.25 - 1.3`.
   - **Batas Lebar Baca**: Panjang baris dibatasi maksimal `68ch` dengan *horizontal padding* minimum 16px untuk kenyamanan mata saat membaca durasi panjang.
