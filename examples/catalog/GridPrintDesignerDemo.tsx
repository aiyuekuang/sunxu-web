import { Alert, Card, Space, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { GridPrintDesigner } from '../../src/mes/components/grid-print-designer/GridPrintDesigner';
import type {
  GridDesignerField,
  GridDesignerPaperProfile,
  GridPrintDesignerDataSource,
} from '../../src/mes/components/grid-print-designer/types';
import type { GridPrintTemplateSchema } from '../../src/mes/components/grid-print-designer/schema';

const fields: GridDesignerField[] = [
  {
    businessType: 'warehouse_outbound',
    fieldPath: 'docNo',
    fieldLabel: '出库单号',
    fieldType: 'string',
    groupName: '单头',
    isArray: false,
    requiredInTemplate: true,
    visible: true,
  },
  {
    businessType: 'warehouse_outbound',
    fieldPath: 'partnerName',
    fieldLabel: '客户名称',
    fieldType: 'string',
    groupName: '单头',
    isArray: false,
    requiredInTemplate: false,
    visible: true,
  },
  {
    businessType: 'warehouse_outbound',
    fieldPath: 'createdAt',
    fieldLabel: '出库日期',
    fieldType: 'date',
    groupName: '单头',
    isArray: false,
    requiredInTemplate: false,
    visible: true,
  },
  {
    businessType: 'warehouse_outbound',
    fieldPath: 'items[].materialCode',
    fieldLabel: '物料编码',
    fieldType: 'string',
    groupName: '出库明细',
    isArray: true,
    requiredInTemplate: true,
    visible: true,
  },
  {
    businessType: 'warehouse_outbound',
    fieldPath: 'items[].materialName',
    fieldLabel: '物料名称',
    fieldType: 'string',
    groupName: '出库明细',
    isArray: true,
    requiredInTemplate: false,
    visible: true,
  },
  {
    businessType: 'warehouse_outbound',
    fieldPath: 'items[].qty',
    fieldLabel: '出库数量',
    fieldType: 'number',
    groupName: '出库明细',
    isArray: true,
    formatType: 'quantity',
    requiredInTemplate: false,
    visible: true,
  },
  {
    businessType: 'warehouse_outbound',
    fieldPath: 'items[].amount',
    fieldLabel: '金额',
    fieldType: 'number',
    groupName: '出库明细',
    isArray: true,
    formatType: 'currency',
    requiredInTemplate: false,
    visible: true,
  },
];

const sampleData = {
  docNo: 'CK-2026-00128',
  partnerName: '苏州精密设备有限公司',
  createdAt: '2026-11-21',
  items: [
    { materialCode: 'MAT-SS-025', materialName: '不锈钢阀体 DN25', qty: 12, amount: 864 },
    { materialCode: 'MAT-SEAL-004', materialName: '氟橡胶密封圈', qty: 24, amount: 96 },
    { materialCode: 'MAT-BOLT-012', materialName: '内六角螺栓 M8', qty: 48, amount: 144 },
  ],
};

const paperProfile: GridDesignerPaperProfile = {
  name: 'A4 纵向',
  widthMm: 210,
  heightMm: 297,
  orientation: 'portrait',
  marginTopMm: 10,
  marginRightMm: 10,
  marginBottomMm: 10,
  marginLeftMm: 10,
};

/** Independent fixture for exercising the designer without MES APIs or permissions. */
export function GridPrintDesignerDemo() {
  const [messageApi, messageContextHolder] = message.useMessage();
  const [value, setValue] = useState<GridPrintTemplateSchema>();
  const dataSource = useMemo<GridPrintDesignerDataSource>(
    () => ({
      loadFields: async ({ businessType }) =>
        fields.filter((field) => field.businessType === businessType),
      loadSampleData: async ({ businessType }) =>
        businessType === 'warehouse_outbound' ? sampleData : {},
      onLoadError: () => messageApi.error('演示打印字段加载失败'),
    }),
    [messageApi],
  );

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      {messageContextHolder}
      <Alert
        showIcon
        type="info"
        message="网格打印设计器"
        description="本演示通过类型化 capability 注入打印字段和样例数据；页面权限、保存与打印由 MES 宿主负责。"
      />
      <Card>
        <Space size={16} wrap>
          <Typography.Text>
            已编辑：{value ? `${value.grid.rows.length} 行 / ${value.grid.columns.length} 列` : '等待字段加载'}
          </Typography.Text>
          <Typography.Text type="secondary">
            设计结果仅写入本地演示状态，不调用保存接口。
          </Typography.Text>
        </Space>
      </Card>
      <GridPrintDesigner
        businessName="仓库出库单"
        businessType="warehouse_outbound"
        templateType="document_flow"
        paperProfile={paperProfile}
        dataSource={dataSource}
        value={value}
        onChange={setValue}
        onPreview={() => {
          messageApi.success('样例数据已注入设计器，可检查画布预览');
        }}
      />
    </Space>
  );
}
