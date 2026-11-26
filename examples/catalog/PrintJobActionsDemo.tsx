import { App, Space } from 'antd';
import { SectionCard } from '../../src';
import {
  PrintAction,
  PrintJobActionsProvider,
  PrintRecordsAction,
  type PrintJobActionCapabilities,
  type PrintJobRecord,
} from '../../src/business';

const html = `<!doctype html><html><head><style>body{font:14px sans-serif;padding:24px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #bbb;padding:8px}</style></head><body><h1>生产工单</h1><p>WO-2026-0188 · 示例模板预览</p><table><tr><th>物料</th><th>计划数量</th></tr><tr><td>6061 铝型材</td><td>24 米</td></tr></table></body></html>`;

const printRecord: PrintJobRecord = {
  id: 'print-job-1',
  businessType: 'work_order',
  businessId: 'WO-2026-0188',
  status: 'rendered',
  createdAt: '2026-11-20T09:20:00+08:00',
  copyCount: 1,
  template: { name: '生产工单 A4' },
  templateVersion: { versionNo: 3 },
  paperProfile: { id: 'paper-a4', name: 'A4', widthMm: 210, heightMm: 297 },
  renderSnapshotJson: { html },
};

export function PrintJobActionsDemo() {
  const { message } = App.useApp();
  const capabilities: PrintJobActionCapabilities = {
    printOptions: {
      getSceneOptions: async () => ({
        business: {
          businessType: 'work_order',
          businessName: '生产工单',
          enabled: true,
          defaultTemplateType: 'document_flow',
          supportedTemplateTypes: ['document_flow', 'continuous_fixed'],
        },
        templates: [
          { id: 'template-a4', name: '生产工单 A4', isDefault: true, templateType: 'document_flow', currentVersion: { versionNo: 3 } },
          { id: 'template-dot', name: '生产工单针打', templateType: 'continuous_fixed', currentVersion: { versionNo: 2 } },
        ],
        paperProfiles: [
          { id: 'paper-a4', name: 'A4', widthMm: 210, heightMm: 297, isDefault: true },
        ],
      }),
    },
    permissions: { canDownloadPdf: false, canConfirmPrinted: true, canReprint: true },
    messages: {
      info: (text) => message.info(text),
      warning: (text) => message.warning(text),
      error: (text) => message.error(text),
      success: (text) => message.success(text),
    },
    submitPrintJob: async () => printRecord,
    listPrintJobs: async () => ({ list: [printRecord] }),
    getPrintJobDetail: async () => printRecord,
    confirmPrintJob: async () => ({ ...printRecord, status: 'printed', printedAt: '2026-11-20T09:25:00+08:00' }),
    downloadPrintJobPdf: async () => new Blob(),
    requestPrintJobReprint: async () => ({ ...printRecord, id: 'print-job-2', status: 'rendered' }),
    isRendered: (record) => typeof record.renderSnapshotJson?.html === 'string',
    isPrinted: (record) => record.status === 'printed',
    getStatusPresentation: (status) => ({
      text: status === 'printed' ? '已打印' : '待确认',
      color: status === 'printed' ? 'success' : 'processing',
    }),
    getPdfFilename: () => 'WO-2026-0188-生产工单.pdf',
    sanitizeRenderedHtml: (source) => source.replace(/<script[\s\S]*?<\/script>/gi, ''),
    formatDateTime: (value) => value ?? '-',
  };

  return (
    <SectionCard title="打印操作与记录">
      <Space wrap>
        <PrintJobActionsProvider capabilities={capabilities}>
          <PrintAction businessType="work_order" businessId="WO-2026-0188" />
          <PrintRecordsAction businessType="work_order" businessId="WO-2026-0188" />
        </PrintJobActionsProvider>
      </Space>
    </SectionCard>
  );
}
