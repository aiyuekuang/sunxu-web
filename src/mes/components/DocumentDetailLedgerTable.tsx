import { PlusOutlined } from '@ant-design/icons';
import type {
  ActionType,
  ColumnsState,
  ProColumns,
  ProFormInstance,
  ProTableProps,
} from '@ant-design/pro-components';
import { Button, Space, Typography } from 'antd';
import {
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { DocumentFilterDrawer, createDocumentFilterSearchConfig } from './DocumentFilterDrawer';
import {
  DocumentViewBar,
  type DocumentViewBarController,
  type DocumentViewBarView,
} from './DocumentViewBar';
import { DocumentLedgerViewSwitch } from './DocumentLedgerViewSwitch';
import type { DocumentViewMode } from './DocumentViewSwitch';
import { PermissionButton } from './PermissionButton';
import {
  ResizableProTable,
  type ResizableTableConfig,
} from './ResizableTable';
import { useMesDocumentDetailLedgerCapabilities } from '../MesUiProvider';
import type { MaterialColumnPriority } from '../table/materialColumnPriority';
import type { DocumentDetailLedgerExportActionProps } from './document-detail-ledger-types';

type ListSortQueryParams = {
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
};

type DetailLedgerResponse<T> = {
  list?: T[];
  total?: number;
};

type DetailLedgerQuery = {
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
};

type SavedSort = {
  field: string;
  order: 'ascend' | 'descend';
};

type RefCell<T> = { current: T };

export type DocumentDetailLedgerSavedViewController<
  TView extends DocumentViewBarView,
> = DocumentViewBarController<TView> & {
  currentConfig: {
    sort: SavedSort;
    columns: Record<string, ColumnsState>;
  };
  currentSortRef: RefCell<SavedSort>;
  applyingViewRef: RefCell<boolean>;
  params: Record<string, unknown>;
  activeFilterCount: number;
  beforeSearchSubmit: (values: Record<string, unknown>) => Record<string, unknown>;
  changeColumns: (columns: Record<string, ColumnsState>) => void;
  changeSort: (
    field: string | undefined,
    order: 'ascend' | 'descend' | undefined,
  ) => void;
};

export interface DocumentDetailLedgerTableProps<
  T extends object,
  D extends DetailLedgerQuery,
  R extends DetailLedgerResponse<T>,
  TView extends DocumentViewBarView = DocumentViewBarView,
> {
  headerTitle?: ReactNode;
  initialQuery: D;
  apiFn: (body: never) => Promise<R>;
  buildQuery: (
    params: Record<string, unknown>,
    sortQuery: ListSortQueryParams,
  ) => D;
  columns: ProColumns<T>[];
  exportFn: (query: D) => Promise<Blob>;
  exportFileName: string;
  exportPermission: string;
  /** 单据级新增动作的权限；明细本身不直接写入。 */
  createPermission?: string;
  /** 委托所属单据页面打开既有新增表单。 */
  onCreate?: () => void;
  resizable: ResizableTableConfig;
  materialColumnPriority?: MaterialColumnPriority | false;
  serverSortFields?: readonly string[];
  scrollX: number;
  onViewChange?: (view: DocumentViewMode) => void;
  onResponse?: (response: R) => void;
  footer?: ReactNode;
  tableActionRef?: RefObject<ActionType | null>;
  rowKey?: string;
  rowSelection?: ProTableProps<T, D>['rowSelection'];
  tableAlertOptionRender?: ProTableProps<T, D>['tableAlertOptionRender'];
  showHeaderTitle?: boolean;
  toolbarExtra?: ReactNode;
  exportLabel?: ReactNode;
  showExport?: boolean;
  initialFilters?: Record<string, unknown>;
  filterFormRef?: RefObject<ProFormInstance | undefined>;
  savedView?: {
    controller: DocumentDetailLedgerSavedViewController<TView>;
  };
  transientQueryParams?: Record<string, unknown>;
  onTransientQueryReset?: () => void;
  lightFilter: {
    formValuesFromFilters: (
      filters: Record<string, unknown>,
    ) => Record<string, unknown>;
  };
}

function mergeDefinedQueryParams(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>,
) {
  const merged = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    merged[key] = value;
  }
  return merged;
}

function resolveDocumentSavedSortQuery(
  savedSort: SavedSort,
  sortQuery: ListSortQueryParams = {},
  applyingView = false,
): Required<ListSortQueryParams> {
  const activeSortQuery = applyingView ? {} : sortQuery;
  return {
    orderBy: activeSortQuery.orderBy ?? savedSort.field,
    orderDir:
      activeSortQuery.orderDir ??
      (savedSort.order === 'ascend' ? 'ASC' : 'DESC'),
  };
}

function applyDocumentSavedSortOrder<T extends object>(
  columns: ProColumns<T>[],
  sort: SavedSort,
): ProColumns<T>[] {
  return columns.map((column) => {
    if (column.children) {
      return {
        ...column,
        children: applyDocumentSavedSortOrder(column.children, sort),
      };
    }
    const dataIndex = Array.isArray(column.dataIndex)
      ? column.dataIndex.join('.')
      : typeof column.dataIndex === 'string'
        ? column.dataIndex
        : undefined;
    const columnKey = typeof column.key === 'string' ? column.key : dataIndex;
    const isExplicitlySortable = column.sorter === true;
    const isImplicitlyServerSortable =
      column.sorter === undefined &&
      column.hideInTable !== true &&
      column.valueType !== 'option' &&
      Boolean(dataIndex && !dataIndex.startsWith('__'));
    const isCurrentImplicitSort =
      isImplicitlyServerSortable &&
      (columnKey === sort.field || dataIndex === sort.field);
    const isCurrentSort = columnKey === sort.field || dataIndex === sort.field;
    if (!isExplicitlySortable && !isCurrentImplicitSort) return column;
    return {
      ...column,
      ...(isCurrentImplicitSort ? { sorter: true } : {}),
      sortOrder: isCurrentSort ? sort.order : null,
      defaultSortOrder: isCurrentSort ? sort.order : undefined,
    };
  });
}

function toDocumentProTableColumns(
  columns: Record<string, ColumnsState>,
): Record<string, ColumnsState> {
  return Object.fromEntries(
    Object.entries(columns).map(([key, state]) => {
      const fixed: unknown = state.fixed;
      if (fixed !== false) return [key, state];
      const { fixed: _fixed, ...rest } = state;
      return [key, rest];
    }),
  );
}

function resolveProTableSort(
  sort?: Record<string, unknown>,
): ListSortQueryParams {
  const activeSort = Object.entries(sort ?? {}).find(
    ([, value]) => value === 'ascend' || value === 'descend',
  );
  if (!activeSort) return {};
  const [rawField, rawOrder] = activeSort;
  const trimmed = rawField.trim();
  const relationPrefix = '__mes_relation_sort__';
  const sortField = trimmed.startsWith(relationPrefix)
    ? trimmed.slice(relationPrefix.length) || trimmed
    : (trimmed.split(',').map((value) => value.trim()).filter(Boolean).pop() ?? trimmed)
        .split('.')
        .map((value) => value.trim())
        .filter(Boolean)
        .pop() ?? trimmed;
  return {
    orderBy: sortField,
    orderDir: rawOrder === 'ascend' ? 'ASC' : 'DESC',
  };
}

function buildCurrentListExportQuery<T>(
  formRef: RefObject<ProFormInstance | undefined>,
  fallback: T,
  build: (values: Record<string, unknown>) => T,
  transientParams: Record<string, unknown> = {},
): T {
  const form = formRef.current;
  if (!form) return fallback;
  const formattedValues: unknown = form.getFieldsFormatValue?.();
  if (
    formattedValues &&
    typeof formattedValues === 'object' &&
    !Array.isArray(formattedValues)
  ) {
    return build({
      ...(formattedValues as Record<string, unknown>),
      ...transientParams,
    });
  }
  const values: unknown = form.getFieldsValue();
  return values && typeof values === 'object' && !Array.isArray(values)
    ? build({
        ...(values as Record<string, unknown>),
        ...transientParams,
      })
    : fallback;
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-document-ledger
 * @sunxu-reason Keeps MES document-detail ledger filters, personal-view sorting, export query, and create entry aligned while data services and permissions stay host supplied.
 * Shared shell for document detail-ledger pages; business filters and summaries belong to the caller.
 */
export function DocumentDetailLedgerTable<
  T extends object,
  D extends DetailLedgerQuery,
  R extends DetailLedgerResponse<T>,
  TView extends DocumentViewBarView = DocumentViewBarView,
>({
  headerTitle,
  initialQuery,
  apiFn,
  buildQuery,
  columns,
  exportFn,
  exportFileName,
  exportPermission,
  createPermission,
  onCreate,
  resizable,
  materialColumnPriority,
  serverSortFields,
  scrollX,
  onViewChange,
  onResponse,
  footer,
  tableActionRef,
  rowKey = 'id',
  rowSelection,
  tableAlertOptionRender,
  showHeaderTitle = false,
  toolbarExtra,
  exportLabel = '导出明细',
  showExport = true,
  initialFilters,
  filterFormRef: externalFilterFormRef,
  savedView,
  transientQueryParams,
  onTransientQueryReset,
  lightFilter,
}: DocumentDetailLedgerTableProps<T, D, R, TView>) {
  const ledgerCapabilities = useMesDocumentDetailLedgerCapabilities();
  const internalTableRef = useRef<ActionType>(null);
  const tableRef = tableActionRef ?? internalTableRef;
  const internalFilterFormRef = useRef<ProFormInstance | undefined>(undefined);
  const filterFormRef = externalFilterFormRef ?? internalFilterFormRef;
  const latestQueryRef = useRef<D>(initialQuery);
  const requestSequenceRef = useRef(0);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const initialFormValues = useMemo(
    () => lightFilter.formValuesFromFilters(initialFilters ?? {}),
    [initialFilters, lightFilter],
  );
  const displayColumns = useMemo(
    () =>
      savedView
        ? applyDocumentSavedSortOrder(
            columns,
            savedView.controller.currentConfig.sort,
          )
        : columns,
    [columns, savedView],
  );
  const initialQueryParams = useMemo(
    () => initialFilters ?? {},
    [initialFilters],
  );
  const activeQueryParams = useMemo(
    () =>
      mergeDefinedQueryParams(
        mergeDefinedQueryParams(
          initialQueryParams,
          savedView?.controller.params ?? {},
        ),
        transientQueryParams ?? {},
      ),
    [initialQueryParams, savedView?.controller.params, transientQueryParams],
  );
  const appliedFilterCount = useMemo(
    () =>
      Object.keys(
        mergeDefinedQueryParams(
          initialQueryParams,
          savedView?.controller.params ?? {},
        ),
      ).length,
    [initialQueryParams, savedView?.controller.params],
  );

  const mapListParams = (
    params: Record<string, unknown>,
    sortQuery: ListSortQueryParams,
  ) => {
    const activeSort = savedView
      ? resolveDocumentSavedSortQuery(
          savedView.controller.currentSortRef.current,
          sortQuery,
          savedView.controller.applyingViewRef.current,
        )
      : sortQuery;
    const query = buildQuery(
      mergeDefinedQueryParams(activeQueryParams, params),
      activeSort,
    );
    latestQueryRef.current = query;
    return query;
  };

  const getCurrentExportQuery = () =>
    buildCurrentListExportQuery(
      filterFormRef,
      latestQueryRef.current,
      (params) => {
        const activeSort = savedView
          ? resolveDocumentSavedSortQuery(
              savedView.controller.currentSortRef.current,
            )
          : {
              orderBy: latestQueryRef.current.orderBy ?? initialQuery.orderBy,
              orderDir:
                latestQueryRef.current.orderDir ?? initialQuery.orderDir,
            };
        return buildQuery(
          mergeDefinedQueryParams(activeQueryParams, params),
          activeSort,
        );
      },
      transientQueryParams,
    );

  const apiFnRef = useRef(apiFn);
  const mapListParamsRef = useRef(mapListParams);
  const onResponseRef = useRef(onResponse);
  apiFnRef.current = apiFn;
  mapListParamsRef.current = mapListParams;
  onResponseRef.current = onResponse;
  const request = useMemo(
    () =>
      async (
        params: Record<string, unknown>,
        sort?: Record<string, unknown>,
      ) => {
        const requestId = ++requestSequenceRef.current;
        const sortQuery = resolveProTableSort(sort);
        const mapped = mapListParamsRef.current(params, sortQuery);
        const { current: _current, pageSize: _pageSize, ...passthrough } =
          params;
        const passthroughScalars = Object.fromEntries(
          Object.entries(passthrough).filter(([, value]) => {
            const valueType = typeof value;
            return (
              value == null ||
              valueType === 'string' ||
              valueType === 'number' ||
              valueType === 'boolean'
            );
          }),
        );
        const body = {
          page: (params.current as number) ?? 1,
          pageSize: (params.pageSize as number) ?? 20,
          ...sortQuery,
          ...passthroughScalars,
          ...mapped,
        } as D;
        const response = await (apiFnRef.current as (body: D) => Promise<R>)(
          body,
        );
        if (requestId === requestSequenceRef.current) {
          onResponseRef.current?.(response);
        }
        return {
          data: response?.list ?? [],
          total: response?.total ?? 0,
          success: true,
        };
      },
    [],
  );

  const exportActionProps: DocumentDetailLedgerExportActionProps = {
    exportFn: () => exportFn(getCurrentExportQuery()),
    fileName: exportFileName,
    permission: exportPermission,
    label: exportLabel,
  };
  const exportAction = showExport
    ? (ledgerCapabilities?.renderExportAction?.(exportActionProps) ?? (
        <Button disabled title="导出操作未配置">
          {exportLabel}
        </Button>
      ))
    : null;

  return (
    <ResizableProTable<T, Record<string, unknown>>
      rowKey={rowKey}
      resizable={{
        ...resizable,
        serverSortFields,
        sortPersistenceKey: false,
      }}
      materialColumnPriority={materialColumnPriority}
      fitContainerHeight
      actionRef={tableRef}
      rowSelection={rowSelection}
      tableAlertOptionRender={tableAlertOptionRender}
      sortDirections={['ascend', 'descend']}
      headerTitle={showHeaderTitle ? headerTitle : undefined}
      params={activeQueryParams}
      tableExtraRender={() =>
        savedView ? (
          <DocumentViewBar
            controller={savedView.controller}
            filterCount={appliedFilterCount}
            onOpenFilters={() => setFilterDrawerOpen(true)}
          />
        ) : null
      }
      toolBarRender={() => [
        <DocumentLedgerViewSwitch
          key="view-switch"
          value="detail"
          onChange={onViewChange ?? (() => undefined)}
        />,
        toolbarExtra,
        exportAction ? <span key="export">{exportAction}</span> : null,
        createPermission && onCreate ? (
          <PermissionButton
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            permission={createPermission}
            onClick={onCreate}
          >
            新增
          </PermissionButton>
        ) : null,
      ]}
      request={request}
      formRef={filterFormRef}
      form={{ initialValues: initialFormValues }}
      columns={displayColumns}
      beforeSearchSubmit={savedView?.controller.beforeSearchSubmit}
      search={
        savedView
          ? createDocumentFilterSearchConfig(onTransientQueryReset)
          : { labelWidth: 'auto', filterType: 'light', span: 6 }
      }
      searchFormRender={
        savedView
          ? (_, defaultDom) => (
              <DocumentFilterDrawer
                open={filterDrawerOpen}
                onOpenChange={setFilterDrawerOpen}
                appliedCount={savedView.controller.activeFilterCount}
              >
                {defaultDom}
              </DocumentFilterDrawer>
            )
          : undefined
      }
      columnsState={
        savedView
          ? {
              value: toDocumentProTableColumns(
                savedView.controller.currentConfig.columns,
              ),
              onChange: savedView.controller.changeColumns,
            }
          : undefined
      }
      onChange={(_pagination, _filters, sorter, extra) => {
        if (
          !savedView ||
          savedView.controller.loading ||
          extra.action !== 'sort'
        ) {
          return;
        }
        const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
        const rawField = activeSorter?.field;
        const field = Array.isArray(rawField)
          ? rawField.map(String).join('.')
          : typeof rawField === 'string'
            ? rawField
            : undefined;
        const order =
          activeSorter?.order === 'ascend' ||
          activeSorter?.order === 'descend'
            ? activeSorter.order
            : undefined;
        savedView.controller.changeSort(field, order);
      }}
      scroll={{ x: scrollX }}
      pagination={ledgerCapabilities?.pagination}
      footer={() =>
        footer ? (
          <Space size="large" wrap>
            <Typography.Text type="secondary">本筛选合计：</Typography.Text>
            {footer}
          </Space>
        ) : null
      }
    />
  );
}
