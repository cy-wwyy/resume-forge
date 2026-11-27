/** 把月薪数字转成「12k」「12.5k」这种写法；填不成数字就原样返回。 */
export function formatSalary(raw: string): string {
  const text = raw.trim();
  if (!text) return '';
  const n = Number(text.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return text;
  if (n >= 1000) {
    const k = n / 1000;
    const rounded = Math.round(k * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}k`;
  }
  return String(n);
}
