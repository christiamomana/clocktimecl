import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';

// Un solo acceso de administración con contraseña (ADMIN_PASSWORD). La sesión es una cookie firmada:
// si cambias la contraseña, todas las sesiones abiertas se cierran.
// ADMIN_API_TOKEN (opcional) permite a Claude u otros scripts usar /api/admin con "Authorization: Bearer …".

const env = (k: string) => (import.meta.env[k] as string | undefined) ?? process.env[k];
const COOKIE = 'ct_admin';
const MAX_AGE = 60 * 60 * 24 * 7;

export const adminConfigured = () => Boolean(env('ADMIN_PASSWORD'));

const key = () => createHash('sha256').update(`clocktime-session:${env('ADMIN_PASSWORD') ?? ''}`).digest();
const sign = (payload: string) => createHmac('sha256', key()).update(payload).digest('base64url');

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(input: string): boolean {
  const expected = env('ADMIN_PASSWORD');
  return Boolean(expected) && safeEqual(input, expected!);
}

export function startSession(cookies: AstroCookies, secure: boolean) {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  cookies.set(COOKIE, `${exp}.${sign(exp)}`, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: MAX_AGE });
}

export function endSession(cookies: AstroCookies) {
  cookies.delete(COOKIE, { path: '/' });
}

export function hasSession(cookies: AstroCookies): boolean {
  if (!adminConfigured()) return false;
  const value = cookies.get(COOKIE)?.value ?? '';
  const [exp, sig] = value.split('.');
  if (!exp || !sig || !safeEqual(sig, sign(exp))) return false;
  return Number(exp) > Date.now() / 1000;
}

export function hasApiToken(request: Request): boolean {
  const token = env('ADMIN_API_TOKEN');
  const header = request.headers.get('authorization') ?? '';
  return Boolean(token) && token!.length >= 24 && header.startsWith('Bearer ') && safeEqual(header.slice(7), token!);
}
