import type { Key } from 'react';

export interface ExportColumnSelection {
  key?: string;
  header?: string;
}

export interface TableExportSort {
  field: string;
  order: 'ascend' | 'descend';
}

export interface TableExportLayout {
  columns: ExportColumnSelection[];
  sort?: TableExportSort;
}

export interface TableExportColumnDefinition {
  key?: Key;
  dataIndex?: unknown;
  title?: unknown;
  children?: readonly TableExportColumnDefinition[];
  hideInSetting?: boolean;
  hideInTable?: boolean;
  hidden?: boolean;
  valueType?: unknown;
  search?: unknown;
}

export type TableColumnState = Record<
  string,
  {
    show?: boolean;
    order?: number;
  }
>;

type ExportColumnCandidate = ExportColumnSelection & {
  order: number;
};

const activeLayoutsByRoute = new Map<string, TableExportLayout>();
const INTERNAL_COLUMN_KEY_PREFIX = '__sxw_';

function currentRouteKey(): string {
  return typeof window === 'undefined' ? 'ssr' : window.location.pathname;
}

function columnIdentity(
  column: TableExportColumnDefinition,
  index: number,
): string {
  if (column.key != null) return String(column.key);
  if (Array.isArray(column.dataIndex) && column.dataIndex.length > 0) {
    return column.dataIndex.map(String).join(',');
  }
  if (
    typeof column.dataIndex === 'string' ||
    typeof column.dataIndex === 'number'
  ) {
    return String(column.dataIndex);
  }
  return `${INTERNAL_COLUMN_KEY_PREFIX}generated-export-column-${index}`;
}

function columnHeader(title: unknown): string | undefined {
  if (typeof title !== 'string') return undefined;
  const trimmed = title.trim();
  return trimmed || undefined;
}

function collectExportColumns(
  columns: readonly TableExportColumnDefinition[] | undefined,
  state: TableColumnState | undefined,
): ExportColumnSelection[] {
  const candidates: ExportColumnCandidate[] = [];
  let position = 0;

  const visit = (items: readonly TableExportColumnDefinition[]) => {
    items.forEach((column, index) => {
      if (column.children?.length) {
        visit(column.children);
        return;
      }

      const key = columnIdentity(column, index);
      const columnState = state?.[key];
      const header = columnHeader(column.title);
      const order = columnState?.order ?? position;
      position += 1;

      if (
        key.startsWith(INTERNAL_COLUMN_KEY_PREFIX) ||
        column.hideInSetting === true ||
        column.hideInTable === true ||
        column.hidden === true ||
        column.valueType === 'option' ||
        columnState?.show === false
      ) {
        return;
      }

      candidates.push({ key, ...(header ? { header } : {}), order });
    });
  };

  if (columns) visit(columns);
  return candidates
    .sort((left, right) => left.order - right.order)
    .map(({ key, header }) => ({ key, ...(header ? { header } : {}) }));
}

export function getTableExportRouteKey(): string {
  return currentRouteKey();
}

export function updateActiveTableExportLayout(
  routeKey: string,
  columns: readonly TableExportColumnDefinition[] | undefined,
  state: TableColumnState | undefined,
  sort?: TableExportSort,
): TableExportLayout | undefined {
  const visibleColumns = collectExportColumns(columns, state);
  if (visibleColumns.length === 0) {
    activeLayoutsByRoute.delete(routeKey);
    return undefined;
  }
  const layout = {
    columns: visibleColumns,
    ...(sort ? { sort } : {}),
  } satisfies TableExportLayout;
  activeLayoutsByRoute.set(routeKey, layout);
  return layout;
}

/**
 * 在导出按钮真正被点击时激活指定表格的布局。
 *
 * 同一路由可能同时挂载多个表格（例如 Tabs 的非活动页），仅靠“最后一次
 * 挂载/更新”无法知道用户点击的是哪一张表。表格边界会在点击事件捕获阶段
 * 调用这里，把当前表格重新设为导出上下文，避免布局串表。
 */
export function activateTableExportLayout(
  routeKey: string,
  layout: TableExportLayout | undefined,
): void {
  if (!layout || layout.columns.length === 0) {
    clearActiveTableExportLayout(routeKey);
    return;
  }
  activeLayoutsByRoute.set(routeKey, layout);
}

export function clearActiveTableExportLayout(routeKey: string): void {
  activeLayoutsByRoute.delete(routeKey);
}

export function getActiveTableExportLayout(): TableExportLayout | undefined {
  return activeLayoutsByRoute.get(currentRouteKey());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDataExportRequest(url: string | undefined): boolean {
  if (!url) return false;
  const normalizedUrl = url.toLowerCase();
  return (
    normalizedUrl.includes('export') &&
    !normalizedUrl.includes('template') &&
    !normalizedUrl.includes('import')
  );
}

/**
 * 为数据类导出请求附加当前表格布局。
 *
 * 后端仍以各导出实现声明的列为白名单；这里仅表达用户在当前表格中选择的
 * 显隐、列序和行排序，不能扩大可导出字段范围。
 */
export function applyActiveTableExportLayout<T>(
  url: string | undefined,
  data: T,
): T {
  if (!isDataExportRequest(url) || !isRecord(data)) return data;

  const layout = getActiveTableExportLayout();
  if (!layout || layout.columns.length === 0) return data;

  const dataWithLayout: Record<string, unknown> = {
    ...data,
    exportColumns: layout.columns,
  };
  if (dataWithLayout.orderBy == null && layout.sort) {
    dataWithLayout.orderBy = layout.sort.field;
    dataWithLayout.orderDir = layout.sort.order === 'ascend' ? 'ASC' : 'DESC';
  }
  return dataWithLayout as T;
}
