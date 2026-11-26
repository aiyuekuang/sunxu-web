import { useMemo, useState } from 'react';
import { App, Button, Modal, Space, Typography } from 'antd';
import { MesUiProvider } from '../../src/business/MesUiProvider';
import { QuotationBindMaterialsModal } from '../../src/business/components/QuotationBindMaterialsModal';
import { QuotationFormDrawer } from '../../src/business/components/QuotationFormDrawer';
import { SendQuotationModal } from '../../src/business/components/SendQuotationModal';
import type {
  QuotationBindMaterialsCapabilities,
} from '../../src/business/components/quotation-bind-materials-modal-types';
import type {
  QuotationFormDrawerCapabilities,
  QuotationRecord,
} from '../../src/business/components/quotation-form-drawer-types';
import type {
  QuotationSendChannel,
  SendQuotationCapabilities,
} from '../../src/business/components/send-quotation-modal-types';
import type { MesBomCostSnapshotCapabilities } from '../../src/business/components/bom-cost-types';
import type { MesCustomFieldFormCapabilities } from '../../src/business/components/custom-field-form-types';
import type { MesOrderItemEditorCapabilities } from '../../src/business/components/order-item-editor-types';
import type { MesMasterDataQuickCreateCapabilities } from '../../src/business/components/master-data-quick-create-types';
import type { MesMaterialSelectCapabilities } from '../../src/business/components/material-select-types';

const demoMaterials = [
  {
    value: 'material-profile-demo',
    label: '6061 铝型材 · RM-AL-0081',
    code: 'RM-AL-0081',
    name: '6061 铝型材',
    spec: '20 × 40 mm',
    unit: 'M',
  },
  {
    value: 'material-case-demo',
    label: '标准包装箱 · PK-BOX-0003',
    code: 'PK-BOX-0003',
    name: '标准包装箱',
    spec: '400 × 300 × 250 mm',
    unit: 'EA',
  },
];

const demoQuotation: QuotationRecord = {
  id: 'quotation-demo-001',
  quotationNo: 'XSBJ-DEMO-001',
  customerId: 'customer-demo',
  salesRepId: 'user-demo',
  quotationDate: '2026-11-20',
  validUntil: '2026-12-20',
  paymentTerms: '月结 30 天',
  remarks: '目录演示报价单',
  items: [
    {
      id: 'quotation-line-material',
      materialId: 'material-profile-demo',
      material: {
        id: 'material-profile-demo',
        code: 'RM-AL-0081',
        name: '6061 铝型材',
        spec: '20 × 40 mm',
        unit: 'M',
        baseType: 'raw',
      },
      quantity: 24,
      unitPrice: 53.33,
      currency: 'CNY',
      priceIncludesTax: false,
      taxRate: 13,
      selectedBomHeaderId: 'bom-profile-demo',
      bomSelectionSource: 'manual',
      bomSelectionReason: '报价阶段人工确认',
      bomCostSnapshot: { lines: [], totalMaterialCost: 0, hasUnpriced: false },
      imageUrls: [],
    },
    {
      id: 'quotation-line-temporary',
      materialId: null,
      quantity: 1,
      unitPrice: 18.5,
      currency: 'CNY',
      customerMaterialCode: 'CUS-PART-008',
      customerMaterialName: '客户定制连接片',
      customerMaterialSpec: '按图加工，表面阳极氧化',
      remarks: '样件确认后安排量产',
      imageUrls: [],
    },
  ],
};

const lineSchema = {
  schemaVersion: 1,
  fields: [
    {
      fieldKey: 'customerDrawingRevision',
      label: '客户图纸版本',
      fieldKind: 'input',
      dataType: 'text',
      requiredPolicy: 'none',
      isActive: true,
      displayJson: { showInForm: true, sortOrder: 1 },
    },
  ],
};

/** Host adapters below stand in for APIs, permission results and feedback. */
export function QuotationComponentsDemo() {
  const { message } = App.useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bindOpen, setBindOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [lastAction, setLastAction] = useState('尚未执行报价操作');

  const notifications = useMemo(
    () => ({
      error: (text: string) => message.error(text),
      success: (text: string) => message.success(text),
      warning: (text: string) => message.warning(text),
      info: (text: string) => message.info(text),
    }),
    [message],
  );

  const sendCapabilities = useMemo<SendQuotationCapabilities>(
    () => ({
      fetchOptions: async ({ id }) => ({
        quotationId: id,
        quotationNo: demoQuotation.quotationNo ?? '',
        customerName: '示例客户',
        emailSubject: `报价单 ${demoQuotation.quotationNo}`,
        messageContent: '您好，附件为本次报价单，请查收。',
        attachmentFilename: `${demoQuotation.quotationNo}.pdf`,
        attachmentPreviewable: false,
        options: [
          { channel: 'email', label: '邮件直发', target: 'buyer@example.test', canDirectSend: true },
          { channel: 'share', label: '系统分享', canDirectSend: false },
          { channel: 'copy', label: '复制报价全文', canDirectSend: false },
          { channel: 'manual', label: '仅标记已发送', canDirectSend: false },
          { channel: 'wechat', label: '微信分享', canDirectSend: false },
          { channel: 'wecom', label: '企业微信分享', canDirectSend: false },
          { channel: 'feishu', label: '飞书分享', canDirectSend: false },
        ],
      }),
      send: async (_payload, channel: QuotationSendChannel) => {
        setLastAction(`已模拟报价发送渠道：${channel}`);
      },
      fetchAttachmentPdf: async () => new Blob([]),
      downloadAttachment: (_value, filename) =>
        message.info(`示例报价附件下载：${filename}`),
      notifications,
      getSubmitSuccessMessage: (channel) =>
        channel === 'email'
          ? '邮件已发送'
          : channel === 'copy'
            ? '已复制全部报价文本并标记发送'
            : channel === 'manual'
              ? '已标记为已发送'
              : '已复制文案并调起系统分享',
      getCopyWarningMessage: (channel) =>
        channel === 'copy'
          ? '确认后将复制发送文案。'
          : '确认后将复制发送文案，并调起系统分享应用。',
    }),
    [notifications],
  );

  const formCapabilities = useMemo<QuotationFormDrawerCapabilities>(
    () => ({
      canViewPrices: true,
      loadQuotation: async () => demoQuotation,
      createQuotation: async (payload) => {
        setLastAction(`已模拟新建报价，${payload.items.length} 条明细`);
        return { ...demoQuotation, id: 'quotation-demo-created' };
      },
      updateQuotation: async (payload) => {
        setLastAction(`已模拟更新报价，${payload.items.length} 条明细`);
        return demoQuotation;
      },
      uploadImages: async (files) =>
        files.map((_, index) => `https://example.test/quotation-image-${index + 1}.png`),
      requestCustomerPriorityMaterialOptions: async (params) => {
        const keyword = String(params.query?.keyWords ?? '').toLowerCase();
        return demoMaterials.filter((item) =>
          `${item.label} ${item.code}`.toLowerCase().includes(keyword),
        );
      },
      listCustomerMaterials: async () => [
        {
          materialId: demoMaterials[0].value,
          customerMaterialCode: 'CUS-AL-001',
          customerMaterialName: '客户铝型材',
          customerMaterialSpec: '20 × 40 mm',
        },
      ],
      requestBomOptions: async () => [
        { value: 'bom-profile-demo', label: '6061 铝型材 · 标准 BOM V2' },
      ],
      resolvePriceContext: async () => ({
        customerMaterial: {
          materialId: demoMaterials[0].value,
          customerMaterialCode: 'CUS-AL-001',
          customerMaterialName: '客户铝型材',
          customerMaterialSpec: '20 × 40 mm',
        },
        price: {
          unitPrice: 53.33,
          currency: 'CNY',
          taxRate: 13,
          taxMode: 'tax_excluded',
        },
      }),
      requestActiveCustomerOptions: async () => [
        { value: 'customer-demo', label: '示例客户（C-001）' },
      ],
      requestSalesRepOptions: async () => [
        { value: 'user-demo', label: '演示销售员' },
      ],
      requestPaymentTermsOptions: async () => [
        { value: '月结 30 天', label: '月结 30 天' },
        { value: '款到发货', label: '款到发货' },
      ],
      requestQuotationItemCustomFieldSchema: async () => lineSchema,
      validateCustomValues: async () => undefined,
      saveCustomValues: async () => undefined,
      renderPaymentTermsConfigEntryLabel: ({ children, show, onOpen }) =>
        show ? (
          <Space size={6}>
            {children}
            <Button
              type="link"
              size="small"
              htmlType="button"
              onClick={() => {
                onOpen();
                message.info('由宿主打开收款条件字典配置');
              }}
            >
              配置字典
            </Button>
          </Space>
        ) : (
          children
        ),
      fieldHelp: {
        salesProps: (label) => ({ label }),
        salesLabel: (label) => label,
        automaticProps: (label) => ({ label }),
      },
      notifySuccess: (text) => message.success(text),
      notifyWarning: (text) => message.warning(text),
      notifyError: (text) => message.error(text),
      messages: {
        createSuccess: '报价已创建',
        updateSuccess: '报价已更新',
        loadDetailError: '加载报价单详情失败',
        customerMaterialsLoadError: '客户料号加载失败，请稍后重试',
        customerPriceLoadError: '客户料号加载失败，请稍后重试',
        lineCustomFieldsLoadError: '加载明细自定义字段失败',
      },
    }),
    [message],
  );

  const bindCapabilities = useMemo<QuotationBindMaterialsCapabilities>(
    () => ({
      bindMaterials: async ({ items }) => {
        setLastAction(`已模拟绑定 ${items.length} 条正式物料`);
      },
      requestActiveMaterials: async (params) => {
        const keyword = params?.keyWords?.toLowerCase() ?? '';
        return demoMaterials.filter((item) =>
          `${item.label} ${item.code}`.toLowerCase().includes(keyword),
        );
      },
      renderMaterialConfigEntryLabel: ({ children, show, onOpen }) =>
        show ? (
          <Space size={6}>
            {children}
            <Button
              type="link"
              size="small"
              htmlType="button"
              onClick={() => {
                onOpen();
                message.info('由宿主打开物料配置');
              }}
            >
              配置物料
            </Button>
          </Space>
        ) : (
          children
        ),
      notifyWarning: (text) => message.warning(text),
      notifySuccess: (text) => message.success(text),
      messages: { bindSuccess: '已绑定正式物料' },
    }),
    [message],
  );

  const quickCreateCapabilities = useMemo<MesMasterDataQuickCreateCapabilities>(
    () => ({
      canCreate: (entity) => entity === 'customer',
      renderDrawer: ({ entity, open, onOpenChange, onCreated }) => (
        <Modal
          title="新增客户"
          open={entity === 'customer' && open}
          onCancel={() => onOpenChange(false)}
          footer={null}
          destroyOnHidden
        >
          <Button
            type="primary"
            htmlType="button"
            onClick={() => {
              void onCreated({ value: 'customer-demo-new', label: '新增示例客户' });
              onOpenChange(false);
            }}
          >
            创建示例客户
          </Button>
        </Modal>
      ),
      renderConfigEntryLabel: ({ children, onOpen }) => (
        <Button type="link" size="small" htmlType="button" onClick={onOpen}>
          {children}
        </Button>
      ),
    }),
    [],
  );

  const customFieldCapabilities = useMemo<MesCustomFieldFormCapabilities>(
    () => ({
      requestFormSchema: async () => ({
        schemaVersion: 1,
        fields: [
          {
            fieldKey: 'salesRegion',
            label: '销售区域',
            fieldKind: 'input',
            dataType: 'select',
            requiredPolicy: 'none',
            isActive: true,
            displayJson: { showInForm: true },
            optionsJson: { options: ['华东', '华南', '华北'] },
          },
        ],
      }),
      requestValueDetail: async () => ({
        customValues: { salesRegion: '华东' },
      }),
      getErrorMessage: (error, fallback) =>
        error instanceof Error ? error.message : fallback,
    }),
    [],
  );

  const orderItemCapabilities = useMemo<MesOrderItemEditorCapabilities>(
    () => ({
      requestMaterials: async (params) => {
        const keyword = params?.keyWords?.toLowerCase() ?? '';
        return demoMaterials.filter((item) =>
          `${item.label} ${item.code}`.toLowerCase().includes(keyword),
        );
      },
      requestCurrencyOptions: async () => [
        { value: 'CNY', label: '人民币（CNY）' },
        { value: 'USD', label: '美元（USD）' },
      ],
      requestMaterialListCustomFields: async () => [],
      requestDocumentLineCustomFieldSchema: async () => lineSchema,
      previewDocumentLineCustomFields: async ({ items }) => ({
        items: items.map(() => ({ customComputedValues: {}, customComputedErrors: {} })),
      }),
      previewCommercialAmounts: async ({ systemValues }) => {
        const amount = systemValues.quantity * (systemValues.unitPrice ?? 0);
        const discountRate = systemValues.discountRate ?? 100;
        const discountedAmount = amount * (discountRate / 100);
        const taxRate = systemValues.taxRate ?? 0;
        const taxAmount = systemValues.priceIncludesTax
          ? discountedAmount * (taxRate / (100 + taxRate))
          : discountedAmount * (taxRate / 100);
        return {
          amount,
          discountRate,
          discountAmount: amount - discountedAmount,
          discountedAmount: systemValues.priceIncludesTax
            ? discountedAmount - taxAmount
            : discountedAmount,
          taxRate,
          taxAmount,
          totalAmount: systemValues.priceIncludesTax
            ? discountedAmount
            : discountedAmount + taxAmount,
        };
      },
      renderFieldHelp: ({ label }) => label,
      renderConfigEntryLink: ({ label, onOpen }) => (
        <Button type="link" size="small" htmlType="button" onClick={onOpen}>
          配置{label}
        </Button>
      ),
    }),
    [],
  );

  const materialSelectCapabilities = useMemo<MesMaterialSelectCapabilities>(
    () => ({ unitLabelMap: { M: '米', EA: '只' } }),
    [],
  );
  const bomCostCapabilities = useMemo<MesBomCostSnapshotCapabilities>(
    () => ({
      requestCostPreview: async ({ bomCostSnapshot }) => ({
        snapshot:
          bomCostSnapshot ?? {
            lines: [],
            totalMaterialCost: 0,
            hasUnpriced: false,
            warnings: [],
          },
      }),
      unitLabelMap: { piece: '件', M: '米' },
    }),
    [],
  );

  return (
    <section>
      <Typography.Paragraph type="secondary">
        报价表单、临时报价品绑定及发送方式选择保留既有交互；API、字典、权限结果、配置导航与消息由宿主能力对象提供。
      </Typography.Paragraph>
      <Space wrap>
        <Button
          onClick={() => {
            setEditing(false);
            setFormOpen(true);
          }}
        >
          新建报价
        </Button>
        <Button
          onClick={() => {
            setEditing(true);
            setFormOpen(true);
          }}
        >
          编辑报价
        </Button>
        <Button onClick={() => setBindOpen(true)}>绑定正式物料</Button>
        <Button type="primary" onClick={() => setSendOpen(true)}>
          发送报价
        </Button>
      </Space>
      <Typography.Text role="status" aria-live="polite">
        {lastAction}
      </Typography.Text>

      <MesUiProvider
        hasPermission={() => true}
        masterDataQuickCreateCapabilities={quickCreateCapabilities}
        customFieldFormCapabilities={customFieldCapabilities}
        orderItemEditorCapabilities={orderItemCapabilities}
        materialSelectCapabilities={materialSelectCapabilities}
        bomCostSnapshotCapabilities={bomCostCapabilities}
      >
        <QuotationFormDrawer
          open={formOpen}
          quotationId={editing ? demoQuotation.id : undefined}
          onOpenChange={setFormOpen}
          onSuccess={(quotation) => {
            setLastAction(
              quotation
                ? `已创建报价 ${quotation.quotationNo ?? quotation.id}`
                : '报价已更新',
            );
          }}
          capabilities={formCapabilities}
        />
      </MesUiProvider>
      <QuotationBindMaterialsModal
        quotation={demoQuotation}
        open={bindOpen}
        onClose={() => setBindOpen(false)}
        onSuccess={() => setLastAction('报价临时品绑定已完成')}
        capabilities={bindCapabilities}
      />
      <SendQuotationModal
        open={sendOpen}
        quotationId={demoQuotation.id}
        quotationNo={demoQuotation.quotationNo}
        onOpenChange={setSendOpen}
        onSuccess={() => setLastAction('报价发送流程已完成')}
        capabilities={sendCapabilities}
      />
    </section>
  );
}
