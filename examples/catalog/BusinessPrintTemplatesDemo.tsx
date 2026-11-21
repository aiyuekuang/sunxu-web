import { useState } from 'react';
import { Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  DeliveryNoteDotMatrixPrint,
  DeliveryNotePrint,
  InspectionReportPrint,
  MaterialIssuePrint,
  ProcessCardPrint,
  PurchaseOrderDotMatrixPrint,
  PurchaseOrderPrint,
  PurchaseReceiptPrint,
  SaleOrderPrint,
  WorkOrderPrint,
  type BusinessPrintRecord,
  type MesInternalDocumentQrKind,
} from '../../src/mes';

const templateOptions = [
  { label: '送货单针打', value: 'delivery-dot' },
  { label: '送货单 A4', value: 'delivery' },
  { label: '质检报告', value: 'inspection' },
  { label: '领料单', value: 'issue' },
  { label: '工序流转卡', value: 'process' },
  { label: '采购单针打', value: 'purchase-dot' },
  { label: '采购订单', value: 'purchase' },
  { label: '采购入库单', value: 'receipt' },
  { label: '销售订单', value: 'sale' },
  { label: '生产工单', value: 'work-order' },
] as const;

type TemplateKey = (typeof templateOptions)[number]['value'];

const detail: BusinessPrintRecord = {
  id: 2026112001,
  deliveryNo: 'DN-2026-0321',
  issueNo: 'MI-2026-0088',
  inspectionNo: 'QI-2026-0056',
  orderNo: 'PO-2026-0198',
  receiptNo: 'GR-2026-0102',
  partnerNameSnapshot: '苏州示例客户',
  contactNameSnapshot: '王女士',
  contactPhoneSnapshot: '0512-6688-2200',
  addressSnapshot: '苏州市工业园区示例路 88 号',
  deliveryDate: '2026-11-20',
  expectedDate: '2026-11-28',
  receiptDate: '2026-11-20',
  createdAt: '2026-11-20T08:30:00+08:00',
  submittedAt: '2026-11-20T09:00:00+08:00',
  remarks: '请按批次分别包装。',
  paymentTerms: 'monthly',
  purchasingRep: { realName: '李采购' },
  salesRep: { realName: '陈销售' },
  creator: { realName: '周文' },
  inspector: { realName: '赵质检' },
  operator: { realName: '孙操作' },
  assignee: { realName: '吴班组长' },
  warehouse: { name: '一号原料库' },
  saleOrder: { orderNo: 'SO-2026-0142' },
  purchaseOrder: { orderNo: 'PO-2026-0198' },
  operation: { name: '精加工' },
  customer: { name: '苏州示例客户' },
  material: {
    name: '6061 铝型材',
    code: 'RM-AL-0081',
    spec: '20 × 40 mm',
    unit: 'M',
  },
  items: [
    {
      id: 'line-1',
      material: {
        name: '6061 铝型材',
        code: 'RM-AL-0081',
        spec: '20 × 40 mm',
        unit: 'M',
      },
      customerMaterialName: '铝型材',
      customerMaterialCode: 'CUS-AL-01',
      customerMaterialSpec: '20 × 40 mm',
      quantity: 24,
      unit: 'M',
      batchNo: 'B-20261120-01',
      remarks: '首批送货',
      amount: 1280,
      unitPrice: 53.33,
      taxRate: 0.13,
      inspectionItems: [
        { itemName: '尺寸', result: '合格', standard: '20 × 40 mm' },
      ],
    },
  ],
  operations: [
    {
      id: 11,
      sequence: 1,
      operationId: 21,
      operationName: '切割',
      plannedQty: 24,
      completedQty: 12,
      scrappedQty: 0,
      status: 'in_progress',
      assignee: { realName: '吴师傅' },
      processName: '切割工序',
    },
  ],
  conclusion: 'passed',
  type: 'incoming',
  status: 'in_progress',
  sampleQty: 3,
  defects: [],
  disposalNote: '',
  issueType: 'production',
  plannedQty: 24,
  completedQty: 12,
  bottleneckCompletedQty: 12,
  scrappedQty: 0,
  overallProgress: 50,
  planStartTime: '2026-11-20',
  planEndTime: '2026-11-22',
  dueDate: '2026-11-22',
  priority: 'normal',
  description: '首件确认后批量生产。',
};
const processDetail = { ...detail, operations: detail.operations ?? [] };

const unitLabelMap = { M: '米' };
const renderBarcode = (value: string) => (
  <span aria-label={`二维码预览 ${value}`} style={{ fontSize: 48, lineHeight: 1 }}>
    ▦
  </span>
);
const buildDocumentQr = (kind: MesInternalDocumentQrKind, id: string | number) =>
  `mes:${kind}:${id}`;
const buildOperationQr = (workOrderId: string | number, operationId: string | number) =>
  `mes:work-order:${workOrderId}:operation:${operationId}`;
const maskAmount = (value: string) => value;

export function BusinessPrintTemplatesDemo() {
  const [template, setTemplate] = useState<TemplateKey>('delivery');

  const preview = (() => {
    switch (template) {
      case 'delivery-dot':
        return <DeliveryNoteDotMatrixPrint detail={detail} unitLabelMap={unitLabelMap} companyName="苏州示例制造" />;
      case 'delivery':
        return <DeliveryNotePrint detail={detail} unitLabelMap={unitLabelMap} renderBarcode={renderBarcode} buildDocumentQr={buildDocumentQr} />;
      case 'inspection':
        return <InspectionReportPrint detail={detail} renderBarcode={renderBarcode} buildDocumentQr={buildDocumentQr} inspectionTypeLabels={{ incoming: '来料检验' }} inspectionStatusLabels={{ in_progress: '检验中' }} inspectionResultLabels={{ passed: '合格', failed: '不合格' }} formatQualitySpecTypeLabel={(value) => value} formatInspectionConclusion={(value) => value} />;
      case 'issue':
        return <MaterialIssuePrint detail={detail} unitLabelMap={unitLabelMap} renderBarcode={renderBarcode} buildDocumentQr={buildDocumentQr} issueTypeLabels={{ production: '生产领料' }} />;
      case 'process':
        return <ProcessCardPrint detail={processDetail} unitLabelMap={unitLabelMap} renderBarcode={renderBarcode} buildDocumentQr={buildDocumentQr} buildOperationQr={buildOperationQr} qualityFlowLabels={{ blocked: '待检', ready: '可流转' }} />;
      case 'purchase-dot':
        return <PurchaseOrderDotMatrixPrint detail={detail} unitLabelMap={unitLabelMap} paymentTermsLabelMap={{ monthly: '月结' }} maskAmount={maskAmount} companyName="苏州示例制造" />;
      case 'purchase':
        return <PurchaseOrderPrint detail={detail} unitLabelMap={unitLabelMap} paymentTermsLabelMap={{ monthly: '月结' }} maskAmount={maskAmount} renderBarcode={renderBarcode} buildDocumentQr={buildDocumentQr} />;
      case 'receipt':
        return <PurchaseReceiptPrint detail={detail} unitLabelMap={unitLabelMap} renderBarcode={renderBarcode} buildDocumentQr={buildDocumentQr} />;
      case 'sale':
        return <SaleOrderPrint detail={detail} unitLabelMap={unitLabelMap} paymentTermsOptions={[{ value: 'monthly', label: '月结' }]} maskAmount={maskAmount} />;
      case 'work-order':
        return <WorkOrderPrint detail={detail} unitLabelMap={unitLabelMap} renderBarcode={renderBarcode} buildDocumentQr={buildDocumentQr} workOrderStatusLabels={{ in_progress: '进行中' }} operationStatusLabels={{ in_progress: '进行中' }} />;
    }
  })();

  return (
    <SectionCard title="MES 单据打印模板">
      <Typography.Paragraph type="secondary">
        10 种 MES 打印模板保留各自字段、明细、汇总和签字区域；二维码编码、字典文案与金额脱敏由宿主注入。
      </Typography.Paragraph>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Segmented
          aria-label="选择打印模板"
          block
          value={template}
          options={templateOptions.map(({ label, value }) => ({ label, value }))}
          onChange={(value) => setTemplate(value as TemplateKey)}
        />
        <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto' }}>
          {preview}
        </div>
      </Space>
    </SectionCard>
  );
}
