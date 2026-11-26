import { Button } from 'antd';
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import { useCallback, useMemo, useRef } from 'react';
import { ListScreenContainer } from '../../../components/PageContainers';
import { DocumentLedgerViewSwitch } from '../documents/DocumentLedgerViewSwitch';
import { materialSelectColumnProps } from './MaterialFilteredSelect';
import { ResizableProTable } from '../shared/ResizableTable';
import { StatusDisplay } from '../../../components/StatusDisplay';
import type {
  StockTransferDetailLedgerCapabilities,
  StockTransferDetailLedgerProps,
  StockTransferDetailLedgerQuery,
  StockTransferDetailLedgerRow,
} from './stock-transfer-detail-ledger-types';

function readDateRange(
  value: unknown,
  normalizeDateOnlyValue: StockTransferDetailLedgerCapabilities['normalizeDateOnlyValue'],
): [string?, string?] {
  if (!Array.isArray(value)) return [];
  const [startDate, endDate] = value;
  return [normalizeDateOnlyValue(startDate), normalizeDateOnlyValue(endDate)];
}

function toValueEnum(
  enumMap: StockTransferDetailLedgerCapabilities['statusEnum'],
) {
  return Object.fromEntries(
    Object.entries(enumMap).map(([key, value]) => [key, { text: value.text }]),
  );
}

function resolveSort(sort?: Record<string, unknown>) {
  const active = Object.entries(sort ?? {}).find(
    ([, value]) => value === 'ascend' || value === 'descend',
  );
  if (!active) return {};
  const [rawField, rawOrder] = active;
  const field = rawField
    .trim()
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .pop()
    ?.split('.')
    .map((value) => value.trim())
    .filter(Boolean)
    .pop();
  return {
    orderBy: field,
    orderDir: rawOrder === 'ascend' ? ('ASC' as const) : ('DESC' as const),
  };
}

function mapFilterParams(
  params: Record<string, unknown>,
  capabilities: StockTransferDetailLedgerCapabilities,
): Omit<StockTransferDetailLedgerQuery, 'page' | 'pageSize' | 'orderBy' | 'orderDir'> {
  const [businessDateStart, businessDateEnd] = readDateRange(
    params.businessDateRange,
    capabilities.normalizeDateOnlyValue,
  );
  return {
    keyword: typeof params.keyword === 'string' ? params.keyword : undefined,
    fromWarehouseId:
      typeof params.fromWarehouseId === 'string'
        ? params.fromWarehouseId
        : undefined,
    toWarehouseId:
      typeof params.toWarehouseId === 'string'
        ? params.toWarehouseId
        : undefined,
    batchNo: typeof params.batchNo === 'string' ? params.batchNo : undefined,
    businessDateStart,
    businessDateEnd,
  };
}

function remoteSelectColumnProps(
  request: StockTransferDetailLedgerCapabilities['requestFromWarehouseOptions'],
) {
  return {
    valueType: 'select' as const,
    showSearch: true,
    debounceTime: 300,
    request,
    fieldProps: {
      showSearch: true,
      filterOption: false,
      fetchDataOnSearch: true,
      placeholder: '默认显示前50条，输入关键词可搜索更多',
    },
  };
}

/**
 * @sunxu-layer business
 * @sunxu-domain inventory
 * @sunxu-reason Keeps the read-only transfer-flow filters, table columns, server sorting, export action, and document/detail view switch in the host UI suite; the host owns queries, permissions, option dictionaries, formatting, download feedback, and the outer order workflow.
 */
export function StockTransferDetailLedger({
  capabilities,
  onViewChange,
}: StockTransferDetailLedgerProps) {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const listFormRef = useRef<ProFormInstance | undefined>(undefined);
  const latestListQueryRef = useRef<StockTransferDetailLedgerQuery>({});

  const mapListParams = useCallback(
    (params: Record<string, unknown>) =>
      mapFilterParams(params, capabilities),
    [capabilities],
  );

  const request = useCallback(
    async (
      params: Record<string, unknown>,
      sort?: Record<string, unknown>,
    ) => {
      const query: StockTransferDetailLedgerQuery = {
        page: (params.current as number | undefined) ?? 1,
        pageSize: (params.pageSize as number | undefined) ?? 20,
        ...resolveSort(sort),
        ...mapListParams(params),
      };
      latestListQueryRef.current = query;
      const response = await capabilities.requestList(query);
      return {
        data: response?.list ?? [],
        total: response?.total ?? 0,
        success: true,
      };
    },
    [capabilities, mapListParams],
  );

  const getCurrentExportQuery = useCallback(() => {
    const form = listFormRef.current;
    if (!form) return latestListQueryRef.current;
    const formattedValues: unknown = form.getFieldsFormatValue?.();
    if (
      formattedValues &&
      typeof formattedValues === 'object' &&
      !Array.isArray(formattedValues)
    ) {
      return mapListParams(formattedValues as Record<string, unknown>);
    }
    const values: unknown = form.getFieldsValue();
    return values && typeof values === 'object' && !Array.isArray(values)
      ? mapListParams(values as Record<string, unknown>)
      : latestListQueryRef.current;
  }, [mapListParams]);

  const columns = useMemo<ProColumns<StockTransferDetailLedgerRow>[]>(
    () => [
      {
        title: '调拨单号 / 物料',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: {
          placeholder: '输入调拨单号、物料名称、编码、规格型号或行备注搜索',
        },
      },
      {
        title: '调出仓库',
        dataIndex: 'fromWarehouseId',
        hideInTable: true,
        ...remoteSelectColumnProps(capabilities.requestFromWarehouseOptions),
      },
      {
        title: '调入仓库',
        dataIndex: 'toWarehouseId',
        hideInTable: true,
        ...remoteSelectColumnProps(capabilities.requestToWarehouseOptions),
      },
      { title: '批号', dataIndex: 'batchNo', hideInTable: true },
      {
        title: '调拨日期',
        dataIndex: 'businessDateRange',
        valueType: 'dateRange',
        hideInTable: true,
      },
      {
        title: '物料名称',
        key: 'materialName',
        dataIndex: ['material', 'name'],
        sorter: true,
        width: 180,
        ellipsis: true,
        search: false,
      },
      {
        title: '物料编码',
        key: 'materialCode',
        dataIndex: ['material', 'code'],
        sorter: true,
        width: 150,
        copyable: true,
        search: false,
      },
      {
        title: '规格型号',
        key: 'materialSpec',
        dataIndex: ['material', 'spec'],
        width: 160,
        ellipsis: true,
        search: false,
        render: (_value, record) => record.material.spec || '-',
      },
      {
        title: '单位',
        key: 'materialUnit',
        dataIndex: ['material', 'unit'],
        width: 90,
        search: false,
        render: (_value, record) =>
          capabilities.formatUnitLabel(
            record.material.unit,
            capabilities.materialUnitLabelMap,
          ) || '-',
      },
      {
        title: '调拨数量',
        key: 'quantity',
        dataIndex: 'qty',
        sorter: true,
        width: 110,
        align: 'right',
        search: false,
        render: (_value, record) => capabilities.formatNumber(record.qty),
      },
      {
        title: '调拨单号',
        dataIndex: 'referenceNo',
        sorter: true,
        width: 190,
        copyable: true,
        search: false,
        render: (_value, record) => (
          <Button
            type="link"
            size="small"
            onClick={() => onViewChange?.('orders')}
          >
            {record.referenceNo}
          </Button>
        ),
      },
      {
        title: '调出仓库',
        key: 'fromWarehouseName',
        dataIndex: ['fromWarehouse', 'name'],
        sorter: true,
        width: 130,
        search: false,
      },
      {
        title: '调出仓位',
        key: 'fromLocationPathName',
        width: 180,
        ellipsis: true,
        search: false,
        render: (_value, record) => record.fromLocation?.pathName || '-',
      },
      {
        title: '调入仓库',
        key: 'toWarehouseName',
        dataIndex: ['toWarehouse', 'name'],
        sorter: true,
        width: 130,
        search: false,
      },
      {
        title: '调入仓位',
        key: 'toLocationPathName',
        width: 180,
        ellipsis: true,
        search: false,
        render: (_value, record) => record.toLocation?.pathName || '-',
      },
      {
        title: '批号',
        dataIndex: 'batchNo',
        width: 150,
        search: false,
        render: (_value, record) => record.batchNo || '-',
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        search: false,
        valueEnum: toValueEnum(capabilities.statusEnum),
        render: (_value, record) => (
          <StatusDisplay value={record.status} enumMap={capabilities.statusEnum} />
        ),
      },
      {
        title: '调拨日期',
        dataIndex: 'businessDate',
        sorter: true,
        width: 120,
        search: false,
        valueType: 'date',
        render: (_value, record) =>
          capabilities.formatBusinessDateValue(record.businessDate) || '-',
      },
      {
        title: '操作人',
        dataIndex: 'operatorName',
        width: 110,
        search: false,
        render: (_value, record) => record.operatorName || '-',
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        width: 180,
        ellipsis: true,
        search: false,
        render: (_value, record) => record.remarks || '-',
      },
    ],
    [capabilities, onViewChange],
  );

  const exportAction = capabilities.canExport
    ? capabilities.renderExportAction({
        exportFn: () => capabilities.exportRows(getCurrentExportQuery()),
        fileName: `库存调拨明细_${Date.now()}.xlsx`,
        label: '导出明细',
      })
    : null;

  return (
    <ListScreenContainer as="section">
      <ResizableProTable<StockTransferDetailLedgerRow>
        actionRef={actionRef}
        formRef={listFormRef}
        columns={columns}
        request={request}
        rowKey="id"
        headerTitle={null}
        pagination={capabilities.pagination}
        sortDirections={['ascend', 'descend']}
        fitContainerHeight
        resizable={capabilities.resizable}
        search={{ labelWidth: 'auto', span: 6 }}
        scroll={{ x: 2050 }}
        toolBarRender={() => [
          exportAction ? <span key="export">{exportAction}</span> : null,
          <DocumentLedgerViewSwitch
            key="view-switch"
            value="detail"
            onChange={onViewChange ?? (() => undefined)}
          />,
        ]}
      />
    </ListScreenContainer>
  );
}
