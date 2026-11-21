import type { ActionType, ProColumns, ProFormInstance, ProTableProps } from '@ant-design/pro-components';
import type { ReactNode, RefObject } from 'react';
import type { DocumentDetailLedgerSavedViewController } from './DocumentDetailLedgerTable';
import type { MesStatusEnum } from './StatusDisplay';
import type { ResizableTableConfig } from './ResizableTable';
import type { DocumentViewMode } from './DocumentViewSwitch';

export interface MaterialIssueDetailLedgerRow extends Record<string, any> {
  id: string; issueNo?: string; orderNo?: string; status?: string; type?: string;
  material?: Record<string, any>; materialName?: string; materialCode?: string; materialSpec?: string;
  requiredQty?: number | string; actualQty?: number | string; issueQty?: number | string;
  issueUnit?: string; warehouseName?: string; location?: { pathName?: string | null } | null; batchNo?: string;
  plannedIssueAt?: string; confirmedAt?: string; createdAt?: string; updatedAt?: string;
  operatorName?: string; remarks?: string;
}
export interface MaterialIssueDetailLedgerQuery extends Record<string, unknown> { orderBy?: string; orderDir?: 'ASC' | 'DESC'; type?: string; types?: string[]; }
export interface MaterialIssueDetailLedgerSummary extends Record<string, number | null | undefined> {
  issueOrderCount?: number; itemCount?: number; materialCount?: number;
  requiredQty?: number; actualQty?: number; issueQty?: number;
}
export interface MaterialIssueDetailLedgerResponse { list?: MaterialIssueDetailLedgerRow[]; total?: number; summary: MaterialIssueDetailLedgerSummary; }
export interface MaterialIssueDetailLedgerProps {
  capabilities: {
    requestList(query: MaterialIssueDetailLedgerQuery): Promise<MaterialIssueDetailLedgerResponse>;
    exportExcel(query: MaterialIssueDetailLedgerQuery): Promise<Blob>;
    materialFilterColumn: Partial<ProColumns<MaterialIssueDetailLedgerRow>>;
    warehouseFilterColumn: Partial<ProColumns<MaterialIssueDetailLedgerRow>>;
    dateRangePresets: readonly any[];
    statusEnum: MesStatusEnum; typeEnum: MesStatusEnum;
    unitLabelMap?: Readonly<Record<string, string>>;
    materialCustomFieldColumns?: ProColumns<MaterialIssueDetailLedgerRow>[];
    lineCustomFieldColumns?: ProColumns<MaterialIssueDetailLedgerRow>[];
    format: { formatNumber(value: unknown): string; formatDate(value?: string | null): string; formatDateTime(value?: string | null): string; formatUnit(value?: string | null): string; };
    canViewRequest: boolean; canExport: boolean; canCreate: boolean;
    exportPermission: string; createPermission?: string; resizable: ResizableTableConfig;
    serverSortFields?: readonly string[]; savedViewController: DocumentDetailLedgerSavedViewController<any>;
    renderDocumentActions: (row: MaterialIssueDetailLedgerRow, reload: () => void) => ReactNode;
    navigateToRequest: (id: string) => void;
    renderLifecycle?: (reload: () => void) => ReactNode;
    pagination?: ProTableProps<object, Record<string, unknown>>['pagination']; exportFileName?: string;
  };
  initialFilters?: Record<string, unknown>; onCreate?: () => void;
  onViewChange?: (view: DocumentViewMode) => void;
  tableActionRef?: RefObject<ActionType | null>; filterFormRef?: RefObject<ProFormInstance | undefined>;
}
