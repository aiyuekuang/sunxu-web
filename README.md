# 榫序 Web · Sunxu Web

面向 React Web / PC 管理端的 UI 组件库，包含 Sunxu 通用组件层和宿主注入能力的 MES UI 套件。基础控件由 Ant Design 提供，复杂表单和数据页面优先组合 Ant Design Pro Components。

## 技术版本

当前直接采用新主版本：React 19.3.1、Ant Design 6.7.0 和 Ant Design Pro Components 3.1.15-9。Pro Components 3.1.15-9 目前发布在 beta tag，peer 范围支持 Ant Design 6；不要把它描述成稳定版。版本依据和更新门槛见 [`docs/dependencies.md`](./docs/dependencies.md)。

## 安装与主题

宿主应用安装组件库及其 peer dependencies。MES PDF 预览使用 React-PDF；`pdfjs-dist` 必须与 React-PDF 要求的 Worker 版本完全一致：

```bash
npm install sunxu-web antd@^6.7.0 @ant-design/pro-components@3.1.15-9 @ant-design/icons@^6.3.4 react-pdf@^10.4.1 pdfjs-dist@5.4.296
```

在应用入口引入 Ant Design reset 和 Sunxu Web 样式，并用 `SunxuWebProvider` 包裹应用：

```tsx
import 'antd/dist/reset.css';
import 'sunxu-web/styles.css';
import { SunxuWebProvider } from 'sunxu-web';

export function App() {
  return (
    <SunxuWebProvider>
      <YourRoutes />
    </SunxuWebProvider>
  );
}
```

组件示例和 API 对照见 [`examples/catalog`](./examples/catalog)。唯一权威设计规范见 [`design-system/sunxu-web/MASTER.md`](./design-system/sunxu-web/MASTER.md)；[`docs/design-system.md`](./docs/design-system.md) 是规范导航页。组件 API、迁移映射和依赖版本分别以 [`docs/component-contracts.md`](./docs/component-contracts.md)、[`docs/component-inventory.md`](./docs/component-inventory.md) 和 [`docs/dependencies.md`](./docs/dependencies.md) 为准。

通用组件和当前 MES 使用的 AntD/Pro/图标从 `sunxu-web` 根出口导入；MES 专用 UI 从 `sunxu-web/mes` 导入。请求、路由、权限判断和业务副作用由宿主提供。组件映射、覆盖进度和消费端门禁见 [`docs/component-usage-policy.md`](./docs/component-usage-policy.md)、[`docs/component-inventory.md`](./docs/component-inventory.md) 与 [`eslint-plugin-sunxu-web`](./tooling/eslint-plugin-sunxu-web/README.md)。

## 页面组合

```tsx
import {
  Button,
  FilterBar,
  Input,
  ListScreenContainer,
  ProTable,
} from 'sunxu-web';

const records = [
  { code: 'EX-001', name: '示例记录' },
];

const columns = [
  { title: '编号', dataIndex: 'code' },
  { title: '名称', dataIndex: 'name' },
];

export function RecordsPage() {
  return (
    <ListScreenContainer
      title="记录"
      toolbar={
        <FilterBar ariaLabel="记录筛选" actions={<Button type="primary">新建</Button>}>
          <Input.Search aria-label="搜索记录" placeholder="编号或名称" />
        </FilterBar>
      }
    >
      <ProTable
        rowKey="code"
        search={false}
        options={false}
        toolBarRender={false}
        columns={columns}
        dataSource={records}
      />
    </ListScreenContainer>
  );
}
```

列表容器让工具栏紧邻结果区；数据请求、筛选值、权限和“新建”行为仍由宿主负责。根出口对 Ant Design / Pro Components 只做直通导出，不复制基础控件；MES 专用 UI 通过 `sunxu-web/mes` 复用当前 MES 已有交互。

## 本地开发

```bash
npm install
npm run dev
```

目录页是可运行的组件文档示例。包与目录分别构建：

```bash
npm run typecheck
npm run build
```
