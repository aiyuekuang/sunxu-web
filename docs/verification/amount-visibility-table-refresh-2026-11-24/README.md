# Amount visibility table refresh

Verified the `MES 表格组件` Catalog page (`pageKey: resizable-table`) at 1440×900 through the visible Vite app on `http://127.0.0.1:4173/`.

## Interaction

- Initial state hides the sample material cost as `****`.
- Turning on `显示金额` changes the same row to `¥1280.50` immediately.
- Turning the switch off restores `****` immediately.
- The Catalog request counter remained at 1 across all three states, so visibility changes did not reload the data.

## Screenshots and geometry

- [ProTable hidden amount](./amount-hidden.png)
- [ProTable visible amount](./amount-visible.png)
- [ProTable hidden again](./amount-hidden-again.png)
- [Native Table hidden amount](./amount-hidden-native.png)
- [Native Table visible amount](./amount-visible-native.png)
- [Native Table hidden again](./amount-hidden-again-native.png)
- [DOM geometry and console output](./dom-geometry.json)

At this viewport, the result region is 1084×430 px and the table wrapper is 1052×343 px. The table content is 1632 px wide and scrolls inside its 1052 px horizontal viewport. The document itself remains 1440 px wide, so table overflow does not widen the page. Geometry is unchanged across the three visibility states. Both ProTable and native Table cells update on the same switch.

The run logged the existing resizable-header width guidance and Ant Design `Form.Item` `labelAlign` deprecation warning; neither prevented the toggle or changed request count. This is Catalog host behavior, not a live MES route or customer server verification.
