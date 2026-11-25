import { useMemo, useRef, useState } from 'react';
import type { ProColumns } from '@ant-design/pro-components';
import type { ColumnsState } from '@ant-design/pro-components';
import { Button, Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  DocumentDetailLedgerTable,
  MesUiProvider,
  type DocumentDetailLedgerSavedViewController,
  type DocumentViewBarView,
  type MesDocumentDetailLedgerCapabilities,
} from '../../src/mes';

type DemoLedgerRow = {
  id: string;
  documentNo: string;
  materialName: string;
  quantity: number;
  status: 'active' | 'closed';
};

type DemoLedgerQuery = {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  status?: string;
  keyword?: string;
};

type DemoView = DocumentViewBarView;

const demoRows: DemoLedgerRow[] = [
  {
    id: 'ledger-1',
    documentNo: 'PUR-2026-0018',
    materialName: '6061 铝型材',
    quantity: 24,
    status: 'active',
  },
  {
    id: 'ledger-2',
    documentNo: 'PUR-2026-0019',
    materialName: '标准包装箱',
    quantity: 60,
    status: 'closed',
  },
  {
    id: 'ledger-3',
    documentNo: 'PUR-2026-0020',
    materialName: 'M8 不锈钢螺栓',
    quantity: 320,
    status: 'active',
  },
];

const demoColumns: ProColumns<DemoLedgerRow>[] = [
  { title: '单据编号', dataIndex: 'documentNo', sorter: true },
  { title: '物料', dataIndex: 'materialName' },
  { title: '数量', dataIndex: 'quantity', sorter: true, align: 'right' },
  {
    title: '状态',
    dataIndex: 'status',
    valueType: 'select',
    valueEnum: { active: { text: '进行中' }, closed: { text: '已完成' } },
  },
];

export function DocumentDetailLedgerTableDemo() {
  const [mode, setMode] = useState<'light' | 'saved'>('saved');
  const [permissions, setPermissions] = useState<'full' | 'read-only'>('full');
  const [activeViewId, setActiveViewId] = useState('active');
  const [views, setViews] = useState<DemoView[]>([
    { id: 'active', name: '进行中', isDefault: true },
    { id: 'all', name: '全部记录' },
  ]);
  const [sort, setSort] = useState<{
    field: string;
    order: 'ascend' | 'descend';
  }>({ field: 'documentNo', order: 'ascend' });
  const [columnState, setColumnState] = useState<Record<string, ColumnsState>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [lastAction, setLastAction] = useState('尚未执行操作');
  const [responseCount, setResponseCount] = useState(0);
  const currentSortRef = useRef(sort);
  currentSortRef.current = sort;
  const applyingViewRef = useRef(false);

  const savedViewController = useMemo<
    DocumentDetailLedgerSavedViewController<DemoView>
  >(
    () => ({
      views,
      loading: false,
      activeViewId,
      dirty: false,
      activeFilterCount: activeViewId === 'active' ? 1 : 0,
      currentConfig: { sort, columns: columnState },
      currentSortRef,
      applyingViewRef,
      params: activeViewId === 'active' ? { status: 'active' } : {},
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
    <SectionCard title="单据明细台账表格">
      <Typography.Paragraph type="secondary">
        对比轻量筛选与个人视图台账；请求、排序构造、导出数据、创建动作和权限由宿主提供，个人视图控制器由页面注入。
      </Typography.Paragraph>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Space wrap>
          <Segmented
            aria-label="台账筛选模式"
            value={mode}
            options={[
              { label: '轻量筛选', value: 'light' },
              { label: '个人视图', value: 'saved' },
            ]}
            onChange={(value) => setMode(value as typeof mode)}
          />
          <Segmented
            aria-label="台账操作权限"
            value={permissions}
            options={[
              { label: '完整权限', value: 'full' },
              { label: '只读', value: 'read-only' },
            ]}
            onChange={(value) => setPermissions(value as typeof permissions)}
          />
        </Space>
        <MesUiProvider
          hasPermission={() => permissions === 'full'}
          documentDetailLedgerCapabilities={ledgerCapabilities}
        >
          <DocumentDetailLedgerTable<DemoLedgerRow, DemoLedgerQuery, { list: DemoLedgerRow[]; total: number }, DemoView>
            headerTitle="采购收货明细"
            initialQuery={{ page: 1, pageSize: 20, orderBy: 'documentNo', orderDir: 'ASC' }}
            apiFn={async (rawQuery) => {
              const query = rawQuery as unknown as DemoLedgerQuery;
              const keyword = query.keyword?.trim().toLocaleLowerCase();
              const rows = demoRows.filter((row) => {
                const statusMatches =
                  !query.status || row.status === query.status;
                const keywordMatches =
                  !keyword ||
                  `${row.documentNo} ${row.materialName}`
                    .toLocaleLowerCase()
                    .includes(keyword);
                return statusMatches && keywordMatches;
              });
              setResponseCount(rows.length);
              return { list: rows, total: rows.length };
            }}
            buildQuery={(params, sortQuery) =>
              ({ ...params, ...sortQuery }) as DemoLedgerQuery
            }
            columns={demoColumns}
            exportFn={async (query) =>
              new Blob([JSON.stringify(query)], { type: 'application/json' })
            }
            exportFileName="采购收货明细.json"
            exportPermission="demo:ledger-export"
            createPermission="demo:receipt-create"
            onCreate={() => setLastAction('已调用宿主新增单据入口')}
            resizable={{ enabled: false }}
            materialColumnPriority={false}
            serverSortFields={['documentNo', 'quantity']}
            scrollX={960}
            showHeaderTitle
            toolbarExtra={<Typography.Text type="secondary">当前结果区</Typography.Text>}
            initialFilters={mode === 'light' ? { status: 'active' } : undefined}
            savedView={
              mode === 'saved' ? { controller: savedViewController } : undefined
            }
            lightFilter={{
              formValuesFromFilters: (filters) => filters,
            }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            tableAlertOptionRender={() => (
              <Button onClick={() => setLastAction(`选中 ${selectedRowKeys.length} 行`)}>
                查看选择结果
              </Button>
            )}
            onResponse={(response) => setResponseCount(response.total)}
            footer={<Typography.Text>{responseCount} 行</Typography.Text>}
          />
        </MesUiProvider>
        <Typography.Text role="status" aria-live="polite">
          {lastAction}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
