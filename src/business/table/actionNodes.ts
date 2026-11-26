import { Button, Divider, Space, Tag, Typography } from 'antd';
import * as React from 'react';

type ActionNodeProps = {
  children?: React.ReactNode;
  href?: unknown;
  onClick?: unknown;
  onConfirm?: unknown;
};

/** 纯展示组件：出现在操作列里只能是状态/说明，不是动作。 */
const STATIC_DISPLAY_TYPES = new Set<unknown>([
  Typography.Text,
  Typography.Title,
  Typography.Paragraph,
  Tag,
  Divider,
]);

/**
 * 拆出操作列里的动作节点。
 *
 * 手写操作列常用 `<Space>` 或 `<>…</>` 包裹多个动作，必须递归拆开：
 * 只拆最外层会把 `<>编辑 + 删除</>` 当成一个节点，两个动作挤进同一个菜单行。
 */
export function toActionNodes(rendered: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(rendered).flatMap((node) => {
    if (!React.isValidElement(node)) return [node];
    const props = node.props as ActionNodeProps | null;
    if (node.type === React.Fragment || node.type === Space) {
      return toActionNodes(props?.children);
    }
    return [node];
  });
}

/**
 * 节点是否会响应点击。
 *
 * 三点菜单只承载动作；状态文字、标签、占位符属于展示列，放进菜单只会得到
 * 一个点了没反应的死菜单项。已知的展示组件和纯文本直接判否，其余拿不准的
 * 组件（如自带触发器的 XxxModal）按动作保留，避免把真实入口误删。
 */
export function isInteractiveActionNode(node: React.ReactNode): boolean {
  if (!React.isValidElement(node)) return false;
  if (node.type === Button) return true;
  if (STATIC_DISPLAY_TYPES.has(node.type)) return false;

  const props = node.props as ActionNodeProps | null;
  if (
    typeof props?.onClick === 'function' ||
    typeof props?.onConfirm === 'function' ||
    typeof props?.href === 'string'
  ) {
    return true;
  }

  const children = React.Children.toArray(props?.children);
  if (children.some(isInteractiveActionNode)) return true;

  return typeof node.type !== 'string';
}
