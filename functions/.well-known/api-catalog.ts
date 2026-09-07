interface Env {
  [key: string]: any;
}

export const onRequest: PagesFunction<Env> = async () => {
  const catalog = {
    "linkset": [
      {
        "anchor": "/",
        "service-desc": [
          {
            "href": "/api/posts",
            "type": "application/json"
          }
        ],
        "service-doc": [
          {
            "href": "/llms.txt",
            "type": "text/plain"
          }
        ],
        "describedby": [
          {
            "href": "/llms.txt",
            "type": "text/plain"
          },
          {
            "href": "/llms-full.txt",
            "type": "text/plain"
          }
        ],
        "alternate": [
          {
            "href": "/feed.xml",
            "type": "application/rss+xml"
          },
          {
            "href": "/sitemap.xml",
            "type": "application/xml"
          }
        ]
      },
      {
        "anchor": "/api/posts",
        "service-doc": [
          {
            "href": "/llms.txt",
            "type": "text/plain"
          }
        ]
      }
    ]
  };

  return new Response(JSON.stringify(catalog, null, 2), {
    headers: {
      'Content-Type': 'application/linkset+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
