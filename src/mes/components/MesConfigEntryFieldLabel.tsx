import { Space, Typography } from 'antd';
import type { ReactNode } from 'react';

export interface MesConfigEntryLinkProps {
  href?: string;
  permitted?: boolean;
  label: string;
  actionText?: string;
  onOpen?: () => void;
}

/** A MES maintenance-page link whose route and permission decision are host supplied. */
export function MesConfigEntryLink({
  href,
  permitted = false,
  label,
  actionText = '去配置',
  onOpen,
}: MesConfigEntryLinkProps) {
  if (!permitted || !href) return null;

  return (
    <Typography.Link
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`新标签页打开${label}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpen?.();
      }}
      style={{ fontSize: 12, whiteSpace: 'nowrap' }}
    >
      {actionText}
    </Typography.Link>
  );
}

export interface MesConfigEntryFieldLabelProps
  extends Omit<MesConfigEntryLinkProps, 'label' | 'actionText'> {
  children: ReactNode;
  /** Host-computed visibility for the shortcut; defaults to visible when permitted. */
  show?: boolean;
}

/** MES field label with an optional host-authorized configuration shortcut. */
export function MesConfigEntryFieldLabel({
  children,
  href,
  permitted,
  show = true,
  onOpen,
}: MesConfigEntryFieldLabelProps) {
  if (!show || !permitted || !href) return <>{children}</>;
  const labelText = typeof children === 'string' ? children : '当前选项';
  return (
    <Space size={6} align="center" wrap={false}>
      <span>{children}</span>
      <MesConfigEntryLink
        href={href}
        permitted={permitted}
        label={labelText}
        onOpen={onOpen}
      />
    </Space>
  );
}
