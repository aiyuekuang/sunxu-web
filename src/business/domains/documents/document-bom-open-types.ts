import type { ReactNode } from 'react';
import type { ButtonProps } from 'antd';
import type { DocumentBomDrawerCapabilities } from './document-bom-drawer-types';

export type DocumentBomDocumentType =
  | 'sale_order_item'
  | 'production_plan'
  | 'work_order'
  | 'internal_project';

export interface DocumentBomDrawerRenderProps {
  open: boolean;
  documentType: DocumentBomDocumentType;
  documentId?: string;
  title?: string;
  onClose: () => void;
  editable?: boolean;
  productQty?: number;
  onSaved?: () => void;
  initialEdit?: boolean;
  initialImport?: boolean;
}

export interface DocumentBomOpenButtonProps {
  documentType: DocumentBomDocumentType;
  documentId?: string;
  title?: string;
  children?: ReactNode;
  buttonProps?: ButtonProps;
  editable?: boolean;
  productQty?: number;
  onSaved?: () => void;
  initialEdit?: boolean;
  initialImport?: boolean;
}

export type DocumentBomOpenCapabilities = {
  canView: () => boolean;
  canUpdate: () => boolean;
} & (
  | {
      /** Render the Sunxu host drawer with the host's API and policy capabilities. */
      drawerCapabilities: Omit<DocumentBomDrawerCapabilities, 'permissions'>;
      renderDrawer?: never;
    }
  | {
      /** Temporary compatibility adapter for hosts that still render a legacy drawer. */
      drawerCapabilities?: never;
      renderDrawer: (props: DocumentBomDrawerRenderProps) => ReactNode;
    }
);
