import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { getTemplate } from '@/templates/registry';

const PAGE_W = 794;
const PAGE_H = 1123;

export function PreviewPane() {
  const resume = useResumeStore((s) => s.resume);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [docH, setDocH] = useState(PAGE_H);
  const [containerW, setContainerW] = useState(900);
  const [zoom, setZoom] = useState<number | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerW(el.clientWidth));
    ro.observe(el);
    setContainerW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDocH(el.offsetHeight));
    ro.observe(el);
    setDocH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // 留出左右各 24px 的呼吸位；缩放以左上角为原点，父容器再按缩放后尺寸撑开，
  // 这样不会出现「左侧空一大块 + 右侧溢出出横向滚动条」。
  const rawScale = Math.min(1.1, Math.max(0.35, (containerW - 50) / PAGE_W));
  // 向下取整到 0.1%，避免分数宽度在 Windows 经典滚动条下撑出 1px 溢出
  const fitScale = Math.floor(rawScale * 1000) / 1000;
  const scale = zoom ?? fitScale;
  const pages = Math.max(1, Math.ceil(docH / PAGE_H));
  const Template = getTemplate(resume.meta.templateId).Document;

  return (
    <section className="preview">
      <div className={`preview-scroll ${zoom !== null ? 'is-zoomed' : ''}`} ref={scrollRef}>
        <div style={{ width: PAGE_W * scale, height: Math.max(docH, PAGE_H) * scale }}>
          <div
            className="preview-inner"
            style={{
              width: PAGE_W,
              height: docH,
              transform: `scale(${scale})`,
            }}
          >
            <div
              className="sheet"
              ref={sheetRef}
              style={{ ['--page-pad' as string]: `${resume.theme.margin}mm` }}
            >
              <Template resume={resume} />
            </div>
            {Array.from({ length: pages - 1 }, (_, i) => (
              <div className="page-guide" key={i} style={{ top: (i + 1) * PAGE_H }} />
            ))}
          </div>
        </div>
      </div>

      <div className="zoom-bar">
        <button
          type="button"
          className="zoom-btn"
          onClick={() => setZoom(Math.max(0.35, Number((scale - 0.1).toFixed(2))))}
          title="缩小"
        >
          <Minus size={14} />
        </button>
        <span className="zoom-value">
          {Math.round(scale * 100)}% · {pages} 页
        </span>
        <button
          type="button"
          className="zoom-btn"
          onClick={() => setZoom(Math.min(1.4, Number((scale + 0.1).toFixed(2))))}
          title="放大"
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          className="zoom-btn"
          onClick={() => setZoom(null)}
          title="适应窗口"
        >
          <Maximize2 size={13} />
        </button>
      </div>
    </section>
  );
}
