# StatusTag visual verification — 2026-11-20

> **STALE / UNVERIFIED for the current implementation.** These screenshots and contrast measurements were captured before `StatusTag` switched to Ant Design's default white solid text and began darkening light hex backgrounds. Do not use the PASS claims below to accept the current implementation. The current catalog was visually inspected in the browser, but updated screenshots and DOM geometry were not persisted; the MES host route also remains unverified.

The status tags were rendered on the sunxu-web catalog route `/`, in the “信息与状态” section, using the local Vite app at `http://127.0.0.1:4173/`.

## Render checks

- Light desktop: 1440 × 900. All seven solid labels are visible; measured text contrast ranges from 5.12:1 to 9.52:1. [Screenshot](status-tags-light-1440x900.png)
- Dark desktop: 1440 × 900. [Screenshot](status-tags-dark-1440x900.png)
- Light mobile: 390 × 844. Tags wrap to two rows; document width remains 390px. [Full-page screenshot](status-tags-light-390x844-fullpage.png)
- Dark mobile: 390 × 844. Tags wrap to two rows; no horizontal overflow. [Screenshot](status-tags-dark-390x844.png)
- Full-page frame captures: [light desktop](status-tags-light-fullpage.png), [dark desktop](status-tags-dark-fullpage.png).

The screenshot measurements and seam/frame observations are recorded in [status-tag-ui-audit.json](status-tag-ui-audit.json), including SHA-256 hashes. The `ui-ux-pro-max` spacing audit validator reports PASS.
