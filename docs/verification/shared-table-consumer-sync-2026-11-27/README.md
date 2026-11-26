# Shared table consumer sync verification

## Rendered route

- App: the runnable Sunxu Web Catalog.
- Page: **扩展表格组件** (`ResizableProTable` and `ResizableTable`).
- Library commit: `6735f84993868fda8bcdf007b45a1c929638f364`.
- Viewports: desktop `1440 × 900`; mobile `375 × 812`.

## Evidence

- [Desktop screenshot](./desktop-1440x900.png)
- [Mobile screenshot](./mobile-375x812.png)
- [DOM geometry and console capture](./geometry.json)

Both table variants rendered with data. The document has no horizontal overflow at either viewport. At `375 × 812`, the table body keeps its own horizontal scroll area (`243px` client width and `1592px` scroll width); the page remains `375px` wide. The desktop table body similarly keeps its own scroll area (`1052px` client width and `1592px` scroll width).

The browser reported non-fatal warnings from the demo's all-width column configuration (`use-antd-resizable-header`) and Ant Design's deprecated `labelAlign="left|right"` value. There were no uncaught page errors.
