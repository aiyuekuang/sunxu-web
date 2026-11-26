import { Space, Typography } from 'antd';
import { formatQtyWithBaseUnit, type UnitLabelMap } from '../../utils/qty-unit';

export interface PurchaseReceiptCapacitySummaryProps {
  orderedQty: number;
  receivedQty: number;
  outstandingQty: number;
  baseUnit?: string | null;
  unitLabelMap?: UnitLabelMap;
}

/**
 * @sunxu-layer business
 * @sunxu-domain procurement
 * @sunxu-reason Presents reusable purchase receipt capacity summary behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function PurchaseReceiptCapacitySummary({
  orderedQty,
  receivedQty,
  outstandingQty,
  baseUnit,
  unitLabelMap,
}: PurchaseReceiptCapacitySummaryProps) {
  const formatBaseQty = (value: number) =>
    formatQtyWithBaseUnit({
      baseQty: value,
      baseUnit,
      unitLabelMap,
    });

  return (
    <Space orientation="vertical" size={0}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        订单 {formatBaseQty(orderedQty)}
      </Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        已收 {formatBaseQty(receivedQty)} · 待收 {formatBaseQty(outstandingQty)}
      </Typography.Text>
    </Space>
  );
}
