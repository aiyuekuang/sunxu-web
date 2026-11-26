/**
 * Storage identifiers written by earlier consumers of the business components.
 * Keep them centralized so shared component APIs stay product-neutral while
 * existing table preferences remain readable and evictable.
 */
export const LEGACY_TABLE_CACHE_KEY_PREFIXES = [
  'mes-admin:table-width:',
  'mes-admin:table-sort:',
  'mes_table_width_',
  'mes_table_sort_',
  'mes_table_cols_',
] as const;

export const LEGACY_TABLE_CACHE_CAPACITY_PROBE_KEY =
  '__mes_table_cache_capacity_probe__';

export const LEGACY_TABLE_DENSITY_STORAGE_KEY = 'mes-admin:table-density';

export const LEGACY_TABLE_WIDTH_STORAGE_PREFIX = 'mes-admin:table-width:';
export const LEGACY_TABLE_SORT_STORAGE_PREFIX = 'mes-admin:table-sort:';
export const LEGACY_TABLE_WIDTH_KEY_PREFIX = 'mes_table_width_';
export const LEGACY_TABLE_SORT_KEY_PREFIX = 'mes_table_sort_';
export const LEGACY_TABLE_COLUMN_KEY_PREFIX = 'mes_table_cols_';
export const LEGACY_DOCUMENT_LINE_TABLE_WIDTH_PREFIX =
  'mes_table_width_document-line:';
