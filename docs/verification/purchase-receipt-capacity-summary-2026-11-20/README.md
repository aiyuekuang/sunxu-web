# Purchase receipt capacity summary verification — 2026-11-20

## Source coverage

- MES source snapshot: current `mes-admin` worktree source; `PurchaseReceiptCapacitySummary.tsx` SHA-256: `2f0a7c930e2a3bb186dbd8cfb40e9ce0d863422635a42a642adb235ed85ad001`.
- Implemented the full component in `src/mes/components/PurchaseReceiptCapacitySummary.tsx` and ported its complete `qty-unit` dependency to `src/mes/utils/qty-unit.ts`, including unit normalization, dictionary fallback, dual-unit formatting, and conversion back to business quantity.
- Preserved the source props, two-line order/received/pending display, AntD secondary text, 12px text, and zero-gap vertical Space. MES request, permission, and unit-dictionary data remain host supplied.

## Render evidence

- Actual route: `CatalogApp / MES UI 套件 → 采购入库履约摘要`, served at `http://127.0.0.1:4174/`.
- Chromium viewports: desktop 1440×900 and mobile 375×812. Both show the actual MES suite route and first viewport; the component card is separately captured together with adjacent cards.
- Both viewports render `订单 128.5 千克` and `已收 32.25 千克 · 待收 96.25 千克` exactly once. No page or component horizontal overflow was measured.
- Page errors, console errors, failed requests, and 401/403 responses: none. The six measured spacing seams and desktop/mobile surface frames pass `layout-audit.json`.
- `npm run typecheck` and `npm run build` pass. The Catalog build reports the existing large PDF worker and app chunk warning.

## Evidence files

- [Desktop Catalog first viewport](./desktop-route-top-1440x900.png)
- [Desktop focused component and adjacent cards](./desktop-capacity-card-1440x900.png)
- [Mobile Catalog first viewport](./mobile-route-top-375x812.png)
- [Mobile focused component and adjacent cards](./mobile-capacity-card-375x812.png)
- [Rendered geometry, text, overflow, and runtime observations](./render-observations.json)
- [Surface frame and six spacing seam audit](./layout-audit.json)

## Limits

The MES consumer imports were not changed. Production purchase receipt requests, permission wiring, and live MES unit dictionary wiring remain `UNVERIFIED` and belong to host integration.
