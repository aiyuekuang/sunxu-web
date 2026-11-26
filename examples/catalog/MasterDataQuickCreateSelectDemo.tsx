import { useCallback, useMemo, useState } from 'react';
import { Button, Drawer, Form, Input, Space, Switch, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  MasterDataQuickCreateSelect,
  MesUiProvider,
  type MasterDataQuickCreateDrawerProps,
  type MasterDataQuickCreateOption,
  type MesMasterDataQuickCreateCapabilities,
} from '../../src/business';

interface QuickCreateDemoOption extends MasterDataQuickCreateOption {
  entity: 'customer' | 'supplier';
}

const DEMO_OPTIONS: QuickCreateDemoOption[] = [
  { entity: 'customer', value: 'customer-1001', label: '华东精工' },
  { entity: 'customer', value: 'customer-1002', label: '北辰设备' },
  { entity: 'supplier', value: 'supplier-2001', label: '海岳材料' },
  { entity: 'supplier', value: 'supplier-2002', label: '远成包装' },
];

function QuickCreateDemoDrawer({
  entity,
  open,
  onOpenChange,
  onCreated,
}: MasterDataQuickCreateDrawerProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const label = entity === 'customer' ? '客户' : '供应商';

  const create = async (values: { name: string }) => {
    setSaving(true);
    try {
      const option: MasterDataQuickCreateOption = {
        value: `demo-${entity}-${Date.now()}`,
        label: values.name,
        ...(entity === 'customer'
          ? { salesRepId: 'sales-demo', paymentTerms: '月结30天' }
          : {}),
      };
      await onCreated(option);
      onOpenChange(false);
      form.resetFields();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={`新增${label}`}
      open={open}
      onClose={() => onOpenChange(false)}
      size={480}
      destroyOnHidden
      extra={
        <Button type="primary" loading={saving} onClick={() => form.submit()}>
          创建并选择
        </Button>
      }
    >
      <Form form={form} layout="vertical" onFinish={(values) => void create(values)}>
        <Form.Item
          label={`${label}名称`}
          name="name"
          rules={[{ required: true, message: `请输入${label}名称` }]}
        >
          <Input autoFocus placeholder={`输入${label}名称`} />
        </Form.Item>
        {entity === 'customer' ? (
          <Typography.Text type="secondary">
            创建结果会附带宿主提供的默认销售员与收款条件，并回填到当前表单。
          </Typography.Text>
        ) : null}
      </Form>
    </Drawer>
  );
}

export function MasterDataQuickCreateSelectDemo() {
  const [form] = Form.useForm();
  const [canCreate, setCanCreate] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [lastChange, setLastChange] = useState('尚未触发');
  const [configReceipt, setConfigReceipt] = useState('尚未打开');
  const customerId = Form.useWatch('customerId', form);
  const supplierIds = Form.useWatch('supplierIds', form);

  const requestOptions = useCallback(
    async (
      params: Record<string, unknown> = {},
    ): Promise<Array<{ value: string; label: string }>> => {
      setRequestCount((count) => count + 1);
      const keyword = ['keyWords', 'keyword', 'search', 'searchText']
        .map((key) => params[key])
        .find((value) => typeof value === 'string') as string | undefined;
      const entity = params.entity === 'supplier' ? 'supplier' : 'customer';
      return DEMO_OPTIONS.filter((option) => option.entity === entity)
        .filter((option) =>
          keyword
            ? option.label.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())
            : true,
        )
        .map(({ value, label }) => ({ value, label }));
    },
    [],
  );

  const quickCreateCapabilities = useMemo<MesMasterDataQuickCreateCapabilities>(
    () => ({
      canCreate: () => canCreate,
      renderDrawer: (props) => <QuickCreateDemoDrawer {...props} />,
      renderConfigEntryLabel: ({ entity, children, onOpen }) => (
        <Space size={6} align="center" wrap={false}>
          <span>{children}</span>
          <Typography.Link
            href={`#${entity}-configuration`}
            onClick={(event) => {
              event.preventDefault();
              onOpen();
              setConfigReceipt(entity === 'customer' ? '客户' : '供应商');
            }}
          >
            去配置
          </Typography.Link>
        </Space>
      ),
    }),
    [canCreate],
  );

  return (
    <SectionCard title="主数据快捷新增选择器">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          新增入口、ProForm 字段回填、远程候选刷新和配置入口回调由宿主提供能力；目录用本地表单模拟客户与供应商建档。
        </Typography.Paragraph>
        <Space wrap size={16}>
          <Space size={8}>
            <Typography.Text>允许快捷新增</Typography.Text>
            <Switch checked={canCreate} onChange={setCanCreate} />
          </Space>
          <Space size={8}>
            <Typography.Text>客户字段禁用</Typography.Text>
            <Switch checked={disabled} onChange={setDisabled} />
          </Space>
        </Space>
        <MesUiProvider
          hasPermission={() => true}
          masterDataQuickCreateCapabilities={quickCreateCapabilities}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{ supplierIds: ['supplier-2001'] }}
            onValuesChange={(_, values) =>
              setLastChange(JSON.stringify(values))
            }
          >
            <MasterDataQuickCreateSelect
              name="customerId"
              label="客户"
              quickCreateEntity="customer"
              request={requestOptions}
              params={{ entity: 'customer' }}
              disabled={disabled}
              fieldProps={{
                showSearch: true,
                filterOption: false,
                onChange: (value, option) =>
                  setLastChange(JSON.stringify({ value, option })),
              }}
              placeholder="搜索客户"
            />
            <MasterDataQuickCreateSelect
              name="supplierIds"
              label="供应商（多选）"
              quickCreateEntity="supplier"
              request={requestOptions}
              params={{ entity: 'supplier' }}
              mode="multiple"
              fieldProps={{
                showSearch: true,
                filterOption: false,
                onChange: (value, option) =>
                  setLastChange(JSON.stringify({ value, option })),
              }}
              placeholder="搜索供应商"
            />
          </Form>
        </MesUiProvider>
        <Space wrap size={[16, 4]}>
          <Typography.Text type="secondary" role="status">
            远程请求次数：{requestCount}
          </Typography.Text>
          <Typography.Text type="secondary" role="status">
            配置入口回调：{configReceipt}
          </Typography.Text>
        </Space>
        <Typography.Text type="secondary" role="status">
          最近字段变化：{lastChange}
        </Typography.Text>
        <Typography.Text type="secondary">
          当前表单值：{JSON.stringify({ customerId, supplierIds })}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
