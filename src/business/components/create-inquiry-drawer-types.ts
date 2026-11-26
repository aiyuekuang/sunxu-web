import type { ProFormSelectProps } from '@ant-design/pro-components';

export interface InquiryMaterialReference {
  code?: string | null;
  name?: string | null;
}

export interface InquiryRequisitionItem {
  id: string;
  requiredQty?: number | string | null;
  orderedQty?: number | string | null;
  material?: InquiryMaterialReference | null;
}

export interface InquiryRequisition {
  id: string;
  items?: InquiryRequisitionItem[] | null;
}

export interface CreateInquiryInput {
  requisitionId: string;
  inquiryNo?: string;
  supplierIds?: string[];
  quoteDeadline?: string;
  remarks?: string;
  items: Array<{ requisitionItemId: string; inquiryQty: number }>;
}

export interface CreatedInquiryReference {
  id?: string;
}

export interface CreateInquiryDrawerCapabilities {
  createFromRequisition: (input: CreateInquiryInput) => Promise<CreatedInquiryReference>;
  /** Uses the host's active supplier query and preserves its search/page arguments. */
  requestSupplierOptions: NonNullable<ProFormSelectProps['request']>;
  notifyWarning: (text: string) => void;
  notifySuccess: (text: string) => void;
}

export interface CreateInquiryDrawerProps {
  open: boolean;
  requisition: InquiryRequisition;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** Called with the created inquiry ID when the host wants to open its detail. */
  onOpenCreated?: (inquiryId: string) => void;
  navigateToCreated?: boolean;
  capabilities: CreateInquiryDrawerCapabilities;
}
