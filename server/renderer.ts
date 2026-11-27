import { chromium, type Browser } from 'playwright-core';
import type { Resume } from '../shared/schema/types.ts';

let browserPromise: Promise<Browser> | null = null;
let idleTimer: NodeJS.Timeout | null = null;
let queue: Promise<unknown> = Promise.resolve();

function touchIdle() {
  if (idleTimer) clearTimeout(idleTimer);
  // 空闲 5 分钟后释放 Chromium
  idleTimer = setTimeout(() => {
    void shutdownBrowser();
  }, 5 * 60 * 1000);
  idleTimer.unref?.();
}

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium
      .launch({
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
      })
      .then((b) => {
        b.on('disconnected', () => {
          browserPromise = null;
        });
        return b;
      })
      .catch((err) => {
        browserPromise = null;
        throw err;
      });
  }
  return browserPromise;
}

export function chromiumInfo() {
  try {
    return chromium.executablePath();
  } catch {
    return null;
  }
}

async function renderOnce(resume: Resume, origin: string): Promise<Buffer> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1600 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  try {
    await page.goto(`${origin}/#/export`, { waitUntil: 'load', timeout: 20000 });
    await page.waitForFunction(() => typeof window.__setExportPayload === 'function', null, {
      timeout: 15000,
    });
    await page.evaluate((payload) => {
      window.__setExportPayload?.(payload as never);
    }, resume);

    await page.waitForSelector('html[data-export-ready="1"]', { timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    // 给图片 decode / 布局稳定留一点时间
    await page.waitForFunction(
      () => Array.from(document.images).every((img) => img.complete),
      null,
      { timeout: 5000 },
    ).catch(() => undefined);
    await page.waitForTimeout(120);

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await context.close().catch(() => undefined);
  }
}

/** 串行化：多个标签页同时导出时不要一起抢内存。 */
export function renderPdf(resume: Resume, origin: string): Promise<Buffer> {
  const task = queue.then(
    () => {
      touchIdle();
      return renderOnce(resume, origin);
    },
    () => {
      touchIdle();
      return renderOnce(resume, origin);
    },
  );
  queue = task.catch(() => undefined);
  return task;
}

export async function shutdownBrowser() {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  const p = browserPromise;
  browserPromise = null;
  if (p) {
    const b = await p.catch(() => null);
    await b?.close().catch(() => undefined);
  }
}
