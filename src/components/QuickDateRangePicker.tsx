import {
  ProFormDateRangePicker,
  ProFormDateTimeRangePicker,
} from '@ant-design/pro-components';
import { DatePicker } from 'antd';
import type { ComponentProps } from 'react';
import { mergeDateRangePresets } from './dateRangePresets';

type DateRangeFieldProps = NonNullable<
  ComponentProps<typeof ProFormDateRangePicker>['fieldProps']
>;
type RangePickerStyles = NonNullable<
  ComponentProps<typeof DatePicker.RangePicker>['styles']
>;
type RangePickerStyleResolver = Extract<RangePickerStyles, Function>;
type RangePickerStyleInfo = Parameters<RangePickerStyleResolver>[0];
type RangePickerStylesObject = Exclude<RangePickerStyles, Function>;

function withViewportSafePopupStyles(
  styles: ComponentProps<typeof DatePicker.RangePicker>['styles'],
): ComponentProps<typeof DatePicker.RangePicker>['styles'] {
  const merge = (
    current: RangePickerStylesObject | undefined,
  ): RangePickerStylesObject => ({
    ...current,
    root: {
      minWidth: 0,
      overflow: 'hidden',
      ...current?.root,
    },
    popup: {
      ...current?.popup,
      root: {
        minWidth: 0,
        maxWidth: 'calc(100vw - 64px)',
        overflowX: 'auto',
        boxSizing: 'border-box',
        ...current?.popup?.root,
      },
      container: {
        minWidth: 'max-content',
        ...current?.popup?.container,
      },
    },
  });

  if (typeof styles === 'function') {
    return ((info: RangePickerStyleInfo) =>
      merge(styles(info))) as ComponentProps<typeof DatePicker.RangePicker>['styles'];
  }
  return merge(styles as RangePickerStylesObject | undefined);
}

function withQuickRangePresets(
  fieldProps: DateRangeFieldProps | undefined,
): DateRangeFieldProps {
  return {
    ...fieldProps,
    presets: mergeDateRangePresets(fieldProps?.presets),
    styles: withViewportSafePopupStyles(fieldProps?.styles),
  };
}

export function QuickDateRangePicker(
  props: ComponentProps<typeof DatePicker.RangePicker>,
) {
  return (
    <DatePicker.RangePicker
      {...props}
      presets={mergeDateRangePresets(props.presets)}
      styles={withViewportSafePopupStyles(props.styles)}
    />
  );
}

export function QuickProFormDateRangePicker(
  props: ComponentProps<typeof ProFormDateRangePicker>,
) {
  return (
    <ProFormDateRangePicker
      {...props}
      fieldProps={withQuickRangePresets(props.fieldProps)}
    />
  );
}

export function QuickProFormDateTimeRangePicker(
  props: ComponentProps<typeof ProFormDateTimeRangePicker>,
) {
  return (
    <ProFormDateTimeRangePicker
      {...props}
      fieldProps={withQuickRangePresets(props.fieldProps)}
    />
  );
}
