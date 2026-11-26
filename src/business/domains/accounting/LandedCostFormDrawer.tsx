import type {
  ProColumns,
  ProFormInstance,
  ProFormSelectProps,
} from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormDatePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormGroup,
  ProFormList,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, Button, Card, Form, Typography } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ContextualHelp } from '../../../components/ContextualHelp';
import { ResizableProTable } from '../shared/ResizableTable';
import { buildLandedCostAllocationPreview } from './landedCostAllocationPreview';
import type {
  LandedCostAllocationBasis,
  LandedCostAllocationDraft,
  LandedCostAllocationPreviewLine,
  LandedCostAllocationPolicy,
  LandedCostAllocationPreview,
  LandedCostCreatePayload,
  LandedCostFormDrawerProps,
  LandedCostFormValues,
  LandedCostRecord,
  LandedCostReceiptDetail,
  LandedCostReceiptItem,
  LandedCostUpdatePayload,
  LandedCostConfigEntryFieldLabelProps,
  LandedCostSelectRequest,
} from './landed-cost-components-types';

const DEFAULT_FORM_VALUES: LandedCostFormValues = {
  currency: 'CNY',
  exchangeRate: 1,
  businessDate: dayjs(),
  receiptOrderIds: [],
  allocations: [],
};

const ALLOCATION_BASIS_LABEL: Record<LandedCostAllocationBasis, string> = {
  amount: '按金额',
  quantity: '按数量',
  weight: '按重量',
  manual: '手工分摊',
};

function toFormValues(detail: LandedCostRecord): LandedCostFormValues {
  const receiptOrderIds = [
    ...new Set(detail.allocations.map((allocation) => allocation.receiptOrderId)),
  ];
  const allocations: LandedCostAllocationDraft[] = detail.allocations.map(
    (allocation) => ({
      receiptItemId: allocation.receiptItemId,
      receiptOrderId: allocation.receiptOrderId,
      display: allocationDisplay(allocation.receiptNoSnapshot, {
        material: allocation.receiptItem?.material,
        batchNo: allocation.batchNoSnapshot,
        quantity: allocation.receiptQuantitySnapshot,
      }),
      previewBases:
        detail.allocationBasis === 'manual'
          ? undefined
          : { [detail.allocationBasis]: Number(allocation.allocationBase) },
      allocationAmount:
        detail.allocationBasis === 'manual'
          ? Number(allocation.allocatedAmount)
          : undefined,
    }),
  );
  return {
    expenseTypeId: detail.expenseTypeId,
    carrierId: detail.carrierId,
    externalRefNo: detail.externalRefNo,
    amount: Number(detail.amount),
    amountExcludingTax: getTaxField(detail.amountExcludingTax),
    taxRate: getTaxField(detail.taxRate),
    taxAmount: getTaxField(detail.taxAmount),
    currency: detail.currency,
    exchangeRate: Number(detail.exchangeRate),
    businessDate: detail.businessDate ? dayjs(detail.businessDate) : undefined,
    allocationBasis: detail.allocationBasis,
    receiptOrderIds,
    allocations,
    remark: detail.remark ?? undefined,
  };
}

function getTaxField(value?: number | null): number | undefined {
  return value == null ? undefined : Number(value);
}

function isAllocationDraft(value: unknown): value is LandedCostAllocationDraft {
  return (
    typeof value === 'object' &&
    value !== null &&
    'receiptItemId' in value &&
    typeof value.receiptItemId === 'string' &&
    'receiptOrderId' in value &&
    typeof value.receiptOrderId === 'string' &&
    'display' in value &&
    typeof value.display === 'string' &&
    (!('allocationAmount' in value) ||
      value.allocationAmount === undefined ||
      typeof value.allocationAmount === 'number')
  );
}

function isAllocationBasis(
  value: string | null | undefined,
): value is LandedCostAllocationBasis {
  return (
    value === 'amount' ||
    value === 'quantity' ||
    value === 'weight' ||
    value === 'manual'
  );
}

function getEffectiveAllocationBasis(
  requested: LandedCostAllocationBasis | undefined,
  configured: string | null | undefined,
): LandedCostAllocationBasis | undefined {
  if (requested) return requested;
  return isAllocationBasis(configured) ? configured : undefined;
}

function getAllocationBasisUnavailableReason(
  policy: LandedCostAllocationPolicy | undefined,
  basis: LandedCostAllocationBasis | undefined,
): string | undefined {
  if (!basis || policy?.supportedAllocationBases.includes(basis)) return undefined;
  return policy?.unavailableAllocationBases.find((item) => item.basis === basis)
    ?.reason;
}

function normalizeBusinessDate(value?: Dayjs | string): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, 10) : undefined;
  }
  const formatted = value.format('YYYY-MM-DD');
  return formatted || undefined;
}

function buildLandedCostPayload(
  values: LandedCostFormValues,
  effectiveAllocationBasis: LandedCostAllocationBasis | undefined,
): LandedCostCreatePayload | undefined {
  const businessDate = normalizeBusinessDate(values.businessDate);
  const currency = values.currency?.trim();
  const externalRefNo = values.externalRefNo?.trim();
  const allocations = values.allocations ?? [];

  if (
    !businessDate ||
    !values.expenseTypeId ||
    !values.carrierId ||
    !externalRefNo ||
    !currency ||
    values.amount == null ||
    allocations.length === 0
  ) {
    return undefined;
  }

  return {
    expenseTypeId: values.expenseTypeId,
    carrierId: values.carrierId,
    externalRefNo,
    amount: values.amount,
    ...(values.amountExcludingTax == null
      ? {}
      : { amountExcludingTax: values.amountExcludingTax }),
    ...(values.taxRate == null ? {} : { taxRate: values.taxRate }),
    ...(values.taxAmount == null ? {} : { taxAmount: values.taxAmount }),
    currency,
    ...(values.exchangeRate == null ? {} : { exchangeRate: values.exchangeRate }),
    businessDate,
    ...(values.allocationBasis ? { allocationBasis: values.allocationBasis } : {}),
    allocations: allocations.map((allocation) => ({
      receiptItemId: allocation.receiptItemId,
      ...(effectiveAllocationBasis === 'manual'
        ? { allocationAmount: allocation.allocationAmount }
        : {}),
    })),
    ...(values.remark?.trim() ? { remark: values.remark.trim() } : {}),
  };
}

function allocationDisplay(
  receiptNo: string,
  item: Pick<LandedCostReceiptItem, 'material' | 'batchNo' | 'quantity'>,
): string {
  const materialName = item.material?.name ?? '未知物料';
  const materialCode = item.material?.code ? `（${item.material.code}）` : '';
  const batchNo = item.batchNo ? ` / 批号 ${item.batchNo}` : '';
  return `${receiptNo} / ${materialName}${materialCode} / 数量 ${item.quantity}${batchNo}`;
}

function allocationDraftFromReceipt(
  receipt: LandedCostReceiptDetail,
  item: LandedCostReceiptItem,
): LandedCostAllocationDraft {
  return {
    receiptItemId: item.id,
    receiptOrderId: receipt.id,
    display: allocationDisplay(receipt.receiptNo, item),
    previewBases: {
      amount: Number(item.discountedAmount ?? item.amount ?? 0),
      quantity: Number(item.quantity),
    },
  };
}

function formatAmount(value: number | undefined): string {
  return value == null ? '-' : value.toFixed(2);
}

function AllocationPreviewPanel({
  preview,
}: {
  preview: LandedCostAllocationPreview | undefined;
}) {
  if (!preview) {
    return (
      <Typography.Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
        请选择或配置分摊方式后显示预计分摊金额；提交时仍以服务端重新核对的结果为准。
      </Typography.Text>
    );
  }

  const isManual = preview.allocationBasis === 'manual';
  const columns: ProColumns<LandedCostAllocationPreview['lines'][number]>[] = [
    { title: '入库明细', dataIndex: 'display', ellipsis: true },
    ...(isManual
      ? [
          {
            title: '手工分摊金额',
            key: 'manualAllocationAmount',
            width: 130,
            align: 'right' as const,
            render: (
              _: unknown,
              line: LandedCostAllocationPreview['lines'][number],
            ) => formatAmount(line.manualAllocationAmount),
          },
        ]
      : [
          {
            title: '分摊基数',
            key: 'allocationBase',
            width: 120,
            align: 'right' as const,
            render: (
              _: unknown,
              line: LandedCostAllocationPreview['lines'][number],
            ) =>
              line.allocationBase == null ? '-' : String(line.allocationBase),
          },
          {
            title: '预计分摊金额',
            key: 'estimatedAllocationAmount',
            width: 140,
            align: 'right' as const,
            render: (
              _: unknown,
              line: LandedCostAllocationPreview['lines'][number],
            ) => formatAmount(line.estimatedAllocationAmount),
          },
        ]),
  ];

  return (
    <Card title="分摊预览" size="small" style={{ marginTop: 16 }}>
      {preview.capitalizableAmount === undefined ? (
        <ContextualHelp
          label="分摊预览"
          title="填写金额后显示预计分摊"
          content="填写不含税成本金额或费用金额后显示预计分摊。提交时仍以服务端重新核对的结果为准。"
        />
      ) : null}
      {!isManual && preview.totalBase === undefined ? (
        <Alert
          showIcon
          type="warning"
          message="所选入库明细没有可用于预览的有效基数"
          description="提交时由服务端重新读取实际入库明细并执行最终校验。"
          style={{ marginBottom: 12 }}
        />
      ) : null}
      <ResizableProTable<LandedCostAllocationPreview['lines'][number]>
        rowKey="receiptItemId"
        columns={columns}
        dataSource={preview.lines}
        search={false}
        options={false}
        pagination={false}
        tableAlertRender={false}
        headerTitle={false}
        size="small"
      />
      <Typography.Paragraph type="secondary" style={{ margin: '12px 0 0' }}>
        {isManual
          ? `已分摊 ${formatAmount(preview.allocatedAmount)}，待分摊 ${formatAmount(
              preview.pendingAmount,
            )}`
          : `分摊基数合计 ${preview.totalBase ?? '-'}，预计分摊合计 ${formatAmount(
              preview.allocatedAmount,
            )}`}
        。预览只供核对，提交时以服务端重新计算和校验的结果为准。
      </Typography.Paragraph>
    </Card>
  );
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

function HostConfiguredProFormSelect({
  name,
  label,
  target,
  request: sourceRequest,
  renderConfigEntryFieldLabel,
  disabled,
  readonly,
  messageVariables,
  ...rest
}: {
  name: string;
  label: string;
  target: LandedCostConfigEntryFieldLabelProps['target'];
  request: LandedCostSelectRequest;
  renderConfigEntryFieldLabel: LandedCostFormDrawerProps['capabilities']['renderConfigEntryFieldLabel'];
  rules?: ProFormSelectProps['rules'];
  fieldProps?: ProFormSelectProps['fieldProps'];
  disabled?: ProFormSelectProps['disabled'];
  readonly?: ProFormSelectProps['readonly'];
  messageVariables?: ProFormSelectProps['messageVariables'];
}) {
  const form = Form.useFormInstance();
  const currentValue = Form.useWatch(name, form);
  const [showConfigEntry, setShowConfigEntry] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const requestIdRef = useRef(0);
  const probeRequestIdRef = useRef(0);
  const refreshAfterConfigRef = useRef(false);
  const sourceRequestRef = useRef(sourceRequest);
  sourceRequestRef.current = sourceRequest;

  useEffect(() => {
    if (
      hasSelectedValue(currentValue) ||
      disabled ||
      readonly ||
      rest.fieldProps?.disabled
    ) {
      setShowConfigEntry(false);
      return;
    }
    let active = true;
    const requestId = ++probeRequestIdRef.current;
    void sourceRequestRef.current({}, {}).then(
      (options) => {
        if (!active || requestId !== probeRequestIdRef.current) return;
        setShowConfigEntry(Array.isArray(options) && options.length === 0);
      },
      () => {
        if (active && requestId === probeRequestIdRef.current) {
          setShowConfigEntry(false);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [currentValue, disabled, readonly, rest.fieldProps?.disabled]);

  useEffect(() => {
    const refreshAfterReturn = () => {
      if (!refreshAfterConfigRef.current) return;
      refreshAfterConfigRef.current = false;
      setRefreshVersion((version) => version + 1);
    };
    window.addEventListener('focus', refreshAfterReturn);
    return () => window.removeEventListener('focus', refreshAfterReturn);
  }, []);

  const request = useCallback<LandedCostSelectRequest>(
    async (...args) => {
      const requestId = ++requestIdRef.current;
      const params = args[0] as Record<string, unknown>;
      const sourceParams = { ...params };
      delete sourceParams.configEntryRefreshVersion;
      const sourceArgs = [sourceParams, ...args.slice(1)] as Parameters<LandedCostSelectRequest>;
      try {
        const options = await sourceRequest(...sourceArgs);
        if (requestId === requestIdRef.current && !hasSearchKeyword(params)) {
          setShowConfigEntry(
            Array.isArray(options) &&
              options.length === 0 &&
              !hasSelectedValue(currentValue) &&
              !disabled &&
              !readonly &&
              !rest.fieldProps?.disabled,
          );
        }
        return options;
      } catch (error) {
        if (requestId === requestIdRef.current) setShowConfigEntry(false);
        throw error;
      }
    },
    [currentValue, disabled, readonly, rest.fieldProps?.disabled, sourceRequest],
  );

  return (
    <ProFormSelect
      {...rest}
      name={name}
      disabled={disabled}
      readonly={readonly}
      messageVariables={{ ...messageVariables, label }}
      label={renderConfigEntryFieldLabel({
        target,
        label,
        show:
          showConfigEntry &&
          !hasSelectedValue(currentValue) &&
          !disabled &&
          !readonly &&
          !rest.fieldProps?.disabled,
        onOpen: () => {
          refreshAfterConfigRef.current = true;
        },
      })}
      request={request}
      params={{ configEntryRefreshVersion: refreshVersion }}
      fieldProps={{
        ...rest.fieldProps,
        notFoundContent: rest.fieldProps?.notFoundContent ?? '暂无可选数据',
      }}
    />
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Preserves purchase landed-cost form fields, tax/capitalizable amounts, receipt selection, allocation policy, manual allocation validation, and allocation preview while all host requests, option lists, configuration navigation, and feedback remain host supplied.
 */
export function LandedCostFormDrawer({
  open,
  landedCostId,
  initialReceiptOrderId,
  onOpenChange,
  onSuccess,
  capabilities,
}: LandedCostFormDrawerProps) {
  const [form] = Form.useForm<LandedCostFormValues>();
  const formRef = useRef<ProFormInstance<LandedCostFormValues> | undefined>(
    undefined,
  );
  const [expenseType, setExpenseType] = useState<
    LandedCostRecord['expenseType'] | undefined
  >();
  const formLoadRequestId = useRef(0);
  const expenseTypeRequestId = useRef(0);
  const allocationRequestId = useRef(0);
  const allocationPolicyRequestId = useRef(0);
  const [allocationPolicy, setAllocationPolicy] =
    useState<LandedCostAllocationPolicy>();
  const [allocationPolicyLoadFailed, setAllocationPolicyLoadFailed] =
    useState(false);

  const loadAllocationPolicy = useCallback(async () => {
    const requestId = ++allocationPolicyRequestId.current;
    setAllocationPolicy(undefined);
    setAllocationPolicyLoadFailed(false);
    try {
      const next = await capabilities.loadAllocationPolicy();
      if (allocationPolicyRequestId.current === requestId) {
        setAllocationPolicy(next);
      }
    } catch {
      if (allocationPolicyRequestId.current === requestId) {
        setAllocationPolicyLoadFailed(true);
      }
    }
  }, [capabilities]);

  useEffect(() => {
    if (!open) {
      allocationPolicyRequestId.current += 1;
      setAllocationPolicy(undefined);
      setAllocationPolicyLoadFailed(false);
      return;
    }
    void loadAllocationPolicy();
    return () => {
      allocationPolicyRequestId.current += 1;
    };
  }, [loadAllocationPolicy, open]);

  const loadExpenseType = useCallback(
    async (expenseTypeId: string | undefined) => {
      const requestId = ++expenseTypeRequestId.current;
      if (!expenseTypeId) {
        setExpenseType(undefined);
        return;
      }
      const detail = await capabilities.loadExpenseTypeDetail(expenseTypeId);
      if (expenseTypeRequestId.current === requestId) setExpenseType(detail);
    },
    [capabilities],
  );

  useEffect(() => {
    const requestId = ++formLoadRequestId.current;
    if (!open) {
      form.resetFields();
      setExpenseType(undefined);
      return;
    }
    const load = async () => {
      if (!landedCostId) {
        form.resetFields();
        form.setFieldsValue(DEFAULT_FORM_VALUES);
        setExpenseType(undefined);
        return;
      }
      const detail = await capabilities.loadDetail(landedCostId);
      if (formLoadRequestId.current !== requestId) return;
      form.resetFields();
      form.setFieldsValue(toFormValues(detail));
      setExpenseType(detail.expenseType);
    };
    void load();
    return () => {
      formLoadRequestId.current += 1;
    };
  }, [capabilities, form, landedCostId, open]);

  const synchronizeAllocationTargets = useCallback(
    async (receiptOrderIds: string[]) => {
      const requestId = ++allocationRequestId.current;
      const current = formRef.current?.getFieldValue('allocations') ?? [];
      const currentAllocations = Array.isArray(current)
        ? current.filter(isAllocationDraft)
        : [];
      const previousByReceiptItem = new Map(
        currentAllocations.map((item) => [item.receiptItemId, item]),
      );
      const receipts = await Promise.all(
        receiptOrderIds.map((id) => capabilities.loadReceiptDetail(id)),
      );
      if (allocationRequestId.current !== requestId) return;
      const allocations = receipts.flatMap((receipt) =>
        (receipt.items ?? [])
          .filter((item) => Number(item.quantity) > 0)
          .map((item) => ({
            ...allocationDraftFromReceipt(receipt, item),
            allocationAmount: previousByReceiptItem.get(item.id)?.allocationAmount,
          })),
      );
      formRef.current?.setFieldsValue({ allocations });
    },
    [capabilities],
  );

  useEffect(() => {
    if (!open || landedCostId || !initialReceiptOrderId) return;
    form.setFieldsValue({ receiptOrderIds: [initialReceiptOrderId] });
    void synchronizeAllocationTargets([initialReceiptOrderId]);
  }, [form, initialReceiptOrderId, landedCostId, open, synchronizeAllocationTargets]);

  const configuredAllocationBasis = expenseType?.defaultAllocationBasis;
  const configuredBasisLabel = useMemo(
    () =>
      isAllocationBasis(configuredAllocationBasis)
        ? ALLOCATION_BASIS_LABEL[configuredAllocationBasis]
        : undefined,
    [configuredAllocationBasis],
  );
  const allocationBasisOptions = useMemo(
    () =>
      Object.entries(capabilities.allocationBasisEnum).map(([value, option]) => {
        const basis = isAllocationBasis(value) ? value : undefined;
        const unavailableReason = getAllocationBasisUnavailableReason(
          allocationPolicy,
          basis,
        );
        const supported =
          basis !== undefined &&
          allocationPolicy?.supportedAllocationBases.includes(basis) === true;
        return {
          value,
          label: option.text,
          disabled: !supported,
          title: unavailableReason,
        };
      }),
    [allocationPolicy, capabilities.allocationBasisEnum],
  );

  return (
    <DrawerForm<LandedCostFormValues>
      form={form}
      formRef={formRef}
      open={open}
      onOpenChange={onOpenChange}
      title={landedCostId ? '编辑' : '新增'}
      width={760}
      drawerProps={{ destroyOnHidden: true }}
      onFinish={async (values) => {
        if (!allocationPolicy) {
          capabilities.notify(
            'warning',
            allocationPolicyLoadFailed
              ? '分摊策略加载失败，请重试后再提交'
              : '正在加载分摊策略，请稍后再提交',
          );
          return false;
        }
        const effectiveAllocationBasis = getEffectiveAllocationBasis(
          values.allocationBasis,
          expenseType?.defaultAllocationBasis,
        );
        const unavailableReason = getAllocationBasisUnavailableReason(
          allocationPolicy,
          effectiveAllocationBasis,
        );
        if (unavailableReason) {
          capabilities.notify('warning', unavailableReason);
          return false;
        }
        const payload = buildLandedCostPayload(
          values,
          effectiveAllocationBasis,
        );
        if (!payload) {
          capabilities.notify(
            'warning',
            '请完整填写费用信息、业务日期并至少保留一条实际采购入库明细',
          );
          return false;
        }
        try {
          if (landedCostId) {
            const updatePayload: LandedCostUpdatePayload = {
              id: landedCostId,
              ...payload,
            };
            await capabilities.update(updatePayload);
            capabilities.notify('success', '更新成功');
          } else {
            await capabilities.create(payload);
            capabilities.notify('success', '创建成功');
          }
          onSuccess();
          return true;
        } catch {
          return false;
        }
      }}
    >
      <Typography.Paragraph type="secondary">
        仅可选择已确认采购入库单明细；确认后将生成承运商应付，错误请通过红字冲销处理。
      </Typography.Paragraph>
      <HostConfiguredProFormSelect
        name="expenseTypeId"
        label="费用类型"
        target="accountingExpenseTypes"
        request={capabilities.requestExpenseTypeOptions}
        renderConfigEntryFieldLabel={capabilities.renderConfigEntryFieldLabel}
        rules={[{ required: true }]}
        fieldProps={{
          showSearch: true,
          filterOption: false,
          onChange: (value: string | undefined) => {
            void loadExpenseType(value);
          },
        }}
      />
      <HostConfiguredProFormSelect
        name="carrierId"
        label="承运方"
        target="supplier"
        request={capabilities.requestCarrierOptions}
        renderConfigEntryFieldLabel={capabilities.renderConfigEntryFieldLabel}
        rules={[{ required: true }]}
        fieldProps={{ showSearch: true, filterOption: false }}
      />
      <ProFormText
        name="externalRefNo"
        label="物流账单/运单号"
        rules={[{ required: true, max: 128 }]}
      />
      <ProFormDigit
        name="amount"
        label="费用金额（价税合计）"
        min={0.01}
        fieldProps={{ precision: 2 }}
        rules={[{ required: true }]}
      />
      <ProFormDigit
        name="amountExcludingTax"
        label="不含税成本金额"
        min={0.01}
        fieldProps={{ precision: 2 }}
        extra="留空表示费用金额全部计入存货成本；填写税务信息时由后端校验价税关系。"
      />
      <ProFormDigit
        name="taxAmount"
        label="税额"
        min={0}
        fieldProps={{ precision: 2 }}
      />
      <ProFormDigit
        name="taxRate"
        label="税率（%）"
        min={0}
        max={100}
        fieldProps={{ precision: 4 }}
        extra="填写税率时，必须同时填写不含税成本金额或税额；客户端不自动猜算。"
      />
      <ProFormText
        name="currency"
        label="币别"
        rules={[{ required: true, max: 16 }]}
      />
      <ProFormDigit
        name="exchangeRate"
        label="汇率"
        min={0.00000001}
        fieldProps={{ precision: 8 }}
      />
      <ProFormDatePicker
        name="businessDate"
        label="业务日期"
        rules={[{ required: true }]}
      />
      <ProFormSelect
        name="allocationBasis"
        label="分摊方式"
        options={allocationBasisOptions}
        fieldProps={{ allowClear: true, loading: !allocationPolicy }}
        extra={
          configuredBasisLabel
            ? `留空时使用费用类型配置的默认方式：${configuredBasisLabel}`
            : '留空时由后端按费用类型配置处理；未配置时按金额分摊。'
        }
      />
      <ProFormDependency
        name={[
          'expenseTypeId',
          'allocationBasis',
          'amount',
          'amountExcludingTax',
          'allocations',
        ]}
      >
        {({ allocationBasis, amount, amountExcludingTax, allocations }) => {
          const effectiveAllocationBasis = getEffectiveAllocationBasis(
            allocationBasis,
            expenseType?.defaultAllocationBasis,
          );
          const unavailableReason = getAllocationBasisUnavailableReason(
            allocationPolicy,
            effectiveAllocationBasis,
          );
          return (
            <>
              {!allocationPolicy ? (
                <Alert
                  showIcon
                  type={allocationPolicyLoadFailed ? 'error' : 'info'}
                  message={
                    allocationPolicyLoadFailed
                      ? '分摊策略加载失败'
                      : '正在加载分摊策略'
                  }
                  description="为确保分摊方式由后端能力与费用类型配置共同决定，策略加载完成前不能提交。"
                  action={
                    allocationPolicyLoadFailed ? (
                      <Button
                        size="small"
                        type="link"
                        onClick={() => void loadAllocationPolicy()}
                      >
                        重新加载
                      </Button>
                    ) : undefined
                  }
                  style={{ marginBottom: 16 }}
                />
              ) : unavailableReason ? (
                <Alert
                  showIcon
                  type="warning"
                  message="当前分摊方式不可执行"
                  description={unavailableReason}
                  style={{ marginBottom: 16 }}
                />
              ) : null}
              <HostConfiguredProFormSelect
                name="receiptOrderIds"
                label="采购入库单"
                target="purchaseReceipts"
                request={capabilities.requestReceiptOptions}
                renderConfigEntryFieldLabel={capabilities.renderConfigEntryFieldLabel}
                rules={[{ required: true, type: 'array', min: 1 }]}
                fieldProps={{
                  mode: 'multiple',
                  showSearch: true,
                  filterOption: false,
                  onChange: (value: string[]) => {
                    void synchronizeAllocationTargets(value ?? []);
                  },
                }}
              />
              <ProFormList
                name="allocations"
                label="实际采购入库明细"
                creatorButtonProps={false}
                copyIconProps={false}
                min={1}
                alwaysShowItemLabel
                containerStyle={{ minWidth: 0, width: '100%' }}
                itemRender={({ listDom, action }) => (
                  <div
                    style={{
                      alignItems: 'flex-start',
                      display: 'flex',
                      gap: 8,
                      minWidth: 0,
                      width: '100%',
                    }}
                  >
                    <div style={{ flex: '1 1 auto', minWidth: 0 }}>{listDom}</div>
                    {action ? (
                      <div style={{ flex: '0 0 auto', paddingTop: 30 }}>{action}</div>
                    ) : null}
                  </div>
                )}
                rules={[
                  {
                    validator: async (
                      _,
                      value: LandedCostAllocationDraft[] | undefined,
                    ) => {
                      if (!value?.length) {
                        throw new Error('请至少保留一条实际采购入库明细');
                      }
                    },
                  },
                ]}
              >
                <ProFormText name="receiptItemId" hidden />
                <ProFormText name="receiptOrderId" hidden />
                <ProFormGroup spaceProps={{ style: { width: '100%' }, wrap: true }}>
                  <ProFormText name="display" label="入库明细" readonly />
                  {effectiveAllocationBasis === 'manual' ? (
                    <ProFormDigit
                      name="allocationAmount"
                      label="手工分摊金额"
                      min={0}
                      fieldProps={{ precision: 2 }}
                      rules={[{ required: true }]}
                    />
                  ) : null}
                </ProFormGroup>
              </ProFormList>
              <AllocationPreviewPanel
                preview={buildLandedCostAllocationPreview(
                  Array.isArray(allocations)
                    ? allocations.filter(isAllocationDraft)
                    : [],
                  effectiveAllocationBasis,
                  (amountExcludingTax ?? amount) as number | undefined,
                )}
              />
            </>
          );
        }}
      </ProFormDependency>
      <ProFormTextArea name="remark" label="备注" fieldProps={{ maxLength: 1000 }} />
    </DrawerForm>
  );
}
