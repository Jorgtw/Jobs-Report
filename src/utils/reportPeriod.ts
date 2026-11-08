export type ReportRange = 'all' | 'today' | 'week' | 'month' | 'custom';

export const localDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function reportPeriod(range: ReportRange, from = '', to = '', now = new Date()) {
  if (range === 'all') return {};
  if (range === 'custom') return { dateFrom: from || undefined, dateTo: to || undefined };
  const start = new Date(now);
  const end = new Date(now);
  if (range === 'week') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    end.setFullYear(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  } else if (range === 'month') {
    start.setDate(1);
    end.setFullYear(start.getFullYear(), start.getMonth() + 1, 0);
  }
  return { dateFrom: localDate(start), dateTo: localDate(end) };
}
