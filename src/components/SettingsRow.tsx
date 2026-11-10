import type { ReactNode } from 'react';
import { RightOutlined } from '@ant-design/icons';

type SettingsRowBaseProps = {
  label: ReactNode;
  description?: ReactNode;
  value?: ReactNode;
  accessory?: ReactNode;
  showDisclosure?: boolean;
  className?: string;
};

export type SettingsRowProps = SettingsRowBaseProps & (
  | { href: string; onClick?: never; disabled?: never }
  | { href?: never; onClick: () => void; disabled?: boolean }
  | { href?: never; onClick?: never; disabled?: never }
);

export function SettingsRow(props: SettingsRowProps) {
  const { label, description, value, accessory, showDisclosure, className } = props;
  const content = (
    <>
      <span className="sxw-settings-row__copy">
        <span className="sxw-settings-row__label">{label}</span>
        {description ? <span className="sxw-settings-row__description">{description}</span> : null}
      </span>
      <span className="sxw-settings-row__end">
        {value ? <span className="sxw-settings-row__value">{value}</span> : null}
        {accessory}
        {showDisclosure ? <RightOutlined aria-hidden="true" className="sxw-settings-row__disclosure" /> : null}
      </span>
    </>
  );
  const sharedClassName = ['sxw-settings-row', className].filter(Boolean).join(' ');

  if ('href' in props && props.href) {
    return (
      <a className={sharedClassName} href={props.href}>
        {content}
      </a>
    );
  }
  if ('onClick' in props && props.onClick) {
    return (
      <button
        className={sharedClassName}
        type="button"
        onClick={props.onClick}
        disabled={props.disabled}
        aria-disabled={props.disabled || undefined}
      >
        {content}
      </button>
    );
  }
  return <div className={sharedClassName}>{content}</div>;
}
