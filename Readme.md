# Parenting.my.id

Portal artikel parenting, edukasi pola asuh anak modern, gizi anak, stimulasi balita, dan pencegahan stunting terpercaya di Indonesia.

---

## 🛡️ Panduan Konfigurasi & Keamanan Turnstile & CSP

### 1. Cloudflare Turnstile (Anti-Spam & Anti-Brute Force)
Aplikasi mengintegrasikan **Cloudflare Turnstile** pada portal login Admin (`/admin-[suffix]`) dan pengiriman komentar pembaca.

- **Sisi Client (Site Key)**: Diatur di Portal Admin ➔ Tab **Config Situs** ➔ **Turnstile Site Key**.
- **Sisi Server (Secret Key)**: Ditambahkan di Cloudflare Pages Dashboard ➔ **Settings** ➔ **Environment Variables** ➔ `TURNSTILE_SECRET_KEY`.
- **Kunci Darurat Pemulihan (Emergency Recovery Key)**:
  - Tambahkan variable terenkripsi `ADMIN_EMERGENCY_KEY` di Cloudflare Pages **Settings** ➔ **Environment Variables**.
  - Jika widget Turnstile gagal dimuat atau terkunci dari luar, buka link darurat:
    `https://parenting.my.id/admin-9999?emergency_key=NILAI_KUNCI_DARURAT`
    atau klik tombol **"Opsi Darurat Terkunci dari Luar"** pada formulir login.
  - **Proteksi Anti Brute Force**: Tetap aktif membatasi maksimal 5 percobaan gagal per IP sebelum akun diblokir sementara 15 menit.
- **Pencegahan Terkunci dari Dalam**: Domain `https://challenges.cloudflare.com` wajib diizinkan di dalam Content Security Policy (CSP) untuk `script-src`, `frame-src`, dan `connect-src`. Tanpa deklarasi ini, widget validasi Turnstile akan diblokir oleh browser dan admin tidak dapat login.

### 2. HTTP Security Headers & Content Security Policy (CSP)
Dikonfigurasi di file `/public/_headers` (dan `/server.ts`):

```http
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://cusdis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://plus.unsplash.com https://ui-avatars.com; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' https://challenges.cloudflare.com https://cusdis.com https://www.youtube.com https://www.tiktok.com https://www.instagram.com; connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com https://static.cloudflareinsights.com https://cusdis.com https://api.cloudinary.com https://api.github.com;
```

- **`style-src 'self' 'unsafe-inline'`**: Menjamin inline style React dan kalkulasi tema dinamis tidak diblokir browser.
- **`script-src` & `connect-src`**: Mengizinkan Cloudflare Rocket Loader (`'unsafe-eval'`), Turnstile, dan Cloudflare Web Analytics (`https://static.cloudflareinsights.com`, `https://cloudflareinsights.com`).

---
Dokumentasi teknis lengkap silakan merujuk ke berkas `coro.md`.

© 2026 Parenting.my.id. All rights reserved.
