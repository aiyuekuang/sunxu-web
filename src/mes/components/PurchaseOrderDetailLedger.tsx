import { InboxOutlined, PlusOutlined } from '@ant-design/icons';
import type {
  ProColumns,
  ProFormInstance,
  ProTableProps,
} from '@ant-design/pro-components';
import {
  ProForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Button, Input, Space, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CrudListWorkbench } from '../../components/CrudListWorkbench';
import { QuickProFormDateRangePicker } from '../../components/QuickDateRangePicker';
import { DocumentLedgerViewSwitch } from './DocumentLedgerViewSwitch';
import { DocumentViewBar } from './DocumentViewBar';
import { PermissionButton } from './PermissionButton';
import { ResizableProTable } from './ResizableTable';
import { StatusDisplay } from './StatusDisplay';
import type {
  PurchaseOrderDetailLedgerCapabilities,
  PurchaseOrderDetailLedgerFilterFormValues,
  PurchaseOrderDetailLedgerProps,
  PurchaseOrderDetailLedgerQuery,
  PurchaseOrderDetailLedgerResponse,
  PurchaseOrderDetailLedgerRow,
  PurchaseOrderDetailLedgerRowSelection,
  PurchaseOrderDetailLedgerSavedFilters,
  PurchaseOrderDetailLedgerSummary,
  PurchaseOrderDetailLedgerTableParams,
} from './purchase-order-detail-ledger-types';

type SortQuery = Pick<PurchaseOrderDetailLedgerQuery, 'orderBy' | 'orderDir'>;

function normalizeFilterText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function readStatusValues(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const statuses = value.filter(
    (item): item is string => typeof item === 'string' && Boolean(item.trim()),
  );
  return statuses.length ? statuses : undefined;
}

function filterDate(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || !('format' in value)) {
    return undefined;
  }
  const date = value as Dayjs;
  return date.isValid() ? date.format('YYYY-MM-DD') : undefined;
}

function getScopeFilters(
  filters: PurchaseOrderDetailLedgerSavedFilters,
): Pick<PurchaseOrderDetailLedgerSavedFilters, 'onlyInTransit' | 'overdueOnly'> {
  return {
    ...(filters.onlyInTransit === 'true' ? { onlyInTransit: 'true' } : {}),
    ...(filters.overdueOnly === 'true' ? { overdueOnly: 'true' } : {}),
  };
}

function buildSavedFilters(
  values: PurchaseOrderDetailLedgerFilterFormValues,
  preserved: PurchaseOrderDetailLedgerSavedFilters,
): PurchaseOrderDetailLedgerSavedFilters {
  const [start, end] = values.deliveryDate ?? [];
  return {
    ...getScopeFilters(preserved),
    orderNo: normalizeFilterText(values.orderNo),
    statuses: readStatusValues(values.statuses),
    supplierId: normalizeFilterText(values.supplierId),
    materialId: normalizeFilterText(values.materialId),
    startDate: filterDate(start),
    endDate: filterDate(end),
    hideCompletedUndated:
      values.hideCompletedUndated === false ? 'false' : 'true',
  };
}

function filtersFromParams(
  params: Record<string, unknown>,
  fallback: PurchaseOrderDetailLedgerSavedFilters,
): PurchaseOrderDetailLedgerSavedFilters {
  const rawStatuses = params.statuses ?? params.status;
  const statuses =
    typeof rawStatuses === 'string'
      ? [rawStatuses]
      : readStatusValues(rawStatuses);
  const hasOnlyInTransit = Object.prototype.hasOwnProperty.call(
    params,
    'onlyInTransit',
  );
  const hasOverdueOnly = Object.prototype.hasOwnProperty.call(
    params,
    'overdueOnly',
  );
  const hasHideCompletedUndated = Object.prototype.hasOwnProperty.call(
    params,
    'hideCompletedUndated',
  );
  return {
    ...(hasOnlyInTransit
      ? params.onlyInTransit === true || params.onlyInTransit === 'true'
        ? { onlyInTransit: 'true' as const }
        : {}
      : getScopeFilters(fallback).onlyInTransit
        ? { onlyInTransit: 'true' as const }
        : {}),
    ...(hasOverdueOnly
      ? params.overdueOnly === true || params.overdueOnly === 'true'
        ? { overdueOnly: 'true' as const }
        : {}
      : getScopeFilters(fallback).overdueOnly
        ? { overdueOnly: 'true' as const }
        : {}),
    orderNo: normalizeFilterText(params.orderNo),
    statuses,
    supplierId: normalizeFilterText(params.supplierId),
    materialId: normalizeFilterText(params.materialId),
    startDate: normalizeFilterText(params.startDate),
    endDate: normalizeFilterText(params.endDate),
    hideCompletedUndated: hasHideCompletedUndated
      ? params.hideCompletedUndated === false ||
        params.hideCompletedUndated === 'false'
        ? 'false'
        : 'true'
      : fallback.hideCompletedUndated ?? 'true',
  };
}

function toFilterFormValues(
  filters: PurchaseOrderDetailLedgerSavedFilters,
): PurchaseOrderDetailLedgerFilterFormValues {
  return {
    orderNo: filters.orderNo,
    statuses: filters.statuses,
    supplierId: filters.supplierId,
    materialId: filters.materialId,
    deliveryDate:
      filters.startDate && filters.endDate
        ? [dayjs(filters.startDate), dayjs(filters.endDate)]
        : undefined,
    hideCompletedUndated: filters.hideCompletedUndated !== 'false',
  };
}

function countFilters(filters: PurchaseOrderDetailLedgerSavedFilters): number {
  return [
    filters.orderNo,
    filters.statuses?.length,
    filters.supplierId,
    filters.materialId,
    filters.startDate || filters.endDate,
    filters.hideCompletedUndated === 'false' ? 'false' : undefined,
  ].filter(Boolean).length;
}

function buildQuery(
  params: Record<string, unknown>,
  sortQuery: SortQuery,
): PurchaseOrderDetailLedgerQuery {
  const statuses = readStatusValues(params.statuses ?? params.status);
  return {
    keyword: normalizeFilterText(params.keyword),
    orderNo: normalizeFilterText(params.orderNo),
    status:
      statuses?.length || typeof params.status !== 'string'
        ? undefined
        : params.status,
    statuses,
    supplierId: normalizeFilterText(params.supplierId),
    materialId: normalizeFilterText(params.materialId),
    startDate: normalizeFilterText(params.startDate),
    endDate: normalizeFilterText(params.endDate),
    overdueOnly: Boolean(params.overdueOnly) || undefined,
    onlyInTransit: Boolean(params.onlyInTransit) || undefined,
    hideCompletedUndated:
      params.hideCompletedUndated !== false &&
      params.hideCompletedUndated !== 'false',
    orderBy: sortQuery.orderBy ?? 'effectiveDeliveryDate',
    orderDir: sortQuery.orderDir ?? 'ASC',
  };
}

function sortQueryFromTable(
  sort?: Record<string, unknown>,
): SortQuery | undefined {
  const activeSort = Object.entries(sort ?? {}).find(
    ([, value]) => value === 'ascend' || value === 'descend',
  );
  if (!activeSort) return undefined;
  const [rawField, rawOrder] = activeSort;
  const field = rawField.trim().split(',').map((item) => item.trim()).pop();
  return field
    ? {
        orderBy: field.split('.').map((item) => item.trim()).pop(),
        orderDir: rawOrder === 'ascend' ? 'ASC' : 'DESC',
      }
    : undefined;
}

function applySavedSort<Row extends object>(
  columns: ProColumns<Row>[],
  sort: { field: string; order: 'ascend' | 'descend' },
): ProColumns<Row>[] {
  return columns.map((column) => {
    if (column.children) {
      return {
        ...column,
        children: applySavedSort(column.children, sort),
      };
    }
    const dataIndex = Array.isArray(column.dataIndex)
      ? column.dataIndex.join('.')
      : typeof column.dataIndex === 'string'
        ? column.dataIndex
        : undefined;
    const key = typeof column.key === 'string' ? column.key : dataIndex;
    if (column.sorter !== true) return column;
    const active = key === sort.field || dataIndex === sort.field;
    return {
      ...column,
      sortOrder: active ? sort.order : null,
      defaultSortOrder: active ? sort.order : undefined,
    };
  });
}

function purchaseOrderName(value?: string | null): string {
  return value || '-';
}

function renderIncomingInspection(
  row: PurchaseOrderDetailLedgerRow,
  capabilities: PurchaseOrderDetailLedgerCapabilities,
  actions: {
    onOpenInspection: (id: string) => void;
    onListInspections: (itemId: string) => void;
  },
) {
  const incomingInspection = row.incomingInspection;
  if (!incomingInspection) return '-';

  const inspectionStatusNodes = incomingInspection.inspectionStatusCounts.map(
    ({ status, count }) => {
      const content = (
        <Space key={status} size={4}>
          <StatusDisplay value={status} enumMap={capabilities.inspectionStatusEnum} />
          <Typography.Text type="secondary">×{count}</Typography.Text>
        </Space>
      );
      return capabilities.canViewInspectionDetail && incomingInspection.inspectionId ? (
        <Button
          key={status}
          type="link"
          size="small"
          title="查看质检单"
          onClick={() => actions.onOpenInspection(incomingInspection.inspectionId!)}
        >
          {content}
        </Button>
      ) : (
        <span key={status}>{content}</span>
      );
    },
  );

  if (
    incomingInspection.unreportedReceiptCount === 0 &&
    inspectionStatusNodes.length === 0
  ) {
    return '-';
  }

  return (
    <Space size={4} wrap>
      {incomingInspection.unreportedReceiptCount > 0 ? (
        <Space size={4}>
          <StatusDisplay
            value="not_reported"
            enumMap={capabilities.inspectionTrackingEnum}
          />
          <Typography.Text type="secondary">
            ×{incomingInspection.unreportedReceiptCount}
          </Typography.Text>
        </Space>
      ) : null}
      {inspectionStatusNodes}
      {capabilities.canListInspections ? (
        <Button
          type="link"
          size="small"
          title="查看该采购订单行的来料检验"
          onClick={() => actions.onListInspections(row.id)}
        >
          查看
        </Button>
      ) : null}
    </Space>
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain purchase-order-detail-ledger
 * @sunxu-reason Keeps purchase-order detail filters, saved-view sort, receiving selection, inspection links, price-aware totals, and row action placement while MES requests, permissions, navigation, and receipt workflows stay host supplied.
 * Embedded purchase-order detail ledger; the host owns data access, permissions, routes, and receipt actions.
 */
export function PurchaseOrderDetailLedger({
  capabilities,
  savedViewController,
  tableActionRef,
  filterFormRef,
  initialOnlyInTransit = false,
  onViewChange,
  onCreate,
  onOpenOrder,
  onViewReceipts,
  onOpenInspection,
  onListInspections,
}: PurchaseOrderDetailLedgerProps) {
  const defaultFilters = useMemo<PurchaseOrderDetailLedgerSavedFilters>(
    () =>
      capabilities.initialFilters ?? {
        onlyInTransit: 'true',
        hideCompletedUndated: 'true',
      },
    [capabilities.initialFilters],
  );
  const initialFilters = useMemo<PurchaseOrderDetailLedgerSavedFilters>(
    () =>
      initialOnlyInTransit
        ? { onlyInTransit: 'true', hideCompletedUndated: 'true' }
        : defaultFilters,
    [defaultFilters, initialOnlyInTransit],
  );
  const [appliedFilters, setAppliedFilters] = useState(() => {
    if (initialOnlyInTransit) return initialFilters;
    const hasSavedFilterParams = Object.keys(savedViewController.params).length > 0;
    const fallback = hasSavedFilterParams
      ? { hideCompletedUndated: initialFilters.hideCompletedUndated ?? 'true' }
      : initialFilters;
    return filtersFromParams(savedViewController.params, fallback);
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [keywordDraft, setKeywordDraft] = useState('');
  const [summary, setSummary] = useState<PurchaseOrderDetailLedgerSummary>();
  const [priceVisible, setPriceVisible] = useState(false);
  const [selectedSourceItemIds, setSelectedSourceItemIds] = useState<string[]>([]);
  const [selectedSourceSupplierId, setSelectedSourceSupplierId] = useState<
    string | undefined
  >();
  const [selectedSourceSupplierName, setSelectedSourceSupplierName] = useState<
    string | undefined
  >();
  const [receiptSourceItemIds, setReceiptSourceItemIds] = useState<string[] | null>(null);
  const latestQueryRef = useRef<PurchaseOrderDetailLedgerQuery>({});
  const requestSequenceRef = useRef(0);
  const firstViewSyncRef = useRef(true);

  const clearSelection = useCallback(() => {
    setSelectedSourceItemIds([]);
    setSelectedSourceSupplierId(undefined);
    setSelectedSourceSupplierName(undefined);
  }, []);

  useEffect(() => {
    if (firstViewSyncRef.current) {
      firstViewSyncRef.current = false;
      return;
    }
    const next = filtersFromParams(savedViewController.params, {
      hideCompletedUndated: 'true',
    });
    setAppliedFilters(next);
    clearSelection();
    filterFormRef.current?.resetFields();
    filterFormRef.current?.setFieldsValue(toFilterFormValues(next));
  }, [
    clearSelection,
    filterFormRef,
    savedViewController.activeViewId,
    savedViewController.params,
  ]);

  const handleKeywordSearch = useCallback(
    (value: string) => {
      const next = value.trim();
      setKeyword(next);
      setKeywordDraft(next);
      clearSelection();
    },
    [clearSelection],
  );

  const handleKeywordChange = useCallback(
    (value: string) => {
      setKeywordDraft(value);
      if (!value) handleKeywordSearch('');
    },
    [handleKeywordSearch],
  );

  const handleApplyFilters = useCallback(async () => {
    const values = (filterFormRef.current?.getFieldsValue() ??
      {}) as PurchaseOrderDetailLedgerFilterFormValues;
    const next = buildSavedFilters(values, appliedFilters);
    setAppliedFilters(next);
    savedViewController.captureFilters(next);
    clearSelection();
    return true;
  }, [appliedFilters, clearSelection, filterFormRef, savedViewController]);

  const handleResetFilters = useCallback(() => {
    const next: PurchaseOrderDetailLedgerSavedFilters = {
      ...getScopeFilters(appliedFilters),
      hideCompletedUndated: 'true',
    };
    setAppliedFilters(next);
    savedViewController.captureFilters(next);
    setKeyword('');
    setKeywordDraft('');
    clearSelection();
    filterFormRef.current?.resetFields();
    filterFormRef.current?.setFieldsValue(toFilterFormValues(next));
  }, [appliedFilters, clearSelection, filterFormRef, savedViewController]);

  const restoreFilterDraft = useCallback(() => {
    filterFormRef.current?.resetFields();
    filterFormRef.current?.setFieldsValue(toFilterFormValues(appliedFilters));
  }, [appliedFilters, filterFormRef]);

  const handleFilterDrawerOpenChange = useCallback(
    (open: boolean) => {
      if (!open) restoreFilterDraft();
      setFilterDrawerOpen(open);
    },
    [restoreFilterDraft],
  );

  const handleResponse = useCallback(
    (response: PurchaseOrderDetailLedgerResponse) => {
      setPriceVisible(response.priceVisible);
      setSummary(response.summary);
      capabilities.onResponse?.(response);
    },
    [capabilities],
  );

  const request = useCallback<
    NonNullable<ProTableProps<PurchaseOrderDetailLedgerRow, PurchaseOrderDetailLedgerTableParams>['request']>
  >(
    async (params, sort) => {
      const requestId = ++requestSequenceRef.current;
      const activeSort = sortQueryFromTable(sort) ?? {
        orderBy: savedViewController.currentSortRef.current.field,
        orderDir:
          savedViewController.currentSortRef.current.order === 'ascend'
            ? ('ASC' as const)
            : ('DESC' as const),
      };
      const query = buildQuery(
        params as Record<string, unknown>,
        activeSort,
      );
      latestQueryRef.current = query;
      const response = await capabilities.requestList({
        ...query,
        page: Number(params.current ?? 1),
        pageSize: Number(params.pageSize ?? 20),
      });
      if (requestId === requestSequenceRef.current) {
        handleResponse(response);
      }
      return {
        data: response.list ?? [],
        total: response.total ?? 0,
        success: true,
      };
    },
    [capabilities, handleResponse, savedViewController.currentSortRef],
  );

  const columns = useMemo<ProColumns<PurchaseOrderDetailLedgerRow>[]>(
    () => [
      {
        title: '订单号',
        dataIndex: 'orderNo',
        hideInTable: true,
      },
      {
        title: '状态',
        dataIndex: 'status',
        hideInTable: true,
        valueType: 'select',
        valueEnum: capabilities.orderStatusEnum,
        fieldProps: { mode: 'multiple' },
      },
      {
        ...capabilities.supplierFilterColumn,
        title: '供应商',
        dataIndex: 'supplierId',
        hideInTable: true,
      },
      {
        ...capabilities.materialFilterColumn,
        title: '物料',
        dataIndex: 'materialId',
        hideInTable: true,
      },
      {
        title: '交货日期',
        dataIndex: 'deliveryDate',
        hideInTable: true,
        valueType: 'dateRange',
        fieldProps: capabilities.dateRangeFieldProps,
        search: {
          transform: (value: [string, string]) => ({
            startDate: value[0],
            endDate: value[1],
          }),
        },
      },
      {
        title: '隐藏无交货日期的已收完明细',
        dataIndex: 'hideCompletedUndated',
        hideInTable: true,
        valueType: 'switch',
        fieldProps: { checkedChildren: '隐藏', unCheckedChildren: '显示' },
        formItemProps: {
          extra: '只影响采购订单明细台账展示，不删除采购订单或收货记录',
        },
      },
      {
        title: '物料名称',
        dataIndex: 'materialName',
        width: 180,
        ellipsis: true,
        sorter: true,
        search: false,
        render: (_value, row) => purchaseOrderName(row.material?.name),
      },
      {
        title: '物料编码',
        dataIndex: 'materialCode',
        width: 150,
        sorter: true,
        search: false,
        render: (_value, row) => purchaseOrderName(row.material?.code),
      },
      {
        title: '规格',
        dataIndex: 'materialSpec',
        width: 150,
        ellipsis: true,
        search: false,
        render: (_value, row) => purchaseOrderName(row.material?.spec),
      },
      {
        title: '基础单位',
        dataIndex: 'baseUnit',
        width: 95,
        search: false,
        render: (_value, row) =>
          purchaseOrderName(
            capabilities.format.formatUnitLabel(
              row.baseUnit ?? row.material?.unit,
              capabilities.format.unitLabelMap,
            ),
          ),
      },
      {
        title: '订购数量',
        dataIndex: 'orderedQty',
        width: 110,
        align: 'right',
        sorter: true,
        search: false,
        render: (_value, row) => capabilities.format.formatNumber(row.orderedQty),
      },
      {
        title: '已收数量',
        dataIndex: 'receivedQty',
        width: 110,
        align: 'right',
        sorter: true,
        search: false,
        render: (_value, row) => capabilities.format.formatNumber(row.receivedQty),
      },
      {
        title: '待收数量',
        dataIndex: 'outstandingQty',
        width: 110,
        align: 'right',
        sorter: true,
        search: false,
        render: (_value, row) => capabilities.format.formatNumber(row.outstandingQty),
      },
      {
        title: '采购单位数量',
        dataIndex: 'purchaseQty',
        width: 120,
        align: 'right',
        search: false,
        render: (_value, row) =>
          row.purchaseQty == null
            ? '-'
            : capabilities.format.formatNumber(row.purchaseQty),
      },
      {
        title: '待收(采购单位)',
        dataIndex: 'purchaseOutstandingQty',
        width: 130,
        align: 'right',
        search: false,
        render: (_value, row) =>
          row.purchaseOutstandingQty == null
            ? '-'
            : capabilities.format.formatNumber(row.purchaseOutstandingQty),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 110,
        valueType: 'select',
        valueEnum: capabilities.orderStatusEnum,
        search: false,
        render: (_value, row) =>
          row.status ? (
            <StatusDisplay value={row.status} enumMap={capabilities.orderStatusEnum} />
          ) : (
            '-'
          ),
      },
      {
        title: '来料报检',
        dataIndex: 'incomingInspection',
        width: 190,
        search: false,
        render: (_value, row) =>
          renderIncomingInspection(row, capabilities, {
            onOpenInspection,
            onListInspections,
          }),
      },
      ...(capabilities.lineCustomFieldColumns ?? []),
      ...(capabilities.materialCustomFieldColumns ?? []),
      {
        title: '交货日期',
        dataIndex: 'effectiveDeliveryDate',
        valueType: 'date',
        width: 120,
        sorter: true,
        search: false,
        render: (_value, row) =>
          capabilities.format.formatDate(
            row.effectiveDeliveryDate ?? row.deliveryDate,
          ),
      },
      {
        title: '采购订单号',
        dataIndex: 'orderNo',
        width: 170,
        sorter: true,
        search: false,
        copyable: true,
        render: (_value, row) =>
          capabilities.canViewOrder && row.purchaseOrderId ? (
            <Button
              type="link"
              size="small"
              onClick={() => onOpenOrder(row.purchaseOrderId)}
            >
              {row.orderNo}
            </Button>
          ) : (
            purchaseOrderName(row.orderNo)
          ),
      },
      {
        title: '供应商',
        dataIndex: 'supplierName',
        width: 170,
        ellipsis: true,
        sorter: true,
        search: false,
        render: (_value, row) => purchaseOrderName(row.supplierName),
      },
      {
        title: '采购员',
        dataIndex: ['purchasingRep', 'realName'],
        width: 110,
        search: false,
        render: (_value, row) =>
          purchaseOrderName(
            row.purchasingRep?.realName || row.purchasingRep?.username,
          ),
      },
      {
        title: '创建时间',
        dataIndex: 'orderCreatedAt',
        valueType: 'dateTime',
        width: 160,
        sorter: true,
        search: false,
        render: (_value, row) => capabilities.format.formatDateTime(row.orderCreatedAt),
      },
      {
        title: '更新时间',
        dataIndex: 'orderUpdatedAt',
        valueType: 'dateTime',
        width: 160,
        sorter: true,
        search: false,
        render: (_value, row) => capabilities.format.formatDateTime(row.orderUpdatedAt),
      },
      {
        title: '行备注',
        dataIndex: 'remarks',
        width: 180,
        ellipsis: true,
        search: false,
        render: (_value, row) => purchaseOrderName(row.remarks),
      },
      {
        title: '更多操作',
        key: 'actions',
        dataIndex: '__purchaseOrderDocumentActions',
        width: 64,
        fixed: 'right',
        valueType: 'option',
        search: false,
        render: (_value, row) => {
          const canReceiveRow =
            capabilities.canReceive &&
            row.availableActions?.includes('receive') === true;
          if (!row.purchaseOrderId || (!capabilities.canViewOrder && !canReceiveRow)) {
            return null;
          }
          return capabilities.renderDocumentActions(row, {
            canViewOrder: capabilities.canViewOrder,
            canReceiveRow,
            onOpenOrder: () => onOpenOrder(row.purchaseOrderId),
            onViewReceipts: () => onViewReceipts(row.purchaseOrderId),
            onReceive: () => setReceiptSourceItemIds([row.id]),
          });
        },
      },
    ],
    [
      capabilities,
      onListInspections,
      onOpenInspection,
      onOpenOrder,
      onViewReceipts,
    ],
  );

  const viewColumns = useMemo(
    () => applySavedSort(columns, savedViewController.currentConfig.sort),
    [columns, savedViewController.currentConfig.sort],
  );

  const rowSelection = useMemo<PurchaseOrderDetailLedgerRowSelection | undefined>(
    () =>
      capabilities.canReceive
        ? {
            selectedRowKeys: selectedSourceItemIds,
            preserveSelectedRowKeys: true,
            getCheckboxProps: (record) => {
              const blockReason = capabilities.getReceiptSelectionBlockReason(
                record,
                selectedSourceSupplierId,
              );
              return { disabled: Boolean(blockReason), title: blockReason };
            },
            onChange: (keys, selectedRows) => {
              const nextKeys = keys.map(String);
              setSelectedSourceItemIds(nextKeys);
              const supplier = selectedRows.find((row) => Boolean(row.supplierId));
              if (nextKeys.length === 0 || !supplier?.supplierId) {
                setSelectedSourceSupplierId(undefined);
                setSelectedSourceSupplierName(undefined);
                return;
              }
              setSelectedSourceSupplierId(supplier.supplierId);
              setSelectedSourceSupplierName(supplier.supplierName ?? undefined);
            },
          }
        : undefined,
    [
      capabilities.canReceive,
      capabilities.getReceiptSelectionBlockReason,
      selectedSourceItemIds,
      selectedSourceSupplierId,
    ],
  );

  const selectedPurchaseReceiptAction = useCallback(
    (onCleanSelected?: () => void) => {
      if (!selectedSourceItemIds.length || !capabilities.canReceive) return;
      setReceiptSourceItemIds([...selectedSourceItemIds]);
      onCleanSelected?.();
      clearSelection();
    },
    [capabilities.canReceive, clearSelection, selectedSourceItemIds],
  );

  const onTableChange: NonNullable<
    ProTableProps<PurchaseOrderDetailLedgerRow, PurchaseOrderDetailLedgerTableParams>['onChange']
  > = (_pagination, _filters, sorter, extra) => {
    if (savedViewController.loading || extra.action !== 'sort') return;
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const rawField = activeSorter?.field;
    const field = Array.isArray(rawField)
      ? rawField.map(String).join('.')
      : typeof rawField === 'string'
        ? rawField
        : undefined;
    const order =
      activeSorter?.order === 'ascend' || activeSorter?.order === 'descend'
        ? activeSorter.order
        : undefined;
    savedViewController.changeSort(field, order);
  };

  const filterForm = (
    <ProForm<PurchaseOrderDetailLedgerFilterFormValues>
      formRef={filterFormRef}
      initialValues={toFilterFormValues(appliedFilters)}
      disabled={savedViewController.loading}
      submitter={false}
    >
      <ProFormText
        name="orderNo"
        label="订单号"
        placeholder="输入订单号"
        fieldProps={{ allowClear: true }}
      />
      <ProFormSelect
        name="statuses"
        label="状态"
        valueEnum={capabilities.orderStatusEnum}
        placeholder="选择订单状态"
        fieldProps={{ allowClear: true, mode: 'multiple' }}
      />
      <ProFormSelect
        name="supplierId"
        label="供应商"
        request={capabilities.supplierFilterColumn.request}
        params={capabilities.supplierFilterColumn.params}
        fieldProps={capabilities.supplierFilterColumn.fieldProps}
        showSearch
        debounceTime={300}
        placeholder="输入供应商名称或编码搜索"
      />
      <ProFormSelect
        name="materialId"
        label="物料"
        request={capabilities.materialFilterColumn.request}
        params={capabilities.materialFilterColumn.params}
        fieldProps={capabilities.materialFilterColumn.fieldProps}
        showSearch
        debounceTime={300}
        placeholder="输入物料编码或名称搜索"
      />
      <QuickProFormDateRangePicker
        name="deliveryDate"
        label="交货日期"
        fieldProps={{
          allowClear: true,
          ...(capabilities.dateRangeFieldProps &&
          typeof capabilities.dateRangeFieldProps === 'object'
            ? capabilities.dateRangeFieldProps
            : {}),
          style: { width: '100%' },
        }}
      />
      <ProFormSwitch
        name="hideCompletedUndated"
        label="隐藏无交货日期的已收完明细"
        fieldProps={{ checkedChildren: '隐藏', unCheckedChildren: '显示' }}
        extra="只影响采购订单明细台账展示，不删除采购订单或收货记录"
      />
    </ProForm>
  );

  const latestExportFileName =
    typeof capabilities.exportFileName === 'function'
      ? capabilities.exportFileName
      : capabilities.exportFileName;

  return (
    <>
      <CrudListWorkbench<PurchaseOrderDetailLedgerRow, PurchaseOrderDetailLedgerTableParams>
        as="section"
        layout="embedded"
        fill
        search={
          <Input.Search
            aria-label="关键字搜索"
            allowClear
            placeholder="输入采购订单号、供应商、物料或行备注搜索"
            value={keywordDraft}
            style={{ width: 'clamp(160px, 20vw, 256px)' }}
            onChange={(event) => handleKeywordChange(event.target.value)}
            onSearch={handleKeywordSearch}
          />
        }
        viewBar={
          <DocumentViewBar
            controller={savedViewController}
            filterCount={countFilters(appliedFilters)}
            onOpenFilters={() => {
              restoreFilterDraft();
              setFilterDrawerOpen(true);
            }}
          />
        }
        advancedFilters={{
          open: filterDrawerOpen,
          onOpenChange: handleFilterDrawerOpenChange,
          title: '筛选',
          ariaLabel: '采购订单明细筛选',
          activeCount: countFilters(appliedFilters),
          children: filterForm,
          onApply: handleApplyFilters,
          onReset: handleResetFilters,
          onCancel: restoreFilterDraft,
        }}
        toolbarActions={
          <Space wrap>
            <DocumentLedgerViewSwitch
              value="detail"
              onChange={onViewChange ?? (() => undefined)}
            />
            {capabilities.canExport
              ? capabilities.renderExportAction({
                  getCurrentQuery: () => latestQueryRef.current,
                  exportExcel: capabilities.exportExcel,
                  fileName: latestExportFileName,
                  permission: capabilities.exportPermission,
                })
              : null}
            <PermissionButton
              type="primary"
              icon={<PlusOutlined />}
              permission={capabilities.createPermission}
              visible={capabilities.canCreate && Boolean(onCreate)}
              onClick={onCreate}
            >
              新增
            </PermissionButton>
          </Space>
        }
        tableProps={{
          rowKey: 'id',
          columns: viewColumns,
          actionRef: tableActionRef,
          request,
          params: { ...appliedFilters, keyword: keyword || undefined },
          pagination: { defaultPageSize: 20, showSizeChanger: true },
          scroll: { x: 2230 },
          options: { reload: true, density: false, setting: false },
          rowSelection,
          tableAlertOptionRender: ({ onCleanSelected }) =>
            selectedSourceItemIds.length > 0 && capabilities.canReceive ? (
              <Space size={12}>
                <Typography.Text type="secondary">
                  供应商：{selectedSourceSupplierName ?? '-'}
                  （批量收货仅限同一供应商）
                </Typography.Text>
                <PermissionButton
                  type="link"
                  icon={<InboxOutlined />}
                  permission={capabilities.receivePermission}
                  visible={capabilities.canReceive}
                  onClick={() => selectedPurchaseReceiptAction(onCleanSelected)}
                >
                  采购收货（{selectedSourceItemIds.length}）
                </PermissionButton>
              </Space>
            ) : null,
          columnsState: {
            value: savedViewController.currentConfig.columns,
            onChange: savedViewController.changeColumns,
          },
          onChange: onTableChange,
          sortDirections: ['ascend', 'descend'],
          footer: () =>
            summary ? (
              <Space size="large" wrap>
                <Typography.Text type="secondary">本筛选合计：</Typography.Text>
                <span>明细行 {capabilities.format.formatNumber(summary.lineCount)}</span>
                <span>物料数 {capabilities.format.formatNumber(summary.materialCount)}</span>
                <span>订购量 {capabilities.format.formatNumber(summary.orderedQty)}</span>
                <span>已收量 {capabilities.format.formatNumber(summary.receivedQty)}</span>
                <span>待收量 {capabilities.format.formatNumber(summary.outstandingQty)}</span>
                {priceVisible ? (
                  <>
                    <span>
                      金额 {summary.amount == null ? '-' : capabilities.format.formatCurrency(summary.amount)}
                    </span>
                    <span>
                      折扣金额 {summary.discountAmount == null ? '-' : capabilities.format.formatCurrency(summary.discountAmount)}
                    </span>
                    <span>
                      折后金额 {summary.discountedAmount == null ? '-' : capabilities.format.formatCurrency(summary.discountedAmount)}
                    </span>
                    <span>
                      税额 {summary.taxAmount == null ? '-' : capabilities.format.formatCurrency(summary.taxAmount)}
                    </span>
                    <span>
                      总金额 {summary.totalAmount == null ? '-' : capabilities.format.formatCurrency(summary.totalAmount)}
                    </span>
                  </>
                ) : null}
              </Space>
            ) : null,
        }}
        renderTable={(tableProps) => (
          <ResizableProTable<PurchaseOrderDetailLedgerRow, PurchaseOrderDetailLedgerTableParams>
            {...tableProps}
            rowKey="id"
            actionRef={tableActionRef}
            request={request}
            columns={viewColumns}
            search={false}
            pagination={{ defaultPageSize: 20, showSizeChanger: true }}
            resizable={{
              ...capabilities.resizable,
              persistenceKey:
                typeof capabilities.resizable.persistenceKey === 'string'
                  ? `${capabilities.resizable.persistenceKey}-view-${savedViewController.activeViewId ?? 'default'}`
                  : capabilities.resizable.persistenceKey,
              serverSortFields: capabilities.serverSortFields,
              sortPersistenceKey: false,
            }}
            scroll={{ x: 2230 }}
            sortDirections={['ascend', 'descend']}
            onChange={onTableChange}
          />
        )}
      />
      {capabilities.renderPurchaseReceiptAction({
        sourceItemIds: receiptSourceItemIds,
        onClose: () => setReceiptSourceItemIds(null),
        onSuccess: () => {
          setReceiptSourceItemIds(null);
          clearSelection();
          tableActionRef.current?.reload();
        },
        onPrintReceipt: capabilities.canPrintPurchaseReceipt
          ? capabilities.onPrintReceipt
          : undefined,
      })}
      {capabilities.printJobActionNode}
    </>
  );
}
