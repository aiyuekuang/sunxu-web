import { PlusOutlined } from '@ant-design/icons';
import {
  ProFormSelect,
  type ProFormSelectProps,
} from '@ant-design/pro-components';
import { Button, Divider, Form, Tooltip } from 'antd';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMasterDataQuickCreateCapabilities } from '../../providers/BusinessUiProvider';
import type {
  MasterDataQuickCreateEntity,
  MasterDataQuickCreateOption,
} from '../documents/master-data-quick-create-types';

interface MasterDataQuickCreateActionProps {
  entity: MasterDataQuickCreateEntity;
  onBeforeOpen?: () => void;
  onDrawerOpenChange?: (open: boolean) => void;
  onCreated: (
    option: MasterDataQuickCreateOption,
  ) => void | Promise<void>;
}

/** A permission-aware create action whose form and service remain host-owned. */
/**
 * @sunxu-layer business
 * @sunxu-domain shared
 * @sunxu-reason Presents reusable master data quick create action behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function MasterDataQuickCreateAction({
  entity,
  onBeforeOpen,
  onDrawerOpenChange,
  onCreated,
}: MasterDataQuickCreateActionProps) {
  const capabilities = useMasterDataQuickCreateCapabilities();
  const [open, setOpen] = useState(false);
  const label = entity === 'customer' ? '客户' : '供应商';

  if (!capabilities?.renderDrawer || !capabilities.canCreate(entity)) {
    return null;
  }

  return (
    <>
      <Tooltip title={`新增${label}`}>
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          aria-label={`新增${label}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onBeforeOpen?.();
            setOpen(true);
          }}
        >
          新增
        </Button>
      </Tooltip>
      {capabilities.renderDrawer({
        entity,
        open,
        onOpenChange: (nextOpen) => {
          setOpen(nextOpen);
          onDrawerOpenChange?.(nextOpen);
        },
        onCreated,
      })}
    </>
  );
}

interface MasterDataQuickCreateSelectProps
  extends Omit<ProFormSelectProps, 'name'> {
  name: string;
  quickCreateEntity: MasterDataQuickCreateEntity;
}

function appendCreatedValue(
  currentValue: unknown,
  createdValue: string,
): string[] {
  const values = Array.isArray(currentValue)
    ? currentValue.filter((value): value is string => typeof value === 'string')
    : [];
  return values.includes(createdValue) ? values : [...values, createdValue];
}

/**
 * Controlled quick-create entry for customer/supplier ProFormSelect fields.
 * The host supplies create permission, drawer content, and route-aware labels.
 */
/**
 * @sunxu-layer business
 * @sunxu-domain shared
 * @sunxu-reason Presents reusable master data quick create select behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function MasterDataQuickCreateSelect({
  name,
  quickCreateEntity,
  fieldProps,
  disabled,
  readonly,
  ...selectProps
}: MasterDataQuickCreateSelectProps) {
  const form = Form.useFormInstance();
  const currentValue = Form.useWatch(name, form);
  const capabilities = useMasterDataQuickCreateCapabilities();
  const [dropdownOpen, setDropdownOpen] = useState<boolean | undefined>(
    fieldProps?.open,
  );
  const [quickCreateDrawerOpen, setQuickCreateDrawerOpen] = useState(false);
  const quickCreateDrawerOpenRef = useRef(false);
  const [createdOption, setCreatedOption] =
    useState<MasterDataQuickCreateOption | null>(null);
  const [quickCreateVersion, setQuickCreateVersion] = useState(0);
  const [baseOptionsEmpty, setBaseOptionsEmpty] = useState(false);
  const refreshAfterConfigRef = useRef(false);
  const requestIdRef = useRef(0);
  const baseOptionsProbeIdRef = useRef(0);
  const originalRequest = selectProps.request;
  const requestParamsKey = JSON.stringify(
    (selectProps.params as Record<string, unknown> | undefined) ?? {},
  );
  const originalRequestRef = useRef(originalRequest);
  originalRequestRef.current = originalRequest;
  const hasOriginalRequest = Boolean(originalRequest);
  const originalPopupRender = fieldProps?.popupRender;
  const quickCreateDisabled = Boolean(
    disabled || readonly || fieldProps?.disabled,
  );
  const isMultiple =
    selectProps.mode === 'multiple' || selectProps.mode === 'tags';

  useEffect(() => {
    const refreshAfterReturn = () => {
      if (!refreshAfterConfigRef.current) return;
      refreshAfterConfigRef.current = false;
      setQuickCreateVersion((version) => version + 1);
    };
    window.addEventListener('focus', refreshAfterReturn);
    return () => window.removeEventListener('focus', refreshAfterReturn);
  }, []);

  useEffect(() => {
    const requestFn = originalRequestRef.current;
    if (
      !requestFn ||
      (Array.isArray(currentValue)
        ? currentValue.length > 0
        : currentValue != null && currentValue !== '') ||
      quickCreateDisabled
    ) {
      setBaseOptionsEmpty(false);
      return;
    }

    const params = {
      ...((selectProps.params as Record<string, unknown> | undefined) ?? {}),
    };
    for (const key of ['keyWords', 'keyword', 'search', 'searchText']) {
      delete params[key];
    }

    let active = true;
    const requestId = ++baseOptionsProbeIdRef.current;
    requestFn(params as Parameters<typeof requestFn>[0], {})
      .then((options) => {
        if (active && requestId === baseOptionsProbeIdRef.current) {
          setBaseOptionsEmpty(options.length === 0);
        }
      })
      .catch(() => {
        if (active && requestId === baseOptionsProbeIdRef.current) {
          setBaseOptionsEmpty(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    currentValue,
    hasOriginalRequest,
    quickCreateEntity,
    quickCreateDisabled,
    requestParamsKey,
  ]);

  const request = useCallback(
    async (...args: Parameters<NonNullable<typeof originalRequest>>) => {
      if (!originalRequest) return [];
      const requestId = ++requestIdRef.current;
      try {
        const options = await originalRequest(...args);
        const params = (args[0] ?? {}) as Record<string, unknown>;
        const hasKeyword = ['keyWords', 'keyword', 'search', 'searchText'].some(
          (key) =>
            typeof params[key] === 'string' &&
            (params[key] as string).trim().length > 0,
        );
        if (requestId === requestIdRef.current && !hasKeyword) {
          setBaseOptionsEmpty(options.length === 0 && !createdOption);
        }
        if (
          !createdOption ||
          options.some((option) => option.value === createdOption.value)
        ) {
          return options;
        }
        return [createdOption, ...options];
      } catch (error) {
        if (requestId === requestIdRef.current) setBaseOptionsEmpty(false);
        throw error;
      }
    },
    [createdOption, originalRequest],
  );

  const handleCreated = useCallback(
    async (option: MasterDataQuickCreateOption) => {
      const nextValue = isMultiple
        ? appendCreatedValue(form.getFieldValue(name), option.value)
        : option.value;
      form.setFieldValue(name, nextValue);
      fieldProps?.onChange?.(nextValue, isMultiple ? [option] : option);
      // Keep the just-created authority ID visible if it is absent from page one.
      setCreatedOption(option);
      setQuickCreateVersion((version) => version + 1);
    },
    [fieldProps, form, isMultiple, name],
  );

  const label = selectProps.label;
  const labelNode =
    typeof label === 'string'
      ? (capabilities?.renderConfigEntryLabel?.({
          entity: quickCreateEntity,
          children: label,
          show:
            baseOptionsEmpty &&
            !quickCreateDisabled &&
            (Array.isArray(currentValue)
              ? currentValue.length === 0
              : currentValue == null || currentValue === ''),
          onOpen: () => {
            refreshAfterConfigRef.current = true;
          },
        }) ?? label)
      : label;

  return (
    <ProFormSelect
      {...selectProps}
      label={labelNode}
      messageVariables={{
        ...selectProps.messageVariables,
        ...(typeof label === 'string' ? { label } : {}),
      }}
      name={name}
      request={originalRequest ? request : undefined}
      params={{
        ...selectProps.params,
        masterDataQuickCreateVersion: quickCreateVersion,
      }}
      disabled={disabled}
      readonly={readonly}
      fieldProps={{
        ...fieldProps,
        open: quickCreateDrawerOpen
          ? false
          : (fieldProps?.open ?? dropdownOpen),
        onOpenChange: (open) => {
          const nextOpen = quickCreateDrawerOpenRef.current ? false : open;
          setDropdownOpen(nextOpen);
          fieldProps?.onOpenChange?.(nextOpen);
        },
        popupRender: (menu: ReactElement) => (
          <>
            {originalPopupRender ? originalPopupRender(menu) : menu}
            {!quickCreateDisabled ? (
              <>
                <Divider style={{ margin: '4px 0' }} />
                <MasterDataQuickCreateAction
                  entity={quickCreateEntity}
                  onBeforeOpen={() => {
                    quickCreateDrawerOpenRef.current = true;
                    setQuickCreateDrawerOpen(true);
                    setDropdownOpen(false);
                    fieldProps?.onOpenChange?.(false);
                  }}
                  onDrawerOpenChange={(open) => {
                    quickCreateDrawerOpenRef.current = open;
                    setQuickCreateDrawerOpen(open);
                    if (!open) setDropdownOpen(false);
                  }}
                  onCreated={handleCreated}
                />
              </>
            ) : null}
          </>
        ),
      }}
    />
  );
}
