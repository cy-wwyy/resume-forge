import type { CSSProperties, ReactNode } from 'react';
import type { BasicsField, Resume, Section, Theme } from '@shared/schema/types';
import { sanitizeHtml } from '@shared/util/html';
import { toHref } from '@shared/schema/fieldTypes';
import { formatSalary } from '@shared/util/salary';
import { FieldIcon } from '@/components/FieldIcon';

type DateStyle = Theme['dateStyle'];

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [37, 99, 235];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function accentWeak(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, 0.08)`;
}

function themeStyle(theme: Theme): CSSProperties {
  return {
    ['--accent' as string]: theme.accent,
    ['--accent-weak' as string]: accentWeak(theme.accent),
    ['--fs' as string]: String(theme.fontScale),
    ['--lh' as string]: String(theme.lineHeight),
    ['--gap' as string]: `${theme.sectionGap}px`,
  };
}

function MetaItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rs-meta-item">
      {icon}
      <span>{children}</span>
    </div>
  );
}

function Header({ resume }: { resume: Resume }) {
  const { basics: b, intent, theme } = resume;
  const intentItems = [
    intent.position && ['期望职位', intent.position],
    intent.city && ['期望城市', intent.city],
    intent.salary && ['期望薪资', formatSalary(intent.salary)],
    intent.availability && ['到岗时间', intent.availability],
  ].filter(Boolean) as [string, string][];

  return (
    <header className="rs-header">
      <div className="rs-head-main">
        <h1 className="rs-name">{b.name || '你的名字'}</h1>
        {intentItems.length > 0 && (
          <div className="rs-intent">
            {intentItems.map(([label, value]) => (
              <span className="rs-intent-item" key={label}>
                {label}：<b>{value}</b>
              </span>
            ))}
          </div>
        )}
        <div className="rs-meta">
          {b.fields
            .filter((f) => f.visible && f.value.trim())
            .map((f) => {
              const href = toHref(f.type, f.value);
              const text = fieldText(f);
              return (
                <MetaItem key={f.id} icon={<FieldIcon type={f.type} />}>
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer">
                      {text}
                    </a>
                  ) : (
                    text
                  )}
                </MetaItem>
              );
            })}
        </div>
      </div>
      {theme.showPhoto && b.photo && <img className="rs-photo" src={b.photo} alt="" />}
    </header>
  );
}

function SectionHead({ title }: { title: string }) {
  return <h2 className="rs-h">{title}</h2>;
}

function Rich({ html }: { html: string }) {
  return <div className="rs-desc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;
}

/**
 * 条目头：时间可放最左或最右。
 * 正文不再按时间列缩进——内容一律从版心左边缘起排，避免左侧空一条。
 */
function EntryHead({
  date,
  title,
  tags,
  role,
  dateStyle,
}: {
  date: string;
  title: ReactNode;
  tags?: string[];
  role?: ReactNode;
  dateStyle: DateStyle;
}) {
  return (
    <div className="rs-head">
      {dateStyle === 'left' && date && <span className="rs-date">{date}</span>}
      <span className="rs-title">{title}</span>
      {/* 时间在右时，职位/专业紧跟在名称后面；只有时间独占最右 */}
      {dateStyle === 'right' && role && <span className="rs-role">{role}</span>}
      {tags?.map((t) => (
        <span className="rs-tag" key={t}>
          {t}
        </span>
      ))}
      <span className="rs-head-right">
        {dateStyle === 'left' && role && <span className="rs-role">{role}</span>}
        {dateStyle === 'right' && date && <span className="rs-date right">{date}</span>}
      </span>
    </div>
  );
}

/** 基本信息字段在简历上的文案：年龄/年限自动带单位，有名称的加「名称：」 */
function fieldText(f: BasicsField): string {
  if (f.type === 'age') return `${f.value}岁`;
  if (f.type === 'years') return `${f.value}年经验`;
  return f.label ? `${f.label}：${f.value}` : f.value;
}

/** 教育这类有确定结束时间的：没填就不显示 */
const rangeFixed = (start: string, end: string) => [start, end].filter(Boolean).join(' ~ ');
/** 工作/项目这类可能持续的：结束时间留空即「至今」 */
const rangeOpen = (start: string, end: string) => {
  if (!start && !end) return '';
  return [start, end || '至今'].filter(Boolean).join(' ~ ');
};

function SectionView({ section, dateStyle }: { section: Section; dateStyle: DateStyle }) {
  switch (section.kind) {
    case 'education':
      return (
        <>
          <SectionHead title={section.title} />
          {section.items.map((it) => (
            <div className="rs-entry" key={it.id}>
              <EntryHead
                dateStyle={dateStyle}
                date={rangeFixed(it.start, it.end)}
                title={it.school}
                tags={it.tags}
                role={[it.major, it.degree && `（${it.degree}）`].filter(Boolean).join('')}
              />
              {(it.gpa || it.rank) && (
                <div className="rs-courses">
                  <span className="label">专业成绩：</span>
                  <span>{[it.gpa && `GPA ${it.gpa}`, it.rank].filter(Boolean).join('　')}</span>
                </div>
              )}
              {it.courses && (
                <div className="rs-courses">
                  <span className="label">主修课程：</span>
                  <span>{it.courses}</span>
                </div>
              )}
            </div>
          ))}
        </>
      );

    case 'work':
      return (
        <>
          <SectionHead title={section.title} />
          {section.items.map((it) => (
            <div className="rs-entry" key={it.id}>
              <EntryHead
                dateStyle={dateStyle}
                date={rangeOpen(it.start, it.end)}
                title={it.company}
                tags={it.tags}
                role={it.role}
              />
              {it.desc && <Rich html={it.desc} />}
            </div>
          ))}
        </>
      );

    case 'project':
      return (
        <>
          <SectionHead title={section.title} />
          {section.items.map((it) => (
            <div className="rs-entry" key={it.id}>
              <EntryHead
                dateStyle={dateStyle}
                date={rangeOpen(it.start, it.end)}
                title={it.name}
                tags={it.tags}
                role={it.role}
              />
              {it.desc && <Rich html={it.desc} />}
            </div>
          ))}
        </>
      );

    case 'skill':
      return (
        <>
          <SectionHead title={section.title} />
          {section.items.map((it) => (
            <div key={it.id} style={{ breakInside: 'avoid' }}>
              {it.summary && (
                <div
                  className="rs-skill-summary"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(it.summary) }}
                />
              )}
              {it.groups.map((g) => (
                <div className="rs-skill-row" key={g.id}>
                  <span className="rs-skill-name">{g.name}</span>
                  <span className="rs-bar">
                    <span className="rs-bar-fill" style={{ width: `${g.level}%` }} />
                  </span>
                  <span className="rs-skill-label">{g.label}</span>
                </div>
              ))}
              {it.keywords && <div className="rs-keywords">{it.keywords}</div>}
            </div>
          ))}
        </>
      );

    case 'award':
      return (
        <>
          <SectionHead title={section.title} />
          {section.items.map((it) => (
            <div className="rs-award" key={it.id}>
              <div className="rs-head">
                {dateStyle === 'left' && it.date && <span className="rs-date">{it.date}</span>}
                <span className="rs-award-title">{it.title}</span>
                {it.desc && <span className="rs-award-desc">{it.desc}</span>}
                <span className="rs-head-right">
                  {dateStyle === 'right' && it.date && <span className="rs-date right">{it.date}</span>}
                </span>
              </div>
            </div>
          ))}
        </>
      );

    case 'summary':
      return (
        <>
          <SectionHead title={section.title} />
          <Rich html={section.html} />
        </>
      );

    case 'custom':
      return (
        <>
          <SectionHead title={section.title} />
          {section.items.map((it) => (
            <div className="rs-entry" key={it.id}>
              <EntryHead
                dateStyle={dateStyle}
                date={rangeOpen(it.start, it.end)}
                title={it.title}
                role={it.subtitle}
              />
              {it.desc && <Rich html={it.desc} />}
            </div>
          ))}
        </>
      );
  }
}

export function ResumeDocument({ resume }: { resume: Resume }) {
  return (
    <div
      className="rs"
      style={themeStyle(resume.theme)}
      data-title={resume.theme.titleStyle}
      data-font={resume.theme.fontFamily}
      data-date={resume.theme.dateStyle}
    >
      <Header resume={resume} />
      {resume.sections
        .filter((s) => s.visible)
        .map((s) => (
          <section className="rs-section" key={s.id}>
            <SectionView section={s} dateStyle={resume.theme.dateStyle} />
          </section>
        ))}
    </div>
  );
}

export { themeStyle, accentWeak };
