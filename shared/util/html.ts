/**
 * 富文本白名单清洗。
 * 工作描述来自 contentEditable / 粘贴 / 导入的 JSON，渲染前必须过一遍，
 * 只保留排版相关的标签和属性。
 */

const ALLOWED_TAGS = new Set([
  'P', 'DIV', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'SPAN',
  'UL', 'OL', 'LI', 'A', 'H3', 'H4', 'BLOCKQUOTE',
]);

const ALLOWED_STYLE = /^(text-align|font-weight|font-style|text-decoration)$/;

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') return ''; // 仅浏览器渲染，服务端不调用
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html');
  const root = doc.getElementById('root');
  if (!root) return '';

  const walk = (node: Element) => {
    [...node.children].forEach((child) => {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        // 不允许的标签：保留文字，丢掉标签
        const text = doc.createTextNode(child.textContent ?? '');
        child.replaceWith(text);
        return;
      }
      [...child.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name === 'href' && child.tagName === 'A') {
          if (!/^(https?:|mailto:|tel:)/i.test(attr.value)) child.removeAttribute(attr.name);
          return;
        }
        if (name === 'style') {
          const kept = attr.value
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
            .filter((decl) => {
              const prop = decl.split(':')[0]?.trim().toLowerCase() ?? '';
              return ALLOWED_STYLE.test(prop) && !/url\s*\(|expression/i.test(decl);
            })
            .join('; ');
          if (kept) child.setAttribute('style', kept);
          else child.removeAttribute('style');
          return;
        }
        if (name !== 'class' && name !== 'target' && name !== 'rel') {
          child.removeAttribute(attr.name);
        }
      });
      if (child.tagName === 'A') {
        child.setAttribute('rel', 'noopener noreferrer');
        child.setAttribute('target', '_blank');
      }
      walk(child);
    });
  };

  walk(root);
  return root.innerHTML;
}

/** 富文本转纯文本，用于字数统计、搜索、导出降级。 */
export function htmlToText(html: string): string {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') return html.replace(/<[^>]+>/g, ' ');
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function countChars(html: string): number {
  return htmlToText(html).replace(/\s/g, '').length;
}
