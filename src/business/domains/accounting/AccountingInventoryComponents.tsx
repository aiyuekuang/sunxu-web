/** @sunxu-layer business @sunxu-domain accounting @sunxu-reason Preserves inventory opening-balance maintenance, cost-result filtering and voucher navigation, and period stock summaries while the host supplies host requests, permissions, and formatting. */
import {
  type ActionType,
  DrawerForm,
  type ProColumns,
  ProFormDigit,
  ProFormSelect,
} from '@ant-design/pro-components';
import { Alert, Button, Popconfirm, Segmented, Typography } from 'antd';
import { useRef, useState } from 'react';
import { ResizableProTable } from '../shared/ResizableTable';
import { StatusDisplay } from '../../../components/StatusDisplay';
import type { StatusMap } from '../../../components/StatusDisplay';
import type {
  InventoryCostResultRecord,
  InventoryCostResultValueEnum,
  InventoryOpeningBalanceFormValues,
  InventoryOpeningBalancePanelCapabilities,
  InventoryOpeningBalancePanelProps,
  InventoryOpeningBalanceRecord,
  InventoryResultFilter,
  InventoryResultTableProps,
  InventoryStockSummaryRow,
  InventoryStockSummaryTableProps,
} from './accounting-inventory-components-types';

const DEFAULT_RESULT_PAGE_SIZE = 20;

const RESULT_FILTER_VALUES: readonly InventoryResultFilter[] = [
  'all',
  'receipt',
  'issue',
  'pending',
];

function isInventoryResultFilter(value: string | number): value is InventoryResultFilter {
  return RESULT_FILTER_VALUES.some((filter) => filter === value);
}

function getResultFilterQuery(filter: InventoryResultFilter) {
  if (filter === 'receipt') return { direction: 'receipt' as const };
  if (filter === 'issue') return { direction: 'issue' as const };
  if (filter === 'pending') return { status: 'pending_cost' as const };
  return {};
}

function toValueEnum(enumMap: StatusMap): InventoryCostResultValueEnum {
  return Object.fromEntries(
    Object.entries(enumMap).map(([key, value]) => [key, { text: value.text }]),
  ) as InventoryCostResultValueEnum;
}

function formatQuantity(value: number | null | undefined) {
  return Number(value ?? 0).toFixed(6);
}

function createOpeningBalanceColumns(
  canManage: boolean,
  capabilities: InventoryOpeningBalancePanelCapabilities,
  onEdit: (record: InventoryOpeningBalanceRecord) => void,
  onChanged: () => Promise<void>,
  reload: () => void,
): ProColumns<InventoryOpeningBalanceRecord>[] {
  return [
    {
      title: '物料名称',
      dataIndex: 'materialName',
      width: 180,
      ellipsis: true,
      render: (_, record) => record.materialName || '-',
    },
    {
      title: '物料编码',
      dataIndex: 'materialCode',
      width: 140,
      copyable: true,
      render: (_, record) => record.materialCode || '-',
    },
    {
      title: '仓库',
      dataIndex: 'warehouseCode',
      width: 140,
      render: (_, record) => record.warehouseCode || '-',
    },
    {
      title: '期初数量',
      dataIndex: 'openingQuantity',
      width: 130,
      align: 'right',
      render: (_, record) => formatQuantity(record.openingQuantity),
    },
    {
      title: '期初金额',
      dataIndex: 'openingAmount',
      width: 130,
      align: 'right',
      render: (_, record) => capabilities.formatMoney(record.openingAmount),
    },
    {
      title: '期初单位成本',
      dataIndex: 'openingUnitCost',
      width: 140,
      align: 'right',
      render: (_, record) => capabilities.formatMoney(record.openingUnitCost),
    },
    {
      title: '操作',
      key: 'actions',
      dataIndex: '__actions',
      valueType: 'option',
      width: 140,
      render: (_, record) =>
        canManage
          ? [
              <Button key="edit" type="link" onClick={() => onEdit(record)}>
                编辑
              </Button>,
              <Popconfirm
                key="remove"
                title="删除这条期初余额？"
                description="仅未执行本期间存货核算时可以删除。"
                onConfirm={async () => {
                  await capabilities.removeOpeningBalance(record.id);
                  capabilities.notifySuccess('删除成功');
                  reload();
                  await onChanged();
                }}
              >
                <Button danger type="link">
                  删除
                </Button>
              </Popconfirm>,
            ]
          : [],
    },
  ];
}

/** Lists and maintains period opening balances; the host owns requests and authorization. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable inventory opening balance panel behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function InventoryOpeningBalancePanel({
  canManage,
  onChanged,
  query,
  capabilities,
}: InventoryOpeningBalancePanelProps) {
  const actionRef = useRef<ActionType>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<InventoryOpeningBalanceRecord | null>(null);

  if (!query) {
    return (
      <Typography.Text type="secondary">
        选择账簿和会计期间后，可维护首次启用的期初余额。
      </Typography.Text>
    );
  }

  const openCreate = () => {
    setEditingRecord(null);
    setEditorOpen(true);
  };
  const openEdit = (record: InventoryOpeningBalanceRecord) => {
    setEditingRecord(record);
    setEditorOpen(true);
  };
  const createButton = canManage
    ? capabilities.renderCreateButton({ onClick: openCreate })
    : null;

  return (
    <>
      <ResizableProTable<InventoryOpeningBalanceRecord>
        key={`${query.accountingBookCode}-${query.fiscalPeriod}`}
        actionRef={actionRef}
        columns={createOpeningBalanceColumns(
          canManage,
          capabilities,
          openEdit,
          onChanged,
          () => actionRef.current?.reload(),
        )}
        headerTitle="期初余额"
        rowKey="id"
        search={false}
        options={false}
        pagination={false}
        resizable={{ serverSortFields: [], sortPersistenceKey: false }}
        fitContainerHeight={false}
        scroll={{ x: 980 }}
        toolBarRender={() => (createButton ? [createButton] : [])}
        request={async () => {
          const data = await capabilities.listOpeningBalances(query);
          return { data, total: data.length, success: true };
        }}
      />

      <DrawerForm<InventoryOpeningBalanceFormValues>
        key={editingRecord?.id ?? 'new'}
        drawerProps={{ destroyOnHidden: true }}
        initialValues={
          editingRecord
            ? {
                materialId: editingRecord.materialId ?? undefined,
                warehouseId: editingRecord.warehouseId ?? undefined,
                openingQuantity: editingRecord.openingQuantity,
                openingAmount: editingRecord.openingAmount,
              }
            : undefined
        }
        open={editorOpen}
        title={editingRecord ? '编辑期初余额' : '新增期初余额'}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingRecord(null);
        }}
        onFinish={async (values) => {
          try {
            await capabilities.saveOpeningBalance({ ...query, ...values });
            capabilities.notifySuccess('期初余额已保存');
            actionRef.current?.reload();
            await onChanged();
            return true;
          } catch {
            return false;
          }
        }}
      >
        <Alert
          showIcon
          type="warning"
          message="期初余额只在首次启用、未执行本期间核算且没有上期余额时可维护。"
          style={{ marginBottom: 16 }}
        />
        <ProFormSelect
          debounceTime={300}
          fieldProps={{
            disabled: Boolean(editingRecord),
            filterOption: false,
          }}
          label="物料"
          name="materialId"
          request={capabilities.requestMaterialOptions}
          rules={[{ required: true, message: '请选择物料' }]}
          showSearch
        />
        <ProFormSelect
          debounceTime={300}
          fieldProps={{
            disabled: Boolean(editingRecord),
            filterOption: false,
          }}
          label="仓库"
          name="warehouseId"
          request={capabilities.requestWarehouseOptions}
          rules={[{ required: true, message: '请选择仓库' }]}
          showSearch
        />
        <ProFormDigit
          fieldProps={{ precision: 6 }}
          label="期初数量"
          min={0}
          name="openingQuantity"
          rules={[{ required: true, message: '请输入期初数量' }]}
        />
        <ProFormDigit
          fieldProps={{ precision: 6 }}
          label="期初金额"
          min={0}
          name="openingAmount"
          rules={[{ required: true, message: '请输入期初金额' }]}
        />
      </DrawerForm>
    </>
  );
}

function createCostResultColumns(
  canViewVoucher: boolean,
  capabilities: InventoryResultTableProps['capabilities'],
): ProColumns<InventoryCostResultRecord>[] {
  return [
    {
      title: '物料名称',
      dataIndex: 'materialName',
      width: 180,
      ellipsis: true,
      render: (_, record) => record.materialName || '-',
    },
    {
      title: '物料编码',
      dataIndex: 'materialCode',
      width: 130,
      copyable: true,
      render: (_, record) => record.materialCode || '-',
    },
    {
      title: '来源类型',
      dataIndex: 'sourceType',
      width: 110,
      ellipsis: true,
      valueType: 'select',
      valueEnum: toValueEnum(capabilities.sourceTypeEnum),
    },
    { title: '来源单号', dataIndex: 'sourceNo', width: 150, copyable: true },
    {
      title: '仓库',
      dataIndex: 'warehouseCode',
      width: 110,
      render: (_, record) => record.warehouseCode || '-',
    },
    {
      title: '方向',
      dataIndex: 'costDirection',
      width: 80,
      search: false,
      valueType: 'select',
      valueEnum: toValueEnum(capabilities.directionEnum),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 100,
      align: 'right',
      search: false,
      render: (_, record) => formatQuantity(record.quantity),
    },
    {
      title: '单位成本',
      dataIndex: 'unitCost',
      width: 120,
      align: 'right',
      search: false,
      render: (_, record) => capabilities.formatMoney(record.unitCost),
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      width: 130,
      align: 'right',
      search: false,
      render: (_, record) => capabilities.formatMoney(record.totalCost),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      search: false,
      valueType: 'select',
      valueEnum: toValueEnum(capabilities.statusEnum),
      render: (_, record) => (
        <StatusDisplay value={record.status} enumMap={capabilities.statusEnum} />
      ),
    },
    {
      title: '凭证号',
      dataIndex: 'voucherNo',
      width: 140,
      search: false,
      render: (_, record) => {
        if (!record.voucherNo) return '-';
        if (!canViewVoucher || !record.voucherId) return record.voucherNo;
        const voucherId = record.voucherId;
        return (
          <Button
            type="link"
            style={{ paddingInline: 0 }}
            onClick={() => capabilities.navigateToVoucher(voucherId)}
          >
            {record.voucherNo}
          </Button>
        );
      },
    },
    {
      title: '待成本原因',
      dataIndex: 'lastErrorMessage',
      width: 240,
      search: false,
      ellipsis: true,
      render: (_, record) => record.lastErrorMessage || '-',
    },
  ];
}

/** Lists per-document inventory costing results and preserves the page's four-way filter. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable inventory result table behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function InventoryResultTable({
  actionRef,
  canViewVoucher,
  filter,
  onFilterChange,
  overview,
  query,
  capabilities,
}: InventoryResultTableProps) {
  if (!query) return null;

  const filterOptions = [
    { label: '全部', value: 'all' },
    { label: '入库', value: 'receipt' },
    { label: '出库', value: 'issue' },
    {
      label: `待成本结果（${overview?.pendingCostCount ?? 0}）`,
      value: 'pending',
    },
  ];

  return (
    <ResizableProTable<InventoryCostResultRecord>
      key={`${query.accountingBookCode}-${query.fiscalPeriod}-${filter}`}
      actionRef={actionRef}
      columns={createCostResultColumns(canViewVoucher, capabilities)}
      headerTitle="核算结果"
      rowKey="id"
      search={false}
      options={false}
      pagination={capabilities.pagination}
      resizable={{ serverSortFields: [], sortPersistenceKey: false }}
      fitContainerHeight={false}
      scroll={{ x: 1650 }}
      toolBarRender={() => [
        <Segmented
          key="result-filter"
          options={filterOptions}
          value={filter}
          onChange={(value) => {
            if (isInventoryResultFilter(value)) onFilterChange(value);
          }}
        />,
      ]}
      request={async (params) => {
        const result = await capabilities.requestCostResults({
          ...query,
          page: params.current ?? 1,
          pageSize: params.pageSize ?? capabilities.defaultPageSize ?? DEFAULT_RESULT_PAGE_SIZE,
          ...getResultFilterQuery(filter),
        });
        return {
          data: result.list ?? [],
          total: result.total ?? 0,
          success: true,
        };
      }}
    />
  );
}

function createStockColumns(
  capabilities: InventoryStockSummaryTableProps['capabilities'],
): ProColumns<InventoryStockSummaryRow>[] {
  return [
    { title: '物料名称', dataIndex: 'materialName', width: 180, ellipsis: true },
    { title: '物料编码', dataIndex: 'materialCode', width: 130, copyable: true },
    { title: '仓库', dataIndex: 'warehouseCode', width: 110 },
    {
      title: '期初数量',
      dataIndex: 'openingQty',
      align: 'right',
      render: (_, record) => formatQuantity(record.openingQty),
    },
    {
      title: '期初金额',
      dataIndex: 'openingAmount',
      align: 'right',
      render: (_, record) => capabilities.formatMoney(record.openingAmount),
    },
    {
      title: '入库数量',
      dataIndex: 'receiptQty',
      align: 'right',
      render: (_, record) => formatQuantity(record.receiptQty),
    },
    {
      title: '入库金额',
      dataIndex: 'receiptAmount',
      align: 'right',
      render: (_, record) => capabilities.formatMoney(record.receiptAmount),
    },
    {
      title: '出库数量',
      dataIndex: 'issueQty',
      align: 'right',
      render: (_, record) => formatQuantity(record.issueQty),
    },
    {
      title: '出库金额',
      dataIndex: 'issueAmount',
      align: 'right',
      render: (_, record) => capabilities.formatMoney(record.issueAmount),
    },
    {
      title: '期末数量',
      dataIndex: 'endingQty',
      align: 'right',
      render: (_, record) => formatQuantity(record.endingQty),
    },
    {
      title: '期末金额',
      dataIndex: 'endingAmount',
      align: 'right',
      render: (_, record) => capabilities.formatMoney(record.endingAmount),
    },
  ];
}

/** Shows period opening, receipt, issue, and ending quantity and amount. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable inventory stock summary table behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function InventoryStockSummaryTable({
  query,
  capabilities,
}: InventoryStockSummaryTableProps) {
  if (!query) {
    return (
      <Typography.Text type="secondary">
        选择账簿和会计期间后，可查看本期收发存汇总。
      </Typography.Text>
    );
  }

  return (
    <ResizableProTable<InventoryStockSummaryRow>
      key={`${query.accountingBookCode}-${query.fiscalPeriod}`}
      columns={createStockColumns(capabilities)}
      headerTitle="收发存汇总"
      rowKey={(record) => `${record.materialCode ?? ''}-${record.warehouseCode ?? ''}`}
      search={false}
      options={false}
      pagination={false}
      resizable={{ serverSortFields: [], sortPersistenceKey: false }}
      fitContainerHeight={false}
      scroll={{ x: 1280 }}
      request={async () => {
        const data = await capabilities.listStockSummary(query);
        return { data, total: data.length, success: true };
      }}
    />
  );
}
