import { useMemo, useRef } from 'react';
import { SectionCard } from '../../src';
import { StockCountDetailLedger } from '../../src/mes/components/StockCountDetailLedger';
import type { DocumentDetailLedgerSavedViewController } from '../../src/mes/components/DocumentDetailLedgerTable';
import type { DocumentViewBarView } from '../../src/mes/components/DocumentViewBar';
import type {
  StockCountDetailLedgerCapabilities,
  StockCountDetailLedgerResponse,
  StockCountDetailLedgerRow,
} from '../../src/mes/components/stock-count-detail-ledger-types';

const rows: StockCountDetailLedgerRow[] = [
  {
    id: 'count-detail-1',
    createdAt: '2026-11-20T08:30:00.000Z',
    updatedAt: '2026-11-20T09:15:00.000Z',
    orderId: 'count-1',
    order: {
      countNo: 'PD-20261120-001',
      status: 'approved',
      approvedAt: '2026-11-20T09:10:00.000Z',
    },
    warehouse: { name: '一号仓库' },
    location: { pathName: 'A区 / 01排 / 02层' },
    material: {
      id: 'material-1',
      name: '伺服电机',
      code: 'M-1001',
      spec: '750W',
      unit: 'piece',
    },
    bookQty: 16,
    actualQty: 15,
    varianceQty: -1,
    batchNo: 'B-20261120',
    remarks: '外观包装完好',
  },
];

function createResponse(): StockCountDetailLedgerResponse {
  return {
    list: rows,
    total: rows.length,
    page: 1,
    pageSize: 20,
    summary: {
      itemCount: 1,
      stockCountOrderCount: 1,
      materialCount: 1,
      bookQty: 16,
      actualQty: 15,
      varianceQty: -1,
    },
  };
}

export function StockCountDetailLedgerDemo() {
  const tableActionRef = useRef<import('@ant-design/pro-components').ActionType | null>(null);
  const filterFormRef = useRef<import('@ant-design/pro-components').ProFormInstance | undefined>(undefined);
  const savedViewController = useMemo<DocumentDetailLedgerSavedViewController<DocumentViewBarView>>(
    () => ({
      views: [{ id: 'all', name: '全部盘点明细', isDefault: true }],
      loading: false,
      activeViewId: 'all',
      dirty: false,
      selectView: () => undefined,
      save: () => undefined,
      saveAs: () => undefined,
      setDefault: () => undefined,
      rename: () => undefined,
      remove: () => undefined,
      reorder: () => undefined,
      discardAndSwitch: () => undefined,
      saveAndSwitch: () => undefined,
      currentConfig: {
        sort: { field: 'approvedAt', order: 'descend' },
        columns: {},
      },
      currentSortRef: { current: { field: 'approvedAt', order: 'descend' } },
      applyingViewRef: { current: false },
      params: {},
      activeFilterCount: 0,
      beforeSearchSubmit: (values) => values,
      changeColumns: () => undefined,
      changeSort: () => undefined,
    }),
    [],
  );
  const capabilities: StockCountDetailLedgerCapabilities = {
    requestList: async () => createResponse(),
    exportExcel: async () => new Blob(),
    canViewStockCount: true,
    showLocationControl: true,
    statusMap: {
      approved: { text: '已审核', status: 'Success' },
      reversed: { text: '已冲正', status: 'Default' },
    },
    dateRangePresets: [],
    materialUnitLabelMap: { piece: '件' },
    formatNumber: (value) =>
      value == null ? '-' : Number(value).toLocaleString('zh-CN'),
    formatDateTime: (value) => value ?? '-',
    filterColumnProps: {
      material: {
        request: async () => [{ label: '伺服电机 / M-1001', value: 'material-1' }],
        fieldProps: { showSearch: true, filterOption: false },
      },
      warehouse: {
        request: async () => [{ label: '一号仓库', value: 'warehouse-1' }],
        fieldProps: { showSearch: true, filterOption: false },
      },
      location: {
        request: async () => [{ label: 'A区 / 01排 / 02层', value: 'location-1' }],
      },
    },
    documentLineCustomFieldColumns: [],
    materialCustomFieldColumns: [],
    exportPermission: 'stock:list',
    createPermission: 'stock:adjust',
    resizable: {
      enabled: true,
      persistenceKey: 'catalog.stock-count-detail-ledger',
    },
    serverSortFields: ['approvedAt', 'createdAt', 'updatedAt', 'bookQty', 'actualQty', 'varianceQty'],
  };

  return (
    <SectionCard title="库存盘点明细台账">
      <StockCountDetailLedger
        onViewChange={() => undefined}
        onOpenDetail={() => undefined}
        onCreate={() => undefined}
        tableActionRef={tableActionRef}
        filterFormRef={filterFormRef}
        savedViewController={savedViewController}
        rowSelection={{}}
        printJobActionNode={<span>批量打印由 MES 宿主提供</span>}
        capabilities={capabilities}
      />
    </SectionCard>
  );
}
