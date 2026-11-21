import { App, Button, Form, Select, Space, Typography } from 'antd';
import { ProFormSelect } from '@ant-design/pro-components';
import { useState } from 'react';
import { SaleReturnEditDrawer } from '../../src/mes/components/SaleReturnEditDrawer';
import { SaleReturnReceiveModal } from '../../src/mes/components/SaleReturnReceiveModal';
import { SaleReturnReverseModal } from '../../src/mes/components/SaleReturnReverseModal';
import { SaleReturnStockConversionDrawer } from '../../src/mes/components/SaleReturnStockConversionDrawer';
import type {
  SaleReturnDetail,
  SaleReturnEditCapabilities,
  SaleReturnReceiveCapabilities,
  SaleReturnReverseCapabilities,
  SaleReturnStockConversionCapabilities,
} from '../../src/mes/components/sale-return-components-types';

const demoDetail: SaleReturnDetail = {
  id: 'sale-return-demo',
  returnNo: 'XSTH-DEMO-001',
  status: 'pending_receive',
  totalReceivedQty: 0,
  stockTransactions: [],
  sourceDeliveryId: null,
  customerId: 'customer-demo',
  receiveWarehouseId: 'warehouse-demo',
  receiveDate: '2026-11-20',
  reasonCode: 'quality_issue',
  financialAction: 'none',
  remarks: '目录演示数据',
  priceVisible: true,
  items: [
    {
      id: 'sale-return-line-demo',
      materialId: 'material-demo',
      material: {
        id: 'material-demo',
        name: '演示物料',
        hasBatchTracking: true,
      },
      returnQty: 2,
      receivedQty: 0,
      batchNo: undefined,
      storageLocationSnapshot: undefined,
      disposition: 'resellable',
      financialAction: 'none',
      unitPriceSnapshot: 18.5,
      customValues: { customerGrade: 'A' },
    },
  ],
  deductionLines: [],
};

const reasonOptions = [
  { label: '质量问题', value: 'quality_issue' },
  { label: '包装问题', value: 'packaging_issue' },
];

const deductionOptions = [
  { label: '材料损耗', value: 'material_loss' },
  { label: '物流包装', value: 'logistics_packaging' },
];

const dispositionOptions = [
  { label: '可再销售', value: 'resellable' as const },
  { label: '待处理', value: 'pending' as const },
  { label: '不良待处置', value: 'defective' as const },
  { label: '报废', value: 'scrap' as const },
  { label: '返工', value: 'rework' as const },
  { label: '退回客户', value: 'reject_to_customer' as const },
];

const financialActionOptions = [
  { label: '不处理财务', value: 'none' as const },
  { label: '生成贷项', value: 'credit_note' as const },
  { label: '冲减应收', value: 'receivable_offset' as const },
  { label: '退款', value: 'refund' as const },
];

const conversionTypeOptions = [
  { label: '拆解', value: 'disassemble' as const },
  { label: '重包', value: 'repack' as const },
  { label: '料号转换', value: 'material_change' as const },
  { label: '组合', value: 'combine' as const },
  { label: '改制转换', value: 'rework_conversion' as const },
];

const costAllocationMethodOptions = [
  { label: '按标准成本', value: 'by_standard_cost' as const },
  { label: '按数量', value: 'by_qty' as const },
  { label: '按重量/计量', value: 'by_weight_or_measure' as const },
  { label: '手工比例', value: 'manual_ratio' as const },
  { label: '手工金额', value: 'manual_amount' as const },
];

/** Host adapters below stand in for MES APIs, dictionaries and global feedback. */
export function SaleReturnComponentsDemo() {
  const { message } = App.useApp();
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [conversionOpen, setConversionOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);

  const receiveCapabilities: SaleReturnReceiveCapabilities = {
    receive: async (payload) => {
      await Promise.resolve(payload);
    },
    dispositionOptions,
    notifySuccess: (copy) => message.success(copy),
    receiveSuccessMessage: '已收货',
  };

  const reverseCapabilities: SaleReturnReverseCapabilities = {
    reverse: async (payload) => {
      await Promise.resolve(payload);
    },
    normalizeDateOnly: (value) => {
      if (typeof value === 'string') return value.slice(0, 10) || undefined;
      if (value instanceof Date) return value.toISOString().slice(0, 10);
      if (
        value &&
        typeof value === 'object' &&
        'format' in value &&
        typeof value.format === 'function'
      ) {
        return value.format('YYYY-MM-DD');
      }
      return undefined;
    },
    getStatusLabel: (status) =>
      status === 'pending_receive'
        ? '待收货'
        : status === 'reversed'
          ? '已冲正'
          : '未知状态',
    notifySuccess: (copy) => message.success(copy),
    notifyWarning: (copy) => message.warning(copy),
  };

  const conversionCapabilities: SaleReturnStockConversionCapabilities = {
    createFromSaleReturn: async (payload) => ({
      id: `conversion-${payload.id}`,
      conversionNo: 'KCDH-DEMO-001',
    }),
    requestWarehouses: async () => [
      { label: '演示仓库', value: 'warehouse-demo' },
    ],
    conversionTypeOptions,
    costAllocationMethodOptions,
    notifySuccess: (copy) => message.success(copy),
  };

  const editCapabilities: SaleReturnEditCapabilities = {
    update: async (payload) => {
      await Promise.resolve(payload);
    },
    financialActionOptions,
    renderReasonField: ({ name, label, rules }) => (
      <ProFormSelect
        name={name}
        label={label}
        options={reasonOptions}
        rules={rules}
        fieldProps={{ showSearch: true, optionFilterProp: 'label', allowClear: true }}
      />
    ),
    renderDeductionItemField: ({ name, label, rules, onChange, showConfigEntry }) => (
      <Form.Item
        name={name}
        label={label}
        rules={rules}
        extra={
          showConfigEntry ? (
            <Button
              type="link"
              size="small"
              htmlType="button"
              onClick={() => message.info('字典配置由 MES 宿主打开')}
            >
              配置扣款项目
            </Button>
          ) : null
        }
      >
        <Select
          showSearch
          optionFilterProp="label"
          allowClear
          options={deductionOptions}
          onChange={onChange}
        />
      </Form.Item>
    ),
    lineCustomFieldSchema: {
      schemaVersion: 1,
      fields: [
        {
          fieldKey: 'customerGrade',
          label: '客户等级',
          fieldKind: 'input',
          dataType: 'text',
          requiredPolicy: 'none',
          isActive: true,
          displayJson: { showInForm: true, sortOrder: 1 },
          optionsJson: {},
        },
      ],
    },
    buildLineCustomValuePayload: (item, schema) =>
      schema
        ? {
            customFieldSchemaVersion: schema.schemaVersion,
            customValues: item.customValues ?? {},
          }
        : undefined,
    getNextDeductionBasisForItem: (itemCode, currentBasis) => {
      if (itemCode === 'material_loss' && !currentBasis) {
        return '按不可回用材料或材料损耗金额协商扣减';
      }
      return undefined;
    },
    notifyWarning: (copy) => message.warning(copy),
    notifySuccess: (copy) => message.success(copy),
    messages: {
      itemsRequired: '请至少保留一条退货明细',
      manualCreditUnitPriceRequired: '生成客户贷项时，请填写每条退货明细的协商退货单价',
      deductionRequiresCredit: '有协商扣款时，请选择生成客户贷项',
      deductionExceedsReturn: '扣款合计不能超过退货金额',
      updateSuccess: '更新成功',
    },
  };

  return (
    <section>
      <Typography.Paragraph type="secondary">
        每个弹窗保留原销售退货字段和校验；目录中的能力对象模拟 MES 提供的 API、字典、日期转换及消息服务。
      </Typography.Paragraph>
      <Space wrap>
        <Button onClick={() => setEditOpen(true)}>编辑退货</Button>
        <Button onClick={() => setReceiveOpen(true)}>确认收货</Button>
        <Button onClick={() => setConversionOpen(true)}>创建库存转换</Button>
        <Button danger onClick={() => setReverseOpen(true)}>
          冲正退货
        </Button>
      </Space>
      <SaleReturnEditDrawer
        detail={demoDetail}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => undefined}
        capabilities={editCapabilities}
      />
      <SaleReturnReceiveModal
        detail={demoDetail}
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        onSuccess={() => undefined}
        capabilities={receiveCapabilities}
      />
      <SaleReturnStockConversionDrawer
        detail={demoDetail}
        open={conversionOpen}
        onClose={() => setConversionOpen(false)}
        onSuccess={() => undefined}
        capabilities={conversionCapabilities}
      />
      <SaleReturnReverseModal
        detail={reverseOpen ? demoDetail : null}
        onOpenChange={setReverseOpen}
        onSuccess={() => undefined}
        capabilities={reverseCapabilities}
      />
    </section>
  );
}
