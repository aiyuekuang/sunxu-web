import type { CSSProperties, ReactNode } from 'react';
import { PageHeader, type PageHeaderProps } from './PageHeader';

export type ScreenContainerProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Use `section` when the application shell already provides the main landmark. */
  as?: 'main' | 'section';
};

export function ScreenContainer({
  children,
  className,
  style,
  as = 'main',
}: ScreenContainerProps) {
  const Element = as;
  return (
    <Element className={['sxw-screen', className].filter(Boolean).join(' ')} style={style}>
      {children}
    </Element>
  );
}

export type ListScreenContainerProps = Omit<ScreenContainerProps, 'children'> & {
  title?: string;
  headingLevel?: PageHeaderProps['headingLevel'];
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: PageHeaderProps['breadcrumbs'];
  toolbar?: ReactNode;
  children: ReactNode;
};

export function ListScreenContainer({
  title,
  headingLevel,
  description,
  actions,
  breadcrumbs,
  toolbar,
  children,
  className,
  as,
}: ListScreenContainerProps) {
  return (
    <ScreenContainer
      as={as}
      className={['sxw-list-screen', className].filter(Boolean).join(' ')}
    >
      {title ? (
        <PageHeader
          title={title}
          headingLevel={headingLevel}
          description={description}
          actions={actions}
          breadcrumbs={breadcrumbs}
        />
      ) : null}
      {toolbar ? <div className="sxw-list-screen__toolbar">{toolbar}</div> : null}
      <section className="sxw-list-screen__results">{children}</section>
    </ScreenContainer>
  );
}

export type StickyActionBarProps = {
  children: ReactNode;
  className?: string;
};

export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return (
    <footer className={['sxw-sticky-action-bar', className].filter(Boolean).join(' ')}>
      {children}
    </footer>
  );
}

export type FormScreenContainerProps = {
  title?: string;
  headingLevel?: PageHeaderProps['headingLevel'];
  description?: ReactNode;
  breadcrumbs?: PageHeaderProps['breadcrumbs'];
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  as?: 'main' | 'section';
};

export function FormScreenContainer({
  title,
  headingLevel,
  description,
  breadcrumbs,
  children,
  footer,
  className,
  as,
}: FormScreenContainerProps) {
  return (
    <ScreenContainer as={as} className={['sxw-form-screen', className].filter(Boolean).join(' ')}>
      {title ? <PageHeader title={title} headingLevel={headingLevel} description={description} breadcrumbs={breadcrumbs} /> : null}
      <div className="sxw-form-screen__scroll">{children}</div>
      {footer ? <StickyActionBar>{footer}</StickyActionBar> : null}
    </ScreenContainer>
  );
}

export type DetailScreenContainerProps = {
  title?: string;
  headingLevel?: PageHeaderProps['headingLevel'];
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: PageHeaderProps['breadcrumbs'];
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  as?: 'main' | 'section';
};

export function DetailScreenContainer({
  title,
  headingLevel,
  description,
  actions,
  breadcrumbs,
  children,
  footer,
  className,
  as,
}: DetailScreenContainerProps) {
  return (
    <ScreenContainer as={as} className={['sxw-detail-screen', className].filter(Boolean).join(' ')}>
      {title ? (
        <PageHeader
          title={title}
          headingLevel={headingLevel}
          description={description}
          actions={actions}
          breadcrumbs={breadcrumbs}
        />
      ) : null}
      <div className="sxw-detail-screen__scroll">{children}</div>
      {footer ? <StickyActionBar>{footer}</StickyActionBar> : null}
    </ScreenContainer>
  );
}
