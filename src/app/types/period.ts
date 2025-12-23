export type PeriodType = 'week' | 'month' | 'current_year' | string;

export function isYearPeriod(period: PeriodType): boolean {
  return period !== 'week' && period !== 'month' && period !== 'current_year';
}

export function getYearFromPeriod(period: PeriodType): number | null {
  if (isYearPeriod(period)) {
    const year = parseInt(period, 10);
    return isNaN(year) ? null : year;
  }
  return null;
}
