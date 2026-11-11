# CRUD Facet 间距验收

组件目录的“CRUD 列表工作台”真实路由，切换到“复杂视图”场景，在 1470×801 CSS px、DPR 2 下渲染。

- Facet 轨道宽 232px；结果区列宽 900px；CSS grid gap 为 16px。
- 宿主卡片铺满 Facet 轨道，侧栏分隔线后至表格的 CSS gap 为 16px；计入卡片边框像素后，卡片右边缘至表格为 17px。
- 文档页自身为长页面，因此 document 高 1557px；本次只测量组件局部几何，不把页面自然滚动计为溢出错误。

![目录复杂视图 Facet 与结果区](./catalog-facet-1470x801.png)

完整 DOM 几何见 [geometry.json](./geometry.json)。
