import { useMemo } from 'react';
import {
  ProForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import type { FilterableSelectRequestFn } from './material-select-types';
import { QuickProFormDateRangePicker } from '../../components/QuickDateRangePicker';
import {
  DocumentFilterDrawer,
  renderDocumentFilterDrawerActions,
} from './DocumentFilterDrawer';
import type {
  PurchaseOrderFilterDrawerProps,
  PurchaseOrderFilterFormValues,
  PurchaseOrderFilterSelectOption,
  PurchaseOrderFilterSelectRequest,
} from './purchase-order-filter-drawer-types';

function searchSelectProps(request: PurchaseOrderFilterSelectRequest, placeholder: string) {
  const adaptedRequest: FilterableSelectRequestFn = async (params = {}) =>
    request(params);
  return {
    showSearch: true as const,
    debounceTime: 300,
    request: adaptedRequest,
    fieldProps: {
      showSearch: true,
      filterOption: false,
      fetchDataOnSearch: true,
      placeholder,
    },
  };
}

function withCurrentOption(
  request: PurchaseOrderFilterSelectRequest,
  current?: Pick<PurchaseOrderFilterSelectOption, 'value' | 'label'>,
): FilterableSelectRequestFn {
  return async (params = {}) => {
    const options = await request(params);
    if (
      current?.value &&
      current.label &&
      !options.some((option) => option.value === current.value)
    ) {
      return [{ label: current.label, value: current.value }, ...options];
    }
    return options;
  };
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain purchase-order-filter
 * @sunxu-reason Keeps the purchase-order query fields, remote supplier/material search and selected-material cache key while requests, status options and applied-filter effects stay host-owned.
 */
export function PurchaseOrderFilterDrawer({
  open,
  loading = false,
  formRef,
  onOpenChange,
  onFinish,
  onReset,
  appliedCount,
  materialOption,
  capabilities,
}: PurchaseOrderFilterDrawerProps) {
  const materialSelectRequest = useMemo(() => {
    const requestWithCurrentOption = withCurrentOption(
      capabilities.requestMaterials,
      materialOption,
    );
    return async (params: Parameters<FilterableSelectRequestFn>[0] = {}) => {
      // This cache key is local to ProForm and is not a purchase API filter.
      const {
        currentMaterialOption: _currentMaterialOption,
        ...requestParams
      } = params;
      return requestWithCurrentOption(requestParams);
    };
  }, [capabilities.requestMaterials, materialOption]);

  return (
    <DocumentFilterDrawer
      open={open}
      onOpenChange={onOpenChange}
      appliedCount={appliedCount}
    >
      <ProForm<PurchaseOrderFilterFormValues>
        formRef={formRef}
        disabled={loading}
        onFinish={async (values) => {
          const success = await onFinish(values);
          if (success) onOpenChange(false);
          return success;
        }}
        submitter={{
          searchConfig: {
            resetText: '重置',
            submitText: '应用筛选',
          },
          resetButtonProps: {
            onClick: onReset,
          },
          render: renderDocumentFilterDrawerActions,
        }}
      >
        <ProFormText
          name="orderNo"
          label="订单号"
          placeholder="输入订单号"
          fieldProps={{ allowClear: true }}
        />
        <ProFormSelect
          name="statuses"
          label="状态"
          valueEnum={capabilities.statusOptions}
          placeholder="选择订单状态"
          fieldProps={{ allowClear: true, mode: 'multiple' }}
        />
        <ProFormSelect
          name="supplierId"
          label="供应商"
          {...searchSelectProps(
            capabilities.requestSuppliers,
            '输入供应商名称或编码搜索',
          )}
        />
        <ProFormSelect
          name="materialId"
          label="物料"
          {...searchSelectProps(
            materialSelectRequest,
            '输入物料名称或编码搜索',
          )}
          params={{ currentMaterialOption: materialOption?.value }}
        />
        <QuickProFormDateRangePicker
          name="createdAt"
          label="创建时间"
          fieldProps={{
            allowClear: true,
            presets: capabilities.dateRangePresets,
            style: { width: '100%' },
          }}
        />
        <QuickProFormDateRangePicker
          name="expectedDate"
          label="期望到货日期"
          fieldProps={{
            allowClear: true,
            presets: capabilities.dateRangePresets,
            style: { width: '100%' },
          }}
        />
        <ProFormText
          name="purchasingRepName"
          label="采购员"
          placeholder="输入采购员姓名或账号"
          fieldProps={{ allowClear: true }}
        />
      </ProForm>
    </DocumentFilterDrawer>
  );
}
