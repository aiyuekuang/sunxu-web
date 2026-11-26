import {
  ProForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import type { FilterableSelectRequestFn } from './material-select-types';
import { QuickProFormDateRangePicker } from '../../components/QuickDateRangePicker';
import {
  DocumentFilterDrawer,
  renderDocumentFilterDrawerActions,
} from './DocumentFilterDrawer';
import type {
  PurchaseOrderDetailFilterDrawerProps,
  PurchaseOrderDetailFilterFormValues,
} from './purchase-order-detail-filter-drawer-types';
import type { PurchaseOrderFilterSelectRequest } from './purchase-order-filter-drawer-types';

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

/**
 * @sunxu-layer business
 * @sunxu-domain purchase-order-detail-filter
 * @sunxu-reason Keeps order-detail ledger query fields, date presets, completed-undated toggle and fixed drawer actions while option requests and query effects stay host-owned.
 */
export function PurchaseOrderDetailFilterDrawer({
  open,
  loading = false,
  formRef,
  onOpenChange,
  onFinish,
  onReset,
  appliedCount,
  capabilities,
}: PurchaseOrderDetailFilterDrawerProps) {
  return (
    <DocumentFilterDrawer
      open={open}
      onOpenChange={onOpenChange}
      appliedCount={appliedCount}
    >
      <ProForm<PurchaseOrderDetailFilterFormValues>
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
            capabilities.requestMaterials,
            '输入物料编码或名称搜索',
          )}
        />
        <QuickProFormDateRangePicker
          name="deliveryDate"
          label="交货日期"
          fieldProps={{
            allowClear: true,
            presets: capabilities.dateRangePresets,
            style: { width: '100%' },
          }}
        />
        <ProFormSwitch
          name="hideCompletedUndated"
          label="隐藏无交货日期的已收完明细"
          initialValue={true}
          fieldProps={{
            checkedChildren: '隐藏',
            unCheckedChildren: '显示',
          }}
          extra="只影响采购订单明细台账展示，不删除采购订单或收货记录"
        />
      </ProForm>
    </DocumentFilterDrawer>
  );
}
