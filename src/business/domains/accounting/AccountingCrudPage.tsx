import {
  type ActionType,
  ModalForm,
  type ProColumns,
  type ProTableProps,
} from '@ant-design/pro-components';
import { message } from 'antd';
import { type ReactNode, useMemo, useRef } from 'react';
import { PermissionButton } from '../shared/PermissionButton';
import { ResizableProTable } from '../shared/ResizableTable';
import { RELATION_SORT_KEY_PREFIX } from '../../table/tableHelpers';

type AccountingCrudResponse<T> = {
  list?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
};

export interface AccountingCrudService<T> {
  list(
    body: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<AccountingCrudResponse<T>>;
  create(body: Record<string, unknown>): Promise<T>;
  update(body: Record<string, unknown>): Promise<T>;
}

export interface AccountingCrudPageProps<T extends { id: string }> {
  title: string;
  columns: ProColumns<T>[];
  service: AccountingCrudService<T>;
  managePermission: string;
  canManage: boolean;
  scrollX?: number;
  pagination?: ProTableProps<T, Record<string, unknown>>['pagination'];
  /** ProTable search and pagination parameters mapped to the service query. */
  listParamMapper?: (
    params: Record<string, unknown>,
  ) => Record<string, unknown>;
  /** Defaults for new records. */
  createInitial?: Record<string, unknown>;
  /** Shared create/edit field renderer; record may lock fields already referenced by business rows. */
  renderFormItems: (isEdit: boolean, record?: T) => ReactNode;
  /** Normalize submitted values and retain hidden extension fields if needed. */
  submitValueMapper?: (
    values: Record<string, unknown>,
    record?: T,
  ) => Record<string, unknown>;
  /** Kept for source compatibility; action labels remain “新增 / 编辑”. */
  entityLabel?: string;
}

function resolveSortQuery(sort?: Record<string, unknown>) {
  const activeSort = Object.entries(sort ?? {}).find(
    ([, value]) => value === 'ascend' || value === 'descend',
  );
  if (!activeSort) return {};
  const [field, order] = activeSort;
  const trimmed = field.trim();
  const normalizedField = trimmed.startsWith(RELATION_SORT_KEY_PREFIX)
    ? trimmed.slice(RELATION_SORT_KEY_PREFIX.length) || trimmed
    : (trimmed.split(',').map((value) => value.trim()).filter(Boolean).pop() ??
        trimmed)
        .split('.')
        .map((value) => value.trim())
        .filter(Boolean)
        .pop() ?? trimmed;
  return {
    ...(normalizedField ? { orderBy: normalizedField } : {}),
    orderDir: order === 'ascend' ? 'ASC' : 'DESC',
  };
}

function createAccountingCrudRequest<T>(
  service: AccountingCrudService<T>,
  listParamMapper?: (params: Record<string, unknown>) => Record<string, unknown>,
) {
  return async (
    params: Record<string, unknown>,
    sort?: Record<string, unknown>,
  ) => {
    const { current: _current, pageSize: _pageSize, ...passthrough } = params;
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
      ...resolveSortQuery(sort),
      ...passthroughScalars,
      ...(listParamMapper ? listParamMapper(params) : {}),
    };
    const response = await service.list(body);
    return {
      data: response?.list ?? [],
      total: response?.total ?? 0,
      success: true,
    };
  };
}

/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Preserves host accounting master-data list, permission-gated actions, modal forms, and list query mapping with service access passed by the host.
 * Shared CRUD table for host accounting reference data.
 */
export function AccountingCrudPage<T extends { id: string }>({
  title,
  columns,
  service,
  managePermission,
  canManage,
  scrollX = 1200,
  pagination = { defaultPageSize: 20, showSizeChanger: true },
  listParamMapper,
  createInitial,
  renderFormItems,
  submitValueMapper,
}: AccountingCrudPageProps<T>) {
  const actionRef = useRef<ActionType>(null);
  const request = useMemo(
    () => createAccountingCrudRequest(service, listParamMapper),
    [service, listParamMapper],
  );

  const EditModal = ({ record }: { record?: T }) => {
    const isEdit = !!record;
    return (
      <ModalForm
        title={isEdit ? '编辑' : '新增'}
        width={640}
        trigger={
          isEdit ? (
            <a key="edit">编辑</a>
          ) : (
            <PermissionButton type="primary" permission={managePermission}>
              新增
            </PermissionButton>
          )
        }
        initialValues={
          (record as Record<string, unknown>) ?? createInitial ?? {}
        }
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          const payload = submitValueMapper
            ? submitValueMapper(values, record)
            : values;
          if (record) {
            await service.update({ id: record.id, ...payload });
            message.success('已更新');
          } else {
            await service.create(payload);
            message.success('已创建');
          }
          actionRef.current?.reload();
          return true;
        }}
      >
        {renderFormItems(isEdit, record)}
      </ModalForm>
    );
  };

  const withActions: ProColumns<T>[] = [
    ...columns,
    {
      title: '操作',
      key: 'actions',
      dataIndex: '__actions',
      valueType: 'option',
      width: 90,
      fixed: 'right',
      render: (_, record) =>
        canManage ? [<EditModal key="edit" record={record} />] : ['-'],
    },
  ];

  return (
    <ResizableProTable<T>
      rowKey="id"
      actionRef={actionRef}
      headerTitle={title}
      pagination={pagination}
      fitContainerHeight
      columns={withActions}
      scroll={{ x: scrollX }}
      toolBarRender={() => [<EditModal key="create" />]}
      request={request}
    />
  );
}
