import { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  ImportWorkbenchDrawer,
  MesUiProvider,
  type MesImportWorkbenchCapabilities,
} from '../../src/mes';

const demoCapabilities: MesImportWorkbenchCapabilities = {
  requestTemplate: async () =>
    new Blob(['code,name\nM-001,示例物料'], { type: 'text/csv' }),
  preview: async () => ({
    jobId: 'demo-import-job',
    summary: { totalRows: 3, validRows: 1, warningRows: 1, errorRows: 1 },
    rows: [
      { id: '1', sourceRowNo: 2, status: 'valid' },
      {
        id: '2',
        sourceRowNo: 3,
        status: 'warning',
        warnings: ['物料分类将使用默认分类'],
      },
      {
        id: '3',
        sourceRowNo: 4,
        status: 'error',
        errors: ['物料编码不能为空'],
      },
    ],
  }),
  requestRows: async () => ({ list: [] }),
  execute: async ({ allowWarnings }) =>
    allowWarnings
      ? { importedRows: 2 }
      : { errors: ['请允许警告行导入后重试'] },
};

export function ImportWorkbenchDrawerDemo() {
  const [open, setOpen] = useState(false);
  const [lastAction, setLastAction] = useState('尚未执行导入');

  return (
    <SectionCard title="MES 快速导入工作台">
      <Typography.Paragraph type="secondary">
        覆盖多目标切换、权限过滤、模板下载、Excel 预览、警告策略和逐行错误/警告；服务由 MES 宿主注入。
      </Typography.Paragraph>
      <Space wrap>
        <Button type="primary" onClick={() => setOpen(true)}>
          打开快速导入
        </Button>
        <Typography.Text role="status" aria-live="polite">
          {lastAction}
        </Typography.Text>
      </Space>
      <MesUiProvider
        hasPermission={(permission) => permission !== 'mes:import:supplier'}
        importWorkbenchCapabilities={demoCapabilities}
      >
        <ImportWorkbenchDrawer
          open={open}
          title="批量导入"
          targets={[
            {
              value: 'material',
              label: '物料档案',
              requiredPermission: 'mes:import:material',
            },
            {
              value: 'customer',
              label: '客户档案',
              requiredPermission: 'mes:import:customer',
            },
            {
              value: 'supplier',
              label: '供应商档案',
              requiredPermission: 'mes:import:supplier',
            },
          ]}
          onClose={() => setOpen(false)}
          onSuccess={() => setLastAction('导入完成，宿主已请求刷新列表')}
        />
      </MesUiProvider>
    </SectionCard>
  );
}
