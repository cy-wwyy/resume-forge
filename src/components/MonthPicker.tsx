import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
const PANEL_W = 296;

function useNow() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/**
 * 年月选择器。
 * 不用原生 input[type=month]：各浏览器弹层不一致、桌面端还要点小箭头。
 * 这里做成截图里那种「年份 + 三列月份」面板，支持点年份切换年份网格。
 * 面板挂到 body（portal），避免被卡片的 overflow:hidden 裁掉。
 */
export function MonthPicker({
  value,
  onChange,
  placeholder = 'YYYY-MM',
  disabled,
  defaultYear,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** 还没有值时，面板默认落在哪一年（例如结束时间对齐开始年份） */
  defaultYear?: number;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'month' | 'year'>('month');
  const now = useNow();
  const fallbackYear = defaultYear ?? now.year;
  const [viewYear, setViewYear] = useState(() => (value ? Number(value.slice(0, 4)) : fallbackYear));
  const [anchor, setAnchor] = useState<{ top: number; left: number; bottom: number } | null>(null);
  const [top, setTop] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = () => setOpen(false);

  const openPanel = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    setAnchor({ top: r.top, bottom: r.bottom + 6, left: r.left });
    setViewYear(value ? Number(value.slice(0, 4)) : fallbackYear);
    setMode('month');
    setOpen(true);
  };

  // 首次渲染后按实际高度决定向下还是向上弹
  useLayoutEffect(() => {
    if (!open || !anchor || !panelRef.current) return;
    const h = panelRef.current.offsetHeight;
    const below = anchor.bottom + h <= window.innerHeight - 8;
    setTop(below ? anchor.bottom : Math.max(8, anchor.top - h - 6));
  }, [open, anchor, mode]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    // 表单滚动时直接收起，避免面板和输入框脱节
    const onScroll = () => close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  const selectedYear = value ? Number(value.slice(0, 4)) : -1;
  const selectedMonth = value ? Number(value.slice(5, 7)) : -1;
  const pageStart = Math.floor(viewYear / 12) * 12;
  const years = Array.from({ length: 12 }, (_, i) => pageStart + i);

  const panel = open && anchor
    ? createPortal(
        <div
          className="mp"
          ref={panelRef}
          style={{
            top,
            left: Math.max(8, Math.min(anchor.left, window.innerWidth - PANEL_W - 8)),
            width: PANEL_W,
          }}
          role="dialog"
          aria-label="选择年月"
        >
          <div className="mp-head">
            <button
              type="button"
              className="mp-nav"
              aria-label={mode === 'month' ? '上一年' : '上一页'}
              onClick={() => setViewYear((y) => y - (mode === 'month' ? 1 : 12))}
            >
              <ChevronLeft size={16} />
            </button>
            <button type="button" className="mp-title" onClick={() => setMode(mode === 'month' ? 'year' : 'month')}>
              {mode === 'month' ? `${viewYear}年` : `${pageStart} - ${pageStart + 11}`}
            </button>
            <button
              type="button"
              className="mp-nav"
              aria-label={mode === 'month' ? '下一年' : '下一页'}
              onClick={() => setViewYear((y) => y + (mode === 'month' ? 1 : 12))}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {mode === 'month' ? (
            <div className="mp-grid">
              {MONTHS.map((label, i) => {
                const m = i + 1;
                const on = selectedYear === viewYear && selectedMonth === m;
                const isNow = now.year === viewYear && now.month === m;
                return (
                  <button
                    type="button"
                    key={label}
                    className={`mp-cell ${on ? 'on' : ''}`}
                    onClick={() => {
                      onChange(`${viewYear}-${String(m).padStart(2, '0')}`);
                      close();
                    }}
                  >
                    {label}
                    {isNow && <i className="mp-dot" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mp-grid years">
              {years.map((y) => (
                <button
                  type="button"
                  key={y}
                  className={`mp-cell ${selectedYear === y ? 'on' : ''}`}
                  onClick={() => {
                    setViewYear(y);
                    setMode('month');
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          <div className="mp-foot">
            <button
              type="button"
              onClick={() => {
                onChange('');
                close();
              }}
            >
              清除
            </button>
            <button
              type="button"
              onClick={() => {
                setViewYear(now.year);
                setMode('month');
              }}
            >
              回到本月
            </button>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`input mp-trigger ${open ? 'open' : ''}`}
        disabled={disabled}
        onClick={() => (open ? close() : openPanel())}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={value ? 'mp-value' : 'mp-placeholder'}>{value || placeholder}</span>
        <Calendar size={14} className="mp-icon" />
      </button>
      {panel}
    </>
  );
}
