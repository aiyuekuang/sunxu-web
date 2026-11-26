import type { ProColumns } from '@ant-design/pro-components';

export const ROW_INDEX_COLUMN_KEY = '__sxw_row_index__';

export interface RowIndexPageInfo {
  current: number;
  pageSize: number;
}

export function createRowIndexColumn<T extends object>(
  getPageInfo: () => RowIndexPageInfo,
): ProColumns<T> {
  return {
    title: '序号',
    key: ROW_INDEX_COLUMN_KEY,
    dataIndex: ROW_INDEX_COLUMN_KEY,
    width: 64,
    fixed: 'left',
    align: 'center',
    search: false,
    sorter: false,
    hideInSetting: false,
    render: (_value, _record, index) => {
      const { current, pageSize } = getPageInfo();
      return (Math.max(1, current) - 1) * Math.max(1, pageSize) + index + 1;
    },
  };
}

export function normalizeExternalQueryParams<T extends object | undefined>(
  params: T,
): T {
  if (!params) return params;
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null || value === '') return false;
      return !(Array.isArray(value) && value.length === 0);
    }),
  ) as T;
}

const AUDIT_DATE_FIELDS = new Map([
  ['createdAt', '创建日期'],
  ['updatedAt', '更新日期'],
]);
export const RELATION_SORT_KEY_PREFIX = '__sxw_relation_sort__';

function getAuditDateColumnStateKey(dataIndex: string): string {
  return `__sxw-audit-date-${dataIndex}`;
}

function createDateOnlyColumn<T extends object>(
  dataIndex: string,
  title: string,
): ProColumns<T> {
  return {
    title,
    key: getAuditDateColumnStateKey(dataIndex),
    dataIndex,
    valueType: 'date',
    search: false,
    sorter: false,
    sortable: false,
    width: 120,
  } as ProColumns<T>;
}

function getAuditField(column: ProColumns<unknown>): string | undefined {
  return typeof column.dataIndex === 'string' &&
    AUDIT_DATE_FIELDS.has(column.dataIndex)
    ? column.dataIndex
    : undefined;
}

function containsAuditDateColumn(
  columns: ProColumns<unknown>[],
  field: string,
): boolean {
  return columns.some((column) => {
    if (getAuditField(column) === field) {
      return (
        column.key === getAuditDateColumnStateKey(field) ||
        column.title === AUDIT_DATE_FIELDS.get(field)
      );
    }
    const children = column.children as ProColumns<unknown>[] | undefined;
    return children ? containsAuditDateColumn(children, field) : false;
  });
}

export function withAuditDateColumns<T extends object>(
  columns: ProColumns<T>[] | undefined,
): ProColumns<T>[] | undefined {
  if (!columns) return columns;

  const existingDateFields = new Set(
    [...AUDIT_DATE_FIELDS.keys()].filter((field) =>
      containsAuditDateColumn(columns as ProColumns<unknown>[], field),
    ),
  );
  const generatedDateFields = new Set<string>();

  const visit = (items: ProColumns<T>[]): ProColumns<T>[] => {
    const next: ProColumns<T>[] = [];
    for (const column of items) {
      const children = column.children as ProColumns<T>[] | undefined;
      const normalized = children
        ? ({ ...column, children: visit(children) } as ProColumns<T>)
        : column;
      next.push(normalized);

      const field = getAuditField(column as ProColumns<unknown>);
      if (
        field &&
        column.hideInTable !== true &&
        !existingDateFields.has(field) &&
        !generatedDateFields.has(field)
      ) {
        next.push(
          createDateOnlyColumn<T>(
            field,
            AUDIT_DATE_FIELDS.get(field) ?? '创建日期',
          ),
        );
        generatedDateFields.add(field);
      }
    }
    return next;
  };

  return visit(columns);
}

function hasConfiguredSorter(column: Record<string, unknown>): boolean {
  return Object.hasOwn(column, 'sorter');
}

function resolveServerSortPath(
  column: Record<string, unknown>,
): string | undefined {
  const dataIndex = column.dataIndex;
  if (typeof dataIndex === 'string') {
    if (!dataIndex || dataIndex.startsWith('__')) return undefined;
    return dataIndex;
  }
  if (
    Array.isArray(dataIndex) &&
    dataIndex.length > 0 &&
    dataIndex.every((segment) => typeof segment === 'string' && segment)
  ) {
    return dataIndex.join('.');
  }
  return undefined;
}

export function withServerSorters<T extends object>(
  columns: ProColumns<T>[] | undefined,
  serverSortFields?: readonly string[],
): ProColumns<T>[] | undefined {
  if (!columns) return columns;
  const allowedFields = serverSortFields ? new Set(serverSortFields) : undefined;

  return columns.map((column) => {
    const raw = column as Record<string, unknown>;
    if (Array.isArray(raw.children)) {
      return {
        ...column,
        children: withServerSorters(
          raw.children as ProColumns<T>[],
          serverSortFields,
        ) as ProColumns<T>[],
      } as ProColumns<T>;
    }
    if (raw.valueType === 'option' || raw.hideInTable === true) return column;

    const sortPath = resolveServerSortPath(raw);
    if (allowedFields && (!sortPath || !allowedFields.has(sortPath))) {
      if (!hasConfiguredSorter(raw) || raw.sorter === false) return column;
      return {
        ...column,
        sorter: false,
        sortOrder: null,
        defaultSortOrder: undefined,
      } as ProColumns<T>;
    }
    if (hasConfiguredSorter(raw) || !sortPath) return column;
    const relationPath = sortPath.includes('.');
    return {
      ...column,
      ...(relationPath && raw.key == null
        ? { key: `${RELATION_SORT_KEY_PREFIX}${sortPath}` }
        : {}),
      sorter: true,
    } as ProColumns<T>;
  });
}

export type LocalSortableColumn<T extends object> = ProColumns<T> & {
  sortValue?: (record: T) => unknown;
  sortable?: boolean;
  children?: LocalSortableColumn<T>[];
};

const SORT_COLLATOR = new Intl.Collator('zh-Hans-CN', {
  numeric: true,
  sensitivity: 'base',
});
const DATE_LIKE_PATTERN = /^\d{4}-\d{2}-\d{2}([T ]|$)/;

function toComparableTime(value: unknown): number | undefined {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? undefined : time;
  }
  if (typeof value === 'string' && DATE_LIKE_PATTERN.test(value.trim())) {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? undefined : time;
  }
  return undefined;
}

function toComparableNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function compareSortValues(left: unknown, right: unknown): number {
  const leftBlank = left === null || left === undefined || left === '';
  const rightBlank = right === null || right === undefined || right === '';
  if (leftBlank && rightBlank) return 0;
  if (leftBlank) return -1;
  if (rightBlank) return 1;
  const leftTime = toComparableTime(left);
  const rightTime = toComparableTime(right);
  if (leftTime !== undefined && rightTime !== undefined) {
    return leftTime - rightTime;
  }
  const leftNumber = toComparableNumber(left);
  const rightNumber = toComparableNumber(right);
  if (leftNumber !== undefined && rightNumber !== undefined) {
    return leftNumber - rightNumber;
  }
  return SORT_COLLATOR.compare(String(left), String(right));
}

function readByDataIndex<T extends object>(
  record: T,
  dataIndex: ProColumns<T>['dataIndex'],
): unknown {
  if (dataIndex === undefined || dataIndex === null) return undefined;
  const path = Array.isArray(dataIndex) ? dataIndex : [dataIndex];
  let current: unknown = record;
  for (const segment of path) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[String(segment)];
  }
  return current;
}

function usesRowIndex<T extends object>(columns: LocalSortableColumn<T>[]): boolean {
  return columns.some((column) => {
    if (Array.isArray(column.children)) return usesRowIndex(column.children);
    return typeof column.render === 'function' && column.render.length >= 3;
  });
}

export function withLocalSorters<T extends object>(
  columns: LocalSortableColumn<T>[] | undefined,
): ProColumns<T>[] | undefined {
  if (!columns) return columns;
  if (usesRowIndex(columns)) return columns as ProColumns<T>[];

  return columns.map((column) => {
    const { sortValue, sortable, ...rest } = column;
    const next = rest as LocalSortableColumn<T>;
    if (Array.isArray(column.children)) {
      next.children = withLocalSorters(column.children) as
        | LocalSortableColumn<T>[]
        | undefined;
      return next;
    }
    if (
      sortable === false ||
      (column.sorter !== undefined && column.sorter !== false) ||
      column.valueType === 'option'
    ) {
      return next;
    }
    const getValue =
      sortValue ??
      (column.dataIndex === undefined || column.dataIndex === null
        ? undefined
        : (record: T) => readByDataIndex(record, column.dataIndex));
    if (!getValue) return next;

    const hasDataIndex = column.dataIndex !== undefined && column.dataIndex !== null;
    const missingKey =
      !hasDataIndex && column.key == null && typeof column.title === 'string'
        ? column.title
        : undefined;
    if (!hasDataIndex && column.key == null && !missingKey) return next;
    if (missingKey) next.key = missingKey;
    next.sorter = (left: T, right: T) =>
      compareSortValues(getValue(left), getValue(right));
    return next;
  }) as ProColumns<T>[];
}
