import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormDependency,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, Form } from 'antd';
import { useEffect, useMemo } from 'react';
import { StockCountLineFormList } from './StockCountLineFormList';
import type {
  CreateStockCountModalProps,
  StockCountCreateFormValues,
} from './stock-count-document-components-types';

/**
 * @sunxu-layer business
 * @sunxu-domain inventory
 * @sunxu-reason Keeps the source count creation form and manual-line composition while warehouse/location controls, custom-field schema, payload mapping, permissions, and service calls stay host-owned.
 */
export function CreateStockCountModal({
  open,
  onOpenChange,
  onCreated,
  capabilities,
}: CreateStockCountModalProps) {
  const [form] = Form.useForm<StockCountCreateFormValues>();
  const getCurrentCountDate = capabilities.getCurrentCountDate;
  const initialValues = useMemo(
    () => ({
      countMode: capabilities.defaultCountMode,
      countDate: getCurrentCountDate(),
    }),
    [capabilities.defaultCountMode, getCurrentCountDate],
  );

  useEffect(() => {
    if (open) {
      form.setFieldValue('countDate', getCurrentCountDate());
    }
  }, [form, getCurrentCountDate, open]);

  if (!capabilities.permissions.canCreate) return null;

  const { labels } = capabilities;

  return (
    <ModalForm<StockCountCreateFormValues>
      title={labels.title}
      open={open}
      form={form}
      initialValues={initialValues}
      modalProps={{ destroyOnHidden: true }}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) form.resetFields();
      }}
      onFinish={async (values) => {
        const payload = capabilities.buildCreatePayload(
          values,
          capabilities.lineCustomFieldSchema,
        );
        const detail = await capabilities.createStockCount(payload);
        onCreated(detail);
        capabilities.notifySuccess(labels.createdSuccess);
        return true;
      }}
    >
      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 16 }}
        message={labels.infoMessage}
        description={labels.infoDescription}
      />
      {capabilities.renderWarehouseField({
        name: 'warehouseId',
        label: labels.warehouse,
        requiredMessage: labels.warehouseRequired,
      })}
      <ProFormSelect
        name="countMode"
        label={labels.countMode}
        options={[...capabilities.countModeOptions]}
        rules={[{ required: true, message: labels.countModeRequired }]}
      />
      <ProFormDateTimePicker
        name="countDate"
        label={labels.countDate}
        fieldProps={{ showNow: true }}
      />
      <ProFormTextArea name="remarks" label={labels.remarks} fieldProps={{ rows: 3 }} />
      <ProFormDependency name={['warehouseId']}>
        {({ warehouseId }) => (
          <>
            {capabilities.renderLocationField({
              name: 'locationId',
              textName: 'storageLocation',
              label: labels.location,
              warehouseId,
            })}
            <StockCountLineFormList
              form={form}
              warehouseId={warehouseId}
              showLocationControl={Boolean(warehouseId)}
              lineCustomFieldSchema={capabilities.lineCustomFieldSchema}
              titlePrefix={labels.manualLinesTitle}
              capabilities={capabilities.lineFormCapabilities}
            />
          </>
        )}
      </ProFormDependency>
    </ModalForm>
  );
}
