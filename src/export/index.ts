import type { Resume } from '@shared/schema/types';
import { SCHEMA_VERSION } from '@shared/schema/types';
import { parseExportFile, type ExportFile } from '@shared/schema/normalize';
import { downloadBlob, downloadText, fileBase } from './download';

export interface ExportResult {
  kind: 'vector' | 'raster' | 'png' | 'json';
  pages: number;
  filename: string;
}

export function exportJson(resume: Resume): ExportResult {
  const payload: ExportFile = {
    app: 'resume-forge',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    resume,
  };
  const filename = `${fileBase(resume)}.json`;
  downloadText(JSON.stringify(payload, null, 2), filename);
  return { kind: 'json', pages: 1, filename };
}

export async function exportPng(
  resume: Resume,
  node: HTMLElement,
  scale: 1 | 2 | 3 = 2,
): Promise<ExportResult> {
  const { renderPng } = await import('./raster');
  const result = await renderPng(node, fileBase(resume), scale);
  downloadBlob(result.blob, result.filename);
  return { kind: 'png', pages: result.pages, filename: result.filename };
}

/**
 * 自动模式：导出服务在 → 矢量 PDF；不在 → 位图 PDF。
 * 两条路都保证一键下载，不弹打印对话框。
 */
export async function exportPdf(
  resume: Resume,
  node: HTMLElement,
  mode: 'auto' | 'vector' | 'raster' = 'auto',
): Promise<ExportResult> {
  const base = fileBase(resume);
  const [{ checkServer, renderVectorPdf }, { renderRasterPdf }] = await Promise.all([
    import('./vector'),
    import('./raster'),
  ]);
  const status = mode === 'vector' ? await checkServer(true) : mode === 'auto' ? await checkServer() : 'down';

  if (mode !== 'raster' && status === 'up') {
    try {
      const blob = await renderVectorPdf(resume, `${base}.pdf`);
      downloadBlob(blob, `${base}.pdf`);
      return { kind: 'vector', pages: 0, filename: `${base}.pdf` };
    } catch (err) {
      if (mode === 'vector') throw err;
      console.warn('[export] 矢量导出失败，回退位图', err);
    }
  }
  if (mode === 'vector') {
    throw new Error('导出服务未启动：请用 npm run dev 启动，或改用「位图 PDF」');
  }
  const result = await renderRasterPdf(node, base);
  downloadBlob(result.blob, `${base}.pdf`);
  return { kind: 'raster', pages: result.pages, filename: `${base}.pdf` };
}

export async function importJsonFile(file: File): Promise<Resume> {
  const text = await file.text();
  return parseExportFile(text);
}

export async function checkServer(force = false) {
  const mod = await import('./vector');
  return mod.checkServer(force);
}
