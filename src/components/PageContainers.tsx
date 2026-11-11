import type { CSSProperties, ReactNode } from 'react';
import { PageHeader, type PageHeaderProps } from './PageHeader';
import { useWorkspaceFrame } from '../theme/WorkspaceFrame';

/** Who owns the workspace frame around a page. `inherit` follows the provider default. */
export type ScreenFrame = 'inherit' | 'page' | 'none';

export type ScreenContainerProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Use `section` when the application shell already provides the main landmark. */
  as?: 'main' | 'section';
  /** `page` owns the workspace gutter; `none` assumes the host shell owns it. */
  frame?: ScreenFrame;
  /** Fill the parent height so descendants can consume the remaining space. */
  fill?: boolean;
};

const resolveFrame = (
  frame: ScreenFrame,
  providerFrame: 'container' | 'host',
): Exclude<ScreenFrame, 'inherit'> => {
  if (frame !== 'inherit') return frame;
  return providerFrame === 'host' ? 'none' : 'page';
};

export function ScreenContainer({
  children,
  className,
  style,
  as = 'main',
  frame = 'inherit',
  fill = false,
}: ScreenContainerProps) {
  const providerFrame = useWorkspaceFrame();
  const resolvedFrame = resolveFrame(frame, providerFrame);
  const Element = as;
  return (
    <Element
      className={[
        'sxw-screen',
        resolvedFrame === 'none' ? 'sxw-screen--frame-none' : null,
        fill ? 'sxw-screen--fill' : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
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
  frame,
  fill,
}: ListScreenContainerProps) {
  return (
    <ScreenContainer
      as={as}
      frame={frame}
      fill={fill}
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
      <section
        className={[
          'sxw-list-screen__results',
          fill ? 'sxw-list-screen__results--fill' : null,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </section>
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
  frame?: ScreenFrame;
  fill?: boolean;
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
  frame,
  fill,
}: FormScreenContainerProps) {
  return (
    <ScreenContainer
      as={as}
      frame={frame}
      fill={fill}
      className={['sxw-form-screen', className].filter(Boolean).join(' ')}
    >
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
  frame?: ScreenFrame;
  fill?: boolean;
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
  frame,
  fill,
}: DetailScreenContainerProps) {
  return (
    <ScreenContainer
      as={as}
      frame={frame}
      fill={fill}
      className={['sxw-detail-screen', className].filter(Boolean).join(' ')}
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
      <div className="sxw-detail-screen__scroll">{children}</div>
      {footer ? <StickyActionBar>{footer}</StickyActionBar> : null}
    </ScreenContainer>
  );
}
