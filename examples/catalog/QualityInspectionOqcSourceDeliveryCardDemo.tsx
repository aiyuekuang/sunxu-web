import { SectionCard } from '../../src';
import { OqcSourceDeliveryCard } from '../../src/business';

const delivery = {
  id: 'delivery-001',
  deliveryNo: 'XSCK-2026-0018',
  partnerNameSnapshot: '华东装备有限公司',
  status: 'shipped',
  deliveryDate: '2026-11-21',
  items: [
    {
      id: 'delivery-item-1',
      quantity: 12,
      batchNo: 'B-20261121-01',
      storageLocationSnapshot: '成品仓 / A-01-02',
      material: {
        unit: 'PCS',
        name: '不锈钢阀体',
        code: 'VALVE-001',
        spec: 'DN25',
      },
    },
  ],
};

export function QualityInspectionOqcSourceDeliveryCardDemo() {
  return (
    <SectionCard title="OQC 来源出库追溯">
      <OqcSourceDeliveryCard
        inspection={{
          type: 'oqc',
          isAutoCreated: true,
          saleDeliveryOrderId: delivery.id,
          saleDeliveryItemId: delivery.items[0].id,
        }}
        capabilities={{
          loadDeliveryDetail: async () => delivery,
          unitLabelMap: { PCS: '件' },
          deliveryStatusEnum: {
            shipped: { text: '已发货', status: 'Success' },
          },
          formatNumber: (value, options) =>
            Number(value ?? 0).toLocaleString('zh-CN', options),
        }}
      />
    </SectionCard>
  );
}
