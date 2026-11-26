/** @sunxu-layer business @sunxu-domain business-invoice-source-candidates @sunxu-reason Preserves purchase-receipt/sales-delivery candidate search, selection, price visibility, blocking reasons, and expandable source lines while the host provides candidate requests and formatters. */
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Space, Tag, Tooltip, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { ResizableProTable as ProTable } from './ResizableTable';
import type {
  BusinessInvoiceSourceCandidate,
  BusinessInvoiceSourceCandidateLine,
  InvoiceSourceCandidateTableProps,
} from './business-invoice-workflow-types';

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

/** Shared source-line columns keep the candidate and batch-group expansions aligned. */
export function createInvoiceSourceCandidateLineColumns({
  canViewPrices,
  includeSourceDocument = false,
  formatNumber,
  formatUnitLabel,
}: {
  canViewPrices: boolean;
  includeSourceDocument?: boolean;
  formatNumber: InvoiceSourceCandidateTableProps['capabilities']['formatNumber'];
  formatUnitLabel: InvoiceSourceCandidateTableProps['capabilities']['formatUnitLabel'];
}): ProColumns<BusinessInvoiceSourceCandidateLine>[] {
  return [
    ...(includeSourceDocument
      ? [
          {
            title: '来源单',
            dataIndex: 'sourceDocumentNo',
            width: 180,
            ellipsis: true,
            search: false,
          },
        ]
      : []),
    {
      title: '项目名称',
      dataIndex: 'itemName',
      width: 200,
      ellipsis: true,
      search: false,
    },
    {
      title: '项目编码',
      dataIndex: 'itemCode',
      width: 140,
      search: false,
      render: (_, line) => line.itemCode ?? '-',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 80,
      search: false,
      render: (_, line) => formatUnitLabel(line.unit) || '-',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 110,
      align: 'right',
      search: false,
      render: (_, line) => formatNumber(line.quantity),
    },
    ...(canViewPrices
      ? [
          {
            title: '单价',
            dataIndex: 'unitPrice',
            width: 110,
            align: 'right' as const,
            search: false,
            render: (_: unknown, line: BusinessInvoiceSourceCandidateLine) =>
              formatNumber(line.unitPrice, { maximumFractionDigits: 2 }),
          },
          {
            title: '未税金额',
            dataIndex: 'amountWithoutTax',
            width: 120,
            align: 'right' as const,
            search: false,
            render: (_: unknown, line: BusinessInvoiceSourceCandidateLine) =>
              formatNumber(line.amountWithoutTax, { maximumFractionDigits: 2 }),
          },
          {
            title: '税率(%)',
            dataIndex: 'taxRate',
            width: 100,
            align: 'right' as const,
            search: false,
            render: (_: unknown, line: BusinessInvoiceSourceCandidateLine) =>
              formatNumber(line.taxRate),
          },
          {
            title: '税额',
            dataIndex: 'taxAmount',
            width: 110,
            align: 'right' as const,
            search: false,
            render: (_: unknown, line: BusinessInvoiceSourceCandidateLine) =>
              formatNumber(line.taxAmount, { maximumFractionDigits: 2 }),
          },
          {
            title: '价税合计',
            dataIndex: 'totalAmount',
            width: 120,
            align: 'right' as const,
            search: false,
            render: (_: unknown, line: BusinessInvoiceSourceCandidateLine) =>
              formatNumber(line.totalAmount, { maximumFractionDigits: 2 }),
          },
        ]
      : []),
  ];
}

/** Lists eligible source documents and exposes their remaining invoiceable lines. */
export function InvoiceSourceCandidateTable({
  actionRef,
  canViewPrices,
  mode,
  onClearSelection,
  onSelectionChange,
  selectedIds,
  capabilities,
}: InvoiceSourceCandidateTableProps) {
  const isPurchase = mode === 'purchase';
  const sourceLabel = isPurchase ? '采购入库单' : '销售出库单';
  const partnerLabel = isPurchase ? '供应商' : '客户';
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  const lineColumns = useMemo(
    () =>
      createInvoiceSourceCandidateLineColumns({
        canViewPrices,
        formatNumber: capabilities.formatNumber,
        formatUnitLabel: capabilities.formatUnitLabel,
      }),
    [canViewPrices, capabilities.formatNumber, capabilities.formatUnitLabel],
  );

  const renderSourceLines = (source: BusinessInvoiceSourceCandidate) => {
    const lines = source.lines;
    return (
      <div style={{ padding: '8px 24px' }}>
        {lines.length ? (
          <ProTable<BusinessInvoiceSourceCandidateLine>
            rowKey={(_line, index) => String(index)}
            className="mes-expanded-detail-table"
            search={false}
            options={false}
            headerTitle={false}
            dataSource={lines}
            pagination={false}
            fitContainerHeight={false}
            resizable={false}
            size="small"
            scroll={{ x: 'max-content' }}
            columns={lineColumns}
          />
        ) : (
          <Typography.Text type="secondary">
            该来源单当前没有剩余可收票/开票的产品明细
          </Typography.Text>
        )}
      </div>
    );
  };

  const columns = useMemo<ProColumns<BusinessInvoiceSourceCandidate>[]>(
    () => [
      {
        title: `${sourceLabel}编号`,
        dataIndex: 'documentNo',
        width: 180,
        copyable: true,
      },
      {
        title: isPurchase ? '入库日期' : '出库日期',
        dataIndex: 'businessDate',
        width: 110,
        search: false,
        renderText: (value) => optionalText(value) ?? '-',
      },
      {
        title: partnerLabel,
        dataIndex: 'partnerName',
        width: 170,
        search: false,
        renderText: (value) => optionalText(value) ?? '-',
      },
      {
        title: '币种',
        dataIndex: 'currency',
        width: 90,
        search: false,
        renderText: (value) => optionalText(value) ?? '本位币',
      },
      {
        title: '汇率',
        dataIndex: 'exchangeRate',
        width: 90,
        search: false,
        renderText: (value) => optionalNumber(value)?.toString() ?? '—',
      },
      ...(canViewPrices
        ? [
            {
              title: `剩余可${isPurchase ? '收票' : '开票'}金额`,
              dataIndex: 'remainingAmount',
              align: 'right' as const,
              width: 145,
              search: false,
              renderText: (value: unknown) => {
                const amount = optionalNumber(value);
                return amount == null
                  ? '-'
                  : capabilities.formatCurrencyAmount(amount);
              },
            },
          ]
        : []),
      {
        title: '剩余明细',
        dataIndex: 'remainingLineCount',
        width: 110,
        search: false,
        render: (_, source) => {
          const lineCount = source.lines.length ?? source.remainingLineCount;
          if (!lineCount)
            return <Typography.Text type="secondary">-</Typography.Text>;
          const expanded = expandedRowKeys.includes(source.id);
          return (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() =>
                setExpandedRowKeys((keys) =>
                  keys.includes(source.id)
                    ? keys.filter((key) => key !== source.id)
                    : [...keys, source.id],
                )
              }
            >
              {lineCount} 项{expanded ? ' 收起' : ' 展开'}
            </Button>
          );
        },
      },
      {
        title: '状态',
        dataIndex: 'billingStatus',
        width: 230,
        search: false,
        render: (_, source) => {
          if (source.billingStatus === 'pending') {
            return <Tag color="processing">待处理</Tag>;
          }
          if (source.billingStatus === 'completed') {
            return <Tag color="success">已完成</Tag>;
          }
          const reasons = source.blockingReasons;
          return (
            <Space orientation="vertical" size={0}>
              <Tag color="error">需处理</Tag>
              <Tooltip
                title={reasons.join('；') || '该来源单当前不可收票/开票'}
              >
                <Typography.Text
                  type="danger"
                  ellipsis
                  style={{ maxWidth: 190 }}
                >
                  {reasons[0] || '该来源单当前不可收票/开票'}
                  {reasons.length > 1 ? `等 ${reasons.length} 项` : ''}
                </Typography.Text>
              </Tooltip>
            </Space>
          );
        },
      },
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: { placeholder: `单号/${partnerLabel}名称` },
      },
    ],
    [
      canViewPrices,
      capabilities.formatCurrencyAmount,
      capabilities.formatNumber,
      expandedRowKeys,
      isPurchase,
      partnerLabel,
      sourceLabel,
    ],
  );

  return (
    <ProTable<BusinessInvoiceSourceCandidate>
      actionRef={actionRef}
      rowKey="id"
      size="small"
      search={{ labelWidth: 'auto' }}
      pagination={{ pageSize: 10 }}
      fitContainerHeight={false}
      expandable={{
        expandedRowKeys,
        onExpandedRowsChange: (keys) => setExpandedRowKeys(keys.map(String)),
        rowExpandable: (source) => source.lines.length > 0,
        expandedRowRender: renderSourceLines,
      }}
      rowSelection={{
        selectedRowKeys: selectedIds,
        preserveSelectedRowKeys: true,
        onChange: (keys, rows) =>
          onSelectionChange(
            keys.map(String),
            Object.fromEntries(rows.map((row) => [row.id, row] as const)),
          ),
        getCheckboxProps: (source) => ({
          disabled: source.billingStatus !== 'pending',
        }),
      }}
      tableAlertOptionRender={({ selectedRowKeys, onCleanSelected }) => (
        <Space>
          <Typography.Text>已选 {selectedRowKeys.length} 张来源单</Typography.Text>
          <Button
            type="link"
            onClick={() => {
              onClearSelection();
              onCleanSelected();
            }}
          >
            清空
          </Button>
        </Space>
      )}
      request={async (params) => {
        const result = await capabilities.requestCandidates({
          mode,
          page: params.current ?? 1,
          pageSize: params.pageSize ?? 10,
          keyword: optionalText(params.keyword),
        });
        return { data: result.list, success: true, total: result.total };
      }}
      columns={columns}
    />
  );
}
