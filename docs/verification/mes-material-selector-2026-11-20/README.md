# MES 物料选择器验收记录

- 路由：Catalog → MES UI 套件 → MES 物料选择器。
- 基线：`mes-admin` 固定快照 `e185f6b68b6d8ef94ed0b5312340e1952be5f2f1`；物料选择源文件 SHA-256 `c426983f918dadb96526c3987d6dffb1663248b03b2bea1454483b1aeba805a5`。
- 浏览器：Chromium，静态 Catalog 预览 `http://127.0.0.1:4174/`；桌面 1440×900、手机 375×812。初始路由 HTTP 200，无 401/403、页面异常、控制台错误。
- 交互结果：单选/多选远程搜索，单位和 MES 自定义字段摘要，计算字段错误原因，分类级联与系统类型筛选，当前候选内扫码成功、候选外扫码拒绝，以及配置链接随宿主授权显隐，均 `PASS`。
- 布局结果：窗口和选择卡片无水平溢出；桌面首屏显示完整选择卡片，手机首屏显示搜索、单/多选和级联筛选入口；DOM 间距、容器边框和截图哈希记录在 [`layout-audit.json`](./layout-audit.json)。
- 限制：当前只验证宿主注入契约的确定性目录数据；MES 真实 API、权限、实体扫码枪接线和完整读屏器流程仍为 `UNVERIFIED`。

## 截图

- [桌面默认状态](./desktop-default-1440x900.png)
- [桌面候选副信息](./desktop-option-details-1440x900.png)
- [桌面已选与级联筛选](./desktop-selected-1440x900.png)
- [桌面空候选及权限关闭](./desktop-empty-denied-1440x900.png)
- [手机首屏已选状态](./mobile-selected-375x812.png)
- [手机选择卡片与下一结果卡片间距](./mobile-card-seam-375x812.png)

可复核的 DOM 几何与交互结果见 [`render-observations.json`](./render-observations.json)。
