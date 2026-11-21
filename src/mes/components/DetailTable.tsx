import type { ProTableProps } from '@ant-design/pro-components';
import React from 'react';
import type { LocalSortableColumn } from '../table/tableHelpers';
import { ResizableProTable, type ResizableProTableProps } from './ResizableTable';

const renderEmptyToolbar = () => [];

export interface DetailTableProps<T extends object>
  extends Omit<ResizableProTableProps<T, Record<string, unknown>>, 'search' | 'columns'> {
  columns?: LocalSortableColumn<T>[];
  remoteFn?: (params: { page: number; pageSize: number }) => Promise<{ list?: T[]; total?: number }>;
  remoteParams?: Record<string, unknown>;
}

function hasFixedColumn<T extends object>(columns?: LocalSortableColumn<T>[]): boolean {
  return columns?.some((column) => Boolean(column.fixed)) ?? false;
}

function mergeClassName(...names: Array<string | undefined>): string {
  return names.filter(Boolean).join(' ');
}

function disableImplicitSorting<T extends object>(
  columns?: LocalSortableColumn<T>[],
): LocalSortableColumn<T>[] | undefined {
  return columns?.map((column) => {
    if (Array.isArray(column.children)) {
      return {
        ...column,
        children: disableImplicitSorting(
          column.children as LocalSortableColumn<T>[],
        ),
      };
    }
    return column.sorter === undefined
      ? { ...column, sorter: false }
      : column;
  });
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain detail-table
 * @sunxu-reason Preserves MES detail-table defaults and optional server pagination on top of the shared resizable table.
 */
export function DetailTable<T extends Record<string, unknown>>({
  remoteFn,
  remoteParams,
  columns,
  scroll,
  toolBarRender = renderEmptyToolbar,
  size = 'small',
  pagination = false,
  options = { reload: false, density: false, fullScreen: false, setting: true },
  ...rest
}: DetailTableProps<T>) {
  const { className, ...tableProps } = rest;
  const tableColumns = remoteFn ? disableImplicitSorting(columns) : columns;
  const request: ProTableProps<T, Record<string, unknown>>['request'] = remoteFn
    ? async (params) => {
        const result = await remoteFn({
          page: params.current ?? 1,
          pageSize: params.pageSize ?? 10,
          ...remoteParams,
        } as { page: number; pageSize: number });
        return { data: result.list ?? [], total: result.total ?? 0, success: true };
      }
    : undefined;
  const tableScroll = scroll ?? (hasFixedColumn(columns) ? { x: 'max-content' } : undefined);

  return (
    <ResizableProTable<T>
      className={mergeClassName('mes-detail-table', className)}
      search={false}
      columns={tableColumns}
      fitContainerHeight={false}
      toolBarRender={toolBarRender}
      size={size}
      pagination={remoteFn ? { pageSize: 10 } : pagination}
      showRowIndex={false}
      options={options}
      request={request}
      scroll={tableScroll}
      {...tableProps}
    />
  );
}
