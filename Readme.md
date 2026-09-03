# 🚀 Dokumentasi Blog Engine parenting.my.id

Panduan lengkap instalasi, konfigurasi Cloudflare D1, GitHub Sync, dan pengoperasian website dapat dilihat pada file [coro.md](./coro.md).

### Synchronized Dynamic Static Generators (`llms.txt`, `llms-full.txt`, `sitemap.xml`, `feed.xml`)
Setiap kali ada artikel baru terbit, diperbarui, atau dihapus melalui CMS Admin Portal (`/admin`):
1. **Cloudflare D1 Database**: Data terupdate secara real-time.
2. **Dynamic Endpoint Handlers**: `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, dan `/feed.xml` langsung menyajikan daftar artikel terbaru secara instan.
3. **GitHub Auto-Sync**: Jika `GITHUB_TOKEN` dikonfigurasi, file fisik `public/llms.txt`, `public/llms-full.txt`, `public/sitemap.xml`, dan `public/feed.xml` secara otomatis dikomit ke repositori GitHub dalam satu gerakan via GitHub REST API.
