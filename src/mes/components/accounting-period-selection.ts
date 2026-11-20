import type {
  AccountingFiscalPeriodRecord,
  AccountingFiscalPeriodStatus,
} from './accounting-selector-types';

const STATUS_PRIORITY: Record<AccountingFiscalPeriodStatus, number> = {
  open: 0,
  soft_closed: 1,
  not_opened: 2,
  closed: 3,
  locked: 4,
};

/** Returns a local business date so UTC conversion cannot shift the MES day. */
export function getLocalBusinessDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Prefer a period that contains today's business date. Period codes alone do
 * not determine the current period because a future period can already be open.
 */
export function selectPreferredFiscalPeriod(
  periods: ReadonlyArray<AccountingFiscalPeriodRecord>,
  businessDate = getLocalBusinessDate(),
): AccountingFiscalPeriodRecord | undefined {
  return periods
    .filter(
      (period) =>
        period.startDate <= businessDate && period.endDate >= businessDate,
    )
    .slice()
    .sort((left, right) => {
      const statusOrder =
        STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status];
      if (statusOrder !== 0) return statusOrder;
      return right.periodCode.localeCompare(left.periodCode);
    })[0];
}
