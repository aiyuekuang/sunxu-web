/** @sunxu-layer business @sunxu-domain manufacturing @sunxu-reason Preserves the report batch field, candidate guidance, validation, and loading states while the host supplies MES batch policy, help content, error formatting, and candidate access. */
import { Alert, Form, Select, Typography, theme } from 'antd';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ProductionBatchNoFieldProps,
  ProductionBatchOptionItem,
  ProductionBatchOptions,
} from './production-batch-no-field-types';

const DEFAULT_FIELD_NAME = 'batchNo';
const DEFAULT_FIELD_LABEL = '生产批号';

interface BatchNoOption {
  label: React.ReactNode;
  value: string;
}

interface ProductionBatchNoSelectProps {
  value?: string;
  onChange?: (value?: string) => void;
  options: BatchNoOption[];
  loading: boolean;
  required: boolean;
}

/** Keeps tags input so operators can select, paste, or scan a new batch number. */
const ProductionBatchNoSelect: React.FC<ProductionBatchNoSelectProps> = ({
  value,
  onChange,
  options,
  loading,
  required,
}) => (
  <Select<string[]>
    mode="tags"
    value={value ? [value] : []}
    onChange={(nextValues) =>
      onChange?.(
        nextValues.length > 0 ? nextValues[nextValues.length - 1] : undefined,
      )
    }
    options={options}
    loading={loading}
    showSearch
    optionFilterProp="label"
    tokenSeparators={[]}
    notFoundContent={
      <Typography.Text type="secondary">
        没有匹配候选，回车即可新建生产批号
      </Typography.Text>
    }
    placeholder={
      required ? '选择或输入生产批号' : '可选，留空由系统按现有规则处理'
    }
    style={{ width: '100%' }}
  />
);

function parseReportedQty(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function buildCandidateOptionLabel(option: ProductionBatchOptionItem): string {
  const hints: string[] = [];
  const reportedQty = parseReportedQty(option.reportedQty);
  if (reportedQty > 0) hints.push(`已报 ${reportedQty}`);
  if (option.hasOutput) hints.push('已产出');
  if (option.source === 'inherited' && option.sourceWorkOrderNo) {
    hints.push(`带入 ${option.sourceWorkOrderNo}`);
  }
  return hints.length > 0
    ? `${option.batchNo}（${hints.join(' · ')}）`
    : option.batchNo;
}

function createSelectOptions(
  batchOptions: ProductionBatchOptions | null,
): BatchNoOption[] {
  if (!batchOptions) return [];
  const candidates = batchOptions.options.map((option) => ({
    label: buildCandidateOptionLabel(option),
    value: option.batchNo,
  }));
  const knownBatchNos = new Set(candidates.map((option) => option.value));
  const suggestedBatchNo = batchOptions.suggestedBatchNo?.trim();
  if (!suggestedBatchNo || knownBatchNos.has(suggestedBatchNo)) {
    return candidates;
  }
  return [
    { label: `${suggestedBatchNo}（建议新建）`, value: suggestedBatchNo },
    ...candidates,
  ];
}

/** Report batch field shared by operation and direct work-order reporting forms. */
export function ProductionBatchNoField({
  workOrderId = null,
  open,
  name = DEFAULT_FIELD_NAME,
  label = DEFAULT_FIELD_LABEL,
  onLoadingChange,
  capabilities,
}: ProductionBatchNoFieldProps) {
  const form = Form.useFormInstance();
  const { token } = theme.useToken();
  const capabilitiesRef = useRef(capabilities);
  capabilitiesRef.current = capabilities;
  const [batchOptions, setBatchOptions] = useState<ProductionBatchOptions | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const batchRequired = batchOptions?.batchRequired === true;

  useEffect(() => {
    if (!open || !workOrderId) {
      setBatchOptions(null);
      setLoadError(null);
      setLoading(false);
      onLoadingChange?.(false);
      return;
    }

    let cancelled = false;
    setBatchOptions(null);
    setLoadError(null);
    setLoading(true);
    onLoadingChange?.(true);
    capabilitiesRef.current
      .loadOptions(workOrderId)
      .then((result) => {
        if (cancelled) return;
        setBatchOptions(result);
        const current: unknown = form.getFieldValue(name);
        if (typeof current === 'string' && current.trim()) return;
        const preferred =
          capabilitiesRef.current.choosePreferredBatchNo(result);
        if (preferred) form.setFieldValue(name, preferred);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setBatchOptions(null);
        setLoadError(
          capabilitiesRef.current.getErrorMessage(
            error,
            '生产批号候选读取失败，请手动输入或扫码',
          ),
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          onLoadingChange?.(false);
        }
      });

    return () => {
      cancelled = true;
      onLoadingChange?.(false);
    };
  }, [form, name, onLoadingChange, open, workOrderId]);

  const selectOptions = useMemo(
    () => createSelectOptions(batchOptions),
    [batchOptions],
  );

  return (
    <>
      {loadError ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: token.marginSM }}
          message={`${loadError}；可直接输入或扫码生产批号`}
        />
      ) : null}
      <Form.Item
        name={name}
        {...capabilities.getFieldHelpProps(label)}
        rules={[
          ...(batchRequired
            ? [{ required: true, message: `请选择或输入${label}` }]
            : []),
          {
            max: capabilities.maxBatchNoLength,
            message: `${label}最长 ${capabilities.maxBatchNoLength} 个字符`,
          },
        ]}
        extra={
          batchRequired
            ? '按批号或单件序列号追溯的产出必须归属生产批号；默认带出最近一次批号，也可改用建议号、选择候选或扫码输入新批号。'
            : '选填；留空由系统按现有规则处理。也可选择候选、使用建议号或扫码输入新批号。'
        }
      >
        <ProductionBatchNoSelect
          options={selectOptions}
          loading={loading}
          required={batchRequired}
        />
      </Form.Item>
    </>
  );
}
