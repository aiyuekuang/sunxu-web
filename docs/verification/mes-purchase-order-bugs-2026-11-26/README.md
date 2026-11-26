# MES purchase-order regression evidence

- Route: local Sunxu Web component catalog, MES UI suite and editable-detail examples.
- Viewport: 1440×900 desktop.
- Data: local deterministic catalog examples only; no MES orders were created or changed.
- Row edit: quantity 2→7, then insert the next row; the original row remains 7.
- Row actions: the PO-2026-018 row exposes one trigger; one click reveals the “查看采购入库单” action without a second trigger click.
- Geometry, the target dropdown-layer count, horizontal-overflow and browser-console results: see `browser-evidence.json`.
- Screenshots: `editable-line-after-insert-1440x900.png` and `purchase-order-row-menu-one-click-1440x900.png`.
- MES Admin purchase-form supplier defaults are not rendered in this catalog; those remain `UNVERIFIED` in browser UI and are covered by the focused helper test/typecheck.
