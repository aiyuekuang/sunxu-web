/** @sunxu-component mes-specific @sunxu-domain quality-inspection @sunxu-reason Preserves the inspection defect form and validation while defect dictionaries, service calls, field help, and feedback remain host supplied. */
import {
  ModalForm,
  ProFormDigit,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Col, Row } from 'antd';
import type {
  QualityInspectionDefectCreatePayload,
  QualityInspectionDefectModalProps,
} from './quality-inspection-modal-types';

/** Form for adding one defect row to a quality inspection. */
export function QualityInspectionDefectModal({
  open,
  onOpenChange,
  inspectionId,
  initialQty,
  onSuccess,
  capabilities,
}: QualityInspectionDefectModalProps) {
  const handleSubmit = async (
    values: Omit<QualityInspectionDefectCreatePayload, 'inspectionId'>,
  ) => {
    const defect = await capabilities.addDefect({
      inspectionId,
      defectCode: values.defectCode ?? undefined,
      description: values.description,
      qty: values.qty,
      severity: values.severity,
      remarks: values.remarks ?? undefined,
    });
    capabilities.notifySuccess('缺陷记录已添加');
    onSuccess(defect);
    return true;
  };

  return (
    <ModalForm<Omit<QualityInspectionDefectCreatePayload, 'inspectionId'>>
      title="添加缺陷记录"
      open={open}
      width={520}
      onOpenChange={onOpenChange}
      onFinish={handleSubmit}
      initialValues={initialQty === undefined ? undefined : { qty: initialQty }}
      modalProps={{ destroyOnHidden: true }}
    >
      {capabilities.renderDictionarySelect({
        field: 'defectCode',
        name: 'defectCode',
        label: '缺陷编码',
        typeCode: 'defect_code',
        fieldHelpProps: capabilities.getFieldHelpProps('defectCode'),
        placeholder: '请选择缺陷编码',
        showSearch: true,
      })}
      <ProFormTextArea
        name="description"
        {...capabilities.getFieldHelpProps('defectDescription')}
        rules={[{ required: true, message: '请描述缺陷情况' }]}
        fieldProps={{ rows: 3 }}
        placeholder="描述缺陷的位置、表现等"
      />
      <Row gutter={16}>
        <Col span={12}>
          <ProFormDigit
            name="qty"
            {...capabilities.getFieldHelpProps('defectQty')}
            rules={[{ required: true, message: '请输入缺陷数量' }]}
            min={capabilities.inspectionQtyMin}
            fieldProps={{ precision: 4 }}
          />
        </Col>
        <Col span={12}>
          {capabilities.renderDictionarySelect({
            field: 'severity',
            name: 'severity',
            label: '严重程度',
            typeCode: 'defect_severity',
            fieldHelpProps: capabilities.getFieldHelpProps('defectSeverity'),
            required: true,
            requiredMessage: '请选择严重程度',
          })}
        </Col>
      </Row>
      <ProFormTextArea
        name="remarks"
        {...capabilities.getFieldHelpProps('defectRemarks')}
        fieldProps={{ rows: 2 }}
        placeholder="可选"
      />
    </ModalForm>
  );
}
