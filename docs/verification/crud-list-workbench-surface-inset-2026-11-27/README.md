# CrudListWorkbench 页面内容面留白验收

## 业务目标与边界

回收站是完整列表页：个人/企业分类、工作目录、搜索、结果表格和现有恢复/删除操作共同完成客户回收站任务。页面继续使用 `CrudListWorkbench` 的 `layout="page"`；这次只补齐页面内容面的内部留白契约，不改变 CRM 数据、接口、权限、状态或操作，也不新增配置项或交互。

根因是外框与内容面内距被当作同一层：Tel Admin 通过 `SunxuWebProvider workspaceFrame="host"` 和 `.admin-content` 提供工作区外框，Sunxu 的页面容器因此解析为 `sxw-screen--frame-none`（`padding: 0`）；页面级工作台虽绘制白色内容面，却没有自己的 padding，筛选和表格便从内容面边缘开始。问题在共享组件的样式契约，不在回收站业务代码。

实现把两个职责明确分开：页面级工作台继续按 `--sxw-workspace-gutter` 提供内部留白（桌面 24px、窄屏 16px）；`layout="embedded"` 继续透明、无内边距并继承父级内容面。组件目录中另有高特异性的页面演示样式曾将所有 `.sxw-list-screen` 清零；已把它收窄到普通演示容器，避免遮住页面级工作台自己的契约。

## 渲染矩阵与结果

| 模式 | 视口 | 检查状态 | 内容面内距 | 文档横向溢出 |
|---|---:|---|---:|---:|
| 页面 / `container` | 1440×1000 | 分类与状态 | 24px | 无 |
| 页面 / 宿主外框 | 1440×1000 | 分类与状态 | 24px | 无 |
| 页面 / 宿主外框 | 1440×1000 | 复杂视图、筛选侧栏 | 24px | 无 |
| 页面 / 宿主外框 | 1024×900 | 复杂视图、分类抽屉 | 24px | 无 |
| 页面 / 宿主外框 | 390×844 | 分类与状态 | 16px | 无 |
| 嵌入 | 1440×1000 | fill 表格 | 0px | 无 |
| 嵌入 | 390×844 | fill 表格 | 0px | 无 |

页面模式在 `container` 与宿主拥有外框时保持相同的内部留白；嵌入模式保持原有零留白。目录演示宿主与页面内容面之间的四边间隔为桌面 12px、窄屏 8px，均在截图中可见。几何数据、计算样式、视口溢出、截图 SHA-256 见 [measurements.json](./measurements.json)；包含四边外框和 22 个可复核 seam 的审计记录见 [spacing-audit.json](./spacing-audit.json)。

### 截图

- [桌面分类与状态（container）](./screenshots/desktop-category-container.png)
- [桌面分类与状态（宿主外框）](./screenshots/desktop-category-host.png)
- [桌面复杂视图（宿主外框）](./screenshots/desktop-complex-host.png)
- [1024px 复杂视图（宿主外框）](./screenshots/tablet-complex-host.png)
- [窄屏分类与状态（宿主外框）](./screenshots/mobile-category-host.png)
- [桌面嵌入列表](./screenshots/desktop-embedded.png)
- [窄屏嵌入列表](./screenshots/mobile-embedded.png)

### 验收边界

公开组件目录路由 `/` 已实际渲染并完成上述视口检查。Tel Admin 的 `/crm/recycle-bin` 没有在浏览器中打开：本地开发服务器显示 `/api` 和 `/gateway` 代理指向远端服务，且没有已确认的测试会话；为避免意外请求真实服务，此路由标为 `UNVERIFIED`。业务页面的 `workspaceFrame="host"`、`.admin-content` 外框 gutter（桌面 24px、窄屏断点 16px）已按源码核对，但不能替代该路由的实际渲染验收。

目录页面没有 page exception；记录到一条现有 `use-antd-resizable-header` 列宽警告，与本次留白无关。

## 验证

- `npm run typecheck`：通过。
- `npm run build:lib`：通过。
- `npm run build:catalog`：通过。
- `tel_admin: yarn build`：通过。
- `validate_spacing_audit.py spacing-audit.json`：`PASS`，22 seams；宿主/页面面四边分离通过。

截图由本地公开组件目录在 Chromium 中采集，`spacing-audit.json` 中的 SHA-256 可验证文件未被替换。
