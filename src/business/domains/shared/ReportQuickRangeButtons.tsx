import { Segmented } from 'antd';

export interface ReportQuickRangeOption<Key extends string = string> {
  key: Key;
  label: string;
}

export interface ReportQuickRangeButtonsProps<Key extends string = string> {
  value?: [string, string];
  label?: string;
  options: readonly ReportQuickRangeOption<Key>[];
  matchValue: (value?: [string, string]) => Key | null;
  onSelect: (key: Key) => void;
}

/** host reporting period selector; date semantics remain supplied by the host. */
/**
 * @sunxu-layer business
 * @sunxu-domain shared
 * @sunxu-reason Presents reusable report quick range buttons behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function ReportQuickRangeButtons<Key extends string = string>({
  value,
  label = '快捷筛选',
  options,
  matchValue,
  onSelect,
}: ReportQuickRangeButtonsProps<Key>) {
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
