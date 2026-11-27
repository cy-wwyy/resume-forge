import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { Resume } from '@shared/schema/types';
import { ensureResume, normalizeResume } from '@shared/schema/normalize';
import { useResumeStore, getResume } from './resumeStore';

// 保留旧 key：改名成 resume-forge 会让浏览器里已有的简历读不到
const KEY = 'resume-studio:current:v1';

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
  try {
    const raw = await idbGet<unknown>(KEY);
    if (!raw) return null;
    return normalizeResume(raw);
  } catch (err) {
    console.warn('[load] 本地数据损坏，回退到示例', err);
    return null;
  }
}

export async function bootstrap() {
  const stored = await loadStoredResume();
  if (stored) {
    useResumeStore.getState().setResume(stored);
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
