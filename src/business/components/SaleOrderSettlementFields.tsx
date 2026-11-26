import { ProFormDependency, ProFormSelect } from '@ant-design/pro-components';
import { Alert, Form } from 'antd';
import type { SelectProps } from 'antd';
import type React from 'react';
import type {
  SaleOrderFieldOption,
  SaleOrderFreeSampleVisibility,
  SaleOrderScenarioChange,
  SaleOrderSettlementFieldState,
} from './sale-order-field-types';

type ProFormSelectProps = React.ComponentProps<typeof ProFormSelect>;

export interface SaleOrderFulfillmentScenarioFieldProps
  extends Omit<
    ProFormSelectProps,
    'name' | 'label' | 'width' | 'initialValue' | 'options' | 'fieldProps'
  > {
  /** Scenario choices and initial value are owned by the MES host. */
  options: readonly SaleOrderFieldOption[];
  initialValue: unknown;
  /** Host policy updates linked form values when the scenario changes. */
  onScenarioChange: SaleOrderScenarioChange;
  fieldProps?: SelectProps;
}

/**
 * @sunxu-layer business
 * @sunxu-domain sales
 * @sunxu-reason Shares the sale-order fulfillment field while options, initial values, validation, and linked settlement policy remain host-owned.
 */
export function SaleOrderFulfillmentScenarioField({
  options,
  initialValue,
  onScenarioChange,
  fieldProps,
  ...rest
}: SaleOrderFulfillmentScenarioFieldProps) {
  const form = Form.useFormInstance();
  const externalOnChange = fieldProps?.onChange;
  const handleChange: NonNullable<SelectProps['onChange']> = (value, option) => {
    onScenarioChange(value, form);
    externalOnChange?.(value, option);
  };

  return (
    <ProFormSelect
      {...rest}
      name="fulfillmentScenario"
      label="履约场景"
      width="md"
      initialValue={initialValue}
      options={[...options]}
      fieldProps={{ ...fieldProps, onChange: handleChange }}
    />
  );
}

export interface SaleOrderSettlementModeFieldProps
  extends Omit<
    ProFormSelectProps,
    | 'name'
    | 'label'
    | 'width'
    | 'initialValue'
    | 'options'
    | 'disabled'
    | 'fieldProps'
  > {
  /** Initial value and scenario-dependent options/disabled state come from the host. */
  initialValue: unknown;
  resolveFieldState: (
    fulfillmentScenario: unknown,
  ) => SaleOrderSettlementFieldState;
  fieldProps?: SelectProps;
}

/**
 * @sunxu-layer business
 * @sunxu-domain sales
 * @sunxu-reason Keeps the settlement field reactive to fulfillment scenario while the host supplies the valid modes and selection policy.
 */
export function SaleOrderSettlementModeField({
  initialValue,
  resolveFieldState,
  fieldProps,
  ...rest
}: SaleOrderSettlementModeFieldProps) {
  return (
    <ProFormDependency name={['fulfillmentScenario']}>
      {(values) => {
        const fieldState = resolveFieldState(values?.fulfillmentScenario);
        return (
          <ProFormSelect
            {...rest}
            name="settlementMode"
            label="结算方式"
            width="sm"
            initialValue={initialValue}
            options={[...fieldState.options]}
            disabled={fieldState.disabled}
            fieldProps={fieldProps}
          />
        );
      }}
    </ProFormDependency>
  );
}

export interface SaleOrderFreeSampleSettlementNoticeProps {
  /** Host decides which scenario/settlement combination represents a free sample. */
  shouldShow: SaleOrderFreeSampleVisibility;
  message?: React.ReactNode;
  description?: React.ReactNode;
}

/**
 * @sunxu-layer business
 * @sunxu-domain sales
 * @sunxu-reason Retains the free-sample settlement explanation while the host determines its visibility from business values.
 */
export function SaleOrderFreeSampleSettlementNotice({
  shouldShow,
  message = '免费样品按正数标准价全额折让结算',
  description = '样品仍可正常转生产、占用设备工时、领料、入库和出库；系统不会把本单价格写回客户协议价或销售价目。',
}: SaleOrderFreeSampleSettlementNoticeProps) {
  return (
    <ProFormDependency
      name={['fulfillmentScenario', 'settlementMode']}
    >
      {(values) =>
        shouldShow(
          values?.fulfillmentScenario,
          values?.settlementMode,
        ) ? (
          <Alert type="info" showIcon message={message} description={description} />
        ) : null
      }
    </ProFormDependency>
  );
}
