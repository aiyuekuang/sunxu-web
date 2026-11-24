import { QrcodeOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Divider,
  Form,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Typography,
  theme,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CustomerOrderPortalConfig,
  CustomerOrderPortalConfigFormValues,
  CustomerOrderPortalQrModalProps,
} from './customer-order-portal-qr-modal-types';

function cloneConfigValues(
  values: CustomerOrderPortalConfigFormValues,
): CustomerOrderPortalConfigFormValues {
  return { ...values, visibleFields: [...values.visibleFields] };
}

function toConfigFormValues(
  config: CustomerOrderPortalConfig | null | undefined,
  defaults: CustomerOrderPortalConfigFormValues,
): CustomerOrderPortalConfigFormValues {
  return {
    shippedVisibleDays:
      config?.shippedVisibleDays ?? defaults.shippedVisibleDays,
    maxVisibleOrders: config?.maxVisibleOrders ?? defaults.maxVisibleOrders,
    visibleFields:
      config?.visibleFields?.length
        ? [...config.visibleFields]
        : [...defaults.visibleFields],
  };
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain sales-customer-order-portal
 * @sunxu-reason Preserves the customer portal QR, global display configuration, and inventory visibility workflow while requests, permissions, URL policy, QR rendering, and messages remain host-owned.
 */
export function CustomerOrderPortalQrModal({
  open,
  customer,
  onOpenChange,
  capabilities,
}: CustomerOrderPortalQrModalProps) {
  const [form] = Form.useForm<CustomerOrderPortalConfigFormValues>();
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [inventorySaving, setInventorySaving] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [qr, setQr] = useState<{
    url: string;
    inventoryVisible: boolean;
  } | null>(null);
  const [config, setConfig] = useState<CustomerOrderPortalConfig | null>(null);
  const capabilitiesRef = useRef(capabilities);
  const customerRef = useRef(customer);
  const qrRequestSequence = useRef(0);

  const customerId = customer?.id;
  const canViewConfig = capabilities.permissions.canViewConfig;
  const qrUrl = useMemo(
    () =>
      qr
        ? capabilities.normalizePortalUrl(qr.url, capabilities.publicOrigin)
        : null,
    [capabilities.normalizePortalUrl, capabilities.publicOrigin, qr],
  );

  useEffect(() => {
    capabilitiesRef.current = capabilities;
    customerRef.current = customer;
  });

  const loadQr = useCallback(async () => {
    const currentCustomer = customerRef.current;
    if (!currentCustomer) return;

    const requestId = ++qrRequestSequence.current;
    setLoading(true);
    try {
      const result = await capabilitiesRef.current.generateQr(
        currentCustomer.id,
      );
      if (requestId === qrRequestSequence.current) {
        setQr(result);
        setInventoryVisible(result.inventoryVisible);
      }
    } finally {
      if (requestId === qrRequestSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !customerId) {
      qrRequestSequence.current += 1;
      return;
    }

    let active = true;
    const currentCapabilities = capabilitiesRef.current;
    setQr(null);
    setConfig(null);
    setInventoryVisible(false);
    form.setFieldsValue(cloneConfigValues(currentCapabilities.defaultConfigValues));
    void loadQr();

    if (currentCapabilities.permissions.canViewConfig) {
      setConfigLoading(true);
      void currentCapabilities
        .loadConfig()
        .then((result) => {
          if (!active) return;
          setConfig(result);
          form.setFieldsValue(
            toConfigFormValues(result, capabilitiesRef.current.defaultConfigValues),
          );
        })
        .catch(() => {
          if (active) {
            capabilitiesRef.current.notifyError(
              capabilitiesRef.current.messages.operationFailed,
            );
          }
        })
        .finally(() => {
          if (active) setConfigLoading(false);
        });
    }

    return () => {
      active = false;
      qrRequestSequence.current += 1;
    };
  }, [canViewConfig, customerId, form, loadQr, open]);

  const saveConfig = async () => {
    const values = await form.validateFields();
    setConfigSaving(true);
    try {
      const result = await capabilitiesRef.current.updateConfig(values);
      setConfig(result);
      form.setFieldsValue(
        toConfigFormValues(result, capabilitiesRef.current.defaultConfigValues),
      );
      capabilitiesRef.current.notifySuccess(
        capabilitiesRef.current.messages.updateSuccess,
      );
    } finally {
      setConfigSaving(false);
    }
  };

  const regenerateQr = async () => {
    const currentCustomer = customerRef.current;
    if (!currentCustomer) return;
    const result = await capabilitiesRef.current.regenerateQr(
      currentCustomer.id,
    );
    setQr(result);
    setInventoryVisible(result.inventoryVisible);
    capabilitiesRef.current.notifySuccess(
      capabilitiesRef.current.messages.updateSuccess,
    );
  };

  const saveInventoryVisibility = async () => {
    const currentCustomer = customerRef.current;
    if (!currentCustomer) return;
    setInventorySaving(true);
    try {
      const result = await capabilitiesRef.current.updateInventoryVisibility(
        currentCustomer.id,
        inventoryVisible,
      );
      setInventoryVisible(result.inventoryVisible);
      setQr((current) =>
        current
          ? { ...current, inventoryVisible: result.inventoryVisible }
          : current,
      );
      capabilitiesRef.current.notifySuccess(
        capabilitiesRef.current.messages.updateSuccess,
      );
    } finally {
      setInventorySaving(false);
    }
  };

  const { labels, constraints } = capabilities;

  return (
    <Modal
      title={labels.title}
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={null}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : (
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Text>
            {customer?.name}
            {customer?.customerCode ? `（${customer.customerCode}）` : ''}
          </Typography.Text>

          {qrUrl ? (
            <div
              style={{
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadiusLG,
                padding: 16,
                textAlign: 'center',
              }}
            >
              <div role="img" aria-label={labels.qrImageDescription}>
                {capabilities.renderQr(qrUrl, capabilities.qrRendererOptions)}
              </div>
              <Typography.Paragraph
                copyable={{ text: qrUrl }}
                style={{
                  marginBlockEnd: 0,
                  marginBlockStart: 8,
                  overflowWrap: 'anywhere',
                }}
              >
                {qrUrl}
              </Typography.Paragraph>
            </div>
          ) : null}

          <Typography.Text type="secondary">
            {labels.privacyNotice}
          </Typography.Text>

          <Divider style={{ marginBlock: 4 }}>{labels.inventoryHeading}</Divider>
          <Checkbox
            checked={inventoryVisible}
            disabled={!capabilities.permissions.canManageInventoryVisibility}
            onChange={(event) => setInventoryVisible(event.target.checked)}
          >
            {labels.inventoryPermission}
          </Checkbox>
          <Button
            loading={inventorySaving}
            disabled={
              !capabilities.permissions.canManageInventoryVisibility || !qr
            }
            onClick={saveInventoryVisibility}
          >
            {labels.saveInventoryPermission}
          </Button>

          {capabilities.permissions.canViewConfig ? (
            <>
              <Divider style={{ marginBlock: 4 }}>{labels.configHeading}</Divider>
              <Spin spinning={configLoading}>
                <Form
                  form={form}
                  layout="vertical"
                  disabled={!capabilities.permissions.canUpdateConfig}
                  initialValues={capabilities.defaultConfigValues}
                >
                  <Form.Item
                    name="shippedVisibleDays"
                    label={labels.shippedVisibleDays}
                    rules={[
                      { required: true, message: labels.shippedVisibleDaysRequired },
                    ]}
                  >
                    <InputNumber
                      min={constraints.shippedVisibleDaysMin}
                      max={constraints.shippedVisibleDaysMax}
                      precision={constraints.shippedVisibleDaysPrecision}
                      addonAfter={labels.daysSuffix}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="maxVisibleOrders"
                    label={labels.maxVisibleOrders}
                    rules={[
                      { required: true, message: labels.maxVisibleOrdersRequired },
                    ]}
                  >
                    <InputNumber
                      min={constraints.maxVisibleOrdersMin}
                      max={constraints.maxVisibleOrdersMax}
                      precision={constraints.maxVisibleOrdersPrecision}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="visibleFields"
                    label={labels.visibleFields}
                    rules={[
                      {
                        type: 'array',
                        min: constraints.minimumVisibleFields,
                        message: labels.visibleFieldsRequired,
                      },
                    ]}
                  >
                    <Checkbox.Group options={[...capabilities.fieldOptions]} />
                  </Form.Item>
                  <Button
                    htmlType="button"
                    type="primary"
                    loading={configSaving}
                    disabled={
                      !capabilities.permissions.canUpdateConfig || !config
                    }
                    onClick={saveConfig}
                  >
                    {labels.saveConfig}
                  </Button>
                </Form>
              </Spin>
            </>
          ) : null}

          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={loadQr}>
              {labels.refreshQr}
            </Button>
            <Popconfirm
              title={labels.regenerateWarning}
              okText={labels.confirmRegenerate}
              cancelText={labels.cancel}
              onConfirm={regenerateQr}
            >
              <Button icon={<QrcodeOutlined />}>{labels.regenerateQr}</Button>
            </Popconfirm>
          </Space>
        </Space>
      )}
    </Modal>
  );
}
