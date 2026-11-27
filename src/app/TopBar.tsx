import { useEffect, useRef, useState } from 'react';
import {
  Braces,
  Check,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Palette,
  Printer,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Type,
  Upload,
} from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { useSaveStore, saveNow, forkImported } from '@/store/persistence';
import { toast } from '@/components/Toast';
import { Popover } from '@/components/Popover';
import { templates } from '@/templates/registry';
import { exportJson, exportPdf, exportPng, importJsonFile, checkServer } from '@/export';
import { exportNode } from '@/export/node';

const SWATCHES = ['#2563eb', '#0f766e', '#7c3aed', '#b45309', '#be123c', '#334155', '#0d9488', '#1f2937'];

function timeAgo(ts: number | null): string {
  if (!ts) return '尚未保存';
  const diff = Date.now() - ts;
  if (diff < 15_000) return '刚刚保存';
  if (diff < 60_000) return `${Math.floor(diff / 1000)} 秒前保存`;
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前保存`;
  return `${Math.floor(diff / 3600_000)} 小时前保存`;
}

export function TopBar() {
  const resume = useResumeStore((s) => s.resume);
  const patchTheme = useResumeStore((s) => s.patchTheme);
  const setTemplate = useResumeStore((s) => s.setTemplate);
  const resetAll = useResumeStore((s) => s.resetAll);
  const savedAt = useSaveStore((s) => s.savedAt);
  const saving = useSaveStore((s) => s.saving);
  const [, tick] = useState(0);
  const [busy, setBusy] = useState<null | 'pdf' | 'png' | 'json'>(null);
  const [serverUp, setServerUp] = useState<boolean | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const theme = resume.theme;

  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 20_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    void checkServer(true).then((s) => setServerUp(s === 'up'));
  }, []);

  const requireNode = () => {
    const node = exportNode.current;
    if (!node) throw new Error('渲染节点还没准备好，请稍后再试');
    return node;
  };

  const doExport = async (kind: 'pdf' | 'png' | 'json') => {
    if (busy) return;
    setBusy(kind);
    try {
      if (kind === 'json') {
        const r = exportJson(resume);
        toast(`已下载 ${r.filename}`, 'ok');
      } else if (kind === 'png') {
        const r = await exportPng(resume, requireNode(), 2);
        toast(r.pages > 1 ? `已下载 ${r.pages} 页 PNG（zip）` : `已下载 ${r.filename}`, 'ok');
      } else {
        const r = await exportPdf(resume, requireNode(), 'auto');
        if (r.kind === 'vector') {
          toast('已下载矢量 PDF（文字可选中）', 'ok');
        } else {
          toast('已下载 PDF（位图）。想要可选中文字，启动本地导出服务后重试', 'ok');
        }
      }
    } catch (err) {
      console.error(err);
      toast(err instanceof Error ? err.message : '导出失败', 'err');
    } finally {
      setBusy(null);
    }
  };

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">简</span>
        简历生成器
      </div>

      <Popover label={<><SlidersHorizontal size={15} /> 模板</>} align="left">
        {() => (
          <div>
            <div className="pop-title">选择模板</div>
            {templates.map((t) => (
              <button
                type="button"
                key={t.id}
                className="menu-item"
                onClick={() => {
                  setTemplate(t.id);
                  toast(`已切换到「${t.name}」`);
                }}
              >
                <FileText size={15} />
                <span>
                  {t.name}
                  <span style={{ display: 'block', fontSize: 11, color: '#9ca3af' }}>{t.hint}</span>
                </span>
                {resume.meta.templateId === t.id && <Check size={14} style={{ marginLeft: 'auto', color: '#2563eb' }} />}
              </button>
            ))}
            <div className="menu-sep" />
            <div className="pop-title">条目时间位置</div>
            <div className="seg">
              <button
                type="button"
                className={theme.dateStyle === 'left' ? 'on' : ''}
                onClick={() => patchTheme({ dateStyle: 'left' })}
              >
                左侧
              </button>
              <button
                type="button"
                className={theme.dateStyle === 'right' ? 'on' : ''}
                onClick={() => patchTheme({ dateStyle: 'right' })}
              >
                最右侧
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.6, marginTop: 10 }}>
              更多模板在 M4 加入，切换后内容不变。
            </div>
          </div>
        )}
      </Popover>

      <Popover label={<><Palette size={15} /> 配色</>} align="left">
        <div>
          <div className="pop-title">主题色</div>
          <div className="swatches">
            {SWATCHES.map((c) => (
              <button
                type="button"
                key={c}
                className={`swatch ${theme.accent.toLowerCase() === c ? 'on' : ''}`}
                style={{ background: c }}
                title={c}
                onClick={() => patchTheme({ accent: c })}
              />
            ))}
          </div>
          <div className="slider-row" style={{ marginTop: 12, marginBottom: 0 }}>
            <span>自定义</span>
            <input
              type="color"
              value={theme.accent}
              onChange={(e) => patchTheme({ accent: e.target.value })}
              style={{ width: 34, height: 26, border: 'none', background: 'none', padding: 0 }}
            />
            <span className="val" style={{ width: 'auto' }}>{theme.accent}</span>
          </div>
        </div>
      </Popover>

      <Popover label={<><Type size={15} /> 文字</>} align="left">
        <div>
          <div className="pop-title">字体</div>
          <div className="seg">
            <button type="button" className={theme.fontFamily === 'sans' ? 'on' : ''} onClick={() => patchTheme({ fontFamily: 'sans' })}>
              黑体
            </button>
            <button type="button" className={theme.fontFamily === 'serif' ? 'on' : ''} onClick={() => patchTheme({ fontFamily: 'serif' })}>
              宋体
            </button>
          </div>
          <div className="pop-title" style={{ marginTop: 12 }}>字号</div>
          <div className="slider-row">
            <input
              type="range"
              min={0.85}
              max={1.15}
              step={0.01}
              value={theme.fontScale}
              onChange={(e) => patchTheme({ fontScale: Number(e.target.value) })}
            />
            <span className="val">{Math.round(theme.fontScale * 100)}%</span>
          </div>
          <div className="pop-title">行距</div>
          <div className="slider-row" style={{ marginBottom: 0 }}>
            <input
              type="range"
              min={1.3}
              max={1.9}
              step={0.01}
              value={theme.lineHeight}
              onChange={(e) => patchTheme({ lineHeight: Number(e.target.value) })}
            />
            <span className="val">{theme.lineHeight.toFixed(2)}</span>
          </div>
        </div>
      </Popover>

      <Popover label={<><SlidersHorizontal size={15} /> 间距</>} align="left">
        <div>
          <div className="pop-title">模块间距</div>
          <div className="slider-row">
            <input
              type="range"
              min={8}
              max={32}
              step={1}
              value={theme.sectionGap}
              onChange={(e) => patchTheme({ sectionGap: Number(e.target.value) })}
            />
            <span className="val">{theme.sectionGap}px</span>
          </div>
          <div className="pop-title">页边距</div>
          <div className="slider-row">
            <input
              type="range"
              min={8}
              max={22}
              step={1}
              value={theme.margin}
              onChange={(e) => patchTheme({ margin: Number(e.target.value) })}
            />
            <span className="val">{theme.margin}mm</span>
          </div>
          <label className="check" style={{ marginTop: 4 }}>
            <input
              type="checkbox"
              checked={theme.showPhoto}
              onChange={(e) => patchTheme({ showPhoto: e.target.checked })}
            />
            显示照片
          </label>
        </div>
      </Popover>

      <div className="topbar-spacer" />

      <span className="save-state">{saving ? '保存中…' : timeAgo(savedAt)}</span>
      <button
        type="button"
        className="tb-btn subtle"
        title="清空当前简历的所有内容"
        onClick={() => {
          const ok = window.confirm(
            '重置会清空当前简历的所有内容（模板、配色保留，且不可撤销）。\n建议先导出 JSON 备份。\n\n确定继续？',
          );
          if (!ok) return;
          resetAll();
          saveNow();
          toast('已重置，可以重新填写了', 'ok');
        }}
      >
        <RotateCcw size={15} /> 重置
      </button>
      <button
        type="button"
        className="tb-btn"
        onClick={() => {
          saveNow();
          toast('已保存到本机', 'ok');
        }}
      >
        <Save size={15} /> 保存
      </button>

      <Popover
        className="tb-btn primary"
        label={<><Download size={15} /> {busy ? '导出中…' : '导出'}</>}
      >
        {(close) => (
          <div>
            <div className="pop-title">
              导出
              <span style={{ float: 'right', color: serverUp ? '#059669' : '#9ca3af' }}>
                {serverUp ? '● 矢量可用' : '○ 静态模式'}
              </span>
            </div>
            <button type="button" className="menu-item" onClick={() => { close(); void doExport('pdf'); }}>
              {busy === 'pdf' ? <Loader2 size={15} className="spin" /> : <FileText size={15} />}
              PDF
              <span className="hint">{serverUp ? '矢量 · 文字可选中' : '位图 · 一键下载'}</span>
            </button>
            <button type="button" className="menu-item" onClick={() => { close(); void doExport('png'); }}>
              {busy === 'png' ? <Loader2 size={15} /> : <ImageIcon size={15} />}
              PNG 图片
              <span className="hint">2 倍清晰度</span>
            </button>
            <button type="button" className="menu-item" onClick={() => { close(); void doExport('json'); }}>
              <Braces size={15} />
              JSON 数据
              <span className="hint">备份 / 迁移</span>
            </button>
            <div className="menu-sep" />
            <button type="button" className="menu-item" onClick={() => { close(); window.print(); }}>
              <Printer size={15} />
              打印 / 另存为 PDF
              <span className="hint">矢量</span>
            </button>
            <button type="button" className="menu-item" onClick={() => { close(); importRef.current?.click(); }}>
              <Upload size={15} />
              导入 JSON
            </button>
            {!serverUp && (
              <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.6, marginTop: 6 }}>
                启动本地服务（npm run dev）后，PDF 会自动升级为矢量、文字可选中。
              </div>
            )}
          </div>
        )}
      </Popover>

      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          try {
            const imported = await importJsonFile(file);
            if (!window.confirm('导入会替换当前简历，建议先导出一份 JSON 备份。继续？')) return;
            forkImported(imported);
            toast('导入成功', 'ok');
          } catch (err) {
            toast(err instanceof Error ? err.message : '导入失败', 'err');
          }
        }}
      />
    </header>
  );
}
