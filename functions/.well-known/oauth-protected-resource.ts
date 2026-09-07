interface Env {
  SITE_URL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const requestUrl = new URL(context.request.url);
  const siteUrl = (env.SITE_URL || requestUrl.origin).replace(/\/$/, '');

  const prm = {
    resource: siteUrl,
    authorization_servers: [
      siteUrl,
    ],
    scopes_supported: [
      "read",
      "write",
      "posts:read",
      "posts:write",
    ],
    bearer_methods_supported: [
      "header",
    ],
    resource_documentation: `${siteUrl}/auth.md`,
  };

  return new Response(JSON.stringify(prm, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Link': `</auth.md>; rel="describedby"; type="text/markdown", </.well-known/oauth-authorization-server>; rel="oauth-authorization-server"; type="application/json"`,
    },
  });
};
