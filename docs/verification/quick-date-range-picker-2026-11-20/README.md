# Quick date range picker verification — 2026-11-20

## Source coverage

- MES source snapshot: commit `e185f6b68b6d8ef94ed0b5312340e1952be5f2f1`.
- `mes-admin/src/components/common/QuickDateRangePicker.tsx` SHA-256: `830babaf8255b5e08a6c9f6610ae433f5e8761f8087c56fe3149ae09f70d4864`.
- Its preset source `mes-admin/src/constants/date-range-presets.ts` SHA-256: `51bc7ee75df6ccb3dc4e396d0fd1d9324906da7cd2ff5d2cb50a8f1d3d38fc2c`.
- Implemented all three exports in the common Sunxu layer. The shared merge utility also serves MES table filters, so default presets are defined once.

## Render and interaction evidence

- Actual Catalog route: `CatalogApp / MES UI 套件 → 通用日期范围快捷选择器`, served at `http://127.0.0.1:4174/`.
- Chromium viewports: desktop 1440×900 and mobile 375×812. Both route tops show the real suite; the date-range card is below the first viewport and separately captured in focused states.
- Three wrappers render and interact: AntD `RangePicker`, ProForm date range, and ProForm date-time range. Caller `近7天` overrides the same default label once; other generic presets are appended. ProForm selections populate their fields.
- Mobile popup bounds: left 50px, right 361px, width 311px. The double-calendar content remains 759px wide inside the bounded horizontal scroller; a 448px horizontal scroll exposes the second month. The page and field card have no horizontal overflow.
- Page errors, console errors, and 401/403 responses: none. The 16 measured spacing seams and desktop/mobile surface frames pass `layout-audit.json`.
- Typecheck and library/Catalog production builds pass. The Catalog build reports the existing large PDF worker and app chunk warning.

## Evidence files

- [Desktop Catalog first viewport](./desktop-route-top-1440x900.png)
- [Desktop date-range card](./desktop-date-range-card-1440x900.png)
- [Desktop quick presets](./desktop-range-presets-1440x900.png)
- [Mobile Catalog first viewport](./mobile-route-top-375x812.png)
- [Mobile date-range card](./mobile-date-range-card-375x812.png)
- [Mobile presets and calendar](./mobile-range-presets-375x812.png)
- [Mobile second month after horizontal scroll](./mobile-range-calendar-scrolled-375x812.png)
- [Rendered geometry and interactions](./render-observations.json)
- [Surface frames and 16-spacing-seam audit](./layout-audit.json)

## Limits

The MES consumer imports were not changed. Production report queries, host permissions, and full screen-reader operation remain `UNVERIFIED` and belong to the MES host integration phase.
