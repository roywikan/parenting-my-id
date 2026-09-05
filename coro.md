# 📖 Panduan Instalasi & Konfigurasi Blog Engine `parenting.my.id` (Konfidensial)

Dokumen ini berisi panduan teknis internal yang sangat rahasia mengenai cara melakukan instalasi, konfigurasi database Cloudflare D1, integrasi GitHub REST API, setting DNS, setting Worker/Pages Cloudflare, panduan keamanan sistem, serta optimalisasi performa animasi.

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
     - `CLOUDINARY_CLOUD_NAME`: `nama_cloud_anda`
     - `CLOUDINARY_API_KEY`: `kunci_api_anda`
     - `CLOUDINARY_API_SECRET`: `rahasia_api_anda`

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
   - Masukkan variabel lingkungan `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, dan `CLOUDINARY_API_SECRET` (pastikan **opsi enkripsi diaktifkan** untuk `CLOUDINARY_API_SECRET`).
   - Klik **Save** dan lakukan pemicuan redeployment halaman (**Trigger Re-deploy**).

---

## 🛡️ 7. Keamanan & Pipeline Media (Failover Otomatis)
Sistem pengunggahan media dalam aplikasi ini dilengkapi dengan proteksi berlapis guna menjaga performa dan kestabilan situs:

* **Proteksi Middleware**: Seluruh rute pengunggahan (`POST /api/upload`, `/api/upload-cloudinary`, dan `/api/upload-github`) dilindungi menggunakan middleware otentikasi ketat (`requireAuth(['admin'])`). Hanya administrator terverifikasi yang diperbolehkan mengunggah media.
* **Pembatasan Ukuran Payload**:
  * **Sisi Client**: Validasi file input membatasi ukuran maksimal hingga **3 MB** sebelum dikirim ke server.
  * **Sisi Server**: Payload Base64 divalidasi ketat maksimal **5 MB** (HTTP 413 Payload Too Large) untuk mencegah serangan DoS berbasis memori.
* **Transformasi Otomatis (WebP)**: Semua gambar yang dikirimkan ke Cloudinary akan secara otomatis dioptimasi dengan query transformasi format `f_webp` dan kompresi kualitas dinamis `q_auto` (lebar batas maksimal `w_1024`) untuk menjamin kecepatan pemuatan gambar di browser serta performa SEO terbaik.
* **Failover Bulletproof (GitHub / Local Storage)**:
  * Jika Cloudinary mengalami gangguan (down) atau kredensial variabel lingkungan belum dikonfigurasi, sistem secara cerdas akan langsung mengalihkan rute unggah ke **GitHub Storage** atau **Local Filesystem Disk** (`public/uploads`) sebagai jalur penyelamatan cadangan agar admin tetap dapat menulis artikel tanpa kendala.

---

## 📚 8. Fitur Referensi Jurnal Ilmiah Otomatis

Untuk mempermudah penulisan artikel ilmiah berkualitas tinggi dan ramah SEO medis/edukasi, sistem dilengkapi dengan parser referensi ilmiah otomatis:

- **Cara Penulisan di Editor**:
  - Tulis kutipan atau referensi langsung di akhir kalimat menggunakan sintaks:
    `[ref: Dari Peneliti, Judul Jurnal / Artikel, Tahun Terbit, Penerbit/URL]`
  - Contoh: `Pola tidur anak sangat memengaruhi pertumbuhan fisik dan kognitif [ref: Sari et al., Jurnal Gizi Anak & Balita Indonesia, 2026].`
- **Hasil Render Otomatis**:
  - Teks referensi dalam tanda kurung siku akan digantikan secara otomatis dengan tautan superskrip (misalnya `[1]`).
  - Di bagian paling bawah artikel, sistem akan membuat kontainer **📚 Referensi Ilmiah & Jurnal** secara otomatis yang memuat seluruh pustaka referensi berurutan lengkap dengan tautan timbal balik (`↩`) untuk memudahkan navigasi pembaca.

---

## 🔒 9. Kebijakan Keamanan & Cara Setting Suffix Rahasia Admin (`admin_url_suffix`)

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

## ⚡ 10. Optimasi Performa & Refaktor Animasi (Composited Animations)

Untuk meningkatkan skor performa audit Lighthouse dan menghilangkan masalah "Avoid Non-Composited Animations":
- **Eliminasi `transition-all`**: Digantikan dengan properti transisi spesifik seperti `transition-colors` pada tombol, tab selector, badge status, dan tautan. Ini menghemat penggunaan CPU/GPU karena tidak memicu siklus layout/paint ulang (reflow) pada ukuran margin, padding, dan border-radius.
- **Hover Zoom GPU-Accelerated**: Transisi perbesaran elemen (misal `hover:scale-105`) memanfaatkan properti `transition-transform` untuk memaksa rendering di tingkat hardware GPU compositor thread, meminimalisir Cumulative Layout Shift (CLS) dan menjamin kecepatan 60 FPS.
- **Admin Switch Toggles**: Pengaturan toggle saklar di portal admin dioptimalkan dengan transisi `after:transition-transform` pada pergerakan dot slider.

---

## 🛡️ 11. Cara Setting & Aktivasi Cloudflare Turnstile (Anti-Spam & Bot Protection)

Aplikasi ini menggunakan **Cloudflare Turnstile** sebagai sistem pelindung CAPTCHA modern, ramah pengguna, dan ringan guna memblokir 99.9% bot spam pada:
1. **Formulir login Admin** (`/admin-[suffix]`)
2. **Formulir pengiriman komentar pembaca** (`POST /api/comments`)

### Langkah-langkah Pengaturan & Aktivasi:

1. **Buat Turnstile Widget di Cloudflare Dashboard**:
   - Masuk ke dashboard Cloudflare ➔ **Turnstile** ➔ **Add Site**.
   - Masukkan nama widget (misal: `Parenting.my.id CMS`).
   - Masukkan domain (misal: `parenting.my.id`).
   - Pilih jenis widget: **Managed (Recommended)** atau **Non-interactive**.
   - Salin **Site Key** dan **Secret Key** yang dihasilkan.

2. **Daftarkan Kunci di Aplikasi**:
   - **Sisi Client (Site Key)**: Buka Portal Admin ➔ Tab **Config Situs** ➔ Masukkan nilai **Site Key** ke kolom **Turnstile Site Key**. Klik **Simpan**.
   - **Sisi Server (Secret Key)**: Masuk ke dashboard Cloudflare Pages Anda ➔ **Settings** ➔ **Environment Variables**. Tambahkan variabel lingkungan `TURNSTILE_SECRET_KEY` dan isi dengan **Secret Key** Turnstile Anda (aktifkan pilihan enkripsi). Lakukan **Trigger Re-deploy** agar perubahan diterapkan.

3. **Mekanisme Failover Pengujian Lokal / Offline**:
   - Jika `TURNSTILE_SECRET_KEY` tidak diatur di file `.env` lokal atau Cloudflare Pages, sistem server dan edge akan mendeteksi kunci unified testing secara otomatis untuk mempermudah pengerjaan development offline tanpa merusak fungsionalitas web.

---

## 🔒 12. Header Keamanan Tambahan (HTTP Security Headers)

Untuk meningkatkan proteksi keamanan browser pengguna dan mencegah serangan modern, berkas `/public/_headers` telah dikonfigurasi untuk menyajikan header keamanan HTTP bawaan Cloudflare Pages berikut pada setiap respons:

```http
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Penjelasan Proteksi:
- **`X-Frame-Options: SAMEORIGIN`**: Melindungi situs dari serangan *Clickjacking* dengan memastikan halaman situs tidak dapat dibingkai (iframe) oleh domain luar yang mencurigakan.
- **`X-Content-Type-Options: nosniff`**: Mencegah serangan eksploitasi berbasis tipe MIME (*MIME-sniffing*) dengan memaksa browser mengikuti deklarasi header `Content-Type` yang sah dari server.
- **`Referrer-Policy: strict-origin-when-cross-origin`**: Melindungi kebocoran data sensitif dalam URL rujukan (*referrer URL*) saat melompat antar origin berbeda.
- **`Permissions-Policy`**: Menonaktifkan penuh hak akses sensor peramban yang tidak diperlukan (kamera, mikrofon, geolokasi) untuk menghilangkan celah pembajakan peranti keras.

---

## 📚 13. Sistem Referensi Ilmiah Otomatis (E-E-A-T Academic Citations)

Untuk menunjang otoritas artikel dan nilai E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) situs, aplikasi menyediakan cara termudah bagi penulis untuk menyisipkan referensi ke jurnal ilmiah atau sumber tepercaya langsung di dalam tulisan.

### Cara Penggunaan bagi Penulis:
Penulis dapat mengetikkan salah satu dari kode kurung siku berikut di akhir kalimat yang membutuhkan sitasi ilmiah:

1. **Format Umum (`ref`)**:
   `[ref: Dr. Ratna Sari, "Stimulasi Motorik Balita", Jurnal Gizi & Tumbuh Kembang Anak, 2026]`
2. **Format Alternatif (`referensi` / `jurnal`)**:
   `[referensi: World Health Organization, "Pencegahan Stunting Global", WHO Reports, 2025]`
   `[jurnal: Ahmad Zulkarnain, "Analisis Pola Tidur Bayi", Jurnal Medika, 2026, https://doi.org/10.1234/medika.2026.01]`

### Fitur Otomatis yang Dihasilkan:
1. **Superscript Link di Tengah Kalimat**:
   Sistem akan secara otomatis menyulap tag kurung siku tersebut menjadi nomor rujukan kecil melayang (superscript), seperti `[1]`, `[2]`, dst. yang interaktif.
2. **Auto-Linkify URL & DOI**:
   Jika menyertakan tautan web atau URL DOI (diawali `http://` atau `https://`), tautan tersebut akan otomatis diubah menjadi tautan hidup yang dapat diklik oleh pembaca pada daftar referensi.
3. **Kompilasi Daftar Referensi di Akhir Artikel**:
   Semua referensi yang ditulis di dalam artikel akan dihimpun, diurutkan, dan disajikan secara otomatis dalam panel khusus bertajuk **"📚 Referensi Ilmiah & Jurnal"** di bagian akhir artikel lengkap dengan navigasi bolak-balik (tautan balik `↩`) agar pembaca dapat berpindah secara instan antara tulisan dan daftar referensi.

---

## ✨ 14. Panduan Lengkap AI Content Assistant (Google Gemini AI SEO Generator)

Sistem portal admin dilengkapi dengan fitur **AI Content Assistant** berbasis Google Gemini AI. Fitur ini dirancang untuk secara otomatis membuat **Meta Title**, **Meta Description**, **Ringkasan (Excerpt)**, dan **Tag SEO** yang optimal dalam hitungan detik berdasarkan isi artikel yang ditulis.

### 📋 Syarat & Ketentuan Agar Fitur Berjalan Maksimal:
1. **Memiliki Google Gemini API Key**:
   Kunci API diperlukan agar server atau edge function Cloudflare Pages dapat terhubung secara resmi ke model cerdas `gemini-2.5-flash` milik Google.
2. **Konfigurasi Environment Variable**:
   Kunci API harus didaftarkan di dalam panel Cloudflare Pages dengan nama variabel lingkungan `GEMINI_API_KEY`.
3. **Smart Fallback System**:
   Jika `GEMINI_API_KEY` belum terpasang atau terjadi limitasi jaringan, sistem memiliki algoritma **Smart Fallback** bawaan (menggunakan regex pintar ekstraksi struktur teks) untuk mengisi Metadata SEO, Ringkasan, dan Tag secara otomatis tanpa memicu error/crash di sisi admin.

---

### 🔑 Cara Memasang API Key pada Cloudflare Pages:

Untuk mengaktifkan asisten cerdas Gemini AI pada situs produksi `parenting.my.id` Anda menggunakan API Key yang Anda sediakan:

1. **Masuk ke Cloudflare Dashboard**:
   Buka peramban dan masuk ke akun Cloudflare Anda melalui [https://dash.cloudflare.com/](https://dash.cloudflare.com/).
2. **Buka Menu Workers & Pages**:
   Pilih akun Anda, kemudian navigasi ke menu **Workers & Pages** di sidebar sebelah kiri, lalu pilih proyek Pages Anda (misal: `parenting-my-id`).
3. **Akses Pengaturan Variabel Lingkungan**:
   * Klik tab **Settings** di bagian atas proyek.
   * Pilih submenu **Environment Variables** di kolom sebelah kiri.
4. **Tambahkan Variabel `GEMINI_API_KEY`**:
   * Di bawah bagian **Production** (dan juga **Preview** jika diperlukan), klik tombol **Add variable** / **Edit variables**.
   * Masukkan nama kunci variabel: `GEMINI_API_KEY`
   * Masukkan nilai kunci API Anda secara utuh:
     `AQ.....Dzg`
   * Sangat disarankan untuk mengklik pilihan **Encrypt** agar nilai API Key terlindungi dari publik.
   * Klik tombol **Save** di bagian kanan bawah.
5. **Lakukan Trigger Re-deploy**:
   Agar variabel lingkungan yang baru didaftarkan tersebut terbaca oleh Cloudflare Pages Edge Functions, buka tab **Deployments**, pilih deployment terbaru Anda, lalu klik **Retry deployment** (atau lakukan commit/push baru ke repositori GitHub Anda).

---

### 🚀 Cara Menggunakan Tombol "AI Content Assistant" di Portal Admin:

Setelah API Key terpasang dengan sukses, penulis atau editor dapat menggunakannya dengan langkah mudah berikut:

1. **Buka Editor Artikel**:
   Masuk ke Portal Admin, klik menu **Tulis Artikel Baru** (atau edit artikel draf yang sudah ada).
2. **Tulis Judul & Konten Utama**:
   * Masukkan **Judul Artikel** (misal: *Tips Melatih Fokus Anak Melalui Permainan Montessori*).
   * Ketik atau tempelkan **Isi Artikel (Markdown/Konten)** di kotak editor utama.
3. **Klik Tombol Asisten AI**:
   * Scroll ke bagian bawah atau tengok panel sidebar berlabel **"SEO & Meta Tag Metadata"**.
   * Klik tombol **"✨ AI Content Assistant"** (berwarna merah muda/rose berlogo bintang).
4. **Proses AI & Pengisian Otomatis**:
   * Asisten AI akan menganalisis judul dan konten Anda secara cerdas menggunakan model `gemini-2.5-flash`.
   * Kolom **Meta Title**, **Meta Description**, **Ringkasan (Excerpt)**, dan **Tag SEO** akan terisi secara otomatis dengan optimasi kata kunci parenting berbobot tinggi.
   * Anda dapat meninjau kembali hasilnya, mengeditnya secara manual jika diperlukan, sebelum mengeklik tombol **Simpan Draf** atau **Kirim Peninjauan**.

---

## 🖼️ 15. Panduan Konfigurasi & Penggunaan Cloudinary (Penyimpanan Media & WebP Pipeline)

Untuk menunjang Core Web Vitals dan SEO performa tinggi, sistem pengunggahan gambar pada `parenting.my.id` diintegrasikan dengan **Cloudinary**. Cloudinary berfungsi sebagai Content Delivery Network (CDN) yang otomatis mengonversi seluruh gambar unggahan menjadi format **WebP ultra-ringan** dan menerapkan kompresi dinamis tanpa mengurangi kualitas visual (*lossless optimization*).

### 📋 Tahap 1: Registrasi & Pengambilan API Key di Cloudinary
1. **Buat Akun Gratis**:
   Kunjungi [https://cloudinary.com/](https://cloudinary.com/) lalu daftarkan akun baru (gratis menyediakan kuota penyimpanan melimpah hingga 25 GB per bulan).
2. **Buka Cloudinary Dashboard**:
   Setelah masuk, Anda akan langsung berada di halaman **Dashboard** utama.
3. **Salin Tiga Kredensial Utama**:
   Di bagian atas dashboard (Product Environment Credentials), cari dan salin tiga parameter berikut:
   * **Cloud Name** (Contoh: `dparenting`)
   * **API Key** (Contoh: `123456789012345`)
   * **API Secret** (Klik ikon mata untuk menampilkan string rahasia Anda)

---

### 🔑 Tahap 2: Mendaftarkan Kredensial Cloudinary ke Cloudflare Pages

Agar sistem Cloudflare Pages Edge Functions dapat mengunggah gambar secara langsung ke Cloudinary:

1. **Buka Dashboard Cloudflare**:
   Masuk ke akun Cloudflare Anda, buka menu **Workers & Pages**, lalu pilih proyek Pages Anda (misal: `parenting-my-id`).
2. **Navigasi ke Pengaturan Variabel Lingkungan**:
   Klik tab **Settings** di atas, lalu pilih submenu **Environment Variables** di sisi kiri.
3. **Tambahkan Tiga Variabel Berikut**:
   Klik tombol **Add variable** / **Edit variables** di bawah bagian **Production** (dan **Preview** jika diperlukan), kemudian masukkan:
   * **Variabel 1**:
     * **Name**: `CLOUDINARY_CLOUD_NAME`
     * **Value**: *Isi dengan Cloud Name Anda*
   * **Variabel 2**:
     * **Name**: `CLOUDINARY_API_KEY`
     * **Value**: *Isi dengan API Key Anda*
   * **Variabel 3**:
     * **Name**: `CLOUDINARY_API_SECRET`
     * **Value**: *Isi dengan API Secret Anda*
     * *Catatan Penting: Centang pilihan **Encrypt** untuk mengamankan nilai API Secret.*
4. **Simpan & Deploy Ulang**:
   * Klik tombol **Save** di kanan bawah.
   * Masuk ke tab **Deployments**, klik titik tiga pada deployment terbaru, lalu pilih **Retry deployment** (atau lakukan commit/push baru ke repositori GitHub Anda) agar perubahan variabel lingkungan aktif.

*Untuk pengujian pengembangan di komputer lokal, Anda juga dapat mendaftarkan variabel di atas ke dalam berkas `.env` lokal Anda:*
```env
CLOUDINARY_CLOUD_NAME=nama_cloud_anda
CLOUDINARY_API_KEY=kunci_api_anda
CLOUDINARY_API_SECRET=rahasia_api_anda
```

---

### 🚀 Tahap 3: Cara Menggunakan Fitur Unggah Gambar di Portal Admin

Setelah Cloudinary dikonfigurasi, sistem upload gambar di portal admin akan bekerja secara otomatis tanpa memerlukan input tambahan dari penulis:

1. **Buka Halaman Tulis Artikel**:
   Masuk sebagai Admin, Editor, atau Penulis, lalu buka editor artikel.
2. **Pilih atau Seret Gambar Sampul**:
   * Di dalam kartu **"Gambar Utama / Featured Image"** atau tombol **"Upload Gambar"** di toolbar editor, Anda dapat mengklik area upload atau menyeret (*drag and drop*) gambar dari komputer Anda.
   * Format yang didukung: JPG, JPEG, PNG, WEBP, GIF (Batas ukuran maksimal disarankan: **3 MB**).
3. **Otomatisasi Pipeline Pengunggahan**:
   * Sistem akan mengompresi gambar dan mengirimkannya ke endpoint aman `/api/upload-cloudinary`.
   * Cloudinary memproses gambar dan menerapkan transformasi optimal:
     * `f_webp`: Otomatis mengubah gambar menjadi format generasi baru WebP.
     * `q_auto`: Menyesuaikan kompresi kualitas gambar secara cerdas dan adaptif.
     * `w_1024`: Membatasi lebar gambar maksimal 1024 piksel agar hemat bandwidth.
   * Alamat URL gambar CDN Cloudinary berkecepatan tinggi yang dihasilkan (misal: `https://res.cloudinary.com/...`) akan langsung terisi ke kolom sampul atau dimasukkan sebagai sintaks gambar Markdown di posisi kursor Anda.
4. **Mekanisme Penyelamatan Otomatis (Failover)**:
   * Jika kredensial Cloudinary belum diisi, kuota habis, atau server Cloudinary mengalami gangguan (down), sistem secara cerdas akan langsung mengalihkan pengunggahan ke **GitHub Storage** atau **Disk Lokal** (`public/uploads`) secara senyap.
   * Dengan sistem failover ini, penulis dijamin dapat terus menulis dan mengunggah gambar tanpa pernah melihat pesan error atau terhambat proses penulisan artikelnya!





