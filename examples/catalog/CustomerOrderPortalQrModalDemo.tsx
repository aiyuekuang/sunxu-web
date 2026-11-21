import { QrcodeOutlined } from '@ant-design/icons';
import { Alert, Button, Space, Typography } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { SectionCard } from '../../src';
import { CustomerOrderPortalQrModal } from '../../src/mes/components/CustomerOrderPortalQrModal';
import type { CustomerOrderPortalQrModalCapabilities } from '../../src/mes/components/customer-order-portal-qr-modal-types';

const demoCustomer = {
  id: 'customer-demo-001',
  customerCode: 'C-001',
  name: '示例客户 · 华东精密',
};

const demoFieldOptions = [
  { label: '订单号', value: 'orderNo' },
  { label: '产品名称', value: 'productName' },
  { label: '规格', value: 'spec' },
  { label: '数量', value: 'quantity' },
  { label: '明细备注', value: 'itemRemarks' },
  { label: '当前状态', value: 'status' },
  { label: '工单进度', value: 'progress' },
  { label: '交货日期', value: 'deliveryDate' },
  { label: '发货日期', value: 'shippedAt' },
];

export function CustomerOrderPortalQrModalDemo() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const tokenSequence = useRef(1);

  const capabilities = useMemo<CustomerOrderPortalQrModalCapabilities>(
    () => ({
      permissions: {
        canViewConfig: true,
        canUpdateConfig: true,
        canManageInventoryVisibility: true,
      },
      publicOrigin: 'https://portal.example.test',
      normalizePortalUrl: (url, origin) =>
        url.startsWith('/') ? `${origin}${url}` : url,
      renderQr: (value, options) => (
        <div
          style={{
            alignItems: 'center',
            border: '1px dashed var(--ant-color-border-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            height: options.size,
            justifyContent: 'center',
            marginInline: 'auto',
            maxWidth: '100%',
            padding: 12,
            width: options.size,
          }}
        >
          <QrcodeOutlined aria-hidden="true" style={{ fontSize: 40 }} />
          <Typography.Text type="secondary" style={{ textAlign: 'center' }}>
            示例占位图；扫码图像由宿主 renderer 绘制。
            <br />
            {value}
          </Typography.Text>
        </div>
      ),
      generateQr: async (customerId) => ({
        url: `/customer-orders/portal?token=demo-${customerId}-${tokenSequence.current}`,
        inventoryVisible: false,
      }),
      regenerateQr: async (customerId) => {
        tokenSequence.current += 1;
        return {
          url: `/customer-orders/portal?token=demo-${customerId}-${tokenSequence.current}`,
          inventoryVisible: false,
        };
      },
      loadConfig: async () => ({
        shippedVisibleDays: 3,
        maxVisibleOrders: 100,
        visibleFields: demoFieldOptions.map((option) => option.value),
      }),
      updateConfig: async (values) => {
        setFeedback(`已保存扫码页配置：最多显示 ${values.maxVisibleOrders} 个订单。`);
        return values;
      },
      updateInventoryVisibility: async (_customerId, inventoryVisible) => {
        setFeedback(`库存查询授权已${inventoryVisible ? '开启' : '关闭'}。`);
        return { inventoryVisible };
      },
      defaultConfigValues: {
        shippedVisibleDays: 3,
        maxVisibleOrders: 100,
        visibleFields: demoFieldOptions.map((option) => option.value),
      },
      fieldOptions: demoFieldOptions,
      constraints: {
        shippedVisibleDaysMin: 0,
        shippedVisibleDaysMax: 30,
        shippedVisibleDaysPrecision: 0,
        maxVisibleOrdersMin: 1,
        maxVisibleOrdersMax: 500,
        maxVisibleOrdersPrecision: 0,
        minimumVisibleFields: 1,
      },
      qrRendererOptions: { size: 180, level: 'M', marginSize: 2 },
      labels: {
        title: '客户订单二维码',
        qrImageDescription: '客户订单查询二维码示例占位图',
        privacyNotice:
          '客户扫码后只读查看本客户有效订单，不展示成本、单价、金额和供应链信息。库存查询仅展示本客户来料余额和预警线。',
        inventoryHeading: '库存查询授权',
        inventoryPermission: '允许客户通过二维码查询来料库存和预警',
        saveInventoryPermission: '保存库存查询授权',
        configHeading: '扫码页配置',
        shippedVisibleDays: '发货后显示天数',
        shippedVisibleDaysRequired: '请输入显示天数',
        daysSuffix: '天',
        maxVisibleOrders: '最多显示订单数',
        maxVisibleOrdersRequired: '请输入订单数',
        visibleFields: '客户可见字段',
        visibleFieldsRequired: '请至少选择一个字段',
        saveConfig: '保存配置',
        refreshQr: '刷新',
        regenerateQr: '重新生成',
        regenerateWarning: '重新生成后，已发出的旧二维码会立即失效。',
        confirmRegenerate: '重新生成',
        cancel: '取消',
      },
      messages: {
        operationFailed: '操作失败',
        updateSuccess: '更新成功',
      },
      notifySuccess: setFeedback,
      notifyError: setFeedback,
    }),
    [],
  );

  return (
    <SectionCard title="客户订单门户二维码弹窗">
      <Space direction="vertical" size={12}>
        <Typography.Paragraph type="secondary" style={{ marginBlockEnd: 0 }}>
          客户信息、权限、接口、门户 origin、URL 归一化、通知和二维码 renderer 均通过宿主能力注入。
        </Typography.Paragraph>
        <Alert
          type="info"
          showIcon
          message="示例中的二维码区域是占位预览，不可扫码；宿主需接入真实 renderer。"
        />
        <Button type="primary" onClick={() => setOpen(true)}>
          打开订单二维码
        </Button>
        {feedback ? <Typography.Text role="status">{feedback}</Typography.Text> : null}
      </Space>
      <CustomerOrderPortalQrModal
        open={open}
        customer={demoCustomer}
        onOpenChange={setOpen}
        capabilities={capabilities}
      />
    </SectionCard>
  );
}
