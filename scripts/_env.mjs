/** 统一加载 .env，确保相对路径与浏览器依赖在 npm script 里也生效。 */
import path from 'node:path';
try {
  process.loadEnvFile(path.resolve('.env'));
} catch {
  // .env 可选
}
const { chromium } = await import('playwright-core');
export { chromium };
