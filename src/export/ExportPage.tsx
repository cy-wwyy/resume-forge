import { useEffect, useState } from 'react';
import type { Resume } from '@shared/schema/types';
import { ResumeDocument } from '@/preview/Document';
import { PageStyle } from '@/preview/Roots';
import { fileBase } from '@/export/download';

declare global {
  interface Window {
    __setExportPayload?: (payload: Resume) => void;
  }
}

/**
 * 导出专用页面（#/export）。
 * 本地导出服务用无头浏览器打开它，注入数据后 page.pdf()。
 * 页面自身不做任何导出逻辑，纯粹是「1:1 的渲染面」。
 */
export function ExportPage() {
  const [resume, setResume] = useState<Resume | null>(null);

  useEffect(() => {
    window.__setExportPayload = (payload: Resume) => {
      document.documentElement.removeAttribute('data-export-ready');
      setResume(payload);
    };
  }, []);

  useEffect(() => {
    if (!resume) return;
    document.title = fileBase(resume);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        document.documentElement.dataset.exportReady = '1';
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [resume]);

  if (!resume) {
    return <div style={{ width: '210mm', minHeight: '297mm', background: '#fff' }} />;
  }

  return (
    <>
      <PageStyle margin={resume.theme.margin} />
      <div className="export-page" style={{ width: '210mm', background: '#fff' }}>
        <div className="sheet" style={{ ['--page-pad' as string]: `${resume.theme.margin}mm` }}>
          <ResumeDocument resume={resume} />
        </div>
      </div>
    </>
  );
}
