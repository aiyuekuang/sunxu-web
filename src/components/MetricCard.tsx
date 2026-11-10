import type { ReactNode } from 'react';
import { Statistic } from 'antd';
import type { StatisticProps } from 'antd';
import { ProCard } from '@ant-design/pro-components';

export type MetricCardProps = Omit<StatisticProps, 'title'> & {
  title: ReactNode;
  className?: string;
};

export function MetricCard({ title, className, ...statisticProps }: MetricCardProps) {
  return (
    <ProCard className={['sxw-metric-card', className].filter(Boolean).join(' ')} variant="outlined">
      <Statistic title={title} {...statisticProps} />
    </ProCard>
  );
}
