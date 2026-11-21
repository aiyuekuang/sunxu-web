/**
 * 针式打印机专用样式。
 *
 * 针打的限制：
 * - 只能纯黑白，任何灰度都打不清
 * - 推荐宋体（SimSun），针打点阵字体基础
 * - 线条至少 1pt 实线，细线会断
 * - 禁止任何背景色、阴影、圆角、图片
 * - 行高紧凑，留给复写纸穿透
 * - 连续纸尺寸（常见 241mm × 140mm 两等分 / 241mm × 93mm 三等分）
 */
export const DOT_MATRIX_STYLES = `
@media print {
  body { margin: 0; padding: 0; }
}

/* ─── 容器 ─── */
.dm-root {
  font-family: SimSun, "宋体", "Noto Serif CJK SC", serif;
  color: #000;
  font-size: 10pt;
  line-height: 1.25;
  padding: 2mm 4mm;
  background: #fff;
}

.dm-root * {
  color: #000 !important;
  background: transparent !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

/* ─── 抬头 ─── */
.dm-header {
  text-align: center;
  margin-bottom: 1.5mm;
}
.dm-company {
  font-size: 14pt;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 0.5mm;
}
.dm-title {
  font-size: 12pt;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 0.5mm;
}
.dm-meta {
  display: flex;
  justify-content: space-between;
  font-size: 9pt;
  margin-bottom: 1mm;
}

/* ─── 信息行（非表格） ─── */
.dm-info {
  display: flex;
  justify-content: space-between;
  font-size: 9pt;
  margin-bottom: 1mm;
}
.dm-info-item {
  flex: 1;
}
.dm-info-label {
  font-weight: 700;
}

/* ─── 表格 ─── */
.dm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
}
.dm-table th,
.dm-table td {
  border: 1pt solid #000;
  padding: 1mm 1.4mm;
  text-align: left;
  vertical-align: middle;
}
.dm-table th {
  font-weight: 700;
  text-align: center;
}
.dm-table td.center { text-align: center; }
.dm-table td.right  { text-align: right; }
.dm-table tfoot td {
  font-weight: 700;
}

/* ─── 页脚签字栏 ─── */
.dm-sign {
  display: flex;
  justify-content: space-between;
  margin-top: 2mm;
  font-size: 9pt;
}
.dm-sign-item {
  flex: 1;
  padding: 0 1mm;
}
`;
