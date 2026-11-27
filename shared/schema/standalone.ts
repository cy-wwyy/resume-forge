import type { Resume, Section, Theme } from './types';
import { DEFAULT_THEME, SCHEMA_VERSION } from './types';
import { uid } from './sample';

/**
 * 生成「离线可填写版」的初始数据：布局、模块、字段定义、主题全部保留，
 * 但所有内容清空，交给使用者在本地填。
 */
export function toStandaloneResume(resume: Resume): Resume {
  return {
    id: uid(),
    name: '填写模板',
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    basics: {
      name: '',
      photo: '',
      fields: resume.basics.fields.map((f) => ({
        id: uid(),
        type: f.type,
        label: f.label,
        value: '',
        visible: f.visible,
      })),
    },
    intent: { position: '', city: '', salary: '', availability: '' },
    sections: resume.sections.map(blankSection),
    theme: { ...(resume.theme ?? DEFAULT_THEME) } as Theme,
    meta: { ...resume.meta },
  };
}

function blankSection(section: Section): Section {
  const base = { id: uid(), title: section.title, visible: section.visible };
  switch (section.kind) {
    case 'education':
      return {
        ...base,
        kind: 'education',
        items: [
          {
            id: uid(),
            school: '',
            major: '',
            degree: '',
            start: '',
            end: '',
            gpa: '',
            rank: '',
            tags: [],
            courses: '',
          },
        ],
      };
    case 'work':
      return {
        ...base,
        kind: 'work',
        items: [{ id: uid(), company: '', role: '', start: '', end: '', tags: [], desc: '' }],
      };
    case 'project':
      return {
        ...base,
        kind: 'project',
        items: [{ id: uid(), name: '', role: '', start: '', end: '', tags: [], desc: '' }],
      };
    case 'skill':
      return {
        ...base,
        kind: 'skill',
        items: [
          {
            id: uid(),
            summary: '',
            keywords: '',
            groups: [{ id: uid(), name: '', level: 70, label: '' }],
          },
        ],
      };
    case 'award':
      return {
        ...base,
        kind: 'award',
        items: [{ id: uid(), title: '', date: '', desc: '' }],
      };
    case 'summary':
      return { ...base, kind: 'summary', html: '' };
    case 'custom':
      return {
        ...base,
        kind: 'custom',
        items: [{ id: uid(), title: '', subtitle: '', start: '', end: '', desc: '' }],
      };
  }
}
