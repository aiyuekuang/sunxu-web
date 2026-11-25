import { useMemo, useRef, useState } from 'react';
import type { ActionType, ProFormInstance } from '@ant-design/pro-components';
import type { ColumnsState } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { App, Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  MesUiProvider,
  type DocumentDetailLedgerSavedViewController,
  type DocumentViewBarView,
  type MesDocumentDetailLedgerCapabilities,
  type StockConversionDetailLedgerCapabilities,
  type StockConversionDetailLedgerItem,
} from '../../src/mes';
import { StockConversionDetailLedger } from '../../src/mes/components/StockConversionDetailLedger';

type DemoView = DocumentViewBarView;

const demoRows: StockConversionDetailLedgerItem[] = [
  {
    id: 'conversion-line-1',
    lineRole: 'input',
    materialId: 'material-1',
    materialName: '铝型材原料',
    materialCode: 'MAT-AL-001',
    materialSpec: '6061-T6',
    unit: 'pcs',
    qty: 2,
    warehouseId: 'warehouse-1',
    warehouseName: '原料仓',
    locationId: 'location-1',
    locationName: 'A区 / 01-01',
    batchNo: 'LOT-2026-018',
    conversionOrderId: 'conversion-order-1',
    conversionNo: 'CV-2026-0018',
    conversionType: 'disassemble',
    status: 'converted',
    sourceNo: 'RCV-2026-0730',
    transactionAt: '2026-11-20T08:30:00+08:00',
    createdAt: '2026-11-20T08:00:00+08:00',
    updatedAt: '2026-11-20T08:30:00+08:00',
    customValues: { sourceGrade: 'A' },
  },
  {
    id: 'conversion-line-2',
    lineRole: 'output',
    materialId: 'material-2',
    materialName: '铝型材成品段',
    materialCode: 'MAT-AL-002',
    materialSpec: '300 mm',
    unit: 'pcs',
    qty: 6,
    warehouseId: 'warehouse-2',
    warehouseName: '半成品仓',
    locationId: 'location-2',
    locationName: 'B区 / 03-04',
    batchNo: 'LOT-2026-019',
    conversionOrderId: 'conversion-order-1',
    conversionNo: 'CV-2026-0018',
    conversionType: 'disassemble',
    status: 'converted',
    sourceNo: 'RCV-2026-0730',
    transactionAt: '2026-11-20T08:30:00+08:00',
    createdAt: '2026-11-20T08:00:00+08:00',
    updatedAt: '2026-11-20T08:30:00+08:00',
    customValues: { outputGrade: 'A' },
  },
];

const lineRoleEnum = {
  input: { text: '投入', status: 'Processing' },
  output: { text: '产出', status: 'Success' },
} as const;
const conversionTypeEnum = {
  disassemble: { text: '拆解' },
  repack: { text: '重新包装' },
  material_change: { text: '材料变更' },
  combine: { text: '组合' },
  rework_conversion: { text: '返工转换' },
} as const;
const statusEnum = {
  draft: { text: '草稿', status: 'Default' },
  pending_approval: { text: '待审批', status: 'Warning' },
  approved: { text: '已审批', status: 'Processing' },
  converted: { text: '已转换', status: 'Success' },
  reversed: { text: '已冲销', status: 'Error' },
  cancelled: { text: '已取消', status: 'Default' },
} as const;

function StockConversionDetailLedgerDemoContent() {
  const [permissions, setPermissions] = useState<'full' | 'read-only'>('full');
  const [activeViewId, setActiveViewId] = useState('all');
  const [views, setViews] = useState<DemoView[]>([
    { id: 'all', name: '全部明细', isDefault: true },
    { id: 'converted', name: '已转换' },
  ]);
  const [sort, setSort] = useState<{
    field: string;
    order: 'ascend' | 'descend';
  }>({
    field: 'transactionAt',
    order: 'descend',
  });
  const [columnState, setColumnState] = useState<Record<string, ColumnsState>>(
    {},
  );
  const [lastAction, setLastAction] = useState('等待台账操作');
  const currentSortRef = useRef(sort);
  currentSortRef.current = sort;
  const applyingViewRef = useRef(false);
  const tableActionRef = useRef<ActionType | null>(null);
  const filterFormRef = useRef<ProFormInstance | undefined>(undefined);

  const savedViewController = useMemo<
    DocumentDetailLedgerSavedViewController<DemoView>
  >(
    () => ({
      views,
      loading: false,
      activeViewId,
      dirty: false,
      currentConfig: { sort, columns: columnState },
      currentSortRef,
      applyingViewRef,
      params: activeViewId === 'converted' ? { status: 'converted' } : {},
      activeFilterCount: activeViewId === 'converted' ? 1 : 0,
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
          current.map((item) =>
            item.id === view.id ? { ...item, name } : item,
          ),
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

  const capabilities = useMemo<StockConversionDetailLedgerCapabilities>(
    () => ({
      requestDetailList: async (query) => {
        const rows = demoRows.filter((row) =>
          query.status ? row.status === query.status : true,
        );
        return {
          list: rows,
          total: rows.length,
          summary: {
            itemCount: rows.length,
            conversionOrderCount: 1,
            materialCount: 2,
            inputQty: 2,
            outputQty: 6,
          },
        };
      },
      exportDetailExcel: async (query) =>
        new Blob([JSON.stringify(query, null, 2)], {
          type: 'application/json',
        }),
      exportPermission: 'demo:stock-conversion:export',
      createPermission: 'demo:stock-conversion:create',
      canViewStockConversion: permissions === 'full',
      savedViewController,
      requestMaterialOptions: async () => [
        { label: '铝型材原料', value: 'material-1', code: 'MAT-AL-001' },
        { label: '铝型材成品段', value: 'material-2', code: 'MAT-AL-002' },
      ],
      requestWarehouseOptions: async () => [
        { label: '原料仓', value: 'warehouse-1' },
        { label: '半成品仓', value: 'warehouse-2' },
      ],
      requestStockLocationOptions: async () => [
        { label: 'A区 / 01-01', value: 'location-1' },
        { label: 'B区 / 03-04', value: 'location-2' },
      ],
      materialUnitLabelMap: { pcs: '件' },
      lineRoleEnum,
      conversionTypeEnum,
      statusEnum,
      inputLineSchema: {
        schemaVersion: 1,
        fields: [
          {
            fieldKey: 'sourceGrade',
            label: '来源等级',
            fieldKind: 'text',
            dataType: 'text',
            sortOrder: 1,
            displayJson: { showInList: true, sortOrder: 1 },
          },
        ],
      },
      outputLineSchema: {
        schemaVersion: 1,
        fields: [
          {
            fieldKey: 'outputGrade',
            label: '产出等级',
            fieldKind: 'text',
            dataType: 'text',
            sortOrder: 1,
            displayJson: { showInList: true, sortOrder: 1 },
          },
        ],
      },
      dateRangePresets: [],
      resizable: { enabled: false },
      serverSortFields: [
        'materialName',
        'materialCode',
        'qty',
        'lineRole',
        'conversionNo',
        'transactionAt',
        'createdAt',
        'updatedAt',
      ],
      formatNumber: (value) =>
        value == null ? '-' : new Intl.NumberFormat('zh-CN').format(value),
      formatUnitLabel: (unit, labelMap) =>
        unit?.trim() ? labelMap[unit.trim()] ?? unit.trim() : '',
      formatDateTime: (value) => {
        if (!value) return '';
        const date = dayjs(value);
        return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : '-';
      },
    }),
    [permissions, savedViewController],
  );

  const ledgerCapabilities = useMemo<MesDocumentDetailLedgerCapabilities>(
    () => ({
      pagination: { defaultPageSize: 20, showSizeChanger: false },
      renderExportAction: ({ exportFn, label }) => (
        <Button
          onClick={async () => {
            await exportFn();
            setLastAction('已生成当前筛选的导出文件');
          }}
        >
          {label}
        </Button>
      ),
    }),
    [],
  );

  return (
    <SectionCard title="库存转换明细台账">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary">
          覆盖投入/产出行、动态自定义字段、筛选、个人视图、权限链接和汇总；请求、字典、权限与路由由宿主提供。
        </Typography.Paragraph>
        <Button
          onClick={() =>
            setPermissions((current) =>
              current === 'full' ? 'read-only' : 'full',
            )
          }
        >
          当前为{permissions === 'full' ? '完整权限' : '只读权限'}，切换权限
        </Button>
        <App>
          <MesUiProvider
            hasPermission={() => permissions === 'full'}
            documentDetailLedgerCapabilities={ledgerCapabilities}
          >
            <StockConversionDetailLedger
              capabilities={capabilities}
              tableActionRef={tableActionRef}
              filterFormRef={filterFormRef}
              onViewChange={(view) => setLastAction(`已切换至${view === 'orders' ? '单据' : '明细'}视图`)}
              onOpenDetail={(id) => setLastAction(`宿主将打开单据 ${id}`)}
              onCreate={() => setLastAction('宿主将打开库存转换单创建表单')}
            />
          </MesUiProvider>
        </App>
        <Typography.Text role="status" aria-live="polite">
          {lastAction}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}

export function StockConversionDetailLedgerDemo() {
  return <StockConversionDetailLedgerDemoContent />;
}
