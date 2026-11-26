import { useMemo, useState } from 'react';
import { Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  ApprovalPanel,
  MesUiProvider,
  type ApprovalPanelStatusData,
  type MesApprovalCapabilities,
} from '../../src/business';

type DemoStatus = ApprovalPanelStatusData['status'];

function createApprovalData(status: DemoStatus): ApprovalPanelStatusData {
  const approvedFirst = status === 'approved' || status === 'rejected';
  return {
    status,
    currentStep: status === 'approved' ? 2 : 1,
    totalSteps: status === 'none' ? 2 : 2,
    isMyTurn: status === 'pending_approval',
    canRecall: status === 'pending_approval',
    steps: [
      {
        step: 1,
        label: '部门负责人',
        assigneeName: '李经理',
        status:
          approvedFirst
            ? 'approved'
            : status === 'pending_approval'
              ? 'pending'
              : 'waiting',
        record:
          approvedFirst
            ? { createdAt: '2026-11-20T01:30:00Z', comment: '资料完整' }
            : undefined,
      },
      {
        step: 2,
        label: '财务复核',
        assigneeName: '王会计',
        status: status === 'approved' ? 'approved' : 'waiting',
      },
    ],
  };
}

export function ApprovalPanelDemo() {
  const [status, setStatus] = useState<DemoStatus>('none');
  const [canManage, setCanManage] = useState(true);
  const capabilities = useMemo<MesApprovalCapabilities>(
    () => ({
      canAccess: (_entityType, capability) =>
        capability === 'view' || canManage,
      canHandle: () => canManage,
      canLoadStatus: () => true,
      requestStatus: async () => createApprovalData(status),
      submit: async () => setStatus('pending_approval'),
      recall: async () => setStatus('none'),
      reset: async () => setStatus('none'),
      handle: async ({ action }) =>
        setStatus(action === 'approved' ? 'approved' : 'rejected'),
    }),
    [canManage, status],
  );

  return (
    <SectionCard title="审批流程面板">
      <Typography.Paragraph type="secondary">
        按状态展示流程步骤、提交/撤回/通过/驳回/重置操作；权限策略、状态查询和动作 API 均由宿主提供。
      </Typography.Paragraph>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Space wrap>
          <Segmented
            aria-label="审批状态场景"
            value={status}
            options={[
              { label: '待提交', value: 'none' },
              { label: '审批中', value: 'pending_approval' },
              { label: '已驳回', value: 'rejected' },
              { label: '已通过', value: 'approved' },
              { label: '已终止', value: 'cancelled' },
            ]}
            onChange={(value) => setStatus(value as DemoStatus)}
          />
          <Segmented
            aria-label="审批操作权限"
            value={canManage ? 'manager' : 'reader'}
            options={[
              { label: '可操作', value: 'manager' },
              { label: '只读', value: 'reader' },
            ]}
            onChange={(value) => setCanManage(value === 'manager')}
          />
        </Space>
        <MesUiProvider hasPermission={() => canManage} approvalCapabilities={capabilities}>
          <ApprovalPanel
            key={`${status}-${canManage}`}
            entityType="purchase_requisition"
            entityId="requisition-demo"
            entityStatus="draft"
            onStatusChange={() => undefined}
          />
        </MesUiProvider>
      </Space>
    </SectionCard>
  );
}
