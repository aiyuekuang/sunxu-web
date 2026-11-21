import {
  ProFormDatePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormSelectProps,
} from '@ant-design/pro-components';
import { Alert, Form } from 'antd';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BomCostSnapshotEditor } from './BomCostSnapshotEditor';
import { DrawingFilesInline } from './DrawingFilesInline';
import { MaterialSelectField } from './MaterialFilteredSelect';
import { ProductionBomSelect } from './ProductionBomSelect';
import type {
  WorkOrderFormFieldsCapabilities,
  WorkOrderFormFieldsProps,
} from './work-order-form-types';

type SelectRequest = NonNullable<ProFormSelectProps['request']>;
type ConfigTarget = 'processRoute' | 'customer' | 'warehouse';

interface WorkOrderConfigurableSelectProps
  extends Omit<ProFormSelectProps, 'label' | 'request'> {
  label: ReactNode;
  request: SelectRequest;
  configTarget: ConfigTarget;
  configWhen?: (params: Record<string, unknown>) => boolean;
  emptyText?: ReactNode;
  capabilities: WorkOrderFormFieldsCapabilities;
}

function hasSearchKeyword(params: Record<string, unknown>): boolean {
  return ['keyWords', 'keyword', 'search', 'searchText'].some((key) => {
    const value = params[key];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

function hasSelectedValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

/** Keep the MES empty-result configuration link and refresh-on-return behavior. */
function WorkOrderConfigurableSelect({
  name,
  label,
  request: sourceRequest,
  configTarget,
  configWhen,
  emptyText = '暂无可选数据',
  disabled,
  readonly,
  messageVariables,
  fieldProps,
  capabilities,
  ...rest
}: WorkOrderConfigurableSelectProps) {
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
    if (configWhenRef.current && !configWhenRef.current(params)) {
      setShowConfigEntry(false);
      return;
    }

    let active = true;
    const requestId = ++probeRequestIdRef.current;
    void sourceRequestRef.current(params, {})
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
      const params = args[0] as Record<string, unknown>;
      const sourceParams = { ...params };
      delete sourceParams.configEntryRefreshVersion;
      const sourceArgs = [sourceParams, ...args.slice(1)] as Parameters<SelectRequest>;
      try {
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

  const renderedLabel = capabilities.renderConfigEntryFieldLabel
    ? capabilities.renderConfigEntryFieldLabel({
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
          capabilities.openConfiguration?.(configTarget);
        },
      })
    : label;

  return (
    <ProFormSelect
      {...rest}
      name={name}
      label={renderedLabel}
      messageVariables={{ ...messageVariables, label: typeof label === 'string' ? label : '当前选项' }}
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

function normalizeDatePickerValue(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const maybeDate = value as { toISOString?: unknown };
    if (typeof maybeDate.toISOString === 'function') {
      return (maybeDate.toISOString as () => string)();
    }
  }
  return String(value);
}

function RouteFieldResetter() {
  const form = Form.useFormInstance();
  const materialId = Form.useWatch('materialId', form);
  const customerId = Form.useWatch('customerId', form);
  const planStartTime = Form.useWatch('planStartTime', form);
  const dependencyKey = `${materialId ?? ''}|${customerId ?? ''}|${
    normalizeDatePickerValue(planStartTime) ?? ''
  }`;
  const previousKeyRef = useRef<string | null>(null);
  const previousMaterialIdRef = useRef<unknown>(undefined);

  useEffect(() => {
    if (previousKeyRef.current === null) {
      previousKeyRef.current = dependencyKey;
      previousMaterialIdRef.current = materialId;
      return;
    }
    if (previousKeyRef.current === dependencyKey) return;

    const materialChanged = previousMaterialIdRef.current !== materialId;
    previousKeyRef.current = dependencyKey;
    previousMaterialIdRef.current = materialId;

    const userDriven =
      form.isFieldTouched('materialId') ||
      form.isFieldTouched('customerId') ||
      form.isFieldTouched('planStartTime');
    if (!userDriven) return;

    const nextFields: { bomHeaderId?: undefined; routeId: undefined } = {
      routeId: undefined,
    };
    if (materialChanged) nextFields.bomHeaderId = undefined;
    form.setFieldsValue(nextFields);
  }, [dependencyKey, form, materialId]);

  return null;
}

function WorkOrderBomSnapshotField() {
  const form = Form.useFormInstance();
  const bomHeaderId = Form.useWatch('bomHeaderId', form) as string | undefined;
  const plannedQty = Form.useWatch('plannedQty', form) as number | undefined;
  if (!bomHeaderId) return null;
  return (
    <Form.Item label="BOM 明细 / 库存" name="bomCostSnapshot">
      <BomCostSnapshotEditor
        bomHeaderId={bomHeaderId}
        productQty={plannedQty}
        variant="inventory"
      />
    </Form.Item>
  );
}

/** @sunxu-component mes-specific @sunxu-domain manufacturing @sunxu-reason Keeps the work-order create/edit fields, route reset rules, snapshots, and host-owned source requests. */
export function WorkOrderFormFields({ record, capabilities }: WorkOrderFormFieldsProps) {
  const isDraftRecord = !record || record.status === 'draft';
  const requirePlanStartTimeOnManualCreate =
    !record && capabilities.requirePlanStartTimeOnManualCreate;

  const routeRequest: SelectRequest = useCallback(
    (params) => {
      const values = (params ?? {}) as Record<string, unknown>;
      return capabilities.requestRouteOptions({
        keyWords:
          typeof values.keyWords === 'string' ? values.keyWords : undefined,
        materialId: typeof values.materialId === 'string' ? values.materialId : '',
        routeSelectionDate: values.planStartTime,
      });
    },
    [capabilities],
  );

  return (
    <div className="document-form-layout">
      <section className="document-form-section">
        <div className="document-form-section-title">工单信息</div>
        {!record ? <RouteFieldResetter /> : null}
        <MaterialSelectField
          name="materialId"
          request={capabilities.requestMaterialOptions}
          {...capabilities.getAutoFieldHelpProps('产品物料档案')}
          rules={[{ required: true, message: '请选择产品物料档案' }]}
          disabled={!!record}
          placeholder="搜索产品物料档案编码或名称"
        />
        <ProFormText name="status" hidden />
        <ProFormDigit
          name="plannedQty"
          {...capabilities.getProductionFieldHelpProps('计划数量', 'plannedQty')}
          rules={[{ required: true, message: '请输入计划数量' }]}
          min={1}
        />
        <ProFormDigit
          name="priority"
          {...capabilities.getAutoFieldHelpProps('优先级')}
          initialValue={record ? undefined : 5}
          min={1}
          max={10}
          tooltip="1-10，数字越大越优先；调到 8-10 且高于原优先级时，后续可触发插单重排预览。"
          fieldProps={{ precision: 0 }}
        />
        <ProFormDatePicker
          name="planStartTime"
          {...capabilities.getProductionFieldHelpProps('计划开始日期', 'workOrderPlanStartDate')}
          rules={
            requirePlanStartTimeOnManualCreate
              ? [{ required: true, message: '请选择计划开始日期' }]
              : undefined
          }
          fieldProps={{ style: { width: '100%' } }}
        />
        <ProFormDatePicker
          name="planEndTime"
          {...capabilities.getProductionFieldHelpProps('计划结束日期', 'planEndDate')}
          fieldProps={{ style: { width: '100%' } }}
        />
        <ProFormDependency name={['materialId', 'customerId', 'planStartTime']}>
          {({ materialId, planStartTime }) => (
            <WorkOrderConfigurableSelect
              name="routeId"
              label={capabilities.getProductionFieldHelpProps('工艺路线', 'routeId').label ?? '工艺路线'}
              {...capabilities.getProductionFieldHelpProps('工艺路线', 'routeId')}
              configTarget="processRoute"
              configWhen={() => Boolean(materialId)}
              emptyText="该物料没有匹配的有效工艺路线"
              showSearch
              fetchDataOnSearch
              disabled={!materialId || !isDraftRecord}
              params={{ materialId, planStartTime }}
              request={routeRequest}
              capabilities={capabilities}
              fieldProps={{ optionFilterProp: 'label', filterOption: false }}
            />
          )}
        </ProFormDependency>
        <ProFormDependency name={['materialId']}>
          {({ materialId }) => (
            <ProductionBomSelect
              {...capabilities.getProductionFieldHelpProps('BOM 版本', 'bomHeaderId')}
              disabled={!materialId || !!record}
              materialId={typeof materialId === 'string' ? materialId : undefined}
              saleOrderId={record?.plan?.saleOrderId}
              saleOrderItemId={record?.plan?.saleOrderItemId}
              fieldProps={{ optionFilterProp: 'label' }}
            />
          )}
        </ProFormDependency>
        {record ? (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="BOM 版本与本单 BOM 明细创建后不在此修改，请在工单详情的「本单 BOM」中查看维护。"
          />
        ) : (
          <WorkOrderBomSnapshotField />
        )}
        <ProFormDependency name={['materialId', 'bomHeaderId', 'routeId']}>
          {({ materialId, bomHeaderId, routeId }) => {
            if (record) return null;
            if (!materialId || (bomHeaderId && routeId)) return null;
            const hints: string[] = [];
            if (!bomHeaderId) {
              hints.push(
                '未绑定 BOM：工单可创建，但下达后无法自动领料/自动展开物料需求，可稍后补充。',
              );
            }
            if (!routeId) {
              hints.push(
                '未手动指定工艺路线：保存时将按适用规则自动匹配有效工艺路线并带出工序；若无匹配的路线，可稍后在工单上补充。',
              );
            }
            return (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message={hints.length > 1 ? '创建提示' : hints[0]}
                description={
                  hints.length > 1 ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {hints.map((hint) => <li key={hint}>{hint}</li>)}
                    </ul>
                  ) : undefined
                }
              />
            );
          }}
        </ProFormDependency>
        <ProFormSelect
          name="assigneeId"
          {...capabilities.getAutoFieldHelpProps('负责人')}
          showSearch
          initialValue={record ? undefined : capabilities.currentUser?.id}
          debounceTime={300}
          request={capabilities.requestUserOptions}
          fetchDataOnSearch
          fieldProps={{
            filterOption: false,
            allowClear: true,
            placeholder: '默认显示50条，可搜索更多',
          }}
        />
        <WorkOrderConfigurableSelect
          name="customerId"
          label={capabilities.getAutoFieldHelpProps('客户').label ?? '客户'}
          {...capabilities.getAutoFieldHelpProps('客户')}
          configTarget="customer"
          emptyText="暂无可选客户"
          showSearch
          fetchDataOnSearch
          request={capabilities.requestCustomerOptions}
          capabilities={capabilities}
          fieldProps={{ filterOption: false, allowClear: true }}
        />
        <ProFormDependency name={['materialId']}>
          {({ materialId }) => (
            <WorkOrderConfigurableSelect
              name="receiptWarehouseId"
              label={capabilities.getProductionFieldHelpProps('入库仓库', 'receiptWarehouseId').label ?? '入库仓库'}
              {...capabilities.getProductionFieldHelpProps('入库仓库', 'receiptWarehouseId')}
              configTarget="warehouse"
              configWhen={() => Boolean(materialId)}
              emptyText="该物料当前没有可选入库仓库"
              showSearch
              disabled={!isDraftRecord || !materialId}
              debounceTime={300}
              request={(params) =>
                capabilities.requestReceiptWarehouseOptions(
                  { keyWords: typeof params.keyWords === 'string' ? params.keyWords : undefined },
                  typeof materialId === 'string' ? materialId : '',
                )
              }
              params={{ materialId }}
              capabilities={capabilities}
              fetchDataOnSearch
              fieldProps={{
                filterOption: false,
                allowClear: true,
                placeholder: materialId
                  ? '可选，按物料系统分类筛选主仓（含通用仓兜底）；不选则下达时使用物料默认仓库'
                  : '请先选择产品物料档案',
              }}
            />
          )}
        </ProFormDependency>
        <ProFormDatePicker
          name="dueDate"
          {...capabilities.getProductionFieldHelpProps('交货期限', 'dueDate')}
          fieldProps={{ style: { width: '100%' } }}
        />
        {isDraftRecord ? (
          <Form.Item name="drawingUrls" {...capabilities.getAutoFieldHelpProps('专用执行图纸')}>
            <DrawingFilesInline editable emptyText="未上传时使用物料图纸快照" />
          </Form.Item>
        ) : null}
        <ProFormTextArea
          name="description"
          {...capabilities.getAutoFieldHelpProps('备注')}
          fieldProps={{ rows: 3 }}
        />
      </section>
    </div>
  );
}

export type { WorkOrderDetailRecord, WorkOrderFormFieldsProps } from './work-order-form-types';
