import { FileSearchOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDigit,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Button, Card, Col, Row, Statistic } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import React from 'react';
import { formatUnitLabel, type UnitLabelMap } from '../utils/qty-unit';

export type WorkOrderReceiptSummary = {
  receivedQty: number | string;
  pendingReceiptCount: number;
  pendingReceiptQty: number | string;
  outputBufferOpenQty: number | string;
  disposedQty: number | string;
};

export type ProductionReceiptSummaryCardProps = {
  workOrderId: string;
  canView: boolean;
  canNavigate: boolean;
  requestSummary: (workOrderId: string) => Promise<WorkOrderReceiptSummary>;
  onNavigate: (workOrderId: string) => void;
};

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-work-order-receipts
 * @sunxu-reason Keeps the work-order receipt metrics and permission-gated list link while receipt lookup and navigation remain host-owned.
 */
export function ProductionReceiptSummaryCard({
  workOrderId,
  canView,
  canNavigate,
  requestSummary,
  onNavigate,
}: ProductionReceiptSummaryCardProps) {
  const [summary, setSummary] = React.useState<WorkOrderReceiptSummary | null>(
    null,
  );

  React.useEffect(() => {
    if (!canView || !workOrderId) return;
    let cancelled = false;
    requestSummary(workOrderId).then((result) => {
      if (!cancelled) setSummary(result);
    });
    return () => {
      cancelled = true;
    };
  }, [canView, requestSummary, workOrderId]);

  if (!canView || !summary) return null;

  return (
    <Card
      title="生产入库单"
      style={{ marginBottom: 16 }}
      extra={
        canNavigate ? (
          <Button
            size="small"
            icon={<FileSearchOutlined />}
            onClick={() => onNavigate(workOrderId)}
          >
            查看生产入库单
          </Button>
        ) : null
      }
    >
      <Row gutter={16}>
        <Col span={6}>
          <Statistic title="已入库数量" value={summary.receivedQty} />
        </Col>
        <Col span={6}>
          <Statistic
            title={`待确认数量（${summary.pendingReceiptCount} 单）`}
            value={summary.pendingReceiptQty}
            valueStyle={
              Number(summary.pendingReceiptQty) > 0
                ? { color: '#1677FF' }
                : undefined
            }
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="暂存未处理数量"
            value={summary.outputBufferOpenQty}
            valueStyle={
              Number(summary.outputBufferOpenQty) > 0
                ? { color: '#FF8F1F' }
                : undefined
            }
          />
        </Col>
        <Col span={6}>
          <Statistic title="已处置数量" value={summary.disposedQty} />
        </Col>
      </Row>
    </Card>
  );
}

export type WorkOrderSplitResult = {
  id?: string;
  child?: { id?: string };
};

export type WorkOrderSplitFieldHelp = {
  label: string;
  tooltip?: { title: ReactNode; overlayStyle?: CSSProperties };
};

export type WorkOrderSplitModalProps = {
  open: boolean;
  workOrderId: string;
  orderNo: string;
  maxQty: number;
  allowFullSplit: boolean;
  unit: string;
  unitLabelMap: UnitLabelMap;
  splitQtyFieldHelp: WorkOrderSplitFieldHelp;
  descriptionFieldHelp: WorkOrderSplitFieldHelp;
  splitWorkOrder: (input: {
    id: string;
    splitQty: number;
    description?: string;
  }) => Promise<WorkOrderSplitResult>;
  onClose: () => void;
  onSuccess: (childId: string) => void;
  notifySuccess: () => void;
};

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-work-order-split
 * @sunxu-reason Preserves the work-order split quantity bounds, unit suffix, form help, submit result, and child-work-order callback while service and notification effects stay with the host.
 */
export function WorkOrderSplitModal({
  open,
  workOrderId,
  orderNo,
  maxQty,
  allowFullSplit,
  unit,
  unitLabelMap,
  splitQtyFieldHelp,
  descriptionFieldHelp,
  splitWorkOrder,
  onClose,
  onSuccess,
  notifySuccess,
}: WorkOrderSplitModalProps) {
  const unitLabel = formatUnitLabel(unit, unitLabelMap);
  const unitSuffix = unitLabel ? ` ${unitLabel}` : '';
  const maxAllowedQty = allowFullSplit ? maxQty : maxQty - 1;

  return (
    <ModalForm<{ splitQty: number; description?: string }>
      title={`拆分工单 — ${orderNo}`}
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
      onFinish={async (values) => {
        try {
          const result = await splitWorkOrder({
            id: workOrderId,
            splitQty: values.splitQty,
            description: values.description || undefined,
          });
          const childId = result.child?.id ?? result.id;
          if (!childId) return false;
          notifySuccess();
          onSuccess(childId);
          return true;
        } catch {
          return false;
        }
      }}
      modalProps={{ destroyOnHidden: true, width: 480 }}
    >
      <ProFormDigit
        name="splitQty"
        {...splitQtyFieldHelp}
        rules={[{ required: true, message: '请输入拆分数量' }]}
        min={1}
        max={maxAllowedQty}
        fieldProps={{ precision: 0 }}
        extra={`可拆分范围：1 ~ ${maxAllowedQty}${unitSuffix}`}
      />
      <ProFormTextArea
        name="description"
        {...descriptionFieldHelp}
        fieldProps={{ rows: 3, maxLength: 1000 }}
      />
    </ModalForm>
  );
}
