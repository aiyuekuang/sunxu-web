# Purchase receipt batch number button verification — 2026-11-20

## Source coverage

- MES source component SHA-256: `19c0c2b53eb28a7e679e1cf7fad9030a584b5678f70b903e2ef0c338e1181433`.
- Implemented the source component in `src/mes/components/GeneratePurchaseReceiptBatchNoButton.tsx`. The MES request is injected through `MesUiProvider.purchaseReceiptCapabilities.generateSystemBatchNo`; the button retains source loading, disabled, trim, no-overwrite, callback, tooltip, and message behavior.
- The source has two current Admin call sites in the purchase receipt action modal and warehouse receipt page. They were inspected but not changed.

## Render and interaction evidence

- Actual route: `CatalogApp / MES UI 套件 → 采购收货系统批号写入`, served at `http://127.0.0.1:4174/`.
- Chromium viewports: desktop 1440×900 and mobile 375×812. Both route-top screenshots show the actual suite; focused card captures show all seven states and adjacent sections.
- Catalog interactions passed: missing material and existing batch disable without a request; loading blocks duplicate action; a successful response is trimmed and written back once; Error text is surfaced verbatim; blank response shows the missing-batch message; non-Error rejection uses the fallback; missing host capability reports configuration without requesting a service.
- Page errors, console errors, failed requests, and 401/403 responses: none. Desktop/mobile page overflow checks passed. Six measured spacing seams and two surface frames passed `layout-audit.json`.
- `npm run typecheck` and `npm run build` passed. The Catalog build reports the existing large PDF worker and app chunk warning.

## Evidence files

- [Desktop Catalog first viewport](./desktop-route-top-1440x900.png)
- [Desktop focused card and adjacent sections](./desktop-batch-button-card-reviewed-1440x900.png)
- [Mobile Catalog first viewport](./mobile-route-top-375x812.png)
- [Mobile focused card and adjacent sections](./mobile-batch-button-card-375x812.png)
- [Rendered geometry, interaction results, overflow, and runtime observations](./render-observations.json)
- [Surface frame and six spacing seam audit](./layout-audit.json)

## Limits

The live MES endpoint, production permissions, and server-side batch eligibility were not exercised. The MES consumer imports were not changed.
