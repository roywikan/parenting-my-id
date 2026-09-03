interface Env {
  DB?: any;
  SITE_URL?: string;
}

const INITIAL_SLUGS = [
  { slug: 'panduan-lengkap-pola-asuh-demokratis-anak-masa-kini', updatedAt: '2026-08-08' },
  { slug: '5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita', updatedAt: '2026-08-09' },
  { slug: 'mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk', updatedAt: '2026-08-10' },
];

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const siteUrl = env.SITE_URL || 'https://parenting.my.id';

  let posts: { slug: string; updatedAt: string }[] = INITIAL_SLUGS;

  if (env.DB) {
    try {
      const { results } = await env.DB.prepare(
        "SELECT slug, updated_at as updatedAt FROM posts WHERE status = 'published' ORDER BY id DESC"
      ).all();
      if (results && results.length > 0) {
        posts = results.map((r: any) => ({
          slug: r.slug,
          updatedAt: r.updatedAt ? r.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
        }));
      }
    } catch (e) {
      console.error('Error fetching posts for sitemap:', e);
    }
  }

  const urls = posts
    .map(
      (p) => `
  <url>
    <loc>${siteUrl}/baca/${p.slug}</loc>
    <lastmod>${p.updatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('');

  const staticPages = [
    { url: `${siteUrl}/privacy`, priority: '0.5' },
    { url: `${siteUrl}/about`, priority: '0.6' },
    { url: `${siteUrl}/contact`, priority: '0.6' },
    { url: `${siteUrl}/disclaimer`, priority: '0.5' },
    { url: `${siteUrl}/terms`, priority: '0.5' },
  ];

  const staticUrls = staticPages
    .map(
      (p) => `
  <url>
    <loc>${p.url}</loc>
    <changefreq>monthly</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${staticUrls}${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
