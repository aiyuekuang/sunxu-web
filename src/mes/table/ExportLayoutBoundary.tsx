import React, { createContext, useCallback, useContext } from 'react';
import {
  activateTableExportLayout,
  getTableExportRouteKey,
  type TableExportLayout,
} from './exportLayout';

type TableExportLayoutBoundaryProps = {
  layout?: TableExportLayout;
  className?: string;
  children: React.ReactNode;
};

const TableExportLayoutContext = createContext<TableExportLayout | undefined>(
  undefined,
);

export function useTableExportLayout(): TableExportLayout | undefined {
  return useContext(TableExportLayoutContext);
}

/**
 * 将导出布局绑定到具体表格的交互边界。
 *
 * 一个路由下可能同时挂载多个表格，不能用最后挂载的表格作为隐式全局布局。
 * 使用事件捕获是为了兼容页面中仍使用自定义 Button/PermissionButton 的导出
 * 入口：它们无需逐页改写，点击发生在表格边界内时即可激活正确布局。
 */
export function TableExportLayoutBoundary({
  layout,
  className,
  children,
}: TableExportLayoutBoundaryProps) {
  const handleClickCapture = useCallback(() => {
    if (!layout) return;
    activateTableExportLayout(getTableExportRouteKey(), layout);
  }, [layout]);

  return (
    <TableExportLayoutContext.Provider value={layout}>
      <div
        className={className}
        style={{ display: 'contents' }}
        onClickCapture={handleClickCapture}
      >
        {children}
      </div>
    </TableExportLayoutContext.Provider>
  );
}
