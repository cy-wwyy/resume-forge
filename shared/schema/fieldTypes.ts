/**
 * 基本信息里「添加字段」支持的字段类型。
 * 参考主流简历平台：默认 / 联系方式 / 链接 / 社交账号，带图标、可点击。
 */

export type BasicFieldType =
  | 'text'
  | 'gender'
  | 'age'
  | 'city'
  | 'years'
  | 'link'
  | 'website'
  | 'card'
  | 'phone'
  | 'email'
  | 'address'
  | 'birthday'
  | 'github'
  | 'gitlab'
  | 'gitee'
  | 'leetcode'
  | 'npm'
  | 'juejin'
  | 'zhihu'
  | 'csdn'
  | 'bilibili'
  | 'weibo'
  | 'xiaohongshu'
  | 'wechat'
  | 'qq'
  | 'x'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'figma';

export type FieldKind = 'text' | 'url' | 'tel' | 'email';

export interface BasicFieldTypeDef {
  id: BasicFieldType;
  label: string;
  kind: FieldKind;
  placeholder: string;
}

export const BASIC_FIELD_TYPES: BasicFieldTypeDef[] = [
  { id: 'text', label: '默认', kind: 'text', placeholder: '自定义内容' },
  { id: 'gender', label: '性别', kind: 'text', placeholder: '男 / 女' },
  { id: 'age', label: '年龄', kind: 'text', placeholder: '30' },
  { id: 'city', label: '城市', kind: 'text', placeholder: '上海' },
  { id: 'years', label: '工作年限', kind: 'text', placeholder: '6' },
  { id: 'link', label: '链接', kind: 'url', placeholder: 'https://…' },
  { id: 'website', label: '网站', kind: 'url', placeholder: 'https://yoursite.com' },
  { id: 'card', label: '主页/名片', kind: 'url', placeholder: 'https://…' },
  { id: 'phone', label: '电话', kind: 'tel', placeholder: '13800000000' },
  { id: 'email', label: '邮箱', kind: 'email', placeholder: 'you@example.com' },
  { id: 'address', label: '地址', kind: 'text', placeholder: '上海市浦东新区' },
  { id: 'birthday', label: '生日', kind: 'text', placeholder: '1995-06' },
  { id: 'github', label: 'GitHub', kind: 'url', placeholder: 'https://github.com/you' },
  { id: 'gitlab', label: 'GitLab', kind: 'url', placeholder: 'https://gitlab.com/you' },
  { id: 'gitee', label: 'Gitee 码云', kind: 'url', placeholder: 'https://gitee.com/you' },
  { id: 'leetcode', label: 'LeetCode', kind: 'url', placeholder: 'https://leetcode.cn/u/you' },
  { id: 'npm', label: 'npm', kind: 'url', placeholder: 'https://www.npmjs.com/~you' },
  { id: 'juejin', label: '掘金', kind: 'url', placeholder: 'https://juejin.cn/user/…' },
  { id: 'zhihu', label: '知乎', kind: 'url', placeholder: 'https://www.zhihu.com/people/…' },
  { id: 'csdn', label: 'CSDN', kind: 'url', placeholder: 'https://blog.csdn.net/you' },
  { id: 'bilibili', label: 'bilibili', kind: 'url', placeholder: 'https://space.bilibili.com/…' },
  { id: 'weibo', label: '微博', kind: 'url', placeholder: 'https://weibo.com/you' },
  { id: 'xiaohongshu', label: '小红书', kind: 'text', placeholder: '小红书号 / 主页链接' },
  { id: 'wechat', label: '微信', kind: 'text', placeholder: '微信号' },
  { id: 'qq', label: 'QQ', kind: 'text', placeholder: 'QQ 号' },
  { id: 'x', label: 'X（Twitter）', kind: 'url', placeholder: 'https://x.com/you' },
  { id: 'linkedin', label: 'LinkedIn', kind: 'url', placeholder: 'https://www.linkedin.com/in/you' },
  { id: 'facebook', label: 'Facebook', kind: 'url', placeholder: 'https://facebook.com/you' },
  { id: 'instagram', label: 'Instagram', kind: 'url', placeholder: 'https://instagram.com/you' },
  { id: 'figma', label: 'Figma', kind: 'url', placeholder: 'https://figma.com/@you' },
];

export const BASIC_FIELD_MAP: Record<BasicFieldType, BasicFieldTypeDef> = BASIC_FIELD_TYPES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<BasicFieldType, BasicFieldTypeDef>,
);

export function isBasicFieldType(value: unknown): value is BasicFieldType {
  return typeof value === 'string' && value in BASIC_FIELD_MAP;
}

/** 链接类字段补全协议，方便直接点开 */
export function toHref(type: BasicFieldType, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const def = BASIC_FIELD_MAP[type];
  if (def.kind === 'tel') return `tel:${v.replace(/\s+/g, '')}`;
  if (def.kind === 'email') return `mailto:${v}`;
  if (def.kind === 'url') return /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
  return null;
}
