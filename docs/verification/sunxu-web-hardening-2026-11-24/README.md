# Sunxu Web hardening verification — 2026-11-24

## Scope

Browser evidence covers the Catalog routes `MES 表格组件` and `CRUD 列表工作台` at 1440×900 and 390×844. It verifies the legacy `ResizableProTable.fitContainerHeight` example and the recommended `CrudListWorkbench fill` layout. The examples use deterministic local data.

## Results

- All four screenshots and the measured DOM boxes are stored in this directory. `geometry.json` records viewport size, document overflow, table body, pagination, and owning container dimensions.
- The document has no horizontal overflow in any captured state. Narrow tables scroll horizontally inside `.ant-table-body`; the page itself remains within the viewport.
- The fill workbench and its table region both measure 360px high at both viewports. The table body is 274px high and pagination remains in the same bounded workbench.
- The legacy table body remains inside its 430px boundary. Its 390px screenshot has a 258px body viewport with `scrollWidth: 1512` and `overflowX: auto`; page width remains 390px.
- Captured the Catalog route only. Actual MES Admin route wiring, host API/permission behavior, keyboard and screen reader flows, and dark theme remain `UNVERIFIED`.

## Runtime messages observed

- The table demo emitted a `use-antd-resizable-header` warning that columns with widths can limit automatic table adaptation. This did not produce page overflow; the table body scrolls locally. Review the demo’s intended column sizing separately if automatic adaptation is required.
- Ant Design emitted `Form.Item labelAlign=left|right` deprecation from Pro Components LightFilter internals (`@ant-design/pro-components` 3.1.15-9); no direct `labelAlign` usage was found in this repository. Follow up when the upstream component provides the replacement.

## Files

- `resizable-table-desktop.png`
- `resizable-table-mobile.png`
- `crud-list-fill-desktop.png`
- `crud-list-fill-mobile.png`
- `geometry.json`
