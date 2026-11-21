/**
 * 标签打印专用样式。
 * 所有标签模板共用，保证标签纸输出视觉一致。
 *
 * 两种布局根据标签纸方向自动切换：
 *
 * 横版（.horizontal）— 宽 ≥ 高：
 * ┌──────────────────────────────┐
 * │        标题（全宽）           │
 * │──────────────────────────────│
 * │ 编码  MAT-00001  ┌────────┐ │
 * │ 规格  100x50     │  [QR]  │ │
 * │ 单位  个         └────────┘ │
 * └──────────────────────────────┘
 *
 * 竖版（.vertical）— 高 > 宽：
 * ┌────────────────┐
 * │   标题（全宽）  │
 * │────────────────│
 * │ 编码 MAT-00001 │
 * │ 规格 100x50    │
 * │ 单位 个        │
 * │    ┌──────┐    │
 * │    │ [QR] │    │
 * │    └──────┘    │
 * └────────────────┘
 */
export const LABEL_STYLES = `
@media print {
  body { margin: 0; padding: 0; }
}

/* ─── 标签容器 ─── */
.label-root {
  font-family: "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
  color: #1a1a1a;
  font-size: 10px;
  line-height: 1.4;
}

/* ─── 单个标签 ─── */
.label-item {
  box-sizing: border-box;
  padding: 2mm;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  page-break-after: always;
}
.label-item:last-child {
  page-break-after: auto;
}

/* ─── 标签标题行 ─── */
.label-title {
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── 分隔线 ─── */
.label-divider {
  border: none;
  border-top: 0.5px solid #ccc;
  margin: 1mm 0;
}

/* ─── 信息行 ─── */
.label-row {
  display: flex;
  align-items: baseline;
  font-size: 9px;
  line-height: 1.5;
}
.label-field {
  color: #666;
  white-space: nowrap;
  margin-right: 4px;
  flex-shrink: 0;
}
.label-value {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.label-value-full {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

/* ─── 条码/二维码 ─── */
.label-barcode svg {
  display: block;
}

/* ═══════════════════════════════════════════════════════
   横版布局（.horizontal）— 信息左 + 二维码右
   ═══════════════════════════════════════════════════════ */
.horizontal .label-body {
  display: flex;
  align-items: center;
  gap: 2mm;
  flex: 1;
  min-height: 0;
}
.horizontal .label-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5mm;
}
.horizontal .label-barcode {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ═══════════════════════════════════════════════════════
   竖版布局（.vertical）— 信息上 + 二维码下居中
   ═══════════════════════════════════════════════════════ */
.vertical .label-body {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1;
  min-height: 0;
}
.vertical .label-info {
  display: flex;
  flex-direction: column;
  gap: 0.5mm;
}
.vertical .label-barcode {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  margin-top: 1mm;
}
`;
