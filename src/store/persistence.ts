import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { Resume } from '@shared/schema/types';
import { ensureResume, normalizeResume } from '@shared/schema/normalize';
import { useResumeStore, getResume } from './resumeStore';
import { createSampleResume } from '@shared/schema/sample';
import { isStandalone } from '@/standalone/flag';

// 保留旧 key：改名成 resume-forge 会让浏览器里已有的简历读不到
const KEY = 'resume-studio:current:v1';
// 离线单文件版用 localStorage（file:// 下 IndexedDB 不一定可用）
const LOCAL_KEY = 'resume-forge:offline:v1';

interface SaveState {
  savedAt: number | null;
  saving: boolean;
  ready: boolean;
  markSaving: () => void;
  markSaved: () => void;
  markReady: () => void;
}

export const useSaveStore = create<SaveState>((set) => ({
  savedAt: null,
  saving: false,
  ready: false,
  markSaving: () => set({ saving: true }),
  markSaved: () => set({ saving: false, savedAt: Date.now() }),
  markReady: () => set({ ready: true }),
}));

let timer: number | undefined;
let lastSerialized = '';

function persistNow() {
  const resume = getResume();
  const serialized = JSON.stringify(resume);
  if (serialized === lastSerialized) return;
  lastSerialized = serialized;
  useSaveStore.getState().markSaving();
  if (isStandalone()) {
    try {
      localStorage.setItem(LOCAL_KEY, serialized);
      useSaveStore.getState().markSaved();
    } catch (err) {
      console.warn('[save] localStorage 写入失败', err);
      useSaveStore.setState({ saving: false });
    }
    return;
  }
  idbSet(KEY, resume)
    .then(() => useSaveStore.getState().markSaved())
    .catch((err) => {
      console.error('[save] IndexedDB 写入失败', err);
      useSaveStore.setState({ saving: false });
    });
}

export function scheduleSave() {
  if (timer !== undefined) window.clearTimeout(timer);
  timer = window.setTimeout(persistNow, 500);
}

export function saveNow() {
  if (timer !== undefined) window.clearTimeout(timer);
  persistNow();
}

export async function loadStoredResume(): Promise<Resume | null> {
  if (isStandalone()) {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? normalizeResume(JSON.parse(raw)) : null;
    } catch (err) {
      console.warn('[load] 本地数据损坏', err);
      return null;
    }
  }
  try {
    const raw = await idbGet<unknown>(KEY);
    if (!raw) return null;
    return normalizeResume(raw);
  } catch (err) {
    console.warn('[load] 本地数据损坏，回退到示例', err);
    return null;
  }
}

/** 离线版：优先读上次填写的内容，没有就用 HTML 里注入的空白模板 */
function readEmbeddedTemplate(): Resume | null {
  const el = document.getElementById('resume-template');
  const raw = el?.textContent?.trim();
  if (!raw || raw === '__RESUME_TEMPLATE__') return null;
  try {
    return normalizeResume(JSON.parse(raw));
  } catch (err) {
    console.warn('[standalone] 模板解析失败', err);
    return null;
  }
}

export async function bootstrap() {
  const stored = await loadStoredResume();
  const initial = stored ?? (isStandalone() ? readEmbeddedTemplate() ?? createSampleResume() : null);
  if (initial) {
    useResumeStore.getState().setResume(initial);
    lastSerialized = JSON.stringify(getResume());
    useSaveStore.setState({ savedAt: Date.now(), ready: true });
  } else {
    lastSerialized = '';
    useSaveStore.getState().markReady();
    scheduleSave();
  }
  // 订阅整棵简历树：任何字段改动都会触发防抖落盘
  useResumeStore.subscribe(() => scheduleSave());
  window.addEventListener('beforeunload', () => saveNow());
}

export function forkImported(resume: Resume) {
  useResumeStore.getState().setResume(resume);
  lastSerialized = '';
  scheduleSave();
}

export { ensureResume };
