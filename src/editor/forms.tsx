import { useRef, useState, type ReactNode } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  ImagePlus,
  Plus,
  Trash2,
} from 'lucide-react';
import type {
  AwardItem,
  BasicsField,
  CustomItem,
  EducationItem,
  ProjectItem,
  Resume,
  Section,
  SkillItem,
  WorkItem,
} from '@shared/schema/types';
import { countChars } from '@shared/util/html';
import { formatSalary } from '@shared/util/salary';
import { BASIC_FIELD_MAP, BASIC_FIELD_TYPES } from '@shared/schema/fieldTypes';
import { uid } from '@shared/schema/sample';
import { isStandalone } from '@/standalone/flag';
import { useResumeStore } from '@/store/resumeStore';
import { Field, MonthRange, TagInput, TextArea, TextInput } from '@/components/fields';
import { FieldIcon } from '@/components/FieldIcon';
import { MonthPicker } from '@/components/MonthPicker';
import { RichText } from './RichText';

const COMPANY_TAGS = ['世界500强', '上市公司', '独角兽', '国企', '外企', '创业公司'];
const SCHOOL_TAGS = ['985', '211', '双一流', 'QS100', '海外院校'];
const PROJECT_TAGS = ['主导', '独立完成', '团队协作'];

function ItemCard({
  index,
  title,
  canUp,
  canDown,
  onUp,
  onDown,
  onRemove,
  children,
}: {
  index: number;
  title: string;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card">
      <div className="card-head">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setOpen((v) => !v)}
          title={open ? '收起' : '展开'}
        >
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        <span className="idx">{index}</span>
        <span className="card-title">{title || '未命名'}</span>
        <span className="spacer" />
        <button type="button" className="icon-btn" onClick={onUp} disabled={!canUp} title="上移">
          <ChevronUp size={14} />
        </button>
        <button type="button" className="icon-btn" onClick={onDown} disabled={!canDown} title="下移">
          <ChevronDown size={14} />
        </button>
        <button type="button" className="icon-btn danger" onClick={onRemove} title="删除">
          <Trash2 size={14} />
        </button>
      </div>
      {open && <div className="card-body">{children}</div>}
    </div>
  );
}

/* ---------------- 基本信息 ---------------- */

export function BasicsForm({ resume }: { resume: Resume }) {
  const patch = useResumeStore((s) => s.patchBasics);
  const b = resume.basics;
  const fileRef = useRef<HTMLInputElement>(null);
  const standalone = isStandalone();
  const [picker, setPicker] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const setFields = (fields: BasicsField[]) => patch({ fields });
  const updateField = (id: string, next: Partial<BasicsField>) =>
    setFields(b.fields.map((f) => (f.id === id ? { ...f, ...next } : f)));
  const removeField = (id: string) => setFields(b.fields.filter((f) => f.id !== id));
  const reorder = (fromId: string, toId: string) => {
    const from = b.fields.findIndex((f) => f.id === fromId);
    const to = b.fields.findIndex((f) => f.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...b.fields];
    const [item] = next.splice(from, 1);
    if (item) next.splice(to, 0, item);
    setFields(next);
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const W = 320;
        const H = 420;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas 不可用'));
        const scale = Math.max(W / img.width, H / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.onerror = () => reject(new Error('图片读取失败'));
      img.src = URL.createObjectURL(file);
    });
    patch({ photo: dataUrl });
  };

  return (
    <div className="card">
      <div className="card-body">
        <Field label="姓名" required>
          <TextInput value={b.name} onChange={(v) => patch({ name: v })} placeholder="张三" />
        </Field>

        <Field label="照片（可选，会压缩到 320×420）">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {b.photo ? (
              <img src={b.photo} alt="" style={{ width: 44, height: 58, objectFit: 'cover', borderRadius: 4 }} />
            ) : (
              <div
                style={{
                  width: 44, height: 58, borderRadius: 4, display: 'grid', placeItems: 'center',
                  background: '#f3f4f6', color: '#9ca3af',
                }}
              >
                <ImagePlus size={16} />
              </div>
            )}
            <button type="button" className="chip" onClick={() => fileRef.current?.click()}>
              {b.photo ? '更换照片' : '上传照片'}
            </button>
            {b.photo && (
              <button type="button" className="chip" onClick={() => patch({ photo: '' })}>
                移除
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                void pickPhoto(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
        </Field>

        <Field
          label="基本信息字段"
          hint={standalone ? '按需填写' : '拖动排序，眼睛控制显隐'}
        >
          <div className="field-list">
            {b.fields.map((f) => (
              <div
                key={f.id}
                className={[
                  'field-row',
                  f.visible ? '' : 'is-hidden',
                  dragId === f.id ? 'dragging' : '',
                  overId === f.id && dragId !== f.id ? 'drag-over' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragId && dragId !== f.id) setOverId(f.id);
                }}
                onDragLeave={() => setOverId((cur) => (cur === f.id ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId) reorder(dragId, f.id);
                  setDragId(null);
                  setOverId(null);
                }}
              >
                {!standalone && (
                  <span
                    className="drag-handle"
                    draggable
                    title="拖动排序"
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', f.id);
                      setDragId(f.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverId(null);
                    }}
                  >
                    <GripVertical size={14} />
                  </span>
                )}
                <span className="extra-icon" title={BASIC_FIELD_MAP[f.type].label}>
                  <FieldIcon type={f.type} size={14} />
                </span>
                <input
                  className="input extra-label"
                  value={f.label}
                  placeholder={BASIC_FIELD_MAP[f.type].label}
                  onChange={(e) => updateField(f.id, { label: e.target.value })}
                />
                {f.type === 'gender' ? (
                  <select
                    className="select"
                    value={f.value}
                    onChange={(e) => updateField(f.id, { value: e.target.value })}
                  >
                    <option value="">不填</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                ) : (
                  <input
                    className="input"
                    value={f.value}
                    placeholder={BASIC_FIELD_MAP[f.type].placeholder}
                    onChange={(e) => updateField(f.id, { value: e.target.value })}
                  />
                )}
                {!standalone && (
                  <>
                    <button
                      type="button"
                      className={`icon-btn ${f.visible ? '' : 'off'}`}
                      title={f.visible ? '在简历上隐藏' : '在简历上显示'}
                      onClick={() => updateField(f.id, { visible: !f.visible })}
                    >
                      {f.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      title="删除字段"
                      onClick={() => removeField(f.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {!standalone && (
            <button type="button" className="chip ghost" onClick={() => setPicker((v) => !v)}>
              <Plus size={12} /> 添加字段
            </button>
          )}

          {!standalone && picker && (
            <div className="field-type-menu">
              {BASIC_FIELD_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  className="field-type"
                  onClick={() => {
                    const noLabel = ['text', 'gender', 'age', 'city', 'years', 'phone', 'email'].includes(t.id);
                    setFields([
                      ...b.fields,
                      {
                        id: uid(),
                        type: t.id,
                        label: noLabel ? '' : t.label,
                        value: '',
                        visible: true,
                      },
                    ]);
                    setPicker(false);
                  }}
                >
                  <FieldIcon type={t.id} size={15} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </Field>
      </div>
    </div>
  );
}

export function IntentForm({ resume }: { resume: Resume }) {
  const patch = useResumeStore((s) => s.patchIntent);
  const i = resume.intent;
  return (
    <div className="card">
      <div className="card-body">
        <div className="grid-2">
          <Field label="期望职位">
            <TextInput value={i.position} onChange={(v) => patch({ position: v })} placeholder="行政专员" />
          </Field>
          <Field label="期望城市">
            <TextInput value={i.city} onChange={(v) => patch({ city: v })} placeholder="上海" />
          </Field>
        </div>
        <div className="grid-2">
          <Field label="期望薪资（元/月）" hint={i.salary ? `简历显示：${formatSalary(i.salary)}` : '填 12000，简历显示 12k'}>
            <TextInput value={i.salary} onChange={(v) => patch({ salary: v.replace(/[^\d-]/g, '') })} placeholder="12000" />
          </Field>
          <Field label="到岗时间">
            <TextInput value={i.availability} onChange={(v) => patch({ availability: v })} placeholder="一个月内到岗" />
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 各模块 ---------------- */

function ModuleTitleField({ section }: { section: Section }) {
  const patchSection = useResumeStore((s) => s.patchSection);
  return (
    <Field label="模块名称" hint="显示在简历上的标题">
      <TextInput value={section.title} onChange={(v) => patchSection(section.id, { title: v })} />
    </Field>
  );
}

function ItemFooter({ sectionId, onAdd }: { sectionId: string; onAdd?: () => void }) {
  const addItem = useResumeStore((s) => s.addItem);
  return (
    <button
      type="button"
      className="add-btn"
      onClick={() => {
        addItem(sectionId);
        onAdd?.();
      }}
    >
      <Plus size={14} /> 添加一条
    </button>
  );
}

export function SectionForm({ section }: { section: Section }) {
  const patchSection = useResumeStore((s) => s.patchSection);
  const removeItem = useResumeStore((s) => s.removeItem);
  const moveItem = useResumeStore((s) => s.moveItem);
  const patchItem = useResumeStore((s) => s.patchItem);

  const head = <ModuleTitleField section={section} />;

  switch (section.kind) {
    case 'education': {
      const items = section.items as EducationItem[];
      return (
        <div>
          <div className="card"><div className="card-body">{head}</div></div>
          {items.map((it, idx) => (
            <ItemCard
              key={it.id}
              index={idx + 1}
              title={it.school || '教育经历'}
              canUp={idx > 0}
              canDown={idx < items.length - 1}
              onUp={() => moveItem(section.id, it.id, -1)}
              onDown={() => moveItem(section.id, it.id, 1)}
              onRemove={() => removeItem(section.id, it.id)}
            >
              <div className="grid-2">
                <Field label="学校名称">
                  <TextInput value={it.school} onChange={(v) => patchItem(section.id, it.id, { school: v })} />
                </Field>
                <Field label="专业">
                  <TextInput value={it.major} onChange={(v) => patchItem(section.id, it.id, { major: v })} />
                </Field>
              </div>
              <div className="grid-2">
                <Field label="学历">
                  <select className="select" value={it.degree} onChange={(e) => patchItem(section.id, it.id, { degree: e.target.value })}>
                    {['本科', '硕士', '博士', '大专', '高中', '其他'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>
                <Field label="GPA / 排名">
                  <TextInput value={it.gpa} onChange={(v) => patchItem(section.id, it.id, { gpa: v })} placeholder="3.66/4（专业前5%）" />
                </Field>
              </div>
              <Field label="在校时间">
                <MonthRange
                  start={it.start}
                  end={it.end}
                  endPlaceholder="毕业时间"
                  onChange={(p) => patchItem(section.id, it.id, p)}
                />
              </Field>
              <Field label="学校标签">
                <TagInput value={it.tags} presets={SCHOOL_TAGS} onChange={(v) => patchItem(section.id, it.id, { tags: v })} />
              </Field>
              <Field label="主修课程">
                <TextArea rows={2} value={it.courses} onChange={(v) => patchItem(section.id, it.id, { courses: v })} placeholder="基础会计学、管理学原理…" />
              </Field>
            </ItemCard>
          ))}
          <ItemFooter sectionId={section.id} />
        </div>
      );
    }

    case 'work': {
      const items = section.items as WorkItem[];
      return (
        <div>
          <div className="card"><div className="card-body">{head}</div></div>
          {items.map((it, idx) => (
            <ItemCard
              key={it.id}
              index={idx + 1}
              title={it.company || '工作经历'}
              canUp={idx > 0}
              canDown={idx < items.length - 1}
              onUp={() => moveItem(section.id, it.id, -1)}
              onDown={() => moveItem(section.id, it.id, 1)}
              onRemove={() => removeItem(section.id, it.id)}
            >
              <div className="grid-2">
                <Field label="公司名称" required>
                  <TextInput value={it.company} onChange={(v) => patchItem(section.id, it.id, { company: v })} />
                </Field>
                <Field label="职位">
                  <TextInput value={it.role} onChange={(v) => patchItem(section.id, it.id, { role: v })} />
                </Field>
              </div>
              <Field label="在职时间">
                <MonthRange
                  start={it.start}
                  end={it.end}
                  onChange={(p) => patchItem(section.id, it.id, p)}
                />
              </Field>
              <Field label="公司标签">
                <TagInput value={it.tags} presets={COMPANY_TAGS} onChange={(v) => patchItem(section.id, it.id, { tags: v })} />
              </Field>
              <Field label="工作描述" hint={`${countChars(it.desc)} 字`}>
                <RichText value={it.desc} onChange={(html) => patchItem(section.id, it.id, { desc: html })} placeholder="分条写清职责与成果，尽量带数字…" />
              </Field>
            </ItemCard>
          ))}
          <ItemFooter sectionId={section.id} />
        </div>
      );
    }

    case 'project': {
      const items = section.items as ProjectItem[];
      return (
        <div>
          <div className="card"><div className="card-body">{head}</div></div>
          {items.map((it, idx) => (
            <ItemCard
              key={it.id}
              index={idx + 1}
              title={it.name || '项目'}
              canUp={idx > 0}
              canDown={idx < items.length - 1}
              onUp={() => moveItem(section.id, it.id, -1)}
              onDown={() => moveItem(section.id, it.id, 1)}
              onRemove={() => removeItem(section.id, it.id)}
            >
              <div className="grid-2">
                <Field label="项目名称">
                  <TextInput value={it.name} onChange={(v) => patchItem(section.id, it.id, { name: v })} />
                </Field>
                <Field label="担任角色">
                  <TextInput value={it.role} onChange={(v) => patchItem(section.id, it.id, { role: v })} />
                </Field>
              </div>
              <Field label="项目时间">
                <MonthRange start={it.start} end={it.end} onChange={(p) => patchItem(section.id, it.id, p)} />
              </Field>
              <Field label="标签">
                <TagInput value={it.tags} presets={PROJECT_TAGS} onChange={(v) => patchItem(section.id, it.id, { tags: v })} />
              </Field>
              <Field label="项目描述" hint={`${countChars(it.desc)} 字`}>
                <RichText value={it.desc} onChange={(html) => patchItem(section.id, it.id, { desc: html })} />
              </Field>
            </ItemCard>
          ))}
          <ItemFooter sectionId={section.id} />
        </div>
      );
    }

    case 'skill': {
      const items = section.items as SkillItem[];
      return (
        <div>
          <div className="card"><div className="card-body">{head}</div></div>
          {items.map((it, idx) => (
            <ItemCard
              key={it.id}
              index={idx + 1}
              title="技能概览"
              canUp={idx > 0}
              canDown={idx < items.length - 1}
              onUp={() => moveItem(section.id, it.id, -1)}
              onDown={() => moveItem(section.id, it.id, 1)}
              onRemove={() => removeItem(section.id, it.id)}
            >
              <Field label="技能概述" hint={`${countChars(it.summary)} 字`}>
                <RichText
                  value={it.summary}
                  onChange={(html) => patchItem(section.id, it.id, { summary: html })}
                  placeholder="语言能力：CET-6，可熟练读写…"
                />
              </Field>
              <Field label="技能条" hint="名称 + 熟练度">
                {it.groups.map((g) => (
                  <div key={g.id} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                    <input
                      className="input"
                      style={{ width: 96 }}
                      value={g.name}
                      placeholder="技能名"
                      onChange={(e) =>
                        patchItem(section.id, it.id, {
                          groups: it.groups.map((x) => (x.id === g.id ? { ...x, name: e.target.value } : x)),
                        })
                      }
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={g.level}
                      style={{ flex: 1, accentColor: 'var(--c-accent)' }}
                      onChange={(e) =>
                        patchItem(section.id, it.id, {
                          groups: it.groups.map((x) => (x.id === g.id ? { ...x, level: Number(e.target.value) } : x)),
                        })
                      }
                    />
                    <input
                      className="input"
                      style={{ width: 72 }}
                      value={g.label}
                      placeholder="熟练"
                      onChange={(e) =>
                        patchItem(section.id, it.id, {
                          groups: it.groups.map((x) => (x.id === g.id ? { ...x, label: e.target.value } : x)),
                        })
                      }
                    />
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() =>
                        patchItem(section.id, it.id, { groups: it.groups.filter((x) => x.id !== g.id) })
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="chip ghost"
                  onClick={() =>
                    patchItem(section.id, it.id, {
                      groups: [...it.groups, { id: Math.random().toString(36).slice(2, 10), name: '', level: 70, label: '' }],
                    })
                  }
                >
                  <Plus size={12} /> 添加技能
                </button>
              </Field>
              <Field label="关键词" hint="逗号分隔，显示在技能条下方">
                <TextInput value={it.keywords} onChange={(v) => patchItem(section.id, it.id, { keywords: v })} placeholder="Office、沟通协调、数据分析" />
              </Field>
            </ItemCard>
          ))}
          <ItemFooter sectionId={section.id} />
        </div>
      );
    }

    case 'award': {
      const items = section.items as AwardItem[];
      return (
        <div>
          <div className="card"><div className="card-body">{head}</div></div>
          {items.map((it, idx) => (
            <ItemCard
              key={it.id}
              index={idx + 1}
              title={it.title || '证书'}
              canUp={idx > 0}
              canDown={idx < items.length - 1}
              onUp={() => moveItem(section.id, it.id, -1)}
              onDown={() => moveItem(section.id, it.id, 1)}
              onRemove={() => removeItem(section.id, it.id)}
            >
              <div className="grid-2">
                <Field label="证书 / 荣誉">
                  <TextInput value={it.title} onChange={(v) => patchItem(section.id, it.id, { title: v })} />
                </Field>
                <Field label="获得时间">
                  <MonthPicker value={it.date} onChange={(v) => patchItem(section.id, it.id, { date: v })} />
                </Field>
              </div>
              <Field label="补充说明">
                <TextInput value={it.desc} onChange={(v) => patchItem(section.id, it.id, { desc: v })} placeholder="CET-6，582 分" />
              </Field>
            </ItemCard>
          ))}
          <ItemFooter sectionId={section.id} />
        </div>
      );
    }

    case 'summary':
      return (
        <div>
          <div className="card">
            <div className="card-body">
              {head}
              <Field label="职业概述" hint={`${countChars(section.html)} 字`}>
                <RichText value={section.html} onChange={(html) => patchSection(section.id, { html })} placeholder="用 3-5 句话写清你的核心优势、经验和求职动机…" />
              </Field>
            </div>
          </div>
        </div>
      );

    case 'custom': {
      const items = section.items as CustomItem[];
      return (
        <div>
          <div className="card"><div className="card-body">{head}</div></div>
          {items.map((it, idx) => (
            <ItemCard
              key={it.id}
              index={idx + 1}
              title={it.title || '自定义条目'}
              canUp={idx > 0}
              canDown={idx < items.length - 1}
              onUp={() => moveItem(section.id, it.id, -1)}
              onDown={() => moveItem(section.id, it.id, 1)}
              onRemove={() => removeItem(section.id, it.id)}
            >
              <div className="grid-2">
                <Field label="标题">
                  <TextInput value={it.title} onChange={(v) => patchItem(section.id, it.id, { title: v })} />
                </Field>
                <Field label="副标题">
                  <TextInput value={it.subtitle} onChange={(v) => patchItem(section.id, it.id, { subtitle: v })} />
                </Field>
              </div>
              <Field label="时间">
                <MonthRange start={it.start} end={it.end} onChange={(p) => patchItem(section.id, it.id, p)} />
              </Field>
              <Field label="描述" hint={`${countChars(it.desc)} 字`}>
                <RichText value={it.desc} onChange={(html) => patchItem(section.id, it.id, { desc: html })} />
              </Field>
            </ItemCard>
          ))}
          <ItemFooter sectionId={section.id} />
        </div>
      );
    }
  }
}
