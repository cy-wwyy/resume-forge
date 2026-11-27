import type { Resume } from '@shared/schema/types';

export type ServerStatus = 'unknown' | 'up' | 'down';

let cached: ServerStatus = 'unknown';

export async function checkServer(force = false): Promise<ServerStatus> {
  if (!force && cached !== 'unknown') return cached;
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 1500);
    const res = await fetch('/api/health', { signal: controller.signal });
    window.clearTimeout(timer);
    const ok = res.ok && (await res.json().catch(() => null))?.ok === true;
    cached = ok ? 'up' : 'down';
  } catch {
    cached = 'down';
  }
  return cached;
}

export function serverStatus(): ServerStatus {
  return cached;
}

export interface VectorExportOptions {
  scale?: number;
}

/**
 * 矢量 PDF：由本地导出服务用无头 Chromium 生成。
 * 与预览同一套 DOM，所以不会出现「预览和导出不一致」。
 */
export async function renderVectorPdf(resume: Resume, filename: string): Promise<Blob> {
  const res = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format: 'pdf', resume, filename }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.message || `导出服务返回 ${res.status}`);
  }
  return res.blob();
}
