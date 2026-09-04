interface Env {
  DB?: any;
  SITE_URL?: string;
}

function escapeXml(unsafe: any): string {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeCdata(text: any): string {
  if (text == null) return '';
  return String(text).replace(/\]\]>/g, ']]]]><![CDATA[>');
}

const INITIAL_POSTS = [
  {
    title: 'Panduan Lengkap Pola Asuh Demokratis untuk Mendidik Anak Tangguh Masa Kini',
    slug: 'panduan-lengkap-pola-asuh-demokratis-anak-masa-kini',
    excerpt: 'Pola asuh demokratis menggabungkan kasih sayang, aturan yang konsisten, dan komunikasi terbuka.',
    createdAt: new Date().toISOString(),
  },
  {
    title: '5 Aktivitas Sensory Play Seru untuk Melatih Motorik Halus Balita di Rumah',
    slug: '5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita',
    excerpt: 'Temukan 5 ide permainan sensory play mudah dan hemat bahan untuk mengasah indera balita.',
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Mengenal Bahaya Stunting dan Cara Pencegahannya Sejak 1000 Hari Pertama Kehidupan',
    slug: 'mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk',
    excerpt: 'Stunting berpengaruh besar pada kecerdasan anak. Pelajari langkah pencegahannya.',
    createdAt: new Date().toISOString(),
  },
];

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const siteUrl = env.SITE_URL || 'https://parenting.my.id';

  let posts = INITIAL_POSTS;

  if (env.DB) {
    try {
      const { results } = await env.DB.prepare(
        "SELECT title, slug, excerpt, created_at as createdAt FROM posts WHERE status = 'published' ORDER BY id DESC"
      ).all();
      if (results && results.length > 0) {
        posts = results.map((r: any) => ({
          title: r.title,
          slug: r.slug,
          excerpt: r.excerpt,
          createdAt: r.createdAt || new Date().toISOString(),
        }));
      }
    } catch (e) {
      console.error('Error fetching posts for RSS feed:', e);
    }
  }

  const items = posts
    .map(
      (p) => {
        const link = escapeXml(`${siteUrl}/baca/${encodeURIComponent(p.slug)}`);
        return `
    <item>
      <title><![CDATA[${escapeCdata(p.title)}]]></title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description><![CDATA[${escapeCdata(p.excerpt)}]]></description>
      <pubDate>${escapeXml(new Date(p.createdAt).toUTCString())}</pubDate>
    </item>`;
      }
    )
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Parenting.my.id - Edukasi &amp; Pola Asuh Anak</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Portal berita &amp; informasi parenting terpercaya di Indonesia.</description>
    <language>id-id</language>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
