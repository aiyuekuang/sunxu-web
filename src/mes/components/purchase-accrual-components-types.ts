import type { MesStatusEnum } from './StatusDisplay';
import type { Key } from 'react';

export interface PurchaseAccrualRunLine {
  id: string;
  sourceDocumentId: string;
  sourceDocumentNo: string;
  materialName?: string | null;
  materialCode?: string | null;
  supplierName?: string | null;
  accrualQuantity: number;
  accrualAmount: number;
  clearedQuantity: number;
  clearedAmount: number;
  remainingQuantity: number;
  remainingAmount: number;
  status: string;
}

export interface PurchaseAccrualRun {
  id: string;
  runNo: string;
  status: 'confirmed' | 'reversed';
  accountingBookCode: string;
  fiscalPeriod: string;
  cutoffDate: string;
  totalAccrualAmount: number;
  lineCount: number;
}

export interface PurchaseAccrualDetail {
  run: PurchaseAccrualRun;
  lines: PurchaseAccrualRunLine[];
}

export interface PurchaseAccrualPreviewLine {
  sourceDocumentId: string;
  sourceDocumentNo: string;
  sourceLineId: string;
  materialName?: string | null;
  materialCode?: string | null;
  supplierName?: string | null;
  receiptDate: string;
  receiptQuantity: number;
  returnedQuantity: number;
  invoicedQuantity: number;
  existingAccrualQuantity: number;
  accrualQuantity: number;
  accrualAmount: number;
  issue?: string | null;
}

export interface PurchaseAccrualPreviewResult {
  lines: PurchaseAccrualPreviewLine[];
  totalAccrualAmount: number;
  eligibleLineCount: number;
  issueLineCount: number;
}

export interface PurchaseAccrualPreview {
  accountingBookCode: string;
  fiscalPeriod: string;
  cutoffDate: string;
  result: PurchaseAccrualPreviewResult;
}

export interface PurchaseAccrualDetailDrawerCapabilities {
  canReverse: boolean;
  canViewPurchaseReceipt: boolean;
  statusEnum: MesStatusEnum;
  lineStatusEnum: MesStatusEnum;
  reverseRun: (params: {
    id: string;
    reason?: string;
  }) => Promise<PurchaseAccrualDetail>;
  onOpenPurchaseReceipt: (documentId: string) => void;
  notifySuccess: (message: string) => void;
}

export interface PurchaseAccrualDetailDrawerProps {
  detail?: PurchaseAccrualDetail;
  onClose: () => void;
  onReversed: (detail: PurchaseAccrualDetail) => void;
  capabilities: PurchaseAccrualDetailDrawerCapabilities;
}

export interface PurchaseAccrualPreviewDrawerProps {
  preview?: PurchaseAccrualPreview;
  selectedLineIds: Key[];
  confirming: boolean;
  canViewPurchaseReceipt: boolean;
  onSelectedLineIdsChange: (ids: Key[]) => void;
  onOpenPurchaseReceipt: (documentId: string) => void;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}
