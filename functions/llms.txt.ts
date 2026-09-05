interface Env {
  DB?: any;
  SITE_URL?: string;
}

const INITIAL_POSTS = [
  {
    title: 'Panduan Lengkap Pola Asuh Demokratis untuk Mendidik Anak Tangguh Masa Kini',
    slug: 'panduan-lengkap-pola-asuh-demokratis-anak-masa-kini',
    excerpt: 'Pola asuh demokratis menggabungkan kasih sayang, aturan yang konsisten, dan komunikasi terbuka.',
  },
  {
    title: '5 Aktivitas Sensory Play Seru untuk Melatih Motorik Halus Balita di Rumah',
    slug: '5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita',
    excerpt: 'Temukan 5 ide permainan sensory play mudah dan hemat bahan untuk mengasah indera balita.',
  },
  {
    title: 'Mengenal Bahaya Stunting dan Cara Pencegahannya Sejak 1000 Hari Pertama Kehidupan',
    slug: 'mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk',
    excerpt: 'Stunting berpengaruh besar pada kecerdasan anak. Pelajari langkah pencegahannya.',
  },
];

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const requestUrl = new URL(context.request.url);
  const siteUrl = (env.SITE_URL || requestUrl.origin).replace(/\/$/, '');

  let siteName = requestUrl.hostname.replace('www.', '') || 'Portal Informasi';
  let siteDescription = 'Portal informasi dan edukasi terpercaya.';

  let posts = INITIAL_POSTS;

  if (env.DB) {
    try {
      const results = await env.DB.prepare("SELECT key, value FROM configs WHERE key IN ('site_name', 'site_description', 'seo_meta_title', 'seo_meta_description')").all();
      const configMap: Record<string, string> = {};
      if (results && results.results) {
        for (const row of results.results) {
          try {
            configMap[row.key] = JSON.parse(row.value);
          } catch {
            configMap[row.key] = row.value;
          }
        }
      }
      siteName = configMap.site_name || configMap.seo_meta_title || siteName;
      siteDescription = configMap.site_description || configMap.seo_meta_description || siteDescription;

      const { results: postsResults } = await env.DB.prepare(
        "SELECT title, slug, excerpt FROM posts WHERE status = 'published' ORDER BY id DESC"
      ).all();
      if (postsResults && postsResults.length > 0) {
        posts = postsResults.map((r: any) => ({
          title: r.title,
          slug: r.slug,
          excerpt: r.excerpt || '',
        }));
      }
    } catch (e) {
      console.error('Error fetching posts for llms.txt:', e);
    }
  }

  const articlesList = posts
    .map((p) => {
      const cleanTitle = (p.title || '').replace(/[\[\]]/g, '').trim();
      const cleanDesc = (p.excerpt || '')
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return `- [${cleanTitle}](${siteUrl}/baca/${p.slug})${cleanDesc ? `: ${cleanDesc}` : ''}`;
    })
    .join('\n');

  const content = `# ${siteName}

> ${siteDescription}

## Artikel Terbit & Panduan Utama

${articlesList}
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};

