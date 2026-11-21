import dayjs from 'dayjs';
import { useMemo, useRef, useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import { MesUiProvider } from '../../src/mes';
import { CustomerMaterialDispositionDetailLedger } from '../../src/mes/components/CustomerMaterialDispositionDetailLedger';
import { CustomerMaterialDispositionForm } from '../../src/mes/components/CustomerMaterialDispositionForm';
import { CustomerMaterialDispositionReverseModal } from '../../src/mes/components/CustomerMaterialDispositionReverseModal';
import type { DocumentDetailLedgerSavedViewController } from '../../src/mes/components/DocumentDetailLedgerTable';
import type { DocumentLineCustomFieldSchema } from '../../src/mes/components/document-line-custom-field-types';
import type { DocumentViewBarView } from '../../src/mes/components/DocumentViewBar';
import type { MesStockLocationSelectCapabilities } from '../../src/mes/components/stock-location-select-field-types';
import type {
  CustomerMaterialDispositionDetailLedgerCapabilities,
  CustomerMaterialDispositionDetailListQuery,
  CustomerMaterialDispositionDetailListResponse,
  CustomerMaterialDispositionFormCapabilities,
  CustomerMaterialDispositionOrder,
  CustomerMaterialDispositionReverseCapabilities,
} from '../../src/mes/components/customer-material-disposition-types';

const formSchema: DocumentLineCustomFieldSchema = {
  schemaVersion: 3,
  fields: [
    {
      fieldKey: 'condition',
      label: '物料状态',
      fieldKind: 'input',
      dataType: 'select',
      requiredPolicy: 'none',
      isActive: true,
      sortOrder: 1,
      displayJson: {
        showInForm: true,
        showInList: true,
        listWidth: 120,
        sortOrder: 1,
      },
      optionsJson: { options: ['良好', '待检', '破损'] },
    },
  ],
};

const typeEnum = {
  return: { text: '退回客户', status: 'Processing', color: '#1677FF' },
  loss: { text: '遗失', status: 'Error', color: '#CF1322' },
  scrap: { text: '损耗/报废', status: 'Warning', color: '#D46B08' },
} as const;

const statusEnum = {
  confirmed: { text: '已确认', status: 'Success', color: '#00B578' },
  reversed: { text: '已冲正', status: 'Warning', color: '#FF8F1F' },
} as const;

const demoOrder: CustomerMaterialDispositionOrder = {
  id: 'disposition-demo-001',
  dispositionNo: 'KFCZ-2026-0008',
  dispositionType: 'return',
  status: 'confirmed',
  disposedAt: '2026-11-20T09:30:00+08:00',
  confirmedAt: '2026-11-20T09:31:00+08:00',
  customer: { id: 'customer-demo', name: '华东精工' },
  reasonCode: 'return',
  logisticsNo: 'SF1234567890',
  remark: '来料余料退回',
  items: [{ id: 'item-demo-1' }],
};

const demoRows: CustomerMaterialDispositionDetailListResponse['list'] = [
  {
    id: 'disposition-line-demo-001',
    createdAt: '2026-11-20T09:30:00+08:00',
    updatedAt: '2026-11-20T09:31:00+08:00',
    orderId: demoOrder.id,
    order: demoOrder,
    sourceLayerId: 'source-layer-demo-001',
    materialId: 'material-demo-001',
    material: {
      id: 'material-demo-001',
      code: 'RM-AL-0012',
      name: '6061 铝型材',
      spec: '20 × 30 × 2 mm',
      unit: 'kg',
    },
    warehouseId: 'warehouse-raw',
    warehouse: { name: '客户料仓' },
    locationId: 'location-a01',
    location: { name: 'A-01', pathName: '客户料仓 / A 区 / A-01' },
    batchNo: 'LOT-20261120-01',
    qty: 12.5,
    customFieldSchemaVersion: formSchema.schemaVersion,
    customValues: { condition: '良好' },
    customComputedValues: {},
    customComputedErrors: {},
  },
];

function normalizeDateOnly(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim().slice(0, 10) || undefined;
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as { format?: (format: string) => string };
  return typeof candidate.format === 'function'
    ? candidate.format('YYYY-MM-DD') || undefined
    : undefined;
}

function createStockLocationCapabilities(): MesStockLocationSelectCapabilities {
  return {
    canAccessLocations: true,
    requestCacheScope: 'customer-disposition-demo',
    requestPrecheck: async ({ action, warehouseId }) => ({
      action,
      warehouseId,
      locationControlMode: 'required',
      locationRequired: true,
      warnings: [],
      blockers: [],
    }),
    requestDistribution: async () => ({ locations: [] }),
    requestLocationList: async () => ({
      list: [
        {
          id: 'location-a01',
          name: 'A-01',
          pathName: '客户料仓 / A 区 / A-01',
          allowStock: true,
          isActive: true,
        },
      ],
    }),
    requestLocationTree: async () => [],
    filterDisplayBlockers: (blockers) => blockers,
    renderConfigEntryFieldLabel: ({ children }) => children,
  };
}

export function CustomerMaterialDispositionComponentsDemo() {
  const [formOpen, setFormOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [lastAction, setLastAction] = useState('尚未执行操作');
  const sortRef = useRef<{ field: string; order: 'ascend' | 'descend' }>({
    field: 'disposedAt',
    order: 'descend',
  });
  const applyingViewRef = useRef(false);

  const formCapabilities = useMemo<CustomerMaterialDispositionFormCapabilities>(
    () => ({
      async requestAvailableSources({ customerId, keyword }) {
        if (!customerId) return { list: [] };
        const sources = [
          {
            sourceLayerId: 'source-layer-demo-001',
            sourceLayerType: 'tracked',
            stockManaged: true,
            sourceLabel: '客户来料登记 RK-2026-0128',
            materialId: 'material-demo-001',
            materialLabel: 'RM-AL-0012 · 6061 铝型材',
            batchNo: 'LOT-20261120-01',
            remainingQty: 38.5,
            openedAt: '2026-11-18T10:00:00+08:00',
          },
          {
            customerInboundId: 'inbound-demo-legacy',
            stockManaged: true,
            sourceLabel: '历史未分摊来源 RK-2024-0054',
            materialId: 'material-demo-001',
            materialLabel: 'RM-AL-0012 · 6061 铝型材',
            batchNo: null,
            remainingQty: 16,
            openedAt: '2024-07-01T10:00:00+08:00',
          },
          {
            customerInboundId: 'inbound-demo-external',
            stockManaged: false,
            sourceLabel: '未转库存外来物品 RK-2026-0134',
            materialLabel: '客户专用包装框',
            batchNo: null,
            remainingQty: 2,
            openedAt: '2026-11-19T14:00:00+08:00',
          },
        ];
        const normalized = keyword?.trim().toLowerCase();
        return {
          list: normalized
            ? sources.filter((source) =>
                `${source.sourceLabel} ${source.materialLabel}`
                  .toLowerCase()
                  .includes(normalized),
              )
            : sources,
        };
      },
      async confirm(request) {
        setLastAction(
          `已模拟确认 ${request.items.length} 条明细，幂等键 ${request.idempotencyKey.slice(0, 8)}…`,
        );
      },
      requestCustomerOptions: async () => [
        { label: '华东精工', value: 'customer-demo' },
      ],
      requestWarehouseOptions: async () => [
        { label: '客户料仓', value: 'warehouse-raw' },
      ],
      requestFormSchema: async () => formSchema,
      stockLocationCapabilities: createStockLocationCapabilities(),
      typeEnum,
      normalizeDateOnlyValue: normalizeDateOnly,
      getFieldHelpProps: (label) => ({ label }),
      notifyError: (message) => setLastAction(message),
    }),
    [],
  );

  const reverseCapabilities = useMemo<CustomerMaterialDispositionReverseCapabilities>(
    () => ({
      async reverse(request) {
        setLastAction(`已模拟冲正 ${request.id}，原因：${request.reason}`);
      },
      normalizeDateOnlyValue: normalizeDateOnly,
      statusEnum,
      typeEnum,
    }),
    [],
  );

  const savedViewController = useMemo<
    DocumentDetailLedgerSavedViewController<DocumentViewBarView>
  >(
    () => ({
      views: [{ id: 'all', name: '全部明细', isDefault: true }],
      loading: false,
      activeViewId: 'all',
      dirty: false,
      selectView: () => undefined,
      save: () => true,
      saveAs: () => true,
      setDefault: () => true,
      rename: () => true,
      remove: () => true,
      reorder: () => undefined,
      discardAndSwitch: () => true,
      saveAndSwitch: () => true,
      currentConfig: { sort: sortRef.current, columns: {} },
      currentSortRef: sortRef,
      applyingViewRef,
      params: {},
      activeFilterCount: 0,
      beforeSearchSubmit: (values) => values,
      changeColumns: () => undefined,
      changeSort: (field, order) => {
        if (field && order) sortRef.current = { field, order };
      },
    }),
    [],
  );

  const ledgerCapabilities = useMemo<CustomerMaterialDispositionDetailLedgerCapabilities>(
    () => ({
      requestDetailList: async (_query: CustomerMaterialDispositionDetailListQuery) => ({
        list: demoRows,
        total: demoRows.length,
        page: 1,
        pageSize: 20,
        summary: {
          itemCount: demoRows.length,
          dispositionOrderCount: 1,
          materialCount: 1,
          qty: 12.5,
        },
      }),
      exportDetailList: async () => new Blob(['demo'], { type: 'text/plain' }),
      canViewDisposition: true,
      exportPermission: 'demo:customer-material-disposition:export',
      createPermission: 'demo:customer-material-disposition:create',
      typeEnum,
      statusEnum,
      materialUnitLabelMap: { kg: '千克' },
      formatDateTime: (value) =>
        value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
      formatNumber: (value) =>
        value == null ? '-' : Number(value).toLocaleString('zh-CN'),
      formatUnitLabel: (unit, labels) => (unit ? labels[unit] ?? unit : ''),
      requestCustomerOptions: async () => [
        { label: '华东精工', value: 'customer-demo' },
      ],
      requestMaterialOptions: async () => [
        {
          label: 'RM-AL-0012 · 6061 铝型材',
          value: 'material-demo-001',
          code: 'RM-AL-0012',
          name: '6061 铝型材',
          spec: '20 × 30 × 2 mm',
          unit: 'kg',
        },
      ],
      requestWarehouseOptions: async () => [
        { label: '客户料仓', value: 'warehouse-raw' },
      ],
      lineCustomFieldSchema: formSchema,
      resizable: {
        persistenceKey: 'customer-material-disposition-demo',
        sortPersistenceKey: false,
      },
      serverSortFields: [
        'dispositionNo',
        'materialName',
        'materialCode',
        'materialSpec',
        'qty',
        'batchNo',
        'disposedAt',
        'confirmedAt',
        'createdAt',
        'updatedAt',
      ],
    }),
    [],
  );

  return (
    <SectionCard title="客户料处置组件">
      <Typography.Paragraph type="secondary">
        统一承载客户料退回、遗失和报废。已转库存的来源可按仓库、仓位与批号追溯；未转库存的外来物品只登记处置事实。
      </Typography.Paragraph>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => setFormOpen(true)}>
          新增处置
        </Button>
        <Button onClick={() => setReverseOpen(true)}>查看冲正确认</Button>
        <Button onClick={() => setLastAction('切换至单据列表视图')}>
          单据列表
        </Button>
      </Space>
      <MesUiProvider
        hasPermission={() => true}
        documentDetailLedgerCapabilities={{
          renderExportAction: ({ exportFn, label }) => (
            <Button
              onClick={() => {
                void exportFn().then(() => setLastAction('已模拟导出明细'));
              }}
            >
              {label}
            </Button>
          ),
        }}
      >
        <CustomerMaterialDispositionDetailLedger
          savedViewController={savedViewController}
          capabilities={ledgerCapabilities}
          onViewChange={() => setLastAction('已切换到单据视图')}
          onOpenDetail={(id) => setLastAction(`打开处置单 ${id}`)}
          onCreate={() => setFormOpen(true)}
        />
        <CustomerMaterialDispositionForm
          open={formOpen}
          capabilities={formCapabilities}
          onClose={() => setFormOpen(false)}
          onSuccess={() => {
            setLastAction('客户料处置已确认，台账已刷新');
            setFormOpen(false);
          }}
        />
        <CustomerMaterialDispositionReverseModal
          detail={reverseOpen ? demoOrder : null}
          capabilities={reverseCapabilities}
          onOpenChange={(open) => setReverseOpen(open)}
          onSuccess={() => setLastAction('处置冲正完成，台账已刷新')}
        />
      </MesUiProvider>
      <Typography.Text type="secondary" aria-live="polite">
        {lastAction}
      </Typography.Text>
    </SectionCard>
  );
}
