import { defineMiddleware } from 'astro:middleware';
import { hasApiToken, hasSession } from './lib/server/auth';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminApi = pathname.startsWith('/api/admin/');
  if (!isAdminPage && !isAdminApi) return next();

  const isLogin = pathname === '/admin/login';
  const allowed = isLogin || hasSession(ctx.cookies) || (isAdminApi && hasApiToken(ctx.request));

  if (!allowed) {
    if (isAdminApi) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    const nextUrl = encodeURIComponent(pathname + ctx.url.search);
    return ctx.redirect(`/admin/login?next=${nextUrl}`);
  }

  const res = await next();
  res.headers.set('cache-control', 'no-store');
  res.headers.set('x-robots-tag', 'noindex');
  return res;
});
