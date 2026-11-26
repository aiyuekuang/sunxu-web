import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import React from 'react';
import { StatusDisplay, type StatusMap } from '../../../components/StatusDisplay';

export interface DetailHeaderProps {
  onBack?: (() => void) | false;
  title?: string;
  status?: { value?: string | null; enumMap: StatusMap };
  children?: React.ReactNode;
  extra?: React.ReactNode;
}

/** @sunxu-layer business; provides the host detail title, optional back action, status and action slots.  * @sunxu-domain documents
  * @sunxu-reason Presents reusable detail header behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function DetailHeader({ onBack, title, status, children, extra }: DetailHeaderProps) {
  const showBack = typeof onBack === 'function';
  const hasLeft = Boolean(showBack || title || status);
  const hasRight = Boolean(children || extra);
  if (!hasLeft && !hasRight) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
      {hasLeft ? (
        <Space size="middle" wrap style={{ flex: '1 1 280px', minWidth: 0 }}>
          {showBack ? <Button icon={<ArrowLeftOutlined />} onClick={onBack}>返回</Button> : null}
          {title ? <Typography.Title level={4} style={{ margin: 0 }}>{title}</Typography.Title> : null}
          {status?.value ? <StatusDisplay value={status.value} enumMap={status.enumMap} /> : null}
        </Space>
      ) : null}
      {hasRight ? (
        <Space size="small" wrap style={{ justifyContent: 'flex-end', marginLeft: 'auto' }}>
          {children}
          {extra}
        </Space>
      ) : null}
    </div>
  );
}
