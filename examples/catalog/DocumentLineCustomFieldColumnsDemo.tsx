import { useMemo, useState } from 'react';
import { Button, Form, Space, Table as AntdTable, Typography } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import { SectionCard } from '../../src';
import {
  applyDocumentLineCustomFieldRuntimePreview,
  buildDocumentLineCustomFieldRuntimePreviewItems,
  buildDocumentLineCustomValuePayload,
  createDocumentLineCustomFieldColumns,
  createDocumentLineCustomFieldColumnsForAntd,
  createDocumentLineCustomFieldLineColumns,
  summarizeDocumentLineCustomFields,
  type DocumentLineCustomFieldCarrier,
  type DocumentLineCustomFieldSchema,
} from '../../src/business';

interface DemoLine extends DocumentLineCustomFieldCarrier {
  _key: string;
  qty: number;
}

const schema: DocumentLineCustomFieldSchema = {
  schemaVersion: 7,
  systemFields: [{ key: 'quantity', label: '数量', dataType: 'decimal' }],
  fields: [
    {
      fieldKey: 'drawingRevision',
      label: '图纸版本',
      fieldKind: 'input',
      dataType: 'text',
      requiredPolicy: 'create',
      displayJson: {
        showInForm: true,
        showInDetail: true,
        showInList: true,
        listWidth: 180,
        sortOrder: 10,
      },
    },
    {
      fieldKey: 'inspectionLevel',
      label: '检验等级',
      fieldKind: 'input',
      dataType: 'select',
      displayJson: {
        showInForm: true,
        showInDetail: true,
        showInList: true,
        sortOrder: 20,
      },
      optionsJson: {
        options: [
          { label: '常规', value: 'normal' },
          { label: '加严', value: 'strict' },
        ],
      },
    },
    {
      fieldKey: 'manualClear',
      label: '可清空字段',
      fieldKind: 'input',
      dataType: 'text',
      displayJson: { showInForm: true, showInDetail: true, sortOrder: 25 },
    },
    {
      fieldKey: 'sourceMappedField',
      label: '来源自动带出字段',
      fieldKind: 'input',
      dataType: 'text',
      displayJson: { showInForm: true, showInDetail: true, sortOrder: 27 },
    },
    {
      fieldKey: 'inspectionScore',
      label: '计算得分',
      fieldKind: 'formula',
      dataType: 'decimal',
      displayJson: {
        showInForm: true,
        showInDetail: true,
        aggregateMode: 'avg',
        sortOrder: 30,
      },
    },
    {
      fieldKey: 'hiddenInput',
      label: '隐藏的输入字段',
      fieldKind: 'input',
      dataType: 'text',
      displayJson: { showInForm: false },
    },
    {
      fieldKey: 'invalidAggregate',
      label: '待校验数值',
      fieldKind: 'input',
      dataType: 'decimal',
      displayJson: { aggregateMode: 'sum' },
    },
  ],
};

export function DocumentLineCustomFieldColumnsDemo() {
  const [rows, setRows] = useState<DemoLine[]>([
    {
      _key: 'line-1',
      qty: 4,
      customValues: {
        drawingRevision: 'REV-C',
        inspectionLevel: 'strict',
        manualClear: null,
        hiddenInput: '仍保留在 payload',
        invalidAggregate: '待校验文本',
      },
      customComputedValues: { inspectionScore: 8 },
      customComputedErrors: {},
    },
    {
      _key: 'line-2',
      qty: 6,
      customValues: {
        drawingRevision: 'REV-D',
        inspectionLevel: 'normal',
        invalidAggregate: 2,
      },
      customComputedValues: { inspectionScore: 4 },
      customComputedErrors: {},
    },
  ]);
  const lineColumns = useMemo(
    () => createDocumentLineCustomFieldLineColumns<DemoLine>(schema),
    [],
  );
  const proColumns = useMemo(
    () => createDocumentLineCustomFieldColumns<DemoLine>(schema),
    [],
  );
  const antdColumns = useMemo(
    () => createDocumentLineCustomFieldColumnsForAntd<DemoLine>(schema),
    [],
  );
  const row = rows[0];
  const previewItems = buildDocumentLineCustomFieldRuntimePreviewItems(
    rows,
    schema,
  );
  const sparseRows = useMemo(() => {
    const sparse = new Array<DemoLine | null>(2);
    sparse[1] = null;
    return sparse;
  }, []);
  const denseSparsePreviewItems =
    buildDocumentLineCustomFieldRuntimePreviewItems(sparseRows, schema);
  const summaries = summarizeDocumentLineCustomFields(rows, schema);
  const payload = buildDocumentLineCustomValuePayload(row, schema);

  const updateFirstRow = (patch: Partial<DemoLine>) => {
    setRows((current) =>
      current.map((item, index) =>
        index === 0 ? { ...item, ...patch } : item,
      ),
    );
  };

  const applyPreview = () => {
    setRows((current) =>
      applyDocumentLineCustomFieldRuntimePreview(current, [
        {
          customComputedValues: { inspectionScore: 9 },
          customComputedErrors: {},
        },
        {
          customComputedValues: { inspectionScore: 5 },
          customComputedErrors: {},
        },
      ]),
    );
  };

  return (
    <SectionCard title="单据行自定义字段列与 payload">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary">
          字段 schema、草稿行、运行时预览结果和保存动作均由宿主提供；Sunxu
          统一生成编辑列、详情列及 payload 投影，不发起请求或持久化。
        </Typography.Paragraph>
        <Form layout="vertical">
          <Space wrap align="start">
            {lineColumns.map((column) => (
              <Form.Item key={column.key} label={column.title}>
                {column.render(row, 0, updateFirstRow)}
              </Form.Item>
            ))}
          </Space>
        </Form>
        <Space wrap>
          <Button onClick={applyPreview}>应用模拟公式预览</Button>
          <Typography.Text>
            汇总：{summaries.map((item) => `${item.label} ${item.value}`).join(' / ')}
          </Typography.Text>
        </Space>
        <Typography.Text
          code
          style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          Runtime preview: {JSON.stringify(previewItems)}
        </Typography.Text>
        <Typography.Text
          code
          style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          Sparse rows → dense preview: {JSON.stringify(denseSparsePreviewItems)}
        </Typography.Text>
        <Typography.Text
          code
          style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          Payload: {JSON.stringify(payload)}
        </Typography.Text>
        <div
          role="region"
          aria-label="ProColumns 单据行自定义字段列示例"
          style={{ maxWidth: '100%', overflowX: 'auto' }}
        >
          <ProTable<DemoLine>
            headerTitle={false}
            search={false}
            options={false}
            pagination={false}
            rowKey="_key"
            columns={proColumns}
            dataSource={rows}
            scroll={{ x: 'max-content' }}
          />
        </div>
        <div
          role="region"
          aria-label="Ant Design 单据行自定义字段列示例"
          style={{ maxWidth: '100%', overflowX: 'auto' }}
        >
          <AntdTable<DemoLine>
            size="small"
            pagination={false}
            rowKey="_key"
            columns={antdColumns}
            dataSource={rows}
            scroll={{ x: 'max-content' }}
          />
        </div>
      </Space>
    </SectionCard>
  );
}
