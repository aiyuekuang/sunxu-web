/** @sunxu-layer business @sunxu-domain inventory @sunxu-reason Preserves the stock-count line editor while the host supplies inventory choices, permissions, routes, custom row semantics, and option requests. */
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  ProFormSelect,
  ProFormText,
  type ProFormSelectProps,
} from '@ant-design/pro-components';
import { Button, Card, Col, Form, Input, Row } from 'antd';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BatchMaterialAddButton,
  buildBatchMaterialOption,
} from './BatchMaterialAddButton';
import { DocumentLineCustomFieldFormItems } from '../documents/DocumentLineCustomFieldFormItems';
import { MaterialTablePicker } from './MaterialTablePicker';
import type { BatchMaterialRecord } from '../manufacturing/batch-material-add-types';
import type {
  StockCountLineConfigEntryLabelProps,
  StockCountLineConfigTarget,
  StockCountLineFormListProps,
  StockCountLineFormRow,
  StockCountLineSelectRequest,
} from './stock-count-line-form-list-types';
import type { MaterialPickerRecord } from './material-table-picker-types';

type StockCountSelectRequestParams = Parameters<StockCountLineSelectRequest>[0];
type StockCountRequestOptions = Awaited<
  ReturnType<StockCountLineSelectRequest>
>;

function toStockCountRequestOptions(
  options: NonNullable<ProFormSelectProps['options']>,
): StockCountRequestOptions {
  return options.map((option) =>
    typeof option === 'string'
      ? { label: option, value: option }
      : { ...option, value: option.value ?? undefined },
  );
}

interface StockCountMaterialPickerFieldProps<
  TMaterial extends BatchMaterialRecord,
> {
  value?: string;
  materialRecord?: TMaterial;
  materialLabel?: string;
  onChange?: (value: string | undefined) => void;
  onMaterialChange?: (
    materialId: string | undefined,
    material?: TMaterial,
  ) => void;
  onOpenChange?: (open: boolean) => void;
}

interface StockCountConfigurableSelectProps
  extends Omit<ProFormSelectProps, 'name' | 'label' | 'request'> {
  name: NonNullable<ProFormSelectProps['name']>;
  label: string;
  configTarget: StockCountLineConfigTarget;
  request: StockCountLineSelectRequest;
  configWhen?: (params: StockCountSelectRequestParams) => boolean;
  renderConfigEntryLabel: (
    props: StockCountLineConfigEntryLabelProps,
  ) => ReactNode;
  emptyText?: ReactNode;
}

function hasSearchKeyword(params: StockCountSelectRequestParams): boolean {
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

/** The host owns the link/permission; this helper keeps the source empty-option lifecycle. */
function StockCountConfigurableSelect({
  name,
  label,
  configTarget,
  request: sourceRequest,
  configWhen,
  renderConfigEntryLabel,
  emptyText = '暂无可选数据',
  disabled,
  readonly,
  messageVariables,
  fieldProps,
  ...rest
}: StockCountConfigurableSelectProps) {
  const form = Form.useFormInstance();
  const currentValue = Form.useWatch(name, form);
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
      !configWhenRef.current(params as StockCountSelectRequestParams)
    ) {
      setShowConfigEntry(false);
      return;
    }

    let active = true;
    const requestId = ++probeRequestIdRef.current;
    sourceRequestRef
      .current(params as StockCountSelectRequestParams, {})
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

  const request = useCallback<StockCountLineSelectRequest>(
    async (...args) => {
      const requestId = ++requestIdRef.current;
      const params = args[0];
      try {
        const sourceParams = { ...(params as Record<string, unknown>) };
        delete sourceParams.configEntryRefreshVersion;
        const sourceArgs = [
          sourceParams,
          ...args.slice(1),
        ] as Parameters<StockCountLineSelectRequest>;
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

  const labelText = typeof label === 'string' ? label : '当前选项';

  return (
    <ProFormSelect
      {...rest}
      name={name}
      label={renderConfigEntryLabel({
        target: configTarget,
        children: label,
        show:
          showConfigEntry &&
          !disabled &&
          !readonly &&
          !fieldProps?.disabled &&
          !hasSelectedValue(currentValue),
        onOpen: () => {
          refreshAfterConfigRef.current = true;
        },
      })}
      messageVariables={{ ...messageVariables, label: labelText }}
      request={request}
      params={{
        ...((rest.params as Record<string, unknown> | undefined) ?? {}),
        configEntryRefreshVersion: refreshVersion,
      }}
      disabled={disabled}
      readonly={readonly}
      fieldProps={{
        ...fieldProps,
        notFoundContent: fieldProps?.notFoundContent ?? emptyText,
      }}
    />
  );
}

function getMaterialLabel(
  material?: MaterialPickerRecord,
  fallback?: string,
): string {
  if (!material) return fallback || '选择物料';
  return [material.code, material.name, material.spec]
    .filter(Boolean)
    .join(' - ');
}

function StockCountMaterialPickerField<
  TMaterial extends BatchMaterialRecord,
>({
  value,
  materialRecord,
  materialLabel,
  onChange,
  onMaterialChange,
  onOpenChange,
}: StockCountMaterialPickerFieldProps<TMaterial>) {
  const handleChange = useCallback(
    (materialId: string | undefined, material?: TMaterial) => {
      onChange?.(materialId);
      onMaterialChange?.(materialId, material);
    },
    [onChange, onMaterialChange],
  );

  return (
    <MaterialTablePicker<TMaterial>
      mode="single"
      value={value}
      selectedRecords={materialRecord ? [materialRecord] : undefined}
      title="选择盘点物料"
      placeholder={getMaterialLabel(materialRecord, materialLabel)}
      buttonProps={{ block: true, style: { textAlign: 'left' } }}
      requestParams={{ isActive: true }}
      onOpenChange={onOpenChange}
      onChange={handleChange}
    />
  );
}

/** Shared manual-line editor for creating and maintaining a stock count. */
/**
 * @sunxu-layer business
 * @sunxu-domain inventory
 * @sunxu-reason Presents reusable stock count line form list behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function StockCountLineFormList<
  TLine extends StockCountLineFormRow = StockCountLineFormRow,
>({
  form,
  warehouseId,
  showLocationControl,
  lineCustomFieldSchema,
  titlePrefix,
  minLineCount = 0,
  capabilities,
}: StockCountLineFormListProps<TLine>) {
  const lines =
    (Form.useWatch('lines', form) as TLine[] | undefined) ?? [];
  const hasUnselectedMaterial = lines.some((line) => !line.materialId);
  const [materialOptionsEmpty, setMaterialOptionsEmpty] = useState(false);
  const [materialPickerOpen, setMaterialPickerOpen] = useState(false);
  const [materialProbeVersion, setMaterialProbeVersion] = useState(0);
  const refreshMaterialProbeRef = useRef(false);
  const hasActiveMaterialOptionsRef = useRef(
    capabilities.hasActiveMaterialOptions,
  );

  useEffect(() => {
    hasActiveMaterialOptionsRef.current =
      capabilities.hasActiveMaterialOptions;
  }, [capabilities.hasActiveMaterialOptions]);

  useEffect(() => {
    const refreshAfterConfig = () => {
      if (!refreshMaterialProbeRef.current) return;
      refreshMaterialProbeRef.current = false;
      setMaterialProbeVersion((version) => version + 1);
    };
    window.addEventListener('focus', refreshAfterConfig);
    return () => window.removeEventListener('focus', refreshAfterConfig);
  }, []);

  useEffect(() => {
    if (!hasUnselectedMaterial || materialPickerOpen) {
      setMaterialOptionsEmpty(false);
      return;
    }

    let active = true;
    hasActiveMaterialOptionsRef.current()
      .then((hasOptions) => {
        if (active) setMaterialOptionsEmpty(!hasOptions);
      })
      .catch(() => {
        if (active) setMaterialOptionsEmpty(false);
      });
    return () => {
      active = false;
    };
  }, [
    hasUnselectedMaterial,
    materialPickerOpen,
    materialProbeVersion,
  ]);

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 8,
        }}
      >
        <BatchMaterialAddButton<TLine, BatchMaterialRecord>
          rows={lines}
          onRowsChange={(nextLines) => form.setFieldValue('lines', nextLines)}
          getMaterialId={(line) => line.materialId || undefined}
          isEmptyRow={capabilities.isEmptyRow}
          createRow={capabilities.createRowFromMaterial}
        />
      </div>
      <Form.List name="lines">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => {
              const line = lines[field.name];
              const ownerType = line?.ownerType;
              return (
                <Card
                  key={field.key}
                  size="small"
                  title={`${titlePrefix} ${field.name + 1}`}
                  style={{ marginBottom: 12 }}
                  extra={
                    <Button
                      danger
                      type="text"
                      htmlType="button"
                      icon={<DeleteOutlined />}
                      disabled={fields.length <= minLineCount}
                      onClick={() => remove(field.name)}
                    >
                      删除
                    </Button>
                  }
                >
                  <Form.Item name={[field.name, 'id']} hidden>
                    <Input />
                  </Form.Item>
                  <Row gutter={12}>
                    <Col span={8}>
                      <Form.Item
                        label={capabilities.renderConfigEntryLabel({
                          target: 'material',
                          show: materialOptionsEmpty && !line?.materialId,
                          onOpen: () => {
                            refreshMaterialProbeRef.current = true;
                          },
                          children: '物料档案',
                        })}
                        required
                      >
                        <Form.Item
                          name={[field.name, 'materialId']}
                          noStyle
                          rules={[{ required: true, message: '请选择物料' }]}
                        >
                          <StockCountMaterialPickerField<BatchMaterialRecord>
                            materialRecord={line?.materialRecord}
                            materialLabel={line?.materialOption?.label}
                            onOpenChange={setMaterialPickerOpen}
                            onMaterialChange={(materialId, material) => {
                              form.setFieldValue(
                                ['lines', field.name, 'materialRecord'],
                                material,
                              );
                              form.setFieldValue(
                                ['lines', field.name, 'materialOption'],
                                material
                                  ? buildBatchMaterialOption(material)
                                  : undefined,
                              );
                              if (materialId !== line?.materialId) {
                                form.setFieldValue(
                                  ['lines', field.name, 'batchNo'],
                                  undefined,
                                );
                              }
                            }}
                          />
                        </Form.Item>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <ProFormSelect
                        name={[field.name, 'ownerType']}
                        label="库存货主"
                        options={capabilities.ownerTypes.options}
                        rules={[
                          { required: true, message: '请选择库存货主' },
                        ]}
                        fieldProps={{
                          allowClear: true,
                          onChange: () =>
                            form.setFieldValue(
                              ['lines', field.name, 'ownerRefId'],
                              undefined,
                            ),
                        }}
                      />
                    </Col>
                    {ownerType === capabilities.ownerTypes.customerValue ? (
                      <Col span={8}>
                        <StockCountConfigurableSelect
                          name={[field.name, 'ownerRefId']}
                          label="客户货主"
                          configTarget="customer"
                          configWhen={() =>
                            ownerType === capabilities.ownerTypes.customerValue
                          }
                          request={capabilities.requestCustomerOwnerOptions}
                          renderConfigEntryLabel={
                            capabilities.renderConfigEntryLabel
                          }
                          showSearch
                          fieldProps={{
                            filterOption: false,
                            allowClear: true,
                          }}
                          rules={[
                            { required: true, message: '请选择客户货主' },
                          ]}
                        />
                      </Col>
                    ) : null}
                    {ownerType === capabilities.ownerTypes.supplierValue ? (
                      <Col span={8}>
                        <StockCountConfigurableSelect
                          name={[field.name, 'ownerRefId']}
                          label="供应商货主"
                          configTarget="supplier"
                          configWhen={() =>
                            ownerType === capabilities.ownerTypes.supplierValue
                          }
                          request={capabilities.requestSupplierOwnerOptions}
                          renderConfigEntryLabel={
                            capabilities.renderConfigEntryLabel
                          }
                          showSearch
                          fieldProps={{
                            filterOption: false,
                            allowClear: true,
                          }}
                          rules={[
                            { required: true, message: '请选择供应商货主' },
                          ]}
                        />
                      </Col>
                    ) : null}
                    {showLocationControl && warehouseId ? (
                      <Col span={8}>
                        <StockCountConfigurableSelect
                          name={[field.name, 'locationId']}
                          label="仓位"
                          configTarget="warehouseLocations"
                          configWhen={() => Boolean(warehouseId)}
                          params={{ warehouseId }}
                          request={async (params) => {
                            const options =
                              await capabilities.requestStockLocationOptions({
                                warehouseId,
                                keyWords: params.keyWords,
                              });
                            return toStockCountRequestOptions(options);
                          }}
                          renderConfigEntryLabel={
                            capabilities.renderConfigEntryLabel
                          }
                          showSearch
                          fieldProps={{
                            filterOption: false,
                            allowClear: true,
                          }}
                        />
                      </Col>
                    ) : null}
                    <Col span={8}>
                      <ProFormText
                        name={[field.name, 'storageLocation']}
                        label="位置说明"
                        fieldProps={{ maxLength: 1000 }}
                      />
                    </Col>
                    <Col span={8}>
                      <ProFormText
                        name={[field.name, 'batchNo']}
                        label="批号"
                        fieldProps={{ maxLength: 128 }}
                      />
                    </Col>
                    <Col span={8}>
                      <ProFormText
                        name={[field.name, 'remarks']}
                        label="行备注"
                        fieldProps={{ maxLength: 512 }}
                      />
                    </Col>
                    <DocumentLineCustomFieldFormItems
                      schema={lineCustomFieldSchema}
                      namePrefix={['lines', field.name]}
                      colSpan={8}
                    />
                  </Row>
                </Card>
              );
            })}
            <Button
              htmlType="button"
              icon={<PlusOutlined />}
              onClick={() => add({})}
            >
              添加盘点行
            </Button>
          </>
        )}
      </Form.List>
    </>
  );
}
