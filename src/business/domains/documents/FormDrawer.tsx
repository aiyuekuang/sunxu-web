import { DrawerForm } from '@ant-design/pro-components';
import { App, Form } from 'antd';
import React from 'react';
import { DocumentModalForm } from './DocumentModalForm';
import { withSharedFieldHelp, type SharedFieldHelpKey } from './shared-field-help';

export interface FormDrawerProps<
  T = Record<string, unknown>,
  V = Record<string, unknown>,
  C = unknown,
> {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name?: string;
  record?: T | null;
  createInitialValues?: Partial<V>;
  initialValuesMapper?: (record: T) => Partial<V>;
  createFn?: (values: V) => Promise<C>;
  onCreateSuccess?: (created: C) => void | Promise<void>;
  updateFn?: (values: V) => Promise<unknown>;
  onSuccess?: () => void;
  transformValues?: (values: V, isEdit: boolean) => V;
  width?: number;
  titleHelpKey?: SharedFieldHelpKey;
  children: React.ReactNode;
  drawerProps?: Record<string, unknown>;
  variant?: 'drawer' | 'documentModal';
  modalProps?: Record<string, unknown>;
}

interface FormFinishFailedInfo {
  errorFields?: Array<{ errors?: string[] }>;
}

function readErrorMetadata(error: unknown): { name?: string; response?: unknown; message?: string } {
  if (!error || typeof error !== 'object') return {};
  const record = error as { name?: unknown; response?: unknown; message?: unknown };
  return {
    name: typeof record.name === 'string' ? record.name : undefined,
    response: record.response,
    message: typeof record.message === 'string' ? record.message : undefined,
  };
}

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Keeps host create/update lifecycle, shared field help, result messages, and document-modal variant together.
 */
export function FormDrawer<
  T = Record<string, unknown>,
  V = Record<string, unknown>,
  C = unknown,
>({
  title,
  open,
  onOpenChange,
  name,
  record,
  createInitialValues,
  initialValuesMapper,
  createFn,
  onCreateSuccess,
  updateFn,
  onSuccess,
  transformValues,
  width = 600,
  titleHelpKey,
  children,
  drawerProps,
  variant = 'drawer',
  modalProps,
}: FormDrawerProps<T, V, C>) {
  const { message } = App.useApp();
  const [form] = Form.useForm<V>();
  const isEdit = Boolean(record);
  const displayTitle = title || (isEdit ? '编辑' : '新增');
  const displayTitleNode = titleHelpKey
    ? withSharedFieldHelp(displayTitle, titleHelpKey)
    : displayTitle;
  const initialValues =
    isEdit && record && initialValuesMapper
      ? initialValuesMapper(record)
      : isEdit && record
        ? (record as unknown as Partial<V>)
        : createInitialValues;
  const initialValuesRef = React.useRef(initialValues);
  initialValuesRef.current = initialValues;
  const recordIdentity =
    record && typeof record === 'object' && 'id' in record
      ? String((record as { id?: unknown }).id ?? '')
      : '';

  React.useEffect(() => {
    form.resetFields();
    if (!open) return;
    const nextInitialValues = initialValuesRef.current;
    if (nextInitialValues) form.setFieldsValue(nextInitialValues as V & Record<string, unknown>);
  }, [form, open, isEdit, recordIdentity]);

  const handleFinish = async (values: V): Promise<boolean> => {
    try {
      const finalValues = transformValues ? transformValues(values, isEdit) : values;
      if (isEdit && updateFn) {
        await updateFn(finalValues);
        message.success('更新成功');
      } else if (!isEdit && createFn) {
        const created = await createFn(finalValues);
        await onCreateSuccess?.(created);
        message.success('创建成功');
      }
      onSuccess?.();
      return true;
    } catch (error: unknown) {
      const metadata = readErrorMetadata(error);
      if (metadata.name !== 'BizError' && !metadata.response) {
        message.error(metadata.message || '操作失败，请稍后重试');
      }
      return false;
    }
  };

  const handleFinishFailed = (info: FormFinishFailedInfo) => {
    const errorCount = info.errorFields?.filter((field) => field.errors?.length).length ?? 0;
    message.warning(
      errorCount > 1
        ? `还有 ${errorCount} 项未通过校验，请按红色提示补齐后再提交`
        : '请按红色提示补齐后再提交',
    );
  };

  if (variant === 'documentModal') {
    return (
      <DocumentModalForm<V, Record<string, unknown>>
        form={form}
        name={name}
        title={displayTitleNode}
        open={open}
        onOpenChange={onOpenChange}
        modalProps={modalProps}
        initialValues={initialValues as V & Record<string, unknown>}
        onFinish={handleFinish}
        onFinishFailed={handleFinishFailed}
        scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
      >
        {children}
      </DocumentModalForm>
    );
  }

  return (
    <DrawerForm<V, Record<string, unknown>>
      form={form}
      name={name}
      title={displayTitleNode}
      open={open}
      onOpenChange={onOpenChange}
      width={width}
      drawerProps={{ destroyOnHidden: true, ...drawerProps }}
      initialValues={initialValues as V & Record<string, unknown>}
      onFinish={handleFinish}
      onFinishFailed={handleFinishFailed}
      scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
    >
      {children}
    </DrawerForm>
  );
}
