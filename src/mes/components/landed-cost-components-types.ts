import type { ReactNode } from 'react';
import type { ProFormSelectProps } from '@ant-design/pro-components';
import type { Dayjs } from 'dayjs';
import type { DocumentActionDefinition } from './DocumentActionsDropdown';
import type { MesStatusEnum } from './StatusDisplay';

export type LandedCostAllocationBasis =
  | 'amount'
  | 'quantity'
  | 'weight'
  | 'manual';

export interface LandedCostMaterialSnapshot {
  id?: string;
  name?: string | null;
  code?: string | null;
  spec?: string | null;
}

export interface LandedCostReceiptItem {
  id: string;
  quantity: number;
  amount?: number | null;
  discountedAmount?: number | null;
  batchNo?: string | null;
  material?: LandedCostMaterialSnapshot | null;
}

export interface LandedCostReceiptDetail {
  id: string;
  receiptNo: string;
  items?: LandedCostReceiptItem[];
}

export interface LandedCostAllocation {
  id: string;
  receiptItemId: string;
  receiptOrderId: string;
  receiptItem?: { material?: LandedCostMaterialSnapshot | null } | null;
  materialId?: string;
  warehouseId?: string;
  receiptNoSnapshot: string;
  batchNoSnapshot?: string | null;
  receiptQuantitySnapshot: number;
  allocationBase: number;
  allocatedAmount: number;
  allocatedTaxAmount?: number | null;
  accountingSourceDocumentId?: string | null;
}

export interface LandedCostRecord {
  id: string;
  availableActions?: string[];
  costNo: string;
  documentType: 'normal' | 'credit';
  status: 'draft' | 'submitted' | 'confirmed' | 'reversed' | 'cancelled';
  expenseTypeId: string;
  expenseType?: LandedCostExpenseType | null;
  expenseTypeCodeSnapshot?: unknown;
  expenseTypeNameSnapshot?: unknown;
  carrierId: string;
  carrier?: { id?: string; name?: string | null } | null;
  carrierNameSnapshot?: unknown;
  externalRefNo: string;
  amount: number;
  amountExcludingTax?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  currency: string;
  exchangeRate: number;
  businessDate: string;
  allocationBasis: LandedCostAllocationBasis;
  financeInvoice?: { invoiceNo?: string | null } | null;
  reversalOfId?: string | null;
  confirmedAt?: string | null;
  reversalReason?: string | null;
  remark?: string | null;
  allocations: LandedCostAllocation[];
}

export interface LandedCostExpenseType {
  id: string;
  code?: string;
  name?: string;
  defaultAllocationBasis?: string | null;
  capitalizable?: boolean;
}

export interface LandedCostAccountingSourceDocument {
  id: string;
  sourceNo: string;
  status: string;
  lastErrorMessage?: string | null;
}

export interface LandedCostAllocationPolicy {
  supportedAllocationBases: LandedCostAllocationBasis[];
  unavailableAllocationBases: Array<{
    basis: LandedCostAllocationBasis;
    reason?: string;
  }>;
}

export interface LandedCostAllocationDraft {
  receiptItemId: string;
  receiptOrderId: string;
  display: string;
  allocationAmount?: number;
  /** Preview only; the server remains authoritative for the final allocation base. */
  previewBases?: Partial<Record<Exclude<LandedCostAllocationBasis, 'manual'>, number>>;
}

export interface LandedCostAllocationPreviewLine {
  receiptItemId: string;
  display: string;
  allocationBase?: number;
  estimatedAllocationAmount?: number;
  manualAllocationAmount?: number;
}

export interface LandedCostAllocationPreview {
  allocationBasis: LandedCostAllocationBasis;
  capitalizableAmount?: number;
  totalBase?: number;
  allocatedAmount?: number;
  pendingAmount?: number;
  lines: LandedCostAllocationPreviewLine[];
}

export interface LandedCostFormValues {
  expenseTypeId?: string;
  carrierId?: string;
  externalRefNo?: string;
  amount?: number;
  amountExcludingTax?: number;
  taxRate?: number;
  taxAmount?: number;
  currency?: string;
  exchangeRate?: number;
  businessDate?: Dayjs | string;
  allocationBasis?: LandedCostAllocationBasis;
  receiptOrderIds?: string[];
  allocations?: LandedCostAllocationDraft[];
  remark?: string;
}

export interface LandedCostCreatePayload {
  expenseTypeId: string;
  carrierId: string;
  externalRefNo: string;
  amount: number;
  amountExcludingTax?: number;
  taxRate?: number;
  taxAmount?: number;
  currency: string;
  exchangeRate?: number;
  businessDate?: string;
  allocationBasis?: LandedCostAllocationBasis;
  allocations: Array<{
    receiptItemId: string;
    allocationAmount?: number;
  }>;
  remark?: string;
}

export type LandedCostUpdatePayload = LandedCostCreatePayload & { id: string };
export type LandedCostSelectRequest = NonNullable<ProFormSelectProps['request']>;

export interface LandedCostConfigEntryFieldLabelProps {
  target: 'accountingExpenseTypes' | 'supplier' | 'purchaseReceipts';
  label: ReactNode;
  show: boolean;
  onOpen: () => void;
}

export interface LandedCostActionDocument extends LandedCostRecord {
  availableActions?: string[];
}

export interface LandedCostDetailDrawerProps {
  open: boolean;
  landedCostId?: string;
  onOpenChange: (open: boolean) => void;
  onAction?: (
    key: string,
    document: LandedCostActionDocument,
  ) => void | Promise<void>;
  capabilities: LandedCostDetailCapabilities;
}

export interface LandedCostDetailCapabilities {
  loadDetail: (id: string) => Promise<LandedCostRecord>;
  loadAccountingSourceDetails: (
    ids: readonly string[],
  ) => Promise<LandedCostAccountingSourceDocument[]>;
  replayAccountingSource: (id: string) => Promise<unknown>;
  canReadAccountingSource: boolean;
  canReplayAccountingSource: boolean;
  replayableAccountingSourceStatuses: ReadonlySet<string>;
  statusEnum: MesStatusEnum;
  documentTypeEnum: MesStatusEnum;
  allocationBasisEnum: MesStatusEnum;
  accountingSourceStatusEnum: MesStatusEnum;
  actions: readonly DocumentActionDefinition<LandedCostActionDocument>[];
  notify: (type: 'success' | 'warning', message: string) => void;
  navigateAccountingSource: (sourceId: string) => void;
  formatAmount: (value: number | null | undefined) => string;
  formatTaxRate: (value: number | null | undefined) => string;
  formatDate: (value: string | null | undefined) => string;
  formatDateTime: (value: string | null | undefined) => string;
}

export interface LandedCostFormDrawerProps {
  open: boolean;
  landedCostId?: string;
  initialReceiptOrderId?: string;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  capabilities: LandedCostFormCapabilities;
}

export interface LandedCostFormCapabilities {
  loadAllocationPolicy: () => Promise<LandedCostAllocationPolicy>;
  loadExpenseTypeDetail: (id: string) => Promise<LandedCostExpenseType>;
  loadDetail: (id: string) => Promise<LandedCostRecord>;
  loadReceiptDetail: (id: string) => Promise<LandedCostReceiptDetail>;
  /** Must return active, capitalizable purchase-additional-cost expense types. */
  requestExpenseTypeOptions: LandedCostSelectRequest;
  /** Must return active suppliers only. */
  requestCarrierOptions: LandedCostSelectRequest;
  /** Must return received purchase receipts only. */
  requestReceiptOptions: LandedCostSelectRequest;
  create: (payload: LandedCostCreatePayload) => Promise<unknown>;
  update: (payload: LandedCostUpdatePayload) => Promise<unknown>;
  allocationBasisEnum: MesStatusEnum;
  renderConfigEntryFieldLabel: (
    props: LandedCostConfigEntryFieldLabelProps,
  ) => ReactNode;
  notify: (type: 'success' | 'warning', message: string) => void;
}

export interface LandedCostReceiptContextCardProps {
  receiptOrderId: string;
  onOpenLandedCost: (landedCostId: string) => void;
  capabilities: LandedCostReceiptContextCapabilities;
}

export interface LandedCostReceiptContextCapabilities {
  listByReceipt: (receiptOrderId: string) => Promise<LandedCostRecord[]>;
  loadAccountingSourceDetails: (
    ids: readonly string[],
  ) => Promise<LandedCostAccountingSourceDocument[]>;
  replayAccountingSource: (id: string) => Promise<unknown>;
  canReadAccountingSource: boolean;
  canReplayAccountingSource: boolean;
  replayableAccountingSourceStatuses: ReadonlySet<string>;
  landedCostStatusEnum: MesStatusEnum;
  accountingSourceStatusEnum: MesStatusEnum;
  notify: (type: 'success' | 'warning', message: string) => void;
  formatAmount: (value: number | null | undefined) => string;
  formatDate: (value: string | null | undefined) => string;
}
