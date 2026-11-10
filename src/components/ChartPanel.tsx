import type { ReactNode } from 'react';
import { Alert, Button, Empty, Spin } from 'antd';
import { ProCard } from '@ant-design/pro-components';

export type ChartPanelState = 'ready' | 'loading' | 'empty' | 'error';

export type ChartPanelProps = {
  title?: ReactNode;
  extra?: ReactNode;
  state?: ChartPanelState;
  errorDescription?: ReactNode;
  onRetry?: () => void;
  emptyDescription?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ChartPanel({
  title,
  extra,
  state = 'ready',
  errorDescription = '内容加载失败',
  onRetry,
  emptyDescription,
  children,
  className,
}: ChartPanelProps) {
  let content = children;
  if (state === 'loading') {
    content = (
      <div className="sxw-chart-panel__state" aria-busy="true">
        <Spin />
      </div>
    );
  } else if (state === 'empty') {
    content = <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />;
  } else if (state === 'error') {
    content = (
      <Alert
        type="error"
        showIcon
        message={errorDescription}
        action={onRetry ? <Button type="link" size="small" onClick={onRetry}>重试</Button> : undefined}
      />
    );
  }

  return (
    <ProCard
      className={['sxw-chart-panel', className].filter(Boolean).join(' ')}
      title={title}
      extra={extra}
      variant="outlined"
      styles={{ body: { padding: 16 } }}
    >
      {content}
    </ProCard>
  );
}
