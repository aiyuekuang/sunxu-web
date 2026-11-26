import { FileAddOutlined } from '@ant-design/icons';
import { App, Alert, Button, Card, Space, Tag } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import { useCallback, useEffect, useState } from 'react';
import {
  ResizableProTable as ProTable,
  ResizableTable as Table,
} from './ResizableTable';
import { useMesBusinessInvoiceCoverageCapabilities } from '../MesUiProvider';
import type {
  BusinessInvoiceMode,
  BusinessInvoiceStatus,
  InvoiceCoverageLine,
  InvoiceCoverageReference,
  InvoiceCoverageResponse,
  InvoiceCoverageStatus,
  PurchaseInvoiceSourceType,
  SalesInvoiceSourceType,
} from './business-invoice-types';

export type BusinessInvoiceCoverageCardProps =
  | {
      mode: 'purchase';
      sourceType: PurchaseInvoiceSourceType;
      sourceId: string;
      onResolvePricing?: () => void | Promise<void>;
      resolvePricingText?: string;
    }
  | {
      mode: 'sales';
      sourceType: SalesInvoiceSourceType;
      sourceId: string;
    };

const STATUS_COLOR: Record<InvoiceCoverageStatus, string> = {
  not_billed: 'default',
  partial_billed: 'orange',
  billed: 'green',
};

const INVOICE_STATUS_TEXT: Record<BusinessInvoiceStatus, string> = {
  draft: '草稿',
  confirmed: '已确认',
  cancelled: '已取消',
};

const INVOICE_CATEGORY_TEXT = {
  blue: '蓝字',
  red: '红字',
} as const;

/**
 * @sunxu-layer business
 * @sunxu-domain finance
 * @sunxu-reason Keeps invoice coverage decisions and document actions in the MES UI suite while the host injects permissions, requests, and navigation.
 */
export function BusinessInvoiceCoverageCard(
  props: BusinessInvoiceCoverageCardProps,
) {
  const { message, modal } = App.useApp();
  const capabilities = useMesBusinessInvoiceCoverageCapabilities();
  const [coverage, setCoverage] = useState<InvoiceCoverageResponse>();
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const isPurchase = props.mode === 'purchase';
  const mode: BusinessInvoiceMode = props.mode;
  const sourceType = props.sourceType;
  const sourceId = props.sourceId;
  const onResolvePricing =
    props.mode === 'purchase' ? props.onResolvePricing : undefined;
  const resolvePricingText =
    props.mode === 'purchase'
      ? (props.resolvePricingText ?? '补充采购价格')
      : undefined;
  const actionText = isPurchase ? '收票' : '开票';
  const invoiceLabel = isPurchase ? '采购' : '销售';
  const sourceDocumentLabel = isPurchase
    ? sourceType === 'purchase_receipt'
      ? '采购入库'
      : '采购订单'
    : sourceType === 'sale_delivery'
      ? '销售出库'
      : '销售订单';
  const canView = capabilities?.canView(mode) ?? false;
  const hasCreatePermission = capabilities?.canCreate(mode) ?? false;
  // 金额可见性以服务端摘要为准；根权限和金额权限都由宿主处理。
  const canViewPrices = coverage?.priceVisible === true;
  const canCreate = hasCreatePermission && canViewPrices;
  const requestPurchaseCoverage = capabilities?.requestPurchaseCoverage;
  const requestSalesCoverage = capabilities?.requestSalesCoverage;

  const openInvoice = (invoiceId: string) => {
    capabilities?.openInvoice({ mode, invoiceId });
  };

  const loadCoverage = useCallback(async () => {
    if (!canView || !capabilities) return;
    setLoading(true);
    try {
      const data =
        mode === 'purchase'
          ? await capabilities.requestPurchaseCoverage({
              sourceType: sourceType as PurchaseInvoiceSourceType,
              sourceId,
            })
          : await capabilities.requestSalesCoverage({
              sourceType: sourceType as SalesInvoiceSourceType,
              sourceId,
            });
      setCoverage(data);
    } finally {
      setLoading(false);
    }
  }, [canView, capabilities, mode, sourceId, sourceType]);

  useEffect(() => {
    if (canView) void loadCoverage();
  }, [canView, loadCoverage]);

  const pricingIssues =
    coverage?.blockingReasons?.filter((issue) => issue.code === 'missing_price') ??
    [];
  const draftInvoice = coverage?.invoices.find(
    (invoice) => invoice.status === 'draft',
  );

  const showPricingGuidance = () => {
    const content = (
      <div>
        <div style={{ marginBottom: 8 }}>
          以下物料尚未完成定价，系统不会把未知金额按 0 生成发票：
        </div>
        <ul style={{ margin: 0, paddingInlineStart: 20 }}>
          {pricingIssues.map((issue) => (
            <li key={issue.sourceLineId}>{issue.message}</li>
          ))}
        </ul>
      </div>
    );
    if (onResolvePricing) {
      modal.confirm({
        title: `暂不能自动生成${invoiceLabel}发票`,
        content,
        okText: resolvePricingText,
        cancelText: '知道了',
        onOk: onResolvePricing,
      });
      return;
    }
    modal.warning({
      title: `暂不能自动生成${invoiceLabel}发票`,
      content,
      okText: '知道了',
    });
  };

  const createInvoice = async () => {
    if (draftInvoice) {
      openInvoice(draftInvoice.invoiceId);
      return;
    }
    if (coverage?.canCreateDraft === false) {
      showPricingGuidance();
      return;
    }
    if (!capabilities) return;
    setCreating(true);
    try {
      const invoice =
        mode === 'purchase'
          ? await capabilities.createPurchaseFromSource({
              sourceType: sourceType as PurchaseInvoiceSourceType,
              sourceId,
            })
          : await capabilities.createSalesFromSource({
              sourceType: sourceType as SalesInvoiceSourceType,
              sourceId,
            });
      message.success('生成成功');
      openInvoice(invoice.id);
    } finally {
      setCreating(false);
    }
  };

  if (!canView) return null;

  const invoiceColumns: ProColumns<InvoiceCoverageReference>[] = [
    {
      title: '发票号',
      dataIndex: 'invoiceNo',
      render: (_, invoice) => (
        <Button
          type="link"
          style={{ paddingInline: 0 }}
          onClick={() => openInvoice(invoice.invoiceId)}
        >
          {invoice.invoiceNo}
        </Button>
      ),
    },
    { title: '发票日期', dataIndex: 'invoiceDate' },
    {
      title: '类型',
      dataIndex: 'category',
      render: (_, invoice) => (
        <Tag color={invoice.category === 'red' ? 'red' : 'blue'}>
          {INVOICE_CATEGORY_TEXT[invoice.category]}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, invoice) => (
        <Tag color={invoice.status === 'confirmed' ? 'green' : undefined}>
          {INVOICE_STATUS_TEXT[invoice.status]}
        </Tag>
      ),
    },
    ...(canViewPrices
      ? [
          {
            title: '发票价税合计',
            dataIndex: 'invoiceTotalAmount',
            align: 'right' as const,
            render: (value: unknown) =>
              typeof value === 'number' ? value.toFixed(2) : '—',
          },
        ]
      : []),
    {
      title: '本单分配数量',
      dataIndex: 'allocatedQuantity',
      align: 'right',
    },
    ...(canViewPrices
      ? [
          {
            title: '本单分配金额',
            dataIndex: 'allocatedAmount',
            align: 'right' as const,
            render: (value: unknown) =>
              typeof value === 'number' ? value.toFixed(2) : '—',
          },
        ]
      : []),
  ];

  const coverageColumns: ProColumns<InvoiceCoverageLine>[] = [
    { title: '物料名称', dataIndex: 'itemName' },
    {
      title: '物料编码',
      dataIndex: 'itemCode',
      render: (value) => value || '—',
    },
    {
      title: `可${actionText}数量`,
      dataIndex: 'billableQuantity',
      align: 'right',
    },
    {
      title: `已${actionText}数量`,
      dataIndex: 'billedQuantity',
      align: 'right',
    },
    {
      title: `剩余${actionText}数量`,
      dataIndex: 'remainingQuantity',
      align: 'right',
    },
    {
      title: '退货数量',
      dataIndex: 'returnedQuantity',
      align: 'right',
    },
    ...(canViewPrices
      ? [
          {
            title: `可${actionText}金额`,
            dataIndex: 'billableAmount',
            align: 'right' as const,
            render: (value: unknown) =>
              typeof value === 'number' ? value.toFixed(2) : '—',
          },
          {
            title: `已${actionText}金额`,
            dataIndex: 'billedAmount',
            align: 'right' as const,
            render: (value: unknown) =>
              typeof value === 'number' ? value.toFixed(2) : '—',
          },
          {
            title: '待红冲金额',
            dataIndex: 'pendingRedAmount',
            align: 'right' as const,
            render: (_: unknown, line: InvoiceCoverageLine) =>
              Number(line.pendingRedAmount) > 0 ? (
                <Tag color="orange">
                  {Number(line.pendingRedAmount).toFixed(2)}
                </Tag>
              ) : (
                '-'
              ),
          },
        ]
      : []),
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, line) =>
        line.pricingStatus === 'unpriced' ? (
          <Tag color="gold">待定价</Tag>
        ) : (
          <Tag color={STATUS_COLOR[line.status]}>
            {line.status === 'billed'
              ? `已全部${actionText}`
              : line.status === 'partial_billed'
                ? `部分${actionText}`
                : `未${actionText}`}
          </Tag>
        ),
    },
    {
      title: '关联发票',
      dataIndex: 'invoiceAllocations',
      width: 180,
      render: (_, line) =>
        line.invoiceAllocations.length > 0 ? (
          <Space orientation="vertical" size={0}>
            {line.invoiceAllocations.map((allocation) => (
              <Button
                key={`${allocation.invoiceId}:${allocation.invoiceLineId}`}
                type="link"
                size="small"
                style={{ paddingInline: 0 }}
                onClick={() => openInvoice(allocation.invoiceId)}
              >
                {allocation.invoiceNo}
                {canViewPrices
                  ? `（${Number(allocation.allocatedAmount).toFixed(2)}）`
                  : ''}
              </Button>
            ))}
          </Space>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <div className="sxw-business-invoice-coverage">
    <Card
      className="sxw-business-invoice-coverage__card"
      title={`${isPurchase ? '采购收票' : '销售开票'}情况`}
      style={{ marginBottom: 16 }}
      loading={loading}
      extra={
        <Space>
          <Tag
            color={
              coverage?.status === 'billed'
                ? 'green'
                : coverage?.status === 'partial_billed'
                  ? 'orange'
                  : undefined
            }
          >
            {pricingIssues.length > 0
              ? `待定价（${pricingIssues.length} 行）`
              : coverage?.status === 'billed'
                ? `已全部${actionText}`
                : coverage?.status === 'partial_billed'
                  ? `部分${actionText}`
                  : `未${actionText}`}
          </Tag>
          {canCreate && coverage?.status !== 'billed' ? (
            <Button
              type="primary"
              icon={<FileAddOutlined />}
              loading={creating}
              onClick={createInvoice}
            >
              {draftInvoice
                ? '继续填写发票草稿'
                : `生成${isPurchase ? '采购' : '销售'}发票`}
            </Button>
          ) : null}
        </Space>
      }
    >
      <Space
        orientation="vertical"
        align="start"
        size={16}
      >
        {pricingIssues.length > 0 ? (
          <Alert
            type="warning"
            showIcon
            message={`存在 ${pricingIssues.length} 行待定价，暂不能自动生成${invoiceLabel}发票`}
            description={`请先在${sourceDocumentLabel}中补充${invoiceLabel}单价；未知金额会显示为“—”，不会按 0 处理。`}
            action={
              canViewPrices && onResolvePricing ? (
                <Button size="small" onClick={showPricingGuidance}>
                  {resolvePricingText}
                </Button>
              ) : undefined
            }
          />
        ) : null}
        {canViewPrices && Number(coverage?.pendingRedAmount) > 0 ? (
          <Alert
            type="warning"
            showIcon
            message={`退货后存在 ${Number(coverage?.pendingRedAmount).toFixed(
              2,
            )} 元待红冲金额`}
            description="请从原蓝字发票创建红字发票并按原来源冲减；系统已停止继续生成蓝字发票。"
          />
        ) : null}
        <div className="sxw-business-invoice-coverage__table">
        <ProTable<InvoiceCoverageReference>
          headerTitle={`关联发票（${coverage?.invoiceCount ?? 0}）`}
          rowKey="invoiceId"
          search={false}
          options={false}
          pagination={false}
          dataSource={coverage?.invoices ?? []}
          locale={{ emptyText: `暂无${isPurchase ? '采购' : '销售'}发票` }}
          columns={invoiceColumns}
          scroll={{ x: 'max-content' }}
          summary={() => {
            const allocatedQuantity = Number(
              coverage?.invoices.reduce(
                (sum, invoice) => sum + Number(invoice.allocatedQuantity),
                0,
              ) ?? 0,
            ).toFixed(4);
            const allocatedAmount = Number(
              coverage?.invoices.reduce(
                (sum, invoice) => sum + Number(invoice.allocatedAmount),
                0,
              ) ?? 0,
            ).toFixed(2);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={canViewPrices ? 5 : 4}>
                  合计
                </Table.Summary.Cell>
                <Table.Summary.Cell index={canViewPrices ? 5 : 4} align="right">
                  {allocatedQuantity}
                </Table.Summary.Cell>
                {canViewPrices ? (
                  <Table.Summary.Cell index={6} align="right">
                    {allocatedAmount}
                  </Table.Summary.Cell>
                ) : null}
              </Table.Summary.Row>
            );
          }}
        />
        </div>
        <div className="sxw-business-invoice-coverage__table">
        <ProTable<InvoiceCoverageLine>
          headerTitle="来源明细开票覆盖"
          rowKey="sourceLineId"
          search={false}
          options={false}
          pagination={false}
          dataSource={coverage?.lines ?? []}
          columns={coverageColumns}
          scroll={{ x: 'max-content' }}
          summary={() => {
            const returnedQuantity = Number(
              coverage?.lines.reduce(
                (sum, line) => sum + Number(line.returnedQuantity),
                0,
              ) ?? 0,
            ).toFixed(4);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}>
                  合计
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  {Number(coverage?.billableQuantity ?? 0).toFixed(4)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  {Number(coverage?.billedQuantity ?? 0).toFixed(4)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  {Number(
                    (coverage?.billableQuantity ?? 0) -
                      (coverage?.billedQuantity ?? 0),
                  ).toFixed(4)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  {returnedQuantity}
                </Table.Summary.Cell>
                {canViewPrices ? (
                  <>
                    <Table.Summary.Cell index={6} align="right">
                      {coverage?.billableAmount == null
                        ? '—'
                        : Number(coverage.billableAmount).toFixed(2)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right">
                      {coverage?.billedAmount == null
                        ? '—'
                        : Number(coverage.billedAmount).toFixed(2)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align="right">
                      {coverage?.pendingRedAmount == null
                        ? '—'
                        : Number(coverage.pendingRedAmount).toFixed(2)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={9} />
                    <Table.Summary.Cell index={10} />
                  </>
                ) : (
                  <>
                    <Table.Summary.Cell index={6} />
                    <Table.Summary.Cell index={7} />
                  </>
                )}
              </Table.Summary.Row>
            );
          }}
        />
        </div>
      </Space>
    </Card>
    </div>
  );
}
