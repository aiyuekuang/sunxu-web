/** @sunxu-layer business @sunxu-domain accounting @sunxu-reason Preserves purchase/sales invoice creation, red-invoice source lookup and detail copy, invoice-number validation, and custom line fields while the host injects master-data, dictionary, and API capabilities. */
import {
  DrawerForm,
  ProFormDatePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormGroup,
  type ProFormInstance,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { useRef } from 'react';
import { BusinessInvoiceLineFormList } from './BusinessInvoiceLineFormList';
import type {
  BusinessInvoiceCreateDrawerProps,
  BusinessInvoiceFormValues,
  BusinessInvoiceOriginalInvoiceDetail,
} from './business-invoice-workflow-types';

export const BUSINESS_INVOICE_NUMBER_ERROR_MESSAGE =
  '真实发票号须为20位阿拉伯数字；旧版专票需将12位发票代码与8位号码合并填写';

const BUSINESS_INVOICE_NUMBER_PATTERN = /^[0-9]{20}$/;

/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable business invoice number form rule behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export const BUSINESS_INVOICE_NUMBER_FORM_RULE = {
  validator: async (_rule: unknown, value: unknown): Promise<void> => {
    if (value == null || value === '') return;
    if (
      typeof value === 'string' &&
      BUSINESS_INVOICE_NUMBER_PATTERN.test(value)
    ) {
      return;
    }
    throw new Error(BUSINESS_INVOICE_NUMBER_ERROR_MESSAGE);
  },
};

export function isValidBusinessInvoiceNumber(
  value: string | null | undefined,
): boolean {
  return (
    value == null || value === '' || BUSINESS_INVOICE_NUMBER_PATTERN.test(value)
  );
}

function toInvoiceLineValues(
  original: BusinessInvoiceOriginalInvoiceDetail,
) {
  return original.lines.map((line) => ({
    materialId: line.materialId,
    itemCode: line.itemCode,
    itemName: line.itemName,
    unit: line.unit,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    amountWithoutTax: line.amountWithoutTax,
    taxRate: line.taxRate,
    taxAmount: line.taxAmount,
    totalAmount: line.totalAmount,
    customFieldSchemaVersion: line.customFieldSchemaVersion,
    customValues: line.customValues,
    allocations: line.allocations.map((allocation) => ({
      sourceId: allocation.sourceId ?? '',
      sourceLineId: allocation.sourceLineId ?? '',
      sourceNo: allocation.sourceNo,
      settlementDocumentId: allocation.settlementDocumentId,
      allocatedQuantity: allocation.allocatedQuantity,
      allocatedAmount: allocation.allocatedAmount,
    })),
  }));
}

/** Creates a purchase or sales invoice and applies source data for red invoices. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable business invoice create drawer behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function BusinessInvoiceCreateDrawer({
  mode,
  open,
  onOpenChange,
  onFinish,
  capabilities,
}: BusinessInvoiceCreateDrawerProps) {
  const isPurchase = mode === 'purchase';
  const partnerLabel = isPurchase ? '供应商' : '客户';
  const objectType = isPurchase
    ? 'purchase_invoice_line'
    : 'sales_invoice_line';
  const formRef = useRef<
    ProFormInstance<BusinessInvoiceFormValues> | undefined
  >(undefined);

  const applyOriginalInvoice = async (originalInvoiceId: string) => {
    if (!originalInvoiceId) return;
    const original = await capabilities.getOriginalInvoiceDetail({
      mode,
      id: originalInvoiceId,
    });
    const sourceType = original.lines.flatMap((line) => line.allocations)[0]
      ?.sourceType;
    formRef.current?.setFieldsValue({
      partnerId: original.partnerId,
      sourceType: sourceType ?? undefined,
      currency: original.currency ?? undefined,
      exchangeRate: original.exchangeRate ?? undefined,
      lines: toInvoiceLineValues(original),
    });
  };

  return (
    <DrawerForm<BusinessInvoiceFormValues>
      title="新增"
      open={open}
      onOpenChange={onOpenChange}
      width={920}
      formRef={formRef}
      initialValues={{
        category: 'blue',
        invoiceDate: dayjs().format('YYYY-MM-DD'),
        lines: [{}],
      }}
      drawerProps={{ destroyOnHidden: true }}
      onFinish={onFinish}
    >
      <ProFormGroup>
        <ProFormText
          name="invoiceNo"
          label="真实发票号"
          width="md"
          fieldProps={{ maxLength: 20 }}
          rules={[BUSINESS_INVOICE_NUMBER_FORM_RULE]}
          tooltip="真实发票号须为20位阿拉伯数字；旧版专票需将12位发票代码与8位号码合并填写。草稿可暂不填写，确认前需回填。"
        />
        <ProFormSelect
          name="category"
          label="票据类型"
          options={capabilities.invoiceCategoryOptions}
          width="sm"
          rules={[{ required: true }]}
        />
        <ProFormDependency name={['category', 'partnerId']}>
          {({ category, partnerId }) =>
            category === 'red' ? (
              <ProFormSelect
                name="originalInvoiceId"
                label="原蓝字发票"
                width="md"
                showSearch
                debounceTime={300}
                request={async ({ keyWords }) => {
                  const invoices = await capabilities.listOriginalInvoices({
                    mode,
                    keyword: typeof keyWords === 'string' ? keyWords : undefined,
                    partnerId:
                      typeof partnerId === 'string' && partnerId
                        ? partnerId
                        : undefined,
                    status: 'confirmed',
                    category: 'blue',
                    page: 1,
                    pageSize: 50,
                  });
                  return invoices.map((invoice) => ({
                    label: `${invoice.documentNo}${
                      invoice.invoiceNo ? `（${invoice.invoiceNo}）` : ''
                    } - ${invoice.partnerName}`,
                    value: invoice.id,
                  }));
                }}
                fieldProps={{
                  showSearch: true,
                  filterOption: false,
                  fetchDataOnSearch: true,
                  placeholder: '默认显示前50条，输入关键词可搜索更多',
                  onChange: (value) => {
                    if (typeof value === 'string') {
                      void applyOriginalInvoice(value);
                    }
                  },
                }}
                rules={[{ required: true }]}
              />
            ) : null
          }
        </ProFormDependency>
        {capabilities.renderPartnerField({
          name: 'partnerId',
          mode,
          label: partnerLabel,
          width: 'md',
          showSearch: true,
          debounceTime: 300,
          filterOption: false,
          required: true,
          quickCreate: true,
        })}
        <ProFormDatePicker
          name="invoiceDate"
          label="票面日期"
          width="sm"
          rules={[{ required: true }]}
        />
        <ProFormText name="currency" label="币种" width="xs" />
        <ProFormDigit
          name="exchangeRate"
          label="汇率"
          width="sm"
          min={0.00000001}
        />
      </ProFormGroup>
      <ProFormGroup>
        <ProFormText name="externalSystem" label="原系统" width="sm" />
        <ProFormText name="externalDocumentId" label="原单据ID" width="md" />
        <ProFormText name="externalDocumentNo" label="原单据号" width="md" />
        <ProFormText name="importBatchNo" label="导入批次" width="sm" />
      </ProFormGroup>
      <BusinessInvoiceLineFormList
        objectType={objectType}
        enabled={open}
        lineCustomFieldSchema={capabilities.lineCustomFieldSchema}
        renderUnitField={capabilities.renderUnitField}
      />
      <ProFormTextArea name="remarks" label="备注" />
    </DrawerForm>
  );
}
