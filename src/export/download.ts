import type { Resume } from '@shared/schema/types';

export function fileBase(resume: Resume): string {
  const name = resume.basics.name?.trim() || '我的简历';
  const pos = (resume.intent.position || '').trim();
  const raw = pos ? `${name}-${pos}-简历` : `${name}-简历`;
  return raw.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 80);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 给浏览器一点时间开始下载再回收
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadText(text: string, filename: string, type = 'application/json') {
  downloadBlob(new Blob([text], { type: `${type};charset=utf-8` }), filename);
}
