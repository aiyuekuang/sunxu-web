import {
  ProForm,
  type ProFormInstance,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Col, Row } from 'antd';
import type { Dayjs } from 'dayjs';
import type { MutableRefObject, ReactNode } from 'react';
import { QuickProFormDateRangePicker } from '../../components/QuickDateRangePicker';
import { BUSINESS_DATE_RANGE_PRESETS } from '../table/dateRangePresets';
import {
  DocumentFilterDrawer,
  renderDocumentFilterDrawerActions,
} from './DocumentFilterDrawer';

export type WorkOrderFilterFormValues = {
  orderNo?: string;
  statuses?: string[];
  materialReqStatuses?: string[];
  executionState?: string;
  overdueOnly?: boolean;
  /** Retained for restoring an existing saved view; not rendered as a field. */
  myOnly?: boolean;
  workOrderType?: string;
  materialId?: string;
  customerId?: string;
  planId?: string;
  priorityMin?: number;
  priorityMax?: number;
  assigneeId?: string;
  planStartTime?: [Dayjs, Dayjs];
  planEndTime?: [Dayjs, Dayjs];
  actualEndTime?: [Dayjs, Dayjs];
  dueDate?: [Dayjs, Dayjs];
  actualStartTime?: [Dayjs, Dayjs];
};

export type WorkOrderFilterSelectOption = {
  label: ReactNode;
  value: string;
  [key: string]: unknown;
};

export type WorkOrderFilterSelectRequest = (params?: {
  keyWords?: string;
  [key: string]: unknown;
}) => Promise<WorkOrderFilterSelectOption[]>;

export type WorkOrderFilterValueOption = {
  text: ReactNode;
  status?: string;
  color?: string;
};

export type WorkOrderFilterValueEnums = {
  statuses: Record<string, WorkOrderFilterValueOption>;
  materialReqStatuses: Record<string, WorkOrderFilterValueOption>;
  executionState: Record<string, WorkOrderFilterValueOption>;
  workOrderType: Record<string, WorkOrderFilterValueOption>;
  overdueRisk: Record<string, WorkOrderFilterValueOption>;
};

export type WorkOrderFilterSelectRequests = {
  material: WorkOrderFilterSelectRequest;
  customer: WorkOrderFilterSelectRequest;
  productionPlan: WorkOrderFilterSelectRequest;
  user: WorkOrderFilterSelectRequest;
};

export type WorkOrderFilterDrawerProps = {
  open: boolean;
  loading?: boolean;
  formRef: MutableRefObject<ProFormInstance | undefined>;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: WorkOrderFilterFormValues) => Promise<boolean>;
  onReset: () => void;
  appliedCount: number;
  valueEnums: WorkOrderFilterValueEnums;
  selectRequests: WorkOrderFilterSelectRequests;
};

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-work-order-list
 * @sunxu-reason Preserves the work-order advanced-filter fields and layout while status dictionaries, remote choices, query submission, and reset remain host-owned.
 */
export function WorkOrderFilterDrawer({
  open,
  loading = false,
  formRef,
  onOpenChange,
  onFinish,
  onReset,
  appliedCount,
  valueEnums,
  selectRequests,
}: WorkOrderFilterDrawerProps) {
  const remoteSelectProps = (
    request: WorkOrderFilterSelectRequest,
    placeholder: string,
  ) => ({
    showSearch: true,
    debounceTime: 300,
    request,
    fieldProps: {
      showSearch: true,
      filterOption: false,
      fetchDataOnSearch: true,
      placeholder,
    },
  });

  return (
    <DocumentFilterDrawer
      open={open}
      onOpenChange={onOpenChange}
      appliedCount={appliedCount}
    >
      <ProForm<WorkOrderFilterFormValues>
        formRef={formRef}
        disabled={loading}
        onFinish={async (values) => {
          const success = await onFinish(values);
          if (success) onOpenChange(false);
          return success;
        }}
        submitter={{
          searchConfig: { resetText: '重置', submitText: '应用筛选' },
          resetButtonProps: { onClick: onReset },
          render: renderDocumentFilterDrawerActions,
        }}
      >
        <ProFormText
          name="orderNo"
          label="工单号"
          placeholder="输入工单号"
          fieldProps={{ allowClear: true }}
        />
        <ProFormSelect
          name="statuses"
          label="工单状态"
          mode="multiple"
          valueEnum={valueEnums.statuses}
          placeholder="选择状态，可多选"
          fieldProps={{ allowClear: true, maxTagCount: 'responsive' }}
        />
        <ProFormSelect
          name="materialReqStatuses"
          label="物料需求状态"
          mode="multiple"
          valueEnum={valueEnums.materialReqStatuses}
          placeholder="按物料需求状态筛选，可多选"
          fieldProps={{ allowClear: true, maxTagCount: 'responsive' }}
        />
        <Row gutter={[16, 0]}>
          <Col span={12}>
            <ProFormSelect
              name="executionState"
              label="执行状态"
              valueEnum={valueEnums.executionState}
              placeholder="选择执行状态"
              fieldProps={{ allowClear: true }}
            />
          </Col>
          <Col span={12}>
            <ProFormSelect
              name="workOrderType"
              label="工单类型"
              valueEnum={valueEnums.workOrderType}
              placeholder="选择工单类型"
              fieldProps={{ allowClear: true }}
            />
          </Col>
        </Row>
        <ProFormSelect
          name="overdueOnly"
          label="交期风险"
          valueEnum={valueEnums.overdueRisk}
          placeholder="选择交期风险"
          fieldProps={{ allowClear: true }}
        />
        <ProFormSelect
          name="materialId"
          label="物料"
          {...remoteSelectProps(
            selectRequests.material,
            '输入物料名称或编码搜索',
          )}
        />
        <ProFormSelect
          name="customerId"
          label="客户"
          {...remoteSelectProps(
            selectRequests.customer,
            '输入客户名称或编码搜索',
          )}
        />
        <ProFormSelect
          name="planId"
          label="生产计划"
          {...remoteSelectProps(
            selectRequests.productionPlan,
            '输入计划编号或物料搜索',
          )}
        />
        <ProFormSelect
          name="assigneeId"
          label="负责人"
          {...remoteSelectProps(
            selectRequests.user,
            '输入负责人姓名或账号搜索',
          )}
        />
        <Row gutter={[16, 0]}>
          <Col span={12}>
            <ProFormDigit
              name="priorityMin"
              label="优先级下限"
              min={1}
              max={10}
              fieldProps={{ precision: 0, placeholder: '1-10' }}
            />
          </Col>
          <Col span={12}>
            <ProFormDigit
              name="priorityMax"
              label="优先级上限"
              min={1}
              max={10}
              fieldProps={{ precision: 0, placeholder: '1-10' }}
            />
          </Col>
        </Row>
        <QuickProFormDateRangePicker
          name="planStartTime"
          label="计划开始日期"
          fieldProps={{
            allowClear: true,
            presets: BUSINESS_DATE_RANGE_PRESETS,
            style: { width: '100%' },
          }}
        />
        <QuickProFormDateRangePicker
          name="planEndTime"
          label="计划结束日期"
          fieldProps={{
            allowClear: true,
            presets: BUSINESS_DATE_RANGE_PRESETS,
            style: { width: '100%' },
          }}
        />
        <QuickProFormDateRangePicker
          name="actualEndTime"
          label="实际完成日期"
          fieldProps={{
            allowClear: true,
            presets: BUSINESS_DATE_RANGE_PRESETS,
            style: { width: '100%' },
          }}
        />
        <QuickProFormDateRangePicker
          name="actualStartTime"
          label="实际开始日期"
          fieldProps={{
            allowClear: true,
            presets: BUSINESS_DATE_RANGE_PRESETS,
            style: { width: '100%' },
          }}
        />
        <QuickProFormDateRangePicker
          name="dueDate"
          label="交货期限"
          fieldProps={{
            allowClear: true,
            presets: BUSINESS_DATE_RANGE_PRESETS,
            style: { width: '100%' },
          }}
        />
      </ProForm>
    </DocumentFilterDrawer>
  );
}
