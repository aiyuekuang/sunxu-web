/**
 * 针式打印机打印 Hook。
 *
 * 与 usePrint (A4) 并行，支持连续纸尺寸。默认 241 × 140mm（两等分）。
 * 纸张尺寸和公司抬头存 localStorage，用户在系统设置页配置。
 *
 * @example
 * const { contentRef, handlePrint } = useDotMatrixPrint('送货单_SD-001');
 * <DotMatrixLayout ref={contentRef} ...>...</DotMatrixLayout>
 * <Button onClick={handlePrint}>针打打印</Button>
 */
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  safeLocalStorageGetItem,
  safeLocalStorageSetItem,
} from '../utils/safeStorage';
import { DOT_MATRIX_STYLES } from './dotmatrix-styles';

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-print
 * @sunxu-reason Preserves continuous-paper presets, local settings, company heading, and isolated print styles.
 */

/** 常见针打连续纸尺寸预设（宽 × 高，单位 mm） */
export const DOT_MATRIX_PAPER_PRESETS = [
  { key: '241x140', label: '241 × 140 mm（两等分）', width: 241, height: 140 },
  { key: '241x93', label: '241 × 93 mm（三等分）', width: 241, height: 93 },
  { key: '241x279', label: '241 × 279 mm（整页）', width: 241, height: 279 },
  { key: '190x140', label: '190 × 140 mm', width: 190, height: 140 },
  { key: '210x140', label: '210 × 140 mm', width: 210, height: 140 },
] as const;

export type DotMatrixPaperKey =
  | (typeof DOT_MATRIX_PAPER_PRESETS)[number]['key']
  | 'custom';

const PAPER_STORAGE_KEY = 'mes-dotmatrix-paper';
const CUSTOM_STORAGE_KEY = 'mes-dotmatrix-paper-custom';
const COMPANY_STORAGE_KEY = 'mes-dotmatrix-company';
const DEFAULT_PAPER: DotMatrixPaperKey = '241x140';
const DEFAULT_CUSTOM = { width: 241, height: 140 };

export interface DotMatrixPaperInfo {
  key: DotMatrixPaperKey;
  width: number;
  height: number;
  label: string;
}

/** 读取自定义纸张尺寸 */
export function getCustomDotMatrixPaper(): { width: number; height: number } {
  try {
    const raw = safeLocalStorageGetItem(CUSTOM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.width && parsed.height) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_CUSTOM;
}

/** 保存自定义纸张尺寸 */
export function setCustomDotMatrixPaper(width: number, height: number) {
  safeLocalStorageSetItem(
    CUSTOM_STORAGE_KEY,
    JSON.stringify({ width, height }),
  );
}

/** 读取当前针打纸张设置 */
export function getDotMatrixPaper(): DotMatrixPaperInfo {
  const key = (safeLocalStorageGetItem(PAPER_STORAGE_KEY) ??
    DEFAULT_PAPER) as DotMatrixPaperKey;
  if (key === 'custom') {
    const custom = getCustomDotMatrixPaper();
    return {
      key: 'custom',
      ...custom,
      label: `${custom.width} × ${custom.height} mm`,
    };
  }
  const preset =
    DOT_MATRIX_PAPER_PRESETS.find((p) => p.key === key) ??
    DOT_MATRIX_PAPER_PRESETS[0];
  return { ...preset };
}

/** 保存针打纸张设置 */
export function setDotMatrixPaper(key: DotMatrixPaperKey) {
  safeLocalStorageSetItem(PAPER_STORAGE_KEY, key);
}

/** 读取打印抬头公司名（针打用） */
export function getDotMatrixCompany(): string {
  return safeLocalStorageGetItem(COMPANY_STORAGE_KEY) ?? '';
}

/** 保存打印抬头公司名 */
export function setDotMatrixCompany(name: string) {
  safeLocalStorageSetItem(COMPANY_STORAGE_KEY, name);
}

export function useDotMatrixPrint(docTitle?: string) {
  const contentRef = useRef<HTMLDivElement>(null);

  // 每次 render 读取最新纸张配置，生成完整 pageStyle
  // ignoreGlobalStyles: true 使 iframe 只使用此处的样式，避免 main document 的样式
  // （如 AntD）把 @page 覆盖掉
  const paper = getDotMatrixPaper();
  const pageStyle = `
    @page { size: ${paper.width}mm ${paper.height}mm; margin: 0; }
    @media print { body { margin: 0; padding: 0; } }
    ${DOT_MATRIX_STYLES}
  `;

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: docTitle,
    pageStyle,
    ignoreGlobalStyles: true,
  });

  return { contentRef, handlePrint };
}
