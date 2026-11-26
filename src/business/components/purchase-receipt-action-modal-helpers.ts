export type DocumentLineWarehouseSource = 'header' | 'material' | 'manual';

type DefaultWarehouseLine = {
  warehouseId?: string;
  warehouseName?: string;
  warehouseSource?: DocumentLineWarehouseSource;
};

type InheritedWarehouse = Pick<
  DefaultWarehouseLine,
  'warehouseId' | 'warehouseName' | 'warehouseSource'
>;

type WarehouseDependentLine = DefaultWarehouseLine & {
  batchNo?: string;
  productionDate?: string;
  expiryDate?: string;
  locationId?: string;
  storageLocation?: string;
};

export function applyManualWarehousePatch<T extends WarehouseDependentLine>(
  row: T,
  patch: Partial<T>,
): Partial<T> {
  if (!Object.hasOwn(patch, 'warehouseId')) return patch;
  const warehouseChanged = row.warehouseId !== patch.warehouseId;

  return {
    ...patch,
    warehouseName: Object.hasOwn(patch, 'warehouseName')
      ? patch.warehouseName
      : warehouseChanged
        ? undefined
        : row.warehouseName,
    warehouseSource: patch.warehouseSource ?? 'manual',
    ...(warehouseChanged && !Object.hasOwn(patch, 'batchNo')
      ? { batchNo: '' }
      : {}),
    ...(warehouseChanged && !Object.hasOwn(patch, 'productionDate')
      ? { productionDate: undefined }
      : {}),
    ...(warehouseChanged && !Object.hasOwn(patch, 'expiryDate')
      ? { expiryDate: undefined }
      : {}),
    ...(warehouseChanged && !Object.hasOwn(patch, 'locationId')
      ? { locationId: undefined, storageLocation: undefined }
      : {}),
  };
}

export function applyResolvedWarehouseToInheritedLines<
  T extends DefaultWarehouseLine,
>(
  rows: readonly T[],
  resolveWarehouse: (row: T) => InheritedWarehouse,
  clearWarehouseDependents: (row: T) => Partial<T>,
): T[] {
  return rows.map((row) => {
    if (row.warehouseSource === 'manual') return row;
    const nextWarehouse = resolveWarehouse(row);
    const warehouseChanged = row.warehouseId !== nextWarehouse.warehouseId;
    return {
      ...row,
      ...(warehouseChanged ? clearWarehouseDependents(row) : {}),
      ...nextWarehouse,
    };
  });
}

export function applyDefaultWarehouseToInheritedLines<
  T extends DefaultWarehouseLine,
>(
  rows: readonly T[],
  defaultWarehouseId: string,
  clearWarehouseDependents: (row: T) => Partial<T>,
): T[] {
  return applyResolvedWarehouseToInheritedLines(
    rows,
    () => ({
      warehouseId: defaultWarehouseId,
      warehouseName: undefined,
      warehouseSource: 'header',
    }),
    clearWarehouseDependents,
  );
}

export interface MaterialBatchRequirementSource {
  hasBatchTracking?: boolean | null;
  shelfLifeDays?: number | string | null;
  family?: { defaultShelfLifeDays?: number | string | null } | null;
}

export function getEffectiveMaterialShelfLifeDays(
  material?: MaterialBatchRequirementSource | null,
): number {
  const shelfLifeDays = Number(
    material?.shelfLifeDays ?? material?.family?.defaultShelfLifeDays ?? 0,
  );
  return Number.isFinite(shelfLifeDays) && shelfLifeDays > 0 ? shelfLifeDays : 0;
}

export function requiresMaterialBatchNo(
  material?: MaterialBatchRequirementSource | null,
): boolean {
  return Boolean(material?.hasBatchTracking) || getEffectiveMaterialShelfLifeDays(material) > 0;
}

export type ReceiptWarehouseFamily =
  | 'raw_material'
  | 'wip'
  | 'finished_goods'
  | 'general'
  | 'line_side'
  | 'defective';

const primaryReceiptWarehouseFamilyByMaterialType: Record<string, ReceiptWarehouseFamily> = {
  raw: 'raw_material',
  semi: 'wip',
  finished: 'finished_goods',
};

export function getReceiptWarehouseFamiliesByMaterialType(
  materialType?: string | null,
): ReceiptWarehouseFamily[] {
  const normalizedType = materialType?.trim().toLowerCase() ?? '';
  const primaryFamily = primaryReceiptWarehouseFamilyByMaterialType[normalizedType] ?? 'finished_goods';
  return [...new Set<ReceiptWarehouseFamily>([primaryFamily, 'general'])];
}

export function getBatchReceiptWarehouseFamiliesByMaterialTypes(
  materialTypes: Array<string | null | undefined>,
): ReceiptWarehouseFamily[] {
  if (materialTypes.length === 0) return getReceiptWarehouseFamiliesByMaterialType();
  const [firstFamilies, ...restFamilies] = materialTypes.map(getReceiptWarehouseFamiliesByMaterialType);
  return firstFamilies.filter((family) => restFamilies.every((families) => families.includes(family)));
}

export function formatReceiptQuantity(
  value?: number | string | null,
  unit?: string | null,
): string {
  if (value === undefined || value === null || value === '') return '-';
  const number = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(number)) return '-';
  const formatted = number.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
  return unit ? `${formatted} ${unit}` : formatted;
}

export function normalizeReceiptDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value.slice(0, 10) || undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof value === 'object' && value !== null && 'format' in value) {
    const formatter = value.format;
    if (typeof formatter === 'function') {
      const formatted = formatter.call(value, 'YYYY-MM-DD');
      return typeof formatted === 'string' ? formatted : undefined;
    }
  }
  return undefined;
}
