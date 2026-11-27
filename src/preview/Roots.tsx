import { useResumeStore } from '@/store/resumeStore';
import { getTemplate } from '@/templates/registry';
import { exportNode } from '@/export/node';

/** 离屏 1:1 渲染：PNG / 位图 PDF 都从它截图，保证和预览同源。 */
export function ExportRoot() {
  const resume = useResumeStore((s) => s.resume);
  const Template = getTemplate(resume.meta.templateId).Document;
  return (
    <div className="export-root" ref={(el) => { exportNode.current = el; }} aria-hidden>
      <div className="sheet" style={{ ['--page-pad' as string]: `${resume.theme.margin}mm` }}>
        <Template resume={resume} />
      </div>
    </div>
  );
}

/** 打印专用（Ctrl/Cmd+P 和「打印」菜单），与导出页共用同一套 @page 规则。 */
export function PrintRoot() {
  const resume = useResumeStore((s) => s.resume);
  const Template = getTemplate(resume.meta.templateId).Document;
  return (
    <div id="print-root">
      <div className="sheet">
        <Template resume={resume} />
      </div>
    </div>
  );
}

/** @page 的边距必须写死成字面量，所以按主题动态注入。 */
export function PageStyle({ margin }: { margin: number }) {
  return <style>{`@page { size: A4; margin: ${margin}mm; }`}</style>;
}
