import React, { type ReactNode } from 'react';
import { PRINT_STYLES } from './print-styles';

export interface PrintLayoutProps {
  /** 单据标题，如"生产工单"、"质检报告" */
  title: string;
  /** 单据编号，显示在右上角 */
  docNo?: string;
  /** 额外的右上角元信息行 */
  metaLines?: string[];
  /** 打印日期，默认当前日期 */
  printDate?: string;
  children: ReactNode;
}

/**
 * @sunxu-layer business
 * @sunxu-domain printing
 * @sunxu-reason Preserves the host A4 print header, document metadata, footer, and shared print stylesheet.
 * Common A4 document print layout.
 */
export const PrintLayout = React.forwardRef<HTMLDivElement, PrintLayoutProps>(
  function PrintLayout(
    { title, docNo, metaLines = [], printDate, children },
    ref,
  ) {
    const date = printDate ?? new Date().toLocaleDateString('zh-CN');

    return (
      <>
        <style>{PRINT_STYLES}</style>
        <div ref={ref} className="print-root">
          <div className="print-header">
            <img src="/logo.png" alt="Logo" className="print-header-logo" />
            <div className="print-header-title">{title}</div>
            <div className="print-header-meta">
              {docNo && <div>编号：{docNo}</div>}
              {metaLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
              <div>打印日期：{date}</div>
            </div>
          </div>
          {children}
          <div className="print-footer">
            <span>本文档由 host 系统生成</span>
            <span>打印时间：{new Date().toLocaleString('zh-CN')}</span>
          </div>
        </div>
      </>
    );
  },
);
