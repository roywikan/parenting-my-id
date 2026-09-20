# Panduan Lengkap Environment Variables untuk Pemula & Instalasi Domain Baru

Dokumen ini berisi panduan langkah demi langkah bagi pemula untuk mendapatkan, memahami, dan mengisi seluruh **17 variabel lingkungan (Environment Variables)** yang ada di `.env.example`, baik untuk dijalankan di komputer lokal (Development) maupun di-deploy ke **Cloudflare Pages** (Production).

Panduan ini dilengkapi dengan **Trik Instalasi Domain Baru** agar proses setup pada akun, repositori, dan domain baru berjalan lancar tanpa terhalang proteksi keamanan (*Zero Friction Deployment*).

---

## 📌 Tabel Ringkasan 17 Variabel Lingkungan

| No | Nama Variabel | Status di Cloudflare Pages | Sifat | Deskripsi Singkat |
|:---:|---|:---:|:---:|---|
| 1 | `SITE_URL` | **Plain text** | Wajib | URL utama website (tanpa akhiran `/`) |
| 2 | `SITE_NAME` | **Plain text** | Wajib | Nama publik portal / blog website Anda |
| 3 | `SITE_DESCRIPTION` | **Plain text** | Wajib | Deskripsi singkat situs untuk meta SEO & medsos |
| 4 | `JWT_SECRET` | **Encrypt (Secret)** | Wajib | Kunci rahasia enkripsi tanda tangan token sesi login admin |
| 5 | `ADMIN_EMERGENCY_KEY` | **Encrypt (Secret)** | Sangat Disarankan | Kunci pemulihan darurat bypass Turnstile / Anti Brute Force |
| 6 | `TURNSTILE_SITE_KEY` | **Plain text** | Sangat Disarankan | Kunci publik widget Cloudflare Turnstile di browser |
| 7 | `TURNSTILE_SECRET_KEY` | **Encrypt (Secret)** | Sangat Disarankan | Kunci rahasia backend untuk verifikasi token Turnstile |
| 8 | `ENABLE_TURNSTILE_FALLBACK` | **Plain text** | Sangat Disarankan | Mode toleran saat migrasi domain baru (`true` / `false`) |
| 9 | `GEMINI_API_KEY` | **Encrypt (Secret)** | Opsional | API Key Google Gemini AI untuk asisten penulis & meta SEO |
| 10 | `GITHUB_TOKEN` | **Encrypt (Secret)** | Opsional (Backup) | Personal Access Token (PAT) GitHub untuk auto-sync data |
| 11 | `GITHUB_OWNER` | **Plain text** | Opsional (Backup) | Username atau organisasi akun GitHub |
| 12 | `GITHUB_REPO` | **Plain text** | Opsional (Backup) | Nama repositori GitHub tempat kode / data disimpan |
| 13 | `GITHUB_BRANCH` | **Plain text** | Opsional (Backup) | Nama branch repositori (biasanya `main`) |
| 14 | `CLOUDINARY_CLOUD_NAME` | **Plain text** | Opsional (Media) | Nama Cloud akun Cloudinary untuk CDN gambar WebP |
| 15 | `CLOUDINARY_API_KEY` | **Encrypt (Secret)** | Opsional (Media) | API Key akun Cloudinary |
| 16 | `CLOUDINARY_API_SECRET` | **Encrypt (Secret)** | Opsional (Media) | API Secret akun Cloudinary |
| 17 | `CLOUDINARY_FOLDER` | **Plain text** | Opsional (Media) | Nama folder penyimpanan gambar di Cloudinary |

---

## 1. Identitas Situs (Site Identity)

Variabel ini menentukan nama kanonikal, branding, dan metadata dasar website. Sistem ini bersifat **Niche-Agnostic** (bebas topik), sehingga sesuaikan dengan nama brand dan bidang website yang Anda bangun.

### `SITE_URL`
- **Fungsi**: URL resmi website Anda yang digunakan untuk tag SEO canonical, sitemap.xml, RSS feed (`feed.xml`), dan OpenGraph preview di media sosial.
- **Format / Aturan Penulisan**:
  - Wajib diawali protokol `https://` (atau `http://localhost:3000` jika di komputer lokal).
  - **Dilarang keras menyertakan garis miring di akhir (`/`)**.
  - Contoh Benar: `https://namadomainanda.com`
  - Contoh Salah: `https://namadomainanda.com/`
- 💡 **Trik Instalasi Domain Baru**:
  - Saat pertama kali deploy ke Cloudflare Pages sebelum menghubungkan Custom Domain, Anda bisa mengisinya sementara dengan URL Pages Anda: `https://nama-project.pages.dev`.
  - Setelah Custom Domain Anda aktif di Cloudflare Pages > Custom domains, segera ubah nilai `SITE_URL` di Settings > Environment variables menjadi `https://namadomainanda.com` lalu lakukan **Redeploy** agar sitemap dan RSS feed mengarah ke domain baru Anda.

### `SITE_NAME`
- **Fungsi**: Nama resmi website yang tampil pada Header, Footer, Meta Title, dan nama author feed.
- **Contoh**: `Portal Warta Mandiri`, `Katalog Desain Kreatif`, `Tech Radar Nusantara`.
- 💡 **Trik Domain Baru**: Gunakan nama yang mencerminkan brand domain baru Anda. Pengaturan ini juga dapat diubah kapan saja secara dinamis melalui dashboard admin (*Configs Situs*).

### `SITE_DESCRIPTION`
- **Fungsi**: Ringkasan isi website sepanjang 1–2 kalimat yang dibaca oleh bot Google dan muncul saat link website dibagikan ke WhatsApp, Telegram, atau Facebook.
- **Contoh**: `Portal publikasi independen yang menyajikan wawasan mendalam, berita terkini, dan analisis objektif.`
- 💡 **Trik Domain Baru**: Buat deskripsi yang unik dan memuat kata kunci utama dari topik domain baru Anda untuk memaksimalkan peringkat SEO Google.

---

## 2. Keamanan Autentikasi & Pemulihan Darurat

### `JWT_SECRET`
- **Fungsi**: Kunci kriptografi rahasia untuk menandatangani token sesi login admin (*JSON Web Token*). Kunci ini menjamin tidak ada peretas yang bisa memalsukan token sesi login.
- **Cara Mendapatkan / Membuat**:
  1. Buat kombinasi karakter acak sepanjang 32 hingga 64 karakter.
  2. Buka terminal komputer Anda dan jalankan perintah:
     ```bash
     openssl rand -hex 32
     ```
  3. Atau gunakan generator online aman seperti [RandomKeygen (Fort Knox Passwords)](https://randomkeygen.com/).
  4. **Contoh Nilai**: `a7f93c8b1e42d6509bcdef1234567890abcdef1234567890abcdef12345678`
- 💡 **Trik Instalasi Domain Baru**:
  - **Wajib ganti dengan string baru yang unik untuk setiap domain baru**. Jangan menduplikasi `JWT_SECRET` antar-website agar keamanan sesi antar-domain terisolasi penuh.
  - Pada Cloudflare Pages Settings, selalu pilih tipe **Encrypt**.

### `ADMIN_EMERGENCY_KEY`
- **Fungsi**: Kunci darurat utama (*Master Emergency Key*). Jika Cloudflare Turnstile error di domain baru, database terkunci sementara oleh anti-brute force, atau Anda lupa password, kunci ini memungkinkan Anda masuk ke portal admin seketika melalui tombol "Kunci Pemulihan Darurat".
- **Nilai Bawaan (Default)**: Jika tidak diisi di Environment Variables, sistem menggunakan fallback default `darurat123`.
- **Cara Mendapatkan / Membuat**:
  - Buat kata sandi unik yang kuat dan simpan di aplikasi Password Manager Anda (seperti Bitwarden atau 1Password).
  - Contoh Nilai: `KunciDarurat_DomainBaru2026!#Secure`
- 💡 **Trik Instalasi Domain Baru**:
  - Di halaman login admin domain baru (`/admin-9999`), jika widget Turnstile menampilkan error domain, klik tombol cepat **"admin@domain.com / admin123 + darurat123 (Isi Otomatis)"** lalu klik **Masuk Portal CMS**. Anda akan langsung masuk ke Dashboard tanpa hambatan!

---

## 3. Cloudflare Turnstile & Pengaturan Mode Anti-Bot

Cloudflare Turnstile adalah pelindung anti-bot modern gratis pengganti reCAPTCHA yang tidak mengganggu pengunjung dengan teka-teki gambar.

Sistem membutuhkan **2 kunci utama** + **1 pengaturan toleransi**:

### `TURNSTILE_SITE_KEY`
- **Fungsi**: Kunci publik frontend yang dibaca oleh browser pengunjung untuk memunculkan widget validasi Turnstile.
- **Format**: Berawalan `0x4AAAAAA...`
- **Cara Mendapatkan**:
  1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/).
  2. Di menu kiri, klik **Turnstile**.
  3. Klik tombol **Add site** / **Add widget**.
  4. Masukkan nama widget (misal: `Turnstile Web Baru`).
  5. Di bagian **Domains**, tambahkan domain Anda:
     - Domain utama: `domainanda.com`
     - Subdomain Cloudflare Pages: `*.pages.dev`
     - Pengujian lokal: `localhost`
  6. Pilih Widget Mode: **Managed** (disarankan).
  7. Klik **Create**. Salin teks di kolom **Site Key**.
- 💡 **Trik Instalasi Domain Baru**:
  - Masukkan nilai ini ke variabel `TURNSTILE_SITE_KEY` di Cloudflare Pages Settings.
  - **Kelebihan**: Dengan memasukkan `TURNSTILE_SITE_KEY` di Environment Variables, Anda tidak perlu repot menjalankan query manual ke database D1 saat instalasi baru; frontend langsung otomatis menggunakan Site Key tersebut.

### `TURNSTILE_SECRET_KEY`
- **Fungsi**: Kunci rahasia backend untuk memverifikasi token yang dihasilkan oleh browser pengunjung ke server Cloudflare (`/siteverify`).
- **Format**: Berawalan `0x4AAAAAA...`
- **Cara Mendapatkan**:
  - Di halaman pembuatan widget Turnstile di atas, salin teks pada kolom **Secret Key**.
  - Masukkan ke variabel `TURNSTILE_SECRET_KEY` di Cloudflare Pages Settings (pilih opsi **Encrypt**).
- 💡 **Trik Instalasi Domain Baru**:
  - Pastikan pasangan Site Key dan Secret Key berasal dari widget yang sama di akun Cloudflare Anda.

### `ENABLE_TURNSTILE_FALLBACK`
- **Fungsi**: Mengatur toleransi keamanan backend ketika Turnstile diuji pada domain baru atau lingkungan pementasan (*Graceful Fallback Mode*).
- **Pilihan Nilai**:
  - `true` (atau `1`): **Mode Toleran (Direkomendasikan saat Setup Domain Baru)**. Jika Secret Key belum disinkronkan atau domain masih tahap propagasi DNS, admin yang sudah menyelesaikan centang Turnstile di frontend tetap diizinkan login tanpa diblokir server.
  - `false` (atau `0`): **Mode Ketat (Strict Production Mode)**. Server mewajibkan verifikasi Cloudflare 100% valid dengan Secret Key yang cocok. Jika token gagal atau Secret Key kosong, akses diblokir total.
- 💡 **Trik Instalasi Domain Baru**:
  - Saat awal instalasi di domain baru, pasang `ENABLE_TURNSTILE_FALLBACK=true`.
  - Setelah website live dan login admin berhasil dengan lancar, Anda dapat mengubah nilainya menjadi `false` (atau klik tombol **"Terapkan Mode Ketat"** di menu Akun Admin) untuk mengunci keamanan pada level tertinggi.

---

## 4. GitHub Auto-Sync & Backup Otomatis

Digunakan agar setiap kali ada publikasi artikel baru atau pembaruan konfigurasi, CMS secara otomatis melakukan sinkronisasi pencadangan file (`public/feed.xml`, `public/sitemap.xml`, `public/llms.txt`, dan data JSON) langsung ke repositori GitHub Anda.

### `GITHUB_TOKEN`
- **Fungsi**: Token autentikasi Personal Access Token (PAT) dari GitHub agar CMS memiliki izin melakukan komit file otomatis ke repositori.
- **Cara Mendapatkan**:
  1. Buka [https://github.com/settings/tokens](https://github.com/settings/tokens).
  2. Klik **Generate new token** > pilih **Generate new token (classic)**.
  3. Beri nama di kolom **Note**, misal: `Cloudflare Pages Backup Sync`.
  4. **Expiration**: Pilih `No expiration` atau durasi yang Anda kehendaki.
  5. Pada bagian **Select scopes**, beri tanda centang pada:
     - ✅ **`repo`** (Full control of private repositories).
  6. Klik tombol hijau **Generate token** di bagian bawah.
  7. **Salin token Anda segera** (berawalan `ghp_...`). Token hanya ditampilkan satu kali!
  8. Masukkan ke variabel `GITHUB_TOKEN` di Cloudflare Pages (pilih **Encrypt**).

### `GITHUB_OWNER`
- **Fungsi**: Username akun GitHub atau nama Organisasi Anda.
- **Contoh**: Jika URL profil Anda adalah `https://github.com/johndoe`, maka nilainya adalah `johndoe`.

### `GITHUB_REPO`
- **Fungsi**: Nama repositori GitHub tempat kode website ini berada.
- **Contoh**: Jika URL repo adalah `https://github.com/johndoe/portal-cms-prod`, maka nilainya adalah `portal-cms-prod`.
- 💡 **Trik Instalasi Domain Baru**:
  - **Wajib pastikan nama repo mengarah ke repositori domain baru tersebut**.
  - Jika Anda membuat website kedua/ketiga dengan menduplikasi kode, pastikan `GITHUB_REPO` diubah ke nama repo yang baru agar file cadangan artikel domain baru tidak menimpa data di repositori domain lama.

### `GITHUB_BRANCH`
- **Fungsi**: Nama cabang (branch) utama di repositori GitHub Anda.
- **Nilai Standar**: `main` (atau `master` tergantung branch default repositori Anda).

---

## 5. Google Gemini AI Engine

Digunakan oleh fitur AI Writer di CMS untuk menghasilkan judul SEO artikel, meta description otomatis, ekstraksi tag/kata kunci, dan penyusunan draf berita.

### `GEMINI_API_KEY`
- **Fungsi**: Kunci otentikasi API Google Gemini yang dijalankan secara aman melalui proxy backend (*Server-Side API*).
- **Biaya**: **Gratis (Free Tier)** dari Google AI Studio dengan kuota harian yang sangat berlimpah.
- **Cara Mendapatkan**:
  1. Buka [Google AI Studio](https://aistudio.google.com/app/apikey).
  2. Login menggunakan akun Google Anda.
  3. Klik tombol **Create API key**.
  4. Pilih proyek Google Cloud atau klik **Create API key in new project**.
  5. Salin kode API Key yang diberikan (berawalan `AIzaSy...`).
  6. Masukkan ke variabel `GEMINI_API_KEY` di Cloudflare Pages Settings (pilih **Encrypt**).
- 💡 **Trik Instalasi Domain Baru**:
  - Anda dapat menggunakan API Key yang sama untuk beberapa website sekaligus, atau membuat API Key terpisah di proyek Google Cloud berbeda agar pemantauan kuota penggunaan masing-masing domain lebih rapi.

---

## 6. Media Cloud Storage Cloudinary (CDN Gambar Cepat)

Cloudinary berfungsi menyimpan seluruh unggahan gambar artikel secara eksternal. Gambar otomatis dikonversi ke format generasi terbaru (**WebP** / **AVIF**) dengan ukuran resolusi responsif, sehingga loading website super cepat dan tidak menghabiskan kuota penyimpanan database D1.

*(Jika tidak diisi, sistem tetap berfungsi normal menggunakan penyimpanan lokal bawaan).*

### Kredensial yang Diperlukan:
1. `CLOUDINARY_CLOUD_NAME`
2. `CLOUDINARY_API_KEY`
3. `CLOUDINARY_API_SECRET`
4. `CLOUDINARY_FOLDER`

### Langkah Mendapatkannya:
1. Daftar akun gratis di [Cloudinary Register](https://cloudinary.com/users/register_free).
2. Masuk ke [Cloudinary Console / Dashboard](https://console.cloudinary.com/).
3. Pada halaman beranda Console, lihat bagian **Product Environment Credentials**:
   - **Cloud Name**: Salin teksnya ➔ masukkan ke `CLOUDINARY_CLOUD_NAME`.
   - **API Key**: Salin angkanya ➔ masukkan ke `CLOUDINARY_API_KEY` (Encrypt).
   - **API Secret**: Klik tombol mata/salin ➔ masukkan ke `CLOUDINARY_API_SECRET` (Encrypt).

### 💡 Trik Instalasi Domain Baru untuk `CLOUDINARY_FOLDER`:
- Variabel `CLOUDINARY_FOLDER` menentukan nama folder tempat gambar disimpan di akun Cloudinary Anda.
- **Sangat Disarankan**: Berikan nama folder spesifik sesuai domain baru Anda (misal: `domainbaru-uploads` atau `portalberita-assets`).
- Dengan cara ini, Anda bisa menggunakan **1 akun gratis Cloudinary yang sama** untuk banyak website tanpa khawatir gambar antar-domain saling tercampur atau terhapus secara tidak sengaja!

---

## 7. Panduan Memasang di Cloudflare Pages (Production)

Saat Anda mendeploy aplikasi ini ke Cloudflare Pages, ikuti langkah berikut untuk memasukkan seluruh 17 variabel:

1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages**.
2. Klik nama project Cloudflare Pages Anda.
3. Buka tab **Settings** > pilih submenu **Environment variables**.
4. Di bagian **Production**, klik **Add variables**.
5. Masukkan variabel sesuai rekomendasi jenis enkripsinya:
   - **Variabel Biasa (Plain text)**:
     - `SITE_URL`
     - `SITE_NAME`
     - `SITE_DESCRIPTION`
     - `TURNSTILE_SITE_KEY`
     - `ENABLE_TURNSTILE_FALLBACK`
     - `GITHUB_OWNER`
     - `GITHUB_REPO`
     - `GITHUB_BRANCH`
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_FOLDER`
   - **Variabel Rahasia (Wajib Klik tombol "Encrypt")**:
     - `JWT_SECRET`
     - `ADMIN_EMERGENCY_KEY`
     - `TURNSTILE_SECRET_KEY`
     - `GEMINI_API_KEY`
     - `GITHUB_TOKEN`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
6. Klik **Save**.
7. ⚠️ **Langkah Wajib (Redeploy)**:
   - Setiap kali Anda menambah atau memperbarui Environment Variables di Cloudflare Pages, buka tab **Deployments**.
   - Klik tombol titik tiga (`...`) pada deployment paling atas > pilih **Retry deployment** (atau lakukan commit baru ke GitHub).
   - Tanpa redeploy, kode Edge Functions belum akan membaca nilai variabel yang baru Anda simpan.

---

## 8. Template Berkas `.env` Lengkap untuk Komputer Lokal (Localhost)

Jika Anda menjalankan atau menguji aplikasi di komputer lokal (`npm run dev`), buat berkas baru bernama `.env` di folder utama proyek (sejajar dengan `package.json` dan `.env.example`), lalu isi seperti contoh lengkap berikut:

```env
# ==========================================
# 1. IDENTITAS SITUS (SITE IDENTITY)
# ==========================================
SITE_URL=http://localhost:3000
SITE_NAME=Portal Berita Mandiri
SITE_DESCRIPTION=Portal publikasi berita independen dan wawasan mendalam terkini.

# ==========================================
# 2. KEAMANAN & SESI ADMIN
# ==========================================
JWT_SECRET=8f4b62d1a3c5e79021bcdef4567890abcdef1234567890abcdef12345678
ADMIN_EMERGENCY_KEY=darurat123

# ==========================================
# 3. CLOUDFLARE TURNSTILE & MODE TOLERANSI
# ==========================================
TURNSTILE_SITE_KEY=0x4AAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAA...
ENABLE_TURNSTILE_FALLBACK=true

# ==========================================
# 4. GOOGLE GEMINI AI
# ==========================================
GEMINI_API_KEY=AIzaSy...

# ==========================================
# 5. GITHUB AUTO-SYNC & BACKUP (OPSIONAL)
# ==========================================
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=username_github_anda
GITHUB_REPO=nama_repo_anda
GITHUB_BRANCH=main

# ==========================================
# 6. CLOUDINARY MEDIA STORAGE (OPSIONAL)
# ==========================================
CLOUDINARY_CLOUD_NAME=nama_cloud_anda
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123
CLOUDINARY_FOLDER=cms-uploads
```

> 🔒 **Keamanan**: Berkas `.env` yang berisi token asli Anda sudah didaftarkan di `.gitignore` sehingga tidak akan terunggah secara tidak sengaja ke repositori GitHub publik Anda.

---

## 9. Lembar Ceklist Instalasi Cepat ke Domain Baru (Anti-Gagal)

Gunakan 7 langkah ceklist ini setiap kali memasang CMS pada domain baru:

- [ ] **1. Tambah Domain ke Cloudflare DNS**: Ganti Name Server di registrar domain ke Cloudflare dan pastikan status domain telah *Active*.
- [ ] **2. Inisialisasi Database D1**: Buat database D1 di Cloudflare Dashboard, buka tab *Console*, salin isi file `schema.sql`, lalu klik *Execute*.
- [ ] **3. Buat Widget Turnstile**: Di menu Turnstile Cloudflare, buat widget baru dan masukkan `domainbaru.com`, `*.pages.dev`, serta `localhost` pada daftar domain. Simpan *Site Key* & *Secret Key*.
- [ ] **4. Hubungkan Cloudflare Pages**: Connect Pages ke repositori GitHub Anda, set build command: `npm run build`, output: `dist`, build variable `NODE_VERSION=20`.
- [ ] **5. Hubungkan D1 Binding**: Pada Cloudflare Pages > Settings > Functions > D1 database bindings > Add binding dengan nama variabel persis: **`DB`**.
- [ ] **6. Pasang 17 Variabel Lingkungan**: Masukkan seluruh variabel ke Settings > Environment variables, termasuk `ENABLE_TURNSTILE_FALLBACK=true` untuk kelancaran setup awal. Hubungkan Custom Domain di tab *Custom domains*, lalu lakukan *Redeploy*.
- [ ] **7. Login Pertama Kali (Zero Friction)**:
  - Buka URL rahasia: `https://domainbaru.com/admin-9999` *(ingat: `/admin` adalah decoy 404)*.
  - Masukkan kredensial bawaan: Email: `admin@domain.com` (atau `admin`), Password: `admin123`.
  - Jika Turnstile menampilkan pesan error di domain baru, cukup klik tombol cepat: **"admin@domain.com / admin123 + darurat123 (Isi Otomatis)"** lalu klik **Masuk Portal CMS**.
  - Setelah masuk, ganti password admin di menu *Akun Admin* dan sesuaikan identitas situs di menu *Configs Situs*.
