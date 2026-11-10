import { Select } from 'antd';
import type { SelectProps } from 'antd';
import type { BaseOptionType, DefaultOptionType } from 'antd/es/select';
import { useCallback, useEffect, useRef } from 'react';

export type RemoteSelectProps<
  ValueType = unknown,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
> = Omit<SelectProps<ValueType, OptionType>, 'onSearch'> & {
  onSearch?: SelectProps<ValueType, OptionType>['onSearch'];
  searchDebounceTime?: number;
};

/** Ant Design Select configured for server-side search with a debounced callback. */
export function RemoteSelect<
  ValueType = unknown,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
>({
  onSearch,
  searchDebounceTime = 300,
  ...selectProps
}: RemoteSelectProps<ValueType, OptionType>) {
  const searchHandlerRef = useRef(onSearch);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    searchHandlerRef.current = onSearch;
  }, [onSearch]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleSearch = useCallback(
    (keyword: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        searchHandlerRef.current?.(keyword);
      }, searchDebounceTime);
    },
    [searchDebounceTime],
  );

  return (
    <Select<ValueType, OptionType>
      {...selectProps}
      showSearch
      filterOption={false}
      onSearch={onSearch ? handleSearch : undefined}
    />
  );
}
