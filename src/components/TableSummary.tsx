import { Space, Table, Typography } from 'antd';
import type { ReactNode } from 'react';

export type TableSummaryProps = {
  /** Label for the filtered result set represented by the supplied values. */
  label?: ReactNode;
  /** Host-owned, already aggregated values and business-specific units. */
  children: ReactNode;
};

/**
 * Render a compact, responsive summary row at the bottom of a ProTable.
 * Aggregation, query scope, units, and permissions remain owned by the host.
 */
export function TableSummary({
  label = '筛选结果合计：',
  children,
}: TableSummaryProps) {
  return (
    <Table.Summary fixed>
      <Table.Summary.Row>
        <Table.Summary.Cell index={0} colSpan={100}>
          <Space size={[24, 8]} wrap>
            <Typography.Text type="secondary">{label}</Typography.Text>
            {children}
          </Space>
        </Table.Summary.Cell>
      </Table.Summary.Row>
    </Table.Summary>
  );
}
