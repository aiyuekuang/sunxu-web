# 单据行自定义字段列视觉验收

## 页面与状态

- Catalog 页面：MES 组件套件 → 单据行自定义字段列与 payload。
- 桌面视口：1440 × 960，初始数据状态。
- 窄屏视口：390 × 844，点击“应用模拟公式预览”之后。
- 示例数据固定在 Catalog 内，不调用 MES API。

## 几何与交互

| 视口 | 页面宽度 / `scrollWidth` | 卡片宽度 / `scrollWidth` | 结果 |
|---|---:|---:|---|
| 1440 × 960 | 1440 / 1440 px | 1118 / 1118 px | 页面和卡片均未横向溢出 |
| 390 × 844 | 390 / 390 px | 324 / 324 px | 页面和卡片均未横向溢出；两张表在各自 `overflow-x: auto` 区域内滚动 |

- 点击模拟预览后，第一行计算得分由 8 更新为 9，汇总由 6 更新为 7。
- 页面级 JavaScript 错误：0。
- 截图：桌面 [desktop-1440x960.png](./desktop-1440x960.png)，窄屏 [mobile-390x844-after-preview.png](./mobile-390x844-after-preview.png)。

## 限制

该证据验证 Catalog 确定性示例与公开列 helper。真实 MES 路由与宿主 API 接线、键盘路径、深色主题，以及真实页面中的表格滚动仍为 `UNVERIFIED`。
