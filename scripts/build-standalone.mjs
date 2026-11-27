#!/usr/bin/env node
/**
 * 把 dist-standalone 的产物内联成单个 HTML，输出到 public/standalone.html。
 * 主应用「导出可填写 HTML」时会把模板 JSON 注入这个文件。
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'dist-standalone';
const SRC = path.join(DIR, 'standalone.html');
const OUT = path.join('public', 'standalone.html');

let html = fs.readFileSync(SRC, 'utf8');

const scriptTag = html.match(/<script[^>]*\ssrc="([^"]+)"[^>]*><\/script>/);
if (!scriptTag) throw new Error('找不到入口 script');
const js = fs.readFileSync(path.join(DIR, scriptTag[1].replace(/^\.?\//, '')), 'utf8');
html = html.replace(scriptTag[0], () => `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`);

const linkTag = html.match(/<link[^>]*rel="stylesheet"[^>]*>/);
if (linkTag) {
  const href = linkTag[0].match(/href="([^"]+)"/)?.[1] ?? '';
  const css = fs.readFileSync(path.join(DIR, href.replace(/^\.?\//, '')), 'utf8');
  html = html.replace(linkTag[0], () => `<style>${css}</style>`);
}

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`✓ ${OUT}  ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
