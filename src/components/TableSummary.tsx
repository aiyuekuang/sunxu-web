import { Table } from 'antd';
import React, { type ReactNode } from 'react';

export type TableSummaryProps = {
  /** Summary cells in the same order as the table's final visible columns. */
  children: ReactNode;
  /** Keep the row pinned to the bottom while the table body scrolls. Defaults to true. */
  fixed?: boolean;
  /**
   * Treat children as one summary block spanning the visible nonfixed columns.
   * Supported by ResizableProTable and ResizableTable; fixed columns stay blank.
   */
  fullWidth?: boolean;
};

function TableSummaryRoot({
  children,
  fixed = true,
  fullWidth = false,
}: TableSummaryProps) {
  return (
    <Table.Summary fixed={fixed ? 'bottom' : undefined}>
      <Table.Summary.Row>
        {fullWidth ? (
          <Table.Summary.Cell index={0}>{children}</Table.Summary.Cell>
        ) : (
          children
        )}
      </Table.Summary.Row>
    </Table.Summary>
  );
}

/**
 * Render a column-aligned summary row using Ant Design's native summary cells.
 * The host supplies values and keeps them aligned with the final visible columns.
 */
export const TableSummary = Object.assign(TableSummaryRoot, {
  Cell: Table.Summary.Cell,
});

export type TableSummaryColumn = {
  children?: unknown;
  fixed?: unknown;
  hideInTable?: unknown;
  hidden?: unknown;
};

type TableSummaryLayoutElementProps = {
  children?: React.ReactNode;
  fullWidth?: boolean;
};

function createFullWidthSummaryCells(
  content: React.ReactNode,
  columns: readonly TableSummaryColumn[] | undefined,
) {
  const visible: TableSummaryColumn[] = [];
  const visit = (items: readonly TableSummaryColumn[] | undefined) => {
    items?.forEach((column) => {
      if (column.hideInTable || column.hidden) return;
      if (Array.isArray(column.children)) {
        visit(column.children as TableSummaryColumn[]);
        return;
      }
      visible.push(column);
    });
  };
  visit(columns);

  if (visible.length === 0) {
    return [
      <Table.Summary.Cell key="full-width-summary" index={0}>
        {content}
      </Table.Summary.Cell>,
    ];
  }

  let leadingFixedCount = 0;
  while (
    leadingFixedCount < visible.length &&
    (visible[leadingFixedCount].fixed === 'left' ||
      visible[leadingFixedCount].fixed === true)
  ) {
    leadingFixedCount += 1;
  }

  let trailingFixedCount = 0;
  while (
    trailingFixedCount < visible.length - leadingFixedCount &&
    visible[visible.length - trailingFixedCount - 1].fixed === 'right'
  ) {
    trailingFixedCount += 1;
  }

  const contentColumnCount =
    visible.length - leadingFixedCount - trailingFixedCount;
  if (contentColumnCount <= 0) {
    return [
      <Table.Summary.Cell
        key="full-width-summary"
        index={0}
        colSpan={visible.length}
      >
        {content}
      </Table.Summary.Cell>,
    ];
  }

  return [
    ...Array.from({ length: leadingFixedCount }, (_, index) => (
      <Table.Summary.Cell key={`summary-fixed-left-${index}`} index={index} />
    )),
    <Table.Summary.Cell
      key="full-width-summary"
      index={leadingFixedCount}
      colSpan={contentColumnCount}
    >
      {content}
    </Table.Summary.Cell>,
    ...Array.from({ length: trailingFixedCount }, (_, offset) => {
      const index = leadingFixedCount + contentColumnCount + offset;
      return (
        <Table.Summary.Cell
          key={`summary-fixed-right-${offset}`}
          index={index}
        />
      );
    }),
  ];
}

function resolveFullWidthSummaryNode(
  node: React.ReactNode,
  columns: readonly TableSummaryColumn[] | undefined,
): React.ReactNode {
  if (!React.isValidElement<TableSummaryLayoutElementProps>(node)) return node;

  const element = node;
  if (element.type === TableSummary && element.props.fullWidth) {
    return React.cloneElement(element, {
      fullWidth: false,
      children: createFullWidthSummaryCells(element.props.children, columns),
    });
  }

  if (element.props.children === undefined) return element;
  return React.cloneElement(element, {
    children: React.Children.map(element.props.children, (child) =>
      resolveFullWidthSummaryNode(child, columns),
    ),
  });
}

/**
 * Resolve a `fullWidth` summary after the adapter knows the effective columns.
 * Call this immediately before passing the summary callback to Ant Design Table.
 */
export function withResolvedTableSummary<T extends object>(
  summary: ((pageData: readonly T[]) => React.ReactNode) | undefined,
  columns: readonly TableSummaryColumn[] | undefined,
) {
  if (!summary) return summary;
  return (pageData: readonly T[]) =>
    resolveFullWidthSummaryNode(summary(pageData), columns);
}
