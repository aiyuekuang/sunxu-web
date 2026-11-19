import { App, Button, Popover, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';

export const LONG_TEXT_DEFAULT_MAX_LENGTH = 64;
export const LONG_TEXT_DEFAULT_MAX_LINES = 2;

export type LongTextDisplayMode = 'truncate' | 'wrap';

export interface LongTextProps {
  value: string | number | null | undefined;
  displayMode?: LongTextDisplayMode;
  maxLines?: number;
  maxLength?: number;
  modalTitle?: string;
}

/** Table-cell text with a wrapped preview and a full-value popover or legacy dialog. */
export function LongText({
  value,
  displayMode = 'truncate',
  maxLines = LONG_TEXT_DEFAULT_MAX_LINES,
  maxLength = LONG_TEXT_DEFAULT_MAX_LENGTH,
  modalTitle = '完整内容',
}: LongTextProps) {
  const { modal } = App.useApp();
  const text = value == null ? '' : String(value);
  const safeMaxLines = Number.isFinite(maxLines)
    ? Math.max(1, Math.floor(maxLines))
    : LONG_TEXT_DEFAULT_MAX_LINES;
  const wrappedTextRef = useRef<HTMLSpanElement>(null);
  const truncatedTextRef = useRef<HTMLSpanElement>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [hasWidthOverflow, setHasWidthOverflow] = useState(false);
  const safeMaxLength = Math.max(1, maxLength);
  const characters = useMemo(() => Array.from(text), [text]);
  const isOverflow = characters.length > safeMaxLength;
  const preview = isOverflow
    ? `${characters.slice(0, safeMaxLength).join('')}…`
    : text;
  const hasMore = isOverflow || hasWidthOverflow;

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

  const handlePopoverOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setIsPopoverOpen(false);
      return;
    }

    const element = wrappedTextRef.current;
    setIsPopoverOpen(
      Boolean(
        element &&
          (element.scrollHeight > element.clientHeight + 1 ||
            element.scrollWidth > element.clientWidth + 1),
      ),
    );
  }, []);

  const handlePopoverTouchStart = useCallback(() => {
    const element = wrappedTextRef.current;
    const isClamped = Boolean(
      element &&
        (element.scrollHeight > element.clientHeight + 1 ||
          element.scrollWidth > element.clientWidth + 1),
    );
    if (!isClamped) return;
    setIsPopoverOpen((current) => !current);
  }, []);

  useEffect(() => {
    const element = truncatedTextRef.current;
    if (displayMode !== 'truncate' || !element || !preview) {
      setHasWidthOverflow(false);
      return;
    }

    const measure = () => {
      setHasWidthOverflow(element.scrollWidth > element.clientWidth + 1);
    };

    measure();
    const frame =
      typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame(measure)
        : undefined;
    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener('resize', measure);

    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [displayMode, preview]);

  if (!text) return <span aria-label="无内容">-</span>;

  if (displayMode === 'wrap') {
    return (
      <Popover
        open={isPopoverOpen}
        onOpenChange={handlePopoverOpenChange}
        content={
          <div className="sxw-long-text__popover" aria-hidden="true">
            {text}
          </div>
        }
        placement="topLeft"
        mouseEnterDelay={0.2}
        trigger={['hover', 'focus']}
      >
        <span
          className="sxw-long-text__trigger"
          tabIndex={0}
          aria-label={`完整内容：${text}`}
          onClick={(event) => event.stopPropagation()}
          onTouchStart={(event) => {
            event.stopPropagation();
            handlePopoverTouchStart();
          }}
        >
          <span
            ref={wrappedTextRef}
            className="sxw-long-text sxw-long-text--wrap"
            style={{ WebkitLineClamp: safeMaxLines }}
          >
            {text}
          </span>
        </span>
      </Popover>
    );
  }

  return (
    <span className="sxw-long-text--truncate">
      <Typography.Text
        ref={truncatedTextRef}
        className="sxw-long-text__preview"
        style={{ minWidth: 0, flex: '1 1 auto' }}
        ellipsis={{ tooltip: false }}
      >
        {preview}
      </Typography.Text>
      {hasMore ? (
        <Button
          type="link"
          size="small"
          aria-label={`${modalTitle}：查看完整内容`}
          style={{ flex: '0 0 auto' }}
          onClick={showFullText}
        >
          更多
        </Button>
      ) : null}
    </span>
  );
}
