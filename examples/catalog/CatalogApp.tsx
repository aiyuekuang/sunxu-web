import { lazy, Suspense, useMemo, useState } from 'react';
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Input,
  Menu,
  Row,
  Spin,
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
import { SectionCard, SunxuWebProvider } from '../../src';
import { componentMappings, type ComponentMapping } from './componentMappings';
const CrudListWorkbenchPage = lazy(() =>
  import('./CrudListWorkbenchPage').then((module) => ({
    default: module.CrudListWorkbenchPage,
  })),
);
const EditableDetailTablePage = lazy(() =>
  import('./EditableDetailTablePage').then((module) => ({
    default: module.EditableDetailTablePage,
  })),
);
const TextControlsPage = lazy(() =>
  import('./TextControlsPage').then((module) => ({
    default: module.TextControlsPage,
  })),
);
const BusinessComponentsPage = lazy(() =>
  import('./BusinessComponentsPage').then((module) => ({
    default: module.BusinessComponentsPage,
  })),
);
const TableSummaryPage = lazy(() =>
  import('./TableSummaryPage').then((module) => ({
    default: module.TableSummaryPage,
  })),
);
const ResizableTablePage = lazy(() =>
  import('./ResizableTablePage').then((module) => ({
    default: module.ResizableTablePage,
  })),
);
const HostInjectedControlsDemo = lazy(() =>
  import('./HostInjectedControlsDemo').then((module) => ({
    default: module.HostInjectedControlsDemo,
  })),
);
const TokensPage = lazy(() => import('./TokensPage').then((module) => ({ default: module.TokensPage })));
const ContainersPage = lazy(() => import('./ContainersPage').then((module) => ({ default: module.ContainersPage })));
const MappingsPage = lazy(() => import('./MappingsPage').then((module) => ({ default: module.MappingsPage })));
const StatesPage = lazy(() => import('./StatesPage').then((module) => ({ default: module.StatesPage })));

type PageKey = 'overview' | 'tokens' | 'containers' | 'mappings' | 'states' | 'text-controls' | 'editable-table' | 'crud-workbench' | 'table-summary' | 'business-suite' | 'host-controls' | 'resizable-table';

const navItems: MenuProps['items'] = [
  { key: 'overview', icon: <AppstoreOutlined aria-hidden="true" />, label: '组件总览' },
  { type: 'divider' },
  { type: 'group', label: '设计系统', children: [{ key: 'tokens', icon: <BgColorsOutlined aria-hidden="true" />, label: '主题与 Token' }] },
  { type: 'group', label: '组件文档', children: [
    { key: 'containers', icon: <BarsOutlined aria-hidden="true" />, label: '页面容器' },
    { key: 'mappings', icon: <CodeOutlined aria-hidden="true" />, label: '组件映射' },
    { key: 'states', icon: <AppstoreOutlined aria-hidden="true" />, label: '信息与状态' },
    { key: 'text-controls', icon: <CodeOutlined aria-hidden="true" />, label: '选择与文本' },
    { key: 'editable-table', icon: <BarsOutlined aria-hidden="true" />, label: '可编辑明细' },
    { key: 'crud-workbench', icon: <BarsOutlined aria-hidden="true" />, label: 'CRUD 列表工作台' },
    { key: 'table-summary', icon: <BarsOutlined aria-hidden="true" />, label: '表格合计与结果摘要' },
    { key: 'business-suite', icon: <AppstoreOutlined aria-hidden="true" />, label: '业务复合组件' },
    { key: 'host-controls', icon: <AppstoreOutlined aria-hidden="true" />, label: '宿主注入能力' },
    { key: 'resizable-table', icon: <BarsOutlined aria-hidden="true" />, label: '扩展表格组件' },
  ] },
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
    'text-controls': '选择与文本',
    'editable-table': '可编辑明细',
    'crud-workbench': 'CRUD 列表工作台',
    'table-summary': '表格合计与结果摘要',
    'business-suite': '业务复合组件',
    'host-controls': '宿主注入能力',
    'resizable-table': '扩展表格组件',
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
                        ? '查看 Sunxu Web 公共组件的目录、上游映射和宿主接入边界。'
                        : page === 'tokens'
                          ? '沿用 Sunxu 的绿色语义主题，并通过 Ant Design ConfigProvider 应用。'
                          : page === 'containers'
                            ? '让标题、工具栏、结果区、滚动内容和固定操作各有明确归属。'
                              : page === 'text-controls'
                                ? '查看远程候选搜索与长文本展开的公开组件契约。'
                            : page === 'editable-table'
                              ? '查看明细行编辑、选择和批量字段设置的公开契约。'
                              : page === 'crud-workbench'
                                ? '组合分类、快捷筛选、视图、筛选抽屉与 ProTable；查询和业务动作由宿主控制。'
                                : page === 'table-summary'
                                  ? '查看列合计、跟随结果行的多单位汇总和简短分页摘要。'
                                : page === 'business-suite'
                                  ? '按业务领域组合的可复用组件；候选请求、权限结果和提交动作由宿主注入。'
                                  : page === 'host-controls'
                                    ? '查看状态、报表快捷范围、配置入口、字典选择和导出控件的宿主注入契约。'
                                  : page === 'resizable-table'
                                    ? '查看表格列宽、排序、行号、金额显隐刷新、空态和导出布局；单列表视口高度统一由 CRUD 工作台的 fill 模式管理。'
                                  : '展示状态和身份组件如何组合 Ant Design 的原生反馈行为。'}
                  </Typography.Paragraph>
                </div>
                <Tag color="green">Ant Design 6 · Pro Components 3 beta</Tag>
              </div>
            </div>

            <Suspense fallback={<CatalogPageLoading />}>
              {page === 'overview' ? (
                <OverviewPage onNavigate={openPage} />
              ) : page === 'tokens' ? (
                <TokensPage appearance={appearance} />
              ) : page === 'containers' ? (
                <ContainersPage onMessage={(text) => message.success(text)} />
              ) : page === 'mappings' ? (
                <MappingsPage dataSource={filteredMappings} search={search} />
              ) : page === 'text-controls' ? (
                <TextControlsPage />
              ) : page === 'editable-table' ? (
                <EditableDetailTablePage />
              ) : page === 'crud-workbench' ? (
                <CrudListWorkbenchPage />
              ) : page === 'table-summary' ? (
                <TableSummaryPage />
              ) : page === 'business-suite' ? (
                <BusinessComponentsPage />
              ) : page === 'host-controls' ? (
                <HostInjectedControlsDemo />
              ) : page === 'resizable-table' ? (
                <ResizableTablePage />
              ) : (
                <StatesPage onMessage={(text) => message.info(text)} />
              )}
            </Suspense>
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

function CatalogPageLoading() {
  return (
    <div className="sxw-docs-route-loading" role="status" aria-live="polite">
      <Spin size="small" />
      <Typography.Text type="secondary">正在加载组件示例…</Typography.Text>
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

export function CatalogApp() {
  const [appearance, setAppearance] = useState<'light' | 'dark'>('light');
  return (
    <SunxuWebProvider appearance={appearance} componentSize="middle">
      <CatalogWorkspace appearance={appearance} onAppearanceChange={setAppearance} />
    </SunxuWebProvider>
  );
}
