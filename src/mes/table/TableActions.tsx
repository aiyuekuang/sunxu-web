import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, Space } from 'antd';
import type { ItemType } from 'antd/es/menu/interface';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { isInteractiveActionNode } from './actionNodes';

interface TableActionsProps {
  /** Action nodes array (supports falsy values from conditional rendering) */
  actions: React.ReactNode[];
  /** 保留兼容参数；列表操作统一收进“更多”菜单。 */
  max?: number;
}

const actionSpaceStyle: React.CSSProperties = {
  maxWidth: '100%',
  whiteSpace: 'nowrap',
};

/**
 * 操作菜单同时兼容 Button、a、PermissionButton、Popconfirm 及 ModalForm trigger。
 * 菜单行留白被点击时，需要把事件转给这些组件最终渲染出的真实交互元素。
 */
const ACTION_TRIGGER_SELECTOR = [
  'button:not(:disabled)',
  'a:not([aria-disabled="true"])',
  'input:not(:disabled)',
  '[role="button"]:not([aria-disabled="true"])',
].join(',');

/**
 * Table action column component with overflow dropdown.
 *
 * 所有列表行操作统一收入“更多”(⋮)菜单，避免按操作数量平铺不同按钮。
 *
 * @example
 * render: (_, record) => (
 *   <TableActions
 *     actions={[
 *       <Button key="detail" type="link" size="small">详情</Button>,
 *       record.status === 'draft' && <Button key="edit" type="link" size="small">编辑</Button>,
 *       <Popconfirm key="delete" title="确认删除？" onConfirm={handleDelete}>
 *         <Button type="link" size="small" danger>删除</Button>
 *       </Popconfirm>,
 *     ]}
 *   />
 * )
 */
const TableActions: React.FC<TableActionsProps> = ({ actions, max = 3 }) => {
  const actionNodeRefs = useRef(new Map<React.Key, HTMLSpanElement>());
  const [open, setOpen] = useState(false);
  const validActions = useMemo(
    () =>
      actions.filter(
        (action): action is React.ReactElement =>
          React.isValidElement(action) && isInteractiveActionNode(action),
      ),
    [actions],
  );

  const setActionNodeRef = useCallback(
    (key: React.Key, node: HTMLSpanElement | null) => {
      if (node) {
        actionNodeRefs.current.set(key, node);
      } else {
        actionNodeRefs.current.delete(key);
      }
    },
    [],
  );

  const handleMenuItemClick = useCallback(
    (key: React.Key, domEvent: React.SyntheticEvent<HTMLElement>) => {
      setOpen(false);
      const target = domEvent.target;
      if (
        target instanceof Element &&
        target.closest(ACTION_TRIGGER_SELECTOR)
      ) {
        return;
      }

      actionNodeRefs.current
        .get(key)
        ?.querySelector<HTMLElement>(ACTION_TRIGGER_SELECTOR)
        ?.click();
    },
    [],
  );

  const handleActionClickCapture = useCallback(() => {
    // 操作节点会阻止冒泡，避免触发表格行点击；因此不能依赖 Dropdown
    // 默认的菜单项点击事件来关闭。捕获阶段先收起菜单，再继续执行详情、
    // 弹窗或确认操作，避免下拉层残留在新界面上。
    setOpen(false);
  }, []);

  if (validActions.length === 0) return null;

  // `max` 只为兼容既有调用保留；产品规范要求不平铺列表动作。
  void max;
  const overflowActions = validActions;

  const menuItems: ItemType[] = overflowActions.map((action, index) => {
    // React.Children.toArray 会在每一层重新生成 `.0/.1` 这样的 key，递归展平
    // 嵌套片段后可能撞车；菜单项按最终顺序编号，保证同一渲染内唯一。
    const key = `action-${index}`;
    return {
      key,
      label: (
        <span
          ref={(node) => setActionNodeRef(key, node)}
          onClickCapture={handleActionClickCapture}
        >
          {action}
        </span>
      ),
      onClick: ({ domEvent }) => handleMenuItemClick(key, domEvent),
    };
  });

  return (
    <Space
      size={4}
      style={actionSpaceStyle}
      onClick={(event) => event.stopPropagation()}
    >
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        open={open}
        onOpenChange={setOpen}
      >
        {/* 纯图标按钮必须给可访问名，否则读屏只会读出「button」 */}
        <Button
          type="link"
          size="small"
          aria-label="更多操作"
          title="更多操作"
          icon={<MoreOutlined />}
        />
      </Dropdown>
    </Space>
  );
};

export default TableActions;
