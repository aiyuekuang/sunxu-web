import type {
  ActionType,
  ProFormInstance,
} from '@ant-design/pro-components';
import type { ColumnsState } from '@ant-design/pro-components';
import { App, Button, Segmented, Space, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import { SectionCard } from '../../src';
import {
  BusinessUiProvider,
  type DocumentDetailLedgerSavedViewController,
  type DocumentViewBarView,
} from '../../src/business';
import { BUSINESS_DATE_RANGE_PRESETS } from '../../src/business/table/dateRangePresets';
import { OutsourcingOrderDetailLedger } from '../../src/business/domains/procurement/OutsourcingOrderDetailLedger';
import { OutsourcingProgressDrawer } from '../../src/business/domains/procurement/OutsourcingProgressDrawer';
import type {
  OutsourcingOrderDetailLedgerCapabilities,
  OutsourcingOrderDetailLedgerQuery,
  OutsourcingOrderDetailLedgerRow,
  OutsourcingOrderDetailLedgerResponse,
} from '../../src/business/domains/procurement/outsourcing-detail-ledger-types';
import type {
  OutsourcingOrderStep,
  OutsourcingOrderStepInput,
  OutsourcingProgressDrawerCapabilities,
  OutsourcingProgressOrderRef,
  OutsourcingProgressReport,
} from '../../src/business/domains/procurement/outsourcing-progress-drawer-types';
import type { StatusMap } from '../../src/components/StatusDisplay';

const orderStatuses: StatusMap = {
  draft: { text: '草稿', status: 'Default' },
  in_progress: { text: '加工中', status: 'Processing' },
  partial_received: { text: '部分收货', status: 'Warning' },
  received: { text: '已收货', status: 'Success' },
  repairing: { text: '返修中', status: 'Warning' },
  qualified: { text: '已合格', status: 'Success' },
  unqualified: { text: '不合格', status: 'Error' },
  closed: { text: '已关闭', status: 'Default' },
  cancelled: { text: '已取消', status: 'Default' },
};

const lineRoles: StatusMap = {
  input: { text: '投入', status: 'Processing' },
  output: { text: '收货', status: 'Success' },
};

const initialRows: OutsourcingOrderDetailLedgerRow[] = [
  {
    id: 'outsourcing-line-input-1',
    lineRole: 'input',
    transactionType: 'issue',
    materialId: 'material-aluminum',
    materialName: '精密铝合金支架',
    materialCode: 'AL-BR-018',
    materialSpec: '120×40 mm',
    unit: 'pcs',
    qty: 24,
    displayQty: 24,
    displayUnit: '件',
    outsourcingOrderId: 'outsourcing-order-018',
    orderNo: 'WW-2026-0018',
    status: 'in_progress',
    supplierId: 'supplier-demo',
    supplierName: '精工表面处理',
    warehouseId: 'warehouse-raw',
    warehouseName: '原材料仓',
    locationId: 'location-a1',
    locationName: 'A区 / 01-02',
    batchNo: 'LOT-AL-018',
    transactionNo: 'WWFH-2026-0018',
    transactionAt: '2026-11-20T09:30:00.000Z',
    createdAt: '2026-11-20T09:30:00.000Z',
    updatedAt: '2026-11-20T10:10:00.000Z',
    customValues: { surface: '喷砂' },
    customComputedValues: {},
    customComputedErrors: {},
  },
  {
    id: 'outsourcing-line-output-1',
    lineRole: 'output',
    transactionType: 'receipt',
    materialId: 'material-aluminum',
    materialName: '精密铝合金支架',
    materialCode: 'AL-BR-018',
    materialSpec: '120×40 mm',
    unit: 'pcs',
    qty: 12,
    displayQty: 12,
    displayUnit: '件',
    outsourcingOrderId: 'outsourcing-order-018',
    orderNo: 'WW-2026-0018',
    status: 'partial_received',
    supplierId: 'supplier-demo',
    supplierName: '精工表面处理',
    warehouseId: 'warehouse-finished',
    warehouseName: '半成品仓',
    locationId: 'location-b2',
    locationName: 'B区 / 02-01',
    batchNo: 'LOT-AL-018-R1',
    transactionNo: 'WWRK-2026-0018',
    transactionAt: '2026-11-21T08:45:00.000Z',
    createdAt: '2026-11-21T08:45:00.000Z',
    updatedAt: '2026-11-21T08:45:00.000Z',
    customValues: { inspection: '待终检' },
    customComputedValues: {},
    customComputedErrors: {},
  },
  {
    id: 'outsourcing-line-input-2',
    lineRole: 'input',
    transactionType: 'issue',
    materialId: 'material-fastener',
    materialName: 'M8 不锈钢螺栓',
    materialCode: 'SS-M8-040',
    materialSpec: 'M8×40',
    unit: 'pcs',
    qty: 120,
    displayQty: 120,
    displayUnit: '件',
    outsourcingOrderId: 'outsourcing-order-019',
    orderNo: 'WW-2026-0019',
    status: 'draft',
    supplierId: 'supplier-demo-2',
    supplierName: '宏达精密加工',
    warehouseId: 'warehouse-raw',
    warehouseName: '原材料仓',
    locationId: 'location-a2',
    locationName: 'A区 / 02-03',
    batchNo: 'LOT-SS-019',
    transactionNo: 'WWFH-2026-0019',
    transactionAt: '2026-11-19T13:20:00.000Z',
    createdAt: '2026-11-19T13:20:00.000Z',
    updatedAt: '2026-11-19T13:20:00.000Z',
    customValues: { surface: '本色' },
    customComputedValues: {},
    customComputedErrors: {},
  },
];

const issueSchema = {
  schemaVersion: 1,
  fields: [
    {
      fieldKey: 'surface',
      label: '表面处理',
      fieldKind: 'input',
      dataType: 'text',
      isActive: true,
      sortOrder: 1,
      displayJson: { showInList: true, listWidth: 140, sortOrder: 1 },
    },
  ],
};

const receiptSchema = {
  schemaVersion: 1,
  fields: [
    {
      fieldKey: 'inspection',
      label: '检验状态',
      fieldKind: 'input',
      dataType: 'text',
      isActive: true,
      sortOrder: 1,
      displayJson: { showInList: true, listWidth: 140, sortOrder: 1 },
    },
  ],
};

const progressOrder: OutsourcingProgressOrderRef = {
  id: 'outsourcing-order-018',
  orderNo: 'WW-2026-0018',
  qty: 24,
  unit: '件',
};

const initialSteps: OutsourcingOrderStep[] = [
  { id: 'step-prep', name: '前处理', plannedQty: 24, latestProcessedQty: 24 },
  { id: 'step-coating', name: '喷涂', plannedQty: 24, latestProcessedQty: 12 },
  { id: 'step-inspection', name: '外观检验', plannedQty: 24, latestProcessedQty: 0 },
];

const demoReports: OutsourcingProgressReport[] = [
  {
    id: 'report-1',
    stepId: 'step-coating',
    step: { id: 'step-coating', name: '喷涂' },
    processedQty: 12,
    qualifiedQty: 11,
    defectQty: 1,
    reportedAt: '2026-11-21T08:30:00.000Z',
    source: 'supplier_scan',
    submitterName: '供应商操作员',
  },
  {
    id: 'report-2',
    processedQty: 24,
    qualifiedQty: 24,
    defectQty: 0,
    reportedAt: '2026-11-20T17:15:00.000Z',
    source: 'internal',
    submitterName: '生产计划员',
  },
];

function OutsourcingComponentsDemoContent() {
  const { message } = App.useApp();
  const [permissions, setPermissions] = useState<'full' | 'read-only'>('full');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAction, setLastAction] = useState('尚未执行操作');
  const [savedSteps, setSavedSteps] = useState(initialSteps);
  const savedStepsRef = useRef(savedSteps);
  savedStepsRef.current = savedSteps;
  const qrVersionRef = useRef(1);
  const [views, setViews] = useState<DocumentViewBarView[]>([
    { id: 'all', name: '全部明细', isDefault: true },
    { id: 'in-progress', name: '加工中' },
  ]);
  const [activeViewId, setActiveViewId] = useState('all');
  const [columnState, setColumnState] = useState<Record<string, ColumnsState>>({});
  const [sort, setSort] = useState<{
    field: string;
    order: 'ascend' | 'descend';
  }>({ field: 'transactionAt', order: 'descend' });
  const tableActionRef = useRef<ActionType | null>(null);
  const filterFormRef = useRef<ProFormInstance | undefined>(undefined);
  const currentSortRef = useRef(sort);
  currentSortRef.current = sort;
  const applyingViewRef = useRef(false);
  const canManage = permissions === 'full';

  const savedViewController = useMemo<
    DocumentDetailLedgerSavedViewController<DocumentViewBarView>
  >(
    () => ({
      views,
      loading: false,
      activeViewId,
      dirty: false,
      activeFilterCount: activeViewId === 'in-progress' ? 1 : 0,
      currentConfig: { sort, columns: columnState },
      currentSortRef,
      applyingViewRef,
      params: activeViewId === 'in-progress' ? { status: 'in_progress' } : {},
      beforeSearchSubmit: (values) => values,
      resetFilters: () => undefined,
      changeColumns: setColumnState,
      changeSort: (field, order) => {
        if (!field || !order) return;
        const next = { field, order };
        currentSortRef.current = next;
        setSort(next);
      },
      selectView: setActiveViewId,
      save: () => true,
      saveAs: ({ name }) => {
        const id = 'saved-' + (views.length + 1);
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
    }),
    [activeViewId, columnState, sort, views],
  );

  const ledgerCapabilities = useMemo(
    () => ({
      pagination: { defaultPageSize: 20, showSizeChanger: false },
      renderExportAction: ({ exportFn, label }: { exportFn: () => Promise<Blob>; label: ReactNode }) => (
        <Button
          onClick={async () => {
            await exportFn();
            setLastAction('已生成当前筛选的委外明细导出');
          }}
        >
          {label}
        </Button>
      ),
    }),
    [],
  );

  const ledgerCapabilitiesForDemo = useMemo<OutsourcingOrderDetailLedgerCapabilities>(
    () => ({
      canViewOrder: canManage,
      lineRoleEnum: lineRoles,
      orderStatusEnum: orderStatuses,
      dateRangePresets: BUSINESS_DATE_RANGE_PRESETS,
      supplierSearchColumnProps: {
        valueType: 'select',
        fieldProps: {
          allowClear: true,
          showSearch: true,
          optionFilterProp: 'label',
          options: [
            { label: '精工表面处理', value: 'supplier-demo' },
            { label: '宏达精密加工', value: 'supplier-demo-2' },
          ],
        },
      },
      materialSearchColumnProps: {
        valueType: 'select',
        fieldProps: {
          allowClear: true,
          options: [
            { label: '精密铝合金支架', value: 'material-aluminum' },
            { label: 'M8 不锈钢螺栓', value: 'material-fastener' },
          ],
        },
      },
      warehouseSearchColumnProps: {
        valueType: 'select',
        fieldProps: {
          allowClear: true,
          options: [
            { label: '原材料仓', value: 'warehouse-raw' },
            { label: '半成品仓', value: 'warehouse-finished' },
          ],
        },
      },
      issueLineCustomFieldSchema: issueSchema,
      receiptCustomFieldSchema: receiptSchema,
      materialUnitLabelMap: { pcs: '件' },
      formatNumber: (value) =>
        value == null ? '-' : new Intl.NumberFormat('zh-CN').format(value),
      formatDateTime: (value) =>
        value ? new Date(value).toLocaleString('zh-CN') : '-',
      formatUnitLabel: (unit, labelMap) => (unit ? labelMap[unit] ?? unit : ''),
      requestDetails: async (query: OutsourcingOrderDetailLedgerQuery) => {
        const keyword = query.keyword?.trim().toLocaleLowerCase();
        const statusSet = new Set(query.statuses ?? (query.status ? [query.status] : []));
        const rows = initialRows.filter((row) => {
          const text = [row.orderNo, row.supplierName, row.materialName, row.batchNo]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase();
          return (
            (!keyword || text.includes(keyword)) &&
            (statusSet.size === 0 || statusSet.has(row.status)) &&
            (!query.supplierId || query.supplierId === row.supplierId) &&
            (!query.detailMaterialId || query.detailMaterialId === row.materialId) &&
            (!query.warehouseId || query.warehouseId === row.warehouseId) &&
            (!query.locationId || query.locationId === row.locationId) &&
            (!query.lineRole || query.lineRole === row.lineRole) &&
            (!query.batchNo || row.batchNo?.includes(query.batchNo)) &&
            (!query.startDate || row.transactionAt.slice(0, 10) >= query.startDate) &&
            (!query.endDate || row.transactionAt.slice(0, 10) <= query.endDate)
          );
        });
        const sortField = query.orderBy;
        const sortedRows = [...rows].sort((left, right) => {
          if (!sortField) return 0;
          const leftValue = String(left[sortField] ?? '');
          const rightValue = String(right[sortField] ?? '');
          const order = leftValue.localeCompare(rightValue, 'zh-CN', { numeric: true });
          return query.orderDir === 'ASC' ? order : -order;
        });
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;
        return {
          list: sortedRows.slice((page - 1) * pageSize, page * pageSize),
          total: sortedRows.length,
          page,
          pageSize,
          summary: {
            itemCount: rows.length,
            outsourcingOrderCount: new Set(rows.map((row) => row.outsourcingOrderId)).size,
            materialCount: new Set(rows.map((row) => row.materialId)).size,
            inputQty: rows.filter((row) => row.lineRole === 'input').reduce((sum, row) => sum + row.qty, 0),
            outputQty: rows.filter((row) => row.lineRole === 'output').reduce((sum, row) => sum + row.qty, 0),
          },
        };
      },
      exportDetails: async (query) =>
        new Blob([JSON.stringify(query, null, 2)], { type: 'application/json' }),
      exportPermission: 'demo:outsourcing-export',
      createPermission: 'demo:outsourcing-create',
      resizable: { enabled: false },
      serverSortFields: [
        'materialName',
        'materialCode',
        'qty',
        'lineRole',
        'orderNo',
        'transactionAt',
        'createdAt',
        'updatedAt',
      ],
      savedView: {
        controller: savedViewController,
        tableActionRef,
        filterFormRef,
      },
      print: {
        canPrint: canManage,
        openPrintBatch: (requests) =>
          setLastAction('已委托打印 ' + requests.length + ' 张单据'),
        printJobActionNode: (
          <Button onClick={() => setLastAction('已打开打印任务入口')}>
            打印任务
          </Button>
        ),
      },
    }),
    [canManage, savedViewController],
  );

  const progressCapabilities = useMemo<OutsourcingProgressDrawerCapabilities>(
    () => ({
      canManage,
      requestSteps: async () => savedStepsRef.current,
      requestReports: async () => ({ list: demoReports }),
      generateQr: async () => ({
        token: 'demo-token-' + qrVersionRef.current,
        expiresAt: '2026-11-22T09:30:00.000Z',
        portalUrl: 'https://demo.example.test/outsourcing-report?token=demo-' + qrVersionRef.current,
      }),
      regenerateQr: async () => {
        const nextVersion = qrVersionRef.current + 1;
        qrVersionRef.current = nextVersion;
        return {
          token: 'demo-token-' + nextVersion,
          expiresAt: '2026-11-22T09:30:00.000Z',
          portalUrl: 'https://demo.example.test/outsourcing-report?token=demo-' + nextVersion,
        };
      },
      saveSteps: async (_orderId: string, steps: OutsourcingOrderStepInput[]) => {
        const nextSteps = steps.map((step, index) => {
          const saved = step.id
            ? savedStepsRef.current.find((item) => item.id === step.id)
            : undefined;
          return {
            id: step.id ?? 'demo-step-' + Date.now() + '-' + index,
            name: step.name,
            plannedQty: step.plannedQty,
            latestProcessedQty: saved?.latestProcessedQty ?? 0,
          };
        });
        savedStepsRef.current = nextSteps;
        setSavedSteps(nextSteps);
      },
      resolveQrUrl: (result) =>
        result.portalUrl ?? 'https://demo.example.test/outsourcing-report?token=' + result.token,
      renderQr: (value, options) => (
        <div
          role="img"
          aria-label={'二维码演示：' + value}
          style={{
            width: options.size,
            height: options.size,
            margin: '0 auto',
            display: 'grid',
            placeItems: 'center',
            border: '8px solid #fff',
            outline: '1px solid #d9d9d9',
            color: '#1677ff',
            background:
              'repeating-conic-gradient(#111 0% 25%, #fff 0% 50%) 50% / 22px 22px',
            fontSize: 12,
            fontWeight: 600,
            textShadow: '0 0 4px #fff, 0 0 4px #fff',
          }}
        >
          QR demo
        </div>
      ),
      formatDateTime: (value) =>
        value ? new Date(value).toLocaleString('zh-CN') : '-',
      notifySuccess: (text) => message.success(text),
    }),
    [canManage, message],
  );

  const ledgerProviderCapabilities = ledgerCapabilities;
  return (
    <SectionCard title="委外明细台账与扫码进度">
      <Typography.Paragraph type="secondary">
        演示保留委外投入/收货明细筛选、保存视图、批量打印与扫码进度步骤。列表 API、权限、候选项、格式化、二维码渲染和消息反馈由宿主能力注入。
      </Typography.Paragraph>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Space wrap>
          <Segmented
            aria-label="委外组件权限状态"
            value={permissions}
            options={[
              { label: '完整权限', value: 'full' },
              { label: '只读权限', value: 'read-only' },
            ]}
            onChange={(value) => setPermissions(value as typeof permissions)}
          />
          <Button onClick={() => setDrawerOpen(true)}>查看委外扫码进度</Button>
        </Space>
        <BusinessUiProvider
          hasPermission={() => canManage}
          documentDetailLedgerCapabilities={ledgerProviderCapabilities}
        >
          <OutsourcingOrderDetailLedger
            capabilities={ledgerCapabilitiesForDemo}
            onViewChange={(view) => setLastAction('切换到 ' + view + ' 视图')}
            onOpenOrder={(id) => setLastAction('打开委外单 ' + id)}
            onCreate={() => setLastAction('已调用宿主新增委外单入口')}
          />
        </BusinessUiProvider>
        <OutsourcingProgressDrawer
          open={drawerOpen}
          order={progressOrder}
          onClose={() => setDrawerOpen(false)}
          capabilities={progressCapabilities}
        />
        <Typography.Text role="status" aria-live="polite">
          {lastAction}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}

/** Independent catalog demo for the outsourcing detail and progress components. */
export function OutsourcingComponentsDemo() {
  return (
    <App>
      <OutsourcingComponentsDemoContent />
    </App>
  );
}
