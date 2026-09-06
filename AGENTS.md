# Instruksi Baku Pengembang (Konfidensial & Permanen)

Dokumen ini dibaca dan diinjeksikan secara otomatis oleh Google AI Studio ke dalam instruksi sistem (system instructions) pada setiap sesi pengembangan.

## 1. Proteksi Berkas `coro.md` (Harga Mati)
- **DILARANG MENGHAPUS, MERESTRUKTURISASI, ATAU MENGUBAH NAMA BERKAS `coro.md` DALAM KONDISI APA PUN.**
- `coro.md` adalah dokumen rahasia dan utama dalam hal panduan operasi, skema database D1, dan instalasi script ini.
- Semua pembaruan dokumentasi WAJIB dilakukan ke dalam `coro.md` saja.
- Berkas `Readme.md` dan `README.md` wajib dikosongkan (0 bytes) dan isinya selalu diadaptasikan ke dalam `coro.md`.

## 2. Prioritas Keamanan (Security First)
- Keamanan website adalah prioritas utama.
- Pastikan sistem selalu memiliki perlindungan Anti Brute Force, Anti XSS, dan Anti Leech.
- Selalu lakukan pemeriksaan keamanan ekstra pada area `/admin-[suffix]`. Path `/admin` wajib decoy (404 Not Found) tanpa redirect.

## 3. SEO dan Aksesibilitas Googlebot
- Semua sistem yang melakukan render atau menghasilkan file XML, CSS, RSS, dan HTML harus dipastikan outputnya ramah SEO.
- Pastikan hasil HTML dapat di-crawl dengan baik oleh Googlebot tanpa error (homepage, tags, category, page, post page).

## 4. Klarifikasi Proaktif
- Jika prompt atau instruksi yang diberikan belum jelas atau memiliki ambiguitas, wajib berhenti dan bertanya kembali kepada user sebelum mengeksekusi perubahan.

## 5. Bersifat Niche Agnostic (Anti-Hardcoding Niche/Domain)
- Proyek ini dirancang sepenuhnya bersifat **Niche Agnostic** (dapat digunakan untuk topik atau domain apa pun tanpa terikat pada satu topik spesifik).
- Dalam antarmuka pengguna (UI), interaksi manusia, maupun output yang disajikan ke hadapan Googlebot/mesin pencari (HTML meta tags, title, Open Graph, JSON-LD schema, RSS feed, sitemap, llms.txt, footer, dsb.), **DILARANG MENG-HARDCODE** kata "parenting", "parenting.my.id", atau "Parenting my.id" sebagai teks statis yang tidak dapat diubah (unconfigurable/unchangeable).
- Seluruh nama situs, nama domain, deskripsi, meta title, kategori, topik, dan branding WAJIB selalu bersumber secara dinamis dari pengaturan konfigurasi database/sistem (`configs`), variabel lingkungan (`SITE_URL`, `SITE_NAME`, dsb.), atau state dinamis yang dapat diubah secara bebas oleh pemilik situs melalui portal konfigurasi admin.
