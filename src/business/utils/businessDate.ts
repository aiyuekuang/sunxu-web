const BUSINESS_TIME_ZONE = 'Asia/Shanghai';

const BUSINESS_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Return today's MES business date as YYYY-MM-DD in Asia/Shanghai. */
export function todayBusinessDate(): string {
  const parts = BUSINESS_DATE_FORMATTER.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!year || !month || !day) {
    throw new Error('Unable to format the current MES business date');
  }
  return `${year}-${month}-${day}`;
}
