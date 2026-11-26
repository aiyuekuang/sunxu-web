import { SectionCard } from '../../src';
import { AiAnalysisCard } from '../../src/business';

const photoUrl = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="12" fill="#e6f4ff"/><path d="M15 70 35 46l14 16 10-12 22 20H15Z" fill="#1677ff"/><circle cx="34" cy="31" r="8" fill="#69b1ff"/></svg>',
)}`;

const analysis = {
  status: 'done',
  modelProvider: 'vision-model',
  modelId: 'quality-v4',
  promptVersion: '2026-08',
  createdAt: '2026-11-21T08:30:00Z',
  results: [
    {
      itemId: 'item-appearance',
      itemName: '外观检查',
      resultType: 'judgement' as const,
      status: 'suggest_pass' as const,
      suggestedValue: null,
      evidence: '照片中表面平整，未识别到明显划伤。',
      photoIndexes: [1, 2],
    },
    {
      itemId: 'item-marking',
      itemName: '标识检查',
      resultType: 'text' as const,
      status: 'uncertain' as const,
      suggestedValue: '无法确认',
      evidence: '批次字符局部被反光遮挡。',
      photoIndexes: [2],
    },
  ],
  rejected: [
    { itemId: 'removed-item', reason: '该检验项已不在当前模板中。' },
  ],
  photoUrls: [photoUrl, photoUrl],
  error: null,
};

export function QualityInspectionAiAnalysisCardDemo() {
  return (
    <SectionCard title="质检 AI 分析记录">
      <AiAnalysisCard
        inspectionId="inspection-001"
        capabilities={{
          loadAnalysis: async () => analysis,
          formatDateTime: (value) =>
            value ? new Date(value).toLocaleString('zh-CN') : '—',
        }}
      />
    </SectionCard>
  );
}
