#!/usr/bin/env node
/**
 * 录制演示 GIF（需要本地 dev server 在 5173）。
 *   node scripts/record-gifs.mjs            # 全部
 *   node scripts/record-gifs.mjs drag theme # 指定场景
 * 输出：/tmp/resume-gifs/*.webm，再手动用 ffmpeg 转 gif（见 README）。
 */
import { chromium } from './_env.mjs';
import fs from 'node:fs';

const OUT = '/tmp/resume-gifs';
fs.mkdirSync(OUT, { recursive: true });

const CURSOR = () => {
  const ensure = () => {
    if (!document.body || document.getElementById('demo-cursor')) return;
    const style = document.createElement('style');
    style.textContent = `#demo-cursor{position:fixed;z-index:2147483647;width:15px;height:15px;margin:-7.5px 0 0 -7.5px;border-radius:50%;background:rgba(37,99,235,.45);border:2px solid #fff;box-shadow:0 0 0 1px rgba(37,99,235,.55);pointer-events:none;left:-50px;top:-50px;transition:width .08s,height .08s,margin .08s}
      #demo-cursor.click{width:26px;height:26px;margin:-13px 0 0 -13px;background:rgba(37,99,235,.7)}`;
    document.head.appendChild(style);
    const dot = document.createElement('div');
    dot.id = 'demo-cursor';
    document.body.appendChild(dot);
    const move = (e) => {
      if (typeof e.clientX === 'number') {
        dot.style.left = e.clientX + 'px';
        dot.style.top = e.clientY + 'px';
      }
    };
    document.addEventListener('mousemove', move, true);
    document.addEventListener('dragover', move, true);
    document.addEventListener('mousedown', () => dot.classList.add('click'), true);
    document.addEventListener('mouseup', () => dot.classList.remove('click'), true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensure);
  else ensure();
};

const center = async (loc) => {
  const b = await loc.boundingBox();
  if (!b) throw new Error('元素没有布局');
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};

async function glide(page, to, steps = 20) {
  await page.mouse.move(to.x, to.y, { steps });
  await page.waitForTimeout(160);
}

async function clickAt(page, to) {
  await glide(page, to, 14);
  await page.mouse.down();
  await page.waitForTimeout(90);
  await page.mouse.up();
}

async function run(name, opts, scenario) {
  const { width, height, mobile = false } = opts;
  // 每个场景单独清空，避免覆盖其它场景的录制
  fs.rmSync(`${OUT}/${name}`, { recursive: true, force: true });
  fs.mkdirSync(`${OUT}/${name}`, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    recordVideo: { dir: `${OUT}/${name}`, size: { width, height } },
  });
  await ctx.addInitScript(CURSOR);
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
  await page.waitForSelector('.form-head h2');
  await page.waitForTimeout(900);
  await scenario(page);
  await page.waitForTimeout(900);
  const video = page.video();
  await ctx.close();
  console.log(name, await video.path());
}

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const which = process.argv.slice(2);

// A. 拖动模块排序
if (which.length === 0 || which.includes('drag')) {
  await run('drag', { width: 1100, height: 720 }, async (page) => {
    const from = await center(page.locator('.rail-item', { hasText: '证书与荣誉' }));
    const to = await center(page.locator('.rail-item', { hasText: '项目经历' }));
    await glide(page, from, 16);
    await page.mouse.down();
    await page.waitForTimeout(150);
    await page.mouse.move(from.x + 6, from.y - 20, { steps: 6 });
    await page.waitForTimeout(120);
    await page.mouse.move(to.x, to.y - 6, { steps: 30 });
    await page.waitForTimeout(400);
    await page.mouse.up();
    await page.waitForTimeout(900);
  });
}

// B. 换主题色
if (which.length === 0 || which.includes('theme')) {
  await run('theme', { width: 1440, height: 820 }, async (page) => {
    const palette = await center(page.getByRole('button', { name: /配色/ }));
    await clickAt(page, palette);
    await page.waitForTimeout(600);
    const purple = await center(page.locator('.swatch[title="#7c3aed"]'));
    await clickAt(page, purple);
    await page.waitForTimeout(900);
    // 点一下预览区，收起配色面板，留下干净的最终画面
    await clickAt(page, { x: 1120, y: 300 });
    await page.waitForTimeout(800);
  });
}

// C. 移动端打开预览并放大
if (which.length === 0 || which.includes('mobile')) {
  await run('mobile', { width: 390, height: 780, mobile: true }, async (page) => {
    const btn = await center(page.getByRole('button', { name: '预览' }));
    await clickAt(page, btn);
    await page.waitForTimeout(1000);
    // 在预览里向上滑，展示后面的内容
    await page.mouse.move(195, 600);
    await page.mouse.wheel(0, 420);
    await page.waitForTimeout(900);
    await page.mouse.wheel(0, 380);
    await page.waitForTimeout(900);
    const close = await center(page.locator('.preview-close'));
    await clickAt(page, close);
    await page.waitForTimeout(700);
  });
}

await browser.close();
