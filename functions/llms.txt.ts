export async function onRequest() {
  const content = `# Parenting.my.id

> Portal berita dan informasi parenting terpercaya di Indonesia. Menyajikan edukasi pola asuh anak, kesehatan, serta nutrisi keluarga.

## Artikel Terkait & Panduan Utama

* [Panduan Lengkap Pola Asuh Demokratis](https://parenting.my.id/baca/panduan-lengkap-pola-asuh-demokratis-anak-masa-kini)
* [5 Aktivitas Sensory Play Balita](https://parenting.my.id/baca/5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita)
* [Mengenal Bahaya Stunting & 1000 HPK](https://parenting.my.id/baca/mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk)
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
