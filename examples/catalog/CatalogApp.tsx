import { useMemo, useState } from 'react';
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  Menu,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  BarsOutlined,
  BgColorsOutlined,
  CodeOutlined,
  MenuOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { ProCard, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import {
  ChartPanel,
  DetailCard,
  FilterBar,
  FormScreenContainer,
  ListScreenContainer,
  MetricCard,
  PermissionGuard,
  ProfileIdentity,
  SectionCard,
  SettingsRow,
  StatusTabs,
  SunxuWebProvider,
} from '../../src';
import { componentMappings, type ComponentMapping, type MappingStatus } from './componentMappings';

type PageKey = 'overview' | 'tokens' | 'containers' | 'mappings' | 'states';

const navItems: MenuProps['items'] = [
  { key: 'overview', icon: <AppstoreOutlined aria-hidden="true" />, label: '组件总览' },
  { type: 'divider' },
  { type: 'group', label: '设计系统', children: [{ key: 'tokens', icon: <BgColorsOutlined aria-hidden="true" />, label: '主题与 Token' }] },
  { type: 'group', label: '组件文档', children: [
    { key: 'containers', icon: <BarsOutlined aria-hidden="true" />, label: '页面容器' },
    { key: 'mappings', icon: <CodeOutlined aria-hidden="true" />, label: '组件映射' },
    { key: 'states', icon: <AppstoreOutlined aria-hidden="true" />, label: '信息与状态' },
  ] },
];

const demoRows = [
  { code: 'EX-001', name: '筛选与结果区', status: '进行中', owner: '容器示例' },
  { code: 'EX-002', name: '固定表单操作', status: '待处理', owner: '表单示例' },
  { code: 'EX-003', name: '详情信息分组', status: '已完成', owner: '详情示例' },
  { code: 'EX-004', name: '受控状态切换', status: '进行中', owner: '筛选示例' },
];

const demoColumns: ProColumns<(typeof demoRows)[number]>[] = [
  { title: '编号', dataIndex: 'code', width: 120 },
  { title: '示例任务', dataIndex: 'name', ellipsis: true },
  {
    title: '状态',
    dataIndex: 'status',
    width: 112,
    render: (_, record) => <Tag color={record.status === '已完成' ? 'success' : record.status === '进行中' ? 'processing' : 'default'}>{record.status}</Tag>,
  },
  { title: '组件契约', dataIndex: 'owner', width: 132 },
];

const mappingColumns: ProColumns<ComponentMapping>[] = [
  { title: 'Sunxu 组件 / 任务', dataIndex: 'source', width: 260, ellipsis: true },
  { title: 'Web 权威实现', dataIndex: 'target', width: 280, ellipsis: true },
  {
    title: '处理方式',
    dataIndex: 'status',
    width: 124,
    render: (_, row) => <Tag color={statusColor[row.status]}>{row.status}</Tag>,
  },
  { title: '职责说明', dataIndex: 'note', ellipsis: true },
];

const statusColor: Record<MappingStatus, string> = {
  ADAPTED: 'success',
  UPSTREAM: 'processing',
  HOST: 'gold',
  DEFERRED: 'default',
};

const colorTokens = [
  { name: 'Primary', light: '#007D35', dark: '#1F7A45' },
  { name: 'Primary surface', light: '#E6F7EC', dark: '#10271A' },
  { name: 'Workspace', light: '#F5F6F8', dark: '#0F0F0F' },
  { name: 'Surface', light: '#FFFFFF', dark: '#1C1C1E' },
  { name: 'Text', light: '#1A1A1A', dark: '#F5F5F5' },
  { name: 'Border', light: '#EBEBEB', dark: '#2C2C2E' },
  { name: 'Success', light: '#00B578', dark: '#00D68F' },
  { name: 'Warning', light: '#FF8F1F', dark: '#FFAA00' },
  { name: 'Error', light: '#FF3141', dark: '#FF4D4F' },
  { name: 'Info', light: '#1677FF', dark: '#4096FF' },
];

function CatalogWorkspace({
  appearance,
  onAppearanceChange,
}: {
  appearance: 'light' | 'dark';
  onAppearanceChange: (value: 'light' | 'dark') => void;
}) {
  const [page, setPage] = useState<PageKey>('overview');
  const [search, setSearch] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { message } = AntdApp.useApp();

  const filteredMappings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return componentMappings;
    return componentMappings.filter((row) =>
      `${row.source} ${row.target} ${row.status} ${row.note}`.toLowerCase().includes(query),
    );
  }, [search]);

  const openPage = (key: string) => {
    setPage(key as PageKey);
    setMobileNavOpen(false);
  };

  const menu = (
    <Menu
      className="sxw-docs-menu"
      mode="inline"
      selectedKeys={[page]}
      items={navItems}
      onClick={({ key }) => openPage(key)}
    />
  );

  const pageTitle: Record<PageKey, string> = {
    overview: '组件总览',
    tokens: '主题与 Token',
    containers: '页面容器',
    mappings: '组件映射',
    states: '信息与状态',
  };

  return (
    <div className="sxw-docs-shell" data-theme={appearance}>
      <a className="sxw-skip-link" href="#main-content">跳转到主要内容</a>
      <header className="sxw-docs-header">
        <div className="sxw-docs-brand">
          <Button
            className="sxw-docs-mobile-menu"
            type="text"
            icon={<MenuOutlined aria-hidden="true" />}
            aria-label="打开组件导航"
            onClick={() => setMobileNavOpen(true)}
          />
          <span className="sxw-docs-brand__mark" aria-hidden="true">榫</span>
          <span className="sxw-docs-brand__name">榫序 Web</span>
          <span className="sxw-docs-brand__divider" />
          <span className="sxw-docs-brand__section">组件规范库</span>
        </div>
        <Input.Search
          className="sxw-docs-search"
          aria-label="搜索组件、规范或 API"
          placeholder="搜索组件、规范或 API"
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onSearch={() => setPage('mappings')}
        />
        <div className="sxw-docs-header__theme">
          <SunOutlined aria-hidden="true" />
          <Switch
            checked={appearance === 'dark'}
            aria-label="切换深色主题"
            onChange={(checked) => onAppearanceChange(checked ? 'dark' : 'light')}
          />
          <MoonOutlined aria-hidden="true" />
        </div>
      </header>

      <div className="sxw-docs-workspace">
        <aside className="sxw-docs-sidebar" aria-label="组件文档导航">{menu}</aside>
        <main className="sxw-docs-main" id="main-content" tabIndex={-1}>
          <div className="sxw-docs-surface">
            <div className="sxw-docs-page-heading">
              <Typography.Text className="sxw-docs-eyebrow">SUNXU WEB / DOCUMENTATION</Typography.Text>
              <div className="sxw-docs-page-heading__row">
                <div>
                  <Typography.Title level={1}>{pageTitle[page]}</Typography.Title>
                  <Typography.Paragraph>
                    {page === 'overview'
                      ? '面向多个 React Web 项目的共享组件与页面容器。'
                      : page === 'mappings'
                        ? '查看 MES 基线通用组件在 Web 端的映射、可复用 API 和宿主边界。'
                        : page === 'tokens'
                          ? '沿用 Sunxu 的绿色语义主题，并通过 Ant Design ConfigProvider 应用。'
                          : page === 'containers'
                            ? '让标题、工具栏、结果区、滚动内容和固定操作各有明确归属。'
                            : '展示状态和身份组件如何组合 Ant Design 的原生反馈行为。'}
                  </Typography.Paragraph>
                </div>
                <Tag color="green">Ant Design 6 · Pro Components 3 beta</Tag>
              </div>
            </div>

            {page === 'overview' ? (
              <OverviewPage onNavigate={openPage} />
            ) : page === 'tokens' ? (
              <TokensPage appearance={appearance} />
            ) : page === 'containers' ? (
              <ContainersPage onMessage={(text) => message.success(text)} />
            ) : page === 'mappings' ? (
              <MappingsPage dataSource={filteredMappings} search={search} />
            ) : (
              <StatesPage onMessage={(text) => message.info(text)} />
            )}
          </div>
        </main>
      </div>

      <Drawer
        title="组件导航"
        placement="left"
        size={280}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        className="sxw-docs-mobile-drawer"
      >
        {menu}
      </Drawer>
    </div>
  );
}

function OverviewPage({ onNavigate }: { onNavigate: (key: string) => void }) {
  const groups = [
    { title: '页面容器', text: '列表工具栏紧邻结果区；表单与详情内容和固定操作区分离。', page: 'containers' },
    { title: '主题与 Token', text: '保留 Sunxu 语义色、间距、字号和交互尺寸，映射到 Ant Design token。', page: 'tokens' },
    { title: '组件映射', text: '直接使用上游的能力标明为 UPSTREAM；宿主和延后项也单独列出。', page: 'mappings' },
  ];

  return (
    <div className="sxw-docs-page-content">
      <Row gutter={[12, 12]}>
        {groups.map((group) => (
          <Col key={group.title} xs={24} md={8}>
            <Card
              className="sxw-docs-link-card"
              title={group.title}
              extra={<Button type="link" onClick={() => onNavigate(group.page)}>查看</Button>}
            >
              <Typography.Paragraph>{group.text}</Typography.Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      <SectionCard title="组件来源" subtitle="按职责确定唯一权威实现">
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 2 }}
          items={[
            { key: 'antd', label: 'Ant Design', children: '基础控件、表单、交互状态和反馈。' },
            { key: 'pro', label: 'Pro Components', children: 'ProTable、ProForm、ProCard 等页面模板。' },
            { key: 'sunxu', label: 'Sunxu Web', children: '主题、页面骨架和有明确复用价值的组合契约。' },
            { key: 'host', label: '宿主项目', children: '数据、路由、授权、业务规则和操作结果。' },
          ]}
        />
      </SectionCard>

      <SectionCard title="已落地的页面结构">
        <div className="sxw-docs-structure">
          <span>页面标题</span><span aria-hidden="true">→</span>
          <span>列表工具栏</span><span aria-hidden="true">→</span>
          <span>ProTable 结果</span>
        </div>
        <Typography.Text type="secondary">
          表单和详情页使用独立滚动内容与固定 footer；所有流程动作由宿主回调驱动。
        </Typography.Text>
      </SectionCard>
    </div>
  );
}

function TokensPage({ appearance }: { appearance: 'light' | 'dark' }) {
  return (
    <div className="sxw-docs-page-content">
      <SectionCard title="语义色">
        <div className="sxw-token-grid">
          {colorTokens.map((token) => {
            const color = appearance === 'dark' ? token.dark : token.light;
            return (
              <div className="sxw-token-swatch" key={token.name}>
                <span className="sxw-token-swatch__color" style={{ backgroundColor: color }} />
                <span className="sxw-token-swatch__meta">
                  <strong>{token.name}</strong>
                  <code>{color}</code>
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <SectionCard title="尺寸与间距">
            <Descriptions
              size="small"
              column={1}
              items={[
                { key: 'spacing', label: '间距', children: '4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 px' },
                { key: 'controls', label: '控件高度', children: '32 px 紧凑 · 36 px 标准 · 40 px 舒适' },
                { key: 'radius', label: '圆角', children: '4 / 6 / 10 / 14 px' },
                { key: 'motion', label: '动效', children: '150 / 220 / 300 ms；支持减少动态效果' },
              ]}
            />
          </SectionCard>
        </Col>
        <Col xs={24} lg={12}>
          <SectionCard title="字体与几何">
            <div className="sxw-token-type-sample">
              <Typography.Title level={3}>标题 24 px</Typography.Title>
              <Typography.Paragraph>正文 14 px · 使用系统 UI 字体栈</Typography.Paragraph>
              <Typography.Text type="secondary">说明文本 12–13 px · 只保留能帮助判断或操作的内容</Typography.Text>
            </div>
          </SectionCard>
        </Col>
      </Row>
      <Typography.Paragraph className="sxw-docs-note">
        Light / Dark 色值继承自 Sunxu；主题算法、控件状态和组件 token 由 Ant Design ConfigProvider 管理。
      </Typography.Paragraph>
    </div>
  );
}

function ContainersPage({ onMessage }: { onMessage: (text: string) => void }) {
  const [status, setStatus] = useState('全部');
  const [filter, setFilter] = useState('');
  const [form] = Form.useForm();
  const visibleRows = demoRows.filter((row) =>
    (status === '全部' || row.status === status) &&
    `${row.code} ${row.name}`.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="sxw-docs-page-content">
      <SectionCard title="列表容器">
        <ListScreenContainer
          title="示例记录"
          headingLevel={2}
          toolbar={
            <FilterBar
              ariaLabel="示例记录筛选"
              actions={<Button type="primary" onClick={() => onMessage('操作由宿主项目提供')}>新建示例</Button>}
            >
              <Input.Search
                aria-label="搜索示例记录"
                placeholder="编号或名称"
                allowClear
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
              <StatusTabs
                ariaLabel="按状态筛选"
                value={status}
                onChange={setStatus}
                items={[
                  { key: '全部', label: '全部', count: demoRows.length },
                  { key: '进行中', label: '进行中' },
                  { key: '待处理', label: '待处理' },
                  { key: '已完成', label: '已完成' },
                ]}
              />
            </FilterBar>
          }
        >
          <ProTable
            rowKey="code"
            columns={demoColumns}
            dataSource={visibleRows}
            search={false}
            options={false}
            toolBarRender={false}
            scroll={{ x: 620 }}
            pagination={{ pageSize: 5, showSizeChanger: false }}
          />
        </ListScreenContainer>
      </SectionCard>

      <SectionCard title="表单容器" subtitle="字段滚动区与流程 footer 分离">
        <div className="sxw-form-preview-frame">
          <FormScreenContainer
            title="编辑示例"
            headingLevel={2}
            footer={
              <Space>
                <Button onClick={() => form.resetFields()}>取消</Button>
                <Button type="primary" onClick={() => form.submit()}>保存</Button>
              </Space>
            }
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{ title: '组件契约示例', category: '页面容器' }}
              onFinish={() => onMessage('表单提交回调由宿主项目提供')}
            >
              <Form.Item label="名称" name="title" rules={[{ required: true, message: '请输入名称' }]}>
                <Input />
              </Form.Item>
              <Form.Item label="分类" name="category">
                <Select options={[{ value: '页面容器' }, { value: '筛选与列表' }, { value: '信息与状态' }]} />
              </Form.Item>
            </Form>
          </FormScreenContainer>
        </div>
      </SectionCard>
    </div>
  );
}

function MappingsPage({ dataSource, search }: { dataSource: ComponentMapping[]; search: string }) {
  return (
    <div className="sxw-docs-page-content">
      <ProCard variant="outlined" className="sxw-mapping-table-card">
        <div className="sxw-mapping-summary">
          <Typography.Text>
            {search ? `“${search}”匹配 ${dataSource.length} 项` : `当前映射 ${dataSource.length} 项`}
          </Typography.Text>
          <Space wrap size={4}>
            {!search && <Tag color="cyan">MES 基线：49 个通用组件文件</Tag>}
            <Tag color="success">ADAPTED：Sunxu Web</Tag>
            <Tag color="processing">UPSTREAM：AntD / Pro</Tag>
            <Tag color="gold">HOST：宿主</Tag>
            <Tag>DEFERRED：暂缓</Tag>
          </Space>
        </div>
        <ProTable<ComponentMapping>
          rowKey="source"
          columns={mappingColumns}
          dataSource={dataSource}
          search={false}
          options={false}
          toolBarRender={false}
          scroll={{ x: 760 }}
          pagination={{ pageSize: 12, showSizeChanger: false }}
          locale={{ emptyText: search ? '没有匹配的组件' : '没有组件映射' }}
          size="small"
        />
      </ProCard>
      <Typography.Paragraph className="sxw-docs-note">
        同职责的 Ant Design / Pro Components 组件由上游拥有；Sunxu Web 仅维护有稳定跨项目价值的页面组合契约。
      </Typography.Paragraph>
    </div>
  );
}

function StatesPage({ onMessage }: { onMessage: (text: string) => void }) {
  const [chartState, setChartState] = useState<'ready' | 'loading' | 'empty' | 'error'>('ready');
  const [permitted, setPermitted] = useState(true);

  return (
    <div className="sxw-docs-page-content">
      <SectionCard title="状态预览">
        <div className="sxw-state-toolbar">
          <Typography.Text>图表面板状态</Typography.Text>
          <Select
            aria-label="选择图表面板状态"
            value={chartState}
            onChange={setChartState}
            options={[
              { value: 'ready', label: '内容' },
              { value: 'loading', label: '加载中' },
              { value: 'empty', label: '空结果' },
              { value: 'error', label: '错误' },
            ]}
            style={{ width: 140 }}
          />
        </div>
        <ChartPanel
          title="宿主提供的可视化插槽"
          state={chartState}
          emptyDescription="当前筛选没有结果"
          errorDescription="数据暂时不可用"
          onRetry={() => setChartState('loading')}
        >
          <div className="sxw-chart-placeholder" aria-label="示例图表区域">
            <div className="sxw-chart-placeholder__bars"><i /><i /><i /><i /><i /></div>
            <Typography.Text type="secondary">此区域由宿主图表组件渲染</Typography.Text>
          </div>
        </ChartPanel>
      </SectionCard>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <SectionCard title="身份摘要">
            <ProfileIdentity
              displayName="示例用户"
              metadata={<span>组织名称 · 岗位名称由宿主字段提供</span>}
              onAvatarPress={() => onMessage('头像选择由宿主负责')}
            />
          </SectionCard>
        </Col>
        <Col xs={24} lg={12}>
          <SectionCard title="设置行与授权结果">
            <SettingsRow label="主题偏好" value="跟随项目设置" showDisclosure onClick={() => onMessage('主题偏好由宿主项目管理')} />
            <div className="sxw-state-permission">
              <Switch checked={permitted} aria-label="切换宿主授权结果" onChange={setPermitted} />
              <span>宿主传入的 permitted</span>
            </div>
            <PermissionGuard
              permitted={permitted}
              fallback={<Typography.Text type="secondary">宿主提供的无权内容替代项</Typography.Text>}
            >
              <Button onClick={() => onMessage('业务动作仍由宿主处理')}>授权状态允许时显示的操作</Button>
            </PermissionGuard>
          </SectionCard>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} md={12}>
          <MetricCard title="示例统计值" value={128} suffix="项" />
        </Col>
        <Col xs={24} md={12}>
          <DetailCard
            title="详情字段组合"
            items={[
              { key: 'name', label: '对象', children: '示例记录' },
              { key: 'state', label: '状态', children: '可用' },
            ]}
          />
        </Col>
      </Row>
    </div>
  );
}

export function CatalogApp() {
  const [appearance, setAppearance] = useState<'light' | 'dark'>('light');
  return (
    <SunxuWebProvider appearance={appearance}>
      <CatalogWorkspace appearance={appearance} onAppearanceChange={setAppearance} />
    </SunxuWebProvider>
  );
}
