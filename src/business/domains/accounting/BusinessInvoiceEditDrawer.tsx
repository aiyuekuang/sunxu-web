/** @sunxu-layer business @sunxu-domain accounting @sunxu-reason Preserves invoice edit fields, allocation-based locks, opening migration fields, custom line data, and validation while the host supplies category, partner, unit, and persistence capabilities. */
import {
  DrawerForm,
  ProFormDatePicker,
  ProFormGroup,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert } from 'antd';
import { BusinessInvoiceLineFormList } from './BusinessInvoiceLineFormList';
import { BUSINESS_INVOICE_NUMBER_FORM_RULE } from './BusinessInvoiceCreateDrawer';
import type {
  BusinessInvoiceEditDrawerProps,
  BusinessInvoiceFormValues,
} from './business-invoice-workflow-types';

/** Edits invoice metadata and lines, locking source-linked fields from mutation. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable business invoice edit drawer behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function BusinessInvoiceEditDrawer({
  mode,
  record,
  open,
  onOpenChange,
  onFinish,
  capabilities,
}: BusinessInvoiceEditDrawerProps) {
  const isPurchase = mode === 'purchase';
  const locked = record.lines.some((line) => line.allocations.length > 0);
  const initialValues: BusinessInvoiceFormValues = {
    documentNo: record.documentNo,
    invoiceNo:
      typeof record.invoiceNo === 'string' && record.invoiceNo.trim()
        ? record.invoiceNo.trim()
        : undefined,
    category: record.category,
    originalInvoiceId: record.originalInvoiceId ?? undefined,
    partnerId: record.partnerId,
    invoiceDate: record.invoiceDate,
    currency: record.currency ?? undefined,
    exchangeRate: record.exchangeRate ?? undefined,
    externalSystem: record.externalSystem ?? undefined,
    externalDocumentId: record.externalDocumentId ?? undefined,
    externalDocumentNo: record.externalDocumentNo ?? undefined,
    externalOriginalDocumentId:
      record.externalOriginalDocumentId ?? undefined,
    importBatchNo: record.importBatchNo ?? undefined,
    remarks: record.remarks ?? undefined,
    lines: record.lines.map((line) => ({
      materialId: line.materialId ?? undefined,
      itemCode: line.itemCode ?? undefined,
      itemName: line.itemName,
      unit: line.unit ?? undefined,
      quantity: line.quantity,
      unitPrice: line.unitPrice ?? undefined,
      amountWithoutTax: line.amountWithoutTax ?? undefined,
      taxRate: line.taxRate ?? undefined,
      taxAmount: line.taxAmount ?? undefined,
      totalAmount: line.totalAmount ?? undefined,
      customFieldSchemaVersion: line.customFieldSchemaVersion ?? undefined,
      customValues: line.customValues,
    })),
  };

  return (
    <DrawerForm<BusinessInvoiceFormValues>
      title="编辑"
      open={open}
      onOpenChange={onOpenChange}
      width={920}
      initialValues={initialValues}
      drawerProps={{ destroyOnHidden: true }}
      onFinish={onFinish}
    >
      <ProFormGroup>
        <ProFormText name="documentNo" label="登记单号" width="md" disabled />
        <ProFormText
          name="invoiceNo"
          label="真实发票号"
          width="md"
          fieldProps={{ maxLength: 20 }}
          rules={[BUSINESS_INVOICE_NUMBER_FORM_RULE]}
        />
        <ProFormSelect
          name="category"
          label="票据类型"
          options={capabilities.invoiceCategoryOptions}
          width="sm"
          disabled={locked}
          rules={[{ required: true }]}
        />
        {capabilities.renderPartnerField({
          name: 'partnerId',
          mode,
          label: isPurchase ? '供应商' : '客户',
          width: 'md',
          showSearch: true,
          debounceTime: 300,
          filterOption: false,
          searchPlaceholder: '默认显示前50条，输入关键词可搜索更多',
          disabled: locked,
          required: true,
          quickCreate: true,
        })}
        <ProFormDatePicker
          name="invoiceDate"
          label="票面日期"
          width="sm"
          rules={[{ required: true }]}
        />
      </ProFormGroup>
      {locked ? (
        <Alert
          type="info"
          showIcon
          message="该草稿已关联来源单"
          description="为保留采购入库单/销售出库单与发票的分摊证据链，普通编辑只能修改真实发票号、票面日期和备注。"
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {record.sourceMode === 'opening_unmatched' ? (
        <ProFormGroup>
          <ProFormText name="externalSystem" label="原系统" width="sm" />
          <ProFormText name="externalDocumentId" label="原单据ID" width="md" />
          <ProFormText name="externalDocumentNo" label="原单据号" width="md" />
          <ProFormText
            name="externalOriginalDocumentId"
            label="旧系统原蓝票ID"
            width="md"
          />
        </ProFormGroup>
      ) : null}
      <BusinessInvoiceLineFormList
        objectType={isPurchase ? 'purchase_invoice_line' : 'sales_invoice_line'}
        locked={locked}
        creatorText="新增明细"
        enabled={open}
        lineCustomFieldSchema={capabilities.lineCustomFieldSchema}
        renderUnitField={capabilities.renderUnitField}
      />
      <ProFormTextArea name="remarks" label="备注" />
    </DrawerForm>
  );
}
