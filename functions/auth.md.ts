interface Env {
  DB?: any;
  SITE_URL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const requestUrl = new URL(context.request.url);
  const siteUrl = (env.SITE_URL || requestUrl.origin).replace(/\/$/, '');
  const siteHost = requestUrl.host;

  let siteName = requestUrl.hostname.replace('www.', '') || 'Portal Informasi';
  let siteDescription = 'Portal informasi dan publikasi konten digital.';

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
    } catch {
      // fallback to defaults
    }
  }

  const authMdContent = `# ${siteName} auth.md

> Machine and developer instructions for AI Agent registration, authentication, and scoped access to ${siteName}.

## Overview
This service implements the open **Auth.md** protocol for autonomous AI agent discovery, self-registration, and user-scoped credential issuance.

- **Service URL**: ${siteUrl}
- **Service Description**: ${siteDescription}
- **Protected Resource Metadata**: [/.well-known/oauth-protected-resource](${siteUrl}/.well-known/oauth-protected-resource)
- **Authorization Server Metadata**: [/.well-known/oauth-authorization-server](${siteUrl}/.well-known/oauth-authorization-server)
- **API Catalog**: [/.well-known/api-catalog](${siteUrl}/.well-known/api-catalog)
- **Machine Documentation**: [${siteUrl}/llms.txt](${siteUrl}/llms.txt)

---

## Agent Registration Discovery

Agents can discover authorization endpoints via RFC 9728 and RFC 8414 metadata:

1. Fetch **Protected Resource Metadata (PRM)** from \`/.well-known/oauth-protected-resource\`.
2. Inspect the advertised \`authorization_servers\` and fetch \`/.well-known/oauth-authorization-server\`.
3. Locate the \`agent_auth\` block containing \`register_uri\`, \`claim_uri\`, \`revocation_uri\`, and supported identity/credential types.

---

## Supported Authentication & Registration Flows

### 1. Identity Assertion Flow (ID-JAG & Verified Email)
Trusted agent providers or platforms asserting identity via Identity Assertion JWT Authorization Grants (ID-JAG) or verified email:
- **Identity Types**: \`identity_assertion\`
- **Assertion Types**: \`urn:ietf:params:oauth:token-type:id-jag\`, \`verified_email\`
- **Credential Types**: \`api_key\`, \`bearer_token\`
- **Registration Endpoint**: \`POST ${siteUrl}/api/agent/register\`

### 2. Anonymous & User Claimed Flow
Autonomous agents can register an ephemeral anonymous agent session, which can subsequently be linked to an authenticated user account:
- **Identity Types**: \`anonymous\`
- **Credential Types**: \`api_key\`, \`bearer_token\`
- **Registration Endpoint**: \`POST ${siteUrl}/api/agent/register\`
- **Claim Endpoint**: \`POST ${siteUrl}/api/agent/claim\`
- **Revocation Endpoint**: \`POST ${siteUrl}/api/agent/revoke\`

---

## Registration Request (cURL Example)

\`\`\`bash
curl -X POST "${siteUrl}/api/agent/register" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_name": "MyAiAgent/1.0",
    "identity_type": "anonymous",
    "scopes": ["posts:read", "read"]
  }'
\`\`\`

### Registration Response
\`\`\`json
{
  "status": "success",
  "client_id": "agent_sample_id",
  "token_type": "Bearer",
  "access_token": "agt_live_sample_token",
  "scopes": ["posts:read", "read"],
  "expires_in": 86400,
  "claim_uri": "${siteUrl}/api/agent/claim",
  "revocation_uri": "${siteUrl}/api/agent/revoke"
}
\`\`\`

---

## Available Scopes

| Scope | Description |
| :--- | :--- |
| \`read\` | Read-only access to public articles, categories, tags, and site configs |
| \`posts:read\` | Read published articles and feed content |
| \`posts:write\` | Author draft posts (requires claimed admin or editor privilege) |
| \`write\` | General write operations (requires verified assertion or claimed session) |

---

## Credential Usage & Revocation

Present credentials in API requests:
\`\`\`http
GET /api/posts HTTP/1.1
Host: ${siteHost}
Authorization: Bearer <access_token>
\`\`\`

To revoke credentials:
\`\`\`bash
curl -X POST "${siteUrl}/api/agent/revoke" \\
  -H "Authorization: Bearer <access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"token": "<access_token>"}'
\`\`\`
`;

  const tokensCount = Math.ceil(authMdContent.length / 4);

  return new Response(authMdContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(tokensCount),
      'Vary': 'Accept',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Link': `</.well-known/oauth-protected-resource>; rel="service-desc"; type="application/json", </.well-known/oauth-authorization-server>; rel="oauth-authorization-server"; type="application/json", </.well-known/api-catalog>; rel="api-catalog"`,
    },
  });
};
