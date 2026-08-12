interface Env {
  [key: string]: any;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname;

  let shouldRedirect = false;
  const targetDomain = 'parenting.my.id';
  let targetPath = pathname;

  // 1. Domain Canonicalization: www.parenting.my.id -> parenting.my.id
  if (hostname === 'www.parenting.my.id') {
    shouldRedirect = true;
  }

  // 2. Legacy Category Path Redirection (/makanan/*, /balita/*, etc. -> /baca/*)
  if (pathname.startsWith('/makanan/')) {
    shouldRedirect = true;
    targetPath = pathname.replace(/^\/makanan\//, '/baca/');
  } else if (pathname.startsWith('/balita/')) {
    shouldRedirect = true;
    targetPath = pathname.replace(/^\/balita\//, '/baca/');
  } else if (pathname.startsWith('/kesehatan/')) {
    shouldRedirect = true;
    targetPath = pathname.replace(/^\/kesehatan\//, '/baca/');
  } else if (pathname.startsWith('/parenting/')) {
    shouldRedirect = true;
    targetPath = pathname.replace(/^\/parenting\//, '/baca/');
  }

  if (shouldRedirect) {
    const redirectUrl = `https://${targetDomain}${targetPath}${url.search}`;
    return Response.redirect(redirectUrl, 301);
  }

  return next();
};
