import { QuestionCircleOutlined } from '@ant-design/icons';
import { App, Button, Space, Tooltip, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { SectionCard } from '../../src';
import { BomImportWorkbenchDrawer } from '../../src/business/components/BomImportWorkbenchDrawer';
import type {
  BomImportMaterialCandidate,
  BomImportWorkbenchCapabilities,
} from '../../src/business/components/bom-import-workbench-types';

const candidates: BomImportMaterialCandidate[] = [
  {
    id: 'candidate-frame',
    materialName: '椅架组件',
    materialCode: 'RM-FRAME-002',
    materialSpec: '钢制喷涂',
    unit: 'EA',
    baseType: 'semi',
    type: 'CHAIR_PART',
    category: '椅子部件',
    procurementType: 'make',
    status: 'pending',
    errorJson: [],
  },
  {
    id: 'candidate-wheel',
    materialName: '万向轮',
    materialCode: 'RM-WHEEL-003',
    materialSpec: '50 mm',
    unit: 'EA',
    baseType: 'raw',
    type: 'HARDWARE',
    category: '五金件',
    procurementType: 'buy',
    status: 'pending',
    errorJson: ['仓库默认值未设置'],
  },
];

const materialTypeOptions = [
  { value: 'raw', label: '原材料' },
  { value: 'semi', label: '半成品' },
  { value: 'finished', label: '成品' },
];

const procurementTypeOptions = [
  { value: 'buy', label: '外购' },
  { value: 'make', label: '自制' },
  { value: 'both', label: '自制+外购' },
  { value: 'outsource', label: '委外' },
];

export function BomImportWorkbenchDrawerDemo() {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [lastAction, setLastAction] = useState('尚未执行 BOM 导入');

  const capabilities = useMemo<BomImportWorkbenchCapabilities>(
    () => ({
      async requestProfiles() {
        return {
          list: [
            { id: 'bom-default', name: 'BOM 标准导入', isDefault: true },
            { id: 'bom-legacy', name: 'BOM 旧版表头', isDefault: false },
          ],
        };
      },
      async requestTemplate() {
        return new Blob(['rootMaterialCode,componentCode,quantity\nFG-001,RM-001,2'], {
          type: 'text/csv',
        });
      },
      async preview() {
        return {
          jobId: 'demo-bom-import-job',
          summary: {
            totalRows: 3,
            validRows: 1,
            warningRows: 1,
            errorRows: 1,
          },
          rows: [
            {
              id: 'row-valid',
              sourceRowNo: 2,
              status: 'valid',
              mappedJson: {
                rootMaterialCode: 'FG-CHAIR-001',
                componentCode: 'RM-WHEEL-003',
                quantity: 5,
              },
              errors: [],
              warnings: [],
            },
            {
              id: 'row-warning',
              sourceRowNo: 3,
              status: 'warning',
              mappedJson: { componentCode: 'RM-FRAME-002', quantity: 1 },
              warnings: ['系统分类将使用默认值'],
            },
            {
              id: 'row-error',
              sourceRowNo: 4,
              status: 'error',
              mappedJson: { componentCode: '', quantity: 0 },
              errors: ['成品物料编码不能为空'],
            },
          ],
        };
      },
      async requestRows() {
        return { list: [] };
      },
      async requestCandidates() {
        return { list: candidates };
      },
      async confirmCandidates({ ids }) {
        setLastAction(`已确认 ${ids.length} 个候选建料`);
        return { created: ids.length };
      },
      async ignoreCandidates({ ids }) {
        setLastAction(`已忽略 ${ids.length} 个候选`);
      },
      async execute({ allowWarnings }) {
        return allowWarnings
          ? { importedRows: 2 }
          : { errors: ['请允许警告行导入后重试'] };
      },
      notify: (type, content) => message[type](content),
      unitLabelMap: { EA: '个' },
      rowStatusLabels: {
        valid: { text: '有效', color: '#00B578' },
        warning: { text: '有警告', color: '#FF8F1F' },
        error: { text: '错误', color: '#FF3141' },
        imported: { text: '已导入', color: '#1677FF' },
      },
      candidateStatusLabels: {
        pending: { text: '待确认', color: '#FF8F1F' },
        created: { text: '已建料', color: '#00B578' },
        ignored: { text: '已忽略', color: '#999999' },
        failed: { text: '建料失败', color: '#FF3141' },
      },
      materialTypeOptions,
      procurementTypeOptions,
      renderFieldHelp: (label) => (
        <Tooltip title="候选确认信息将作为本批次新建物料的默认资料。">
          <span>
            {label} <QuestionCircleOutlined />
          </span>
        </Tooltip>
      ),
    }),
    [message],
  );

  return (
    <SectionCard title="BOM 专用导入工作台">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary">
          演示映射方案选择、逐行映射结果、物料候选确认建料/忽略与警告行导入。API、字典标签、字段帮助和消息由宿主 capabilities 提供。
        </Typography.Paragraph>
        <Space wrap>
          <Button type="primary" onClick={() => setOpen(true)}>
            打开 BOM 导入
          </Button>
          <Typography.Text role="status" aria-live="polite">
            {lastAction}
          </Typography.Text>
        </Space>
        <BomImportWorkbenchDrawer
          open={open}
          onClose={() => setOpen(false)}
          onSuccess={() => setLastAction('导入完成，宿主已请求刷新列表')}
          capabilities={capabilities}
        />
      </Space>
    </SectionCard>
  );
}
