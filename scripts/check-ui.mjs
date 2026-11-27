#!/usr/bin/env node
/**
 * 交互冒烟：改内容 → 预览同步 → 刷新后仍在 → 模块开关生效 → JSON 导出/导入。
 */
import { chromium } from './_env.mjs';
import fs from 'node:fs';

const URL = process.env.APP_URL ?? 'http://127.0.0.1:5173/';
const OUT = '/tmp/resume-ui-test';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1460, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());

const results = {};
await page.goto(URL, { waitUntil: 'load' });
await page.waitForSelector('.rs-name');

// 1. 改名 -> 预览同步
await page.locator('.rail-item', { hasText: '基本信息' }).click();
const nameInput = page.getByPlaceholder('张三');
await nameInput.fill('林小满');
await page.waitForFunction(() => document.querySelector('.rs-name')?.textContent === '林小满');
results.previewSync = true;

// 2. 模块开关
const eduRow = page.locator('.rail-item', { hasText: '教育经历' });
await eduRow.locator('.switch').click();
await page.waitForFunction(() => !document.querySelector('.rs')?.textContent?.includes('教育经历'));
results.toggleHide = true;

// 3. 刷新后仍在（IndexedDB）
await page.waitForTimeout(900);
await page.reload({ waitUntil: 'load' });
await page.waitForSelector('.rs-name');
await page.waitForFunction(() => document.querySelector('.rs-name')?.textContent === '林小满');
await page.waitForFunction(() => !document.querySelector('.rs')?.textContent?.includes('教育经历'));
await page.locator('.rail-item', { hasText: '基本信息' }).click();
results.persisted = true;

// 4. 导出 JSON
await page.getByRole('button', { name: /导出/ }).click();
const dlPromise = page.waitForEvent('download');
await page.getByText('JSON 数据').click();
const dl = await dlPromise;
const jsonPath = `${OUT}/${dl.suggestedFilename()}`;
await dl.saveAs(jsonPath);
const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
results.jsonExport = {
  file: dl.suggestedFilename(),
  name: json.resume?.basics?.name,
  sections: json.resume?.sections?.length,
  eduVisible: json.resume?.sections?.find((s) => s.kind === 'education')?.visible,
};

// 5. 改回原名，再导入刚才的文件，验证被覆盖回来
await nameInput.fill('临时名字').catch(() => {});
await page.getByRole('button', { name: /导出/ }).click();
const chooserPromise = page.waitForEvent('filechooser');
await page.getByText('导入 JSON').click();
const chooser = await chooserPromise;
await chooser.setFiles(jsonPath);
await page.waitForFunction(() => document.querySelector('.rs-name')?.textContent === '林小满', null, { timeout: 10000 });
results.jsonImport = true;

// 6. 添加模块
await page.locator('.rail-add').click();
await page.locator('.rail-menu-item', { hasText: '项目经历' }).click();
await page.waitForFunction(() => document.querySelector('.rs')?.textContent?.includes('项目经历'));
results.addSection = true;

// 7. 时间位置切换 + 全屏编辑 + 侧栏收起
await page.locator('.rail-item', { hasText: '工作经历' }).click();
await page.getByRole('button', { name: /模板/ }).click();
await page.getByRole('button', { name: '最右侧' }).click();
await page.waitForFunction(() => document.querySelector('.rs')?.getAttribute('data-date') === 'right');
results.dateStyle = true;

await page.getByRole('button', { name: '全屏' }).first().click();
await page.waitForSelector('.rt-full', { timeout: 5000 });
await page.keyboard.press('Escape');
await page.waitForFunction(() => !document.querySelector('.rt-full'));
results.fullscreen = true;

await page.locator('.rail-collapse').click();
await page.waitForFunction(() => document.querySelector('.rail')?.classList.contains('collapsed'));
await page.locator('.rail-collapse').click();
await page.waitForFunction(() => !document.querySelector('.rail')?.classList.contains('collapsed'));
results.collapse = true;

// 8. 拖动排序
const labels = () => page.$$eval('.rail-item .rail-label', (els) => els.map((e) => e.textContent));
const beforeOrder = await labels();
await page
  .locator('.rail-item', { hasText: '职业概述' })
  .dragTo(page.locator('.rail-item', { hasText: '工作经历' }));
await page.waitForTimeout(300);
const afterOrder = await labels();
results.dragReorder = JSON.stringify(beforeOrder) !== JSON.stringify(afterOrder) ? afterOrder : false;

// 9. 年月面板：按面板当前年份选六月，不依赖具体数据
await page.locator('.mp-trigger').first().click();
await page.waitForSelector('.mp');
const panelYear = (await page.locator('.mp-title').textContent())?.replace('年', '').trim() ?? '';
await page.getByRole('button', { name: '六月' }).click();
const expected = `${panelYear}-06`;
await page.waitForFunction(
  (want) => Array.from(document.querySelectorAll('.mp-trigger')).some((el) => el.textContent?.includes(want)),
  expected,
  { timeout: 5000 },
);
results.monthPicker = expected;

// 9. 时间留空 = 至今（工作/项目），教育不追加至今
await page.locator('.rail-item', { hasText: '工作经历' }).click();
await page.waitForFunction(() => document.querySelector('.form-head h2')?.textContent === '工作经历');
const endTrigger = page.locator('.mp-trigger').nth(1);
// 先归零，确保处于「至今」状态
await endTrigger.click();
await page.getByRole('button', { name: '清除', exact: true }).click();
await page.waitForTimeout(150);
await endTrigger.click();
const endYear = (await page.locator('.mp-title').textContent())?.replace('年', '').trim() ?? '';
await page.getByRole('button', { name: '六月' }).click();
await page.waitForFunction(
  (want) => document.querySelector('.preview .rs')?.textContent?.includes(want),
  `${endYear}-06`,
  { timeout: 5000 },
);
await endTrigger.click();
await page.getByRole('button', { name: '清除', exact: true }).click();
await page.waitForFunction(
  () => document.querySelector('.preview .rs')?.textContent?.includes('至今'),
  null,
  { timeout: 5000 },
);
results.openEnded = true;

// 10. 基本信息字段显隐
await page.locator('.rail-item', { hasText: '基本信息' }).click();
await page.waitForSelector('.field-row');
const emailRow = page.locator('.field-row', {
  has: page.locator('input[placeholder="you@example.com"]'),
});
await emailRow.locator('button[title*="隐藏"]').click();
await page.waitForFunction(
  () => !document.querySelector('.preview .rs-meta')?.textContent?.includes('@example.com'),
  null,
  { timeout: 5000 },
);
await emailRow.locator('button[title*="显示"]').click();
await page.waitForFunction(
  () => document.querySelector('.preview .rs-meta')?.textContent?.includes('@example.com'),
  null,
  { timeout: 5000 },
);
results.fieldToggle = true;

// 11. 重置为空简历，刷新后仍是空白
await page.locator('.tb-btn', { hasText: '重置' }).click();
await page.waitForFunction(
  () => document.querySelector('.preview .rs-name')?.textContent === '高望舒',
  null,
  { timeout: 5000 },
);
await page.waitForTimeout(700);
await page.reload({ waitUntil: 'load' });
await page.waitForSelector('.rs-name');
results.reset = (await page.locator('.preview .rs-name').textContent()) === '高望舒';

// 12. 控制台错误
results.pageErrors = errors;
await ctx.close();
await browser.close();

console.log(JSON.stringify(results, null, 2));
const fail = [];
if (!results.previewSync) fail.push('预览未同步');
if (!results.toggleHide) fail.push('模块开关无效');
if (!results.persisted) fail.push('刷新后数据丢失');
if (!results.jsonImport) fail.push('JSON 导入未覆盖');
if (!results.jsonExport.name) fail.push('JSON 导出内容为空');
if (!results.addSection) fail.push('添加模块失败');
if (!results.dateStyle) fail.push('时间位置切换失败');
if (!results.fullscreen) fail.push('全屏编辑器异常');
if (!results.collapse) fail.push('侧栏收起异常');
if (!results.monthPicker || !/^\d{4}-06$/.test(String(results.monthPicker))) fail.push('年月选择器异常');
if (!results.openEnded) fail.push('「留空即至今」逻辑异常');
if (!results.dragReorder) fail.push('拖动排序无效');
if (!results.fieldToggle) fail.push('基本信息字段显隐异常');
if (!results.reset) fail.push('重置后刷新未保持空白');
if (errors.length) fail.push(`页面报错: ${errors.join(' | ')}`);
if (fail.length) {
  console.error('FAIL:', fail.join('; '));
  process.exit(1);
}
console.log('OK');
