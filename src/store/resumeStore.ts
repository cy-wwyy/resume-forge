import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Basics,
  CustomItem,
  EducationItem,
  Intent,
  ProjectItem,
  Resume,
  Section,
  SectionKind,
  SkillItem,
  Theme,
  AwardItem,
  WorkItem,
} from '@shared/schema/types';
import { DEFAULT_THEME, SECTION_LABEL } from '@shared/schema/types';
import { createSampleResume, uid } from '@shared/schema/sample';
import { ensureResume } from '@shared/schema/normalize';

export type ItemKind = 'education' | 'work' | 'project' | 'skill' | 'award' | 'custom';
export type ItemOf<K extends ItemKind> = Extract<Section, { kind: K }>['items'][number];

function emptyItem(kind: ItemKind): EducationItem | WorkItem | ProjectItem | SkillItem | AwardItem | CustomItem {
  switch (kind) {
    case 'education':
      return { id: uid(), school: '', major: '', degree: '本科', start: '', end: '', gpa: '', rank: '', tags: [], courses: '' };
    case 'work':
      return { id: uid(), company: '', role: '', start: '', end: '', tags: [], desc: '' };
    case 'project':
      return { id: uid(), name: '', role: '', start: '', end: '', tags: [], desc: '' };
    case 'skill':
      return { id: uid(), summary: '', keywords: '', groups: [{ id: uid(), name: '', level: 70, label: '' }] };
    case 'award':
      return { id: uid(), title: '', date: '', desc: '' };
    case 'custom':
      return { id: uid(), title: '', subtitle: '', start: '', end: '', desc: '' };
  }
}

function emptySection(kind: SectionKind): Section {
  const base = { id: uid(), title: SECTION_LABEL[kind], visible: true };
  switch (kind) {
    case 'summary':
      return { ...base, kind, html: '' };
    case 'education':
    case 'work':
    case 'project':
    case 'skill':
    case 'award':
    case 'custom': {
      const item = emptyItem(kind);
      return { ...base, kind, items: [item] } as Section;
    }
  }
}

function move<T>(list: T[], from: number, to: number): void {
  if (to < 0 || to >= list.length) return;
  const [item] = list.splice(from, 1);
  if (item !== undefined) list.splice(to, 0, item);
}

interface ResumeState {
  resume: Resume;
  activeId: string;
  /** 导入/恢复后用来滚动到顶部 */
  loadedAt: number;

  setResume: (resume: Resume) => void;
  resetSample: () => void;
  resetAll: () => void;
  patchBasics: (patch: Partial<Basics>) => void;
  patchIntent: (patch: Partial<Intent>) => void;
  patchTheme: (patch: Partial<Theme>) => void;
  setTemplate: (id: string) => void;
  setActive: (id: string) => void;

  patchSection: (sectionId: string, patch: Record<string, unknown>) => void;
  addSection: (kind: SectionKind) => void;
  removeSection: (sectionId: string) => void;
  moveSection: (sectionId: string, dir: -1 | 1) => void;
  reorderSection: (fromId: string, toId: string) => void;
  toggleSection: (sectionId: string) => void;

  addItem: (sectionId: string) => void;
  removeItem: (sectionId: string, itemId: string) => void;
  moveItem: (sectionId: string, itemId: string, dir: -1 | 1) => void;
  patchItem: (sectionId: string, itemId: string, patch: Record<string, unknown>) => void;
}

const initial = createSampleResume();

export const useResumeStore = create<ResumeState>()(
  immer((set) => ({
    resume: initial,
    activeId: 'basics',
    loadedAt: 0,

    setResume: (resume) =>
      set((s) => {
        s.resume = ensureResume(resume);
        s.resume.updatedAt = new Date().toISOString();
        s.activeId = 'basics';
        s.loadedAt = Date.now();
      }),

    resetAll: () =>
      set((s) => {
        // 恢复成示例骨架（高望舒），但保留用户当前的模板和配色
        const sample = createSampleResume();
        sample.theme = { ...s.resume.theme };
        sample.meta = { ...s.resume.meta };
        s.resume = sample;
        s.activeId = 'basics';
        s.loadedAt = Date.now();
      }),

    resetSample: () => {
      const sample = createSampleResume();
      set((s) => {
        s.resume = sample;
        s.activeId = sample.sections[1]?.id ?? '';
        s.loadedAt = Date.now();
      });
    },

    patchBasics: (patch) =>
      set((s) => {
        Object.assign(s.resume.basics, patch);
        s.resume.updatedAt = new Date().toISOString();
      }),

    patchIntent: (patch) =>
      set((s) => {
        Object.assign(s.resume.intent, patch);
        s.resume.updatedAt = new Date().toISOString();
      }),

    patchTheme: (patch) =>
      set((s) => {
        Object.assign(s.resume.theme, patch);
        s.resume.updatedAt = new Date().toISOString();
      }),

    setTemplate: (id) =>
      set((s) => {
        s.resume.meta.templateId = id;
        s.resume.updatedAt = new Date().toISOString();
      }),

    setActive: (id) => set((s) => { s.activeId = id; }),

    patchSection: (sectionId, patch) =>
      set((s) => {
        const section = s.resume.sections.find((x) => x.id === sectionId);
        if (section) Object.assign(section, patch);
        s.resume.updatedAt = new Date().toISOString();
      }),

    addSection: (kind) =>
      set((s) => {
        const section = emptySection(kind);
        s.resume.sections.push(section);
        s.activeId = section.id;
      }),

    removeSection: (sectionId) =>
      set((s) => {
        s.resume.sections = s.resume.sections.filter((x) => x.id !== sectionId);
        if (s.activeId === sectionId) s.activeId = s.resume.sections[0]?.id ?? 'basics';
      }),

    moveSection: (sectionId, dir) =>
      set((s) => {
        const i = s.resume.sections.findIndex((x) => x.id === sectionId);
        move(s.resume.sections, i, i + dir);
      }),

    reorderSection: (fromId, toId) =>
      set((s) => {
        const from = s.resume.sections.findIndex((x) => x.id === fromId);
        const to = s.resume.sections.findIndex((x) => x.id === toId);
        if (from < 0 || to < 0 || from === to) return;
        const [item] = s.resume.sections.splice(from, 1);
        if (item) s.resume.sections.splice(to, 0, item);
      }),

    toggleSection: (sectionId) =>
      set((s) => {
        const section = s.resume.sections.find((x) => x.id === sectionId);
        if (section) section.visible = !section.visible;
      }),

    addItem: (sectionId) =>
      set((s) => {
        const section = s.resume.sections.find((x) => x.id === sectionId);
        if (!section) return;
        switch (section.kind) {
          case 'education':
          case 'work':
          case 'project':
          case 'skill':
          case 'award':
          case 'custom':
            section.items.push(emptyItem(section.kind) as never);
            break;
          case 'summary':
            break;
        }
      }),

    removeItem: (sectionId, itemId) =>
      set((s) => {
        const section = s.resume.sections.find((x) => x.id === sectionId);
        if (!section || section.kind === 'summary') return;
        (section.items as Array<{ id: string }>) = section.items.filter((x) => x.id !== itemId);
      }),

    moveItem: (sectionId, itemId, dir) =>
      set((s) => {
        const section = s.resume.sections.find((x) => x.id === sectionId);
        if (!section || section.kind === 'summary') return;
        const list = section.items as Array<{ id: string }>;
        const i = list.findIndex((x) => x.id === itemId);
        move(list, i, i + dir);
      }),

    patchItem: (sectionId, itemId, patch) =>
      set((s) => {
        const section = s.resume.sections.find((x) => x.id === sectionId);
        if (!section || section.kind === 'summary') return;
        const item = (section.items as Array<{ id: string }>).find((x) => x.id === itemId);
        if (item) Object.assign(item, patch);
        s.resume.updatedAt = new Date().toISOString();
      }),
  })),
);

export const getResume = (): Resume => useResumeStore.getState().resume;
export const defaultTheme = DEFAULT_THEME;
