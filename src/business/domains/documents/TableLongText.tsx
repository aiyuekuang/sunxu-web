import {
  LongText,
  type LongTextDisplayMode,
} from '../../../components/LongText';

export const TABLE_LONG_TEXT_DEFAULT_MAX_LENGTH = 64;

export function isTableLongTextValue(value: unknown): value is string | number {
  return typeof value === 'string' || typeof value === 'number';
}

export interface TableLongTextProps {
  value: string | number | null | undefined;
  displayMode?: LongTextDisplayMode;
  maxLines?: number;
  maxLength?: number;
  modalTitle?: string;
}

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason 保留 host 表格单元格的旧 class hook 和长度默认值，同时复用 Sunxu 长文本交互。
 *
 * 适配 host 表格样式钩子；截断与全文查看由通用 LongText 所有。
 */
export function TableLongText({
  value,
  displayMode = 'wrap',
  maxLines = 2,
  maxLength = TABLE_LONG_TEXT_DEFAULT_MAX_LENGTH,
  modalTitle = '完整内容',
}: TableLongTextProps) {
  return (
    <span className="sxw-table-long-text">
      <LongText
        value={value}
        displayMode={displayMode}
        maxLines={maxLines}
        maxLength={maxLength}
        modalTitle={modalTitle}
      />
    </span>
  );
}
