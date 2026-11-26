import type { FormItemProps } from 'antd';

export type EquipmentFaultVerifyFieldKey =
  | 'faultVerifyResult'
  | 'faultVerificationResult';

export type EquipmentFaultVerifyFieldHelpProps = Pick<
  FormItemProps,
  'label' | 'tooltip'
>;

export interface EquipmentFaultVerifyPayload {
  id: string;
  passed: boolean;
  verificationResult: string;
}

export interface EquipmentFaultVerifyFormValues {
  verifyResult?: string;
  verificationResult?: string;
}

export interface EquipmentFaultVerifyCapabilities {
  verifyFault: (payload: EquipmentFaultVerifyPayload) => Promise<void>;
  notifySuccess: (message: string) => void;
  getFieldHelpProps: (
    label: string,
    fieldKey: EquipmentFaultVerifyFieldKey,
  ) => EquipmentFaultVerifyFieldHelpProps;
}

export interface EquipmentFaultVerifyModalProps {
  open: boolean;
  faultId?: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void | Promise<void>;
  capabilities: EquipmentFaultVerifyCapabilities;
}
