import { useState } from 'react';
import { Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import { ScanAwareInput } from '../../src/mes';

export function ScanAwareInputDemo() {
  const [value, setValue] = useState('');
  const [lastScan, setLastScan] = useState('尚未扫码');

  return (
    <SectionCard title="扫码输入框">
      <Typography.Paragraph type="secondary">
        聚焦后监听键盘楔子扫码枪输入，扫描流以 Enter、数字键盘 Enter 或 Tab 结束；失焦或禁用后停止监听。普通键盘输入仍按 Ant Design Input 行为处理。
      </Typography.Paragraph>
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        <ScanAwareInput
          value={value}
          placeholder="聚焦后扫码；也可手工输入"
          onChange={(event) => setValue(event.target.value)}
          onScan={(code) => setLastScan(code)}
        />
        <Typography.Text type="secondary" aria-live="polite">
          当前输入：{value || '空'}；最近扫码：{lastScan}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
