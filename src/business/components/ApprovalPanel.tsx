/**
 * @sunxu-layer business
 * @sunxu-domain approval
 * @sunxu-reason Preserves MES approval states, permission-gated submission/recall/handling/reset actions, confirmations, and workflow timeline while APIs and permission decisions stay host supplied.
 * Approval panel embedded in business detail pages.
 *
 * 功能：显示审批状态 + 审批流程时间线 + 通过/驳回按钮 + 重置按钮。
 * 如果该 entityType 未配置审批（status === 'none'），自动隐藏不渲染。
 *
 * @example
 * <ApprovalPanel entityType="purchase_requisition" entityId={id} onStatusChange={reload} />
 */

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EllipsisOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  message,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMesApprovalCapabilities } from '../MesUiProvider';
import type { ApprovalPanelStatusData } from './approval-types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApprovalPanelProps {
  entityType: string;
  entityId: string;
  onStatusChange?: () => void;
  onDataChange?: (data: ApprovalPanelStatusData) => void;
  allowReset?: boolean;
  showSubmitAction?: boolean;
  /**
   * 宿主实体的业务状态（如工单 draft/released/completed）。
   *
   * 仅用于判断是否展示「待提交审批/草稿」前置提示：只有当宿主实体确实处于可提交审批的
   * 前置态（draft/submitted）时，审批接口 status='none' 且已配置审批流(totalSteps>0)
   * 才渲染 needsSubmission/preSubmitReadonly 分支；其它态（released/in_progress/
   * completed/closed/cancelled）即使 status='none' 也不展示该提示，避免对已完工工单
   * 误显「待提交审批 / 已保存为草稿」。
   *
   * 不传该 prop 时保持原有行为（完全按审批接口 status 判断）。
   */
  entityStatus?: string;
}

export type { ApprovalPanelStatusData } from './approval-types';

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending_approval: {
    label: '待审批',
    color: 'warning',
    icon: <ClockCircleOutlined />,
  },
  approved: {
    label: '审批已通过',
    color: 'success',
    icon: <CheckCircleOutlined />,
  },
  rejected: {
    label: '审批已驳回',
    color: 'error',
    icon: <CloseCircleOutlined />,
  },
  cancelled: {
    label: '审批已终止',
    color: 'default',
    icon: <CloseCircleOutlined />,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ApprovalPanel({
  entityType,
  entityId,
  onStatusChange,
  onDataChange,
  allowReset = true,
  showSubmitAction = true,
  entityStatus,
}: ApprovalPanelProps) {
  const capabilities = useMesApprovalCapabilities();
  const [data, setData] = useState<ApprovalPanelStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [action, setAction] = useState<'approved' | 'rejected'>('approved');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = capabilities?.canAccess(entityType, 'submit') ?? false;
  const canRecallPermission = capabilities?.canAccess(entityType, 'recall') ?? false;
  const canLoadStatus = capabilities?.canLoadStatus(entityType) ?? false;
  const canHandle = capabilities?.canHandle() ?? false;
  const onStatusChangeRef = useRef(onStatusChange);
  const onDataChangeRef = useRef(onDataChange);
  const loadSeqRef = useRef(0);

  onStatusChangeRef.current = onStatusChange;
  onDataChangeRef.current = onDataChange;

  const loadStatus = useCallback(async () => {
    const loadSeq = ++loadSeqRef.current;

    if (!canLoadStatus) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      if (!capabilities) {
        setData(null);
        return;
      }
      const nextData = await capabilities.requestStatus({ entityType, entityId });
      if (loadSeqRef.current !== loadSeq) {
        return;
      }
      setData(nextData);
      onDataChangeRef.current?.(nextData);
    } finally {
      if (loadSeqRef.current === loadSeq) {
        setLoading(false);
      }
    }
  }, [canLoadStatus, capabilities, entityType, entityId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(
    () => () => {
      loadSeqRef.current += 1;
    },
    [],
  );

  const handleApprovalAction = async () => {
    if (action === 'rejected' && !comment.trim()) {
      message.warning('请输入驳回原因');
      return;
    }
    setSubmitting(true);
    try {
      await capabilities?.handle({
        entityType,
        entityId,
        action,
        comment: comment || undefined,
      });
      message.success(action === 'approved' ? '审批通过' : '已驳回');
      setActionModalVisible(false);
      setComment('');
      void loadStatus();
      onStatusChangeRef.current?.();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    Modal.confirm({
      title: '重新审批',
      content: '确定要清除当前审批记录并重新发起审批吗？',
      okText: '确定重置',
      cancelText: '取消',
      onOk: async () => {
        await capabilities?.reset({ entityType, entityId });
        message.success('已重置，可重新审批');
        void loadStatus();
        onStatusChangeRef.current?.();
      },
    });
  };

  const handleRecall = () => {
    Modal.confirm({
      title: '撤回审批',
      content:
        '确定要撤回已提交的审批吗？撤回后单据将退出审批并恢复为可编辑状态。',
      okText: '确定撤回',
      cancelText: '取消',
      onOk: async () => {
        await capabilities?.recall({ entityType, entityId });
        message.success('已撤回');
        void loadStatus();
        onStatusChangeRef.current?.();
      },
    });
  };

  const handleSubmit = () => {
    Modal.confirm({
      title: '提交审批',
      content: '提交后将进入审批流程，审批通过后才能继续执行业务动作。',
      okText: '提交',
      cancelText: '取消',
      onOk: async () => {
        await capabilities?.submit({ entityType, entityId });
        message.success('已提交审批');
        void loadStatus();
        onStatusChangeRef.current?.();
      },
    });
  };

  if (loading) {
    return (
      <div
        aria-busy="true"
        role="status"
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '8px 0',
          width: '100%',
        }}
      >
        <Spin size="small" />
      </div>
    );
  }
  // 宿主实体是否处于可提交审批的前置态。不传 entityStatus 时视为前置态，保持原有行为。
  const isSubmittableEntityState =
    entityStatus === undefined ||
    entityStatus === 'draft' ||
    entityStatus === 'submitted';

  // status === 'none' 表示单据尚未进入审批流程：
  //  - 未配置审批流(totalSteps === 0)：始终隐藏；
  //  - 已配置审批流但宿主实体已不在可提交前置态(如已完工/已关闭)：也隐藏，
  //    避免对已完工工单误显「待提交审批 / 已保存为草稿」。
  if (
    !data ||
    (data.status === 'none' &&
      (data.totalSteps === 0 || !isSubmittableEntityState))
  ) {
    return null;
  }

  const needsSubmission =
    canSubmit &&
    (data.status === 'none' || data.status === 'rejected') &&
    data.totalSteps > 0;
  const preSubmitReadonly =
    !canSubmit && data.status === 'none' && data.totalSteps > 0;
  const cfg = needsSubmission
    ? {
        label: data.status === 'rejected' ? '审批已驳回，待重提' : '待提交审批',
        color: 'default',
        icon: <ClockCircleOutlined />,
      }
    : preSubmitReadonly
      ? {
          label: '审批已配置',
          color: 'default',
          icon: <ClockCircleOutlined />,
        }
      : STATUS_CONFIG[data.status];

  return (
    <Card
      size="small"
      title={
        <Space>
          {cfg.icon}
          <span>{cfg.label}</span>
          {data.status === 'pending_approval' && (
            <Tag color="orange">
              第 {data.currentStep}/{data.totalSteps} 步
            </Tag>
          )}
          {needsSubmission && <Tag>共 {data.totalSteps} 步</Tag>}
        </Space>
      }
      extra={
        <Space>
          {showSubmitAction && needsSubmission && (
            <Button size="small" type="primary" onClick={handleSubmit}>
              {data.status === 'rejected' ? '重新提交审批' : '提交审批'}
            </Button>
          )}
          {data.status === 'pending_approval' &&
            canRecallPermission &&
            data.canRecall && (
              <Button size="small" onClick={handleRecall}>
                撤回审批
              </Button>
            )}
          {allowReset &&
            canHandle &&
            (data.status === 'rejected' || data.status === 'approved') && (
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重新审批
              </Button>
            )}
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      {needsSubmission && (
        <Alert
          type="info"
          showIcon
          message={
            data.status === 'rejected'
              ? '请根据驳回意见修改单据后重新提交审批。'
              : '当前单据已保存为草稿，提交审批后才会进入审批流程。'
          }
          style={{ marginBottom: 12 }}
        />
      )}
      {preSubmitReadonly && (
        <Alert
          type="info"
          showIcon
          message="当前单据已配置审批流程，但你没有提交权限。"
          style={{ marginBottom: 12 }}
        />
      )}
      {/* 审批流程时间线 */}
      {data.steps.length > 0 && (
        <Timeline
          style={{
            marginTop: 12,
            marginBottom:
              canHandle && data.isMyTurn && data.status === 'pending_approval'
                ? 12
                : 0,
          }}
          items={data.steps.map((step) => ({
            color: stepColor(step.status),
            icon: stepDot(step.status),
            content: (
              <div>
                <Space>
                  <Typography.Text strong>
                    第{step.step}步 · {step.label}
                  </Typography.Text>
                  <Tag color={stepTagColor(step.status)} style={{ margin: 0 }}>
                    {stepStatusLabel(step.status)}
                  </Tag>
                </Space>
                {step.assigneeName && (
                  <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>
                    <UserOutlined style={{ marginRight: 4 }} />
                    {step.record ? '审批人' : '待审批'}：{step.assigneeName}
                  </div>
                )}
                {step.record?.createdAt && (
                  <div style={{ color: '#bbb', fontSize: 12, marginTop: 2 }}>
                    {new Date(step.record.createdAt).toLocaleString('zh-CN')}
                  </div>
                )}
                {step.record?.comment && (
                  <Alert
                    type={step.status === 'rejected' ? 'error' : 'info'}
                    message={step.record.comment}
                    style={{ marginTop: 6, padding: '4px 8px' }}
                    showIcon={false}
                  />
                )}
              </div>
            ),
          }))}
        />
      )}

      {/* 操作按钮：审批执行权限与当前节点职责必须同时满足 */}
      {canHandle && data.isMyTurn && data.status === 'pending_approval' && (
        <Space>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              setAction('approved');
              setComment('');
              setActionModalVisible(true);
            }}
          >
            通过
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => {
              setAction('rejected');
              setComment('');
              setActionModalVisible(true);
            }}
          >
            驳回
          </Button>
        </Space>
      )}

      {/* 审批意见弹窗 */}
      <Modal
        title={action === 'approved' ? '审批通过' : '驳回'}
        open={actionModalVisible}
        onCancel={() => setActionModalVisible(false)}
        onOk={handleApprovalAction}
        confirmLoading={submitting}
        okText="确认"
        cancelText="取消"
        okButtonProps={{
          danger: action === 'rejected',
        }}
      >
        <Input.TextArea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={
            action === 'rejected'
              ? '请输入驳回原因（必填）'
              : '审批意见（可选）'
          }
        />
      </Modal>
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stepColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
    case 'pending':
      return 'orange';
    default:
      return 'gray';
  }
}

function stepDot(status: string): React.ReactNode {
  switch (status) {
    case 'approved':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'rejected':
      return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    case 'pending':
      return <ClockCircleOutlined style={{ color: '#faad14' }} />;
    default:
      return <EllipsisOutlined style={{ color: '#d9d9d9' }} />;
  }
}

function stepTagColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
}

function stepStatusLabel(status: string): string {
  switch (status) {
    case 'approved':
      return '已通过';
    case 'rejected':
      return '已驳回';
    case 'pending':
      return '待审批';
    default:
      return '未到达';
  }
}
