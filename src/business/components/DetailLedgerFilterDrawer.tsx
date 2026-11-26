import {
  ProForm,
  type ProFormInstance,
  type ProFormProps,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import dayjs, { type Dayjs } from 'dayjs';
import type { MutableRefObject, ReactNode } from 'react';
import { QuickProFormDateRangePicker } from '../../components/QuickDateRangePicker';
import { BUSINESS_DATE_RANGE_PRESETS } from '../table/dateRangePresets';
import {
  DocumentFilterDrawer,
  renderDocumentFilterDrawerActions,
} from './DocumentFilterDrawer';

export type DetailLedgerFilterSelectOption = {
  label: string;
  value: string;
  code?: string | null;
  name?: string | null;
};

export type DetailLedgerFilterSelectRequest = (params?: {
  keyWords?: string;
  [key: string]: unknown;
}) => Promise<DetailLedgerFilterSelectOption[]>;

export type DetailLedgerFilterField =
  | {
      type: 'text';
      name: string;
      label: ReactNode;
      placeholder?: string;
    }
  | {
      type: 'select';
      name: string;
      label: ReactNode;
      valueEnum?: Record<
        string,
        { text: ReactNode; status?: string; color?: string }
      >;
      request?: DetailLedgerFilterSelectRequest;
      placeholder?: string;
      multiple?: boolean;
    }
  | {
      type: 'dateRange';
      name: string;
      label: ReactNode;
    }
  | {
      type: 'switch';
      name: string;
      label: ReactNode;
    };

export type DetailLedgerFilterFormValues = Record<string, unknown>;

export type DetailLedgerFilterDrawerProps = {
  open: boolean;
  loading?: boolean;
  fields: readonly DetailLedgerFilterField[];
  formRef: MutableRefObject<ProFormInstance | undefined>;
  initialValues?: DetailLedgerFilterFormValues;
  appliedCount: number;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: DetailLedgerFilterFormValues) => Promise<boolean>;
  onReset: () => void;
};

function renderField(field: DetailLedgerFilterField) {
  if (field.type === 'dateRange') {
    return (
      <QuickProFormDateRangePicker
        key={field.name}
        name={field.name}
        label={field.label}
        fieldProps={{
          allowClear: true,
          presets: BUSINESS_DATE_RANGE_PRESETS,
          style: { width: '100%' },
        }}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <ProFormSelect
        key={field.name}
        name={field.name}
        label={field.label}
        valueEnum={field.valueEnum}
        placeholder={field.placeholder}
        {...(field.request
          ? {
              showSearch: true,
              debounceTime: 300,
              request: field.request,
              fieldProps: {
                showSearch: true,
                filterOption: false,
                fetchDataOnSearch: true,
                placeholder:
                  field.placeholder ??
                  '默认显示前50条，输入关键词可搜索更多',
              },
            }
          : {})}
        fieldProps={{
          allowClear: true,
          mode: field.multiple ? 'multiple' : undefined,
        }}
      />
    );
  }

  if (field.type === 'switch') {
    return (
      <ProFormSwitch key={field.name} name={field.name} label={field.label} />
    );
  }

  return (
    <ProFormText
      key={field.name}
      name={field.name}
      label={field.label}
      placeholder={field.placeholder}
      fieldProps={{ allowClear: true }}
    />
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain document-ledger
 * @sunxu-reason Preserves MES ledger filter field mapping and date conversion while option requests, submission, and reset effects stay with the host.
 */
export function DetailLedgerFilterDrawer({
  open,
  loading = false,
  fields,
  formRef,
  initialValues,
  appliedCount,
  onOpenChange,
  onFinish,
  onReset,
}: DetailLedgerFilterDrawerProps) {
  const formProps: ProFormProps = {
    formRef,
    initialValues,
    disabled: loading,
    onFinish: async (values) => {
      const success = await onFinish(values as DetailLedgerFilterFormValues);
      if (success) onOpenChange(false);
      return success;
    },
    submitter: {
      searchConfig: { resetText: '重置', submitText: '应用筛选' },
      resetButtonProps: { onClick: onReset },
      render: renderDocumentFilterDrawerActions,
    },
  };

  return (
    <DocumentFilterDrawer
      open={open}
      onOpenChange={onOpenChange}
      appliedCount={appliedCount}
    >
      <ProForm {...formProps}>{fields.map(renderField)}</ProForm>
    </DocumentFilterDrawer>
  );
}

export type DetailLedgerDateRange = [Dayjs, Dayjs];

export function captureDetailLedgerDateRange(
  values: DetailLedgerFilterFormValues,
  rangeField: string,
  startKey = 'startDate',
  endKey = 'endDate',
): Record<string, unknown> {
  const range = Array.isArray(values[rangeField]) ? values[rangeField] : [];
  return {
    [startKey]:
      range[0] && typeof range[0] === 'object' && 'format' in range[0]
        ? (range[0] as Dayjs).format('YYYY-MM-DD')
        : undefined,
    [endKey]:
      range[1] && typeof range[1] === 'object' && 'format' in range[1]
        ? (range[1] as Dayjs).format('YYYY-MM-DD')
        : undefined,
  };
}

export function restoreDetailLedgerDateRange(
  filters: Record<string, unknown>,
  rangeField: string,
  startKey = 'startDate',
  endKey = 'endDate',
): DetailLedgerFilterFormValues {
  const startDate = filters[startKey];
  const endDate = filters[endKey];
  return {
    [rangeField]:
      typeof startDate === 'string' && typeof endDate === 'string'
        ? [dayjs(startDate), dayjs(endDate)]
        : undefined,
  };
}
