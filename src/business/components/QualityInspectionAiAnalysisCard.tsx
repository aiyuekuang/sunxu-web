import type { ProColumns } from '@ant-design/pro-components';
import { Alert, Image, Space, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { DetailTable } from './DetailTable';

export interface QualityAiItemResult extends Record<string, unknown> {
  itemId: string;
  itemName: string;
  resultType: 'judgement' | 'selection' | 'text';
  status: 'suggest_pass' | 'suggest_fail' | 'uncertain';
  suggestedValue: string | null;
  evidence: string | null;
  photoIndexes: number[];
}

export interface QualityAiRejectedResult extends Record<string, unknown> {
  itemId: string | null;
  reason: string;
}

export interface QualityAiAnalysisRecord {
  status: string;
  modelProvider?: string | null;
  modelId?: string | null;
  promptVersion?: string | number | null;
  createdAt?: string | null;
  results?: unknown;
  rejected?: unknown;
  photoUrls?: string[] | null;
  error?: string | null;
}

export type QualityAiAnalysisCardProps = {
  inspectionId: string;
  capabilities: {
    loadAnalysis: (
      inspectionId: string,
    ) => Promise<QualityAiAnalysisRecord | null>;
    formatDateTime: (value?: string | null) => string;
  };
};

/**
 * @sunxu-layer business
 * @sunxu-domain quality-inspection
 * @sunxu-reason Preserves the read-only AI suggestion, evidence, model-version and rejected-output tables while analysis lookup and time formatting remain host supplied.
 */
export function AiAnalysisCard({
  inspectionId,
  capabilities,
}: QualityAiAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<QualityAiAnalysisRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    capabilities
      .loadAnalysis(inspectionId)
      .then((record) => {
        if (!cancelled && record) setAnalysis(record);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [capabilities, inspectionId]);

  if (!analysis) return null;

  const results = (analysis.results ?? []) as QualityAiItemResult[];
  const rejected = (analysis.rejected ?? []) as QualityAiRejectedResult[];
  const resultColumns: ProColumns<QualityAiItemResult>[] = [
    { title: '检验项目', dataIndex: 'itemName', width: 160 },
    {
      title: 'AI建议',
      dataIndex: 'status',
      width: 110,
      render: (_, row) =>
        row.status === 'suggest_pass' ? (
          <Tag color="success">建议合格</Tag>
        ) : row.status === 'suggest_fail' ? (
          <Tag color="error">建议不合格</Tag>
        ) : (
          <Tag>无法判断</Tag>
        ),
    },
    {
      title: '建议值',
      dataIndex: 'suggestedValue',
      width: 120,
      render: (_, row) =>
        row.resultType === 'judgement' ? '-' : (row.suggestedValue ?? '-'),
    },
    { title: 'AI依据', dataIndex: 'evidence', ellipsis: true },
    {
      title: '引用照片',
      dataIndex: 'photoIndexes',
      width: 100,
      render: (_, row) =>
        row.photoIndexes?.length ? `第 ${row.photoIndexes.join('、')} 张` : '-',
    },
  ];

  return (
    <div>
      <Space size={8} style={{ marginBottom: 8 }} wrap>
        <Typography.Text strong>拍照质检 AI 分析</Typography.Text>
        {analysis.status === 'done' ? (
          <Tag color="success">完成</Tag>
        ) : analysis.status === 'failed' ? (
          <Tag color="error">失败</Tag>
        ) : (
          <Tag color="processing">分析中</Tag>
        )}
        <Typography.Text type="secondary">
          模型：{analysis.modelProvider ?? '-'} / {analysis.modelId ?? '-'} ·
          提示词版本：
          {analysis.promptVersion ?? '-'} · 分析时间：
          {capabilities.formatDateTime(analysis.createdAt)}
        </Typography.Text>
      </Space>

      <DetailTable<QualityAiItemResult>
        rowKey="itemId"
        dataSource={results}
        columns={resultColumns}
        options={false}
        pagination={false}
      />

      {analysis.photoUrls?.length ? (
        <Space size={8} style={{ marginTop: 8 }} wrap>
          <Typography.Text type="secondary">本次分析照片：</Typography.Text>
          <Image.PreviewGroup>
            {analysis.photoUrls.map((url, index) => (
              <Image
                key={url}
                src={url}
                alt={`本次分析照片${index + 1}`}
                width={40}
                height={40}
                style={{ objectFit: 'cover' }}
              />
            ))}
          </Image.PreviewGroup>
        </Space>
      ) : null}

      {analysis.error ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 8 }}
          message={`部分分析未完成：${analysis.error}`}
        />
      ) : null}

      {rejected.length ? (
        <div style={{ marginTop: 8 }}>
          <DetailTable<QualityAiRejectedResult>
            headerTitle="模型输出中被服务端拒绝的项"
            rowKey={(row) => `${row.itemId ?? 'unknown'}-${row.reason}`}
            dataSource={rejected}
            columns={[
              {
                title: '检验项',
                dataIndex: 'itemId',
                width: 260,
                ellipsis: true,
              },
              { title: '拒绝原因', dataIndex: 'reason' },
            ]}
            options={false}
            pagination={false}
          />
        </div>
      ) : null}
    </div>
  );
}
