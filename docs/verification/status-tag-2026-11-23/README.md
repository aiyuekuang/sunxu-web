# StatusTag visual verification

- Route: `http://127.0.0.1:4173/` → “信息与状态” → “状态标签”.
- Viewports: light and dark theme at `1470 × 900`; light theme at `390 × 844`.
- Tag geometry: `22px` high; Chinese status labels with three characters are `52px` wide; `12px` text and Ant Design `4px` radius.
- Layout: no horizontal document or body overflow at any captured viewport; tags wrap on the narrow viewport.
- Colors and text are the rendered Ant Design `Tag` `solid` variant using named Ant Design palette colors. No custom foreground color or background adjustment is applied.
- Screenshots and computed DOM measurements are stored beside this file.

The wide theme captures both use the same viewport and layout. Theme palette token values differ as expected; the light desktop and mobile captures retain Ant Design preset colors.
