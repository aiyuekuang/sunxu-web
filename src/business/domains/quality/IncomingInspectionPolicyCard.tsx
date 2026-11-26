import { Card, Typography } from 'antd';

/** @sunxu-layer business @sunxu-domain quality @sunxu-reason Preserves the host policy guidance shown beside material records.*/
export function IncomingInspectionPolicyCard() {
  return (
    <Card size="small" title="采购来料检验" style={{ marginBottom: 16 }}>
      <Typography.Text type="secondary">
        IQC 是否触发及使用哪个模板，统一在“质量管理 → 检验配置 → 检验方案”维护。
        可按物料、物料系列和供应商配置；物料档案不再单独启停来料检验。
      </Typography.Text>
    </Card>
  );
}
