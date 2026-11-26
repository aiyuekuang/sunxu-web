import type { SelectProps } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { ReactNode } from 'react';

export type SaleOrderFieldOption = NonNullable<SelectProps['options']>[number];

export interface SaleOrderSettlementFieldState {
  options: readonly SaleOrderFieldOption[];
  disabled: boolean;
}

export type SaleOrderScenarioChange = (
  value: unknown,
  form: FormInstance,
) => void;

export type SaleOrderFreeSampleVisibility = (
  fulfillmentScenario: unknown,
  settlementMode: unknown,
) => boolean;

export type ManufactureModeNormalizer<Value extends string = string> = (
  value: unknown,
) => Value;

export type ManufactureModeLabel<Value extends string = string> = (
  value: Value,
) => ReactNode;

export type ManufactureModeColor<Value extends string = string> = (
  value: Value,
) => string;
