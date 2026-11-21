import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RemoteSelect,
  type RemoteSelectProps,
} from '../../components/RemoteSelect';
import { useMesWarehouseRemoteSelectCapabilities } from '../MesUiProvider';
import type {
  WarehouseSelectOption,
  WarehouseSelectScope,
} from './warehouse-remote-select-types';

export interface WarehouseRemoteSelectProps
  extends Omit<
    RemoteSelectProps<string, WarehouseSelectOption>,
    'onChange' | 'onSearch' | 'options' | 'value'
  > {
  /** 当前选中的仓库 ID。 */
  value?: string;
  /** 当前选项不在首屏候选时，用于保留其名称回显。 */
  currentOption?: { value?: string; label?: string };
  /** 候选范围；库存正式收发默认不包含线边仓。 */
  scope?: WarehouseSelectScope;
  /** 仅返回指定类型族的仓库。 */
  typeFamily?: string;
  /** 仅返回多个指定类型族的仓库（例如“半成品仓或通用仓”）。 */
  typeFamilies?: string[];
  /** 选中仓库后同时回传名称，供行级草稿保留可读快照。 */
  onChange: (warehouseId?: string, warehouseName?: string) => void;
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain inventory
 * @sunxu-reason Retains MES warehouse scope/type filtering and historical value display while the host supplies warehouse requests.
 * MES warehouse selector with host-owned requests and stable current-value echo.
 */
export function WarehouseRemoteSelect({
  value,
  currentOption,
  scope = 'nonLineSide',
  typeFamily,
  typeFamilies,
  onChange,
  ...selectProps
}: WarehouseRemoteSelectProps) {
  const capabilities = useMesWarehouseRemoteSelectCapabilities();
  const typeFamilyKey = [
    ...new Set(typeFamilies ?? (typeFamily ? [typeFamily] : [])),
  ]
    .filter((family): family is NonNullable<typeof family> => Boolean(family))
    .sort()
    .join(',');
  const resolvedTypeFamilies = useMemo(
    () => (typeFamilyKey ? typeFamilyKey.split(',') : []),
    [typeFamilyKey],
  );
  const [options, setOptions] = useState<WarehouseSelectOption[]>([]);

  const loadOptions = useCallback(
    async (keyWords?: string) => {
      const requestOptions = capabilities?.requestOptions;
      if (!requestOptions) {
        setOptions([]);
        return;
      }
      setOptions(
        await requestOptions({
          keyWords,
          scope,
          typeFamilies: resolvedTypeFamilies,
        }),
      );
    },
    [capabilities, resolvedTypeFamilies, scope],
  );

  useEffect(() => {
    void loadOptions().catch(() => {
      // 请求层已反馈错误；保持当前实际仓回显，避免静默清空行数据。
    });
  }, [loadOptions]);

  const visibleOptions = useMemo(() => {
    if (!value || options.some((option) => option.value === value)) {
      return options;
    }
    const historicalOption: WarehouseSelectOption = {
      label: currentOption?.label || value,
      value,
      warehouseType: 'general',
      sortOrder: Number.MAX_SAFE_INTEGER,
    };
    return [historicalOption, ...options];
  }, [currentOption?.label, options, value]);

  return (
    <RemoteSelect<string, WarehouseSelectOption>
      allowClear
      {...selectProps}
      options={visibleOptions}
      value={value}
      onSearch={(keyWords) => {
        void loadOptions(keyWords || undefined).catch(() => {
          // 请求层已反馈错误；保持当前实际仓回显，避免静默清空行数据。
        });
      }}
      onChange={(warehouseId) => {
        const nextWarehouseId =
          typeof warehouseId === 'string' ? warehouseId : undefined;
        const option = options.find((item) => item.value === nextWarehouseId);
        onChange(nextWarehouseId, option?.label);
      }}
    />
  );
}
