import type { Resume } from '@shared/schema/types';
import { toStandaloneResume } from '@shared/schema/standalone';
import { downloadBlob, fileBase } from './download';

/**
 * 导出一个自包含的 HTML：布局/字段/主题固化，内容清空。
 * 双击用浏览器打开就能填写，数据存 localStorage，导出走打印。
 */
export async function exportStandaloneHtml(resume: Resume): Promise<string> {
  const url = `${import.meta.env.BASE_URL}standalone.html`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('找不到离线模板文件（standalone.html），请先构建');
  const html = await res.text();
  const payload = JSON.stringify(toStandaloneResume(resume)).replace(/</g, '\\u003c');
  const filled = html.replace('__RESUME_TEMPLATE__', payload);
  const filename = `${fileBase(resume)}-填写模板.html`;
  downloadBlob(new Blob([filled], { type: 'text/html;charset=utf-8' }), filename);
  return filename;
}
