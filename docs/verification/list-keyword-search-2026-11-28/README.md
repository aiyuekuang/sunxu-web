# List keyword search verification

## Scope

Rendered the Catalog app at `http://127.0.0.1:4174/` on the `业务复合组件` and `CRUD 列表工作台` views. The evidence covers the expanded default, explicit collapsible variant, committed query, clear, focus behavior, IME Enter handling, coarse pointer targets, and 320 CSS px component bounds.

## Results

- Desktop, 1440 × 1000: the default search renders at 320 × 36 px; the explicitly constrained example renders as a 36 × 36 px magnifier. In the workbench, the closed search slot is 36 px and expands to its available width (320 px at this viewport).
- Mobile, 375 × 812: the committed query remains visible in a 275 px wrapper; page and body scroll widths are both 375 px.
- Touch, 375 × 812 and 320 × 812: the closed magnifier and expanded close control each have 44 × 44 px targets. At 320 px, the expanded wrapper is 220 × 44 px and its input ends at x=159; the collapsed wrapper is 44 × 44 px. Both component states fit inside the 254 px card, with no local component overflow.
- The 320 px `业务复合组件` page does have an existing body overflow: body scroll width is 336 px while the document element is 320 px. The measured source is a separate `.ant-tabs-nav-list` in `SavedViewBar` (x=50, width=312, right=362), outside the keyword search card. This task did not change that component, so the whole-page 320 px overflow remains an existing issue; the keyword component itself fits.
- Expanding moves focus to the input; closing returns focus to the magnifier. Clearing submits an empty query. An applied keyword keeps the input visible and hides the close control.
- During composition, Enter did not apply the workbench query (6 rows before and after); Enter after composition applied it (2 matching results). No page errors occurred. Console warnings are the existing Ant Design `List` deprecation and resizable-header width warning.

## Evidence

- [Desktop default and collapsible examples](./desktop-default.png)
- [Desktop active query](./desktop-active-query.png)
- [Desktop collapsed example](./desktop-collapsed.png)
- [Mobile active query](./mobile-active-query.png)
- [Collapsed CRUD workbench](./crud-workbench-complex-collapsed-desktop.png)
- [Active CRUD workbench on desktop](./crud-workbench-complex-active-desktop.png)
- [Active CRUD workbench on mobile](./crud-workbench-complex-active-mobile.png)
- [CRUD workbench collapsed at 320 px](./crud-workbench-320-collapsed.png)
- [CRUD workbench expanded at 320 px](./crud-workbench-320-expanded.png)
- [Touch search collapsed at 375 px](./touch-375-collapsed.png)
- [Touch search expanded at 375 px](./touch-375-expanded.png)
- [Touch search expanded at 320 px](./touch-320-expanded.png)
- [Touch search collapsed at 320 px](./touch-320-collapsed.png)
- [Viewport, bounds, overflow, accessibility, and interaction observations](./render-observations.json)

Screen-reader testing and host Admin runtime with its currently pinned `sunxu-web` package were not part of this Catalog render check.
