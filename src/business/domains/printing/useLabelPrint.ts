/**
 * 标签打印 Hook — 封装 react-to-print，使用标签纸尺寸。
 *
 * 与 usePrint (A4) 不同，useLabelPrint 从 localStorage 读取用户设置的标签纸尺寸。
 * 支持横版（宽≥高）和竖版（高>宽）两种布局，根据尺寸自动判断。
 *
 * @example
 * const { contentRef, handlePrint } = useLabelPrint('物料标签');
 * <LabelLayout ref={contentRef}>...</LabelLayout>
 * <Button onClick={handlePrint}>打印标签</Button>
 */
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  safeLocalStorageGetItem,
  safeLocalStorageSetItem,
} from '../../utils/safeStorage';
import { LABEL_STYLES } from './label-styles';

/**
 * @sunxu-layer business
 * @sunxu-domain printing
 * @sunxu-reason Preserves host label-size presets, local preferences, orientation, and isolated print styles.
 */

export type LabelOrientation = 'horizontal' | 'vertical';

/** 预设标签纸尺寸（宽 x 高，单位 mm） */
export const LABEL_SIZE_PRESETS = [
  // ── 横版（宽 ≥ 高） ──
  { key: '40x30', label: '40 × 30 mm', width: 40, height: 30, group: '横版' },
  { key: '50x30', label: '50 × 30 mm', width: 50, height: 30, group: '横版' },
  { key: '60x40', label: '60 × 40 mm', width: 60, height: 40, group: '横版' },
  { key: '70x40', label: '70 × 40 mm', width: 70, height: 40, group: '横版' },
  { key: '80x50', label: '80 × 50 mm', width: 80, height: 50, group: '横版' },
  { key: '80x60', label: '80 × 60 mm', width: 80, height: 60, group: '横版' },
  {
    key: '100x60',
    label: '100 × 60 mm',
    width: 100,
    height: 60,
    group: '横版',
  },
  {
    key: '100x80',
    label: '100 × 80 mm',
    width: 100,
    height: 80,
    group: '横版',
  },
  // ── 竖版（高 > 宽） ──
  { key: '30x50', label: '30 × 50 mm', width: 30, height: 50, group: '竖版' },
  { key: '40x60', label: '40 × 60 mm', width: 40, height: 60, group: '竖版' },
  { key: '40x70', label: '40 × 70 mm', width: 40, height: 70, group: '竖版' },
  { key: '50x80', label: '50 × 80 mm', width: 50, height: 80, group: '竖版' },
  { key: '60x80', label: '60 × 80 mm', width: 60, height: 80, group: '竖版' },
  {
    key: '60x100',
    label: '60 × 100 mm',
    width: 60,
    height: 100,
    group: '竖版',
  },
] as const;

export type LabelSizeKey =
  | (typeof LABEL_SIZE_PRESETS)[number]['key']
  | 'custom';

const STORAGE_KEY = 'mes-label-size';
const CUSTOM_STORAGE_KEY = 'mes-label-size-custom';
const DEFAULT_SIZE: LabelSizeKey = '60x40';
const DEFAULT_CUSTOM = { width: 60, height: 40 };

/** 根据宽高判断方向：宽≥高 → 横版，高>宽 → 竖版 */
export function getLabelOrientation(
  width: number,
  height: number,
): LabelOrientation {
  return width >= height ? 'horizontal' : 'vertical';
}

/** 读取自定义标签纸尺寸 */
export function getCustomLabelSize(): { width: number; height: number } {
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

/** 保存自定义标签纸尺寸 */
export function setCustomLabelSize(width: number, height: number) {
  safeLocalStorageSetItem(
    CUSTOM_STORAGE_KEY,
    JSON.stringify({ width, height }),
  );
}

interface LabelSizeInfo {
  key: LabelSizeKey;
  width: number;
  height: number;
  label: string;
  orientation: LabelOrientation;
}

/** 读取当前标签纸尺寸设置 */
export function getLabelSize(): LabelSizeInfo {
  const key = (safeLocalStorageGetItem(STORAGE_KEY) ??
    DEFAULT_SIZE) as LabelSizeKey;
  if (key === 'custom') {
    const custom = getCustomLabelSize();
    return {
      key: 'custom',
      ...custom,
      label: `${custom.width} × ${custom.height} mm`,
      orientation: getLabelOrientation(custom.width, custom.height),
    };
  }
  const preset =
    LABEL_SIZE_PRESETS.find((p) => p.key === key) ?? LABEL_SIZE_PRESETS[2];
  return {
    ...preset,
    orientation: getLabelOrientation(preset.width, preset.height),
  };
}

/** 保存标签纸尺寸设置 */
export function setLabelSize(key: LabelSizeKey) {
  safeLocalStorageSetItem(STORAGE_KEY, key);
}

export function useLabelPrint(docTitle?: string) {
  const contentRef = useRef<HTMLDivElement>(null);

  // 每次 render 读取最新尺寸配置，生成完整 pageStyle
  // ignoreGlobalStyles: true 使 iframe 只使用此处的样式，避免 main document 的样式
  // （如 AntD）把 @page 覆盖掉
  const size = getLabelSize();
  const pageStyle = `
    @page { size: ${size.width}mm ${size.height}mm; margin: 0; }
    @media print { body { margin: 0; padding: 0; } }
    ${LABEL_STYLES}
  `;

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: docTitle,
    pageStyle,
    ignoreGlobalStyles: true,
  });

  return { contentRef, handlePrint };
}
