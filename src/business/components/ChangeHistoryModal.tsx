import type { ProColumns, ProTableProps } from '@ant-design/pro-components';
import { Modal, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { ResizableProTable } from './ResizableTable';
import type {
  CalendarAuditRecord,
  ChangeHistoryModalProps,
} from './schedule-reschedule-types';

/**
 * @sunxu-layer business
 * @sunxu-domain production-schedule
 * @sunxu-reason Shares shift and calendar-exception audit history while the host supplies audit records and action labels.
 */
export function ChangeHistoryModal({
  target,
  onClose,
  capabilities,
}: ChangeHistoryModalProps) {
  const columns = useMemo<ProColumns<CalendarAuditRecord>[]>(
    () => [
      {
        title: '操作时间',
        dataIndex: 'createdAt',
        valueType: 'dateTime',
        width: 180,
        search: false,
        render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        title: '操作',
        dataIndex: 'action',
        width: 90,
        search: false,
        render: (_, record) => capabilities.actionLabels[record.action] ?? '变更',
      },
      {
        title: '操作人',
        dataIndex: 'userName',
        width: 140,
        search: false,
        render: (_, record) => record.userName || '未知用户',
      },
      {
        title: '变更内容',
        dataIndex: 'description',
        search: false,
        ellipsis: true,
        render: (_, record) => (
          <Tooltip title={record.description || '—'} placement="topLeft">
            <span>{record.description || '—'}</span>
          </Tooltip>
        ),
      },
    ],
    [capabilities.actionLabels],
  );

  const request = useMemo<
    NonNullable<ProTableProps<CalendarAuditRecord, Record<string, unknown>>['request']>
  >(
    () =>
      async (params) => {
        if (!target) return { data: [], total: 0, success: true };
        const result = await capabilities.loadHistory({
          kind: target.kind,
          resourceId: target.id,
          page: params.current ?? 1,
          pageSize: params.pageSize ?? 10,
        });
        return {
          data: result.list ?? [],
          total: result.total ?? 0,
          success: true,
        };
      },
    [capabilities.loadHistory, target],
  );

  return (
    <Modal
      title={`变更记录${target?.name ? `：${target.name}` : ''}`}
      open={target !== null}
      onCancel={onClose}
      footer={null}
      width={960}
      destroyOnHidden
    >
      {target ? (
        <ResizableProTable<CalendarAuditRecord>
          columns={columns}
          request={request}
          rowKey="id"
          search={false}
          options={false}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          toolBarRender={false}
          fitContainerHeight={false}
          scroll={{ x: 720 }}
        />
      ) : null}
    </Modal>
  );
}
