import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { zipSync } from 'fflate';

/** A4 @96dpi：210mm × 297mm */
export const PAGE_W = 794;
export const PAGE_H = 1123;

export async function captureSheet(node: HTMLElement, pixelRatio = 2): Promise<HTMLCanvasElement> {
  // 字体没就绪就截图，中文可能回退成别的字体
  await document.fonts.ready;
  // 等两帧，确保最后一次 React 提交已经上屏
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  return toCanvas(node, {
    pixelRatio,
    backgroundColor: '#ffffff',
    cacheBust: true,
    width: node.offsetWidth,
    height: node.offsetHeight,
    // 离屏节点是 position:fixed + left:-20000px，克隆到 foreignObject 后会整体移出画布。
    // 这里把克隆体拉回 0,0，否则导出的就是一张白纸。
    style: { position: 'static', left: '0', top: '0', margin: '0' },
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出图片失败'))), type, quality);
  });
}

function sliceCanvas(source: HTMLCanvasElement, heightPx: number): HTMLCanvasElement[] {
  const count = Math.max(1, Math.ceil(source.height / heightPx));
  const out: HTMLCanvasElement[] = [];
  for (let i = 0; i < count; i += 1) {
    const h = Math.min(heightPx, source.height - i * heightPx);
    if (h <= 0) break;
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = heightPx;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 不可用');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, i * heightPx, source.width, h, 0, 0, source.width, h);
    out.push(canvas);
  }
  return out;
}

export interface PngResult {
  blob: Blob;
  filename: string;
  pages: number;
}

/**
 * 纯前端 PNG：整张纸截图后按 A4 高度切片。
 * 单页直接给 png，多页打 zip。
 */
export async function renderPng(
  node: HTMLElement,
  baseName: string,
  scale: 1 | 2 | 3 = 2,
): Promise<PngResult> {
  const canvas = await captureSheet(node, scale);
  const pageHeightPx = PAGE_H * scale;
  const slices = sliceCanvas(canvas, pageHeightPx);
  if (slices.length <= 1) {
    const blob = await canvasToBlob(slices[0], 'image/png');
    return { blob, filename: `${baseName}.png`, pages: 1 };
  }
  const files: Record<string, Uint8Array> = {};
  for (let i = 0; i < slices.length; i += 1) {
    const blob = await canvasToBlob(slices[i], 'image/png');
    files[`${baseName}-第${i + 1}页.png`] = new Uint8Array(await blob.arrayBuffer());
  }
  const zipped = zipSync(files, { level: 0 });
  return {
    blob: new Blob([zipped as unknown as BlobPart], { type: 'application/zip' }),
    filename: `${baseName}-PNG.zip`,
    pages: slices.length,
  };
}

/**
 * 纯前端位图 PDF：文字不可选中，但胜在零后端。
 * 作为没有导出服务时的兜底，也是静态部署下的默认 PDF。
 */
export async function renderRasterPdf(node: HTMLElement, baseName: string): Promise<{ blob: Blob; pages: number }> {
  const canvas = await captureSheet(node, 2.5);
  const slices = sliceCanvas(canvas, PAGE_H * 2.5);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  slices.forEach((slice, i) => {
    if (i > 0) pdf.addPage('a4', 'portrait');
    const dataUrl = slice.toDataURL('image/jpeg', 0.92);
    pdf.addImage(dataUrl, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  });
  pdf.setProperties({ title: baseName, subject: '简历' });
  return { blob: pdf.output('blob'), pages: slices.length };
}
