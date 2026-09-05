# 📖 Panduan Instalasi & Konfigurasi Blog Engine `parenting.my.id`

Dokumen ini berisi panduan teknis lengkap mengenai cara melakukan instalasi, konfigurasi database Cloudflare D1, integrasi GitHub REST API, setting DNS, setting Worker/Pages Cloudflare, panduan keamanan sistem, serta optimalisasi performa animasi.

---

## 🛠️ Ringkasan Fitur Utama & Arsitektur
- **Frontend SPA**: React 19, Vite 6, Tailwind CSS v4, Lucide Icons, TypeScript.
- **Backend Edge**: Cloudflare Pages / Workers Function (`functions/api/[[path]].ts`) & Express proxy lokal (`server.ts`).
- **Database**: Cloudflare D1 Serverless SQLite (`parenting-db`) dengan sinkronisasi local data di folder `/data` untuk mode dev.
- **Penyimpanan Media**: Cloudinary API (WebP Pipeline) dengan fallback otomatis ke GitHub Storage (`public/uploads/`) dan penyimpanan lokal dev.
- **Sinkronisasi File Statis**: Otomatis memperbarui `llms.txt`, `llms-full.txt`, `sitemap.xml`, dan `feed.xml` ke repositori GitHub via GitHub REST API.
- **Optimasi Animasi**: Lolos audit Lighthouse dari peringatan "Avoid Non-Composited Animations" dengan mengganti `transition-all` menjadi transisi spesifik seperti `transition-colors` dan transisi berbasis akselerasi GPU (`transition-transform`).

---

## 🗄️ 1. Skema SQL / Database (Cloudflare D1)

Jalankan perintah SQL berikut di **Console Cloudflare D1 Database (`parenting-db`)** untuk menginisialisasi skema tabel:

```sql
-- 1. Tabel Users (Penulis & Admin)
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

-- 2. Tabel Posts (Artikel CMS)
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  meta_title TEXT,
  meta_description TEXT,
  category TEXT NOT NULL,
  author_id INTEGER NOT NULL,
  author_name TEXT,
  author_role TEXT DEFAULT 'admin',
  status TEXT DEFAULT 'draft',
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  image_url TEXT,
  image_caption TEXT,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  tags TEXT,
  reading_time_minutes INTEGER DEFAULT 3,
  is_editors_pick INTEGER DEFAULT 0,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- 3. Tabel Configs (Pengaturan Situs Dual-Write)
CREATE TABLE IF NOT EXISTS configs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Categories (Kategori Artikel)
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Autolinks (In-Article Internal Linking)
CREATE TABLE IF NOT EXISTS autolinks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Comments (Komentar & Moderasi Admin)
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id)
);
```

---

## 💻 2. Cara Instalasi SPA (Lokal / Development)

1. **Clone Repositori**:
   ```bash
   git clone https://github.com/roywikan/parenting-my-id.git
   cd parenting-my-id
   ```

2. **Instal Dependencies**:
   ```bash
   npm install
   ```

3. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

4. **Build untuk Produksi**:
   ```bash
   npm run build
   ```

---

## 🐙 3. Cara Setting GitHub & Token Akses (PAT)

1. **Fork Repositori**:
   - Buka `https://github.com/roywikan/parenting-my-id` lalu klik **Fork**.
2. **Buat Personal Access Token (PAT)**:
   - Masuk ke **GitHub Settings ➔ Developer Settings ➔ Personal access tokens (classic)**.
   - Klik **Generate new token (classic)**.
   - Beri nama (misal: `Parenting-CMS-Token`).
   - Pilih scope: **`repo`** (Full control of private repositories).
   - Salin token yang dihasilkan (`ghp_xxxxxxxxxxxxxxxxxxxx`).

---

## 🌐 4. Cara Setting DNS di Cloudflare

1. Masuk ke Dashboard **Cloudflare** (`dash.cloudflare.com`).
2. Buka domain Anda (`parenting.my.id`).
3. Masuk ke menu **DNS ➔ Records**.
4. Tambahkan CNAME record untuk apex domain atau subdomain:
   - **Type**: `CNAME`
   - **Name**: `@` (atau `parenting`)
   - **Target**: `<nama-project-pages>.pages.dev`
   - **Proxy status**: `Proxied` (Awan Oranye aktif).
5. Atur SSL/TLS ke mode **Full** atau **Flexible**.

---

## ⚡ 5. Cara Setting Cloudflare D1 & Worker / Pages

1. **Buat Database D1**:
   - Di Dashboard Cloudflare, buka **Workers & Pages ➔ D1 SQL Database**.
   - Klik **Create Database**, beri nama `parenting-db`.
   - Buka Console D1 lalu eksekusi skrip SQL dari Poin 1 di atas.

2. **Hubungkan D1 & Environment Variables di Cloudflare Pages**:
   - Masuk ke **Workers & Pages ➔ [Nama Project Pages Anda] ➔ Settings ➔ Functions**.
   - **D1 Database Bindings**:
     - Variable name: `DB`
     - D1 database: `parenting-db`
   - **Environment Variables**:
     - `SITE_URL`: `https://parenting.my.id`
     - `JWT_SECRET`: `[string_acak_panjang_rahasia]`
     - `GITHUB_TOKEN`: `ghp_xxxxxxxxxxxxxxxxxxxx`
     - `GITHUB_OWNER`: `username_github_anda`
     - `GITHUB_REPO`: `parenting-my-id`
     - `CLOUDINARY_URL`: `cloudinary://key:secret@cloudname` (opsional jika menggunakan Cloudinary)

---

## 🔒 6. Prosedur Reset & Keamanan Kredensial Cloudinary (Mandatori)

Jika kredensial API Cloudinary sempat terekspos dalam kode riwayat sebelumnya, Anda harus segera melakukan reset demi mencegah penyalahgunaan kuota penyimpanan:

1. **Reset di Cloudinary Dashboard**:
   - Masuk ke **Cloudinary Dashboard**.
   - Klik **Settings (Ikon Gigi)** ➔ **Access Keys**.
   - Cari baris API Key yang aktif, lalu klik tombol **Regenerate / Reset API Secret**.
   - Salin API Secret baru yang dihasilkan. API Secret yang lama otomatis tidak lagi berlaku.
2. **Konfigurasi Cloudflare Pages**:
   - Masuk ke **Cloudflare Dashboard** ➔ **Workers & Pages** ➔ Pilih Project ➔ **Settings** ➔ **Environment Variables**.
   - Masukkan variabel lingkungan `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, dan `CLOUDINARY_API_SECRET` (masukkan nilai rahasia baru Anda).
   - Klik **Save** dan lakukan redeployment halaman.
3. **Konfigurasi GitHub Secrets (Opsional)**:
   - Jika menggunakan pipeline CI/CD GitHub Actions, masuk ke Repositori Anda ➔ **Settings** ➔ **Secrets and variables** ➔ **Actions**.
   - Tambahkan `CLOUDINARY_API_SECRET` sebagai secret repositori baru Anda.

---

## 📚 7. Fitur Referensi Jurnal Ilmiah Otomatis

Untuk mempermudah penulisan artikel ilmiah berkualitas tinggi dan ramah SEO medis/edukasi, sistem dilengkapi dengan parser referensi ilmiah otomatis:

- **Cara Penulisan di Editor**:
  - Tulis kutipan atau referensi langsung di akhir kalimat menggunakan sintaks:
    `[ref: Dari Peneliti, Judul Jurnal / Artikel, Tahun Terbit, Penerbit/URL]`
  - Contoh: `Pola tidur anak sangat memengaruhi pertumbuhan fisik dan kognitif [ref: Sari et al., Jurnal Gizi Anak & Balita Indonesia, 2026].`
- **Hasil Render Otomatis**:
  - Teks referensi dalam tanda kurung siku akan digantikan secara otomatis dengan tautan superskrip (misalnya `[1]`).
  - Di bagian paling bawah artikel, sistem akan membuat kontainer **📚 Referensi Ilmiah & Jurnal** secara otomatis yang memuat seluruh pustaka referensi berurutan lengkap dengan tautan timbal balik (`↩`) untuk memudahkan navigasi pembaca.

---

## 🔒 8. Kebijakan Keamanan & Cara Setting Suffix Rahasia Admin (`admin_url_suffix`)

Sistem menerapkan proteksi **Secret Admin Path Suffix & Zero-Leak Decoy**:
- Path standar `/admin` **dikunci penuh sebagai Umpan / Decoy** dan mengembalikan respons **HTTP 404 Not Found**.
- Sistem **TIDAK PERNAH melakukan redirect dari `/admin` ke path rahasia**, sehingga peretas (*attacker*) dan *bot scanner* tidak mendapatkan petunjuk apa pun mengenai keberadaan URL login admin.
- Akses ke portal admin hanya bisa dilakukan via `/admin-[suffix]` (default: `/admin-9999`).
- **Pemberitahuan Konfidensial (Mouth-to-Mouth):** Informasi URL `/admin-[suffix]` hanya diberitahukan secara manual dari mulut ke mulut / grup internal terbatas kepada Admin, Editor, dan Penulis (*Writer*). Jangan cantumkan URL ini di dokumen publik atau file `robots.txt`.

### 🚨 INSTRUKSI WAJIB: Mengubah Default Suffix `9999`
Untuk mencegah pemindaian otomatis oleh *bot scanner* & serangan *brute force*, Anda **WAJIB SEGERA MENGUBAH** suffix bawaan `9999` ini setelah instalasi pertama:

1. Buka Portal Admin di peramban Anda: `https://parenting.my.id/admin-9999`.
2. Masuk menggunakan akun admin.
3. Buka tab **Config Situs** ➔ Gulir ke bawah hingga bagian **Teks Halaman Login Admin**.
4. Pada kolom **🔒 Suffix Rahasia URL Admin (admin_url_suffix)**, ubah nilai `9999` menjadi 4 karakter alfanumerik rahasia pilihan Anda (contoh: `6969`, `kuda`, `p4ss`, `x777`).
5. Klik tombol **Simpan Seluruh Konfigurasi Situs**.
6. URL aktif Portal Admin Anda kini berpindah secara instan ke `https://parenting.my.id/admin-[suffix_baru_anda]`. Akses langsung ke `/admin` tetap mengembalikan 404 tanpa mengalihkan ke URL baru.

---

## ⚡ 9. Optimasi Performa & Refaktor Animasi (Composited Animations)

Untuk meningkatkan skor performa audit Lighthouse dan menghilangkan masalah "Avoid Non-Composited Animations":
- **Eliminasi `transition-all`**: Digantikan dengan properti transisi spesifik seperti `transition-colors` pada tombol, tab selector, badge status, dan tautan. Ini menghemat penggunaan CPU/GPU karena tidak memicu siklus layout/paint ulang (reflow) pada ukuran margin, padding, dan border-radius.
- **Hover Zoom GPU-Accelerated**: Transisi perbesaran elemen (misal `hover:scale-105`) memanfaatkan properti `transition-transform` untuk memaksa rendering di tingkat hardware GPU compositor thread, meminimalisir Cumulative Layout Shift (CLS) dan menjamin kecepatan 60 FPS.
- **Admin Switch Toggles**: Pengaturan toggle saklar di portal admin dioptimalkan dengan transisi `after:transition-transform` pada pergerakan dot slider.
