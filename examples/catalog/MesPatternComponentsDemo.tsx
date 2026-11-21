import { useState } from 'react';
import { Alert, Button, Form, Input, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  BatchSelectionSummary,
  ContextualHelp,
  DetailHeader,
  DetailTable,
  FormDrawer,
  InfoCard,
  MesDetailPageContainer,
  MesUiProvider,
  TabsPanel,
  type MesStatusEnum,
} from '../../src/mes';

type DemoRecord = {
  id: string;
  documentNo: string;
  partner: string;
  status: string;
  amount: number;
};

const records: DemoRecord[] = [
  { id: '1', documentNo: 'SO-2026-0142', partner: '苏州示例客户', status: 'in_progress', amount: 1280 },
  { id: '2', documentNo: 'SO-2026-0143', partner: '昆山示例客户', status: 'completed', amount: 960 },
];

const statusMap: MesStatusEnum = {
  in_progress: { text: '进行中', status: 'Processing' },
  completed: { text: '已完成', status: 'Success' },
};

export function MesPatternComponentsDemo() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <MesUiProvider hasPermission={(permission) => permission !== 'mes:amount:read'}>
      <SectionCard title="MES 信息与表单模式">
        <Typography.Paragraph type="secondary">
          展示 MES 信息卡、明细表、页签、批量选择摘要、字段帮助和表单抽屉的公开契约。
        </Typography.Paragraph>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <DetailHeader
            title="SO-2026-0142"
            status={{ value: records[0].status, enumMap: statusMap }}
            onBack={() => undefined}
            extra={<Button>更多</Button>}
          />
          <InfoCard
            title="销售订单摘要"
            data={records[0]}
            fields={[
              { label: '订单编号', dataIndex: 'documentNo', copyable: true },
              { label: '客户', dataIndex: 'partner' },
              { label: '状态', dataIndex: 'status', valueType: 'status', enumMap: statusMap },
              { label: '金额权限示例', dataIndex: 'amount', valueType: 'amount', permission: 'mes:amount:read' },
            ]}
          />

          <DetailTable<DemoRecord>
            rowKey="id"
            remoteFn={async ({ page, pageSize }) => ({
              list: records.slice((page - 1) * pageSize, page * pageSize),
              total: records.length,
            })}
            columns={[
              { title: '订单编号', dataIndex: 'documentNo' },
              { title: '客户', dataIndex: 'partner' },
              { title: '状态', dataIndex: 'status', render: (_, row) => statusMap[row.status]?.text ?? row.status },
            ]}
          />

          <TabsPanel
            items={[
              { key: 'open', label: (count) => `进行中 ${count}`, dataSource: records.slice(0, 1), render: () => <Typography.Text>当前进行中的订单工作区</Typography.Text> },
              { key: 'done', label: (count) => `已完成 ${count}`, dataSource: records.slice(1), render: () => <Typography.Text>已完成订单工作区</Typography.Text> },
            ]}
          />

          <BatchSelectionSummary
            label="批量确认对象"
            items={records.map((item) => ({ id: item.id, documentNo: item.documentNo, detail: item.partner }))}
          />

          <Space wrap>
            <ContextualHelp label="字段口径" title="金额口径" content="金额由单据币种和税率共同决定。" />
            <Button type="primary" onClick={() => setDrawerOpen(true)}>打开表单抽屉</Button>
          </Space>
        </Space>
      </SectionCard>

      <SectionCard title="MES 详情页容器">
        <MesDetailPageContainer
          as="section"
          frame="none"
          title="SO-2026-0142"
          status={{ value: records[0].status, enumMap: statusMap }}
          onBack={() => undefined}
          actions={<Button>编辑</Button>}
          breadcrumbs={[{ title: '销售订单' }, { title: 'SO-2026-0142' }]}
          approval={<Alert type="info" showIcon message="审批状态由宿主传入" />}
          footer={
            <Space>
              <Button>取消</Button>
              <Button type="primary">保存</Button>
            </Space>
          }
        >
          <InfoCard
            title="单据信息"
            data={records[0]}
            fields={[
              { label: '订单编号', dataIndex: 'documentNo' },
              { label: '客户', dataIndex: 'partner' },
            ]}
          />
        </MesDetailPageContainer>
      </SectionCard>

      <FormDrawer
        title="编辑销售订单"
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        record={{ id: records[0].id, name: records[0].partner }}
        initialValuesMapper={(record) => ({ name: record.name })}
        titleHelpKey="formDrawer"
        updateFn={async () => undefined}
        onSuccess={() => setDrawerOpen(false)}
      >
        <Form.Item name="name" label="客户名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </FormDrawer>
    </MesUiProvider>
  );
}
