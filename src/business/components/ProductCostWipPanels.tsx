/** @sunxu-layer business @sunxu-domain product-cost-wip @sunxu-reason Preserves MES opening and closing WIP table columns and action conditions while the host supplies data, permission-aware actions, confirmation, formatting, and modal workflows. */
import type { ProColumns } from '@ant-design/pro-components';
import { Button } from 'antd';
import { useState } from 'react';
import { ResizableProTable as ProTable } from './ResizableTable';
import type {
  ProductCostClosingWipRecord,
  ProductCostOpeningWipRecord,
  ProductCostWipPanelsProps,
} from './product-cost-wip-types';

export function OpeningWipPanel({
  query,
  canManage,
  canMaintainInput,
  onRefresh,
  capabilities,
}: ProductCostWipPanelsProps) {
  const [open, setOpen] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [editingRecord, setEditingRecord] =
    useState<ProductCostOpeningWipRecord | null>(null);
  const refreshTable = async () => {
    setReloadVersion((value) => value + 1);
    await onRefresh();
  };
  const openCreateModal = () => {
    setEditingRecord(null);
    setOpen(true);
  };
  const columns: ProColumns<ProductCostOpeningWipRecord>[] = [
    {
      title: '产品名称',
      dataIndex: 'materialName',
      width: 180,
      render: (_, record) => record.materialName || '-',
    },
    {
      title: '产品编码',
      dataIndex: 'materialCode',
      width: 130,
      render: (_, record) => record.materialCode || '-',
    },
    {
      title: '工单号',
      dataIndex: 'workOrderNo',
      width: 160,
      render: (_, record) => record.workOrderNo || record.workOrderId,
    },
    {
      title: '期初数量',
      dataIndex: 'openingQuantity',
      width: 110,
      align: 'right',
      render: (_, record) => Number(record.openingQuantity).toFixed(6),
    },
    {
      title: '直接材料',
      dataIndex: 'openingMaterialCost',
      width: 120,
      align: 'right',
      render: (_, record) => capabilities.formatMoney(record.openingMaterialCost),
    },
    {
      title: '直接人工',
      dataIndex: 'openingLaborCost',
      width: 120,
      align: 'right',
      render: (_, record) => capabilities.formatMoney(record.openingLaborCost),
    },
    {
      title: '制造费用',
      dataIndex: 'openingOverheadCost',
      width: 120,
      align: 'right',
      render: (_, record) => capabilities.formatMoney(record.openingOverheadCost),
    },
    {
      title: '操作',
      key: 'actions',
      dataIndex: 'actions',
      valueType: 'option',
      width: 140,
      fixed: 'right',
      render: (_, record) =>
        canManage && canMaintainInput
          ? [
              <Button
                key="edit"
                type="link"
                size="small"
                onClick={() => {
                  setEditingRecord(record);
                  setOpen(true);
                }}
              >
                编辑
              </Button>,
              capabilities.renderOpeningRemoveButton({
                record,
                confirmation: {
                  title: '删除期初在产品？',
                  content: '仅未执行本期产品成本计算时可以删除。',
                  okText: '删除',
                },
                successMessage: '已删除期初在产品',
                onConfirm: () => capabilities.removeOpening(record.id),
                onSuccess: refreshTable,
              }),
            ]
          : null,
    },
  ];

  return (
    <>
      <ProTable<ProductCostOpeningWipRecord>
        key={`${query.accountingBookCode}-${query.fiscalPeriod}-${reloadVersion}`}
        rowKey="id"
        search={false}
        options={false}
        resizable={{ serverSortFields: [], sortPersistenceKey: false }}
        fitContainerHeight={false}
        pagination={capabilities.pagination}
        scroll={{ x: 1040 }}
        columns={columns}
        toolBarRender={() => {
          if (!canManage || !canMaintainInput) return [];
          const button = capabilities.renderCreateButton({
            onClick: openCreateModal,
          });
          return button ? [button] : [];
        }}
        request={async () => {
          const data = await capabilities.listOpening(query);
          return { data, total: data.length, success: true };
        }}
      />
      {capabilities.renderOpeningModal({
        query,
        editingRecord,
        open,
        onOpenChange: setOpen,
        onSuccess: async () => {
          setOpen(false);
          await refreshTable();
        },
      })}
    </>
  );
}

export function ClosingWipPanel({
  query,
  canManage,
  canMaintainInput,
  onRefresh,
  capabilities,
}: ProductCostWipPanelsProps) {
  const [open, setOpen] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [editingRecord, setEditingRecord] =
    useState<ProductCostClosingWipRecord | null>(null);
  const refreshTable = async () => {
    setReloadVersion((value) => value + 1);
    await onRefresh();
  };
  const openCreateModal = () => {
    setEditingRecord(null);
    setOpen(true);
  };
  const columns: ProColumns<ProductCostClosingWipRecord>[] = [
    {
      title: '产品名称',
      dataIndex: 'materialName',
      width: 180,
      render: (_, record) => record.materialName || '-',
    },
    {
      title: '产品编码',
      dataIndex: 'materialCode',
      width: 130,
      render: (_, record) => record.materialCode || '-',
    },
    {
      title: '工单号',
      dataIndex: 'workOrderNo',
      width: 160,
      render: (_, record) => record.workOrderNo || record.workOrderId,
    },
    {
      title: '在产品数量',
      dataIndex: 'wipQuantity',
      width: 120,
      align: 'right',
      render: (_, record) => Number(record.wipQuantity).toFixed(6),
    },
    {
      title: '材料完工程度',
      dataIndex: 'materialCompletionRatePercent',
      width: 130,
      align: 'right',
      render: (_, record) => `${Number(record.materialCompletionRatePercent)}%`,
    },
    {
      title: '人工完工程度',
      dataIndex: 'laborCompletionRatePercent',
      width: 130,
      align: 'right',
      render: (_, record) => `${Number(record.laborCompletionRatePercent)}%`,
    },
    {
      title: '制造费用完工程度',
      dataIndex: 'overheadCompletionRatePercent',
      width: 150,
      align: 'right',
      render: (_, record) => `${Number(record.overheadCompletionRatePercent)}%`,
    },
    {
      title: '操作',
      key: 'actions',
      dataIndex: 'actions',
      valueType: 'option',
      width: 140,
      fixed: 'right',
      render: (_, record) =>
        canManage && canMaintainInput
          ? [
              <Button
                key="edit"
                type="link"
                size="small"
                onClick={() => {
                  setEditingRecord(record);
                  setOpen(true);
                }}
              >
                编辑
              </Button>,
              capabilities.renderClosingRemoveButton({
                record,
                confirmation: {
                  title: '删除月末在产品？',
                  content: '仅未执行本期产品成本计算时可以删除。',
                  okText: '删除',
                },
                successMessage: '已删除月末在产品',
                onConfirm: () => capabilities.removeClosing(record.id),
                onSuccess: refreshTable,
              }),
            ]
          : null,
    },
  ];

  return (
    <>
      <ProTable<ProductCostClosingWipRecord>
        key={`${query.accountingBookCode}-${query.fiscalPeriod}-${reloadVersion}`}
        rowKey="id"
        search={false}
        options={false}
        resizable={{ serverSortFields: [], sortPersistenceKey: false }}
        fitContainerHeight={false}
        pagination={capabilities.pagination}
        scroll={{ x: 1160 }}
        columns={columns}
        toolBarRender={() => {
          if (!canManage || !canMaintainInput) return [];
          const button = capabilities.renderCreateButton({
            onClick: openCreateModal,
          });
          return button ? [button] : [];
        }}
        request={async () => {
          const data = await capabilities.listClosing(query);
          return { data, total: data.length, success: true };
        }}
      />
      {capabilities.renderClosingModal({
        query,
        editingRecord,
        open,
        onOpenChange: setOpen,
        onSuccess: async () => {
          setOpen(false);
          await refreshTable();
        },
      })}
    </>
  );
}
