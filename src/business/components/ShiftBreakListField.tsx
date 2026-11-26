import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Space, TimePicker, theme } from 'antd';
import type { Dayjs } from 'dayjs';
import type { ShiftBreakValue } from './production-schedule-widget-types';

export interface ShiftBreakListFieldProps {
  value?: ShiftBreakValue[];
  onChange?: (value: ShiftBreakValue[]) => void;
  /** Host supplies the time format and its default break interval. */
  timeFormat: string;
  defaultBreak: ShiftBreakValue;
  startPlaceholder?: string;
  endPlaceholder?: string;
  betweenLabel?: string;
  addLabel?: string;
}

/**
 * @sunxu-layer business
 * @sunxu-domain production-schedule
 * @sunxu-reason Shares the editable shift-break list while time format and default break values remain host-owned.
 */
export function ShiftBreakListField({
  value = [],
  onChange,
  timeFormat,
  defaultBreak,
  startPlaceholder = '开始',
  endPlaceholder = '结束',
  betweenLabel = '至',
  addLabel = '添加休息时段',
}: ShiftBreakListFieldProps) {
  const { token } = theme.useToken();

  const addBreak = () => {
    onChange?.([...value, { ...defaultBreak }]);
  };

  const removeBreak = (index: number) => {
    onChange?.(value.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateBreak = (
    index: number,
    field: 'startTime' | 'endTime',
    nextValue: Dayjs | null,
  ) => {
    if (!nextValue) return;
    onChange?.(
      value.map((breakValue, itemIndex) =>
        itemIndex === index ? { ...breakValue, [field]: nextValue } : breakValue,
      ),
    );
  };

  return (
    <div>
      {value.map((breakValue, index) => (
        <Space
          key={`${breakValue.startTime?.format?.(timeFormat) ?? index}-${breakValue.endTime?.format?.(timeFormat) ?? index}`}
          style={{ display: 'flex', marginBottom: 8 }}
          align="center"
        >
          <TimePicker
            format={timeFormat}
            value={breakValue.startTime}
            onChange={(nextValue) =>
              updateBreak(index, 'startTime', nextValue)
            }
            placeholder={startPlaceholder}
          />
          <span>{betweenLabel}</span>
          <TimePicker
            format={timeFormat}
            value={breakValue.endTime}
            onChange={(nextValue) => updateBreak(index, 'endTime', nextValue)}
            placeholder={endPlaceholder}
          />
          <MinusCircleOutlined
            style={{ color: token.colorError, cursor: 'pointer' }}
            onClick={() => removeBreak(index)}
          />
        </Space>
      ))}
      <Button
        type="dashed"
        onClick={addBreak}
        icon={<PlusOutlined />}
        size="small"
      >
        {addLabel}
      </Button>
    </div>
  );
}
