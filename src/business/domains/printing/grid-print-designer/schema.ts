export type GridContentType =
  | 'static_text'
  | 'field'
  | 'field_label_value'
  | 'aggregate_field'
  | 'detail_row_index'
  | 'barcode'
  | 'qrcode'
  | 'image'
  | 'page_number'
  | 'copy_mark'
  | 'signature_box';

export type GridAggregateType = 'sum' | 'count';
export type GridCellPrintScope = 'every_page' | 'first_page' | 'last_page';

export interface GridColumnSchema {
  key: string;
  widthMm: number;
}

export interface GridRowSchema {
  key: string;
  heightMm: number;
}

export interface GridCellStyle {
  fontSize?: number;
  /** 文本行距倍数；未配置时沿用后端默认值 */
  lineHeight?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  border?: {
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
  };
  wrap?: boolean;
  /** 字体颜色，#rgb/#rrggbb（后端渲染按白名单校验） */
  color?: string;
  /** 背景颜色，#rgb/#rrggbb（后端渲染按白名单校验） */
  backgroundColor?: string;
}

export interface GridCellContent {
  type: GridContentType;
  text?: string;
  label?: string;
  fieldPath?: string;
  aggregate?: GridAggregateType;
  src?: string;
  /** 后端字段注册表声明的展示格式；金额字段用于统一输出 ￥0.00。 */
  formatType?: string;
}

export interface GridCellSchema {
  id: string;
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
  printScope?: GridCellPrintScope;
  content: GridCellContent;
  style?: GridCellStyle;
}

export interface GridDetailColumnSchema {
  title: string;
  type?: 'row_index' | 'field' | 'static_text';
  fieldPath?: string;
  text?: string;
  widthMm?: number;
  /** 字段列展示方式：text（默认）按文本；image 把字段值当图片 URL 渲染（如报价图片） */
  display?: 'text' | 'image';
  formatType?: string;
}

export interface GridDetailSummarySchema {
  label: string;
  fieldPath: string;
  aggregate: GridAggregateType;
  formatType?: string;
}

export interface GridDetailTableStyle {
  /** 明细表头和正文的字号 */
  fontSize?: number;
  /** 明细表头和正文的字体颜色 */
  color?: string;
  /** 明细表头和正文的行距倍数 */
  lineHeight?: number;
  /** 自动换行；默认开启，关闭时单行截断 */
  wrap?: boolean;
}

export interface GridDetailTableRegionSchema {
  id: string;
  type: 'detail_table';
  dataSource: string;
  startRow: number;
  startCol: number;
  colSpan?: number;
  rowHeightMm: number;
  minRows?: number;
  maxRowsPerPage: number;
  repeatHeader: boolean;
  overflow: 'continue_next_page' | 'error';
  columns: GridDetailColumnSchema[];
  summary?: GridDetailSummarySchema[];
  style?: GridDetailTableStyle;
}

export interface GridDetailBandSchema {
  id: string;
  type: 'detail_band';
  dataSource: string;
  row: number;
  minRows?: number;
  maxRowsPerPage: number;
  overflow: 'continue_next_page' | 'error';
}

export interface GridPrintTemplateSchema {
  schemaVersion: '3.0';
  templateType: 'document_flow' | 'continuous_fixed';
  businessType: string;
  layoutMode: 'grid_sheet';
  copyCount?: number;
  copyLabels?: string[];
  grid: {
    columns: GridColumnSchema[];
    rows: GridRowSchema[];
    cells: GridCellSchema[];
    detailBands?: GridDetailBandSchema[];
    /** 2.0 遗留字段，仅用于读取旧模板后迁移；新保存协议不再输出 */
    regions?: GridDetailTableRegionSchema[];
  };
}

export function isGridPrintTemplateSchema(
  value: unknown,
): value is GridPrintTemplateSchema {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const grid = record.grid;
  if (!grid || typeof grid !== 'object' || Array.isArray(grid)) {
    return false;
  }
  const gridRecord = grid as Record<string, unknown>;
  return (
    (record.schemaVersion === '3.0' || record.schemaVersion === '2.0') &&
    record.layoutMode === 'grid_sheet' &&
    (record.templateType === 'document_flow' ||
      record.templateType === 'continuous_fixed') &&
    typeof record.businessType === 'string' &&
    Array.isArray(gridRecord.columns) &&
    Array.isArray(gridRecord.rows) &&
    Array.isArray(gridRecord.cells)
  );
}
