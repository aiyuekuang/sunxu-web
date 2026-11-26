import type { ReactNode } from 'react';
import type { ProTableProps } from '@ant-design/pro-components';

export interface DocumentDetailLedgerExportActionProps {
  exportFn: () => Promise<Blob>;
  fileName: string;
  permission: string;
  label: ReactNode;
}

/** Host owns the export button, browser download adapter, and remembered pagination. */
export interface DocumentDetailLedgerCapabilities {
  pagination?: ProTableProps<object, Record<string, unknown>>['pagination'];
  renderExportAction?: (
    props: DocumentDetailLedgerExportActionProps,
  ) => ReactNode;
}
