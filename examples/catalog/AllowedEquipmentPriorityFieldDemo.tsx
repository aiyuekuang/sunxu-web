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
    ],
    total: 2,
  }),
  equipmentTypeLabels: { lathe: '车床' },
  pagination: { defaultPageSize: 20, showSizeChanger: true },
};

export function AllowedEquipmentPriorityFieldDemo() {
  return (
    <SectionCard title="允许设备与优先级">
      <Form layout="vertical" initialValues={{ standardTime: 2.5 }}>
        <Form.Item name="standardTime" label="工序默认单件工时（分钟/件）">
          <InputNumber readOnly />
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
