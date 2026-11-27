import { useCallback, useEffect, useState } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { FormPane } from '@/editor/FormPane';
import { PreviewPane } from '@/preview/PreviewPane';
import { Toasts } from '@/components/Toast';
import { ExportRoot, PrintRoot, PageStyle } from '@/preview/Roots';
import { bootstrap, saveNow, useSaveStore } from '@/store/persistence';
import { useResumeStore } from '@/store/resumeStore';
import { fileBase } from '@/export/download';
import { isStandalone } from '@/standalone/flag';

export function App() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const closePreview = useCallback(() => setPreviewOpen(false), []);
  const margin = useResumeStore((s) => s.resume.theme.margin);
  const name = useResumeStore((s) => s.resume.basics.name);
  const position = useResumeStore((s) => s.resume.intent.position);

  useEffect(() => {
    // IndexedDB 偶发卡住时不要让界面一直停在“读取中”
    const timer = window.setTimeout(() => {
      if (!useSaveStore.getState().ready) useSaveStore.getState().markReady();
    }, 1500);
    void bootstrap().finally(() => {
      window.clearTimeout(timer);
      useSaveStore.getState().markReady();
    });
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveNow();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (isStandalone()) return;
    const resume = useResumeStore.getState().resume;
    document.title = fileBase({ ...resume, basics: { ...resume.basics, name } });
  }, [name, position]);

  return (
    <>
      <div className="app">
        <TopBar onPreview={() => setPreviewOpen(true)} />
        <div className="body">
          <Sidebar />
          <FormPane />
          <PreviewPane mobileOpen={previewOpen} onClose={closePreview} />
        </div>
      </div>
      <Toasts />
      <ExportRoot />
      <PrintRoot />
      <PageStyle margin={margin} />
    </>
  );
}
