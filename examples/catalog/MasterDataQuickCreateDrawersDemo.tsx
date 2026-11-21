import { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  CustomerQuickCreateDrawer,
  MesUiProvider,
  SupplierQuickCreateDrawer,
  type MesMasterDataQuickCreateCapabilities,
} from '../../src/mes';

export function MasterDataQuickCreateDrawersDemo() {
  const [customerOpen, setCustomerOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [lastCreated, setLastCreated] = useState('尚未新建主数据');
  const capabilities: MesMasterDataQuickCreateCapabilities = {
    canCreate: () => true,
    renderDrawer: () => null,
    forms: {
      createCustomer: async (values) => ({
        id: 'customer-demo-001',
        name: String(values.name ?? '示例客户'),
        salesRepId: String(values.salesRepId ?? '') || null,
        paymentTerms: String(values.paymentTerms ?? '') || null,
      }),
      createSupplier: async (values) => ({
        id: 'supplier-demo-001',
        name: String(values.name ?? '示例供应商'),
      }),
      requestDictionaryOptions: async (typeCode) => [
        { label: `${typeCode} 示例项`, value: 'demo-option' },
      ],
      requestUserOptions: async () => [{ label: '示例业务员', value: 'user-demo' }],
      getFieldHelpProps: (label) => ({ label }),
    },
  };

  return (
    <SectionCard title="客户与供应商快速新建">
      <Typography.Paragraph type="secondary">
        表单字段、必填和格式校验、字典候选、销售/采购负责人回显以及创建后回选由 Sunxu MES 套件承载；请求和字段说明由宿主注入。
      </Typography.Paragraph>
      <Space wrap>
        <Button onClick={() => setCustomerOpen(true)}>新建客户</Button>
        <Button onClick={() => setSupplierOpen(true)}>新建供应商</Button>
        <Typography.Text role="status" aria-live="polite">
          {lastCreated}
        </Typography.Text>
      </Space>
      <MesUiProvider hasPermission={() => true} masterDataQuickCreateCapabilities={capabilities}>
        <CustomerQuickCreateDrawer
          open={customerOpen}
          onOpenChange={setCustomerOpen}
          onCreated={(option) => setLastCreated(`已创建客户：${option.label}`)}
        />
        <SupplierQuickCreateDrawer
          open={supplierOpen}
          onOpenChange={setSupplierOpen}
          onCreated={(option) => setLastCreated(`已创建供应商：${option.label}`)}
        />
      </MesUiProvider>
    </SectionCard>
  );
}
