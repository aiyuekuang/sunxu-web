import { useMemo, useState } from 'react';
import { Form, Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  BomIssueOperationSelect,
  useBomIssueOperationOptions,
  type BomIssueOperationCapabilities,
  type BomIssueOperationBindingSelection,
} from '../../src/mes';

const candidates = [
  {
    routeMasterId: 'route-m-1',
    routeId: 'route-v-3',
    code: 'RT-MOTOR',
    name: '电机装配路线',
    versionLabel: 'V3',
  },
  {
    routeMasterId: 'route-m-2',
    routeId: 'route-v-2',
    code: 'RT-CASE',
    name: '壳体加工路线',
    versionLabel: 'V2',
  },
];

const operations = {
  'route-v-3': [
    { code: 'OP-CUT', name: '下料', sequence: 10, stageNo: 1 },
    { code: 'OP-ASSEMBLY', name: '总装', sequence: 20, stageNo: 2 },
  ],
  'route-v-2': [
    { code: 'OP-CNC', name: 'CNC 加工', sequence: 10, stageNo: 1 },
  ],
};

export function BomIssueOperationSelectDemo() {
  const [materialId, setMaterialId] = useState<string | undefined>('material-1');
  const [value, setValue] = useState<BomIssueOperationBindingSelection[]>([
    {
      routeMasterId: 'route-retired',
      operationCode: 'OP-LEGACY',
      phaseCode: '旧阶段',
    },
  ]);
  const capabilities = useMemo<BomIssueOperationCapabilities>(
    () => ({
      async listRouteCandidates() {
        await new Promise((resolve) => window.setTimeout(resolve, 180));
        return { candidates };
      },
      async getRouteDetail({ id }) {
        await new Promise((resolve) => window.setTimeout(resolve, 100));
        return { operations: operations[id as keyof typeof operations] ?? [] };
      },
      getRouteSelectionDate: () => '2026-11-21T00:00:00.000Z',
    }),
    [],
  );
  const { options, loading } = useBomIssueOperationOptions(
    materialId,
    capabilities,
  );

  return (
    <SectionCard title="BOM 投料工序绑定">
      <Typography.Paragraph type="secondary">
        每条路线只能绑定一个投料工序；切换路线版本后，无法识别的历史绑定仍保留并可搜索。
      </Typography.Paragraph>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Segmented
          aria-label="父项物料"
          value={materialId ?? 'none'}
          options={[
            { label: '已有父项物料', value: 'material-1' },
            { label: '未选择物料', value: 'none' },
          ]}
          onChange={(next) =>
            setMaterialId(next === 'none' ? undefined : String(next))
          }
        />
        <Form layout="vertical">
          <Form.Item label="投料工序">
            <BomIssueOperationSelect
              materialId={materialId}
              options={options}
              loading={loading}
              value={value}
              onChange={setValue}
            />
          </Form.Item>
        </Form>
        <Typography.Text type="secondary">
          当前绑定：{value.map((item) => `${item.routeMasterId}/${item.operationCode}`).join('，') || '无'}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
