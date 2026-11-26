import { useMemo, useRef, useState } from 'react';
import type { ActionType, ProFormInstance } from '@ant-design/pro-components';
import type { ColumnsState } from '@ant-design/pro-components';
import { Button, Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  BusinessInvoiceDetailLedger,
  BusinessInvoiceOpeningImportDrawer,
  MesUiProvider,
  type BusinessInvoiceDetailQuery,
  type BusinessInvoiceDetailRow,
  type BusinessInvoiceDetailView,
  type BusinessInvoiceMode,
  type DocumentDetailLedgerSavedViewController,
  type MesDocumentDetailLedgerCapabilities,
} from '../../src/business';

const invoiceRows: BusinessInvoiceDetailRow[] = [
  {
    id: 'line-1',
    createdAt: '2026-11-01T09:10:00+08:00',
    updatedAt: '2026-11-01T09:10:00+08:00',
    invoiceId: 'invoice-1',
    lineNo: 1,
    materialId: 'material-1',
    itemName: '6061 铝型材',
    itemCode: 'MAT-AL-001',
    itemSpec: '20 × 30 × 2 mm',
    unit: 'piece',
    quantity: 24,
    documentNo: 'CGFP-2026-0018',
    invoiceNo: '12345678901234567890',
    invoiceDate: '2026-11-01',
    status: 'confirmed',
    category: 'blue',
    sourceMode: 'standard',
    matchStatus: 'matched',
    partnerName: '华东铝业有限公司',
    externalDocumentNo: 'CG-2026-0132',
    unitPrice: 12.5,
    amountWithoutTax: 300,
    taxRate: 13,
    taxAmount: 39,
    totalAmount: 339,
    customValues: { batchTag: '铝材批次' },
  },
  {
    id: 'line-2',
    createdAt: '2026-11-02T13:45:00+08:00',
    updatedAt: '2026-11-02T13:45:00+08:00',
    invoiceId: 'invoice-2',
    lineNo: 1,
    materialId: 'material-2',
    itemName: '委外加工费',
    itemCode: 'OUT-001',
    unit: 'time',
    quantity: 2,
    documentNo: 'CGFP-2026-0021',
    invoiceDate: '2026-11-02',
    status: 'draft',
    category: 'red',
    sourceMode: 'opening_unmatched',
    matchStatus: 'unmatched',
    partnerName: '精工制造厂',
    externalDocumentNo: '旧系统-PO-884',
  },
];

const statusEnum = {
  draft: { text: '草稿', status: 'Default' },
  confirmed: { text: '已确认', status: 'Success' },
  cancelled: { text: '已取消', status: 'Error' },
};

const categoryEnum = {
  blue: { text: '蓝字', status: 'Processing' },
  red: { text: '红字', status: 'Error' },
};

const matchStatusEnum = {
  not_applicable: { text: '不适用', status: 'Default' },
  unmatched: { text: '未匹配', status: 'Warning' },
  partial_matched: { text: '部分匹配', status: 'Processing' },
  matched: { text: '已匹配', status: 'Success' },
};

const demoViews: BusinessInvoiceDetailView[] = [
  { id: 'all', name: '全部明细', isDefault: true },
  { id: 'unmatched', name: '未匹配' },
];

export function BusinessInvoiceLedgerAndImportDemo() {
  const [mode, setMode] = useState<BusinessInvoiceMode>('purchase');
  const [canViewPrices, setCanViewPrices] = useState(true);
  const [serverPriceVisible, setServerPriceVisible] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'detail' | 'orders'>('detail');
  const [lastAction, setLastAction] = useState('尚未执行操作');
  const [activeViewId, setActiveViewId] = useState('all');
  const [sort, setSort] = useState<{
    field: string;
    order: 'ascend' | 'descend';
  }>({ field: 'invoiceDate', order: 'descend' });
  const [columnState, setColumnState] = useState<Record<string, ColumnsState>>({});
  const tableActionRef = useRef<ActionType | null>(null);
  const filterFormRef = useRef<ProFormInstance | undefined>(undefined);
  const currentSortRef = useRef(sort);
  currentSortRef.current = sort;
  const applyingViewRef = useRef(false);
  const savedViewController = useMemo<
    DocumentDetailLedgerSavedViewController<BusinessInvoiceDetailView>
  >(
    () => ({
      views: demoViews,
      loading: false,
      activeViewId,
      dirty: false,
      activeFilterCount: activeViewId === 'unmatched' ? 1 : 0,
      currentConfig: { sort, columns: columnState },
      currentSortRef,
      applyingViewRef,
      params: activeViewId === 'unmatched' ? { matchStatus: 'unmatched' } : {},
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
        setLastAction(`已创建视图：${name}`);
        return true;
      },
      setDefault: (view) => {
        setLastAction(`已设为默认视图：${view.name}`);
        return true;
      },
      rename: (view, name) => {
        setLastAction(`已重命名视图：${view.name} → ${name}`);
        return true;
      },
      remove: (view) => {
        setLastAction(`已删除视图：${view.name}`);
        return true;
      },
      reorder: () => true,
      discardAndSwitch: () => true,
      saveAndSwitch: () => true,
    }),
    [activeViewId, columnState, sort],
  );

  const ledgerCapabilities = useMemo<MesDocumentDetailLedgerCapabilities>(
    () => ({
      pagination: { defaultPageSize: 20, showSizeChanger: false },
      renderExportAction: ({ exportFn, label }) => (
        <Button
          onClick={async () => {
            const blob = await exportFn();
            setLastAction(`模拟导出完成：${blob.size} bytes`);
          }}
        >
          {label}
        </Button>
      ),
    }),
    [],
  );

  const importCapabilities = useMemo(
    () => ({
      async importOpeningInvoices(
        _mode: BusinessInvoiceMode,
        request: { base64: string; fileName: string },
      ) {
        setLastAction(`已接收导入文件：${request.fileName}`);
        return {
          total: 2,
          succeeded: 1,
          failed: 1,
          rows: [
            { rowNo: 2, success: true, invoiceId: 'invoice-imported', duplicate: false },
            { rowNo: 3, success: false, error: '真实发票号格式错误', duplicate: false },
          ],
        };
      },
      downloadTemplate(fileName: string, csv: string) {
        setLastAction(`宿主下载：${fileName}（${csv.split('\n').length - 1} 行）`);
      },
      notify(type: 'success' | 'warning', message: string) {
        setLastAction(`${type === 'success' ? '成功' : '提示'}：${message}`);
      },
    }),
    [],
  );

  return (
    <SectionCard title="业务发票明细与期初导入">
      <Typography.Paragraph type="secondary">
        采购/销售发票明细台账保留个人视图、价格权限、明细自定义字段和汇总；期初发票导入保留 CSV 模板、文件校验与逐行结果。服务、权限、字典、格式和导航均由宿主注入。
      </Typography.Paragraph>
      <Space wrap style={{ marginBottom: 12 }}>
        <Segmented
          aria-label="发票业务类型"
          value={mode}
          options={[
            { label: '采购发票', value: 'purchase' },
            { label: '销售发票', value: 'sales' },
          ]}
          onChange={(value) => setMode(value as BusinessInvoiceMode)}
        />
        <Button onClick={() => setCanViewPrices((value) => !value)}>
          {canViewPrices ? '关闭价格权限' : '开启价格权限'}
        </Button>
        <Button onClick={() => setServerPriceVisible((value) => !value)}>
          {serverPriceVisible ? '隐藏服务端价格' : '显示服务端价格'}
        </Button>
        <Button type="primary" onClick={() => setImportOpen(true)}>
          导入期初发票
        </Button>
      </Space>
      <MesUiProvider
        hasPermission={() => true}
        documentDetailLedgerCapabilities={ledgerCapabilities}
      >
        <BusinessInvoiceDetailLedger
          mode={mode}
          canViewInvoice
          canViewPrices={canViewPrices}
          statusEnum={statusEnum}
          categoryEnum={categoryEnum}
          matchStatusEnum={matchStatusEnum}
          dateRangePresets={[]}
          partnerSearchColumnProps={{
            valueType: 'select',
            valueEnum: {
              'partner-1': { text: '华东铝业有限公司' },
              'partner-2': { text: '精工制造厂' },
            },
          }}
          materialSearchColumnProps={{
            valueType: 'select',
            valueEnum: {
              'material-1': { text: '6061 铝型材' },
              'material-2': { text: '委外加工费' },
            },
          }}
          customFieldColumns={[
            {
              title: '发票明细·批次标签',
              dataIndex: ['customValues', 'batchTag'],
              search: false,
              render: (_, row) => String(row.customValues?.batchTag ?? '-'),
            },
          ]}
          listApi={async (query: BusinessInvoiceDetailQuery) => {
            let rows = invoiceRows;
            if (query.matchStatus) {
              rows = rows.filter((row) => row.matchStatus === query.matchStatus);
            }
            if (query.statuses?.length) {
              rows = rows.filter((row) => query.statuses?.includes(row.status));
            }
            return {
              list: rows,
              total: rows.length,
              page: query.page ?? 1,
              pageSize: query.pageSize ?? 20,
              summary: {
                itemCount: rows.length,
                invoiceCount: rows.length,
                materialCount: rows.length,
                quantity: rows.reduce((sum, row) => sum + row.quantity, 0),
                amountWithoutTax: rows.reduce(
                  (sum, row) => sum + (row.amountWithoutTax ?? 0),
                  0,
                ),
                taxAmount: rows.reduce((sum, row) => sum + (row.taxAmount ?? 0), 0),
                totalAmount: rows.reduce((sum, row) => sum + (row.totalAmount ?? 0), 0),
              },
              priceVisible: serverPriceVisible,
            };
          }}
          exportApi={async (query) =>
            new Blob([JSON.stringify(query)], { type: 'application/json' })
          }
          formatNumber={(value) =>
            value == null ? '-' : Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 4 })
          }
          formatCurrency={(value) =>
            value == null ? '-' : `¥${Number(value).toFixed(2)}`
          }
          formatDate={(value) => value?.slice(0, 10) ?? '-'}
          formatDateTime={(value) => value?.replace('T', ' ').slice(0, 19) ?? '-'}
          formatUnit={(unit) =>
            ({ piece: '件', time: '次' })[unit ?? ''] ?? unit ?? '-'
          }
          navigateInvoiceDetail={(path) => setLastAction(`宿主路由：${path}`)}
          exportPermission="demo:invoice-export"
          createPermission="demo:invoice-create"
          resizable={{ enabled: false }}
          serverSortFields={[
            'itemName',
            'itemCode',
            'quantity',
            'unitPrice',
            'amountWithoutTax',
            'taxRate',
            'taxAmount',
            'totalAmount',
            'documentNo',
            'invoiceNo',
            'invoiceDate',
            'createdAt',
            'updatedAt',
          ]}
          savedView={{
            controller: savedViewController,
            tableActionRef,
            filterFormRef,
          }}
          onViewChange={setViewMode}
          onCreate={() => setLastAction('已调用宿主新增发票入口')}
        />
      </MesUiProvider>
      <Typography.Text type="secondary" aria-live="polite">
        当前视图：{viewMode === 'detail' ? '明细台账' : '发票列表'}；{lastAction}
      </Typography.Text>
      <BusinessInvoiceOpeningImportDrawer
        mode={mode}
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => setLastAction('导入成功，宿主已刷新台账')}
        capabilities={importCapabilities}
      />
    </SectionCard>
  );
}
