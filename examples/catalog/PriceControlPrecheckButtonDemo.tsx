import { useMemo, useState } from 'react';
import { Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  MesUiProvider,
  PriceControlPrecheckButton,
  type MesPriceControlCapabilities,
  type PriceControlDecision,
  type PriceControlPrecheckResult,
} from '../../src/mes';

type DemoDecision = 'clean' | 'warning' | 'blocker' | 'approval' | 'no-precheck';

function decision(
  kind: DemoDecision,
): PriceControlDecision | undefined {
  if (kind === 'clean' || kind === 'no-precheck') return undefined;
  return {
    ruleId: `rule-${kind}`,
    ruleName:
      kind === 'warning'
        ? '销售低毛利提醒'
        : kind === 'blocker'
          ? '采购最高价限制'
          : '价格例外审批',
    severity: kind,
    message:
      kind === 'warning'
        ? '当前报价毛利率低于建议值，请复核。'
        : kind === 'blocker'
          ? '采购单价超过当前规则的最高允许价。'
          : '当前价格偏离销售指导价，需要审批后继续。',
    sourceItemId: 'line-1',
    materialId: 'material-1',
    enteredUnitPrice: 128,
    controlUnitPrice: kind === 'blocker' ? 120 : 140,
    estimatedCost: 96,
    grossMarginRate: 25,
  };
}

export function PriceControlPrecheckButtonDemo() {
  const [kind, setKind] = useState<DemoDecision>('warning');
  const [hostResult, setHostResult] = useState('尚未确认');
  const capabilities = useMemo<MesPriceControlCapabilities>(
    () => ({
      hasRawViewPermission: () => kind !== 'no-precheck',
      async precheck() {
        await new Promise((resolve) => window.setTimeout(resolve, 150));
        const item = decision(kind);
        const result: PriceControlPrecheckResult = {
          warnings: kind === 'warning' && item ? [item] : [],
          blockers: kind === 'blocker' && item ? [item] : [],
          approvalRequired: kind === 'approval' && item ? [item] : [],
        };
        return result;
      },
      async requestExceptionApproval(params) {
        setHostResult(`已提交价格例外：${params.ruleId}`);
      },
      getErrorMessage(error) {
        return error instanceof Error ? error.message : '模拟操作失败';
      },
    }),
    [kind],
  );

  return (
    <SectionCard title="价格控制预检与例外申请">
      <Typography.Paragraph type="secondary">
        预检决策来自宿主服务：提醒不阻断，阻断项禁用确认，例外项引导提交审批；无原始价格查看权限时仍走原确认接口。
      </Typography.Paragraph>
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        <Segmented
          aria-label="价格预检结果"
          value={kind}
          options={[
            { label: '通过', value: 'clean' },
            { label: '提醒', value: 'warning' },
            { label: '阻断', value: 'blocker' },
            { label: '需审批', value: 'approval' },
            { label: '无预检权限', value: 'no-precheck' },
          ]}
          onChange={(value) => setKind(value as DemoDecision)}
        />
        <MesUiProvider
          hasPermission={() => true}
          priceControlCapabilities={capabilities}
        >
          <PriceControlPrecheckButton
            domain="sales"
            sourceType="sale_order"
            sourceId="sale-order-demo"
            partyType="customer"
            partyId="customer-demo"
            partyLevel="A"
            asOfDate="2026-11-20"
            buildLines={() => [
              {
                sourceItemId: 'line-1',
                materialId: 'material-1',
                unitPrice: 128,
                quantity: 12,
                estimatedCost: 96,
                label: '6061 铝型材',
              },
            ]}
            permission="sales:order:confirm"
            confirmTitle="确认销售订单？"
            confirmContent="将按当前单价提交订单。"
            successMessage="销售订单已确认"
            onConfirm={async () => {
              await new Promise((resolve) => window.setTimeout(resolve, 150));
              setHostResult('宿主确认单据成功');
            }}
          >
            确认销售订单
          </PriceControlPrecheckButton>
        </MesUiProvider>
        <Typography.Text type="secondary" aria-live="polite">
          {hostResult}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
