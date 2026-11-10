# 榫序 Web · Sunxu Web

面向 React Web / PC 管理端的共享 UI 组件与页面容器库。它承接 Sunxu 的语义主题和跨项目组件契约，基础控件使用 Ant Design，复杂表单和数据页面优先组合 Ant Design Pro Components。

## 技术版本

当前直接采用新主版本：React 19.3.1、Ant Design 6.7.0 和 Ant Design Pro Components 3.1.15-9。Pro Components 3.1.15-9 目前发布在 beta tag，peer 范围支持 Ant Design 6；不要把它描述成稳定版。版本依据和更新门槛见 [`docs/dependencies.md`](./docs/dependencies.md)。

## 安装与主题

Sunxu Web 尚未发布到 npm。发布后，宿主应用按当前组合安装组件库及其 peer dependencies：

```bash
npm install sunxu-web antd@^6.7.0 @ant-design/pro-components@3.1.15-9 @ant-design/icons@^6.3.4
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

组件示例和 API 对照见 [`examples/catalog`](./examples/catalog)；完整规范见 [`docs/design-system.md`](./docs/design-system.md)、[`docs/component-contracts.md`](./docs/component-contracts.md) 和 [`docs/component-inventory.md`](./docs/component-inventory.md)。

## 页面组合

```tsx
import { Button, Input } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import {
  FilterBar,
  ListScreenContainer,
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

列表容器让工具栏紧邻结果区；数据请求、筛选值、权限和“新建”行为仍由宿主负责。若页面不需要 Sunxu 特有的组合契约，直接使用 Ant Design / Pro Components 即可，无需再套一层同义组件。

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
