import { PrinterOutlined } from '@ant-design/icons';
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
  ProTableProps,
} from '@ant-design/pro-components';
import { Button, Drawer, Empty, Space, Spin, Typography } from 'antd';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Key,
  type RefObject,
} from 'react';
import { ProDescriptions } from '@ant-design/pro-components';
import type { StatusMap } from '../../../components/StatusDisplay';
import { ApprovalPanel } from '../documents/ApprovalPanel';
import { AmountPolicySnapshotTag } from '../accounting/AmountPolicySnapshotTag';
import { BusinessInvoiceCoverageCard } from '../accounting/BusinessInvoiceCoverageCard';
import { createMaterialCustomFieldColumns } from '../inventory/materialCustomFieldColumns';
import { DocumentCustomFieldPanel } from '../documents/DocumentCustomFieldPanel';
import { FileUrlsInline } from '../shared/DrawingFilesInline';
import { DetailLedgerDocumentActions } from '../documents/DetailLedgerDocumentActions';
import { DocumentDetailLedgerTable } from '../documents/DocumentDetailLedgerTable';
import { EntityThumbnail } from '../documents/EntityThumbnail';
import { SaleDeliveryDocumentActionsDropdown } from './SaleDeliveryDocumentActionsDropdown';
import { SaleDeliveryItemsPanel } from './SaleDeliveryItemsPanel';
import { markCompleteActionMenuColumn } from '../../table/completeActionMenuColumn';
import { SaleOrderShipActionModal } from './SaleOrderShipActionModal';
import { SaleReturnEditDrawer } from './SaleReturnEditDrawer';
import { SaleReturnReceiveModal } from './SaleReturnReceiveModal';
import { SaleReturnStockConversionDrawer } from './SaleReturnStockConversionDrawer';
import { renderCustomFieldCell } from '../documents/CustomFieldCell';
import { StatusDisplay } from '../../../components/StatusDisplay';
import {
  restoreDetailLedgerDateRange,
} from '../documents/DetailLedgerFilterDrawer';
import {
  BUSINESS_DATE_RANGE_PRESETS,
} from '../../table/dateRangePresets';
import type {
  DocumentActionDefinition,
} from '../documents/DocumentActionsDropdown';
import type {
  SaleDeliveryActionDrawerModel,
  SaleDeliveryDetailLedgerCapabilities,
  SaleDeliveryDetailLedgerQuery,
  SaleDeliveryDetailLedgerRow,
  SaleDeliveryDetailLedgerSummary,
  SaleDeliveryDocumentActionDrawerProps,
  SaleOrderDetailLedgerCapabilities,
  SaleOrderDetailLedgerQuery,
  SaleOrderDetailLedgerRow,
  SaleOrderDetailLedgerSummary,
  SaleReturnDetailLedgerCapabilities,
  SaleReturnDetailLedgerQuery,
  SaleReturnDetailLedgerRow,
  SaleReturnDetailLedgerSummary,
  SaleReturnLedgerDocument,
  SalesDetailLedgerBatchPrintAction,
  SalesDetailLedgerPrintParam,
  SalesDetailLedgerResponse,
} from './sales-detail-ledger-types';

type AmountMask = SaleOrderDetailLedgerCapabilities['maskAmount'];
const amountMaskRevisionByCallback = new WeakMap<AmountMask, number>();
let nextAmountMaskRevision = 0;

function getAmountVisibilityRevision(
  maskAmount: AmountMask,
  priceAllowed: boolean,
): string {
  let callbackRevision = amountMaskRevisionByCallback.get(maskAmount);
  if (callbackRevision === undefined) {
    callbackRevision = ++nextAmountMaskRevision;
    amountMaskRevisionByCallback.set(maskAmount, callbackRevision);
  }
  return `${callbackRevision}:${priceAllowed ? 'allowed' : 'restricted'}`;
}

function withAmountVisibilityRevision<T extends object>(
  column: ProColumns<T>,
  revision: string,
): ProColumns<T> {
  return {
    ...column,
    __sxwAmountVisibilityRevision: revision,
  } as ProColumns<T>;
}

function withAmountVisibilityRevisions<T extends object>(
  columns: ProColumns<T>[],
  revision: string,
): ProColumns<T>[] {
  return columns.map((column) =>
    withAmountVisibilityRevision(column, revision),
  );
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readDisplayJson(value: unknown): Record<string, unknown> {
  return readRecord(value);
}

function formatCustomFieldSummaryValue(
  item: { fieldKey: string; value: number | null },
  schema:
    | import('../documents/document-line-custom-field-types').DocumentLineCustomFieldSchema
    | null
    | undefined,
  formatNumber: (value: number | string | null | undefined) => string,
  maskAmount: AmountMask,
  priceAllowed: boolean,
): string {
  if (item.value == null) return '-';
  const formatted = formatNumber(item.value);
  const field = schema?.fields?.find(
    (candidate) => candidate.fieldKey === item.fieldKey,
  );
  return field?.dataType === 'money' || !field
    ? maskAmount(formatted, priceAllowed)
    : formatted;
}

function lineCustomFieldWidth(field: {
  dataType: string;
  displayJson?: unknown;
}): number {
  const width = readDisplayJson(field.displayJson).listWidth;
  if (typeof width === 'number' && width > 0) return width;
  if (field.dataType === 'long_text') return 200;
  if (field.dataType === 'date' || field.dataType === 'datetime') return 168;
  if (field.dataType === 'boolean') return 96;
  return 140;
}

function createStatusLedgerColumn<T extends object>(
  dataIndex: string,
  title: string,
  enumMap: StatusMap,
  renderValue: (record: T) => string | null | undefined,
  overrides: Partial<ProColumns<T>> = {},
): ProColumns<T> {
  return {
    title,
    dataIndex,
    width: 110,
    valueType: 'select',
    valueEnum: Object.fromEntries(
      Object.entries(enumMap).map(([key, item]) => [key, { text: item.text }]),
    ),
    render: (_value, record) => {
      const value = renderValue(record);
      return value ? <StatusDisplay value={value} enumMap={enumMap} /> : '-';
    },
    ...overrides,
  };
}

function createLedgerDateColumn<T extends object>(
  dataIndex: string,
  title: string,
  formatDate: (value: string | null | undefined) => string,
  options: {
    width?: number;
    sorter?: boolean;
    value?: (record: T) => string | null | undefined;
  } = {},
): ProColumns<T> {
  return {
    title,
    dataIndex,
    valueType: 'date',
    width: options.width ?? 120,
    sorter: options.sorter,
    search: false,
    render: (_dom, record) => {
      const value: unknown = options.value
        ? options.value(record)
        : Reflect.get(record, dataIndex);
      return formatDate(typeof value === 'string' ? value : null);
    },
  };
}

function createLineCustomFieldColumns<T extends object>(
  schema: import('../documents/document-line-custom-field-types').DocumentLineCustomFieldSchema | null | undefined,
  prefixTitle: string,
  options: {
    maskAmount: AmountMask;
    priceAllowed: boolean;
    amountVisibilityRevision: string;
  },
): ProColumns<T>[] {
  const fields = (schema?.fields ?? [])
    .filter(
      (field) =>
        field.isActive !== false &&
        readDisplayJson(field.displayJson).showInList === true,
    )
    .slice()
    .sort((left, right) => {
      const leftOrder = readDisplayJson(left.displayJson).sortOrder;
      const rightOrder = readDisplayJson(right.displayJson).sortOrder;
      const leftValue =
        typeof leftOrder === 'number' ? leftOrder : (left.sortOrder ?? 0);
      const rightValue =
        typeof rightOrder === 'number' ? rightOrder : (right.sortOrder ?? 0);
      return leftValue - rightValue;
    });
  return fields.map((field) => {
    const column: ProColumns<T> = {
      title: `${prefixTitle}·${field.label}`,
      key: `line-custom-${field.fieldKey}`,
      width: lineCustomFieldWidth(field),
      ellipsis: true,
      search: false,
      sorter: false,
      render: (_value, row) => {
        const carrier = readRecord(row);
        const rendered = renderCustomFieldCell(field, {
          computedValues: carrier.customComputedValues,
          rawValues: carrier.customValues,
          errors: carrier.customComputedErrors,
        });
        if (
          field.dataType === 'money' &&
          typeof rendered === 'string' &&
          rendered !== '-'
        ) {
          return options.maskAmount(rendered, options.priceAllowed);
        }
        return rendered;
      },
    };
    return field.dataType === 'money'
      ? withAmountVisibilityRevision(
          column,
          options.amountVisibilityRevision,
        )
      : column;
  });
}

export interface SalesDetailLedgerPrintAction<TRow extends object>
  extends SalesDetailLedgerBatchPrintAction<TRow> {}

export interface SalesDetailLedgerBatchPrintResult<TRow extends object> {
  rowSelection: ProTableProps<TRow, Record<string, unknown>>['rowSelection'];
  tableAlertOptionRender: ProTableProps<
    TRow,
    Record<string, unknown>
  >['tableAlertOptionRender'];
}

/**
 * Shared selectable-ledger print behavior. It keeps cross-page row keys,
 * deduplicates multiple lines belonging to the same document, and leaves the
 * actual print-job flow with the host.
 */
export function useSalesDetailLedgerBatchPrint<TRow extends object>({
  canPrint,
  getRowKey,
  actions,
  openPrintBatch,
}: {
  canPrint: boolean;
  getRowKey: (record: TRow) => Key;
  actions: readonly SalesDetailLedgerPrintAction<TRow>[];
  openPrintBatch: (requests: readonly SalesDetailLedgerPrintParam[]) => void;
}): SalesDetailLedgerBatchPrintResult<TRow> {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [selectedRowsByKey, setSelectedRowsByKey] = useState<
    Record<string, TRow>
  >({});
  const getRowKeyRef = useRef(getRowKey);
  const actionsRef = useRef(actions);
  getRowKeyRef.current = getRowKey;
  actionsRef.current = actions;

  const selectedPrintActionParams = useMemo(
    () =>
      actions.map((action) => {
        const seen = new Set<string>();
        const params = selectedRowKeys.flatMap((key) => {
          const row = selectedRowsByKey[String(key)];
          const printParams = row ? action.getPrintParams(row) : null;
          if (!printParams) return [];
          const dedupeKey = `${printParams.businessType}:${printParams.businessId}`;
          if (seen.has(dedupeKey)) return [];
          seen.add(dedupeKey);
          return [printParams];
        });
        return { action, params };
      }),
    [actions, selectedRowKeys, selectedRowsByKey],
  );

  const onChange = useCallback((keys: Key[], rows: TRow[]) => {
    const nextKeys = keys.map(String);
    setSelectedRowKeys(nextKeys);
    setSelectedRowsByKey((current) => {
      const next = { ...current };
      rows.forEach((row) => {
        next[String(getRowKeyRef.current(row))] = row;
      });
      const selectedKeySet = new Set(nextKeys);
      Object.keys(next).forEach((key) => {
        if (!selectedKeySet.has(key)) delete next[key];
      });
      return next;
    });
  }, []);

  const rowSelection = useMemo<
    ProTableProps<TRow, Record<string, unknown>>['rowSelection']
  >(() => {
    if (!canPrint) return undefined;
    return {
      selectedRowKeys,
      preserveSelectedRowKeys: true,
      getCheckboxProps: (record) => {
        const hasPrintParams = actionsRef.current.some((action) =>
          Boolean(action.getPrintParams(record)),
        );
        return {
          disabled: !hasPrintParams,
          title: hasPrintParams ? undefined : '该明细没有可打印的所属单据',
        };
      },
      onChange,
    };
  }, [canPrint, onChange, selectedRowKeys]);

  const tableAlertOptionRender = useCallback<
    Exclude<
      NonNullable<
        ProTableProps<TRow, Record<string, unknown>>['tableAlertOptionRender']
      >,
      false
    >
  >(
    ({ onCleanSelected }) => {
      if (!canPrint || selectedRowKeys.length === 0) return null;
      const hasDeduplicatedRows = selectedPrintActionParams.some(
        ({ params }) => params.length < selectedRowKeys.length,
      );
      return (
        <Space>
          {selectedPrintActionParams.map(({ action, params }) => (
            <Button
              key={action.label}
              type="link"
              icon={<PrinterOutlined />}
              disabled={params.length === 0}
              onClick={() => {
                if (params.length > 0) openPrintBatch(params);
              }}
            >
              {action.label}（{params.length}）
            </Button>
          ))}
          {hasDeduplicatedRows ? (
            <Typography.Text type="secondary">
              同一张单据的多条明细只打印一次；不适用明细不参与对应打印
            </Typography.Text>
          ) : null}
          <Button
            type="link"
            onClick={() => {
              onCleanSelected?.();
              setSelectedRowKeys([]);
              setSelectedRowsByKey({});
            }}
          >
            取消选择
          </Button>
        </Space>
      );
    },
    [canPrint, openPrintBatch, selectedPrintActionParams, selectedRowKeys.length],
  );

  return { rowSelection, tableAlertOptionRender };
}

function saleOrderDocumentActions(
  capabilities: SaleOrderDetailLedgerCapabilities,
): readonly DocumentActionDefinition<SaleOrderLedgerActionRecord>[] {
  const permission = capabilities.permissionCodes;
  return [
    { key: 'detail', label: '详情' },
    {
      key: 'edit',
      label: '编辑',
      permission: permission.update,
      requiredAvailableAction: 'update',
    },
    {
      key: 'confirm',
      label: '确认订单',
      permission: permission.confirm,
      requiredAvailableAction: 'confirm',
    },
    {
      key: 'reverse-audit',
      label: '反审核',
      permission: permission.confirm,
      requiredAvailableAction: 'reverseAudit',
    },
    {
      key: 'create-delivery',
      label: '销售出库单',
      permission: permission.createDelivery,
      requiredAvailableAction: 'createDelivery',
    },
    { key: 'view-deliveries', label: '查看销售出库单', permission: permission.viewDelivery },
    {
      key: 'procurement-demand',
      label: '采购需求',
      permission: permission.procurementDemand,
      requiredAvailableAction: 'procurementDemand',
    },
    {
      key: 'convert-to-production-plan',
      label: '转生产计划',
      permission: permission.convertToProductionPlan,
      requiredAvailableAction: 'convertToProduction',
    },
    {
      key: 'convert-to-work-order',
      label: '转工单',
      permission: permission.convertToWorkOrder,
      requiredAvailableAction: 'convertToProduction',
    },
    { key: 'view-production-plans', label: '查看生产计划', permission: permission.viewProductionPlans },
    { key: 'copy', label: '复制', permission: permission.copy },
    { key: 'print', label: '打印', permission: permission.print },
    { key: 'print-records', label: '打印记录', permission: permission.printRecords },
    {
      key: 'cancel',
      label: '取消',
      permission: permission.cancel,
      requiredAvailableAction: 'cancel',
      danger: true,
    },
    {
      key: 'close-remaining',
      label: '关闭剩余',
      permission: permission.closeRemaining,
      requiredAvailableAction: 'closeItem',
      danger: true,
    },
  ];
}

type SaleOrderLedgerActionRecord = NonNullable<
  SaleOrderDetailLedgerRow['order']
>;

function requireSaleOrder(
  row: SaleOrderDetailLedgerRow,
): SaleOrderLedgerActionRecord {
  if (!row.order) {
    throw new Error(`销售订单明细 ${row.id} 缺少所属订单`);
  }
  return row.order as SaleOrderLedgerActionRecord;
}

export interface SaleOrderDetailLedgerProps {
  capabilities: SaleOrderDetailLedgerCapabilities;
  onCreate?: () => void;
  onViewChange?: (view: import('../documents/DocumentViewSwitch').DocumentViewMode) => void;
  showHeaderTitle?: boolean;
  tableActionRef?: RefObject<ActionType | null>;
  filterFormRef?: RefObject<ProFormInstance | undefined>;
  savedViewController?: import('../documents/DocumentDetailLedgerTable').DocumentDetailLedgerSavedViewController<import('../documents/DocumentViewBar').DocumentViewBarView>;
}

/**
 * @sunxu-layer business
 * @sunxu-domain sales
 * @sunxu-reason Preserves host order-line filters, quantity and amount summaries, document actions, and ship entry while the host supplies data, permissions, routing, dictionaries, and print behavior.
 */
export function SaleOrderDetailLedger({
  capabilities,
  onCreate,
  onViewChange,
  showHeaderTitle = false,
  tableActionRef,
  filterFormRef,
  savedViewController,
}: SaleOrderDetailLedgerProps) {
  const [summary, setSummary] = useState<SaleOrderDetailLedgerSummary>();
  const [priceAllowed, setPriceAllowed] = useState(false);
  const amountVisibilityRevision = getAmountVisibilityRevision(
    capabilities.maskAmount,
    priceAllowed,
  );
  const [shipOrder, setShipOrder] = useState<SaleOrderLedgerActionRecord | null>(
    null,
  );
  const columns = useMemo<ProColumns<SaleOrderDetailLedgerRow>[]>(() => {
    const orderStatusOptions = Object.fromEntries(
      Object.entries(capabilities.statusEnum).map(([key, item]) => [
        key,
        { text: item.text },
      ]),
    );
    const filterColumns: ProColumns<SaleOrderDetailLedgerRow>[] = [
      {
        title: '客户',
        dataIndex: 'customerId',
        hideInTable: true,
        ...capabilities.filterColumns?.customer,
      },
      {
        title: '物料',
        dataIndex: 'materialId',
        hideInTable: true,
        ...capabilities.filterColumns?.material,
      },
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: { placeholder: '订单号、客户、物料编码/名称或行备注' },
      },
      {
        title: '创建时间',
        dataIndex: 'createdAtRange',
        hideInTable: true,
        valueType: 'dateRange',
        fieldProps: { presets: BUSINESS_DATE_RANGE_PRESETS },
        search: {
          transform: (value: [string, string]) => ({
            startDate: value[0],
            endDate: value[1],
          }),
        },
      },
      {
        title: '交货日期',
        dataIndex: 'deliveryDateRange',
        hideInTable: true,
        valueType: 'dateRange',
        fieldProps: { presets: BUSINESS_DATE_RANGE_PRESETS },
        search: {
          transform: (value: [string, string]) => ({
            effectiveDeliveryStartDate: value[0],
            effectiveDeliveryEndDate: value[1],
          }),
        },
      },
    ];
    const priceColumns: ProColumns<SaleOrderDetailLedgerRow>[] = priceAllowed
      ? [
          {
            title: '单价',
            dataIndex: 'unitPrice',
            width: 120,
            align: 'right',
            sorter: true,
            search: false,
            render: (_value, row) =>
              row.unitPrice == null
                ? '-'
                : capabilities.maskAmount(
                    capabilities.formatCurrency(row.unitPrice),
                    priceAllowed,
                  ),
          },
          {
            title: '金额',
            dataIndex: 'amount',
            width: 130,
            align: 'right',
            sorter: true,
            search: false,
            render: (_value, row) =>
              row.amount == null
                ? '-'
                : capabilities.maskAmount(
                    capabilities.formatCurrency(row.amount),
                    priceAllowed,
                  ),
          },
          {
            title: '折扣%',
            dataIndex: 'discountRate',
            width: 110,
            align: 'right',
            sorter: true,
            search: false,
            render: (_value, row) =>
              row.discountRate == null
                ? '-'
                : `${Number(row.discountRate).toLocaleString('zh-CN', {
                    maximumFractionDigits: 4,
                  })}%`,
          },
          {
            title: '折扣金额',
            dataIndex: 'discountAmount',
            width: 130,
            align: 'right',
            sorter: true,
            search: false,
            render: (_value, row) =>
              row.discountAmount == null
                ? '-'
                : capabilities.maskAmount(
                    capabilities.formatCurrency(row.discountAmount),
                    priceAllowed,
                  ),
          },
          {
            title: '折后金额',
            dataIndex: 'discountedAmount',
            width: 130,
            align: 'right',
            sorter: true,
            search: false,
            render: (_value, row) =>
              row.discountedAmount == null
                ? '-'
                : capabilities.maskAmount(
                    capabilities.formatCurrency(row.discountedAmount),
                    priceAllowed,
                  ),
          },
          {
            title: '税率%',
            dataIndex: 'taxRate',
            width: 110,
            align: 'right',
            sorter: true,
            search: false,
            render: (_value, row) =>
              row.taxRate == null
                ? '-'
                : `${Number(row.taxRate).toLocaleString('zh-CN', {
                    maximumFractionDigits: 4,
                  })}%`,
          },
          {
            title: '税额',
            dataIndex: 'taxAmount',
            width: 130,
            align: 'right',
            sorter: true,
            search: false,
            render: (_value, row) =>
              row.taxAmount == null
                ? '-'
                : capabilities.maskAmount(
                    capabilities.formatCurrency(row.taxAmount),
                    priceAllowed,
                  ),
          },
          {
            title: '总金额',
            dataIndex: 'totalAmount',
            width: 130,
            align: 'right',
            sorter: true,
            search: false,
            render: (_value, row) =>
              row.totalAmount == null
                ? '-'
                : capabilities.maskAmount(
                    capabilities.formatCurrency(row.totalAmount),
                    priceAllowed,
                  ),
          },
        ]
      : [];
    return [
      ...filterColumns,
      {
        title: '物料名称',
        dataIndex: 'materialName',
        width: 180,
        ellipsis: true,
        sorter: true,
        search: false,
        render: (_value, row) => row.material?.name || '-',
      },
      {
        title: '物料编码',
        dataIndex: 'materialCode',
        width: 150,
        sorter: true,
        search: false,
        render: (_value, row) => row.material?.code || '-',
      },
      {
        title: '规格',
        dataIndex: 'materialSpec',
        width: 160,
        ellipsis: true,
        search: false,
        render: (_value, row) => row.material?.spec || '-',
      },
      {
        title: '单位',
        dataIndex: 'materialUnit',
        width: 90,
        search: false,
        render: (_value, row) =>
          capabilities.formatUnitLabel(
            row.material?.unit,
            capabilities.unitLabelMap,
          ) || '-',
      },
      {
        title: '订购数量',
        dataIndex: 'quantity',
        width: 110,
        align: 'right',
        sorter: true,
        search: false,
        render: (_value, row) => capabilities.formatNumber(row.quantity),
      },
      {
        title: '已发数量',
        dataIndex: 'shippedQty',
        width: 110,
        align: 'right',
        search: false,
        render: (_value, row) => capabilities.formatNumber(row.shippedQty),
      },
      {
        title: '未发数量',
        dataIndex: 'remainingQty',
        width: 110,
        align: 'right',
        search: false,
        render: (_value, row) => capabilities.formatNumber(row.remainingQty),
      },
      {
        title: '已退数量',
        dataIndex: 'returnedQty',
        width: 110,
        align: 'right',
        search: false,
        render: (_value, row) => capabilities.formatNumber(row.returnedQty),
      },
      ...createMaterialCustomFieldColumns(
        capabilities.materialCustomFields,
        {
          getMaterial: (row: SaleOrderDetailLedgerRow) => row.material,
          maskAmount: capabilities.maskAmount,
          priceAllowed,
          amountVisibilityRevision,
        },
      ),
      ...createLineCustomFieldColumns<SaleOrderDetailLedgerRow>(
        capabilities.lineCustomFieldSchema,
        '订单明细',
        {
          maskAmount: capabilities.maskAmount,
          priceAllowed,
          amountVisibilityRevision,
        },
      ),
      {
        title: '订单号',
        dataIndex: 'orderNo',
        width: 170,
        sorter: true,
        search: false,
        render: (_value, row) => {
          const order = requireSaleOrder(row);
          return capabilities.permissions.canViewOrder ? (
            <Button
              type="link"
              size="small"
              onClick={() => capabilities.navigateToOrder(order.id)}
            >
              {order.orderNo}
            </Button>
          ) : (
            order.orderNo
          );
        },
      },
      createStatusLedgerColumn(
        'status',
        '状态',
        capabilities.statusEnum,
        (row) => requireSaleOrder(row).status,
        {
          fieldProps: { mode: 'multiple' },
          valueEnum: orderStatusOptions,
        },
      ),
      {
        title: '客户',
        dataIndex: 'customerName',
        width: 160,
        ellipsis: true,
        sorter: true,
        search: false,
        render: (_value, row) =>
          requireSaleOrder(row).partnerNameSnapshot ||
          requireSaleOrder(row).customer?.name ||
          '-',
      },
      ...withAmountVisibilityRevisions(priceColumns, amountVisibilityRevision),
      createLedgerDateColumn(
        'effectiveDeliveryDate',
        '交货日期',
        capabilities.formatDate,
        { width: 120, sorter: true },
      ),
      createLedgerDateColumn('createdAt', '创建时间', capabilities.formatDate, {
        width: 180,
        sorter: true,
        value: (row) => requireSaleOrder(row).createdAt ?? row.createdAt,
      }),
      createLedgerDateColumn('updatedAt', '更新时间', capabilities.formatDate, {
        width: 180,
        sorter: true,
        value: (row) => requireSaleOrder(row).updatedAt ?? row.updatedAt,
      }),
      {
        title: '行号',
        dataIndex: 'lineNo',
        width: 80,
        sorter: true,
        search: false,
        render: (_value, row) => row.lineNo ?? '-',
      },
      {
        title: '物料图',
        dataIndex: 'materialThumbnail',
        width: 80,
        search: false,
        render: (_value, row) => (
          <EntityThumbnail
            thumbnailUrl={row.material?.thumbnailUrl}
            previewUrl={row.material?.primaryImageUrl ?? row.material?.thumbnailUrl}
            alt="物料图片"
            size={36}
          />
        ),
      },
      {
        title: '行备注',
        dataIndex: 'remarks',
        width: 180,
        ellipsis: true,
        search: false,
        render: (_value, row) => row.remarks || '-',
      },
      markCompleteActionMenuColumn<SaleOrderDetailLedgerRow>({
        title: '',
        dataIndex: '__actions',
        valueType: 'option',
        width: 48,
        fixed: 'right',
        search: false,
        render: (_value, row) => {
          const order = requireSaleOrder(row);
          if (!capabilities.permissions.canViewOrder) return '-';
          return (
            <DetailLedgerDocumentActions<SaleOrderLedgerActionRecord>
              actions={saleOrderDocumentActions(capabilities)}
              documentId={order.id}
              documentNo={order.orderNo}
              documentPath={capabilities.getOrderPath(order.id)}
              loadDocument={capabilities.loadOrderDetail}
              actionHandlers={{
                'view-deliveries': (document) =>
                  capabilities.navigateToDeliveryLedger(document.id),
                'procurement-demand': (document) =>
                  capabilities.navigateToProcurementDemand(document.id),
                'view-production-plans': (document) =>
                  capabilities.navigateToProductionPlans(document.id),
                'create-delivery': (document) => setShipOrder(document),
              }}
            />
          );
        },
      }),
    ];
  }, [capabilities, priceAllowed, amountVisibilityRevision]);

  const lightFilter = useMemo(
    () => ({
      formValuesFromFilters: (filters: Record<string, unknown>) => ({
        customerId: filters.customerId,
        materialId: filters.materialId,
        status: filters.status,
        ...restoreDetailLedgerDateRange(filters, 'createdAtRange'),
        ...restoreDetailLedgerDateRange(
          filters,
          'deliveryDateRange',
          'effectiveDeliveryStartDate',
          'effectiveDeliveryEndDate',
        ),
      }),
    }),
    [],
  );
  const buildQuery = useCallback(
    (
      params: Record<string, unknown>,
      sortQuery: Pick<SaleOrderDetailLedgerQuery, 'orderBy' | 'orderDir'> = {},
    ): SaleOrderDetailLedgerQuery => ({
      keyword: (params.keyword as string) || undefined,
      status: Array.isArray(params.statuses)
        ? undefined
        : ((Array.isArray(params.status) ? undefined : params.status) as
            | string
            | undefined),
      statuses: (Array.isArray(params.statuses)
        ? params.statuses
        : Array.isArray(params.status)
          ? params.status
          : undefined) as string[] | undefined,
      customerId: (params.customerId as string) || undefined,
      materialId: (params.materialId as string) || undefined,
      startDate: (params.startDate as string) || undefined,
      endDate: (params.endDate as string) || undefined,
      effectiveDeliveryStartDate:
        (params.effectiveDeliveryStartDate as string) || undefined,
      effectiveDeliveryEndDate:
        (params.effectiveDeliveryEndDate as string) || undefined,
      orderBy: sortQuery.orderBy ?? 'createdAt',
      orderDir: sortQuery.orderDir ?? 'DESC',
    }),
    [],
  );
  const onResponse = useCallback(
    (response: SalesDetailLedgerResponse<SaleOrderDetailLedgerRow, SaleOrderDetailLedgerSummary>) => {
      setPriceAllowed(response.priceVisible);
      setSummary(response.summary);
    },
    [],
  );

  return (
    <>
      <DocumentDetailLedgerTable<
        SaleOrderDetailLedgerRow,
        SaleOrderDetailLedgerQuery,
        SalesDetailLedgerResponse<SaleOrderDetailLedgerRow, SaleOrderDetailLedgerSummary>
      >
        tableActionRef={tableActionRef}
        filterFormRef={filterFormRef}
        savedView={savedViewController ? { controller: savedViewController } : undefined}
        showHeaderTitle={showHeaderTitle}
        initialQuery={{ orderBy: 'createdAt', orderDir: 'DESC' }}
        apiFn={(body) => capabilities.requestList(body)}
        buildQuery={buildQuery}
        columns={columns}
        exportFn={capabilities.exportExcel}
        exportFileName={`${capabilities.exportFileNamePrefix}_${Date.now()}.xlsx`}
        exportPermission={capabilities.exportPermission}
        createPermission={capabilities.createPermission}
        onCreate={onCreate}
        resizable={capabilities.resizable}
        serverSortFields={capabilities.serverSortFields}
        scrollX={3420}
        onViewChange={onViewChange}
        toolbarExtra={capabilities.renderAmountVisibilityToggle(priceAllowed)}
        exportLabel={priceAllowed ? '导出明细' : '导出明细（不含金额）'}
        onResponse={onResponse}
        footer={summary ? <SaleOrderLedgerFooter summary={summary} capabilities={capabilities} priceAllowed={priceAllowed} /> : null}
        lightFilter={lightFilter}
      />
      <SaleOrderShipActionModal
        open={Boolean(shipOrder)}
        order={shipOrder}
        onClose={() => setShipOrder(null)}
        onSuccess={() => {
          setShipOrder(null);
          tableActionRef?.current?.reload();
        }}
        capabilities={capabilities.shipActionCapabilities}
      />
    </>
  );
}

function SaleOrderLedgerFooter({
  summary,
  capabilities,
  priceAllowed,
}: {
  summary: SaleOrderDetailLedgerSummary;
  capabilities: SaleOrderDetailLedgerCapabilities;
  priceAllowed: boolean;
}) {
  const amount = (value: number | null | undefined) =>
    value == null
      ? '-'
      : capabilities.maskAmount(capabilities.formatCurrency(value), priceAllowed);
  return (
    <>
      <span>订单数 {capabilities.formatNumber(summary.orderCount)}</span>
      <span>明细行 {capabilities.formatNumber(summary.itemCount)}</span>
      <span>订购数量 {capabilities.formatNumber(summary.totalQty)}</span>
      <span>已发数量 {capabilities.formatNumber(summary.shippedQty)}</span>
      {priceAllowed ? (
        <>
          <span>金额 {amount(summary.amount)}</span>
          <span>折扣金额 {amount(summary.discountAmount)}</span>
          <span>折后金额 {amount(summary.discountedAmount)}</span>
          <span>税额 {amount(summary.taxAmount)}</span>
          <span>总金额 {amount(summary.totalAmount)}</span>
        </>
      ) : null}
      {(summary.customFieldSummaries ?? []).map((item) => (
        <span key={item.fieldKey}>
          {item.label}
          {item.mode === 'avg'
            ? '（平均）'
            : item.mode === 'min'
              ? '（最小）'
              : item.mode === 'max'
                ? '（最大）'
                : item.mode === 'count_non_empty'
                  ? '（非空数）'
                  : '（合计）'}{' '}
          {formatCustomFieldSummaryValue(
            item,
            capabilities.lineCustomFieldSchema,
            capabilities.formatNumber,
            capabilities.maskAmount,
            priceAllowed,
          )}
        </span>
      ))}
    </>
  );
}

function saleReturnDocumentActions(
  capabilities: SaleReturnDetailLedgerCapabilities,
): readonly DocumentActionDefinition<SaleReturnLedgerDocument>[] {
  const permission = capabilities.permissionCodes;
  return [
    { key: 'detail', label: '详情' },
    {
      key: 'edit',
      label: '编辑',
      permission: permission.update,
      requiredAvailableAction: 'update',
    },
    {
      key: 'submit',
      label: '提交',
      permission: permission.submit,
      requiredAvailableAction: 'submit',
    },
    {
      key: 'receive',
      label: '确认收货',
      permission: permission.receive,
      requiredAvailableAction: 'receive',
    },
    {
      key: 'stock-conversion',
      label: '新增库存转换',
      permission: permission.stockConversion,
      visible: (document) =>
        ['received', 'pending_inspection', 'inspected', 'completed'].includes(
          document.status,
        ),
    },
    {
      key: 'withdraw',
      label: '撤回',
      permission: permission.update,
      requiredAvailableAction: 'withdraw',
    },
    {
      key: 'cancel',
      label: '取消',
      permission: permission.cancel,
      requiredAvailableAction: 'cancel',
      danger: true,
    },
    {
      key: 'reverse',
      label: '冲正',
      permission: permission.reverse,
      requiredAvailableAction: 'reverse',
      danger: true,
    },
    { key: 'print', label: '打印', permission: permission.print },
    { key: 'print-records', label: '打印记录', permission: permission.printRecords },
  ];
}

export interface SaleReturnDetailLedgerProps {
  capabilities: SaleReturnDetailLedgerCapabilities;
  onCreate?: () => void;
  onPriceVisibilityChange?: (visible: boolean) => void;
  onViewChange?: (view: import('../documents/DocumentViewSwitch').DocumentViewMode) => void;
  showHeaderTitle?: boolean;
  tableActionRef?: RefObject<ActionType | null>;
  filterFormRef?: RefObject<ProFormInstance | undefined>;
  savedViewController?: import('../documents/DocumentDetailLedgerTable').DocumentDetailLedgerSavedViewController<import('../documents/DocumentViewBar').DocumentViewBarView>;
}

/**
 * @sunxu-layer business
 * @sunxu-domain sales
 * @sunxu-reason Preserves host return-line filters, receipt quantities, amount summaries, document actions, and deduplicated batch printing while the host supplies data, permissions, routing, dictionaries, and print jobs.
 */
export function SaleReturnDetailLedger({
  capabilities,
  onCreate,
  onPriceVisibilityChange,
  onViewChange,
  showHeaderTitle = false,
  tableActionRef,
  filterFormRef,
  savedViewController,
}: SaleReturnDetailLedgerProps) {
  const [summary, setSummary] = useState<SaleReturnDetailLedgerSummary>();
  const [priceAllowed, setPriceAllowed] = useState(false);
  const amountVisibilityRevision = getAmountVisibilityRevision(
    capabilities.maskAmount,
    priceAllowed,
  );
  const [actionDetail, setActionDetail] = useState<SaleReturnLedgerDocument | null>(
    null,
  );
  const [editDetail, setEditDetail] = useState<SaleReturnLedgerDocument | null>(
    null,
  );
  const [stockConversionDetail, setStockConversionDetail] =
    useState<SaleReturnLedgerDocument | null>(null);
  const batchPrint = useSalesDetailLedgerBatchPrint({
    canPrint: capabilities.batchPrint.canPrint,
    getRowKey: (record: SaleReturnDetailLedgerRow) => record.id,
    actions: capabilities.batchPrint.actions,
    openPrintBatch: capabilities.batchPrint.openPrintBatch,
  });

  const columns = useMemo<ProColumns<SaleReturnDetailLedgerRow>[]>(() => {
    const filters: ProColumns<SaleReturnDetailLedgerRow>[] = [
      {
        title: '客户',
        dataIndex: 'customerId',
        hideInTable: true,
        ...capabilities.filterColumns?.customer,
      },
      {
        title: '物料',
        dataIndex: 'materialId',
        hideInTable: true,
        ...capabilities.filterColumns?.material,
      },
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: { placeholder: '退货单号、来源单号、客户、物料或行备注' },
      },
      {
        title: '申请日期',
        dataIndex: 'returnDateRange',
        hideInTable: true,
        valueType: 'dateRange',
        fieldProps: { presets: BUSINESS_DATE_RANGE_PRESETS },
        search: {
          transform: (value: [string, string]) => ({
            startDate: value[0],
            endDate: value[1],
          }),
        },
      },
    ];
    return [
      ...filters,
      {
        title: '物料名称',
        dataIndex: 'materialName',
        width: 180,
        ellipsis: true,
        sorter: true,
        search: false,
        render: (_value, row) => row.material?.name || '-',
      },
      {
        title: '物料编码',
        dataIndex: 'materialCode',
        width: 150,
        sorter: true,
        search: false,
        render: (_value, row) => row.material?.code || '-',
      },
      {
        title: '规格',
        dataIndex: 'materialSpec',
        width: 150,
        ellipsis: true,
        search: false,
        render: (_value, row) => row.material?.spec || '-',
      },
      {
        title: '单位',
        dataIndex: 'materialUnit',
        width: 90,
        search: false,
        render: (_value, row) =>
          capabilities.formatUnitLabel(
            row.material?.unit,
            capabilities.unitLabelMap,
          ) || '-',
      },
      {
        title: '申请退货数量',
        dataIndex: 'returnQty',
        width: 130,
        align: 'right',
        sorter: true,
        search: false,
        render: (_value, row) => capabilities.formatNumber(row.returnQty),
      },
      {
        title: '实收数量',
        dataIndex: 'receivedQty',
        width: 110,
        align: 'right',
        sorter: true,
        search: false,
        render: (_value, row) => capabilities.formatNumber(row.receivedQty),
      },
      {
        title: '合格数量',
        dataIndex: 'acceptedQty',
        width: 110,
        align: 'right',
        search: false,
        render: (_value, row) => capabilities.formatNumber(row.acceptedQty),
      },
      {
        title: '不合格数量',
        dataIndex: 'rejectedQty',
        width: 120,
        align: 'right',
        search: false,
        render: (_value, row) => capabilities.formatNumber(row.rejectedQty),
      },
      ...(priceAllowed
        ? withAmountVisibilityRevisions<SaleReturnDetailLedgerRow>([
            {
              title: '实退金额',
              dataIndex: 'netRefundAmount',
              width: 130,
              align: 'right' as const,
              search: false,
              render: (_value: unknown, row: SaleReturnDetailLedgerRow) =>
                row.netRefundAmount == null
                  ? '-'
                  : capabilities.maskAmount(
                      capabilities.formatCurrency(row.netRefundAmount),
                      priceAllowed,
                    ),
            },
          ], amountVisibilityRevision)
        : []),
      ...createMaterialCustomFieldColumns(
        capabilities.materialCustomFields,
        {
          getMaterial: (row: SaleReturnDetailLedgerRow) => row.material,
          maskAmount: capabilities.maskAmount,
          priceAllowed,
          amountVisibilityRevision,
        },
      ),
      ...createLineCustomFieldColumns<SaleReturnDetailLedgerRow>(
        capabilities.lineCustomFieldSchema,
        '退货明细',
        {
          maskAmount: capabilities.maskAmount,
          priceAllowed,
          amountVisibilityRevision,
        },
      ),
      {
        title: '退货单号',
        dataIndex: 'returnNo',
        width: 170,
        sorter: true,
        search: false,
        render: (_value, row) => {
          const order = row.returnOrder;
          if (!order) return '-';
          return capabilities.permissions.canViewReturn ? (
            <Button
              type="link"
              size="small"
              onClick={() => capabilities.navigateToReturn(order.id)}
            >
              {order.returnNo}
            </Button>
          ) : (
            order.returnNo
          );
        },
      },
      {
        title: '退货原因',
        dataIndex: 'reasonCode',
        width: 180,
        ellipsis: true,
        search: false,
        render: (_value, row) => {
          const order = row.returnOrder;
          if (!order?.reasonCode) return '-';
          return (
            order.reasonLabelSnapshot ??
            capabilities.reasonLabelMap[order.reasonCode] ??
            order.reasonCode
          );
        },
      },
      {
        title: '来源订单',
        dataIndex: 'sourceSaleOrderNo',
        width: 170,
        search: false,
        render: (_value, row) => {
          const order = row.returnOrder?.sourceSaleOrder;
          if (!order) return '-';
          return capabilities.permissions.canViewSaleOrder ? (
            <Button
              type="link"
              size="small"
              onClick={() => capabilities.navigateToSaleOrder(order.id)}
            >
              {order.orderNo}
            </Button>
          ) : (
            order.orderNo
          );
        },
      },
      {
        title: '来源销售出库单',
        dataIndex: 'sourceDeliveryNo',
        width: 170,
        search: false,
        render: (_value, row) => {
          const delivery = row.returnOrder?.sourceDelivery;
          if (!delivery) {
            return row.returnOrder?.sourceDeliveryId
              ? '-'
              : '未关联原销售出库单';
          }
          return capabilities.permissions.canViewSaleDelivery ? (
            <Button
              type="link"
              size="small"
              onClick={() => capabilities.navigateToSaleDelivery(delivery.id)}
            >
              {delivery.deliveryNo}
            </Button>
          ) : (
            delivery.deliveryNo
          );
        },
      },
      {
        title: '客户',
        dataIndex: 'customerName',
        width: 160,
        ellipsis: true,
        search: false,
        render: (_value, row) =>
          row.returnOrder?.partnerNameSnapshot ||
          row.returnOrder?.customer?.name ||
          '-',
      },
      createStatusLedgerColumn(
        'status',
        '状态',
        capabilities.statusEnum,
        (row) => row.returnOrder?.status,
        { fieldProps: { mode: 'multiple' } },
      ),
      createStatusLedgerColumn(
        'returnType',
        '退货类型',
        capabilities.returnTypeEnum,
        (row) => row.returnOrder?.returnType,
        { width: 120 },
      ),
      createLedgerDateColumn(
        'receiveDate',
        '收货日期',
        capabilities.formatDate,
        { width: 120, sorter: true, value: (row) => row.returnOrder?.receiveDate },
      ),
      {
        title: '批号',
        dataIndex: 'batchNo',
        width: 140,
        search: false,
        render: (_value, row) => row.batchNo || '-',
      },
      {
        title: '仓位',
        dataIndex: 'storageLocation',
        width: 160,
        ellipsis: true,
        search: false,
        render: (_value, row) =>
          row.storageLocationSnapshot || row.location?.pathName || '-',
      },
      createLedgerDateColumn('createdAt', '创建时间', capabilities.formatDate, {
        width: 180,
        sorter: true,
      }),
      createLedgerDateColumn('updatedAt', '更新时间', capabilities.formatDate, {
        width: 180,
        sorter: true,
      }),
      {
        title: '行备注',
        dataIndex: 'remarks',
        width: 180,
        ellipsis: true,
        search: false,
        render: (_value, row) => row.remarks || '-',
      },
      markCompleteActionMenuColumn<SaleReturnDetailLedgerRow>({
        title: '',
        dataIndex: '__actions',
        valueType: 'option',
        width: 48,
        fixed: 'right',
        search: false,
        render: (_value, row) => {
          const order = row.returnOrder;
          if (!order || !capabilities.permissions.canViewReturn) return '-';
          return (
            <DetailLedgerDocumentActions<SaleReturnLedgerDocument>
              actions={saleReturnDocumentActions(capabilities)}
              documentId={order.id}
              documentNo={order.returnNo}
              documentPath={capabilities.getReturnPath(order.id)}
              loadDocument={capabilities.requestReturnDetail}
              actionHandlers={{
                edit: setEditDetail,
                receive: setActionDetail,
                'stock-conversion': setStockConversionDetail,
              }}
            />
          );
        },
      }),
    ];
  }, [capabilities, priceAllowed, amountVisibilityRevision]);

  const lightFilter = useMemo(
    () => ({
      formValuesFromFilters: (filters: Record<string, unknown>) => ({
        customerId: filters.customerId,
        materialId: filters.materialId,
        status: filters.status,
        returnType: filters.returnType,
        ...restoreDetailLedgerDateRange(filters, 'returnDateRange'),
      }),
    }),
    [],
  );
  const buildQuery = useCallback(
    (
      params: Record<string, unknown>,
      sortQuery: Pick<SaleReturnDetailLedgerQuery, 'orderBy' | 'orderDir'> = {},
    ): SaleReturnDetailLedgerQuery => ({
      keyword: (params.keyword as string) || undefined,
      status: Array.isArray(params.statuses)
        ? undefined
        : ((Array.isArray(params.status) ? undefined : params.status) as
            | string
            | undefined),
      statuses: (Array.isArray(params.statuses)
        ? params.statuses
        : Array.isArray(params.status)
          ? params.status
          : undefined) as string[] | undefined,
      returnType: params.returnType as string | undefined,
      customerId: (params.customerId as string) || undefined,
      materialId: (params.materialId as string) || undefined,
      startDate: (params.startDate as string) || undefined,
      endDate: (params.endDate as string) || undefined,
      orderBy: sortQuery.orderBy ?? 'createdAt',
      orderDir: sortQuery.orderDir ?? 'DESC',
    }),
    [],
  );
  const onResponse = useCallback(
    (
      response: SalesDetailLedgerResponse<
        SaleReturnDetailLedgerRow,
        SaleReturnDetailLedgerSummary
      >,
    ) => {
      setPriceAllowed(response.priceVisible);
      onPriceVisibilityChange?.(response.priceVisible);
      setSummary(response.summary);
    },
    [onPriceVisibilityChange],
  );

  return (
    <>
      <DocumentDetailLedgerTable<
        SaleReturnDetailLedgerRow,
        SaleReturnDetailLedgerQuery,
        SalesDetailLedgerResponse<SaleReturnDetailLedgerRow, SaleReturnDetailLedgerSummary>
      >
        tableActionRef={tableActionRef}
        rowSelection={batchPrint.rowSelection}
        tableAlertOptionRender={batchPrint.tableAlertOptionRender}
        filterFormRef={filterFormRef}
        savedView={savedViewController ? { controller: savedViewController } : undefined}
        showHeaderTitle={showHeaderTitle}
        initialQuery={{ orderBy: 'createdAt', orderDir: 'DESC' }}
        apiFn={(body) => capabilities.requestList(body)}
        buildQuery={buildQuery}
        columns={columns}
        exportFn={capabilities.exportExcel}
        exportFileName={`${capabilities.exportFileNamePrefix}_${Date.now()}.xlsx`}
        exportPermission={capabilities.exportPermission}
        createPermission={capabilities.createPermission}
        onCreate={onCreate}
        resizable={capabilities.resizable}
        serverSortFields={capabilities.serverSortFields}
        scrollX={priceAllowed ? 3110 : 2980}
        onViewChange={onViewChange}
        toolbarExtra={capabilities.renderAmountVisibilityToggle(priceAllowed)}
        exportLabel={priceAllowed ? '导出明细' : '导出明细（不含金额）'}
        onResponse={onResponse}
        footer={summary ? <SaleReturnLedgerFooter summary={summary} capabilities={capabilities} priceAllowed={priceAllowed} /> : null}
        lightFilter={lightFilter}
      />
      <SaleReturnReceiveModal
        detail={actionDetail}
        open={Boolean(actionDetail)}
        onClose={() => setActionDetail(null)}
        onSuccess={() => tableActionRef?.current?.reload()}
        capabilities={capabilities.receiveCapabilities}
      />
      <SaleReturnEditDrawer
        detail={editDetail}
        open={Boolean(editDetail)}
        onClose={() => setEditDetail(null)}
        onSuccess={() => tableActionRef?.current?.reload()}
        capabilities={capabilities.editCapabilities}
      />
      <SaleReturnStockConversionDrawer
        detail={stockConversionDetail}
        open={Boolean(stockConversionDetail)}
        onClose={() => setStockConversionDetail(null)}
        onSuccess={() => tableActionRef?.current?.reload()}
        capabilities={capabilities.stockConversionCapabilities}
      />
      {capabilities.batchPrint.printJobActionNode}
    </>
  );
}

function SaleReturnLedgerFooter({
  summary,
  capabilities,
  priceAllowed,
}: {
  summary: SaleReturnDetailLedgerSummary;
  capabilities: SaleReturnDetailLedgerCapabilities;
  priceAllowed: boolean;
}) {
  const amount = (value: number | null | undefined) =>
    value == null
      ? '-'
      : capabilities.maskAmount(capabilities.formatCurrency(value), priceAllowed);
  return (
    <>
      <span>退货单数 {capabilities.formatNumber(summary.returnOrderCount)}</span>
      <span>明细行 {capabilities.formatNumber(summary.itemCount)}</span>
      <span>申请退货 {capabilities.formatNumber(summary.totalReturnQty)}</span>
      <span>实收 {capabilities.formatNumber(summary.totalReceivedQty)}</span>
      <span>合格 {capabilities.formatNumber(summary.totalAcceptedQty)}</span>
      <span>不合格 {capabilities.formatNumber(summary.totalRejectedQty)}</span>
      {priceAllowed ? (
        <>
          <span>金额 {amount(summary.amount)}</span>
          <span>折扣金额 {amount(summary.discountAmount)}</span>
          <span>折后金额 {amount(summary.discountedAmount)}</span>
          <span>税额 {amount(summary.taxAmount)}</span>
          <span>总金额 {amount(summary.totalAmount)}</span>
          <span>实退金额 {amount(summary.netRefundAmount)}</span>
        </>
      ) : null}
    </>
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain sales
 * @sunxu-reason Preserves the host delivery detail action workflow and related business panels while the host supplies detail loading, permissions, actions, and item execution capabilities.
 */
export function SaleDeliveryDocumentActionDrawer({
  open,
  deliveryId,
  onClose,
  onActionSuccess,
  onOpenFullEditor,
  capabilities,
}: SaleDeliveryDocumentActionDrawerProps) {
  const [order, setOrder] = useState<SaleDeliveryActionDrawerModel | null>(null);
  const [loading, setLoading] = useState(false);
  const detailRequestSequence = useRef(0);
  const loadDetail = useCallback(async () => {
    const requestId = ++detailRequestSequence.current;
    if (!deliveryId) {
      setOrder(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const detail = await capabilities.loadDetail(deliveryId);
      if (requestId === detailRequestSequence.current) setOrder(detail ?? null);
    } finally {
      if (requestId === detailRequestSequence.current) setLoading(false);
    }
  }, [capabilities, deliveryId]);

  useEffect(() => {
    if (!open) {
      detailRequestSequence.current += 1;
      setOrder(null);
      setLoading(false);
      return;
    }
    void loadDetail();
  }, [loadDetail, open]);

  const refreshAfterAction = useCallback(() => {
    void loadDetail();
    onActionSuccess?.();
  }, [loadDetail, onActionSuccess]);

  return (
    <Drawer
      title="销售出库单详情"
      open={open}
      onClose={onClose}
      size="90vw"
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : !order ? (
        <Empty description="未找到销售出库单" />
      ) : (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Space align="center" wrap>
              <div>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  {order.deliveryNo}
                </Typography.Title>
                {order.status
                  ? capabilities.statusEnum[order.status]?.text ?? order.status
                  : '-'}
              </div>
              <SaleDeliveryDocumentActionsDropdown
                deliveryId={order.id}
                deliveryNo={order.deliveryNo}
                hideDetailAction
                onOpenDetail={() => undefined}
                onEdit={(id) => onOpenFullEditor?.(id)}
                onActionSuccess={refreshAfterAction}
                capabilities={capabilities.actions}
              />
            </Space>
          </div>

          <ProDescriptions<SaleDeliveryActionDrawerModel>
            column={2}
            dataSource={order}
            columns={[
              {
                title: '客户',
                render: () => order.partnerNameSnapshot || order.customer?.name || '-',
              },
              {
                title: '销售订单',
                render: () => order.saleOrder?.orderNo || '-',
              },
              {
                title: '出库仓库',
                render: () => order.warehouse?.name || '-',
              },
              {
                title: '出库日期',
                dataIndex: 'deliveryDate',
                valueType: 'date',
              },
              { title: '备注', dataIndex: 'remarks' },
            ]}
          />

          <DocumentCustomFieldPanel
            objectType="sale_delivery"
            objectId={order.id}
            editable={capabilities.canEditCustomFields}
          />

          <ApprovalPanel
            entityType="sale_delivery"
            entityId={order.id}
            entityStatus={order.status}
            allowReset={['draft', 'submitted'].includes(String(order.status))}
            onStatusChange={refreshAfterAction}
          />

          {order.status === 'delivered' ? (
            <BusinessInvoiceCoverageCard
              mode="sales"
              sourceType="sale_delivery"
              sourceId={order.id}
            />
          ) : null}

          <SaleDeliveryItemsPanel
            deliveryId={order.id}
            onActionSuccess={refreshAfterAction}
            onOpenFullEditor={onOpenFullEditor}
            capabilities={capabilities.items}
          />

          <div>
            <Typography.Text strong>出库附件</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <FileUrlsInline
                value={order.attachmentUrls ?? []}
                emptyText="暂无出库附件"
                fileLabel="出库附件"
              />
            </div>
          </div>
        </Space>
      )}
    </Drawer>
  );
}

export interface SaleDeliveryDetailLedgerProps {
  capabilities: SaleDeliveryDetailLedgerCapabilities;
  onCreate?: () => void;
  onViewChange?: (view: import('../documents/DocumentViewSwitch').DocumentViewMode) => void;
  showHeaderTitle?: boolean;
  tableActionRef?: RefObject<ActionType | null>;
  filterFormRef?: RefObject<ProFormInstance | undefined>;
  savedViewController?: import('../documents/DocumentDetailLedgerTable').DocumentDetailLedgerSavedViewController<import('../documents/DocumentViewBar').DocumentViewBarView>;
}

/**
 * @sunxu-layer business
 * @sunxu-domain sales
 * @sunxu-reason Preserves host delivery-line filters, reversal and price details, summaries, and document actions while the host supplies data, permissions, routing, dictionaries, and print behavior.
 */
export function SaleDeliveryDetailLedger({
  capabilities,
  onCreate,
  onViewChange,
  showHeaderTitle = false,
  tableActionRef,
  filterFormRef,
  savedViewController,
}: SaleDeliveryDetailLedgerProps) {
  const [summary, setSummary] = useState<SaleDeliveryDetailLedgerSummary>();
  const [priceAllowed, setPriceAllowed] = useState(false);
  const amountVisibilityRevision = getAmountVisibilityRevision(
    capabilities.maskAmount,
    priceAllowed,
  );
  const columns = useMemo<ProColumns<SaleDeliveryDetailLedgerRow>[]>(() => {
    const filters: ProColumns<SaleDeliveryDetailLedgerRow>[] = [
      {
        title: '客户',
        dataIndex: 'customerId',
        hideInTable: true,
        ...capabilities.filterColumns?.customer,
      },
      {
        title: '物料',
        dataIndex: 'materialId',
        hideInTable: true,
        ...capabilities.filterColumns?.material,
      },
      {
        title: '出库仓库',
        dataIndex: 'warehouseId',
        hideInTable: true,
        ...capabilities.filterColumns?.warehouse,
      },
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: {
          placeholder: '销售出库单编号、订单号、客户、物料或行备注',
        },
      },
      { title: '销售出库单编号', dataIndex: 'deliveryNo', hideInTable: true },
      { title: '来源订单号', dataIndex: 'saleOrderNo', hideInTable: true },
      {
        title: '出库日期',
        dataIndex: 'deliveryDateRange',
        hideInTable: true,
        valueType: 'dateRange',
        fieldProps: { presets: BUSINESS_DATE_RANGE_PRESETS },
        search: {
          transform: (value: [string, string]) => ({
            startDate: value[0],
            endDate: value[1],
          }),
        },
      },
      { title: '批号', dataIndex: 'batchNo', hideInTable: true },
    ];
    return [
      ...filters,
      {
        title: '物料名称',
        dataIndex: 'materialName',
        width: 180,
        ellipsis: true,
        sorter: true,
        search: false,
        render: (_value, record) => record.material?.name || '-',
      },
      {
        title: '物料编码',
        dataIndex: 'materialCode',
        width: 150,
        sorter: true,
        search: false,
        render: (_value, record) => record.material?.code || '-',
      },
      {
        title: '规格型号',
        dataIndex: 'materialSpec',
        width: 150,
        ellipsis: true,
        search: false,
        render: (_value, record) => record.material?.spec || '-',
      },
      {
        title: '单位',
        dataIndex: 'materialUnit',
        width: 90,
        search: false,
        render: (_value, record) =>
          capabilities.formatUnitLabel(
            record.material?.unit,
            capabilities.unitLabelMap,
          ) || '-',
      },
      {
        title: '出库数量',
        dataIndex: 'originalQty',
        width: 120,
        align: 'right',
        sorter: true,
        search: false,
        render: (_value, record) =>
          capabilities.formatNumber(record.originalQty),
      },
      {
        title: '冲正数量',
        dataIndex: 'reversedQty',
        width: 110,
        align: 'right',
        search: false,
        render: (_value, record) =>
          capabilities.formatNumber(record.reversedQty),
      },
      ...createMaterialCustomFieldColumns(
        capabilities.materialCustomFields,
        {
          getMaterial: (record: SaleDeliveryDetailLedgerRow) => record.material,
          maskAmount: capabilities.maskAmount,
          priceAllowed,
          amountVisibilityRevision,
        },
      ),
      ...createLineCustomFieldColumns<SaleDeliveryDetailLedgerRow>(
        capabilities.lineCustomFieldSchema,
        '出库明细',
        {
          maskAmount: capabilities.maskAmount,
          priceAllowed,
          amountVisibilityRevision,
        },
      ),
      {
        title: '销售出库单编号',
        dataIndex: 'deliveryNo',
        width: 170,
        sorter: true,
        search: false,
        render: (_value, record) => {
          const delivery = record.deliveryOrder;
          if (!delivery) return '-';
          return capabilities.permissions.canViewDelivery ? (
            <Button
              type="link"
              size="small"
              onClick={() => capabilities.navigateToDelivery(delivery.id)}
            >
              {delivery.deliveryNo}
            </Button>
          ) : (
            delivery.deliveryNo
          );
        },
      },
      {
        title: '来源订单',
        dataIndex: 'saleOrderNo',
        width: 170,
        sorter: true,
        search: false,
        render: (_value, record) => {
          const order = record.deliveryOrder?.saleOrder;
          if (!order) return '-';
          return capabilities.permissions.canViewSaleOrder ? (
            <Button
              type="link"
              size="small"
              onClick={() => capabilities.navigateToSaleOrder(order.id)}
            >
              {order.orderNo}
            </Button>
          ) : (
            order.orderNo
          );
        },
      },
      {
        title: '客户',
        dataIndex: 'customerName',
        width: 160,
        ellipsis: true,
        search: false,
        render: (_value, record) =>
          record.deliveryOrder?.partnerNameSnapshot ||
          record.deliveryOrder?.customer?.name ||
          '-',
      },
      createStatusLedgerColumn(
        'status',
        '状态',
        capabilities.statusEnum,
        (record) => record.deliveryOrder?.status,
        { fieldProps: { mode: 'multiple' } },
      ),
      {
        title: '出库仓库',
        dataIndex: 'warehouseName',
        width: 140,
        search: false,
        render: (_value, record) => record.deliveryOrder?.warehouse?.name || '-',
      },
      createLedgerDateColumn(
        'ledgerDate',
        '出库日期',
        capabilities.formatDate,
        { width: 120, sorter: true },
      ),
      {
        title: '批号',
        dataIndex: 'batchNo',
        width: 140,
        search: false,
        render: (_value, record) => record.batchNo || '-',
      },
      {
        title: '仓位',
        dataIndex: 'storageLocation',
        width: 160,
        ellipsis: true,
        search: false,
        render: (_value, record) =>
          record.storageLocationSnapshot || record.location?.pathName || '-',
      },
      ...(priceAllowed
        ? withAmountVisibilityRevisions<SaleDeliveryDetailLedgerRow>([
            {
              title: '发生金额',
              dataIndex: 'ledgerAmount',
              width: 130,
              align: 'right' as const,
              search: false,
              render: (_value: unknown, record: SaleDeliveryDetailLedgerRow) =>
                record.ledgerAmount == null
                  ? '-'
                  : capabilities.maskAmount(
                      capabilities.formatCurrency(record.ledgerAmount),
                      priceAllowed,
                    ),
            },
            ...createSaleDeliveryDetailPriceColumns(capabilities),
            {
              title: '原出库金额',
              dataIndex: 'originalAmount',
              width: 130,
              align: 'right' as const,
              search: false,
              render: (_value: unknown, record: SaleDeliveryDetailLedgerRow) =>
                record.originalAmount == null
                  ? '-'
                  : capabilities.maskAmount(
                      capabilities.formatCurrency(record.originalAmount),
                      priceAllowed,
                    ),
            },
          ], amountVisibilityRevision)
        : []),
      createLedgerDateColumn('createdAt', '创建时间', capabilities.formatDate, {
        width: 180,
        sorter: true,
      }),
      createLedgerDateColumn('updatedAt', '更新时间', capabilities.formatDate, {
        width: 180,
        sorter: true,
      }),
      {
        title: '行备注',
        dataIndex: 'remarks',
        width: 180,
        ellipsis: true,
        search: false,
        render: (_value, record) => record.remarks || '-',
      },
      markCompleteActionMenuColumn<SaleDeliveryDetailLedgerRow>({
        title: '',
        dataIndex: '__actions',
        valueType: 'option',
        width: 48,
        fixed: 'right',
        search: false,
        render: (_value, record) => {
          const delivery = record.deliveryOrder;
          if (!delivery || !capabilities.permissions.canViewDelivery) return '-';
          return (
            <SaleDeliveryDocumentActionsDropdown
              deliveryId={delivery.id}
              deliveryNo={delivery.deliveryNo}
              capabilities={capabilities.documentActions}
              onOpenDetail={capabilities.navigateToDelivery}
              onEdit={capabilities.navigateToDeliveryEditor}
              onActionSuccess={() => tableActionRef?.current?.reload()}
            />
          );
        },
      }),
    ];
  }, [capabilities, priceAllowed, amountVisibilityRevision, tableActionRef]);

  const lightFilter = useMemo(
    () => ({
      formValuesFromFilters: (filters: Record<string, unknown>) => ({
        deliveryNo: filters.deliveryNo,
        saleOrderNo: filters.saleOrderNo,
        customerId: filters.customerId,
        materialId: filters.materialId,
        warehouseId: filters.warehouseId,
        batchNo: filters.batchNo,
        status: filters.status,
        ...restoreDetailLedgerDateRange(filters, 'deliveryDateRange'),
      }),
    }),
    [],
  );
  const buildQuery = useCallback(
    (
      params: Record<string, unknown>,
      sortQuery: Pick<SaleDeliveryDetailLedgerQuery, 'orderBy' | 'orderDir'> = {},
    ): SaleDeliveryDetailLedgerQuery => ({
      keyword: (params.keyword as string) || undefined,
      deliveryNo: (params.deliveryNo as string) || undefined,
      saleOrderNo: (params.saleOrderNo as string) || undefined,
      status: Array.isArray(params.statuses)
        ? undefined
        : ((Array.isArray(params.status) ? undefined : params.status) as
            | string
            | undefined),
      statuses: (Array.isArray(params.statuses)
        ? params.statuses
        : Array.isArray(params.status)
          ? params.status
          : undefined) as string[] | undefined,
      customerId: (params.customerId as string) || undefined,
      materialId: (params.materialId as string) || undefined,
      warehouseId: (params.warehouseId as string) || undefined,
      batchNo: (params.batchNo as string) || undefined,
      startDate: (params.startDate as string) || undefined,
      endDate: (params.endDate as string) || undefined,
      orderBy: sortQuery.orderBy ?? 'deliveryDate',
      orderDir: sortQuery.orderDir ?? 'DESC',
    }),
    [],
  );
  const handleResponse = useCallback(
    (
      response: SalesDetailLedgerResponse<
        SaleDeliveryDetailLedgerRow,
        SaleDeliveryDetailLedgerSummary
      >,
    ) => {
      setPriceAllowed(response.priceVisible);
      setSummary(response.summary);
    },
    [],
  );
  const savedView = savedViewController
    ? { controller: savedViewController }
    : undefined;

  return (
    <DocumentDetailLedgerTable<
      SaleDeliveryDetailLedgerRow,
      SaleDeliveryDetailLedgerQuery,
      SalesDetailLedgerResponse<
        SaleDeliveryDetailLedgerRow,
        SaleDeliveryDetailLedgerSummary
      >
    >
      tableActionRef={tableActionRef}
      filterFormRef={filterFormRef}
      savedView={savedView}
      showHeaderTitle={showHeaderTitle}
      initialQuery={{ orderBy: 'deliveryDate', orderDir: 'DESC' }}
      apiFn={(body) => capabilities.requestList(body)}
      buildQuery={buildQuery}
      columns={columns}
      exportFn={capabilities.exportExcel}
      exportFileName={`${capabilities.exportFileNamePrefix}_${Date.now()}.xlsx`}
      exportPermission={capabilities.exportPermission}
      createPermission={capabilities.createPermission}
      onCreate={onCreate}
      resizable={capabilities.resizable}
      serverSortFields={capabilities.serverSortFields}
      scrollX={2920}
      onViewChange={onViewChange}
      toolbarExtra={capabilities.renderAmountVisibilityToggle(priceAllowed)}
      exportLabel={priceAllowed ? '导出明细' : '导出明细（不含金额）'}
      onResponse={handleResponse}
      footer={summary ? <SaleDeliveryLedgerFooter summary={summary} capabilities={capabilities} priceAllowed={priceAllowed} /> : null}
      lightFilter={lightFilter}
    />
  );
}

function createSaleDeliveryDetailPriceColumns(
  capabilities: SaleDeliveryDetailLedgerCapabilities,
): ProColumns<SaleDeliveryDetailLedgerRow>[] {
  const formatMoney = (
    value: number | null | undefined,
    record: SaleDeliveryDetailLedgerRow,
  ) => {
    if (value == null) return '-';
    const currency = getSnapshotCurrency(record.priceSnapshot);
    const formatted = `${Number(value).toFixed(2)}${currency ? ` ${currency}` : ''}`;
    return capabilities.maskAmount(formatted, true);
  };
  const formatRate = (value: number | null | undefined) =>
    value == null
      ? '-'
      : `${Number(value).toLocaleString('zh-CN', {
          maximumFractionDigits: 4,
        })}%`;
  return [
    {
      title: '单价',
      dataIndex: 'unitPrice',
      width: 120,
      align: 'right',
      search: false,
      render: (_value, record) => formatMoney(record.unitPrice, record),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 130,
      align: 'right',
      search: false,
      render: (_value, record) => formatMoney(record.amount, record),
    },
    {
      title: '折扣%',
      dataIndex: 'discountRate',
      width: 110,
      align: 'right',
      search: false,
      render: (_value, record) => formatRate(record.discountRate),
    },
    {
      title: '折扣金额',
      dataIndex: 'discountAmount',
      width: 130,
      align: 'right',
      search: false,
      render: (_value, record) => formatMoney(record.discountAmount, record),
    },
    {
      title: '折后金额',
      dataIndex: 'discountedAmount',
      width: 130,
      align: 'right',
      search: false,
      render: (_value, record) => formatMoney(record.discountedAmount, record),
    },
    {
      title: '税率%',
      dataIndex: 'taxRate',
      width: 110,
      align: 'right',
      search: false,
      render: (_value, record) => formatRate(record.taxRate),
    },
    {
      title: '税额',
      dataIndex: 'taxAmount',
      width: 130,
      align: 'right',
      search: false,
      render: (_value, record) => formatMoney(record.taxAmount, record),
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      width: 130,
      align: 'right',
      search: false,
      render: (_value, record) => formatMoney(record.totalAmount, record),
    },
    {
      title: '单价含税',
      dataIndex: 'priceIncludesTax',
      width: 110,
      align: 'center',
      search: false,
      render: (_value, record) =>
        record.priceIncludesTax == null
          ? '-'
          : record.priceIncludesTax
            ? '是'
            : '否',
    },
    {
      title: '金额计算规则',
      dataIndex: 'priceSnapshot',
      width: 150,
      search: false,
      render: (_value, record) => (
        <AmountPolicySnapshotTag
          priceSnapshot={record.priceSnapshot}
          mask={(value) => capabilities.maskAmount(value, true)}
        />
      ),
    },
  ];
}

function getSnapshotCurrency(value: unknown): string | undefined {
  const currency = readRecord(value).currency;
  return typeof currency === 'string' && currency.trim()
    ? currency.trim()
    : undefined;
}

function SaleDeliveryLedgerFooter({
  summary,
  capabilities,
  priceAllowed,
}: {
  summary: SaleDeliveryDetailLedgerSummary;
  capabilities: SaleDeliveryDetailLedgerCapabilities;
  priceAllowed: boolean;
}) {
  const renderAmount = (value: number | null | undefined) =>
    value == null
      ? '-'
      : capabilities.maskAmount(
          capabilities.formatCurrency(value),
          priceAllowed,
        );
  return (
    <>
      <span>销售出库单笔数 {capabilities.formatNumber(summary.deliveryOrderCount)}</span>
      <span>明细行 {capabilities.formatNumber(summary.itemCount)}</span>
      <span>出库数量 {capabilities.formatNumber(summary.originalQty)}</span>
      <span>冲正 {capabilities.formatNumber(summary.reversedQty)}</span>
      {priceAllowed ? (
        <>
          <span>金额 {renderAmount(summary.amount)}</span>
          <span>折扣金额 {renderAmount(summary.discountAmount)}</span>
          <span>折后金额 {renderAmount(summary.discountedAmount)}</span>
          <span>税额 {renderAmount(summary.taxAmount)}</span>
          <span>总金额 {renderAmount(summary.totalAmount)}</span>
        </>
      ) : null}
      {(summary.customFieldSummaries ?? []).map((item) => (
        <span key={item.fieldKey}>
          {item.label}{' '}
          {formatCustomFieldSummaryValue(
            item,
            capabilities.lineCustomFieldSchema,
            capabilities.formatNumber,
            capabilities.maskAmount,
            priceAllowed,
          )}
        </span>
      ))}
    </>
  );
}
