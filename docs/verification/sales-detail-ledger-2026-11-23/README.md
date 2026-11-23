# Sales detail ledger visual verification

## Scope and result

- Route: local Catalog → MES UI 套件 → MES 销售明细台账.
- Viewport: 1440 × 1000.
- Component behavior: verified. The sales order row displays `2026-12-05`; the sales delivery row displays `2026-11-20`. One click on the order row ellipsis opens `详情`; one click on the delivery row ellipsis opens the full document action menu.
- Customer MES Admin route and UV session: `UNVERIFIED`. This run used fixed Catalog fixtures and did not connect to customer data or APIs.

## Evidence

- [`sale-order.png`](./sale-order.png)
- [`sale-delivery.png`](./sale-delivery.png)
- [`geometry.json`](./geometry.json)

The order and delivery tables each keep their wide columns inside an `ant-table-body` horizontal scroll area. The measured viewport was 1440px; the table scroll areas were 1086px wide with content widths of 3622px and 4372px. Both date cells were brought into view for the screenshots. The row action menus fit within the viewport.

The delivery view also has a separate 12px page-level horizontal overflow in this Catalog fixture (`document.scrollWidth` 1452px at a 1440px viewport). The overflowing element is the multi-select status filter in ProTable's light-filter row; it starts at x=1299 and ends at x=1452. The table's own horizontal scrolling is contained. This filter-row overflow is outside the sales-date and row-menu fix and remains visible in the evidence.
