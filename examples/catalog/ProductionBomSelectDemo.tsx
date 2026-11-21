import { useMemo, useState } from 'react';
import { ProForm, ProFormText } from '@ant-design/pro-components';
import { Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  MesUiProvider,
  ProductionBomSelect,
  type MesProductionBomSelectCapabilities,
  type ProductionBomOption,
} from '../../src/mes';

type DemoOptionCount = 'empty' | 'single' | 'multiple';

const demoOptions: ProductionBomOption[] = [
  {
    label: '6061 铝型材 - 标准 BOM - V3',
    value: 'bom-standard-v3',
    sourceType: 'standard',
  },
  {
    label: '6061 铝型材 - 客户特规 BOM - V2',
    value: 'bom-customer-v2',
    sourceType: 'standard',
  },
];

export function ProductionBomSelectDemo() {
  const [optionCount, setOptionCount] = useState<DemoOptionCount>('single');
  const [allowBomConfig, setAllowBomConfig] = useState(true);
  const [lastSubmitted, setLastSubmitted] = useState('尚未提交');
  const capabilities = useMemo<MesProductionBomSelectCapabilities>(
    () => ({
      async requestOptions({ materialId, keyWords }) {
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        if (!materialId) return [];
        const query = keyWords?.trim().toLocaleLowerCase();
        const available =
          optionCount === 'empty'
            ? []
            : optionCount === 'single'
              ? demoOptions.slice(0, 1)
              : demoOptions;
        return query
          ? available.filter((option) =>
              option.label.toLocaleLowerCase().includes(query),
            )
          : available;
      },
      getFieldHelpProps() {
        return {
          label: 'BOM版本',
          tooltip: {
            title: (
              <div style={{ maxWidth: 380 }}>
                <Typography.Text strong>BOM版本</Typography.Text>
                <Typography.Paragraph style={{ margin: '8px 0' }}>
                  决定这次计划或建单使用哪一套用料清单，直接影响领料、成本和缺料计算。
                </Typography.Paragraph>
                <Typography.Paragraph style={{ margin: '8px 0' }}>
                  同一产品存在多个版本、替代料方案或阶段性工艺时，明确选择本次要用的 BOM 版本。如果留空，系统会在后续排产或建单时自动带入默认 BOM。
                </Typography.Paragraph>
                <Typography.Paragraph style={{ margin: 0 }}>
                  工程变更切版本、客户特规版本、试产版本时，建议手工指定。选错 BOM 版本会直接影响备料和成本核算，确认前最好与现场版本保持一致。
                </Typography.Paragraph>
              </div>
            ),
            overlayStyle: { maxWidth: 420 },
          },
        };
      },
      renderConfigEntryFieldLabel({ children, onOpen }) {
        if (!allowBomConfig) return children;
        return (
          <Space size={6} align="center" wrap={false}>
            <span>{children}</span>
            <Typography.Link
              href="/material/bom"
              target="_blank"
              rel="noreferrer"
              aria-label="新标签页打开BOM"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onOpen();
              }}
              style={{ fontSize: 12, whiteSpace: 'nowrap' }}
            >
              去配置
            </Typography.Link>
          </Space>
        );
      },
    }),
    [allowBomConfig, optionCount],
  );

  return (
    <SectionCard title="BOM 版本远程选择">
      <Typography.Paragraph type="secondary">
        保留物料/销售订单联动、唯一候选自动选中、搜索竞态保护和返回配置页后的刷新；请求、BOM 字段说明与配置权限由宿主注入。
      </Typography.Paragraph>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Segmented
          aria-label="BOM 候选数量"
          value={optionCount}
          options={[
            { label: '无候选', value: 'empty' },
            { label: '唯一候选', value: 'single' },
            { label: '多个候选', value: 'multiple' },
          ]}
          onChange={(value) => setOptionCount(value as DemoOptionCount)}
        />
        <Segmented
          aria-label="BOM 配置权限"
          value={allowBomConfig ? 'allowed' : 'denied'}
          options={[
            { label: '有配置权限', value: 'allowed' },
            { label: '无配置权限', value: 'denied' },
          ]}
          onChange={(value) => setAllowBomConfig(value === 'allowed')}
        />
        <ProForm
          initialValues={{ materialId: 'material-demo-001' }}
          submitter={{ searchConfig: { submitText: '提交表单' } }}
          onFinish={async (values) => {
            setLastSubmitted(JSON.stringify(values));
            return true;
          }}
        >
          <ProFormText
            name="materialId"
            label="物料 ID"
            tooltip="BOM 候选由当前物料决定。"
          />
          <ProFormText name="saleOrderId" label="销售订单 ID（可选）" />
          <ProFormText name="saleOrderItemId" label="销售订单明细 ID（可选）" />
          <MesUiProvider
            hasPermission={() => true}
            productionBomSelectCapabilities={capabilities}
          >
            <ProductionBomSelect />
          </MesUiProvider>
        </ProForm>
        <Typography.Text role="status" aria-live="polite">
          最近提交：{lastSubmitted}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
