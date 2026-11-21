/** @sunxu-component mes-specific @sunxu-domain business-invoice @sunxu-reason Preserves invoice settlement and accounting relation fields while permission checks, status dictionaries, and navigation remain host supplied. */
import { Button, Card, Tag } from 'antd';
import {
  ResizableProTable as ProTable,
  ResizableTable as Table,
} from './ResizableTable';
import type {
  BusinessInvoiceRelationsLedgerProps,
  BusinessInvoiceSettlementRelation,
} from './business-invoice-relations-ledger-types';

/** Shows receivable/payable links, invoice state, and resulting accounting treatment. */
export function BusinessInvoiceRelationsLedger({
  canViewPrices,
  isConfirmed,
  relations,
  capabilities,
}: BusinessInvoiceRelationsLedgerProps) {
  const settlements = relations?.settlements ?? [];
  const isPriceVisible = canViewPrices && relations?.priceVisible === true;
  const sumSettlementAmount = (
    field: 'amount' | 'paidAmount' | 'residualAmount',
  ) =>
    settlements
      .reduce((sum, settlement) => sum + Number(settlement[field] ?? 0), 0)
      .toFixed(2);

  return (
    <Card title="往来与会计处理" style={{ marginBottom: 16 }}>
      <ProTable<BusinessInvoiceSettlementRelation>
        rowKey="settlementId"
        search={false}
        options={false}
        pagination={false}
        dataSource={settlements}
        locale={{
          emptyText: isConfirmed
            ? '该发票尚未关联应收/应付单'
            : '发票确认后可查看应收/应付及凭证处理结果',
        }}
        scroll={{ x: isPriceVisible ? 1450 : 1120 }}
        columns={[
          {
            title: '往来类型',
            dataIndex: 'type',
            width: 90,
            render: (_, relation) => (
              <Tag color={capabilities.invoiceTypeMap[relation.type]?.color}>
                {capabilities.invoiceTypeMap[relation.type]?.text}
              </Tag>
            ),
          },
          {
            title: '应收/应付单号',
            dataIndex: 'settlementNo',
            width: 170,
            render: (_, relation) =>
              capabilities.canViewSettlement ? (
                <Button
                  type="link"
                  style={{ paddingInline: 0 }}
                  onClick={() =>
                    capabilities.openSettlement(relation.settlementId)
                  }
                >
                  {relation.settlementNo}
                </Button>
              ) : (
                relation.settlementNo
              ),
          },
          {
            title: '业务来源',
            dataIndex: 'sourceNo',
            width: 150,
            render: (value) => value || '—',
          },
          ...(isPriceVisible
            ? [
                {
                  title: '往来金额',
                  dataIndex: 'amount',
                  width: 110,
                  align: 'right' as const,
                  render: (_: unknown, relation: BusinessInvoiceSettlementRelation) =>
                    typeof relation.amount === 'number'
                      ? relation.amount.toFixed(2)
                      : '—',
                },
                {
                  title: '已结算',
                  dataIndex: 'paidAmount',
                  width: 110,
                  align: 'right' as const,
                  render: (_: unknown, relation: BusinessInvoiceSettlementRelation) =>
                    typeof relation.paidAmount === 'number'
                      ? relation.paidAmount.toFixed(2)
                      : '—',
                },
                {
                  title: '未结算',
                  dataIndex: 'residualAmount',
                  width: 110,
                  align: 'right' as const,
                  render: (_: unknown, relation: BusinessInvoiceSettlementRelation) =>
                    typeof relation.residualAmount === 'number'
                      ? relation.residualAmount.toFixed(2)
                      : '—',
                },
              ]
            : []),
          {
            title: '往来状态',
            dataIndex: 'status',
            width: 100,
            render: (_, relation) => (
              <Tag color={capabilities.settlementStatusMap[relation.status]?.color}>
                {capabilities.settlementStatusMap[relation.status]?.text}
              </Tag>
            ),
          },
          {
            title: '开票状态',
            dataIndex: 'billingStatus',
            width: 100,
            render: (_, relation) => (
              <Tag
                color={
                  capabilities.billingStatusMap[relation.billingStatus]?.color
                }
              >
                {capabilities.billingStatusMap[relation.billingStatus]?.text}
              </Tag>
            ),
          },
          {
            title: '会计来源',
            dataIndex: 'accountingStatus',
            width: 110,
            render: (_, relation) =>
              relation.accountingStatus ? (
                <Tag
                  color={
                    capabilities.accountingStatusMap[
                      relation.accountingStatus
                    ]?.color
                  }
                >
                  {
                    capabilities.accountingStatusMap[
                      relation.accountingStatus
                    ]?.text
                  }
                </Tag>
              ) : (
                '未生成'
              ),
          },
          {
            title: '凭证号',
            dataIndex: 'voucherNo',
            width: 140,
            render: (_, relation) =>
              relation.voucherNo && capabilities.canViewVoucher ? (
                <Button
                  type="link"
                  style={{ paddingInline: 0 }}
                  onClick={capabilities.openVoucherList}
                >
                  {relation.voucherNo}
                </Button>
              ) : (
                '—'
              ),
          },
          {
            title: '处理说明',
            dataIndex: 'accountingError',
            width: 220,
            ellipsis: true,
            render: (value) => value || '—',
          },
        ]}
        summary={() => {
          if (!isPriceVisible) return null;
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3}>
                合计
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                {sumSettlementAmount('amount')}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                {sumSettlementAmount('paidAmount')}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                {sumSettlementAmount('residualAmount')}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} colSpan={5} />
            </Table.Summary.Row>
          );
        }}
      />
    </Card>
  );
}
