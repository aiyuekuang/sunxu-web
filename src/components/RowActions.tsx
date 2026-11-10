import { Button, Dropdown, type MenuProps } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

export type RowActionItem = {
  key: string;
  label: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  /** 子菜单项，用于需要分组的操作 */
  children?: RowActionItem[];
};

export type RowActionsProps = {
  actions: RowActionItem[];
  /** 触发按钮的可访问名称；缺省“更多操作” */
  ariaLabel?: string;
  className?: string;
};

/**
 * @sunxu-component shared
 *
 * 数据表格行的通用操作收纳：全部操作收进一个竖向省略号菜单，避免操作列被内容撑宽。
 * 危险操作前自动插入分隔线（首个之前不加）；子级操作渲染为菜单分组。
 * 操作语义（权限、确认、跳转）由宿主决定；本组件只负责收纳与可访问名称。
 */
export function RowActions({ actions, ariaLabel = '更多操作', className }: RowActionsProps) {
  const validActions = actions.filter(Boolean);

  if (validActions.length === 0) {
    return null;
  }

  const toMenuItem = (action: RowActionItem): NonNullable<MenuProps['items']>[number] => ({
    key: action.key,
    label: action.label,
    icon: action.icon,
    danger: action.danger,
    disabled: action.disabled,
    onClick: action.children?.length ? undefined : action.onClick,
    children: action.children?.filter(Boolean).map(toMenuItem),
  });

  const menuItems: MenuProps['items'] = validActions.flatMap((action, index) => {
    const item = toMenuItem(action);
    return action.danger && index > 0 ? [{ type: 'divider' as const }, item] : [item];
  });

  return (
    <span className={['sxw-row-actions', className].filter(Boolean).join(' ')}>
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <Button
          type="text"
          size="small"
          aria-label={ariaLabel}
          title={ariaLabel}
          icon={<MoreOutlined />}
          style={{ width: 32, height: 32, paddingInline: 0 }}
        />
      </Dropdown>
    </span>
  );
}
