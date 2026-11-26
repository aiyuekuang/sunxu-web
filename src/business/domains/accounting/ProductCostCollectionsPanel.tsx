/** @sunxu-layer business @sunxu-domain accounting @sunxu-reason Preserves draft selection and down-push, expense collection list and lifecycle actions, allocation editing, and period refresh while the host supplies host requests, permission results, and feedback. */
import type { ProColumns } from '@ant-design/pro-components';
import { Space } from 'antd';
import { useState } from 'react';
import { PermissionButton } from '../shared/PermissionButton';
import { PRODUCT_COST_ALLOCATION_BASIS_OPTIONS } from './accounting-options';
import { ResizableProTable } from '../shared/ResizableTable';
import { StatusDisplay } from '../../../components/StatusDisplay';
import type {
  ProductCostCollectionListCapabilities,
  ProductCostCollectionsPanelProps,
  ProductCostExpenseCollectionRecord,
  ProductCostExpenseDraftRecord,
} from './product-cost-collection-types';
import { ExpenseCollectionModal } from './ExpenseCollectionModal';

function createCollectionColumns(
  canManage: boolean,
  canMaintainInput: boolean,
  loadingDetailId: string | null,
  capabilities: ProductCostCollectionListCapabilities,
  onEditAllocation: (record: ProductCostExpenseCollectionRecord) => Promise<void>,
  refresh: () => Promise<void>,
): ProColumns<ProductCostExpenseCollectionRecord>[] {
  return [
    {
      title: '归集单号',
      dataIndex: 'collectionNo',
      width: 160,
      copyable: true,
    },
    {
      title: '费用类型',
      dataIndex: 'expenseTypeName',
      width: 160,
      render: (_, record) =>
        `${record.expenseTypeName}（${record.expenseTypeCode}）`,
    },
    {
      title: '业务发生日',
      dataIndex: 'businessDate',
      valueType: 'date',
      width: 120,
    },
    {
      title: '分配标准',
      dataIndex: 'allocationBasis',
      width: 140,
      render: (_, record) =>
        PRODUCT_COST_ALLOCATION_BASIS_OPTIONS.find(
          (item) => item.value === record.allocationBasis,
        )?.label ?? record.allocationBasis,
    },
    {
      title: '归集金额',
      dataIndex: 'amount',
      width: 120,
      align: 'right',
      render: (_, record) => capabilities.formatMoney(record.amount),
    },
    {
      title: '来源',
      dataIndex: 'sourceLabel',
      width: 220,
      ellipsis: true,
      render: (_, record) => record.sourceLabel || '手工归集',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(capabilities.statusEnum).map(([key, value]) => [
          key,
          { text: value.text },
        ]),
      ),
      render: (_, record) => (
        <StatusDisplay value={record.status} enumMap={capabilities.statusEnum} />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      dataIndex: 'actions',
      valueType: 'option',
      width: 240,
      fixed: 'right',
      render: (_, record) =>
        canManage && canMaintainInput
          ? [
              <PermissionButton
                key="allocate"
                type="link"
                size="small"
                loading={loadingDetailId === record.id}
                visible={record.status === 'draft'}
                onClick={() => void onEditAllocation(record)}
              >
                编辑分配
              </PermissionButton>,
              <PermissionButton
                key="confirm"
                type="link"
                size="small"
                visible={record.status === 'draft'}
                confirm={{
                  title: '确认费用归集单？',
                  content: '确认后该费用将参与本期产品成本计算。',
                  okText: '确认',
                }}
                onConfirm={() =>
                  capabilities.confirmExpenseCollection(record.id)
                }
                successMessage="费用归集单已确认"
                onSuccess={refresh}
              >
                确认
              </PermissionButton>,
              <PermissionButton
                key="cancel"
                type="link"
                size="small"
                danger
                visible={record.status !== 'cancelled'}
                confirm={{
                  title: '作废费用归集单？',
                  content: '已确认的来源草稿会恢复为待归集状态。',
                  okText: '作废',
                }}
                onConfirm={() => capabilities.cancelExpenseCollection(record.id)}
                successMessage="费用归集单已作废"
                onSuccess={refresh}
              >
                作废
              </PermissionButton>,
            ]
          : [],
    },
  ];
}

function createDraftColumns(
  capabilities: ProductCostCollectionListCapabilities,
): ProColumns<ProductCostExpenseDraftRecord>[] {
  return [
    {
      title: '来源对象',
      dataIndex: 'sourceObjectLabel',
      width: 240,
      ellipsis: true,
      render: (_, record) =>
        record.sourceObjectLabel ||
        `${record.sourceObjectType}｜${record.sourceObjectId}`,
    },
    {
      title: '费用类型',
      dataIndex: 'expenseTypeName',
      width: 160,
      render: (_, record) =>
        `${record.expenseTypeName}（${record.expenseTypeCode}）`,
    },
    {
      title: '分配标准',
      dataIndex: 'allocationBasis',
      width: 140,
      render: (_, record) =>
        PRODUCT_COST_ALLOCATION_BASIS_OPTIONS.find(
          (item) => item.value === record.allocationBasis,
        )?.label ??
        record.allocationBasis ??
        '-',
    },
    {
      title: '不含税金额',
      dataIndex: 'amountExcludingTax',
      width: 130,
      align: 'right',
      render: (_, record) =>
        capabilities.formatMoney(record.amountExcludingTax ?? record.amount),
    },
    {
      title: '最近解析',
      dataIndex: 'lastResolvedAt',
      valueType: 'dateTime',
      width: 170,
    },
  ];
}

/** Manages source expense drafts and the period's expense collection records. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable product cost collections panel behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function ProductCostCollectionsPanel({
  query,
  expenseTypes,
  canManage,
  canMaintainInput,
  onRefresh,
  capabilities,
}: ProductCostCollectionsPanelProps) {
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState<
    Awaited<ReturnType<ProductCostCollectionListCapabilities['requestExpenseCollectionDetail']>> | null
  >(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  const refresh = async () => {
    setReloadVersion((value) => value + 1);
    await onRefresh();
  };

  const openCreateModal = () => {
    setEditingDetail(null);
    setModalOpen(true);
  };

  const openAllocationModal = async (
    record: ProductCostExpenseCollectionRecord,
  ) => {
    setLoadingDetailId(record.id);
    try {
      const detail = await capabilities.requestExpenseCollectionDetail(record.id);
      setEditingDetail(detail);
      setModalOpen(true);
    } finally {
      setLoadingDetailId(null);
    }
  };

  const collectionColumns = createCollectionColumns(
    canManage,
    canMaintainInput,
    loadingDetailId,
    capabilities,
    openAllocationModal,
    refresh,
  );
  const draftColumns = createDraftColumns(capabilities);

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <ResizableProTable<ProductCostExpenseDraftRecord>
        key={`draft-${query.accountingBookCode}-${query.fiscalPeriod}-${reloadVersion}`}
        rowKey="id"
        search={false}
        options={false}
        fitContainerHeight={false}
        pagination={capabilities.pagination}
        scroll={{ x: 900 }}
        headerTitle="待导入生产费用草稿"
        columns={draftColumns}
        rowSelection={
          canManage && canMaintainInput
            ? {
                selectedRowKeys: selectedDraftIds,
                preserveSelectedRowKeys: true,
                onChange: (keys) => setSelectedDraftIds(keys.map(String)),
              }
            : undefined
        }
        tableAlertOptionRender={({ onCleanSelected }) =>
          canManage && canMaintainInput ? (
            <PermissionButton
              type="link"
              disabled={selectedDraftIds.length === 0}
              confirm={{
                title: '下推费用归集单？',
                content: `将下推到 ${query.accountingBookCode} / ${query.fiscalPeriod}。下推后必须维护业务发生日、分配标准并确认费用归集单，才会参与产品成本计算。`,
                okText: '下推',
              }}
              onConfirm={() =>
                capabilities.collectExpenseDrafts({
                  ...query,
                  draftIds: selectedDraftIds,
                })
              }
              successMessage="已下推费用归集单，请逐单维护分配后确认"
              onSuccess={async () => {
                setSelectedDraftIds([]);
                onCleanSelected();
                await refresh();
              }}
            >
              下推费用归集单
            </PermissionButton>
          ) : null
        }
        request={async (params) => {
          const result = await capabilities.requestExpenseDrafts({
            financialUsage: 'production_cost_collection_draft',
            status: 'draft',
            page: params.current ?? 1,
            pageSize: params.pageSize ?? capabilities.defaultPageSize,
          });
          return {
            data: result.list ?? [],
            total: result.total ?? 0,
            success: true,
          };
        }}
      />
      <ResizableProTable<ProductCostExpenseCollectionRecord>
        key={`collection-${query.accountingBookCode}-${query.fiscalPeriod}-${reloadVersion}`}
        rowKey="id"
        search={false}
        options={false}
        fitContainerHeight={false}
        pagination={capabilities.pagination}
        scroll={{ x: 1180 }}
        headerTitle="费用归集单"
        columns={collectionColumns}
        toolBarRender={() =>
          canManage && canMaintainInput
            ? [
                <PermissionButton
                  key="create"
                  type="primary"
                  onClick={openCreateModal}
                >
                  新增
                </PermissionButton>,
              ]
            : []
        }
        request={async (params) => {
          const result = await capabilities.requestExpenseCollections({
            ...query,
            page: params.current ?? 1,
            pageSize: params.pageSize ?? capabilities.defaultPageSize,
          });
          return {
            data: result.list ?? [],
            total: result.total ?? 0,
            success: true,
          };
        }}
      />
      <ExpenseCollectionModal
        query={query}
        expenseTypes={expenseTypes}
        editingDetail={editingDetail}
        open={modalOpen}
        onOpenChange={(nextOpen) => {
          setModalOpen(nextOpen);
          if (!nextOpen) setEditingDetail(null);
        }}
        onSuccess={async () => {
          setModalOpen(false);
          setEditingDetail(null);
          await refresh();
        }}
        capabilities={capabilities}
      />
    </Space>
  );
}
