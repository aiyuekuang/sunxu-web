import { App, Button, Space, Typography } from 'antd';
import { useState } from 'react';
import { SectionCard } from '../../src/components/SectionCard';
import { EquipmentFaultVerifyModal } from '../../src/mes/components/EquipmentFaultVerifyModal';
import type { EquipmentFaultVerifyCapabilities } from '../../src/mes/components/equipment-fault-verify-types';

const getFieldHelpProps: EquipmentFaultVerifyCapabilities['getFieldHelpProps'] = (
  label,
  fieldKey,
) => ({
  label,
  tooltip: {
    title:
      fieldKey === 'faultVerifyResult'
        ? '确认维修后是否已恢复到可接受运行状态；仍有异常时选择不通过并说明原因。'
        : '记录试运行、复测或仍需处理的问题，作为故障关闭或退回维修的追溯依据。',
  },
});

export function EquipmentFaultVerifyModalDemo() {
  const [open, setOpen] = useState(false);
  const { message } = App.useApp();
  const demoCapabilities: EquipmentFaultVerifyCapabilities = {
    verifyFault: async (payload) => {
      if (!payload.id) throw new Error('缺少故障单 ID');
    },
    notifySuccess: (text) => message.success(text),
    getFieldHelpProps,
  };

  return (
    <SectionCard title="设备故障验收">
      <Space orientation="vertical" size={12}>
        <Typography.Text type="secondary">
          通过 / 退回维修两个结论都要求填写验收说明；MES 服务、字段帮助和消息由宿主提供。
        </Typography.Text>
        <Button type="primary" onClick={() => setOpen(true)}>
          打开故障验收
        </Button>
      </Space>
      <EquipmentFaultVerifyModal
        open={open}
        faultId="fault-demo-001"
        onOpenChange={setOpen}
        onSuccess={() => undefined}
        capabilities={demoCapabilities}
      />
    </SectionCard>
  );
}
