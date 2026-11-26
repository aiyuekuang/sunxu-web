import { QuestionCircleOutlined } from '@ant-design/icons';
import { App, Button, Space, Tooltip, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { SectionCard } from '../../src';
import { BomExpansionCreateModal } from '../../src/business/domains/procurement/BomExpansionCreateModal';
import type {
  MaterialCategoryNode,
  MaterialPickerRecord,
  MaterialTablePickerCapabilities,
} from '../../src/business/domains/inventory/material-table-picker-types';
import type { MaterialFilteredSelectOption } from '../../src/business/domains/inventory/material-select-types';
import type { OrderItemEditorCapabilities } from '../../src/business/domains/sales/order-item-editor-types';
import type {
  BomExpansionCreateModalCapabilities,
  BomRequisitionPreviewRequest,
  BomRequisitionPreviewResponse,
  CreateRequisitionFromBomRequest,
} from '../../src/business/domains/manufacturing/bom-expansion-create-modal-types';

const demoMaterials: MaterialPickerRecord[] = [
  {
    id: 'mat-finished-01',
    code: 'FG-CHAIR-001',
    name: '办公椅总成',
    spec: '黑色网布款',
    unit: 'EA',
    currentStockQty: 14,
  },
  {
    id: 'mat-frame-02',
    code: 'RM-FRAME-002',
    name: '椅架组件',
    spec: '钢制喷涂',
    unit: 'EA',
    currentStockQty: 40,
  },
  {
    id: 'mat-wheel-03',
    code: 'RM-WHEEL-003',
    name: '万向轮',
    spec: '50 mm',
    unit: 'EA',
    currentStockQty: 180,
  },
];

const demoCategories: MaterialCategoryNode[] = [
  {
    id: 'finished',
    name: '成品',
    isSystem: true,
    baseType: 'finished',
    children: [],
  },
  {
    id: 'raw',
    name: '原材料',
    isSystem: true,
    baseType: 'raw',
    children: [],
  },
];

const unitLabelMap = { EA: '个' };

function makePreview({ items, maxDepth }: BomRequisitionPreviewRequest): BomRequisitionPreviewResponse {
  const first = items[0];
  const root = demoMaterials.find((material) => material.id === first?.materialId);
  const quantity = first?.quantity ?? 0;
  const outputItems = root
    ? [
        {
          materialId: 'mat-wheel-03',
          materialCode: 'RM-WHEEL-003',
          materialName: '万向轮',
          materialSpec: '50 mm',
          materialUnit: 'EA',
          requiredQty: quantity * 5,
          sourceCount: 1,
          sources: [
            {
              rootMaterialId: root.id,
              rootMaterialCode: root.code ?? '',
              rootMaterialName: root.name ?? '',
              rootQuantity: quantity,
              path: `${root.code ?? root.id} / RM-FRAME-002 / RM-WHEEL-003`,
              level: Math.min(maxDepth ?? 8, 2),
              quantity: quantity * 5,
            },
          ],
        },
      ]
    : [];

  return {
    inputCount: items.length,
    itemCount: outputItems.length,
    totalRequiredQty: outputItems.reduce((sum, item) => sum + item.requiredQty, 0),
    items: outputItems,
    warnings: [],
  };
}

export function BomExpansionCreateModalDemo() {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [receipt, setReceipt] = useState('尚未生成采购申请');

  const pickerCapabilities = useMemo<MaterialTablePickerCapabilities>(
    () => ({
      async requestCategoryTree() {
        return demoCategories;
      },
      async requestMaterials(params) {
        const keyword = String(params.keyword ?? '').toLocaleLowerCase();
        const baseType = String(params.baseType ?? '');
        const candidates = demoMaterials.filter((material) => {
          const keywordMatch =
            !keyword ||
            `${material.code ?? ''} ${material.name ?? ''}`
              .toLocaleLowerCase()
              .includes(keyword);
          const typeMatch =
            !baseType ||
            (baseType === 'finished'
              ? material.id === 'mat-finished-01'
              : material.id !== 'mat-finished-01');
          return keywordMatch && typeMatch;
        });
        const page = Number(params.page ?? 1);
        const pageSize = Number(params.pageSize ?? 20);
        const start = (page - 1) * pageSize;
        return { list: candidates.slice(start, start + pageSize), total: candidates.length };
      },
      async requestCustomerStockSummary({ materialIds }) {
        return {
          items: materialIds.map((materialId) => ({
            materialId,
            availableQty:
              demoMaterials.find((material) => material.id === materialId)
                ?.currentStockQty ?? 0,
          })),
        };
      },
      unitLabelMap,
      pagination: {
        defaultPageSize: 20,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50],
      },
    }),
    [],
  );

  const orderItemEditorCapabilities = useMemo<OrderItemEditorCapabilities>(
    () => ({
      requestMaterialListCustomFields: async () => [],
      requestDocumentLineCustomFieldSchema: async () => undefined,
    }),
    [],
  );

  const capabilities = useMemo<
    BomExpansionCreateModalCapabilities<{ id: string; prNo: string }>
  >(
    () => ({
      async previewFromBom(request) {
        await new Promise((resolve) => window.setTimeout(resolve, 180));
        return makePreview(request);
      },
      async createFromBom(_request: CreateRequisitionFromBomRequest) {
        await new Promise((resolve) => window.setTimeout(resolve, 180));
        return { id: 'demo-pr-001', prNo: 'PR-DEMO-001' };
      },
      async requestMaterials(params) {
        const keyword = params?.keyWords?.toLocaleLowerCase() ?? '';
        return demoMaterials
          .filter((material) =>
            `${material.code ?? ''} ${material.name ?? ''}`
              .toLocaleLowerCase()
              .includes(keyword),
          )
          .map<MaterialFilteredSelectOption>((material) => ({
            value: material.id,
            label: `${material.code} - ${material.name}`,
            code: material.code,
            name: material.name,
            spec: material.spec,
            unit: material.unit,
          }));
      },
      unitLabelMap,
      formatQuantity(value) {
        if (value === undefined || value === null || value === '') return '-';
        const number = Number(value);
        if (!Number.isFinite(number)) return '-';
        return new Intl.NumberFormat('zh-CN', {
          maximumFractionDigits: 3,
        }).format(number);
      },
      notifyWarning: (text) => message.warning(text),
      notifySuccess: (text) => message.success(text),
      hasPermission: () => true,
      materialTablePickerCapabilities: pickerCapabilities,
      materialSelectCapabilities: { unitLabelMap },
      orderItemEditorCapabilities,
      renderFieldHelp: (label, key) => (
        <Tooltip
          title={
            key === 'requisitionItems'
              ? '选择需要按物料清单展开的成品或半成品，并设置本次需求数量。'
              : '备注会随本次生成的采购申请保存。'
          }
        >
          <span>
            {label} <QuestionCircleOutlined />
          </span>
        </Tooltip>
      ),
    }),
    [message, orderItemEditorCapabilities, pickerCapabilities],
  );

  return (
    <SectionCard title="按 BOM 展开创建采购申请">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary">
          录入根物料和数量后预览展开来源，再生成采购申请。预览、创建、物料、字典、字段帮助和反馈均由演示宿主注入。
        </Typography.Paragraph>
        <Space wrap>
          <Button type="primary" onClick={() => setOpen(true)}>
            打开创建弹窗
          </Button>
          <Typography.Text role="status" aria-live="polite">
            {receipt}
          </Typography.Text>
        </Space>
        <BomExpansionCreateModal
          open={open}
          onOpenChange={setOpen}
          capabilities={capabilities}
          onSuccess={(result) => {
            setReceipt(`已生成 ${result.prNo}`);
          }}
        />
      </Space>
    </SectionCard>
  );
}
