/**
 * 简历数据模型。
 * 原则：内容（本文件）与表现（templates/）彻底分离。
 * 这个模块只放纯数据定义，前后端共用，不要引任何 DOM / React。
 */

import type { BasicFieldType } from './fieldTypes';

export const SCHEMA_VERSION = 2;

export type SectionKind =
  | 'education'
  | 'work'
  | 'project'
  | 'skill'
  | 'award'
  | 'summary'
  | 'custom';

export interface BasicsField {
  id: string;
  /** 字段类型决定图标、输入方式和是否可点击 */
  type: BasicFieldType;
  label: string;
  value: string;
  /** 是否显示在简历上 */
  visible: boolean;
}

export interface Basics {
  name: string;
  photo: string;
  /** 基本信息的所有字段都在这里，统一支持排序和显隐 */
  fields: BasicsField[];
}

export interface Intent {
  position: string;
  city: string;
  salary: string;
  availability: string;
}

export interface EducationItem {
  id: string;
  school: string;
  major: string;
  degree: string;
  start: string;
  end: string;
  gpa: string;
  rank: string;
  /** 学校标签，如 985 / 211 / 双一流 */
  tags: string[];
  courses: string;
}

export interface WorkItem {
  id: string;
  company: string;
  role: string;
  start: string;
  end: string;
  /** 公司标签，如 世界500强 / 上市公司 */
  tags: string[];
  /** 富文本 HTML，渲染前会过白名单 */
  desc: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  start: string;
  end: string;
  tags: string[];
  desc: string;
}

export interface SkillGroup {
  id: string;
  name: string;
  /** 0-100，用于进度条 */
  level: number;
  /** 进度条右侧文字，如 熟练 / 良好 */
  label: string;
}

export interface SkillItem {
  id: string;
  /** 技能概述，纯文本 */
  summary: string;
  groups: SkillGroup[];
  /** 关键词，逗号分隔 */
  keywords: string;
}

export interface AwardItem {
  id: string;
  title: string;
  date: string;
  desc: string;
}

export interface CustomItem {
  id: string;
  title: string;
  subtitle: string;
  start: string;
  end: string;
  desc: string;
}

export interface SectionBase {
  id: string;
  title: string;
  visible: boolean;
}

export type Section =
  | (SectionBase & { kind: 'education'; items: EducationItem[] })
  | (SectionBase & { kind: 'work'; items: WorkItem[] })
  | (SectionBase & { kind: 'project'; items: ProjectItem[] })
  | (SectionBase & { kind: 'skill'; items: SkillItem[] })
  | (SectionBase & { kind: 'award'; items: AwardItem[] })
  | (SectionBase & { kind: 'summary'; html: string })
  | (SectionBase & { kind: 'custom'; items: CustomItem[] });

export type FontFamily = 'sans' | 'serif';

export interface Theme {
  accent: string;
  fontFamily: FontFamily;
  /** 0.85 ~ 1.15 */
  fontScale: number;
  /** 1.3 ~ 1.9 */
  lineHeight: number;
  /** 模块间距（px） */
  sectionGap: number;
  /** 页边距（mm） */
  margin: number;
  showPhoto: boolean;
  titleStyle: 'bar' | 'pill' | 'underline';
  /** 条目的时间放左边还是最右边 */
  dateStyle: 'left' | 'right';
}

export interface ResumeMeta {
  templateId: string;
  locale: 'zh-CN';
  page: 'A4';
}

export interface Resume {
  id: string;
  name: string;
  schemaVersion: number;
  updatedAt: string;
  basics: Basics;
  intent: Intent;
  sections: Section[];
  theme: Theme;
  meta: ResumeMeta;
}

export const DEFAULT_THEME: Theme = {
  accent: '#2563eb',
  fontFamily: 'sans',
  fontScale: 1,
  lineHeight: 1.65,
  sectionGap: 18,
  margin: 14,
  showPhoto: true,
  titleStyle: 'bar',
  dateStyle: 'right',
};

export const SECTION_LABEL: Record<SectionKind, string> = {
  education: '教育经历',
  work: '工作经历',
  project: '项目经历',
  skill: '专业技能',
  award: '证书与荣誉',
  summary: '职业概述',
  custom: '自定义模块',
};

/** 这些模块允许有多条，summary 是单块富文本 */
export const LIST_KINDS: SectionKind[] = ['education', 'work', 'project', 'skill', 'award', 'custom'];
