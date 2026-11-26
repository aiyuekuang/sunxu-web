/**
 * 打印专用样式常量。
 * 所有打印模板共用，保证输出视觉一致。
 */
export const PRINT_STYLES = `
@media print {
  /* 基础排版 */
  body { margin: 0; padding: 0; }

  /* 隐藏页面其他内容，只显示打印区域 */
  body > *:not(.print-root) { display: none !important; }
}

/* ─── 打印容器 ─── */
.print-root {
  font-family: "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
  color: #1a1a1a;
  font-size: 12px;
  line-height: 1.6;
  padding: 24px 32px;
  max-width: 210mm; /* A4 */
}

/* ─── 抬头 ─── */
.print-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #1a1a1a;
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.print-header-logo {
  height: 36px;
}
.print-header-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
  text-align: center;
  flex: 1;
}
.print-header-meta {
  text-align: right;
  font-size: 11px;
  color: #666;
  line-height: 1.8;
}

/* ─── 信息区块 ─── */
.print-section {
  margin-bottom: 14px;
}
.print-section-title {
  font-size: 13px;
  font-weight: 700;
  border-left: 3px solid #1677ff;
  padding-left: 8px;
  margin-bottom: 8px;
}

/* ─── 描述表格（key-value 网格） ─── */
.print-desc {
  width: 100%;
  border-collapse: collapse;
}
.print-desc td {
  border: 1px solid #d9d9d9;
  padding: 5px 10px;
  vertical-align: top;
}
.print-desc .label {
  background: #fafafa;
  font-weight: 500;
  width: 100px;
  white-space: nowrap;
  color: #595959;
}

/* ─── 数据表格 ─── */
.print-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 4px;
}
.print-table th,
.print-table td {
  border: 1px solid #d9d9d9;
  padding: 5px 8px;
  text-align: left;
  font-size: 11px;
}
.print-table th {
  background: #fafafa;
  font-weight: 600;
  white-space: nowrap;
}
.print-table td.number {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* ─── 签字栏 ─── */
.print-signatures {
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
  padding-top: 16px;
}
.print-sign-item {
  text-align: center;
}
.print-sign-line {
  display: inline-block;
  width: 120px;
  border-bottom: 1px solid #1a1a1a;
  margin-left: 8px;
}

/* ─── 页脚 ─── */
.print-footer {
  margin-top: 24px;
  padding-top: 8px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #999;
}

/* ─── 工序卡特有：签字格 ─── */
.process-card-sign-grid td {
  height: 36px;
  min-width: 60px;
}

.print-table th.print-qr-cell,
.print-table td.print-qr-cell {
  text-align: center;
  padding: 4px;
}

/* ─── 状态标签 ─── */
.print-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}
`;
