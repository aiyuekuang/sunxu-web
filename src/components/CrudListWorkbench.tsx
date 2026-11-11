import { DownOutlined, FilterOutlined, UpOutlined } from '@ant-design/icons';
import { Alert, Button, Drawer, Space, Tabs, Tag, Tooltip } from 'antd';
import type { ReactNode, RefObject } from 'react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ProTableProps } from '@ant-design/pro-components';
import { FilterBar } from './FilterBar';
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
  /** The workbench owns the list title and toolbar. */
  headerTitle: false;
  toolBarRender: false;
  toolbar?: undefined;
};

export type CrudListWorkbenchProps<
  T extends object,
  Params extends Record<string, unknown> = Record<string, unknown>,
> = Omit<ListScreenContainerProps, 'actions' | 'children' | 'toolbar'> & {
  /** High-frequency, mutually exclusive top-level categories. */
  primaryTabs?: CrudListPrimaryTabs;
  /** Common status filter, rendered on the right side of the primary toolbar. */
  statusFilters?: StatusTabsProps;
  /** One or two frequently used controls, such as owner or date range. */
  quickFilters?: ReactNode;
  /** Host-owned keyword/search control. */
  search?: ReactNode;
  /** Optional host-owned actions placed beside search and filters. */
  filterActions?: ReactNode;
  /** Host-owned summary/chips for currently applied query conditions. */
  appliedFilters?: ReactNode;
  /** Optional system/personal view manager, commonly `SavedViewBar`. */
  viewBar?: ReactNode;
  /** List-level actions such as create or master-data settings. */
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
   * list-level title, filters, actions, and toolbar remain owned by this component.
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
  const tableWrapper = container.querySelector<HTMLElement>('.ant-table-wrapper');
  if (!tableWrapper || container.clientHeight <= 0) return undefined;

  const containerRect = container.getBoundingClientRect();
  const tableRect = tableWrapper.getBoundingClientRect();
  const tableTop = Math.max(0, tableRect.top - containerRect.top);
  const tableHead = container.querySelector<HTMLElement>('.ant-table-thead');
  const tableFooter = container.querySelector<HTMLElement>('.ant-table-footer');
  const pagination = container.querySelector<HTMLElement>('.ant-table-pagination');
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
 * @sunxu-component shared
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
  title,
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
  viewBar,
  toolbarActions,
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

  const hasFacetSidebar = facetSidebar !== undefined && facetSidebar !== null;
  const hasQuickFilters = quickFilters !== undefined && quickFilters !== null;
  const hasSearchRow = Boolean(
    search || quickFilters || filterActions || advancedFilters,
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
    primaryTabs || statusFilters || toolbarActions || (hasFacetSidebar && compactFacet),
  );
  const listToolbar =
    viewBar || hasPrimaryToolbar || hasSearchRow || appliedFilters ? (
      <div className="sxw-crud-list-workbench__toolbar">
      {viewBar ? (
        <div className="sxw-crud-list-workbench__views">{viewBar}</div>
      ) : null}
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
            {toolbarActions}
          </div>
        </div>
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
                <Space size={4}>
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
    search: proTableSearch ?? false,
    headerTitle: false,
    toolBarRender: false,
    toolbar: undefined,
    options: tableProps.options ?? false,
    scroll: resolvedScroll,
  };

  return (
    <>
      <ListScreenContainer
        as={as}
        title={layout === 'embedded' ? undefined : title}
        headingLevel={headingLevel}
        description={layout === 'embedded' ? undefined : description}
        breadcrumbs={layout === 'embedded' ? undefined : breadcrumbs}
        frame={layout === 'embedded' ? 'none' : 'inherit'}
        fill={fill}
        toolbar={listToolbar}
        className={[
          'sxw-crud-list-workbench',
          layout === 'embedded' ? 'sxw-crud-list-workbench--embedded' : '',
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
              renderTable(renderTableProps)
            ) : (
              <ProTable<T, Params>
                {...tableProps}
                search={proTableSearch ?? false}
                headerTitle={false}
                toolBarRender={false}
                toolbar={undefined}
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
