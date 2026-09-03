interface Env {
  DB?: any;
  SITE_URL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  // Security First Policy:
  // Do NOT redirect /admin to /admin-[suffix].
  // Attackers must NEVER know that a secret admin path exists or what suffix is used.
  // Return a 404 Not Found response so /admin appears completely non-existent.
  return new Response(
    `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 Halaman Tidak Ditemukan - parenting.my.id</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 4rem 1rem; background: #f8fafc; color: #334155; }
    h1 { font-size: 4rem; font-weight: 800; margin: 0 0 0.5rem 0; color: #e11d48; }
    p { font-size: 1.125rem; color: #64748b; margin-bottom: 1.5rem; }
    a { display: inline-block; padding: 0.625rem 1.25rem; background: #e11d48; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 0.75rem; }
  </style>
</head>
<body>
  <h1>404</h1>
  <p>Halaman yang Anda cari tidak ditemukan.</p>
  <a href="/">Kembali ke Beranda</a>
</body>
</html>`,
    {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
};

