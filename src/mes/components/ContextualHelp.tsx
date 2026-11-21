import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Space, Tooltip, type TooltipProps } from 'antd';
import React, { type ReactNode } from 'react';

export interface ContextualHelpProps {
  label?: ReactNode;
  title: ReactNode;
  content?: ReactNode;
  ariaLabel?: string;
  trigger?: TooltipProps['trigger'];
}

/**
 * @sunxu-component common
 * @sunxu-domain contextual-help
 * @sunxu-reason Provides accessible, on-demand guidance; errors and actionable states remain visible in the page.
 */
export function ContextualHelp({ label, title, content, ariaLabel, trigger = ['hover', 'focus', 'click'] }: ContextualHelpProps) {
  const accessibleName = ariaLabel ?? (typeof title === 'string' ? `查看${title}` : '查看说明');
  return (
    <Space size={4} align="center">
      {label}
      <Tooltip
        title={<Space direction="vertical" size={4}><strong>{title}</strong>{content ? <span>{content}</span> : null}</Space>}
        trigger={trigger}
        styles={{ root: { maxWidth: 380 } }}
      >
        <Button
          type="text"
          size="small"
          icon={<QuestionCircleOutlined />}
          aria-label={accessibleName}
          style={{ width: 24, height: 24, padding: 0, color: 'rgba(0, 0, 0, 0.45)' }}
        />
      </Tooltip>
    </Space>
  );
}
