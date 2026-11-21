import type { FormItemProps, SelectProps } from 'antd';
import type { ProTableProps } from '@ant-design/pro-components';
import type { ReactNode } from 'react';
import type { DateRangePickerPreset } from '../../components/dateRangePresets';
import type { FilterableSelectRequestFn } from './material-select-types';

export type MesPackageType = 'carton' | 'bag' | 'tray' | 'pallet';
export type MesPackageSourceMode = 'batch' | 'production_tx' | 'stock_balance';

export interface PackageMaterialSnapshot {
  id?: string;
  code?: string | null;
  name?: string | null;
  spec?: string | null;
  unit?: string | null;
  baseType?: string | null;
}

export interface MaterialPackageSpecRecord {
  id: string;
  createdAt: string;
  updatedAt?: string;
  companyId?: string;
  materialId: string;
  material?: PackageMaterialSnapshot | null;
  packageType: MesPackageType;
  packageName?: string | null;
  capacityQty: number;
  minQty?: number | null;
  maxQty?: number | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  remarks?: string | null;
}

export interface PackageSpecWriteValues {
  id?: string;
  materialId: string;
  packageType: MesPackageType;
  packageName?: string;
  capacityQty: number;
  minQty?: number;
  maxQty?: number;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  remarks?: string;
}

export interface PackageSpecListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  materialId?: string;
  packageType?: MesPackageType;
  packageName?: string;
  isActive?: boolean;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
}

export interface PackageAvailableSourceRecord {
  id: string;
  sourceMode: MesPackageSourceMode;
  sourceKey: string;
  batchTracking: boolean;
  batchId?: string | null;
  batchNo?: string | null;
  materialId: string;
  materialCode: string;
  materialName: string;
  materialSpec?: string | null;
  unit: string;
  warehouseId: string;
  warehouseName: string;
  locationId?: string | null;
  storageLocationSnapshot?: string | null;
  sourceQty?: number | null;
  batchQty?: number | null;
  packagedQty: number;
  batchAvailableQty?: number | null;
  stockAvailableQty: number;
  availableQty: number;
  sourceWorkOrderId?: string | null;
  sourceWorkOrderNo?: string | null;
  sourceTransactionId?: string | null;
  sourceReferenceNo?: string | null;
  packageSpecId?: string | null;
  packageType?: MesPackageType;
  capacityQty?: number | null;
}

export interface PackageUnitRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  createdBy?: string | null;
  creator?: Record<string, unknown>;
  updatedBy?: string | null;
  updater?: Record<string, unknown>;
  packageNo: string;
  warehouseId: string;
  warehouse?: { name?: string | null } | null;
  locationId?: string | null;
  location?: Record<string, unknown>;
  storageLocationSnapshot?: string | null;
  materialId: string;
  material?: PackageMaterialSnapshot | null;
  batchId?: string | null;
  batch?: Record<string, unknown>;
  batchNo?: string | null;
  packageSpecId?: string | null;
  packageSpec?: MaterialPackageSpecRecord;
  packageType: MesPackageType;
  status: 'sealed' | 'allocated' | 'shipped' | 'cancelled';
  totalQty: number;
  lineCount: number;
  sourceType: 'production';
  sourceWorkOrderId?: string | null;
  sourceWorkOrder?: Record<string, unknown>;
  sourceTransactionId?: string | null;
  saleDeliveryOrderId?: string | null;
  printedAt?: string | null;
  printedBy?: string | null;
  reprintCount: number;
  shippedAt?: string | null;
  shippedBy?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  remarks?: string | null;
  lines?: PackageUnitLineRecord[];
}

export interface PackageUnitLineRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  packageUnitId: string;
  packageUnit?: PackageUnitRecord;
  materialId: string;
  material?: PackageMaterialSnapshot | null;
  batchId?: string | null;
  batch?: Record<string, unknown>;
  batchNo?: string | null;
  warehouseId: string;
  warehouse?: { name?: string | null } | null;
  locationId?: string | null;
  location?: Record<string, unknown>;
  storageLocationSnapshot?: string | null;
  qty: number;
  sourceWorkOrderId?: string | null;
  sourceTransactionId?: string | null;
  remarks?: string | null;
}

export interface PackageCreatePayload {
  sourceMode?: MesPackageSourceMode;
  batchId?: string;
  materialId?: string;
  warehouseId?: string;
  locationId?: string;
  packageSpecId?: string;
  packageType?: MesPackageType;
  sourceWorkOrderId?: string;
  sourceTransactionId?: string;
  printNow?: boolean;
  remarks?: string;
  packages: Array<{ qty: number; remarks?: string }>;
}

export interface PackageSplitPreview {
  packageType: MesPackageType;
  capacityQty: number;
  totalQty: number;
  items: Array<{ index: number; qty: number; isTail: boolean }>;
}

export type PackageSpecFieldHelpKey =
  | 'specMaterialId'
  | 'specPackageType'
  | 'specPackageName'
  | 'specCapacityQty'
  | 'specMinQty'
  | 'specMaxQty'
  | 'specIsDefault';

export type PackageUnitFieldHelpKey =
  | 'sourceCompletionDate'
  | 'sourceBatchId'
  | 'totalQty'
  | 'packageSpecId'
  | 'packageType'
  | 'printNow';

export type PackageFieldHelpProps = Partial<
  Pick<FormItemProps, 'label' | 'tooltip' | 'extra' | 'required'>
>;

export interface PackageSpecManagerCapabilities {
  pagination?: ProTableProps<MaterialPackageSpecRecord, Record<string, unknown>>['pagination'];
  packageTypeOptions: NonNullable<SelectProps['options']>;
  packageTypeLabels: Readonly<Record<string, string>>;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  requestMaterialOptions: (params: {
    keyWords?: string;
    activeOnly: boolean;
  }) => Promise<Awaited<ReturnType<FilterableSelectRequestFn>>>;
  listSpecs: (params: PackageSpecListParams) => Promise<{
    list?: MaterialPackageSpecRecord[] | null;
    total?: number | null;
  }>;
  getSpec: (id: string) => Promise<MaterialPackageSpecRecord>;
  createSpec: (values: PackageSpecWriteValues) => Promise<unknown>;
  updateSpec: (values: PackageSpecWriteValues & { id: string }) => Promise<unknown>;
  deleteSpec: (id: string) => Promise<unknown>;
  notify: { success: (message: string) => void };
  getFieldHelpProps: (
    label: string,
    key?: PackageSpecFieldHelpKey,
  ) => PackageFieldHelpProps;
  getAutoFieldHelpProps: (label: string) => PackageFieldHelpProps;
}

export interface PackageSpecManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capabilities: PackageSpecManagerCapabilities;
}

export interface PackageUnitCreateFormValues extends Omit<PackageCreatePayload, 'packages'> {
  sourceBatchId?: string;
  filterSourceMaterialId?: string;
  filterSourceWorkOrderId?: string;
  filterSourceWarehouseId?: string;
  filterSourceBatchNo?: string;
  filterSourceReferenceNo?: string;
  filterSourceDateRange?: [unknown, unknown];
  totalQty?: number;
}

export interface PackageSourceFilters {
  warehouseId?: string;
  materialId?: string;
  sourceWorkOrderId?: string;
  batchNo?: string;
  sourceReferenceNo?: string;
  startDate?: string;
  endDate?: string;
  refreshKey: number;
}

export interface PackageAvailableSourceListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  warehouseId?: string;
  locationId?: string;
  materialId?: string;
  batchNo?: string;
  sourceWorkOrderId?: string;
  sourceReferenceNo?: string;
  startDate?: string;
  endDate?: string;
}

export interface PackageUnitCreateCapabilities {
  packageTypeOptions: NonNullable<SelectProps['options']>;
  packageTypeLabels: Readonly<Record<string, string>>;
  unitLabelMap: Readonly<Record<string, string>>;
  requestPackableMaterialOptions: FilterableSelectRequestFn;
  requestWarehouseOptions: FilterableSelectRequestFn;
  listAvailableSources: (params: PackageAvailableSourceListParams) => Promise<{
    list?: PackageAvailableSourceRecord[] | null;
    total?: number | null;
  }>;
  listSpecs: (params: PackageSpecListParams & {
    page: number;
    pageSize: number;
    materialId: string;
    isActive: true;
  }) => Promise<{ list?: MaterialPackageSpecRecord[] | null }>;
  previewSplit: (params: {
    totalQty: number;
    packageSpecId?: string;
    capacityQty?: number;
    packageType?: MesPackageType;
  }) => Promise<PackageSplitPreview>;
  createUnits: (payload: PackageCreatePayload) => Promise<PackageUnitRecord[]>;
  notify: {
    success: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
  getFieldHelpProps: (
    label: string,
    key?: PackageUnitFieldHelpKey,
  ) => PackageFieldHelpProps;
  getAutoFieldHelpProps: (label: string) => PackageFieldHelpProps;
  renderConfigEntryLabel: (props: {
    target: 'productionReceipts' | 'packageSpecs';
    children: ReactNode;
    show?: boolean;
    onOpen: () => void;
  }) => ReactNode;
  renderConfigEntryLink: (props: {
    target: 'productionReceipts';
    label: string;
    actionText: string;
    onOpen: () => void;
  }) => ReactNode;
  dateRangePresets?: readonly DateRangePickerPreset[];
}

export interface PackageUnitCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (units: PackageUnitRecord[], printNow: boolean) => void;
  capabilities: PackageUnitCreateCapabilities;
}
