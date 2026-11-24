import {
  ProFormDependency,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, Form, Input, Space, Typography } from 'antd';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { RemoteSelect } from '../../components/RemoteSelect';
import type {
  MesStockLocationSelectCapabilities,
  StockLocationConfigEntryFieldLabelProps,
  StockLocationDependencyFieldProps,
  StockLocationInlineSelectorProps,
  StockLocationOption,
  StockLocationOptionRequestParams,
  StockLocationPrecheck,
  StockLocationSelectFieldProps,
  StockLocationTreeNode,
} from './stock-location-select-field-types';

interface SelectRequestParams {
  keyWords?: string;
}

type PrecheckRequest = MesStockLocationSelectCapabilities['requestPrecheck'];

/** Share only in-flight requests, scoped by host request function and tenant. */
const locationPrecheckRequests = new WeakMap<
  PrecheckRequest,
  Map<string, Promise<StockLocationPrecheck>>
>();

export function requestStockLocationPrecheck(
  action: string,
  warehouseId: string,
  capabilities: MesStockLocationSelectCapabilities,
): Promise<StockLocationPrecheck> {
  let requests = locationPrecheckRequests.get(capabilities.requestPrecheck);
  if (!requests) {
    requests = new Map();
    locationPrecheckRequests.set(capabilities.requestPrecheck, requests);
  }

  const key = `${capabilities.requestCacheScope}:${action}:${warehouseId}`;
  const existing = requests.get(key);
  if (existing) return existing;

  const request = capabilities.requestPrecheck({ action, warehouseId });
  requests.set(key, request);
  void request.then(
    () => {
      if (requests?.get(key) === request) requests.delete(key);
    },
    () => {
      if (requests?.get(key) === request) requests.delete(key);
    },
  );
  return request;
}

export function flattenLocationTree(
  nodes: StockLocationTreeNode[] = [],
): StockLocationOption[] {
  return nodes.flatMap((node) => [
    {
      label: node.pathName || node.name,
      value: node.id,
      disabled: !node.allowStock || !node.isActive,
    },
    ...flattenLocationTree(node.children ?? []),
  ]);
}

export async function requestStockLocationOptions(
  capabilities: MesStockLocationSelectCapabilities,
  params: StockLocationOptionRequestParams = {},
): Promise<StockLocationOption[]> {
  const {
    warehouseId,
    keyWords,
    materialId,
    batchNo,
    ownerType,
    customerId,
    ownerRefId,
    minAvailableQty,
  } = params;

  if (warehouseId && (materialId || batchNo || minAvailableQty !== undefined)) {
    const response = await capabilities.requestDistribution({
      warehouseId,
      materialId,
      batchNo,
      ownerType,
      customerId,
      ownerRefId,
      minAvailableQty,
    });
    const keyword = keyWords?.trim().toLowerCase();
    return (response?.locations ?? [])
      .filter(
        (item): item is typeof item & { locationId: string } =>
          Boolean(item.locationId),
      )
      .filter((item) => {
        if (!keyword) return true;
        return [item.locationCode, item.locationName, item.locationPath]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(keyword));
      })
      .map((item) => ({
        label: `${
          item.locationPath || item.locationName || item.locationCode
        }（可用 ${item.availableQty}）`,
        value: item.locationId,
      }));
  }

  const response = await capabilities.requestLocationList({
    page: 1,
    pageSize: 50,
    warehouseId,
    keyword: keyWords,
    isActive: true,
    allowStock: true,
  });
  return (response?.list ?? []).map((location) => ({
    label: location.pathName || location.name,
    value: location.id,
    disabled: !location.allowStock || !location.isActive,
  }));
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function renderFieldLabel(
  capabilities: MesStockLocationSelectCapabilities,
  props: StockLocationConfigEntryFieldLabelProps,
) {
  return capabilities.renderConfigEntryFieldLabel(props);
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain warehouse stock location
 * @sunxu-reason MES warehouse policy controls location access, requiredness, and stock eligibility.
 *
 * MES policy-driven stock location field for ProForm forms.
 */
export const StockLocationSelectField: React.FC<
  StockLocationSelectFieldProps
> = ({
  capabilities,
  name,
  label,
  action,
  warehouseId,
  textName,
  materialId,
  batchNo,
  ownerType,
  customerId,
  ownerRefId,
  minAvailableQty,
  requiredMessage,
}) => {
  const form = Form.useFormInstance();
  const selectedLocationId = Form.useWatch(name, form);
  const previousWarehouseIdRef = useRef<string | undefined>(undefined);
  const [precheck, setPrecheck] = useState<StockLocationPrecheck | null>(null);
  const [precheckScope, setPrecheckScope] = useState<string | undefined>();
  const [precheckError, setPrecheckError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [baseOptionsEmpty, setBaseOptionsEmpty] = useState(false);
  const [baseOptionsChecked, setBaseOptionsChecked] = useState(false);
  const [baseOptionsRefreshVersion, setBaseOptionsRefreshVersion] = useState(0);
  const refreshBaseOptionsOnFocusRef = useRef(false);

  useEffect(() => {
    const refreshAfterConfig = () => {
      if (!refreshBaseOptionsOnFocusRef.current) return;
      refreshBaseOptionsOnFocusRef.current = false;
      setBaseOptionsRefreshVersion((version) => version + 1);
    };
    window.addEventListener('focus', refreshAfterConfig);
    return () => window.removeEventListener('focus', refreshAfterConfig);
  }, []);

  useEffect(() => {
    if (!capabilities.canAccessLocations || !warehouseId) {
      setBaseOptionsEmpty(false);
      setBaseOptionsChecked(false);
      return;
    }

    let cancelled = false;
    setBaseOptionsEmpty(false);
    setBaseOptionsChecked(false);
    capabilities
      .requestLocationList({
        page: 1,
        pageSize: 1,
        warehouseId,
        isActive: true,
        allowStock: true,
      })
      .then((result) => {
        if (!cancelled) {
          setBaseOptionsEmpty((result?.list ?? []).length === 0);
          setBaseOptionsChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBaseOptionsEmpty(false);
          setBaseOptionsChecked(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    capabilities.canAccessLocations,
    capabilities.requestCacheScope,
    capabilities.requestLocationList,
    baseOptionsRefreshVersion,
    warehouseId,
  ]);

  useEffect(() => {
    if (!capabilities.canAccessLocations) {
      form.setFieldValue(name, undefined);
      setPrecheck(null);
      setPrecheckScope(undefined);
      setPrecheckError(null);
      setLoading(false);
      previousWarehouseIdRef.current = warehouseId;
      return;
    }

    if (previousWarehouseIdRef.current !== warehouseId) {
      form.setFieldValue(name, undefined);
      if (textName) form.setFieldValue(textName, undefined);
      previousWarehouseIdRef.current = warehouseId;
    }

    if (!warehouseId) {
      setPrecheck(null);
      setPrecheckScope(undefined);
      setPrecheckError(null);
      return;
    }

    let cancelled = false;
    setPrecheck(null);
    setPrecheckScope(undefined);
    setLoading(true);
    setPrecheckError(null);
    requestStockLocationPrecheck(action, warehouseId, capabilities)
      .then((result) => {
        if (!cancelled) {
          setPrecheck(result);
          setPrecheckScope(capabilities.requestCacheScope);
          setPrecheckError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setPrecheck(null);
          setPrecheckScope(undefined);
          setPrecheckError(errorMessage(error, '仓位策略读取失败'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    capabilities.canAccessLocations,
    capabilities.requestCacheScope,
    capabilities.requestPrecheck,
    action,
    form,
    name,
    textName,
    warehouseId,
  ]);

  const displayBlockers = useMemo(
    () => capabilities.filterDisplayBlockers(precheck?.blockers ?? []),
    [capabilities.filterDisplayBlockers, precheck],
  );

  const storageLocationText = textName ? (
    <ProFormTextArea
      name={textName}
      label="位置说明"
      fieldProps={{ rows: 2, maxLength: 1000 }}
      placeholder="可填写货架、区域、托盘等文本位置"
    />
  ) : null;

  if (!warehouseId) return null;
  if (!capabilities.canAccessLocations) return storageLocationText;
  if (precheckError) {
    return <Alert type="error" showIcon message={precheckError} />;
  }
  if (!precheck) return null;
  if (precheck.locationControlMode === 'none') return storageLocationText;

  return (
    <Space orientation="vertical" size={8} style={{ width: '100%' }}>
      {displayBlockers.length > 0 ? (
        <Alert type="error" showIcon message={displayBlockers.join('；')} />
      ) : null}
      {precheck.warnings.length > 0 ? (
        <Alert type="warning" showIcon message={precheck.warnings.join('；')} />
      ) : null}
      <ProFormSelect
        name={name}
        label={renderFieldLabel(capabilities, {
          target: 'warehouseLocations',
          show:
            baseOptionsChecked &&
            baseOptionsEmpty &&
            !selectedLocationId &&
            !loading,
          onOpen: () => {
            refreshBaseOptionsOnFocusRef.current = true;
          },
          children: label,
        })}
        request={async (_params: SelectRequestParams) => {
          if (materialId || batchNo || minAvailableQty !== undefined) {
            return requestStockLocationOptions(
              capabilities,
              {
                warehouseId,
                keyWords: _params.keyWords,
                materialId,
                batchNo,
                ownerType,
                customerId,
                ownerRefId,
                minAvailableQty,
              },
            );
          }
          const tree = await capabilities.requestLocationTree({
            warehouseId,
            activeOnly: true,
            stockOnly: true,
          });
          return flattenLocationTree(tree ?? []);
        }}
        debounceTime={300}
        rules={
          precheck.locationRequired
            ? [
                {
                  required: true,
                  message: requiredMessage ?? `请选择${label}`,
                },
              ]
            : []
        }
        fieldProps={{
          loading,
          allowClear: !precheck.locationRequired,
          showSearch: true,
          filterOption: false,
          fetchDataOnSearch: true,
          optionFilterProp: 'label',
        }}
        placeholder={
          precheck.locationRequired
            ? '当前仓库要求选择仓位'
            : '可选，选择后按仓位记录库存'
        }
      />
      {!precheck.locationRequired ? storageLocationText : null}
    </Space>
  );
};

/**
 * @sunxu-component mes-specific
 * @sunxu-domain warehouse stock location
 * @sunxu-reason Stock availability must be checked against the quantity and direction in the form.
 *
 * Form dependency variant that derives availability from the watched quantity.
 */
export const StockLocationDependencyField: React.FC<
  StockLocationDependencyFieldProps
> = ({
  warehouseFieldName,
  materialFieldName,
  batchFieldName,
  qtyFieldName,
  availableQtyMode,
  ...props
}) => (
  <ProFormDependency
    name={[
      warehouseFieldName,
      ...(materialFieldName ? [materialFieldName] : []),
      ...(batchFieldName ? [batchFieldName] : []),
      ...(qtyFieldName ? [qtyFieldName] : []),
    ]}
  >
    {(values) => {
      const rawQty = qtyFieldName ? Number(values[qtyFieldName]) : Number.NaN;
      let minAvailableQty: number | undefined;
      if (availableQtyMode === 'positive' && rawQty > 0) {
        minAvailableQty = rawQty;
      } else if (availableQtyMode === 'negative' && rawQty < 0) {
        minAvailableQty = Math.abs(rawQty);
      } else if (availableQtyMode === 'absolute' && rawQty !== 0) {
        minAvailableQty = Math.abs(rawQty);
      }

      return (
        <StockLocationSelectField
          {...props}
          warehouseId={
            isString(values[warehouseFieldName])
              ? values[warehouseFieldName]
              : undefined
          }
          materialId={
            materialFieldName && isString(values[materialFieldName])
              ? values[materialFieldName]
              : undefined
          }
          batchNo={
            batchFieldName && isString(values[batchFieldName])
              ? values[batchFieldName]
              : undefined
          }
          minAvailableQty={minAvailableQty}
        />
      );
    }}
  </ProFormDependency>
);

/**
 * @sunxu-component mes-specific
 * @sunxu-domain warehouse stock location
 * @sunxu-reason Inline stock rows need policy-aware location options and the legacy text-location fallback.
 *
 * Controlled selector used in editable table rows and other inline editors.
 */
export const StockLocationInlineSelector: React.FC<
  StockLocationInlineSelectorProps
> = ({
  capabilities,
  label = '出库仓位',
  action,
  warehouseId,
  materialId,
  batchNo,
  ownerType,
  customerId,
  ownerRefId,
  minAvailableQty,
  value,
  storageLocation,
  disabled,
  onChange,
}) => {
  const helpTextId = useId();
  const [precheck, setPrecheck] = useState<StockLocationPrecheck | null>(null);
  const [precheckScope, setPrecheckScope] = useState<string | undefined>();
  const [precheckError, setPrecheckError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<StockLocationOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState<string | undefined>(undefined);
  const normalizedBatchNo = batchNo?.trim() || undefined;

  useEffect(() => {
    if (!capabilities.canAccessLocations || !warehouseId) {
      setPrecheck(null);
      setPrecheckScope(undefined);
      setPrecheckError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setPrecheck(null);
    setPrecheckScope(undefined);
    setLoading(true);
    setPrecheckError(null);
    requestStockLocationPrecheck(action, warehouseId, capabilities)
      .then((result) => {
        if (!cancelled) {
          setPrecheck(result);
          setPrecheckScope(capabilities.requestCacheScope);
          setPrecheckError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setPrecheck(null);
          setPrecheckScope(undefined);
          setPrecheckError(errorMessage(error, '仓位策略读取失败'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    capabilities.canAccessLocations,
    capabilities.requestCacheScope,
    capabilities.requestPrecheck,
    action,
    warehouseId,
  ]);

  useEffect(() => {
    if (
      !capabilities.canAccessLocations ||
      !warehouseId ||
      !precheck ||
      precheckScope !== capabilities.requestCacheScope ||
      precheck.action !== action ||
      precheck.warehouseId !== warehouseId ||
      precheck.locationControlMode === 'none'
    ) {
      setOptions([]);
      setOptionsError(null);
      setOptionsLoading(false);
      return;
    }

    let cancelled = false;
    setOptionsLoading(true);
    setOptionsError(null);
    requestStockLocationOptions(
      capabilities,
      {
        warehouseId,
        keyWords: keyword,
        materialId,
        batchNo: normalizedBatchNo,
        ownerType,
        customerId,
        ownerRefId,
        minAvailableQty,
      },
    )
      .then((result) => {
        if (!cancelled) {
          setOptions(result);
          setOptionsError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setOptions([]);
          setOptionsError(errorMessage(error, '仓位列表读取失败'));
        }
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    capabilities.canAccessLocations,
    capabilities.requestCacheScope,
    action,
    capabilities.requestDistribution,
    capabilities.requestLocationList,
    warehouseId,
    precheck,
    precheckScope,
    keyword,
    materialId,
    normalizedBatchNo,
    ownerType,
    customerId,
    ownerRefId,
    minAvailableQty,
  ]);

  if (!warehouseId) return null;

  const storageLocationInput = (
    <Input.TextArea
      aria-label="位置说明"
      value={storageLocation}
      disabled={disabled}
      rows={1}
      maxLength={1000}
      onChange={(event) =>
        onChange({ storageLocation: event.target.value || undefined })
      }
      placeholder="位置说明（可选）"
    />
  );

  if (!capabilities.canAccessLocations) return storageLocationInput;
  if (precheckError) {
    return <Alert type="error" showIcon message={precheckError} />;
  }
  if (!precheck) return null;
  if (precheck.locationControlMode === 'none') return storageLocationInput;

  const displayBlockers = capabilities.filterDisplayBlockers(
    precheck.blockers,
  );
  const locationRequiredError =
    precheck.locationRequired && !value
      ? '严格仓位仓库必须选择入库仓位'
      : undefined;

  return (
    <Space orientation="vertical" size={6} style={{ width: '100%' }}>
      {displayBlockers.length > 0 ? (
        <Alert type="error" showIcon message={displayBlockers.join('；')} />
      ) : null}
      {precheck.warnings.length > 0 ? (
        <Alert type="warning" showIcon message={precheck.warnings.join('；')} />
      ) : null}
      {optionsError ? (
        <Alert type="error" showIcon message={optionsError} />
      ) : null}
      <RemoteSelect
        aria-label={label}
        aria-describedby={locationRequiredError ? helpTextId : undefined}
        value={value}
        disabled={disabled}
        loading={loading || optionsLoading}
        options={options}
        allowClear={!precheck.locationRequired}
        showSearch
        filterOption={false}
        onSearch={(nextKeyword) => setKeyword(nextKeyword || undefined)}
        onChange={(nextValue) =>
          onChange({
            locationId: typeof nextValue === 'string' ? nextValue : undefined,
            storageLocation: undefined,
          })
        }
        status={precheck.locationRequired && !value ? 'error' : undefined}
        placeholder={
          precheck.locationRequired
            ? `当前仓库要求选择${label}`
            : `${label}（可选）`
        }
        style={{ width: '100%' }}
      />
      {locationRequiredError ? (
        <Typography.Text
          id={helpTextId}
          type="danger"
          style={{ fontSize: 12 }}
        >
          {locationRequiredError}
        </Typography.Text>
      ) : null}
      {!precheck.locationRequired ? storageLocationInput : null}
    </Space>
  );
};
