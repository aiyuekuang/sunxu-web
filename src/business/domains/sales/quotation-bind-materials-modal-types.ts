import type { ReactNode } from 'react';
import type { FilterableSelectRequestFn } from '../inventory/material-select-types';

export interface QuotationMaterialBindingItem {
  id: string;
  materialId?: string | null;
  customerMaterialCode?: string | null;
  customerMaterialName?: string | null;
  customerMaterialSpec?: string | null;
}

export interface QuotationForMaterialBinding {
  id: string;
  items?: QuotationMaterialBindingItem[] | null;
}

export interface QuotationMaterialConfigEntryProps {
  target: 'material';
  children: ReactNode;
  show: boolean;
  onOpen: () => void;
}

export interface QuotationBindMaterialsCapabilities {
  bindMaterials: (request: {
    id: string;
    items: Array<{ itemId: string; materialId: string }>;
  }) => Promise<unknown>;
  requestActiveMaterials: FilterableSelectRequestFn;
  renderMaterialConfigEntryLabel: (
    props: QuotationMaterialConfigEntryProps,
  ) => ReactNode;
  notifyWarning: (content: string) => void;
  notifySuccess: (content: string) => void;
  messages: { bindSuccess: string };
}

export interface QuotationBindMaterialsModalProps {
  quotation: QuotationForMaterialBinding | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
  capabilities: QuotationBindMaterialsCapabilities;
}
