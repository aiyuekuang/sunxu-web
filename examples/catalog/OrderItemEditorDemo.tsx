import { useState } from 'react';
import { App, Segmented, Space } from 'antd';
import { SectionCard } from '../../src';
import {
  MesUiProvider,
  OrderItemEditor,
  type OrderItemDraft,
  type MesOrderItemEditorCapabilities,
} from '../../src/mes';
import { withSharedFieldHelp } from '../../src/mes/components/shared-field-help';

const demoMaterials = [
  { value: 'mat-al-01', label: '6061 铝型材', code: 'RM-AL-0081', name: '6061 铝型材', spec: '20 × 40 mm', unit: 'M' },
  { value: 'mat-box-02', label: '标准包装箱', code: 'PK-BOX-0003', name: '标准包装箱', spec: '400 × 300 × 250 mm', unit: 'EA' },
];

export function OrderItemEditorDemo() {
  const { message } = App.useApp();
  const [layout, setLayout] = useState<'inline' | 'card' | 'table'>('table');
  const [items, setItems] = useState<OrderItemDraft[]>([
    {
      _key: 'demo-order-item-1',
      materialId: 'mat-al-01',
      materialOption: demoMaterials[0],
      itemMode: 'material',
      qty: 24,
      unitPrice: 53.33,
      currency: 'CNY',
      discountRate: 100,
      taxRate: 13,
      priceIncludesTax: false,
    },
  ]);

  const capabilities: MesOrderItemEditorCapabilities = {
    requestMaterials: async (params) => {
      const keyword = params?.keyWords?.toLowerCase() ?? '';
      return demoMaterials.filter((item) =>
        `${item.label} ${item.code}`.toLowerCase().includes(keyword),
      );
    },
    requestCurrencyOptions: async () => [
      { value: 'CNY', label: '人民币（CNY）' },
      { value: 'USD', label: '美元（USD）' },
    ],
    requestMaterialListCustomFields: async () => [],
    requestDocumentLineCustomFieldSchema: async () => undefined,
    previewDocumentLineCustomFields: async ({ items: rows }) => ({ items: rows.map(() => ({})) }),
    previewCommercialAmounts: async ({ systemValues }) => {
      const amount = (systemValues.quantity ?? 0) * (systemValues.unitPrice ?? 0);
      const discountedAmount = amount * ((systemValues.discountRate ?? 100) / 100);
      const taxRate = systemValues.taxRate ?? 0;
      const taxAmount = systemValues.priceIncludesTax
        ? discountedAmount * (taxRate / (100 + taxRate))
        : discountedAmount * (taxRate / 100);
      return {
        amount,
        discountRate: systemValues.discountRate ?? 100,
        discountAmount: amount - discountedAmount,
        discountedAmount: systemValues.priceIncludesTax ? discountedAmount - taxAmount : discountedAmount,
        taxRate,
        taxAmount,
        totalAmount: systemValues.priceIncludesTax ? discountedAmount : discountedAmount + taxAmount,
      };
    },
    renderFieldHelp: ({ label, helpKey }) => withSharedFieldHelp(label, helpKey),
    renderConfigEntryLink: ({ label, onOpen }) => (
      <a
        href="#currency-dictionary"
        onClick={(event) => {
          event.preventDefault();
          onOpen();
          message.info(`打开${label}`);
        }}
      >
        {label}
      </a>
    ),
  };

  return (
    <SectionCard title="MES 单据明细编辑器">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Segmented
          aria-label="明细布局"
          value={layout}
          options={[
            { label: '表格', value: 'table' },
            { label: '卡片', value: 'card' },
            { label: '行内', value: 'inline' },
          ]}
          onChange={(value) => setLayout(value as typeof layout)}
        />
        <MesUiProvider
          hasPermission={(permission) => permission === 'mes:catalog:read'}
          materialSelectCapabilities={{ unitLabelMap: { M: '米', EA: '只' } }}
          orderItemEditorCapabilities={capabilities}
        >
          <OrderItemEditor
            items={items}
            onChange={setItems}
            title="销售明细"
            titleHelpKey="orderItems"
            layout={layout}
            allowTemporaryItem
            showPrice
            showCurrency
            showCommercialAmountFields
            commercialAmountPreviewDomain="sales"
            commercialAmountPreviewDocumentType="sale_order"
            lineCustomFieldObjectType="sale_order_item"
            density="compact"
            expandBelowByDefault
          />
        </MesUiProvider>
      </Space>
    </SectionCard>
  );
}
