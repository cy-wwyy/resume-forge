import type { Resume, Section, Theme } from './types';
import { DEFAULT_THEME, SCHEMA_VERSION } from './types';
import { createSampleResume, uid } from './sample';
import { isBasicFieldType } from './fieldTypes';
import type { BasicsField } from './types';

type Json = Record<string, unknown>;

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : fallback;

const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 技能概述历史数据是纯文本，转成富文本段落，避免行与行黏在一起 */
const plainToRich = (value: string): string => {
  if (!value) return '';
  if (/<[a-z][\s\S]*>/i.test(value)) return value;
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
};

function normalizeTheme(raw: unknown, forceRightDefault = false): Theme {
  const t = (raw ?? {}) as Json;
  const titleStyle = str(t.titleStyle, DEFAULT_THEME.titleStyle);
  const fontFamily = str(t.fontFamily, DEFAULT_THEME.fontFamily);
  const dateStyle = forceRightDefault ? 'right' : str(t.dateStyle, DEFAULT_THEME.dateStyle);
  return {
    accent: str(t.accent, DEFAULT_THEME.accent),
    fontFamily: fontFamily === 'serif' ? 'serif' : 'sans',
    fontScale: Math.min(1.15, Math.max(0.85, num(t.fontScale, DEFAULT_THEME.fontScale))),
    lineHeight: Math.min(1.9, Math.max(1.3, num(t.lineHeight, DEFAULT_THEME.lineHeight))),
    sectionGap: Math.min(32, Math.max(8, num(t.sectionGap, DEFAULT_THEME.sectionGap))),
    margin: Math.min(22, Math.max(8, num(t.margin, DEFAULT_THEME.margin))),
    showPhoto: t.showPhoto !== false,
    titleStyle:
      titleStyle === 'pill' || titleStyle === 'underline' ? titleStyle : 'bar',
    dateStyle: dateStyle === 'left' ? 'left' : 'right',
  };
}

function normalizeSection(raw: unknown, index: number): Section | null {
  const s = (raw ?? {}) as Json;
  const kind = str(s.kind);
  const base = {
    id: str(s.id) || uid(),
    title: str(s.title, `模块 ${index + 1}`),
    visible: s.visible !== false,
  };
  switch (kind) {
    case 'education':
      return {
        ...base,
        kind,
        items: arr<Json>(s.items).map((it) => ({
          id: str(it.id) || uid(),
          school: str(it.school),
          major: str(it.major),
          degree: str(it.degree),
          start: str(it.start),
          end: str(it.end),
          gpa: str(it.gpa),
          rank: str(it.rank),
          tags: arr<string>(it.tags).filter((x) => typeof x === 'string'),
          courses: str(it.courses),
        })),
      };
    case 'work':
      return {
        ...base,
        kind,
        items: arr<Json>(s.items).map((it) => ({
          id: str(it.id) || uid(),
          company: str(it.company),
          role: str(it.role),
          start: str(it.start),
          end: str(it.end),
          tags: arr<string>(it.tags).filter((x) => typeof x === 'string'),
          desc: str(it.desc),
        })),
      };
    case 'project':
      return {
        ...base,
        kind,
        items: arr<Json>(s.items).map((it) => ({
          id: str(it.id) || uid(),
          name: str(it.name),
          role: str(it.role),
          start: str(it.start),
          end: str(it.end),
          tags: arr<string>(it.tags).filter((x) => typeof x === 'string'),
          desc: str(it.desc),
        })),
      };
    case 'skill':
      return {
        ...base,
        kind,
        items: arr<Json>(s.items).map((it) => ({
          id: str(it.id) || uid(),
          summary: plainToRich(str(it.summary)),
          keywords: str(it.keywords),
          groups: arr<Json>(it.groups).map((g) => ({
            id: str(g.id) || uid(),
            name: str(g.name),
            level: Math.min(100, Math.max(0, num(g.level, 60))),
            label: str(g.label),
          })),
        })),
      };
    case 'award':
      return {
        ...base,
        kind,
        items: arr<Json>(s.items).map((it) => ({
          id: str(it.id) || uid(),
          title: str(it.title),
          date: str(it.date),
          desc: str(it.desc),
        })),
      };
    case 'summary':
      return { ...base, kind, html: str(s.html) };
    case 'custom':
      return {
        ...base,
        kind,
        items: arr<Json>(s.items).map((it) => ({
          id: str(it.id) || uid(),
          title: str(it.title),
          subtitle: str(it.subtitle),
          start: str(it.start),
          end: str(it.end),
          desc: str(it.desc),
        })),
      };
    default:
      return null;
  }
}

/** 旧版把性别/年龄/城市等放在 basics 顶层，这里统一迁进 fields 列表。 */
function migrateBasicFields(basics: Json): BasicsField[] {
  const rawFields = basics.fields;
  if (Array.isArray(rawFields)) {
    return rawFields
      .filter((f): f is Json => Boolean(f) && typeof f === 'object')
      .map((f) => ({
        id: str(f.id) || uid(),
        type: isBasicFieldType(f.type) ? f.type : 'text',
        label: str(f.label),
        value: str(f.value),
        visible: f.visible !== false,
      }));
  }

  const out: BasicsField[] = [];
  const push = (type: BasicsField['type'], value: string, label = '') => {
    if (!value) return;
    out.push({ id: uid(), type, label, value, visible: true });
  };
  push('gender', basics.gender === '男' || basics.gender === '女' ? basics.gender : '');
  push('age', str(basics.age));
  push('city', str(basics.city));
  push('years', str(basics.yearsOfExp));
  push('phone', str(basics.phone));
  push('email', str(basics.email));
  arr<Json>(basics.extras).forEach((e) => {
    out.push({
      id: str(e.id) || uid(),
      type: isBasicFieldType(e.type) ? e.type : 'text',
      label: str(e.label),
      value: str(e.value),
      visible: true,
    });
  });
  return out;
}

/** 把任意来源的数据补成一份合法的 Resume；无法识别时抛错。 */
export function normalizeResume(raw: unknown): Resume {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('文件内容不是有效的简历数据');
  }
  const r = raw as Json;
  // v1 的条目时间默认在左；v2 起默认在右，旧数据平滑切过来
  const fromVersion = typeof r.schemaVersion === 'number' ? r.schemaVersion : 1;
  const basics = (r.basics ?? {}) as Json;
  const intent = (r.intent ?? {}) as Json;
  const meta = (r.meta ?? {}) as Json;

  const sections = arr<unknown>(r.sections)
    .map(normalizeSection)
    .filter((s): s is Section => s !== null);

  // 空白简历（没有模块、没填姓名）是合法状态，只要结构对就接受
  const shaped =
    (typeof r.basics === 'object' && r.basics !== null) || Array.isArray(r.sections);
  if (!shaped) {
    throw new Error('不是有效的简历数据');
  }
  const fields = migrateBasicFields(basics);

  return {
    id: str(r.id) || uid(),
    name: str(r.name, '未命名简历'),
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    basics: {
      name: str(basics.name),
      photo: str(basics.photo),
      fields,
    },
    intent: {
      position: str(intent.position),
      city: str(intent.city),
      salary: str(intent.salary),
      availability: str(intent.availability),
    },
    sections,
    theme: normalizeTheme(r.theme, fromVersion < 2),
    meta: {
      templateId: str(meta.templateId, 'minimal-blue'),
      locale: 'zh-CN',
      page: 'A4',
    },
  };
}

export interface ExportFile {
  app: 'resume-forge';
  schemaVersion: number;
  exportedAt: string;
  resume: Resume;
}

export function parseExportFile(text: string): Resume {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('不是合法的 JSON 文件');
  }
  const obj = data as Json;
  if (obj && typeof obj === 'object' && 'resume' in obj) {
    return normalizeResume(obj.resume);
  }
  // 也接受直接给 resume 对象的文件
  return normalizeResume(data);
}

export function ensureResume(raw: unknown): Resume {
  try {
    return normalizeResume(raw);
  } catch {
    return createSampleResume();
  }
}
