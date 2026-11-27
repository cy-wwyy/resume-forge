import type { BasicFieldType } from '@shared/schema/fieldTypes';
import { BRAND_PATHS, type BrandIconKey } from './brandIcons';
import {
  Briefcase,
  Cake,
  CalendarDays,
  Contact,
  Globe,
  Info,
  Link2,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react';
import type { ComponentType } from 'react';

const LUCIDE_ICONS: Partial<Record<BasicFieldType, ComponentType<{ size?: number; strokeWidth?: number }>>> = {
  text: Info,
  gender: UserRound,
  age: Cake,
  city: MapPin,
  years: Briefcase,
  link: Link2,
  website: Globe,
  card: Contact,
  phone: Phone,
  email: Mail,
  address: MapPin,
  birthday: CalendarDays,
  linkedin: Linkedin,
};

const BRAND_MAP: Partial<Record<BasicFieldType, BrandIconKey>> = {
  github: 'github',
  gitlab: 'gitlab',
  gitee: 'gitee',
  leetcode: 'leetcode',
  npm: 'npm',
  juejin: 'juejin',
  zhihu: 'zhihu',
  csdn: 'csdn',
  bilibili: 'bilibili',
  weibo: 'weibo',
  xiaohongshu: 'xiaohongshu',
  wechat: 'wechat',
  qq: 'qq',
  x: 'x',
  facebook: 'facebook',
  instagram: 'instagram',
  figma: 'figma',
};

/** 基本信息自定义字段的图标：通用字段用线性图标，平台用品牌图标 */
export function FieldIcon({ type, size = 14 }: { type: BasicFieldType; size?: number }) {
  const Lucide = LUCIDE_ICONS[type];
  if (Lucide) return <Lucide size={size} strokeWidth={1.8} />;

  const key = BRAND_MAP[type];
  const path = key ? BRAND_PATHS[key] : undefined;
  if (path) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
        <path d={path} />
      </svg>
    );
  }
  return <Info size={size} strokeWidth={1.8} />;
}
