import type { ProFormSelectProps } from '@ant-design/pro-components';
import type { ReactNode } from 'react';
import type { FormInstance } from 'antd';
import type { BatchMaterialRecord } from '../manufacturing/batch-material-add-types';
import type { DocumentLineCustomFieldSchema } from '../documents/document-line-custom-field-types';

export type StockCountLineSelectRequest = NonNullable<
  ProFormSelectProps['request']
>;

export type StockCountLineConfigTarget =
  | 'material'
  | 'customer'
  | 'supplier'
  | 'warehouseLocations';

export interface StockCountLineFormRow {
  id?: string;
  materialId?: string;
  /** Full picker record is only a form-display snapshot and is not submitted. */
  materialRecord?: BatchMaterialRecord;
  /** Compact display snapshot used when the full material record is unavailable. */
  materialOption?: { label: string; value: string; title?: string };
  ownerType?: string;
  ownerRefId?: string;
  locationId?: string;
  storageLocation?: string;
  batchNo?: string;
  remarks?: string;
}

export interface StockCountLineConfigEntryLabelProps {
  target: StockCountLineConfigTarget;
  children: ReactNode;
  show: boolean;
  onOpen: () => void;
}

export interface StockCountLineOwnerTypeOptions {
  options: NonNullable<ProFormSelectProps['options']>;
  customerValue: string;
  supplierValue: string;
}

export interface StockCountLineFormCapabilities<
  TLine extends StockCountLineFormRow = StockCountLineFormRow,
> {
  /** The host runs the active-material probe used to reveal configuration entry. */
  hasActiveMaterialOptions: () => Promise<boolean>;
  /** Host-owned owner types and values determine the conditional reference fields. */
  ownerTypes: StockCountLineOwnerTypeOptions;
  /** Builds the host's new blank line plus material display snapshots. */
  createRowFromMaterial: (material: BatchMaterialRecord) => TLine;
  requestCustomerOwnerOptions: StockCountLineSelectRequest;
  requestSupplierOwnerOptions: StockCountLineSelectRequest;
  requestStockLocationOptions: (params: {
    warehouseId: string;
    keyWords?: string;
  }) => Promise<NonNullable<ProFormSelectProps['options']>>;
  /** Host resolves the route and permission for each missing-master-data entry. */
  renderConfigEntryLabel: (
    props: StockCountLineConfigEntryLabelProps,
  ) => ReactNode;
  /** Keep the source row-empty semantics in the host. */
  isEmptyRow: (line: TLine) => boolean;
}

export interface StockCountLineFormListProps<
  TLine extends StockCountLineFormRow = StockCountLineFormRow,
> {
  form: FormInstance;
  warehouseId?: string;
  showLocationControl: boolean;
  lineCustomFieldSchema: DocumentLineCustomFieldSchema | null | undefined;
  titlePrefix: string;
  minLineCount?: number;
  capabilities: StockCountLineFormCapabilities<TLine>;
}
