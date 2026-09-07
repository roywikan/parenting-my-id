interface Env {
  DB?: any;
  SITE_URL?: string;
}

const INITIAL_POSTS = [
  {
    title: 'Panduan Lengkap Pola Asuh Demokratis untuk Mendidik Anak Tangguh Masa Kini',
    slug: 'panduan-lengkap-pola-asuh-demokratis-anak-masa-kini',
    excerpt: 'Pola asuh demokratis menggabungkan kasih sayang, aturan yang konsisten, dan komunikasi terbuka.',
    contentMarkdown: 'Pola asuh demokratis menggabungkan kasih sayang, aturan yang konsisten, dan komunikasi terbuka. Simak strategi praktis penerapannya di rumah.',
    category: 'Pola Asuh',
    updatedAt: '2026-09-01T04:39:21.210Z',
    createdAt: '2026-09-01T04:39:21.210Z',
    authorName: 'Tim Redaksi',
  },
  {
    title: '5 Aktivitas Sensory Play Seru untuk Melatih Motorik Halus Balita di Rumah',
    slug: '5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita',
    excerpt: 'Temukan 5 ide permainan sensory play mudah dan hemat bahan untuk mengasah indera balita.',
    contentMarkdown: 'Temukan 5 ide permainan sensory play mudah dan hemat bahan untuk mengasah indera serta ketangkasan motorik balita di rumah.',
    category: 'Tumbuh Kembang',
    updatedAt: '2026-09-02T04:39:21.210Z',
    createdAt: '2026-09-02T04:39:21.210Z',
    authorName: 'Tim Redaksi',
  },
  {
    title: 'Mengenal Bahaya Stunting dan Cara Pencegahannya Sejak 1000 Hari Pertama Kehidupan',
    slug: 'mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk',
    excerpt: 'Stunting berpengaruh besar pada kecerdasan anak. Pelajari langkah pencegahannya.',
    contentMarkdown: 'Stunting berpengaruh besar pada kecerdasan anak. Pelajari langkah pencegahan stunting melalui pemberian ASI eksklusif dan MPASI tinggi protein.',
    category: 'Kesehatan & Nutrisi',
    updatedAt: '2026-09-03T04:39:21.210Z',
    createdAt: '2026-09-03T04:39:21.210Z',
    authorName: 'Tim Redaksi',
  },
];

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const requestUrl = new URL(context.request.url);
  const siteUrl = (env.SITE_URL || requestUrl.origin).replace(/\/$/, '');

  let siteName = requestUrl.hostname.replace('www.', '') || 'Portal Informasi';
  let siteDescription = 'Portal informasi dan edukasi terpercaya.';

  let postsList: any[] = INITIAL_POSTS;

  if (env.DB) {
    try {
      const results = await env.DB.prepare(
        "SELECT key, value FROM configs WHERE key IN ('site_name', 'site_description', 'seo_meta_title', 'seo_meta_description')"
      ).all();
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

      const { results: dbPosts } = await env.DB.prepare(
        `SELECT p.title, p.slug, p.excerpt, p.content_markdown as contentMarkdown, p.category, p.updated_at as updatedAt, p.created_at as createdAt, u.name as authorName
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
         WHERE p.status = 'published'
         ORDER BY p.id DESC`
      ).all();

      if (dbPosts && dbPosts.length > 0) {
        postsList = dbPosts;
      }
    } catch (e) {
      console.error('Error fetching posts for llms-full.txt:', e);
    }
  }

  const fullArticles = postsList.map((p: any) => {
    const url = `${siteUrl}/baca/${p.slug}`;
    const author = p.authorName || `Tim Redaksi ${siteName}`;
    const category = p.category || 'Umum';
    const date = p.updatedAt || p.createdAt || new Date().toISOString();
    return `---

# ${p.title}

* **URL:** ${url}
* **Penulis:** ${author}
* **Kategori:** ${category}
* **Terakhir Diperbarui:** ${date}
* **Ringkasan:** ${p.excerpt || ''}

${p.contentMarkdown || ''}
`;
  }).join('\n\n');

  const llmsFullTxt = `# Arsip Lengkap Artikel ${siteName} (LLMs Full Text)

Dokumen ini memuat kumpulan artikel lengkap dalam format Markdown untuk Large Language Models (LLMs).

${fullArticles}
`.trim();

  return new Response(llmsFullTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
      'Link': `</.well-known/api-catalog>; rel="api-catalog", </llms.txt>; rel="alternate"; type="text/plain", </auth.md>; rel="describedby"; type="text/markdown"`,
    },
  });
};
