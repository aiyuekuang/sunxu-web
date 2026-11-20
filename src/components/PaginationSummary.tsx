import { useIntl } from '@ant-design/pro-components';
import type { TablePaginationConfig } from 'antd';
import { Space, Typography } from 'antd';
import type { CSSProperties, ReactNode } from 'react';

const PAGINATION_SUMMARY_ROOT_CLASS = 'sxw-pagination-summary-root';
const PAGINATION_SUMMARY_ITEM_CLASS = 'sxw-pagination-summary-item';

export type PaginationSummaryProps = {
  /** Describes which result set the supplied values represent. */
  label?: ReactNode;
  /** Host-owned values, units, and grouping. */
  children: ReactNode;
};

/** A compact host-provided summary for the current filtered result set. */
export function PaginationSummary({ label = '筛选结果合计：', children }: PaginationSummaryProps) {
  return (
    <div className="sxw-pagination-summary">
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Space className="sxw-pagination-summary__values" size={[16, 4]} wrap>
        {children}
      </Space>
    </div>
  );
}

function DefaultPaginationTotalText({ total, range }: { total: number; range: [number, number] }) {
  const intl = useIntl();
  return (
    <>
      {intl.getMessage('pagination.total.range', '第')} {range[0]}-{range[1]}{' '}
      {intl.getMessage('pagination.total.total', '条/总共')} {total}{' '}
      {intl.getMessage('pagination.total.item', '条')}
    </>
  );
}

function mergeRootClassName(current: { root?: string; item?: string } | undefined) {
  const root = [current?.root, PAGINATION_SUMMARY_ROOT_CLASS].filter(Boolean).join(' ');
  const item = [current?.item, PAGINATION_SUMMARY_ITEM_CLASS].filter(Boolean).join(' ');
  return { ...current, root, item };
}

function mergePaginationClassNames(
  classNames: TablePaginationConfig['classNames'],
): TablePaginationConfig['classNames'] {
  if (typeof classNames === 'function') {
    return (info) => mergeRootClassName(classNames(info));
  }
  return mergeRootClassName(classNames);
}

function mergeRootStyles(current: { root?: CSSProperties; item?: CSSProperties } | undefined) {
  return {
    ...current,
    root: {
      ...current?.root,
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      position: 'relative',
      width: '100%',
      containerType: 'inline-size',
    } satisfies CSSProperties,
  };
}

function mergePaginationStyles(
  styles: TablePaginationConfig['styles'],
): TablePaginationConfig['styles'] {
  if (typeof styles === 'function') {
    return (info) => mergeRootStyles(styles(info));
  }
  return mergeRootStyles(styles);
}

/**
 * Attach a host summary to the public Ant Design pagination total slot.
 * The existing result-range text and pagination settings are preserved.
 */
export function withPaginationSummary(
  pagination: TablePaginationConfig | false | undefined,
  summary: ReactNode,
): TablePaginationConfig | false | undefined {
  if (pagination === false || summary === null || summary === undefined) {
    return pagination;
  }

  const existingShowTotal = pagination?.showTotal;
  return {
    ...pagination,
    classNames: mergePaginationClassNames(pagination?.classNames),
    styles: mergePaginationStyles(pagination?.styles),
    showTotal: (total, range) => {
      const rangeText = existingShowTotal ? (
        existingShowTotal(total, range)
      ) : (
        <DefaultPaginationTotalText total={total} range={range} />
      );

      return (
        <>
          <div className="sxw-pagination-summary__content">{summary}</div>
          <span>{rangeText}</span>
        </>
      );
    },
  };
}
