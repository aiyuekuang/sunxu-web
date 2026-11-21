import type {
  GridCellSchema,
  GridCellStyle,
  GridColumnSchema,
  GridDetailBandSchema,
  GridDetailColumnSchema,
  GridDetailSummarySchema,
  GridDetailTableRegionSchema,
  GridPrintTemplateSchema,
  GridRowSchema,
} from './schema';
import type { GridDesignerField } from './types';

const DEFAULT_GRID_COLUMNS = [16, 28, 34, 34, 20, 20, 18, 20];
const DEFAULT_PRINTABLE_WIDTH_MM = 190;
const DEFAULT_DETAIL_MAX_ROWS = 14;
const DEFAULT_DETAIL_ROW_HEIGHT_MM = 9;
const DEFAULT_DETAIL_COLUMN_LIMIT = 8;

const DEFAULT_DETAIL_FIELD_PRIORITY = [
  'customerMaterialCode',
  'quotationItemName',
  'customerMaterialSpec',
  'materialCode',
  'materialName',
  'materialSpec',
  'imageUrl',
  'unitLabel',
  'unit',
  'qty',
  'requiredQty',
  'plannedQty',
  'actualQty',
  'unitPrice',
  'amount',
  'receivedQty',
  'acceptedQty',
  'rejectedQty',
  'batchNo',
  'warehouseLocationPath',
  'supplierName',
  'remarks',
];

const DEFAULT_DETAIL_FIELD_WIDTHS: Record<string, number> = {
  materialCode: 22,
  materialName: 34,
  materialSpec: 30,
  unit: 14,
  unitLabel: 14,
  qty: 16,
  requiredQty: 18,
  plannedQty: 18,
  actualQty: 18,
  unitPrice: 18,
  amount: 20,
  receivedQty: 18,
  acceptedQty: 18,
  rejectedQty: 18,
  batchNo: 22,
  warehouseLocationPath: 28,
  supplierName: 28,
  remarks: 24,
  customerMaterialCode: 22,
  quotationItemName: 34,
  customerMaterialSpec: 24,
  imageUrl: 20,
};

const DEFAULT_DETAIL_SUMMARY_LABELS: Record<string, string> = {
  qty: '数量合计',
  actualQty: '数量合计',
  receivedQty: '收货合计',
  acceptedQty: '合格合计',
  rejectedQty: '拒收合计',
  amount: '金额合计',
};

function noBorderStyle(style: Omit<GridCellStyle, 'border'>): GridCellStyle {
  return {
    ...style,
    border: { top: false, right: false, bottom: false, left: false },
  };
}

export type GridTemplatePreset =
  | 'standard_table'
  | 'compact_table'
  | 'header_qr_table'
  | 'report_with_summary'
  | 'compact_single'
  | 'three_copy'
  | 'delivery_stub'
  | 'warehouse_handover';

export interface GridTemplatePresetOption {
  label: string;
  value: GridTemplatePreset;
  description: string;
}

type NormalizableGridPrintTemplateSchema = Omit<
  GridPrintTemplateSchema,
  'schemaVersion'
> & {
  schemaVersion: '2.0' | '3.0';
};

const DOCUMENT_GRID_PRESETS: GridTemplatePresetOption[] = [
  {
    label: '标准明细单',
    value: 'standard_table',
    description: '页眉字段、明细表和签收区，适合常规 A4 单据。',
  },
  {
    label: '紧凑明细单',
    value: 'compact_table',
    description: '更多明细行，适合仓库和采购流转单。',
  },
  {
    label: '右上二维码单据',
    value: 'header_qr_table',
    description: '右上角放单据码，方便扫码追溯。',
  },
  {
    label: '报告说明单',
    value: 'report_with_summary',
    description: '明细后保留说明区和制单/审核签名。',
  },
];

const CONTINUOUS_GRID_PRESETS: GridTemplatePresetOption[] = [
  {
    label: '单联紧凑',
    value: 'compact_single',
    description: '单联连续纸，紧凑表格。',
  },
  {
    label: '三联连续纸',
    value: 'three_copy',
    description: '客户联、仓库联、财务联分联打印。',
  },
  {
    label: '送货签收联',
    value: 'delivery_stub',
    description: '突出收货信息和签收确认。',
  },
  {
    label: '仓库交接联',
    value: 'warehouse_handover',
    description: '突出物料、数量和交接确认。',
  },
];

export function gridPresetOptionsForTemplateType(
  templateType: 'document_flow' | 'continuous_fixed',
): GridTemplatePresetOption[] {
  return templateType === 'continuous_fixed'
    ? CONTINUOUS_GRID_PRESETS
    : DOCUMENT_GRID_PRESETS;
}

export function defaultGridPresetForTemplateType(
  templateType: 'document_flow' | 'continuous_fixed',
): GridTemplatePreset {
  return templateType === 'continuous_fixed' ? 'three_copy' : 'standard_table';
}

function scalarFieldCell(
  id: string,
  row: number,
  col: number,
  colSpan: number,
  label: string,
  fieldPath: string,
): GridCellSchema {
  return {
    id,
    row,
    col,
    colSpan,
    content: {
      type: 'field_label_value',
      label: `${label}: `,
      fieldPath,
    },
    style: noBorderStyle({ verticalAlign: 'middle' }),
  };
}

function copyMarkCell(): GridCellSchema {
  return {
    id: 'copy_mark',
    row: 1,
    col: 1,
    colSpan: 2,
    content: { type: 'copy_mark' },
    style: {
      ...noBorderStyle({}),
      fontWeight: 'bold',
      textAlign: 'center',
      verticalAlign: 'middle',
    },
  };
}

function titleCell(
  text: string,
  col: number,
  colSpan: number,
  fontSize = 22,
): GridCellSchema {
  return {
    id: 'title',
    row: 1,
    col,
    colSpan,
    content: {
      type: 'static_text',
      text,
    },
    style: {
      ...noBorderStyle({}),
      fontSize,
      fontWeight: 'bold',
      textAlign: 'center',
      verticalAlign: 'middle',
    },
  };
}

function signatureCell(
  id: string,
  row: number,
  col: number,
  colSpan: number,
  label: string,
): GridCellSchema {
  return {
    id,
    row,
    col,
    colSpan,
    rowSpan: 2,
    content: { type: 'signature_box', label },
    style: noBorderStyle({ textAlign: 'center', verticalAlign: 'bottom' }),
  };
}

function textCell(
  id: string,
  row: number,
  col: number,
  colSpan: number,
  text: string,
): GridCellSchema {
  return {
    id,
    row,
    col,
    colSpan,
    rowSpan: 2,
    content: { type: 'static_text', text },
    style: noBorderStyle({ verticalAlign: 'top' }),
  };
}

function preferredCodeField(
  fields: GridDesignerField[],
): string | undefined {
  const scalarFields = fields.filter(
    (field) => field.visible && !field.isArray,
  );
  return (
    scalarFields.find((field) => field.fieldPath === 'docNo')?.fieldPath ??
    scalarFields.find((field) => field.fieldPath === 'barcode')?.fieldPath ??
    scalarFields.find((field) => field.fieldPath === 'code')?.fieldPath ??
    scalarFields.find((field) => field.fieldType === 'string')?.fieldPath
  );
}

function codeCell(
  id: string,
  row: number,
  col: number,
  rowSpan: number,
  fields: GridDesignerField[],
): GridCellSchema {
  const fieldPath = preferredCodeField(fields);
  return {
    id,
    row,
    col,
    rowSpan,
    colSpan: 2,
    content: fieldPath
      ? { type: 'qrcode', fieldPath }
      : { type: 'qrcode', text: '{{docNo}}' },
    style: noBorderStyle({ textAlign: 'center', verticalAlign: 'middle' }),
  };
}

function buildRows(count: number, firstHeight = 12, normalHeight = 8) {
  return Array.from({ length: count }, (_, index) => ({
    key: `${index + 1}`,
    heightMm: index === 0 ? firstHeight : normalHeight,
  }));
}

function sumWidths(widths: number[]): number {
  return widths.reduce((sum, width) => sum + width, 0);
}

function fitColumnWidthsToTotal(
  widths: number[],
  targetWidthMm = DEFAULT_PRINTABLE_WIDTH_MM,
): number[] {
  if (widths.length === 0) return [];
  const safeWidths = widths.map((width) =>
    Number.isFinite(width) && width > 0 ? width : 20,
  );
  const total = sumWidths(safeWidths);
  if (total <= 0 || targetWidthMm <= 0) return safeWidths;
  const scale = targetWidthMm / total;
  const fitted = safeWidths.map((width) =>
    Math.max(4, Math.round(width * scale * 10) / 10),
  );
  const diff = Math.round((targetWidthMm - sumWidths(fitted)) * 10) / 10;
  fitted[fitted.length - 1] = Math.max(
    4,
    Math.round((fitted[fitted.length - 1] + diff) * 10) / 10,
  );
  return fitted;
}

function buildColumns(
  widths = DEFAULT_GRID_COLUMNS,
  targetWidthMm = DEFAULT_PRINTABLE_WIDTH_MM,
) {
  return fitColumnWidthsToTotal(widths, targetWidthMm).map(
    (widthMm, index) => ({
      key: String.fromCharCode(65 + index),
      widthMm,
    }),
  );
}

function gridColumnKey(index: number): string {
  return String.fromCharCode(65 + index);
}

function headerCells(
  fields: GridDesignerField[],
  slots: Array<{ row: number; col: number; colSpan: number }>,
): GridCellSchema[] {
  return defaultScalarFields(fields, slots.length).flatMap((field, index) => {
    const slot = slots[index];
    return slot
      ? [
          scalarFieldCell(
            `header_${index + 1}`,
            slot.row,
            slot.col,
            slot.colSpan,
            field.fieldLabel,
            field.fieldPath,
          ),
        ]
      : [];
  });
}

function defaultScalarFields(fields: GridDesignerField[], limit: number) {
  const scalarFields = fields.filter(
    (field) => field.visible && !field.isArray,
  );
  const selected = [
    ...scalarFields.filter((field) => field.requiredInTemplate),
    ...scalarFields,
  ];
  return Array.from(
    new Map(selected.map((field) => [field.fieldPath, field])).values(),
  ).slice(0, limit);
}

export function arrayRootOfFieldPath(fieldPath?: string): string | undefined {
  const matched = fieldPath?.match(/^([A-Za-z0-9_]+)\[\]\./);
  return matched?.[1];
}

export function arrayRootsFromFields(
  fields: GridDesignerField[],
): string[] {
  const roots = fields
    .filter((field) => field.visible && field.isArray)
    .map((field) => arrayRootOfFieldPath(field.fieldPath))
    .filter((root): root is string => Boolean(root));
  return Array.from(new Set(roots));
}

export function defaultArrayRoot(fields: GridDesignerField[]): string {
  const roots = arrayRootsFromFields(fields);
  return roots.includes('items') ? 'items' : (roots[0] ?? 'items');
}

export function defaultDetailColumns(
  fields: GridDesignerField[],
  arrayRoot = defaultArrayRoot(fields),
): GridDetailColumnSchema[] {
  const availableFields = fields.filter(
    (field) =>
      field.visible &&
      field.isArray &&
      arrayRootOfFieldPath(field.fieldPath) === arrayRoot,
  );
  const requiredFields = availableFields.filter(
    (field) => field.requiredInTemplate,
  );
  const prioritizedFields = [...availableFields].sort(
    (left, right) =>
      detailFieldPriority(left) - detailFieldPriority(right) ||
      availableFields.indexOf(left) - availableFields.indexOf(right),
  );
  const selectedLimit = Math.max(
    DEFAULT_DETAIL_COLUMN_LIMIT,
    requiredFields.length,
  );
  const unique = Array.from(
    new Map(
      [...requiredFields, ...prioritizedFields].map((field) => [
        field.fieldPath,
        field,
      ]),
    ).values(),
  ).slice(0, selectedLimit);
  return [
    { title: '序号', type: 'row_index', widthMm: 10 },
    ...unique.map((field) => ({
      title: field.fieldLabel,
      type: 'field' as const,
      fieldPath: field.fieldPath,
      widthMm: defaultDetailColumnWidth(field),
      ...(field.formatType ? { formatType: field.formatType } : {}),
      ...detailDisplayForField(field),
    })),
  ];
}

function buildPresetColumns(
  fields: GridDesignerField[],
  arrayRoot: string,
  baseWidths = DEFAULT_GRID_COLUMNS,
): GridColumnSchema[] {
  const detailColumns = defaultDetailColumns(fields, arrayRoot);
  const widths =
    detailColumns.length > baseWidths.length
      ? detailColumns.map((column) => column.widthMm ?? 20)
      : baseWidths;
  return buildColumns(widths);
}

function detailFieldKey(fieldPath: string): string {
  return fieldPath.replace(/^[A-Za-z0-9_]+\[\]\./, '');
}

function detailDisplayForField(
  field: GridDesignerField,
): Pick<GridDetailColumnSchema, 'display'> {
  return field.formatType === 'image' ? { display: 'image' } : {};
}

function detailFieldPriority(field: GridDesignerField): number {
  const key = detailFieldKey(field.fieldPath);
  const index = DEFAULT_DETAIL_FIELD_PRIORITY.indexOf(key);
  return index >= 0 ? index : DEFAULT_DETAIL_FIELD_PRIORITY.length;
}

export function defaultDetailColumnWidth(field: GridDesignerField): number {
  const width = DEFAULT_DETAIL_FIELD_WIDTHS[detailFieldKey(field.fieldPath)];
  if (width) return width;
  if (field.fieldType === 'number') return 18;
  if (field.fieldType === 'date') return 24;
  if (field.fieldType === 'boolean') return 16;
  return Math.min(42, Math.max(24, field.fieldLabel.length * 4 + 12));
}

export function detailColumnFromField(
  field: GridDesignerField,
): GridDetailColumnSchema {
  return {
    title: field.fieldLabel,
    type: 'field',
    fieldPath: field.fieldPath,
    widthMm: defaultDetailColumnWidth(field),
    ...(field.formatType ? { formatType: field.formatType } : {}),
    ...detailDisplayForField(field),
  };
}

export function detailFieldsForArrayRoot(
  fields: GridDesignerField[],
  arrayRoot: string,
): GridDesignerField[] {
  return fields.filter(
    (field) =>
      field.visible &&
      field.isArray &&
      arrayRootOfFieldPath(field.fieldPath) === arrayRoot,
  );
}

export function detailSummaryForColumns(
  detailColumns: GridDetailColumnSchema[],
  currentSummary?: GridDetailSummarySchema[],
  options?: { includeDefaults?: boolean },
): GridDetailSummarySchema[] | undefined {
  const availableFieldPaths = new Set(
    detailColumns
      .map((column) => column.fieldPath)
      .filter((fieldPath): fieldPath is string => Boolean(fieldPath)),
  );
  const currentByFieldPath = new Map(
    (currentSummary ?? [])
      .filter((item) => availableFieldPaths.has(item.fieldPath))
      .map((item) => [item.fieldPath, item]),
  );
  const nextSummary = detailColumns.flatMap((column) => {
    if (!column.fieldPath) return [];
    const current = currentByFieldPath.get(column.fieldPath);
    if (current) return [current];
    if (!options?.includeDefaults) return [];
    const label =
      DEFAULT_DETAIL_SUMMARY_LABELS[detailFieldKey(column.fieldPath)];
    return label
      ? [
          {
            label,
            fieldPath: column.fieldPath,
            aggregate: 'sum' as const,
            ...(column.formatType ? { formatType: column.formatType } : {}),
          },
        ]
      : [];
  });
  return nextSummary.length > 0 ? nextSummary : undefined;
}

export function buildDefaultDetailRegion(
  id: string,
  fields: GridDesignerField[],
  arrayRoot: string,
  placement?: Partial<
    Pick<
      GridDetailTableRegionSchema,
      'startRow' | 'startCol' | 'colSpan' | 'maxRowsPerPage'
    >
  >,
): GridDetailTableRegionSchema {
  const detailColumns = defaultDetailColumns(fields, arrayRoot);
  return {
    id,
    type: 'detail_table',
    dataSource: `${arrayRoot}[]`,
    startRow: placement?.startRow ?? 6,
    startCol: placement?.startCol ?? 1,
    colSpan: placement?.colSpan ?? DEFAULT_GRID_COLUMNS.length,
    rowHeightMm: DEFAULT_DETAIL_ROW_HEIGHT_MM,
    minRows: 0,
    maxRowsPerPage: placement?.maxRowsPerPage ?? DEFAULT_DETAIL_MAX_ROWS,
    repeatHeader: true,
    overflow: 'continue_next_page',
    columns: detailColumns,
    summary: detailSummaryForColumns(detailColumns, undefined, {
      includeDefaults: true,
    }),
  };
}

function distributeSpans(columnCount: number, availableSpan: number): number[] {
  if (columnCount <= 0) return [];
  const spans: number[] = [];
  let remainingSpan = Math.max(1, availableSpan);
  let remainingColumns = columnCount;
  for (let index = 0; index < columnCount; index += 1) {
    const span =
      index === columnCount - 1
        ? remainingSpan
        : Math.max(1, Math.floor(remainingSpan / remainingColumns));
    spans.push(span);
    remainingSpan -= span;
    remainingColumns -= 1;
  }
  return spans;
}

function splitColumnSlots(
  columnCount: number,
  partCount: number,
): Array<{ col: number; colSpan: number }> {
  const spans = distributeSpans(partCount, columnCount);
  let col = 1;
  return spans.map((colSpan) => {
    const slot = { col, colSpan };
    col += colSpan;
    return slot;
  });
}

function twoColumnHeaderSlots(
  rows: number[],
  columnCount: number,
): Array<{ row: number; col: number; colSpan: number }> {
  return rows.flatMap((row) =>
    splitColumnSlots(columnCount, 2).map((slot) => ({ row, ...slot })),
  );
}

function signatureCells(
  row: number,
  columnCount: number,
  configs: Array<{ id: string; label: string }>,
): GridCellSchema[] {
  return splitColumnSlots(columnCount, configs.length).map((slot, index) =>
    signatureCell(
      configs[index].id,
      row,
      slot.col,
      slot.colSpan,
      configs[index].label,
    ),
  );
}

function legacyRegionColSpan(
  schema: NormalizableGridPrintTemplateSchema,
  region: GridDetailTableRegionSchema,
): number {
  return (
    region.colSpan ??
    Math.max(1, schema.grid.columns.length - region.startCol + 1)
  );
}

function minimumRegionColSpan(
  schema: NormalizableGridPrintTemplateSchema,
  region: GridDetailTableRegionSchema,
): number {
  return Math.max(
    legacyRegionColSpan(schema, region),
    region.columns.length,
    region.summary?.length ?? 0,
  );
}

function ensureColumnsForLegacyRegions(
  schema: NormalizableGridPrintTemplateSchema,
): NormalizableGridPrintTemplateSchema {
  const regions = schema.grid.regions ?? [];
  if (regions.length === 0) return schema;
  const requiredColumnCount = regions.reduce((maxCount, region) => {
    const requiredByRegion =
      region.startCol + minimumRegionColSpan(schema, region) - 1;
    return Math.max(maxCount, requiredByRegion);
  }, schema.grid.columns.length);
  if (requiredColumnCount <= schema.grid.columns.length) return schema;

  const columns = [...schema.grid.columns];
  while (columns.length < requiredColumnCount) {
    const widthMm =
      DEFAULT_GRID_COLUMNS[columns.length] ??
      columns[columns.length - 1]?.widthMm ??
      20;
    columns.push({
      key: gridColumnKey(columns.length),
      widthMm,
    });
  }
  return {
    ...schema,
    grid: {
      ...schema.grid,
      columns,
    },
  };
}

function detailHeaderCell(
  id: string,
  row: number,
  col: number,
  colSpan: number,
  text: string,
  printScope?: GridCellSchema['printScope'],
): GridCellSchema {
  return {
    id,
    row,
    col,
    colSpan,
    printScope,
    content: { type: 'static_text', text },
    style: {
      border: { top: true, right: true, bottom: true, left: true },
      fontWeight: 'bold',
      textAlign: 'center',
      verticalAlign: 'middle',
    },
  };
}

function detailBodyCell(
  id: string,
  row: number,
  col: number,
  colSpan: number,
  column: GridDetailColumnSchema,
): GridCellSchema {
  const content: GridCellSchema['content'] =
    column.type === 'row_index'
      ? { type: 'detail_row_index' }
      : column.type === 'static_text'
        ? { type: 'static_text', text: column.text ?? '' }
        : column.display === 'image'
          ? {
              type: 'image',
              fieldPath: column.fieldPath,
              ...(column.formatType ? { formatType: column.formatType } : {}),
            }
          : {
              type: 'field',
              fieldPath: column.fieldPath,
              ...(column.formatType ? { formatType: column.formatType } : {}),
            };
  return {
    id,
    row,
    col,
    colSpan,
    content,
    style: {
      border: { top: true, right: true, bottom: true, left: true },
      verticalAlign: 'middle',
    },
  };
}

function aggregateCell(
  id: string,
  row: number,
  col: number,
  colSpan: number,
  summary: GridDetailSummarySchema,
): GridCellSchema {
  return {
    id,
    row,
    col,
    colSpan,
    printScope: 'last_page',
    content: {
      type: 'aggregate_field',
      label: `${summary.label}: `,
      fieldPath: summary.fieldPath,
      aggregate: summary.aggregate,
      ...(summary.formatType ? { formatType: summary.formatType } : {}),
    },
    style: {
      border: { top: true, right: true, bottom: true, left: true },
      fontWeight: 'bold',
      verticalAlign: 'middle',
    },
  };
}

function shiftedRow(
  row: number,
  shifts: Array<{ afterRow: number; amount: number }>,
): number {
  return shifts.reduce(
    (current, shift) =>
      row > shift.afterRow ? current - shift.amount : current,
    row,
  );
}

function ensureColumnsForDetailSpan(
  columns: GridColumnSchema[],
  requiredColumnCount: number,
): GridColumnSchema[] {
  if (requiredColumnCount <= columns.length) return columns;
  const nextColumns = [...columns];
  while (nextColumns.length < requiredColumnCount) {
    const widthMm =
      DEFAULT_GRID_COLUMNS[nextColumns.length] ??
      nextColumns[nextColumns.length - 1]?.widthMm ??
      20;
    nextColumns.push({
      key: gridColumnKey(nextColumns.length),
      widthMm,
    });
  }
  return nextColumns;
}

function positiveInteger(value: unknown): number | undefined {
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : NaN;
  return Number.isInteger(numeric) && numeric > 0 ? numeric : undefined;
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function normalizeRowsForRequiredCount(
  rows: GridRowSchema[],
  requiredCount: number,
): GridRowSchema[] {
  const count = Math.max(1, requiredCount);
  const sourceRows = rows.length > 0 ? rows : buildRows(1, 8, 8);
  return Array.from({ length: count }, (_, index) => {
    const source = sourceRows[Math.min(index, sourceRows.length - 1)];
    return {
      ...source,
      key: `${index + 1}`,
      heightMm: positiveNumber(source.heightMm, 8),
    };
  });
}

function normalizeColumnsForRequiredCount(
  columns: GridColumnSchema[],
  requiredCount: number,
): GridColumnSchema[] {
  const count = Math.max(1, requiredCount);
  const sourceColumns =
    columns.length > 0
      ? columns
      : buildColumns(DEFAULT_GRID_COLUMNS.slice(0, 1));
  return Array.from({ length: count }, (_, index) => {
    const source = sourceColumns[Math.min(index, sourceColumns.length - 1)];
    const isExistingColumn = index < columns.length;
    return {
      ...source,
      key: isExistingColumn && source.key ? source.key : gridColumnKey(index),
      widthMm: positiveNumber(
        source.widthMm,
        DEFAULT_GRID_COLUMNS[index] ??
          sourceColumns[sourceColumns.length - 1]?.widthMm ??
          20,
      ),
    };
  });
}

function occupiedGridRows(
  cells: GridCellSchema[],
  detailBands: GridDetailBandSchema[],
): Set<number> {
  const rows = new Set<number>();
  cells.forEach((cell) => {
    const row = positiveInteger(cell.row) ?? 1;
    const rowSpan = positiveInteger(cell.rowSpan) ?? 1;
    for (let current = row; current < row + rowSpan; current += 1) {
      rows.add(current);
    }
  });
  detailBands.forEach((band) => {
    rows.add(positiveInteger(band.row) ?? 1);
  });
  return rows;
}

function maxGridContentRow(
  cells: GridCellSchema[],
  detailBands: GridDetailBandSchema[],
): number {
  const cellMax = cells.reduce((max, cell) => {
    const row = positiveInteger(cell.row) ?? 1;
    const rowSpan = positiveInteger(cell.rowSpan) ?? 1;
    return Math.max(max, row + rowSpan - 1);
  }, 1);
  return detailBands.reduce(
    (max, band) => Math.max(max, positiveInteger(band.row) ?? 1),
    cellMax,
  );
}

function shiftGridCellsAfterRange(
  cells: GridCellSchema[],
  removeEnd: number,
  removeCount: number,
): GridCellSchema[] {
  return cells.map((cell) =>
    cell.row > removeEnd ? { ...cell, row: cell.row - removeCount } : cell,
  );
}

function shiftDetailBandsAfterRange(
  detailBands: GridDetailBandSchema[],
  removeEnd: number,
  removeCount: number,
): GridDetailBandSchema[] {
  return detailBands.map((band) =>
    band.row > removeEnd ? { ...band, row: band.row - removeCount } : band,
  );
}

function compactGridDetailReservedRows(
  schema: GridPrintTemplateSchema,
): GridPrintTemplateSchema {
  if (!schema.grid.detailBands?.length) {
    return schema;
  }

  let rows = [...schema.grid.rows];
  let cells = [...schema.grid.cells];
  let detailBands = [...schema.grid.detailBands];
  let changed = false;

  for (;;) {
    let removedInPass = false;
    const sortedBands = [...detailBands].sort((left, right) => {
      return left.row - right.row;
    });

    for (const band of sortedBands) {
      const occupied = occupiedGridRows(cells, detailBands);
      const maxRow = Math.max(
        rows.length,
        maxGridContentRow(cells, detailBands),
      );
      let detailBlockEnd = band.row;
      while (detailBlockEnd < maxRow && occupied.has(detailBlockEnd + 1)) {
        detailBlockEnd += 1;
      }

      const removeStart = detailBlockEnd + 1;
      let nextOccupiedRow: number | undefined;
      for (let row = removeStart; row <= maxRow; row += 1) {
        if (occupied.has(row)) {
          nextOccupiedRow = row;
          break;
        }
      }
      if (!nextOccupiedRow) {
        continue;
      }

      const removeEnd = nextOccupiedRow - 1;
      if (removeEnd < removeStart) {
        continue;
      }

      const removeCount = removeEnd - removeStart + 1;
      rows = rows.filter((_, index) => {
        const row = index + 1;
        return row < removeStart || row > removeEnd;
      });
      cells = shiftGridCellsAfterRange(cells, removeEnd, removeCount);
      detailBands = shiftDetailBandsAfterRange(
        detailBands,
        removeEnd,
        removeCount,
      );
      changed = true;
      removedInPass = true;
      break;
    }

    if (!removedInPass) break;
  }

  const contentRowCount = maxGridContentRow(cells, detailBands);
  if (changed && rows.length > contentRowCount) {
    rows = rows.slice(0, contentRowCount);
  }

  if (!changed) {
    return schema;
  }

  return {
    ...schema,
    grid: {
      ...schema.grid,
      rows: normalizeRowsForRequiredCount(rows, contentRowCount),
      cells,
      detailBands,
    },
  };
}

function normalizeExistingGridCells(
  schema: GridPrintTemplateSchema,
): GridPrintTemplateSchema {
  let requiredRowCount = Math.max(1, schema.grid.rows.length);
  let requiredColumnCount = Math.max(1, schema.grid.columns.length);

  const cells = schema.grid.cells.map((cell) => {
    const row = positiveInteger(cell.row) ?? 1;
    const col = positiveInteger(cell.col) ?? 1;
    const rowSpan = positiveInteger(cell.rowSpan) ?? 1;
    const colSpan = positiveInteger(cell.colSpan) ?? 1;
    requiredRowCount = Math.max(requiredRowCount, row + rowSpan - 1);
    requiredColumnCount = Math.max(requiredColumnCount, col + colSpan - 1);
    return {
      ...cell,
      row,
      col,
      rowSpan,
      colSpan,
    };
  });

  const detailBands = schema.grid.detailBands?.map((band) => {
    const row = positiveInteger(band.row) ?? 1;
    const maxRowsPerPage =
      positiveInteger(band.maxRowsPerPage) ?? DEFAULT_DETAIL_MAX_ROWS;
    requiredRowCount = Math.max(requiredRowCount, row);
    return {
      ...band,
      row,
      minRows: 0,
      maxRowsPerPage,
    };
  });

  return compactGridDetailReservedRows({
    ...schema,
    grid: {
      ...schema.grid,
      rows: normalizeRowsForRequiredCount(schema.grid.rows, requiredRowCount),
      columns: normalizeColumnsForRequiredCount(
        schema.grid.columns,
        requiredColumnCount,
      ),
      cells,
      detailBands,
      regions: undefined,
    },
  });
}

function buildGridWithDefaultDetailBand(options: {
  columns: GridColumnSchema[];
  rows: GridRowSchema[];
  cells: GridCellSchema[];
  fields: GridDesignerField[];
  arrayRoot: string;
  detailId: string;
  startRow: number;
  startCol?: number;
  colSpan?: number;
  maxRowsPerPage: number;
  overflow?: GridDetailBandSchema['overflow'];
}): GridPrintTemplateSchema['grid'] {
  const detailColumns = defaultDetailColumns(options.fields, options.arrayRoot);
  const summary = detailSummaryForColumns(detailColumns, undefined, {
    includeDefaults: true,
  });
  const startCol = options.startCol ?? 1;
  const availableSpan = options.columns.length - startCol + 1;
  const colSpan = Math.max(
    options.colSpan ?? availableSpan,
    detailColumns.length,
    summary?.length ?? 0,
  );
  const columns = ensureColumnsForDetailSpan(
    options.columns,
    startCol + colSpan - 1,
  );
  const headerRow = options.startRow;
  const detailRow = headerRow + 1;
  const summaryRow = summary?.length ? headerRow + 2 : undefined;
  const oldSpan = options.maxRowsPerPage + 2;
  const newSpan = summaryRow ? 3 : 2;
  const shiftAmount = Math.max(0, oldSpan - newSpan);
  const shifts =
    shiftAmount > 0
      ? [{ afterRow: options.startRow + oldSpan - 1, amount: shiftAmount }]
      : [];
  const generatedCells: GridCellSchema[] = [];
  const spans = distributeSpans(detailColumns.length, colSpan);
  let currentCol = startCol;

  detailColumns.forEach((column, index) => {
    const span = spans[index] ?? 1;
    generatedCells.push(
      detailHeaderCell(
        `${options.detailId}_header_${index + 1}`,
        headerRow,
        currentCol,
        span,
        column.title,
      ),
    );
    generatedCells.push(
      detailBodyCell(
        `${options.detailId}_detail_${index + 1}`,
        detailRow,
        currentCol,
        span,
        column,
      ),
    );
    currentCol += span;
  });

  if (summaryRow && summary?.length) {
    const summarySpans = distributeSpans(summary.length, colSpan);
    let summaryCol = startCol;
    summary.forEach((item, index) => {
      const span = summarySpans[index] ?? 1;
      generatedCells.push(
        aggregateCell(
          `${options.detailId}_summary_${index + 1}`,
          summaryRow,
          summaryCol,
          span,
          item,
        ),
      );
      summaryCol += span;
    });
  }

  const shiftedCells = options.cells.map((cell) => ({
    ...cell,
    row: shiftedRow(cell.row, shifts),
  }));
  const cells = [...shiftedCells, ...generatedCells];
  const rowCount = Math.max(
    1,
    options.rows.length - shiftAmount,
    ...cells.map((cell) => cell.row + (cell.rowSpan ?? 1) - 1),
  );

  return {
    columns,
    rows: Array.from({ length: rowCount }, (_, index) => ({
      ...(options.rows[Math.min(index, options.rows.length - 1)] ?? {
        heightMm: 8,
      }),
      key: `${index + 1}`,
    })),
    cells,
    detailBands: [
      {
        id: options.detailId,
        type: 'detail_band',
        dataSource: `${options.arrayRoot}[]`,
        row: detailRow,
        minRows: 0,
        maxRowsPerPage: options.maxRowsPerPage,
        overflow: options.overflow ?? 'continue_next_page',
      },
    ],
  };
}

export function migrateGridDetailRegionsToBands(
  schema: NormalizableGridPrintTemplateSchema,
): GridPrintTemplateSchema {
  const safeSchema = ensureColumnsForLegacyRegions(schema);
  const regions = safeSchema.grid.regions ?? [];
  if (regions.length === 0) {
    return {
      ...safeSchema,
      schemaVersion: '3.0',
      grid: { ...safeSchema.grid, regions: undefined },
    };
  }
  const shifts: Array<{ afterRow: number; amount: number }> = [];
  const generatedCells: GridCellSchema[] = [];
  const detailBands: GridDetailBandSchema[] = [
    ...(schema.grid.detailBands ?? []),
  ];
  let totalShift = 0;

  regions.forEach((region) => {
    const startRow = region.startRow;
    const oldSpan = region.maxRowsPerPage + 2;
    const newSpan = region.summary?.length ? 3 : 2;
    const headerRow = shiftedRow(startRow, shifts);
    const detailRow = headerRow + 1;
    const summaryRow = region.summary?.length ? headerRow + 2 : undefined;
    const colSpan = minimumRegionColSpan(safeSchema, region);
    const spans = distributeSpans(region.columns.length, colSpan);
    let currentCol = region.startCol;

    region.columns.forEach((column, index) => {
      const span = spans[index] ?? 1;
      generatedCells.push(
        detailHeaderCell(
          `${region.id}_header_${index + 1}`,
          headerRow,
          currentCol,
          span,
          column.title,
          region.repeatHeader ? undefined : 'first_page',
        ),
      );
      generatedCells.push(
        detailBodyCell(
          `${region.id}_detail_${index + 1}`,
          detailRow,
          currentCol,
          span,
          column,
        ),
      );
      currentCol += span;
    });

    if (summaryRow && region.summary?.length) {
      const summarySpans = distributeSpans(region.summary.length, colSpan);
      let summaryCol = region.startCol;
      region.summary.forEach((summary, index) => {
        const span = summarySpans[index] ?? 1;
        generatedCells.push(
          aggregateCell(
            `${region.id}_summary_${index + 1}`,
            summaryRow,
            summaryCol,
            span,
            summary,
          ),
        );
        summaryCol += span;
      });
    }

    detailBands.push({
      id: region.id,
      type: 'detail_band',
      dataSource: region.dataSource,
      row: detailRow,
      minRows: 0,
      maxRowsPerPage: region.maxRowsPerPage,
      overflow: region.overflow,
    });

    const shiftAmount = Math.max(0, oldSpan - newSpan);
    if (shiftAmount > 0) {
      shifts.push({ afterRow: startRow + oldSpan - 1, amount: shiftAmount });
      totalShift += shiftAmount;
    }
  });

  const cells = [
    ...schema.grid.cells.map((cell) => ({
      ...cell,
      row: shiftedRow(cell.row, shifts),
    })),
    ...generatedCells,
  ];
  const rowCount = Math.max(
    1,
    schema.grid.rows.length - totalShift,
    ...cells.map((cell) => cell.row + (cell.rowSpan ?? 1) - 1),
  );
  return {
    ...schema,
    schemaVersion: '3.0',
    grid: {
      ...safeSchema.grid,
      rows: Array.from({ length: rowCount }, (_, index) => ({
        ...(safeSchema.grid.rows[
          Math.min(index, safeSchema.grid.rows.length - 1)
        ] ?? {
          heightMm: 8,
        }),
        key: `${index + 1}`,
      })),
      cells,
      detailBands,
      regions: undefined,
    },
  };
}

interface GridPresetLayoutOptions {
  businessType: string;
  templateType: 'document_flow' | 'continuous_fixed';
  fields: GridDesignerField[];
  businessName?: string;
  preset: GridTemplatePreset;
}

function documentStandardSchema({
  businessType,
  fields,
  businessName,
}: Omit<GridPresetLayoutOptions, 'templateType' | 'preset'>) {
  const arrayRoot = defaultArrayRoot(fields);
  const columns = buildPresetColumns(fields, arrayRoot);
  const columnCount = columns.length;
  const rows = buildRows(24);
  return {
    schemaVersion: '3.0',
    templateType: 'document_flow',
    businessType,
    layoutMode: 'grid_sheet',
    grid: buildGridWithDefaultDetailBand({
      columns,
      rows,
      fields,
      arrayRoot,
      detailId: 'detail',
      startRow: 6,
      maxRowsPerPage: 14,
      cells: [
        titleCell(businessName?.trim() || '打印单', 1, columnCount),
        ...headerCells(fields, twoColumnHeaderSlots([2, 3, 4], columnCount)),
        ...signatureCells(22, columnCount, [
          { id: 'sender_signature', label: '发货/制单' },
          { id: 'receiver_signature', label: '签收/盖章' },
        ]),
      ],
    }),
  } satisfies GridPrintTemplateSchema;
}

function documentCompactSchema({
  businessType,
  fields,
  businessName,
}: Omit<GridPresetLayoutOptions, 'templateType' | 'preset'>) {
  const arrayRoot = defaultArrayRoot(fields);
  const columns = buildPresetColumns(
    fields,
    arrayRoot,
    [14, 26, 32, 32, 24, 24, 22, 22],
  );
  const columnCount = columns.length;
  const rows = buildRows(28, 10, 7);
  return {
    schemaVersion: '3.0',
    templateType: 'document_flow',
    businessType,
    layoutMode: 'grid_sheet',
    grid: buildGridWithDefaultDetailBand({
      columns,
      rows,
      fields,
      arrayRoot,
      detailId: 'detail',
      startRow: 5,
      maxRowsPerPage: 20,
      cells: [
        titleCell(businessName?.trim() || '打印单', 1, columnCount, 20),
        ...headerCells(fields, twoColumnHeaderSlots([2, 3], columnCount)),
        ...signatureCells(27, columnCount, [
          { id: 'prepared_by', label: '制单' },
          { id: 'checked_by', label: '复核' },
          { id: 'received_by', label: '签收' },
        ]),
      ],
    }),
  } satisfies GridPrintTemplateSchema;
}

function documentQrSchema({
  businessType,
  fields,
  businessName,
}: Omit<GridPresetLayoutOptions, 'templateType' | 'preset'>) {
  const arrayRoot = defaultArrayRoot(fields);
  const columns = buildPresetColumns(fields, arrayRoot);
  const columnCount = columns.length;
  const codeStartCol = Math.max(1, columnCount - 1);
  const codeLeftColumnCount = Math.max(1, codeStartCol - 1);
  const rows = buildRows(24);
  return {
    schemaVersion: '3.0',
    templateType: 'document_flow',
    businessType,
    layoutMode: 'grid_sheet',
    grid: buildGridWithDefaultDetailBand({
      columns,
      rows,
      fields,
      arrayRoot,
      detailId: 'detail',
      startRow: 6,
      maxRowsPerPage: 14,
      cells: [
        titleCell(businessName?.trim() || '打印单', 1, codeLeftColumnCount),
        codeCell('document_code', 1, codeStartCol, 3, fields),
        ...headerCells(
          fields,
          twoColumnHeaderSlots([2, 3, 4], codeLeftColumnCount),
        ),
        ...signatureCells(22, columnCount, [
          { id: 'sender_signature', label: '发货/制单' },
          { id: 'receiver_signature', label: '签收/盖章' },
        ]),
      ],
    }),
  } satisfies GridPrintTemplateSchema;
}

function documentReportSchema({
  businessType,
  fields,
  businessName,
}: Omit<GridPresetLayoutOptions, 'templateType' | 'preset'>) {
  const arrayRoot = defaultArrayRoot(fields);
  const columns = buildPresetColumns(fields, arrayRoot);
  const columnCount = columns.length;
  const rows = buildRows(28);
  return {
    schemaVersion: '3.0',
    templateType: 'document_flow',
    businessType,
    layoutMode: 'grid_sheet',
    grid: buildGridWithDefaultDetailBand({
      columns,
      rows,
      fields,
      arrayRoot,
      detailId: 'detail',
      startRow: 5,
      maxRowsPerPage: 12,
      cells: [
        titleCell(businessName?.trim() || '报告单', 1, columnCount),
        ...headerCells(fields, twoColumnHeaderSlots([2, 3], columnCount)),
        textCell('summary_note', 20, 1, columnCount, '说明/结论：'),
        ...signatureCells(24, columnCount, [
          { id: 'prepared_by', label: '制单' },
          { id: 'reviewed_by', label: '审核' },
          { id: 'approved_by', label: '批准' },
        ]),
      ],
    }),
  } satisfies GridPrintTemplateSchema;
}

function continuousCompactSingleSchema({
  businessType,
  fields,
  businessName,
}: Omit<GridPresetLayoutOptions, 'templateType' | 'preset'>) {
  const arrayRoot = defaultArrayRoot(fields);
  const columns = buildPresetColumns(
    fields,
    arrayRoot,
    [14, 26, 32, 32, 22, 22, 20, 20],
  );
  const columnCount = columns.length;
  const rows = buildRows(18, 10, 7);
  return {
    schemaVersion: '3.0',
    templateType: 'continuous_fixed',
    businessType,
    layoutMode: 'grid_sheet',
    copyCount: 1,
    copyLabels: ['存根'],
    grid: buildGridWithDefaultDetailBand({
      columns,
      rows,
      fields,
      arrayRoot,
      detailId: 'detail',
      startRow: 5,
      maxRowsPerPage: 9,
      cells: [
        titleCell(businessName?.trim() || '打印单', 1, columnCount, 18),
        ...headerCells(fields, twoColumnHeaderSlots([2, 3], columnCount)),
        ...signatureCells(16, columnCount, [
          { id: 'operator_signature', label: '经办' },
          { id: 'receiver_signature', label: '签收' },
        ]),
      ],
    }),
  } satisfies GridPrintTemplateSchema;
}

function continuousThreeCopySchema({
  businessType,
  fields,
  businessName,
}: Omit<GridPresetLayoutOptions, 'templateType' | 'preset'>) {
  const arrayRoot = defaultArrayRoot(fields);
  const columns = buildPresetColumns(
    fields,
    arrayRoot,
    [14, 26, 32, 32, 22, 22, 20, 20],
  );
  const columnCount = columns.length;
  const rows = buildRows(18, 10, 7);
  return {
    schemaVersion: '3.0',
    templateType: 'continuous_fixed',
    businessType,
    layoutMode: 'grid_sheet',
    copyCount: 3,
    copyLabels: ['客户联', '仓库联', '财务联'],
    grid: buildGridWithDefaultDetailBand({
      columns,
      rows,
      fields,
      arrayRoot,
      detailId: 'detail',
      startRow: 5,
      maxRowsPerPage: 9,
      cells: [
        copyMarkCell(),
        titleCell(
          businessName?.trim() || '打印单',
          3,
          Math.max(1, columnCount - 2),
          18,
        ),
        ...headerCells(fields, twoColumnHeaderSlots([2, 3], columnCount)),
        ...signatureCells(16, columnCount, [
          { id: 'operator_signature', label: '经办' },
          { id: 'receiver_signature', label: '签收' },
        ]),
      ],
    }),
  } satisfies GridPrintTemplateSchema;
}

function continuousDeliveryStubSchema({
  businessType,
  fields,
  businessName,
}: Omit<GridPresetLayoutOptions, 'templateType' | 'preset'>) {
  const arrayRoot = defaultArrayRoot(fields);
  const columns = buildPresetColumns(fields, arrayRoot);
  const columnCount = columns.length;
  const codeStartCol = Math.max(1, columnCount - 1);
  const codeLeftColumnCount = Math.max(1, codeStartCol - 1);
  const rows = buildRows(20, 10, 7);
  return {
    schemaVersion: '3.0',
    templateType: 'continuous_fixed',
    businessType,
    layoutMode: 'grid_sheet',
    copyCount: 3,
    copyLabels: ['客户联', '回执联', '存根联'],
    grid: buildGridWithDefaultDetailBand({
      columns,
      rows,
      fields,
      arrayRoot,
      detailId: 'detail',
      startRow: 6,
      maxRowsPerPage: 9,
      cells: [
        copyMarkCell(),
        titleCell(
          businessName?.trim() || '送货签收单',
          3,
          Math.max(1, codeLeftColumnCount - 2),
          18,
        ),
        codeCell('document_code', 1, codeStartCol, 3, fields),
        ...headerCells(
          fields,
          twoColumnHeaderSlots([2, 3, 4], codeLeftColumnCount),
        ),
        ...signatureCells(17, columnCount, [
          { id: 'receiver_signature', label: '收货单位签章' },
          { id: 'operator_signature', label: '经办人' },
        ]),
      ],
    }),
  } satisfies GridPrintTemplateSchema;
}

function continuousWarehouseSchema({
  businessType,
  fields,
  businessName,
}: Omit<GridPresetLayoutOptions, 'templateType' | 'preset'>) {
  const arrayRoot = defaultArrayRoot(fields);
  const columns = buildPresetColumns(
    fields,
    arrayRoot,
    [14, 28, 34, 34, 22, 22, 20, 20],
  );
  const columnCount = columns.length;
  const rows = buildRows(18, 10, 7);
  return {
    schemaVersion: '3.0',
    templateType: 'continuous_fixed',
    businessType,
    layoutMode: 'grid_sheet',
    copyCount: 2,
    copyLabels: ['仓库联', '财务联'],
    grid: buildGridWithDefaultDetailBand({
      columns,
      rows,
      fields,
      arrayRoot,
      detailId: 'detail',
      startRow: 5,
      maxRowsPerPage: 9,
      cells: [
        copyMarkCell(),
        titleCell(
          businessName?.trim() || '仓库交接单',
          3,
          Math.max(1, columnCount - 2),
          18,
        ),
        ...headerCells(fields, twoColumnHeaderSlots([2, 3], columnCount)),
        ...signatureCells(16, columnCount, [
          { id: 'warehouse_signature', label: '仓库' },
          { id: 'handover_signature', label: '交接' },
          { id: 'finance_signature', label: '财务' },
        ]),
      ],
    }),
  } satisfies GridPrintTemplateSchema;
}

export function buildGridTemplatePresetSchema({
  businessType,
  templateType,
  fields,
  businessName,
  preset,
}: GridPresetLayoutOptions): GridPrintTemplateSchema {
  if (templateType === 'continuous_fixed') {
    if (preset === 'compact_single') {
      return continuousCompactSingleSchema({
        businessType,
        fields,
        businessName,
      });
    }
    if (preset === 'delivery_stub') {
      return continuousDeliveryStubSchema({
        businessType,
        fields,
        businessName,
      });
    }
    if (preset === 'warehouse_handover') {
      return continuousWarehouseSchema({
        businessType,
        fields,
        businessName,
      });
    }
    return continuousThreeCopySchema({ businessType, fields, businessName });
  }

  if (preset === 'compact_table') {
    return documentCompactSchema({ businessType, fields, businessName });
  }
  if (preset === 'header_qr_table') {
    return documentQrSchema({ businessType, fields, businessName });
  }
  if (preset === 'report_with_summary') {
    return documentReportSchema({ businessType, fields, businessName });
  }
  return documentStandardSchema({ businessType, fields, businessName });
}

export function buildDefaultGridTemplateSchema(
  businessType: string,
  templateType: 'document_flow' | 'continuous_fixed',
  fields: GridDesignerField[],
  businessName?: string,
): GridPrintTemplateSchema {
  return buildGridTemplatePresetSchema({
    businessType,
    templateType,
    fields,
    businessName,
    preset: defaultGridPresetForTemplateType(templateType),
  });
}

export function normalizeGridTemplateSchema(
  value: NormalizableGridPrintTemplateSchema | undefined,
  businessType: string,
  templateType: 'document_flow' | 'continuous_fixed',
  fields: GridDesignerField[],
  businessName?: string,
): GridPrintTemplateSchema {
  if (!value) {
    return normalizeExistingGridCells(
      buildDefaultGridTemplateSchema(
        businessType,
        templateType,
        fields,
        businessName,
      ),
    );
  }
  return normalizeExistingGridCells(
    migrateGridDetailRegionsToBands({
      ...value,
      schemaVersion: '3.0',
      businessType,
      templateType,
      layoutMode: 'grid_sheet',
    }),
  );
}
