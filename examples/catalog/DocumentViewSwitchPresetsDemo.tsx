import { useState } from 'react';
import { Space } from 'antd';
import { SectionCard, Typography } from '../../src';
import {
  MaterialIssueViewSwitch,
  PurchaseOrderViewSwitch,
  PurchaseReceiptViewSwitch,
  PurchaseRequisitionViewSwitch,
  PurchaseReturnViewSwitch,
  QuotationViewSwitch,
  SaleDeliveryViewSwitch,
  SaleOrderViewSwitch,
  SaleReturnViewSwitch,
} from '../../src/mes';
import type { DocumentViewMode } from '../../src/mes';

const presets = [
  ['采购申请', PurchaseRequisitionViewSwitch],
  ['采购订单', PurchaseOrderViewSwitch],
  ['采购退料', PurchaseReturnViewSwitch],
  ['销售出库单', SaleDeliveryViewSwitch],
  ['销售订单', SaleOrderViewSwitch],
  ['报价单', QuotationViewSwitch],
  ['销售退货', SaleReturnViewSwitch],
  ['生产领料', MaterialIssueViewSwitch],
  ['采购入库单', PurchaseReceiptViewSwitch],
] as const;

export function DocumentViewSwitchPresetsDemo() {
  const [view, setView] = useState<DocumentViewMode>('detail');

  return (
    <SectionCard title="MES 单据与明细视图切换">
      <Space wrap size={[24, 16]}>
        {presets.map(([label, ViewSwitch]) => (
          <Space key={label} direction="vertical" size={4}>
            <Typography.Text type="secondary">{label}</Typography.Text>
            <ViewSwitch value={view} onChange={setView} />
          </Space>
        ))}
      </Space>
    </SectionCard>
  );
}
