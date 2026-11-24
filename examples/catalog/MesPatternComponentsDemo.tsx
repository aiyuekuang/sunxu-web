import { useState } from 'react';
import { AppstoreOutlined, BellOutlined, MobileOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Form,
  Input,
  Space,
  Tag,
  Typography,
} from 'antd';
import { HeaderActionButton, SectionCard } from '../../src';
import {
  BatchSelectionSummary,
  ContextualHelp,
  DetailHeader,
  DetailTable,
  FormDrawer,
  InfoCard,
  MesAnnouncementBanner,
  MesAppDownloadPanel,
  MesBusinessSideNavView,
  MesDetailPageContainer,
  MesMenuSearchInput,
  MesNotificationPanel,
  MesSupportQRCode,
  MesThemeOptionsPanel,
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
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [themeKey, setThemeKey] = useState('green');
  const [menuQuery, setMenuQuery] = useState('');
  const [sideMenuQuery, setSideMenuQuery] = useState('');
  const [navCollapsed, setNavCollapsed] = useState(false);
  return (
    <MesUiProvider hasPermission={(permission) => permission !== 'mes:amount:read'}>
      <SectionCard title="MES 信息与表单模式">
        <Typography.Paragraph type="secondary">
          展示 MES 信息卡、明细表、页签、批量选择摘要、字段帮助和表单抽屉的公开契约。
        </Typography.Paragraph>
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
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

      <SectionCard title="MES 宿主界面组件">
        <Typography.Paragraph type="secondary">
          展示宿主传入业务数据、权限结果、路由动作和二维码内容的方式。
        </Typography.Paragraph>
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <MesAnnouncementBanner
            items={[
              {
                id: 'maintenance',
                title: '设备点检安排',
                content: '本周六 20:00 至 22:00 暂停使用设备台账。',
                priority: 'important',
              },
              {
                id: 'inventory',
                title: '月底库存盘点',
                content: '请按计划完成在库物料盘点。',
              },
            ]}
            onOpen={() => undefined}
          />

          <Space wrap>
            <MesNotificationPanel
              open={notificationOpen}
              onOpenChange={setNotificationOpen}
              unreadCount={1}
              loading={false}
              items={[
                {
                  id: 'notice-1',
                  title: '采购订单待确认',
                  content: 'PO-2026-0142 等待确认。',
                  createdAtText: '5 分钟前',
                  isRead: false,
                },
              ]}
              onRead={() => setNotificationOpen(false)}
              onReadAll={() => undefined}
              onViewAll={() => setNotificationOpen(false)}
              trigger={
                <HeaderActionButton aria-label="打开示例通知">
                  <BellOutlined />
                </HeaderActionButton>
              }
            />
            <MesAppDownloadPanel
              loaded
              loading={false}
              downloadUrl="https://example.invalid/mes.apk"
              versionText="版本号 2026.11"
              serverAddress="https://mes.example.com"
              qrCode={
                <div aria-label="宿主生成的下载二维码" role="img">
                  二维码由宿主生成
                </div>
              }
            />
            <MesSupportQRCode
              account="support@example"
              layout="horizontal"
              qrCode={<div role="img" aria-label="宿主生成的联系二维码">联系二维码</div>}
            />
          </Space>

          <MesThemeOptionsPanel
            currentKey={themeKey}
            options={[
              { key: 'blue', label: '经典蓝', swatch: '#1677ff' },
              { key: 'green', label: '榫序绿', swatch: '#007D35' },
              { key: 'red', label: '活力红', swatch: '#dc2626' },
            ]}
            onSelect={setThemeKey}
          />

          <MesMenuSearchInput
            value={menuQuery}
            options={[
              {
                value: '/purchase/orders',
                title: '采购订单',
                context: '采购 / 订单管理',
              },
              {
                value: '/warehouse/stock',
                title: '库存查询',
                context: '仓储 / 库存',
              },
            ]}
            onSearch={setMenuQuery}
            onSelect={() => setMenuQuery('')}
          />

          <MesBusinessSideNavView
            activePrimaryKey="purchase"
            activePrimaryTitle="采购管理"
            primaryItems={[
              {
                key: 'purchase',
                path: '/purchase/orders',
                title: '采购',
                icon: <AppstoreOutlined />,
                active: true,
                hasChildren: true,
                sections: [],
              },
            ]}
            sections={[
              {
                key: 'documents',
                title: '采购单据',
                items: [
                  {
                    key: 'orders',
                    path: '/purchase/orders',
                    title: '采购订单',
                    active: true,
                  },
                  {
                    key: 'inquiries',
                    path: '/purchase/inquiries',
                    title: '采购询价',
                    active: false,
                  },
                ],
              },
            ]}
            collapsed={navCollapsed}
            onCollapse={setNavCollapsed}
            search={
              <MesMenuSearchInput
                value={sideMenuQuery}
                options={[]}
                onSearch={setSideMenuQuery}
                onSelect={setSideMenuQuery}
              />
            }
            onPrimarySelect={() => undefined}
            onNavigate={() => undefined}
          />

          <Space>
            <HeaderActionButton aria-label="打开移动应用示例">
              <MobileOutlined />
            </HeaderActionButton>
            <Tag color="green">权限与导航由宿主控制</Tag>
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
