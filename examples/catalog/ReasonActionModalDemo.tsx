import { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import { MesUiProvider, ReasonActionModal } from '../../src/mes';

export function ReasonActionModalDemo() {
  const [open, setOpen] = useState(false);
  const [submittedReason, setSubmittedReason] = useState('尚未提交');

  return (
    <SectionCard title="需填写原因的风险操作">
      <Typography.Paragraph type="secondary">
        确认前必须填写原因；组件会去除首尾空格，保留字数限制、确认 loading 和重新打开时清空草稿。
      </Typography.Paragraph>
      <Space orientation="vertical" size={8}>
        <Button danger onClick={() => setOpen(true)}>
          撤销采购单
        </Button>
        <Typography.Text aria-live="polite">提交原因：{submittedReason}</Typography.Text>
      </Space>
      <MesUiProvider hasPermission={() => true}>
        <ReasonActionModal
          open={open}
          title="撤销采购单"
          description="撤销后将停止后续收货流程，请填写操作原因。"
          confirmText="确认撤销"
          maxLength={500}
          onCancel={() => setOpen(false)}
          onConfirm={async (reason) => {
            await new Promise((resolve) => window.setTimeout(resolve, 200));
            setSubmittedReason(reason);
            setOpen(false);
          }}
        />
      </MesUiProvider>
    </SectionCard>
  );
}
