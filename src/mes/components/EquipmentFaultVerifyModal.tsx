import {
  ModalForm,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import type {
  EquipmentFaultVerifyFormValues,
  EquipmentFaultVerifyModalProps,
} from './equipment-fault-verify-types';

const VERIFY_RESULT_OPTIONS = [
  { label: '验收通过', value: 'passed' },
  { label: '验收不通过', value: 'failed' },
];

/** @sunxu-component mes-specific */
export function EquipmentFaultVerifyModal({
  open,
  faultId,
  onOpenChange,
  onSuccess,
  capabilities,
}: EquipmentFaultVerifyModalProps) {
  return (
    <ModalForm<EquipmentFaultVerifyFormValues>
      title="故障验收"
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnHidden: true }}
      onFinish={async (values) => {
        if (!faultId) return false;
        const passed = values.verifyResult === 'passed';
        await capabilities.verifyFault({
          id: faultId,
          passed,
          verificationResult: values.verificationResult as string,
        });
        capabilities.notifySuccess(passed ? '验收通过' : '已退回维修');
        await onSuccess?.();
        return true;
      }}
    >
      <ProFormSelect
        name="verifyResult"
        {...capabilities.getFieldHelpProps('验收结论', 'faultVerifyResult')}
        options={VERIFY_RESULT_OPTIONS}
        rules={[{ required: true, message: '请选择验收结论' }]}
      />
      <ProFormTextArea
        name="verificationResult"
        {...capabilities.getFieldHelpProps('验收说明', 'faultVerificationResult')}
        placeholder="请填写试运行、复测或退回维修原因"
        fieldProps={{ rows: 4 }}
        rules={[{ required: true, whitespace: true, message: '请填写验收说明' }]}
      />
    </ModalForm>
  );
}
