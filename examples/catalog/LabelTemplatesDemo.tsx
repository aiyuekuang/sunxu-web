import { Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  BatchLabel,
  EquipmentLabel,
  MaterialLabel,
  PackageUnitLabel,
  ToolingLabel,
  WorkOrderLabel,
} from '../../src/business';

function renderBarcode(value: string) {
  return <Typography.Text code aria-label={`条码 ${value}`}>{value}</Typography.Text>;
}

export function LabelTemplatesDemo() {
  return (
    <SectionCard title="标签模板">
      <Typography.Paragraph type="secondary">
        模板结构和字段映射由业务组件提供；实际 QRCodeSVG 绘制、单位字典和工单内部二维码值由宿主传入。
      </Typography.Paragraph>
      <Space wrap align="start">
        <MaterialLabel items={[{ code: 'M-001', name: '铝合金型材', spec: '20 × 30 mm', unit: 'PC' }]} unitLabelMap={{ PC: '件' }} renderBarcode={renderBarcode} />
        <BatchLabel items={[{ batchNo: 'LOT-2026-001', materialName: '铝合金型材', supplierName: '示例供应商', productionDate: '2026-11-20' }]} renderBarcode={renderBarcode} />
        <EquipmentLabel items={[{ code: 'LATHE-01', name: '数控车床 01', model: 'XK-500', workCenterName: '车削中心' }]} renderBarcode={renderBarcode} />
        <PackageUnitLabel items={[{ id: 'package-1', packageNo: 'PK-2026-001', materialName: '铝合金型材', materialCode: 'M-001', totalQty: 12, unit: 'PC', warehouseName: '原材料仓' }]} unitLabelMap={{ PC: '件' }} renderBarcode={renderBarcode} />
        <ToolingLabel items={[{ toolingCode: 'TOOL-01', name: '冲压模具', spec: 'A 型', type: '模具' }]} renderBarcode={renderBarcode} />
        <WorkOrderLabel items={[{ id: 'work-order-1', orderNo: 'WO-2026-001', materialName: '铝合金型材', materialCode: 'M-001', plannedQty: 20, unit: 'PC' }]} unitLabelMap={{ PC: '件' }} buildQrValue={(_type, id) => `/work-orders/${id}`} renderBarcode={renderBarcode} />
      </Space>
    </SectionCard>
  );
}
