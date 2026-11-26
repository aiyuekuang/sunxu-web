import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Card, Empty, Tabs } from 'antd';
import React, { type RefObject } from 'react';
import { DetailTable, type DetailTableProps } from '../documents/DetailTable';

export interface TabItem<T = unknown> {
  key: string;
  label: string | ((count: number) => string);
  dataSource?: T[];
  remoteFn?: (params: { page: number; pageSize: number }) => Promise<{ list?: T[]; total?: number }>;
  remoteParams?: Record<string, unknown>;
  columns?: ProColumns<T>[];
  rowKey?: string;
  toolBarRender?: () => React.ReactNode[];
  render?: () => React.ReactNode;
  actionRef?: RefObject<ActionType | null | undefined>;
}

export interface TabsPanelProps {
  items: TabItem[];
  defaultActiveKey?: string;
  tabsProps?: Omit<React.ComponentProps<typeof Tabs>, 'items' | 'defaultActiveKey'>;
}

/** @sunxu-layer business; composes host tab content with the detail-table defaults.  * @sunxu-domain shared
  * @sunxu-reason Presents reusable tabs panel behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function TabsPanel({ items, defaultActiveKey, tabsProps }: TabsPanelProps) {
  const { className: tabsClassName, ...restTabsProps } = tabsProps ?? {};
  const tabItems = items.map((item) => {
    const count = item.dataSource?.length ?? 0;
    const label = typeof item.label === 'function' ? item.label(count) : item.label;
    let content: React.ReactNode;

    if (item.render) {
      content = item.render();
    } else if (!item.columns) {
      content = <Empty description="未配置 columns 或 render" />;
    } else {
      content = (
        <DetailTable
          actionRef={item.actionRef}
          dataSource={item.dataSource as Record<string, unknown>[]}
          remoteFn={item.remoteFn as DetailTableProps<Record<string, unknown>>['remoteFn']}
          remoteParams={item.remoteParams}
          columns={item.columns as ProColumns<Record<string, unknown>>[]}
          rowKey={item.rowKey ?? 'id'}
          toolBarRender={item.toolBarRender ? () => item.toolBarRender?.() ?? [] : false}
        />
      );
    }

    return { key: item.key, label, children: <div className="sxw-tabs-panel-content">{content}</div> };
  });

  return (
    <Card className="sxw-tabs-panel" style={{ marginBottom: 16 }}>
      <Tabs
        className={['sxw-tabs-panel-tabs', tabsClassName].filter(Boolean).join(' ')}
        defaultActiveKey={defaultActiveKey ?? items[0]?.key}
        items={tabItems}
        {...restTabsProps}
      />
    </Card>
  );
}
