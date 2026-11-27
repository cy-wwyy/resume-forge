#!/usr/bin/env node
/**
 * 导出回归检查：
 *  1. PNG 下载（纯前端 raster）
 *  2. 矢量 PDF 下载（本地导出服务）
 *  3. 静态模式（api 被断掉）下的位图 PDF 下载
 * 只做结构判断，不依赖 pdftotext：
 *  - 矢量 PDF 里应有字体流（/FontFile2 或 Type0），不应整页是 JPEG（/DCTDecode）
 *  - 位图 PDF 反过来
 */
import { chromium } from './_env.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/tmp/resume-export-test';
const URL = process.env.APP_URL ?? 'http://127.0.0.1:5173/';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

async function openApp(blockApi) {
  const ctx = await browser.newContext({
    viewport: { width: 1460, height: 900 },
    acceptDownloads: true,
  });
  if (blockApi) {
    await ctx.route('**/api/**', (route) => route.abort());
  }
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForSelector('.rs-name', { timeout: 20000 });
  return { ctx, page };
}

async function downloadByMenu(page, itemText, file) {
  await page.getByRole('button', { name: /导出/ }).click();
  const dlPromise = page.waitForEvent('download', { timeout: 90000 });
  await page.getByText(itemText, { exact: false }).first().click();
  const dl = await dlPromise;
  const target = path.join(OUT, file);
  await dl.saveAs(target);
  return { file: target, suggested: dl.suggestedFilename(), size: fs.statSync(target).size };
}

async function inkRatio(page, file) {
  const b64 = fs.readFileSync(file).toString('base64');
  return page.evaluate(async (data) => {
    const img = new Image();
    img.src = `data:image/png;base64,${data}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let dark = 0;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i] < 245 || px[i + 1] < 245 || px[i + 2] < 245) dark += 1;
    }
    return dark / (canvas.width * canvas.height);
  }, b64);
}

function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function pdfTraits(file) {
  const text = fs.readFileSync(file).toString('latin1');
  return {
    pages: (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length,
    hasFontFile: /\/FontFile2|\/Subtype\s*\/Type0/.test(text),
    hasJpeg: /\/DCTDecode/.test(text),
  };
}

const results = {};

// 1 + 2：服务在线
{
  const { ctx, page } = await openApp(false);
  const png = await downloadByMenu(page, 'PNG 图片', 'out.png');
  results.png = { ...png, ...pngSize(png.file), ink: await inkRatio(page, png.file) };

  const pdf = await downloadByMenu(page, 'PDF', 'out-vector.pdf');
  results.vectorPdf = { ...pdf, ...pdfTraits(pdf.file) };
  await ctx.close();
}

// 3：静态模式
{
  const { ctx, page } = await openApp(true);
  const pdf = await downloadByMenu(page, 'PDF', 'out-raster.pdf');
  results.rasterPdf = { ...pdf, ...pdfTraits(pdf.file) };
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

const fail = [];
if (!results.png.width || results.png.width < 1000) fail.push('PNG 尺寸异常');
if (results.png.ink < 0.001) fail.push(`PNG 几乎是空白（ink=${results.png.ink}）`);
if (!results.vectorPdf.hasFontFile) fail.push('矢量 PDF 里没有字体流');
if (results.vectorPdf.pages < 1) fail.push('矢量 PDF 没有页面');
if (!results.rasterPdf.hasJpeg) fail.push('位图 PDF 里没有 JPEG');
if (fail.length) {
  console.error('FAIL:', fail.join('; '));
  process.exit(1);
}
console.log('OK');
