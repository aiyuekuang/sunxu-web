import { Button, Card, Space, Typography } from 'antd';
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import type { ColumnsState } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { useMemo, useRef, useState, type Key } from 'react';
import { MesUiProvider } from '../../src/mes';
import { InternalIssueDetailLedger } from '../../src/mes/components/InternalIssueDetailLedger';
import { ProductionReceiptDetailLedger } from '../../src/mes/components/ProductionReceiptDetailLedger';
import { PurchaseInquiryDetailLedger } from '../../src/mes/components/PurchaseInquiryDetailLedger';
import { PurchaseRequisitionDetailLedger } from '../../src/mes/components/PurchaseRequisitionDetailLedger';
import type { DocumentDetailLedgerSavedViewController } from '../../src/mes/components/DocumentDetailLedgerTable';
import type { DocumentViewBarView } from '../../src/mes/components/DocumentViewBar';
import type { MesUiProviderProps } from '../../src/mes/MesUiProvider';
import type {
  DetailLedgerBatchPrintCapabilities,
  DetailLedgerFormatCapabilities,
  InternalIssueDetailLedgerRow,
  PurchaseInquiryDetailLedgerRow,
  PurchaseRequisitionDetailLedgerRow,
  ProductionReceiptDetailLedgerRow,
} from '../../src/mes/components/detail-ledger-components-types';
import type { MesStatusEnum } from '../../src/mes/components/StatusDisplay';

type DemoView = DocumentViewBarView;

const formatNumber = (value: number | string | null | undefined): string => {
  if (value == null || value === '') return '-';
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 4 }).format(number)
    : String(value);
};

const demoFormat: DetailLedgerFormatCapabilities = {
  formatNumber,
  formatQty: formatNumber,
  formatDate: (value) => value?.slice(0, 10) ?? '-',
  formatDateTime: (value) => value?.replace('T', ' ').slice(0, 16) ?? '-',
  unitLabelMap: { pcs: '件', kg: '千克', set: '套' },
  formatUnitLabel: (value, labels) => (value ? labels[value] ?? value : ''),
};

const inquiryStatus: MesStatusEnum = {
  draft: { text: '草稿', status: 'Default' },
  sent: { text: '已发出', status: 'Processing' },
  quoted: { text: '已报价', status: 'Success' },
};

const requisitionStatus: MesStatusEnum = {
  pending: { text: '待审批', status: 'Warning' },
  approved: { text: '已批准', status: 'Success' },
  closed: { text: '已关闭', status: 'Default' },
};

const requisitionSource: MesStatusEnum = {
  manual: { text: '手工申请', status: 'Default' },
  production: { text: '生产需求', status: 'Processing' },
};

const issueType: MesStatusEnum = {
  production: { text: '生产领用', status: 'Processing' },
  maintenance: { text: '维修领用', status: 'Warning' },
};

const issueStatus: MesStatusEnum = {
  completed: { text: '已完成', status: 'Success' },
  cancelled: { text: '已取消', status: 'Default' },
};

const receiptStatus: MesStatusEnum = {
  received: { text: '已入库', status: 'Success' },
  reversed: { text: '已冲正', status: 'Error' },
};

const material = {
  id: 'material-demo',
  name: '精密铝合金支架',
  code: 'AL-BR-018',
  spec: '120 × 40 mm',
  unit: 'pcs',
  customValues: { surface: '阳极氧化' },
};

const inquiryRows: PurchaseInquiryDetailLedgerRow[] = [
  {
    id: 'inquiry-line-1',
    inquiryId: 'inquiry-1',
    material,
    purchaseUnit: 'pcs',
    inquiryQty: 24,
    orderedQty: 12,
    inquiry: {
      inquiryNo: 'XJ-2026-018',
      status: 'sent',
      requisition: { prNo: 'SQ-2026-012' },
    },
    requiredDate: '2026-12-05',
    createdAt: '2026-11-18T09:30:00.000Z',
    updatedAt: '2026-11-20T14:20:00.000Z',
    remarks: '首批试制用',
  },
  {
    id: 'inquiry-line-2',
    inquiryId: 'inquiry-2',
    temporaryItemName: '定制耐热密封垫',
    temporaryItemCode: 'TMP-SEAL-02',
    temporaryItemSpec: '外径 80 mm',
    inquiryQty: 60,
    orderedQty: 0,
    inquiry: { inquiryNo: 'XJ-2026-019', status: 'draft' },
    createdAt: '2026-11-19T10:00:00.000Z',
    updatedAt: '2026-11-19T10:00:00.000Z',
    remarks: '临时询价品',
  },
];

const requisitionRows: PurchaseRequisitionDetailLedgerRow[] = [
  {
    id: 'req-line-1',
    lineNo: 1,
    requiredQty: 24,
    orderedQty: 12,
    material,
    supplier: { name: '华东标准件供应商' },
    suggestedPurchaseDate: '2026-11-24',
    expectedArrivalDate: '2026-12-01',
    createdAt: '2026-11-18T09:30:00.000Z',
    updatedAt: '2026-11-20T14:20:00.000Z',
    requisition: {
      id: 'requisition-1',
      prNo: 'SQ-2026-012',
      status: 'approved',
      sourceType: 'production',
      requestedBy: { realName: '王工' },
      approvedBy: { realName: '李经理' },
    },
  },
  {
    id: 'req-line-2',
    lineNo: 2,
    requiredQty: 60,
    orderedQty: 0,
    material: { name: '耐热密封垫', code: 'SEAL-080', spec: '80 mm', unit: 'pcs' },
    supplier: { name: '未指定' },
    expectedArrivalDate: null,
    createdAt: '2026-11-19T10:00:00.000Z',
    updatedAt: '2026-11-19T10:00:00.000Z',
    requisition: {
      id: 'requisition-1',
      prNo: 'SQ-2026-012',
      status: 'approved',
      sourceType: 'production',
      requestedBy: { username: 'buyer' },
    },
  },
];

const internalIssueRows: InternalIssueDetailLedgerRow[] = [
  {
    id: 'issue-line-1',
    orderId: 'issue-1',
    qty: 12,
    material,
    order: {
      issueNo: 'LY-2026-031',
      issueType: 'production',
      status: 'completed',
      completedAt: '2026-11-20T08:45:00.000Z',
      requester: { realName: '王工' },
      department: { name: '生产一部' },
    },
    warehouse: { name: '原料仓' },
    location: { pathName: '原料仓 / A区 / 01-02' },
    batchNo: 'LOT-2026-018',
    createdAt: '2026-11-20T08:30:00.000Z',
    updatedAt: '2026-11-20T08:45:00.000Z',
    remarks: '工单 WO-2026-088',
  },
];

const productionReceiptRows: ProductionReceiptDetailLedgerRow[] = [
  {
    id: 'receipt-line-1',
    receiptOrderId: 'receipt-1',
    qty: 24,
    displayQty: 2,
    displayUnit: 'set',
    material,
    receiptOrder: {
      receiptNo: 'SC-RK-2026-007',
      status: 'received',
      confirmedAt: '2026-11-21T09:15:00.000Z',
      workOrder: { orderNo: 'WO-2026-088' },
      warehouse: { name: '成品仓' },
      storageLocationSnapshot: '成品仓 / B区 / 02-01',
    },
    location: { pathName: '成品仓 / B区 / 02-01' },
    batchNo: 'FG-2026-088-01',
    packageNo: 'PK-2026-031',
    createdAt: '2026-11-21T09:10:00.000Z',
    updatedAt: '2026-11-21T09:15:00.000Z',
  },
];

function useSavedViewController(
  defaultField: string,
  defaultOrder: 'ascend' | 'descend',
): DocumentDetailLedgerSavedViewController<DemoView> {
  const [activeViewId, setActiveViewId] = useState('all');
  const [views, setViews] = useState<DemoView[]>([
    { id: 'all', name: '全部明细', isDefault: true },
    { id: 'recent', name: '最近更新' },
  ]);
  const [sort, setSort] = useState<{
    field: string;
    order: 'ascend' | 'descend';
  }>({ field: defaultField, order: defaultOrder });
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
      params: {},
      beforeSearchSubmit: (values: Record<string, unknown>) => values,
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
    }),
    [activeViewId, columnState, sort, views],
  );
}

function useDemoBatchPrint<TRow extends object>(
  label: string,
  onPrint: (count: number) => void,
): DetailLedgerBatchPrintCapabilities<TRow> {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  return useMemo(
    () => ({
      rowSelection: {
        selectedRowKeys,
        preserveSelectedRowKeys: true,
        onChange: (keys) => setSelectedRowKeys(keys),
      },
      tableAlertOptionRender: ({ onCleanSelected }) =>
        selectedRowKeys.length ? (
          <Button
            type="link"
            onClick={() => {
              onPrint(selectedRowKeys.length);
              onCleanSelected?.();
              setSelectedRowKeys([]);
            }}
          >
            {label}（{selectedRowKeys.length}）
          </Button>
        ) : null,
    }),
    [label, onPrint, selectedRowKeys],
  );
}

function selectFilter<TRow extends object>(
  options: { label: string; value: string }[],
): Partial<ProColumns<TRow>> {
  return {
    valueType: 'select',
    fieldProps: { options, showSearch: true, optionFilterProp: 'label' },
  };
}

export function DocumentDetailLedgersDemo() {
  const [lastAction, setLastAction] = useState('尚未执行操作');
  const exportCapabilities = useMemo<
    NonNullable<MesUiProviderProps['documentDetailLedgerCapabilities']>
  >(
    () => ({
      pagination: { defaultPageSize: 10 },
      renderExportAction: ({ exportFn, label }) => (
        <Button
          onClick={() => {
            void exportFn().then(() => setLastAction('已生成当前筛选的导出文件'));
          }}
        >
          {label}
        </Button>
      ),
    }),
    [],
  );

  return (
    <MesUiProvider
      hasPermission={(permission) => permission.startsWith('demo:')}
      documentDetailLedgerCapabilities={exportCapabilities}
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary">
          四个账页以独立 UI 组件呈现。列表请求、导出、权限结果、路由、选择器、字典、格式、自定义列、保存视图和打印动作通过宿主能力注入。
        </Typography.Paragraph>
        <InquiryDemo onAction={setLastAction} />
        <RequisitionDemo onAction={setLastAction} />
        <InternalIssueDemo onAction={setLastAction} />
        <ProductionReceiptDemo onAction={setLastAction} />
        <Typography.Text role="status" aria-live="polite">
          {lastAction}
        </Typography.Text>
      </Space>
    </MesUiProvider>
  );
}

function InquiryDemo({ onAction }: { onAction: (message: string) => void }) {
  const saved = useSavedViewController('createdAt', 'descend');
  const tableActionRef = useRef<ActionType | null>(null);
  const filterFormRef = useRef<ProFormInstance | undefined>(undefined);
  const batchPrint = useDemoBatchPrint<PurchaseInquiryDetailLedgerRow>(
    '批量打印',
    (count) => onAction(`已请求打印 ${count} 条询价明细`),
  );
  return (
    <Card title="采购询价明细">
      <PurchaseInquiryDetailLedger
        capabilities={{
          requestList: async () => ({
            list: inquiryRows,
            total: inquiryRows.length,
            summary: {
              inquiryCount: 2,
              itemCount: 2,
              materialCount: 2,
              inquiryQty: 84,
              orderedQty: 12,
            },
          }),
          exportExcel: async (query) => new Blob([JSON.stringify(query)]),
          canExport: true,
          exportPermission: 'demo:inquiry-export',
          exportFileName: '采购询价明细.xlsx',
          canCreate: true,
          createPermission: 'demo:inquiry-create',
          canViewInquiry: true,
          statusEnum: inquiryStatus,
          supplierFilterColumn: selectFilter([{ label: '华东标准件供应商', value: 'supplier-1' }]),
          materialFilterColumn: selectFilter([{ label: 'AL-BR-018 - 精密铝合金支架', value: 'material-demo' }]),
          dateRangeFieldProps: {
            presets: [{ label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] }],
          },
          format: demoFormat,
          resizable: { enabled: false },
          serverSortFields: ['createdAt', 'inquiryQty', 'orderedQty'],
          batchPrint,
        }}
        onCreate={() => onAction('已调用采购询价新增入口')}
        onOpenInquiry={(id) => onAction(`打开询价单 ${id}`)}
        onViewChange={(view) => onAction(`切换到 ${view} 视图`)}
        tableActionRef={tableActionRef}
        filterFormRef={filterFormRef}
        savedViewController={saved}
      />
    </Card>
  );
}

function RequisitionDemo({ onAction }: { onAction: (message: string) => void }) {
  const saved = useSavedViewController('businessPriority', 'ascend');
  const tableActionRef = useRef<ActionType | null>(null);
  const filterFormRef = useRef<ProFormInstance | undefined>(undefined);
  return (
    <Card title="采购申请明细">
      <PurchaseRequisitionDetailLedger
        capabilities={{
          requestList: async () => ({
            list: requisitionRows,
            total: requisitionRows.length,
            summary: {
              requisitionCount: 1,
              itemCount: 2,
              requiredQty: 84,
              orderedQty: 12,
              remainingQty: 72,
              missingExpectedArrivalDateCount: 1,
            },
          }),
          exportExcel: async (query) => new Blob([JSON.stringify(query)]),
          canExport: true,
          exportPermission: 'demo:requisition-export',
          exportFileName: '采购申请明细.xlsx',
          canCreate: true,
          createPermission: 'demo:requisition-create',
          canViewRequisition: true,
          statusEnum: requisitionStatus,
          sourceTypeEnum: requisitionSource,
          supplierFilterColumn: selectFilter([{ label: '华东标准件供应商', value: 'supplier-1' }]),
          materialFilterColumn: selectFilter([{ label: 'AL-BR-018 - 精密铝合金支架', value: 'material-demo' }]),
          dateRangeFieldProps: {},
          format: demoFormat,
          resizable: { enabled: false },
          serverSortFields: ['businessPriority', 'requiredQty', 'orderedQty'],
          materialCustomFieldColumns: [
            { title: '物料表面处理', dataIndex: 'surface', search: false },
          ],
          renderDocumentActions: (_row, actions) => (
            <Button type="link" size="small" onClick={actions.onViewPurchaseOrders}>
              查看采购订单
            </Button>
          ),
        }}
        initialStatuses={['approved']}
        onCreate={() => onAction('已调用采购申请新增入口')}
        onOpenRequisition={(id) => onAction(`打开申请单 ${id}`)}
        onViewPurchaseOrders={(id) => onAction(`查看申请 ${id} 关联的采购订单`)}
        onViewChange={(view) => onAction(`切换到 ${view} 视图`)}
        tableActionRef={tableActionRef}
        filterFormRef={filterFormRef}
        savedViewController={saved}
      />
    </Card>
  );
}

function InternalIssueDemo({ onAction }: { onAction: (message: string) => void }) {
  const saved = useSavedViewController('completedAt', 'descend');
  const tableActionRef = useRef<ActionType | null>(null);
  const filterFormRef = useRef<ProFormInstance | undefined>(undefined);
  const batchPrint = useDemoBatchPrint<InternalIssueDetailLedgerRow>(
    '批量打印',
    (count) => onAction(`已请求打印 ${count} 条内部领用明细`),
  );
  return (
    <Card title="内部领用明细">
      <InternalIssueDetailLedger
        capabilities={{
          requestList: async () => ({
            list: internalIssueRows,
            total: internalIssueRows.length,
            summary: { issueOrderCount: 1, itemCount: 1, materialCount: 1, qty: 12 },
          }),
          exportExcel: async (query) => new Blob([JSON.stringify(query)]),
          canExport: true,
          exportPermission: 'demo:internal-issue-export',
          exportFileName: '内部领用明细.xlsx',
          canCreate: true,
          createPermission: 'demo:internal-issue-create',
          canViewInternalIssue: true,
          issueStatusEnum: issueStatus,
          issueTypeEnum: issueType,
          requesterFilterColumn: selectFilter([{ label: '王工', value: 'user-1' }]),
          departmentFilterColumn: selectFilter([{ label: '生产一部', value: 'dept-1' }]),
          equipmentFilterColumn: selectFilter([{ label: 'CNC-08', value: 'equipment-8' }]),
          workOrderFilterColumn: selectFilter([{ label: 'WO-2026-088', value: 'work-order-88' }]),
          materialFilterColumn: selectFilter([{ label: 'AL-BR-018 - 精密铝合金支架', value: 'material-demo' }]),
          warehouseFilterColumn: selectFilter([{ label: '原料仓', value: 'warehouse-1' }]),
          dateRangeFieldProps: {
            presets: [{ label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] }],
          },
          format: demoFormat,
          resizable: { enabled: false },
          serverSortFields: ['completedAt', 'qty'],
          batchPrint,
          lineCustomFieldColumns: [
            { title: '领用批次备注', dataIndex: 'lineBatchNote', search: false },
          ],
        }}
        onOpenDetail={(id) => onAction(`打开内部领用单 ${id}`)}
        onCreate={() => onAction('已调用内部领用新增入口')}
        onViewChange={(view) => onAction(`切换到 ${view} 视图`)}
        tableActionRef={tableActionRef}
        filterFormRef={filterFormRef}
        savedViewController={saved}
      />
    </Card>
  );
}

function ProductionReceiptDemo({ onAction }: { onAction: (message: string) => void }) {
  const saved = useSavedViewController('confirmedAt', 'descend');
  const tableActionRef = useRef<ActionType | null>(null);
  const filterFormRef = useRef<ProFormInstance | undefined>(undefined);
  const batchPrint = useDemoBatchPrint<ProductionReceiptDetailLedgerRow>(
    '批量打印',
    (count) => onAction(`已请求打印 ${count} 条生产入库明细`),
  );
  return (
    <Card title="生产入库明细">
      <ProductionReceiptDetailLedger
        capabilities={{
          requestList: async () => ({
            list: productionReceiptRows,
            total: productionReceiptRows.length,
            summary: { receiptOrderCount: 1, itemCount: 1, materialCount: 1, receiptQty: 24 },
          }),
          exportExcel: async (query) => new Blob([JSON.stringify(query)]),
          canExport: true,
          exportPermission: 'demo:production-receipt-export',
          exportFileName: '生产入库单明细.xlsx',
          canViewProductionReceipt: true,
          statusEnum: receiptStatus,
          materialFilterColumn: selectFilter([{ label: 'AL-BR-018 - 精密铝合金支架', value: 'material-demo' }]),
          warehouseFilterColumn: selectFilter([{ label: '成品仓', value: 'warehouse-2' }]),
          locationFilterColumn: {
            request: async () => [{ label: '成品仓 / B区 / 02-01', value: 'location-1' }],
            fieldProps: { fetchDataOnSearch: true },
          },
          dateRangeFieldProps: {
            presets: [{ label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] }],
          },
          format: demoFormat,
          resizable: { enabled: false },
          serverSortFields: ['confirmedAt', 'qty', 'displayQty'],
          batchPrint,
          lineCustomFieldColumns: [
            { title: '工艺批次说明', dataIndex: 'processBatchNote', search: false },
          ],
        }}
        onOpenReceipt={(receiptNo) => onAction(`打开生产入库单 ${receiptNo}`)}
        onViewChange={(view) => onAction(`切换到 ${view} 视图`)}
        tableActionRef={tableActionRef}
        filterFormRef={filterFormRef}
        savedViewController={saved}
      />
    </Card>
  );
}
