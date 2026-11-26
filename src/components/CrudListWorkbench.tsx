import { DownOutlined, FilterOutlined, PlusOutlined, UpOutlined } from '@ant-design/icons';
import { Alert, Button, Drawer, Space, Tabs, Tag, Tooltip } from 'antd';
import type { SpinProps } from 'antd';
import type { TableProps as AntTableProps } from 'antd';
import type { ReactElement, ReactNode, RefObject } from 'react';
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ProTableProps } from '@ant-design/pro-components';
import { FilterBar } from './FilterBar';
import { withPaginationSummary } from './PaginationSummary';
import { ListScreenContainer } from './PageContainers';
import type { ListScreenContainerProps } from './PageContainers';
import { StatusTabs } from './StatusTabs';
import type { StatusTabsProps } from './StatusTabs';

export type CrudListWorkbenchLayout = 'page' | 'embedded';

export type CrudListPrimaryTab = {
  key: string;
  label: ReactNode;
  disabled?: boolean;
};

export type CrudListPrimaryTabs = {
  items: CrudListPrimaryTab[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
};

export type CrudListAdvancedFilters = {
  /** Applied filter count; draft values do not contribute until committed by the host. */
  activeCount?: number;
  title?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  /** Promote the host's draft to applied query params. ProTable re-requests when `tableProps.params` changes. */
  onApply: () => void | boolean | Promise<void | boolean>;
  onApplyError?: (error: unknown) => void;
  /** Clear the draft only; the existing result set remains applied until `onApply`. */
  onReset?: () => void;
  /** Restore draft controls from the currently applied query after dismissal. */
  onCancel?: () => void;
  ariaLabel?: string;
};

export type CrudListWorkbenchTableProps<
  T extends object,
  Params extends Record<string, unknown> = Record<string, unknown>,
> = Omit<
  ProTableProps<T, Params>,
  'headerTitle' | 'search' | 'toolbar' | 'toolBarRender' | 'columns' | 'rowKey'
> & {
  columns: NonNullable<ProTableProps<T, Params>['columns']>;
  rowKey: NonNullable<ProTableProps<T, Params>['rowKey']>;
};

export type CrudListWorkbenchTableRenderProps<
  T extends object,
  Params extends Record<string, unknown> = Record<string, unknown>,
> = CrudListWorkbenchTableProps<T, Params> & {
  /** Query form configuration remains owned by the workbench. */
  search: ProTableProps<T, Params>['search'];
  /** The workbench suppresses ProTable's own title and toolbar. */
  headerTitle: false;
  toolBarRender: false;
  toolbar?: undefined;
  /** Host-provided full-filter summary for the pagination footer. */
  paginationSummary?: ReactNode;
};

export type CrudListWorkbenchProps<
  T extends object,
  Params extends Record<string, unknown> = Record<string, unknown>,
> = Omit<ListScreenContainerProps, 'actions' | 'children' | 'title' | 'toolbar'> & {
  /** @deprecated The workbench no longer renders a page title; use a host-level PageHeader if needed. */
  title?: ReactNode;
  /** High-frequency, mutually exclusive top-level categories. */
  primaryTabs?: CrudListPrimaryTabs;
  /** Common status filter, rendered on the right side of the primary toolbar. */
  statusFilters?: StatusTabsProps;
  /** One or two frequently used controls, such as owner or date range. */
  quickFilters?: ReactNode;
  /** Host-owned keyword/search control; fills the slot, capped at 320px on desktop. */
  search?: ReactNode;
  /** Optional host-owned actions placed beside search and filters. */
  filterActions?: ReactNode;
  /** Host-owned summary/chips for currently applied query conditions. */
  appliedFilters?: ReactNode;
  /** Host-provided full-filter summary displayed beside the pagination controls. */
  paginationSummary?: ReactNode;
  /** Optional system/personal view manager, commonly `SavedViewBar`. */
  viewBar?: ReactNode;
  /** Optional create action. The workbench renders the standard “新增” button. */
  onCreate?: () => void;
  /** Keep the create action visible but unavailable when prerequisites are unmet. */
  onCreateDisabled?: boolean;
  /** Other list-level actions such as import or master-data settings. */
  toolbarActions?: ReactNode;
  /** Optional advanced filter drawer. Field schema and values stay with the host. */
  advancedFilters?: CrudListAdvancedFilters;
  /** Optional hierarchy/category facet. It becomes a left drawer below the effective-width breakpoint. */
  facetSidebar?: ReactNode;
  facetLabel?: string;
  facetSidebarBreakpoint?: number;
  filterBarLabel?: string;
  /** Use ProTable's column-driven QueryFilter, including its native responsive/collapse behavior. */
  proTableSearch?: ProTableProps<T, Params>['search'];
  /**
   * Render a host table adapter (for example, a resizable ProTable) inside the
   * workbench result area. The adapter receives normalized table props while
   * filters, actions, and toolbar remain owned by this component.
   */
  renderTable?: (props: CrudListWorkbenchTableRenderProps<T, Params>) => ReactNode;
  /** Automatically move inline quick filters into an expandable row when they do not fit. Defaults to true. */
  responsiveQuickFilters?: boolean;
  /**
   * `page` owns the workspace frame; `embedded` is a section inside another page,
   * Tab panel, Drawer or card and must not add a second page inset.
   */
  layout?: CrudListWorkbenchLayout;
  /**
   * Fill the available parent height and keep the table header and pagination
   * visible while the table body scrolls. Use it for single-list viewport pages.
   */
  fill?: boolean;
  tableProps: CrudListWorkbenchTableProps<T, Params>;
};

const TABLE_MIN_BODY_HEIGHT = 80;
const DEFAULT_PAGINATION_SPACE = 64;
const FILL_BOTTOM_GAP = 2;
const FILL_TABLE_CLASSES = {
  proTable: 'sxw-crud-list-workbench__fill-pro-table',
  card: 'sxw-crud-list-workbench__fill-card',
  cardBody: 'sxw-crud-list-workbench__fill-card-body',
  tableRoot: 'sxw-crud-list-workbench__fill-table-root',
  tableSection: 'sxw-crud-list-workbench__fill-table-section',
  spinRoot: 'sxw-crud-list-workbench__fill-spin-root',
  spinContainer: 'sxw-crud-list-workbench__fill-spin-container',
  header: 'sxw-crud-list-workbench__fill-table-header',
  headerRow: 'sxw-crud-list-workbench__fill-table-header-row',
  footer: 'sxw-crud-list-workbench__fill-table-footer',
  pagination: 'sxw-crud-list-workbench__fill-table-pagination',
} as const;

const joinClassNames = (...classNames: Array<string | undefined>) =>
  classNames.filter(Boolean).join(' ');

type TableClassNames<T extends object, Params extends Record<string, unknown>> =
  NonNullable<ProTableProps<T, Params>['classNames']>;
type TableClassNamesFactory<T extends object> = (info: { props: AntTableProps<T> }) => unknown;
type TableClassNameSlots<T extends object, Params extends Record<string, unknown>> =
  Exclude<TableClassNames<T, Params>, TableClassNamesFactory<T>>;

function addFillTableClassNames<T extends object, Params extends Record<string, unknown>>(
  classNames: ProTableProps<T, Params>['classNames'],
): ProTableProps<T, Params>['classNames'] {
  const merge = (current?: TableClassNameSlots<T, Params>) => ({
    ...current,
    root: joinClassNames(current?.root, FILL_TABLE_CLASSES.tableRoot),
    section: joinClassNames(current?.section, FILL_TABLE_CLASSES.tableSection),
    header: {
      ...current?.header,
      wrapper: joinClassNames(current?.header?.wrapper, FILL_TABLE_CLASSES.header),
      row: joinClassNames(current?.header?.row, FILL_TABLE_CLASSES.headerRow),
    },
    footer: joinClassNames(current?.footer, FILL_TABLE_CLASSES.footer),
    pagination: {
      ...current?.pagination,
      root: joinClassNames(current?.pagination?.root, FILL_TABLE_CLASSES.pagination),
    },
  }) as TableClassNameSlots<T, Params>;

  if (typeof classNames === 'function') {
    return ((info) => merge(classNames(info))) as TableClassNames<T, Params>;
  }
  return merge(classNames as TableClassNameSlots<T, Params>) as TableClassNames<T, Params>;
}

type SpinClassNames = NonNullable<SpinProps['classNames']>;
type SpinClassNameSlots = Exclude<SpinClassNames, (info: { props: SpinProps }) => unknown>;

function addFillSpinClassNames(classNames: SpinProps['classNames']): SpinClassNames {
  const merge = (current?: SpinClassNameSlots) => ({
    ...current,
    root: joinClassNames(current?.root, FILL_TABLE_CLASSES.spinRoot),
    container: joinClassNames(current?.container, FILL_TABLE_CLASSES.spinContainer),
  }) as SpinClassNameSlots;

  if (typeof classNames === 'function') {
    return (info) => merge(classNames(info));
  }
  return merge(classNames as SpinClassNameSlots);
}

function addFillCardLayout<T extends object, Params extends Record<string, unknown>>(
  cardProps: ProTableProps<T, Params>['cardProps'],
): ProTableProps<T, Params>['cardProps'] {
  if (cardProps === false) return false;
  const current = cardProps ?? {};
  return {
    ...current,
    classNames: {
      ...current.classNames,
      root: joinClassNames(current.classNames?.root, FILL_TABLE_CLASSES.card),
      body: joinClassNames(current.classNames?.body, FILL_TABLE_CLASSES.cardBody),
    },
    styles: {
      ...current.styles,
      body: {
        ...current.styles?.body,
        display: 'flex',
        minWidth: 0,
        minHeight: 0,
        flex: '1 1 auto',
        flexDirection: 'column',
        overflow: 'hidden',
      },
    },
  };
}

function addFillTableLayout<T extends object, Params extends Record<string, unknown>>(
  tableProps: CrudListWorkbenchTableProps<T, Params>,
) {
  const loading =
    typeof tableProps.loading === 'object' && tableProps.loading !== null
      ? tableProps.loading
      : { spinning: Boolean(tableProps.loading) };
  return {
    className: joinClassNames(tableProps.className, FILL_TABLE_CLASSES.proTable),
    classNames: addFillTableClassNames<T, Params>(tableProps.classNames),
    loading: {
      ...loading,
      classNames: addFillSpinClassNames(loading.classNames),
    },
  };
}

function mergeRenderedTableScroll<T extends object, Params extends Record<string, unknown>>(
  renderedTable: ReactNode,
  workbenchScroll: CrudListWorkbenchTableProps<T, Params>['scroll'],
  fill: boolean,
): ReactNode {
  if (!isValidElement(renderedTable)) return renderedTable;

  const tableElement = renderedTable as ReactElement<{
    scroll?: CrudListWorkbenchTableProps<T, Params>['scroll'];
  }>;
  const adapterScroll = tableElement.props.scroll;
  const mergedScroll = {
    ...workbenchScroll,
    ...adapterScroll,
  };

  if (fill) {
    // The workbench owns vertical sizing in fill mode. Keep its measured `y`
    // even when an adapter replaces the whole scroll object to set `x`.
    if (workbenchScroll?.y === undefined) {
      delete mergedScroll.y;
    } else {
      mergedScroll.y = workbenchScroll.y;
    }
  }

  return cloneElement(tableElement, { scroll: mergedScroll });
}
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Measure the height the ProTable body may consume inside a filled workbench.
 * The table toolbar, header, footer and pagination sit outside the scroll body,
 * so the body height cannot be derived from the container height alone.
 */
const getFillTableBodyHeight = (
  container: HTMLElement,
  paginationEnabled: boolean,
): number | undefined => {
  const tableRoot = container.querySelector<HTMLElement>(`.${FILL_TABLE_CLASSES.tableRoot}`);
  if (!tableRoot || container.clientHeight <= 0) return undefined;

  const containerRect = container.getBoundingClientRect();
  const tableRect = tableRoot.getBoundingClientRect();
  const tableTop = Math.max(0, tableRect.top - containerRect.top);
  const tableHead =
    container.querySelector<HTMLElement>(`.${FILL_TABLE_CLASSES.header}`) ??
    container.querySelector<HTMLElement>(`.${FILL_TABLE_CLASSES.headerRow}`);
  const tableFooter = container.querySelector<HTMLElement>(`.${FILL_TABLE_CLASSES.footer}`);
  const pagination = container.querySelector<HTMLElement>(`.${FILL_TABLE_CLASSES.pagination}`);
  const paginationSpace = pagination
    ? Math.ceil(pagination.getBoundingClientRect().height) + 24
    : paginationEnabled
      ? DEFAULT_PAGINATION_SPACE
      : 0;
  const availableHeight =
    container.clientHeight -
    tableTop -
    (tableHead ? Math.ceil(tableHead.getBoundingClientRect().height) : 0) -
    (tableFooter ? Math.ceil(tableFooter.getBoundingClientRect().height) : 0) -
    paginationSpace -
    FILL_BOTTOM_GAP;

  return Math.max(TABLE_MIN_BODY_HEIGHT, Math.floor(availableHeight));
};

/**
 * Resolve the table body height for `fill` workbenches. The workbench owns this
 * measurement so hosts do not need page-level `:has()` CSS or their own
 * adaptive-height table wrapper. A host-provided `scroll.y` always wins.
 */
function useFillTableHeight(
  enabled: boolean,
  paginationEnabled: boolean,
  hostScrollY: number | string | undefined,
  containerRef: RefObject<HTMLDivElement | null>,
) {
  const [height, setHeight] = useState<number>();

  useIsomorphicLayoutEffect(() => {
    if (!enabled || hostScrollY !== undefined) {
      setHeight(undefined);
      return undefined;
    }
    const container = containerRef.current;
    if (!container) return undefined;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const nextHeight = getFillTableBodyHeight(container, paginationEnabled);
      if (nextHeight === undefined) return;
      setHeight((previous) => (previous === nextHeight ? previous : nextHeight));
    };
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : undefined;
    const mutationObserver =
      typeof MutationObserver !== 'undefined' ? new MutationObserver(schedule) : undefined;
    resizeObserver?.observe(container);
    for (const className of [
      FILL_TABLE_CLASSES.tableRoot,
      FILL_TABLE_CLASSES.header,
      FILL_TABLE_CLASSES.headerRow,
      FILL_TABLE_CLASSES.footer,
      FILL_TABLE_CLASSES.pagination,
    ]) {
      const element = container.querySelector<HTMLElement>(`.${className}`);
      if (element) resizeObserver?.observe(element);
    }
    mutationObserver?.observe(container, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
    measure();
    schedule();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [containerRef, enabled, hostScrollY, paginationEnabled]);

  return height;
}

/**
 * @sunxu-layer composite
 * @sunxu-page list
 * @sunxu-use filters
 * @sunxu-use status-tabs
 * @sunxu-use data-table
 *
 * A PC list composition for high- and low-complexity CRUD result sets. Query values,
 * requests, permissions, forms, and business actions remain controlled by the host.
 */
export function CrudListWorkbench<
  T extends object,
  Params extends Record<string, unknown> = Record<string, unknown>,
>({
  headingLevel,
  description,
  breadcrumbs,
  className,
  as = 'section',
  primaryTabs,
  statusFilters,
  quickFilters,
  search,
  filterActions,
  appliedFilters,
  paginationSummary,
  viewBar,
  toolbarActions,
  onCreate,
  onCreateDisabled = false,
  advancedFilters,
  facetSidebar,
  facetLabel = '分类筛选',
  facetSidebarBreakpoint = 1024,
  filterBarLabel = '列表筛选',
  proTableSearch,
  renderTable,
  responsiveQuickFilters = true,
  layout = 'page',
  fill = false,
  tableProps,
}: CrudListWorkbenchProps<T, Params>) {
  const layoutRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const quickFiltersRef = useRef<HTMLDivElement>(null);
  const filterActionsRef = useRef<HTMLDivElement>(null);
  const requiredFilterRowWidthRef = useRef(0);
  const quickFiltersPanelId = useId();
  const [compactFacet, setCompactFacet] = useState(false);
  const [facetOpen, setFacetOpen] = useState(false);
  const [quickFiltersAutoCollapsed, setQuickFiltersAutoCollapsed] = useState(false);
  const [quickFiltersExpanded, setQuickFiltersExpanded] = useState(false);
  const [uncontrolledFilterOpen, setUncontrolledFilterOpen] = useState(
    advancedFilters?.defaultOpen ?? false,
  );
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [filterApplyError, setFilterApplyError] = useState(false);
  const fillTableHeight = useFillTableHeight(
    fill,
    tableProps.pagination !== false,
    tableProps.scroll?.y,
    tableContainerRef,
  );
  const resolvedScroll =
    fillTableHeight !== undefined && tableProps.scroll?.y === undefined
      ? { ...(tableProps.scroll ?? {}), y: fillTableHeight }
      : tableProps.scroll;
  const resolvedCardProps =
    tableProps.cardProps === undefined
      ? { styles: { body: { paddingInline: 16 } } }
      : tableProps.cardProps;
  const fillTableLayout = fill ? addFillTableLayout(tableProps) : undefined;
  const resolvedPagination = useMemo(
    () => withPaginationSummary(tableProps.pagination, paginationSummary),
    [paginationSummary, tableProps.pagination],
  );
  const resolvedFillCardProps = fill
    ? addFillCardLayout<T, Params>(resolvedCardProps)
    : resolvedCardProps;
  const resolvedCardPropsWithFill = resolvedFillCardProps;

  const hasFacetSidebar = facetSidebar !== undefined && facetSidebar !== null;
  const hasQuickFilters = quickFilters !== undefined && quickFilters !== null;
  const hasSearchRow = Boolean(
    search || quickFilters || filterActions || advancedFilters || toolbarActions || onCreate,
  );
  const filterOpen = advancedFilters?.open ?? uncontrolledFilterOpen;

  useEffect(() => {
    const element = layoutRef.current;
    if (!hasFacetSidebar || !element) {
      setCompactFacet(false);
      return;
    }

    const update = (width: number) => {
      setCompactFacet(width < facetSidebarBreakpoint);
    };
    update(element.getBoundingClientRect().width);

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) update(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [facetSidebarBreakpoint, hasFacetSidebar]);

  useEffect(() => {
    if (!compactFacet) setFacetOpen(false);
  }, [compactFacet]);

  useEffect(() => {
    const element = filterBarRef.current;
    if (!responsiveQuickFilters || !hasQuickFilters || !element) {
      requiredFilterRowWidthRef.current = 0;
      setQuickFiltersAutoCollapsed(false);
      setQuickFiltersExpanded(false);
      return;
    }

    const update = () => {
      const quickWidth = quickFiltersRef.current?.scrollWidth;
      const actionsWidth = filterActionsRef.current?.scrollWidth ?? 0;
      const minimumSearchWidth = search ? 180 : 0;
      if (quickWidth) {
        requiredFilterRowWidthRef.current =
          minimumSearchWidth + quickWidth + actionsWidth + 16;
      }

      const requiredWidth = requiredFilterRowWidthRef.current;
      const nextCollapsed = requiredWidth > 0 && element.clientWidth < requiredWidth;
      setQuickFiltersAutoCollapsed((current) =>
        current === nextCollapsed ? current : nextCollapsed,
      );
      if (!nextCollapsed) setQuickFiltersExpanded(false);
    };

    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (quickFiltersRef.current) observer.observe(quickFiltersRef.current);
    if (filterActionsRef.current) observer.observe(filterActionsRef.current);
    return () => observer.disconnect();
  }, [
    advancedFilters,
    filterActions,
    hasQuickFilters,
    quickFilters,
    responsiveQuickFilters,
    search,
    toolbarActions,
    onCreate,
  ]);

  const setFilterOpen = (nextOpen: boolean) => {
    if (nextOpen) setFilterApplyError(false);
    if (advancedFilters?.open === undefined) {
      setUncontrolledFilterOpen(nextOpen);
    }
    advancedFilters?.onOpenChange?.(nextOpen);
  };

  const closeAdvancedFilters = () => {
    advancedFilters?.onCancel?.();
    setFilterOpen(false);
  };

  const applyAdvancedFilters = async () => {
    if (!advancedFilters) return;
    setApplyingFilters(true);
    setFilterApplyError(false);
    try {
      const result = await advancedFilters.onApply();
      if (result !== false) setFilterOpen(false);
    } catch (error) {
      setFilterApplyError(true);
      advancedFilters.onApplyError?.(error);
    } finally {
      setApplyingFilters(false);
    }
  };

  const hasPrimaryToolbar = Boolean(
    primaryTabs || statusFilters || (hasFacetSidebar && compactFacet),
  );
  const listToolbar =
    viewBar || hasPrimaryToolbar || hasSearchRow || appliedFilters ? (
      <div className="sxw-crud-list-workbench__toolbar">
      {hasPrimaryToolbar ? (
        <div className="sxw-crud-list-workbench__primary-row">
          {primaryTabs ? (
            <div
              className="sxw-crud-list-workbench__primary-tabs"
              role="group"
              aria-label={primaryTabs.ariaLabel}
            >
              <Tabs
                activeKey={primaryTabs.value}
                animated={false}
                classNames={{
                  root: 'sxw-crud-list-workbench__primary-tabs-root',
                  header: 'sxw-crud-list-workbench__primary-tabs-header',
                  item: 'sxw-crud-list-workbench__primary-tabs-item',
                }}
                items={primaryTabs.items.map(({ key, label, disabled }) => ({
                  key,
                  label,
                  disabled,
                  children: null,
                }))}
                onChange={primaryTabs.onChange}
                size="small"
                tabBarGutter={16}
              />
            </div>
          ) : null}
          <div className="sxw-crud-list-workbench__primary-actions">
            {statusFilters ? <StatusTabs {...statusFilters} /> : null}
            {hasFacetSidebar && compactFacet ? (
              <Button
                aria-label={facetLabel}
                icon={<FilterOutlined aria-hidden="true" />}
                onClick={() => setFacetOpen(true)}
              >
                {facetLabel}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      {viewBar ? (
        <div className="sxw-crud-list-workbench__views">{viewBar}</div>
      ) : null}
      {hasSearchRow ? (
        <div ref={filterBarRef}>
          <FilterBar
            ariaLabel={filterBarLabel}
            className={[
              'sxw-crud-list-workbench__filter-bar',
              quickFiltersAutoCollapsed
                ? 'sxw-crud-list-workbench__filter-bar--compact'
                : '',
              quickFiltersAutoCollapsed && quickFiltersExpanded
                ? 'sxw-crud-list-workbench__filter-bar--expanded'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            actions={
              <div
                ref={filterActionsRef}
                className="sxw-crud-list-workbench__filter-actions"
              >
                <Space size={4} wrap>
                  {advancedFilters ? (
                    <Tooltip title="高级筛选">
                      <Button
                        type="text"
                        aria-label={
                          advancedFilters.activeCount
                            ? `${advancedFilters.ariaLabel ?? '高级筛选'}，已应用 ${advancedFilters.activeCount} 项`
                            : advancedFilters.ariaLabel ?? '高级筛选'
                        }
                        icon={
                          <span className="sxw-crud-list-workbench__filter-icon">
                            <FilterOutlined aria-hidden="true" />
                            {advancedFilters.activeCount ? (
                              <span className="sxw-crud-list-workbench__filter-count">
                                {advancedFilters.activeCount}
                              </span>
                            ) : null}
                          </span>
                        }
                        onClick={() => setFilterOpen(true)}
                      />
                    </Tooltip>
                  ) : null}
                  {quickFiltersAutoCollapsed ? (
                    <Button
                      type="text"
                      size="small"
                      aria-expanded={quickFiltersExpanded}
                      aria-controls={quickFiltersExpanded ? quickFiltersPanelId : undefined}
                      onClick={() =>
                        setQuickFiltersExpanded((expanded) => !expanded)
                      }
                      icon={
                        quickFiltersExpanded ? (
                          <UpOutlined aria-hidden="true" />
                        ) : (
                          <DownOutlined aria-hidden="true" />
                        )
                      }
                    >
                      {quickFiltersExpanded ? '收起筛选' : '展开筛选'}
                    </Button>
                  ) : null}
                  {filterActions}
                  {toolbarActions}
                  {onCreate ? (
                    <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} disabled={onCreateDisabled}>
                      新增
                    </Button>
                  ) : null}
                </Space>
              </div>
            }
          >
            <div className="sxw-crud-list-workbench__filter-controls">
              {search ? (
                <div className="sxw-crud-list-workbench__search">{search}</div>
              ) : null}
              {hasQuickFilters && !quickFiltersAutoCollapsed ? (
                <div
                  ref={quickFiltersRef}
                  className="sxw-crud-list-workbench__quick-filters"
                >
                  {quickFilters}
                </div>
              ) : null}
            </div>
            {hasQuickFilters && quickFiltersAutoCollapsed && quickFiltersExpanded ? (
              <div
                id={quickFiltersPanelId}
                ref={quickFiltersRef}
                className="sxw-crud-list-workbench__quick-filters sxw-crud-list-workbench__quick-filters--expanded"
              >
                {quickFilters}
              </div>
            ) : null}
          </FilterBar>
        </div>
      ) : null}
      {appliedFilters ? (
        <div className="sxw-crud-list-workbench__applied-filters">
          {appliedFilters}
        </div>
      ) : null}
      </div>
    ) : undefined;

  const renderTableProps: CrudListWorkbenchTableRenderProps<T, Params> = {
    ...tableProps,
    ...(fillTableLayout ?? {}),
    cardProps: resolvedCardPropsWithFill,
    search: proTableSearch ?? false,
    headerTitle: false,
    toolBarRender: false,
    toolbar: undefined,
    paginationSummary,
    options: tableProps.options ?? false,
    scroll: resolvedScroll,
  };

  return (
    <>
      <ListScreenContainer
        as={as}
        headingLevel={headingLevel}
        description={layout === 'embedded' ? undefined : description}
        breadcrumbs={layout === 'embedded' ? undefined : breadcrumbs}
        frame={layout === 'embedded' ? 'none' : 'inherit'}
        fill={fill}
        toolbar={listToolbar}
        className={[
          'sxw-crud-list-workbench',
          layout === 'embedded' ? 'sxw-crud-list-workbench--embedded' : '',
          layout === 'embedded' ? '' : 'sxw-crud-list-workbench--page-surface',
          fill ? 'sxw-crud-list-workbench--fill' : '',
          hasFacetSidebar && !compactFacet
            ? 'sxw-crud-list-workbench--with-facet'
            : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div
          ref={layoutRef}
          className="sxw-crud-list-workbench__layout"
          data-facet-layout={
            hasFacetSidebar ? (compactFacet ? 'drawer' : 'sidebar') : 'none'
          }
        >
          {hasFacetSidebar && !compactFacet ? (
            <aside
              className="sxw-crud-list-workbench__facet"
              aria-label={facetLabel}
            >
              {facetSidebar}
            </aside>
          ) : null}
          <div ref={tableContainerRef} className="sxw-crud-list-workbench__table">
            {renderTable ? (
              mergeRenderedTableScroll(
                renderTable(renderTableProps),
                resolvedScroll,
                fill,
              )
            ) : (
              <ProTable<T, Params>
                {...tableProps}
                {...(fillTableLayout ?? {})}
                cardProps={resolvedCardPropsWithFill}
                search={proTableSearch ?? false}
                headerTitle={false}
                toolBarRender={false}
                toolbar={undefined}
                pagination={resolvedPagination}
                options={tableProps.options ?? false}
                scroll={resolvedScroll}
              />
            )}
          </div>
        </div>
      </ListScreenContainer>

      {advancedFilters ? (
        <Drawer
          title={
            <Space size={8}>
              <span>{advancedFilters.title ?? '筛选'}</span>
              {advancedFilters.activeCount ? (
                <Tag color="blue">已应用 {advancedFilters.activeCount} 项</Tag>
              ) : null}
            </Space>
          }
          size="min(440px, 100vw)"
          open={filterOpen}
          onClose={closeAdvancedFilters}
          closable={!applyingFilters}
          mask={{ closable: !applyingFilters }}
          keyboard={!applyingFilters}
          footer={
            <div className="sxw-crud-list-workbench__drawer-footer">
              {advancedFilters.onReset ? (
                <Button disabled={applyingFilters} onClick={advancedFilters.onReset}>重置</Button>
              ) : <span />}
              <Space>
                <Button disabled={applyingFilters} onClick={closeAdvancedFilters}>取消</Button>
                <Button type="primary" loading={applyingFilters} onClick={() => void applyAdvancedFilters()}>
                  应用
                </Button>
              </Space>
            </div>
          }
        >
          <div className="sxw-crud-list-workbench__drawer-content">
            {filterApplyError ? (
              <Alert
                type="error"
                showIcon
                role="alert"
                message="筛选条件未应用，请检查后重试。"
              />
            ) : null}
            {advancedFilters.children}
          </div>
        </Drawer>
      ) : null}

      {hasFacetSidebar && compactFacet ? (
        <Drawer
          title={facetLabel}
          placement="left"
          size={280}
          open={facetOpen}
          onClose={() => setFacetOpen(false)}
        >
          {facetSidebar}
        </Drawer>
      ) : null}
    </>
  );
}
