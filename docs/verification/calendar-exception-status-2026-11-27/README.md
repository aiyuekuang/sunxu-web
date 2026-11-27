# Calendar exception status verification

## Intent and boundary

Exception managers need to see whether each calendar exception is active and, with update permission, explicitly confirm enable/disable. The status and its action stay in the exception result table; the action changes only `isActive`. This verification uses deterministic catalog data and does not call or mutate MES production data.

## Route × viewport × state

| Route / viewport | State exercised | Evidence | Result |
| --- | --- | --- | --- |
| Sunxu Web catalog → Business components → `ProductionShiftCalendarComponentsDemo`, 1440×900 | Active and inactive rows; status and action in the table | [Screenshot](./calendar-status-1440x900.png), [DOM geometry](./dom-geometry.json) | Status/action are visible; the action is not clipped. The catalog table scrolls horizontally because its available width is 1086px while the table content is 1302px. |
| Same catalog demo, 1024×768 | Table scrolled to the status/action columns | [Screenshot](./calendar-status-1024x768.png), [DOM geometry](./dom-geometry.json) | Horizontal scrolling exposes the status/action; action is not clipped (710px viewport, 1302px content, `scrollLeft=592`). |
| Same catalog demo, 1024×768 | Keyboard Enter opens disable confirmation; Enter confirms; row updates to inactive; enable confirmation restores it | Browser automation result below | Passed. Visible state changes from `启用 / 停用` to `停用 / 启用` and back. |

## Interaction result

- The status column treats only `isActive === false` as inactive, preserving the backend's default-active behavior for `null`/missing values.
- The status action is rendered only when `exceptionPermissions.edit` (or the legacy `permissions.edit` fallback) is true.
- Disable and enable each require confirmation. The confirmation states that an inactive exception is excluded from scheduling/capacity calculations.
- The update handler calls `updateCalendarException(record.id, { isActive })`; it does not send dates, times, type, ownership, or remarks. It reloads the table after success and reports a host error on failure.
- Local demo record `周末设备保养` was disabled and re-enabled. A separate initial inactive fixture remained visible with an `启用` action.
- Browser automation recorded zero uncaught page exceptions. The catalog emitted five console diagnostics from the broader business component page: Ant Design deprecations, the shared resizable-table width diagnostic, and a static-message context warning. They did not prevent the calendar interaction.

## Build and regression evidence

- `node --test tests/business/production-shift-calendar-status.test.mjs`: 2 passed, 0 failed.
- `npm run typecheck`: passed.
- `npm run build:lib`: passed.
- `npm run build:catalog`: passed; Vite reported its existing large-chunk advisory.
- `git diff --check`: passed.

## Production route limit

The user-provided MES URL returned HTTP 200 and redirected to `/user/login?redirect=%2F`. The browser could inspect only the login page; no authenticated production route, production API mutation, or deployed post-fix UI was verified. Production UI/API wiring remains `UNVERIFIED` until an authenticated route is available and the updated shared package is consumed.
