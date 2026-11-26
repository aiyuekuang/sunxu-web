import { ProForm } from '@ant-design/pro-components';
import { SectionCard } from '../../src';
import { CompleteMaintenanceFields } from '../../src/business/domains/manufacturing/CompleteMaintenanceFields';
import type { CompleteMaintenanceFieldsCapabilities } from '../../src/business/domains/manufacturing/complete-maintenance-fields-types';

const capabilities: CompleteMaintenanceFieldsCapabilities = {
  getFieldHelpProps: (label) => ({
    label,
    tooltip: { title: `填写${label}，供保养记录和设备履历追溯。` },
  }),
};

export function CompleteMaintenanceFieldsDemo() {
  return (
    <SectionCard title="保养完成表单字段">
      <ProForm
        layout="vertical"
        submitter={false}
        initialValues={{
          steps: [
            { result: '检查润滑油位，补充至刻度范围。', remark: '' },
            { result: '', remark: '', photoFiles: [] },
          ],
          remark: '设备试运行正常。',
        }}
      >
        <CompleteMaintenanceFields
          record={{
            maintenanceTemplateCode: 'PM-MOTOR-01',
            maintenanceTemplateName: '电机月度保养',
            steps: [
              {
                id: 'step-1',
                name: '检查润滑',
                content: '检查轴承温度与润滑脂状态。',
                required: true,
              },
              {
                id: 'step-2',
                name: '拍摄铭牌与状态',
                required: false,
                photoRequired: true,
              },
            ],
          }}
          capabilities={capabilities}
        />
      </ProForm>
    </SectionCard>
  );
}
