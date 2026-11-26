/** @sunxu-layer business @sunxu-domain business-invoice @sunxu-reason Keeps invoice line fields and price-visibility behavior in the MES UI suite while formatting and custom-field schema remain host supplied. */
import type { ProColumns } from '@ant-design/pro-components';
import { Card } from 'antd';
import { useMemo } from 'react';
import { ResizableProTable as ProTable } from './ResizableTable';
import type {
  BusinessInvoiceLineTableProps,
  BusinessInvoiceLineTableRecord,
} from './business-invoice-line-table-types';

/** Read-only purchase/sales invoice details with host-provided formatters and custom fields. */
export function BusinessInvoiceLineTable({
  canViewPrices,
  lines,
  mode,
  capabilities,
}: BusinessInvoiceLineTableProps) {
  const columns = useMemo<ProColumns<BusinessInvoiceLineTableRecord>[]>(
    () => [
      { title: '项目名称', dataIndex: 'itemName', width: 200 },
      {
        title: '项目编码',
        dataIndex: 'itemCode',
        width: 140,
        render: (_, line) => line.itemCode ?? '-',
      },
      {
        title: '规格型号',
        width: 150,
        render: (_, line) => line.material?.spec ?? '-',
      },
      {
        title: '单位',
        dataIndex: 'unit',
        width: 80,
        render: (_, line) => capabilities.formatUnitLabel(line.unit) || '-',
      },
      {
        title: '数量',
        dataIndex: 'quantity',
        align: 'right',
        width: 110,
        render: (_, line) => capabilities.formatNumber(line.quantity),
      },
      ...(canViewPrices
        ? [
            {
              title: '单价',
              dataIndex: 'unitPrice',
              align: 'right' as const,
              width: 110,
              render: (_: unknown, line: BusinessInvoiceLineTableRecord) =>
                capabilities.formatNumber(line.unitPrice),
            },
            {
              title: '未税金额',
              dataIndex: 'amountWithoutTax',
              align: 'right' as const,
              width: 120,
              render: (_: unknown, line: BusinessInvoiceLineTableRecord) =>
                capabilities.formatNumber(line.amountWithoutTax),
            },
            {
              title: '税率(%)',
              dataIndex: 'taxRate',
              align: 'right' as const,
              width: 100,
              render: (_: unknown, line: BusinessInvoiceLineTableRecord) =>
                capabilities.formatNumber(line.taxRate),
            },
            {
              title: '税额',
              dataIndex: 'taxAmount',
              align: 'right' as const,
              width: 110,
              render: (_: unknown, line: BusinessInvoiceLineTableRecord) =>
                capabilities.formatNumber(line.taxAmount),
            },
            {
              title: '价税合计',
              dataIndex: 'totalAmount',
              align: 'right' as const,
              width: 120,
              render: (_: unknown, line: BusinessInvoiceLineTableRecord) =>
                capabilities.formatNumber(line.totalAmount),
            },
          ]
        : []),
      {
        title: '来源单',
        search: false,
        width: 180,
        render: (_, line) => {
          const sourceNos = [
            ...new Set(line.allocations.map((item) => item.sourceNo)),
          ];
          return sourceNos.length ? sourceNos.join('、') : '-';
        },
      },
      ...capabilities.getCustomFieldColumns(mode),
    ],
    [canViewPrices, capabilities, mode],
  );

  return (
    <Card title="发票明细">
      <ProTable<BusinessInvoiceLineTableRecord>
        rowKey="id"
        search={false}
        options={false}
        pagination={false}
        columns={columns}
        dataSource={lines}
        scroll={{ x: canViewPrices ? 1330 : 850 }}
      />
    </Card>
  );
}
