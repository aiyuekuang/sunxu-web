import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { App, Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  MesUiProvider,
  type StockTransferDetailLedgerCapabilities,
  type StockTransferDetailLedgerQuery,
  type StockTransferDetailLedgerRow,
} from '../../src/business';
import { StockTransferDetailLedger } from '../../src/business/components/StockTransferDetailLedger';

const demoRows: StockTransferDetailLedgerRow[] = [
  {
    id: 'transfer-1',
    referenceNo: 'TR-2026-0088',
    material: {
      id: 'material-1',
      code: 'MAT-AL-001',
      name: '6061 铝型材',
      spec: '20×20 mm',
      unit: 'pcs',
    },
    fromWarehouse: { id: 'warehouse-1', name: '原料仓' },
    toWarehouse: { id: 'warehouse-2', name: '半成品仓' },
    fromLocation: {
      id: 'location-1',
      code: 'A-01',
      name: '01-01',
      pathName: 'A区 / 01-01',
    },
    toLocation: {
      id: 'location-2',
      code: 'B-03',
      name: '03-04',
      pathName: 'B区 / 03-04',
    },
    qty: 24,
    batchNo: 'LOT-2026-018',
    remarks: '排产备料',
    operatorName: '王工',
    businessDate: '2026-11-20',
    status: 'transferred',
    reversed: false,
  },
  {
    id: 'transfer-2',
    referenceNo: 'TR-2026-0089',
    material: {
      id: 'material-2',
      code: 'MAT-BX-030',
      name: '标准包装箱',
      spec: '300×200×150 mm',
      unit: 'pcs',
    },
    fromWarehouse: { id: 'warehouse-2', name: '半成品仓' },
    toWarehouse: { id: 'warehouse-3', name: '成品仓' },
    qty: 60,
    batchNo: 'LOT-2026-021',
    remarks: '已撤销调拨',
    operatorName: '李工',
    businessDate: '2026-11-19',
    status: 'reversed',
    reversed: true,
  },
];

function normalizeDateOnly(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  if (value instanceof Date) return dayjs(value).format('YYYY-MM-DD');
  if (
    typeof value === 'object' &&
    'format' in value &&
    typeof value.format === 'function'
  ) {
    return String(value.format('YYYY-MM-DD'));
  }
  const parsed = dayjs(String(value));
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined;
}

function StockTransferDetailLedgerDemoContent() {
  const [canExport, setCanExport] = useState(true);
  const [lastAction, setLastAction] = useState('等待台账操作');
  const capabilities = useMemo<StockTransferDetailLedgerCapabilities>(
    () => ({
      requestList: async (query) => {
        const keyword = query.keyword?.trim().toLocaleLowerCase();
        const rows = demoRows.filter((row) => {
          const matchesKeyword =
            !keyword ||
            `${row.referenceNo} ${row.material.name} ${row.material.code} ${row.material.spec ?? ''} ${row.remarks ?? ''}`
              .toLocaleLowerCase()
              .includes(keyword);
          const matchesBatch = !query.batchNo || row.batchNo === query.batchNo;
          const matchesFrom =
            !query.fromWarehouseId ||
            row.fromWarehouse.id === query.fromWarehouseId;
          const matchesTo =
            !query.toWarehouseId || row.toWarehouse.id === query.toWarehouseId;
          return matchesKeyword && matchesBatch && matchesFrom && matchesTo;
        });
        return { list: rows, total: rows.length };
      },
      exportRows: async (query: StockTransferDetailLedgerQuery) =>
        new Blob([JSON.stringify(query, null, 2)], {
          type: 'application/json',
        }),
      canExport,
      renderExportAction: ({ exportFn, label }) => (
        <Button
          onClick={async () => {
            await exportFn();
            setLastAction('已调用宿主导出能力');
          }}
        >
          {label}
        </Button>
      ),
      requestFromWarehouseOptions: async () => [
        { label: '原料仓', value: 'warehouse-1' },
        { label: '半成品仓', value: 'warehouse-2' },
      ],
      requestToWarehouseOptions: async () => [
        { label: '半成品仓', value: 'warehouse-2' },
        { label: '成品仓', value: 'warehouse-3' },
      ],
      statusEnum: {
        transferred: { text: '已调拨', status: 'Success' },
        reversed: { text: '已撤销', status: 'Default' },
      },
      materialUnitLabelMap: { pcs: '件' },
      normalizeDateOnlyValue: normalizeDateOnly,
      formatNumber: (value) => new Intl.NumberFormat('zh-CN').format(value),
      formatUnitLabel: (unit, labels) =>
        unit?.trim() ? labels[unit.trim()] ?? unit.trim() : '',
      formatBusinessDateValue: (value) => {
        if (!value) return '';
        const date = dayjs(value);
        return date.isValid() ? date.format('YYYY-MM-DD') : '';
      },
      pagination: { defaultPageSize: 20, showSizeChanger: false },
      resizable: { enabled: false },
    }),
    [canExport],
  );

  return (
    <SectionCard title="库存调拨明细台账">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary">
          只读流水保留仓库、批号、业务日期筛选，服务端排序、导出和切回单据视图；API、选项、权限与下载反馈由宿主注入。
        </Typography.Paragraph>
        <Button onClick={() => setCanExport((current) => !current)}>
          {canExport ? '隐藏导出权限' : '恢复导出权限'}
        </Button>
        <App>
          <MesUiProvider hasPermission={() => true}>
            <StockTransferDetailLedger
              capabilities={capabilities}
              onViewChange={(view) =>
                setLastAction(`宿主收到视图切换：${view}`)
              }
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

export function StockTransferDetailLedgerDemo() {
  return <StockTransferDetailLedgerDemoContent />;
}
