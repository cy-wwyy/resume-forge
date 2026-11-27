import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  Maximize2,
  Minimize2,
  ListOrdered,
  Redo2,
  RemoveFormatting,
  Underline,
  Undo2,
} from 'lucide-react';

type Cmd = 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList' | 'justifyLeft' | 'justifyCenter' | 'justifyRight' | 'removeFormat' | 'undo' | 'redo';

const TOOLS: { cmd: Cmd; icon: typeof Bold; title: string }[] = [
  { cmd: 'undo', icon: Undo2, title: '撤销' },
  { cmd: 'redo', icon: Redo2, title: '重做' },
  { cmd: 'bold', icon: Bold, title: '加粗' },
  { cmd: 'italic', icon: Italic, title: '斜体' },
  { cmd: 'underline', icon: Underline, title: '下划线' },
  { cmd: 'insertUnorderedList', icon: List, title: '无序列表' },
  { cmd: 'insertOrderedList', icon: ListOrdered, title: '有序列表' },
  { cmd: 'justifyLeft', icon: AlignLeft, title: '左对齐' },
  { cmd: 'justifyCenter', icon: AlignCenter, title: '居中' },
  { cmd: 'justifyRight', icon: AlignRight, title: '右对齐' },
  { cmd: 'removeFormat', icon: RemoveFormatting, title: '清除格式' },
];

/**
 * 极简富文本。用 contentEditable + execCommand，不引 Tiptap：
 * 这里的排版需求只有加粗/斜体/下划线/列表/对齐，够用且零依赖。
 * 粘贴一律降级为纯文本，避免把 Word 的脏样式带进来。
 */
export function RichText({
  value,
  onChange,
  placeholder = '写点什么…',
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const cbRef = useRef(onChange);
  cbRef.current = onChange;
  const [, forceTick] = useState(0);
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value;
    // 只在挂载时灌入；后续由用户输入驱动
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 外部值变化（例如换了一份简历）且编辑器没聚焦时同步
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  const emit = useCallback(() => {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (ref.current) cbRef.current(ref.current.innerHTML);
    }, 250);
  }, []);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFull(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [full]);

  const exec = (cmd: Cmd) => {
    ref.current?.focus();
    document.execCommand(cmd, false);
    emit();
    forceTick((n) => n + 1);
  };

  const isActive = (cmd: Cmd): boolean => {
    try {
      return document.queryCommandState(cmd);
    } catch {
      return false;
    }
  };

  return (
    <>
      {full && <div className="rt-backdrop" onMouseDown={() => setFull(false)} />}
      <div className={`rt ${full ? 'rt-full' : ''}`}>
      <div className="rt-toolbar" onMouseDown={(e) => e.preventDefault()}>
        {TOOLS.map(({ cmd, icon: Icon, title }, i) => (
          <span key={cmd} style={{ display: 'contents' }}>
            {(i === 2 || i === 5 || i === 7) && <span className="rt-sep" />}
            <button
              type="button"
              className={`rt-tool ${isActive(cmd) ? 'on' : ''}`}
              title={title}
              onMouseDown={(e) => {
                e.preventDefault();
                exec(cmd);
              }}
            >
              <Icon size={15} strokeWidth={2} />
            </button>
          </span>
        ))}
        <span className="rt-sep" />
        <button
          type="button"
          className="rt-tool text"
          title={full ? '退出全屏（Esc）' : '全屏编辑'}
          onClick={() => setFull((v) => !v)}
        >
          {full ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {full ? '退出全屏' : '全屏'}
        </button>
      </div>
      <div
        ref={ref}
        className="rt-editor"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={() => {
          if (timer.current !== undefined) window.clearTimeout(timer.current);
          if (ref.current) cbRef.current(ref.current.innerHTML);
        }}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
          emit();
        }}
        onKeyUp={() => forceTick((n) => n + 1)}
        onMouseUp={() => forceTick((n) => n + 1)}
      />
      </div>
    </>
  );
}
