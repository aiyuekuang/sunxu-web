import type { ButtonProps } from 'antd';
import type { ProTableProps } from '@ant-design/pro-components';
import type { ReactNode } from 'react';

export type MaterialTablePickerMode = 'single' | 'multiple';

export interface MaterialPickerRecord {
  id: string;
  name?: string | null;
  code?: string | null;
  spec?: string | null;
  unit?: string | null;
  currentStockQty?: number | null;
  thumbnailUrl?: string | null;
  primaryImageUrl?: string | null;
}

export interface MaterialCategoryNode {
  id: string;
  name: string;
  isSystem?: boolean;
  baseType?: string;
  children?: MaterialCategoryNode[];
}

export interface MaterialTablePickerSelection<
  TMaterial extends MaterialPickerRecord = MaterialPickerRecord,
> {
  material: TMaterial;
  quantity: number;
}

export interface MaterialTablePickerProps<
  TMaterial extends MaterialPickerRecord = MaterialPickerRecord,
> {
  value?: string;
  values?: string[];
  selectedRecords?: TMaterial[];
  mode?: MaterialTablePickerMode;
  onChange?: (value: string | undefined, record?: TMaterial) => void;
  onValuesChange?: (
    values: string[],
    records: TMaterial[],
    selections?: MaterialTablePickerSelection<TMaterial>[],
  ) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  buttonProps?: Omit<ButtonProps, 'children' | 'disabled' | 'onClick'>;
  title?: string;
  placeholder?: string;
  disabled?: boolean;
  width?: number | string;
  quantityLabel?: string;
  requestParams?: object;
  customerId?: string;
}

export interface MaterialTablePickerListRequest {
  page: number;
  pageSize: number;
  [field: string]: unknown;
}

export interface MaterialTablePickerCapabilities {
  requestCategoryTree: (params: {
    includeInactive: false;
  }) => Promise<MaterialCategoryNode[] | null | undefined>;
  requestMaterials: (
    params: MaterialTablePickerListRequest,
  ) => Promise<{
    list?: MaterialPickerRecord[] | null;
    total?: number | null;
  } | null>;
  requestCustomerStockSummary: (params: {
    materialIds: string[];
    customerId: string;
  }) => Promise<{
    items?: Array<{
      materialId: string;
      availableQty?: number | null;
    }> | null;
  } | null>;
  unitLabelMap?: Readonly<Record<string, string>>;
  pagination: ProTableProps<MaterialPickerRecord, Record<string, unknown>>['pagination'];
}
