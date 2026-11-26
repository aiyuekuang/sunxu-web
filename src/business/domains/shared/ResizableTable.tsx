import { SettingOutlined } from '@ant-design/icons';
import {
  type ProColumns,
  type ParamsType,
  ProTable,
  type ProTableProps,
} from '@ant-design/pro-components';
import {
  ConfigProvider,
  type SpinProps,
  Table,
  type TablePaginationConfig,
  type TableProps,
  Tooltip,
} from 'antd';
import type { LongTextDisplayMode } from '../../../components/LongText';
import { withPaginationSummary } from '../../../components/PaginationSummary';
import {
  TableSummary,
  withResolvedTableSummary,
} from '../../../components/TableSummary';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type OptionsType,
  useAntdResizableHeader,
} from 'use-antd-resizable-header';
import {
  type MaterialColumnPriority,
  prioritizeMaterialDetailColumns,
} from '../../table/materialColumnPriority';
import { TableDensityOption } from '../../table/TableDensityOption';
import { TableEmpty } from '../../table/TableEmpty';
import {
  normalizeTableSortStorageKey,
  normalizeTableWidthStorageKey,
  TABLE_COLUMN_KEY_PREFIX,
  TABLE_SORT_KEY_PREFIX,
  TABLE_SORT_STORAGE_PREFIX,
  TABLE_WIDTH_KEY_PREFIX,
  TABLE_WIDTH_STORAGE_PREFIX,
} from '../../utils/storageSchema';
import {
  isTableLongTextValue,
  TableLongText,
} from '../documents/TableLongText';
import TableActions from '../../table/TableActions';
import { hasCompleteActionMenuColumn } from '../../table/completeActionMenuColumn';
import {
  type DateRangePickerPreset,
  mergeDateRangePresets,
} from '../../table/dateRangePresets';
import {
  getAntdTableSize,
  getTableDensityTokens,
  useTableDensityKey,
  type TableDensityKey,
} from '../../theme/tableDensity';
import {
  ensureTableCacheCapacity,
  safeLocalStorageGetItem,
  safeLocalStorageSetItem,
} from '../../utils/safeStorage';
import {
  createRowIndexColumn,
  type LocalSortableColumn,
  normalizeExternalQueryParams,
  ROW_INDEX_COLUMN_KEY,
  type RowIndexPageInfo,
  withAuditDateColumns,
  withLocalSorters,
  withServerSorters,
} from '../../table/tableHelpers';
import {
  isInteractiveActionNode,
  toActionNodes,
} from '../../table/actionNodes';
import {
  getTableExportRouteKey,
  type TableColumnState,
  type TableExportLayout,
  updateActiveTableExportLayout,
} from '../../table/exportLayout';
import { TableExportLayoutBoundary } from '../../table/ExportLayoutBoundary';
import {
  useAmountVisibilityRevision,
  useTableCapabilities,
} from '../../providers/BusinessUiProvider';
import 'use-antd-resizable-header/dist/style.css';

const DEFAULT_PAGE_SIZE = 20;
const COMPACT_TABLE_ACTION_COLUMN_WIDTH = 48;
const isCompactTableActionMode = true;
const AMOUNT_VISIBILITY_REVISION_KEY = '__sxwAmountVisibilityRevision';

type AmountVisibilityAwareColumn = {
  render?: unknown;
  children?: AmountVisibilityAwareColumn[];
  [AMOUNT_VISIBILITY_REVISION_KEY]?: unknown;
};

function withAmountVisibilityRevision<T extends AmountVisibilityAwareColumn>(
  columns: T[] | undefined,
  revision: string | number | boolean | undefined,
): T[] | undefined {
  if (!columns || revision === undefined) return columns;

  return columns.map((column) => {
    const nextChildren = column.children
      ? withAmountVisibilityRevision(column.children, revision)
      : undefined;
    const childrenChanged =
      nextChildren !== undefined &&
      nextChildren.some((child, index) => child !== column.children?.[index]);
    const children = childrenChanged ? nextChildren : column.children;
    const hasRenderer = typeof column.render === 'function';
    const existingRevision = column[AMOUNT_VISIBILITY_REVISION_KEY];
    const nextRevision =
      existingRevision === undefined
        ? revision
        : `${String(existingRevision)}:${String(revision)}`;
    const revisionChanged =
      hasRenderer && existingRevision !== nextRevision;

    if (!revisionChanged && !childrenChanged) return column;

    return {
      ...column,
      ...(childrenChanged ? { children } : {}),
      ...(revisionChanged
        ? { [AMOUNT_VISIBILITY_REVISION_KEY]: nextRevision }
        : {}),
    } as T;
  });
}

type PersistenceType = 'localStorage' | 'sessionStorage';

type ActiveTableSortState = {
  field: string;
  order: 'ascend' | 'descend';
};

export interface ResizableTableSortMigration {
  from: ActiveTableSortState;
  to: ActiveTableSortState;
}

export interface ResizableTableConfig {
  enabled?: boolean;
  persistenceKey?: string | false;
  /**
   * 服务端排序字段白名单。
   *
   * 复杂单据列表的排序通常有领域白名单、计算列口径或权限约束，不能只因
   * 列上存在 dataIndex 就显示为可排序。未设置时保留普通 CRUD 列表的自动
   * 排序行为；设置后仅为白名单中的未显式配置列补齐 sorter，并禁用白名单外
   * 历史代码显式声明的排序入口。
   */
  serverSortFields?: readonly string[];
  /**
   * 排序可独立于列宽升级 key，避免业务默认排序变更时清空用户列宽和列序。
   * 新 key 首次读取不到值时，会从 persistenceKey 派生的旧排序 key 迁移。
   */
  sortPersistenceKey?: string | false;
  /** 仅替换与旧默认值完全一致的排序，其他用户排序原样迁移。 */
  sortMigration?: ResizableTableSortMigration;
  persistenceType?: PersistenceType;
  defaultWidth?: number;
  minConstraints?: number;
  maxConstraints?: number;
  debounceWaitTime?: number;
}

type ResizableColumn<T extends object> = ProColumns<T> & {
  children?: ResizableColumn<T>[];
  defaultWidth?: number;
  minConstraints?: number;
  maxConstraints?: number;
  resizable?: boolean;
  [RESIZABLE_ADAPTIVE_COLUMN_FLAG]?: boolean;
};

type ResizableColumnOptions = {
  defaultWidth?: number;
  minConstraints?: number;
  maxConstraints?: number;
  resizable?: boolean;
};

type ResizableAntdColumn<T extends object> = NonNullable<
  TableProps<T>['columns']
>[number] & {
  children?: ResizableAntdColumn<T>[];
  /** 公共操作列身份，用于紧凑操作列适配；原生 Table 本身不消费此字段。 */
  valueType?: 'option';
  defaultWidth?: number;
  minConstraints?: number;
  maxConstraints?: number;
  resizable?: boolean;
  hidden?: boolean;
  [RESIZABLE_ADAPTIVE_COLUMN_FLAG]?: boolean;
};

type ScrollX = NonNullable<TableProps<object>['scroll']>['x'];
type ScrollY = NonNullable<TableProps<object>['scroll']>['y'];

export interface FitContainerHeightConfig {
  enabled?: boolean;
  bottomOffset?: number;
  minBodyHeight?: number;
  maxBodyHeight?: number;
}

export type FitContainerHeight = boolean | FitContainerHeightConfig;
type ResolvedFitContainerHeightConfig = Required<FitContainerHeightConfig>;
export type ResizableProTableProps<
  T extends object,
  U extends ParamsType = ParamsType,
> = Omit<ProTableProps<T, U>, 'columns'> & {
  /** 列支持 sortValue / sortable，用于本地数据表的列头排序，见 withLocalSorters。 */
  columns?: Array<LocalSortableColumn<T> & ResizableColumnOptions>;
  resizable?: boolean | ResizableTableConfig;
  /**
   * @deprecated For single-list viewport pages, use `CrudListWorkbench` with `fill`.
   * Retained for existing host integrations and locally bounded nested tables while they migrate.
   */
  fitContainerHeight?: FitContainerHeight;
  /** 分页列表默认展示 ERP 风格的全局序号；详情/明细表可显式关闭。 */
  showRowIndex?: boolean;
  /** 列表空态的业务引导文案（数据由哪个上游生成/需要什么配置/筛选无结果如何调整）。 */
  emptyGuidance?: React.ReactNode;
  /** Host-provided summary for the filtered result, placed beside pagination. */
  paginationSummary?: React.ReactNode;
  /**
   * 将当前表格列配置绑定到导出请求。
   *
   * request 表默认启用；本地 dataSource 表只有在自身就是导出数据源时才显式开启，
   * 避免详情页内嵌表污染同一路由上的其他导出入口。
   */
  exportLayoutEnabled?: boolean;
  /** 物料明细默认按名称、编码、规格、单位、主业务数量归一排序；明确例外可设 preserve。 */
  materialColumnPriority?: MaterialColumnPriority | false;
};
export type ResizableTableProps<T extends object> = Omit<
  TableProps<T>,
  'columns'
> & {
  /**
   * 保留 Ant Design Table 列定义，同时接受 valueType 等 ProTable 扩展，
   * 供公共操作列识别和紧凑操作模式复用。
   */
  columns?: ResizableAntdColumn<T>[];
  resizable?: boolean | ResizableTableConfig;
  /** 分页列表默认展示 ERP 风格的全局序号；明细表可显式关闭。 */
  showRowIndex?: boolean;
  emptyGuidance?: React.ReactNode;
  /** Host-provided summary for the filtered result, placed beside pagination. */
  paginationSummary?: React.ReactNode;
  /** 物料明细默认按名称、编码、规格、单位、主业务数量归一排序；明确例外可设 preserve。 */
  materialColumnPriority?: MaterialColumnPriority | false;
};
type ProTableColumnsState<
  T extends object,
  U extends ParamsType = ParamsType,
> = ProTableProps<T, U>['columnsState'];
type ProTableColumnStateMap = NonNullable<
  NonNullable<ProTableProps<object, ParamsType>['columnsState']>['defaultValue']
>;

type ResolvedResizableTableConfig = Required<
  Omit<
    ResizableTableConfig,
    | 'persistenceKey'
    | 'serverSortFields'
    | 'sortPersistenceKey'
    | 'sortMigration'
  >
> & {
  persistenceKey?: string | false;
  serverSortFields?: readonly string[];
  sortPersistenceKey?: string | false;
  sortMigration?: ResizableTableSortMigration;
};

function TableDensityProvider({
  density,
  children,
}: {
  density: TableDensityKey;
  children: React.ReactNode;
}) {
  return (
    <ConfigProvider theme={{ components: { Table: getTableDensityTokens(density) } }}>
      {children}
    </ConfigProvider>
  );
}

const DEFAULT_CONFIG: ResolvedResizableTableConfig = {
  enabled: true,
  persistenceType: 'localStorage',
  defaultWidth: 120,
  minConstraints: 48,
  maxConstraints: Number.POSITIVE_INFINITY,
  debounceWaitTime: 500,
};

const DEFAULT_FIT_CONTAINER_HEIGHT_CONFIG: Required<FitContainerHeightConfig> =
  {
    enabled: true,
    bottomOffset: 16,
    minBodyHeight: 160,
    maxBodyHeight: Number.POSITIVE_INFINITY,
  };
const LIGHT_SEARCH_FIELD_LIMIT = 5;

const FIT_CONTAINER_STYLE: React.CSSProperties = {
  display: 'flex',
  flex: '1 1 auto',
  flexDirection: 'column',
  minHeight: 0,
};
const FIT_CONTAINER_CLASS_NAME = 'sxw-fit-pro-table';
const FIT_CONTAINER_HORIZONTAL_SCROLL_CLASS_NAME =
  'sxw-fit-pro-table-horizontal-scroll';
const FIT_CONTAINER_TABLE_CLASSES = {
  tableRoot: 'sxw-fit-pro-table__table-root',
  tableSection: 'sxw-fit-pro-table__table-section',
  spinRoot: 'sxw-fit-pro-table__spin-root',
  spinContainer: 'sxw-fit-pro-table__spin-container',
} as const;
const FIT_BOUNDARY_SELECTOR =
  '.sxw-fit-table-boundary, .ant-modal-body, .ant-drawer-body, .ant-splitter-panel, .ant-pro-page-container, .ant-pro-layout-content, .runtime-keep-alive-layout, .runtime-keep-alive-layout-no';
const COLUMN_SETTING_RESET_BUTTON_CLASS =
  'ant-pro-table-column-setting-action-rest-button';
const TABLE_SPACER_COLUMN_KEY = '__sxw_table_spacer__';
const EDITABLE_ROW_CLASS_NAME = 'sxw-table-row-editable';
const WRAP_TEXT_CELL_CLASS_NAME = 'sxw-table-wrap-cell';
const HEADER_ELLIPSIS_CLASS_NAME = 'sxw-table-header-ellipsis';
const EXPANDED_ROW_CLASS_NAME = 'sxw-table-expanded-row';
const DOUBLE_CLICK_EDIT_TITLE = '双击编辑';
const COLUMN_SETTING_DEFAULT_HIDDEN_FLAG = '__sxwColumnSettingDefaultHidden';
const PRESERVE_PERSISTED_FLEX_WIDTH = Symbol('preservePersistedFlexWidth');
const RESIZABLE_GENERATED_COLUMN_KEY_PREFIX = 'resizable-col-id';
const RESIZABLE_ADAPTIVE_COLUMN_FLAG = '__sxwResizableAdaptive';
const RESIZABLE_DUPLICATE_COLUMN_KEY_PREFIX = '__sxw-column-';
/**
 * ProTable 初始化服务端排序时按 dataIndex 建立状态，但列渲染时按 key
 * 匹配状态。排序列统一 key 后，保留原 key 供个人视图/列设置做别名迁移。
 */
const PRO_TABLE_ORIGINAL_COLUMN_KEY = '__sxwOriginalColumnKey';
const ROW_DOUBLE_CLICK_IGNORE_SELECTOR = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'label',
  '[role="button"]',
  '[role="menuitem"]',
  '.ant-btn',
  '.ant-switch',
  '.ant-checkbox-wrapper',
  '.ant-radio-wrapper',
  '.ant-dropdown-trigger',
  '.ant-table-selection-column',
  '.ant-select',
  '.ant-picker',
  '.ant-input',
  '.ant-upload',
].join(',');

const CONTENT_COLUMN_DEFAULT_WIDTH = 180;
const MIN_VISIBLE_INFORMATIVE_COLUMN_COUNT = 1;
let activeColumnSettingResetOwner: symbol | undefined;

type LongTextColumnMeta = {
  longTextDisplayMode?: LongTextDisplayMode;
  longTextMaxLines?: number;
  longTextMaxLength?: number;
  longTextModalTitle?: string;
};

type TableSortOrder = 'ascend' | 'descend' | null;

type PersistedSortState = {
  field: string;
  order: TableSortOrder;
};

type ProColumnRender<T extends object> = NonNullable<ProColumns<T>['render']>;
type AntdColumnRender<T extends object> = NonNullable<
  ResizableAntdColumn<T>['render']
>;
type LeafColumnStateDefaultEntry = {
  key: string;
  legacyKey?: string;
  state: ProTableColumnStateMap[string] & { order: number };
  informative: boolean;
  /** 注入型序号列：位置由表格结构决定，不允许被持久化列序挪到中间。 */
  pinned?: boolean;
};
type PersistedFlexWidthAwareColumn = {
  [PRESERVE_PERSISTED_FLEX_WIDTH]?: true;
  children?: unknown;
  dataIndex?: unknown;
  hideInTable?: boolean;
  hidden?: boolean;
  key?: React.Key;
  width?: unknown;
};

type ColumnSettingResetTriggerProps = React.HTMLAttributes<HTMLSpanElement> & {
  owner: symbol;
};
type HeaderEllipsisCellProps = React.ThHTMLAttributes<HTMLTableCellElement> & {
  'data-title'?: string;
};
type TableExpandable<T extends object> = TableProps<T>['expandable'];

const ColumnSettingResetTrigger = React.forwardRef<
  HTMLSpanElement,
  ColumnSettingResetTriggerProps
>(function ColumnSettingResetTrigger(
  {
    children,
    owner,
    onClickCapture,
    onFocusCapture,
    onMouseDownCapture,
    ...rest
  },
  ref,
) {
  const markActiveOwner = useCallback(() => {
    activeColumnSettingResetOwner = owner;
  }, [owner]);

  const handleClickCapture = useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      markActiveOwner();
      onClickCapture?.(event);
    },
    [markActiveOwner, onClickCapture],
  );

  const handleFocusCapture = useCallback(
    (event: React.FocusEvent<HTMLSpanElement>) => {
      markActiveOwner();
      onFocusCapture?.(event);
    },
    [markActiveOwner, onFocusCapture],
  );

  const handleMouseDownCapture = useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      markActiveOwner();
      onMouseDownCapture?.(event);
    },
    [markActiveOwner, onMouseDownCapture],
  );

  return (
    <span
      {...rest}
      ref={ref}
      onClickCapture={handleClickCapture}
      onFocusCapture={handleFocusCapture}
      onMouseDownCapture={handleMouseDownCapture}
    >
      {children}
    </span>
  );
});

function isElement(value: EventTarget | null): value is Element {
  return value instanceof Element;
}

function isInteractiveRowTarget(value: EventTarget | null) {
  return (
    isElement(value) && Boolean(value.closest(ROW_DOUBLE_CLICK_IGNORE_SELECTOR))
  );
}

function mergeClassName(
  ...classNames: Array<string | undefined | false>
): string | undefined {
  const merged = classNames.filter(Boolean).join(' ');
  return merged || undefined;
}

type ProTableClassNames<T extends object, U extends ParamsType> = NonNullable<
  ProTableProps<T, U>['classNames']
>;
type ProTableClassNameFactory<T extends object> = (info: {
  props: TableProps<T>;
}) => unknown;
type ProTableClassNameSlots<T extends object, U extends ParamsType> = Exclude<
  ProTableClassNames<T, U>,
  ProTableClassNameFactory<T>
>;

function addFitTableClassNames<T extends object, U extends ParamsType>(
  classNames: ProTableProps<T, U>['classNames'],
): ProTableProps<T, U>['classNames'] {
  const merge = (current?: ProTableClassNameSlots<T, U>) =>
    ({
      ...current,
      root: mergeClassName(
        current?.root,
        FIT_CONTAINER_TABLE_CLASSES.tableRoot,
      ),
      section: mergeClassName(
        current?.section,
        FIT_CONTAINER_TABLE_CLASSES.tableSection,
      ),
    }) as ProTableClassNameSlots<T, U>;

  if (typeof classNames === 'function') {
    return ((info) =>
      merge(classNames(info) as ProTableClassNameSlots<T, U>)) as ProTableClassNames<T, U>;
  }
  return merge(classNames as ProTableClassNameSlots<T, U>) as ProTableClassNames<T, U>;
}

type SpinClassNames = NonNullable<SpinProps['classNames']>;
type SpinClassNameFactory = (info: { props: SpinProps }) => unknown;
type SpinClassNameSlots = Exclude<SpinClassNames, SpinClassNameFactory>;

function addFitSpinClassNames(
  classNames: SpinProps['classNames'],
): SpinProps['classNames'] {
  const merge = (current?: SpinClassNameSlots) => ({
    ...current,
    root: mergeClassName(current?.root, FIT_CONTAINER_TABLE_CLASSES.spinRoot),
    container: mergeClassName(
      current?.container,
      FIT_CONTAINER_TABLE_CLASSES.spinContainer,
    ),
  }) as SpinClassNameSlots;

  if (typeof classNames === 'function') {
    return (info) => merge(classNames(info) as SpinClassNameSlots);
  }
  return merge(classNames as SpinClassNameSlots);
}

function addFitLoadingClassNames<T extends object, U extends ParamsType>(
  loading: ProTableProps<T, U>['loading'],
): ProTableProps<T, U>['loading'] {
  const current =
    typeof loading === 'object' && loading !== null
      ? loading
      : loading === undefined
        ? {}
        : { spinning: loading };
  return {
    ...current,
    classNames: addFitSpinClassNames(current.classNames),
  };
}

function mergeCellClassName(current: unknown) {
  return typeof current === 'string' && current
    ? `${current} ${WRAP_TEXT_CELL_CLASS_NAME}`
    : WRAP_TEXT_CELL_CLASS_NAME;
}

function withExpandedRowClassName<T extends object>(
  expandable: TableExpandable<T> | undefined,
): TableExpandable<T> | undefined {
  if (!expandable?.expandedRowRender) return expandable;

  const current = expandable.expandedRowClassName;
  return {
    ...expandable,
    expandedRowClassName: (record, index, indent) =>
      mergeClassName(
        EXPANDED_ROW_CLASS_NAME,
        typeof current === 'function'
          ? current(record, index, indent)
          : current,
      ) ?? EXPANDED_ROW_CLASS_NAME,
  };
}

function useEditableRowDoubleClick<
  T extends object,
  U extends ParamsType = ParamsType,
>(
  columns: ProColumns<T>[] | undefined,
  onRow: ProTableProps<T, U>['onRow'] | undefined,
  resolveRowEditAction?: (
    columns: readonly object[] | undefined,
    record: unknown,
  ) => { onClick: () => unknown | Promise<unknown> } | undefined,
): ProTableProps<T, U>['onRow'] | undefined {
  return useMemo(() => {
    if (!columns?.length) return onRow;

    return (record, index) => {
      const rowProps = onRow?.(record, index) ?? {};
      const editAction = resolveRowEditAction?.(columns, record);
      if (!editAction) return rowProps;

      const baseDoubleClick = rowProps.onDoubleClick;
      return {
        ...rowProps,
        className: mergeClassName(rowProps.className, EDITABLE_ROW_CLASS_NAME),
        title: rowProps.title ?? DOUBLE_CLICK_EDIT_TITLE,
        onDoubleClick: (event) => {
          const ignoredTarget = isInteractiveRowTarget(event.target);
          baseDoubleClick?.(event);
          if (
            ignoredTarget ||
            event.defaultPrevented ||
            event.isPropagationStopped()
          ) {
            return;
          }
          void editAction.onClick();
        },
      };
    };
  }, [columns, onRow, resolveRowEditAction]);
}

function normalizeDataIndex(dataIndex: unknown): string | undefined {
  if (Array.isArray(dataIndex)) {
    return dataIndex.map(String).join('.');
  }
  if (typeof dataIndex === 'string' || typeof dataIndex === 'number') {
    return String(dataIndex);
  }
  return undefined;
}

function normalizeSortField(field: unknown): string | undefined {
  if (Array.isArray(field)) {
    return field.map(String).join('.');
  }
  if (typeof field === 'string') {
    const trimmed = field.trim();
    if (!trimmed) return undefined;
    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .join('.');
    }
    return trimmed;
  }
  if (typeof field === 'number') {
    return String(field);
  }
  return undefined;
}

function getRecordValue(record: unknown, dataIndex: unknown): unknown {
  const path = Array.isArray(dataIndex)
    ? dataIndex.map(String)
    : typeof dataIndex === 'string' || typeof dataIndex === 'number'
      ? [String(dataIndex)]
      : [];

  let current: unknown = record;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

function getTitleText(title: unknown) {
  return typeof title === 'string' ? title : undefined;
}

function mergeHeaderEllipsisProps(
  props: React.ThHTMLAttributes<HTMLTableCellElement> | undefined,
  title: string,
): HeaderEllipsisCellProps {
  return {
    ...props,
    className: mergeClassName(props?.className, HEADER_ELLIPSIS_CLASS_NAME),
    'data-title': title,
    title: props?.title ?? title,
  };
}

function applyHeaderEllipsisToProColumn<T extends object>(
  column: ResizableColumn<T>,
  source: ProColumns<T>,
) {
  const title = getTitleText(source.title);
  if (!title) return;

  const baseOnHeaderCell = source.onHeaderCell;
  column.onHeaderCell = ((
    ...args: Parameters<NonNullable<ProColumns<T>['onHeaderCell']>>
  ) =>
    mergeHeaderEllipsisProps(
      baseOnHeaderCell?.(...args),
      title,
    )) as NonNullable<ProColumns<T>['onHeaderCell']>;
}

function applyHeaderEllipsisToAntdColumn<T extends object>(
  column: ResizableAntdColumn<T>,
  source: ResizableAntdColumn<T>,
) {
  const title = getTitleText(source.title);
  if (!title) return;

  const baseOnHeaderCell = source.onHeaderCell;
  column.onHeaderCell = ((
    ...args: Parameters<NonNullable<ResizableAntdColumn<T>['onHeaderCell']>>
  ) =>
    mergeHeaderEllipsisProps(
      baseOnHeaderCell?.(...args),
      title,
    )) as NonNullable<ResizableAntdColumn<T>['onHeaderCell']>;
}

function isLongTextColumn(column: {
  ellipsis?: unknown;
  valueEnum?: unknown;
  valueType?: unknown;
}) {
  return (
    isContentColumn(column) &&
    !column.valueEnum &&
    !isOptionColumn(column) &&
    !isDateValueType(column.valueType)
  );
}

function renderLongTextValue(
  value: unknown,
  options: LongTextColumnMeta,
): React.ReactNode {
  if (value == null || value === '') {
    return React.createElement(TableLongText, {
      value: undefined,
      displayMode: options.longTextDisplayMode,
      maxLines: options.longTextMaxLines,
      maxLength: options.longTextMaxLength,
      modalTitle: options.longTextModalTitle,
    });
  }

  if (!isTableLongTextValue(value)) {
    return React.isValidElement(value) ? value : String(value);
  }

  return React.createElement(TableLongText, {
    value,
    displayMode: options.longTextDisplayMode,
    maxLines: options.longTextMaxLines,
    maxLength: options.longTextMaxLength,
    modalTitle: options.longTextModalTitle,
  });
}

function applyLongTextToProColumn<T extends object>(
  column: ResizableColumn<T>,
  source: ProColumns<T>,
) {
  if (!isLongTextColumn(source)) return;

  const meta = source as ProColumns<T> & LongTextColumnMeta;
  const options: LongTextColumnMeta = {
    longTextDisplayMode: meta.longTextDisplayMode,
    longTextMaxLines: meta.longTextMaxLines,
    longTextMaxLength: meta.longTextMaxLength,
    longTextModalTitle: meta.longTextModalTitle ?? getTitleText(source.title),
  };
  const baseRender = source.render;
  column.ellipsis = false;
  column.className = mergeCellClassName(source.className);

  if (baseRender) {
    column.render = ((dom, record, index, action, schema) => {
      const rendered = baseRender(dom, record, index, action, schema);
      return isTableLongTextValue(rendered)
        ? renderLongTextValue(rendered, options)
        : rendered;
    }) satisfies ProColumnRender<T>;
    return;
  }

  column.render = ((_dom, record) =>
    renderLongTextValue(
      getRecordValue(record, source.dataIndex),
      options,
    )) satisfies ProColumnRender<T>;
}

function applyLongTextToAntdColumn<T extends object>(
  column: ResizableAntdColumn<T>,
  source: ResizableAntdColumn<T>,
) {
  if (!isLongTextColumn(source)) return;

  const meta = source as ResizableAntdColumn<T> & LongTextColumnMeta;
  const options: LongTextColumnMeta = {
    longTextDisplayMode: meta.longTextDisplayMode,
    longTextMaxLines: meta.longTextMaxLines,
    longTextMaxLength: meta.longTextMaxLength,
    longTextModalTitle: meta.longTextModalTitle ?? getTitleText(source.title),
  };
  const baseRender = source.render;
  column.ellipsis = false;
  column.className = mergeCellClassName(source.className);

  if (baseRender) {
    column.render = ((value, record, index) => {
      const rendered = baseRender(value, record, index);
      return isTableLongTextValue(rendered)
        ? renderLongTextValue(rendered, options)
        : rendered;
    }) satisfies AntdColumnRender<T>;
    return;
  }

  column.render = ((value) =>
    renderLongTextValue(value, options)) satisfies AntdColumnRender<T>;
}

function getColumnIdentity(
  column: { dataIndex?: unknown; key?: React.Key; title?: unknown },
  index: number,
) {
  if (column.key != null) return String(column.key);
  if (Array.isArray(column.dataIndex) && column.dataIndex.length > 0) {
    return column.dataIndex.map(String).join(',');
  }
  const dataIndex = normalizeDataIndex(column.dataIndex);
  if (dataIndex) return dataIndex;
  return `${RESIZABLE_GENERATED_COLUMN_KEY_PREFIX}-${String(
    column.title,
  )}-${index}`;
}

function getProTableDataIndexKey(dataIndex: unknown): string | undefined {
  if (Array.isArray(dataIndex) && dataIndex.length > 0) {
    return dataIndex.map(String).join(',');
  }
  if (typeof dataIndex === 'string' || typeof dataIndex === 'number') {
    return String(dataIndex);
  }
  return undefined;
}

function getSourceColumnIdentity(column: object, index: number): string {
  const originalKey = (column as Record<string, unknown>)[
    PRO_TABLE_ORIGINAL_COLUMN_KEY
  ];
  if (typeof originalKey === 'string' && originalKey) return originalKey;
  return getColumnIdentity(
    column as {
      dataIndex?: unknown;
      key?: React.Key;
      title?: unknown;
    },
    index,
  );
}

function getSortStateField(
  column: { dataIndex?: unknown; key?: React.Key; title?: unknown },
  index: number,
): string {
  return (
    normalizeDataIndex(column.dataIndex) ?? getColumnIdentity(column, index)
  );
}

/**
 * ProTable 内部的排序身份必须与 parseDefaultColumnConfig 的 dataIndex
 * 序列化结果一致。只调整 sorter: true 的列，其他列的 key 保持原样。
 */
function normalizeProTableSortColumnKeys<T extends object>(
  columns: ProColumns<T>[] | undefined,
): ProColumns<T>[] | undefined {
  if (!columns) return columns;

  const duplicateDataIndexes = new Set<string>();
  const dataIndexCounts = new Map<string, number>();
  const countDataIndexes = (items: ProColumns<T>[]) => {
    items.forEach((item) => {
      if (Array.isArray(item.children)) {
        countDataIndexes(item.children as ProColumns<T>[]);
        return;
      }
      const dataIndex = normalizeDataIndex(item.dataIndex);
      if (!dataIndex) return;
      dataIndexCounts.set(dataIndex, (dataIndexCounts.get(dataIndex) ?? 0) + 1);
    });
  };
  countDataIndexes(columns);
  dataIndexCounts.forEach((count, dataIndex) => {
    if (count > 1) duplicateDataIndexes.add(dataIndex);
  });

  return columns.map((source) => {
    const next: ProColumns<T> = { ...source };
    if (Array.isArray(source.children)) {
      next.children = normalizeProTableSortColumnKeys(
        source.children as ProColumns<T>[],
      ) as typeof next.children;
    }

    if (
      source.sorter !== true ||
      source.key == null ||
      String(source.key).startsWith(RESIZABLE_DUPLICATE_COLUMN_KEY_PREFIX)
    ) {
      return next;
    }
    const proTableKey = getProTableDataIndexKey(source.dataIndex);
    // 同一 dataIndex 可能对应多个业务展示列。此时不能为了迎合
    // ProTable 的默认 key 推导而把它们统一改成同一个 dataIndex，
    // 否则列设置树和 React 节点会再次复用同一个身份。
    if (
      !proTableKey ||
      duplicateDataIndexes.has(normalizeDataIndex(source.dataIndex) ?? '') ||
      String(source.key) === proTableKey
    ) {
      return next;
    }

    return {
      ...next,
      key: proTableKey,
      [PRO_TABLE_ORIGINAL_COLUMN_KEY]:
        typeof (source as Record<string, unknown>)[
          PRO_TABLE_ORIGINAL_COLUMN_KEY
        ] === 'string'
          ? (source as Record<string, unknown>)[PRO_TABLE_ORIGINAL_COLUMN_KEY]
          : String(source.key),
    } as ProColumns<T>;
  });
}

type ColumnStateKeyDirection = 'sourceToProTable' | 'proTableToSource';

function collectColumnStateKeyAliases(
  columns: object[] | undefined,
  direction: ColumnStateKeyDirection,
): Map<string, string> {
  const aliases = new Map<string, string>();
  const visit = (items: object[] | undefined) => {
    items?.forEach((item, index) => {
      const record = item as Record<string, unknown>;
      if (Array.isArray(record.children)) {
        visit(record.children.filter(isRecord));
        return;
      }

      const sourceKey = getSourceColumnIdentity(record, index);
      const proTableKey = getColumnIdentity(record, index);
      if (sourceKey === proTableKey) return;
      const from = direction === 'sourceToProTable' ? sourceKey : proTableKey;
      const to = direction === 'sourceToProTable' ? proTableKey : sourceKey;
      if (!aliases.has(from)) aliases.set(from, to);
    });
  };
  visit(columns);
  return aliases;
}

function remapColumnStateKeys(
  value: ProTableColumnStateMap | undefined,
  columns: object[] | undefined,
  direction: ColumnStateKeyDirection,
): ProTableColumnStateMap | undefined {
  if (!value) return value;
  const aliases = collectColumnStateKeyAliases(columns, direction);
  if (aliases.size === 0) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, state]) => [
      aliases.get(key) ?? key,
      state,
    ]),
  ) as ProTableColumnStateMap;
}

function hashText(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function withQuickDateRangePresets<T extends object>(
  columns: ProColumns<T>[] | undefined,
): ProColumns<T>[] | undefined {
  return columns?.map((column) => {
    const children = Array.isArray(column.children)
      ? withQuickDateRangePresets(column.children as ProColumns<T>[])
      : undefined;
    const childProps = children ? { children } : {};

    if (column.valueType !== 'dateRange') {
      return { ...column, ...childProps };
    }

    const fieldProps = column.fieldProps;
    if (typeof fieldProps === 'function') {
      return {
        ...column,
        ...childProps,
        fieldProps: (...args) => {
          const resolvedProps = fieldProps(...args);
          if (!isRecord(resolvedProps)) return resolvedProps;
          const presets = Array.isArray(resolvedProps.presets)
            ? (resolvedProps.presets as DateRangePickerPreset[])
            : undefined;
          return {
            ...resolvedProps,
            presets: mergeDateRangePresets(presets),
          };
        },
      };
    }

    const existingProps = isRecord(fieldProps) ? fieldProps : {};
    const presets = Array.isArray(existingProps.presets)
      ? (existingProps.presets as DateRangePickerPreset[])
      : undefined;
    return {
      ...column,
      ...childProps,
      fieldProps: {
        ...existingProps,
        presets: mergeDateRangePresets(presets),
      },
    };
  });
}

function isSearchOrTechnicalHiddenColumn<T extends object>(
  column: ProColumns<T>,
): boolean {
  const dataIndex = normalizeDataIndex(column.dataIndex) ?? '';
  const key = column.key == null ? '' : String(column.key);
  if (column.search !== false) return true;
  if (/(^id$|Id$|IdValue$|Range$)/.test(dataIndex)) return true;
  if (/(^id$|Id$|IdValue$|Range$)/.test(key)) return true;
  return false;
}

function collectVisibleColumnLabels<T extends object>(
  columns: ProColumns<T>[] | undefined,
) {
  const dataIndexes = new Set<string>();
  const titles = new Set<string>();

  const visit = (items: ProColumns<T>[] | undefined) => {
    items?.forEach((column) => {
      if (Array.isArray(column.children)) {
        visit(column.children as ProColumns<T>[]);
        return;
      }
      if (isHiddenColumn(column)) return;

      const dataIndex = normalizeDataIndex(column.dataIndex);
      if (dataIndex) dataIndexes.add(dataIndex);
      const title = getTitleText(column.title);
      if (title) titles.add(title);
    });
  };

  visit(columns);
  return { dataIndexes, titles };
}

function exposeHideInTableColumnsToColumnSetting<T extends object>(
  columns: ProColumns<T>[] | undefined,
): ProColumns<T>[] | undefined {
  if (!columns) return columns;
  let changed = false;
  const visibleColumnLabels = collectVisibleColumnLabels(columns);

  const visit = (items: ProColumns<T>[]): ProColumns<T>[] =>
    items.map((item) => {
      const hasChildren =
        Array.isArray(item.children) && item.children.length > 0;
      const nextChildren = hasChildren
        ? visit(item.children as ProColumns<T>[])
        : undefined;
      const dataIndex = normalizeDataIndex(item.dataIndex);
      const title = getTitleText(item.title);
      const shouldExposeAsDefaultHidden =
        item.hideInTable === true &&
        !isSearchOrTechnicalHiddenColumn(item) &&
        // 展示列与筛选列经常共用标题或 dataIndex；筛选副本只保留在搜索表单中，
        // 不能再作为第二个可拖拽的列设置项。
        !(
          dataIndex !== undefined &&
          visibleColumnLabels.dataIndexes.has(dataIndex)
        ) &&
        !(title !== undefined && visibleColumnLabels.titles.has(title));

      if (!shouldExposeAsDefaultHidden && nextChildren === undefined) {
        return item;
      }

      changed = true;
      const next = {
        ...item,
        ...(nextChildren ? { children: nextChildren } : {}),
      } as ProColumns<T> & Record<string, unknown>;

      if (shouldExposeAsDefaultHidden) {
        delete next.hideInTable;
        next[COLUMN_SETTING_DEFAULT_HIDDEN_FLAG] = true;
      }

      return next as ProColumns<T>;
    });

  const nextColumns = visit(columns);
  return changed ? nextColumns : columns;
}

function ensureUniqueProColumnKeys<T extends object>(
  columns: ProColumns<T>[] | undefined,
): ProColumns<T>[] | undefined {
  if (!columns) return columns;

  const duplicateDataIndexes = new Set<string>();
  const dataIndexCounts = new Map<string, number>();
  const countDataIndexes = (items: ProColumns<T>[]) => {
    items.forEach((item) => {
      if (Array.isArray(item.children)) {
        countDataIndexes(item.children as ProColumns<T>[]);
        return;
      }
      if (item.key != null) return;
      const dataIndex = normalizeDataIndex(item.dataIndex);
      if (!dataIndex) return;
      dataIndexCounts.set(dataIndex, (dataIndexCounts.get(dataIndex) ?? 0) + 1);
    });
  };
  countDataIndexes(columns);
  dataIndexCounts.forEach((count, dataIndex) => {
    if (count > 1) duplicateDataIndexes.add(dataIndex);
  });
  if (duplicateDataIndexes.size === 0) return columns;

  // ProTable 会优先使用 dataIndex 生成列 key。相同 dataIndex 的并列业务列
  // （例如寿命进度与当前累计寿命）必须补稳定 key，否则列设置 Tree 会复用节点。
  const clone = (
    items: ProColumns<T>[],
    path: number[] = [],
  ): ProColumns<T>[] =>
    items.map((item, index) => {
      const next = {
        ...item,
        ...(Array.isArray(item.children)
          ? {
              children: clone(item.children as ProColumns<T>[], [
                ...path,
                index,
              ]),
            }
          : {}),
      } as ProColumns<T>;
      const dataIndex = normalizeDataIndex(item.dataIndex);
      if (
        dataIndex &&
        duplicateDataIndexes.has(dataIndex) &&
        item.key == null
      ) {
        next.key = `${RESIZABLE_DUPLICATE_COLUMN_KEY_PREFIX}${dataIndex}-${[
          ...path,
          index,
        ].join('-')}`;
        (next as Record<string, unknown>)[PRO_TABLE_ORIGINAL_COLUMN_KEY] =
          dataIndex;
      }
      return next;
    });

  return clone(columns);
}

function collectLeafKeys(columns: object[] | undefined) {
  const keys: string[] = [];
  const visit = (items: object[] | undefined) => {
    items?.forEach((item, index) => {
      const record = item as Record<string, unknown>;
      const children = record.children;
      if (Array.isArray(children)) {
        visit(children.filter(isRecord));
        return;
      }
      keys.push(getColumnIdentity(record, index));
    });
  };
  visit(columns);
  return keys;
}

function collectLeafColumnStateDefaults(columns: object[] | undefined) {
  const entries: LeafColumnStateDefaultEntry[] = [];
  const visit = (items: object[] | undefined) => {
    items?.forEach((item, index) => {
      const record = item as Record<string, unknown>;
      const children = record.children;
      if (Array.isArray(children)) {
        visit(children.filter(isRecord));
        return;
      }
      const key = getColumnIdentity(record, index);
      const legacyKey = getSourceColumnIdentity(record, index);
      const defaultHidden =
        record.hideInTable === true ||
        record[COLUMN_SETTING_DEFAULT_HIDDEN_FLAG] === true;
      entries.push({
        key,
        ...(legacyKey !== key ? { legacyKey } : {}),
        state: {
          show: !defaultHidden,
          fixed: record.fixed as ProTableColumnStateMap[string]['fixed'],
          disable: record.disable as ProTableColumnStateMap[string]['disable'],
          order: entries.length,
        },
        informative: isInformativeColumn(record) && !defaultHidden,
        ...(isPinnedRowNumberColumn(record) ? { pinned: true } : {}),
      });
    });
  };
  visit(columns);
  return entries;
}

function migratePersistedColumnStateKeys(
  persisted: Record<string, unknown>,
  entries: LeafColumnStateDefaultEntry[],
): { value: Record<string, unknown>; changed: boolean } {
  const next = { ...persisted };
  const currentKeys = new Set(entries.map((entry) => entry.key));
  let changed = false;

  entries.forEach((entry) => {
    if (
      !entry.legacyKey ||
      entry.legacyKey === entry.key ||
      Object.hasOwn(next, entry.key) ||
      !Object.hasOwn(next, entry.legacyKey)
    ) {
      return;
    }

    next[entry.key] = next[entry.legacyKey];
    if (!currentKeys.has(entry.legacyKey)) delete next[entry.legacyKey];
    changed = true;
  });

  return { value: next, changed };
}

// 详情页路径带记录 ID（UUID / 长 hex / 纯数字），若直接进 key，每看一条详情就产生一组
// 全新的列宽/排序/列显隐缓存 key 且无淘汰，长期累积会撑爆 localStorage 配额。这里把
// 记录 ID 段归一为占位符，让“同一类页面”共用一套表格缓存 key，从根上抑制 key 无限增长。
function normalizePathnameForKey(pathname: string): string {
  return pathname
    .split('/')
    .map((segment) => {
      if (!segment) return segment;
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          segment,
        );
      const isLongHex = /^[0-9a-f]{16,}$/i.test(segment);
      const isNumericId = /^\d+$/.test(segment);
      return isUuid || isLongHex || isNumericId ? ':id' : segment;
    })
    .join('/');
}

function createPersistenceKey(columns: object[] | undefined) {
  const pathname =
    typeof window === 'undefined'
      ? 'ssr'
      : normalizePathnameForKey(window.location.pathname);
  const signature = collectLeafKeys(columns).join('|');
  return `${TABLE_WIDTH_STORAGE_PREFIX}${pathname}:${hashText(signature)}`;
}

function createSortPersistenceKey(persistenceKey: string | false | undefined) {
  if (typeof persistenceKey !== 'string') return undefined;
  if (persistenceKey.startsWith(TABLE_WIDTH_KEY_PREFIX)) {
    return persistenceKey.replace(
      TABLE_WIDTH_KEY_PREFIX,
      TABLE_SORT_KEY_PREFIX,
    );
  }
  if (persistenceKey.startsWith(TABLE_WIDTH_STORAGE_PREFIX)) {
    return persistenceKey.replace(
      TABLE_WIDTH_STORAGE_PREFIX,
      TABLE_SORT_STORAGE_PREFIX,
    );
  }
  return normalizeTableSortStorageKey(persistenceKey);
}

function readPersistedSort(
  key: string | undefined,
): PersistedSortState | undefined {
  if (!key || typeof window === 'undefined') return undefined;
  const raw = safeLocalStorageGetItem(key);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as { field?: unknown; order?: unknown };
    const order =
      parsed.order === 'ascend' || parsed.order === 'descend'
        ? parsed.order
        : parsed.order === null
          ? null
          : undefined;
    if (order === undefined) return undefined;
    return {
      field: typeof parsed.field === 'string' ? parsed.field : '',
      order,
    };
  } catch {
    return undefined;
  }
}

function migratePersistedSort(
  state: PersistedSortState,
  migration: ResizableTableSortMigration | undefined,
): PersistedSortState {
  if (
    migration &&
    state.field === migration.from.field &&
    state.order === migration.from.order
  ) {
    return migration.to;
  }
  return state;
}

function readConfiguredPersistedSort(
  key: string | undefined,
  legacyKey: string | undefined,
  migration: ResizableTableSortMigration | undefined,
): PersistedSortState | undefined {
  const persisted = readPersistedSort(key);
  if (persisted || !key || !legacyKey || key === legacyKey) return persisted;

  const legacyState = readPersistedSort(legacyKey);
  if (!legacyState) return undefined;

  const migratedState = migratePersistedSort(legacyState, migration);
  writePersistedSort(key, migratedState);
  return migratedState;
}

function writePersistedSort(
  key: string | undefined,
  state: PersistedSortState,
) {
  if (!key || typeof window === 'undefined') return;
  // 容错写入：writePersistedSort 跑在 ProTable 的 request 路径里，配额超限时若直接抛出
  // 会冒泡进数据请求导致表格被清空显示“暂无数据”，必须降级为不持久化而非中断渲染。
  safeLocalStorageSetItem(key, JSON.stringify(state));
}

function isSorterRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}

function getSorterOrder(sorter: Record<string, unknown>): TableSortOrder {
  return sorter.order === 'ascend' || sorter.order === 'descend'
    ? sorter.order
    : null;
}

function getSorterField(sorter: Record<string, unknown>) {
  return (
    normalizeSortField(sorter.field) ??
    normalizeSortField(sorter.columnKey) ??
    ''
  );
}

function resolveSortStateFromSorter(sorter: unknown): PersistedSortState {
  const sorters = Array.isArray(sorter) ? sorter : [sorter];
  const active = sorters.find(
    (item) => isSorterRecord(item) && getSorterOrder(item) !== null,
  );

  if (isSorterRecord(active)) {
    return {
      field: getSorterField(active),
      order: getSorterOrder(active),
    };
  }

  return { field: '', order: null };
}

function resolveSortStateFromSortRecord(
  sort: Record<string, unknown> | undefined,
): PersistedSortState | undefined {
  const activeSort = Object.entries(sort ?? {}).find(
    ([, value]) => value === 'ascend' || value === 'descend',
  );
  if (!activeSort) return undefined;

  const [rawField, order] = activeSort;
  const field = normalizeSortField(rawField);
  if (!field) return undefined;

  return {
    field,
    order: order as Exclude<TableSortOrder, null>,
  };
}

function areSortStatesEqual(
  left: PersistedSortState | undefined,
  right: PersistedSortState | undefined,
) {
  return left?.field === right?.field && left?.order === right?.order;
}

function getTableChangeAction(extra: unknown) {
  return isRecord(extra) && typeof extra.action === 'string'
    ? extra.action
    : undefined;
}

function createSortRecord(state: PersistedSortState | undefined) {
  if (!state?.field || !state.order) return undefined;
  return { [state.field]: state.order };
}

function isSortableColumn(column: { sorter?: unknown }) {
  return Boolean(column.sorter);
}

function hasControlledSortOrder(column: { sortOrder?: unknown }) {
  return column.sortOrder !== undefined;
}

/**
 * 一旦调用方显式控制了任一排序列，整张表的排序来源就是该受控快照。
 * 不能再把本地记忆补回其他（通常是自动接通的）列，否则切换个人视图时会同时
 * 存在两个排序字段。视图切换通过 actionRef.reset() 同步 ProTable 内部状态，
 * 不用 React key 卸载整张表，避免连续排序时清空已加载的行数据。
 */
function resolveControlledSortState<T extends object>(
  columns: ProColumns<T>[] | undefined,
): PersistedSortState | undefined {
  let hasControlledSort = false;
  let activeSort: PersistedSortState | undefined;

  const visit = (items: ProColumns<T>[] | undefined) => {
    items?.forEach((column, index) => {
      if (Array.isArray(column.children)) {
        visit(column.children as ProColumns<T>[]);
      }
      if (isSortableColumn(column) && hasControlledSortOrder(column)) {
        hasControlledSort = true;
        if (column.sortOrder === 'ascend' || column.sortOrder === 'descend') {
          activeSort = {
            field: getSortStateField(column, index),
            order: column.sortOrder,
          };
        }
      }
    });
  };

  visit(columns);
  return (
    activeSort ?? (hasControlledSort ? { field: '', order: null } : undefined)
  );
}

function applyPersistedSortToProColumns<T extends object>(
  columns: ProColumns<T>[] | undefined,
  sortState: PersistedSortState | undefined,
): ProColumns<T>[] | undefined {
  if (!columns || sortState === undefined) return columns;
  if (resolveControlledSortState(columns)) return columns;

  return columns.map((column, index) => {
    const next: ProColumns<T> = { ...column };
    if (Array.isArray(column.children)) {
      next.children = applyPersistedSortToProColumns(
        column.children as ProColumns<T>[],
        sortState,
      ) as typeof next.children;
    }

    if (!isSortableColumn(column) || hasControlledSortOrder(column)) {
      return next;
    }

    const identity = getSortStateField(column, index);
    next.sortOrder =
      sortState.order && identity === sortState.field ? sortState.order : null;
    next.defaultSortOrder =
      sortState.order && identity === sortState.field
        ? sortState.order
        : undefined;
    return next;
  });
}

function applyPersistedSortToAntdColumns<T extends object>(
  columns: TableProps<T>['columns'] | undefined,
  sortState: PersistedSortState | undefined,
): TableProps<T>['columns'] | undefined {
  if (!columns || sortState === undefined) return columns;

  return columns.map((column, index) => {
    const source = column as ResizableAntdColumn<T>;
    const next: ResizableAntdColumn<T> = { ...source };
    if (Array.isArray(source.children)) {
      next.children = applyPersistedSortToAntdColumns(
        source.children,
        sortState,
      ) as ResizableAntdColumn<T>['children'];
    }

    if (!isSortableColumn(source) || hasControlledSortOrder(source)) {
      return next;
    }

    const identity = getSortStateField(source, index);
    next.sortOrder =
      sortState.order && identity === sortState.field ? sortState.order : null;
    return next;
  });
}

function isHiddenColumn(column: { hideInTable?: boolean; hidden?: boolean }) {
  return column.hideInTable === true || column.hidden === true;
}

function hasSearchFieldIdentity(column: Record<string, unknown>) {
  return column.dataIndex !== undefined || column.key !== undefined;
}

function isSearchableColumn(column: Record<string, unknown>) {
  if (column.hideInSearch === true || column.search === false) return false;
  if (column.valueType === 'option') return false;
  return hasSearchFieldIdentity(column);
}

function countSearchableColumns(columns: object[] | undefined) {
  let count = 0;

  const visit = (items: object[] | undefined) => {
    items?.forEach((item) => {
      const record = item as Record<string, unknown>;
      const children = record.children;
      if (Array.isArray(children)) {
        visit(children.filter(isRecord));
        return;
      }

      if (isSearchableColumn(record)) {
        count += 1;
      }
    });
  };

  visit(columns);
  return count;
}

function resolveProTableSearch<T extends object, U extends ParamsType>(
  search: ProTableProps<T, U>['search'],
  columns: ProColumns<T>[] | undefined,
  hasCustomSearchHost = false,
  canRenderLightSearch = true,
): ProTableProps<T, U>['search'] {
  if (search === false) return search;
  if (isRecord(search) && search.filterType !== undefined) {
    // LightFilter is hosted by ProTable's toolbar. If the host is disabled,
    // keep an explicit light preference usable by switching to the full form.
    if (
      search.filterType === 'light' &&
      !canRenderLightSearch &&
      !hasCustomSearchHost
    ) {
      return { ...search, filterType: 'query' };
    }
    return search;
  }
  // 搜索表单由外部宿主（如单据筛选抽屉的 searchFormRender）托管时，宿主期望完整
  // 查询表单；此时不再套用可搜索列数的 light 简洁模式降级。
  // LightFilter is rendered inside ProTable's own toolbar. A host such as
  // CrudListWorkbench sets toolBarRender=false and expects QueryFilter to remain
  // visible; auto-selecting LightFilter there also prevents the search form's
  // initialization from starting the first request.
  if (hasCustomSearchHost || !canRenderLightSearch) return search;

  const searchableCount = countSearchableColumns(columns);
  if (searchableCount === 0 || searchableCount > LIGHT_SEARCH_FIELD_LIMIT) {
    return search;
  }

  if (search === undefined) {
    return { filterType: 'light' } as ProTableProps<T, U>['search'];
  }

  if (isRecord(search)) {
    return {
      ...search,
      filterType: 'light',
    } as ProTableProps<T, U>['search'];
  }

  return search;
}

/**
 * ProComponents 的 LightSelect 与普通 SearchSelect 默认值不同：前者默认不会在
 * 输入关键词时重新执行列 request。所有经过公共表格的轻量远程筛选在这里统一
 * 开启远程搜索，同时保留业务页面显式设置的 fetchDataOnSearch。
 */
function enableLightFilterRemoteSearch<T extends object>(
  columns: ProColumns<T>[] | undefined,
  search: ProTableProps<T, ParamsType>['search'],
): ProColumns<T>[] | undefined {
  if (!columns || !isRecord(search) || search.filterType !== 'light') {
    return columns;
  }

  return columns.map((source) => {
    const column = source.children?.length
      ? {
          ...source,
          children: enableLightFilterRemoteSearch(
            source.children as ProColumns<T>[],
            search,
          ),
        }
      : source;

    if (typeof column.request !== 'function') return column;
    if (typeof column.fieldProps === 'function') return column;

    const fieldProps = isRecord(column.fieldProps) ? column.fieldProps : {};
    if (fieldProps.fetchDataOnSearch !== undefined) return column;

    return {
      ...column,
      fieldProps: {
        ...fieldProps,
        fetchDataOnSearch: true,
      },
    } as ProColumns<T>;
  });
}

function hasWidth(column: { width?: unknown }) {
  return column.width !== undefined && column.width !== null;
}

function getNumericWidth(width: unknown) {
  if (typeof width === 'number') return width;
  if (typeof width === 'string' && /^\d+(\.\d+)?$/.test(width)) {
    return Number(width);
  }
  return undefined;
}

function isContentColumn(column: { ellipsis?: unknown }) {
  return column.ellipsis === true || isRecord(column.ellipsis);
}

function getFallbackWidth(
  column: { width?: unknown; defaultWidth?: number; ellipsis?: unknown },
  defaultWidth: number,
) {
  return (
    column.defaultWidth ??
    getNumericWidth(column.width) ??
    (isContentColumn(column)
      ? Math.max(defaultWidth, CONTENT_COLUMN_DEFAULT_WIDTH)
      : defaultWidth)
  );
}

function isOptionColumn(column: { valueType?: unknown }) {
  return column.valueType === 'option';
}

function isRenderedActionColumn<T extends object>(column: ProColumns<T>) {
  if (typeof column.render !== 'function') return false;
  if (isOptionColumn(column)) return true;
  if (column.title !== '操作') return false;

  // “操作”也可能是审计动作等业务数据列；只有没有业务字段归属的列才按行操作处理。
  const dataIndex = normalizeDataIndex(column.dataIndex);
  return (
    dataIndex === undefined ||
    ['__actions', 'actions', 'option'].includes(dataIndex)
  );
}

function toColumnActionNodes(rendered: React.ReactNode): React.ReactNode[] {
  // 手写的完整三点菜单已经是最终形态，再套一层会得到两层菜单。
  if (React.isValidElement(rendered) && rendered.type === TableActions) {
    return [rendered];
  }

  return toActionNodes(rendered);
}

/** 兼容尚未迁移到 createActionColumn 的旧操作列，使三点菜单规范全局生效。 */
function applyCompactActionColumns<T extends object>(
  columns: ProColumns<T>[] | undefined,
  isHostActionColumn?: (column: object) => boolean,
): ProColumns<T>[] | undefined {
  if (!isCompactTableActionMode || !columns) return columns;

  return columns.map((source) => {
    if (source.children?.length) {
      return {
        ...source,
        children: applyCompactActionColumns(
          source.children as ProColumns<T>[],
          isHostActionColumn,
        ),
      };
    }

    if (
      !isRenderedActionColumn(source) ||
      hasCompleteActionMenuColumn(source) ||
      isHostActionColumn?.(source)
    ) {
      return source;
    }

    const originalRender = source.render as ProColumnRender<T>;
    const compactRender: ProColumnRender<T> = (...args) => {
      const rendered = originalRender(...args);
      const renderedNode = rendered as React.ReactNode;
      // Option columns can already render the complete shared menu. Preserve
      // that component instead of nesting a second "more actions" dropdown.
      if (
        React.isValidElement(renderedNode) &&
        renderedNode.type === TableActions
      ) {
        return renderedNode;
      }
      const actionNodes = toColumnActionNodes(renderedNode);
      // 没有任何可点节点时不套菜单：整列都是状态/占位文案时保持原样展示，
      // 否则这些文案会被塞进 48px 的操作列。
      return actionNodes.some(isInteractiveActionNode) ? (
        <TableActions actions={actionNodes} />
      ) : (
        renderedNode
      );
    };

    return {
      ...source,
      width: COMPACT_TABLE_ACTION_COLUMN_WIDTH,
      minConstraints: COMPACT_TABLE_ACTION_COLUMN_WIDTH,
      maxConstraints: COMPACT_TABLE_ACTION_COLUMN_WIDTH,
      resizable: false,
      title: '',
      align: 'center',
      render: compactRender,
    };
  });
}

function isSpacerColumn(column: { dataIndex?: unknown; key?: React.Key }) {
  return (
    column.dataIndex === TABLE_SPACER_COLUMN_KEY ||
    column.key === TABLE_SPACER_COLUMN_KEY
  );
}

const ROW_NUMBER_TITLES = new Set(['序号', '行号', '行次', '#']);

/**
 * 注入型展示序号列：由表格组件自动生成、在列设置里不可见（hideInSetting），
 * 用户点齿轮也调不动它的位置，只能由表格结构钉在首位。
 */
function isPinnedRowNumberColumn(column: {
  dataIndex?: unknown;
  key?: React.Key;
  title?: unknown;
  valueType?: unknown;
  hideInSetting?: boolean;
}) {
  if (column.hideInSetting !== true) return false;
  if (column.key === ROW_INDEX_COLUMN_KEY) return true;
  const title = typeof column.title === 'string' ? column.title.trim() : '';
  if (!ROW_NUMBER_TITLES.has(title)) return false;
  const dataIndex = normalizeDataIndex(column.dataIndex);
  return (
    dataIndex === undefined ||
    dataIndex === 'index' ||
    dataIndex === 'rowIndex' ||
    column.valueType === 'index' ||
    column.valueType === 'indexBorder'
  );
}

function hasExistingRowNumberColumn<T extends object>(
  columns: ProColumns<T>[] | undefined,
): boolean {
  return Boolean(
    columns?.some((column) => {
      if (column.key === ROW_INDEX_COLUMN_KEY) return true;
      const dataIndex = Array.isArray(column.dataIndex)
        ? column.dataIndex.map(String).join('.')
        : column.dataIndex == null
          ? undefined
          : String(column.dataIndex);
      // 只有无业务归属的行号列才阻止注入；工序 sequence、单据 lineNo 等
      // 真实业务字段仍需保留独立的列表展示序号。
      if (
        typeof column.title === 'string' &&
        ROW_NUMBER_TITLES.has(column.title.trim()) &&
        (dataIndex === undefined ||
          dataIndex === 'index' ||
          column.key === 'index' ||
          column.valueType === 'index' ||
          column.valueType === 'indexBorder')
      )
        return true;
      return Array.isArray(column.children)
        ? hasExistingRowNumberColumn(column.children as ProColumns<T>[])
        : false;
    }),
  );
}

type TableSummaryElementProps = {
  children?: React.ReactNode;
  fullWidth?: boolean;
  index?: number;
};

/** 序号插入在表格首列后，汇总行同步补一个空单元格，避免合计错位。 */
function shiftSummaryForRowIndex(node: React.ReactNode): React.ReactNode {
  if (!React.isValidElement<TableSummaryElementProps>(node)) return node;

  const element = node;
  if (element.type === Table.Summary.Row) {
    const children = React.Children.toArray(element.props.children).map(
      (child) => shiftSummaryForRowIndex(child),
    );
    return React.cloneElement(element, {
      children: [
        <Table.Summary.Cell key={ROW_INDEX_COLUMN_KEY} index={0} />,
        ...children,
      ],
    });
  }

  if (element.type === TableSummary) {
    // Full-width summaries are resolved by the adapter after effective column
    // visibility is known; it will add the serial and fixed-column cells there.
    if (element.props.fullWidth) return element;
    const children = React.Children.toArray(element.props.children).map(
      (child) => shiftSummaryForRowIndex(child),
    );
    return React.cloneElement(element, {
      children: [
        <Table.Summary.Cell key={ROW_INDEX_COLUMN_KEY} index={0} />,
        ...children,
      ],
    });
  }

  if (element.type === Table.Summary.Cell) {
    return React.cloneElement(element, {
      index:
        typeof element.props.index === 'number'
          ? element.props.index + 1
          : element.props.index,
    });
  }

  if (element.props.children === undefined) return element;
  return React.cloneElement(element, {
    children: React.Children.map(
      element.props.children,
      shiftSummaryForRowIndex,
    ),
  });
}

function resolveInitialRowIndexPageInfo(
  pagination: TablePaginationConfig | false | undefined,
): RowIndexPageInfo {
  if (!pagination) {
    return { current: 1, pageSize: DEFAULT_PAGE_SIZE };
  }

  const current =
    typeof pagination.current === 'number'
      ? pagination.current
      : (pagination.defaultCurrent ?? 1);
  const pageSize =
    typeof pagination.pageSize === 'number'
      ? pagination.pageSize
      : (pagination.defaultPageSize ?? DEFAULT_PAGE_SIZE);
  return {
    current: current > 0 ? current : 1,
    pageSize: pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE,
  };
}

function isInformativeColumn(column: {
  dataIndex?: unknown;
  fixed?: unknown;
  key?: React.Key;
  title?: unknown;
  valueType?: unknown;
}) {
  if (
    isSpacerColumn(column) ||
    isOptionColumn(column) ||
    column.key === ROW_INDEX_COLUMN_KEY
  ) {
    return false;
  }
  if (isTemporalColumn(column)) return false;
  return true;
}

function isDateValueType(valueType: unknown) {
  return (
    valueType === 'date' ||
    valueType === 'dateTime' ||
    valueType === 'dateRange'
  );
}

function isTemporalColumn(column: {
  dataIndex?: unknown;
  title?: unknown;
  valueType?: unknown;
}) {
  const dataIndex = normalizeDataIndex(column.dataIndex);
  const title = typeof column.title === 'string' ? column.title : '';

  return (
    isDateValueType(column.valueType) ||
    (dataIndex ? /(At|Date|Time)$/i.test(dataIndex) : false) ||
    /时间|日期|期限/.test(title)
  );
}

function canUseAsFlexColumn(column: {
  dataIndex?: unknown;
  fixed?: unknown;
  key?: React.Key;
  valueType?: unknown;
}) {
  return (
    !isSpacerColumn(column) &&
    column.fixed === undefined &&
    !isOptionColumn(column)
  );
}

function canUseAsDefaultFlexColumn(column: {
  dataIndex?: unknown;
  ellipsis?: unknown;
  fixed?: unknown;
  key?: React.Key;
  valueType?: unknown;
}) {
  return canUseAsFlexColumn(column) && !isContentColumn(column);
}

function canUseAsContentFlexColumn(column: {
  dataIndex?: unknown;
  ellipsis?: unknown;
  fixed?: unknown;
  key?: React.Key;
  valueType?: unknown;
}) {
  return canUseAsFlexColumn(column) && isContentColumn(column);
}

function canUseAsPrimaryFlexColumn(column: {
  dataIndex?: unknown;
  ellipsis?: unknown;
  fixed?: unknown;
  key?: React.Key;
  title?: unknown;
  valueType?: unknown;
}) {
  return canUseAsDefaultFlexColumn(column) && !isTemporalColumn(column);
}

function pickFlexProColumn<T extends object>(leaves: ResizableColumn<T>[]) {
  const candidates = [...leaves].reverse();
  return (
    // Keep adaptive width on the internal spacer so every visible business
    // column can render a resize handle, including columns without an
    // explicit width in the page definition.
    leaves.find(isSpacerColumn) ??
    leaves.find(
      (item) => item.resizable === false && canUseAsFlexColumn(item),
    ) ??
    leaves.find((item) => !hasWidth(item) && canUseAsContentFlexColumn(item)) ??
    candidates.find(
      (item) => !hasWidth(item) && canUseAsPrimaryFlexColumn(item),
    ) ??
    candidates.find(
      (item) => !hasWidth(item) && canUseAsDefaultFlexColumn(item),
    ) ??
    candidates.find((item) => !hasWidth(item) && canUseAsFlexColumn(item)) ??
    leaves.find(isSpacerColumn) ??
    leaves[leaves.length - 1]
  );
}

function pickFlexAntdColumn<T extends object>(
  leaves: ResizableAntdColumn<T>[],
) {
  const candidates = [...leaves].reverse();
  return (
    // Keep adaptive width on the internal spacer so every visible business
    // column can render a resize handle, including columns without an
    // explicit width in the page definition.
    leaves.find(isSpacerColumn) ??
    leaves.find(
      (item) => item.resizable === false && canUseAsFlexColumn(item),
    ) ??
    leaves.find((item) => !hasWidth(item) && canUseAsContentFlexColumn(item)) ??
    candidates.find(
      (item) => !hasWidth(item) && canUseAsPrimaryFlexColumn(item),
    ) ??
    candidates.find(
      (item) => !hasWidth(item) && canUseAsDefaultFlexColumn(item),
    ) ??
    candidates.find((item) => !hasWidth(item) && canUseAsFlexColumn(item)) ??
    leaves.find(isSpacerColumn) ??
    leaves[leaves.length - 1]
  );
}

function normalizeResizableProColumns<T extends object>(
  columns: ProColumns<T>[] | undefined,
  defaultWidth: number,
) {
  if (!columns) return undefined;

  const leaves: ResizableColumn<T>[] = [];
  const columnsWithUniqueKeys = ensureUniqueProColumnKeys(columns);
  const clone = (items: ProColumns<T>[]): ResizableColumn<T>[] =>
    items.map((item) => {
      const column: ResizableColumn<T> = {
        ...item,
        ellipsis: item.ellipsis ?? false,
      };
      applyHeaderEllipsisToProColumn(column, item);
      applyLongTextToProColumn(column, item);
      if (item.children?.length) {
        column.children = clone(item.children as ProColumns<T>[]);
      } else if (!isHiddenColumn(column)) {
        leaves.push(column);
      }
      return column;
    });

  const nextColumns = clone(columnsWithUniqueKeys ?? columns);
  if (leaves.length > 0) {
    const spacerColumn = {
      title: '',
      key: TABLE_SPACER_COLUMN_KEY,
      dataIndex: TABLE_SPACER_COLUMN_KEY,
      search: false,
      hideInSetting: true,
      hideInTable: true,
      resizable: false,
      [RESIZABLE_ADAPTIVE_COLUMN_FLAG]: true,
      render: () => null,
    } satisfies ResizableColumn<T>;
    const flexColumn = pickFlexProColumn([...leaves, spacerColumn]);
    const firstTrailingFixedRightIndex = nextColumns.findIndex(
      (column) => column.fixed === 'right',
    );
    if (firstTrailingFixedRightIndex >= 0) {
      nextColumns.splice(firstTrailingFixedRightIndex, 0, spacerColumn);
    } else {
      nextColumns.push(spacerColumn);
    }
    leaves.push(spacerColumn);
    for (const leaf of leaves) {
      if (leaf === flexColumn) {
        if (hasWidth(leaf)) {
          (leaf as ResizableColumn<T> & PersistedFlexWidthAwareColumn)[
            PRESERVE_PERSISTED_FLEX_WIDTH
          ] = true;
        }
        leaf.defaultWidth = getFallbackWidth(leaf, defaultWidth);
        leaf.resizable = false;
        delete leaf.width;
      } else if (!hasWidth(leaf)) {
        leaf.width = getFallbackWidth(leaf, defaultWidth);
      }
    }
  }
  return nextColumns;
}

function normalizeResizableAntdColumns<T extends object>(
  columns: TableProps<T>['columns'],
  defaultWidth: number,
) {
  if (!columns) return undefined;

  const leaves: ResizableAntdColumn<T>[] = [];
  const clone = (items: NonNullable<TableProps<T>['columns']>) =>
    items.map((item) => {
      const column: ResizableAntdColumn<T> = {
        ...item,
      } as ResizableAntdColumn<T>;
      applyHeaderEllipsisToAntdColumn(column, item as ResizableAntdColumn<T>);
      applyLongTextToAntdColumn(column, item as ResizableAntdColumn<T>);
      const children = 'children' in item ? item.children : undefined;
      if (children?.length) {
        column.children = clone(children);
      } else if (!isHiddenColumn(column)) {
        leaves.push(column);
      }
      return column;
    });

  const nextColumns = clone(columns);
  if (leaves.length > 0) {
    const spacerColumn = {
      title: '',
      key: TABLE_SPACER_COLUMN_KEY,
      dataIndex: TABLE_SPACER_COLUMN_KEY,
      hidden: true,
      resizable: false,
      [RESIZABLE_ADAPTIVE_COLUMN_FLAG]: true,
      render: () => null,
    } as ResizableAntdColumn<T>;
    const flexColumn = pickFlexAntdColumn([...leaves, spacerColumn]);
    const firstTrailingFixedRightIndex = nextColumns.findIndex(
      (column) => column.fixed === 'right',
    );
    if (firstTrailingFixedRightIndex >= 0) {
      nextColumns.splice(firstTrailingFixedRightIndex, 0, spacerColumn);
    } else {
      nextColumns.push(spacerColumn);
    }
    leaves.push(spacerColumn);
    for (const leaf of leaves) {
      if (leaf === flexColumn) {
        if (hasWidth(leaf)) {
          (leaf as ResizableAntdColumn<T> & PersistedFlexWidthAwareColumn)[
            PRESERVE_PERSISTED_FLEX_WIDTH
          ] = true;
        }
        leaf.defaultWidth = getFallbackWidth(leaf, defaultWidth);
        leaf.resizable = false;
        delete leaf.width;
      } else if (!hasWidth(leaf)) {
        leaf.width = getFallbackWidth(leaf, defaultWidth);
      }
    }
  }
  return nextColumns;
}

export function resolveScrollX(
  current: ScrollX,
  tableWidth: number | undefined,
) {
  if (!tableWidth) return current;
  // 拖拽后 tableWidth 就是当前列宽总和；继续用初始 scroll.x 兜底会把
  // 用户刚拉窄的宽度补回自适应列，表现成“越拉窄越变宽”。
  if (typeof current === 'number') return tableWidth;
  if (current === undefined || current === true || current === 'max-content') {
    return tableWidth;
  }
  return current;
}

function resolveScrollY(current: ScrollY, fitScrollY: number | undefined) {
  return fitScrollY ?? current;
}

function resolveFitContainerHeightConfig(
  fitContainerHeight: FitContainerHeight | undefined,
): ResolvedFitContainerHeightConfig {
  if (fitContainerHeight === false) {
    return {
      ...DEFAULT_FIT_CONTAINER_HEIGHT_CONFIG,
      enabled: false,
    };
  }
  if (fitContainerHeight === undefined) {
    return {
      ...DEFAULT_FIT_CONTAINER_HEIGHT_CONFIG,
      enabled: false,
    };
  }
  if (fitContainerHeight === true) {
    return DEFAULT_FIT_CONTAINER_HEIGHT_CONFIG;
  }
  return {
    ...DEFAULT_FIT_CONTAINER_HEIGHT_CONFIG,
    ...fitContainerHeight,
    enabled: fitContainerHeight.enabled ?? true,
  };
}

function getOuterHeight(element: HTMLElement | null) {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return (
    rect.height +
    Number.parseFloat(style.marginTop || '0') +
    Number.parseFloat(style.marginBottom || '0')
  );
}

function getFixedSummaryHeight(root: HTMLElement) {
  const summaryElements = Array.from(
    root.querySelectorAll<HTMLElement>('.ant-table-summary'),
  );
  const fixedSummary =
    summaryElements.find(
      (element) =>
        element.tagName !== 'TFOOT' && !element.closest('.ant-table-body'),
    ) ?? summaryElements.find((element) => !element.closest('.ant-table-body'));

  return getOuterHeight(fixedSummary ?? null);
}

function getTableFooterHeight(root: HTMLElement) {
  return getOuterHeight(root.querySelector<HTMLElement>('.ant-table-footer'));
}

function getFitBoundaryBottom(root: HTMLElement) {
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const boundary = root.closest(FIT_BOUNDARY_SELECTOR) as HTMLElement | null;
  if (!boundary) return viewportHeight;

  return Math.min(boundary.getBoundingClientRect().bottom, viewportHeight);
}

function getFitVisibilityObserverTargets(root: HTMLElement) {
  const targets: HTMLElement[] = [];
  let current: HTMLElement | null = root.parentElement;

  while (current && current !== document.body) {
    targets.push(current);
    current = current.parentElement;
  }

  if (document.body) targets.push(document.body);
  return targets;
}

function useFitContainerScrollY(
  fitContainerHeight: FitContainerHeight | undefined,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState<number | undefined>(undefined);
  const config = useMemo(
    () => resolveFitContainerHeightConfig(fitContainerHeight),
    [fitContainerHeight],
  );

  const updateScrollY = useCallback(() => {
    const root = rootRef.current;
    if (!config.enabled || !root || typeof window === 'undefined') {
      setScrollY(undefined);
      return;
    }

    const tableHeader = root.querySelector<HTMLElement>('.ant-table-thead');
    const tableContainer = root.querySelector<HTMLElement>(
      '.ant-table-container',
    );
    const pagination = root.querySelector<HTMLElement>('.ant-table-pagination');
    const fixedSummaryHeight = getFixedSummaryHeight(root);
    const tableFooterHeight = getTableFooterHeight(root);
    const boundaryBottom = getFitBoundaryBottom(root);
    const bodyTop =
      tableHeader?.getBoundingClientRect().bottom ??
      tableContainer?.getBoundingClientRect().top ??
      root.getBoundingClientRect().top;
    const availableHeight =
      boundaryBottom -
      config.bottomOffset -
      getOuterHeight(pagination) -
      fixedSummaryHeight -
      tableFooterHeight -
      bodyTop;
    const boundedHeight = Math.min(config.maxBodyHeight, availableHeight);
    const nextScrollY = Math.floor(
      Math.max(config.minBodyHeight, Math.max(80, boundedHeight)),
    );

    setScrollY((current) =>
      current !== undefined && Math.abs(current - nextScrollY) < 2
        ? current
        : nextScrollY,
    );
  }, [
    config.bottomOffset,
    config.enabled,
    config.maxBodyHeight,
    config.minBodyHeight,
  ]);

  useEffect(() => {
    const root = rootRef.current;
    if (!config.enabled || !root || typeof window === 'undefined') {
      setScrollY(undefined);
      return undefined;
    }

    let frame = 0;
    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateScrollY);
    };
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(scheduleUpdate);
    const mutationObserver = new MutationObserver(scheduleUpdate);
    scheduleUpdate();
    resizeObserver?.observe(root);
    if (root.parentElement) resizeObserver?.observe(root.parentElement);
    const boundary = root.closest(FIT_BOUNDARY_SELECTOR);
    if (boundary) resizeObserver?.observe(boundary);
    mutationObserver.observe(root, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    for (const target of getFitVisibilityObserverTargets(root)) {
      mutationObserver.observe(target, {
        attributeFilter: ['class', 'hidden', 'style'],
        attributes: true,
      });
    }
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('orientationchange', scheduleUpdate);
    window.visualViewport?.addEventListener('resize', scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('orientationchange', scheduleUpdate);
      window.visualViewport?.removeEventListener('resize', scheduleUpdate);
    };
  }, [config.enabled, updateScrollY]);

  return {
    enabled: config.enabled,
    rootRef,
    scrollY,
    shouldWrap: config.enabled,
  };
}

function resolveResizableConfig(
  resizable: boolean | ResizableTableConfig | undefined,
) {
  if (resizable === false) {
    return { ...DEFAULT_CONFIG, enabled: false };
  }
  if (resizable === true || resizable === undefined) {
    return DEFAULT_CONFIG;
  }
  return {
    ...DEFAULT_CONFIG,
    ...resizable,
    enabled: resizable.enabled ?? true,
  };
}

function createColumnsState(
  persistenceKey: string | false | undefined,
  persistenceType: PersistenceType,
  defaultValue?: ProTableColumnStateMap,
) {
  if (!persistenceKey) return undefined;
  return { persistenceKey, persistenceType, defaultValue };
}

function readPersistedColumnsState(
  persistenceKey: string,
  persistenceType: PersistenceType,
): Record<string, unknown> | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = window[persistenceType]?.getItem(persistenceKey);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function removePersistedColumnsState(
  persistenceKey: string,
  persistenceType: PersistenceType,
) {
  if (typeof window === 'undefined') return;
  window[persistenceType]?.removeItem(persistenceKey);
}

function getResizableStorageColumnIdentity(column: {
  dataIndex?: unknown;
  key?: React.Key;
}): string | undefined {
  if (Array.isArray(column.dataIndex) && column.dataIndex.length > 0) {
    return column.dataIndex.map(String).join('-');
  }
  if (
    typeof column.dataIndex === 'string' ||
    typeof column.dataIndex === 'number'
  ) {
    return String(column.dataIndex);
  }
  return column.key == null ? undefined : String(column.key);
}

function collectAdaptiveResizableStorageKeys(
  columns: object[] | undefined,
): Set<string> {
  const keys = new Set<string>();
  const visit = (items: object[] | undefined) => {
    items?.forEach((item) => {
      const record = item as Record<string, unknown> &
        PersistedFlexWidthAwareColumn;
      const children = record.children;
      if (Array.isArray(children)) {
        visit(children.filter(isRecord));
        return;
      }
      if (
        isHiddenColumn(record) ||
        hasWidth(record) ||
        record[PRESERVE_PERSISTED_FLEX_WIDTH] === true
      ) {
        return;
      }
      const key = getResizableStorageColumnIdentity(record);
      if (key) keys.add(key);
    });
  };
  visit(columns);
  return keys;
}

function collectLockedResizableStorageWidths(
  columns: object[] | undefined,
): Map<string, number> {
  const widths = new Map<string, number>();
  const visit = (items: object[] | undefined) => {
    items?.forEach((item) => {
      const record = item as Record<string, unknown>;
      const children = record.children;
      if (Array.isArray(children)) {
        visit(children.filter(isRecord));
        return;
      }
      const width = getNumericWidth(record.width);
      const key = getResizableStorageColumnIdentity(record);
      if (record.resizable === false && width !== undefined && key) {
        widths.set(key, width);
      }
    });
  };
  visit(columns);
  return widths;
}

function sanitizePersistedColumnWidths(
  value: unknown,
  adaptiveKeys: Set<string>,
  lockedWidths: Map<string, number>,
): { changed: boolean; value: unknown } {
  if (!isRecord(value)) return { changed: false, value };

  let changed = false;
  let next: Record<string, unknown> = value;
  const key = getResizableStorageColumnIdentity(value);
  if (key && adaptiveKeys.has(key) && Object.hasOwn(value, 'width')) {
    const { width: _width, ...rest } = value;
    next = rest;
    changed = true;
  } else if (key && lockedWidths.has(key)) {
    const lockedWidth = lockedWidths.get(key);
    if (value.width !== lockedWidth) {
      next = { ...value, width: lockedWidth };
      changed = true;
    }
  }

  if (Array.isArray(next.children)) {
    const sanitizedChildren = next.children.map((child) => {
      const result = sanitizePersistedColumnWidths(
        child,
        adaptiveKeys,
        lockedWidths,
      );
      if (result.changed) changed = true;
      return result.value;
    });
    if (changed) {
      next = {
        ...next,
        children: sanitizedChildren,
      };
    }
  }

  return { changed, value: next };
}

function sanitizePersistedResizableWidths(
  persistenceKey: string | false | undefined,
  persistenceType: PersistenceType,
  columns: object[] | undefined,
) {
  if (typeof persistenceKey !== 'string' || typeof window === 'undefined') {
    return;
  }
  const adaptiveKeys = collectAdaptiveResizableStorageKeys(columns);
  const lockedWidths = collectLockedResizableStorageWidths(columns);
  if (adaptiveKeys.size === 0 && lockedWidths.size === 0) return;

  const storage = window[persistenceType];
  const raw = storage?.getItem(persistenceKey);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.resizableColumns)) return;

    let changed = false;
    const resizableColumns = parsed.resizableColumns.map((column) => {
      const result = sanitizePersistedColumnWidths(
        column,
        adaptiveKeys,
        lockedWidths,
      );
      if (result.changed) changed = true;
      return result.value;
    });
    if (!changed) return;

    storage?.setItem(
      persistenceKey,
      JSON.stringify({
        ...parsed,
        resizableColumns,
      }),
    );
  } catch {
    // 表格列宽缓存是可重建 UI 状态，迁移失败时跳过，不影响列表渲染。
  }
}

function getPersistedOrder(value: unknown): number | undefined {
  if (!isRecord(value) || typeof value.order !== 'number') return undefined;
  return Number.isFinite(value.order) ? value.order : undefined;
}

/**
 * 把注入型序号列钉回首位，并同步修正已持久化的旧列序。
 *
 * 这类列在列设置里不可见，用户无法通过齿轮把它拖回左边；而历史版本按物料列优先级
 * 重排时曾把它排到中间，并把该位置写进了持久化列状态。这里统一覆盖默认列序和旧缓存，
 * 否则用户即使升级前端也仍然看到行号夹在中间。
 */
function pinRowNumberColumnOrders(
  defaultValue: ProTableColumnStateMap,
  persisted: Record<string, unknown>,
  entries: LeafColumnStateDefaultEntry[],
): boolean {
  const pinnedKeys = entries
    .filter((entry) => entry.pinned)
    .map((entry) => entry.key);
  if (pinnedKeys.length === 0) return false;

  const orders = [...Object.values(defaultValue), ...Object.values(persisted)]
    .map(getPersistedOrder)
    .filter((order): order is number => order !== undefined);
  const firstOrder = orders.length > 0 ? Math.min(...orders) : 0;

  let persistedChanged = false;
  pinnedKeys.forEach((key, index) => {
    // 取严格小于其它列的最小 order，保证钉位列始终排在最前且彼此保持原相对顺序。
    const order = firstOrder - pinnedKeys.length + index;
    const defaultState = defaultValue[key];
    if (defaultState && defaultState.order !== order) {
      defaultValue[key] = { ...defaultState, order };
    }
    const persistedState = persisted[key];
    if (isRecord(persistedState) && persistedState.order !== order) {
      persisted[key] = { ...persistedState, order };
      persistedChanged = true;
    }
  });
  return persistedChanged;
}

function createColumnsStateDefaultValue(
  persistenceKey: string | false | undefined,
  persistenceType: PersistenceType,
  columns: object[] | undefined,
): ProTableColumnStateMap | undefined {
  const entries = collectLeafColumnStateDefaults(columns);
  if (entries.length === 0) return undefined;

  const defaultValue = Object.fromEntries(
    entries.map(({ key, state }) => [key, state]),
  ) as ProTableColumnStateMap;
  if (typeof persistenceKey !== 'string') return defaultValue;

  const persistedRaw = readPersistedColumnsState(
    persistenceKey,
    persistenceType,
  );
  if (!persistedRaw) return defaultValue;
  const migrated = migratePersistedColumnStateKeys(persistedRaw, entries);
  const persisted = migrated.value;
  if (migrated.changed) {
    safeLocalStorageSetItem(persistenceKey, JSON.stringify(persisted));
  }

  if (shouldDiscardLowInformationColumnsState(persisted, entries)) {
    removePersistedColumnsState(persistenceKey, persistenceType);
    return defaultValue;
  }

  const persistedOrders = Object.values(persisted)
    .map(getPersistedOrder)
    .filter((order): order is number => order !== undefined);
  if (persistedOrders.length === 0) return defaultValue;

  const maxPersistedOrder = Math.max(...persistedOrders);
  let appendedIndex = 0;
  for (const { key, state } of entries) {
    if (Object.hasOwn(persisted, key)) continue;
    // ProTable 对没有 order 的新增列会按 0 参与排序，导致发版新增列跑到用户
    // 已保存布局最前面。这里把新增列稳定追加到已保存顺序之后，避免扰动旧布局。
    defaultValue[key] = {
      ...state,
      order: maxPersistedOrder + 1 + appendedIndex,
    };
    appendedIndex += 1;
  }
  if (pinRowNumberColumnOrders(defaultValue, persisted, entries)) {
    safeLocalStorageSetItem(persistenceKey, JSON.stringify(persisted));
  }
  return defaultValue;
}

function isPersistedColumnVisible(
  persisted: Record<string, unknown>,
  entry: LeafColumnStateDefaultEntry,
) {
  const state = persisted[entry.key];
  if (!isRecord(state) || state.show === undefined) {
    return entry.state.show !== false;
  }
  return state.show !== false;
}

function shouldDiscardLowInformationColumnsState(
  persisted: Record<string, unknown>,
  entries: LeafColumnStateDefaultEntry[],
) {
  const informativeEntries = entries.filter((entry) => entry.informative);
  if (informativeEntries.length === 0) return false;

  const visibleInformativeCount = informativeEntries.filter((entry) =>
    isPersistedColumnVisible(persisted, entry),
  ).length;

  return visibleInformativeCount < MIN_VISIBLE_INFORMATIVE_COLUMN_COUNT;
}

function mergeColumnStateDefaultValue(
  base: ProTableColumnStateMap | undefined,
  override: ProTableColumnStateMap | undefined,
): ProTableColumnStateMap | undefined {
  if (!base) return override;
  if (!override) return base;

  const merged = { ...base };
  Object.entries(override).forEach(([key, value]) => {
    merged[key] = {
      ...base[key],
      ...value,
    };
  });
  return merged;
}

function areColumnStateMapsEqual(
  left: ProTableColumnStateMap | undefined,
  right: ProTableColumnStateMap | undefined,
): boolean {
  if (left === right) return true;
  if (!left || !right) return false;

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;

  return leftKeys.every((key) => {
    if (!Object.hasOwn(right, key)) return false;
    const leftState = left[key];
    const rightState = right[key];
    if (leftState === rightState) return true;
    if (!leftState || !rightState) return false;

    const leftStateKeys = Object.keys(leftState);
    const rightStateKeys = Object.keys(rightState);
    return (
      leftStateKeys.length === rightStateKeys.length &&
      leftStateKeys.every(
        (stateKey) =>
          Object.hasOwn(rightState, stateKey) &&
          Object.is(
            leftState[stateKey as keyof typeof leftState],
            rightState[stateKey as keyof typeof rightState],
          ),
      )
    );
  });
}

function mergeColumnsState<T extends object, U extends ParamsType>(
  base: ProTableColumnsState<T, U>,
  override: ProTableColumnsState<T, U>,
): ProTableColumnsState<T, U> {
  if (!base) return override;
  if (!override) return base;

  return {
    ...base,
    ...override,
    persistenceKey: override.persistenceKey ?? base.persistenceKey,
    persistenceType: override.persistenceType ?? base.persistenceType,
    defaultValue: mergeColumnStateDefaultValue(
      base.defaultValue,
      override.defaultValue,
    ),
  };
}

function resolveActiveColumnsState(
  persistenceKey: string | undefined,
  persistenceType: PersistenceType | undefined,
  defaultValue: ProTableColumnStateMap | undefined,
): ProTableColumnStateMap | undefined {
  if (!persistenceKey || !persistenceType) return defaultValue;
  const persisted = readPersistedColumnsState(persistenceKey, persistenceType);
  return mergeColumnStateDefaultValue(
    defaultValue,
    persisted as ProTableColumnStateMap | undefined,
  );
}

function applyColumnStateVisibilityToHookColumns(
  columns: Record<string, unknown>[] | undefined,
  columnsState: ProTableColumnStateMap | undefined,
): Record<string, unknown>[] | undefined {
  if (!columns || !columnsState) return columns;

  const visit = (
    items: Record<string, unknown>[],
  ): Record<string, unknown>[] => {
    let changed = false;
    const nextItems = items.map((column, index) => {
      const children = column.children;
      if (Array.isArray(children)) {
        const childRecords = children.filter(isRecord);
        const nextChildren = visit(childRecords);
        if (nextChildren === childRecords) return column;
        changed = true;
        return {
          ...column,
          children: nextChildren,
        };
      }

      const key = getColumnIdentity(column, index);
      // `hideInTable` already hides this result column. Adding `hidden` also
      // hides its QueryFilter field, so keep these search columns untouched.
      if (
        columnsState[key]?.show !== false ||
        column.hidden === true ||
        column.hideInTable === true
      ) {
        return column;
      }

      changed = true;
      return {
        ...column,
        hidden: true,
      };
    });

    return changed ? nextItems : items;
  };

  return visit(columns);
}

function hasVisibleFlexHookColumn(
  columns: Record<string, unknown>[] | undefined,
) {
  let found = false;
  const visit = (items: Record<string, unknown>[] | undefined) => {
    if (found) return;
    items?.forEach((column) => {
      if (found) return;
      const children = column.children;
      if (Array.isArray(children)) {
        visit(children.filter(isRecord));
        return;
      }
      if (!isHiddenColumn(column) && !hasWidth(column)) {
        found = true;
      }
    });
  };
  visit(columns);
  return found;
}

function createSpacerHookColumn() {
  return {
    title: '',
    key: TABLE_SPACER_COLUMN_KEY,
    dataIndex: TABLE_SPACER_COLUMN_KEY,
    search: false,
    hideInSetting: true,
    resizable: false,
    render: () => null,
  } satisfies Record<string, unknown>;
}

function ensureVisibleFlexHookColumn(
  columns: Record<string, unknown>[] | undefined,
) {
  if (!columns || hasVisibleFlexHookColumn(columns)) return columns;
  if (columns.some(isSpacerColumn)) return columns;

  const spacerColumn = createSpacerHookColumn();
  const firstTrailingFixedRightIndex = columns.findIndex(
    (column) => column.fixed === 'right',
  );
  if (firstTrailingFixedRightIndex < 0) {
    return [...columns, spacerColumn];
  }
  return [
    ...columns.slice(0, firstTrailingFixedRightIndex),
    spacerColumn,
    ...columns.slice(firstTrailingFixedRightIndex),
  ];
}

function dedupeLeafDataIndex(
  items: Record<string, unknown>[],
  seen: Set<string>,
): Record<string, unknown>[] {
  return items.map((column) => {
    const children = column.children;
    if (Array.isArray(children)) {
      return {
        ...column,
        children: dedupeLeafDataIndex(children.filter(isRecord), seen),
      };
    }
    const dataIndex = column.dataIndex;
    if (typeof dataIndex === 'string' && dataIndex.length > 0) {
      if (seen.has(dataIndex)) {
        // 同一表格内重复的字符串 dataIndex（搜索列 + 展示列、或一源多列）会触发
        // use-antd-resizable-header 的 “dataIndex 重复” 告警，并使整表列宽拖拽/列设置/
        // 宽度持久化失效。该库的重复校验以 dataIndex 字面量为 Map key，数组引用不判重；
        // 单元素数组路径在 antd 取值与搜索表单字段命名上与字符串完全等价，
        // 因此对“后出现的重复列”转为数组路径消重，首列保持不变、零行为变化。
        return { ...column, dataIndex: [dataIndex] };
      }
      seen.add(dataIndex);
    }
    return column;
  });
}

function toHookColumns<T extends object>(columns: T[] | undefined) {
  if (!columns) return columns;
  return dedupeLeafDataIndex(
    columns.map((column) => column as Record<string, unknown>),
    new Set<string>(),
  );
}

function useResizableColumns(
  columns: Record<string, unknown>[] | undefined,
  config: ResolvedResizableTableConfig,
  columnsStateDefaultValue?: ProTableColumnStateMap,
) {
  return useAntdResizableHeader<Record<string, unknown>>({
    columns,
    defaultWidth: config.defaultWidth,
    minConstraints: config.minConstraints,
    maxConstraints: config.maxConstraints,
    debounceWaitTime: config.debounceWaitTime,
    columnsState: createColumnsState(
      config.persistenceKey,
      config.persistenceType,
      columnsStateDefaultValue,
    ),
  } satisfies OptionsType<Record<string, unknown>>);
}

function useResetWidthsOnColumnSettingReset(
  resetColumns: (resetStorage?: boolean) => void,
  resetOwner: symbol,
) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const handleClick = (event: MouseEvent) => {
      if (
        activeColumnSettingResetOwner !== resetOwner ||
        !isElement(event.target) ||
        !event.target.closest(`.${COLUMN_SETTING_RESET_BUTTON_CLASS}`)
      ) {
        return;
      }

      resetColumns(true);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [resetColumns, resetOwner]);
}

function useColumnSettingResetOptions<
  T extends object,
  U extends ParamsType = ParamsType,
>(
  options: ProTableProps<T, U>['options'],
  resetOwner: symbol,
): ProTableProps<T, U>['options'] {
  return useMemo(() => {
    if (options === false) return options;

    const setting = options?.setting;
    if (setting === false) return options;

    const settingConfig =
      typeof setting === 'object' && setting !== null ? setting : undefined;
    const wrapTrigger = (node: React.ReactNode) => (
      <ColumnSettingResetTrigger owner={resetOwner}>
        {node}
      </ColumnSettingResetTrigger>
    );
    const {
      children: settingChildren,
      settingIcon,
      ...restSettingConfig
    } = settingConfig ?? {};
    const triggerNode = settingChildren ?? (
      <Tooltip title="列设置">{settingIcon ?? <SettingOutlined />}</Tooltip>
    );
    const nextSetting = {
      ...restSettingConfig,
      children: wrapTrigger(triggerNode),
    };

    return {
      ...options,
      setting: nextSetting,
    };
  }, [options, resetOwner]);
}

function useGlobalDensityToolbar<
  T extends object,
  U extends ParamsType = ParamsType,
>(
  options: ProTableProps<T, U>['options'],
  optionsRender: ProTableProps<T, U>['optionsRender'],
): {
  options: ProTableProps<T, U>['options'];
  optionsRender: ProTableProps<T, U>['optionsRender'];
} {
  const showDensity = options !== false && options?.density !== false;
  const mergedOptions = useMemo<ProTableProps<T, U>['options']>(() => {
    if (!showDensity) return options;
    return { ...options, density: false };
  }, [options, showDensity]);
  const mergedOptionsRender = useCallback<
    NonNullable<ProTableProps<T, U>['optionsRender']>
  >(
    (toolbarProps, defaultDom) => {
      if (!showDensity) {
        return optionsRender?.(toolbarProps, defaultDom) ?? defaultDom;
      }

      const nextDom = [...defaultDom];
      const settingIndex = nextDom.findIndex(
        (node) => React.isValidElement(node) && node.key === 'setting',
      );
      nextDom.splice(
        settingIndex >= 0 ? settingIndex : nextDom.length,
        0,
        <TableDensityOption key="density" />,
      );
      return optionsRender?.(toolbarProps, nextDom) ?? nextDom;
    },
    [optionsRender, showDensity],
  );

  return {
    options: mergedOptions,
    optionsRender: mergedOptionsRender,
  };
}

function ResizableProTableInner<
  T extends object,
  U extends ParamsType = ParamsType,
>(props: ResizableProTableProps<T, U>) {
  const {
    columns,
    components,
    onChange,
    request,
    scroll,
    search,
    resizable,
    fitContainerHeight,
    onRow,
    expandable,
    locale,
    emptyGuidance,
    dataSource,
    options,
    optionsRender,
    pagination,
    columnsState,
    summary,
    paginationSummary,
    params,
    showRowIndex,
    exportLayoutEnabled,
    materialColumnPriority,
    ...rest
  } = props;
  const amountVisibilityRevision = useAmountVisibilityRevision();
  const shouldShowRowIndex =
    showRowIndex ??
    ((request !== undefined || dataSource !== undefined) &&
      pagination !== false);
  const normalizedParams = useMemo(
    () => normalizeExternalQueryParams(params),
    [params],
  );
  const columnsWithAmountVisibilityRevision = useMemo(
    () => withAmountVisibilityRevision(columns, amountVisibilityRevision),
    [amountVisibilityRevision, columns],
  );
  const columnsWithMaterialPriority = useMemo(
    () =>
      prioritizeMaterialDetailColumns(
        columnsWithAmountVisibilityRevision as ProColumns<T>[] | undefined,
        materialColumnPriority,
      ),
    [columnsWithAmountVisibilityRevision, materialColumnPriority],
  );
  const columnsWithAuditDates = useMemo(
    () =>
      withQuickDateRangePresets(
        withAuditDateColumns(columnsWithMaterialPriority as ProColumns<T>[]),
      ),
    [columnsWithMaterialPriority],
  );
  const rowIndexPageInfoRef = useRef<RowIndexPageInfo>(
    resolveInitialRowIndexPageInfo(pagination),
  );
  const columnsWithRowIndex = useMemo(() => {
    if (
      !shouldShowRowIndex ||
      hasExistingRowNumberColumn(columnsWithAuditDates)
    ) {
      return columnsWithAuditDates;
    }
    return [
      createRowIndexColumn<T>(() => rowIndexPageInfoRef.current),
      ...(columnsWithAuditDates ?? []),
    ] as Array<LocalSortableColumn<T> & ResizableColumnOptions>;
  }, [columnsWithAuditDates, shouldShowRowIndex]);
  const mergedSummary = useMemo<ProTableProps<T, U>['summary']>(() => {
    if (!shouldShowRowIndex || summary === undefined) return summary;
    return (pageData: readonly T[]) =>
      shiftSummaryForRowIndex(summary(pageData));
  }, [shouldShowRowIndex, summary]);
  const mergedPagination = useMemo(
    () => withPaginationSummary(pagination, paginationSummary),
    [pagination, paginationSummary],
  );
  const tableDensityKey = useTableDensityKey();
  const tableSize = getAntdTableSize(tableDensityKey);
  const exportRouteKeyRef = useRef(getTableExportRouteKey());
  const [exportLayout, setExportLayout] = useState<TableExportLayout>();
  const globalDensityToolbar = useGlobalDensityToolbar<T, U>(
    options,
    optionsRender,
  );
  const { isTableActionColumn, resolveRowEditAction } =
    useTableCapabilities();
  const config = resolveResizableConfig(resizable);
  useEffect(() => {
    if (config.enabled) ensureTableCacheCapacity();
  }, [config.enabled]);
  const columnsWithGlobalActionMode = useMemo(
    () => applyCompactActionColumns(columnsWithRowIndex, isTableActionColumn),
    [columnsWithRowIndex, isTableActionColumn],
  );
  const columnsExposedToColumnSetting = useMemo(() => {
    const columnsForSetting = config.enabled
      ? exposeHideInTableColumnsToColumnSetting(
          columnsWithGlobalActionMode as ProColumns<T>[] | undefined,
        )
      : (columnsWithGlobalActionMode as ProColumns<T>[] | undefined);
    return ensureUniqueProColumnKeys(columnsForSetting);
  }, [columnsWithGlobalActionMode, config.enabled]);
  const mergedLocale = useMemo(
    () => ({
      ...locale,
      emptyText: locale?.emptyText ?? <TableEmpty guidance={emptyGuidance} />,
    }),
    [locale, emptyGuidance],
  );
  const mergedSearch = useMemo(
    () =>
      resolveProTableSearch<T, U>(
        search,
        columnsExposedToColumnSetting,
        props.searchFormRender !== undefined,
        props.toolBarRender !== false,
      ),
    [
      columnsExposedToColumnSetting,
      search,
      props.searchFormRender,
      props.toolBarRender,
    ],
  );
  const columnsWithLightRemoteSearch = useMemo(
    () =>
      enableLightFilterRemoteSearch(
        columnsExposedToColumnSetting,
        mergedSearch as ProTableProps<T, ParamsType>['search'],
      ),
    [columnsExposedToColumnSetting, mergedSearch],
  );
  const tablePersistenceKey = useMemo(
    () => {
      const key =
        config.persistenceKey === undefined
          ? createPersistenceKey(
              columnsWithGlobalActionMode as object[] | undefined,
            )
          : config.persistenceKey;
      return typeof key === 'string' ? normalizeTableWidthStorageKey(key) : key;
    },
    [columnsWithGlobalActionMode, config.persistenceKey],
  );
  const renderConfig = useMemo(
    () =>
      config.persistenceKey === undefined
        ? { ...config, persistenceKey: tablePersistenceKey }
        : config,
    [config, tablePersistenceKey],
  );
  const sortPersistenceKey = useMemo(
    () =>
      config.sortPersistenceKey === undefined
        ? createSortPersistenceKey(tablePersistenceKey)
        : typeof config.sortPersistenceKey === 'string'
          ? normalizeTableSortStorageKey(config.sortPersistenceKey)
          : undefined,
    [config.sortPersistenceKey, tablePersistenceKey],
  );
  const legacySortPersistenceKey = useMemo(
    () => createSortPersistenceKey(tablePersistenceKey),
    [tablePersistenceKey],
  );
  const [sortState, setSortState] = useState<PersistedSortState | undefined>(
    () =>
      readConfiguredPersistedSort(
        sortPersistenceKey,
        legacySortPersistenceKey,
        config.sortMigration,
      ),
  );
  const sortStateRef = useRef<PersistedSortState | undefined>(sortState);
  useEffect(() => {
    const persistedSort = readConfiguredPersistedSort(
      sortPersistenceKey,
      legacySortPersistenceKey,
      config.sortMigration,
    );
    sortStateRef.current = persistedSort;
    setSortState(persistedSort);
  }, [config.sortMigration, legacySortPersistenceKey, sortPersistenceKey]);
  const persistSortState = useCallback(
    (nextSortState: PersistedSortState) => {
      sortStateRef.current = nextSortState;
      setSortState((current) =>
        areSortStatesEqual(current, nextSortState) ? current : nextSortState,
      );
      writePersistedSort(sortPersistenceKey, nextSortState);
    },
    [sortPersistenceKey],
  );
  // 本地 dataSource 的表（详情页内嵌表）自动获得列头排序；走 request 的表
  // 由服务端排序（sorter: true），注入本地比较器只会排到当前页，必须跳过。
  const columnsWithLocalSorters = useMemo(
    () =>
      request
        ? withServerSorters<T>(
            columnsWithLightRemoteSearch,
            config.serverSortFields,
          )
        : withLocalSorters<T>(columnsWithLightRemoteSearch),
    [columnsWithLightRemoteSearch, config.serverSortFields, request],
  );
  const columnsWithProTableSortIdentity = useMemo(
    () => normalizeProTableSortColumnKeys(columnsWithLocalSorters),
    [columnsWithLocalSorters],
  );
  const columnsWithPersistedSort = useMemo(
    () =>
      applyPersistedSortToProColumns(
        columnsWithProTableSortIdentity,
        sortState,
      ),
    [columnsWithProTableSortIdentity, sortState],
  );
  const summaryWithoutColumnSettings = useMemo(
    () =>
      withResolvedTableSummary(
        mergedSummary,
        columnsWithPersistedSort as unknown as Record<string, unknown>[],
      ),
    [columnsWithPersistedSort, mergedSummary],
  );
  const controlledSortState = useMemo(
    () => resolveControlledSortState(columnsWithProTableSortIdentity),
    [columnsWithProTableSortIdentity],
  );
  const normalizedColumnsState = useMemo(() => {
    if (!columnsState) return undefined;
    const normalizedValue = remapColumnStateKeys(
      columnsState.value as ProTableColumnStateMap | undefined,
      columnsWithProTableSortIdentity as object[] | undefined,
      'sourceToProTable',
    );
    const normalizedDefaultValue = remapColumnStateKeys(
      columnsState.defaultValue as ProTableColumnStateMap | undefined,
      columnsWithProTableSortIdentity as object[] | undefined,
      'sourceToProTable',
    );
    return {
      ...columnsState,
      ...(normalizedValue ? { value: normalizedValue } : {}),
      ...(normalizedDefaultValue
        ? { defaultValue: normalizedDefaultValue }
        : {}),
      onChange: columnsState.onChange
        ? (value: ProTableColumnStateMap) => {
            const sourceValue = remapColumnStateKeys(
              value,
              columnsWithProTableSortIdentity as object[] | undefined,
              'proTableToSource',
            );
            const controlledSourceValue = columnsState.value as
              | ProTableColumnStateMap
              | undefined;
            if (
              controlledSourceValue !== undefined &&
              areColumnStateMapsEqual(
                controlledSourceValue,
                sourceValue ?? {},
              )
            ) {
              return;
            }
            columnsState.onChange?.(sourceValue ?? {});
          }
        : undefined,
    };
  }, [columnsState, columnsWithProTableSortIdentity]);
  const mergedRequest = useMemo<ProTableProps<T, U>['request']>(() => {
    if (!request) return request;
    return async (params, sort, filter) => {
      // 列设置只使用调用方显式声明的 columns；request 返回的 DTO 原始字段
      if (shouldShowRowIndex) {
        rowIndexPageInfoRef.current = resolveInitialRowIndexPageInfo({
          current: params.current,
          pageSize: params.pageSize,
        });
      }
      // 可能包含审计字段、关联 ID 和内部计算值，不能自动变成用户列。
      const activeSortState =
        controlledSortState ?? resolveSortStateFromSortRecord(sort);
      if (activeSortState) {
        if (!controlledSortState) persistSortState(activeSortState);
        return request(params, createSortRecord(activeSortState) ?? {}, filter);
      }

      return request(
        params,
        createSortRecord(sortStateRef.current) ?? {},
        filter,
      );
    };
  }, [controlledSortState, persistSortState, request]);
  const mergedOnChange = useMemo<ProTableProps<T, U>['onChange']>(() => {
    return (pagination, filters, sorter, extra) => {
      if (
        shouldShowRowIndex &&
        pagination &&
        typeof pagination.current === 'number' &&
        typeof pagination.pageSize === 'number'
      ) {
        rowIndexPageInfoRef.current = {
          current: pagination.current,
          pageSize: pagination.pageSize,
        };
      }
      if (getTableChangeAction(extra) === 'sort') {
        persistSortState(resolveSortStateFromSorter(sorter));
      }
      onChange?.(pagination, filters, sorter, extra);
    };
  }, [onChange, persistSortState]);
  const mergedOnRow = useEditableRowDoubleClick<T, U>(
    columnsWithPersistedSort,
    onRow,
    resolveRowEditAction,
  );
  const syncExportLayout = useCallback(
    (columnsState: TableColumnState | undefined) => {
      if (!request && !exportLayoutEnabled) {
        setExportLayout(undefined);
        return;
      }
      const exportSort =
        sortState?.order === 'ascend' || sortState?.order === 'descend'
          ? { field: sortState.field, order: sortState.order }
          : undefined;
      const nextLayout = updateActiveTableExportLayout(
        exportRouteKeyRef.current,
        columnsWithLightRemoteSearch,
        remapColumnStateKeys(
          columnsState,
          columnsWithProTableSortIdentity as object[] | undefined,
          'proTableToSource',
        ),
        exportSort,
      );
      setExportLayout(nextLayout);
    },
    [
      columnsWithLightRemoteSearch,
      columnsWithProTableSortIdentity,
      exportLayoutEnabled,
      request,
      sortState,
    ],
  );
  useEffect(() => {
    // 启用列配置时，由 ResizableProTableEnabled 按实际的显隐/顺序状态同步。
    // 这里再用 undefined 写入“全部列”会覆盖已持久化的布局，导致页面和导出不一致。
    if (!config.enabled) syncExportLayout(undefined);
  }, [config.enabled, syncExportLayout]);
  const mergedExpandable = useMemo(
    () => withExpandedRowClassName<T>(expandable as TableExpandable<T>),
    [expandable],
  );
  const {
    enabled: fitEnabled,
    rootRef,
    scrollY,
    shouldWrap: fitShouldWrap,
  } = useFitContainerScrollY(fitContainerHeight);
  const fitClassNames = fitEnabled
    ? addFitTableClassNames<T, U>(rest.classNames)
    : rest.classNames;
  const fitLoading = fitEnabled
    ? addFitLoadingClassNames<T, U>(rest.loading)
    : rest.loading;
  const mergedScroll = useMemo(() => {
    const y = resolveScrollY(scroll?.y, scrollY);
    if (y === undefined) return scroll;
    return {
      ...scroll,
      y,
    };
  }, [scroll, scrollY]);

  const table = !config.enabled ? (
    <ProTable<T, U>
      columns={columnsWithPersistedSort}
      components={components}
      scroll={mergedScroll}
      search={mergedSearch}
      locale={mergedLocale}
      {...rest}
      classNames={fitClassNames}
      loading={fitLoading}
      params={normalizedParams}
      pagination={mergedPagination}
      summary={summaryWithoutColumnSettings}
      dataSource={dataSource}
      columnsState={normalizedColumnsState}
      request={mergedRequest}
      onChange={mergedOnChange}
      onRow={mergedOnRow}
      expandable={mergedExpandable as ProTableProps<T, U>['expandable']}
      options={globalDensityToolbar.options}
      optionsRender={globalDensityToolbar.optionsRender}
      size={tableSize}
    />
  ) : (
    <ResizableProTableEnabled<T, U>
      // 排序状态单独叠到最终列上，不要让 sortOrder 改变列宽 hook 的输入引用。
      // 否则已保存排序在刷新恢复时会触发列宽 hook 重读/写入竞态并覆盖用户列宽。
      columns={columnsWithProTableSortIdentity}
      persistedSortState={sortState}
      onExportLayoutChange={syncExportLayout}
      components={components}
      scroll={mergedScroll}
      config={renderConfig}
      search={mergedSearch}
      locale={mergedLocale}
      {...rest}
      classNames={fitClassNames}
      loading={fitLoading}
      params={normalizedParams}
      pagination={mergedPagination}
      summary={mergedSummary}
      dataSource={dataSource}
      columnsState={normalizedColumnsState}
      request={mergedRequest}
      onChange={mergedOnChange}
      onRow={mergedOnRow}
      expandable={mergedExpandable as ProTableProps<T, U>['expandable']}
      options={globalDensityToolbar.options}
      optionsRender={globalDensityToolbar.optionsRender}
      size={tableSize}
    />
  );

  const tableWithFitContainer = fitShouldWrap ? (
    <div
      ref={rootRef}
      className={
        fitEnabled
          ? [
              FIT_CONTAINER_CLASS_NAME,
              mergedScroll?.x !== undefined
                ? FIT_CONTAINER_HORIZONTAL_SCROLL_CLASS_NAME
                : undefined,
            ]
              .filter(Boolean)
              .join(' ')
          : undefined
      }
      style={fitEnabled ? FIT_CONTAINER_STYLE : undefined}
    >
      {table}
    </div>
  ) : (
    table
  );

  return (
    <TableDensityProvider density={tableDensityKey}>
      <TableExportLayoutBoundary
        layout={exportLayout}
        className="sxw-resizable-table"
      >
        {tableWithFitContainer}
      </TableExportLayoutBoundary>
    </TableDensityProvider>
  );
}

function ResizableProTableEnabled<
  T extends object,
  U extends ParamsType = ParamsType,
>({
  columns,
  columnsState: propColumnsState,
  components,
  options,
  scroll,
  config,
  persistedSortState,
  onExportLayoutChange,
  summary,
  ...rest
}: ProTableProps<T, U> & {
  config: ResolvedResizableTableConfig;
  persistedSortState?: PersistedSortState;
  onExportLayoutChange?: (state: TableColumnState | undefined) => void;
}) {
  const normalizedColumns = useMemo(
    () => normalizeResizableProColumns(columns, config.defaultWidth),
    [columns, config.defaultWidth],
  );
  const persistenceKey =
    config.persistenceKey === undefined
      ? createPersistenceKey(normalizedColumns)
      : typeof config.persistenceKey === 'string'
        ? normalizeTableWidthStorageKey(config.persistenceKey)
        : config.persistenceKey;
  const hookColumns = useMemo(
    () => toHookColumns(normalizedColumns),
    [normalizedColumns],
  );
  const columnsStatePersistenceKey = useMemo(() => {
    if (typeof persistenceKey !== 'string') return undefined;
    return persistenceKey.startsWith(TABLE_WIDTH_KEY_PREFIX)
      ? persistenceKey.replace(
          TABLE_WIDTH_KEY_PREFIX,
          TABLE_COLUMN_KEY_PREFIX,
        )
      : `${TABLE_COLUMN_KEY_PREFIX}${persistenceKey}`;
  }, [persistenceKey]);
  const columnsStateDefaultValue = useMemo(
    () =>
      createColumnsStateDefaultValue(
        columnsStatePersistenceKey,
        config.persistenceType,
        normalizedColumns,
      ),
    [columnsStatePersistenceKey, config.persistenceType, normalizedColumns],
  );
  // 调用方提供 value 时，列显隐和顺序已有唯一权威来源（例如个人视图）。
  // 此时不能再把本地列状态作为 Ant Pro 的 defaultValue/persistence 合并进去；
  // 否则切换视图时，ProTable 会把设备缓存的状态回调给调用方并被误判成用户修改。
  // 可伸缩列宽仍由 useAntdResizableHeader 按 persistenceKey 独立保存。
  const hasControlledColumnsState = propColumnsState?.value !== undefined;
  const baseColumnsState = useMemo<ProTableProps<T, U>['columnsState']>(() => {
    if (!columnsStatePersistenceKey || hasControlledColumnsState) {
      return undefined;
    }
    return {
      persistenceKey: columnsStatePersistenceKey,
      persistenceType: config.persistenceType,
      defaultValue: columnsStateDefaultValue,
    };
  }, [
    columnsStatePersistenceKey,
    config.persistenceType,
    columnsStateDefaultValue,
    hasControlledColumnsState,
  ]);
  const baseMergedColumnsState = useMemo(
    () => mergeColumnsState<T, U>(baseColumnsState, propColumnsState),
    [baseColumnsState, propColumnsState],
  );
  const activeColumnsStatePersistenceKey =
    baseMergedColumnsState?.persistenceKey;
  const activeColumnsStatePersistenceType =
    baseMergedColumnsState?.persistenceType;
  const activeColumnsStateValue = baseMergedColumnsState?.value as
    | ProTableColumnStateMap
    | undefined;
  const activeColumnsStateDefaultValue = baseMergedColumnsState?.defaultValue;
  const [activeColumnsState, setActiveColumnsState] = useState<
    ProTableColumnStateMap | undefined
  >(
    () =>
      activeColumnsStateValue ??
      resolveActiveColumnsState(
        activeColumnsStatePersistenceKey,
        activeColumnsStatePersistenceType,
        activeColumnsStateDefaultValue,
      ),
  );
  const activeColumnsStateRef = useRef(activeColumnsState);
  activeColumnsStateRef.current = activeColumnsState;
  useEffect(() => {
    const nextColumnsState =
      activeColumnsStateValue ??
      resolveActiveColumnsState(
        activeColumnsStatePersistenceKey,
        activeColumnsStatePersistenceType,
        activeColumnsStateDefaultValue,
      );
    setActiveColumnsState((current) =>
      areColumnStateMapsEqual(current, nextColumnsState)
        ? current
        : nextColumnsState,
    );
  }, [
    activeColumnsStatePersistenceKey,
    activeColumnsStatePersistenceType,
    activeColumnsStateValue,
    activeColumnsStateDefaultValue,
  ]);
  useEffect(() => {
    onExportLayoutChange?.(activeColumnsState);
  }, [activeColumnsState, onExportLayoutChange]);
  const visibilityAwareHookColumns = useMemo(
    () =>
      ensureVisibleFlexHookColumn(
        applyColumnStateVisibilityToHookColumns(
          hookColumns,
          activeColumnsState,
        ),
      ),
    [hookColumns, activeColumnsState],
  );
  const migratedHookColumns = useMemo(() => {
    sanitizePersistedResizableWidths(
      persistenceKey,
      config.persistenceType,
      visibilityAwareHookColumns,
    );
    return visibilityAwareHookColumns;
  }, [persistenceKey, config.persistenceType, visibilityAwareHookColumns]);

  const {
    components: resizableComponents,
    resizableColumns,
    resetColumns,
    tableWidth,
  } = useResizableColumns(
    migratedHookColumns,
    config.persistenceKey === undefined
      ? { ...config, persistenceKey }
      : config,
    columnsStateDefaultValue,
  );
  const columnsWithPersistedSort = useMemo(
    () =>
      applyPersistedSortToProColumns(
        resizableColumns as ProColumns<T>[] | undefined,
        persistedSortState,
      ),
    [resizableColumns, persistedSortState],
  );
  const resolvedSummary = useMemo(
    () =>
      withResolvedTableSummary(
        summary,
        columnsWithPersistedSort as unknown as Record<string, unknown>[],
      ),
    [columnsWithPersistedSort, summary],
  );
  const resetOwner = useMemo(() => Symbol('column-setting-reset'), []);
  const mergedOptions = useColumnSettingResetOptions<T, U>(options, resetOwner);
  useResetWidthsOnColumnSettingReset(resetColumns, resetOwner);

  // pro3 的 ProTable 以 columnsState.value 的引用身份为依赖同步受控值
  // （Table.js 中 useEffect([columnsState?.value])）。调用方（页面/壳层）通常在
  // render 中现场构造 value 对象，引用每帧都变；配合 onChange 回写（页面 setState
  // → 新对象 → 再同步）会形成无限更新循环。这里按内容指纹稳定 value 引用：
  // 内容不变时沿用旧引用，内容变化才换新引用。
  const controlledColumnsStateValue = baseMergedColumnsState?.value as
    | ProTableColumnStateMap
    | undefined;
  const controlledColumnsStateValueFingerprint = useMemo(
    () => JSON.stringify(controlledColumnsStateValue ?? null),
    [controlledColumnsStateValue],
  );
  const stableControlledColumnsStateValue = useMemo(
    () => controlledColumnsStateValue,
    [controlledColumnsStateValueFingerprint],
  );

  const mergedColumnsState = useMemo<
    ProTableProps<T, U>['columnsState']
  >(() => {
    if (!baseMergedColumnsState) return undefined;
    return {
      ...baseMergedColumnsState,
      ...(stableControlledColumnsStateValue !== undefined
        ? { value: stableControlledColumnsStateValue }
        : {}),
      onChange: (value) => {
        const nextColumnsState = value as ProTableColumnStateMap;
        if (areColumnStateMapsEqual(activeColumnsStateRef.current, nextColumnsState)) {
          return;
        }
        activeColumnsStateRef.current = nextColumnsState;
        queueMicrotask(() => {
          setActiveColumnsState((current) =>
            areColumnStateMapsEqual(current, nextColumnsState)
              ? current
              : nextColumnsState,
          );
          baseMergedColumnsState.onChange?.(value);
        });
      },
    };
  }, [baseMergedColumnsState, stableControlledColumnsStateValue]);

  return (
    <ProTable<T, U>
      columns={columnsWithPersistedSort as ProColumns<T>[]}
      components={{
        ...components,
        header: {
          ...components?.header,
          ...resizableComponents.header,
        },
      }}
      scroll={{
        ...scroll,
        x: resolveScrollX(scroll?.x, tableWidth),
      }}
      options={mergedOptions}
      {...rest}
      summary={resolvedSummary}
      columnsState={mergedColumnsState}
    />
  );
}

function ResizableTableInner<T extends object>({
  columns,
  components,
  onChange,
  scroll,
  resizable,
  expandable,
  locale,
  emptyGuidance,
  pagination,
  summary,
  paginationSummary,
  dataSource,
  showRowIndex,
  materialColumnPriority,
  ...rest
}: ResizableTableProps<T>) {
  const tableDensityKey = useTableDensityKey();
  const tableSize = getAntdTableSize(tableDensityKey);
  const { isTableActionColumn } = useTableCapabilities();
  const amountVisibilityRevision = useAmountVisibilityRevision();
  const config = resolveResizableConfig(resizable);
  const shouldShowRowIndex =
    showRowIndex ?? (pagination !== undefined && pagination !== false);
  const rowIndexPageInfoRef = useRef<RowIndexPageInfo>(
    resolveInitialRowIndexPageInfo(pagination),
  );
  useEffect(() => {
    if (config.enabled) ensureTableCacheCapacity();
  }, [config.enabled]);
  const columnsWithAmountVisibilityRevision = useMemo(
    () => withAmountVisibilityRevision(columns, amountVisibilityRevision),
    [amountVisibilityRevision, columns],
  );
  const columnsWithMaterialPriority = useMemo(
    () =>
      prioritizeMaterialDetailColumns(
        columnsWithAmountVisibilityRevision,
        materialColumnPriority,
      ),
    [columnsWithAmountVisibilityRevision, materialColumnPriority],
  );
  const columnsWithRowIndex = useMemo(() => {
    if (
      !shouldShowRowIndex ||
      hasExistingRowNumberColumn(
        columnsWithMaterialPriority as ProColumns<T>[] | undefined,
      )
    ) {
      return columnsWithMaterialPriority;
    }
    return [
      createRowIndexColumn<T>(() => rowIndexPageInfoRef.current),
      ...(columnsWithMaterialPriority ?? []),
    ] as ResizableAntdColumn<T>[];
  }, [columnsWithMaterialPriority, shouldShowRowIndex]);
  const columnsWithGlobalActionMode = useMemo(
    () =>
      applyCompactActionColumns(
        columnsWithRowIndex as ProColumns<T>[] | undefined,
        isTableActionColumn,
      ) as TableProps<T>['columns'],
    [columnsWithRowIndex, isTableActionColumn],
  );
  const mergedSummary = useMemo<TableProps<T>['summary']>(() => {
    if (!shouldShowRowIndex || summary === undefined) return summary;
    return (pageData: readonly T[]) =>
      shiftSummaryForRowIndex(summary(pageData));
  }, [shouldShowRowIndex, summary]);
  const mergedPagination = useMemo(
    () => withPaginationSummary(pagination, paginationSummary),
    [pagination, paginationSummary],
  );
  const mergedLocale = useMemo(
    () => ({
      ...locale,
      emptyText: locale?.emptyText ?? <TableEmpty guidance={emptyGuidance} />,
    }),
    [locale, emptyGuidance],
  );
  const tablePersistenceKey = useMemo(
    () => {
      const key =
        config.persistenceKey === undefined
          ? createPersistenceKey(
              columnsWithGlobalActionMode as object[] | undefined,
            )
          : config.persistenceKey;
      return typeof key === 'string' ? normalizeTableWidthStorageKey(key) : key;
    },
    [columnsWithGlobalActionMode, config.persistenceKey],
  );
  const sortPersistenceKey = useMemo(
    () =>
      config.sortPersistenceKey === undefined
        ? createSortPersistenceKey(tablePersistenceKey)
        : typeof config.sortPersistenceKey === 'string'
          ? normalizeTableSortStorageKey(config.sortPersistenceKey)
          : undefined,
    [config.sortPersistenceKey, tablePersistenceKey],
  );
  const legacySortPersistenceKey = useMemo(
    () => createSortPersistenceKey(tablePersistenceKey),
    [tablePersistenceKey],
  );
  const [sortState, setSortState] = useState<PersistedSortState | undefined>(
    () =>
      readConfiguredPersistedSort(
        sortPersistenceKey,
        legacySortPersistenceKey,
        config.sortMigration,
      ),
  );
  useEffect(() => {
    setSortState(
      readConfiguredPersistedSort(
        sortPersistenceKey,
        legacySortPersistenceKey,
        config.sortMigration,
      ),
    );
  }, [config.sortMigration, legacySortPersistenceKey, sortPersistenceKey]);
  const columnsWithPersistedSort = useMemo(
    () =>
      applyPersistedSortToAntdColumns(columnsWithGlobalActionMode, sortState),
    [columnsWithGlobalActionMode, sortState],
  );
  const resolvedSummary = useMemo(
    () =>
      withResolvedTableSummary(
        mergedSummary,
        columnsWithPersistedSort as unknown as Record<string, unknown>[],
      ),
    [columnsWithPersistedSort, mergedSummary],
  );
  const mergedOnChange = useMemo<TableProps<T>['onChange']>(() => {
    return (pagination, filters, sorter, extra) => {
      if (
        shouldShowRowIndex &&
        pagination &&
        typeof pagination.current === 'number' &&
        typeof pagination.pageSize === 'number'
      ) {
        rowIndexPageInfoRef.current = {
          current: pagination.current,
          pageSize: pagination.pageSize,
        };
      }
      if (getTableChangeAction(extra) === 'sort') {
        const nextSortState = resolveSortStateFromSorter(sorter);
        setSortState(nextSortState);
        writePersistedSort(sortPersistenceKey, nextSortState);
      }
      onChange?.(pagination, filters, sorter, extra);
    };
  }, [onChange, shouldShowRowIndex, sortPersistenceKey]);
  const mergedExpandable = useMemo(
    () => withExpandedRowClassName<T>(expandable),
    [expandable],
  );

  if (!config.enabled) {
    return (
      <TableDensityProvider density={tableDensityKey}>
        <div className="sxw-resizable-table" style={{ display: 'contents' }}>
          <Table<T>
            columns={columnsWithPersistedSort}
            components={components}
            onChange={mergedOnChange}
            scroll={scroll}
            locale={mergedLocale}
            expandable={mergedExpandable}
            pagination={mergedPagination}
            summary={resolvedSummary}
            dataSource={dataSource}
            {...rest}
            size={tableSize}
          />
        </div>
      </TableDensityProvider>
    );
  }

  return (
    <TableDensityProvider density={tableDensityKey}>
      <div className="sxw-resizable-table" style={{ display: 'contents' }}>
        <ResizableTableEnabled<T>
          columns={columnsWithPersistedSort}
          components={components}
          scroll={scroll}
          config={config}
          onChange={mergedOnChange}
          locale={mergedLocale}
          expandable={mergedExpandable}
          pagination={mergedPagination}
          summary={resolvedSummary}
          dataSource={dataSource}
          {...rest}
          size={tableSize}
        />
      </div>
    </TableDensityProvider>
  );
}

function ResizableTableEnabled<T extends object>({
  columns,
  components,
  scroll,
  config,
  ...rest
}: Omit<ResizableTableProps<T>, 'emptyGuidance' | 'resizable'> & {
  config: ResolvedResizableTableConfig;
}) {
  const normalizedColumns = useMemo(
    () =>
      normalizeResizableAntdColumns(
        columns as TableProps<T>['columns'],
        config.defaultWidth,
      ),
    [columns, config.defaultWidth],
  );
  const persistenceKey =
    config.persistenceKey === undefined
      ? createPersistenceKey(normalizedColumns)
      : typeof config.persistenceKey === 'string'
        ? normalizeTableWidthStorageKey(config.persistenceKey)
        : config.persistenceKey;
  const hookColumns = useMemo(
    () =>
      ensureVisibleFlexHookColumn(
        toHookColumns(
          normalizedColumns as unknown as Record<string, unknown>[],
        ),
      ),
    [normalizedColumns],
  );
  const migratedHookColumns = useMemo(() => {
    sanitizePersistedResizableWidths(
      persistenceKey,
      config.persistenceType,
      hookColumns,
    );
    return hookColumns;
  }, [persistenceKey, config.persistenceType, hookColumns]);

  const {
    components: resizableComponents,
    resizableColumns,
    tableWidth,
  } = useResizableColumns(
    migratedHookColumns,
    config.persistenceKey === undefined
      ? { ...config, persistenceKey }
      : config,
  );

  return (
    <Table<T>
      columns={resizableColumns as TableProps<T>['columns']}
      components={{
        ...components,
        header: {
          ...components?.header,
          ...resizableComponents.header,
        },
      }}
      scroll={{
        ...scroll,
        x: resolveScrollX(scroll?.x, tableWidth),
      }}
      {...rest}
    />
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain shared
 * @sunxu-reason Presents reusable resizable pro table behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export const ResizableProTable = Object.assign(
  ResizableProTableInner,
  ProTable,
) as typeof ResizableProTableInner &
  Omit<typeof ProTable, keyof typeof ResizableProTableInner>;

export const ResizableTable: typeof ResizableTableInner &
  Omit<typeof Table, keyof typeof ResizableTableInner> = Object.assign(
    ResizableTableInner,
    Table,
  ) as typeof ResizableTableInner &
  Omit<typeof Table, keyof typeof ResizableTableInner>;
