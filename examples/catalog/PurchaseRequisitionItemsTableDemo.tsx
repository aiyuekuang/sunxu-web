import { Card, Space, Typography } from 'antd';
import { PurchaseRequisitionItemsTable } from '../../src/mes';

const items = [
  {
    id: 'requisition-line-1',
    lineNo: 1,
    requiredQty: 48,
    orderedQty: 12,
    material: {
      name: '精密铝合金支架',
      code: 'AL-BR-018',
      spec: '6061-T6 / 120mm',
      unit: '件',
    },
    supplier: { name: '华东标准件供应商' },
    suggestedPurchaseDate: '2026-11-24',
    expectedArrivalDate: null,
    remarks: '与上批次保持同一表面处理',
    createdAt: '2026-11-20',
    updatedAt: '2026-11-21',
  },
  {
    id: 'requisition-line-2',
    sortOrder: 1,
    requiredQty: 36,
    orderedQty: 10,
    remainingQty: 20,
    material: {
      name: '不锈钢紧固螺栓',
      code: 'SS-BT-006',
      spec: 'M8 × 35',
      unit: 'pcs',
    },
    supplier: { name: '华南紧固件有限公司' },
    suggestedPurchaseDate: '2026-11-25',
    expectedArrivalDate: '2026-12-03',
    remarks: '按标准包装到货',
    createdAt: '2026-11-20',
    updatedAt: '2026-11-22',
  },
];

/**
 * @sunxu-component mes-specific
 * @sunxu-domain purchase-requisition
 * @sunxu-reason Demonstrates the expanded purchase-requisition material rows with host-supplied formatting.
 */
export function PurchaseRequisitionItemsTableDemo() {
  return (
    <Card title="采购申请展开物料明细">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Text type="secondary">
          展开采购申请后，按物料名称、编码、规格、单位和数量优先核对；单位、数量与日期格式由 MES 宿主传入。
        </Typography.Text>
        <PurchaseRequisitionItemsTable
          items={items}
          formatters={{
            formatUnit: (unit) => unit || '—',
            formatQty: (value) =>
              value == null || value === '' ? '0' : Number(value).toLocaleString('zh-CN'),
            formatDate: (value) => value || '—',
          }}
        />
      </Space>
    </Card>
  );
}
