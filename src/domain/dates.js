const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function getTodayStr(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr, days) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return getTodayStr(date);
}

export function formatDateDisplay(dateStr) {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return '';
  const [, m, d] = dateStr.split('-').map(Number);
  if (!m || !d) return '';
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

export function formatDateFull(dateStr) {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return '';
  const [, m, d] = dateStr.split('-').map(Number);
  if (!m || !d || !MONTHS_PT[m - 1]) return '';
  return `${d} de ${MONTHS_PT[m - 1]}`;
}

export function daysDiff(targetDateStr, baseDateStr = getTodayStr()) {
  const [y1, m1, d1] = String(targetDateStr).split('-').map(Number);
  const [y2, m2, d2] = String(baseDateStr).split('-').map(Number);
  const t1 = new Date(y1, m1 - 1, d1).getTime();
  const t2 = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((t1 - t2) / (1000 * 60 * 60 * 24));
}

export function formatHeaderDate(now = new Date()) {
  const options = { weekday: 'short', day: 'numeric', month: 'short' };
  const formatted = now.toLocaleDateString('pt-BR', options).replace(/\./g, '');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
