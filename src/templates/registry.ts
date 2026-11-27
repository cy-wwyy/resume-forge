import type { FC } from 'react';
import type { Resume } from '@shared/schema/types';
import { ResumeDocument } from '@/preview/Document';

export interface TemplateDef {
  id: string;
  name: string;
  hint: string;
  Document: FC<{ resume: Resume }>;
}

/**
 * 模板注册表。第一版只有一套（对齐截图），
 * 但切换 UI / 缩略图 / 令牌都已经按多模板准备。
 */
export const templates: TemplateDef[] = [
  {
    id: 'minimal-blue',
    name: '简约蓝',
    hint: '单栏 · 时间轴 · 适合通用岗位',
    Document: ResumeDocument,
  },
];

export function getTemplate(id: string): TemplateDef {
  return templates.find((t) => t.id === id) ?? templates[0];
}
