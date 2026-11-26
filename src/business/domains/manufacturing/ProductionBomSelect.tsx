import { ProFormSelect } from '@ant-design/pro-components';
import { Form } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useProductionBomSelectCapabilities } from '../../providers/BusinessUiProvider';
import type {
  ProductionBomOptionRequestParams,
} from './production-bom-select-types';

type ProFormSelectProps = React.ComponentProps<typeof ProFormSelect>;

export interface ProductionBomSelectProps
  extends Omit<ProFormSelectProps, 'name' | 'label' | 'request' | 'showSearch'> {
  name?: string;
  label?: React.ReactNode;
  materialId?: string | null;
  saleOrderId?: string | null;
  saleOrderItemId?: string | null;
  autoSelectSingle?: boolean;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function hasSearchKeyword(params: Record<string, unknown>): boolean {
  return ['keyWords', 'keyword', 'search', 'searchText'].some((key) => {
    const value = params[key];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

function getSearchKeyword(params: Record<string, unknown>): string | undefined {
  return (
    readString(params.keyWords) ??
    readString(params.keyword) ??
    readString(params.search) ??
    readString(params.searchText)
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Retains host BOM selection, dependency, and refresh behavior while requests, permissions, route navigation, and field help come from the host.
 */
export function ProductionBomSelect({
  name = 'bomHeaderId',
  label,
  tooltip,
  materialId,
  saleOrderId,
  saleOrderItemId,
  autoSelectSingle = true,
  dependencies = ['materialId', 'saleOrderId', 'saleOrderItemId'],
  params,
  fieldProps,
  placeholder = '可选，不选则自动使用默认BOM',
  ...rest
}: ProductionBomSelectProps) {
  const capabilities = useProductionBomSelectCapabilities();
  const defaultHelp = capabilities?.getFieldHelpProps() ?? {
    label: 'BOM版本',
  };
  const form = Form.useFormInstance();
  const [baseOptionsEmpty, setBaseOptionsEmpty] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const refreshAfterConfigRef = useRef(false);
  const requestIdRef = useRef(0);
  const watchedMaterialId = Form.useWatch('materialId', form);
  const watchedSaleOrderId = Form.useWatch('saleOrderId', form);
  const watchedSaleOrderItemId = Form.useWatch('saleOrderItemId', form);
  const selectedBomId = Form.useWatch(name, form);

  const resolvedMaterialId =
    readString(materialId) ?? readString(watchedMaterialId);
  const resolvedSaleOrderId =
    readString(saleOrderId) ?? readString(watchedSaleOrderId);
  const resolvedSaleOrderItemId =
    readString(saleOrderItemId) ?? readString(watchedSaleOrderItemId);
  const labelText = typeof label === 'string' ? label : defaultHelp.label;
  const isDisabled = Boolean(
    rest.disabled || rest.readonly || fieldProps?.disabled,
  );

  useEffect(() => {
    const refreshAfterReturn = () => {
      if (!refreshAfterConfigRef.current) return;
      refreshAfterConfigRef.current = false;
      setRefreshVersion((version) => version + 1);
    };
    window.addEventListener('focus', refreshAfterReturn);
    return () => window.removeEventListener('focus', refreshAfterReturn);
  }, []);

  useEffect(() => {
    if (!autoSelectSingle || !capabilities?.requestOptions) return;

    const requestId = ++requestIdRef.current;
    setBaseOptionsEmpty(false);
    if (!resolvedMaterialId) return;
    if (!isEmptyValue(form.getFieldValue(name))) return;

    let active = true;
    capabilities
      .requestOptions({
        materialId: resolvedMaterialId,
        saleOrderId: resolvedSaleOrderId,
        saleOrderItemId: resolvedSaleOrderItemId,
      })
      .then((options) => {
        if (!active || requestId !== requestIdRef.current) return;
        const hasSelectedBom = !isEmptyValue(form.getFieldValue(name));
        setBaseOptionsEmpty(
          options.length === 0 && !hasSelectedBom && !isDisabled,
        );
        if (!active || options.length !== 1) return;
        if (hasSelectedBom) return;
        form.setFieldValue(name, options[0].value);
      });

    return () => {
      active = false;
    };
  }, [
    autoSelectSingle,
    capabilities,
    form,
    name,
    resolvedMaterialId,
    resolvedSaleOrderId,
    resolvedSaleOrderItemId,
    isDisabled,
    refreshVersion,
  ]);

  const requestOptions = useCallback(
    async (requestParams: Record<string, unknown>) => {
      if (!capabilities?.requestOptions) return [];
      const requestId = ++requestIdRef.current;
      const keyword = hasSearchKeyword(requestParams);
      try {
        const options = await capabilities.requestOptions({
          keyWords: keyword ? getSearchKeyword(requestParams) : undefined,
          materialId:
            readString(materialId) ?? readString(requestParams.materialId),
          saleOrderId:
            readString(saleOrderId) ?? readString(requestParams.saleOrderId),
          saleOrderItemId:
            readString(saleOrderItemId) ??
            readString(requestParams.saleOrderItemId),
        });
        if (requestId === requestIdRef.current) {
          setBaseOptionsEmpty(
            Boolean(
              readString(materialId) ??
                readString(requestParams.materialId) ??
                resolvedMaterialId,
            ) &&
              !keyword &&
              options.length === 0 &&
              !isDisabled,
          );
        }
        return options;
      } catch (error) {
        if (requestId === requestIdRef.current) setBaseOptionsEmpty(false);
        throw error;
      }
    },
    [
      capabilities,
      materialId,
      resolvedMaterialId,
      isDisabled,
      saleOrderId,
      saleOrderItemId,
    ],
  );

  return (
    <ProFormSelect
      {...rest}
      name={name}
      label={
        capabilities?.renderConfigEntryFieldLabel ? (
          capabilities.renderConfigEntryFieldLabel({
            target: 'bom',
            show:
              baseOptionsEmpty &&
              Boolean(resolvedMaterialId) &&
              !selectedBomId &&
              !isDisabled,
            onOpen: () => {
              refreshAfterConfigRef.current = true;
            },
            children: label ?? defaultHelp.label,
          })
        ) : (
          label ?? defaultHelp.label
        )
      }
      messageVariables={{ label: labelText }}
      tooltip={tooltip ?? defaultHelp.tooltip}
      showSearch
      dependencies={dependencies}
      params={{
        ...params,
        materialId,
        saleOrderId,
        saleOrderItemId,
        refreshVersion,
      }}
      request={requestOptions}
      fieldProps={{ filterOption: false, allowClear: true, ...fieldProps }}
      placeholder={placeholder}
    />
  );
}
