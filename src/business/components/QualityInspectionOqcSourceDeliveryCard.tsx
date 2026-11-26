import { ProDescriptions } from '@ant-design/pro-components';
import { Alert, Card, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { formatUnitLabel, type UnitLabelMap } from '../utils/qty-unit';
import { StatusDisplay, type StatusMap } from '../../components/StatusDisplay';

export interface QualityOqcSourceDeliveryItem {
  id: string;
  quantity: number | string;
  batchNo?: string | null;
  storageLocationSnapshot?: string | null;
  customerMaterialCode?: string | null;
  customerMaterialName?: string | null;
  customerMaterialSpec?: string | null;
  material?: {
    unit?: string | null;
    name?: string | null;
    code?: string | null;
    spec?: string | null;
  } | null;
}

export interface QualityOqcSourceDeliveryRecord {
  id: string;
  deliveryNo?: string | null;
  partnerNameSnapshot?: string | null;
  customer?: { name?: string | null } | null;
  status: string;
  deliveryDate?: string | null;
  items?: QualityOqcSourceDeliveryItem[] | null;
}

export interface QualityOqcInspectionSource {
  type: string;
  isAutoCreated: boolean;
  saleDeliveryOrderId?: string | null;
  saleDeliveryItemId?: string | null;
}

export type QualityInspectionOqcSourceDeliveryCardProps = {
  inspection: QualityOqcInspectionSource;
  capabilities: {
    loadDeliveryDetail: (
      deliveryId: string,
    ) => Promise<QualityOqcSourceDeliveryRecord | null>;
    unitLabelMap: UnitLabelMap;
    deliveryStatusEnum: StatusMap;
    formatNumber: (
      value: number | string | null | undefined,
      options: { maximumFractionDigits: number },
    ) => string;
  };
};

/**
 * @sunxu-layer business
 * @sunxu-domain quality-inspection
 * @sunxu-reason Preserves automatic OQC source-delivery validation and source line presentation while delivery lookup, status/unit labels, and number formatting remain host supplied.
 */
export function OqcSourceDeliveryCard({
  inspection,
  capabilities,
}: QualityInspectionOqcSourceDeliveryCardProps) {
  const requestIdRef = useRef(0);
  const loadDetailRef = useRef(capabilities.loadDeliveryDetail);
  loadDetailRef.current = capabilities.loadDeliveryDetail;
  const [delivery, setDelivery] =
    useState<QualityOqcSourceDeliveryRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const isAutomaticOqc = inspection.type === 'oqc' && inspection.isAutoCreated;
  const deliveryOrderId = isAutomaticOqc
    ? inspection.saleDeliveryOrderId
    : undefined;

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setDelivery(null);
    setLoadFailed(false);

    if (!deliveryOrderId) {
      setLoading(false);
      return () => {
        requestIdRef.current += 1;
      };
    }

    setLoading(true);
    void (async () => {
      try {
        const detail = await loadDetailRef.current(deliveryOrderId);
        if (requestIdRef.current === requestId) setDelivery(detail);
      } catch {
        if (requestIdRef.current === requestId) setLoadFailed(true);
      } finally {
        if (requestIdRef.current === requestId) setLoading(false);
      }
    })();

    return () => {
      requestIdRef.current += 1;
    };
  }, [deliveryOrderId]);

  if (!isAutomaticOqc) return null;

  if (!deliveryOrderId || !inspection.saleDeliveryItemId) {
    return (
      <Card title="出货放行来源">
        <Alert
          showIcon
          type="error"
          message="自动出货检验缺少来源销售出库单或明细"
          description="该质检单无法完成销售出库放行追溯，请检查历史数据完整性。"
        />
      </Card>
    );
  }

  if (loading) {
    return (
      <Card title="出货放行来源">
        <Spin />
      </Card>
    );
  }

  if (loadFailed) {
    return (
      <Card title="出货放行来源">
        <Alert
          showIcon
          type="error"
          message="来源销售出库单加载失败"
          description="请刷新后重试；若持续失败，请检查销售出库单权限和来源数据。"
        />
      </Card>
    );
  }

  if (!delivery) {
    return (
      <Card title="出货放行来源">
        <Alert
          showIcon
          type="error"
          message="未找到来源销售出库单"
          description="该质检单关联的销售出库单已不可访问，请检查历史数据完整性。"
        />
      </Card>
    );
  }

  const deliveryItem = delivery.items?.find(
    (item) => item.id === inspection.saleDeliveryItemId,
  );
  if (!deliveryItem) {
    return (
      <Card title="出货放行来源">
        <Alert
          showIcon
          type="error"
          message="未找到来源销售出库明细"
          description="该质检单关联的销售出库明细已不可访问，请检查历史数据完整性。"
        />
      </Card>
    );
  }

  const unitLabel = formatUnitLabel(
    deliveryItem.material?.unit,
    capabilities.unitLabelMap,
  );

  return (
    <Card title="出货放行来源">
      <ProDescriptions<QualityOqcSourceDeliveryRecord>
        column={3}
        dataSource={delivery}
        columns={[
          {
            title: '来源销售出库单',
            copyable: true,
            render: () => delivery.deliveryNo,
          },
          {
            title: '客户',
            render: () =>
              delivery.partnerNameSnapshot || delivery.customer?.name || '-',
          },
          {
            title: '销售出库状态',
            render: () => (
              <StatusDisplay
                value={delivery.status}
                enumMap={capabilities.deliveryStatusEnum}
                size="small"
              />
            ),
          },
          {
            title: '出库日期',
            dataIndex: 'deliveryDate',
            valueType: 'date',
          },
          {
            title: '来源销售出库明细',
            span: 2,
            render: () => <>已精确关联</>,
          },
          {
            title: '物料名称',
            render: () =>
              deliveryItem.material?.name ||
              deliveryItem.customerMaterialName ||
              '-',
          },
          {
            title: '物料编码',
            render: () =>
              deliveryItem.material?.code ||
              deliveryItem.customerMaterialCode ||
              '-',
          },
          {
            title: '规格型号',
            render: () =>
              deliveryItem.material?.spec ||
              deliveryItem.customerMaterialSpec ||
              '-',
          },
          {
            title: '出库数量',
            render: () =>
              `${capabilities.formatNumber(deliveryItem.quantity, {
                maximumFractionDigits: 4,
              })}${unitLabel ? ` ${unitLabel}` : ''}`,
          },
          { title: '批号', render: () => deliveryItem.batchNo || '-' },
          {
            title: '出库位置',
            render: () => deliveryItem.storageLocationSnapshot || '-',
          },
        ]}
      />
    </Card>
  );
}
