import type { ReactNode } from 'react';
import { Descriptions } from 'antd';
import type { DescriptionsProps } from 'antd';
import { ProCard } from '@ant-design/pro-components';

export type DetailCardProps = {
  title?: ReactNode;
  extra?: ReactNode;
  items: DescriptionsProps['items'];
  column?: DescriptionsProps['column'];
  className?: string;
};

export function DetailCard({ title, extra, items, column = 2, className }: DetailCardProps) {
  return (
    <ProCard
      className={['sxw-detail-card', className].filter(Boolean).join(' ')}
      title={title}
      extra={extra}
      variant="outlined"
      styles={{ body: { padding: 16 } }}
    >
      <Descriptions size="small" column={column} items={items} />
    </ProCard>
  );
}
