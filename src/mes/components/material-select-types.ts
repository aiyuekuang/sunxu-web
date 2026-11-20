import type { ReactNode } from 'react';

export type MaterialBaseType = string;

export interface MaterialFilteredSelectOption {
  label: string;
  value: string;
  title?: string;
  code?: string | null;
  name?: string | null;
  unit?: string | null;
  familyId?: string | null;
  familyLabel?: string | null;
  baseType?: MaterialBaseType | null;
  categoryId?: string | null;
  categoryName?: string | null;
  spec?: string | null;
  hasBatchTracking?: boolean | null;
  /** 有效保质期天数，供收货批号规则提示。 */
  shelfLifeDays?: number | null;
  traceabilityMode?: string | null;
  /** 主档默认仓库；由宿主决定是否用作单据行初始值。 */
  defaultWarehouseId?: string | null;
  defaultWarehouseName?: string | null;
  /** 采购类型，供 BOM 供料方式等联动默认值使用。 */
  procurementType?: string | null;
  /** 选择器副信息使用的 MES 自定义字段原始值、计算值和计算异常。 */
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
  /** 客户料号优先选择结果中的冻结客户物料快照。 */
  customerMaterialCode?: string | null;
  customerMaterialName?: string | null;
  customerMaterialSpec?: string | null;
}

export type FilterableSelectRequestFn = (
  params?: { keyWords?: string } & Record<string, unknown>,
) => Promise<MaterialFilteredSelectOption[]>;

export interface MaterialBaseTypeOption {
  label: string;
  value: MaterialBaseType;
}

export interface MaterialFamilyRecord {
  id: string;
  name: string;
  code?: string | null;
  baseType?: MaterialBaseType | null;
  categoryId?: string | null;
}

export interface MaterialCategoryRecord {
  id: string;
  name: string;
  displayName: string;
  baseType: MaterialBaseType;
  isSystem: boolean;
}

export interface MaterialBarcodeRecord {
  id: string;
  code?: string | null;
  baseType?: MaterialBaseType | null;
  categoryId?: string | null;
  familyId?: string | null;
}

export interface MaterialSelectorCustomFieldDefinition {
  fieldKey: string;
  label: string;
  dataType: string;
  optionsJson?: unknown;
  isActive?: boolean;
  sortOrder?: number | null;
  displayJson?: unknown;
}

export interface MaterialConfigEntryLabelProps {
  target: 'material';
  children: ReactNode;
  /** Source component accepts this legacy flag but intentionally ignores it. */
  show: boolean;
  onOpen: () => void;
}

/** Host-owned MES data, dictionaries, route links, and scan-gun integration. */
export interface MesMaterialSelectCapabilities {
  baseTypeOptions?: readonly MaterialBaseTypeOption[];
  unitLabelMap?: Readonly<Record<string, string>>;
  requestFamilies?: (params: {
    page: 1;
    pageSize: 100;
    isActive: true;
    baseType?: MaterialBaseType;
  }) => Promise<MaterialFamilyRecord[]>;
  requestCategories?: () => Promise<MaterialCategoryRecord[]>;
  findMaterialByBarcode?: (params: {
    barcode: string;
  }) => Promise<MaterialBarcodeRecord>;
  /** Keyboard-wedge scanner bridge; host implementation follows MES useScanGun behavior. */
  registerScanGun?: (onScan: (code: string) => void) => () => void;
  loadSelectorCustomFields?: () => Promise<MaterialSelectorCustomFieldDefinition[]>;
  renderConfigEntryLabel?: (
    props: MaterialConfigEntryLabelProps,
  ) => ReactNode;
}
