import {
  ProForm,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Alert, Collapse, Typography } from 'antd';

export type ScrapDeductionMode = 'per_unit' | 'fixed';

export interface LaborDeductionPolicyValues {
  scrapDeductionEnabled?: boolean;
  scrapRateThreshold?: number;
  deductionMode?: ScrapDeductionMode;
  deductionUnitAmount?: number;
  deductionFixedAmount?: number;
  defaultSettleRoute?: 'wage' | 'funds';
  autoSettle?: boolean;
  deductionItemCode?: string;
}

export interface MaterialScrapDeductionFormValues {
  scopeMode: 'inherit' | 'override';
  enabledMode: 'inherit' | 'enabled' | 'disabled';
  scrapRateThreshold?: number;
  deductionMode?: ScrapDeductionMode;
  deductionUnitAmount?: number;
  deductionFixedAmount?: number;
}

export interface MaterialScrapDeductionDetail {
  hasOverride: boolean;
  scrapDeductionEnabled?: boolean | null;
  scrapRateThreshold?: number | null;
  deductionMode?: ScrapDeductionMode | null;
  deductionUnitAmount?: number | null;
  deductionFixedAmount?: number | null;
}

export type MaterialScrapDeductionUpdate =
  | { materialId: string; clearOverride: true }
  | {
      materialId: string;
      scrapDeductionEnabled: boolean | null;
      scrapRateThreshold: number | null;
      deductionMode: ScrapDeductionMode | null;
      deductionUnitAmount: number | null;
      deductionFixedAmount: number | null;
    };

export interface CompanyScrapDeductionPolicyCapabilities {
  loadCompanyPolicy: () => Promise<LaborDeductionPolicyValues | null>;
  updateCompanyPolicy: (values: LaborDeductionPolicyValues) => Promise<void>;
  notifyCompanyPolicySaved: () => void;
}

export interface MaterialScrapDeductionPolicyCapabilities {
  loadMaterialPolicy: (
    materialId: string,
  ) => Promise<MaterialScrapDeductionDetail | null>;
  updateMaterialPolicy: (payload: MaterialScrapDeductionUpdate) => Promise<void>;
  notifyMaterialPolicySaved: () => void;
}

/** Combined contract for hosts that render both company and material policy sections. */
export interface ScrapDeductionPolicyCapabilities
  extends CompanyScrapDeductionPolicyCapabilities,
    MaterialScrapDeductionPolicyCapabilities {}

export type ScrapDeductionPolicySectionProps = {
  canView: boolean;
  canUpdate: boolean;
  capabilities: CompanyScrapDeductionPolicyCapabilities;
};

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Keeps the company-wide scrap threshold, deduction method, settlement route, automatic confirmation, and permission-gated save section while policy services and authorization remain host supplied.
 */
export function ScrapDeductionPolicySection({
  canView,
  canUpdate,
  capabilities,
}: ScrapDeductionPolicySectionProps) {
  if (!canView) return null;
  const { Title } = Typography;

  return (
    <Collapse
      bordered={false}
      items={[
        {
          key: 'scrap-deduction',
          label: <Title level={5}>报废扣款 / 人员扣罚</Title>,
          children: (
            <ProForm<LaborDeductionPolicyValues>
              grid
              rowProps={{ gutter: [16, 0] }}
              layout="vertical"
              disabled={!canUpdate}
              request={async () => {
                const policy = await capabilities.loadCompanyPolicy();
                return {
                  scrapDeductionEnabled:
                    policy?.scrapDeductionEnabled ?? undefined,
                  scrapRateThreshold: policy?.scrapRateThreshold ?? undefined,
                  deductionMode: policy?.deductionMode ?? undefined,
                  deductionUnitAmount:
                    policy?.deductionUnitAmount ?? undefined,
                  deductionFixedAmount:
                    policy?.deductionFixedAmount ?? undefined,
                  defaultSettleRoute:
                    policy?.defaultSettleRoute ?? undefined,
                  autoSettle: policy?.autoSettle ?? undefined,
                  deductionItemCode: policy?.deductionItemCode ?? undefined,
                };
              }}
              onFinish={async (values) => {
                await capabilities.updateCompanyPolicy(values);
                capabilities.notifyCompanyPolicySaved();
                return true;
              }}
              submitter={{
                searchConfig: { submitText: '保存报废扣款配置' },
                render: (_, dom) => (canUpdate ? dom[1] : null),
              }}
            >
              <ProFormSwitch
                colProps={{ xs: 24, md: 12, xl: 8 }}
                name="scrapDeductionEnabled"
                label="启用报废超阈扣款"
                tooltip="开启后，报工报废率超过阈值时生成扣罚记录；关闭时只记录报废，不生成扣罚。"
                extra="关：只记录报废不扣款；开：报工报废率超阈生成扣罚事实"
              />
              <ProFormDigit
                colProps={{ xs: 24, md: 12, xl: 8 }}
                name="scrapRateThreshold"
                label="报废率阈值"
                tooltip="按报废数量 ÷ 报工数量计算报废率。填写 0.05 表示 5%；留空表示不判定超阈，也不自动生成扣罚。"
                min={0}
                max={1}
                fieldProps={{ step: 0.01, precision: 4 }}
                extra="0~1，如 0.05 = 5%；留空表示不判超阈、不自动扣"
              />
              <ProFormSelect
                colProps={{ xs: 24, md: 12, xl: 8 }}
                name="deductionMode"
                label="扣款计算方式"
                tooltip="选择按超出阈值的报废数量乘单价计算，或每次超阈固定扣款金额。"
                options={[
                  { label: '按超阈报废数 × 单价', value: 'per_unit' },
                  { label: '固定金额', value: 'fixed' },
                ]}
              />
              <ProFormDependency name={['deductionMode']}>
                {({ deductionMode }) =>
                  deductionMode === 'fixed' ? (
                    <ProFormDigit
                      colProps={{ xs: 24, md: 12, xl: 8 }}
                      name="deductionFixedAmount"
                      label="固定扣款金额"
                      tooltip="扣款方式选择“固定金额”时生效；每次报工报废率超阈，按此金额生成扣罚记录。"
                      min={0}
                      extra="每次超阈按此固定金额扣款"
                    />
                  ) : (
                    <ProFormDigit
                      colProps={{ xs: 24, md: 12, xl: 8 }}
                      name="deductionUnitAmount"
                      label="每超阈报废数扣款单价"
                      tooltip="扣款方式选择“按超阈报废数 × 单价”时生效。扣款金额等于超出阈值的报废数量乘此单价。"
                      min={0}
                      extra="扣款金额 = 超阈报废数 × 本单价"
                    />
                  )
                }
              </ProFormDependency>
              <ProFormSelect
                colProps={{ xs: 24, md: 12, xl: 8 }}
                name="defaultSettleRoute"
                label="默认结算去向"
                tooltip="决定扣罚记录默认进入计件工资扣减，还是生成资金流水；后续仍需按对应结算流程处理。"
                options={[
                  { label: '计件工资扣减', value: 'wage' },
                  { label: '资金流水', value: 'funds' },
                ]}
              />
              <ProFormSwitch
                colProps={{ xs: 24, md: 12, xl: 8 }}
                name="autoSettle"
                label="自动确认"
                tooltip="开启后，符合规则的扣罚记录自动确认；这不等于自动扣工资或自动收付款，后续仍需人工结算。"
                extra="关：生成待确认；开：自动确认（仍需人工结算）"
              />
              <ProFormText
                colProps={{ xs: 24, md: 12, xl: 8 }}
                name="deductionItemCode"
                label="扣款项目编码"
                tooltip="用于在扣罚记录中标识扣款项目，便于工资或资金结算时核对扣款用途。"
                placeholder="请输入扣款项目编码"
              />
            </ProForm>
          ),
        },
      ]}
    />
  );
}

export type MaterialScrapDeductionPolicySectionProps = {
  materialId: string;
  canEdit: boolean;
  capabilities: MaterialScrapDeductionPolicyCapabilities;
};

const MATERIAL_SCRAP_DEDUCTION_INITIAL_VALUES: MaterialScrapDeductionFormValues = {
  scopeMode: 'inherit',
  enabledMode: 'inherit',
};

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Keeps per-material override/inheritance behavior, mode-specific amounts, and explanatory guidance while material policy lookup, update, and save feedback remain host supplied.
 */
export function MaterialScrapDeductionPolicySection({
  materialId,
  canEdit,
  capabilities,
}: MaterialScrapDeductionPolicySectionProps) {
  return (
    <ProForm<MaterialScrapDeductionFormValues>
      grid
      rowProps={{ gutter: [16, 0] }}
      layout="vertical"
      initialValues={MATERIAL_SCRAP_DEDUCTION_INITIAL_VALUES}
      disabled={!canEdit}
      request={async () => {
        const detail = await capabilities.loadMaterialPolicy(materialId);
        return {
          scopeMode: detail?.hasOverride ? 'override' : 'inherit',
          enabledMode:
            detail?.scrapDeductionEnabled === true
              ? 'enabled'
              : detail?.scrapDeductionEnabled === false
                ? 'disabled'
                : 'inherit',
          scrapRateThreshold: detail?.scrapRateThreshold ?? undefined,
          deductionMode: detail?.deductionMode ?? undefined,
          deductionUnitAmount: detail?.deductionUnitAmount ?? undefined,
          deductionFixedAmount: detail?.deductionFixedAmount ?? undefined,
        };
      }}
      onFinish={async (values) => {
        if (values.scopeMode === 'inherit') {
          await capabilities.updateMaterialPolicy({
            materialId,
            clearOverride: true,
          });
        } else {
          await capabilities.updateMaterialPolicy({
            materialId,
            scrapDeductionEnabled:
              values.enabledMode === 'enabled'
                ? true
                : values.enabledMode === 'disabled'
                  ? false
                  : null,
            scrapRateThreshold: values.scrapRateThreshold ?? null,
            deductionMode: values.deductionMode ?? null,
            deductionUnitAmount:
              values.deductionMode === 'per_unit'
                ? (values.deductionUnitAmount ?? null)
                : null,
            deductionFixedAmount:
              values.deductionMode === 'fixed'
                ? (values.deductionFixedAmount ?? null)
                : null,
          });
        }
        capabilities.notifyMaterialPolicySaved();
        return true;
      }}
      submitter={{
        searchConfig: { submitText: '保存物料规则' },
        render: (_, dom) => (canEdit ? dom[1] : null),
      }}
    >
      <Alert
        style={{ marginBottom: 16 }}
        showIcon
        type="info"
        message="这里配置的是物料专属覆盖，不是物料参考进价或售价"
        description="未填写的项目继续使用公司默认策略。报工时系统按工单物料自动匹配，操作人员不能临时选择单价；公司总开关关闭时，本物料也不会生成扣款。"
      />
      <ProFormSelect
        colProps={{ xs: 24, md: 12, xl: 8 }}
        name="scopeMode"
        label="物料规则"
        options={[
          { label: '跟随公司默认', value: 'inherit' },
          { label: '使用物料专属规则', value: 'override' },
        ]}
        extra="未配置物料专属规则时，报工自动按公司默认策略计算"
      />
      <ProFormDependency name={['scopeMode']}>
        {({ scopeMode }) =>
          scopeMode === 'override' ? (
            <ProFormSelect
              colProps={{ xs: 24, md: 12, xl: 8 }}
              name="enabledMode"
              label="报废扣款启用方式"
              options={[
                { label: '跟随公司默认', value: 'inherit' },
                { label: '对该物料启用', value: 'enabled' },
                { label: '对该物料停用', value: 'disabled' },
              ]}
              extra="公司总开关关闭时，任何物料规则都不会生成扣款"
            />
          ) : null
        }
      </ProFormDependency>
      <ProFormDependency name={['scopeMode']}>
        {({ scopeMode }) =>
          scopeMode === 'override' ? (
            <ProFormDigit
              colProps={{ xs: 24, md: 12, xl: 8 }}
              name="scrapRateThreshold"
              label="物料报废率阈值"
              min={0}
              max={1}
              fieldProps={{ step: 0.01, precision: 4 }}
              extra="留空表示跟随公司默认"
            />
          ) : null
        }
      </ProFormDependency>
      <ProFormDependency name={['scopeMode']}>
        {({ scopeMode }) =>
          scopeMode === 'override' ? (
            <ProFormSelect
              colProps={{ xs: 24, md: 12, xl: 8 }}
              name="deductionMode"
              label="物料扣款计算方式"
              allowClear
              placeholder="跟随公司默认"
              options={[
                { label: '按超阈报废数 × 单价', value: 'per_unit' },
                { label: '固定金额', value: 'fixed' },
              ]}
            />
          ) : null
        }
      </ProFormDependency>
      <ProFormDependency name={['scopeMode', 'deductionMode']}>
        {({ scopeMode, deductionMode }) =>
          scopeMode === 'override' && deductionMode === 'per_unit' ? (
            <ProFormDigit
              colProps={{ xs: 24, md: 12, xl: 8 }}
              name="deductionUnitAmount"
              label="物料每超阈报废数扣款单价"
              min={0}
              extra="留空表示跟随公司默认单价"
            />
          ) : null
        }
      </ProFormDependency>
      <ProFormDependency name={['scopeMode', 'deductionMode']}>
        {({ scopeMode, deductionMode }) =>
          scopeMode === 'override' && deductionMode === 'fixed' ? (
            <ProFormDigit
              colProps={{ xs: 24, md: 12, xl: 8 }}
              name="deductionFixedAmount"
              label="物料固定扣款金额"
              min={0}
              extra="留空表示跟随公司默认金额"
            />
          ) : null
        }
      </ProFormDependency>
    </ProForm>
  );
}
