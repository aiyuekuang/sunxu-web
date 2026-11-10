import type { ReactNode } from 'react';
import { Breadcrumb, Typography } from 'antd';
import type { BreadcrumbProps } from 'antd';

export type PageHeaderProps = {
  title: string;
  headingLevel?: 1 | 2 | 3;
  description?: ReactNode;
  breadcrumbs?: BreadcrumbProps['items'];
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  headingLevel = 1,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={['sxw-page-header', className].filter(Boolean).join(' ')}>
      {breadcrumbs?.length ? <Breadcrumb items={breadcrumbs} /> : null}
      <div className="sxw-page-header__row">
        <div className="sxw-page-header__copy">
          <Typography.Title level={headingLevel} className="sxw-page-header__title">
            {title}
          </Typography.Title>
          {description ? (
            <Typography.Paragraph className="sxw-page-header__description">
              {description}
            </Typography.Paragraph>
          ) : null}
        </div>
        {actions ? <div className="sxw-page-header__actions">{actions}</div> : null}
      </div>
    </header>
  );
}
