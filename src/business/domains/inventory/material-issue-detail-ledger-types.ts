import type { ActionType, ProColumns, ProFormInstance, ProTableProps } from '@ant-design/pro-components';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { ReactNode, RefObject } from 'react';
import type { DocumentDetailLedgerSavedViewController } from '../documents/DocumentDetailLedgerTable';
import type { DocumentViewBarView } from '../documents/DocumentViewBar';
import type { StatusMap } from '../../../components/StatusDisplay';
import type { ResizableTableConfig } from '../shared/ResizableTable';
import type { DocumentViewMode } from '../documents/DocumentViewSwitch';

export interface MaterialIssueDetailLedgerMaterial {
  id?: string;
  name?: string | null;
  code?: string | null;
  spec?: string | null;
  unit?: string | null;
  [key: string]: unknown;
}

export interface MaterialIssueDetailLedgerOrder {
  id: string;
  issueNo?: string | null;
  type?: string | null;
  status?: string | null;
  plannedIssueAt?: string | null;
  confirmedAt?: string | null;
  workOrder?: { id?: string; orderNo?: string | null; [key: string]: unknown } | null;
  operator?: { id?: string; realName?: string | null; username?: string | null; [key: string]: unknown } | null;
  [key: string]: unknown;
}

export interface MaterialIssueDetailLedgerRow {
  id: string; issueNo?: string; orderNo?: string; status?: string; type?: string;
  material?: MaterialIssueDetailLedgerMaterial | null;
  issueOrder?: MaterialIssueDetailLedgerOrder | null;
  materialName?: string; materialCode?: string; materialSpec?: string;
  requiredQty?: number | string; actualQty?: number | string; issueQty?: number | string;
  issueUnit?: string; warehouseName?: string;
  location?: { pathName?: string | null; name?: string | null; [key: string]: unknown } | null;
  warehouse?: { id?: string; name?: string | null; [key: string]: unknown } | null;
  storageLocationSnapshot?: string | null;
  batchNo?: string;
  plannedIssueAt?: string; confirmedAt?: string; createdAt?: string; updatedAt?: string;
  operatorName?: string; remarks?: string;
  [key: string]: unknown;
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
    dateRangePresets: NonNullable<RangePickerProps['presets']>;
    statusEnum: StatusMap; typeEnum: StatusMap;
    unitLabelMap?: Readonly<Record<string, string>>;
    materialCustomFieldColumns?: ProColumns<MaterialIssueDetailLedgerRow>[];
    lineCustomFieldColumns?: ProColumns<MaterialIssueDetailLedgerRow>[];
    format: { formatNumber(value: unknown): string; formatDate(value?: string | null): string; formatDateTime(value?: string | null): string; formatUnit(value?: string | null): string; };
    canViewRequest: boolean; canExport: boolean; canCreate: boolean;
    exportPermission: string; createPermission?: string; resizable: ResizableTableConfig;
    serverSortFields?: readonly string[]; savedViewController: DocumentDetailLedgerSavedViewController<DocumentViewBarView>;
    renderDocumentActions: (row: MaterialIssueDetailLedgerRow, reload: () => void) => ReactNode;
    navigateToRequest: (id: string) => void;
    renderLifecycle?: (reload: () => void) => ReactNode;
    pagination?: ProTableProps<object, Record<string, unknown>>['pagination']; exportFileName?: string;
  };
  initialFilters?: Record<string, unknown>; onCreate?: () => void;
  onViewChange?: (view: DocumentViewMode) => void;
  tableActionRef?: RefObject<ActionType | null>; filterFormRef?: RefObject<ProFormInstance | undefined>;
}
