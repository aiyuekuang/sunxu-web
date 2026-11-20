# Table summary verification

Catalog route: **表格合计与结果摘要** (`/`, select the route from the component navigation).

The long mixed-unit summary is rendered as a non-fixed `TableSummary` row directly after the current page's last data row. `fullWidth` spans the visible nonfixed columns; the generated row-number and fixed-right action columns remain empty. The pagination area still shows its own range and page controls, with only a short summary in the separate pagination example.

## Rendered evidence

| State | Screenshot | Result |
|---|---|---|
| Desktop, 1470×900 | [`summary-desktop-1470x900.png`](./summary-desktop-1470x900.png) | Summary row top equals the last visible body row bottom (`y=962.98px`); the summary is 29px tall. Document width is 1470px with no page overflow. |
| Mobile, 390×844 | [`summary-mobile-390x844.png`](./summary-mobile-390x844.png) | Document width remains 390px with no page-level overflow. The 717px table uses its own horizontal scroll area; the summary moves with the table. |
| Hide “业务类型” | [`summary-column-hidden-1470x900.png`](./summary-column-hidden-1470x900.png) | Visible headers become `序号 / 物料 / 数量 / 操作`; summary cells resolve to blank fixed-left `colSpan=1`, content `colSpan=2`, blank fixed-right `colSpan=1`. |

Playwright reported no browser page errors. The real MES stock route was not rendered in this check because it requires an authenticated business-data session; its page-level visual result remains **UNVERIFIED**. The stock page consumes the existing stock-summary response and uses this same adapter component.
