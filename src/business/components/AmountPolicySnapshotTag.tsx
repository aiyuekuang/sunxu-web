import { Descriptions, Popover, Tag, Typography } from 'antd';
import React from 'react';
import { useMesAmountMask } from '../MesUiProvider';

export type AmountPolicySnapshotSummary = {
  domain?: string;
  documentType?: string;
  policyCode: string;
  version?: number | null;
  amountFormula?: string | null;
  amountFormulaReadable?: string | null;
  pricingQuantity?: number | null;
  baseAmount?: number | null;
  formulaDifferenceAmount?: number | null;
  amount?: number | null;
};

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function resolveAmountPolicySnapshot(
  priceSnapshot: unknown,
): AmountPolicySnapshotSummary | null {
  const root = readRecord(priceSnapshot);
  const sourcePriceSnapshot = readRecord(root.priceSnapshot);
  const nested = readRecord(root.amountPolicySnapshot);
  const sourceNested = readRecord(sourcePriceSnapshot.amountPolicySnapshot);
  const snapshot =
    Object.keys(nested).length > 0
      ? nested
      : Object.keys(sourceNested).length > 0
        ? sourceNested
        : Object.keys(sourcePriceSnapshot).length > 0
          ? sourcePriceSnapshot
          : root;
  const policyCode = readString(snapshot.policyCode);
  if (!policyCode) return null;

  const result = readRecord(snapshot.result);
  return {
    domain: readString(snapshot.domain),
    documentType: readString(snapshot.documentType),
    policyCode,
    version: readNumber(snapshot.version),
    amountFormula: readString(snapshot.amountFormula) ?? null,
    amountFormulaReadable: readString(snapshot.amountFormulaReadable) ?? null,
    pricingQuantity: readNumber(result.pricingQuantity),
    baseAmount: readNumber(result.baseAmount),
    formulaDifferenceAmount: readNumber(result.formulaDifferenceAmount),
    amount: readNumber(result.amount),
  };
}

export interface AmountPolicySnapshotTagProps {
  priceSnapshot?: unknown;
  mask?: (amount: string | number | null | undefined) => string;
}

function formatAmount(
  value: number | null | undefined,
  mask: (amount: string | number | null | undefined) => string,
): string {
  if (value == null) return '-';
  return mask(Number(value).toFixed(2));
}

function policyCodeLabel(policyCode: string): string {
  return policyCode === 'default' ? '默认规则' : policyCode;
}

/**
 * @sunxu-layer business
 * @sunxu-domain finance
 * @sunxu-reason Shows MES amount-policy snapshots and masks calculated values through the host.
 */
export function AmountPolicySnapshotTag({
  priceSnapshot,
  mask,
}: AmountPolicySnapshotTagProps) {
  const hostMask = useMesAmountMask();
  const snapshot = resolveAmountPolicySnapshot(priceSnapshot);
  if (!snapshot) return <Typography.Text type="secondary">-</Typography.Text>;

  const versionText =
    snapshot.version === null || snapshot.version === undefined
      ? '默认'
      : `v${snapshot.version}`;
  const maskAmount = mask ?? hostMask;

  return (
    <Popover
      title="金额计算快照"
      content={
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="规则">
            {policyCodeLabel(snapshot.policyCode)} / {versionText}
          </Descriptions.Item>
          <Descriptions.Item label="行金额公式">
            {snapshot.amountFormulaReadable ??
              snapshot.amountFormula ??
              '业务数量 × 单价'}
          </Descriptions.Item>
          <Descriptions.Item label="业务数量">
            {snapshot.pricingQuantity ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="标准金额">
            {formatAmount(snapshot.baseAmount, maskAmount)}
          </Descriptions.Item>
          <Descriptions.Item label="公式差额">
            {formatAmount(snapshot.formulaDifferenceAmount, maskAmount)}
          </Descriptions.Item>
          <Descriptions.Item label="行金额">
            {formatAmount(snapshot.amount, maskAmount)}
          </Descriptions.Item>
        </Descriptions>
      }
    >
      <Tag color="processing" style={{ cursor: 'pointer' }}>
        {policyCodeLabel(snapshot.policyCode)} / {versionText}
      </Tag>
    </Popover>
  );
}
