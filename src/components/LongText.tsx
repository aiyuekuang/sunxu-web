import { App, Button, Typography } from 'antd';
import { useCallback, useMemo } from 'react';
import type { MouseEvent } from 'react';

export const LONG_TEXT_DEFAULT_MAX_LENGTH = 64;

export interface LongTextProps {
  value: string | number | null | undefined;
  maxLength?: number;
  modalTitle?: string;
}

/** Compact table-cell text with an accessible action to inspect the full value. */
export function LongText({
  value,
  maxLength = LONG_TEXT_DEFAULT_MAX_LENGTH,
  modalTitle = '完整内容',
}: LongTextProps) {
  const { modal } = App.useApp();
  const text = value == null ? '' : String(value);
  const safeMaxLength = Math.max(1, maxLength);
  const characters = useMemo(() => Array.from(text), [text]);
  const isOverflow = characters.length > safeMaxLength;
  const preview = isOverflow
    ? `${characters.slice(0, safeMaxLength).join('')}…`
    : text;

  const showFullText = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      modal.info({
        title: modalTitle,
        width: 720,
        icon: null,
        okText: '关闭',
        content: (
          <Typography.Paragraph className="sxw-long-text__content" copyable>
            {text}
          </Typography.Paragraph>
        ),
      });
    },
    [modal, modalTitle, text],
  );

  if (!text) return <span aria-label="无内容">-</span>;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', maxWidth: '100%' }}>
      <Typography.Text ellipsis={{ tooltip: false }}>{preview}</Typography.Text>
      {isOverflow ? (
        <Button type="link" size="small" onClick={showFullText}>
          更多
        </Button>
      ) : null}
    </span>
  );
}
