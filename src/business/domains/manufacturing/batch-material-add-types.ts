import type { MaterialPickerRecord } from '../inventory/material-table-picker-types';
import type { ReactNode } from 'react';

export interface BatchMaterialRecord extends MaterialPickerRecord {
  familyId?: string | null;
  baseType?: string | null;
  categoryId?: string | null;
  category?: string | null;
  materialCategory?: { name?: string | null } | null;
  hasBatchTracking?: boolean | null;
  shelfLifeDays?: number | null;
  family?: { defaultShelfLifeDays?: number | null } | null;
  traceabilityMode?: string | null;
  procurementType?: string | null;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface BatchMaterialAddButtonProps<
  TRow,
  TMaterial extends BatchMaterialRecord = BatchMaterialRecord,
> {
  rows: TRow[];
  onRowsChange: (rows: TRow[]) => void;
  createRow: (material: TMaterial, quantity: number) => TRow;
  getMaterialId: (row: TRow) => string | undefined;
  isEmptyRow: (row: TRow) => boolean;
  onAdded?: (
    addedRows: TRow[],
    materials: TMaterial[],
    nextRows: TRow[],
  ) => void;
  disabled?: boolean;
  label?: string;
  title?: string;
  quantityLabel?: string;
  maxRows?: number;
  requestParams?: object;
  customerId?: string;
  trigger?: ReactNode;
}
