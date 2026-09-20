# PANDUAN PROMPT AI: ADAPTASI NICHE & DOMAIN BARU (NICHE ADAPTATION GUIDE)

Dokumen ini berisi panduan dan template prompt siap pakai untuk diberikan kepada **Google Gemini AI** (atau AI assistant lainnya) guna mengkloning dan mengadaptasikan website ini ke dalam **niche, topik, atau domain baru**.

Anda dapat memilih salah satu dari **2 Metode Pengoperasian** yang paling sesuai dengan preferensi Anda:
* **[Metode 1: Otomatisasi via Terminal / CLI](#metode-1-otomatisasi-via-terminal--cli-rekomendasi-developer)** *(Cepat, 1 perintah script)*
* **[Metode 2: Tanpa Bash Command / 100% Web Browser](#metode-2-tanpa-bash-command-100-web-browser--gui)** *(Tanpa buka terminal, cukup edit di GitHub & Cloudflare Web)*

---

<a name="metode-1-otomatisasi-via-terminal--cli-rekomendasi-developer"></a>
## 🚀 METODE 1: OTOMATISASI VIA TERMINAL / CLI (Rekomendasi Developer)

Metode ini menggunakan berkas kamus master `defaultDictionary.json` dan skrip otomatis `scripts/applyDictionary.ts`.

### 1. Alur Kerja (Workflow 3 Langkah)
1. Salin prompt di bawah ke Gemini AI beserta isi `defaultDictionary.json`.
2. Simpan respon JSON dari AI menjadi berkas **`nicheDictionary.json`** di root folder proyek.
3. Jalankan perintah `npm run apply-dictionary` di terminal. Semua file konfigurasi, artikel sampel, dan skrip SQL D1 akan otomatis terbuat 100%.

### 2. Template Prompt untuk Gemini AI (Copy & Paste):

```markdown
Anda adalah seorang Creative Director, SEO Specialist, dan Content Strategist profesional. Tugas Anda adalah mengadaptasi seluruh kamus variabel website dari topik default menjadi topik/niche baru secara kreatif, profesional, dan 100% selaras dengan identitas niche target.

### INFORMASI NICHE BARU:
- Topik / Industri Target : [TULISKAN NICHE ANDA DI SINI, contoh: "Klinik Kesehatan Gigi & Spesialis Ortodonti Modern"]
- Nama Domain Target       : [TULISKAN DOMAIN BARU, contoh: "klinikgigi.id"]
- Nama Brand / Web         : [TULISKAN NAMA BRAND, contoh: "Klinik Gigi Sehat"]
- Gaya Bahasa / Persona    : [PILIH GAYA BAHASA, contoh: "Edukatif, ramah, medis profesional, terpercaya"]
- Bahasa Utama             : Bahasa Indonesia

---

### ATURAN & INSTRUKSI WAJIB (STRICT RULES):
1. **Patuhi Batasan Panjang Teks (`maxLen`)**:
   - Panjang karakter string pada properti `value` TIDAK BOLEH melebihi angka `maxLen` yang ditentukan untuk masing-masing key.
   - Hitung panjang karakter secara cermat dan padat makna.

2. **Patuhi Petunjuk Kode Flag**:
   - **Flag "M" (Must be rewritten)**: WAJIB Anda tulis ulang dan modifikasi total agar sesuai 100% dengan niche target baru.
   - **Flag "D" (Don't be rewritten)**: DILARANG KERAS diubah! Pertahankan nilai asli default apa adanya (termasuk path teknis, token, atau konfigurasi sistem).
   - **Flag "U" (Up to you)**: Boleh Anda sesuaikan jika mendukung konteks niche baru, atau tetap gunakan nilai default yang relevan.

3. **Konsistensi Taksonomi & Entitas**:
   - Sesuaikan nama figur pakar/spesialis (`DOCTOR_NAME`, `DOCTOR_TITLE`, `DOCTOR_BIO`) agar merepresentasikan profil pakar kredibel di industri baru tersebut.
   - Sesuaikan 4 kategori navigasi (`NAV_CATEGORY_1` s/d `NAV_CATEGORY_4`) beserta slug URL-nya agar menjadi pilar konten utama niche baru.
   - Sesuaikan modul produk, event, portofolio, dan artikel pembuka (`SAMPLE_POST_1` s/d `SAMPLE_POST_3`) agar relevan dengan audiens niche baru.

4. **Format Output**:
   - Keluarkan HANYA format JSON murni yang valid (array of objects) tanpa pembuka percakapan atau teks pengantar basa-basi di luar blok code JSON.
   - Setiap objek harus tetap mempertahankan struktur:
     ```json
     {
       "key": "NAMA_KEY",
       "value": "Nilai baru yang telah disesuaikan",
       "maxLen": 60,
       "flag": "M",
       "description": "Deskripsi fungsi"
     }
     ```

---

### DATA KAMUS ASLI (defaultDictionary.json):
[TEMPELKAN ATAU LAMPIRKAN SELURUH ISI defaultDictionary.json DI SINI]
```

### 3. Langkah Eksekusi Perintah Terminal
1. Simpan respon JSON dari AI menjadi file **`nicheDictionary.json`** di root folder.
2. Lakukan simulasi dry-run terlebih dahulu untuk memeriksa panjang karakter:
   ```bash
   npx tsx scripts/applyDictionary.ts --file=nicheDictionary.json --dry-run
   ```
3. Terapkan perubahan ke seluruh file proyek:
   ```bash
   npm run apply-dictionary
   # atau:
   npx tsx scripts/applyDictionary.ts --file=nicheDictionary.json
   ```
4. Eksekusi file migrasi SQL yang otomatis dihasilkan ke Cloudflare D1:
   ```bash
   npx wrangler d1 execute <NAMA_DATABASE_D1_ANDA> --file=data/seed_niche.sql --remote
   ```
5. Commit dan push ke repository Anda:
   ```bash
   git add . && git commit -m "feat: migrate to new niche" && git push
   ```

---

<a name="metode-2-tanpa-bash-command-100-web-browser--gui"></a>
## 🌐 METODE 2: TANPA BASH COMMAND (100% Web Browser / GUI)

Metode ini sangat cocok jika Anda tidak ingin membuka terminal komputer atau tidak memiliki akses CLI/bash. Seluruh proses dilakukan melalui antarmuka web peramban (GitHub Web & Cloudflare Dashboard).

### 1. Diagram Alur Kerja Tanpa Terminal
```
[1. Chat Gemini AI] 
       │ 
       ▼ (Menghasilkan 2 file JSON & 1 blok SQL)
[2. Edit/Upload di GitHub Web]
   ├─ Ganti isi berkas `public/site_config.json`
   └─ Ganti isi berkas `data/posts.json`
       │ 
       ▼
[3. Cloudflare D1 Web Console]
   └─ Copy-paste query SQL ke tab Console & klik "Execute"
       │
       ▼
[4. Cloudflare Pages Web Settings]
   └─ Masukkan variabel SITE_NAME, SITE_URL, SITE_DESCRIPTION
       │
       ▼
[Website 100% Live dengan Niche Baru!]
```

---

### 2. Template Prompt Khusus Mode Tanpa Terminal (Copy ke Gemini AI):

```markdown
Anda adalah Web Architect & Content Specialist. Saya memiliki repository web modern berbasis Cloudflare Pages. Saya TIDAK menggunakan terminal/bash command. Saya membutuhkan hasil akhir berupa 2 berkas JSON lengkap dan 1 blok SQL siap pakai yang bisa langsung saya copy-paste ke repository GitHub dan Cloudflare D1 Web Console.

Target Niche Baru:
- Topik / Industri  : [CONTOH: Klinik Kesehatan Gigi & Ortodonti Modern]
- Nama Domain Baru  : [CONTOH: klinikgigi.id]
- Nama Brand Web    : [CONTOH: Klinik Gigi Sehat]
- Deskripsi Singkat : [CONTOH: Pusat informasi kesehatan gigi, perawatan behel, dan konsultasi dokter gigi terpercaya]
- 4 Kategori Utama  : 1. Behel & Ortodonti | 2. Gigi Anak | 3. Estetika & Pemutihan | 4. Perawatan Medis

Instruksi:
Tolong hasilkan 3 blok kode lengkap berikut tanpa terpotong:

1. BLOK 1: Berkas `public/site_config.json`
   Tuliskan ulang seluruh konfigurasi situs (nama brand, tagline, meta SEO, hero headline, 4 kategori navigasi, lencana, profil dokter/pakar gigi, kemitraan korporasi, modul tanya dokter/konsultasi WA, paket perawatan gigi, hingga kategori iklan baris) yang 100% relevan dengan niche tersebut.

2. BLOK 2: Berkas `data/posts.json`
   Buatkan 3 buah artikel sampel pembuka (array JSON) lengkap dengan id, title, slug, excerpt, category, read_time_minutes, status: "published", featured_image (unsplash URL relevan), tags, dan content_markdown yang mendalam.

3. BLOK 3: Query SQL untuk Cloudflare D1 Console (Browser Web)
   Buatkan kumpulan query `INSERT OR REPLACE INTO configs (key, value) VALUES ...` dan `INSERT OR REPLACE INTO site_config ...` yang bisa langsung saya tempelkan di tab "Console" Cloudflare D1 Dashboard.

Pastikan JSON valid, tidak ada syntax error, dan langsung siap pakai!
```

---

### 3. Langkah-Langkah Eksekusi via Browser (Web Interface)

#### Langkah A: Perbarui 2 Berkas di GitHub Repository (Web Browser)
1. Buka repository GitHub target Anda di browser peramban (misal: `https://github.com/username/nama-repo`).
2. **Perbarui Berkas 1 (`public/site_config.json`)**:
   - Masuk ke folder **`public/`** > klik file **`site_config.json`**.
   - Klik ikon **Pensil (Edit this file)** di pojok kanan atas.
   - Hapus seluruh isinya (`Ctrl+A` lalu `Backspace`), lalu tempel (*paste*) kode dari **BLOK 1** hasil Gemini AI.
   - Gulir ke bawah dan klik tombol hijau **"Commit changes"**.
3. **Perbarui Berkas 2 (`data/posts.json`)**:
   - Masuk ke folder **`data/`** > klik file **`posts.json`**.
   - Klik ikon **Pensil (Edit this file)**.
   - Ganti seluruh isinya dengan kode dari **BLOK 2** hasil Gemini AI.
   - Klik tombol hijau **"Commit changes"**.

#### Langkah B: Eksekusi SQL di Cloudflare D1 Web Console
1. Buka peramban ke **[Cloudflare Dashboard](https://dash.cloudflare.com/)**.
2. Buka menu **Workers & Pages** > klik **D1 SQL Database**.
3. Pilih database D1 yang terhubung dengan website Anda.
4. Klik tab **"Console"** (terletak di sebelah tab *Metrics*).
5. Salin kode query dari **BLOK 3 (Query SQL)** hasil Gemini AI, lalu tempelkan ke dalam kotak input query console.
6. Klik tombol biru **"Execute"**.
7. Pesan konfirmasi hijau *"Queries executed successfully"* akan muncul seketika.

#### Langkah C: Set Variabel Lingkungan di Cloudflare Pages (Web Dashboard)
1. Masuk ke menu **Workers & Pages** > klik nama proyek **Pages** Anda.
2. Buka tab **Settings** > pilih **Environment variables**.
3. Masukkan atau perbarui variabel berikut:
   - `SITE_NAME`: [Nama Brand Baru Anda]
   - `SITE_URL`: `https://[domainbaru-anda.com]`
   - `SITE_DESCRIPTION`: [Deskripsi Niche Baru Anda]
   - `ADMIN_EMERGENCY_KEY`: `darurat123` (atau kunci darurat pilihan Anda)
4. Klik tombol **Save**.
5. Buka tab **Deployments** > klik titik tiga pada deployment terakhir > pilih **Retry deployment** (atau Cloudflare akan otomatis mendeploy saat Anda melakukan commit pada Langkah A).

---

### 💡 Alternatif: Sinkronisasi Otomatis Lewat Admin Portal CMS
Jika Anda tidak ingin membuka Cloudflare D1 Console sama sekali:
1. Setelah mengunggah `public/site_config.json` ke GitHub (Langkah A), buka portal admin website Anda di browser (`/admin-[suffix]`).
2. Masuk menggunakan akun admin atau Kunci Darurat.
3. Buka menu **Pengaturan Situs** > klik tombol **"Simpan Pengaturan"**.
4. Sistem CMS secara otomatis akan membaca formulir dan menyinkronkan seluruh konfigurasi ke tabel `configs` di database Cloudflare D1 secara instan.

---

## 💡 Contoh Skenario Niche Siap Pakai

### Contoh 1: Niche Jasa Hukum & Kantor Notaris
- **Topik / Industri**: Kantor Notaris, PPAT & Konsultan Hukum Properti
- **Domain**: `notarisindonesia.co.id`
- **Brand**: `Notaris & PPAT Santoso Partners`
- **Kategori Navigasi**:
  1. Akta Perusahaan (`akta-perusahaan`)
  2. Balik Nama Properti (`properti-tanah`)
  3. Surat Wasiat & Waris (`hukum-waris`)
  4. Perizinan Usaha (`legalitas-usaha`)
- **Pakar Profil**: `Bambang Santoso, S.H., M.Kn` (Spesialis Notaris & PPAT Senior)

### Contoh 2: Niche Otomotif & Modifikasi Mobil
- **Topik / Industri**: Portal Berita Otomotif, Tips Perawatan Mobil & Aksesoris
- **Domain**: `autodrive.id`
- **Brand**: `AutoDrive Media`
- **Kategori Navigasi**:
  1. Mobil Listrik (`mobil-listrik`)
  2. Perawatan Mesin (`perawatan-mesin`)
  3. Tips Modifikasi (`modifikasi`)
  4. Review Kendaraan (`review-mobil`)
- **Pakar Profil**: `Ir. Hendra Pratama, M.T.` (Konsultan Teknik Otomotif & Motorsport)

### Contoh 3: Niche Properti & Real Estate
- **Topik / Industri**: Portal Investasi Properti, Rumah Impian & Panduan KPR
- **Domain**: `propertikita.id`
- **Brand**: `PropertiKita Hub`
- **Kategori Navigasi**:
  1. Rumah Subsidi & Komersial (`rumah-tinggal`)
  2. Panduan KPR Bank (`panduan-kpr`)
  3. Investasi Tanah (`tanah-kavling`)
  4. Desain Interior (`arsitektur-interior`)
- **Pakar Profil**: `Ar. Dini Maharani, IAI` (Arsitek & Konsultan Perencanaan Kawasan)
