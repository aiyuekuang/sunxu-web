import { useSyncExternalStore } from 'react';
import { safeLocalStorageSetItem } from '../utils/safeStorage';

export const TABLE_DENSITY_STORAGE_KEY = 'mes-admin:table-density';

export type TableDensityKey = 'large' | 'middle' | 'small' | 'zero';

export interface TableDensityOption {
  key: TableDensityKey;
  label: string;
  description: string;
}

export interface TableDensityTokens {
  cellPaddingBlock: number;
  cellPaddingBlockMD: number;
  cellPaddingBlockSM: number;
}

export type AntdTableSize = Exclude<TableDensityKey, 'zero'>;

export const DEFAULT_TABLE_DENSITY_KEY: TableDensityKey = 'small';

export const TABLE_DENSITY_OPTIONS: readonly TableDensityOption[] = [
  {
    key: 'large',
    label: '宽松',
    description: '较大的上下留白',
  },
  {
    key: 'middle',
    label: '中等',
    description: '适中的上下留白',
  },
  {
    key: 'small',
    label: '紧凑',
    description: '较小的上下留白',
  },
  {
    key: 'zero',
    label: '0 间距',
    description: '单元格上下内边距为 0px',
  },
] as const;

const TABLE_DENSITY_TOKENS: Record<TableDensityKey, TableDensityTokens> = {
  large: {
    cellPaddingBlock: 16,
    cellPaddingBlockMD: 12,
    cellPaddingBlockSM: 8,
  },
  middle: {
    cellPaddingBlock: 12,
    // 旧列表的中等密度为 5px 上下留白；缩略图行回到约 50px，
    // 避免 Ant Design 默认的 12px 留白把中等档放大成宽松档。
    cellPaddingBlockMD: 5,
    cellPaddingBlockSM: 5,
  },
  small: {
    cellPaddingBlock: 16,
    cellPaddingBlockMD: 8,
    cellPaddingBlockSM: 3,
  },
  zero: {
    cellPaddingBlock: 0,
    cellPaddingBlockMD: 0,
    cellPaddingBlockSM: 0,
  },
};

function isTableDensityKey(value: string | null): value is TableDensityKey {
  return TABLE_DENSITY_OPTIONS.some((option) => option.key === value);
}

function readStoredTableDensityKey(): TableDensityKey {
  try {
    const stored = localStorage.getItem(TABLE_DENSITY_STORAGE_KEY);
    if (isTableDensityKey(stored)) return stored;
  } catch {
    // localStorage 不可用时使用默认密度。
  }
  return DEFAULT_TABLE_DENSITY_KEY;
}

let currentKey = readStoredTableDensityKey();
const listeners = new Set<() => void>();

export function getTableDensityKey(): TableDensityKey {
  return currentKey;
}

export function getTableDensityTokens(
  key: TableDensityKey,
): TableDensityTokens {
  return TABLE_DENSITY_TOKENS[key];
}

export function getAntdTableSize(key: TableDensityKey): AntdTableSize {
  return key === 'zero' ? 'small' : key;
}

export function setTableDensityKey(key: TableDensityKey): void {
  if (key === currentKey) return;
  currentKey = key;
  safeLocalStorageSetItem(TABLE_DENSITY_STORAGE_KEY, key);
  listeners.forEach((listener) => {
    listener();
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTableDensityKey(): TableDensityKey {
  return useSyncExternalStore(
    subscribe,
    getTableDensityKey,
    getTableDensityKey,
  );
}
