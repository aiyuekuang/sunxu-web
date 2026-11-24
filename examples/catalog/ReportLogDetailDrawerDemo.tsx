import { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  ReportLogDetailDrawer,
  type ReportLogDetailRecord,
} from '../../src/mes';

const reportLog: ReportLogDetailRecord = {
  id: 'report-log-demo-001',
  type: 'report',
  completedQty: 120,
  scrappedQty: 2,
  createdAt: '2026-11-21T08:30:00+08:00',
  workOrderId: 'work-order-demo-001',
  reportedBy: 'user-demo-001',
  operationId: 'operation-demo-001',
  scheduleEntryId: 'schedule-entry-demo-001',
  operationName: 'CNC 加工',
  quantityRole: 'output',
  executionQty: 120,
  executionUnit: 'piece',
  reportedOperationQty: 120,
  reportedOperationUnit: 'piece',
  convertedCompletedQty: 120,
  convertedScrappedQty: 2,
  batchNo: 'LOT-2026-1121',
  equipmentName: 'CNC-01',
  timeSource: 'session',
  equipmentSessionId: 'session-demo-001',
  workCenterId: 'work-center-demo-001',
  payPreview: {
    visible: true,
    payMode: 'piece',
    priceConfigured: true,
    unitPrice: 1.25,
    unitName: '件',
    estimatedAmount: 150,
  },
  durationMinutes: 45,
  isAuxiliary: false,
  pieceworkQtyBasisSnapshot: 'product_qty',
  scrapReason: '外观划伤',
  photoUrls: [],
  scrapPhotoUrls: [],
  startedAt: '2026-11-21T07:45:00+08:00',
  endedAt: '2026-11-21T08:30:00+08:00',
  occurredAt: '2026-11-21T08:30:00+08:00',
  productionScrapId: 'scrap-demo-001',
  productionScrapNo: 'SC-2026-001',
  productionScrapStatus: 'pending_quality',
  productionScrapResolvedScrapQty: 0,
  productionScrapResolvedNonScrapQty: 0,
  productionScrapResolvedConcessionQty: 0,
  productionScrapPendingQty: 2,
  remark: '演示用报工记录',
  reporterName: '张师傅',
  orderNo: 'WO-2026-001',
  workOrderStatus: 'in_progress',
  materialName: '铝合金支架',
  materialCode: 'MAT-AL-001',
  materialSpec: '6061-T6',
  materialUnit: 'piece',
};

const statusDictionaries = {
  workOrder: {
    in_progress: { text: '进行中', color: '#FF8F1F' },
  },
  productionScrap: {
    pending_quality: { text: '质量待判定', color: '#FAAD14' },
  },
  quantityRole: {
    output: { text: '产出数量', color: '#00B578' },
  },
  timeSource: {
    session: { text: '上机会话', color: '#1677FF' },
  },
  pieceworkQtyBasis: {
    product_qty: { text: '按产品良品', color: '#00B578' },
  },
};

export function ReportLogDetailDrawerDemo() {
  const [open, setOpen] = useState(false);
  const [lastAction, setLastAction] = useState('尚未导航');

  return (
    <SectionCard title="报工记录详情抽屉">
      <Typography.Paragraph type="secondary">
        展示报工数量、工时、报废处置、现场照片与追溯标识；状态字典、查看权限、时间/工价/报废率格式和导航由宿主注入。
      </Typography.Paragraph>
      <Space orientation="vertical" size={8}>
        <Button type="primary" onClick={() => setOpen(true)}>
          查看报工详情
        </Button>
        <Typography.Text type="secondary" aria-live="polite">
          {lastAction}
        </Typography.Text>
      </Space>
      <ReportLogDetailDrawer
        open={open}
        record={reportLog}
        materialUnitLabelMap={{ piece: '件' }}
        operationUnitLabelMap={{ piece: '件' }}
        statusDictionaries={statusDictionaries}
        canViewProductionScrap
        formatDateTimeSeconds={(value) => value ?? '—'}
        formatPayPreviewText={(value) =>
          value?.estimatedAmount == null
            ? value?.message ?? '—'
            : `¥${value.estimatedAmount.toFixed(2)}`
        }
        getScrapRatePresentation={({ type, completedQty, scrappedQty }) => {
          if (type !== 'report') return null;
          const total = completedQty + scrappedQty;
          if (total <= 0) return null;
          const rate = scrappedQty / total;
          return {
            text: `${(rate * 100).toFixed(1)}%`,
            color: rate <= 0 ? 'success' : rate <= 0.02 ? 'warning' : 'error',
          };
        }}
        navigate={(path) => setLastAction(`宿主路由：${path}`)}
        onClose={() => setOpen(false)}
      />
    </SectionCard>
  );
}
