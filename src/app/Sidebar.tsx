import { useEffect, useState } from 'react';
import {
  Briefcase,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  LayoutList,
  Plus,
  Sparkles,
  Target,
  Trophy,
  User,
  Wrench,
} from 'lucide-react';
import type { Section, SectionKind } from '@shared/schema/types';
import { SECTION_LABEL } from '@shared/schema/types';
import { useResumeStore } from '@/store/resumeStore';
import { Switch } from '@/components/Popover';
import { isStandalone } from '@/standalone/flag';

const ICONS: Record<SectionKind, typeof User> = {
  education: GraduationCap,
  work: Briefcase,
  project: LayoutList,
  skill: Wrench,
  award: Trophy,
  summary: Sparkles,
  custom: Target,
};

const ADDABLE: SectionKind[] = ['summary', 'skill', 'work', 'project', 'education', 'award', 'custom'];
const COLLAPSE_KEY = 'resume-studio:rail-collapsed';

interface RowProps {
  section: Section;
  collapsed: boolean;
  dragging: boolean;
  dragOver: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

function SectionRow({
  section,
  collapsed,
  dragging,
  dragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: RowProps) {
  const standalone = isStandalone();
  const activeId = useResumeStore((s) => s.activeId);
  const setActive = useResumeStore((s) => s.setActive);
  const toggle = useResumeStore((s) => s.toggleSection);
  const Icon = ICONS[section.kind];
  const active = activeId === section.id;

  return (
    <div
      className={[
        'rail-item',
        active ? 'active' : '',
        dragging ? 'dragging' : '',
        dragOver ? 'drag-over' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      draggable={!standalone}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', section.id);
        onDragStart();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      onClick={() => setActive(section.id)}
      role="button"
      tabIndex={0}
      title={collapsed ? section.title : `${section.title}（可拖动排序）`}
    >
      <Icon size={16} strokeWidth={1.8} />
      <span className="rail-label">{section.title}</span>
      {!standalone && (
        <Switch on={section.visible} onChange={() => toggle(section.id)} label={`显示${section.title}`} />
      )}
    </div>
  );
}

export function Sidebar() {
  const sections = useResumeStore((s) => s.resume.sections);
  const activeId = useResumeStore((s) => s.activeId);
  const setActive = useResumeStore((s) => s.setActive);
  const addSection = useResumeStore((s) => s.addSection);
  const reorderSection = useResumeStore((s) => s.reorderSection);
  const standalone = isStandalone();
  const [adding, setAdding] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* 隐私模式下忽略 */
    }
    if (collapsed) setAdding(false);
  }, [collapsed]);

  return (
    <aside className={`rail ${collapsed ? 'collapsed' : ''}`}>
      <div
        className={`rail-item ${activeId === 'basics' ? 'active' : ''}`}
        role="button"
        tabIndex={0}
        title={collapsed ? '基本信息' : undefined}
        onClick={() => setActive('basics')}
      >
        <User size={16} strokeWidth={1.8} />
        <span className="rail-label">基本信息</span>
        <span className="rail-hint">必填</span>
      </div>
      <div
        className={`rail-item ${activeId === 'intent' ? 'active' : ''}`}
        role="button"
        tabIndex={0}
        title={collapsed ? '求职意向' : undefined}
        onClick={() => setActive('intent')}
      >
        <Target size={16} strokeWidth={1.8} />
        <span className="rail-label">求职意向</span>
      </div>

      <div className="rail-sep" />

      {sections.map((section) => (
        <SectionRow
          key={section.id}
          section={section}
          collapsed={collapsed}
          dragging={dragId === section.id}
          dragOver={Boolean(dragId) && overId === section.id && dragId !== section.id}
          onDragStart={() => setDragId(section.id)}
          onDragOver={() => {
            if (dragId && dragId !== section.id) setOverId(section.id);
          }}
          onDragLeave={() => setOverId((cur) => (cur === section.id ? null : cur))}
          onDrop={() => {
            if (dragId && dragId !== section.id) reorderSection(dragId, section.id);
            setDragId(null);
            setOverId(null);
          }}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
        />
      ))}

      {!standalone && (
        <button type="button" className="rail-add" onClick={() => setAdding((v) => !v)}>
          <Plus size={14} /> <span className="rail-add-text">添加模块</span>
        </button>
      )}
      {!standalone && adding && !collapsed && (
        <div className="rail-menu">
          {ADDABLE.map((kind) => {
            const Icon = ICONS[kind];
            return (
              <button
                type="button"
                key={kind}
                className="rail-menu-item"
                onClick={() => {
                  addSection(kind);
                  setAdding(false);
                }}
              >
                <Icon size={14} strokeWidth={1.8} />
                {kind === 'custom' ? '自定义模块' : SECTION_LABEL[kind]}
              </button>
            );
          })}
        </div>
      )}

      <div className="rail-sep" />
      <div className="rail-note">
        {standalone ? (
          '数据只保存在这台电脑的浏览器里。'
        ) : (
          <>
            数据只存在本机浏览器，
            <br />
            记得导出 JSON 备份。
          </>
        )}
      </div>

      <div className="rail-foot">
        <button
          type="button"
          className="rail-collapse"
          title={collapsed ? '展开侧栏' : '收起侧栏'}
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
          <span>{collapsed ? '' : '收起侧栏'}</span>
        </button>
      </div>
    </aside>
  );
}
