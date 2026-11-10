import { DownOutlined, FilterOutlined, UpOutlined } from '@ant-design/icons';
import { Alert, Button, Drawer, Space, Tabs, Tag, Tooltip } from 'antd';
import type { ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ProTableProps } from '@ant-design/pro-components';
import { FilterBar } from './FilterBar';
import { ListScreenContainer } from './PageContainers';
import type { ListScreenContainerProps } from './PageContainers';
import { StatusTabs } from './StatusTabs';
import type { StatusTabsProps } from './StatusTabs';

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
  /** Automatically move inline quick filters into an expandable row when they do not fit. Defaults to true. */
  responsiveQuickFilters?: boolean;
  tableProps: CrudListWorkbenchTableProps<T, Params>;
};

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
  responsiveQuickFilters = true,
  tableProps,
}: CrudListWorkbenchProps<T, Params>) {
  const layoutRef = useRef<HTMLDivElement>(null);
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

  return (
    <>
      <ListScreenContainer
        title={title}
        headingLevel={headingLevel}
        description={description}
        breadcrumbs={breadcrumbs}
        toolbar={listToolbar}
        className={[
          'sxw-crud-list-workbench',
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
          <div className="sxw-crud-list-workbench__table">
            <ProTable<T, Params>
              {...tableProps}
              search={proTableSearch ?? false}
              headerTitle={false}
              toolBarRender={false}
              toolbar={undefined}
              options={tableProps.options ?? false}
            />
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
