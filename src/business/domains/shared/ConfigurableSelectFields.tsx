import {
  ProFormSelect,
  type ProFormSelectProps,
} from '@ant-design/pro-components';
import { Button, Form, Space, type FormItemProps, type SelectProps } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import { cloneElement, type ReactElement, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ConfigEntryFieldLabel, type ConfigEntryFieldLabelProps } from './ConfigEntryFieldLabel';

type SelectRequest = NonNullable<ProFormSelectProps['request']>;
type SelectRequestParams = Parameters<SelectRequest>[0];

export interface ConfigurableProFormSelectProps
  extends Omit<ProFormSelectProps, 'label' | 'request'> {
  label: ReactNode;
  request: SelectRequest;
  configEntry: Omit<ConfigEntryFieldLabelProps, 'children'>;
  /** 如工艺路线、仓库等必须在上游字段已选后才有候选项。 */
  configWhen?: (params: SelectRequestParams) => boolean;
  emptyText?: ReactNode;
}

function hasSearchKeyword(params: SelectRequestParams): boolean {
  const values = params as Record<string, unknown>;
  return ['keyWords', 'keyword', 'search', 'searchText'].some((key) => {
    const value = values[key];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

function hasSelectedValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

/** Remote host master-data selector. Requests and configuration route/permission are host supplied. */
/**
 * @sunxu-layer business
 * @sunxu-domain shared
 * @sunxu-reason Presents reusable configurable pro form select behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function ConfigurableProFormSelect({
  name,
  label,
  request: sourceRequest,
  configEntry,
  configWhen,
  emptyText = '暂无可选数据',
  disabled,
  readonly,
  messageVariables,
  fieldProps,
  ...rest
}: ConfigurableProFormSelectProps) {
  const form = Form.useFormInstance();
  const currentValue = Form.useWatch(name, form);
  const labelText = typeof label === 'string' ? label : '当前选项';
  const [showConfigEntry, setShowConfigEntry] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const requestIdRef = useRef(0);
  const probeRequestIdRef = useRef(0);
  const refreshAfterConfigRef = useRef(false);
  const sourceRequestRef = useRef(sourceRequest);
  const configWhenRef = useRef(configWhen);
  sourceRequestRef.current = sourceRequest;
  configWhenRef.current = configWhen;
  const hasConfigCondition = Boolean(configWhen);
  const paramsKey = JSON.stringify(
    (rest.params as Record<string, unknown> | undefined) ?? {},
  );

  useEffect(() => {
    if (
      hasSelectedValue(currentValue) ||
      disabled ||
      readonly ||
      fieldProps?.disabled
    ) {
      setShowConfigEntry(false);
      return;
    }

    const params = {
      ...((rest.params as Record<string, unknown> | undefined) ?? {}),
    };
    for (const key of ['keyWords', 'keyword', 'search', 'searchText']) {
      delete params[key];
    }
    if (
      configWhenRef.current &&
      !configWhenRef.current(params as SelectRequestParams)
    ) {
      setShowConfigEntry(false);
      return;
    }

    let active = true;
    const requestId = ++probeRequestIdRef.current;
    sourceRequestRef
      .current(params as SelectRequestParams, {})
      .then((options) => {
        if (!active || requestId !== probeRequestIdRef.current) return;
        setShowConfigEntry(Array.isArray(options) && options.length === 0);
      })
      .catch(() => {
        if (active && requestId === probeRequestIdRef.current) {
          setShowConfigEntry(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    currentValue,
    disabled,
    fieldProps?.disabled,
    paramsKey,
    readonly,
    hasConfigCondition,
  ]);

  useEffect(() => {
    const refreshAfterReturn = () => {
      if (!refreshAfterConfigRef.current) return;
      refreshAfterConfigRef.current = false;
      setRefreshVersion((version) => version + 1);
    };
    window.addEventListener('focus', refreshAfterReturn);
    return () => window.removeEventListener('focus', refreshAfterReturn);
  }, []);

  const request = useCallback<SelectRequest>(
    async (...args) => {
      const requestId = ++requestIdRef.current;
      const params = args[0];
      try {
        const sourceParams = { ...(params as Record<string, unknown>) };
        delete sourceParams.configEntryRefreshVersion;
        const sourceArgs = [sourceParams, ...args.slice(1)] as Parameters<SelectRequest>;
        const options = await sourceRequest(...sourceArgs);
        if (requestId === requestIdRef.current && !hasSearchKeyword(params)) {
          setShowConfigEntry(
            Array.isArray(options) &&
              options.length === 0 &&
              !hasSelectedValue(currentValue) &&
              !disabled &&
              !readonly &&
              !fieldProps?.disabled &&
              (configWhen ? configWhen(params) : true),
          );
        }
        return options;
      } catch (error) {
        if (requestId === requestIdRef.current) setShowConfigEntry(false);
        throw error;
      }
    },
    [
      configWhen,
      currentValue,
      disabled,
      fieldProps?.disabled,
      readonly,
      sourceRequest,
    ],
  );

  return (
    <ProFormSelect
      {...rest}
      name={name}
      label={
        <ConfigEntryFieldLabel
          {...configEntry}
          show={
            showConfigEntry &&
            !disabled &&
            !readonly &&
            !fieldProps?.disabled &&
            !hasSelectedValue(currentValue)
          }
          onOpen={() => {
            refreshAfterConfigRef.current = true;
            configEntry.onOpen?.();
          }}
        >
          {label}
        </ConfigEntryFieldLabel>
      }
      messageVariables={{ ...messageVariables, label: labelText }}
      request={request}
      params={{
        ...((rest.params as Record<string, unknown> | undefined) ?? {}),
        configEntryRefreshVersion: refreshVersion,
      }}
      fieldProps={{
        ...fieldProps,
        notFoundContent: fieldProps?.notFoundContent ?? emptyText,
      }}
    />
  );
}

export interface DictionarySelectState {
  options: DefaultOptionType[];
  loading?: boolean;
  error?: unknown;
  retry: () => void;
}

export interface DictionaryProFormSelectProps
  extends Omit<ProFormSelectProps, 'label' | 'options' | 'request'> {
  label: string;
  dictionary: DictionarySelectState;
  configEntry: Omit<ConfigEntryFieldLabelProps, 'children'>;
  showConfigEntry?: boolean;
}

/** Dictionary selector presentation; the host supplies dictionary loading and retry. */
/**
 * @sunxu-layer business
 * @sunxu-domain shared
 * @sunxu-reason Presents reusable dictionary pro form select behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function DictionaryProFormSelect({
  label,
  dictionary,
  configEntry,
  showConfigEntry = true,
  disabled,
  readonly,
  messageVariables,
  fieldProps,
  ...rest
}: DictionaryProFormSelectProps) {
  const form = Form.useFormInstance();
  const value = Form.useWatch(rest.name, form);
  const { options, loading, error, retry } = dictionary;
  const refreshOnFocusRef = useRef(false);

  useEffect(() => {
    const refreshWhenReturned = () => {
      if (!refreshOnFocusRef.current) return;
      refreshOnFocusRef.current = false;
      retry();
    };
    window.addEventListener('focus', refreshWhenReturned);
    return () => window.removeEventListener('focus', refreshWhenReturned);
  }, [retry]);

  const isDisabled = Boolean(disabled || readonly || fieldProps?.disabled);
  const labelNode = (
    <ConfigEntryFieldLabel
      {...configEntry}
      show={
        showConfigEntry &&
        !loading &&
        !error &&
        options.length === 0 &&
        (Array.isArray(value)
          ? value.length === 0
          : value == null || value === '') &&
        !isDisabled
      }
      onOpen={() => {
        refreshOnFocusRef.current = true;
        configEntry.onOpen?.();
      }}
    >
      {label}
    </ConfigEntryFieldLabel>
  );
  const notFoundContent =
    fieldProps?.notFoundContent ??
    (loading ? (
      '正在加载字典项'
    ) : error ? (
      <Space size={8}>
        <span>字典项加载失败</span>
        <Button type="link" size="small" onClick={retry}>
          重试
        </Button>
      </Space>
    ) : (
      '暂无可选字典项'
    ));

  return (
    <ProFormSelect
      {...rest}
      label={labelNode}
      messageVariables={{ ...messageVariables, label }}
      options={options}
      fieldProps={{ ...fieldProps, loading, notFoundContent }}
    />
  );
}

export interface DictionaryFormItemProps
  extends Omit<FormItemProps, 'label' | 'children'> {
  label: string;
  dictionary: DictionarySelectState;
  configEntry: Omit<ConfigEntryFieldLabelProps, 'children'>;
  children: ReactElement<SelectProps>;
  showConfigEntry?: boolean;
}

/** Dictionary Form.Item presentation for Form.List and native Ant Design Select fields. */
/**
 * @sunxu-layer business
 * @sunxu-domain shared
 * @sunxu-reason Presents reusable dictionary form item behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function DictionaryFormItem({
  label,
  dictionary,
  configEntry,
  children,
  showConfigEntry = true,
  messageVariables,
  ...formItemProps
}: DictionaryFormItemProps) {
  const form = Form.useFormInstance();
  const value = Form.useWatch(formItemProps.name, form);
  const { options, loading, error, retry } = dictionary;
  const refreshOnFocusRef = useRef(false);

  useEffect(() => {
    const refreshWhenReturned = () => {
      if (!refreshOnFocusRef.current) return;
      refreshOnFocusRef.current = false;
      retry();
    };
    window.addEventListener('focus', refreshWhenReturned);
    return () => window.removeEventListener('focus', refreshWhenReturned);
  }, [retry]);

  const isDisabled = Boolean(children.props.disabled);
  const notFoundContent =
    children.props.notFoundContent ??
    (loading ? (
      '正在加载字典项'
    ) : error ? (
      <Space size={8}>
        <span>字典项加载失败</span>
        <Button type="link" size="small" onClick={retry}>
          重试
        </Button>
      </Space>
    ) : (
      '暂无可选字典项'
    ));

  return (
    <Form.Item
      {...formItemProps}
      label={
        <ConfigEntryFieldLabel
          {...configEntry}
          show={
            showConfigEntry &&
            !loading &&
            !error &&
            options.length === 0 &&
            (Array.isArray(value)
              ? value.length === 0
              : value == null || value === '') &&
            !isDisabled
          }
          onOpen={() => {
            refreshOnFocusRef.current = true;
            configEntry.onOpen?.();
          }}
        >
          {label}
        </ConfigEntryFieldLabel>
      }
      messageVariables={{ ...messageVariables, label }}
    >
      {cloneElement(children, {
        options: options as SelectProps['options'],
        loading,
        notFoundContent,
      })}
    </Form.Item>
  );
}
