import { timingSafeEqual } from 'node:crypto';

export function parseOrigins(raw) {
  return (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

export function corsHeaders(origin, allowed) {
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

export function checkBearer(authHeader, expected) {
  if (!expected) return true;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const got = Buffer.from(authHeader.slice(7));
  const want = Buffer.from(expected);
  return got.length === want.length && timingSafeEqual(got, want);
}
