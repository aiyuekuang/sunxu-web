import type { ReactNode } from 'react';
import type { MesUiProviderProps } from '../MesUiProvider';
import type { MesOrderItemEditorCapabilities } from './order-item-editor-types';
import type { MesMaterialTablePickerCapabilities } from './material-table-picker-types';
import type { MesMaterialSelectCapabilities } from './material-select-types';
import type { FilterableSelectRequestFn } from './material-select-types';

export interface BomRequisitionInputItem {
  materialId: string;
  quantity: number;
}

export interface BomRequisitionPreviewRequest {
  items: BomRequisitionInputItem[];
  maxDepth?: number;
}

export interface BomRequisitionPreviewSource {
  rootMaterialId: string;
  rootMaterialCode: string;
  rootMaterialName: string;
  rootQuantity: number;
  parentBomHeaderId?: string | null;
  parentBomVersion?: string | null;
  bomItemId?: string | null;
  path: string;
  level: number;
  quantity: number;
}

export interface BomRequisitionPreviewItem {
  materialId: string;
  materialCode: string;
  materialName: string;
  materialSpec?: string | null;
  materialUnit?: string | null;
  procurementType?: string | null;
  requiredQty: number;
  sourceCount: number;
  sources: BomRequisitionPreviewSource[];
}

export interface BomRequisitionWarning {
  code:
    | 'missing_bom'
    | 'cycle_detected'
    | 'max_depth_reached'
    | 'inactive_material';
  message: string;
  level: number;
  path: string;
  materialId?: string | null;
  materialCode?: string | null;
}

export interface BomRequisitionPreviewResponse {
  inputCount: number;
  itemCount: number;
  totalRequiredQty: number;
  items: BomRequisitionPreviewItem[];
  warnings: BomRequisitionWarning[];
}

export interface CreateRequisitionFromBomRequest
  extends BomRequisitionPreviewRequest {
  suggestedPurchaseDate?: string;
  expectedArrivalDate?: string;
  remarks?: string;
}

export interface BomExpansionCreateModalCapabilities<TResult> {
  /** MES BOM preview endpoint and DTO mapping remain host-owned. */
  previewFromBom: (
    request: BomRequisitionPreviewRequest,
  ) => Promise<BomRequisitionPreviewResponse>;
  /** MES create endpoint and returned purchase requisition remain host-owned. */
  createFromBom: (request: CreateRequisitionFromBomRequest) => Promise<TResult>;
  /** Existing active-material option service used by the line editor. */
  requestMaterials: FilterableSelectRequestFn;
  /** Dictionary labels for the material_unit dictionary. */
  unitLabelMap: Readonly<Record<string, string>>;
  /** Host's quantity formatter, preserving its number precision and locale. */
  formatQuantity: (value?: number | string | null) => string;
  notifyWarning: (message: string) => void;
  notifySuccess: (message: string) => void;
  /** Host permissions consumed by shared MES selectors and table picker. */
  hasPermission: MesUiProviderProps['hasPermission'];
  materialTablePickerCapabilities: MesMaterialTablePickerCapabilities;
  materialSelectCapabilities: MesMaterialSelectCapabilities;
  orderItemEditorCapabilities: MesOrderItemEditorCapabilities;
  /** Host-owned purchase field-help catalog integration. */
  renderFieldHelp: (
    label: ReactNode,
    key: 'requisitionItems' | 'remarks',
  ) => ReactNode;
}

export interface BomExpansionCreateModalProps<TResult> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: TResult) => void;
  capabilities: BomExpansionCreateModalCapabilities<TResult>;
}
