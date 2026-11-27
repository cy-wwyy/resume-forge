import { ChevronDown, ChevronUp, Eye, EyeOff, Trash2 } from 'lucide-react';
import { isStandalone } from '@/standalone/flag';
import { useResumeStore } from '@/store/resumeStore';
import { BasicsForm, IntentForm, SectionForm } from '@/editor/forms';

export function FormPane() {
  const resume = useResumeStore((s) => s.resume);
  const activeId = useResumeStore((s) => s.activeId);

  const section = resume.sections.find((s) => s.id === activeId);
  const sectionIndex = section ? resume.sections.findIndex((s) => s.id === section.id) : -1;
  const moveSection = useResumeStore((s) => s.moveSection);
  const removeSection = useResumeStore((s) => s.removeSection);
  const toggleSection = useResumeStore((s) => s.toggleSection);
  const standalone = isStandalone();
  const isBasics = activeId === 'basics';
  const isIntent = activeId === 'intent';

  const title = isBasics ? '基本信息' : isIntent ? '求职意向' : section?.title ?? '基本信息';
  const tag = isBasics ? '必填' : isIntent ? '建议填写' : '可选模块';

  return (
    <main className="form-pane">
      <div className="form-head">
        <h2>{title}</h2>
        <span className="tag">{tag}</span>
        <span className="spacer" />
        {section && !standalone && (
          <span className="form-head-actions">
            <button
              type="button"
              className="icon-btn"
              title={section.visible ? '在简历上隐藏该模块' : '在简历上显示该模块'}
              onClick={() => toggleSection(section.id)}
            >
              {section.visible ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            <button
              type="button"
              className="icon-btn"
              title="上移模块"
              disabled={sectionIndex <= 0}
              onClick={() => moveSection(section.id, -1)}
            >
              <ChevronUp size={15} />
            </button>
            <button
              type="button"
              className="icon-btn"
              title="下移模块"
              disabled={sectionIndex >= resume.sections.length - 1}
              onClick={() => moveSection(section.id, 1)}
            >
              <ChevronDown size={15} />
            </button>
            <button
              type="button"
              className="icon-btn danger"
              title="删除模块"
              onClick={() => {
                if (window.confirm(`删除「${section.title}」模块及其内容？`)) removeSection(section.id);
              }}
            >
              <Trash2 size={15} />
            </button>
          </span>
        )}
      </div>

      {isBasics && <BasicsForm resume={resume} />}
      {isIntent && <IntentForm resume={resume} />}
      {!isBasics && !isIntent && section && <SectionForm key={section.id} section={section} />}
      {!isBasics && !isIntent && !section && (
        <div className="card">
          <div className="card-body" style={{ color: '#9ca3af', fontSize: 13 }}>
            在左侧选择或添加一个模块。
          </div>
        </div>
      )}
    </main>
  );
}
