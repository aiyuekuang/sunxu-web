import { ProFormDatePicker } from '@ant-design/pro-components';
import dayjs, { type Dayjs } from 'dayjs';

export interface StockBusinessDateFieldProps {
  readonly name?: string;
  readonly label?: string;
  readonly extra?: string;
}

/**
 * @sunxu-layer business
 * @sunxu-domain inventory transaction business date
 * @sunxu-reason Inventory transactions record the actual event date and cannot be dated in the future.
 *
 * Date field for inventory actions. History can be backfilled, but future business
 * dates are blocked; the host remains responsible for submitting the selected date.
 */
export function StockBusinessDateField({
  name = 'businessDate',
  label = '业务日期',
  extra = '按库存实际发生日期记账；可补录历史日期，不能选择未来日期。',
}: StockBusinessDateFieldProps) {
  return (
    <ProFormDatePicker
      name={name}
      label={label}
      initialValue={dayjs()}
      rules={[{ required: true, message: `请选择${label}` }]}
      fieldProps={{
        picker: 'date',
        showTime: false,
        format: 'YYYY-MM-DD',
        allowClear: false,
        disabledDate: (date: Dayjs) => date.isAfter(dayjs(), 'day'),
      }}
      extra={extra}
    />
  );
}
