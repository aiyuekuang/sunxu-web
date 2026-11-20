# MES 主数据快捷新增选择器验收记录

- 路由：Catalog → MES UI 套件 → MES 主数据快捷新增选择器。
- 来源基线：`mes-admin` 固定快照 `e185f6b68b6d8ef94ed0b5312340e1952be5f2f1`；`src/components/master-data/MasterDataQuickCreateSelect.tsx` SHA-256 `556c2170b2a525191d35e3af147094502ff69194c06ea3e14537117c561bf843`。
- 浏览器：Chromium，Catalog 预览 `http://127.0.0.1:4174/`；桌面 1440×900、手机 375×812。路由 HTTP 200，无 401/403、页面异常或控制台错误。
- 交互结果：配置入口回调、客户新增权限门控、打开抽屉时关闭候选弹层、创建后客户权威 ID 与默认销售员/收款条件回填、远程首屏未命中新项时保留标签、供应商多选追加、禁用/无权限门控、手机下拉不越界，均 `PASS`。
- 布局结果：桌面和手机路由无水平溢出；目标选择器在完整组件目录中的首屏以下，已另截取选择器上/下相邻卡片接缝和字段下拉。Surface frame 与 8 个可见间距接缝由 `layout-audit.json` 验证为 `PASS`；DOM 矩形与运行时结果见 [`render-observations.json`](./render-observations.json)。
- 限制：目录通过 `MesUiProvider.masterDataQuickCreateCapabilities` 注入本地确定性权限、配置链接和抽屉表单。真实 MES API、权限码、路由及客户/供应商原始抽屉与表单字段仍由宿主提供；这些独立来源组件仍待后续迁移。完整读屏器流程为 `UNVERIFIED`。

## 截图

- [桌面 Catalog 首屏](./desktop-route-top-1440x900.png)
- [桌面图纸区到目标选择器接缝](./desktop-drawing-selector-seam-1440x900.png)
- [桌面目标选择器与下一组件](./desktop-selector-card-1440x900.png)
- [桌面新增客户抽屉](./desktop-customer-create-drawer-1440x900.png)
- [手机 Catalog 首屏](./mobile-route-top-375x812.png)
- [手机图纸区到目标选择器接缝](./mobile-drawing-selector-seam-375x812.png)
- [手机选择器候选下拉](./mobile-selector-dropdown-375x812.png)
- [手机目标选择器与下一组件](./mobile-selector-card-375x812.png)
