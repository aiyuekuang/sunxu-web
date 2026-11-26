import { App, Button, Drawer, Popconfirm, Tag } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import { DateText } from '../documents/DateText';
import { ResizableProTable } from '../shared/ResizableTable';
import TableActions from '../../table/TableActions';
import type {
  BomVersionHistoryAction,
  BomVersionHistoryDrawerProps,
  BomVersionHistoryRecord,
} from './bom-version-history-types';

const DEFAULT_BOM_STATUS_LABELS: Readonly<Record<string, string>> = {
  draft: '草稿',
  active: '激活',
  obsolete: '已归档',
};

const DEFAULT_BOM_STATUS_COLORS: Readonly<Record<string, string>> = {
  draft: 'default',
  active: 'success',
  obsolete: 'error',
};

function isVisibleAction(
  action: BomVersionHistoryAction,
  hasPermission?: (permission: string) => boolean,
) {
  return (
    action.visible !== false &&
    (!action.permission || hasPermission?.(action.permission) === true)
  );
}

function renderAction(
  action: BomVersionHistoryAction,
  onSuccessMessage: (message: string) => void,
) {
  if (action.render) {
    return (
      <span key={action.key} onClick={(event) => event.stopPropagation()}>
        {action.render()}
      </span>
    );
  }

  const button = (
    <Button
      type="link"
      size="small"
      danger={action.danger}
      onClick={action.confirm ? undefined : () => void action.onClick()}
    >
      {action.label}
    </Button>
  );

  if (!action.confirm) return <span key={action.key}>{button}</span>;

  const confirm =
    typeof action.confirm === 'string'
      ? { title: action.confirm }
      : action.confirm;

  return (
    <span key={action.key} onClick={(event) => event.stopPropagation()}>
      <Popconfirm
        title={confirm.title}
        description={confirm.content}
        okText={confirm.okText ?? action.label}
        cancelText={confirm.cancelText ?? '取消'}
        okButtonProps={{ danger: confirm.danger ?? action.danger }}
        onConfirm={async () => {
          await action.onClick();
          if (action.successMessage) onSuccessMessage(action.successMessage);
          action.onSuccess?.();
        }}
      >
        {button}
      </Popconfirm>
    </span>
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Preserves the host BOM version history drawer while version status labels, permissions, actions, selection, and date formatting remain supplied by the host.
 */
export function BomVersionHistoryDrawer<
  T extends BomVersionHistoryRecord,
>({
  open,
  master,
  selectedBomId,
  onOpenChange,
  onSelectVersion,
  getActionItems,
  hasPermission,
  statusLabels = DEFAULT_BOM_STATUS_LABELS,
  statusColors = DEFAULT_BOM_STATUS_COLORS,
  formatDateTime,
}: BomVersionHistoryDrawerProps<T>) {
  const { message } = App.useApp();
  const columns: ProColumns<T>[] = [
    {
      title: '版本号',
      dataIndex: 'version',
      width: 110,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            onSelectVersion(record);
          }}
        >
          {record.version}
        </Button>
      ),
    },
    {
      title: '版本状态',
      dataIndex: 'status',
      width: 120,
      search: false,
      render: (_, record) => (
        <Tag color={statusColors[record.status]}>
          {statusLabels[record.status] ?? record.status ?? '-'}
        </Tag>
      ),
    },
    {
      title: '变更说明',
      dataIndex: 'changeRemark',
      width: 260,
      ellipsis: true,
      search: false,
      render: (_, record) => record.changeRemark || '-',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      search: false,
      render: (_, record) =>
        formatDateTime ? (
          formatDateTime(record.updatedAt)
        ) : (
          <DateText value={record.updatedAt} format="datetime" />
        ),
    },
    {
      title: '',
      key: 'actions',
      dataIndex: '__actions',
      valueType: 'option',
      search: false,
      width: 80,
      fixed: false,
      render: (_, record) => {
        const actions = getActionItems(record).filter((action) =>
          isVisibleAction(action, hasPermission),
        );
        const standalone =
          actions.length === 1 && actions[0].standalone && actions[0].render;
        if (standalone && actions[0].render) {
          return (
            <span onClick={(event) => event.stopPropagation()}>
              {actions[0].render()}
            </span>
          );
        }
        return (
          <TableActions
            actions={actions.map((action) =>
              renderAction(action, (text) => message.success(text)),
            )}
          />
        );
      },
    },
  ];

  return (
    <Drawer
      title={master ? `${master.name} · 版本记录` : '版本记录'}
      open={open}
      size={860}
      destroyOnHidden
      onClose={() => onOpenChange(false)}
    >
      <ResizableProTable<T>
        rowKey="id"
        columns={columns}
        dataSource={master?.versions ? [...master.versions] : []}
        search={false}
        options={false}
        pagination={false}
        size="small"
        onRow={(record) => ({
          onClick: () => onSelectVersion(record),
          style: { cursor: 'pointer' },
        })}
        rowClassName={(record) =>
          record.id === selectedBomId ? 'ant-table-row-selected' : ''
        }
        scroll={{ x: 780 }}
      />
    </Drawer>
  );
}
