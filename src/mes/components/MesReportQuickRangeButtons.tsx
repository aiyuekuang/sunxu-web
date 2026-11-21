import { Segmented } from 'antd';

export interface MesReportQuickRangeOption<Key extends string = string> {
  key: Key;
  label: string;
}

export interface MesReportQuickRangeButtonsProps<Key extends string = string> {
  value?: [string, string];
  label?: string;
  options: readonly MesReportQuickRangeOption<Key>[];
  matchValue: (value?: [string, string]) => Key | null;
  onSelect: (key: Key) => void;
}

/** MES reporting period selector; date semantics remain supplied by the host. */
export function MesReportQuickRangeButtons<Key extends string = string>({
  value,
  label = '快捷筛选',
  options,
  matchValue,
  onSelect,
}: MesReportQuickRangeButtonsProps<Key>) {
  const activeKey = matchValue(value);
  return (
    <Segmented
      aria-label={label}
      value={activeKey ?? undefined}
      options={options.map((option) => ({
        label: option.label,
        value: option.key,
      }))}
      onChange={(next) => {
        if (typeof next === 'string' && options.some(({ key }) => key === next)) {
          onSelect(next as Key);
        }
      }}
    />
  );
}
