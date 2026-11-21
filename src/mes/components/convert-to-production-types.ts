import type { CSSProperties, ReactNode } from 'react';

export type PlanQuantityMode = 'rate-driven' | 'qty-driven';

export type ProductionFieldHelpKey =
  | 'requiredQty'
  | 'quantityMode'
  | 'plannedLossRate'
  | 'plannedQty'
  | 'planStartDate'
  | 'planEndDate';

export interface SaleOrderConvertFieldHelpProps {
  label: string;
  tooltip?: { title: ReactNode; overlayStyle?: CSSProperties };
}

export interface ProductionOption {
  label: string;
  value: string;
  sourceType?: string;
  raw?: unknown;
}

export interface SaleOrderSummary {
  id: string;
  orderNo?: string | null;
}

export interface SaleOrderConvertInfoItem {
  saleOrderItemId: string;
  saleOrderItemLineNo: number;
  drawingCount: number;
  materialId: string;
  materialName: string;
  materialCode: string;
  materialUnit: string;
  selectedBomHeaderId?: string | null;
  documentBomId?: string | null;
  documentBomStatus?: string | null;
  bomSourceType?: string | null;
  deliveryDate?: string | null;
  orderQty: number;
  convertedRequiredQty: number;
  deliveredQty: number;
  remainingRequiredQty: number;
  grossDemandQty: number;
  currentStockQty: number;
  safetyStockQty: number;
  stockOffsetQty: number;
  suggestedProductionQty: number;
  source: 'stock' | 'production' | 'stock_and_production';
  defaultLossRate: number;
  suggestedPlannedQty: number;
  defaultBomHeaderId?: string | null;
  defaultBomLabel?: string | null;
  defaultBomStatus?: string;
  defaultBomMessage?: string | null;
  defaultRouteId?: string | null;
  defaultRouteLabel?: string | null;
  defaultRouteVersionLabel?: string | null;
  defaultRouteStatus?: string;
  defaultRouteMessage?: string | null;
  compatibilityStatus?: string;
  compatibilityMessage?: string | null;
  warnings?: string[];
}

export interface SaleOrderProductionPreparation {
  saleOrderId: string;
  conclusion: 'ready' | 'warning' | 'blocking' | string;
  drawing: {
    hasDrawing: boolean;
    orderAttachmentCount: number;
    itemDrawingCount: number;
  };
  bom: { totalCount: number; activeConfirmedCount: number };
  route: { matchedCount: number; missingCount: number };
  todo: { unfinishedCount: number; overdueCount: number };
  warnings: string[];
  blockers: string[];
}

export interface ConvertItem {
  saleOrderItemId: string;
  requiredQty?: number;
  plannedLossRate?: number;
  plannedQty?: number;
  bomHeaderId?: string;
  routeId?: string;
  sourceDemandQty?: number;
  stockOffsetQty?: number;
  stockNettingMode?: 'none' | 'accepted' | 'manual_override';
  stockNettingSnapshot?: Record<string, unknown>;
  stockNettingReason?: string;
  sourceDemandType?:
    | 'sales_order'
    | 'direct_plan'
    | 'stock_replenishment'
    | 'trial'
    | 'rework'
    | 'mrp';
}

export interface BatchConvertToProductionInput {
  saleOrderId: string;
  planStartDate?: string;
  planEndDate?: string;
  priority?: number;
  description?: string;
  items: ConvertItem[];
  autoCreateWorkOrder?: boolean;
}

export interface BatchConvertToProductionResult {
  plans: Array<{ workOrderId?: string | null }>;
  warnings?: string[];
  productionPreparation?: SaleOrderProductionPreparation;
}

export interface ConvertToProductionValues {
  planStartDate?: string;
  planEndDate?: string;
  priority?: number;
  description?: string;
}

export interface SaleOrderConvertToProductionCapabilities {
  getConvertInfo: (params: {
    saleOrderId: string;
    planStartDate?: string;
  }) => Promise<{
    items?: SaleOrderConvertInfoItem[];
    productionPreparation?: SaleOrderProductionPreparation | null;
  }>;
  batchConvert: (
    input: BatchConvertToProductionInput,
  ) => Promise<BatchConvertToProductionResult>;
  requestBomOptions: (params: {
    keyWords?: string;
    materialId: string;
    saleOrderId: string;
    saleOrderItemId: string;
  }) => Promise<ProductionOption[]>;
  requestRouteOptions: (params: {
    keyWords?: string;
    materialId: string;
    routeSelectionDate?: string;
  }) => Promise<ProductionOption[]>;
  notify: {
    success: (content: string) => void;
    warning: (content: string) => void;
    error: (content: string) => void;
  };
  messages: { convertSuccess: string };
  fieldHelp: {
    productionProps: (
      label: string,
      key: ProductionFieldHelpKey,
    ) => SaleOrderConvertFieldHelpProps;
    productionLabel: (
      label: ReactNode,
      key: ProductionFieldHelpKey,
    ) => ReactNode;
    automaticProps: (label: string) => SaleOrderConvertFieldHelpProps;
  };
}

export interface ConvertToProductionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: SaleOrderSummary;
  onSuccess: (result: BatchConvertToProductionResult) => void;
  /** 转换后是否直接生成工单（销售订单「转工单」一步到位）；缺省仅转生产计划草稿 */
  autoCreateWorkOrder?: boolean;
  capabilities: SaleOrderConvertToProductionCapabilities;
}
