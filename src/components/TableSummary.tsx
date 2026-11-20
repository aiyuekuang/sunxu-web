import { Table } from 'antd';
import type { ReactNode } from 'react';

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
