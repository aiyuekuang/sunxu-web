import {
  BarcodeOutlined,
  BorderOutlined,
  CalculatorOutlined,
  CheckOutlined,
  CompressOutlined,
  DeleteOutlined,
  ExpandOutlined,
  EyeOutlined,
  FieldStringOutlined,
  FileImageOutlined,
  FontSizeOutlined,
  MergeCellsOutlined,
  QrcodeOutlined,
  RedoOutlined,
  SplitCellsOutlined,
  TableOutlined,
  UndoOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { MenuProps, UploadProps } from 'antd';
import {
  Button,
  Checkbox,
  ColorPicker,
  Divider,
  Dropdown,
  Empty,
  Input,
  InputNumber,
  Modal,
  message,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  theme,
  Upload,
} from 'antd';
import type {
  CSSProperties,
  DragEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  GridDesignerField,
  GridDesignerPaperProfile,
  GridPrintDesignerDataRequest,
  GridPrintDesignerProps,
} from './types';
import type { GridTemplatePreset } from './factory';
import {
  arrayRootOfFieldPath,
  arrayRootsFromFields,
  buildDefaultDetailRegion,
  buildGridTemplatePresetSchema,
  defaultArrayRoot,
  defaultDetailColumns,
  defaultGridPresetForTemplateType,
  detailColumnFromField,
  detailFieldsForArrayRoot,
  detailSummaryForColumns,
  gridPresetOptionsForTemplateType,
  normalizeGridTemplateSchema,
} from './factory';
import type {
  GridAggregateType,
  GridCellContent,
  GridCellPrintScope,
  GridCellSchema,
  GridCellStyle,
  GridContentType,
  GridDetailBandSchema,
  GridDetailColumnSchema,
  GridDetailSummarySchema,
  GridPrintTemplateSchema,
} from './schema';

interface FieldOption {
  label: string;
  value: string;
}

const designerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '280px minmax(0, 1fr) 300px',
  height: 'min(760px, calc(100vh - 220px))',
  minHeight: 520,
  overflow: 'hidden',
};

const designerImmersiveStyle: CSSProperties = {
  flex: 1,
  gridTemplateColumns: '280px minmax(320px, 1fr) 300px',
  height: 'auto',
  minHeight: 0,
};

const designerShellStyle: CSSProperties = {
  background: 'var(--ant-color-bg-container)',
  border: '1px solid var(--ant-color-border)',
  borderRadius: 8,
  overflow: 'hidden',
};

const designerShellImmersiveStyle: CSSProperties = {
  border: 0,
  borderRadius: 0,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  inset: 0,
  position: 'absolute',
  zIndex: 1000,
};

const designerToolbarStyle: CSSProperties = {
  alignItems: 'center',
  borderBottom: '1px solid var(--ant-color-border-secondary)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  justifyContent: 'space-between',
  minHeight: 49,
  padding: '8px 12px',
};

const designerToolbarLeftStyle: CSSProperties = {
  flex: '0 0 auto',
  minWidth: 0,
};

const designerToolbarTitleStyle: CSSProperties = {
  flexShrink: 0,
  whiteSpace: 'nowrap',
};

const designerToolbarActionsStyle: CSSProperties = {
  flex: '1 1 480px',
  justifyContent: 'flex-end',
  minWidth: 0,
};

const panelStyle: CSSProperties = {
  minHeight: 0,
  minWidth: 0,
  padding: 12,
};

const sidePanelStyle: CSSProperties = {
  ...panelStyle,
  background: 'var(--ant-color-fill-quaternary)',
  maxHeight: '100%',
  overscrollBehavior: 'contain',
  overflow: 'auto',
};

const canvasWrapStyle: CSSProperties = {
  ...panelStyle,
  background: '#f8fafc',
  overflow: 'auto',
};

const getDesignerPopupContainer = (triggerNode: HTMLElement) =>
  triggerNode.parentElement ?? document.body;

const GRID_LINE_COLOR = '#e5e7eb';
const GRID_LINE_SUBTLE_COLOR = '#edf0f2';
const DEFAULT_IMAGE_SRC =
  'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22160%22%20height%3D%2280%22%20viewBox%3D%220%200%20160%2080%22%3E%3Crect%20width%3D%22160%22%20height%3D%2280%22%20rx%3D%228%22%20fill%3D%22%23f8fafc%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%221%22%20width%3D%22158%22%20height%3D%2278%22%20rx%3D%228%22%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2280%22%20y%3D%2247%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2220%22%20font-weight%3D%22700%22%20text-anchor%3D%22middle%22%20fill%3D%22%2364758b%22%3ELOGO%3C%2Ftext%3E%3C%2Fsvg%3E';

const sectionTitleStyle: CSSProperties = {
  color: 'var(--ant-color-text-secondary)',
  fontSize: 12,
  fontWeight: 600,
  margin: '14px 0 8px',
};

const leftPanelBlockStyle: CSSProperties = {
  borderBottom: '1px solid var(--ant-color-border-secondary)',
  paddingBottom: 12,
};

const panelHeaderStyle: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 10,
};

const componentGroupTitleStyle: CSSProperties = {
  color: 'var(--ant-color-text-tertiary)',
  fontSize: 11,
  fontWeight: 600,
  margin: '8px 0 6px',
};

const componentGridStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
};

const componentButtonStyle: CSSProperties = {
  gap: 6,
  height: 42,
  justifyContent: 'flex-start',
  paddingInline: 8,
  width: '100%',
};

const activeComponentButtonStyle: CSSProperties = {
  background: 'rgba(22, 119, 255, 0.08)',
  borderColor: 'var(--ant-color-primary)',
  color: 'var(--ant-color-primary)',
};

const fieldButtonStyle: CSSProperties = {
  gap: 6,
  justifyContent: 'flex-start',
  marginBottom: 6,
  paddingInline: 8,
  width: '100%',
};

const draggableButtonStyle: CSSProperties = {
  ...fieldButtonStyle,
  cursor: 'grab',
};

const sheetFrameStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '36px max-content',
  gridTemplateRows: '28px max-content',
  width: 'max-content',
};

const sheetCornerStyle: CSSProperties = {
  alignItems: 'center',
  background: '#eef2f7',
  borderBottom: '1px solid #cbd5e1',
  borderRight: '1px solid #cbd5e1',
  color: '#64748b',
  display: 'flex',
  fontSize: 11,
  justifyContent: 'center',
  position: 'sticky',
  left: 0,
  top: 0,
  zIndex: 5,
};

const sheetColumnHeaderStyle: CSSProperties = {
  alignItems: 'center',
  background: '#f1f5f9',
  border: 0,
  borderBottom: '1px solid #cbd5e1',
  borderRight: '1px solid #dbe3ec',
  color: '#475569',
  cursor: 'context-menu',
  display: 'flex',
  fontSize: 11,
  fontWeight: 600,
  justifyContent: 'center',
  minWidth: 0,
  overflow: 'hidden',
  position: 'sticky',
  top: 0,
  userSelect: 'none',
  zIndex: 4,
};

const sheetRowHeaderStyle: CSSProperties = {
  alignItems: 'center',
  background: '#f1f5f9',
  border: 0,
  borderBottom: '1px solid #dbe3ec',
  borderRight: '1px solid #cbd5e1',
  color: '#475569',
  cursor: 'context-menu',
  display: 'flex',
  fontSize: 11,
  fontWeight: 600,
  justifyContent: 'center',
  left: 0,
  minHeight: 0,
  position: 'sticky',
  userSelect: 'none',
  zIndex: 3,
};

const cellPrintScopeBadgeStyle: CSSProperties = {
  border: '1px solid transparent',
  borderRadius: 4,
  fontSize: 10,
  fontWeight: 600,
  lineHeight: 1,
  padding: '2px 4px',
  pointerEvents: 'none',
  position: 'absolute',
  right: 3,
  top: 3,
  zIndex: 2,
};

const columnResizeHandleStyle: CSSProperties = {
  bottom: 0,
  cursor: 'col-resize',
  position: 'absolute',
  right: -4,
  top: 0,
  touchAction: 'none',
  width: 8,
  zIndex: 2,
};

const rowResizeHandleStyle: CSSProperties = {
  bottom: -4,
  cursor: 'row-resize',
  height: 8,
  left: 0,
  position: 'absolute',
  right: 0,
  touchAction: 'none',
  zIndex: 2,
};

const canvasStyle: CSSProperties = {
  background: '#fff',
  border: `1px solid ${GRID_LINE_COLOR}`,
  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.08)',
  display: 'grid',
  width: 'max-content',
};

const gridRegionStyle: CSSProperties = {
  alignItems: 'center',
  appearance: 'none',
  cursor: 'grab',
  display: 'flex',
  flexDirection: 'column',
  font: 'inherit',
  fontWeight: 600,
  justifyContent: 'center',
  lineHeight: 1.6,
  outline: 'none',
  padding: 0,
  position: 'relative',
  textAlign: 'initial',
  zIndex: 2,
};

const detailFieldAddedStyle: CSSProperties = {
  background: 'rgba(37, 99, 235, 0.08)',
  borderColor: 'rgba(37, 99, 235, 0.22)',
  color: 'var(--ant-color-primary)',
  fontWeight: 500,
};

const detailRegionPreviewStyle: CSSProperties = {
  background: '#fff',
  color: '#111827',
  display: 'flex',
  flexDirection: 'column',
  fontSize: 11,
  fontWeight: 400,
  height: '100%',
  minHeight: 0,
  minWidth: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
  width: '100%',
};

const detailRegionMetaStyle: CSSProperties = {
  alignItems: 'center',
  background: '#f8fafc',
  borderBottom: `1px solid ${GRID_LINE_SUBTLE_COLOR}`,
  color: '#475569',
  display: 'flex',
  flex: '0 0 24px',
  fontWeight: 600,
  gap: 8,
  justifyContent: 'space-between',
  minWidth: 0,
  padding: '0 8px',
};

const detailRegionTableStyle: CSSProperties = {
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  minHeight: 0,
  minWidth: 0,
  overflow: 'hidden',
};

const detailRegionRowStyle: CSSProperties = {
  display: 'grid',
  minHeight: 0,
  minWidth: 0,
};

const detailRegionHeaderCellStyle: CSSProperties = {
  alignItems: 'center',
  background: '#f8fafc',
  borderBottom: `1px solid ${GRID_LINE_COLOR}`,
  borderRight: `1px solid ${GRID_LINE_SUBTLE_COLOR}`,
  color: '#111827',
  cursor: 'grab',
  display: 'flex',
  fontWeight: 600,
  minWidth: 0,
  overflow: 'hidden',
  padding: '0 6px',
  pointerEvents: 'auto',
  whiteSpace: 'nowrap',
};

const detailRegionBodyCellStyle: CSSProperties = {
  alignItems: 'center',
  borderBottom: `1px solid ${GRID_LINE_SUBTLE_COLOR}`,
  borderRight: `1px solid ${GRID_LINE_SUBTLE_COLOR}`,
  color: '#64748b',
  display: 'flex',
  minWidth: 0,
  overflow: 'hidden',
  padding: '0 6px',
  whiteSpace: 'nowrap',
};

const detailColumnEditorStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid var(--ant-color-border-secondary)',
  borderRadius: 6,
  padding: 8,
};

const emptyGridCellStyle: CSSProperties = {
  alignItems: 'center',
  appearance: 'none',
  background: '#fff',
  border: 0,
  borderBottom: `1px solid ${GRID_LINE_SUBTLE_COLOR}`,
  borderRight: `1px solid ${GRID_LINE_SUBTLE_COLOR}`,
  boxSizing: 'border-box',
  cursor: 'cell',
  display: 'flex',
  justifyContent: 'center',
  minHeight: 0,
  minWidth: 0,
  padding: 0,
  outline: 'none',
  zIndex: 1,
};

const cellStyle: CSSProperties = {
  alignItems: 'center',
  appearance: 'none',
  background: '#fff',
  border: 0,
  boxSizing: 'border-box',
  color: '#111827',
  cursor: 'grab',
  display: 'flex',
  font: 'inherit',
  fontSize: 10,
  minHeight: 28,
  minWidth: 0,
  overflow: 'hidden',
  padding: '4px 6px',
  position: 'relative',
  textAlign: 'initial',
  zIndex: 2,
};

const cellPreviewTextStyle: CSSProperties = {
  color: 'inherit',
  display: 'block',
  fontSize: 'inherit',
  fontWeight: 'inherit',
  lineHeight: 'inherit',
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'inherit',
};

const resizeHandleStyle: CSSProperties = {
  alignItems: 'flex-end',
  background: 'transparent',
  border: 0,
  bottom: -14,
  cursor: 'nwse-resize',
  display: 'flex',
  height: 32,
  justifyContent: 'flex-end',
  padding: 0,
  position: 'absolute',
  right: -14,
  width: 32,
  zIndex: 20,
};

const resizeHandleGripStyle: CSSProperties = {
  background:
    'linear-gradient(135deg, transparent 0 42%, rgba(22, 119, 255, 0.18) 43% 57%, transparent 58% 100%)',
  borderBottom: '3px solid var(--ant-color-primary)',
  borderBottomRightRadius: 3,
  borderRight: '3px solid var(--ant-color-primary)',
  boxShadow: '2px 2px 0 #fff',
  display: 'block',
  height: 16,
  pointerEvents: 'none',
  width: 16,
};

const horizontalResizeHandleStyle: CSSProperties = {
  alignItems: 'center',
  bottom: 0,
  cursor: 'col-resize',
  display: 'flex',
  justifyContent: 'center',
  position: 'absolute',
  right: -6,
  top: 0,
  touchAction: 'none',
  width: 12,
  zIndex: 19,
};

const verticalResizeHandleStyle: CSSProperties = {
  alignItems: 'center',
  bottom: -6,
  cursor: 'row-resize',
  display: 'flex',
  height: 12,
  justifyContent: 'center',
  left: 0,
  position: 'absolute',
  right: 0,
  touchAction: 'none',
  zIndex: 19,
};

const horizontalResizeHandleLineStyle: CSSProperties = {
  background: 'rgba(22, 119, 255, 0.55)',
  borderRadius: 2,
  height: '70%',
  width: 2,
};

const verticalResizeHandleLineStyle: CSSProperties = {
  background: 'rgba(22, 119, 255, 0.55)',
  borderRadius: 2,
  height: 2,
  width: '70%',
};

const codePreviewStyle: CSSProperties = {
  alignItems: 'center',
  display: 'inline-flex',
  flexDirection: 'column',
  gap: 2,
  maxWidth: '100%',
  minWidth: 0,
};

const imagePreviewStyle: CSSProperties = {
  display: 'block',
  maxHeight: '100%',
  maxWidth: '100%',
  objectFit: 'contain',
};

const qrcodeSampleStyle: CSSProperties = {
  alignItems: 'center',
  background: '#fff',
  border: '1px solid #111827',
  color: '#111827',
  display: 'inline-flex',
  fontSize: 28,
  height: 38,
  justifyContent: 'center',
  lineHeight: 1,
  width: 38,
};

const barcodeSampleStyle: CSSProperties = {
  alignItems: 'center',
  background: '#fff',
  border: '1px solid #111827',
  color: '#111827',
  display: 'inline-flex',
  fontSize: 34,
  height: 28,
  justifyContent: 'center',
  lineHeight: 1,
  padding: '0 4px',
  width: 54,
};

const DEFAULT_CELL_BORDER = `1px solid ${GRID_LINE_COLOR}`;
const DEFAULT_NO_CELL_BORDER = {
  top: false,
  right: false,
  bottom: false,
  left: false,
} satisfies NonNullable<GridCellStyle['border']>;
const GRID_DND_MIME = 'application/x-mes-print-grid';
const GRID_MM_TO_PX = 4.2;
const GRID_EDITOR_FONT_SCALE = 0.72;
const MIN_GRID_TRACK_PX = 8;
const MIN_GRID_COLUMN_WIDTH_MM = 4;
const MAX_GRID_COLUMN_WIDTH_MM = 120;
const MIN_GRID_ROW_HEIGHT_MM = 2;
const MAX_GRID_ROW_HEIGHT_MM = 300;
const MIN_DETAIL_COLUMN_WIDTH_MM = MIN_GRID_COLUMN_WIDTH_MM;
const MIN_DETAIL_ROW_HEIGHT_MM = MIN_GRID_ROW_HEIGHT_MM;
const DEFAULT_DETAIL_BAND_MAX_ROWS = 14;
const MAX_STATIC_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_GRID_COLUMNS = 40;
const MAX_GRID_ROWS = 160;
const HISTORY_LIMIT = 30;
const PRINT_SCOPE_OPTIONS: Array<{
  label: string;
  value: GridCellPrintScope;
}> = [
  { label: '每页显示', value: 'every_page' },
  { label: '仅首页', value: 'first_page' },
  { label: '仅末页', value: 'last_page' },
];

interface VisualGridRow {
  key: string;
  actualRow: number;
  displayRow: number;
  heightPx: number;
}

let cellIdSeed = 0;
let regionIdSeed = 0;
let detailBandIdSeed = 0;

type GridDragPayload =
  | { kind: 'field'; fieldPath: string }
  | {
      kind: 'boundField';
      fieldPath: string;
      contentType: BoundFieldContentType;
    }
  | { kind: 'detailField'; fieldPath: string }
  | {
      kind: 'aggregateField';
      fieldPath: string;
      aggregate: GridAggregateType;
    }
  | { kind: 'moveDetailColumn'; regionId: string; columnIndex: number }
  | { kind: 'component'; contentType: GridContentType }
  | { kind: 'moveCell'; cellId: string; rowOffset: number; colOffset: number }
  | { kind: 'resizeCell'; cellId: string }
  | { kind: 'resizeRegion'; regionId: string }
  | {
      kind: 'moveRegion';
      regionId: string;
      rowOffset: number;
      colOffset: number;
    };
type GridRegionSchema = NonNullable<
  GridPrintTemplateSchema['grid']['regions']
>[number];

interface GridHistoryState {
  past: GridPrintTemplateSchema[];
  future: GridPrintTemplateSchema[];
}

interface DetailColumnDropTarget {
  regionId: string;
  columnIndex: number;
}

interface SelectedGridCellPosition {
  row: number;
  col: number;
}

interface HeaderSelection extends SelectedGridCellPosition {
  kind: 'col' | 'row';
  start: number;
}

type PaletteComponentKind = GridContentType | 'detail_table';
type GridResizeDirection = 'both' | 'horizontal' | 'vertical';
type BoundFieldContentType = Extract<
  GridContentType,
  | 'field'
  | 'field_label_value'
  | 'qrcode'
  | 'barcode'
  | 'image'
  | 'signature_box'
>;

interface PaletteComponentConfig {
  key: PaletteComponentKind;
  label: string;
  icon: ReactNode;
  dragContentType?: GridContentType;
}

function mmToPx(value: number): number {
  return Math.max(MIN_GRID_TRACK_PX, Math.round(value * GRID_MM_TO_PX));
}

function editorFontSize(value: number): number {
  return Math.max(8, Math.round(value * GRID_EDITOR_FONT_SCALE * 10) / 10);
}

function formatMm(value: number): string {
  return String(Math.round(value * 10) / 10);
}

function toMmNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

interface PaperPrintableMetrics {
  name: string;
  pageWidthMm: number;
  pageHeightMm: number;
  printableWidthMm: number;
  printableHeightMm: number;
}

/** 与后端 render-utils paperCss 同口径：横向纸型按宽高对调，边距缺省 10mm。 */
function resolvePaperPrintableMetrics(
  paperProfile?: GridDesignerPaperProfile,
): PaperPrintableMetrics | undefined {
  if (!paperProfile) return undefined;
  const rawWidth = toMmNumber(paperProfile.widthMm, 0);
  const rawHeight = toMmNumber(paperProfile.heightMm, 0);
  if (rawWidth <= 0) return undefined;
  const shouldSwapToLandscape =
    paperProfile.orientation === 'landscape' &&
    rawHeight > 0 &&
    rawWidth < rawHeight;
  const pageWidthMm = shouldSwapToLandscape ? rawHeight : rawWidth;
  const pageHeightMm = shouldSwapToLandscape ? rawWidth : rawHeight;
  const printableWidthMm = Math.max(
    0,
    pageWidthMm -
      toMmNumber(paperProfile.marginLeftMm, 10) -
      toMmNumber(paperProfile.marginRightMm, 10),
  );
  const printableHeightMm =
    pageHeightMm > 0
      ? Math.max(
          0,
          pageHeightMm -
            toMmNumber(paperProfile.marginTopMm, 10) -
            toMmNumber(paperProfile.marginBottomMm, 10),
        )
      : 0;
  return {
    name: paperProfile.name ?? '',
    pageHeightMm,
    pageWidthMm,
    printableHeightMm,
    printableWidthMm,
  };
}

function sumColumnWidthsMm(
  schema: GridPrintTemplateSchema,
  startCol: number,
  span: number,
): number {
  let total = 0;
  const endIndex = Math.min(startCol - 1 + span, schema.grid.columns.length);
  for (let index = startCol - 1; index < endIndex; index += 1) {
    total += toMmNumber(schema.grid.columns[index]?.widthMm, 0);
  }
  return total;
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('图片读取结果无效'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

function makeCellId(): string {
  cellIdSeed += 1;
  return `cell_${Date.now()}_${cellIdSeed}`;
}

function makeRegionId(): string {
  regionIdSeed += 1;
  return `detail_${Date.now()}_${regionIdSeed}`;
}

function makeDetailBandId(): string {
  detailBandIdSeed += 1;
  return `detail_band_${Date.now()}_${detailBandIdSeed}`;
}

function excelColumnLabel(index: number): string {
  let value = index + 1;
  let label = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label;
}

function gridPositionKey(row: number, col: number): string {
  return `${row}:${col}`;
}

function occupiedGridKeys(
  schema: GridPrintTemplateSchema,
  ignoreCellId?: string,
  ignoreRegionId?: string,
): Set<string> {
  const occupied = new Set<string>();
  for (const cell of schema.grid.cells) {
    if (cell.id === ignoreCellId) continue;
    const rowSpan = cell.rowSpan ?? 1;
    const colSpan = cell.colSpan ?? 1;
    for (let row = cell.row; row < cell.row + rowSpan; row += 1) {
      for (let col = cell.col; col < cell.col + colSpan; col += 1) {
        occupied.add(gridPositionKey(row, col));
      }
    }
  }
  for (const region of schema.grid.regions ?? []) {
    if (region.id === ignoreRegionId) continue;
    const rowSpan = region.maxRowsPerPage + 2;
    const colSpan =
      region.colSpan ?? schema.grid.columns.length - region.startCol + 1;
    for (let row = region.startRow; row < region.startRow + rowSpan; row += 1) {
      for (
        let col = region.startCol;
        col < region.startCol + colSpan;
        col += 1
      ) {
        occupied.add(gridPositionKey(row, col));
      }
    }
  }
  return occupied;
}

function canPlaceCellArea(
  schema: GridPrintTemplateSchema,
  row: number,
  col: number,
  rowSpan: number,
  colSpan: number,
  ignoreCellId?: string,
  ignoreRegionId?: string,
): boolean {
  if (
    row < 1 ||
    col < 1 ||
    row + rowSpan - 1 > schema.grid.rows.length ||
    col + colSpan - 1 > schema.grid.columns.length
  ) {
    return false;
  }
  const occupied = occupiedGridKeys(schema, ignoreCellId, ignoreRegionId);
  for (let currentRow = row; currentRow < row + rowSpan; currentRow += 1) {
    for (let currentCol = col; currentCol < col + colSpan; currentCol += 1) {
      if (occupied.has(gridPositionKey(currentRow, currentCol))) {
        return false;
      }
    }
  }
  return true;
}

function resolveAvailableSpan(
  schema: GridPrintTemplateSchema,
  row: number,
  col: number,
  desiredRowSpan: number,
  desiredColSpan: number,
  ignoreCellId?: string,
): { rowSpan: number; colSpan: number } {
  const maxRowSpan = Math.min(
    desiredRowSpan,
    schema.grid.rows.length - row + 1,
  );
  const maxColSpan = Math.min(
    desiredColSpan,
    schema.grid.columns.length - col + 1,
  );
  for (let rowSpan = maxRowSpan; rowSpan >= 1; rowSpan -= 1) {
    for (let colSpan = maxColSpan; colSpan >= 1; colSpan -= 1) {
      if (canPlaceCellArea(schema, row, col, rowSpan, colSpan, ignoreCellId)) {
        return { rowSpan, colSpan };
      }
    }
  }
  return { rowSpan: 1, colSpan: 1 };
}

function resolveAvailableRegionSpan(
  schema: GridPrintTemplateSchema,
  row: number,
  col: number,
  desiredRowSpan: number,
  desiredColSpan: number,
  ignoreRegionId?: string,
): { rowSpan: number; colSpan: number } | undefined {
  const maxRowSpan = Math.min(
    desiredRowSpan,
    schema.grid.rows.length - row + 1,
  );
  const maxColSpan = Math.min(
    desiredColSpan,
    schema.grid.columns.length - col + 1,
  );
  for (let rowSpan = maxRowSpan; rowSpan >= 3; rowSpan -= 1) {
    for (let colSpan = maxColSpan; colSpan >= 1; colSpan -= 1) {
      if (
        canPlaceCellArea(
          schema,
          row,
          col,
          rowSpan,
          colSpan,
          undefined,
          ignoreRegionId,
        )
      ) {
        return { rowSpan, colSpan };
      }
    }
  }
  return undefined;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveRegionColSpan(
  region: GridRegionSchema,
  columnCount: number,
): number {
  return region.colSpan ?? columnCount - region.startCol + 1;
}

function regionRowSpan(region: GridRegionSchema): number {
  return region.maxRowsPerPage + 2;
}

function defaultPrintScopeForContent(
  content: GridCellContent,
): GridCellPrintScope | undefined {
  return content.type === 'aggregate_field' ? 'last_page' : undefined;
}

function printScopeBadgeStyle(printScope?: GridCellPrintScope): CSSProperties {
  if (printScope === 'first_page') {
    return {
      ...cellPrintScopeBadgeStyle,
      background: '#f9f0ff',
      borderColor: '#d3adf7',
      color: '#531dab',
    };
  }
  if (printScope === 'last_page') {
    return {
      ...cellPrintScopeBadgeStyle,
      background: '#fff7e6',
      borderColor: '#ffd591',
      color: '#ad4e00',
    };
  }
  return {
    ...cellPrintScopeBadgeStyle,
    background: '#eef6ff',
    borderColor: '#91caff',
    color: '#0958d9',
  };
}

function printScopeShortLabel(
  printScope?: GridCellPrintScope,
): string | undefined {
  if (printScope === 'first_page') return '首页';
  if (printScope === 'last_page') return '末页';
  return undefined;
}

function regionGridSummary(
  region: GridRegionSchema,
  columnCount: number,
): string {
  const start = excelColumnLabel(region.startCol - 1);
  const span = resolveRegionColSpan(region, columnCount);
  const end = excelColumnLabel(region.startCol + span - 2);
  return `${start}-${end}，占 ${span} 格`;
}

function detailColumnGridTemplate(columns: GridDetailColumnSchema[]): string {
  if (columns.length === 0) return 'minmax(0, 1fr)';
  return columns
    .map(
      (column) =>
        `minmax(0, ${Math.max(
          column.widthMm ?? 24,
          MIN_DETAIL_COLUMN_WIDTH_MM,
        )}fr)`,
    )
    .join(' ');
}

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function detailSampleRows(
  sampleData: unknown,
  dataSource: string,
): readonly unknown[] {
  if (!isUnknownRecord(sampleData)) return [];
  const arrayRoot = dataSource.match(/^([A-Za-z0-9_]+)\[\]$/)?.[1];
  if (!arrayRoot) return [];
  const rows = sampleData[arrayRoot];
  return Array.isArray(rows) ? rows : [];
}

function readDetailSampleValue(
  row: unknown,
  dataSource: string,
  fieldPath?: string,
): unknown {
  if (!fieldPath) return undefined;
  const arrayRoot = dataSource.match(/^([A-Za-z0-9_]+)\[\]$/)?.[1];
  const prefix = arrayRoot ? `${arrayRoot}[].` : '';
  const relativePath = fieldPath.startsWith(prefix)
    ? fieldPath.slice(prefix.length)
    : fieldPath.replace(/^[A-Za-z0-9_]+\[\]\./, '');
  let current: unknown = row;
  for (const segment of relativePath.split('.').filter(Boolean)) {
    if (!isUnknownRecord(current)) return undefined;
    current = current[segment];
  }
  return current;
}

function formatDetailSampleValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }
  return '';
}

function detailPreviewCellText(
  column: GridDetailColumnSchema,
  rowIndex: number,
  row: unknown,
  hasSampleRows: boolean,
  dataSource: string,
): string {
  if (column.type === 'row_index') {
    return row !== undefined || !hasSampleRows ? `${rowIndex + 1}` : '';
  }
  if (column.type === 'static_text') return column.text ?? '';
  if (!hasSampleRows) return rowIndex === 0 ? '...' : '';
  const value = readDetailSampleValue(row, dataSource, column.fieldPath);
  if (column.display === 'image') return value ? '[图]' : '';
  return formatDetailSampleValue(value);
}

// key 不能依赖可编辑的 title/text：否则编辑标题时列表项重挂载，输入框每敲一键失焦
function detailColumnKey(
  column: GridDetailColumnSchema,
  index: number,
): string {
  return `${index}:${column.type ?? 'field'}:${column.fieldPath ?? 'static'}`;
}

function detailColumnDefaultTitle(
  column: GridDetailColumnSchema,
  fields: GridDesignerField[],
): string {
  if (column.type === 'row_index') return '序号';
  if (column.type === 'static_text') return column.text || '文本';
  return (
    fields.find((field) => field.fieldPath === column.fieldPath)?.fieldLabel ??
    column.fieldPath ??
    '列标题'
  );
}

function renderDetailRegionPreview(
  region: GridRegionSchema,
  columnCount: number,
  sampleData: unknown,
  onColumnDragStart?: (
    event: DragEvent<HTMLElement>,
    columnIndex: number,
  ) => void,
  dropIndex?: number,
) {
  const gridTemplateColumns = detailColumnGridTemplate(region.columns);
  const sampleRows = detailSampleRows(sampleData, region.dataSource);
  const previewRows = [{ index: 0, row: sampleRows[0] }];
  const detailFontSize = editorFontSize(region.style?.fontSize ?? 11);
  const detailLineHeight = region.style?.lineHeight ?? 1.35;
  const shouldWrap = region.style?.wrap !== false;
  return (
    <span
      style={{
        ...detailRegionPreviewStyle,
        color: region.style?.color ?? detailRegionPreviewStyle.color,
        fontSize: detailFontSize,
        lineHeight: detailLineHeight,
      }}
    >
      <span style={detailRegionMetaStyle}>
        <Typography.Text ellipsis style={{ maxWidth: '70%', fontSize: 11 }}>
          明细表
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {region.columns.length} 列
        </Typography.Text>
      </span>
      <span style={detailRegionTableStyle}>
        <span
          style={{
            ...detailRegionRowStyle,
            flex: '0 0 26px',
            gridTemplateColumns,
          }}
        >
          {region.columns.map((column, index) => (
            <span
              key={detailColumnKey(column, index)}
              draggable={Boolean(onColumnDragStart)}
              style={{
                ...detailRegionHeaderCellStyle,
                color: region.style?.color ?? detailRegionHeaderCellStyle.color,
                borderRight:
                  index === region.columns.length - 1
                    ? undefined
                    : detailRegionHeaderCellStyle.borderRight,
                boxShadow:
                  dropIndex === index
                    ? 'inset 2px 0 0 var(--ant-color-primary)'
                    : undefined,
              }}
              onDragStart={(event) => onColumnDragStart?.(event, index)}
            >
              <Typography.Text
                ellipsis
                style={{ color: 'inherit', fontSize: detailFontSize }}
              >
                {column.title}
              </Typography.Text>
            </span>
          ))}
        </span>
        {previewRows.map(({ index: rowIndex, row }) => (
          <span
            key={rowIndex}
            style={{
              ...detailRegionRowStyle,
              flex: '0 0 auto',
              gridTemplateColumns,
              minHeight: mmToPx(region.rowHeightMm),
            }}
          >
            {region.columns.map((column, columnIndex) => (
              <span
                key={`${rowIndex}-${detailColumnKey(column, columnIndex)}`}
                style={{
                  ...detailRegionBodyCellStyle,
                  alignItems: shouldWrap ? 'flex-start' : 'center',
                  color: region.style?.color ?? detailRegionBodyCellStyle.color,
                  borderRight:
                    columnIndex === region.columns.length - 1
                      ? undefined
                      : detailRegionBodyCellStyle.borderRight,
                  boxShadow:
                    dropIndex === columnIndex
                      ? 'inset 2px 0 0 var(--ant-color-primary)'
                      : columnIndex === region.columns.length - 1 &&
                          dropIndex === region.columns.length
                        ? 'inset -2px 0 0 var(--ant-color-primary)'
                        : undefined,
                  overflowWrap: shouldWrap ? 'anywhere' : undefined,
                  padding: shouldWrap ? '3px 6px' : '0 6px',
                  whiteSpace: shouldWrap ? 'pre-wrap' : 'nowrap',
                }}
              >
                <Typography.Text
                  ellipsis={!shouldWrap}
                  style={{
                    color: 'inherit',
                    fontSize: detailFontSize,
                    lineHeight: detailLineHeight,
                    maxWidth: '100%',
                    whiteSpace: 'inherit',
                  }}
                >
                  {detailPreviewCellText(
                    column,
                    rowIndex,
                    row,
                    sampleRows.length > 0,
                    region.dataSource,
                  )}
                </Typography.Text>
              </span>
            ))}
          </span>
        ))}
      </span>
      <span
        style={{
          ...detailRegionMetaStyle,
          borderBottom: 0,
          borderTop: `1px solid ${GRID_LINE_SUBTLE_COLOR}`,
          flexBasis: 22,
        }}
      >
        <Typography.Text ellipsis type="secondary" style={{ fontSize: 11 }}>
          {regionGridSummary(region, columnCount)}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {sampleRows.length > 0 ? `样例 ${sampleRows.length} 行 · ` : ''}
          最多 {region.maxRowsPerPage} 行/页
        </Typography.Text>
      </span>
    </span>
  );
}

function renumberRows(
  rows: GridPrintTemplateSchema['grid']['rows'],
): GridPrintTemplateSchema['grid']['rows'] {
  return rows.map((row, index) => ({ ...row, key: `${index + 1}` }));
}

function renumberColumns(
  columns: GridPrintTemplateSchema['grid']['columns'],
): GridPrintTemplateSchema['grid']['columns'] {
  return columns.map((column, index) => ({
    ...column,
    key: excelColumnLabel(index),
  }));
}

function normalizeCellForGrid(
  schema: GridPrintTemplateSchema,
  cell: GridCellSchema,
): GridCellSchema | undefined {
  const row = clampNumber(cell.row, 1, schema.grid.rows.length);
  const col = clampNumber(cell.col, 1, schema.grid.columns.length);
  const desiredRowSpan = clampNumber(
    cell.rowSpan ?? 1,
    1,
    schema.grid.rows.length - row + 1,
  );
  const desiredColSpan = clampNumber(
    cell.colSpan ?? 1,
    1,
    schema.grid.columns.length - col + 1,
  );
  const span = resolveAvailableSpan(
    schema,
    row,
    col,
    desiredRowSpan,
    desiredColSpan,
    cell.id,
  );
  if (
    !canPlaceCellArea(schema, row, col, span.rowSpan, span.colSpan, cell.id)
  ) {
    return undefined;
  }
  return {
    ...cell,
    row,
    col,
    rowSpan: span.rowSpan,
    colSpan: span.colSpan,
  };
}

function normalizeDetailRegionForGrid(
  schema: GridPrintTemplateSchema,
  region: GridRegionSchema,
): GridRegionSchema {
  const rowCount = schema.grid.rows.length;
  const columnCount = schema.grid.columns.length;
  const maxRowsPerPage = clampNumber(
    region.maxRowsPerPage,
    1,
    Math.max(1, rowCount - 2),
  );
  const startRow = clampNumber(
    region.startRow,
    1,
    Math.max(1, rowCount - maxRowsPerPage - 1),
  );
  const startCol = clampNumber(region.startCol, 1, columnCount);
  const colSpan = clampNumber(
    resolveRegionColSpan(region, columnCount),
    1,
    columnCount - startCol + 1,
  );
  return {
    ...region,
    startRow,
    startCol,
    colSpan,
    maxRowsPerPage,
  };
}

function normalizeDetailBandForGrid(
  schema: GridPrintTemplateSchema,
  band: GridDetailBandSchema,
): GridDetailBandSchema {
  const rowCount = schema.grid.rows.length;
  return {
    ...band,
    row: clampNumber(band.row, 1, Math.max(1, rowCount)),
    minRows: Math.max(0, band.minRows ?? 0),
    maxRowsPerPage: clampNumber(band.maxRowsPerPage, 1, Math.max(1, rowCount)),
  };
}

function normalizeRegionsForGrid(
  schema: GridPrintTemplateSchema,
): GridPrintTemplateSchema {
  return {
    ...schema,
    grid: {
      ...schema.grid,
      regions: schema.grid.regions?.map((region) =>
        normalizeDetailRegionForGrid(schema, region),
      ),
      detailBands: schema.grid.detailBands?.map((band) =>
        normalizeDetailBandForGrid(schema, band),
      ),
    },
  };
}

function detailArrayRootForContent(
  content: GridCellContent,
): string | undefined {
  if (content.type !== 'field' && content.type !== 'image') return undefined;
  return arrayRootOfFieldPath(content.fieldPath);
}

function isDetailBandCellContent(content: GridCellContent): boolean {
  return (
    content.type === 'detail_row_index' ||
    Boolean(detailArrayRootForContent(content))
  );
}

function ensureDetailBandForRow(
  schema: GridPrintTemplateSchema,
  row: number,
  arrayRoot: string,
): GridPrintTemplateSchema {
  const dataSource = `${arrayRoot}[]`;
  const existingBands = schema.grid.detailBands ?? [];
  const existing = existingBands.find((band) => band.row === row);
  const nextBand: GridDetailBandSchema = normalizeDetailBandForGrid(schema, {
    id: existing?.id ?? makeDetailBandId(),
    type: 'detail_band',
    dataSource,
    row,
    minRows: existing?.minRows ?? 0,
    maxRowsPerPage: existing?.maxRowsPerPage ?? DEFAULT_DETAIL_BAND_MAX_ROWS,
    overflow: existing?.overflow ?? 'continue_next_page',
  });
  const detailBands = existing
    ? existingBands.map((band) => (band.id === existing.id ? nextBand : band))
    : [...existingBands, nextBand];
  return {
    ...schema,
    grid: {
      ...schema.grid,
      detailBands,
    },
  };
}

function detailBandRootForRow(
  schema: GridPrintTemplateSchema,
  row: number,
): string | undefined {
  const band = schema.grid.detailBands?.find((item) => item.row === row);
  return arrayRootFromDataSource(band?.dataSource);
}

function detailFieldRootsInRow(
  schema: GridPrintTemplateSchema,
  row: number,
): string[] {
  const roots = schema.grid.cells
    .filter((cell) => cell.row === row)
    .map((cell) => detailArrayRootForContent(cell.content))
    .filter((root): root is string => Boolean(root));
  return Array.from(new Set(roots));
}

function canUseDetailContentInRow(
  schema: GridPrintTemplateSchema,
  row: number,
  content: GridCellContent,
): boolean {
  const contentRoot = detailArrayRootForContent(content);
  if (!contentRoot) return true;
  const bandRoot = detailBandRootForRow(schema, row);
  return !bandRoot || bandRoot === contentRoot;
}

function pruneEmptyDetailBands(
  schema: GridPrintTemplateSchema,
): GridPrintTemplateSchema {
  const detailBands = (schema.grid.detailBands ?? []).filter((band) =>
    schema.grid.cells.some(
      (cell) => cell.row === band.row && isDetailBandCellContent(cell.content),
    ),
  );
  return {
    ...schema,
    grid: {
      ...schema.grid,
      detailBands: detailBands.length > 0 ? detailBands : undefined,
    },
  };
}

function syncDetailBandsForCell(
  schema: GridPrintTemplateSchema,
  cell: GridCellSchema,
  fallbackArrayRoot?: string,
): GridPrintTemplateSchema {
  const arrayRoot =
    detailArrayRootForContent(cell.content) ??
    (cell.content.type === 'detail_row_index'
      ? (detailBandRootForRow(schema, cell.row) ?? fallbackArrayRoot)
      : undefined);
  const next = arrayRoot
    ? ensureDetailBandForRow(schema, cell.row, arrayRoot)
    : schema;
  return pruneEmptyDetailBands(next);
}

function sameGridSchema(
  current: GridPrintTemplateSchema,
  next: GridPrintTemplateSchema,
): boolean {
  return JSON.stringify(current) === JSON.stringify(next);
}

function insertRowInSchema(
  schema: GridPrintTemplateSchema,
  insertAt: number,
): GridPrintTemplateSchema {
  const sourceRow =
    schema.grid.rows[Math.min(insertAt - 1, schema.grid.rows.length - 1)];
  return {
    ...schema,
    grid: {
      ...schema.grid,
      rows: renumberRows([
        ...schema.grid.rows.slice(0, insertAt - 1),
        { key: `${insertAt}`, heightMm: sourceRow?.heightMm ?? 8 },
        ...schema.grid.rows.slice(insertAt - 1),
      ]),
      cells: schema.grid.cells.map((cell) => {
        const rowSpan = cell.rowSpan ?? 1;
        const endRow = cell.row + rowSpan - 1;
        if (cell.row >= insertAt) {
          return { ...cell, row: cell.row + 1 };
        }
        if (cell.row < insertAt && endRow >= insertAt) {
          return { ...cell, rowSpan: rowSpan + 1 };
        }
        return cell;
      }),
      regions: schema.grid.regions?.map((region) => {
        const endRow = region.startRow + regionRowSpan(region) - 1;
        if (region.startRow >= insertAt) {
          return { ...region, startRow: region.startRow + 1 };
        }
        if (region.startRow < insertAt && endRow >= insertAt) {
          return { ...region, maxRowsPerPage: region.maxRowsPerPage + 1 };
        }
        return region;
      }),
      detailBands: schema.grid.detailBands?.map((band) =>
        band.row >= insertAt ? { ...band, row: band.row + 1 } : band,
      ),
    },
  };
}

function insertColumnInSchema(
  schema: GridPrintTemplateSchema,
  insertAt: number,
): GridPrintTemplateSchema {
  const sourceColumn =
    schema.grid.columns[Math.min(insertAt - 1, schema.grid.columns.length - 1)];
  const nextColumnCount = schema.grid.columns.length + 1;
  return {
    ...schema,
    grid: {
      ...schema.grid,
      columns: renumberColumns([
        ...schema.grid.columns.slice(0, insertAt - 1),
        {
          key: excelColumnLabel(insertAt - 1),
          widthMm: sourceColumn?.widthMm ?? 24,
        },
        ...schema.grid.columns.slice(insertAt - 1),
      ]),
      cells: schema.grid.cells.map((cell) => {
        const colSpan = cell.colSpan ?? 1;
        const endCol = cell.col + colSpan - 1;
        if (cell.col >= insertAt) {
          return { ...cell, col: cell.col + 1 };
        }
        if (cell.col < insertAt && endCol >= insertAt) {
          return { ...cell, colSpan: colSpan + 1 };
        }
        return cell;
      }),
      regions: schema.grid.regions?.map((region) => {
        const colSpan = resolveRegionColSpan(
          region,
          schema.grid.columns.length,
        );
        const endCol = region.startCol + colSpan - 1;
        if (region.startCol >= insertAt) {
          return { ...region, startCol: region.startCol + 1 };
        }
        if (region.startCol < insertAt && endCol >= insertAt) {
          return { ...region, colSpan: colSpan + 1 };
        }
        const spansToLastColumn = endCol === schema.grid.columns.length;
        return spansToLastColumn
          ? { ...region, colSpan: nextColumnCount - region.startCol + 1 }
          : region;
      }),
    },
  };
}

function deleteRowFromSchema(
  schema: GridPrintTemplateSchema,
  targetRow: number,
): { next: GridPrintTemplateSchema; removedCellIds: Set<string> } {
  const removedCellIds = new Set<string>();
  const cells = schema.grid.cells
    .map((cell) => {
      const rowSpan = cell.rowSpan ?? 1;
      const endRow = cell.row + rowSpan - 1;
      if (cell.row > targetRow) return { ...cell, row: cell.row - 1 };
      if (cell.row <= targetRow && endRow >= targetRow) {
        if (rowSpan <= 1) {
          removedCellIds.add(cell.id);
          return undefined;
        }
        return { ...cell, rowSpan: rowSpan - 1 };
      }
      return cell;
    })
    .filter((cell): cell is GridCellSchema => Boolean(cell));
  const rows = renumberRows(
    schema.grid.rows.filter((_, index) => index !== targetRow - 1),
  );
  const next: GridPrintTemplateSchema = {
    ...schema,
    grid: {
      ...schema.grid,
      rows,
      cells,
      regions: schema.grid.regions?.map((region) => {
        const rowSpan = regionRowSpan(region);
        const endRow = region.startRow + rowSpan - 1;
        if (region.startRow > targetRow) {
          return { ...region, startRow: region.startRow - 1 };
        }
        if (region.startRow <= targetRow && endRow >= targetRow) {
          return {
            ...region,
            startRow: Math.min(region.startRow, rows.length),
            maxRowsPerPage: Math.max(1, region.maxRowsPerPage - 1),
          };
        }
        return region;
      }),
      detailBands: schema.grid.detailBands
        ?.filter((band) => band.row !== targetRow)
        .map((band) =>
          band.row > targetRow ? { ...band, row: band.row - 1 } : band,
        ),
    },
  };
  return {
    removedCellIds,
    next: normalizeRegionsForGrid(next),
  };
}

function deleteColumnFromSchema(
  schema: GridPrintTemplateSchema,
  targetCol: number,
): { next: GridPrintTemplateSchema; removedCellIds: Set<string> } {
  const removedCellIds = new Set<string>();
  const cells = schema.grid.cells
    .map((cell) => {
      const colSpan = cell.colSpan ?? 1;
      const endCol = cell.col + colSpan - 1;
      if (cell.col > targetCol) return { ...cell, col: cell.col - 1 };
      if (cell.col <= targetCol && endCol >= targetCol) {
        if (colSpan <= 1) {
          removedCellIds.add(cell.id);
          return undefined;
        }
        return { ...cell, colSpan: colSpan - 1 };
      }
      return cell;
    })
    .filter((cell): cell is GridCellSchema => Boolean(cell));
  const columns = renumberColumns(
    schema.grid.columns.filter((_, index) => index !== targetCol - 1),
  );
  const next: GridPrintTemplateSchema = {
    ...schema,
    grid: {
      ...schema.grid,
      columns,
      cells,
      regions: schema.grid.regions?.map((region) => {
        const colSpan = resolveRegionColSpan(
          region,
          schema.grid.columns.length,
        );
        const endCol = region.startCol + colSpan - 1;
        if (region.startCol > targetCol) {
          return { ...region, startCol: region.startCol - 1 };
        }
        if (region.startCol <= targetCol && endCol >= targetCol) {
          return {
            ...region,
            startCol: Math.min(region.startCol, columns.length),
            colSpan: Math.max(1, colSpan - 1),
          };
        }
        return region;
      }),
    },
  };
  return {
    removedCellIds,
    next: normalizeRegionsForGrid(next),
  };
}

function defaultSpanForContent(content: GridCellContent): {
  rowSpan: number;
  colSpan: number;
} {
  if (content.type === 'signature_box') {
    return { rowSpan: 2, colSpan: 3 };
  }
  if (content.type === 'qrcode' || content.type === 'barcode') {
    return { rowSpan: 2, colSpan: 2 };
  }
  if (
    content.type === 'field_label_value' ||
    content.type === 'aggregate_field' ||
    content.type === 'static_text'
  ) {
    return { rowSpan: 1, colSpan: 2 };
  }
  return { rowSpan: 1, colSpan: 1 };
}

function defaultStyleForContent(content: GridCellContent): GridCellStyle {
  if (content.type === 'signature_box') {
    return {
      border: { ...DEFAULT_NO_CELL_BORDER },
      textAlign: 'center',
      verticalAlign: 'bottom',
    };
  }
  if (content.type === 'qrcode' || content.type === 'barcode') {
    return {
      border: { ...DEFAULT_NO_CELL_BORDER },
      textAlign: 'center',
      verticalAlign: 'middle',
    };
  }
  if (content.type === 'detail_row_index') {
    return {
      border: { top: true, right: true, bottom: true, left: true },
      textAlign: 'center',
      verticalAlign: 'middle',
    };
  }
  return { border: { ...DEFAULT_NO_CELL_BORDER }, verticalAlign: 'middle' };
}

function parseGridDragPayload(raw: string): GridDragPayload | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return undefined;
    }
    const record = parsed as Record<string, unknown>;
    if (
      record.kind === 'field' &&
      typeof record.fieldPath === 'string' &&
      record.fieldPath
    ) {
      return { kind: 'field', fieldPath: record.fieldPath };
    }
    if (
      record.kind === 'boundField' &&
      typeof record.fieldPath === 'string' &&
      record.fieldPath &&
      typeof record.contentType === 'string' &&
      [
        'field',
        'field_label_value',
        'qrcode',
        'barcode',
        'image',
        'signature_box',
      ].includes(record.contentType)
    ) {
      return {
        kind: 'boundField',
        fieldPath: record.fieldPath,
        contentType: record.contentType as BoundFieldContentType,
      };
    }
    if (
      record.kind === 'detailField' &&
      typeof record.fieldPath === 'string' &&
      record.fieldPath
    ) {
      return { kind: 'detailField', fieldPath: record.fieldPath };
    }
    if (
      record.kind === 'aggregateField' &&
      typeof record.fieldPath === 'string' &&
      record.fieldPath &&
      (record.aggregate === 'sum' || record.aggregate === 'count')
    ) {
      return {
        kind: 'aggregateField',
        fieldPath: record.fieldPath,
        aggregate: record.aggregate,
      };
    }
    if (record.kind === 'resizeCell' && typeof record.cellId === 'string') {
      return { kind: 'resizeCell', cellId: record.cellId };
    }
    if (record.kind === 'resizeRegion' && typeof record.regionId === 'string') {
      return { kind: 'resizeRegion', regionId: record.regionId };
    }
    if (
      record.kind === 'moveDetailColumn' &&
      typeof record.regionId === 'string' &&
      typeof record.columnIndex === 'number'
    ) {
      return {
        kind: 'moveDetailColumn',
        regionId: record.regionId,
        columnIndex: record.columnIndex,
      };
    }
    if (
      record.kind === 'component' &&
      typeof record.contentType === 'string' &&
      [
        'static_text',
        'field',
        'field_label_value',
        'barcode',
        'qrcode',
        'image',
        'page_number',
        'copy_mark',
        'signature_box',
        'aggregate_field',
        'detail_row_index',
      ].includes(record.contentType)
    ) {
      return {
        kind: 'component',
        contentType: record.contentType as GridContentType,
      };
    }
    if (
      record.kind === 'moveCell' &&
      typeof record.cellId === 'string' &&
      typeof record.rowOffset === 'number' &&
      typeof record.colOffset === 'number'
    ) {
      return {
        kind: 'moveCell',
        cellId: record.cellId,
        rowOffset: record.rowOffset,
        colOffset: record.colOffset,
      };
    }
    if (
      record.kind === 'moveRegion' &&
      typeof record.regionId === 'string' &&
      typeof record.rowOffset === 'number' &&
      typeof record.colOffset === 'number'
    ) {
      return {
        kind: 'moveRegion',
        regionId: record.regionId,
        rowOffset: record.rowOffset,
        colOffset: record.colOffset,
      };
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function styleFromCellStyle(style?: GridCellStyle): CSSProperties {
  const border = style?.border;
  const shouldWrap = style?.wrap !== false;
  return {
    borderTop: border?.top === false ? undefined : DEFAULT_CELL_BORDER,
    borderRight: border?.right === false ? undefined : DEFAULT_CELL_BORDER,
    borderBottom: border?.bottom === false ? undefined : DEFAULT_CELL_BORDER,
    borderLeft: border?.left === false ? undefined : DEFAULT_CELL_BORDER,
    fontSize:
      style?.fontSize === undefined
        ? undefined
        : editorFontSize(style.fontSize),
    lineHeight: style?.lineHeight,
    fontWeight: style?.fontWeight,
    color: style?.color,
    backgroundColor: style?.backgroundColor,
    whiteSpace: shouldWrap ? 'pre-wrap' : 'nowrap',
    overflowWrap: shouldWrap ? 'anywhere' : 'normal',
    wordBreak: shouldWrap ? 'break-word' : 'normal',
  };
}

function groupFields(fields: GridDesignerField[]) {
  const groups = new Map<string, GridDesignerField[]>();
  for (const field of fields) {
    const groupName = field.groupName || '其他';
    groups.set(groupName, [...(groups.get(groupName) ?? []), field]);
  }
  return Array.from(groups.entries()).map(([groupName, groupFields]) => ({
    groupName,
    fields: groupFields,
  }));
}

function fieldAliasFromLabel(label: string): string {
  const readableLabel = label.trim();
  return readableLabel ? `$${readableLabel}` : '$字段';
}

function fallbackFieldAlias(fieldPath: string): string {
  const shortPathSegments = fieldPath
    .replace(/^[A-Za-z0-9_]+\[\]\./, '')
    .split('.')
    .filter(Boolean);
  const shortPath = shortPathSegments[shortPathSegments.length - 1];
  return fieldAliasFromLabel(shortPath ?? fieldPath);
}

function fieldAliasForPath(
  fieldPath: string | undefined,
  fieldAliasByPath: Map<string, string>,
  fallback = '$字段',
): string {
  if (!fieldPath) return fallback;
  return fieldAliasByPath.get(fieldPath) ?? fallbackFieldAlias(fieldPath);
}

function contentLabel(
  content: GridCellContent,
  fieldAliasByPath: Map<string, string>,
): string {
  if (content.type === 'static_text') return content.text ?? '文本';
  if (content.type === 'detail_row_index') return '序号';
  if (content.type === 'field') {
    return fieldAliasForPath(content.fieldPath, fieldAliasByPath);
  }
  if (content.type === 'field_label_value') {
    return `${content.label ?? ''}${fieldAliasForPath(
      content.fieldPath,
      fieldAliasByPath,
    )}`;
  }
  if (content.type === 'aggregate_field') {
    return `${content.label ?? '合计: '}${fieldAliasForPath(
      content.fieldPath,
      fieldAliasByPath,
    )}`;
  }
  if (content.type === 'qrcode') {
    return `二维码 ${fieldAliasForPath(
      content.fieldPath,
      fieldAliasByPath,
      '',
    )}`;
  }
  if (content.type === 'barcode') {
    return `条码 ${fieldAliasForPath(content.fieldPath, fieldAliasByPath, '')}`;
  }
  if (content.type === 'copy_mark') return '联别';
  if (content.type === 'page_number') return '页码';
  if (content.type === 'signature_box') {
    return [
      content.label ?? '签收',
      fieldAliasForPath(content.fieldPath, fieldAliasByPath, ''),
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (content.type === 'image') return '图片';
  return '';
}

function contentTypeLabel(type: GridContentType): string {
  if (type === 'static_text') return '静态文本';
  if (type === 'field') return '字段';
  if (type === 'field_label_value') return '标签字段';
  if (type === 'aggregate_field') return '合计字段';
  if (type === 'detail_row_index') return '明细序号';
  if (type === 'qrcode') return '二维码';
  if (type === 'barcode') return '条码';
  if (type === 'signature_box') return '签收区';
  if (type === 'page_number') return '页码';
  if (type === 'copy_mark') return '联别';
  if (type === 'image') return '图片';
  return type;
}

function renderCellPreview(
  content: GridCellContent,
  fieldAliasByPath: Map<string, string>,
) {
  if (content.type === 'qrcode' || content.type === 'barcode') {
    const isQrcode = content.type === 'qrcode';
    const codeText = content.fieldPath
      ? fieldAliasForPath(content.fieldPath, fieldAliasByPath)
      : (content.text ?? 'CODE');
    return (
      <span style={codePreviewStyle}>
        <span style={isQrcode ? qrcodeSampleStyle : barcodeSampleStyle}>
          {isQrcode ? <QrcodeOutlined /> : <BarcodeOutlined />}
        </span>
        <Typography.Text ellipsis style={{ maxWidth: '100%', fontSize: 11 }}>
          {isQrcode ? '二维码' : '条码'}
        </Typography.Text>
        <Typography.Text
          ellipsis
          type="secondary"
          style={{ maxWidth: '100%', fontSize: 10 }}
        >
          {codeText}
        </Typography.Text>
      </span>
    );
  }
  if (content.type === 'image') {
    if (!content.fieldPath && content.src?.startsWith('data:image/')) {
      return <img alt="图片" src={content.src} style={imagePreviewStyle} />;
    }
    return (
      <span style={codePreviewStyle}>
        <span style={qrcodeSampleStyle}>
          <FileImageOutlined />
        </span>
        <Typography.Text ellipsis style={{ maxWidth: '100%', fontSize: 11 }}>
          图片
        </Typography.Text>
        <Typography.Text
          ellipsis
          type="secondary"
          style={{ maxWidth: '100%', fontSize: 10 }}
        >
          {content.fieldPath
            ? fieldAliasForPath(content.fieldPath, fieldAliasByPath)
            : (content.src ?? '图片字段')}
        </Typography.Text>
      </span>
    );
  }
  if (content.type === 'aggregate_field') {
    return (
      <span style={codePreviewStyle}>
        <span style={qrcodeSampleStyle}>
          <CalculatorOutlined />
        </span>
        <Typography.Text ellipsis style={{ maxWidth: '100%', fontSize: 11 }}>
          {content.aggregate === 'sum' ? '求和' : '计数'}
        </Typography.Text>
        <Typography.Text
          ellipsis
          type="secondary"
          style={{ maxWidth: '100%', fontSize: 10 }}
        >
          {fieldAliasForPath(content.fieldPath, fieldAliasByPath, '$明细字段')}
        </Typography.Text>
      </span>
    );
  }
  return (
    <span style={cellPreviewTextStyle}>
      {contentLabel(content, fieldAliasByPath)}
    </span>
  );
}

function canEditCellText(content: GridCellContent): boolean {
  return content.type === 'static_text';
}

interface StaticTextEditorProps {
  cellId: string;
  onCommit: (text: string) => void;
  value: string;
}

function StaticTextEditor({ cellId, onCommit, value }: StaticTextEditorProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [cellId, value]);

  return (
    <Space orientation="vertical" size={4} style={{ width: '100%' }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        文本（支持在光标处换行）
      </Typography.Text>
      <Input.TextArea
        aria-label="静态文本"
        rows={6}
        style={{ resize: 'vertical' }}
        value={draft}
        onBlur={() => {
          if (draft !== value) onCommit(draft);
        }}
        onChange={(event) => setDraft(event.target.value)}
      />
    </Space>
  );
}

function canEditCellLabel(content: GridCellContent): boolean {
  return (
    content.type === 'field_label_value' ||
    content.type === 'signature_box' ||
    content.type === 'aggregate_field'
  );
}

function canBindCellField(content: GridCellContent): boolean {
  return (
    content.type === 'field' ||
    content.type === 'field_label_value' ||
    content.type === 'qrcode' ||
    content.type === 'barcode' ||
    content.type === 'image' ||
    content.type === 'signature_box'
  );
}

function upsertCell(
  schema: GridPrintTemplateSchema,
  cell: GridCellSchema,
): GridPrintTemplateSchema {
  return {
    ...schema,
    grid: {
      ...schema.grid,
      cells: schema.grid.cells.some((item) => item.id === cell.id)
        ? schema.grid.cells.map((item) => (item.id === cell.id ? cell : item))
        : [...schema.grid.cells, cell],
    },
  };
}

function resizeCellInSchema(
  schema: GridPrintTemplateSchema,
  cellId: string,
  row: number,
  col: number,
): GridPrintTemplateSchema | undefined {
  const cell = schema.grid.cells.find((item) => item.id === cellId);
  if (!cell) return undefined;
  const rowSpan = clampNumber(
    row - cell.row + 1,
    1,
    schema.grid.rows.length - cell.row + 1,
  );
  const colSpan = clampNumber(
    col - cell.col + 1,
    1,
    schema.grid.columns.length - cell.col + 1,
  );
  if (
    !canPlaceCellArea(schema, cell.row, cell.col, rowSpan, colSpan, cell.id)
  ) {
    return undefined;
  }
  return upsertCell(schema, {
    ...cell,
    rowSpan,
    colSpan,
  });
}

function resizeDetailRegionInSchema(
  schema: GridPrintTemplateSchema,
  regionId: string,
  row: number,
  col: number,
): GridPrintTemplateSchema | undefined {
  const region = schema.grid.regions?.find((item) => item.id === regionId);
  if (!region) return undefined;
  const rowSpan = clampNumber(
    row - region.startRow + 1,
    3,
    schema.grid.rows.length - region.startRow + 1,
  );
  const colSpan = clampNumber(
    col - region.startCol + 1,
    1,
    schema.grid.columns.length - region.startCol + 1,
  );
  if (
    !canPlaceCellArea(
      schema,
      region.startRow,
      region.startCol,
      rowSpan,
      colSpan,
      undefined,
      region.id,
    )
  ) {
    return undefined;
  }
  return {
    ...schema,
    grid: {
      ...schema.grid,
      regions: (schema.grid.regions ?? []).map((item) =>
        item.id === region.id
          ? normalizeDetailRegionForGrid(schema, {
              ...item,
              colSpan,
              maxRowsPerPage: rowSpan - 2,
            })
          : item,
      ),
    },
  };
}

function updateDetailColumns(
  schema: GridPrintTemplateSchema,
  regionId: string,
  columns: GridDetailColumnSchema[],
): GridPrintTemplateSchema {
  const regions = schema.grid.regions ?? [];
  return {
    ...schema,
    grid: {
      ...schema.grid,
      regions: regions.map((region) =>
        region.id === regionId
          ? {
              ...region,
              columns,
              summary: detailSummaryForColumns(columns, region.summary),
            }
          : region,
      ),
    },
  };
}

function selectedArrayColumns(
  schema: GridPrintTemplateSchema,
  regionId?: string,
  detailBandRow?: number,
  arrayRoot?: string,
): string[] {
  if (detailBandRow) {
    return schema.grid.cells
      .filter((cell) => cell.row === detailBandRow)
      .map((cell) => cell.content.fieldPath)
      .filter((fieldPath): fieldPath is string => {
        if (!fieldPath) return false;
        const root = arrayRootOfFieldPath(fieldPath);
        return Boolean(root && (!arrayRoot || root === arrayRoot));
      });
  }
  const region = schema.grid.regions?.find((item) => item.id === regionId);
  return (
    region?.columns
      .map((column) => column.fieldPath)
      .filter((fieldPath): fieldPath is string => Boolean(fieldPath)) ?? []
  );
}

function arrayRootFromDataSource(dataSource?: string): string | undefined {
  const matched = dataSource?.match(/^([A-Za-z0-9_]+)\[\]$/);
  return matched?.[1];
}

function labelForArrayRoot(root: string, fields: GridDesignerField[]) {
  return (
    fields.find((field) => arrayRootOfFieldPath(field.fieldPath) === root)
      ?.groupName ?? root
  );
}

function isRegisteredScalarFieldPath(
  fieldPath: string | undefined,
  scalarFields: GridDesignerField[],
): fieldPath is string {
  return Boolean(
    fieldPath && scalarFields.some((field) => field.fieldPath === fieldPath),
  );
}

function preferredCodeField(
  scalarFields: GridDesignerField[],
): GridDesignerField | undefined {
  return (
    scalarFields.find((field) => field.requiredInTemplate) ??
    scalarFields.find((field) => field.fieldType === 'string') ??
    scalarFields[0]
  );
}

function isBoundFieldContentType(
  type: PaletteComponentKind,
): type is BoundFieldContentType {
  return [
    'field',
    'field_label_value',
    'qrcode',
    'barcode',
    'image',
    'signature_box',
  ].includes(type);
}

function codeContentForType(
  type: 'barcode' | 'qrcode',
  current: GridCellContent,
  scalarFields: GridDesignerField[],
): GridCellContent {
  if (isRegisteredScalarFieldPath(current.fieldPath, scalarFields)) {
    return { type, fieldPath: current.fieldPath };
  }
  if (current.text?.trim()) {
    return { type, text: current.text };
  }
  const field = preferredCodeField(scalarFields);
  return field ? { type, fieldPath: field.fieldPath } : { type, text: 'CODE' };
}

function defaultAggregateForField(
  field: GridDesignerField,
): GridAggregateType {
  return field.fieldType === 'number' ? 'sum' : 'count';
}

function aggregateLabelForField(
  field: GridDesignerField,
  aggregate: GridAggregateType,
): string {
  return aggregate === 'sum'
    ? `${field.fieldLabel}合计: `
    : `${field.groupName || '明细'}数量: `;
}

function aggregateContentForField(
  field: GridDesignerField,
  aggregate: GridAggregateType = defaultAggregateForField(field),
): GridCellContent {
  return {
    type: 'aggregate_field',
    label: aggregateLabelForField(field, aggregate),
    fieldPath: field.fieldPath,
    aggregate,
    ...(field.formatType ? { formatType: field.formatType } : {}),
  };
}

function contentForType(
  type: GridContentType,
  current: GridCellContent,
  scalarFields: GridDesignerField[],
  arrayFields: GridDesignerField[] = [],
): GridCellContent | undefined {
  switch (type) {
    case 'static_text':
      return { type, text: current.text ?? '自定义文本' };
    case 'field': {
      const fieldPath = isRegisteredScalarFieldPath(
        current.fieldPath,
        scalarFields,
      )
        ? current.fieldPath
        : scalarFields[0]?.fieldPath;
      return { type, fieldPath };
    }
    case 'field_label_value': {
      const fieldPath = isRegisteredScalarFieldPath(
        current.fieldPath,
        scalarFields,
      )
        ? current.fieldPath
        : scalarFields[0]?.fieldPath;
      return {
        type,
        label: current.label ?? (fieldPath ? '字段: ' : ''),
        fieldPath,
      };
    }
    case 'barcode':
    case 'qrcode':
      return codeContentForType(type, current, scalarFields);
    case 'signature_box': {
      const fieldPath = isRegisteredScalarFieldPath(
        current.fieldPath,
        scalarFields,
      )
        ? current.fieldPath
        : undefined;
      return { type, label: current.label ?? '签收/盖章', fieldPath };
    }
    case 'page_number':
    case 'copy_mark':
      return { type };
    case 'aggregate_field': {
      const field =
        arrayFields.find((item) => item.fieldType === 'number') ??
        arrayFields[0];
      return field ? aggregateContentForField(field) : undefined;
    }
    case 'detail_row_index':
      return { type };
    case 'image': {
      const fieldPath = isRegisteredScalarFieldPath(
        current.fieldPath,
        scalarFields,
      )
        ? current.fieldPath
        : undefined;
      return fieldPath
        ? { type, fieldPath }
        : { type, src: current.src ?? DEFAULT_IMAGE_SRC };
    }
    default:
      return current;
  }
}

/** @sunxu-component mes-specific @sunxu-domain mes-print-grid-designer @sunxu-reason Keeps the MES grid template schema, preset migration, canvas editing, history, detail-band configuration, paper-width guide, and preview affordance while the host injects authorized field metadata, sample data, paper metrics, and draft preview. */
export function GridPrintDesigner({
  value,
  onChange,
  businessName,
  businessType,
  templateType,
  paperProfile,
  dataSource,
  onPreview,
  previewLoading,
}: GridPrintDesignerProps) {
  const { token } = theme.useToken();
  const designerShellRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLDivElement>(null);
  const resizeCleanupRef = useRef<(() => void) | undefined>(undefined);
  const [fields, setFields] = useState<GridDesignerField[]>([]);
  const [sampleData, setSampleData] = useState<unknown>();
  const [immersiveContainer, setImmersiveContainer] = useState<HTMLElement>();
  // 设计器首次渲染时字段和样例数据尚未请求完成；已有模板的 value
  // 不能作为数据已就绪的依据，否则会先渲染出原始 fieldPath/空样例，再切换到正式内容。
  const [loading, setLoading] = useState(() =>
    Boolean(businessType && templateType),
  );
  const [selectedCellId, setSelectedCellId] = useState<string>('title');
  const [selectedRegionId, setSelectedRegionId] = useState<string>();
  const [selectedGridCell, setSelectedGridCell] =
    useState<SelectedGridCellPosition>();
  const [activeArrayRoot, setActiveArrayRoot] = useState<string>();
  // 合并选区：普通点击设锚点，Shift+点击设终点；列头/行号拖选沿当前行/列扩展
  const [mergeAnchor, setMergeAnchor] = useState<SelectedGridCellPosition>();
  const [mergeFocus, setMergeFocus] = useState<SelectedGridCellPosition>();
  const [headerSelection, setHeaderSelection] = useState<HeaderSelection>();
  const headerDragRef = useRef<HeaderSelection | null>(null);
  // 弹层经 hook contextHolder 挂进设计器容器，沉浸编辑 portal 后仍保持
  // message / Modal 与设计器同一层级和上下文。
  const [messageApi, messageContextHolder] = message.useMessage();
  const [modalApi, modalContextHolder] = Modal.useModal();
  useEffect(() => {
    const endHeaderDrag = () => {
      headerDragRef.current = null;
    };
    const clearMergeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMergeAnchor(undefined);
        setMergeFocus(undefined);
        setHeaderSelection(undefined);
      }
    };
    window.addEventListener('pointerup', endHeaderDrag);
    window.addEventListener('pointercancel', endHeaderDrag);
    window.addEventListener('keydown', clearMergeOnEscape);
    return () => {
      window.removeEventListener('pointerup', endHeaderDrag);
      window.removeEventListener('pointercancel', endHeaderDrag);
      window.removeEventListener('keydown', clearMergeOnEscape);
    };
  }, []);
  const [activePaletteComponent, setActivePaletteComponent] =
    useState<PaletteComponentKind>('field_label_value');
  const [dragOverGridKey, setDragOverGridKey] = useState<string>();
  const [detailColumnDropTarget, setDetailColumnDropTarget] =
    useState<DetailColumnDropTarget>();
  const [activeDragOperation, setActiveDragOperation] = useState<
    'copy' | 'move'
  >();
  const [selectedPreset, setSelectedPreset] =
    useState<GridTemplatePreset>('standard_table');
  // 总行/总列输入允许用户逐字编辑，不能把中间值直接当成版式变更。
  // 例如 12 改成 20 时，InputNumber 可能先回传 2；若立即缩容会先删掉内容。
  const [rowCountDraft, setRowCountDraft] = useState<number | null | undefined>(
    undefined,
  );
  const [columnCountDraft, setColumnCountDraft] = useState<
    number | null | undefined
  >(undefined);
  const rowCountDraftRef = useRef<number | null | undefined>(undefined);
  const columnCountDraftRef = useRef<number | null | undefined>(undefined);
  const [history, setHistory] = useState<GridHistoryState>({
    past: [],
    future: [],
  });
  const gridTemplateType =
    templateType === 'document_flow' || templateType === 'continuous_fixed'
      ? templateType
      : undefined;
  const canUseGrid = Boolean(businessType) && Boolean(gridTemplateType);
  const isImmersive = Boolean(immersiveContainer);

  useEffect(
    () => () => {
      resizeCleanupRef.current?.();
    },
    [],
  );

  useEffect(() => {
    if (
      !businessType ||
      (templateType !== 'document_flow' && templateType !== 'continuous_fixed')
    ) {
      setFields([]);
      setSampleData(undefined);
      setLoading(false);
      return;
    }
    if (!dataSource) {
      setFields([]);
      setSampleData(undefined);
      setLoading(false);
      return;
    }
    let isActive = true;
    setLoading(true);
    const request: GridPrintDesignerDataRequest = {
      businessType,
      templateType,
    };
    Promise.all([
      dataSource.loadFields(request),
      dataSource.loadSampleData({ businessType }),
    ])
      .then(([rows, nextSampleData]) => {
        if (!isActive) return;
        setFields(rows);
        setSampleData(nextSampleData);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setFields([]);
        setSampleData(undefined);
        dataSource.onLoadError?.(error, request);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [businessType, dataSource, templateType]);

  const schema = useMemo(() => {
    if (
      !businessType ||
      (templateType !== 'document_flow' && templateType !== 'continuous_fixed')
    ) {
      return undefined;
    }
    if (!value && fields.length === 0) {
      return undefined;
    }
    return normalizeGridTemplateSchema(
      value,
      businessType,
      templateType,
      fields,
      businessName,
    );
  }, [businessName, businessType, fields, templateType, value]);

  useEffect(() => {
    if (!schema || value) return;
    onChange?.(schema);
  }, [onChange, schema, value]);

  useEffect(() => {
    setHistory({ past: [], future: [] });
  }, [businessType, templateType]);

  useEffect(() => {
    rowCountDraftRef.current = undefined;
    columnCountDraftRef.current = undefined;
    setRowCountDraft(undefined);
    setColumnCountDraft(undefined);
  }, [schema]);

  useEffect(() => {
    if (!gridTemplateType) return;
    setSelectedPreset(defaultGridPresetForTemplateType(gridTemplateType));
  }, [businessType, gridTemplateType]);

  const scalarFields = useMemo(
    () => fields.filter((field) => field.visible && !field.isArray),
    [fields],
  );
  const selectedCell = useMemo(
    () => schema?.grid.cells.find((cell) => cell.id === selectedCellId),
    [schema, selectedCellId],
  );
  const selectedRegion = useMemo(
    () =>
      schema?.grid.regions?.find((region) => region.id === selectedRegionId),
    [schema, selectedRegionId],
  );
  const selectedGridColumn = selectedGridCell
    ? schema?.grid.columns[selectedGridCell.col - 1]
    : undefined;
  const selectedGridRow = selectedGridCell
    ? schema?.grid.rows[selectedGridCell.row - 1]
    : undefined;
  const firstDetailRegion = useMemo(
    () => schema?.grid.regions?.find((item) => item.type === 'detail_table'),
    [schema],
  );
  const selectedDetailBand = useMemo(() => {
    const row = selectedCell?.row ?? selectedGridCell?.row;
    return row
      ? schema?.grid.detailBands?.find((band) => band.row === row)
      : undefined;
  }, [schema, selectedCell?.row, selectedGridCell?.row]);
  const firstDetailBand = useMemo(
    () => schema?.grid.detailBands?.[0],
    [schema],
  );
  const activeDetailRegion =
    selectedRegion ??
    (activePaletteComponent === 'detail_table' ? firstDetailRegion : undefined);
  const activeDetailBand = selectedDetailBand ?? firstDetailBand;
  const detailRegionId = activeDetailRegion?.id;
  const arrayRoots = useMemo(() => arrayRootsFromFields(fields), [fields]);
  const activeArrayRootInFields =
    activeArrayRoot && arrayRoots.includes(activeArrayRoot)
      ? activeArrayRoot
      : undefined;
  const detailArrayRoot =
    arrayRootFromDataSource(selectedDetailBand?.dataSource) ??
    arrayRootFromDataSource(activeDetailRegion?.dataSource) ??
    activeArrayRootInFields ??
    arrayRootFromDataSource(firstDetailBand?.dataSource) ??
    arrayRoots[0] ??
    'items';
  const aggregateArrayRoot =
    activeArrayRootInFields ??
    arrayRootFromDataSource(activeDetailRegion?.dataSource) ??
    arrayRoots[0] ??
    'items';
  const arrayRootOptions = useMemo(
    () =>
      arrayRoots.map((root) => ({
        label: labelForArrayRoot(root, fields),
        value: root,
      })),
    [arrayRoots, fields],
  );
  const arrayFields = useMemo(
    () => detailFieldsForArrayRoot(fields, detailArrayRoot),
    [detailArrayRoot, fields],
  );
  const fieldAliasByPath = useMemo(
    () =>
      new Map(
        fields.map((field) => [
          field.fieldPath,
          fieldAliasFromLabel(field.fieldLabel),
        ]),
      ),
    [fields],
  );
  const aggregateArrayFields = useMemo(
    () => detailFieldsForArrayRoot(fields, aggregateArrayRoot),
    [aggregateArrayRoot, fields],
  );
  const allArrayFields = useMemo(
    () => fields.filter((field) => field.visible && field.isArray),
    [fields],
  );
  const arrayFieldOptions = useMemo<FieldOption[]>(
    () =>
      allArrayFields.map((field) => ({
        label: `${field.groupName} / ${field.fieldLabel}`,
        value: field.fieldPath,
      })),
    [allArrayFields],
  );
  const arrayFieldByPath = useMemo(
    () => new Map(allArrayFields.map((field) => [field.fieldPath, field])),
    [allArrayFields],
  );
  const scalarFieldOptions = useMemo<FieldOption[]>(
    () =>
      scalarFields.map((field) => ({
        label: `${field.groupName} / ${field.fieldLabel}`,
        value: field.fieldPath,
      })),
    [scalarFields],
  );
  const selectedCellInDetailBand = Boolean(
    selectedCell &&
      schema?.grid.detailBands?.some((band) => band.row === selectedCell.row),
  );
  const selectedCellUsesDetailField = Boolean(
    selectedCell &&
      (arrayRootOfFieldPath(selectedCell.content.fieldPath) ||
        (selectedCellInDetailBand &&
          (selectedCell.content.type === 'field' ||
            selectedCell.content.type === 'image'))),
  );
  const selectedCellArrayFieldOptions = useMemo<FieldOption[]>(() => {
    if (!selectedCellInDetailBand || !selectedCell || !schema) {
      return arrayFieldOptions;
    }
    const rowRoot =
      detailBandRootForRow(schema, selectedCell.row) ??
      arrayRootOfFieldPath(selectedCell.content.fieldPath);
    const scopedFields = rowRoot
      ? detailFieldsForArrayRoot(fields, rowRoot)
      : allArrayFields;
    return scopedFields.map((field) => ({
      label: `${field.groupName} / ${field.fieldLabel}`,
      value: field.fieldPath,
    }));
  }, [
    allArrayFields,
    arrayFieldOptions,
    fields,
    schema,
    selectedCell,
    selectedCellInDetailBand,
  ]);
  const bindableFieldOptions = selectedCellUsesDetailField
    ? selectedCellArrayFieldOptions
    : scalarFieldOptions;
  const selectedDetailColumns = useMemo(
    () =>
      schema
        ? selectedArrayColumns(
            schema,
            detailRegionId,
            activeDetailBand?.row,
            detailArrayRoot,
          )
        : [],
    [activeDetailBand?.row, detailArrayRoot, detailRegionId, schema],
  );
  const availableDetailFields = useMemo(() => {
    const selected = new Set(selectedDetailColumns);
    return arrayFields.filter((field) => !selected.has(field.fieldPath));
  }, [arrayFields, selectedDetailColumns]);
  const selectedDetailSummaryByField = useMemo(
    () =>
      new Map(
        (selectedRegion?.summary ?? []).map((item) => [item.fieldPath, item]),
      ),
    [selectedRegion],
  );
  const gridColumnTemplate = useMemo(
    () =>
      schema?.grid.columns
        .map((column) => `${mmToPx(column.widthMm)}px`)
        .join(' ') ?? '',
    [schema],
  );
  const paperMetrics = useMemo(
    () => resolvePaperPrintableMetrics(paperProfile),
    [paperProfile],
  );
  const totalColumnsWidthMm = useMemo(
    () =>
      schema
        ? schema.grid.columns.reduce(
            (sum, column) => sum + toMmNumber(column.widthMm, 0),
            0,
          )
        : 0,
    [schema],
  );
  // 画布渲染的列像素宽有 18px 下限夹钳（mmToPx），页宽参照线用未夹钳的原始
  // 比例定位；仅当存在窄于 5.6mm 的列时两者会有轻微视觉偏差。
  const paperPrintablePx = paperMetrics
    ? Math.round(paperMetrics.printableWidthMm * GRID_MM_TO_PX)
    : 0;
  const canvasColumnsPx = useMemo(
    () =>
      schema
        ? schema.grid.columns.reduce(
            (sum, column) => sum + mmToPx(column.widthMm),
            0,
          )
        : 0,
    [schema],
  );
  const sheetBodyWidthPx = Math.max(canvasColumnsPx, paperPrintablePx);
  const visualRows = useMemo<VisualGridRow[]>(() => {
    if (!schema) return [];
    const rows: Array<Omit<VisualGridRow, 'displayRow'>> = [];
    schema.grid.rows.forEach((row, index) => {
      const actualRow = index + 1;
      const heightPx = mmToPx(row.heightMm);
      rows.push({
        actualRow,
        heightPx,
        key: row.key,
      });
    });
    return rows.map((row, index) => ({ ...row, displayRow: index + 1 }));
  }, [schema]);
  const visualGridRowTemplate = useMemo(
    () => visualRows.map((row) => `${row.heightPx}px`).join(' '),
    [visualRows],
  );
  const visualRowsPx = useMemo(
    () => visualRows.reduce((sum, row) => sum + row.heightPx, 0),
    [visualRows],
  );
  const visualRowStartByActualRow = useMemo(() => {
    const map = new Map<number, number>();
    visualRows.forEach((row, index) => {
      if (!map.has(row.actualRow)) {
        map.set(row.actualRow, index + 1);
      }
    });
    return map;
  }, [visualRows]);
  const visualRowStart = (row: number) =>
    visualRowStartByActualRow.get(row) ?? row;
  const visualRowSpan = (row: number, rowSpan = 1) => {
    const rowCount = schema?.grid.rows.length ?? 0;
    if (rowCount <= 0) return 1;
    const endRow = Math.min(rowCount, row + rowSpan - 1);
    const start = visualRowStart(row);
    const end = visualRowStart(endRow);
    return Math.max(1, end - start + 1);
  };
  const sheetBodyHeightPx = visualRowsPx;
  const overPrintableWidthMm = paperMetrics
    ? Math.max(
        0,
        Math.round((totalColumnsWidthMm - paperMetrics.printableWidthMm) * 10) /
          10,
      )
    : 0;
  const isOverPrintableWidth = overPrintableWidthMm > 0;
  const presetOptions = useMemo(
    () =>
      gridTemplateType
        ? gridPresetOptionsForTemplateType(gridTemplateType)
        : [],
    [gridTemplateType],
  );
  const selectedPresetOption = presetOptions.find(
    (option) => option.value === selectedPreset,
  );

  if (!canUseGrid) {
    return <Empty description="当前模板类型不支持网格设计器" />;
  }
  if (loading || !schema) {
    return fields.length === 0 && !loading ? (
      <Empty description="暂无可用打印字段" />
    ) : (
      <Spin />
    );
  }

  const keepSelectionInsideSchema = (next: GridPrintTemplateSchema) => {
    if (
      selectedCellId &&
      !next.grid.cells.some((cell) => cell.id === selectedCellId)
    ) {
      setSelectedCellId(next.grid.cells[0]?.id ?? '');
    }
    if (
      selectedRegionId &&
      !next.grid.regions?.some((region) => region.id === selectedRegionId)
    ) {
      setSelectedRegionId(undefined);
    }
    if (
      selectedGridCell &&
      (selectedGridCell.row > next.grid.rows.length ||
        selectedGridCell.col > next.grid.columns.length ||
        occupiedGridKeys(next).has(
          gridPositionKey(selectedGridCell.row, selectedGridCell.col),
        ))
    ) {
      setSelectedGridCell(undefined);
    }
  };

  const emit = (
    next: GridPrintTemplateSchema,
    options?: { trackHistory?: boolean },
  ) => {
    if (options?.trackHistory !== false && !sameGridSchema(schema, next)) {
      setHistory((current) => ({
        past: [...current.past, schema].slice(-HISTORY_LIMIT),
        future: [],
      }));
    }
    onChange?.(next);
  };

  const undoGridChange = () => {
    const previous = history.past[history.past.length - 1];
    if (!previous) return;
    setHistory((current) => ({
      past: current.past.slice(0, -1),
      future: [schema, ...current.future].slice(0, HISTORY_LIMIT),
    }));
    onChange?.(previous);
    keepSelectionInsideSchema(previous);
    setMergeAnchor(undefined);
    setMergeFocus(undefined);
  };

  const redoGridChange = () => {
    const next = history.future[0];
    if (!next) return;
    setHistory((current) => ({
      past: [...current.past, schema].slice(-HISTORY_LIMIT),
      future: current.future.slice(1),
    }));
    onChange?.(next);
    keepSelectionInsideSchema(next);
    setMergeAnchor(undefined);
    setMergeFocus(undefined);
  };

  const applySelectedPreset = () => {
    if (!businessType || !gridTemplateType) return;
    const preset = presetOptions.some(
      (option) => option.value === selectedPreset,
    )
      ? selectedPreset
      : defaultGridPresetForTemplateType(gridTemplateType);
    const next = buildGridTemplatePresetSchema({
      businessType,
      templateType: gridTemplateType,
      fields,
      businessName,
      preset,
    });
    emit(next);
    const nextSelectedCell = next.grid.cells.find(
      (cell) => cell.id === 'title',
    );
    setSelectedCellId(nextSelectedCell?.id ?? next.grid.cells[0]?.id ?? '');
    setSelectedRegionId(undefined);
    setSelectedGridCell(undefined);
    setActivePaletteComponent(
      nextSelectedCell?.content.type ??
        next.grid.cells[0]?.content.type ??
        'field_label_value',
    );
    setMergeAnchor(undefined);
    setMergeFocus(undefined);
  };

  const applyCell = (cell: GridCellSchema) => {
    const normalized = normalizeCellForGrid(schema, cell);
    if (!normalized) return;
    if (!canUseDetailContentInRow(schema, normalized.row, normalized.content)) {
      const bandRoot = detailBandRootForRow(schema, normalized.row);
      const contentRoot = detailArrayRootForContent(normalized.content);
      messageApi.warning(
        `当前明细行属于「${labelForArrayRoot(
          bandRoot ?? 'items',
          fields,
        )}」，请另起一行添加「${labelForArrayRoot(
          contentRoot ?? 'items',
          fields,
        )}」字段`,
      );
      return;
    }
    emit(
      syncDetailBandsForCell(
        upsertCell(schema, normalized),
        normalized,
        detailArrayRoot,
      ),
    );
    setSelectedCellId(normalized.id);
    setSelectedRegionId(undefined);
    setSelectedGridCell(undefined);
    setActivePaletteComponent(normalized.content.type);
  };

  const applyGridSchema = (
    next: GridPrintTemplateSchema,
    removedCellIds?: Set<string>,
  ) => {
    emit(next);
    if (removedCellIds?.has(selectedCellId)) {
      setSelectedCellId(next.grid.cells[0]?.id ?? '');
    }
    if (
      selectedRegionId &&
      !next.grid.regions?.some((region) => region.id === selectedRegionId)
    ) {
      setSelectedRegionId(undefined);
    }
    if (
      selectedGridCell &&
      (selectedGridCell.row > next.grid.rows.length ||
        selectedGridCell.col > next.grid.columns.length ||
        occupiedGridKeys(next).has(
          gridPositionKey(selectedGridCell.row, selectedGridCell.col),
        ))
    ) {
      setSelectedGridCell(undefined);
    }
    // 合并选区是绝对坐标，插删行列后会静默漂移到别的格子，必须一并清空
    setMergeAnchor(undefined);
    setMergeFocus(undefined);
  };

  const createCellAtPosition = (
    row: number,
    col: number,
    content: GridCellContent,
    style: GridCellStyle = defaultStyleForContent(content),
  ) => {
    const desiredSpan = defaultSpanForContent(content);
    const span = resolveAvailableSpan(
      schema,
      row,
      col,
      desiredSpan.rowSpan,
      desiredSpan.colSpan,
    );
    applyCell({
      id: makeCellId(),
      row,
      col,
      rowSpan: span.rowSpan,
      colSpan: span.colSpan,
      printScope: defaultPrintScopeForContent(content),
      content,
      style,
    });
  };

  const gridPositionFromClientPoint = (
    clientX: number,
    clientY: number,
  ): { row: number; col: number } | undefined => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return undefined;
    const rect = canvas.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return undefined;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x > canvasColumnsPx || y > visualRowsPx) {
      return undefined;
    }
    let colEdge = 0;
    let visualRowEdge = 0;
    let col = schema.grid.columns.length;

    for (let index = 0; index < schema.grid.columns.length; index += 1) {
      colEdge += mmToPx(schema.grid.columns[index]?.widthMm ?? 0);
      if (x <= colEdge) {
        col = index + 1;
        break;
      }
    }

    for (const visualRow of visualRows) {
      visualRowEdge += visualRow.heightPx;
      if (y <= visualRowEdge) {
        return { row: visualRow.actualRow, col };
      }
    }

    return undefined;
  };

  const moveCellToPosition = (cellId: string, row: number, col: number) => {
    const cell = schema.grid.cells.find((item) => item.id === cellId);
    if (!cell) return;
    const rowSpan = cell.rowSpan ?? 1;
    const colSpan = cell.colSpan ?? 1;
    const nextRow = clampNumber(
      row,
      1,
      Math.max(1, schema.grid.rows.length - rowSpan + 1),
    );
    const nextCol = clampNumber(
      col,
      1,
      Math.max(1, schema.grid.columns.length - colSpan + 1),
    );

    if (
      !canPlaceCellArea(schema, nextRow, nextCol, rowSpan, colSpan, cell.id)
    ) {
      return;
    }

    applyCell({
      ...cell,
      row: nextRow,
      col: nextCol,
      rowSpan,
      colSpan,
    });
  };

  const moveDetailRegionToPosition = (
    regionId: string,
    row: number,
    col: number,
  ) => {
    const region = schema.grid.regions?.find((item) => item.id === regionId);
    if (!region) return;
    const rowSpan = regionRowSpan(region);
    const colSpan = resolveRegionColSpan(region, schema.grid.columns.length);
    const startRow = clampNumber(
      row,
      1,
      Math.max(1, schema.grid.rows.length - rowSpan + 1),
    );
    const startCol = clampNumber(
      col,
      1,
      Math.max(1, schema.grid.columns.length - colSpan + 1),
    );
    if (
      !canPlaceCellArea(
        schema,
        startRow,
        startCol,
        rowSpan,
        colSpan,
        undefined,
        region.id,
      )
    ) {
      return;
    }

    emit({
      ...schema,
      grid: {
        ...schema.grid,
        regions: (schema.grid.regions ?? []).map((item) =>
          item.id === region.id
            ? normalizeDetailRegionForGrid(schema, {
                ...item,
                startRow,
                startCol,
                colSpan,
              })
            : item,
        ),
      },
    });
    setSelectedCellId('');
    setSelectedRegionId(region.id);
    setSelectedGridCell(undefined);
  };

  const resizeCellToPosition = (cellId: string, row: number, col: number) => {
    const next = resizeCellInSchema(schema, cellId, row, col);
    if (!next) return;
    emit(next);
    setSelectedCellId(cellId);
    setSelectedRegionId(undefined);
    setSelectedGridCell(undefined);
  };

  const resizeDetailRegionToPosition = (
    regionId: string,
    row: number,
    col: number,
  ) => {
    const next = resizeDetailRegionInSchema(schema, regionId, row, col);
    if (!next) return;
    emit(next);
    selectDetailRegion(regionId);
  };

  const fieldContent = (field: GridDesignerField): GridCellContent => ({
    type: 'field_label_value',
    label: `${field.fieldLabel}: `,
    fieldPath: field.fieldPath,
    ...(field.formatType ? { formatType: field.formatType } : {}),
  });

  const boundFieldContent = (
    field: GridDesignerField,
    contentType: BoundFieldContentType,
  ): GridCellContent => {
    if (contentType === 'field_label_value') return fieldContent(field);
    if (contentType === 'signature_box') {
      return {
        type: contentType,
        label: `${field.fieldLabel}: `,
        fieldPath: field.fieldPath,
        ...(field.formatType ? { formatType: field.formatType } : {}),
      };
    }
    return {
      type: contentType,
      fieldPath: field.fieldPath,
      ...(field.formatType ? { formatType: field.formatType } : {}),
    };
  };

  const detailFieldContent = (field: GridDesignerField): GridCellContent =>
    field.formatType === 'image'
      ? {
          type: 'image',
          fieldPath: field.fieldPath,
          formatType: field.formatType,
        }
      : {
          type: 'field',
          fieldPath: field.fieldPath,
          ...(field.formatType ? { formatType: field.formatType } : {}),
        };

  const detailCellStyle = (content: GridCellContent): GridCellStyle => ({
    ...defaultStyleForContent(content),
    border: { top: true, right: true, bottom: true, left: true },
  });

  const contentFromDetailDragPayload = (
    payload: Extract<GridDragPayload, { kind: 'detailField' }>,
  ): GridCellContent | undefined => {
    const field = allArrayFields.find(
      (item) => item.fieldPath === payload.fieldPath,
    );
    if (!field) return undefined;
    const arrayRoot = arrayRootOfFieldPath(field.fieldPath);
    if (arrayRoot) setActiveArrayRoot(arrayRoot);
    return detailFieldContent(field);
  };

  const aggregateFieldForGridPosition = (
    row: number,
    col: number,
  ): GridDesignerField | undefined => {
    const detailBands = [...(schema.grid.detailBands ?? [])]
      .filter((band) => band.row <= row)
      .sort((left, right) => right.row - left.row);
    for (const band of detailBands) {
      const bandRoot = arrayRootFromDataSource(band.dataSource);
      const detailCell = schema.grid.cells.find((cell) => {
        const cellEndCol = cell.col + (cell.colSpan ?? 1) - 1;
        return (
          cell.row === band.row &&
          col >= cell.col &&
          col <= cellEndCol &&
          (cell.content.type === 'field' || cell.content.type === 'image') &&
          Boolean(cell.content.fieldPath)
        );
      });
      const fieldPath = detailCell?.content.fieldPath;
      if (!fieldPath) continue;
      const fieldRoot = arrayRootOfFieldPath(fieldPath);
      if (bandRoot && fieldRoot !== bandRoot) continue;
      const field = allArrayFields.find((item) => item.fieldPath === fieldPath);
      if (field) return field;
    }
    return undefined;
  };

  const contentFromDragPayload = (
    payload: GridDragPayload,
    target?: SelectedGridCellPosition,
  ): GridCellContent | undefined => {
    if (payload.kind === 'field') {
      const field = scalarFields.find(
        (item) => item.fieldPath === payload.fieldPath,
      );
      return field ? fieldContent(field) : undefined;
    }
    if (payload.kind === 'boundField') {
      const field = scalarFields.find(
        (item) => item.fieldPath === payload.fieldPath,
      );
      return field ? boundFieldContent(field, payload.contentType) : undefined;
    }
    if (payload.kind === 'aggregateField') {
      const field = allArrayFields.find(
        (item) => item.fieldPath === payload.fieldPath,
      );
      return field
        ? aggregateContentForField(field, payload.aggregate)
        : undefined;
    }
    if (payload.kind === 'component') {
      if (payload.contentType === 'aggregate_field' && target) {
        const field = aggregateFieldForGridPosition(target.row, target.col);
        if (field) return aggregateContentForField(field);
      }
      const componentArrayFields =
        payload.contentType === 'aggregate_field'
          ? aggregateArrayFields
          : arrayFields;
      return contentForType(
        payload.contentType,
        selectedCell?.content ?? { type: 'static_text', text: '' },
        scalarFields,
        componentArrayFields,
      );
    }
    return undefined;
  };

  const setDragPayload = (
    event: DragEvent<HTMLElement>,
    payload: GridDragPayload,
  ) => {
    const operation =
      payload.kind === 'moveCell' ||
      payload.kind === 'moveRegion' ||
      payload.kind === 'moveDetailColumn' ||
      payload.kind === 'resizeCell' ||
      payload.kind === 'resizeRegion'
        ? 'move'
        : 'copy';
    setActiveDragOperation(operation);
    event.dataTransfer.effectAllowed = operation;
    event.dataTransfer.setData(GRID_DND_MIME, JSON.stringify(payload));
  };

  const readDragPayload = (
    event: DragEvent<HTMLElement>,
  ): GridDragPayload | undefined => {
    const raw = event.dataTransfer.getData(GRID_DND_MIME);
    return raw ? parseGridDragPayload(raw) : undefined;
  };

  const handleDragEnd = () => {
    setActiveDragOperation(undefined);
    setDragOverGridKey(undefined);
    setDetailColumnDropTarget(undefined);
  };

  const movePayloadToGridPosition = (
    payload: GridDragPayload,
    row: number,
    col: number,
  ): boolean => {
    if (payload.kind === 'moveCell') {
      moveCellToPosition(
        payload.cellId,
        row - payload.rowOffset,
        col - payload.colOffset,
      );
      return true;
    }
    if (payload.kind === 'moveRegion') {
      moveDetailRegionToPosition(
        payload.regionId,
        row - payload.rowOffset,
        col - payload.colOffset,
      );
      return true;
    }
    if (payload.kind === 'resizeCell') {
      resizeCellToPosition(payload.cellId, row, col);
      return true;
    }
    if (payload.kind === 'resizeRegion') {
      resizeDetailRegionToPosition(payload.regionId, row, col);
      return true;
    }
    return false;
  };

  const movePayloadToPointerPosition = (
    event: DragEvent<HTMLElement>,
    payload: GridDragPayload,
  ): boolean => {
    const position = gridPositionFromClientPoint(event.clientX, event.clientY);
    return position
      ? movePayloadToGridPosition(payload, position.row, position.col)
      : false;
  };

  const handleGridDragOver = (
    event: DragEvent<HTMLElement>,
    row: number,
    col: number,
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = activeDragOperation ?? 'copy';
    setDragOverGridKey(gridPositionKey(row, col));
  };

  const handleGridDrop = (
    event: DragEvent<HTMLElement>,
    row: number,
    col: number,
  ) => {
    event.preventDefault();
    setDragOverGridKey(undefined);
    const payload = readDragPayload(event);
    if (!payload || payload.kind === 'moveDetailColumn') return;
    if (movePayloadToGridPosition(payload, row, col)) return;
    if (payload.kind === 'detailField') {
      const content = contentFromDetailDragPayload(payload);
      if (content)
        createCellAtPosition(row, col, content, detailCellStyle(content));
      return;
    }
    const content = contentFromDragPayload(payload, { row, col });
    if (!content) return;
    createCellAtPosition(row, col, content);
  };

  const handleCellDrop = (
    event: DragEvent<HTMLElement>,
    cell: GridCellSchema,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverGridKey(undefined);
    const payload = readDragPayload(event);
    if (!payload || payload.kind === 'moveDetailColumn') return;
    if (movePayloadToPointerPosition(event, payload)) return;
    if (payload.kind === 'detailField') {
      const content = contentFromDetailDragPayload(payload);
      if (!content) return;
      applyCell({
        ...cell,
        printScope: undefined,
        content,
        style: {
          ...detailCellStyle(content),
          ...cell.style,
        },
      });
      return;
    }
    const content = contentFromDragPayload(payload, {
      row: cell.row,
      col: cell.col,
    });
    if (!content) return;
    applyCell({
      ...cell,
      printScope: cell.printScope ?? defaultPrintScopeForContent(content),
      content,
      style: {
        ...defaultStyleForContent(content),
        ...cell.style,
      },
    });
  };

  const applyCellStyle = (patch: GridCellStyle) => {
    if (!selectedCell) return;
    applyCell({
      ...selectedCell,
      style: {
        ...selectedCell.style,
        ...patch,
      },
    });
  };

  const updateColumnWidth = (columnIndex: number, widthMm?: number | null) => {
    if (!widthMm) return;
    emit({
      ...schema,
      grid: {
        ...schema.grid,
        columns: schema.grid.columns.map((column, index) =>
          index === columnIndex ? { ...column, widthMm } : column,
        ),
      },
    });
  };

  const updateRowHeight = (rowIndex: number, heightMm?: number | null) => {
    if (!heightMm) return;
    emit({
      ...schema,
      grid: {
        ...schema.grid,
        rows: schema.grid.rows.map((row, index) =>
          index === rowIndex ? { ...row, heightMm } : row,
        ),
      },
    });
  };

  const beginGridTrackResize = (
    event: ReactPointerEvent<HTMLElement>,
    target: { kind: 'column' | 'row'; index: number; startValueMm: number },
  ) => {
    event.preventDefault();
    event.stopPropagation();
    resizeCleanupRef.current?.();

    const baseSchema = schema;
    let latestSchema = baseSchema;
    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    const cursor = target.kind === 'column' ? 'col-resize' : 'row-resize';

    document.body.style.cursor = cursor;
    document.body.style.userSelect = 'none';

    const applyResizeAtPoint = (clientX: number, clientY: number) => {
      const deltaPx =
        target.kind === 'column'
          ? clientX - startClientX
          : clientY - startClientY;
      const minValue =
        target.kind === 'column'
          ? MIN_GRID_COLUMN_WIDTH_MM
          : MIN_GRID_ROW_HEIGHT_MM;
      const maxValue =
        target.kind === 'column'
          ? MAX_GRID_COLUMN_WIDTH_MM
          : MAX_GRID_ROW_HEIGHT_MM;
      const nextValueMm = clampNumber(
        Math.round((target.startValueMm + deltaPx / GRID_MM_TO_PX) * 10) / 10,
        minValue,
        maxValue,
      );
      const next: GridPrintTemplateSchema =
        target.kind === 'column'
          ? {
              ...baseSchema,
              grid: {
                ...baseSchema.grid,
                columns: baseSchema.grid.columns.map((column, index) =>
                  index === target.index
                    ? { ...column, widthMm: nextValueMm }
                    : column,
                ),
              },
            }
          : {
              ...baseSchema,
              grid: {
                ...baseSchema.grid,
                rows: baseSchema.grid.rows.map((row, index) =>
                  index === target.index
                    ? { ...row, heightMm: nextValueMm }
                    : row,
                ),
              },
            };
      if (sameGridSchema(latestSchema, next)) return;
      latestSchema = next;
      onChange?.(next);
    };

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      pointerEvent.preventDefault();
      applyResizeAtPoint(pointerEvent.clientX, pointerEvent.clientY);
    };

    const finishResize = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishResize);
      window.removeEventListener('pointercancel', finishResize);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      if (!sameGridSchema(baseSchema, latestSchema)) {
        setHistory((current) => ({
          past: [...current.past, baseSchema].slice(-HISTORY_LIMIT),
          future: [],
        }));
      }
      resizeCleanupRef.current = undefined;
    };

    resizeCleanupRef.current = finishResize;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishResize, { once: true });
    window.addEventListener('pointercancel', finishResize, { once: true });
  };

  const beginColumnWidthResize = (
    event: ReactPointerEvent<HTMLElement>,
    columnIndex: number,
  ) => {
    beginGridTrackResize(event, {
      kind: 'column',
      index: columnIndex,
      startValueMm: schema.grid.columns[columnIndex]?.widthMm ?? 24,
    });
  };

  const beginRowHeightResize = (
    event: ReactPointerEvent<HTMLElement>,
    rowIndex: number,
  ) => {
    beginGridTrackResize(event, {
      kind: 'row',
      index: rowIndex,
      startValueMm: schema.grid.rows[rowIndex]?.heightMm ?? 8,
    });
  };

  const insertGridColumn = (
    columnIndex: number,
    placement: 'before' | 'after',
  ) => {
    if (schema.grid.columns.length >= MAX_GRID_COLUMNS) return;
    const insertAt = columnIndex + (placement === 'after' ? 2 : 1);
    applyGridSchema(insertColumnInSchema(schema, insertAt));
  };

  const deleteGridColumn = (columnIndex: number) => {
    if (schema.grid.columns.length <= 1) return;
    const result = deleteColumnFromSchema(schema, columnIndex + 1);
    applyGridSchema(result.next, result.removedCellIds);
  };

  const insertGridRow = (rowIndex: number, placement: 'before' | 'after') => {
    if (schema.grid.rows.length >= MAX_GRID_ROWS) return;
    const insertAt = rowIndex + (placement === 'after' ? 2 : 1);
    applyGridSchema(insertRowInSchema(schema, insertAt));
  };

  const deleteGridRow = (rowIndex: number) => {
    if (schema.grid.rows.length <= (firstDetailRegion ? 3 : 1)) return;
    const result = deleteRowFromSchema(schema, rowIndex + 1);
    applyGridSchema(result.next, result.removedCellIds);
  };

  const resizeGridColumns = (targetCount?: number | null) => {
    if (!targetCount) return;
    const nextCount = clampNumber(Math.round(targetCount), 1, MAX_GRID_COLUMNS);
    if (nextCount === schema.grid.columns.length) return;

    const hasContentBeyondTarget = schema.grid.cells.some((cell) => {
      const colSpan = cell.colSpan ?? 1;
      return cell.col + colSpan - 1 > nextCount;
    });
    const hasLegacyRegionBeyondTarget = (schema.grid.regions ?? []).some(
      (region) =>
        region.startCol +
          resolveRegionColSpan(region, schema.grid.columns.length) -
          1 >
        nextCount,
    );

    const applyResize = () => {
      let nextSchema = schema;
      while (nextSchema.grid.columns.length < nextCount) {
        nextSchema = insertColumnInSchema(
          nextSchema,
          nextSchema.grid.columns.length + 1,
        );
      }
      const removedCellIds = new Set<string>();
      while (nextSchema.grid.columns.length > nextCount) {
        const result = deleteColumnFromSchema(
          nextSchema,
          nextSchema.grid.columns.length,
        );
        nextSchema = result.next;
        for (const cellId of result.removedCellIds) {
          removedCellIds.add(cellId);
        }
      }
      applyGridSchema(nextSchema, removedCellIds);
    };

    if (
      nextCount < schema.grid.columns.length &&
      (hasContentBeyondTarget || hasLegacyRegionBeyondTarget)
    ) {
      modalApi.confirm({
        title: '减少总列数会删除版式内容',
        content: `目标列数为 ${nextCount} 列，第 ${excelColumnLabel(nextCount)} 列及右侧已有组件或明细区域。确认后这些内容会被删除。`,
        okText: '删除并调整',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: applyResize,
      });
      return;
    }

    applyResize();
  };

  const resizeGridRows = (targetCount?: number | null) => {
    if (!targetCount) return;
    const minRowCount = firstDetailRegion ? 3 : 1;
    const nextCount = clampNumber(
      Math.round(targetCount),
      minRowCount,
      MAX_GRID_ROWS,
    );
    if (nextCount === schema.grid.rows.length) return;

    const hasContentBeyondTarget = schema.grid.cells.some((cell) => {
      const rowSpan = cell.rowSpan ?? 1;
      return cell.row + rowSpan - 1 > nextCount;
    });
    const hasDetailBandBeyondTarget = (schema.grid.detailBands ?? []).some(
      (band) => band.row > nextCount,
    );
    const hasLegacyRegionBeyondTarget = (schema.grid.regions ?? []).some(
      (region) => region.startRow + regionRowSpan(region) - 1 > nextCount,
    );

    const applyResize = () => {
      let nextSchema = schema;
      while (nextSchema.grid.rows.length < nextCount) {
        nextSchema = insertRowInSchema(
          nextSchema,
          nextSchema.grid.rows.length + 1,
        );
      }
      const removedCellIds = new Set<string>();
      while (nextSchema.grid.rows.length > nextCount) {
        const result = deleteRowFromSchema(
          nextSchema,
          nextSchema.grid.rows.length,
        );
        nextSchema = result.next;
        for (const cellId of result.removedCellIds) {
          removedCellIds.add(cellId);
        }
      }
      applyGridSchema(nextSchema, removedCellIds);
    };

    if (
      nextCount < schema.grid.rows.length &&
      (hasContentBeyondTarget ||
        hasDetailBandBeyondTarget ||
        hasLegacyRegionBeyondTarget)
    ) {
      modalApi.confirm({
        title: '减少总行数会删除版式内容',
        content: `目标行数为 ${nextCount} 行，第 ${nextCount + 1} 行及以下已有组件或明细区域。确认后这些内容会被删除。`,
        okText: '删除并调整',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: applyResize,
      });
      return;
    }

    applyResize();
  };

  const updateRowCountDraft = (value?: number | null) => {
    rowCountDraftRef.current = value ?? null;
    setRowCountDraft(value ?? null);
  };

  const updateColumnCountDraft = (value?: number | null) => {
    columnCountDraftRef.current = value ?? null;
    setColumnCountDraft(value ?? null);
  };

  const commitRowCountDraft = () => {
    const value = rowCountDraftRef.current;
    rowCountDraftRef.current = undefined;
    setRowCountDraft(undefined);
    if (value !== null && value !== undefined) {
      resizeGridRows(value);
    }
  };

  const commitColumnCountDraft = () => {
    const value = columnCountDraftRef.current;
    columnCountDraftRef.current = undefined;
    setColumnCountDraft(undefined);
    if (value !== null && value !== undefined) {
      resizeGridColumns(value);
    }
  };

  // 右键只承接当前选区，避免误把整列/整行作为合并范围
  const headerMergeTarget = (kind: 'col' | 'row', index: number) => {
    const clickedInRange =
      mergeRange &&
      (kind === 'col'
        ? index + 1 >= mergeRange.startCol && index + 1 <= mergeRange.endCol
        : index + 1 >= mergeRange.startRow && index + 1 <= mergeRange.endRow);
    const rect = clickedInRange ? mergeRange : undefined;
    const blocked = rect ? rectIntersectsDetailRegion(rect) : false;
    return {
      rect,
      disabled: !rect || blocked,
      label: !clickedInRange
        ? '先拖选需要合并的范围'
        : blocked
          ? '合并选中范围（与明细表相交，请用 Shift 框选局部）'
          : '合并选中范围单元格',
    };
  };

  const columnHeaderMenu = (columnIndex: number): MenuProps => {
    const items: NonNullable<MenuProps['items']> = [];
    if (schema.grid.columns.length < MAX_GRID_COLUMNS) {
      items.push(
        { key: 'insertBefore', label: '左侧插入一列' },
        { key: 'insertAfter', label: '右侧插入一列' },
      );
    }
    const mergeTarget = headerMergeTarget('col', columnIndex);
    items.push(
      { type: 'divider' },
      {
        key: 'merge',
        disabled: mergeTarget.disabled,
        label: mergeTarget.label,
      },
    );
    if (schema.grid.columns.length > 1) {
      items.push({ type: 'divider' });
      items.push({
        key: 'delete',
        danger: true,
        label: '删除当前列',
      });
    }
    return {
      items,
      onClick: ({ key }) => {
        if (key === 'insertBefore') insertGridColumn(columnIndex, 'before');
        if (key === 'insertAfter') insertGridColumn(columnIndex, 'after');
        if (key === 'merge') mergeSelectedRange(mergeTarget.rect);
        if (key === 'delete') deleteGridColumn(columnIndex);
      },
    };
  };

  const rowHeaderMenu = (rowIndex: number): MenuProps => {
    const minRowCount = firstDetailRegion ? 3 : 1;
    const items: NonNullable<MenuProps['items']> = [];
    if (schema.grid.rows.length < MAX_GRID_ROWS) {
      items.push(
        { key: 'insertBefore', label: '上方插入一行' },
        { key: 'insertAfter', label: '下方插入一行' },
      );
    }
    const mergeTarget = headerMergeTarget('row', rowIndex);
    items.push(
      { type: 'divider' },
      {
        key: 'merge',
        disabled: mergeTarget.disabled,
        label: mergeTarget.label,
      },
    );
    if (schema.grid.rows.length > minRowCount) {
      items.push({ type: 'divider' });
      items.push({
        key: 'delete',
        danger: true,
        label: '删除当前行',
      });
    }
    return {
      items,
      onClick: ({ key }) => {
        if (key === 'insertBefore') insertGridRow(rowIndex, 'before');
        if (key === 'insertAfter') insertGridRow(rowIndex, 'after');
        if (key === 'merge') mergeSelectedRange(mergeTarget.rect);
        if (key === 'delete') deleteGridRow(rowIndex);
      },
    };
  };

  const selectCell = (cell: GridCellSchema, event?: { shiftKey?: boolean }) => {
    if (event?.shiftKey && mergeAnchor) {
      setMergeFocus({ row: cell.row, col: cell.col });
      return;
    }
    setMergeAnchor({ row: cell.row, col: cell.col });
    setMergeFocus(undefined);
    setSelectedCellId(cell.id);
    setSelectedRegionId(undefined);
    setSelectedGridCell(undefined);
    setHeaderSelection(undefined);
    setActivePaletteComponent(cell.content.type);
  };

  const selectGridCell = (
    row: number,
    col: number,
    event?: { shiftKey?: boolean },
  ) => {
    if (event?.shiftKey && mergeAnchor) {
      setMergeFocus({ row, col });
      return;
    }
    setMergeAnchor({ row, col });
    setMergeFocus(undefined);
    setSelectedCellId('');
    setSelectedRegionId(undefined);
    setSelectedGridCell({ row, col });
    setHeaderSelection(undefined);
  };

  // 待合并矩形：从锚点/终点出发，按 Excel 规则扩张到完整包含所有相交的
  // 内容单元格（含已合并格），保证合并动作永远不会与既有单元格部分重叠
  const computeMergeRect = (
    anchor: SelectedGridCellPosition,
    focus: SelectedGridCellPosition,
  ) => {
    const clampRow = (value: number) =>
      Math.min(Math.max(value, 1), schema.grid.rows.length);
    const clampCol = (value: number) =>
      Math.min(Math.max(value, 1), schema.grid.columns.length);
    let rect = {
      startRow: clampRow(Math.min(anchor.row, focus.row)),
      endRow: clampRow(Math.max(anchor.row, focus.row)),
      startCol: clampCol(Math.min(anchor.col, focus.col)),
      endCol: clampCol(Math.max(anchor.col, focus.col)),
    };
    let changed = true;
    while (changed) {
      changed = false;
      for (const cell of schema.grid.cells) {
        const cellEndRow = cell.row + (cell.rowSpan ?? 1) - 1;
        const cellEndCol = cell.col + (cell.colSpan ?? 1) - 1;
        const intersects =
          cell.row <= rect.endRow &&
          cellEndRow >= rect.startRow &&
          cell.col <= rect.endCol &&
          cellEndCol >= rect.startCol;
        if (!intersects) continue;
        const union = {
          startRow: Math.min(rect.startRow, cell.row),
          endRow: Math.max(rect.endRow, cellEndRow),
          startCol: Math.min(rect.startCol, cell.col),
          endCol: Math.max(rect.endCol, cellEndCol),
        };
        if (
          union.startRow !== rect.startRow ||
          union.endRow !== rect.endRow ||
          union.startCol !== rect.startCol ||
          union.endCol !== rect.endCol
        ) {
          rect = union;
          changed = true;
        }
      }
    }
    if (rect.startRow === rect.endRow && rect.startCol === rect.endCol) {
      return undefined;
    }
    return rect;
  };

  const mergeRange =
    mergeAnchor && mergeFocus
      ? computeMergeRect(mergeAnchor, mergeFocus)
      : undefined;

  // 列头/行号拖选：列头沿当前行横向扩展，行号沿当前列纵向扩展
  const setHeaderMergeSelection = (
    kind: 'col' | 'row',
    startIndex: number,
    endIndex: number,
    anchor?: SelectedGridCellPosition,
  ) => {
    const lo = Math.min(startIndex, endIndex);
    const hi = Math.max(startIndex, endIndex);
    if (kind === 'col') {
      const row = Math.min(
        Math.max(
          anchor?.row ?? selectedCell?.row ?? selectedGridCell?.row ?? 1,
          1,
        ),
        schema.grid.rows.length,
      );
      setMergeAnchor({ row, col: lo + 1 });
      setMergeFocus({ row, col: hi + 1 });
    } else {
      const col = Math.min(
        Math.max(
          anchor?.col ?? selectedCell?.col ?? selectedGridCell?.col ?? 1,
          1,
        ),
        schema.grid.columns.length,
      );
      setMergeAnchor({ row: lo + 1, col });
      setMergeFocus({ row: hi + 1, col });
    }
  };

  const beginHeaderSelect = (kind: 'col' | 'row', index: number) => {
    const row = Math.min(
      Math.max(selectedCell?.row ?? selectedGridCell?.row ?? 1, 1),
      schema.grid.rows.length,
    );
    const col = Math.min(
      Math.max(selectedCell?.col ?? selectedGridCell?.col ?? 1, 1),
      schema.grid.columns.length,
    );
    const anchor =
      kind === 'col' ? { row, col: index + 1 } : { row: index + 1, col };
    const nextHeaderSelection = { kind, start: index, ...anchor };
    const canExtendPreviousSelection =
      headerSelection &&
      headerSelection.kind === kind &&
      headerSelection.start !== index;
    headerDragRef.current = canExtendPreviousSelection
      ? headerSelection
      : nextHeaderSelection;
    selectGridCell(anchor.row, anchor.col);
    if (canExtendPreviousSelection) {
      setHeaderMergeSelection(
        kind,
        headerSelection.start,
        index,
        headerSelection,
      );
      setHeaderSelection(headerSelection);
      return;
    }
    setHeaderSelection(nextHeaderSelection);
  };

  const extendHeaderSelect = (kind: 'col' | 'row', index: number) => {
    const drag = headerDragRef.current;
    if (!drag || drag.kind !== kind) return;
    if (drag.start === index) return;
    setHeaderMergeSelection(kind, drag.start, index, drag);
  };

  const clearMergeRange = () => {
    setMergeAnchor(undefined);
    setMergeFocus(undefined);
    setHeaderSelection(undefined);
  };

  // 明细行相交判定的唯一实现：合并动作与表头菜单可行性判断共用
  const rectIntersectsDetailRegion = (rect: {
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
  }) => {
    if (
      (schema.grid.detailBands ?? []).some(
        (band) => band.row >= rect.startRow && band.row <= rect.endRow,
      )
    ) {
      return true;
    }
    return (schema.grid.regions ?? []).some((region) => {
      const regionEndRow = region.startRow + region.maxRowsPerPage + 1;
      const regionColSpan =
        region.colSpan ?? schema.grid.columns.length - region.startCol + 1;
      const regionEndCol = region.startCol + regionColSpan - 1;
      return (
        region.startRow <= rect.endRow &&
        regionEndRow >= rect.startRow &&
        region.startCol <= rect.endCol &&
        regionEndCol >= rect.startCol
      );
    });
  };

  const mergeSelectedRange = (rect = mergeRange) => {
    if (!rect) {
      messageApi.info('请先选择至少覆盖两个单元格的合并范围');
      return;
    }
    const rowSpan = rect.endRow - rect.startRow + 1;
    const colSpan = rect.endCol - rect.startCol + 1;
    if (rectIntersectsDetailRegion(rect)) {
      messageApi.warning('合并范围不能覆盖明细行，请用 Shift 框选局部范围');
      return;
    }
    const insideCells = schema.grid.cells.filter((cell) => {
      const cellEndRow = cell.row + (cell.rowSpan ?? 1) - 1;
      const cellEndCol = cell.col + (cell.colSpan ?? 1) - 1;
      return (
        cell.row >= rect.startRow &&
        cellEndRow <= rect.endRow &&
        cell.col >= rect.startCol &&
        cellEndCol <= rect.endCol
      );
    });
    const keep = [...insideCells].sort(
      (a, b) => a.row - b.row || a.col - b.col,
    )[0];
    if (
      insideCells.length === 1 &&
      keep &&
      keep.row === rect.startRow &&
      keep.col === rect.startCol &&
      (keep.rowSpan ?? 1) === rowSpan &&
      (keep.colSpan ?? 1) === colSpan
    ) {
      messageApi.info('该范围已经是一个单元格');
      clearMergeRange();
      return;
    }
    const applyMerge = () => {
      const insideIds = new Set(insideCells.map((cell) => cell.id));
      const merged: GridCellSchema = keep
        ? {
            ...keep,
            row: rect.startRow,
            col: rect.startCol,
            rowSpan,
            colSpan,
          }
        : {
            id: makeCellId(),
            row: rect.startRow,
            col: rect.startCol,
            rowSpan,
            colSpan,
            content: { type: 'static_text', text: '' },
          };
      emit({
        ...schema,
        grid: {
          ...schema.grid,
          cells: [
            ...schema.grid.cells.filter((cell) => !insideIds.has(cell.id)),
            merged,
          ],
        },
      });
      setSelectedCellId(merged.id);
      setSelectedRegionId(undefined);
      setSelectedGridCell(undefined);
      setActivePaletteComponent(merged.content.type);
      clearMergeRange();
    };
    if (insideCells.length > 1) {
      modalApi.confirm({
        title: '合并单元格',
        content: `范围内有 ${
          insideCells.length
        } 个内容单元格，合并将保留左上角单元格的内容，移除其余 ${
          insideCells.length - 1
        } 个。`,
        okText: '合并',
        cancelText: '取消',
        onOk: applyMerge,
      });
      return;
    }
    applyMerge();
  };

  const unmergeSelectedCell = () => {
    if (!selectedCell) return;
    applyCell({ ...selectedCell, rowSpan: 1, colSpan: 1 });
  };

  const canResizeCellToSpan = (
    cell: GridCellSchema,
    rowSpan: number,
    colSpan: number,
  ) => canPlaceCellArea(schema, cell.row, cell.col, rowSpan, colSpan, cell.id);

  const resizeCellByDelta = (
    cell: GridCellSchema,
    rowDelta: number,
    colDelta: number,
  ) => {
    const rowSpan = clampNumber(
      (cell.rowSpan ?? 1) + rowDelta,
      1,
      schema.grid.rows.length - cell.row + 1,
    );
    const colSpan = clampNumber(
      (cell.colSpan ?? 1) + colDelta,
      1,
      schema.grid.columns.length - cell.col + 1,
    );
    resizeCellToPosition(
      cell.id,
      cell.row + rowSpan - 1,
      cell.col + colSpan - 1,
    );
  };

  const findDuplicateCellPlacement = (
    cell: GridCellSchema,
  ): { row: number; col: number } | undefined => {
    const rowSpan = cell.rowSpan ?? 1;
    const colSpan = cell.colSpan ?? 1;
    for (let row = cell.row; row <= schema.grid.rows.length; row += 1) {
      for (let col = 1; col <= schema.grid.columns.length; col += 1) {
        if (
          row === cell.row &&
          col < Math.min(schema.grid.columns.length, cell.col + colSpan)
        ) {
          continue;
        }
        if (canPlaceCellArea(schema, row, col, rowSpan, colSpan)) {
          return { row, col };
        }
      }
    }
    return undefined;
  };

  const duplicateCell = (cell: GridCellSchema) => {
    const placement = findDuplicateCellPlacement(cell);
    if (!placement) return;
    applyCell({
      ...cell,
      id: makeCellId(),
      row: placement.row,
      col: placement.col,
    });
  };

  const gridCellMenu = (cell: GridCellSchema): MenuProps => {
    const items: NonNullable<MenuProps['items']> = [];
    if (findDuplicateCellPlacement(cell)) {
      items.push({ key: 'duplicateCell', label: '复制一份' });
    }
    if (canResizeCellToSpan(cell, cell.rowSpan ?? 1, (cell.colSpan ?? 1) + 1)) {
      items.push({ key: 'expandRight', label: '向右扩大一格' });
    }
    if (canResizeCellToSpan(cell, (cell.rowSpan ?? 1) + 1, cell.colSpan ?? 1)) {
      items.push({ key: 'expandDown', label: '向下扩大一格' });
    }
    if ((cell.colSpan ?? 1) > 1) {
      items.push({ key: 'shrinkWidth', label: '向左收缩一格' });
    }
    if ((cell.rowSpan ?? 1) > 1) {
      items.push({ key: 'shrinkHeight', label: '向上收缩一格' });
    }
    if (items.length > 0) items.push({ type: 'divider' });
    items.push({ key: 'deleteCell', danger: true, label: '删除单元格' });
    return {
      items,
      onClick: ({ key }) => {
        if (key === 'duplicateCell') duplicateCell(cell);
        if (key === 'expandRight') resizeCellByDelta(cell, 0, 1);
        if (key === 'expandDown') resizeCellByDelta(cell, 1, 0);
        if (key === 'shrinkWidth') resizeCellByDelta(cell, 0, -1);
        if (key === 'shrinkHeight') resizeCellByDelta(cell, -1, 0);
        if (key === 'deleteCell') removeCell(cell.id);
      },
    };
  };

  const canResizeRegionToSpan = (
    region: GridRegionSchema,
    rowSpan: number,
    colSpan: number,
  ) =>
    canPlaceCellArea(
      schema,
      region.startRow,
      region.startCol,
      rowSpan,
      colSpan,
      undefined,
      region.id,
    );

  const resizeRegionByDelta = (
    region: GridRegionSchema,
    rowDelta: number,
    colDelta: number,
  ) => {
    const rowSpan = clampNumber(
      regionRowSpan(region) + rowDelta,
      3,
      schema.grid.rows.length - region.startRow + 1,
    );
    const colSpan = clampNumber(
      resolveRegionColSpan(region, schema.grid.columns.length) + colDelta,
      1,
      schema.grid.columns.length - region.startCol + 1,
    );
    resizeDetailRegionToPosition(
      region.id,
      region.startRow + rowSpan - 1,
      region.startCol + colSpan - 1,
    );
  };

  const regionMenu = (region: GridRegionSchema): MenuProps => {
    const colSpan = resolveRegionColSpan(region, schema.grid.columns.length);
    const rowSpan = regionRowSpan(region);
    const fillRightColSpan = schema.grid.columns.length - region.startCol + 1;
    const items: NonNullable<MenuProps['items']> = [];
    if (canResizeRegionToSpan(region, rowSpan, colSpan + 1)) {
      items.push({ key: 'expandRight', label: '向右扩大一格' });
    }
    if (canResizeRegionToSpan(region, rowSpan + 1, colSpan)) {
      items.push({ key: 'expandDown', label: '向下增加一行' });
    }
    if (
      fillRightColSpan > colSpan + 1 &&
      canResizeRegionToSpan(region, rowSpan, fillRightColSpan)
    ) {
      items.push({ key: 'fillRight', label: '铺满到右侧' });
    }
    if (colSpan > 1) {
      items.push({ key: 'shrinkWidth', label: '向左收缩一格' });
    }
    if (rowSpan > 3) {
      items.push({ key: 'shrinkRows', label: '减少一行' });
    }
    if (items.length > 0) items.push({ type: 'divider' });
    items.push({ key: 'deleteRegion', danger: true, label: '删除明细表' });
    return {
      items,
      onClick: ({ key }) => {
        if (key === 'expandRight') resizeRegionByDelta(region, 0, 1);
        if (key === 'expandDown') resizeRegionByDelta(region, 1, 0);
        if (key === 'fillRight') {
          resizeDetailRegionToPosition(
            region.id,
            region.startRow + rowSpan - 1,
            region.startCol + fillRightColSpan - 1,
          );
        }
        if (key === 'shrinkWidth') resizeRegionByDelta(region, 0, -1);
        if (key === 'shrinkRows') resizeRegionByDelta(region, -1, 0);
        if (key === 'deleteRegion') removeDetailRegion(region.id);
      },
    };
  };

  const updateDetailRegionById = (
    regionId: string,
    patch: Partial<NonNullable<GridPrintTemplateSchema['grid']['regions']>[0]>,
  ) => {
    const geometryPatch =
      'startRow' in patch ||
      'startCol' in patch ||
      'colSpan' in patch ||
      'maxRowsPerPage' in patch;
    emit({
      ...schema,
      grid: {
        ...schema.grid,
        regions: (schema.grid.regions ?? []).map((region) => {
          if (region.id !== regionId) return region;
          const nextRegion = normalizeDetailRegionForGrid(schema, {
            ...region,
            ...patch,
          });
          if (
            geometryPatch &&
            !canPlaceCellArea(
              schema,
              nextRegion.startRow,
              nextRegion.startCol,
              regionRowSpan(nextRegion),
              resolveRegionColSpan(nextRegion, schema.grid.columns.length),
              undefined,
              nextRegion.id,
            )
          ) {
            return region;
          }
          return nextRegion;
        }),
      },
    });
  };

  const updateDetailRegion = (
    patch: Partial<NonNullable<GridPrintTemplateSchema['grid']['regions']>[0]>,
  ) => {
    const targetRegionId = selectedRegion?.id;
    if (!targetRegionId) return;
    updateDetailRegionById(targetRegionId, patch);
  };

  const updateDetailSummary = (
    regionId: string,
    fieldPath: string,
    aggregate: GridDetailSummarySchema['aggregate'] | undefined,
    label?: string,
  ) => {
    const region = schema.grid.regions?.find((item) => item.id === regionId);
    if (!region) return;
    const summaryByField = new Map(
      (region.summary ?? []).map((item) => [item.fieldPath, item]),
    );
    if (aggregate) {
      const current = summaryByField.get(fieldPath);
      summaryByField.set(fieldPath, {
        fieldPath,
        aggregate,
        label: label ?? current?.label ?? '合计',
      });
    } else {
      summaryByField.delete(fieldPath);
    }
    const summary = region.columns.flatMap((column) => {
      const item = column.fieldPath
        ? summaryByField.get(column.fieldPath)
        : undefined;
      return item ? [item] : [];
    });
    updateDetailRegionById(regionId, {
      summary: summary.length > 0 ? summary : undefined,
    });
  };

  const applyContent = (
    patch: Partial<GridCellContent> & { type?: GridContentType },
  ) => {
    if (!selectedCell) return;
    applyCell({
      ...selectedCell,
      content: {
        ...selectedCell.content,
        ...patch,
      },
    });
  };

  const handleImageUpload: UploadProps['beforeUpload'] = async (file) => {
    const isImageFile =
      file.type.startsWith('image/') ||
      /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
    if (!isImageFile) {
      messageApi.error('请选择图片文件');
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_STATIC_IMAGE_BYTES) {
      messageApi.error('图片不能超过 2MB');
      return Upload.LIST_IGNORE;
    }
    try {
      const src = await readImageAsDataUrl(file);
      applyContent({ type: 'image', fieldPath: undefined, src });
    } catch {
      messageApi.error('图片读取失败');
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const replaceContent = (content: GridCellContent) => {
    if (!selectedCell) return;
    applyCell({
      ...selectedCell,
      printScope:
        selectedCell.printScope ?? defaultPrintScopeForContent(content),
      content,
    });
    setActivePaletteComponent(content.type);
  };

  const removeCell = (cellId: string) => {
    const remainingCells = schema.grid.cells.filter(
      (cell) => cell.id !== cellId,
    );
    emit(
      pruneEmptyDetailBands({
        ...schema,
        grid: { ...schema.grid, cells: remainingCells },
      }),
    );
    if (selectedCellId === cellId) {
      setSelectedCellId(remainingCells[0]?.id ?? '');
    }
    setSelectedGridCell(undefined);
  };

  const removeSelectedCell = () => {
    if (!selectedCell) return;
    removeCell(selectedCell.id);
  };

  const selectDetailRegion = (regionId: string) => {
    const region = schema.grid.regions?.find((item) => item.id === regionId);
    const arrayRoot = arrayRootFromDataSource(region?.dataSource);
    if (arrayRoot) setActiveArrayRoot(arrayRoot);
    setSelectedCellId('');
    setSelectedRegionId(regionId);
    setSelectedGridCell(undefined);
    setActivePaletteComponent('detail_table');
    setMergeAnchor(undefined);
    setMergeFocus(undefined);
  };

  const createDetailRegionAt = (row: number, col: number) => {
    const arrayRoot = defaultArrayRoot(fields);
    const span = resolveAvailableRegionSpan(
      schema,
      row,
      col,
      Math.min(10, schema.grid.rows.length - row + 1),
      schema.grid.columns.length - col + 1,
    );
    if (!span) return;
    const region = normalizeDetailRegionForGrid(
      schema,
      buildDefaultDetailRegion(makeRegionId(), fields, arrayRoot, {
        colSpan: span.colSpan,
        maxRowsPerPage: span.rowSpan - 2,
        startCol: col,
        startRow: row,
      }),
    );
    emit({
      ...schema,
      grid: {
        ...schema.grid,
        regions: [...(schema.grid.regions ?? []), region],
      },
    });
    selectDetailRegion(region.id);
  };

  const removeDetailRegion = (regionId: string) => {
    const next: GridPrintTemplateSchema = {
      ...schema,
      grid: {
        ...schema.grid,
        regions: (schema.grid.regions ?? []).filter(
          (region) => region.id !== regionId,
        ),
      },
    };
    applyGridSchema(next);
  };

  const detailColumnDropIndexFromEvent = (
    event: DragEvent<HTMLElement>,
    region: GridRegionSchema,
  ): number => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = clampNumber(event.clientX - bounds.left, 0, bounds.width);
    const weights = region.columns.map((column) =>
      Math.max(column.widthMm ?? 24, MIN_DETAIL_COLUMN_WIDTH_MM),
    );
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (total <= 0 || bounds.width <= 0) return region.columns.length;
    let left = 0;
    for (let index = 0; index < weights.length; index += 1) {
      const width = (bounds.width * weights[index]) / total;
      if (x < left + width / 2) return index;
      left += width;
    }
    return region.columns.length;
  };

  const moveDetailColumn = (
    regionId: string,
    fromIndex: number,
    toIndex: number,
  ) => {
    const region = schema.grid.regions?.find((item) => item.id === regionId);
    const column = region?.columns[fromIndex];
    if (!region || !column) return;
    const withoutColumn = region.columns.filter(
      (_, index) => index !== fromIndex,
    );
    const safeIndex = clampNumber(
      toIndex > fromIndex ? toIndex - 1 : toIndex,
      0,
      withoutColumn.length,
    );
    emit(
      updateDetailColumns(schema, region.id, [
        ...withoutColumn.slice(0, safeIndex),
        column,
        ...withoutColumn.slice(safeIndex),
      ]),
    );
    selectDetailRegion(region.id);
  };

  const upsertDetailFieldAt = (
    field: GridDesignerField,
    insertIndex?: number,
    regionId = selectedRegion?.id,
  ) => {
    const region = schema.grid.regions?.find((item) => item.id === regionId);
    if (!region) return;
    const existingIndex = region.columns.findIndex(
      (column) => column.fieldPath === field.fieldPath,
    );
    const column =
      existingIndex >= 0
        ? region.columns[existingIndex]
        : detailColumnFromField(field);
    const withoutColumn =
      existingIndex >= 0
        ? region.columns.filter((_, index) => index !== existingIndex)
        : region.columns;
    const safeIndex = clampNumber(
      insertIndex === undefined
        ? withoutColumn.length
        : insertIndex > existingIndex && existingIndex >= 0
          ? insertIndex - 1
          : insertIndex,
      0,
      withoutColumn.length,
    );
    emit(
      updateDetailColumns(schema, region.id, [
        ...withoutColumn.slice(0, safeIndex),
        column,
        ...withoutColumn.slice(safeIndex),
      ]),
    );
    selectDetailRegion(region.id);
  };

  const updateDetailColumn = (
    regionId: string,
    columnIndex: number,
    patch: Partial<GridDetailColumnSchema>,
  ) => {
    const region = schema.grid.regions?.find((item) => item.id === regionId);
    if (!region) return;
    emit(
      updateDetailColumns(
        schema,
        region.id,
        region.columns.map((column, index) =>
          index === columnIndex ? { ...column, ...patch } : column,
        ),
      ),
    );
  };

  const addRowIndexDetailColumn = (regionId: string) => {
    const region = schema.grid.regions?.find((item) => item.id === regionId);
    if (!region || region.columns.some((column) => column.type === 'row_index'))
      return;
    emit(
      updateDetailColumns(schema, region.id, [
        { title: '序号', type: 'row_index', widthMm: 12 },
        ...region.columns,
      ]),
    );
  };

  const removeDetailColumn = (regionId: string, columnIndex: number) => {
    const region = schema.grid.regions?.find((item) => item.id === regionId);
    if (!region || region.columns.length <= 1) return;
    emit(
      updateDetailColumns(
        schema,
        region.id,
        region.columns.filter((_, index) => index !== columnIndex),
      ),
    );
  };

  const handleDetailDrop = (
    event: DragEvent<HTMLElement>,
    region: GridRegionSchema,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const insertIndex = detailColumnDropIndexFromEvent(event, region);
    setDragOverGridKey(undefined);
    setDetailColumnDropTarget(undefined);
    const payload = readDragPayload(event);
    if (payload && movePayloadToPointerPosition(event, payload)) return;
    if (payload?.kind === 'moveDetailColumn') {
      if (payload.regionId === region.id) {
        moveDetailColumn(region.id, payload.columnIndex, insertIndex);
      }
      return;
    }
    if (!payload || payload.kind !== 'detailField') return;
    const regionArrayRoot =
      arrayRootFromDataSource(region.dataSource) ?? detailArrayRoot;
    const field = detailFieldsForArrayRoot(fields, regionArrayRoot).find(
      (item) => item.fieldPath === payload.fieldPath,
    );
    if (field) upsertDetailFieldAt(field, insertIndex, region.id);
  };

  const handleDetailDragOver = (
    event: DragEvent<HTMLElement>,
    region: GridRegionSchema,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = activeDragOperation ?? 'copy';
    setDragOverGridKey(`region:${region.id}`);
    setDetailColumnDropTarget({
      regionId: region.id,
      columnIndex: detailColumnDropIndexFromEvent(event, region),
    });
  };

  const beginCellMove = (
    event: DragEvent<HTMLElement>,
    cell: GridCellSchema,
  ) => {
    setSelectedCellId(cell.id);
    setSelectedRegionId(undefined);
    setSelectedGridCell(undefined);
    const position = gridPositionFromClientPoint(event.clientX, event.clientY);
    setDragPayload(event, {
      kind: 'moveCell',
      cellId: cell.id,
      rowOffset: Math.max(0, (position?.row ?? cell.row) - cell.row),
      colOffset: Math.max(0, (position?.col ?? cell.col) - cell.col),
    });
  };

  const beginRegionMove = (
    event: DragEvent<HTMLElement>,
    region: GridRegionSchema,
  ) => {
    selectDetailRegion(region.id);
    const position = gridPositionFromClientPoint(event.clientX, event.clientY);
    setDragPayload(event, {
      kind: 'moveRegion',
      regionId: region.id,
      rowOffset: Math.max(
        0,
        (position?.row ?? region.startRow) - region.startRow,
      ),
      colOffset: Math.max(
        0,
        (position?.col ?? region.startCol) - region.startCol,
      ),
    });
  };

  const beginGridResize = (
    event: ReactPointerEvent<HTMLElement>,
    target:
      | { kind: 'cell'; cellId: string }
      | { kind: 'region'; regionId: string },
    direction: GridResizeDirection = 'both',
  ) => {
    event.preventDefault();
    event.stopPropagation();
    resizeCleanupRef.current?.();

    const baseSchema = schema;
    let latestSchema = baseSchema;
    const baseEndPosition = (() => {
      if (target.kind === 'cell') {
        const cell = baseSchema.grid.cells.find(
          (item) => item.id === target.cellId,
        );
        return cell
          ? {
              row: cell.row + (cell.rowSpan ?? 1) - 1,
              col: cell.col + (cell.colSpan ?? 1) - 1,
            }
          : undefined;
      }
      const region = baseSchema.grid.regions?.find(
        (item) => item.id === target.regionId,
      );
      return region
        ? {
            row: region.startRow + regionRowSpan(region) - 1,
            col:
              region.startCol +
              resolveRegionColSpan(region, baseSchema.grid.columns.length) -
              1,
          }
        : undefined;
    })();
    if (!baseEndPosition) return;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    const cursor =
      direction === 'horizontal'
        ? 'col-resize'
        : direction === 'vertical'
          ? 'row-resize'
          : 'nwse-resize';

    document.body.style.cursor = cursor;
    document.body.style.userSelect = 'none';

    const applyResizeAtPoint = (clientX: number, clientY: number) => {
      const position = gridPositionFromClientPoint(clientX, clientY);
      if (!position) return;
      const row =
        direction === 'horizontal' ? baseEndPosition.row : position.row;
      const col = direction === 'vertical' ? baseEndPosition.col : position.col;
      const next =
        target.kind === 'cell'
          ? resizeCellInSchema(baseSchema, target.cellId, row, col)
          : resizeDetailRegionInSchema(baseSchema, target.regionId, row, col);
      if (!next || sameGridSchema(latestSchema, next)) return;
      latestSchema = next;
      setDragOverGridKey(gridPositionKey(row, col));
      onChange?.(next);
    };

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      pointerEvent.preventDefault();
      applyResizeAtPoint(pointerEvent.clientX, pointerEvent.clientY);
    };

    const finishResize = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishResize);
      window.removeEventListener('pointercancel', finishResize);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      setDragOverGridKey(undefined);
      if (!sameGridSchema(baseSchema, latestSchema)) {
        setHistory((current) => ({
          past: [...current.past, baseSchema].slice(-HISTORY_LIMIT),
          future: [],
        }));
      }
      resizeCleanupRef.current = undefined;
    };

    resizeCleanupRef.current = finishResize;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishResize, { once: true });
    window.addEventListener('pointercancel', finishResize, { once: true });
    applyResizeAtPoint(event.clientX, event.clientY);
  };

  const beginCellResize = (
    event: ReactPointerEvent<HTMLElement>,
    cell: GridCellSchema,
    direction?: GridResizeDirection,
  ) => {
    setSelectedCellId(cell.id);
    setSelectedRegionId(undefined);
    setSelectedGridCell(undefined);
    setActivePaletteComponent(cell.content.type);
    beginGridResize(event, { kind: 'cell', cellId: cell.id }, direction);
  };

  const beginRegionResize = (
    event: ReactPointerEvent<HTMLElement>,
    region: GridRegionSchema,
    direction?: GridResizeDirection,
  ) => {
    selectDetailRegion(region.id);
    beginGridResize(event, { kind: 'region', regionId: region.id }, direction);
  };

  const beginDetailColumnMove = (
    event: DragEvent<HTMLElement>,
    region: GridRegionSchema,
    columnIndex: number,
  ) => {
    event.stopPropagation();
    selectDetailRegion(region.id);
    setDragPayload(event, {
      kind: 'moveDetailColumn',
      regionId: region.id,
      columnIndex,
    });
  };

  const changeDetailDataSource = (arrayRoot: string) => {
    setActiveArrayRoot(arrayRoot);
    const targetBand = selectedDetailBand;
    if (targetBand) {
      const conflictingRoots = detailFieldRootsInRow(
        schema,
        targetBand.row,
      ).filter((root) => root !== arrayRoot);
      if (conflictingRoots.length > 0) {
        messageApi.warning(
          `当前明细行已有「${labelForArrayRoot(
            conflictingRoots[0] ?? 'items',
            fields,
          )}」字段，请清空该行或另起一行添加「${labelForArrayRoot(
            arrayRoot,
            fields,
          )}」字段`,
        );
        return;
      }
      emit({
        ...schema,
        grid: {
          ...schema.grid,
          detailBands: (schema.grid.detailBands ?? []).map((band) =>
            band.id === targetBand.id
              ? { ...band, dataSource: `${arrayRoot}[]` }
              : band,
          ),
        },
      });
      return;
    }
    const targetRegion = activeDetailRegion;
    if (!targetRegion) return;
    const nextColumns = defaultDetailColumns(fields, arrayRoot);
    emit({
      ...schema,
      grid: {
        ...schema.grid,
        regions: (schema.grid.regions ?? []).map((region) =>
          region.id === targetRegion.id
            ? {
                ...region,
                dataSource: `${arrayRoot}[]`,
                columns: nextColumns,
                summary: detailSummaryForColumns(nextColumns, undefined, {
                  includeDefaults: true,
                }),
              }
            : region,
        ),
      },
    });
    selectDetailRegion(targetRegion.id);
  };

  const toggleImmersiveEditor = () => {
    if (isImmersive) {
      setImmersiveContainer(undefined);
      return;
    }
    const container =
      designerShellRef.current?.closest<HTMLElement>(
        '.runtime-keep-alive-layout, .runtime-keep-alive-layout-no',
      ) ??
      designerShellRef.current?.closest<HTMLElement>('.ant-pro-page-container');
    if (!container) {
      void messageApi.warning('当前页面无法进入沉浸编辑，请刷新后重试');
      return;
    }
    setImmersiveContainer(container);
  };

  const activatePaletteComponent = (component: PaletteComponentKind) => {
    setActivePaletteComponent(component);
    if (component === 'detail_row_index') {
      const content = contentForType(
        component,
        selectedCell?.content ?? { type: 'detail_row_index' },
        scalarFields,
        arrayFields,
      );
      if (!content) return;
      if (selectedCell) {
        replaceContent(content);
        return;
      }
      if (selectedGridCell) {
        createCellAtPosition(
          selectedGridCell.row,
          selectedGridCell.col,
          content,
        );
      }
      return;
    }
    if (component !== 'detail_table') return;
    if (selectedRegion) return;
    if (firstDetailRegion) {
      selectDetailRegion(firstDetailRegion.id);
      return;
    }
    createDetailRegionAt(6, 1);
  };

  const activeBoundFieldType: BoundFieldContentType = isBoundFieldContentType(
    activePaletteComponent,
  )
    ? activePaletteComponent
    : 'field_label_value';

  const bindScalarFieldToSelectedCell = (
    field: GridDesignerField,
    contentType: BoundFieldContentType,
  ) => {
    setActivePaletteComponent(contentType);
    const content = boundFieldContent(field, contentType);
    if (selectedCell) {
      replaceContent(content);
      return;
    }
    if (selectedGridCell) {
      createCellAtPosition(selectedGridCell.row, selectedGridCell.col, content);
      return;
    }
    messageApi.info('请先选择一个单元格，或把字段拖入网格');
  };

  const bindDetailFieldToSelectedCell = (field: GridDesignerField) => {
    const arrayRoot = arrayRootOfFieldPath(field.fieldPath);
    if (arrayRoot) setActiveArrayRoot(arrayRoot);
    const content = detailFieldContent(field);
    if (selectedCell) {
      applyCell({
        ...selectedCell,
        printScope: undefined,
        content,
        style: {
          ...detailCellStyle(content),
          ...selectedCell.style,
        },
      });
      return;
    }
    if (selectedGridCell) {
      createCellAtPosition(
        selectedGridCell.row,
        selectedGridCell.col,
        content,
        detailCellStyle(content),
      );
      return;
    }
    messageApi.info('请先选择一个单元格，或把明细字段拖入网格');
  };

  const bindAggregateFieldToSelectedCell = (
    field: GridDesignerField,
    aggregate: GridAggregateType,
  ) => {
    setActivePaletteComponent('aggregate_field');
    if (!selectedCell) {
      return;
    }
    replaceContent(aggregateContentForField(field, aggregate));
  };

  const aggregateOptionsForFieldPath = (fieldPath?: string) => {
    const field = fieldPath ? arrayFieldByPath.get(fieldPath) : undefined;
    return [
      ...(field?.fieldType === 'number'
        ? [{ label: '求和（sum）', value: 'sum' as const }]
        : []),
      { label: '计数（count）', value: 'count' as const },
    ];
  };

  const boundFieldIcon = (contentType: BoundFieldContentType) =>
    contentType === 'qrcode' ? (
      <QrcodeOutlined />
    ) : contentType === 'barcode' ? (
      <BarcodeOutlined />
    ) : contentType === 'image' ? (
      <FileImageOutlined />
    ) : contentType === 'signature_box' ? (
      <BorderOutlined />
    ) : (
      <FieldStringOutlined />
    );

  const renderScalarFieldList = (contentType: BoundFieldContentType) => (
    <div style={{ paddingInlineEnd: 4 }}>
      {scalarFields.length > 0 ? (
        groupFields(scalarFields).map((group) => (
          <div key={group.groupName}>
            <div style={sectionTitleStyle}>{group.groupName}</div>
            {group.fields.map((field) => {
              const isCurrentField =
                selectedCell?.content.fieldPath === field.fieldPath &&
                selectedCell.content.type === contentType;
              return (
                <Button
                  key={field.fieldPath}
                  size="small"
                  type="text"
                  draggable
                  icon={
                    isCurrentField ? (
                      <CheckOutlined />
                    ) : (
                      boundFieldIcon(contentType)
                    )
                  }
                  style={{
                    ...draggableButtonStyle,
                    ...(isCurrentField ? detailFieldAddedStyle : undefined),
                  }}
                  title="拖入网格或绑定到当前单元格"
                  onClick={() =>
                    bindScalarFieldToSelectedCell(field, contentType)
                  }
                  onDragStart={(event) =>
                    setDragPayload(event, {
                      kind: 'boundField',
                      fieldPath: field.fieldPath,
                      contentType,
                    })
                  }
                >
                  {field.fieldLabel}
                </Button>
              );
            })}
          </div>
        ))
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无单据字段"
        />
      )}
    </div>
  );

  const renderDetailFieldList = () => (
    <>
      <Select
        value={detailArrayRoot}
        options={arrayRootOptions}
        onChange={changeDetailDataSource}
        getPopupContainer={getDesignerPopupContainer}
        style={{ marginBottom: 8, width: '100%' }}
      />
      <div style={{ paddingInlineEnd: 4 }}>
        {availableDetailFields.length > 0 ? (
          availableDetailFields.map((field) => {
            return (
              <Button
                key={field.fieldPath}
                size="small"
                draggable
                type="text"
                title="拖入网格，或点击绑定到当前单元格"
                icon={
                  field.formatType === 'image' ? (
                    <FileImageOutlined />
                  ) : (
                    <FieldStringOutlined />
                  )
                }
                style={draggableButtonStyle}
                onDragStart={(event) =>
                  setDragPayload(event, {
                    kind: 'detailField',
                    fieldPath: field.fieldPath,
                  })
                }
                onClick={() => bindDetailFieldToSelectedCell(field)}
              >
                {field.fieldLabel}
              </Button>
            );
          })
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              arrayFields.length > 0 ? '明细字段已全部添加' : '暂无明细字段'
            }
          />
        )}
      </div>
    </>
  );

  const renderAggregateFieldList = () => {
    const countField = aggregateArrayFields[0];
    const numericFields = aggregateArrayFields.filter(
      (field) => field.fieldType === 'number',
    );
    return (
      <>
        <Select
          value={aggregateArrayRoot}
          options={arrayRootOptions}
          onChange={setActiveArrayRoot}
          getPopupContainer={getDesignerPopupContainer}
          style={{ marginBottom: 8, width: '100%' }}
        />
        <div style={{ paddingInlineEnd: 4 }}>
          {countField ? (
            <Button
              size="small"
              draggable
              type="text"
              icon={<CalculatorOutlined />}
              style={draggableButtonStyle}
              title="拖入网格，或点击绑定到当前单元格"
              onDragStart={(event) =>
                setDragPayload(event, {
                  kind: 'aggregateField',
                  fieldPath: countField.fieldPath,
                  aggregate: 'count',
                })
              }
              onClick={() =>
                bindAggregateFieldToSelectedCell(countField, 'count')
              }
            >
              {labelForArrayRoot(aggregateArrayRoot, fields)}数量
            </Button>
          ) : null}
          {numericFields.map((field) => {
            const isCurrentField =
              selectedCell?.content.type === 'aggregate_field' &&
              selectedCell.content.fieldPath === field.fieldPath &&
              selectedCell.content.aggregate === 'sum';
            return (
              <Button
                key={field.fieldPath}
                size="small"
                draggable
                type="text"
                icon={
                  isCurrentField ? <CheckOutlined /> : <CalculatorOutlined />
                }
                style={{
                  ...draggableButtonStyle,
                  ...(isCurrentField ? detailFieldAddedStyle : undefined),
                }}
                title="拖入网格，或点击绑定到当前单元格"
                onDragStart={(event) =>
                  setDragPayload(event, {
                    kind: 'aggregateField',
                    fieldPath: field.fieldPath,
                    aggregate: 'sum',
                  })
                }
                onClick={() => bindAggregateFieldToSelectedCell(field, 'sum')}
              >
                {field.fieldLabel}合计
              </Button>
            );
          })}
          {!countField && numericFields.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无可合计字段"
            />
          ) : null}
        </div>
      </>
    );
  };

  const paletteGroups: Array<{
    groupName: string;
    components: PaletteComponentConfig[];
  }> = [
    {
      groupName: '内容',
      components: [
        {
          key: 'static_text',
          label: '静态文本',
          icon: <FontSizeOutlined />,
          dragContentType: 'static_text',
        },
        {
          key: 'field',
          label: '字段',
          icon: <FieldStringOutlined />,
          dragContentType: 'field',
        },
        {
          key: 'field_label_value',
          label: '标签字段',
          icon: <FieldStringOutlined />,
          dragContentType: 'field_label_value',
        },
        {
          key: 'signature_box',
          label: '签收区',
          icon: <BorderOutlined />,
          dragContentType: 'signature_box',
        },
        {
          key: 'image',
          label: '图片',
          icon: <FileImageOutlined />,
          dragContentType: 'image',
        },
      ],
    },
    {
      groupName: '码类',
      components: [
        {
          key: 'qrcode',
          label: '二维码',
          icon: <QrcodeOutlined />,
          dragContentType: 'qrcode',
        },
        {
          key: 'barcode',
          label: '条码',
          icon: <BarcodeOutlined />,
          dragContentType: 'barcode',
        },
      ],
    },
    {
      groupName: '明细',
      components: [
        {
          key: 'detail_row_index',
          label: '明细序号',
          icon: <TableOutlined />,
          dragContentType: 'detail_row_index',
        },
        {
          key: 'aggregate_field',
          label: '合计字段',
          icon: <CalculatorOutlined />,
          dragContentType: 'aggregate_field',
        },
      ],
    },
    {
      groupName: '辅助',
      components: [
        {
          key: 'page_number',
          label: '页码',
          icon: <FontSizeOutlined />,
          dragContentType: 'page_number',
        },
        {
          key: 'copy_mark',
          label: '联别',
          icon: <TableOutlined />,
          dragContentType: 'copy_mark',
        },
      ],
    },
  ];
  const activePaletteLabel =
    paletteGroups
      .flatMap((group) => group.components)
      .find((component) => component.key === activePaletteComponent)?.label ??
    '组件';
  const fieldPanelMode =
    activePaletteComponent === 'detail_table'
      ? 'detail'
      : activePaletteComponent === 'aggregate_field'
        ? 'aggregate'
        : isBoundFieldContentType(activePaletteComponent)
          ? 'scalar'
          : 'none';

  const occupiedKeys = occupiedGridKeys(schema);
  const emptyGridPositions: Array<{ row: number; col: number }> = [];
  for (let row = 1; row <= schema.grid.rows.length; row += 1) {
    for (let col = 1; col <= schema.grid.columns.length; col += 1) {
      if (!occupiedKeys.has(gridPositionKey(row, col))) {
        emptyGridPositions.push({ row, col });
      }
    }
  }
  const designer = (
    <div
      ref={designerShellRef}
      style={{
        ...designerShellStyle,
        background: token.colorBgContainer,
        borderColor: token.colorBorder,
        ...(isImmersive ? designerShellImmersiveStyle : undefined),
      }}
    >
      {messageContextHolder}
      {modalContextHolder}
      <div
        style={{
          ...designerToolbarStyle,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Space size={8} style={designerToolbarLeftStyle}>
          <Typography.Text strong style={designerToolbarTitleStyle}>
            网格设计器
          </Typography.Text>
          <InputNumber
            size="small"
            addonBefore="总行"
            min={firstDetailRegion ? 3 : 1}
            max={MAX_GRID_ROWS}
            value={
              rowCountDraft === undefined
                ? schema.grid.rows.length
                : rowCountDraft
            }
            onChange={updateRowCountDraft}
            onPressEnter={(event) => event.currentTarget.blur()}
            onBlur={commitRowCountDraft}
            style={{ width: 110 }}
          />
          <InputNumber
            size="small"
            addonBefore="总列"
            min={1}
            max={MAX_GRID_COLUMNS}
            value={
              columnCountDraft === undefined
                ? schema.grid.columns.length
                : columnCountDraft
            }
            onChange={updateColumnCountDraft}
            onPressEnter={(event) => event.currentTarget.blur()}
            onBlur={commitColumnCountDraft}
            style={{ width: 102 }}
          />
        </Space>
        <Space size={8} wrap style={designerToolbarActionsStyle}>
          <Tooltip
            title={
              selectedPresetOption?.description ?? '从内置版式生成可编辑网格'
            }
            getPopupContainer={getDesignerPopupContainer}
          >
            <Select<GridTemplatePreset>
              size="small"
              value={selectedPreset}
              options={presetOptions.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
              style={{ width: 150 }}
              onChange={setSelectedPreset}
              getPopupContainer={getDesignerPopupContainer}
            />
          </Tooltip>
          <Popconfirm
            title="套用预设"
            description="会替换当前画布内容，套用后可用撤销恢复。"
            okText="套用"
            cancelText="取消"
            onConfirm={applySelectedPreset}
            getPopupContainer={getDesignerPopupContainer}
          >
            <Button disabled={presetOptions.length === 0}>套用预设</Button>
          </Popconfirm>
          {onPreview ? (
            <Tooltip
              title="使用样例数据预览当前草稿"
              getPopupContainer={getDesignerPopupContainer}
            >
              <Button
                icon={<EyeOutlined />}
                loading={previewLoading}
                onClick={() => {
                  void onPreview?.({
                    error: (content) => {
                      void messageApi.error(content);
                    },
                  });
                }}
              >
                预览
              </Button>
            </Tooltip>
          ) : null}
          <Tooltip
            title="点击两个列头可选择当前行的多列范围；点击两个行号可选择当前列的多行范围；也可拖选表头或 Shift+点击单元格框选"
            getPopupContainer={getDesignerPopupContainer}
          >
            <Button
              icon={<MergeCellsOutlined />}
              disabled={!mergeRange}
              onClick={() => mergeSelectedRange()}
            >
              合并单元格
            </Button>
          </Tooltip>
          {selectedCell &&
          ((selectedCell.colSpan ?? 1) > 1 ||
            (selectedCell.rowSpan ?? 1) > 1) ? (
            <Button icon={<SplitCellsOutlined />} onClick={unmergeSelectedCell}>
              取消合并
            </Button>
          ) : null}
          <Tooltip
            title="撤销上一步"
            getPopupContainer={getDesignerPopupContainer}
          >
            <Button
              icon={<UndoOutlined />}
              disabled={history.past.length === 0}
              onClick={undoGridChange}
            >
              撤销
            </Button>
          </Tooltip>
          <Tooltip
            title="重做下一步"
            getPopupContainer={getDesignerPopupContainer}
          >
            <Button
              icon={<RedoOutlined />}
              disabled={history.future.length === 0}
              onClick={redoGridChange}
            >
              重做
            </Button>
          </Tooltip>
          <Tooltip
            title={
              isImmersive
                ? '退出沉浸编辑，回到模板表单'
                : '占满当前业务标签内容区；可切换顶部标签复制资料，草稿保持不丢失'
            }
            getPopupContainer={getDesignerPopupContainer}
          >
            <Button
              aria-label={isImmersive ? '退出沉浸编辑' : '沉浸编辑'}
              icon={isImmersive ? <CompressOutlined /> : <ExpandOutlined />}
              onClick={toggleImmersiveEditor}
            >
              {isImmersive ? '退出沉浸' : '沉浸编辑'}
            </Button>
          </Tooltip>
        </Space>
      </div>
      <div
        style={{
          ...designerStyle,
          ...(isImmersive ? designerImmersiveStyle : undefined),
        }}
      >
        <aside
          aria-label="模板组件与字段面板"
          style={{
            ...sidePanelStyle,
            background: token.colorFillQuaternary,
          }}
          onDragEnd={handleDragEnd}
        >
          <div style={leftPanelBlockStyle}>
            <div style={panelHeaderStyle}>
              <Typography.Text strong>组件</Typography.Text>
              <Tag>{activePaletteLabel}</Tag>
            </div>
            {paletteGroups.map((group) => (
              <div key={group.groupName}>
                <div style={componentGroupTitleStyle}>{group.groupName}</div>
                <div style={componentGridStyle}>
                  {group.components.map((component) => {
                    const active = activePaletteComponent === component.key;
                    return (
                      <Tooltip
                        key={component.key}
                        title="拖入网格生成组件"
                        getPopupContainer={getDesignerPopupContainer}
                      >
                        <Button
                          draggable
                          icon={component.icon}
                          style={{
                            ...componentButtonStyle,
                            ...(active
                              ? activeComponentButtonStyle
                              : undefined),
                          }}
                          onClick={() =>
                            activatePaletteComponent(component.key)
                          }
                          onDragStart={(event) =>
                            component.dragContentType
                              ? setDragPayload(event, {
                                  kind: 'component',
                                  contentType: component.dragContentType,
                                })
                              : undefined
                          }
                        >
                          {component.label}
                        </Button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ paddingTop: 12 }}>
            <div style={panelHeaderStyle}>
              <Typography.Text strong>字段</Typography.Text>
              <Tag>
                {fieldPanelMode === 'detail'
                  ? `${selectedDetailColumns.length} 列`
                  : fieldPanelMode === 'aggregate'
                    ? '合计'
                    : activePaletteLabel}
              </Tag>
            </div>
            {fieldPanelMode === 'detail' ? (
              renderDetailFieldList()
            ) : fieldPanelMode === 'aggregate' ? (
              renderAggregateFieldList()
            ) : fieldPanelMode === 'scalar' ? (
              <>
                {renderScalarFieldList(activeBoundFieldType)}
                {arrayFields.length > 0 ? (
                  <>
                    <Divider style={{ margin: '10px 0' }} />
                    <div style={sectionTitleStyle}>明细字段</div>
                    {renderDetailFieldList()}
                  </>
                ) : null}
              </>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="当前组件无需字段"
              />
            )}
          </div>
        </aside>
        <div style={canvasWrapStyle} onDragEnd={handleDragEnd}>
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Typography.Text
              style={{ fontSize: 12 }}
              type={isOverPrintableWidth ? 'danger' : 'secondary'}
            >
              列宽合计 {formatMm(totalColumnsWidthMm)}mm
              {paperMetrics
                ? ` ／ 可打印宽度 ${formatMm(
                    paperMetrics.printableWidthMm,
                  )}mm（${paperMetrics.name || '纸型'}，纸宽 ${formatMm(
                    paperMetrics.pageWidthMm,
                  )}mm 扣除左右边距）`
                : ''}
            </Typography.Text>
            {isOverPrintableWidth ? (
              <Tag color="warning">
                超出纸张 {formatMm(overPrintableWidthMm)}
                mm，超出部分（画布红色区域）打印时会被裁掉
              </Tag>
            ) : null}
          </div>
          <div style={sheetFrameStyle}>
            <div style={sheetCornerStyle} />
            <div
              style={{
                background: '#f1f5f9',
                borderBottom: '1px solid #cbd5e1',
                display: 'grid',
                gridTemplateColumns: gridColumnTemplate,
                minWidth: sheetBodyWidthPx || undefined,
              }}
            >
              {schema.grid.columns.map((column, index) => (
                <Dropdown
                  key={column.key}
                  menu={columnHeaderMenu(index)}
                  trigger={['contextMenu']}
                  getPopupContainer={getDesignerPopupContainer}
                >
                  <button
                    type="button"
                    aria-pressed={
                      Boolean(
                        (mergeRange &&
                          index + 1 >= mergeRange.startCol &&
                          index + 1 <= mergeRange.endCol) ||
                          (headerSelection?.kind === 'col' &&
                            headerSelection.start === index),
                      ) || undefined
                    }
                    style={{
                      ...sheetColumnHeaderStyle,
                      ...((mergeRange &&
                        index + 1 >= mergeRange.startCol &&
                        index + 1 <= mergeRange.endCol) ||
                      (headerSelection?.kind === 'col' &&
                        headerSelection.start === index)
                        ? { background: '#dbeafe' }
                        : undefined),
                    }}
                    title="拖动边缘调整列宽；点击两个列头或按住拖过相邻列，可选择当前行的合并范围"
                    onPointerDown={(event) => {
                      if (event.button === 0) {
                        event.preventDefault();
                        beginHeaderSelect('col', index);
                      }
                    }}
                    onPointerEnter={(event) => {
                      if (event.buttons === 1) extendHeaderSelect('col', index);
                    }}
                    onPointerOver={(event) => {
                      if (event.buttons === 1) extendHeaderSelect('col', index);
                    }}
                  >
                    {column.key || excelColumnLabel(index)}
                    <span
                      aria-hidden
                      draggable={false}
                      style={columnResizeHandleStyle}
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        beginColumnWidthResize(event, index);
                      }}
                    />
                  </button>
                </Dropdown>
              ))}
            </div>
            <div
              style={{
                background: '#f8fafc',
                display: 'grid',
                gridTemplateRows: visualGridRowTemplate,
                minHeight: sheetBodyHeightPx || undefined,
              }}
            >
              {visualRows.map((visualRow) => {
                const index = visualRow.actualRow - 1;
                const row = schema.grid.rows[index];
                return (
                  <Dropdown
                    key={row.key}
                    menu={rowHeaderMenu(index)}
                    trigger={['contextMenu']}
                    getPopupContainer={getDesignerPopupContainer}
                  >
                    <button
                      type="button"
                      data-actual-row={visualRow.actualRow}
                      data-visual-row={visualRow.displayRow}
                      aria-pressed={
                        Boolean(
                          (mergeRange &&
                            index + 1 >= mergeRange.startRow &&
                            index + 1 <= mergeRange.endRow) ||
                            (headerSelection?.kind === 'row' &&
                              headerSelection.start === index),
                        ) || undefined
                      }
                      style={{
                        ...sheetRowHeaderStyle,
                        ...((mergeRange &&
                          index + 1 >= mergeRange.startRow &&
                          index + 1 <= mergeRange.endRow) ||
                        (headerSelection?.kind === 'row' &&
                          headerSelection.start === index)
                          ? { background: '#dbeafe' }
                          : undefined),
                      }}
                      title="拖动边缘调整行高；点击两个行号或按住拖过相邻行，可选择当前列的合并范围"
                      onPointerDown={(event) => {
                        if (event.button === 0) {
                          event.preventDefault();
                          beginHeaderSelect('row', index);
                        }
                      }}
                      onPointerEnter={(event) => {
                        if (event.buttons === 1)
                          extendHeaderSelect('row', index);
                      }}
                      onPointerOver={(event) => {
                        if (event.buttons === 1)
                          extendHeaderSelect('row', index);
                      }}
                    >
                      {visualRow.displayRow}
                      <span
                        aria-hidden
                        draggable={false}
                        style={rowResizeHandleStyle}
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          beginRowHeightResize(event, index);
                        }}
                      />
                    </button>
                  </Dropdown>
                );
              })}
            </div>
            <div
              ref={gridCanvasRef}
              style={{
                ...canvasStyle,
                gridTemplateColumns: gridColumnTemplate,
                gridTemplateRows: visualGridRowTemplate,
                minHeight: sheetBodyHeightPx || undefined,
                minWidth: sheetBodyWidthPx || undefined,
                position: 'relative',
              }}
            >
              {paperMetrics ? (
                <>
                  {canvasColumnsPx > paperPrintablePx ? (
                    <div
                      aria-hidden
                      style={{
                        background: 'rgba(245, 34, 45, 0.08)',
                        bottom: 0,
                        left: paperPrintablePx,
                        pointerEvents: 'none',
                        position: 'absolute',
                        top: 0,
                        width: canvasColumnsPx - paperPrintablePx,
                        zIndex: 5,
                      }}
                    />
                  ) : null}
                  <div
                    aria-hidden
                    title={`纸张可打印宽度 ${formatMm(
                      paperMetrics.printableWidthMm,
                    )}mm`}
                    style={{
                      borderLeft: `2px dashed ${
                        isOverPrintableWidth ? '#f5222d' : '#94a3b8'
                      }`,
                      bottom: 0,
                      left: paperPrintablePx,
                      pointerEvents: 'none',
                      position: 'absolute',
                      top: 0,
                      zIndex: 6,
                    }}
                  />
                </>
              ) : null}
              {mergeRange ? (
                <div
                  aria-hidden
                  style={{
                    background: 'rgba(22, 119, 255, 0.10)',
                    gridColumn: `${mergeRange.startCol} / span ${
                      mergeRange.endCol - mergeRange.startCol + 1
                    }`,
                    gridRow: `${visualRowStart(
                      mergeRange.startRow,
                    )} / span ${visualRowSpan(
                      mergeRange.startRow,
                      mergeRange.endRow - mergeRange.startRow + 1,
                    )}`,
                    outline: '2px solid var(--ant-color-primary)',
                    outlineOffset: -2,
                    pointerEvents: 'none',
                    zIndex: 6,
                  }}
                />
              ) : null}
              {emptyGridPositions.map((position) => {
                const key = gridPositionKey(position.row, position.col);
                const isDragOver = dragOverGridKey === key;
                const isSelectedGridCell =
                  selectedGridCell?.row === position.row &&
                  selectedGridCell.col === position.col;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={`空白格 ${position.row} 行 ${position.col} 列`}
                    title={`${excelColumnLabel(position.col - 1)}${
                      position.row
                    }`}
                    style={{
                      ...emptyGridCellStyle,
                      background:
                        isDragOver || isSelectedGridCell ? '#eff6ff' : '#fff',
                      boxShadow:
                        isDragOver || isSelectedGridCell
                          ? 'inset 0 0 0 2px var(--ant-color-primary)'
                          : undefined,
                      gridColumn: position.col,
                      gridRow: visualRowStart(position.row),
                      zIndex: isSelectedGridCell ? 3 : 1,
                    }}
                    onDragEnter={() => setDragOverGridKey(key)}
                    onDragLeave={() => setDragOverGridKey(undefined)}
                    onClick={(event) =>
                      selectGridCell(position.row, position.col, event)
                    }
                    onDragOver={(event) =>
                      handleGridDragOver(event, position.row, position.col)
                    }
                    onDrop={(event) =>
                      handleGridDrop(event, position.row, position.col)
                    }
                  />
                );
              })}
              {schema.grid.cells.map((cell) => {
                const cellKey = `cell:${cell.id}`;
                const isDragOver = dragOverGridKey === cellKey;
                return (
                  <Dropdown
                    key={cell.id}
                    menu={gridCellMenu(cell)}
                    trigger={['contextMenu']}
                    getPopupContainer={getDesignerPopupContainer}
                  >
                    <button
                      type="button"
                      draggable
                      title="拖动可移动位置，点击选中，右键删除"
                      style={{
                        ...cellStyle,
                        gridColumn: `${cell.col} / span ${cell.colSpan ?? 1}`,
                        gridRow: `${visualRowStart(
                          cell.row,
                        )} / span ${visualRowSpan(
                          cell.row,
                          cell.rowSpan ?? 1,
                        )}`,
                        ...styleFromCellStyle(cell.style),
                        alignItems:
                          cell.style?.verticalAlign === 'middle'
                            ? 'center'
                            : cell.style?.verticalAlign === 'bottom'
                              ? 'flex-end'
                              : 'flex-start',
                        justifyContent:
                          cell.style?.textAlign === 'center'
                            ? 'center'
                            : cell.style?.textAlign === 'right'
                              ? 'flex-end'
                              : 'flex-start',
                        outline:
                          selectedCellId === cell.id
                            ? '2px solid var(--ant-color-primary)'
                            : isDragOver
                              ? '2px dashed var(--ant-color-primary)'
                              : 'none',
                        textAlign: cell.style?.textAlign ?? 'left',
                        zIndex: selectedCellId === cell.id ? 4 : 3,
                      }}
                      onClick={(event) => selectCell(cell, event)}
                      onDragStart={(event) => beginCellMove(event, cell)}
                      onDragEnter={() => setDragOverGridKey(cellKey)}
                      onDragLeave={() => setDragOverGridKey(undefined)}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect =
                          activeDragOperation ?? 'copy';
                        setDragOverGridKey(cellKey);
                      }}
                      onDrop={(event) => handleCellDrop(event, cell)}
                    >
                      {printScopeShortLabel(cell.printScope) ? (
                        <span
                          aria-hidden
                          style={printScopeBadgeStyle(cell.printScope)}
                        >
                          {printScopeShortLabel(cell.printScope)}
                        </span>
                      ) : null}
                      {renderCellPreview(cell.content, fieldAliasByPath)}
                      {selectedCellId === cell.id ? (
                        <>
                          <span
                            aria-hidden
                            draggable={false}
                            style={horizontalResizeHandleStyle}
                            title="拖动右边缘调整占用列数"
                            onClick={(event) => event.stopPropagation()}
                            onDragStart={(event) => event.preventDefault()}
                            onPointerDown={(event) =>
                              beginCellResize(event, cell, 'horizontal')
                            }
                          >
                            <span style={horizontalResizeHandleLineStyle} />
                          </span>
                          <span
                            aria-hidden
                            draggable={false}
                            style={verticalResizeHandleStyle}
                            title="拖动下边缘调整占用行数"
                            onClick={(event) => event.stopPropagation()}
                            onDragStart={(event) => event.preventDefault()}
                            onPointerDown={(event) =>
                              beginCellResize(event, cell, 'vertical')
                            }
                          >
                            <span style={verticalResizeHandleLineStyle} />
                          </span>
                          <span
                            aria-hidden
                            draggable={false}
                            style={resizeHandleStyle}
                            title="拖动右下角调整占用行列"
                            onClick={(event) => event.stopPropagation()}
                            onDragStart={(event) => event.preventDefault()}
                            onPointerDown={(event) =>
                              beginCellResize(event, cell)
                            }
                          >
                            <span style={resizeHandleGripStyle} />
                          </span>
                        </>
                      ) : null}
                    </button>
                  </Dropdown>
                );
              })}
              {schema.grid.regions?.map((region) => {
                const regionKey = `region:${region.id}`;
                const isDragOver = dragOverGridKey === regionKey;
                return (
                  <Dropdown
                    key={region.id}
                    menu={regionMenu(region)}
                    trigger={['contextMenu']}
                    getPopupContainer={getDesignerPopupContainer}
                  >
                    <button
                      type="button"
                      draggable
                      aria-label={`明细表区域，${region.columns.length}列`}
                      title="拖动可移动明细表，点击选中后配置字段"
                      style={{
                        ...gridRegionStyle,
                        background: isDragOver
                          ? 'rgba(37, 99, 235, 0.06)'
                          : '#fff',
                        border: `1px solid ${
                          isDragOver
                            ? 'var(--ant-color-primary)'
                            : GRID_LINE_COLOR
                        }`,
                        color: '#111827',
                        gridColumn: `${region.startCol} / span ${
                          region.colSpan ??
                          schema.grid.columns.length - region.startCol + 1
                        }`,
                        gridRow: `${visualRowStart(
                          region.startRow,
                        )} / span ${visualRowSpan(
                          region.startRow,
                          region.maxRowsPerPage + 2,
                        )}`,
                        outline:
                          selectedRegionId === region.id
                            ? '2px solid var(--ant-color-primary)'
                            : 'none',
                      }}
                      onClick={() => selectDetailRegion(region.id)}
                      onDragStart={(event) => beginRegionMove(event, region)}
                      onDragEnter={() => setDragOverGridKey(regionKey)}
                      onDragLeave={() => {
                        setDragOverGridKey(undefined);
                        setDetailColumnDropTarget(undefined);
                      }}
                      onDragOver={(event) =>
                        handleDetailDragOver(event, region)
                      }
                      onDrop={(event) => handleDetailDrop(event, region)}
                    >
                      {renderDetailRegionPreview(
                        region,
                        schema.grid.columns.length,
                        sampleData,
                        (event, columnIndex) =>
                          beginDetailColumnMove(event, region, columnIndex),
                        detailColumnDropTarget?.regionId === region.id
                          ? detailColumnDropTarget.columnIndex
                          : undefined,
                      )}
                      {selectedRegionId === region.id ? (
                        <>
                          <span
                            aria-hidden
                            draggable={false}
                            style={horizontalResizeHandleStyle}
                            title="拖动右边缘调整明细表占用列数"
                            onClick={(event) => event.stopPropagation()}
                            onDragStart={(event) => event.preventDefault()}
                            onPointerDown={(event) =>
                              beginRegionResize(event, region, 'horizontal')
                            }
                          >
                            <span style={horizontalResizeHandleLineStyle} />
                          </span>
                          <span
                            aria-hidden
                            draggable={false}
                            style={verticalResizeHandleStyle}
                            title="拖动下边缘调整明细表占用行数"
                            onClick={(event) => event.stopPropagation()}
                            onDragStart={(event) => event.preventDefault()}
                            onPointerDown={(event) =>
                              beginRegionResize(event, region, 'vertical')
                            }
                          >
                            <span style={verticalResizeHandleLineStyle} />
                          </span>
                          <span
                            aria-hidden
                            draggable={false}
                            style={resizeHandleStyle}
                            title="拖动右下角调整明细表占用行列"
                            onClick={(event) => event.stopPropagation()}
                            onDragStart={(event) => event.preventDefault()}
                            onPointerDown={(event) =>
                              beginRegionResize(event, region)
                            }
                          >
                            <span style={resizeHandleGripStyle} />
                          </span>
                        </>
                      ) : null}
                    </button>
                  </Dropdown>
                );
              })}
            </div>
          </div>
        </div>
        <aside
          aria-label="模板属性面板"
          style={{
            ...sidePanelStyle,
            background: token.colorFillQuaternary,
            borderInlineStart: `1px solid ${token.colorBorder}`,
          }}
        >
          <Typography.Text strong>属性</Typography.Text>
          {selectedCell ? (
            <Space
              orientation="vertical"
              style={{ marginTop: 12, width: '100%' }}
            >
              <Space wrap>
                <Tag>{selectedCell.id}</Tag>
                <Tag color="blue">
                  {contentTypeLabel(selectedCell.content.type)}
                </Tag>
              </Space>
              <Space wrap>
                <InputNumber
                  addonBefore="行"
                  min={1}
                  max={schema.grid.rows.length}
                  value={selectedCell.row}
                  onChange={(row) =>
                    applyCell({ ...selectedCell, row: row ?? selectedCell.row })
                  }
                />
                <InputNumber
                  addonBefore="列"
                  min={1}
                  max={schema.grid.columns.length}
                  value={selectedCell.col}
                  onChange={(col) =>
                    applyCell({ ...selectedCell, col: col ?? selectedCell.col })
                  }
                />
              </Space>
              <Space wrap>
                <Button
                  disabled={schema.grid.rows.length >= MAX_GRID_ROWS}
                  onClick={() => insertGridRow(selectedCell.row - 1, 'before')}
                >
                  上方插入一行
                </Button>
                <Button
                  disabled={schema.grid.rows.length >= MAX_GRID_ROWS}
                  onClick={() => insertGridRow(selectedCell.row - 1, 'after')}
                >
                  下方插入一行
                </Button>
              </Space>
              <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  打印范围
                </Typography.Text>
                <Select<GridCellPrintScope>
                  value={selectedCell.printScope ?? 'every_page'}
                  options={PRINT_SCOPE_OPTIONS}
                  onChange={(printScope) =>
                    applyCell({
                      ...selectedCell,
                      printScope:
                        printScope === 'every_page' ? undefined : printScope,
                    })
                  }
                  getPopupContainer={getDesignerPopupContainer}
                  style={{ width: '100%' }}
                />
              </Space>
              <Space wrap>
                <InputNumber
                  addonBefore={`第${selectedCell.col}列宽mm`}
                  min={MIN_GRID_COLUMN_WIDTH_MM}
                  max={MAX_GRID_COLUMN_WIDTH_MM}
                  value={schema.grid.columns[selectedCell.col - 1]?.widthMm}
                  onChange={(widthMm) =>
                    updateColumnWidth(selectedCell.col - 1, widthMm)
                  }
                />
                <InputNumber
                  addonBefore={`第${selectedCell.row}行高mm`}
                  min={MIN_GRID_ROW_HEIGHT_MM}
                  max={MAX_GRID_ROW_HEIGHT_MM}
                  value={schema.grid.rows[selectedCell.row - 1]?.heightMm}
                  onChange={(heightMm) =>
                    updateRowHeight(selectedCell.row - 1, heightMm)
                  }
                />
              </Space>
              {(selectedCell.colSpan ?? 1) > 1 ? (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  该单元格跨 {selectedCell.colSpan ?? 1} 列，打印实际宽度{' '}
                  {formatMm(
                    sumColumnWidthsMm(
                      schema,
                      selectedCell.col,
                      selectedCell.colSpan ?? 1,
                    ),
                  )}
                  mm；改「列宽」只影响第 {selectedCell.col} 列整列
                </Typography.Text>
              ) : null}
              {canEditCellText(selectedCell.content) ? (
                <StaticTextEditor
                  key={selectedCell.id}
                  cellId={selectedCell.id}
                  value={selectedCell.content.text ?? ''}
                  onCommit={(text) =>
                    applyContent({ type: 'static_text', text })
                  }
                />
              ) : null}
              {canEditCellLabel(selectedCell.content) ? (
                <Input
                  addonBefore="标签"
                  value={selectedCell.content.label ?? ''}
                  onChange={(event) =>
                    applyContent({ label: event.target.value })
                  }
                />
              ) : null}
              {canBindCellField(selectedCell.content) ? (
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="绑定字段"
                  value={selectedCell.content.fieldPath}
                  options={bindableFieldOptions}
                  onChange={(fieldPath?: string) =>
                    applyContent(
                      selectedCell.content.type === 'image' &&
                        !fieldPath &&
                        !selectedCell.content.src
                        ? { fieldPath, src: DEFAULT_IMAGE_SRC }
                        : { fieldPath },
                    )
                  }
                  getPopupContainer={getDesignerPopupContainer}
                  style={{ width: '100%' }}
                />
              ) : null}
              {selectedCell.content.type === 'aggregate_field' ? (
                <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="合计字段"
                    value={selectedCell.content.fieldPath}
                    options={arrayFieldOptions}
                    onChange={(fieldPath: string) => {
                      const field = arrayFieldByPath.get(fieldPath);
                      const aggregate = field
                        ? defaultAggregateForField(field)
                        : (selectedCell.content.aggregate ?? 'count');
                      applyContent({
                        fieldPath,
                        aggregate,
                        label: field
                          ? aggregateLabelForField(field, aggregate)
                          : selectedCell.content.label,
                      });
                    }}
                    getPopupContainer={getDesignerPopupContainer}
                    style={{ width: '100%' }}
                  />
                  <Select<GridAggregateType>
                    value={selectedCell.content.aggregate ?? 'count'}
                    options={aggregateOptionsForFieldPath(
                      selectedCell.content.fieldPath,
                    )}
                    onChange={(aggregate) => {
                      const field = selectedCell.content.fieldPath
                        ? arrayFieldByPath.get(selectedCell.content.fieldPath)
                        : undefined;
                      applyContent({
                        aggregate,
                        label: field
                          ? aggregateLabelForField(field, aggregate)
                          : selectedCell.content.label,
                      });
                    }}
                    getPopupContainer={getDesignerPopupContainer}
                    style={{ width: '100%' }}
                  />
                </Space>
              ) : null}
              {selectedCell.content.type === 'image' ? (
                <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                  <Upload
                    accept="image/*"
                    beforeUpload={handleImageUpload}
                    maxCount={1}
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />}>上传图片</Button>
                  </Upload>
                  <Typography.Text type="secondary">
                    静态图片只允许 data:image 内容；绑定字段时以字段值为准
                  </Typography.Text>
                  <Input.TextArea
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    placeholder="data:image/png;base64,..."
                    value={selectedCell.content.src ?? ''}
                    onChange={(event) =>
                      applyContent({ src: event.target.value })
                    }
                  />
                </Space>
              ) : null}
              <Space>
                <InputNumber
                  addonBefore="跨列"
                  min={1}
                  max={schema.grid.columns.length - selectedCell.col + 1}
                  value={selectedCell.colSpan ?? 1}
                  onChange={(colSpan) =>
                    applyCell({ ...selectedCell, colSpan: colSpan ?? 1 })
                  }
                />
                <InputNumber
                  addonBefore="跨行"
                  min={1}
                  max={schema.grid.rows.length - selectedCell.row + 1}
                  value={selectedCell.rowSpan ?? 1}
                  onChange={(rowSpan) =>
                    applyCell({ ...selectedCell, rowSpan: rowSpan ?? 1 })
                  }
                />
              </Space>
              <Space wrap>
                <InputNumber
                  addonBefore="字号"
                  min={8}
                  max={48}
                  value={selectedCell.style?.fontSize}
                  onChange={(fontSize) =>
                    applyCellStyle({ fontSize: fontSize ?? undefined })
                  }
                />
                <InputNumber
                  addonBefore="行距"
                  min={1}
                  max={3}
                  step={0.1}
                  value={selectedCell.style?.lineHeight ?? 1.42}
                  onChange={(lineHeight) =>
                    applyCellStyle({ lineHeight: lineHeight ?? undefined })
                  }
                />
                <Select
                  value={selectedCell.style?.fontWeight ?? 'normal'}
                  options={[
                    { label: '常规', value: 'normal' },
                    { label: '加粗', value: 'bold' },
                  ]}
                  onChange={(
                    fontWeight: NonNullable<GridCellStyle['fontWeight']>,
                  ) => applyCellStyle({ fontWeight })}
                  getPopupContainer={getDesignerPopupContainer}
                  style={{ width: 96 }}
                />
              </Space>
              <Space wrap>
                <Space size={4}>
                  <Typography.Text type="secondary">字体色</Typography.Text>
                  <ColorPicker
                    size="small"
                    disabledAlpha
                    value={selectedCell.style?.color ?? '#111827'}
                    getPopupContainer={getDesignerPopupContainer}
                    onChangeComplete={(color) =>
                      applyCellStyle({ color: color.toHexString() })
                    }
                  />
                  {selectedCell.style?.color ? (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => applyCellStyle({ color: undefined })}
                    >
                      清除
                    </Button>
                  ) : null}
                </Space>
                <Space size={4}>
                  <Typography.Text type="secondary">背景色</Typography.Text>
                  <ColorPicker
                    size="small"
                    disabledAlpha
                    value={selectedCell.style?.backgroundColor ?? '#ffffff'}
                    getPopupContainer={getDesignerPopupContainer}
                    onChangeComplete={(color) =>
                      applyCellStyle({ backgroundColor: color.toHexString() })
                    }
                  />
                  {selectedCell.style?.backgroundColor ? (
                    <Button
                      type="link"
                      size="small"
                      onClick={() =>
                        applyCellStyle({ backgroundColor: undefined })
                      }
                    >
                      清除
                    </Button>
                  ) : null}
                </Space>
              </Space>
              <Select
                value={selectedCell.style?.textAlign ?? 'left'}
                options={[
                  { label: '左对齐', value: 'left' },
                  { label: '居中', value: 'center' },
                  { label: '右对齐', value: 'right' },
                ]}
                onChange={(
                  textAlign: NonNullable<GridCellStyle['textAlign']>,
                ) => applyCellStyle({ textAlign })}
                getPopupContainer={getDesignerPopupContainer}
                style={{ width: '100%' }}
              />
              <Select
                value={selectedCell.style?.verticalAlign ?? 'top'}
                options={[
                  { label: '顶部', value: 'top' },
                  { label: '垂直居中', value: 'middle' },
                  { label: '底部', value: 'bottom' },
                ]}
                onChange={(
                  verticalAlign: NonNullable<GridCellStyle['verticalAlign']>,
                ) => applyCellStyle({ verticalAlign })}
                getPopupContainer={getDesignerPopupContainer}
                style={{ width: '100%' }}
              />
              <Checkbox
                checked={selectedCell.style?.wrap !== false}
                onChange={(event) =>
                  applyCellStyle({ wrap: event.target.checked })
                }
              >
                自动换行
              </Checkbox>
              <Space wrap>
                <Checkbox
                  checked={selectedCell.style?.border?.top !== false}
                  onChange={(event) =>
                    applyCellStyle({
                      border: {
                        ...selectedCell.style?.border,
                        top: event.target.checked,
                      },
                    })
                  }
                >
                  上边框
                </Checkbox>
                <Checkbox
                  checked={selectedCell.style?.border?.right !== false}
                  onChange={(event) =>
                    applyCellStyle({
                      border: {
                        ...selectedCell.style?.border,
                        right: event.target.checked,
                      },
                    })
                  }
                >
                  右边框
                </Checkbox>
                <Checkbox
                  checked={selectedCell.style?.border?.bottom !== false}
                  onChange={(event) =>
                    applyCellStyle({
                      border: {
                        ...selectedCell.style?.border,
                        bottom: event.target.checked,
                      },
                    })
                  }
                >
                  下边框
                </Checkbox>
                <Checkbox
                  checked={selectedCell.style?.border?.left !== false}
                  onChange={(event) =>
                    applyCellStyle({
                      border: {
                        ...selectedCell.style?.border,
                        left: event.target.checked,
                      },
                    })
                  }
                >
                  左边框
                </Checkbox>
              </Space>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={removeSelectedCell}
              >
                删除单元格
              </Button>
            </Space>
          ) : selectedRegion ? (
            <Space
              orientation="vertical"
              style={{ marginTop: 12, width: '100%' }}
            >
              <Tag>{selectedRegion.id}</Tag>
              <Typography.Text type="secondary">
                {regionGridSummary(selectedRegion, schema.grid.columns.length)}
              </Typography.Text>
              <Space wrap>
                <InputNumber
                  addonBefore="起始行"
                  min={1}
                  max={schema.grid.rows.length}
                  value={selectedRegion.startRow}
                  onChange={(startRow) =>
                    updateDetailRegion({
                      startRow: startRow ?? selectedRegion.startRow,
                    })
                  }
                />
                <InputNumber
                  addonBefore="起始列"
                  min={1}
                  max={schema.grid.columns.length}
                  value={selectedRegion.startCol}
                  onChange={(startCol) =>
                    updateDetailRegion({
                      startCol: startCol ?? selectedRegion.startCol,
                    })
                  }
                />
              </Space>
              <Space wrap>
                <InputNumber
                  addonBefore="占用列"
                  min={1}
                  max={schema.grid.columns.length - selectedRegion.startCol + 1}
                  value={resolveRegionColSpan(
                    selectedRegion,
                    schema.grid.columns.length,
                  )}
                  onChange={(colSpan) =>
                    updateDetailRegion({ colSpan: colSpan ?? 1 })
                  }
                />
                <Button
                  onClick={() =>
                    updateDetailRegion({
                      colSpan:
                        schema.grid.columns.length -
                        selectedRegion.startCol +
                        1,
                    })
                  }
                >
                  铺满到右侧
                </Button>
              </Space>
              <Space wrap>
                <InputNumber
                  addonBefore="最小行高mm"
                  min={MIN_DETAIL_ROW_HEIGHT_MM}
                  max={40}
                  value={selectedRegion.rowHeightMm}
                  onChange={(rowHeightMm) =>
                    updateDetailRegion({
                      rowHeightMm: rowHeightMm ?? selectedRegion.rowHeightMm,
                    })
                  }
                />
                <InputNumber
                  addonBefore="每页最多行"
                  min={1}
                  max={Math.max(1, schema.grid.rows.length - 2)}
                  value={selectedRegion.maxRowsPerPage}
                  onChange={(maxRowsPerPage) =>
                    updateDetailRegion({
                      maxRowsPerPage:
                        maxRowsPerPage ?? selectedRegion.maxRowsPerPage,
                    })
                  }
                />
              </Space>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                开启自动换行后，每条明细至少使用最小行高；文字放不下时会撑高整行，并按实际高度续页。
              </Typography.Text>
              <Select
                value={selectedRegion.overflow}
                options={[
                  { label: '续页', value: 'continue_next_page' },
                  { label: '超出报错', value: 'error' },
                ]}
                onChange={(overflow: typeof selectedRegion.overflow) =>
                  updateDetailRegion({ overflow })
                }
                getPopupContainer={getDesignerPopupContainer}
                style={{ width: 128 }}
              />
              <Space wrap>
                <InputNumber
                  addonBefore="明细字号"
                  min={6}
                  max={48}
                  value={selectedRegion.style?.fontSize ?? 10}
                  onChange={(fontSize) =>
                    updateDetailRegion({
                      style: {
                        ...selectedRegion.style,
                        fontSize: fontSize ?? undefined,
                      },
                    })
                  }
                />
                <InputNumber
                  addonBefore="明细行距"
                  min={1}
                  max={3}
                  step={0.1}
                  value={selectedRegion.style?.lineHeight ?? 1.35}
                  onChange={(lineHeight) =>
                    updateDetailRegion({
                      style: {
                        ...selectedRegion.style,
                        lineHeight: lineHeight ?? undefined,
                      },
                    })
                  }
                />
              </Space>
              <Space wrap>
                <Space size={4}>
                  <Typography.Text type="secondary">明细字体色</Typography.Text>
                  <ColorPicker
                    size="small"
                    disabledAlpha
                    value={selectedRegion.style?.color ?? '#111827'}
                    getPopupContainer={getDesignerPopupContainer}
                    onChangeComplete={(color) =>
                      updateDetailRegion({
                        style: {
                          ...selectedRegion.style,
                          color: color.toHexString(),
                        },
                      })
                    }
                  />
                  {selectedRegion.style?.color ? (
                    <Button
                      type="link"
                      size="small"
                      onClick={() =>
                        updateDetailRegion({
                          style: {
                            ...selectedRegion.style,
                            color: undefined,
                          },
                        })
                      }
                    >
                      清除
                    </Button>
                  ) : null}
                </Space>
                <Checkbox
                  checked={selectedRegion.style?.wrap !== false}
                  onChange={(event) =>
                    updateDetailRegion({
                      style: {
                        ...selectedRegion.style,
                        wrap: event.target.checked,
                      },
                    })
                  }
                >
                  自动换行并自适应行高
                </Checkbox>
              </Space>
              <Checkbox
                checked={selectedRegion.repeatHeader}
                onChange={(event) =>
                  updateDetailRegion({ repeatHeader: event.target.checked })
                }
              >
                每页重复表头
              </Checkbox>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeDetailRegion(selectedRegion.id)}
              >
                删除明细表
              </Button>
              <Divider style={{ margin: '8px 0' }} />
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Typography.Text strong>
                  字段列（{selectedRegion.columns.length}）
                </Typography.Text>
                {!selectedRegion.columns.some(
                  (column) => column.type === 'row_index',
                ) ? (
                  <Button
                    size="small"
                    onClick={() => addRowIndexDetailColumn(selectedRegion.id)}
                  >
                    加序号列
                  </Button>
                ) : null}
              </Space>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                可为数量、金额等列配置求和；合计按整单计算，只在最后一页打印。
              </Typography.Text>
              <Space orientation="vertical" style={{ width: '100%' }}>
                {selectedRegion.columns.map((column, index) => (
                  <div
                    key={detailColumnKey(column, index)}
                    style={detailColumnEditorStyle}
                  >
                    <Space
                      orientation="vertical"
                      size={6}
                      style={{ width: '100%' }}
                    >
                      <Input
                        size="small"
                        value={column.title}
                        addonBefore={`${index + 1}`}
                        placeholder={detailColumnDefaultTitle(column, fields)}
                        onChange={(event) =>
                          updateDetailColumn(selectedRegion.id, index, {
                            title: event.target.value,
                          })
                        }
                        onBlur={() => {
                          // 后端校验列标题必填：清空后失焦自动回退默认字段名，避免保存被拦
                          if (!column.title?.trim()) {
                            updateDetailColumn(selectedRegion.id, index, {
                              title: detailColumnDefaultTitle(column, fields),
                            });
                          }
                        }}
                      />
                      <Space
                        size={6}
                        style={{
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        <InputNumber
                          size="small"
                          addonBefore="宽"
                          addonAfter="mm"
                          min={MIN_DETAIL_COLUMN_WIDTH_MM}
                          max={MAX_GRID_COLUMN_WIDTH_MM}
                          value={column.widthMm ?? 24}
                          onChange={(widthMm) =>
                            updateDetailColumn(selectedRegion.id, index, {
                              widthMm: widthMm ?? column.widthMm,
                            })
                          }
                        />
                        <Button
                          danger
                          size="small"
                          disabled={selectedRegion.columns.length <= 1}
                          onClick={() =>
                            removeDetailColumn(selectedRegion.id, index)
                          }
                        >
                          删除
                        </Button>
                      </Space>
                      {(column.type ?? 'field') === 'field' ? (
                        <>
                          <Checkbox
                            checked={column.display === 'image'}
                            onChange={(event) =>
                              updateDetailColumn(selectedRegion.id, index, {
                                display: event.target.checked
                                  ? 'image'
                                  : undefined,
                              })
                            }
                          >
                            按图片打印（字段值为图片地址时，如报价图片）
                          </Checkbox>
                          {column.fieldPath ? (
                            <Space
                              orientation="vertical"
                              size={6}
                              style={{ width: '100%' }}
                            >
                              <Select
                                allowClear
                                placeholder="不合计"
                                value={
                                  selectedDetailSummaryByField.get(
                                    column.fieldPath ?? '',
                                  )?.aggregate
                                }
                                options={[
                                  ...(fields.some(
                                    (field) =>
                                      field.fieldPath === column.fieldPath &&
                                      field.fieldType === 'number',
                                  )
                                    ? [{ label: '求和（sum）', value: 'sum' }]
                                    : []),
                                  { label: '计数（count）', value: 'count' },
                                ]}
                                onChange={(
                                  aggregate:
                                    | GridDetailSummarySchema['aggregate']
                                    | undefined,
                                ) =>
                                  updateDetailSummary(
                                    selectedRegion.id,
                                    column.fieldPath ?? '',
                                    aggregate,
                                  )
                                }
                                getPopupContainer={getDesignerPopupContainer}
                                style={{ width: '100%' }}
                              />
                              {selectedDetailSummaryByField.has(
                                column.fieldPath ?? '',
                              ) ? (
                                <Input
                                  size="small"
                                  addonBefore="合计标题"
                                  value={
                                    selectedDetailSummaryByField.get(
                                      column.fieldPath ?? '',
                                    )?.label ?? '合计'
                                  }
                                  onChange={(event) =>
                                    updateDetailSummary(
                                      selectedRegion.id,
                                      column.fieldPath ?? '',
                                      selectedDetailSummaryByField.get(
                                        column.fieldPath ?? '',
                                      )?.aggregate,
                                      event.target.value,
                                    )
                                  }
                                  onBlur={(event) => {
                                    if (event.target.value.trim()) return;
                                    updateDetailSummary(
                                      selectedRegion.id,
                                      column.fieldPath ?? '',
                                      selectedDetailSummaryByField.get(
                                        column.fieldPath ?? '',
                                      )?.aggregate,
                                      '合计',
                                    );
                                  }}
                                />
                              ) : null}
                            </Space>
                          ) : null}
                        </>
                      ) : null}
                    </Space>
                  </div>
                ))}
              </Space>
            </Space>
          ) : selectedGridCell ? (
            <Space
              orientation="vertical"
              style={{ marginTop: 12, width: '100%' }}
            >
              <Space wrap>
                <Tag>
                  {excelColumnLabel(selectedGridCell.col - 1)}
                  {selectedGridCell.row}
                </Tag>
                <Tag color="blue">空白单元格</Tag>
              </Space>
              <Space wrap>
                <InputNumber
                  addonBefore="行"
                  disabled
                  value={selectedGridCell.row}
                />
                <InputNumber
                  addonBefore="列"
                  disabled
                  value={selectedGridCell.col}
                />
              </Space>
              <Space wrap>
                <InputNumber
                  addonBefore={`第${selectedGridCell.col}列宽mm`}
                  min={MIN_GRID_COLUMN_WIDTH_MM}
                  max={MAX_GRID_COLUMN_WIDTH_MM}
                  value={selectedGridColumn?.widthMm}
                  onChange={(widthMm) =>
                    updateColumnWidth(selectedGridCell.col - 1, widthMm)
                  }
                />
                <InputNumber
                  addonBefore={`第${selectedGridCell.row}行高mm`}
                  min={MIN_GRID_ROW_HEIGHT_MM}
                  max={MAX_GRID_ROW_HEIGHT_MM}
                  value={selectedGridRow?.heightMm}
                  onChange={(heightMm) =>
                    updateRowHeight(selectedGridCell.row - 1, heightMm)
                  }
                />
              </Space>
              <Space wrap>
                <Button
                  disabled={schema.grid.rows.length >= MAX_GRID_ROWS}
                  onClick={() =>
                    insertGridRow(selectedGridCell.row - 1, 'before')
                  }
                >
                  上方插入一行
                </Button>
                <Button
                  disabled={schema.grid.rows.length >= MAX_GRID_ROWS}
                  onClick={() =>
                    insertGridRow(selectedGridCell.row - 1, 'after')
                  }
                >
                  下方插入一行
                </Button>
              </Space>
            </Space>
          ) : (
            <Space
              orientation="vertical"
              style={{ marginTop: 12, width: '100%' }}
            >
              <Typography.Text type="secondary">未选中对象</Typography.Text>
            </Space>
          )}
        </aside>
      </div>
    </div>
  );
  return immersiveContainer
    ? createPortal(designer, immersiveContainer)
    : designer;
}
