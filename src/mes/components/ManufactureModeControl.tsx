import { Select, Tag } from 'antd';
import type { SelectProps, TagProps } from 'antd';
import type {
  ManufactureModeColor,
  ManufactureModeLabel,
  ManufactureModeNormalizer,
  SaleOrderFieldOption,
} from './sale-order-field-types';

export interface ManufactureModeSelectProps<Value extends string = string>
  extends Omit<SelectProps, 'value' | 'options' | 'onChange'> {
  value?: unknown;
  options: readonly SaleOrderFieldOption[];
  normalizeValue: ManufactureModeNormalizer<Value>;
  onChange: (value: Value) => void;
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain sales
 * @sunxu-reason Shares sale-order manufacture mode selection while the host owns option values and legacy-value normalization.
 */
export function ManufactureModeSelect<Value extends string = string>({
  value,
  options,
  normalizeValue,
  onChange,
  style,
  ...rest
}: ManufactureModeSelectProps<Value>) {
  const handleChange: NonNullable<SelectProps['onChange']> = (nextValue) => {
    onChange(nextValue as Value);
  };

  return (
    <Select
      {...rest}
      value={normalizeValue(value)}
      options={[...options]}
      onChange={handleChange}
      style={{ width: '100%', ...style }}
    />
  );
}

export interface ManufactureModeTagProps<Value extends string = string> {
  value?: unknown;
  normalizeValue: ManufactureModeNormalizer<Value>;
  labelForValue: ManufactureModeLabel<Value>;
  colorForValue: ManufactureModeColor<Value>;
  bordered?: TagProps['bordered'];
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain sales
 * @sunxu-reason Shares the manufacture mode status tag while the host supplies legacy normalization, display labels, and colors.
 */
export function ManufactureModeTag<Value extends string = string>({
  value,
  normalizeValue,
  labelForValue,
  colorForValue,
  bordered,
}: ManufactureModeTagProps<Value>) {
  const normalizedValue = normalizeValue(value);
  return (
    <Tag color={colorForValue(normalizedValue)} bordered={bordered}>
      {labelForValue(normalizedValue)}
    </Tag>
  );
}
