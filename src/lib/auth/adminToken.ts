import crypto from 'crypto';
import type { AdminEntity } from '@/types/admin';

interface JwtPayload {
  sub: string;
  username: string;
  iat: number;
  exp: number;
}

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

function getSecret(): string {
  if (!ADMIN_JWT_SECRET) {
    throw new Error(
      'ADMIN_JWT_SECRET is not set. Please configure a strong secret in your server environment.',
    );
  }
  return ADMIN_JWT_SECRET;
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): Buffer {
  const pad = 4 - (input.length % 4);
  const normalized = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(input.length + (pad === 4 ? 0 : pad), '=');
  return Buffer.from(normalized, 'base64');
}

export function signAdminToken(
  admin: AdminEntity,
  options?: { expiresInSeconds?: number },
): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = now + (options?.expiresInSeconds ?? 60 * 60); // 기본 1시간

  const payload: JwtPayload = {
    sub: admin.id,
    username: admin.username,
    iat: now,
    exp,
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerEncoded}.${payloadEncoded}`;

  const secret = getSecret();
  const signature = crypto.createHmac('sha256', secret).update(data).digest();

  const signatureEncoded = base64UrlEncode(signature);
  return `${data}.${signatureEncoded}`;
}

export function verifyAdminToken(token: string): {
  valid: boolean;
  adminId?: string;
  error?: string;
} {
  try {
    const secret = getSecret();
    const parts = token.split('.');

    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
    const data = `${headerEncoded}.${payloadEncoded}`;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest();
    const expectedSignatureEncoded = base64UrlEncode(expectedSignature);

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signatureEncoded),
        Buffer.from(expectedSignatureEncoded),
      )
    ) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const payloadJson = base64UrlDecode(payloadEncoded).toString('utf8');
    const payload = JSON.parse(payloadJson) as JwtPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false, error: 'Token has expired' };
    }

    return { valid: true, adminId: payload.sub };
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return { valid: false, error: 'Token verification failed' };
  }
}
