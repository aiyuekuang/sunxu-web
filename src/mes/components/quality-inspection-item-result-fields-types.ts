import type { ReactNode } from 'react';

export type QualityInspectionItemResultType =
  | 'numeric'
  | 'judgement'
  | 'selection'
  | 'text';

export interface QualityInspectionResultItem {
  id: string;
  itemName: string;
  resultType?: QualityInspectionItemResultType | null;
  requiredMeasurementCount?: number | null;
  photoRequired: boolean;
  isRequired: boolean;
  standard?: string | null;
  upperLimit?: number | null;
  lowerLimit?: number | null;
  unit?: string | null;
  options?: string[] | null;
  acceptedValues?: string[] | null;
}

export interface QualityInspectionCustomFieldFormItemsProps<TSchema = unknown> {
  schema?: TSchema | null;
  namePrefix: Array<string | number>;
  colSpan: number;
}

export interface QualityInspectionItemResultFieldsCapabilities<
  TSchema = unknown,
> {
  formatInspectionStandard: (
    item: QualityInspectionResultItem & {
      resultType: QualityInspectionItemResultType;
    },
  ) => string;
  hasAutomaticInspectionJudgement: (
    item: QualityInspectionResultItem & {
      resultType: QualityInspectionItemResultType;
    },
  ) => boolean;
  renderCustomFieldFormItems: (
    props: QualityInspectionCustomFieldFormItemsProps<TSchema>,
  ) => ReactNode;
}

export interface QualityInspectionItemResultFieldsProps<TSchema = unknown> {
  items: QualityInspectionResultItem[];
  lineCustomFieldSchema?: TSchema | null;
  capabilities: QualityInspectionItemResultFieldsCapabilities<TSchema>;
}
