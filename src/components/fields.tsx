import { useState, type ReactNode } from 'react';
import { MonthPicker } from './MonthPicker';

export function Field({
  label,
  required,
  hint,
  children,
  className = '',
}: {
  label?: ReactNode;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`field ${className}`}>
      {label && (
        <label>
          {label}
          {required && <span className="req">*</span>}
          {hint && <span style={{ color: '#9ca3af', fontSize: 11 }}>{hint}</span>}
        </label>
      )}
      {children}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <input
      className="input"
      type={type}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      className="textarea"
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function MonthRange({
  start,
  end,
  onChange,
  endPlaceholder = '至今',
}: {
  start: string;
  end: string;
  onChange: (patch: { start?: string; end?: string }) => void;
  endPlaceholder?: string;
}) {
  return (
    <div className="range-row">
      <MonthPicker value={start} onChange={(v) => onChange({ start: v })} />
      <span className="sep">-</span>
      {/* 结束时间留空即「至今」，不再单独放一个勾选框 */}
      <MonthPicker
        value={end}
        onChange={(v) => onChange({ end: v })}
        placeholder={endPlaceholder}
        defaultYear={start ? Number(start.slice(0, 4)) : undefined}
      />
    </div>
  );
}

export function TagInput({
  value,
  onChange,
  presets = [],
  placeholder = '自定义标签',
}: {
  value: string[];
  onChange: (v: string[]) => void;
  presets?: string[];
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const all = Array.from(new Set([...presets, ...value]));

  const toggle = (tag: string) => {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]);
  };

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setDraft('');
  };

  return (
    <div>
      <div className="chip-list">
        {all.map((tag) => (
          <button
            type="button"
            key={tag}
            className={`chip ${value.includes(tag) ? 'on' : ''}`}
            onClick={() => toggle(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="chip-input">
        <input
          className="input"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="chip ghost" onClick={add}>
          + 添加
        </button>
      </div>
    </div>
  );
}
