import { Space, Typography } from 'antd';

export interface BatchSelectionItem {
  id: string;
  documentNo: string;
  detail?: string;
}

export interface BatchSelectionSummaryProps {
  items: BatchSelectionItem[];
  label?: string;
  maxHeight?: number;
}

/** @sunxu-layer business; displays the selected document identifiers and their context. */
export function BatchSelectionSummary({
  items,
  label = '本次涉及单据',
  maxHeight = 220,
}: BatchSelectionSummaryProps) {
  if (items.length === 0) return null;

  return (
    <Space orientation="vertical" size={6} style={{ width: '100%' }}>
      <Typography.Text type="secondary">
        {label}（{items.length}）
      </Typography.Text>
      <Space
        orientation="vertical"
        size={4}
        style={{ maxHeight, overflowY: 'auto', width: '100%' }}
      >
        {items.map((item) => (
          <Typography.Paragraph key={item.id} style={{ margin: 0 }}>
            <Typography.Text strong copyable>{item.documentNo}</Typography.Text>
            {item.detail ? (
              <Typography.Text type="secondary">{' '}· {item.detail}</Typography.Text>
            ) : null}
          </Typography.Paragraph>
        ))}
      </Space>
    </Space>
  );
}
