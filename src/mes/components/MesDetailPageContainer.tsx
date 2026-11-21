import type { ReactNode } from 'react';
import { Breadcrumb, Button, Empty, Spin } from 'antd';
import type { BreadcrumbProps } from 'antd';
import {
  DetailScreenContainer,
  type ScreenFrame,
} from '../../components/PageContainers';
import { DetailHeader, type DetailHeaderProps } from './DetailHeader';

export type MesDetailPageContentProps = {
  title?: string;
  onBack?: DetailHeaderProps['onBack'];
  status?: DetailHeaderProps['status'];
  actions?: ReactNode;
  extra?: ReactNode;
  breadcrumbs?: BreadcrumbProps['items'];
  /** Optional pre-rendered Sunxu detail header for host shell composition. */
  header?: ReactNode;
  /** Host supplied approval UI/runtime slot, rendered before the detail body. */
  approval?: ReactNode;
  /** Optional wrapper class for approval UI when a page container owns the slot. */
  approvalClassName?: string;
  children: ReactNode;
};

export type MesDetailPageContainerProps = MesDetailPageContentProps & {
  footer?: ReactNode;
  className?: string;
  as?: 'main' | 'section';
  frame?: ScreenFrame;
  fill?: boolean;
};

export type MesDetailPageStateKind = 'loading' | 'error' | 'empty';

export type MesDetailPageStateProps = {
  state: MesDetailPageStateKind;
  description?: ReactNode;
  onRetry?: () => void;
};

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-detail-page
 * @sunxu-reason Shares detail route states while loading, retry and empty-state decisions remain host controlled.
 */
export function MesDetailPageState({
  state,
  description,
  onRetry,
}: MesDetailPageStateProps) {
  if (state === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: 80 }} aria-busy="true">
        <Spin size="large" />
      </div>
    );
  }

  if (state === 'empty') {
    return <Empty description={description ?? '未找到数据'} />;
  }

  return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <Empty description={description ?? '加载失败，请重试'} />
      {onRetry ? (
        <Button type="primary" onClick={onRetry} style={{ marginTop: 16 }}>
          重试
        </Button>
      ) : null}
    </div>
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-detail-page
 * @sunxu-reason Composes detail content slots without taking ownership of an outer screen or scroll container.
 */
export function MesDetailPageContent({
  title,
  onBack,
  status,
  actions,
  extra,
  breadcrumbs,
  header,
  approval,
  approvalClassName,
  children,
}: MesDetailPageContentProps) {
  return (
    <>
      {breadcrumbs?.length ? (
        <nav aria-label="面包屑导航">
          <Breadcrumb items={breadcrumbs} />
        </nav>
      ) : null}
      {header ?? (
        <DetailHeader
          title={title}
          onBack={onBack}
          status={status}
          extra={extra}
        >
          {actions}
        </DetailHeader>
      )}
      {approval
        ? approvalClassName
          ? <div className={approvalClassName}>{approval}</div>
          : approval
        : null}
      {children}
    </>
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-detail-page
 * @sunxu-reason Composes a shared detail page frame while route, permissions, data loading and approval services stay in the host.
 *
 * MES detail-page presentation composed from shared screen primitives.
 * The host keeps data loading, route refresh, permissions and approval API
 * wiring; it passes the rendered approval panel through the `approval` slot.
 */
export function MesDetailPageContainer({
  title,
  onBack,
  status,
  actions,
  extra,
  breadcrumbs,
  header,
  approval,
  children,
  footer,
  className,
  as,
  frame,
  fill,
}: MesDetailPageContainerProps) {
  return (
    <DetailScreenContainer
      className={['sxw-mes-detail-page', className].filter(Boolean).join(' ')}
      as={as}
      frame={frame}
      fill={fill}
      footer={footer}
    >
      <MesDetailPageContent
        title={title}
        onBack={onBack}
        status={status}
        actions={actions}
        extra={extra}
        breadcrumbs={breadcrumbs}
        header={header}
        approval={approval}
        approvalClassName="sxw-mes-detail-page__approval"
      >
        {children}
      </MesDetailPageContent>
    </DetailScreenContainer>
  );
}
