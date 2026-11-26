import { MoreOutlined } from '@ant-design/icons';
import { Button, Card, Dropdown, Modal, Space, Typography } from 'antd';
import type {
  ActionType,
  ProFormInstance,
} from '@ant-design/pro-components';
import type { ColumnsState } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { useMemo, useRef, useState } from 'react';
import { MesUiProvider } from '../../src/mes';
import type { MesUiProviderProps } from '../../src/mes/MesUiProvider';
import { PurchaseOrderDetailLedger } from '../../src/mes/components/PurchaseOrderDetailLedger';
import { PermissionButton } from '../../src/mes/components/PermissionButton';
import type {
  PurchaseOrderDetailLedgerCapabilities,
  PurchaseOrderDetailLedgerFilterColumn,
  PurchaseOrderDetailLedgerRow,
  PurchaseOrderDetailLedgerSavedFilters,
} from '../../src/mes/components/purchase-order-detail-ledger-types';
import type { DocumentDetailLedgerSavedViewController } from '../../src/mes/components/DocumentDetailLedgerTable';
import type { DocumentViewBarView } from '../../src/mes/components/DocumentViewBar';
import type { MesStatusEnum } from '../../src/mes/components/StatusDisplay';

type DemoView = DocumentViewBarView;

const orderStatus: MesStatusEnum = {
  confirmed: { text: '已确认', status: 'Processing' },
  partially_received: { text: '部分收货', status: 'Warning' },
  received: { text: '已收完', status: 'Success' },
};

const inspectionStatus: MesStatusEnum = {
  pending: { text: '待检', status: 'Warning' },
  passed: { text: '合格', status: 'Success' },
  failed: { text: '不合格', status: 'Error' },
};

const trackingStatus: MesStatusEnum = {
  not_reported: { text: '待报检', status: 'Warning' },
};

const demoRows: PurchaseOrderDetailLedgerRow[] = [
  {
    id: 'purchase-order-line-1',
    purchaseOrderId: 'purchase-order-1',
    orderNo: 'PO-2026-018',
    status: 'partially_received',
    supplierId: 'supplier-1',
    supplierName: '华东标准件供应商',
    materialId: 'material-1',
    material: {
      id: 'material-1',
      name: '精密铝合金支架',
      code: 'AL-BR-018',
      spec: '120 × 40 mm',
      unit: 'pcs',
      customValues: { surface: '阳极氧化' },
    },
    orderedQty: 24,
    receivedQty: 12,
    outstandingQty: 12,
    purchaseQty: 24,
    purchaseUnit: 'pcs',
    baseUnit: 'pcs',
    purchaseOutstandingQty: 12,
    deliveryDate: '2026-11-30',
    effectiveDeliveryDate: '2026-11-30',
    purchasingRep: { realName: '王工' },
    remarks: '首批试制用',
    orderCreatedAt: '2026-11-10T08:30:00.000Z',
    orderUpdatedAt: '2026-11-20T14:20:00.000Z',
    availableActions: ['receive', 'update', 'confirm'],
    incomingInspection: {
      inspectionCount: 1,
      unreportedReceiptCount: 1,
      inspectionStatusCounts: [
        { status: 'pending', count: 1 },
        { status: 'passed', count: 2 },
      ],
      inspectionId: 'inspection-1',
    },
  },
  {
    id: 'purchase-order-line-2',
    purchaseOrderId: 'purchase-order-2',
    orderNo: 'PO-2026-019',
    status: 'confirmed',
    supplierId: 'supplier-2',
    supplierName: '南方工业材料有限公司',
    materialId: 'material-2',
    material: {
      id: 'material-2',
      name: '耐热密封垫',
      code: 'SEAL-080',
      spec: '80 mm',
      unit: 'pcs',
    },
    orderedQty: 60,
    receivedQty: 0,
    outstandingQty: 60,
    purchaseQty: 60,
    purchaseUnit: 'pcs',
    baseUnit: 'pcs',
    purchaseOutstandingQty: 60,
    effectiveDeliveryDate: '2026-12-05',
    purchasingRep: { username: 'buyer' },
    remarks: '待首批交付',
    orderCreatedAt: '2026-11-12T10:00:00.000Z',
    orderUpdatedAt: '2026-11-18T11:30:00.000Z',
    availableActions: ['receive'],
    incomingInspection: {
      inspectionCount: 0,
      unreportedReceiptCount: 0,
      inspectionStatusCounts: [],
    },
  },
];

function useSavedViewController(): DocumentDetailLedgerSavedViewController<DemoView> & {
  captureFilters: (filters: PurchaseOrderDetailLedgerSavedFilters) => void;
} {
  const [activeViewId, setActiveViewId] = useState('waiting');
  const [views, setViews] = useState<DemoView[]>([
    { id: 'waiting', name: '待收', isDefault: true },
    { id: 'overdue', name: '逾期' },
  ]);
  const [params, setParams] = useState<Record<string, unknown>>({
    onlyInTransit: 'true',
    hideCompletedUndated: 'true',
  });
  const [sort, setSort] = useState<{
    field: string;
    order: 'ascend' | 'descend';
  }>({
    field: 'effectiveDeliveryDate',
    order: 'ascend',
  });
  const [columnState, setColumnState] = useState<Record<string, ColumnsState>>({});
  const currentSortRef = useRef(sort);
  currentSortRef.current = sort;
  const applyingViewRef = useRef(false);

  return useMemo(
    () => ({
      views,
      loading: false,
      activeViewId,
      dirty: false,
      activeFilterCount: 0,
      currentConfig: { sort, columns: columnState },
      currentSortRef,
      applyingViewRef,
      params,
      beforeSearchSubmit: (values: Record<string, unknown>) => values,
      resetFilters: () =>
        setParams(
          activeViewId === 'overdue'
            ? { overdueOnly: 'true', hideCompletedUndated: 'true' }
            : { onlyInTransit: 'true', hideCompletedUndated: 'true' },
        ),
      changeColumns: setColumnState,
      changeSort: (field, order) => {
        if (!field || !order) return;
        const next = { field, order };
        currentSortRef.current = next;
        setSort(next);
      },
      selectView: (viewId) => {
        setActiveViewId(viewId);
        setParams(
          viewId === 'overdue'
            ? { overdueOnly: 'true', hideCompletedUndated: 'true' }
            : { onlyInTransit: 'true', hideCompletedUndated: 'true' },
        );
        setSort({ field: 'effectiveDeliveryDate', order: 'ascend' });
      },
      save: () => true,
      saveAs: ({ name }) => {
        const id = `saved-${views.length + 1}`;
        setViews((current) => [...current, { id, name }]);
        setActiveViewId(id);
        return true;
      },
      setDefault: (view) => {
        setViews((current) =>
          current.map((item) => ({ ...item, isDefault: item.id === view.id })),
        );
        return true;
      },
      rename: (view, name) => {
        setViews((current) =>
          current.map((item) => (item.id === view.id ? { ...item, name } : item)),
        );
        return true;
      },
      remove: (view) => {
        setViews((current) => current.filter((item) => item.id !== view.id));
        return true;
      },
      reorder: () => true,
      discardAndSwitch: () => true,
      saveAndSwitch: () => true,
      captureFilters: (filters: PurchaseOrderDetailLedgerSavedFilters) => {
        setParams({ ...filters });
      },
    }),
    [activeViewId, columnState, params, sort, views],
  );
}

function selectFilter(
  options: { label: string; value: string }[],
): PurchaseOrderDetailLedgerFilterColumn {
  return {
    valueType: 'select',
    fieldProps: { options, showSearch: true, optionFilterProp: 'label' },
  };
}

export function PurchaseOrderDetailLedgerDemo() {
  const [lastAction, setLastAction] = useState('尚未执行操作');
  const savedViewController = useSavedViewController();
  const tableActionRef = useRef<ActionType | null>(null);
  const filterFormRef = useRef<ProFormInstance | undefined>(undefined);
  const providerCapabilities = useMemo<
    NonNullable<MesUiProviderProps['documentDetailLedgerCapabilities']>
  >(
    () => ({
      pagination: { defaultPageSize: 10 },
      renderExportAction: ({ exportFn, label }) => (
        <Button
          onClick={() => {
            void exportFn().then(() => setLastAction('已导出当前筛选的采购订单明细'));
          }}
        >
          {label}
        </Button>
      ),
    }),
    [],
  );
  const capabilities = useMemo<PurchaseOrderDetailLedgerCapabilities>(
    () => ({
      requestList: async () => ({
        list: demoRows,
        total: demoRows.length,
        priceVisible: true,
        summary: {
          lineCount: 2,
          materialCount: 2,
          orderedQty: 84,
          receivedQty: 12,
          outstandingQty: 72,
          amount: 1680,
          discountAmount: 24,
          discountedAmount: 1656,
          taxAmount: 215.28,
          totalAmount: 1871.28,
        },
      }),
      exportExcel: async (query) => new Blob([JSON.stringify(query)]),
      canExport: true,
      exportPermission: 'demo:purchase-order-export',
      exportFileName: '采购订单明细.xlsx',
      renderExportAction: ({ exportExcel, getCurrentQuery, fileName, permission }) => (
        <PermissionButton
          permission={permission}
          onClick={() => {
            void exportExcel(getCurrentQuery()).then(() =>
              setLastAction(`已生成 ${typeof fileName === 'function' ? fileName() : fileName}`),
            );
          }}
        >
          导出明细
        </PermissionButton>
      ),
      canCreate: true,
      createPermission: 'demo:purchase-order-create',
      canViewOrder: true,
      canViewInspectionDetail: true,
      canListInspections: true,
      canReceive: true,
      receivePermission: 'demo:purchase-receipt-confirm',
      canPrintPurchaseReceipt: true,
      onPrintReceipt: (receiptId) => setLastAction(`打印采购入库单 ${receiptId}`),
      orderStatusEnum: orderStatus,
      inspectionStatusEnum: inspectionStatus,
      inspectionTrackingEnum: trackingStatus,
      supplierFilterColumn: selectFilter([
        { label: '华东标准件供应商', value: 'supplier-1' },
        { label: '南方工业材料有限公司', value: 'supplier-2' },
      ]),
      materialFilterColumn: selectFilter([
        { label: 'AL-BR-018 - 精密铝合金支架', value: 'material-1' },
        { label: 'SEAL-080 - 耐热密封垫', value: 'material-2' },
      ]),
      dateRangeFieldProps: {
        presets: [
          {
            label: '本月',
            value: [dayjs().startOf('month'), dayjs().endOf('month')],
          },
        ],
      },
      format: {
        formatNumber: (value: number | string | null | undefined) =>
          value == null || value === ''
            ? '-'
            : new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 4 }).format(Number(value)),
        formatCurrency: (value: number | string | null | undefined) =>
          value == null
            ? '-'
            : new Intl.NumberFormat('zh-CN', {
                style: 'currency',
                currency: 'CNY',
              }).format(Number(value)),
        formatDate: (value: string | null | undefined) => value?.slice(0, 10) ?? '-',
        formatDateTime: (value: string | null | undefined) => value?.replace('T', ' ').slice(0, 16) ?? '-',
        unitLabelMap: { pcs: '件', kg: '千克', set: '套' },
        formatUnitLabel: (
          value: string | null | undefined,
          labels: Readonly<Record<string, string>>,
        ) => (value ? labels[value] ?? value : ''),
      },
      resizable: { enabled: false },
      serverSortFields: [
        'effectiveDeliveryDate',
        'orderedQty',
        'receivedQty',
        'outstandingQty',
        'materialName',
        'materialCode',
        'status',
        'orderNo',
        'supplierName',
        'orderCreatedAt',
        'orderUpdatedAt',
      ],
      getReceiptSelectionBlockReason: (row, selectedSupplierId) => {
        if (!row.availableActions?.includes('receive')) {
          return '当前明细暂不可采购收货';
        }
        if (!row.supplierId) return '采购订单未关联供应商，不能采购收货';
        if (selectedSupplierId && row.supplierId !== selectedSupplierId) {
          return '同一批采购收货只能选择同一供应商的明细';
        }
        return undefined;
      },
      renderDocumentActions: (_row, actions) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              ...(actions.canViewOrder
                ? [{ key: 'view-order', label: '订单详情' }]
                : []),
              { key: 'view-receipts', label: '查看采购入库单' },
              ...(actions.canReceiveRow
                ? [{ key: 'receive', label: '采购收货' }]
                : []),
            ],
            onClick: ({ key }) => {
              if (key === 'view-order') actions.onOpenOrder();
              else if (key === 'view-receipts') actions.onViewReceipts();
              else if (key === 'receive') actions.onReceive();
            },
          }}
        >
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            aria-label="更多操作"
          />
        </Dropdown>
      ),
      renderPurchaseReceiptAction: ({
        sourceItemIds,
        onClose,
        onSuccess,
        onPrintReceipt,
      }) => (
        <Modal
          title="采购收货"
          open={Boolean(sourceItemIds?.length)}
          onCancel={onClose}
          onOk={() => {
            setLastAction(`已完成 ${sourceItemIds?.length ?? 0} 条明细的收货演示`);
            onSuccess();
          }}
        >
          <Typography.Paragraph>
            已选择 {sourceItemIds?.length ?? 0} 条采购订单明细。实际收货表单与提交由 MES 宿主提供。
          </Typography.Paragraph>
          {onPrintReceipt ? (
            <Button onClick={() => onPrintReceipt('receipt-demo-1')}>
              打印入库单
            </Button>
          ) : null}
        </Modal>
      ),
      printJobActionNode: (
        <Button onClick={() => setLastAction('已打开采购订单打印任务入口')}>
          打印记录
        </Button>
      ),
      initialFilters: {
        onlyInTransit: 'true',
        hideCompletedUndated: 'true',
      },
    }),
    [],
  );

  return (
    <MesUiProvider
      hasPermission={(permission) => permission.startsWith('demo:')}
      documentDetailLedgerCapabilities={providerCapabilities}
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary">
          订单服务、权限结果、视图持久化、导航、收货流程与打印能力由宿主注入；此示例演示筛选、汇总、选择约束和行操作。
        </Typography.Paragraph>
        <Card>
          <PurchaseOrderDetailLedger
            capabilities={capabilities}
            savedViewController={savedViewController}
            tableActionRef={tableActionRef}
            filterFormRef={filterFormRef}
            initialOnlyInTransit
            onViewChange={(view) => setLastAction(`切换到 ${view} 视图`)}
            onCreate={() => setLastAction('打开采购订单新增入口')}
            onOpenOrder={(id) => setLastAction(`打开采购订单 ${id}`)}
            onViewReceipts={(id) => setLastAction(`查看采购订单 ${id} 的采购入库单`)}
            onOpenInspection={(id) => setLastAction(`打开来料检验单 ${id}`)}
            onListInspections={(id) => setLastAction(`查看采购订单行 ${id} 的来料检验`)}
          />
        </Card>
        <Typography.Text role="status" aria-live="polite">
          {lastAction}
        </Typography.Text>
      </Space>
    </MesUiProvider>
  );
}
