import { useRef, useState } from 'react';
import { Button, Space, Typography } from 'antd';
import type { ProFormInstance } from '@ant-design/pro-components';
import { SectionCard } from '../../src';
import {
  WorkOrderFilterDrawer,
  type WorkOrderFilterSelectRequest,
  type WorkOrderFilterFormValues,
} from '../../src/mes';

const makeRequest = (items: Array<{ label: string; value: string }>): WorkOrderFilterSelectRequest =>
  async ({ keyWords } = {}) =>
    items.filter((item) => !keyWords || item.label.includes(keyWords));

const valueEnums = {
  statuses: {
    draft: { text: '草稿' },
    in_progress: { text: '进行中', status: 'Processing' },
    completed: { text: '已完成', status: 'Success' },
  },
  materialReqStatuses: {
    ready: { text: '齐套', status: 'Success' },
    shortage: { text: '缺料', status: 'Warning' },
  },
  executionState: {
    not_started: { text: '未开始' },
    in_progress: { text: '执行中' },
    completed: { text: '已完成' },
  },
  workOrderType: {
    normal: { text: '常规工单' },
    rework: { text: '返工工单' },
  },
  overdueRisk: {
    overdue: { text: '已逾期', status: 'Error' },
    at_risk: { text: '临近交期', status: 'Warning' },
  },
};

const selectRequests = {
  material: makeRequest([
    { label: 'M-1001 铝型材', value: 'material-1' },
    { label: 'M-1002 紧固件', value: 'material-2' },
  ]),
  customer: makeRequest([
    { label: '华东设备有限公司', value: 'customer-1' },
    { label: '西南自动化', value: 'customer-2' },
  ]),
  productionPlan: makeRequest([
    { label: 'PLAN-2026-028', value: 'plan-1' },
    { label: 'PLAN-2026-031', value: 'plan-2' },
  ]),
  user: makeRequest([
    { label: '陈工', value: 'user-1' },
    { label: '李工', value: 'user-2' },
  ]),
};

export function WorkOrderFilterDrawerDemo() {
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);
  const [summary, setSummary] = useState('尚未应用工单筛选');

  return (
    <SectionCard title="工单高级筛选">
      <Typography.Paragraph type="secondary">
        展示工单状态、物料需求、执行与交期筛选，支持物料/客户/计划/负责人远程候选；字典、查询和重置由宿主提供。
      </Typography.Paragraph>
      <Space orientation="vertical" size={8}>
        <Button onClick={() => setOpen(true)}>打开工单筛选</Button>
        <Typography.Text type="secondary" aria-live="polite">
          {summary}；已应用 {appliedCount} 项
        </Typography.Text>
      </Space>
      <WorkOrderFilterDrawer
        open={open}
        formRef={formRef}
        appliedCount={appliedCount}
        valueEnums={valueEnums}
        selectRequests={selectRequests}
        onOpenChange={setOpen}
        onFinish={async (values: WorkOrderFilterFormValues) => {
          const count = Object.values(values).filter(
            (value) => value != null && value !== '' && value !== false,
          ).length;
          setAppliedCount(count);
          setSummary(`已应用工单筛选：${JSON.stringify(values)}`);
          return true;
        }}
        onReset={() => {
          formRef.current?.resetFields();
          setAppliedCount(0);
          setSummary('工单筛选已重置');
        }}
      />
    </SectionCard>
  );
}
