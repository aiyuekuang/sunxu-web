# Table totals and pagination summary verification

## Rendered route and states

- Route: Sunxu Web component catalog at `http://127.0.0.1:4173/`, navigation item “表格合计与结果摘要”.
- Desktop `1440 × 1000`: fixed column-aligned summary row has one summary row and four cells; the pagination summary is on the left of the page range and page controls on the same footer row.
- Narrow `768 × 1024`: pagination summary moves above the count and page controls. Its values stay visible without horizontal page overflow.
- Mobile `390 × 844`: all summary values wrap above the count and page controls; there is no overlap or page-level horizontal overflow.
- Browser page errors: none. At all three sizes, `documentElement.scrollWidth` equals `clientWidth`.

## Geometry

The paginated table's footer container measured `1084 × 27` at 1440px, `452 × 81` at 768px, and `290 × 129` at 390px. The summary content and first page control do not overlap at any viewport. The fixed summary row measures `1084 × 47` on desktop and contains four cells; its 552px content width remains inside the table's horizontal scroll region on narrow screens.

The paginated component uses the host supplied summary text; it does not sum the visible page rows. The fixed row example uses one unit and aligns each total to its numeric column.

## Captures

- [`summary-desktop-1440x1000.png`](./summary-desktop-1440x1000.png)
- [`summary-narrow-768x1024.png`](./summary-narrow-768x1024.png)
- [`summary-mobile-390x844.png`](./summary-mobile-390x844.png)
- [`layout-audit.json`](./layout-audit.json)

## Business route status

The MES Admin `/warehouse/stock`, `/warehouse/transactions`, and `/warehouse/line-side-stock` routes were not rendered in this environment because the local Admin route redirects to login and no authenticated API session is available. Their UI rendering remains `UNVERIFIED`; this catalog verifies the shared component API and layout only.
