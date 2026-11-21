import { App, Button, Col, Form, InputNumber, Row, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import type {
  MaterialPriceSectionProps,
  MaterialPriceUpdateRequest,
} from './material-price-section-types';

type PriceFormValues = {
  unitCost?: number | null;
  referenceSalePrice?: number | null;
};

/**
 * @sunxu-component mes-specific
 * @sunxu-domain materials
 * @sunxu-reason Preserves the MES material reference-price form and price-control links while the host supplies permissions, update service, and navigation.
 */
export function MaterialPriceSection({
  materialId,
  unitCost,
  referenceSalePrice,
  minSalePrice,
  maxPurchasePrice,
  boundsCurrency,
  averageCost,
  canEditMaterial,
  canViewBounds,
  updateMaterialPrice,
  navigate,
  onSaved,
}: MaterialPriceSectionProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<PriceFormValues>();
  const [saving, setSaving] = useState(false);
  const hasBounds = minSalePrice != null || maxPurchasePrice != null;

  useEffect(() => {
    form.setFieldsValue({
      unitCost: unitCost ?? undefined,
      referenceSalePrice: referenceSalePrice ?? undefined,
    });
  }, [form, unitCost, referenceSalePrice]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await updateMaterialPrice({
        id: materialId,
        unitCost: values.unitCost ?? undefined,
        referenceSalePrice: values.referenceSalePrice ?? undefined,
      } satisfies MaterialPriceUpdateRequest);
      message.success('参考价已保存');
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const numberProps = {
    min: 0,
    precision: 4,
    style: { width: '100%' },
  } as const;

  const navigateLink = (path: string, label: string) => (
    <a
      href={path}
      onClick={(event) => {
        event.preventDefault();
        navigate(path);
      }}
    >
      {label}
    </a>
  );

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 720 }}>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="unitCost"
            label="参考进价"
            tooltip="采购默认进价/成本；采购无供应商价目时按此兜底，也用于毛利核算"
          >
            <InputNumber
              {...numberProps}
              disabled={!canEditMaterial}
              placeholder="可选"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="referenceSalePrice"
            label="参考售价"
            tooltip="销售默认售价；无客户专属价/价目表命中时下单按此带出，维护它即可下单，无需建价目表"
          >
            <InputNumber
              {...numberProps}
              disabled={!canEditMaterial}
              placeholder="可选"
            />
          </Form.Item>
        </Col>
        {canViewBounds ? (
          <>
            <Col span={12}>
              <Form.Item
                label="最低售价"
                tooltip="销售低于此价需价格例外审批；底层为该物料的价格管控规则"
              >
                <InputNumber
                  {...numberProps}
                  value={minSalePrice ?? undefined}
                  disabled
                  placeholder="未配置"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="最高进价"
                tooltip="采购高于此价需价格例外审批；底层为该物料的价格管控规则"
              >
                <InputNumber
                  {...numberProps}
                  value={maxPurchasePrice ?? undefined}
                  disabled
                  placeholder="未配置"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="价格控制币别">
                <Typography.Text>{boundsCurrency || '-'}</Typography.Text>
              </Form.Item>
            </Col>
          </>
        ) : null}
      </Row>

      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {averageCost != null ? (
          <Typography.Text type="secondary">
            平均成本（库存移动加权，只读）：{averageCost}
          </Typography.Text>
        ) : null}
        {hasBounds && !boundsCurrency ? (
          <Typography.Text type="warning">
            当前价格控制规则币别不唯一或缺失，请补齐币别后保存。
          </Typography.Text>
        ) : null}
        <Typography.Text type="secondary">
          需要维护最低售价 / 最高进价？前往{' '}
          {navigateLink(
            `/finance/price-control?tab=rules&scopeRefId=${encodeURIComponent(materialId)}`,
            '价格控制',
          )}
        </Typography.Text>
        <Typography.Text type="secondary">
          需要阶梯价 / 时段价 / 分客户价？前往{' '}
          {navigateLink('/finance/price-control?tab=pricelists', '销售价目（价格管理）')}
        </Typography.Text>
        {canEditMaterial ? (
          <Button type="primary" loading={saving} onClick={handleSave}>
            保存参考价
          </Button>
        ) : null}
      </Space>
    </Form>
  );
}

export type { MaterialPriceSectionProps, MaterialPriceUpdateRequest };
