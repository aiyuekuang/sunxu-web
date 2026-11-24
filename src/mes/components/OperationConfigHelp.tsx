/** @sunxu-component mes-specific @sunxu-domain operation-config-help @sunxu-reason Keeps compact operation-configuration labels and accessible contextual help while help copy remains host-owned. */
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip, Typography, theme } from 'antd';
import React, {
  createContext,
  type CSSProperties,
  useContext,
} from 'react';
import './operation-config-help.css';
import type {
  ConfigHelpIconProps,
  ConfigLabelProps,
  ConfigOptionTextProps,
  OperationConfigHelpCopyById,
  OperationConfigHelpProviderProps,
} from './operation-config-help-types';

const OperationConfigHelpContext =
  createContext<OperationConfigHelpCopyById | null>(null);

/**
 * Inject label and description text from the MES host's configuration-help source.
 * @sunxu-component mes-specific
 * @sunxu-domain operation-config-help
 * @sunxu-reason Keeps MES configuration copy in the host instead of storing domain text in the component library.
 */
export function OperationConfigHelpProvider({
  copyById,
  children,
}: OperationConfigHelpProviderProps) {
  return (
    <OperationConfigHelpContext.Provider value={copyById}>
      {children}
    </OperationConfigHelpContext.Provider>
  );
}

function useOperationConfigHelpCopy(id?: string) {
  const copyById = useContext(OperationConfigHelpContext);
  return id ? copyById?.[id] : undefined;
}

/** @sunxu-component mes-specific @sunxu-domain operation-config-help @sunxu-reason Shows host-supplied configuration guidance in a compact keyboard-accessible tooltip control. */
export function ConfigHelpIcon({
  id,
  label,
  description,
  className,
}: ConfigHelpIconProps) {
  const { token } = theme.useToken();
  const config = useOperationConfigHelpCopy(id);
  const helpLabel = label ?? config?.label ?? '配置项';
  const helpDescription = description ?? config?.description;

  if (!helpDescription) return null;

  const buttonStyle = {
    '--operation-config-help-color': token.colorTextTertiary,
    '--operation-config-help-active-color': token.colorPrimary,
  } as CSSProperties;

  return (
    <Tooltip
      styles={{ root: { maxWidth: 380 } }}
      placement="top"
      title={
        <span className="operationConfigTooltipContent">
          {helpDescription}
        </span>
      }
      trigger={['hover', 'focus', 'click']}
    >
      <button
        aria-label={`查看${helpLabel}业务说明`}
        className={['operationConfigHelpButton', className]
          .filter(Boolean)
          .join(' ')}
        style={buttonStyle}
        type="button"
      >
        <QuestionCircleOutlined aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

/** @sunxu-component mes-specific @sunxu-domain operation-config-help @sunxu-reason Preserves a strong configuration label with its adjacent contextual-help affordance. */
export function ConfigLabel({ id, label }: ConfigLabelProps) {
  const config = useOperationConfigHelpCopy(id);
  const resolvedLabel = label ?? config?.label ?? id;

  return (
    <span className="operationConfigLabel">
      <Typography.Text strong>{resolvedLabel}</Typography.Text>
      <ConfigHelpIcon id={id} label={resolvedLabel} />
    </span>
  );
}

/** @sunxu-component mes-specific @sunxu-domain operation-config-help @sunxu-reason Renders host-supplied option text without adding duplicate help controls inside selectable labels. */
export function ConfigOptionText({ id, label }: ConfigOptionTextProps) {
  const config = useOperationConfigHelpCopy(id);
  return <>{label ?? config?.label ?? id}</>;
}
