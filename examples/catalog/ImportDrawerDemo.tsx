import { useState } from 'react';
import { Button, Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  ImportDrawer,
  type ImportResult,
} from '../../src/business';

export function ImportDrawerDemo() {
  const [open, setOpen] = useState(false);
  const [scenario, setScenario] = useState<'success' | 'partial' | 'error'>('success');
  const [lastResult, setLastResult] = useState('尚未导入');

  const runImport = async (_base64: string): Promise<ImportResult> => {
    if (scenario === 'error') throw new Error('文件列与导入模板不匹配');
    return scenario === 'partial'
      ? { created: 4, updated: 2, skipped: 1, errors: ['第 8 行：客户名称不能为空'] }
      : { created: 8, errors: [] };
  };

  return (
    <SectionCard title="Excel 导入抽屉">
      <Typography.Paragraph type="secondary">
        保留模板下载、Excel 上传、Base64 提交、导入中状态、结果统计和逐行错误；接口与刷新动作由调用方传入。
      </Typography.Paragraph>
      <Space wrap>
        <Segmented
          aria-label="导入结果场景"
          value={scenario}
          options={[
            { label: '成功', value: 'success' },
            { label: '部分失败', value: 'partial' },
            { label: '请求错误', value: 'error' },
          ]}
          onChange={(value) => setScenario(value as typeof scenario)}
        />
        <Button type="primary" onClick={() => setOpen(true)}>打开导入</Button>
        <Typography.Text role="status" aria-live="polite">{lastResult}</Typography.Text>
      </Space>
      <ImportDrawer
        title="导入客户"
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => setLastResult('导入后已请求刷新列表')}
        downloadTemplateFn={async () =>
          new Blob(['code,name\nC-001,示例客户'], { type: 'text/csv' })
        }
        importFn={runImport}
        templateFileName="客户导入模板.csv"
        maxRows={2000}
        tips="名称与编码必填；导入前请先核对模板列名。"
      />
    </SectionCard>
  );
}
