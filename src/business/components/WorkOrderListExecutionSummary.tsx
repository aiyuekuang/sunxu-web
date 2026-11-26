import { Progress, Space, Tag, Tooltip, Typography } from 'antd';
import React from 'react';
import type {
  WorkOrderListExecutionRecord,
  WorkOrderRiskTag,
  WorkOrderProgressNodeStatus,
  WorkOrderListRiskSummary,
} from './work-order-form-types';

const RISK_TAG_META: Record<
  WorkOrderRiskTag,
  { label: string; color: string }
> = {
  urgent: { label: '加急', color: 'red' },
  due_today: { label: '今日到期', color: 'orange' },
  due_soon: { label: '三天内到期', color: 'gold' },
  overdue: { label: '交期风险', color: 'red' },
  material_shortage: { label: '缺料', color: 'volcano' },
  quality_blocked: { label: '质检阻断', color: 'red' },
  pending_finished_inbound: { label: '成品待入库', color: 'orange' },
  schedule_unconfirmed: { label: '排产待确认', color: 'blue' },
  paused: { label: '暂停中', color: 'default' },
};

const RISK_TAG_ORDER: WorkOrderRiskTag[] = [
  'overdue',
  'quality_blocked',
  'pending_finished_inbound',
  'material_shortage',
  'urgent',
  'due_today',
  'due_soon',
  'schedule_unconfirmed',
  'paused',
];

const NODE_STATUS_META: Record<
  WorkOrderProgressNodeStatus,
  { label: string; color: string }
> = {
  pending: { label: '待执行', color: 'default' },
  in_progress: { label: '执行中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  skipped: { label: '已跳过', color: 'default' },
  blocked: { label: '阻断', color: 'error' },
};

function clampPercent(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.round(value ?? 0), 100));
}

function formatMinutes(value: number | null | undefined): string {
  if (!value || value <= 0) return '';
  const minutes = Math.round(value);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return hours > 0 ? `${days}天${hours}小时` : `${days}天`;
  if (hours > 0) return `${hours}小时`;
  return `${minutes}分钟`;
}

function getRiskTags(record: WorkOrderListExecutionRecord): WorkOrderRiskTag[] {
  const tags = record.riskSummary?.tags ?? [];
  if (tags.length > 0) {
    return RISK_TAG_ORDER.filter((tag) => tags.includes(tag));
  }
  return record.isOverdue ? ['overdue'] : [];
}

function getRiskTooltip(
  tag: WorkOrderRiskTag,
  summary: WorkOrderListRiskSummary | undefined,
): string {
  if (tag === 'overdue') {
    const text = formatMinutes(summary?.overdueMinutes);
    return text ? `超出交期截止约 ${text}` : '交期风险';
  }
  if (tag === 'due_today' || tag === 'due_soon') {
    const text = formatMinutes(summary?.dueInMinutes);
    return text ? `距离交期截止约 ${text}` : RISK_TAG_META[tag].label;
  }
  return RISK_TAG_META[tag].label;
}

/** @sunxu-layer business @sunxu-domain manufacturing @sunxu-reason Displays MES work-order risk tags with source ordering and elapsed-time context. */
export function WorkOrderRiskTags({
  record,
}: {
  record: WorkOrderListExecutionRecord;
}) {
  const tags = getRiskTags(record);
  if (tags.length === 0) {
    return <Typography.Text type="secondary">—</Typography.Text>;
  }

  return (
    <Space size={[4, 4]} wrap>
      {tags.map((tag) => {
        const meta = RISK_TAG_META[tag];
        return (
          <Tooltip key={tag} title={getRiskTooltip(tag, record.riskSummary)}>
            <Tag color={meta.color} style={{ marginInlineEnd: 0 }}>
              {meta.label}
            </Tag>
          </Tooltip>
        );
      })}
    </Space>
  );
}

/** @sunxu-layer business @sunxu-domain manufacturing @sunxu-reason Displays route progress nodes with source truncation, tooltips, current-step and overflow states. */
export function WorkOrderListProgress({
  record,
  visibleNodeCount = 3,
}: {
  record: WorkOrderListExecutionRecord;
  visibleNodeCount?: number;
}) {
  const summary = record.progressSummary;
  const percent = clampPercent(
    summary?.overallPercent ?? record.overallProgress,
  );
  const nodes = summary?.nodes ?? [];
  const visibleNodes = nodes.slice(0, visibleNodeCount);
  const hiddenCount = Math.max(0, nodes.length - visibleNodes.length);
  const currentOperationIds = new Set(summary?.currentOperationIds ?? []);

  return (
    <Space
      size={8}
      align="center"
      style={{
        width: '100%',
        minWidth: 260,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      <Space size={8} align="center" style={{ flex: '0 0 auto' }}>
        <Progress percent={percent} size="small" style={{ width: 80 }} />
        <Typography.Text type="secondary" style={{ minWidth: 54 }}>
          {summary?.completedOperationCount ?? 0}/{summary?.operationCount ?? 0}
          道
        </Typography.Text>
      </Space>
      {visibleNodes.length > 0 ? (
        <Space
          size={4}
          wrap={false}
          style={{ minWidth: 0, overflow: 'hidden' }}
        >
          {visibleNodes.map((node) => {
            const meta = NODE_STATUS_META[node.status];
            const isCurrent = currentOperationIds.has(node.operationId);
            const title = `${node.sequence}. ${node.operationName}：${node.percent}%（已报 ${node.reportedQty}/${node.plannedQty}）`;
            return (
              <Tooltip key={node.operationId} title={title}>
                <Tag
                  color={isCurrent ? 'blue' : meta.color}
                  style={{
                    marginInlineEnd: 0,
                    maxWidth: 96,
                    flexShrink: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {node.operationName} {node.percent}%
                </Tag>
              </Tooltip>
            );
          })}
          {hiddenCount > 0 ? (
            <Tag style={{ marginInlineEnd: 0 }}>+{hiddenCount}</Tag>
          ) : null}
        </Space>
      ) : (
        <Typography.Text type="secondary" ellipsis>
          无工序路线
        </Typography.Text>
      )}
    </Space>
  );
}
