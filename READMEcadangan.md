```markdown
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
   git clone [https://github.com/](https://github.com/)<username-github-anda>/parenting-my-id.git
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
  avatar TEXT DEFAULT '[https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80](https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80)',
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
* **Framework preset**: `Vite` (atau `None`)
* **Build command**: `npm run build`
* **Build output directory**: `dist`


6. Buka bagian **Environment variables (advanced)** dan tambahkan variabel rahasia berikut:
* `SITE_URL`: `https://parenting.my.id`
* `GITHUB_TOKEN`: *(Kode token GitHub `ghp_...` dari Langkah 1B)*
* `GITHUB_OWNER`: *(Username GitHub Anda)*
* `GITHUB_REPO`: `parenting-my-id`
* `GITHUB_BRANCH`: `main`
* `JWT_SECRET`: *(String acak rahasia untuk otentikasi session)*


7. Klik **Save and Deploy**.

### D. Menghubungkan D1 Binding & Custom Domain

1. Setelah deployment pertama selesai, buka proyek Pages Anda di Cloudflare -> Tab **Settings** -> **Functions**.
2. Gulir ke bawah ke bagian **D1 database bindings**.
3. Klik **Add binding**:
* **Variable name**: `DB`
* **D1 database**: Pilih `parenting-db`


4. Klik **Save**. *(Lakukan re-deploy project di tab Deployments jika diperlukan agar binding aktif).*
5. Masuk ke tab **Custom domains** -> Klik **Set up a custom domain**.
6. Ketik `parenting.my.id` dan klik **Continue**. Cloudflare akan memverifikasi DNS dan mengaktifkan sertifikat SSL HTTPS.

---

## ⚙️ LANGKAH 3: Kustomisasi Pengaturan di Admin Panel (`/admin`)

1. Akses halaman admin di web Anda: `https://parenting.my.id/#admin` (atau klik tombol **Portal Admin** di header).
2. Login dengan akun bawaan atau akun admin yang dibuat di database D1.
3. Buka tab **⚙️ Configs Situs**:
* **Badge Samping Logo Header (`header_badge_text`)**: Ubah teks badge hijau di header desktop (misal: `"Cloudflare D1 Edge Engine"` atau `"Portal Resmi"`).
* **Label Tombol Portal Admin (`mobile_admin_btn_label`)**: Ubah label tombol admin di header/mobile drawer.
* **Teks Halaman Login Admin**: Sesuaikan judul dan sub-judul portal admin.
* **Domain Situs (`site_domain`)**: Setel domain utama situs.
* **Metrik Performa Situs**: Sesuaikan angka metrik seperti *Jumlah Artikel Terverifikasi*, *Traffic Bulanan*, *Skor Kecepatan CDN*, dsb.
* **Footer & Running Ticker**: Atur teksrunning ticker topik trending dan badge jaminan footer.


4. Klik tombol **Simpan Konfigurasi Situs**. Perubahan akan langsung tersimpan di database **Cloudflare D1** dan tersinkronisasi ke file `public/site_config.json`.

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
* Memilih salah satu preset kategori parenting yang tersedia (seperti *Bayi & Balita*, *Pola Asuh*, *Kehamilan*, *Nutrisi & Makanan*, *Sensory Play*, *Keluarga Bahagia*).
* Atau mengetik kata kunci custom pada kolom pencarian (misal: `toddler`, `breastfeeding`, `parenting`).


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
* **Upload File**: Unggah gambar fisik dari komputer Anda.
* **Galeri Unsplash**: Pilih dari pustaka gambar Unsplash bebas royalti.
* **URL Direct**: Tempel alamat URL gambar eksternal.


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

```

```html
<h1>🚀 Panduan Lengkap Setup &amp; Penggunaan Blog Engine <code>parenting.my.id</code></h1>

<p>Sistem Blog Engine modern, ultra-cepat, dan SEO-friendly ini beroperasi sepenuhnya secara <strong>Cloud-Native</strong> menggunakan <strong>Cloudflare Pages / Workers</strong>, <strong>Cloudflare D1 (Serverless SQLite)</strong>, <strong>Unsplash API/Integration</strong>, dan <strong>GitHub REST API</strong>.</p>

<p>Penulis dan Admin dapat mengelola artikel, gambar, SEO meta, serta konfigurasi situs secara interaktif dari browser desktop maupun mobile.</p>

<hr>

<h2>📋 Prasyarat (100% Gratis)</h2>
<ol>
  <li>Akun <strong>GitHub</strong> (<a href="https://github.com">github.com</a>)</li>
  <li>Akun <strong>Cloudflare</strong> (<a href="https://cloudflare.com">cloudflare.com</a>)</li>
  <li>Domain <strong>parenting.my.id</strong> (atau domain pribadi Anda) yang DNS-nya diarahkan ke Cloudflare.</li>
</ol>

<hr>

<h2>🍴 LANGKAH 1: Cloning / Fork Repo GitHub &amp; Token Akses</h2>

<h3>A. Fork / Clone Repositori</h3>
<ol>
  <li>Buka repositori kode di GitHub (<a href="https://github.com/roywikan/parenting-my-id">github.com/roywikan/parenting-my-id</a>).</li>
  <li>Klik tombol <strong>Fork</strong> di pojok kanan atas untuk menyalin repositori ke akun GitHub Anda.</li>
  <li>Beri nama repositori, misalnya <code>parenting-my-id</code>.</li>
  <li><em>(Opsional)</em> Jika ingin mengedit kode di laptop secara lokal, jalankan perintah clone di terminal Anda:
    <pre><code class="language-bash">git clone https://github.com/&lt;username-github-anda&gt;/parenting-my-id.git
cd parenting-my-id
npm install
npm run dev</code></pre>
  </li>
</ol>

<h3>B. Membuat Personal Access Token (PAT) GitHub</h3>
<p>Personal Access Token digunakan agar backend CMS di Cloudflare Worker dapat mengunggah file gambar fisik ke <code>/public/uploads/</code> dan menyinkronkan file konfigurasi (<code>site_config.json</code>, <code>llms.txt</code>) secara otomatis ke GitHub.</p>

<ol>
  <li>Buka <a href="https://github.com/settings/tokens">github.com/settings/tokens</a>.</li>
  <li>Klik <strong>Generate new token (classic)</strong>.</li>
  <li>Isikan Note: <code>Cloudflare Parenting CMS Token</code>.</li>
  <li>Beri centang pada centang hak akses <strong><code>repo</code></strong> (Full control of private repositories).</li>
  <li>Klik <strong>Generate token</strong>.</li>
  <li>Salin kode token yang muncul (contoh: <code>ghp_xxxxxxxxxxxxxxxxxxxx</code>). <em>Simpan token ini karena tidak akan ditampilkan lagi.</em></li>
</ol>

<hr>

<h2>☁️ LANGKAH 2: Instalasi di Cloudflare (DNS, D1, Workers/Pages, Secrets)</h2>

<h3>A. Konfigurasi DNS &amp; Custom Domain</h3>
<ol>
  <li>Masuk ke Dashboard Cloudflare (<a href="https://dash.cloudflare.com">dash.cloudflare.com</a>).</li>
  <li>Tambahkan domain Anda (contoh: <code>parenting.my.id</code>) dan ikuti petunjuk pengubahan Nameservers di registrar domain Anda.</li>
  <li>Pastikan SSL/TLS Encryption Mode disetel ke <strong>Full</strong> atau <strong>Flexible</strong>.</li>
</ol>

<h3>B. Membuat Database Cloudflare D1</h3>
<ol>
  <li>Di Dashboard Cloudflare, buka menu <strong>Workers &amp; Pages</strong> -&gt; <strong>D1 SQL Database</strong>.</li>
  <li>Klik tombol <strong>Create Database</strong>.</li>
  <li>Isi Nama Database: <code>parenting-db</code>, lalu klik <strong>Create</strong>.</li>
  <li>Salin <strong>Database ID</strong> yang dibuat (contoh: <code>a1b2c3d4-e5f6-7890-abcd-1234567890ab</code>).</li>
  <li>Masuk ke tab <strong>Console</strong> pada database <code>parenting-db</code> Anda.</li>
  <li>Tempel skrip SQL berikut untuk membuat skema tabel awal, lalu klik <strong>Execute</strong>:</li>
</ol>

<pre><code class="language-sql">-- 1. Tabel Users / Penulis &amp; Tim Editorial
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
);</code></pre>

<p>atau yang sudah terisi:</p>

<pre><code class="language-sql">CREATE TABLE IF NOT EXISTS _cf_KV (
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
);</code></pre>

<p><em>(Catatan: Jika Anda meng-upgrade D1 dari versi terdahulu, jalankan <code>ALTER TABLE users ADD COLUMN title TEXT;</code> dsb jika ada kolom yang belum tersedia).</em></p>

<h3>C. Deploy ke Cloudflare Pages / Workers</h3>
<ol>
  <li>Kembali ke Cloudflare Dashboard -&gt; <strong>Workers &amp; Pages</strong>.</li>
  <li>Klik <strong>Create application</strong> -&gt; Tab <strong>Pages</strong> -&gt; <strong>Connect to Git</strong>.</li>
  <li>Hubungkan akun GitHub Anda dan pilih repositori <code>parenting-my-id</code>.</li>
  <li>Klik <strong>Begin setup</strong>.</li>
  <li>Pada bagian <strong>Build settings</strong>:
    <ul>
      <li><strong>Framework preset</strong>: <code>Vite</code> (atau <code>None</code>)</li>
      <li><strong>Build command</strong>: <code>npm run build</code></li>
      <li><strong>Build output directory</strong>: <code>dist</code></li>
    </ul>
  </li>
  <li>Buka bagian <strong>Environment variables (advanced)</strong> dan tambahkan variabel rahasia berikut:
    <ul>
      <li><code>SITE_URL</code>: <code>https://parenting.my.id</code></li>
      <li><code>GITHUB_TOKEN</code>: <em>(Kode token GitHub <code>ghp_...</code> dari Langkah 1B)</em></li>
      <li><code>GITHUB_OWNER</code>: <em>(Username GitHub Anda)</em></li>
      <li><code>GITHUB_REPO</code>: <code>parenting-my-id</code></li>
      <li><code>GITHUB_BRANCH</code>: <code>main</code></li>
      <li><code>JWT_SECRET</code>: <em>(String acak rahasia untuk otentikasi session)</em></li>
    </ul>
  </li>
  <li>Klik <strong>Save and Deploy</strong>.</li>
</ol>

<h3>D. Menghubungkan D1 Binding &amp; Custom Domain</h3>
<ol>
  <li>Setelah deployment pertama selesai, buka proyek Pages Anda di Cloudflare -&gt; Tab <strong>Settings</strong> -&gt; <strong>Functions</strong>.</li>
  <li>Gulir ke bawah ke bagian <strong>D1 database bindings</strong>.</li>
  <li>Klik <strong>Add binding</strong>:
    <ul>
      <li><strong>Variable name</strong>: <code>DB</code></li>
      <li><strong>D1 database</strong>: Pilih <code>parenting-db</code></li>
    </ul>
  </li>
  <li>Klik <strong>Save</strong>. <em>(Lakukan re-deploy project di tab Deployments jika diperlukan agar binding aktif)</em>.</li>
  <li>Masuk ke tab <strong>Custom domains</strong> -&gt; Klik <strong>Set up a custom domain</strong>.</li>
  <li>Ketik <code>parenting.my.id</code> dan klik <strong>Continue</strong>. Cloudflare akan memverifikasi DNS dan mengaktifkan sertifikat SSL HTTPS.</li>
</ol>

<hr>

<h2>⚙️ LANGKAH 3: Kustomisasi Pengaturan di Admin Panel (<code>/admin</code>)</h2>
<ol>
  <li>Akses halaman admin di web Anda: <code>https://parenting.my.id/#admin</code> (atau klik tombol <strong>Portal Admin</strong> di header).</li>
  <li>Login dengan akun bawaan atau akun admin yang dibuat di database D1.</li>
  <li>Buka tab <strong>⚙️ Configs Situs</strong>:
    <ul>
      <li><strong>Badge Samping Logo Header (<code>header_badge_text</code>)</strong>: Ubah teks badge hijau di header desktop (misal: <code>"Cloudflare D1 Edge Engine"</code> atau <code>"Portal Resmi"</code>).</li>
      <li><strong>Label Tombol Portal Admin (<code>mobile_admin_btn_label</code>)</strong>: Ubah label tombol admin di header/mobile drawer.</li>
      <li><strong>Teks Halaman Login Admin</strong>: Sesuaikan judul dan sub-judul portal admin.</li>
      <li><strong>Domain Situs (<code>site_domain</code>)</strong>: Setel domain utama situs.</li>
      <li><strong>Metrik Performa Situs</strong>: Sesuaikan angka metrik seperti <em>Jumlah Artikel Terverifikasi</em>, <em>Traffic Bulanan</em>, <em>Skor Kecepatan CDN</em>, dsb.</li>
      <li><strong>Footer &amp; Running Ticker</strong>: Atur teksrunning ticker topik trending dan badge jaminan footer.</li>
    </ul>
  </li>
  <li>Klik tombol <strong>Simpan Konfigurasi Situs</strong>. Perubahan akan langsung tersimpan di database <strong>Cloudflare D1</strong> dan tersinkronisasi ke file <code>public/site_config.json</code>.</li>
</ol>

<hr>

<h2>✍️ LANGKAH 4: Panduan Penulis — Mengisi Artikel &amp; Gambar dari Unsplash.com</h2>

<p>Penulis artikel memiliki akses ke <strong>Editor WYSIWYG Rich Editor</strong> lengkap dengan AI Assistant, SEO Auditor, dan Pengelola Gambar.</p>

<h3>A. Menentukan Gambar Sampul (Featured Image)</h3>
<p>Gambar sampul akan muncul sebagai kartu di halaman depan, header artikel, dan pratinjau sosial media (Open Graph).</p>

<h4>Metode 1: Menggunakan Galeri Unsplash.com Terintegrasi (Rekomendasi Utama)</h4>
<ol>
  <li>Di halaman editor artikel, lihat kartu <strong>Meta SEO &amp; Gambar Sampul</strong> di kolom kanan.</li>
  <li>Klik tombol <strong>Upload / Pilih Gambar</strong>.</li>
  <li>Buka tab <strong>Galeri Unsplash</strong>.</li>
  <li>Anda dapat:
    <ul>
      <li>Memilih salah satu preset kategori parenting yang tersedia (seperti <em>Bayi &amp; Balita</em>, <em>Pola Asuh</em>, <em>Kehamilan</em>, <em>Nutrisi &amp; Makanan</em>, <em>Sensory Play</em>, <em>Keluarga Bahagia</em>).</li>
      <li>Atau mengetik kata kunci custom pada kolom pencarian (misal: <code>toddler</code>, <code>breastfeeding</code>, <code>parenting</code>).</li>
    </ul>
  </li>
  <li>Klik foto pilihan Anda, lalu klik tombol <strong>🖼️ Jadikan Sampul</strong>. URL Unsplash beresolusi tinggi otomatis terpasang sebagai Gambar Sampul.</li>
</ol>

<h4>Metode 2: Menggunakan Direct URL Unsplash.com</h4>
<ol>
  <li>Buka situs <a href="https://unsplash.com">unsplash.com</a> di tab baru.</li>
  <li>Cari foto berkualitas tinggi terkait topik artikel Anda.</li>
  <li>Klik kanan pada foto -&gt; <strong>Copy image address</strong> (Salin alamat gambar), contoh: <code>https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&amp;fit=crop&amp;w=1200&amp;q=80</code>.</li>
  <li>Tempelkan URL tersebut pada input <strong>URL Gambar Sampul (Featured Image)</strong> di editor.</li>
</ol>

<h4>Metode 3: Mengunggah File Gambar dari Komputer</h4>
<ol>
  <li>Klik tombol <strong>Upload / Pilih Gambar</strong> -&gt; Buka tab <strong>Upload File</strong>.</li>
  <li>Klik area unggah atau pilih file PNG, JPG, atau WebP dari laptop/HP Anda.</li>
  <li>Setelah proses unggah selesai, klik tombol <strong>🖼️ Jadikan Sampul</strong>. Gambar akan tersimpan ke repositori GitHub <code>/public/uploads/</code> / Cloudflare D1.</li>
</ol>

<hr>

<h3>B. Mengunggah &amp; Menyisipkan Gambar ke Dalam Body Artikel</h3>
<p>Untuk memasukkan gambar di tengah-tengah teks tulisan artikel:</p>
<ol>
  <li>Tempatkan kursor teks di baris tempat Anda ingin menyisipkan gambar.</li>
  <li>Pada toolbar editor bagian atas, klik icon <strong>Gambar</strong> (Sisipkan Gambar Artikel).</li>
  <li>Pilih opsi sumber gambar:
    <ul>
      <li><strong>Upload File</strong>: Unggah gambar fisik dari komputer Anda.</li>
      <li><strong>Galeri Unsplash</strong>: Pilih dari pustaka gambar Unsplash bebas royalti.</li>
      <li><strong>URL Direct</strong>: Tempel alamat URL gambar eksternal.</li>
    </ul>
  </li>
  <li>Ketik <strong>Deskripsi / Alt Text</strong> gambar (penting untuk SEO &amp; aksesibilitas).</li>
  <li>Klik tombol <strong>📌 Sisipkan ke Body</strong>. Tag markdown gambar (contoh: <code>![Deskripsi Gambar](https://...)</code>) otomatis tersisip tepat di posisi kursor.</li>
</ol>

<hr>

<h3>C. Alur Kerja Penulisan Artikel yang Optimal</h3>
<ol>
  <li><strong>Isi Judul &amp; Kategori Artikel</strong>: Pilih kategori utama (Pola Asuh, Kesehatan, Nutrisi, Pendidikan, Kehamilan, Gaya Hidup).</li>
  <li><strong>Gunakan AI Gemini Meta Generator</strong>: Klik tombol <strong>Generate SEO Meta dengan AI</strong> untuk secara otomatis menghasilkan <em>Excerpt</em>, <em>Meta Title</em>, dan <em>Meta Description</em> berstandar Google Search.</li>
  <li><strong>Periksa SEO Audit Widget</strong>: Perhatikan skor SEO Audit (0-100%). Pastikan indikator berwarna hijau (Panjang Judul, Meta Desc, Kedalaman Kata &gt; 300 kata, Gambar Sampul, Tag Topik).</li>
  <li><strong>Pratinjau Artikel (Tab Preview)</strong>: Buka tab <strong>Pratinjau Artikel</strong> untuk melihat tampilan akhir artikel lengkap dengan Daftar Isi Otomatis (<em>Table of Contents</em>) dan Rantai Tautan Otomatis (<em>Autolinks</em>).</li>
  <li><strong>Publikasikan Artikel</strong>: Pilih status <strong>Dipublikasikan</strong> dan klik <strong>Simpan &amp; Publikasikan Artikel</strong>.</li>
</ol>

<hr>

<h2>🛠️ Ringkasan Fitur Unggulan Engine</h2>
<ol>
  <li><strong>Dual Storage Cloudflare D1 + GitHub REST API</strong>: Menyimpan artikel dan konfigurasi situs di database SQLite serverless D1 berkecepatan edge, sekaligus menyinkronkan file aset ke GitHub.</li>
  <li><strong>In-Page SEO &amp; Structured Data Auto-Generator</strong>: Menghasilkan skema JSON-LD <code>BlogPosting</code>, <code>BreadcrumbList</code>, <code>&lt;link rel="canonical"&gt;</code>, dan <code>&lt;link rel="alternate"&gt;</code> secara otomatis.</li>
  <li><strong>Automated <code>llms.txt</code> Generator</strong>: Secara otomatis membuat &amp; meng-update endpoint <code>/llms.txt</code> untuk optimasi keterbacaan oleh AI Search Engine (Perplexity, ChatGPT, Gemini).</li>
  <li><strong>Autolinks Engine</strong>: Otomatis mengubah kata kunci tertentu di seluruh artikel menjadi internal link aktif tanpa perlu mengedit artikel satu per satu.</li>
  <li><strong>Histori Revisi &amp; Autosave</strong>: Menyimpan draf artikel dan 3 histori revisi terakhir untuk perlindungan data tulisan penulis.</li>
</ol>

```
