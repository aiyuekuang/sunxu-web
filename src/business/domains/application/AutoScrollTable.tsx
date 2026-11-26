import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { CaretRightOutlined, PauseOutlined } from '@ant-design/icons';
import './large-screen-components.css';

export interface AutoScrollColumn<T> {
  /** 列标题 */
  title: string;
  /** 数据键或渲染函数 */
  dataIndex?: keyof T;
  /** 自定义渲染（优先于 dataIndex） */
  render?: (
    value: T[keyof T] | undefined,
    record: T,
    index: number,
  ) => React.ReactNode;
  /** 列宽（如 '120px' '10%'），不传自动等分 */
  width?: string | number;
  /** 文字对齐，默认 left */
  align?: 'left' | 'center' | 'right';
}

export interface AutoScrollTableProps<T> {
  columns: AutoScrollColumn<T>[];
  data: T[];
  /** 行唯一键字段名或函数 */
  rowKey: keyof T | ((record: T, index: number) => string);
  /** 每行高度（px），默认 54 */
  rowHeight?: number;
  /** 滚动间隔（ms），默认 3000 */
  scrollInterval?: number;
  /** 到底时暂停时长（ms），默认 5000 */
  pauseAtEnd?: number;
  /** 附加到根容器的 class，用于页面级样式覆盖（如事件流放大字号） */
  className?: string;
  /** 额外行 className */
  rowClassName?: (record: T, index: number) => string;
  /** Accessible name for this data table. */
  ariaLabel?: string;
  /** Pause initial auto-scroll when the operating system requests reduced motion. */
  respectReducedMotion?: boolean;
}

function getRowKey<T>(
  record: T,
  index: number,
  rowKey: AutoScrollTableProps<T>['rowKey'],
): string {
  if (typeof rowKey === 'function') return rowKey(record, index);
  return String(record[rowKey]);
}

/**
 * @sunxu-layer business
 * @sunxu-domain application auto-scrolling data table
 * @sunxu-reason host large-screen dashboards need compact, fixed-height live lists that advance without page scrolling.
 *
 * Data grid with a fixed header and one-row-at-a-time auto-scroll. It pauses
 * at the end, resets without a transition, then resumes its normal interval.
 */
export function AutoScrollTable<T>({
  columns,
  data,
  rowKey,
  rowHeight = 54,
  scrollInterval = 3000,
  pauseAtEnd = 5000,
  className,
  rowClassName,
  ariaLabel = '自动滚动表格',
  respectReducedMotion = true,
}: AutoScrollTableProps<T>) {
  const [offsetIndex, setOffsetIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  const [visibleCount, setVisibleCount] = useState(8);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [userPaused, setUserPaused] = useState<boolean | undefined>();
  const paused = userPaused ?? (respectReducedMotion && prefersReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) =>
      setPrefersReducedMotion(event.matches);
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = () => {
      setVisibleCount(Math.floor(element.clientHeight / rowHeight) || 8);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [rowHeight]);

  useEffect(() => {
    dataRef.current = data;
    setOffsetIndex(0);
    setTransitioning(false);
  }, [data]);

  const canScroll = data.length > visibleCount;
  const maxOffset = canScroll ? data.length - visibleCount : 0;

  const schedule = useCallback(
    (delay: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setOffsetIndex((previous) => {
          if (!dataRef.current.length) return 0;
          const max = Math.max(0, dataRef.current.length - visibleCount);
          if (previous >= max) {
            setTransitioning(false);
            return 0;
          }
          setTransitioning(true);
          return previous + 1;
        });
      }, delay);
    },
    [visibleCount],
  );

  useEffect(() => {
    if (!paused && offsetIndex === 0 && !transitioning) {
      const frame = requestAnimationFrame(() => {
        setTransitioning(true);
        schedule(pauseAtEnd);
      });
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [offsetIndex, transitioning, pauseAtEnd, schedule, paused]);

  useEffect(() => {
    if (paused || !canScroll) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return undefined;
    }
    if (offsetIndex === 0 && !transitioning) return undefined;

    const isAtEnd = offsetIndex >= maxOffset;
    schedule(isAtEnd ? pauseAtEnd : scrollInterval);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    offsetIndex,
    canScroll,
    maxOffset,
    scrollInterval,
    pauseAtEnd,
    schedule,
    transitioning,
    paused,
  ]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const columnWidths = columns.map((column) => {
    if (column.width != null) {
      return typeof column.width === 'number'
        ? `${column.width}px`
        : column.width;
    }
    return `${(100 / columns.length).toFixed(2)}%`;
  });
  const gridTemplateColumns = columnWidths.join(' ');
  const translateY = -(offsetIndex * rowHeight);

  return (
    <div
      className={`sunxu-mes-screen-autoscroll-wrap${className ? ` ${className}` : ''}`}
    >
      {canScroll ? (
        <div className="sunxu-mes-screen-autoscroll-controls">
          <button
            type="button"
            className="sunxu-mes-screen-autoscroll-toggle"
            aria-label={paused ? '继续自动滚动' : '暂停自动滚动'}
            title={paused ? '继续自动滚动' : '暂停自动滚动'}
            onClick={() => setUserPaused(!paused)}
          >
            {paused ? (
              <CaretRightOutlined aria-hidden="true" />
            ) : (
              <PauseOutlined aria-hidden="true" />
            )}
          </button>
        </div>
      ) : null}
      <div
        className="sunxu-mes-screen-autoscroll-table"
        role="table"
        aria-label={ariaLabel}
        aria-rowcount={data.length + 1}
        aria-colcount={columns.length}
      >
      <div className="sunxu-mes-screen-autoscroll-head" role="rowgroup">
        <div
          className="sunxu-mes-screen-autoscroll-head-row"
          style={{ gridTemplateColumns }}
          role="row"
          aria-rowindex={1}
        >
          {columns.map((column) => (
            <div
              key={column.dataIndex ? String(column.dataIndex) : column.title}
              className="sunxu-mes-screen-autoscroll-head-cell"
              style={{
                textAlign: column.align ?? 'left',
                justifyContent:
                  column.align === 'center'
                    ? 'center'
                    : column.align === 'right'
                      ? 'flex-end'
                      : 'flex-start',
              }}
              role="columnheader"
            >
              {column.title}
            </div>
          ))}
        </div>
      </div>

      <div className="sunxu-mes-screen-autoscroll-body" ref={containerRef} role="rowgroup">
        <div
          className="sunxu-mes-screen-autoscroll-track"
          role="presentation"
          style={{
            transform: `translateY(${translateY}px)`,
            transition: transitioning
              ? `transform ${Math.min(scrollInterval * 0.4, 400)}ms ease`
              : 'none',
          }}
        >
          {data.map((record, rowIndex) => {
            const key = getRowKey(record, rowIndex, rowKey);
            const extraClass = rowClassName
              ? rowClassName(record, rowIndex)
              : '';
            return (
              <div
                key={key}
                className={`sunxu-mes-screen-autoscroll-row${extraClass ? ` ${extraClass}` : ''}`}
                style={{ height: rowHeight, gridTemplateColumns }}
                role="row"
                aria-rowindex={rowIndex + 2}
              >
                {columns.map((column) => {
                  const columnKey = column.dataIndex
                    ? String(column.dataIndex)
                    : column.title;
                  const rawValue =
                    column.dataIndex != null
                      ? record[column.dataIndex]
                      : undefined;
                  const content = column.render
                    ? column.render(rawValue, record, rowIndex)
                    : rawValue != null
                      ? String(rawValue)
                      : '-';
                  return (
                    <div
                      key={columnKey}
                      className="sunxu-mes-screen-autoscroll-cell"
                      style={{
                        textAlign: column.align ?? 'left',
                        justifyContent:
                          column.align === 'center'
                            ? 'center'
                            : column.align === 'right'
                              ? 'flex-end'
                              : 'flex-start',
                      }}
                      role="cell"
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
