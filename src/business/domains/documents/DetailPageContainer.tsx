import type { ReactNode } from 'react';
import { Breadcrumb, Button, Empty, Space, Spin } from 'antd';
import type { BreadcrumbProps } from 'antd';
import {
  DetailScreenContainer,
  type ScreenFrame,
} from '../../../components/PageContainers';
import { DetailHeader, type DetailHeaderProps } from './DetailHeader';

export type DetailPageContentProps = {
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

export type DetailPageContainerProps = DetailPageContentProps & {
  footer?: ReactNode;
  className?: string;
  as?: 'main' | 'section';
  frame?: ScreenFrame;
  fill?: boolean;
};

export type DetailPageStateKind = 'loading' | 'error' | 'empty';

export type DetailPageStateProps = {
  state: DetailPageStateKind;
  description?: ReactNode;
  onRetry?: () => void;
  onBack?: () => void;
  backLabel?: string;
};

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Shares detail route states while loading, retry and empty-state decisions remain host controlled.
 */
export function DetailPageState({
  state,
  description,
  onRetry,
  onBack,
  backLabel = '返回列表',
}: DetailPageStateProps) {
  if (state === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: 80 }} aria-busy="true">
        <Spin size="large" />
      </div>
    );
  }

  if (state === 'empty') {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Empty description={description ?? '未找到数据'} />
        {onBack ? (
          <Button onClick={onBack} style={{ marginTop: 16 }}>
            {backLabel}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <Empty description={description ?? '加载失败，请重试'} />
      {onRetry || onBack ? (
        <Space style={{ marginTop: 16 }}>
          {onRetry ? (
            <Button type="primary" onClick={onRetry}>
              重试
            </Button>
          ) : null}
          {onBack ? <Button onClick={onBack}>{backLabel}</Button> : null}
        </Space>
      ) : null}
    </div>
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Composes detail content slots without taking ownership of an outer screen or scroll container.
 */
export function DetailPageContent({
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
}: DetailPageContentProps) {
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
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Composes a shared detail page frame while route, permissions, data loading and approval services stay in the host.
 *
 * host detail-page presentation composed from shared screen primitives.
 * The host keeps data loading, route refresh, permissions and approval API
 * wiring; it passes the rendered approval panel through the `approval` slot.
 */
export function DetailPageContainer({
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
}: DetailPageContainerProps) {
  return (
    <DetailScreenContainer
      className={['sxw-detail-page', className].filter(Boolean).join(' ')}
      as={as}
      frame={frame}
      fill={fill}
      footer={footer}
    >
      <DetailPageContent
        title={title}
        onBack={onBack}
        status={status}
        actions={actions}
        extra={extra}
        breadcrumbs={breadcrumbs}
        header={header}
        approval={approval}
        approvalClassName="sxw-detail-page__approval"
      >
        {children}
      </DetailPageContent>
    </DetailScreenContainer>
  );
}
