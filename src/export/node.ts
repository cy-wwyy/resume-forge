/** 离屏 1:1 渲染节点，供 PNG / 位图 PDF 截图复用。 */
export const exportNode: { current: HTMLElement | null } = { current: null };
