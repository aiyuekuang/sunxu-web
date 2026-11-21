import type { ReactNode } from 'react';
import { Breadcrumb } from 'antd';
import type { BreadcrumbProps } from 'antd';
import {
  DetailScreenContainer,
  type ScreenFrame,
} from '../../components/PageContainers';
import { DetailHeader, type DetailHeaderProps } from './DetailHeader';

export type MesDetailPageContainerProps = {
  title?: string;
  onBack?: DetailHeaderProps['onBack'];
  status?: DetailHeaderProps['status'];
  actions?: ReactNode;
  extra?: ReactNode;
  breadcrumbs?: BreadcrumbProps['items'];
  /** Host supplied approval UI/runtime slot, rendered before the detail body. */
  approval?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  as?: 'main' | 'section';
  frame?: ScreenFrame;
  fill?: boolean;
};

/**
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
      {breadcrumbs?.length ? (
        <nav aria-label="面包屑导航">
          <Breadcrumb items={breadcrumbs} />
        </nav>
      ) : null}
      <DetailHeader
        title={title}
        onBack={onBack}
        status={status}
        extra={extra}
      >
        {actions}
      </DetailHeader>
      {approval ? (
        <div className="sxw-mes-detail-page__approval">{approval}</div>
      ) : null}
      {children}
    </DetailScreenContainer>
  );
}
