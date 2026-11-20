# MES 会计选择器验收记录

- 路由：Catalog → MES UI 套件 → MES 会计账簿与期间选择器。
- 来源基线：`mes-admin` 固定快照 `e185f6b68b6d8ef94ed0b5312340e1952be5f2f1`；`src/components/accounting/selectors.tsx` SHA-256 `17fb4b605cc1adc74fd043b75fc572a24177c5c3d73d81ba801db7cb267d577b`，期间算法 `src/components/accounting/period-selection.ts` SHA-256 `4cf5e25bc81e3f5a4b54915e0d5644a1bce576244919d955eb50dba81f1ce6d4`。
- 浏览器：Chromium，Catalog 预览 `http://127.0.0.1:4174/`；桌面 1440×900、手机 375×812。无 401/403、页面异常或控制台错误。
- 交互结果：主账簿自动默认、当前日期覆盖期间优先于未来已开启期间、凭证字按创建顺序默认、账簿参数参与期间/凭证请求、7 个候选 helper、可记账科目远程搜索、无账簿候选时配置入口显隐、手机下拉不越界，均 `PASS`。
- 布局结果：桌面/手机无页面横向溢出；四个表单字段保持 24px AntD Form.Item 间距；组件卡片与前后 MES 卡片保持 16px 间距。Surface frame 与 16 个间距接缝由 `layout-audit.json` 验证为 `PASS`；几何和交互数据见 [`render-observations.json`](./render-observations.json)。
- 限制：Catalog 通过 `MesUiProvider.accountingSelectorCapabilities` 注入本地确定性主数据。真实 MES API、授权和会计基础资料配置路由仍归宿主；本批没有替换任何 MES 页面导入。完整读屏器流程为 `UNVERIFIED`。

## 截图

- [桌面 Catalog 首屏](./desktop-route-top-1440x900.png)
- [桌面主数据选择器到会计卡片接缝](./desktop-quick-create-accounting-seam-1440x900.png)
- [桌面会计字段与间距](./desktop-accounting-card-1440x900.png)
- [桌面空账簿配置入口](./desktop-empty-config-1440x900.png)
- [手机 Catalog 首屏](./mobile-route-top-375x812.png)
- [手机主数据选择器到会计卡片接缝](./mobile-quick-create-accounting-seam-375x812.png)
- [手机会计字段与间距](./mobile-accounting-card-375x812.png)
- [手机账簿候选下拉](./mobile-accounting-dropdown-375x812.png)
