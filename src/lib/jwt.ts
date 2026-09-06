/**
 * Stateless HMAC-SHA256 JWT Utility
 * Uses native Web Crypto API (crypto.subtle) - Zero external dependencies.
 * Works uniformly in Cloudflare Workers / Pages, Node.js 18+, and modern browsers.
 */

export interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
}

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  name?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

export interface VerifyJwtResult {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
}

/**
 * Base64URL encode string or Uint8Array
 */
export function base64UrlEncode(input: string | Uint8Array): string {
  let binary = '';
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64URL decode to string
 */
export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Base64URL decode to Uint8Array (for signature verification)
 */
export function base64UrlToUint8Array(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Sign payload using HMAC-SHA256 and return signed JWT string.
 * @param payload Claims to include in token (id, email, role, etc.)
 * @param secret Secret key for signing (JWT_SECRET)
 * @param expiresInSeconds Expiration duration in seconds (defaults to 7 days = 604800s)
 */
export async function signJwtHmacSha256(
  payload: JwtPayload,
  secret: string,
  expiresInSeconds: number = 86400 * 7
): Promise<string> {
  const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(dataToSign)
  );

  const signatureB64 = base64UrlEncode(new Uint8Array(signatureBuffer));
  return `${dataToSign}.${signatureB64}`;
}

/**
 * Verify HMAC-SHA256 signed JWT token cryptographically and check expiration.
 * @param token JWT string
 * @param secret Secret key used for verification (JWT_SECRET)
 */
export async function verifyJwtHmacSha256(
  token: string,
  secret: string
): Promise<VerifyJwtResult> {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token autentikasi tidak ditemukan.' };
    }

    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Format token bukan JWT yang valid.' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const dataToVerify = `${headerB64}.${payloadB64}`;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = base64UrlToUint8Array(signatureB64);
    const isValidSig = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      enc.encode(dataToVerify)
    );

    if (!isValidSig) {
      return {
        valid: false,
        error: 'Tanda tangan token tidak valid. Manipulasi atau token palsu terdeteksi.',
      };
    }

    const payload: JwtPayload = JSON.parse(base64UrlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && typeof payload.exp === 'number' && payload.exp < now) {
      return {
        valid: false,
        error: 'Sesi token telah kedaluwarsa. Silakan lakukan login ulang.',
      };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return {
      valid: false,
      error: `Verifikasi token gagal: ${err?.message || 'Token tidak terbaca'}`,
    };
  }
}

/**
 * Extracts authentication token from Authorization header or Cookie header.
 */
export function extractTokenFromHeaderOrCookie(
  authHeader?: string | null,
  cookieHeader?: string | null
): string {
  if (authHeader && typeof authHeader === 'string') {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith('bearer ')) {
      return trimmed.slice(7).trim();
    }
    if (trimmed) {
      return trimmed;
    }
  }

  if (cookieHeader && typeof cookieHeader === 'string') {
    const match = cookieHeader.match(/(?:^|;\s*)(?:cms_token|session_token|auth_token|token)=([^;]+)/i);
    if (match) {
      return decodeURIComponent(match[1].trim());
    }
  }

  return '';
}
