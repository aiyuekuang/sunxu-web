import { Form, InputNumber } from 'antd';
import { SectionCard } from '../../src';
import {
  AllowedEquipmentPriorityField,
  MesUiProvider,
  type MesAllowedEquipmentPriorityCapabilities,
} from '../../src/mes';

const equipment = [
  {
    id: 'equipment-lathe-01',
    code: 'LATHE-01',
    name: '数控车床 01',
    equipmentType: 'lathe',
    workCenter: { name: '车削中心' },
  },
  {
    id: 'equipment-lathe-02',
    code: 'LATHE-02',
    name: '数控车床 02',
    equipmentType: 'lathe',
    workCenter: { name: '车削中心' },
  },
];

const capabilities: MesAllowedEquipmentPriorityCapabilities = {
  requestEquipmentDetail: async ({ id }) =>
    equipment.find((item) => item.id === id) ?? {
      id,
      name: '历史设备',
    },
  requestEquipmentList: async ({ page, pageSize, keyword }) => {
    const filtered = equipment.filter((item) =>
      `${item.code} ${item.name}`.toLowerCase().includes((keyword ?? '').toLowerCase()),
    );
    return {
      list: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
    };
  },
  requestShiftCalendars: async () => ({
    list: [
      { id: 'day', name: '白班', isActive: true, startTime: '08:00', endTime: '17:00' },
      { id: 'night', name: '夜班', isActive: true, startTime: '20:00', endTime: '05:00' },
      { id: 'inactive', name: '旧班次', isActive: false, startTime: '18:00', endTime: '20:00' },
    ],
    total: 3,
  }),
  equipmentTypeLabels: { lathe: '车床' },
  pagination: { defaultPageSize: 20, showSizeChanger: true },
};

function HiddenJsonFormValue({ value }: { value?: unknown }) {
  return <input type="hidden" value={JSON.stringify(value ?? [])} readOnly />;
}

export function AllowedEquipmentPriorityFieldDemo() {
  return (
    <SectionCard title="允许设备与优先级">
      <Form
        layout="vertical"
        initialValues={{
          standardTime: 2.5,
          allowedEquipmentIds: ['equipment-lathe-01'],
          equipmentTimeProfiles: [
            {
              equipmentId: 'equipment-lathe-01',
              shiftCalendarId: 'inactive',
              standardTime: 3.2,
            },
          ],
        }}
      >
        <Form.Item name="standardTime" label="工序默认单件工时（分钟/件）">
          <InputNumber readOnly />
        </Form.Item>
        <Form.Item name="equipmentTimeProfiles" hidden>
          <HiddenJsonFormValue />
        </Form.Item>
        <MesUiProvider
          hasPermission={() => true}
          allowedEquipmentPriorityCapabilities={capabilities}
        >
          <Form.Item name="allowedEquipmentIds" label="排产设备">
            <AllowedEquipmentPriorityField equipmentType="lathe" workCenterId="turning-center" />
          </Form.Item>
        </MesUiProvider>
      </Form>
    </SectionCard>
  );
}
