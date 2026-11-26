import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Space, theme, Tooltip, type TooltipProps } from 'antd';
import React, { type ReactNode } from 'react';

export interface ContextualHelpProps {
  label?: ReactNode;
  title: ReactNode;
  content?: ReactNode;
  ariaLabel?: string;
  trigger?: TooltipProps['trigger'];
}

/**
 * @sunxu-layer composite
 * @sunxu-domain contextual-help
 * @sunxu-reason Provides accessible, on-demand guidance; errors and actionable states remain visible in the page.
 */
export function ContextualHelp({ label, title, content, ariaLabel, trigger = ['hover', 'focus'] }: ContextualHelpProps) {
  const { token } = theme.useToken();
  const accessibleName = ariaLabel ?? (typeof title === 'string' ? `查看${title}` : '查看说明');
  return (
    <Space size={4} align="center">
      {label}
      <Tooltip
        title={<Space orientation="vertical" size={4}><strong>{title}</strong>{content ? <span>{content}</span> : null}</Space>}
        trigger={trigger}
        styles={{ root: { maxWidth: 380 } }}
      >
        <Button
          className="sxw-contextual-help__trigger"
          type="text"
          size="small"
          icon={<QuestionCircleOutlined />}
          aria-label={accessibleName}
          style={{ width: 24, height: 24, padding: 0, color: token.colorTextTertiary }}
        />
      </Tooltip>
    </Space>
  );
}
