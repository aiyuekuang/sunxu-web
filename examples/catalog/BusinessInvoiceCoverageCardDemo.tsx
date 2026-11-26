import { useMemo, useState } from 'react';
import { Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  BusinessInvoiceCoverageCard,
  BusinessUiProvider,
  type BusinessInvoiceMode,
  type InvoiceCoverageResponse,
  type BusinessInvoiceCoverageCapabilities,
} from '../../src/business';

type DemoScenario = 'ready' | 'draft' | 'unpriced' | 'price-hidden' | 'pending-red' | 'no-permission';

function createCoverage(
  mode: BusinessInvoiceMode,
  scenario: DemoScenario,
): InvoiceCoverageResponse {
  const isPurchase = mode === 'purchase';
  const action = isPurchase ? '收票' : '开票';
  const hasDraft = scenario === 'draft';
  const unpriced = scenario === 'unpriced';
  const priceVisible = scenario !== 'price-hidden';
  const invoiceId = hasDraft ? 'invoice-draft-1' : 'invoice-confirmed-1';
  const invoiceNo = hasDraft ? 'PI-2026-0018' : 'PI-2026-0012';
  const amount = priceVisible ? 1280 : null;

  return {
    sourceId: isPurchase ? 'purchase-order-demo' : 'sale-order-demo',
    sourceNo: isPurchase ? 'PO-2026-018' : 'SO-2026-018',
    invoiceCount: hasDraft || scenario === 'price-hidden' ? 1 : 0,
    billableQuantity: 12,
    billedQuantity: hasDraft ? 4 : scenario === 'price-hidden' ? 2 : 0,
    billableAmount: priceVisible ? 3840 : null,
    billedAmount: hasDraft ? amount : scenario === 'price-hidden' ? null : 0,
    pendingRedAmount: scenario === 'pending-red' ? 320 : priceVisible ? 0 : null,
    status:
      hasDraft || scenario === 'price-hidden' ? 'partial_billed' : 'not_billed',
    pricingStatus: unpriced ? 'unpriced' : 'priced',
    canCreateDraft: !unpriced,
    blockingReasons: unpriced
      ? [
          {
            code: 'missing_price',
            message: `物料 RM-0081（6061 铝型材）尚未维护${isPurchase ? '采购' : '销售'}单价和金额，暂不能自动生成${isPurchase ? '采购' : '销售'}发票`,
            sourceLineId: 'source-line-1',
            materialId: 'material-1',
            itemCode: 'RM-0081',
            itemName: '6061 铝型材',
            missingFields: ['unitPrice', 'amount'],
          },
        ]
      : [],
    invoices:
      hasDraft || scenario === 'price-hidden'
        ? [
            {
              invoiceId,
              invoiceNo,
              invoiceDate: '2026-11-19',
              status: hasDraft ? 'draft' : 'confirmed',
              category: 'blue',
              invoiceTotalAmount: amount,
              allocatedQuantity: hasDraft ? 4 : 2,
              allocatedAmount: priceVisible ? 1280 : null,
            },
          ]
        : [],
    lines: [
      {
        sourceLineId: 'source-line-1',
        materialId: 'material-1',
        itemName: '6061 铝型材',
        itemCode: 'RM-0081',
        billableQuantity: 12,
        billedQuantity: hasDraft ? 4 : scenario === 'price-hidden' ? 2 : 0,
        remainingQuantity: hasDraft ? 8 : scenario === 'price-hidden' ? 10 : 12,
        billableAmount: priceVisible ? 3840 : null,
        billedAmount: hasDraft ? amount : scenario === 'price-hidden' ? null : 0,
        remainingAmount: priceVisible ? 2560 : null,
        returnedQuantity: scenario === 'pending-red' ? 1 : 0,
        returnedAmount: scenario === 'pending-red' ? 320 : priceVisible ? 0 : null,
        pendingRedAmount: scenario === 'pending-red' ? 320 : priceVisible ? 0 : null,
        status:
          hasDraft || scenario === 'price-hidden' ? 'partial_billed' : 'not_billed',
        pricingStatus: unpriced ? 'unpriced' : 'priced',
        invoiceAllocations:
          hasDraft || scenario === 'price-hidden'
            ? [
                {
                  invoiceId,
                  invoiceLineId: 'invoice-line-1',
                  invoiceNo,
                  invoiceDate: '2026-11-19',
                  status: hasDraft ? 'draft' : 'confirmed',
                  category: 'blue',
                  invoiceTotalAmount: amount,
                  allocatedQuantity: hasDraft ? 4 : 2,
                  allocatedAmount: priceVisible ? 1280 : null,
                },
              ]
            : [],
      },
    ],
    priceVisible,
  };
}

export function BusinessInvoiceCoverageCardDemo() {
  const [mode, setMode] = useState<BusinessInvoiceMode>('purchase');
  const [scenario, setScenario] = useState<DemoScenario>('ready');
  const [hostAction, setHostAction] = useState('尚未触发宿主操作');

  const capabilities = useMemo<BusinessInvoiceCoverageCapabilities>(
    () => ({
      canView: () => scenario !== 'no-permission',
      canCreate: () => true,
      async requestPurchaseCoverage() {
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        return createCoverage('purchase', scenario);
      },
      async requestSalesCoverage() {
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        return createCoverage('sales', scenario);
      },
      async createPurchaseFromSource() {
        setHostAction('宿主已创建采购发票草稿');
        return { id: 'invoice-created-purchase' };
      },
      async createSalesFromSource() {
        setHostAction('宿主已创建销售发票草稿');
        return { id: 'invoice-created-sales' };
      },
      openInvoice({ mode: invoiceMode, invoiceId }) {
        const location = window.location;
        const returnTo = `${location.pathname}${location.search}${location.hash}`;
        setHostAction(
          `宿主打开${invoiceMode === 'purchase' ? '采购' : '销售'}发票 ${invoiceId}；返回地址 ${returnTo}`,
        );
      },
    }),
    [scenario],
  );

  const card =
    mode === 'purchase' ? (
      <BusinessInvoiceCoverageCard
        mode="purchase"
        sourceType="purchase_order"
        sourceId="purchase-order-demo"
        onResolvePricing={() =>
          setHostAction('宿主打开采购订单价格编辑区')}
        resolvePricingText="补充采购价格"
      />
    ) : (
      <BusinessInvoiceCoverageCard
        mode="sales"
        sourceType="sale_order"
        sourceId="sale-order-demo"
      />
    );

  return (
    <SectionCard title="采购/销售发票覆盖卡">
      <Typography.Paragraph type="secondary">
        展示覆盖数量与金额、关联发票、待定价和待红冲状态。权限、请求与保留当前返回地址的路由由宿主注入。
      </Typography.Paragraph>
      <Space
        className="sxw-business-invoice-coverage-demo"
        orientation="vertical"
        align="start"
        size={12}
        style={{ width: '100%', minWidth: 0 }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: 8,
            width: '100%',
            minWidth: 0,
          }}
        >
          <Segmented
            aria-label="发票类型"
            value={mode}
            options={[
              { label: '采购收票', value: 'purchase' },
              { label: '销售开票', value: 'sales' },
            ]}
            onChange={(value) => setMode(value as BusinessInvoiceMode)}
          />
          <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto' }}>
            <Segmented
              aria-label="数据状态"
              value={scenario}
              options={[
                { label: '可生成', value: 'ready' },
                { label: '续填草稿', value: 'draft' },
                { label: '待定价', value: 'unpriced' },
                { label: '金额隐藏', value: 'price-hidden' },
                { label: '待红冲', value: 'pending-red' },
                { label: '无权限', value: 'no-permission' },
              ]}
              onChange={(value) => setScenario(value as DemoScenario)}
            />
          </div>
        </div>
        <BusinessUiProvider
          hasPermission={() => true}
          businessInvoiceCoverageCapabilities={capabilities}
        >
          {card}
        </BusinessUiProvider>
        <Typography.Text type="secondary" aria-live="polite">
          {hostAction}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
