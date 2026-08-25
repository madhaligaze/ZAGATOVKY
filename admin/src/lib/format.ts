/** Цены в админке — те же целые тенге, что и в БД. */
export const money = (value: number) => `${value.toLocaleString('ru-RU')} тг`;

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export const relative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  return dateTime(iso);
};

const units: Record<string, string> = { G: 'г', ML: 'мл', PORTION: 'порц.', PCS: 'шт.' };
export const weight = (value: number, unit: string) => `${value} ${units[unit] ?? unit}`;

export const bytes = (value: number) =>
  value > 1024 * 1024
    ? `${(value / 1024 / 1024).toFixed(1)} МБ`
    : `${Math.round(value / 1024)} КБ`;
