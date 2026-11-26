import { SectionCard, Typography } from '../../src';
import { PurchaseReceiptCapacitySummary } from '../../src/business';

const unitLabelMap = {
  kg: '千克',
};

export function PurchaseReceiptCapacitySummaryDemo() {
  return (
    <SectionCard title="采购入库履约摘要">
      <Typography.Paragraph type="secondary">
        展示采购订单数量、已收数量和待收数量；单位标签由宿主字典传入，未配置时保留原单位编码。
      </Typography.Paragraph>
      <PurchaseReceiptCapacitySummary
        orderedQty={128.5}
        receivedQty={32.25}
        outstandingQty={96.25}
        baseUnit="kg"
        unitLabelMap={unitLabelMap}
      />
    </SectionCard>
  );
}
