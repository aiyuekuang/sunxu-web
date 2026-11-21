import type { ReactNode } from 'react';

export interface SaleOrderForShipAction {
  id?: string | null;
}

export interface SaleDeliveryEditorHostProps {
  open: boolean;
  saleOrderId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export interface SaleOrderShipActionCapabilities {
  /** Renders the host's single authoritative sales-delivery editor. */
  renderDeliveryEditor: (props: SaleDeliveryEditorHostProps) => ReactNode;
}

export interface SaleOrderShipActionModalProps {
  open: boolean;
  order: SaleOrderForShipAction | null;
  onClose: () => void;
  onSuccess: () => void;
  capabilities: SaleOrderShipActionCapabilities;
}
