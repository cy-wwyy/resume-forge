import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import type { Resume } from '../shared/schema/types.ts';

// 必须在 import playwright 之前注入浏览器路径，否则它会去默认缓存找 Chromium
try {
  process.loadEnvFile('.env');
} catch {
  // .env 可选
}

const { renderPdf, shutdownBrowser, chromiumInfo } = await import('./renderer.ts');

const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT ?? 3001);
// 生产模式由自己托管 dist，原点必须指向自己；开发模式指向 Vite
const APP_ORIGIN = isProd
  ? `http://127.0.0.1:${PORT}`
  : (process.env.APP_ORIGIN ?? 'http://127.0.0.1:5173');

const app = new Hono();

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    mode: isProd ? 'production' : 'development',
    appOrigin: APP_ORIGIN,
    chromium: chromiumInfo(),
  }),
);

app.post('/api/export', async (c) => {
  let body: { format?: string; resume?: Resume; filename?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: '请求体不是合法 JSON' }, 400);
  }

  if (body.format !== 'pdf') {
    return c.json({ message: `暂不支持的格式：${body.format ?? '空'}` }, 400);
  }
  const resume = body.resume;
  if (!resume || !resume.basics || !Array.isArray(resume.sections)) {
    return c.json({ message: '简历数据不完整' }, 400);
  }

  const started = Date.now();
  try {
    const pdf = await renderPdf(resume, APP_ORIGIN);
    const filename = (body.filename || 'resume.pdf').replace(/[\r\n"\\]/g, '');
    const ascii = filename.replace(/[^\x20-\x7e]/g, '_');
    console.log(`[export] pdf ok ${(pdf.length / 1024).toFixed(0)}KB in ${Date.now() - started}ms`);
    return new Response(pdf as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': String(pdf.length),
      },
    });
  } catch (err) {
    console.error('[export] failed', err);
    return c.json(
      { message: err instanceof Error ? err.message : '导出失败', detail: String(err) },
      500,
    );
  }
});

if (isProd) {
  app.use('/*', serveStatic({ root: './dist' }));
  app.get('*', serveStatic({ path: './dist/index.html' }));
}

const server = serve({ fetch: app.fetch, port: PORT, hostname: '127.0.0.1' }, (info) => {
  console.log(`[api] http://127.0.0.1:${info.port}  (app: ${APP_ORIGIN}, ${isProd ? 'production' : 'development'})`);
});

const close = async () => {
  await shutdownBrowser();
  server.close();
  process.exit(0);
};
process.on('SIGINT', close);
process.on('SIGTERM', close);
