/** 离线单文件版：由 standalone.html 里的内联脚本置位 */
export function isStandalone(): boolean {
  return typeof window !== 'undefined' && Boolean((window as { __STANDALONE__?: boolean }).__STANDALONE__);
}
