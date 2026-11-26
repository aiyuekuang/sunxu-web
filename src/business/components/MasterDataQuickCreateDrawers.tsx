import {
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  DrawerForm,
} from '@ant-design/pro-components';
import { App } from 'antd';
import type { ReactNode } from 'react';
import { useMesMasterDataQuickCreateCapabilities } from '../MesUiProvider';
import type {
  MasterDataQuickCreateOption,
  MesQuickCreateOption,
} from './master-data-quick-create-types';

export interface QuickCreateSalesRepSnapshot {
  value?: string | null;
  label?: string | null;
}

export interface CustomerFormFieldsProps {
  /** Existing sales representative snapshot is kept visible when it is outside the first option page. */
  currentSalesRep?: QuickCreateSalesRepSnapshot;
}

export interface SupplierFormFieldsProps {
  /** Existing purchasing representative snapshot is kept visible when it is outside the first option page. */
  currentPurchasingRep?: QuickCreateSalesRepSnapshot;
}

export interface CustomerQuickCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (
    option: MasterDataQuickCreateOption & {
      salesRepId?: string | null;
      paymentTerms?: string | null;
    },
  ) => void | Promise<void>;
}

export interface SupplierQuickCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (option: MasterDataQuickCreateOption) => void | Promise<void>;
}

function getFieldHelpProps(
  capabilities: ReturnType<typeof useMesMasterDataQuickCreateCapabilities>,
  label: string,
  group?: 'common' | 'sales' | 'purchase',
  helpKey?: string,
): Record<string, unknown> {
  return capabilities?.forms?.getFieldHelpProps?.(label, group, helpKey) ?? {
    label,
  };
}

function DictionaryField({
  name,
  label,
  typeCode,
  showSearch,
  placeholder,
  helpGroup,
  helpKey,
}: {
  name: string;
  label: string;
  typeCode: string;
  showSearch?: boolean;
  placeholder?: string;
  helpGroup?: 'common' | 'sales' | 'purchase';
  helpKey?: string;
}) {
  const capabilities = useMesMasterDataQuickCreateCapabilities();
  const fieldHelpProps = getFieldHelpProps(capabilities, label, helpGroup, helpKey);
  const props = {
    name,
    label: (fieldHelpProps.label as ReactNode | undefined) ?? label,
    typeCode,
    showSearch,
    placeholder,
    fieldHelpProps,
  };
  if (capabilities?.forms?.renderDictionarySelect) {
    return capabilities.forms.renderDictionarySelect(props);
  }
  return (
    <ProFormSelect
      {...fieldHelpProps}
      name={name}
      label={props.label}
      showSearch={showSearch}
      placeholder={placeholder}
      request={async (params) =>
        (await capabilities?.forms?.requestDictionaryOptions?.(typeCode, {
          keyWords: String(params.keyWords ?? ''),
        })) ?? []
      }
      fieldProps={{ filterOption: false }}
    />
  );
}

function withCurrentOption(
  request: (params: { keyWords?: string }) => Promise<MesQuickCreateOption[]>,
  current?: QuickCreateSalesRepSnapshot,
) {
  return async (params: { keyWords?: string }) => {
    const options = await request(params);
    if (
      current?.value &&
      current.label &&
      !options.some((option) => option.value === current.value)
    ) {
      return [{ value: current.value, label: current.label }, ...options];
    }
    return options;
  };
}

/**
 * @sunxu-layer business
 * @sunxu-domain customer
 * @sunxu-reason Keeps the MES customer field schema, validation, dictionary slots, and current sales representative snapshot in the shared suite.
 */
export function CustomerFormFields({
  currentSalesRep,
}: CustomerFormFieldsProps) {
  const capabilities = useMesMasterDataQuickCreateCapabilities();
  return (
    <>
      <ProFormText
        name="name"
        {...getFieldHelpProps(capabilities, '客户名称')}
        rules={[{ required: true, message: '请输入客户名称' }]}
      />
      <ProFormText name="shortName" {...getFieldHelpProps(capabilities, '简称')} />
      <ProFormText name="contactName" {...getFieldHelpProps(capabilities, '联系人')} />
      <ProFormText name="contactPhone" {...getFieldHelpProps(capabilities, '联系电话')} />
      <ProFormText
        name="contactEmail"
        {...getFieldHelpProps(capabilities, '邮箱')}
        rules={[{ type: 'email', message: '请输入有效邮箱' }]}
      />
      <ProFormText name="contactWechat" {...getFieldHelpProps(capabilities, '微信号')} />
      <ProFormText name="contactWecom" {...getFieldHelpProps(capabilities, '企业微信账号')} />
      <ProFormText name="contactFeishu" {...getFieldHelpProps(capabilities, '飞书账号')} />
      <DictionaryField name="level" label="等级" typeCode="customer_level" />
      <DictionaryField
        name="industry"
        label="所属行业"
        typeCode="customer_industry"
        showSearch
      />
      <DictionaryField
        name="paymentTerms"
        label="收款条件"
        typeCode="payment_terms"
        showSearch
        helpGroup="sales"
        helpKey="customerPaymentTerms"
      />
      <ProFormSelect
        name="salesRepId"
        {...getFieldHelpProps(capabilities, '负责销售员')}
        showSearch
        debounceTime={300}
        request={withCurrentOption(
          (params) => capabilities?.forms?.requestUserOptions?.(params) ?? Promise.resolve([]),
          currentSalesRep,
        )}
        fieldProps={{ filterOption: false, placeholder: '默认显示50条，可搜索更多' }}
      />
      <ProFormDigit
        name="creditLimit"
        {...getFieldHelpProps(capabilities, '信用额度', 'sales', 'customerCreditLimit')}
        min={0}
        fieldProps={{ precision: 2, prefix: '¥' }}
      />
      <ProFormText name="address" {...getFieldHelpProps(capabilities, '地址')} />
      <ProFormTextArea name="remarks" {...getFieldHelpProps(capabilities, '备注')} />
    </>
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain supplier
 * @sunxu-reason Keeps the MES supplier field schema, validation, dictionary slots, and current purchasing representative snapshot in the shared suite.
 */
export function SupplierFormFields({
  currentPurchasingRep,
}: SupplierFormFieldsProps) {
  const capabilities = useMesMasterDataQuickCreateCapabilities();
  return (
    <>
      <ProFormText
        name="name"
        {...getFieldHelpProps(capabilities, '供应商名称')}
        rules={[{ required: true, message: '请输入供应商名称' }]}
      />
      <ProFormText name="shortName" {...getFieldHelpProps(capabilities, '简称')} />
      <ProFormText name="contactName" {...getFieldHelpProps(capabilities, '联系人')} />
      <ProFormText name="contactPhone" {...getFieldHelpProps(capabilities, '联系电话')} />
      <ProFormText
        name="contactEmail"
        {...getFieldHelpProps(capabilities, '邮箱')}
        rules={[{ type: 'email', message: '请输入有效邮箱' }]}
      />
      <DictionaryField name="rating" label="评级" typeCode="supplier_rating" />
      <DictionaryField
        name="category"
        label="供应品类"
        typeCode="supplier_category"
        placeholder="请选择供应品类"
      />
      <DictionaryField
        name="paymentTerms"
        label="付款条件"
        typeCode="payment_terms"
        placeholder="请选择付款条件"
        helpGroup="purchase"
        helpKey="supplierPaymentTerms"
      />
      <ProFormSelect
        name="purchasingRepId"
        {...getFieldHelpProps(capabilities, '负责采购员')}
        showSearch
        debounceTime={300}
        request={withCurrentOption(
          (params) => capabilities?.forms?.requestUserOptions?.(params) ?? Promise.resolve([]),
          currentPurchasingRep,
        )}
        fieldProps={{ filterOption: false, placeholder: '默认显示50条，可搜索更多' }}
      />
      <ProFormDigit
        name="leadTimeDays"
        {...getFieldHelpProps(capabilities, '交货周期(天)', 'purchase', 'supplierLeadTimeDays')}
        min={0}
        fieldProps={{ precision: 0 }}
      />
      <ProFormText name="address" {...getFieldHelpProps(capabilities, '地址')} />
      <ProFormTextArea name="remarks" {...getFieldHelpProps(capabilities, '备注')} />
    </>
  );
}

function isRequestErrorHandled(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return 'response' in error || ('name' in error && error.name === 'BizError');
}

function QuickCreateDrawerForm({
  title,
  name,
  open,
  onOpenChange,
  onFinish,
  onFinishFailed,
  children,
}: {
  title: ReactNode;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: Record<string, unknown>) => Promise<boolean>;
  onFinishFailed: (info: { errorFields?: Array<{ errors?: string[] }> }) => void;
  children: ReactNode;
}) {
  return (
    <DrawerForm<Record<string, unknown>>
      title={title}
      name={name}
      open={open}
      onOpenChange={onOpenChange}
      width={600}
      drawerProps={{ destroyOnHidden: true }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
    >
      {children}
    </DrawerForm>
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain customer
 * @sunxu-reason Preserves customer quick-create submission, authority ID/default-value callback, and DrawerForm validation lifecycle.
 */
export function CustomerQuickCreateDrawer({
  open,
  onOpenChange,
  onCreated,
}: CustomerQuickCreateDrawerProps) {
  const { message } = App.useApp();
  const capabilities = useMesMasterDataQuickCreateCapabilities();
  const onFinish = async (values: Record<string, unknown>) => {
    if (!capabilities?.forms?.createCustomer) {
      message.error('客户新建服务未配置');
      return false;
    }
    try {
      const customer = await capabilities.forms.createCustomer(values);
      await onCreated({
        value: customer.id,
        label: customer.name,
        salesRepId: customer.salesRepId,
        paymentTerms: customer.paymentTerms,
      });
      message.success('新增成功');
      return true;
    } catch (error) {
      if (!isRequestErrorHandled(error)) {
        message.error(error instanceof Error ? error.message : '操作失败');
      }
      return false;
    }
  };
  return (
    <QuickCreateDrawerForm
      title="客户"
      name="quickCreateCustomer"
      open={open}
      onOpenChange={onOpenChange}
      onFinish={onFinish}
      onFinishFailed={(info) => {
        const count = info.errorFields?.filter((field) => field.errors?.length).length ?? 0;
        message.warning(count > 1 ? `还有 ${count} 项未通过校验，请按红色提示补齐后再提交` : '请按红色提示补齐后再提交');
      }}
    >
      <CustomerFormFields />
    </QuickCreateDrawerForm>
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain supplier
 * @sunxu-reason Preserves supplier quick-create submission, authority ID callback, and DrawerForm validation lifecycle.
 */
export function SupplierQuickCreateDrawer({
  open,
  onOpenChange,
  onCreated,
}: SupplierQuickCreateDrawerProps) {
  const { message } = App.useApp();
  const capabilities = useMesMasterDataQuickCreateCapabilities();
  const onFinish = async (values: Record<string, unknown>) => {
    if (!capabilities?.forms?.createSupplier) {
      message.error('供应商新建服务未配置');
      return false;
    }
    try {
      const supplier = await capabilities.forms.createSupplier(values);
      await onCreated({ value: supplier.id, label: supplier.name });
      message.success('新增成功');
      return true;
    } catch (error) {
      if (!isRequestErrorHandled(error)) {
        message.error(error instanceof Error ? error.message : '操作失败');
      }
      return false;
    }
  };
  return (
    <QuickCreateDrawerForm
      title="供应商"
      name="quickCreateSupplier"
      open={open}
      onOpenChange={onOpenChange}
      onFinish={onFinish}
      onFinishFailed={(info) => {
        const count = info.errorFields?.filter((field) => field.errors?.length).length ?? 0;
        message.warning(count > 1 ? `还有 ${count} 项未通过校验，请按红色提示补齐后再提交` : '请按红色提示补齐后再提交');
      }}
    >
      <SupplierFormFields />
    </QuickCreateDrawerForm>
  );
}
