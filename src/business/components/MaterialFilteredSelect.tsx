import { ProForm } from '@ant-design/pro-components';
import type { FormItemProps, SelectProps } from 'antd';
import { App, Button, Form, Select } from 'antd';
import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useMesMaterialSelectCapabilities } from '../MesUiProvider';
import type {
  FilterableSelectRequestFn,
  MaterialBaseTypeOption,
  MaterialBarcodeRecord,
  MaterialBaseType,
  MaterialCategoryRecord,
  MaterialConfigEntryLabelProps,
  MaterialFilteredSelectOption,
  MaterialFamilyRecord,
  MesMaterialSelectCapabilities,
  MaterialSelectorCustomFieldDefinition,
} from './material-select-types';
import { resolveMaterialSelectorCustomField } from '../utils/materialSelectorCustomField';

export type {
  FilterableSelectRequestFn,
  MaterialBaseTypeOption,
  MaterialBarcodeRecord,
  MaterialBaseType,
  MaterialCategoryRecord,
  MaterialConfigEntryLabelProps,
  MaterialFilteredSelectOption,
  MaterialFamilyRecord,
  MesMaterialSelectCapabilities,
  MaterialSelectorCustomFieldDefinition,
} from './material-select-types';

type SelectOption = MaterialFilteredSelectOption;
type MaterialFilteredSelectFormFieldProps = {
  value?: unknown;
  onChange?: (value: string | string[] | undefined) => void;
};

const SCANNED_MATERIAL_NOT_ALLOWED_MESSAGE = '该物料不在当前可选范围内';
const MATERIAL_SELECTOR_SCHEMA_LOAD_ERROR =
  '物料选择器副信息加载失败，请刷新后重试';
const STALE_REMOTE_SELECT_MESSAGE =
  '正在按当前搜索条件加载选项，请稍候再选择';

const selectorCustomFieldRequests = new WeakMap<
  NonNullable<MesMaterialSelectCapabilities['loadSelectorCustomFields']>,
  Promise<MaterialSelectorCustomFieldDefinition[]>
>();

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function withMaterialConfigEntryLabel(
  children: ReactNode,
  show: boolean,
  onOpen: () => void,
  capabilities?: MesMaterialSelectCapabilities,
): ReactNode {
  if (!capabilities?.renderConfigEntryLabel) return children;
  return capabilities.renderConfigEntryLabel({
    target: 'material',
    children,
    show,
    onOpen,
  });
}

function normalizeRemoteSelectKeyword(keyword?: string | null) {
  return (keyword ?? '').trim().toLowerCase();
}

function isRemoteSelectSnapshotCurrent(
  currentKeyword?: string | null,
  loadedKeyword?: string | null,
) {
  return (
    normalizeRemoteSelectKeyword(currentKeyword) ===
    normalizeRemoteSelectKeyword(loadedKeyword)
  );
}

function sortRemoteSelectOptionsByKeyword<T extends SelectOption>(
  options: T[],
  keyword?: string | null,
): T[] {
  const normalizedKeyword = normalizeRemoteSelectKeyword(keyword);
  if (!normalizedKeyword) return options;
  const rank = (option: T) => {
    const texts = [option.code, option.name, option.label]
      .filter((value): value is string => typeof value === 'string')
      .map(normalizeRemoteSelectKeyword);
    if (texts.some((text) => text === normalizedKeyword)) return 0;
    if (texts.some((text) => text.startsWith(normalizedKeyword))) return 1;
    return 2;
  };
  return [...options].sort((left, right) => rank(left) - rank(right));
}

function formatUnitLabel(
  unit: string | null | undefined,
  unitLabelMap: Readonly<Record<string, string>> | undefined,
) {
  const normalized = unit?.trim() ?? '';
  return normalized ? (unitLabelMap?.[normalized] ?? normalized) : '';
}

// §7.4 选择器副信息排序：优先取 displayJson.sortOrder，回退字段定义 sortOrder。
function resolveSelectorSortOrder(
  field: MaterialSelectorCustomFieldDefinition,
): number {
  const raw = readObject(field.displayJson).sortOrder;
  return typeof raw === 'number' ? raw : (field.sortOrder ?? 0);
}

function loadMaterialSelectorCustomFields(
  loader: NonNullable<
    import('./material-select-types').MesMaterialSelectCapabilities['loadSelectorCustomFields']
  >,
  onError: () => void,
) {
  const cached = selectorCustomFieldRequests.get(loader);
  if (cached) return cached;

  const request = loader()
    .then((fields) =>
      fields
        .filter((field) => {
          if (field.isActive === false) return false;
          return readObject(field.displayJson).showInSelector === true;
        })
        .slice()
        .sort((a, b) => resolveSelectorSortOrder(a) - resolveSelectorSortOrder(b))
        .slice(0, 3),
    )
    .catch((error: unknown) => {
      selectorCustomFieldRequests.delete(loader);
      onError();
      throw error;
    });
  selectorCustomFieldRequests.set(loader, request);
  return request;
}

interface MaterialCategoryOption {
  id: string;
  name: string;
  displayName: string;
  baseType: MaterialBaseType;
  isSystem: boolean;
}

type MaterialCategorySelectOption = SelectOption & {
  pathLabel?: string;
  searchText: string;
};
type MaterialFamilySelectOption = SelectOption & {
  baseType?: MaterialBaseType | null;
  categoryId?: string | null;
  searchText: string;
};

export interface MaterialFilteredSelectProps {
  request: FilterableSelectRequestFn;
  /**
   * 外部依赖键：当父级传入 request 闭包所依赖的外部条件（如所属物料系列 familyId）变化时，
   * 传入变化的 requestKey 可触发重新拉取选项。filterMode="hidden" 时尤其需要，
   * 因为此时组件内部筛选不参与请求，过滤条件完全来自父级 request 闭包。
   */
  requestKey?: string;
  value?: string;
  /** 多选场景使用 values，避免改变既有单选 onChange 契约。 */
  values?: string[];
  selectedOption?: MaterialFilteredSelectOption;
  selectedOptions?: MaterialFilteredSelectOption[];
  onChange?: (
    value: string | undefined,
    option?: MaterialFilteredSelectOption,
  ) => void;
  onOptionSelected?: (option: SelectOption) => void;
  onValuesChange?: (
    values: string[],
    options: MaterialFilteredSelectOption[],
  ) => void;
  mode?: 'multiple';
  maxTagCount?: number | 'responsive';
  size?: SelectProps['size'];
  placeholder?: string;
  familyWidth?: number;
  baseTypeWidth?: number;
  categoryWidth?: number;
  selectWidth?: number | string;
  disabled?: boolean;
  debounceTime?: number;
  /**
   * 物料选择默认只暴露搜索/扫码。物料类型、族和业务分类是高级筛选条件，
   * 需要时由具体主数据或配置页面显式开启，避免业务录入动作误以为要重新选择物料类型。
   */
  filterMode?: 'always' | 'collapsible' | 'hidden';
  filtersInitiallyVisible?: boolean;
  style?: React.CSSProperties;
  /** ProForm.Item 注入的受控字段契约，用于自定义选择器参与表单事件链。 */
  fieldProps?: MaterialFilteredSelectFormFieldProps;
  /** 仅表单字段使用：通知首屏、未筛选的物料候选是否为空。 */
  onBaseOptionsEmptyChange?: (isEmpty: boolean) => void;
}

export interface MaterialSelectFieldProps
  extends Omit<
    MaterialFilteredSelectProps,
    'value' | 'onChange' | 'selectedOption'
  > {
  name: FormItemProps['name'];
  label?: FormItemProps['label'];
  rules?: FormItemProps['rules'];
  extra?: FormItemProps['extra'];
  tooltip?: FormItemProps['tooltip'];
  required?: boolean;
  preserve?: boolean;
  selectedOption?: MaterialFilteredSelectOption;
  showConfigEntry?: boolean;
  onChange?: (
    value: string | undefined,
    option?: MaterialFilteredSelectOption,
  ) => void;
}

/**
 * @sunxu-layer business
 * @sunxu-domain material
 * @sunxu-reason Retains MES material selector behavior while injecting requests and host integration.
 *
 * ProForm / antd Form 场景统一物料字段。
 *
 * 业务页面不要再用 ProFormSelect 自行拼物料 options；该字段和销售订单明细
 * 共用 MaterialFilteredSelect，统一远程搜索、扫码、规格/单位副信息和防陈旧结果保护。
 */
export function MaterialSelectField({
  name,
  label,
  rules,
  extra,
  tooltip,
  required,
  preserve,
  showConfigEntry = true,
  ...selectProps
}: MaterialSelectFieldProps) {
  const form = Form.useFormInstance();
  const materialSelectCapabilities = useMesMaterialSelectCapabilities();
  const currentValue = Form.useWatch(
    name ?? '__unnamed_material_field__',
    form,
  );
  const [baseOptionsEmpty, setBaseOptionsEmpty] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const refreshAfterConfigRef = useRef(false);
  const labelText = typeof label === 'string' ? label : '物料';
  const isDisabled = Boolean(selectProps.disabled);
  const hasSelection =
    currentValue !== undefined && currentValue !== null && currentValue !== '';

  useEffect(() => {
    const refreshAfterReturn = () => {
      if (!refreshAfterConfigRef.current) return;
      refreshAfterConfigRef.current = false;
      setRefreshVersion((version) => version + 1);
    };
    window.addEventListener('focus', refreshAfterReturn);
    return () => window.removeEventListener('focus', refreshAfterReturn);
  }, []);

  return (
    <ProForm.Item
      name={name}
      label={
        label ? (
          withMaterialConfigEntryLabel(
            label,
            Boolean(
              showConfigEntry &&
              baseOptionsEmpty &&
              !hasSelection &&
              !isDisabled,
            ),
            () => {
              refreshAfterConfigRef.current = true;
            },
            materialSelectCapabilities,
          )
        ) : (
          label
        )
      }
      messageVariables={{ label: labelText }}
      rules={rules}
      extra={extra}
      tooltip={tooltip}
      required={required}
      preserve={preserve}
    >
      <MaterialFilteredSelect
        {...selectProps}
        filterMode={selectProps.filterMode ?? 'hidden'}
        selectWidth={selectProps.selectWidth ?? '100%'}
        requestKey={`${selectProps.requestKey ?? ''}:${refreshVersion}`}
        onBaseOptionsEmptyChange={setBaseOptionsEmpty}
      />
    </ProForm.Item>
  );
}

/**
 * ProTable 查询列统一物料选择配置。
 *
 * 不从 renderFormItem 的 config 手动回写值：ProComponents 会通过 ProForm.Item 的
 * fieldProps 注入受控 value/onChange。MaterialFilteredSelect 必须消费该契约，才能让
 * LightFilter 将选择事件视为真实字段变更并自动提交列表查询。
 */
export function materialSelectColumnProps(
  request: FilterableSelectRequestFn,
  placeholder = '搜索物料编码或名称',
) {
  return {
    valueType: 'select' as const,
    renderFormItem: () => (
      <MaterialFilteredSelect
        request={request}
        placeholder={placeholder}
        filterMode="hidden"
        size="small"
      />
    ),
  };
}

export interface MaterialMultiSelectFieldProps
  extends Omit<
    MaterialSelectFieldProps,
    'selectedOption' | 'onChange' | 'onOptionSelected'
  > {
  selectedOptions?: MaterialFilteredSelectOption[];
  onChange?: (
    values: string[],
    options: MaterialFilteredSelectOption[],
  ) => void;
}

function MaterialMultiSelectControl({
  value,
  onChange,
  onBaseOptionsEmptyChange,
  ...selectProps
}: Omit<
  MaterialMultiSelectFieldProps,
  | 'name'
  | 'label'
  | 'rules'
  | 'extra'
  | 'tooltip'
  | 'required'
  | 'preserve'
  | 'showConfigEntry'
> & {
  value?: string[];
  onChange?: MaterialMultiSelectFieldProps['onChange'];
}) {
  return (
    <MaterialFilteredSelect
      {...selectProps}
      mode="multiple"
      values={value}
      onValuesChange={onChange}
      filterMode={selectProps.filterMode ?? 'hidden'}
      selectWidth={selectProps.selectWidth ?? '100%'}
      onBaseOptionsEmptyChange={onBaseOptionsEmptyChange}
    />
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain material
 * @sunxu-reason Retains MES material selector behavior while injecting requests and host integration.
 *
 * 多选版统一物料表单字段，候选展示与销售订单明细保持一致。
 */
export function MaterialMultiSelectField({
  name,
  label,
  rules,
  extra,
  tooltip,
  required,
  preserve,
  showConfigEntry = true,
  ...selectProps
}: MaterialMultiSelectFieldProps) {
  const form = Form.useFormInstance();
  const materialSelectCapabilities = useMesMaterialSelectCapabilities();
  const currentValue = Form.useWatch(
    name ?? '__unnamed_material_field__',
    form,
  );
  const [baseOptionsEmpty, setBaseOptionsEmpty] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const refreshAfterConfigRef = useRef(false);
  const labelText = typeof label === 'string' ? label : '物料';
  const isDisabled = Boolean(selectProps.disabled);
  const hasSelection = Array.isArray(currentValue)
    ? currentValue.length > 0
    : currentValue !== undefined &&
      currentValue !== null &&
      currentValue !== '';

  useEffect(() => {
    const refreshAfterReturn = () => {
      if (!refreshAfterConfigRef.current) return;
      refreshAfterConfigRef.current = false;
      setRefreshVersion((version) => version + 1);
    };
    window.addEventListener('focus', refreshAfterReturn);
    return () => window.removeEventListener('focus', refreshAfterReturn);
  }, []);

  return (
    <ProForm.Item
      name={name}
      label={
        label ? (
          withMaterialConfigEntryLabel(
            label,
            Boolean(
              showConfigEntry &&
              baseOptionsEmpty &&
              !hasSelection &&
              !isDisabled,
            ),
            () => {
              refreshAfterConfigRef.current = true;
            },
            materialSelectCapabilities,
          )
        ) : (
          label
        )
      }
      messageVariables={{ label: labelText }}
      rules={rules}
      extra={extra}
      tooltip={tooltip}
      required={required}
      preserve={preserve}
    >
      <MaterialMultiSelectControl
        {...selectProps}
        requestKey={`${selectProps.requestKey ?? ''}:${refreshVersion}`}
        onBaseOptionsEmptyChange={setBaseOptionsEmpty}
      />
    </ProForm.Item>
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain material
 * @sunxu-reason Retains MES filters, remote selection, barcode validation, and option summaries.
 */
export function MaterialFilteredSelect({
  request,
  requestKey,
  value,
  values,
  selectedOption,
  selectedOptions,
  onChange,
  onOptionSelected,
  onValuesChange,
  mode,
  maxTagCount,
  size,
  placeholder = '请搜索选择物料',
  familyWidth = 168,
  baseTypeWidth = 112,
  categoryWidth = 128,
  disabled = false,
  debounceTime = 300,
  filterMode = 'hidden',
  selectWidth = filterMode === 'hidden' ? '100%' : 180,
  filtersInitiallyVisible = false,
  style,
  fieldProps: formFieldProps,
  onBaseOptionsEmptyChange,
}: MaterialFilteredSelectProps) {
  const { message } = App.useApp();
  const materialSelectCapabilities = useMesMaterialSelectCapabilities();
  const selectedValue = formFieldProps
    ? typeof formFieldProps.value === 'string'
      ? formFieldProps.value
      : undefined
    : value;
  const selectedValues = formFieldProps
    ? Array.isArray(formFieldProps.value)
      ? formFieldProps.value.filter(
          (item): item is string => typeof item === 'string',
        )
      : undefined
    : values;
  const unitLabelMap = materialSelectCapabilities?.unitLabelMap;
  const baseTypeOptions = useMemo(
    () => [...(materialSelectCapabilities?.baseTypeOptions ?? [])],
    [materialSelectCapabilities?.baseTypeOptions],
  );
  const canUseFilters = filterMode !== 'hidden';
  const [filtersVisible, setFiltersVisible] = useState(
    filterMode === 'always' ? true : filtersInitiallyVisible,
  );
  const visibleFilterControls =
    filterMode === 'always' || (filterMode === 'collapsible' && filtersVisible);
  const numericSelectWidth =
    typeof selectWidth === 'number' ? selectWidth : undefined;
  const shouldFillContainer =
    typeof selectWidth === 'string' && selectWidth.endsWith('%');
  const hiddenContainerMinWidth =
    typeof style?.minWidth === 'number' || typeof style?.minWidth === 'string'
      ? style.minWidth
      : numericSelectWidth;
  const containerStyle: React.CSSProperties = {
    ...style,
    width:
      style?.width ??
      (filterMode === 'hidden' && shouldFillContainer ? '100%' : undefined),
    minWidth:
      filterMode === 'hidden' ? hiddenContainerMinWidth : style?.minWidth,
  };
  const filterContainerStyle: React.CSSProperties = {
    ...containerStyle,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    width: containerStyle.width ?? '100%',
  };
  const entitySelectStyle: React.CSSProperties = {
    width: filterMode === 'hidden' ? selectWidth : undefined,
    minWidth: filterMode === 'hidden' ? undefined : (numericSelectWidth ?? 220),
    flex:
      filterMode === 'hidden'
        ? undefined
        : shouldFillContainer
          ? '1 1 260px'
          : '0 1 260px',
  };
  const selectDropdownMinWidth =
    numericSelectWidth === undefined ? 320 : Math.max(numericSelectWidth, 320);

  const [baseType, setBaseType] = useState<MaterialBaseType | undefined>(
    undefined,
  );
  const [familyId, setFamilyId] = useState<string | undefined>(undefined);
  const [familyOptions, setFamilyOptions] = useState<
    MaterialFamilySelectOption[]
  >([]);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [categoryOptions, setCategoryOptions] = useState<
    MaterialCategoryOption[]
  >([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [entityOptions, setEntityOptions] = useState<SelectOption[]>([]);
  const [entityLoading, setEntityLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [scanEnabled, setScanEnabled] = useState(false);
  // §7.4 选择器副信息：物料自定义字段中 displayJson.showInSelector=true 的启用字段，
  // 按 displayJson.sortOrder 排序，最多取 3 个。挂载时加载一次。
  const [selectorCustomFields, setSelectorCustomFields] = useState<
    MaterialSelectorCustomFieldDefinition[]
  >([]);

  const requestRef = useRef(request);
  requestRef.current = request;

  const requestIdRef = useRef(0);
  const baseOptionsRequestIdRef = useRef(0);
  const selectedValueRef = useRef(false);
  const baseOptionsEmptyChangeRef = useRef(onBaseOptionsEmptyChange);
  selectedValueRef.current = Boolean(
    selectedValue || (selectedValues && selectedValues.length > 0),
  );
  baseOptionsEmptyChangeRef.current = onBaseOptionsEmptyChange;
  const searchRef = useRef('');
  const optionsKeywordRef = useRef('');
  const entityOptionsReadyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const loadSelectorCustomFields =
    materialSelectCapabilities?.loadSelectorCustomFields;
  useEffect(() => {
    if (!loadSelectorCustomFields) {
      setSelectorCustomFields([]);
      return;
    }
    let cancelled = false;
    void loadMaterialSelectorCustomFields(loadSelectorCustomFields, () =>
      message.error(MATERIAL_SELECTOR_SCHEMA_LOAD_ERROR),
    )
      .then((fields) => {
        if (cancelled) return;
        setSelectorCustomFields(fields);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [loadSelectorCustomFields, message]);

  useEffect(() => {
    if (!canUseFilters) {
      setFamilyOptions([]);
      setFamilyLoading(false);
      setCategoryOptions([]);
      setCategoryLoading(false);
      return;
    }

    const loadFamilies = async () => {
      const requestFamilies = materialSelectCapabilities?.requestFamilies;
      if (!requestFamilies) {
        setFamilyOptions([]);
        setFamilyLoading(false);
        return;
      }
      setFamilyLoading(true);
      try {
        const families = await requestFamilies({
          page: 1,
          pageSize: 100,
          isActive: true,
          baseType,
        });
        if (unmountedRef.current) return;
        setFamilyOptions(
          families.map((item) => {
            const label = [item.name, item.code ? `（${item.code}）` : '']
              .filter(Boolean)
              .join('');
            return {
              label,
              value: item.id,
              title: label,
              baseType: item.baseType,
              categoryId: item.categoryId,
              searchText: [item.name, item.code].filter(Boolean).join(' '),
            };
          }),
        );
      } finally {
        if (!unmountedRef.current) {
          setFamilyLoading(false);
        }
      }
    };

    const loadCategories = async () => {
      const requestCategories = materialSelectCapabilities?.requestCategories;
      if (!requestCategories) {
        setCategoryOptions([]);
        setCategoryLoading(false);
        return;
      }
      setCategoryLoading(true);
      try {
        const options = await requestCategories();
        if (unmountedRef.current) return;
        setCategoryOptions(
          options.map((item) => ({
            id: item.id,
            name: item.name,
            displayName: item.displayName,
            baseType: item.baseType,
            isSystem: item.isSystem,
          })),
        );
      } finally {
        if (!unmountedRef.current) {
          setCategoryLoading(false);
        }
      }
    };

    void loadFamilies();
    void loadCategories();
  }, [baseType, canUseFilters, materialSelectCapabilities]);

  useEffect(() => {
    setFiltersVisible(filterMode === 'always' ? true : filtersInitiallyVisible);
  }, [filterMode, filtersInitiallyVisible]);

  useEffect(() => {
    if (!canUseFilters) {
      setBaseType(undefined);
      setFamilyId(undefined);
      setCategoryId(undefined);
    }
  }, [canUseFilters]);

  const businessCategoryOptions = useMemo(
    () =>
      categoryOptions.filter(
        (item) => !item.isSystem && (!baseType || item.baseType === baseType),
      ),
    [baseType, categoryOptions],
  );

  const categoryMap = useMemo(
    () =>
      categoryOptions.reduce<Record<string, MaterialCategoryOption>>(
        (acc, item) => {
          acc[item.id] = item;
          return acc;
        },
        {},
      ),
    [categoryOptions],
  );

  const familyMap = useMemo(
    () =>
      familyOptions.reduce<Record<string, MaterialFamilySelectOption>>(
        (acc, item) => {
          acc[item.value] = item;
          return acc;
        },
        {},
      ),
    [familyOptions],
  );

  const baseTypeLabelMap = useMemo(
    () =>
      baseTypeOptions.reduce<Record<string, string>>((acc, item) => {
        acc[item.value] = item.label;
        return acc;
      }, {}),
    [baseTypeOptions],
  );

  const categorySelectOptions = useMemo<MaterialCategorySelectOption[]>(
    () =>
      businessCategoryOptions.map((item) => {
        const baseTypeLabel = baseTypeLabelMap[item.baseType];
        const pathPrefix = baseTypeLabel ? `${baseTypeLabel} / ` : '';
        const compactPath = item.displayName.startsWith(pathPrefix)
          ? item.displayName.slice(pathPrefix.length)
          : item.displayName;

        return {
          label: item.name,
          value: item.id,
          title: item.displayName,
          pathLabel: compactPath !== item.name ? compactPath : undefined,
          searchText: `${item.name} ${item.displayName}`,
        };
      }),
    [baseTypeLabelMap, businessCategoryOptions],
  );

  const fetchOptions = useCallback(
    async (
      keyword?: string,
      nextBaseType?: MaterialBaseType,
      nextCategoryId?: string,
      nextFamilyId?: string,
    ) => {
      const id = ++requestIdRef.current;
      const requestKeyword = normalizeRemoteSelectKeyword(keyword);
      const isBaseQuery =
        !requestKeyword &&
        (!canUseFilters || (!nextBaseType && !nextCategoryId && !nextFamilyId));
      const baseOptionsRequestId = isBaseQuery
        ? ++baseOptionsRequestIdRef.current
        : undefined;
      entityOptionsReadyRef.current = false;
      if (!requestKeyword) {
        if (!isBaseQuery) baseOptionsRequestIdRef.current += 1;
        baseOptionsEmptyChangeRef.current?.(false);
      }
      setEntityLoading(true);
      try {
        const params: Record<string, unknown> = { keyWords: keyword };
        if (canUseFilters && nextBaseType) {
          params.baseType = nextBaseType;
        }
        if (canUseFilters && nextCategoryId) {
          params.categoryId = nextCategoryId;
        }
        if (canUseFilters && nextFamilyId) {
          params.familyId = nextFamilyId;
        }
        const options = await requestRef.current(params);
        if (
          isBaseQuery &&
          !unmountedRef.current &&
          baseOptionsRequestId === baseOptionsRequestIdRef.current
        ) {
          baseOptionsEmptyChangeRef.current?.(options.length === 0);
        }
        if (unmountedRef.current || id !== requestIdRef.current) {
          return;
        }
        optionsKeywordRef.current = requestKeyword;
        entityOptionsReadyRef.current = true;
        setEntityOptions(
          sortRemoteSelectOptionsByKeyword(
            options.map((option) => ({
              ...option,
              title: option.label,
            })),
            keyword,
          ),
        );
      } finally {
        if (!unmountedRef.current && id === requestIdRef.current) {
          setEntityLoading(false);
        }
      }
    },
    [canUseFilters],
  );

  useEffect(() => {
    void fetchOptions(searchRef.current, baseType, categoryId, familyId);
  }, [baseType, categoryId, familyId, fetchOptions, requestKey]);

  const resetSearchAfterSelection = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    searchRef.current = '';
    setSearchValue('');
    requestIdRef.current += 1;
    entityOptionsReadyRef.current = false;
    void fetchOptions('', baseType, categoryId, familyId);
  }, [baseType, categoryId, familyId, fetchOptions]);

  const selectedEntityOptions = useMemo(() => {
    const known =
      mode === 'multiple'
        ? (selectedOptions ?? [])
        : selectedOption
          ? [selectedOption]
          : [];
    const selectedValueSet = new Set(
      mode === 'multiple'
        ? (selectedValues ?? [])
        : selectedValue
          ? [selectedValue]
          : [],
    );
    const missing = known
      .filter((option) => selectedValueSet.has(option.value))
      .filter(
        (option) =>
          !entityOptions.some((current) => current.value === option.value),
      )
      .map((option) => ({
        ...option,
        title: option.title ?? option.label,
      }));
    return missing.length > 0 ? [...missing, ...entityOptions] : entityOptions;
  }, [
    entityOptions,
    mode,
    selectedOption,
    selectedOptions,
    selectedValue,
    selectedValues,
  ]);

  const handleBaseTypeChange = useCallback(
    (nextValue: MaterialBaseType | undefined) => {
      setBaseType(nextValue);
      setCategoryId((current) => {
        if (!current) return current;
        const currentCategory = categoryMap[current];
        return currentCategory && currentCategory.baseType === nextValue
          ? current
          : undefined;
      });
      setFamilyId((current) => {
        if (!current || !nextValue) return current;
        const currentFamily = familyMap[current];
        return currentFamily?.baseType && currentFamily.baseType !== nextValue
          ? undefined
          : current;
      });
    },
    [categoryMap, familyMap],
  );

  const handleCategoryChange = useCallback(
    (nextValue: string | undefined) => {
      setCategoryId(nextValue);
      const nextCategory = nextValue ? categoryMap[nextValue] : undefined;
      if (nextCategory) {
        setBaseType(nextCategory.baseType);
      }
      setFamilyId((current) => {
        if (!current || !nextValue) return current;
        const currentFamily = familyMap[current];
        return currentFamily?.categoryId &&
          currentFamily.categoryId !== nextValue
          ? undefined
          : current;
      });
    },
    [categoryMap, familyMap],
  );

  const handleFamilyChange = useCallback(
    (nextValue: string | undefined) => {
      setFamilyId(nextValue);
      const nextFamily = nextValue ? familyMap[nextValue] : undefined;
      if (nextFamily?.baseType) {
        setBaseType(nextFamily.baseType);
      }
      if (nextFamily?.categoryId) {
        setCategoryId(nextFamily.categoryId);
      }
    },
    [familyMap],
  );

  const handleSearch = useCallback(
    (keyword: string) => {
      searchRef.current = keyword;
      setSearchValue(keyword);
      if (!isRemoteSelectSnapshotCurrent(keyword, optionsKeywordRef.current)) {
        requestIdRef.current += 1;
        entityOptionsReadyRef.current = false;
        setEntityOptions([]);
        setEntityLoading(true);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        void fetchOptions(keyword, baseType, categoryId, familyId);
      }, debounceTime);
    },
    [baseType, categoryId, debounceTime, familyId, fetchOptions],
  );

  const handleEntityChange = useCallback(
    (nextValue: string | string[] | undefined) => {
      const addsSelection = Array.isArray(nextValue)
        ? nextValue.some((item) => !(selectedValues ?? []).includes(item))
        : Boolean(nextValue);
      if (
        addsSelection &&
        (!entityOptionsReadyRef.current ||
          !isRemoteSelectSnapshotCurrent(
            searchRef.current,
            optionsKeywordRef.current,
          ))
      ) {
        message.warning(STALE_REMOTE_SELECT_MESSAGE);
        return;
      }
      if (Array.isArray(nextValue)) {
        const nextOptions = selectedEntityOptions.filter((option) =>
          nextValue.includes(option.value),
        );
        formFieldProps?.onChange?.(nextValue);
        onValuesChange?.(nextValue, nextOptions);
        if (addsSelection) {
          resetSearchAfterSelection();
        }
        return;
      }
      const nextOption = nextValue
        ? selectedEntityOptions.find((option) => option.value === nextValue)
        : undefined;
      formFieldProps?.onChange?.(nextValue);
      onChange?.(nextValue, nextOption);
      if (nextOption) {
        onOptionSelected?.(nextOption);
        resetSearchAfterSelection();
      }
    },
    [
      formFieldProps,
      message,
      onChange,
      onOptionSelected,
      onValuesChange,
      resetSearchAfterSelection,
      selectedEntityOptions,
      selectedValues,
    ],
  );

  const handleScan = useCallback(
    async (code: string) => {
      try {
        const findMaterialByBarcode =
          materialSelectCapabilities?.findMaterialByBarcode;
        if (!findMaterialByBarcode) {
          throw new Error('物料扫码查询能力未配置');
        }
        const material = await findMaterialByBarcode({
          barcode: code,
        });
        const scanRequestParams: Record<string, unknown> = {
          keyWords: material.code || code,
        };
        if (canUseFilters && material.baseType) {
          scanRequestParams.baseType = material.baseType;
        }
        if (canUseFilters && material.categoryId) {
          scanRequestParams.categoryId = material.categoryId;
        }
        if (canUseFilters && material.familyId) {
          scanRequestParams.familyId = material.familyId;
        }
        const allowedOptions = await requestRef.current(scanRequestParams);
        const allowedOption = allowedOptions.find(
          (option) => option.value === material.id,
        );
        if (!allowedOption) {
          throw new Error(SCANNED_MATERIAL_NOT_ALLOWED_MESSAGE);
        }

        if (canUseFilters && material.baseType) {
          setBaseType(material.baseType);
        }
        if (canUseFilters) {
          setCategoryId(material.categoryId ?? undefined);
          setFamilyId(material.familyId ?? undefined);
        }
        const scannedOption: SelectOption = {
          ...allowedOption,
          title: allowedOption.label,
        };
        setEntityOptions((prev) => {
          const next = prev.filter((option) => option.value !== material.id);
          return [scannedOption, ...next];
        });
        if (mode === 'multiple') {
          const nextValues = Array.from(
            new Set([...(selectedValues ?? []), material.id]),
          );
          const nextOptions = [
            scannedOption,
            ...selectedEntityOptions.filter(
              (option) =>
                nextValues.includes(option.value) &&
                option.value !== material.id,
            ),
          ];
          formFieldProps?.onChange?.(nextValues);
          onValuesChange?.(nextValues, nextOptions);
          if (!(selectedValues ?? []).includes(material.id)) {
            resetSearchAfterSelection();
          }
        } else {
          formFieldProps?.onChange?.(material.id);
          onChange?.(material.id, scannedOption);
          onOptionSelected?.(scannedOption);
          resetSearchAfterSelection();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : `未匹配物料条码：${code}`;
        message.warning(errorMessage);
      }
    },
    [
      canUseFilters,
      formFieldProps,
      message,
      mode,
      onChange,
      onOptionSelected,
      onValuesChange,
      materialSelectCapabilities,
      resetSearchAfterSelection,
      selectedEntityOptions,
      selectedValues,
    ],
  );

  const handleScanRef = useRef(handleScan);
  handleScanRef.current = handleScan;
  const registerScanGun = materialSelectCapabilities?.registerScanGun;
  useEffect(() => {
    if (!scanEnabled || disabled || !registerScanGun) return;
    return registerScanGun((code) => {
      void handleScanRef.current(code);
    });
  }, [disabled, registerScanGun, scanEnabled]);

  const hasActiveFilters =
    canUseFilters && Boolean(baseType || categoryId || familyId);
  const filterButtonLabel =
    filterMode !== 'collapsible'
      ? undefined
      : visibleFilterControls
        ? '收起筛选'
        : hasActiveFilters
          ? '筛选中'
          : '筛选';

  const entitySelectNode = (
    <Select
      showSearch
      mode={mode}
      maxTagCount={maxTagCount}
      size={size}
      value={mode === 'multiple' ? selectedValues : selectedValue}
      searchValue={searchValue}
      onChange={handleEntityChange}
      options={selectedEntityOptions}
      placeholder={placeholder}
      style={entitySelectStyle}
      disabled={disabled}
      loading={entityLoading}
      filterOption={false}
      onSearch={handleSearch}
      onFocus={() => setScanEnabled(true)}
      onBlur={() => setScanEnabled(false)}
      allowClear
      popupMatchSelectWidth={false}
      styles={{ popup: { root: { minWidth: selectDropdownMinWidth } } }}
      optionRender={({ data }) => {
        const option = data as SelectOption;
        const unitLabel = formatUnitLabel(option.unit, unitLabelMap);
        const identityInfo = [
          option.spec
            ? {
                key: 'materialSpec',
                text: `规格：${option.spec}`,
                title: `规格：${option.spec}`,
              }
            : null,
          unitLabel
            ? {
                key: 'materialUnit',
                text: `单位：${unitLabel}`,
                title: `单位：${unitLabel}`,
              }
            : null,
        ].filter(
          (item): item is { key: string; text: string; title: string } =>
            item !== null,
        );
        const subInfo = selectorCustomFields
          .map((field) => {
            const { error, display } = resolveMaterialSelectorCustomField(
              field,
              {
                computedValues: option.customComputedValues,
                rawValues: option.customValues,
                errors: option.customComputedErrors,
              },
            );
            if (error) {
              return {
                key: field.fieldKey,
                text: `『${field.label}』：计算异常`,
                title: `『${field.label}』：${error}`,
              };
            }
            return display
              ? {
                  key: field.fieldKey,
                  text: `『${field.label}』：${display}`,
                  title: `『${field.label}』：${display}`,
                }
              : null;
          })
          .filter(
            (item): item is { key: string; text: string; title: string } =>
              item !== null,
          );
        const allSubInfo = [...identityInfo, ...subInfo];
        if (allSubInfo.length === 0) {
          return (
            <div
              title={option.title}
              style={{ lineHeight: 1.4, whiteSpace: 'normal' }}
            >
              {option.label}
            </div>
          );
        }
        return (
          <div
            title={option.title}
            style={{ lineHeight: 1.4, whiteSpace: 'normal' }}
          >
            <div>{option.label}</div>
            <div
              style={{
                marginTop: 2,
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0 12px',
                color: 'rgba(0, 0, 0, 0.45)',
                fontSize: 12,
                lineHeight: 1.3,
              }}
            >
              {allSubInfo.map((item) => (
                <span
                  key={item.key}
                  title={item.title}
                  style={{
                    maxWidth: 180,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        );
      }}
    />
  );

  if (filterMode === 'hidden') {
    return (
      <div data-scan-scope="material-select" style={containerStyle}>
        {entitySelectNode}
      </div>
    );
  }

  return (
    <div data-scan-scope="material-select" style={filterContainerStyle}>
      {visibleFilterControls ? (
        <Select
          allowClear
          showSearch
          optionFilterProp="searchText"
          value={familyId}
          onChange={handleFamilyChange}
          options={familyOptions}
          placeholder="物料"
          style={{ width: familyWidth }}
          disabled={disabled || familyLoading}
          loading={familyLoading}
          popupMatchSelectWidth={false}
          styles={{ popup: { root: { minWidth: Math.max(familyWidth, 280) } } }}
        />
      ) : null}
      {entitySelectNode}
      {filterMode === 'collapsible' ? (
        <Button
          size="small"
          onClick={() => setFiltersVisible((current) => !current)}
          disabled={disabled}
        >
          {filterButtonLabel}
        </Button>
      ) : null}
      {visibleFilterControls ? (
        <>
          <Select
            allowClear
            value={baseType}
            onChange={handleBaseTypeChange}
            options={baseTypeOptions}
            placeholder="系统分类"
            style={{ width: baseTypeWidth }}
            disabled={disabled}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="searchText"
            value={categoryId}
            onChange={handleCategoryChange}
            options={categorySelectOptions}
            placeholder="业务分类"
            style={{ width: categoryWidth }}
            disabled={disabled || categoryLoading}
            popupMatchSelectWidth={false}
            styles={{ popup: { root: { minWidth: Math.max(categoryWidth, 280) } } }}
            optionRender={({ data }) => {
              const option = data as MaterialCategorySelectOption;
              return (
                <div title={option.title}>
                  <div>{option.label}</div>
                  {option.pathLabel ? (
                    <div
                      style={{
                        marginTop: 2,
                        color: 'rgba(0, 0, 0, 0.45)',
                        fontSize: 12,
                        lineHeight: 1.3,
                        whiteSpace: 'normal',
                      }}
                    >
                      {option.pathLabel}
                    </div>
                  ) : null}
                </div>
              );
            }}
          />
        </>
      ) : null}
    </div>
  );
}
