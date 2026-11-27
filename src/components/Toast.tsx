import { create } from 'zustand';

export type ToastKind = 'info' | 'ok' | 'err';

interface ToastItem {
  id: number;
  text: string;
  kind: ToastKind;
}

interface ToastState {
  items: ToastItem[];
  push: (text: string, kind?: ToastKind) => void;
  remove: (id: number) => void;
}

let seq = 1;

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (text, kind = 'info') => {
    const id = seq++;
    set((s) => ({ items: [...s.items, { id, text, kind }] }));
    window.setTimeout(() => {
      set((s) => ({ items: s.items.filter((x) => x.id !== id) }));
    }, kind === 'err' ? 5200 : 2600);
  },
  remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export const toast = (text: string, kind: ToastKind = 'info') =>
  useToastStore.getState().push(text, kind);

export function Toasts() {
  const items = useToastStore((s) => s.items);
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div className={`toast ${t.kind}`} key={t.id}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
