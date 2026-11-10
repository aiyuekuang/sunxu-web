import type { ReactNode } from 'react';
import { ProCard } from '@ant-design/pro-components';

export type SectionCardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, subtitle, extra, children, className }: SectionCardProps) {
  return (
    <ProCard
      className={['sxw-section-card', className].filter(Boolean).join(' ')}
      title={title}
      subTitle={subtitle}
      extra={extra}
      variant="outlined"
      styles={{ body: { padding: 16 } }}
    >
      {children}
    </ProCard>
  );
}
