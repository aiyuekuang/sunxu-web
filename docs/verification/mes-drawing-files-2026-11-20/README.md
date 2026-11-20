# MES 图纸与附件组件验收记录

- 来源基线：`mes-admin` 固定提交 `e185f6b68b6d8ef94ed0b5312340e1952be5f2f1`；`src/components/patterns/DrawingFilesInline.tsx` SHA-256 `2b8b327bcf2ae427123ea8be852d9ba880ac50af4898572e3c67ed1655f68e0e`。
- 本批覆盖：4 个导出符号、38 处 JSX 使用、22 个消费文件；源代码迁入 Sunxu MES 套件，MES 请求、文件权限、上传、下载代理、原文件名解析与 PDF worker 改为宿主注入。
- 路由：Catalog → MES UI 套件 → MES 图纸与附件。浏览器：Chromium，静态预览 `http://127.0.0.1:4174/`；桌面 1440×900，手机 375×812。
- 验证：`npm run typecheck`、`npm run build` 通过。Playwright 覆盖图片预览、PDF worker/分页/缩放/下载、订单附件关联、组打印回调、上传/原名回读、普通附件代理下载。页面异常、控制台错误、401/403 均为 0。
- 手机 PDF 实测：预览区 `clientWidth=273px`，PDF 画布 `width=249px`，预览区 `scrollWidth=273px`，页面 `scrollWidth=375px`，无横向溢出。首次宽度测量完成前展示加载态，避免画布按 PDF 原始宽度闪出。
- 布局审计：[`layout-audit.json`](./layout-audit.json) 的 2 个外框状态与 7 个页面/图库接缝均由 spacing validator 判为 `PASS`；桌面与手机无页面横向溢出。交互与完整 DOM 数据见 [`render-observations.json`](./render-observations.json)。
- 限制：Catalog 使用确定性本地文件与宿主回调适配器；真实 MES 文件代理、上传接口、业务权限、打印执行策略及读屏器完整流程仍由宿主接线或验收，标记 `UNVERIFIED`。

## 截图

- [桌面 Catalog 首屏](./desktop-route-top-1440x900.png)
- [桌面附件组件与图库](./desktop-attachment-card-1440x900.png)
- [桌面图片预览](./desktop-image-preview-1440x900.png)
- [桌面 PDF 预览](./desktop-pdf-preview-1440x900.png)
- [桌面组件卡片接缝](./desktop-card-next-seam-1440x900.png)
- [手机 Catalog 首屏](./mobile-route-top-375x812.png)
- [手机附件组件](./mobile-attachment-card-375x812.png)
- [手机组件卡片接缝](./mobile-card-next-seam-375x812.png)
- [手机图库分组接缝](./mobile-gallery-group-seam-375x812.png)
- [手机 PDF 预览](./mobile-pdf-preview-375x812.png)
