# CRUD List Workbench UI evidence

## Result

The real catalog route rendered and passed desktop and 390px mobile checks for the states listed in `layout-observations.json`. The screenshots include light filters, category/status filters, advanced filter drawer open/applied, saved views, desktop facets, mobile facet drawer, mobile quick-filter collapse/expand, and native ProTable QueryFilter.

- Screenshot evidence: this directory.
- DOM geometry, document overflow, state, and browser errors: `layout-observations.json`.
- Spacing and workspace frame ledger: `spacing-audit.json`; the repository UI seam validator passed all 4 recorded seams.
- At 1440px and 390px viewports, all captured states reported no document-level horizontal overflow. ProTable native search also rendered and performed its own column-driven query.
- The final Ant Design 6 Drawer and saved-view Modal render probe produced no console warnings or page errors.
- Manual interaction evidence additionally covers create/edit/delete and batch disable in the product demo, plus saved-view switch/save and advanced filter apply.

## First-screen budget

The first task is to locate a product and perform a list action. The first screen gives the compact scene switcher and product list the primary space; category and status are exposed together, the keyword/unit controls sit next to the result area, and create/master-data actions stay beside their owning list. The complex scenario moves hierarchy facets to a desktop sidebar or mobile drawer. Native column-query mode delegates schema-based search and its responsive collapse behavior to ProTable.

## Limits

Keyboard/screen-reader walkthroughs, dark theme, all intermediate widths, and every loading/error combination remain `UNVERIFIED`. The 390px table may use its own internal horizontal behavior for columns; document-level overflow stayed at 0.
