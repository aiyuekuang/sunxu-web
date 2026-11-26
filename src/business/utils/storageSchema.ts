export const TABLE_WIDTH_STORAGE_PREFIX = 'sunxu-web:table-width:';
export const TABLE_SORT_STORAGE_PREFIX = 'sunxu-web:table-sort:';
export const TABLE_WIDTH_KEY_PREFIX = 'sunxu-web:table-width:';
export const TABLE_SORT_KEY_PREFIX = 'sunxu-web:table-sort:';
export const TABLE_COLUMN_KEY_PREFIX = 'sunxu-web:table-columns:';
export const DOCUMENT_LINE_TABLE_WIDTH_PREFIX =
  `${TABLE_WIDTH_KEY_PREFIX}document-line:`;

/** Persistent preference keys owned by Sunxu Web components. */
export const TABLE_CACHE_KEY_PREFIXES = [
  TABLE_WIDTH_KEY_PREFIX,
  TABLE_SORT_KEY_PREFIX,
  TABLE_COLUMN_KEY_PREFIX,
] as const;

export const TABLE_CACHE_CAPACITY_PROBE_KEY =
  '__sunxu_web_table_cache_capacity_probe__';

export const TABLE_DENSITY_STORAGE_KEY = 'sunxu-web:table-density';

export function normalizeTableWidthStorageKey(key: string): string {
  return key.startsWith(TABLE_WIDTH_KEY_PREFIX)
    ? key
    : `${TABLE_WIDTH_KEY_PREFIX}${key}`;
}

export function normalizeTableSortStorageKey(key: string): string {
  return key.startsWith(TABLE_SORT_STORAGE_PREFIX)
    ? key
    : `${TABLE_SORT_STORAGE_PREFIX}${key}`;
}

export const PRINTING_STORAGE_KEYS = {
  dotMatrixPaper: 'sunxu-web:printing:dot-matrix-paper',
  dotMatrixPaperCustom: 'sunxu-web:printing:dot-matrix-paper-custom',
  dotMatrixCompany: 'sunxu-web:printing:dot-matrix-company',
  labelSize: 'sunxu-web:printing:label-size',
  labelSizeCustom: 'sunxu-web:printing:label-size-custom',
} as const;
