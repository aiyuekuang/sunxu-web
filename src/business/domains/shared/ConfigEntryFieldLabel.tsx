import { Space, Typography } from 'antd';
import type { ReactNode } from 'react';

export interface ConfigEntryLinkProps {
  href?: string;
  permitted?: boolean;
  label: string;
  actionText?: string;
  onOpen?: () => void;
}

/** A host maintenance-page link whose route and permission decision are host supplied. */
/**
 * @sunxu-layer business
 * @sunxu-domain shared
 * @sunxu-reason Presents reusable config entry link behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function ConfigEntryLink({
  href,
  permitted = false,
  label,
  actionText = '去配置',
  onOpen,
}: ConfigEntryLinkProps) {
  if (!permitted || !href) return null;

  return (
    <Typography.Link
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${actionText}：新标签页打开${label}`}
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

export interface ConfigEntryFieldLabelProps
  extends Omit<ConfigEntryLinkProps, 'label' | 'actionText'> {
  children: ReactNode;
  /** Host-computed visibility for the shortcut; defaults to visible when permitted. */
  show?: boolean;
}

/** host field label with an optional host-authorized configuration shortcut. */
/**
 * @sunxu-layer business
 * @sunxu-domain shared
 * @sunxu-reason Presents reusable config entry field label behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function ConfigEntryFieldLabel({
  children,
  href,
  permitted,
  show = true,
  onOpen,
}: ConfigEntryFieldLabelProps) {
  if (!show || !permitted || !href) return <>{children}</>;
  const labelText = typeof children === 'string' ? children : '当前选项';
  return (
    <Space size={6} align="center" wrap={false}>
      <span>{children}</span>
      <ConfigEntryLink
        href={href}
        permitted={permitted}
        label={labelText}
        onOpen={onOpen}
      />
    </Space>
  );
}
