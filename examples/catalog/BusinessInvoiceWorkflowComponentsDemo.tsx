import { ProFormSelect } from '@ant-design/pro-components';
import { App, Button, Segmented, Space, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { SectionCard } from '../../src';
import { BusinessInvoiceCreateDrawer } from '../../src/mes/components/BusinessInvoiceCreateDrawer';
import { BusinessInvoiceEditDrawer } from '../../src/mes/components/BusinessInvoiceEditDrawer';
import { BusinessInvoiceMatchDrawer } from '../../src/mes/components/BusinessInvoiceMatchDrawer';
import { InvoiceSourceBatchModal } from '../../src/mes/components/InvoiceSourceBatchModal';
import type {
  BusinessInvoiceWorkflowRecord,
  BusinessInvoiceCreateCapabilities,
  BusinessInvoiceMatchCapabilities,
  InvoiceSourceBatchCapabilities,
} from '../../src/mes/components/business-invoice-workflow-types';
import type { InvoiceCoverageResponse } from '../../src/mes/components/business-invoice-types';

const record: BusinessInvoiceWorkflowRecord = {
  id: 'invoice-demo-001',
  documentNo: 'PI-2026-0188',
  invoiceNo: '12345678901234567890',
  category: 'blue',
  sourceMode: 'opening_unmatched',
  partnerId: 'supplier-001',
  invoiceDate: '2026-11-18',
  currency: 'CNY',
  exchangeRate: 1,
  externalSystem: 'Legacy ERP',
  externalDocumentId: 'legacy-789',
  externalDocumentNo: 'LEGACY-AP-789',
  externalOriginalDocumentId: 'legacy-blue-445',
  importBatchNo: 'opening-2026-01',
  remarks: '期初导入发票',
  lines: [
    {
      id: 'invoice-line-001',
      materialId: 'material-001',
      itemCode: 'MAT-AL-01',
      itemName: '铝合金板材',
      unit: 'kg',
      quantity: 120,
      unitPrice: 35,
      amountWithoutTax: 4200,
      taxRate: 13,
      taxAmount: 546,
      totalAmount: 4746,
      customFieldSchemaVersion: 1,
      customValues: { heatNumber: 'HT-2026-04' },
      allocations: [],
    },
    {
      id: 'invoice-line-002',
      itemName: '切割服务',
      quantity: 2,
      unitPrice: 180,
      amountWithoutTax: 360,
      taxRate: 6,
      taxAmount: 21.6,
      totalAmount: 381.6,
      allocations: [
        {
          sourceType: 'purchase_receipt',
          sourceId: 'receipt-001',
          sourceLineId: 'receipt-line-002',
          sourceNo: 'PR-2026-0440',
          allocatedQuantity: 2,
          allocatedAmount: 381.6,
        },
      ],
    },
  ],
};

const invoiceCategoryOptions = [
  { label: '蓝字', value: 'blue' as const },
  { label: '红字', value: 'red' as const },
];

const candidateRows = [
  {
    id: 'receipt-101',
    documentNo: 'PR-2026-0441',
    businessDate: '2026-11-15',
    partnerId: 'supplier-001',
    partnerName: '华星精密制造',
    currency: 'CNY',
    exchangeRate: 1,
    remainingAmount: 6180,
    remainingLineCount: 2,
    billingStatus: 'pending' as const,
    blockingReasons: [],
    lines: [
      {
        itemName: '铝合金板材',
        itemCode: 'MAT-AL-01',
        unit: 'kg',
        quantity: 120,
        unitPrice: 35,
        taxRate: 13,
        amountWithoutTax: 4200,
        taxAmount: 546,
        totalAmount: 4746,
        materialId: 'material-001',
      },
      {
        itemName: '切割服务',
        itemCode: 'SVC-CUT-01',
        unit: 'hour',
        quantity: 8,
        unitPrice: 150,
        taxRate: 6,
        amountWithoutTax: 1200,
        taxAmount: 72,
        totalAmount: 1272,
      },
    ],
  },
  {
    id: 'receipt-102',
    documentNo: 'PR-2026-0442',
    businessDate: '2026-11-16',
    partnerId: 'supplier-001',
    partnerName: '华星精密制造',
    currency: 'CNY',
    exchangeRate: 1,
    remainingAmount: 2180,
    remainingLineCount: 1,
    billingStatus: 'pending' as const,
    blockingReasons: [],
    lines: [
      {
        itemName: '不锈钢紧固件',
        itemCode: 'MAT-SS-14',
        unit: 'pcs',
        quantity: 200,
        unitPrice: 9.65,
        taxRate: 13,
        amountWithoutTax: 1930,
        taxAmount: 250.9,
        totalAmount: 2180.9,
        materialId: 'material-014',
      },
    ],
  },
  {
    id: 'receipt-103',
    documentNo: 'PR-2026-0443',
    businessDate: '2026-11-16',
    partnerId: 'supplier-001',
    partnerName: '华星精密制造',
    currency: 'CNY',
    exchangeRate: 1,
    remainingAmount: null,
    remainingLineCount: 0,
    billingStatus: 'blocked' as const,
    blockingReasons: ['部分物料尚未维护采购单价'],
    lines: [],
  },
  {
    id: 'delivery-201',
    documentNo: 'SD-2026-0221',
    businessDate: '2026-11-17',
    partnerId: 'customer-001',
    partnerName: '华星客户',
    currency: 'CNY',
    exchangeRate: 1,
    remainingAmount: 14250,
    remainingLineCount: 1,
    billingStatus: 'pending' as const,
    blockingReasons: [],
    lines: [
      {
        itemName: '精密轴套',
        itemCode: 'PRD-BUSH-08',
        unit: 'pcs',
        quantity: 150,
        unitPrice: 84.07,
        taxRate: 13,
        amountWithoutTax: 12610.5,
        taxAmount: 1639.37,
        totalAmount: 14249.87,
        materialId: 'material-088',
      },
    ],
  },
];

const coverage: InvoiceCoverageResponse = {
  sourceId: 'receipt-101',
  sourceNo: 'PR-2026-0441',
  invoiceCount: 0,
  billableQuantity: 128,
  billedQuantity: 0,
  billableAmount: 6180,
  billedAmount: 0,
  status: 'not_billed',
  pricingStatus: 'priced',
  canCreateDraft: true,
  invoices: [],
  lines: [
    {
      sourceLineId: 'receipt-line-001',
      materialId: 'material-001',
      itemName: '铝合金板材',
      itemCode: 'MAT-AL-01',
      billableQuantity: 120,
      billedQuantity: 0,
      remainingQuantity: 120,
      billableAmount: 4746,
      billedAmount: 0,
      remainingAmount: 4746,
      returnedQuantity: 0,
      status: 'not_billed',
      pricingStatus: 'priced',
      invoiceAllocations: [],
    },
  ],
  priceVisible: true,
};

export function BusinessInvoiceWorkflowComponentsDemo() {
  const { message } = App.useApp();
  const [mode, setMode] = useState<'purchase' | 'sales'>('purchase');
  const [canViewPrices, setCanViewPrices] = useState(true);
  const [sourceLinked, setSourceLinked] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [lastAction, setLastAction] = useState('尚未执行发票动作');

  const formCapabilities = useMemo<BusinessInvoiceCreateCapabilities>(
    () => ({
      invoiceCategoryOptions,
      lineCustomFieldSchema: {
        schemaVersion: 1,
        fields: [
          {
            fieldKey: 'heatNumber',
            label: '炉批号',
            fieldKind: 'input',
            dataType: 'text',
            requiredPolicy: 'none',
            isActive: true,
            sortOrder: 1,
            displayJson: { showInForm: true },
          },
        ],
      },
      renderPartnerField: ({
        name,
        mode: fieldMode,
        label,
        disabled,
        showSearch,
        debounceTime,
        filterOption,
      }) => (
        <ProFormSelect
          key={name}
          name={name}
          label={label}
          width="md"
          disabled={disabled}
          showSearch={showSearch}
          debounceTime={debounceTime}
          fieldProps={{ filterOption }}
          rules={[{ required: true }]}
          options={[
            {
              label: fieldMode === 'purchase' ? '华星精密制造' : '华星客户',
              value: fieldMode === 'purchase' ? 'supplier-001' : 'customer-001',
            },
          ]}
        />
      ),
      renderUnitField: ({ name, label, disabled, enabled }) => (
        <ProFormSelect
          key={`${name}-${enabled}`}
          name={name}
          label={label}
          width="xs"
          disabled={disabled || !enabled}
          fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
          options={[
            { label: '千克', value: 'kg' },
            { label: '件', value: 'pcs' },
            { label: '小时', value: 'hour' },
          ]}
        />
      ),
      listOriginalInvoices: async ({ mode: invoiceMode }) => [
        {
          id: 'original-invoice-001',
          documentNo: invoiceMode === 'purchase' ? 'PI-2026-0008' : 'SI-2026-0008',
          invoiceNo: '12345678901234567890',
          partnerName: '华星精密制造',
        },
      ],
      getOriginalInvoiceDetail: async () => ({
        partnerId: 'supplier-001',
        currency: 'CNY',
        exchangeRate: 1,
        lines: [
          {
            materialId: 'material-001',
            itemCode: 'MAT-AL-01',
            itemName: '铝合金板材',
            unit: 'kg',
            quantity: 30,
            unitPrice: 35,
            amountWithoutTax: 1050,
            taxRate: 13,
            taxAmount: 136.5,
            totalAmount: 1186.5,
            allocations: [
              {
                sourceId: 'receipt-101',
                sourceLineId: 'receipt-line-001',
                sourceNo: 'PR-2026-0441',
                allocatedQuantity: 30,
                allocatedAmount: 1186.5,
                sourceType: 'purchase_receipt',
              },
            ],
          },
        ],
      }),
    }),
    [],
  );

  const matchCapabilities = useMemo<BusinessInvoiceMatchCapabilities>(
    () => ({
      listSourceOptions: async ({ mode: invoiceMode }) => [
        {
          id: invoiceMode === 'purchase' ? 'receipt-101' : 'delivery-201',
          documentNo: invoiceMode === 'purchase' ? 'PR-2026-0441' : 'SD-2026-0441',
          partnerName: '华星精密制造',
        },
      ],
      requestCoverage: async ({ mode: invoiceMode }): Promise<InvoiceCoverageResponse> => ({
        ...coverage,
        sourceId: invoiceMode === 'purchase' ? 'receipt-101' : 'delivery-201',
        sourceNo: invoiceMode === 'purchase' ? 'PR-2026-0441' : 'SD-2026-0221',
      }),
      matchInvoice: async ({ lines }) => {
        setLastAction(`已提交 ${lines.length} 行来源分摊`);
      },
      coverageStatusLabels: {
        not_billed: { text: '未开票', status: 'Default' },
        partial_billed: { text: '部分开票', status: 'Warning' },
        billed: { text: '已全部开票', status: 'Success' },
      },
      notifyError: (text) => message.error(text),
      notifySuccess: (text) => message.success(text),
    }),
    [message],
  );

  const batchCapabilities = useMemo<InvoiceSourceBatchCapabilities>(
    () => ({
      canViewPrices,
      candidateTable: {
        requestCandidates: async ({ mode: invoiceMode, keyword }) => {
          const filtered = candidateRows.filter((item) => {
            const modeMatch = item.id.startsWith(
              invoiceMode === 'purchase' ? 'receipt' : 'delivery',
            );
            const keywordMatch = keyword
              ? `${item.documentNo} ${item.partnerName}`
                  .toLowerCase()
                  .includes(keyword.toLowerCase())
              : true;
            return modeMatch && keywordMatch;
          });
          return { list: filtered, total: filtered.length };
        },
        formatNumber: (value, options) =>
          value == null
            ? '—'
            : new Intl.NumberFormat('zh-CN', options).format(value),
        formatCurrencyAmount: (value) =>
          value == null
            ? '—'
            : `¥${new Intl.NumberFormat('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(value)}`,
        formatUnitLabel: (unit) => {
          const unitLabels: Record<string, string> = {
            kg: '千克',
            pcs: '件',
            hour: '小时',
          };
          return unitLabels[unit ?? ''] ?? unit ?? '';
        },
      },
      previewBatchCreate: async ({ ids }) => ({
        eligible: ids.length,
        blocked: 0,
        previewToken: 'demo-preview-token',
      }),
      batchCreate: async ({ ids, groups }) => {
        setLastAction(`已处理 ${ids.length} 张来源单，计划生成 ${groups.length} 张发票草稿`);
        return { succeeded: ids.length, failed: 0 };
      },
      notifyWarning: (text) => message.warning(text),
      notifyError: (text) => message.error(text),
      notifySuccess: (text) => message.success(text),
    }),
    [canViewPrices, message],
  );

  const editRecord: BusinessInvoiceWorkflowRecord = useMemo(
    () => ({
      ...record,
      lines: record.lines.map((line) => ({
        ...line,
        allocations: sourceLinked
          ? [
              {
                sourceType: 'purchase_receipt',
                sourceId: 'receipt-101',
                sourceLineId: 'receipt-line-001',
                sourceNo: 'PR-2026-0441',
                allocatedQuantity: line.quantity,
                allocatedAmount: line.totalAmount ?? 0,
              },
            ]
          : [],
      })),
    }),
    [sourceLinked],
  );

  return (
    <SectionCard title="业务发票录入与来源匹配">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap>
          <Typography.Text>业务类型</Typography.Text>
          <Segmented
            value={mode}
            options={[
              { label: '采购发票', value: 'purchase' },
              { label: '销售发票', value: 'sales' },
            ]}
            onChange={(value) => {
              if (value === 'purchase' || value === 'sales') setMode(value);
            }}
          />
          <Typography.Text>价格查看权限</Typography.Text>
          <Segmented
            value={canViewPrices ? 'allowed' : 'denied'}
            options={[
              { label: '允许', value: 'allowed' },
              { label: '无权限', value: 'denied' },
            ]}
            onChange={(value) => setCanViewPrices(value === 'allowed')}
          />
          <Typography.Text>编辑来源分摊</Typography.Text>
          <Segmented
            value={sourceLinked ? 'linked' : 'unlinked'}
            options={[
              { label: '已关联', value: 'linked' },
              { label: '未关联', value: 'unlinked' },
            ]}
            onChange={(value) => setSourceLinked(value === 'linked')}
          />
        </Space>
        <Space wrap>
          <Button type="primary" onClick={() => setCreateOpen(true)}>新增发票</Button>
          <Button onClick={() => setEditOpen(true)}>编辑发票</Button>
          <Button onClick={() => setMatchOpen(true)}>匹配来源单</Button>
          <Button onClick={() => setBatchOpen(true)}>批量收票/开票</Button>
        </Space>
        <Typography.Text type="secondary">{lastAction}</Typography.Text>
      </Space>

      <BusinessInvoiceCreateDrawer
        mode={mode}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onFinish={async (values) => {
          setLastAction(`已提交${values.category === 'red' ? '红字' : '蓝字'}发票草稿`);
          setCreateOpen(false);
          return true;
        }}
        capabilities={formCapabilities}
      />
      <BusinessInvoiceEditDrawer
        mode={mode}
        record={editRecord}
        open={editOpen}
        onOpenChange={setEditOpen}
        onFinish={async (values) => {
          setLastAction(`已提交编辑 ${values.documentNo ?? ''}`);
          setEditOpen(false);
          return true;
        }}
        capabilities={formCapabilities}
      />
      <BusinessInvoiceMatchDrawer
        mode={mode}
        record={editRecord}
        open={matchOpen}
        onOpenChange={setMatchOpen}
        onSuccess={async () => setLastAction('发票详情已刷新')}
        capabilities={matchCapabilities}
      />
      <InvoiceSourceBatchModal
        mode={mode}
        open={batchOpen}
        onCancel={() => setBatchOpen(false)}
        onDone={() => setBatchOpen(false)}
        capabilities={batchCapabilities}
      />
    </SectionCard>
  );
}
