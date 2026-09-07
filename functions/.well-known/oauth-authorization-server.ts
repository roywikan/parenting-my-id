interface Env {
  SITE_URL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const requestUrl = new URL(context.request.url);
  const siteUrl = (env.SITE_URL || requestUrl.origin).replace(/\/$/, '');

  const asMetadata = {
    issuer: siteUrl,
    authorization_endpoint: `${siteUrl}/api/auth/authorize`,
    token_endpoint: `${siteUrl}/api/auth/token`,
    registration_endpoint: `${siteUrl}/api/agent/register`,
    revocation_endpoint: `${siteUrl}/api/agent/revoke`,
    scopes_supported: [
      "read",
      "write",
      "posts:read",
      "posts:write",
    ],
    response_types_supported: [
      "code",
      "token",
    ],
    grant_types_supported: [
      "authorization_code",
      "client_credentials",
      "urn:ietf:params:oauth:grant-type:token-exchange",
    ],
    token_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_post",
      "none",
    ],
    service_documentation: `${siteUrl}/auth.md`,
    agent_auth: {
      skill: "https://isitagentready.com/.well-known/agent-skills/auth-md/SKILL.md",
      register_uri: `${siteUrl}/api/agent/register`,
      claim_uri: `${siteUrl}/api/agent/claim`,
      revocation_uri: `${siteUrl}/api/agent/revoke`,
      identity_types_supported: [
        "identity_assertion",
        "anonymous",
      ],
      identity_assertion: {
        assertion_types_supported: [
          "urn:ietf:params:oauth:token-type:id-jag",
          "verified_email",
        ],
        credential_types_supported: [
          "api_key",
          "bearer_token",
        ],
        claim_uri: `${siteUrl}/api/agent/claim`,
      },
      anonymous: {
        credential_types_supported: [
          "api_key",
          "bearer_token",
        ],
        claim_uri: `${siteUrl}/api/agent/claim`,
      },
      credential_types_supported: [
        "api_key",
        "bearer_token",
      ],
      events_supported: [
        "revocation",
      ],
      documentation_uri: `${siteUrl}/auth.md`,
    },
  };

  return new Response(JSON.stringify(asMetadata, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Link': `</auth.md>; rel="describedby"; type="text/markdown", </.well-known/oauth-protected-resource>; rel="service-desc"; type="application/json"`,
    },
  });
};
