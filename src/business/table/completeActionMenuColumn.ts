import type { ProColumns } from '@ant-design/pro-components';

const COMPLETE_ACTION_MENU_COLUMN = Symbol('sunxu-complete-action-menu-column');

/** Mark a column whose renderer already owns its complete row action menu. */
export function markCompleteActionMenuColumn<T extends object>(
  column: ProColumns<T>,
): ProColumns<T> {
  Object.defineProperty(column, COMPLETE_ACTION_MENU_COLUMN, {
    enumerable: true,
    value: true,
  });
  return column;
}

export function hasCompleteActionMenuColumn(column: object): boolean {
  return Reflect.get(column, COMPLETE_ACTION_MENU_COLUMN) === true;
}
