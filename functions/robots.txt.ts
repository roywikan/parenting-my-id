interface Env {
  SITE_URL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const requestUrl = new URL(context.request.url);
  const siteUrl = (context.env.SITE_URL || requestUrl.origin).replace(/\/$/, '');
  const txt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /redaksi-login
Disallow: /portal-redaksi
Disallow: /kelola-parenting
Disallow: /dashboard-redaksi

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(txt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
