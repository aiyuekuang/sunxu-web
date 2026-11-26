import { ProfileOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Segmented } from 'antd';
import type { ComponentType } from 'react';

export type DocumentViewMode = 'detail' | 'orders';

export interface DocumentViewSwitchProps {
  value: DocumentViewMode;
  onChange: (view: DocumentViewMode) => void;
}

export interface DocumentViewSwitchConfig {
  ariaLabel: string;
  detailLabel?: string;
  ordersLabel?: string;
}

interface ConfiguredDocumentViewSwitchProps extends DocumentViewSwitchProps {
  ariaLabel: string;
  detailLabel: string;
  ordersLabel: string;
}

function isDocumentViewMode(value: string | number): value is DocumentViewMode {
  return value === 'detail' || value === 'orders';
}

function DocumentViewSwitch({
  ariaLabel,
  value,
  onChange,
  detailLabel,
  ordersLabel,
}: ConfiguredDocumentViewSwitchProps) {
  return (
    <Segmented
      aria-label={ariaLabel}
      size="small"
      value={value}
      options={[
        {
          label: detailLabel,
          value: 'detail',
          icon: <ProfileOutlined aria-hidden="true" />,
        },
        {
          label: ordersLabel,
          value: 'orders',
          icon: <UnorderedListOutlined aria-hidden="true" />,
        },
      ]}
      onChange={(nextValue) => {
        if (isDocumentViewMode(nextValue)) onChange(nextValue);
      }}
    />
  );
}

/** Build an accessible two-state document/detail switch with page-owned state. */
export function createDocumentViewSwitch({
  ariaLabel,
  detailLabel = '明细',
  ordersLabel = '单据',
}: DocumentViewSwitchConfig): ComponentType<DocumentViewSwitchProps> {
  function ConfiguredDocumentViewSwitch({ value, onChange }: DocumentViewSwitchProps) {
    return (
      <DocumentViewSwitch
        ariaLabel={ariaLabel}
        value={value}
        onChange={onChange}
        detailLabel={detailLabel}
        ordersLabel={ordersLabel}
      />
    );
  }

  ConfiguredDocumentViewSwitch.displayName = `${ariaLabel}组件`;
  return ConfiguredDocumentViewSwitch;
}
