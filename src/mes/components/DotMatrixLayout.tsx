import React, { type ReactNode } from 'react';

export interface DotMatrixLayoutProps {
  /** 公司名称，显示在抬头 */
  companyName?: string;
  /** 单据标题，如"送货单" */
  title: string;
  /** 单据编号 */
  docNo?: string;
  /** 单据日期 */
  docDate?: string;
  children: ReactNode;
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-print-layout
 * @sunxu-reason Keeps continuous-paper print metadata and markup stable while the host injects printer-specific page styles.
 * Dot-matrix continuous-paper print layout.
 */
export const DotMatrixLayout = React.forwardRef<
  HTMLDivElement,
  DotMatrixLayoutProps
>(function DotMatrixLayout(
  { companyName, title, docNo, docDate, children },
  ref,
) {
  return (
    <div ref={ref} className="dm-root">
      <div className="dm-header">
        {companyName && <div className="dm-company">{companyName}</div>}
        <div className="dm-title">{title}</div>
        <div className="dm-meta">
          <span>编号：{docNo ?? '—'}</span>
          <span>日期：{docDate ?? new Date().toLocaleDateString('zh-CN')}</span>
        </div>
      </div>
      {children}
    </div>
  );
});
