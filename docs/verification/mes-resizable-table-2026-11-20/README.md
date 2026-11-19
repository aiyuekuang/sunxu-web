# MES ResizableTable 渲染验收（2026-11-20）

## 范围与来源

- 页面：CatalogApp → “MES 表格组件”，覆盖 `sunxu-web/mes` 的 `ResizableProTable`、`ResizableTable`、`TableActions`、密度控制、空态、列优先级和导出布局边界。
- 行为基线：`mes-admin` 的 `main-买断版本` 提交 `e185f6b68b6d8ef94ed0b5312340e1952be5f2f1`。当前组件是基于源实现的行为移植，并将权限、行编辑动作和操作列识别改为 `MesUiProvider` 注入；不是未经适配的文件复制。消费页面未改动。
- 本阶段写入范围：Sunxu Web 源码、文档、覆盖账本和本目录验收证据。

## 验证命令与结果

```sh
npm run typecheck
npm run build
node /tmp/sunxu-qa-run.js > /tmp/sunxu-resizable-qa-output.json
python3 /Users/suconnect/.codex/skills/ui-ux-pro-max/scripts/validate_spacing_audit.py docs/verification/mes-resizable-table-2026-11-20/layout-audit.json
```

- `npm run typecheck`：通过。
- `npm run build`：通过，包含 ESM/CJS library build 和 catalog build；catalog 仍出现单个 500 kB chunk advisory。
- Playwright 真实 Chromium 页面：`pageerror=0`。浏览器 Console 有两类上游诊断：`use-antd-resizable-header` 对表格列宽布局的提示，以及 Pro Components 触发 Ant Design `Form.Item labelAlign=left|right` 的弃用提示；没有隐藏或改写这些依赖日志。
- UI spacing/frame ledger：3 个工作区外框状态与 11 条接缝记录全部通过，截图 SHA-256 与本地文件匹配。
- 未添加或运行单元测试。

## 行为结果

| 行为 | 结果 |
|---|---|
| 行双击编辑 | 宿主注入回调收到 `RM-AL-0081` |
| 服务端排序 | 排序后请求计数从 1 增到 2 |
| 列宽拖拽和刷新 | `物料名称` 从 160px 调整到 184px；存储值为 184，恢复服务端排序并刷新后仍为 184px |
| 列显隐和导出列 | 隐藏“备注”后表头消失，导出列从 9 降到 8；恢复后回到 9 |
| 表格密度 | 紧凑行高 29px，切换宽松为 31.42px；MES 密度偏好键保存为 `large` |
| 业务空态 | 空态说明可见；汇总值为 0 |
| 本地表格排序 | 首行由铝型材变为三相异步电机 |
| 375px 窄屏键盘滚动 | 聚焦已命名表格区域后按 ArrowRight，内部表格滚动 120px；页面宽度仍为 375px，横向溢出留在表格内 |

验证中发现并修复了列宽恢复问题：ProTable 恢复持久化服务端排序时会重建排序列数组，原来此变化会让列宽恢复流程读写默认值。现在排序状态只合并到最终显示列，列宽 hook 使用稳定的列 schema；完整排序、列宽和刷新序列已经通过。

## 可复核几何

- 桌面 1440×1000：`.sxw-docs-main` 到 `.sxw-docs-surface` 四边外框各 24px；页面 heading 到第一张表格卡片 20px；两张表格卡片相距 12px。
- 窄屏 375×812：工作区到白色内容面的四边外框各 16px；heading 到第一张卡片 16px；两张卡片相距 12px。
- 桌面和窄屏中，ProTable 工具栏与表格 wrapper 直接相接；表格滚动体到分页均为 8px。空态无记录时 ProTable 隐藏分页。
- 桌面表体边界 430px；窄屏为 420px。窄屏表格滚动体宽度 243px、列内容宽 1536px；页面 `scrollWidth=375px`。
- 具体 rect、overflow、空间预期来源、截图哈希和可见分隔带观察见 [`layout-audit.json`](./layout-audit.json)；行为及完整 DOM 数据见 [`render-observations.json`](./render-observations.json)。

## 截图

- [1440px 填充数据](./desktop.png) · SHA-256 `efe9edc7f38d67c44be910e15284a6db25353100720b2bb801fb63a4855befc6`
- [1440px 业务空态](./desktop-empty.png) · SHA-256 `749a01371a7738a22f81124f79d664c668a4cafaadd5fdf4c4f7818178444add`
- [375px 键盘横向滚动](./mobile-375.png) · SHA-256 `b9df75740a443128acb2cfbda784ea20a091220bd6a4f6b46933c0abe4f6fdca`

## 未验收与迁移门禁

- 真实 `mes-admin` 宿主的 `MesUiProvider` 权限/action resolver 接线、VoiceOver/NVDA 完整流程、深色主题、844×390 横屏、目录以外的自定义宿主溢出容器均为 `UNVERIFIED`。
- 全量账本仍有 71 个运行时引用 `PENDING`、16 个 `REVIEW_SOURCE_CONTRACT`。本记录只验收当前 MES 表格组件集，不代表 MES 组件全量补齐；全量门禁清零之前不替换 MES 页面消费者。
