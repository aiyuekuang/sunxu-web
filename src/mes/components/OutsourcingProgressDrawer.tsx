import {
  DeleteOutlined,
  PlusOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import {
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import { ResizableTable as Table } from './ResizableTable';
import type {
  OutsourcingOrderStep,
  OutsourcingProgressDrawerProps,
  OutsourcingProgressFormValues,
  OutsourcingProgressReport,
  OutsourcingProgressQrToken,
} from './outsourcing-progress-drawer-types';

/**
 * @sunxu-component mes-specific
 * @sunxu-domain outsourcing-progress
 * @sunxu-reason Keeps optional per-order progress steps, quantity ceilings, QR invalidation, and report provenance while APIs, URL policy, QR rendering, permission results, and feedback stay host supplied.
 * Configures the optional supplier reporting steps and inspects progress history.
 */
export function OutsourcingProgressDrawer({
  open,
  order,
  onClose,
  capabilities,
}: OutsourcingProgressDrawerProps) {
  const [form] = Form.useForm<OutsourcingProgressFormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reports, setReports] = useState<OutsourcingProgressReport[]>([]);
  const [savedSteps, setSavedSteps] = useState<OutsourcingOrderStep[]>([]);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const orderId = order?.id;

  const reportedQtyOf = useCallback(
    (stepId?: string) =>
      (stepId && savedSteps.find((step) => step.id === stepId)?.latestProcessedQty) ||
      0,
    [savedSteps],
  );

  const currentPlannedQtyOf = useCallback(
    (stepId?: string) => {
      const saved = stepId
        ? savedSteps.find((step) => step.id === stepId)
        : undefined;
      return saved?.plannedQty ?? order?.qty ?? 0;
    },
    [order?.qty, savedSteps],
  );

  const applyQr = useCallback(
    (result: OutsourcingProgressQrToken) => {
      setQrUrl(capabilities.resolveQrUrl(result));
      setQrExpiresAt(result.expiresAt);
    },
    [capabilities],
  );

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const [steps, page] = await Promise.all([
        capabilities.requestSteps(orderId),
        capabilities.requestReports({
          outsourcingOrderId: orderId,
          page: 1,
          pageSize: 100,
        }),
      ]);
      const nextSteps = steps || [];
      setSavedSteps(nextSteps);
      form.setFieldsValue({
        steps: nextSteps.map((step) => ({
          id: step.id,
          name: step.name,
          plannedQty: step.plannedQty ?? undefined,
        })),
      });
      setReports(page?.list || []);
      // The source automatically displays the current QR after loading the ledger.
      applyQr(await capabilities.generateQr(orderId));
    } finally {
      setLoading(false);
    }
  }, [applyQr, capabilities, form, orderId]);

  useEffect(() => {
    if (!open || !orderId) return;
    setQrUrl(null);
    setQrExpiresAt(null);
    void load();
  }, [load, open, orderId]);

  const handleSaveSteps = async () => {
    if (!order) return;
    const values = await form.validateFields();
    const steps = (values.steps || []).map((step) => ({
      id: step.id,
      name: (step.name || '').trim(),
      plannedQty: step.plannedQty ?? undefined,
    }));
    setSaving(true);
    try {
      await capabilities.saveSteps(order.id, steps);
      capabilities.notifySuccess('步骤已保存');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateQr = async () => {
    if (!order) return;
    applyQr(await capabilities.regenerateQr(order.id));
    capabilities.notifySuccess('已重新生成，旧二维码立即失效');
  };

  const reportColumns: ColumnsType<OutsourcingProgressReport> = [
    {
      title: '步骤',
      render: (_value, report) => report.step?.name || '整单',
    },
    { title: '上报时累计已加工', dataIndex: 'processedQty' },
    {
      title: '合格',
      dataIndex: 'qualifiedQty',
      render: (value) => value ?? '-',
    },
    {
      title: '不良',
      dataIndex: 'defectQty',
      render: (value) => value ?? '-',
    },
    {
      title: '来源',
      dataIndex: 'source',
      render: (value) =>
        value === 'supplier_scan' ? (
          <Tag color="blue">供应商扫码</Tag>
        ) : (
          <Tag>内部代录</Tag>
        ),
    },
    {
      title: '填报人',
      dataIndex: 'submitterName',
      render: (value) => value || '-',
    },
    {
      title: '时间',
      dataIndex: 'reportedAt',
      render: (value) => capabilities.formatDateTime(value),
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(760px, 100vw)"
      title={'委外进度 · ' + (order?.orderNo || '')}
      destroyOnHidden
    >
      <Typography.Title level={5}>加工步骤（自定义，可选）</Typography.Title>
      <Typography.Paragraph type="secondary">
        供应商扫码后按这些步骤报进度；不配步骤则供应商按整单报总量。步骤是本委外单私有的进度标签，不进工艺工序；有进度上报的步骤不能删除。
      </Typography.Paragraph>
      <Form form={form} layout="vertical" disabled={!capabilities.canManage}>
        <Form.List name="steps">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => {
                const stepId = form.getFieldValue(['steps', field.name, 'id']);
                const reportedQty = reportedQtyOf(stepId);
                const plannedQty = currentPlannedQtyOf(stepId);
                return (
                  <div
                    key={field.key}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'baseline',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ width: 20, textAlign: 'right' }}>
                      {index + 1}
                    </span>
                    <Form.Item name={[field.name, 'id']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'name']}
                      rules={[{ required: true, message: '步骤名称' }]}
                      style={{ marginBottom: 0, width: 240, maxWidth: '100%' }}
                    >
                      <Input placeholder="步骤名称，如 前处理/电镀" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'plannedQty']}
                      style={{ marginBottom: 0, width: 140, maxWidth: '100%' }}
                      rules={[
                        {
                          validator: (_rule, value: number | null) => {
                            if (value != null && value > (order?.qty ?? 0)) {
                              return Promise.reject(
                                new Error('不能超过委外单数量 ' + order?.qty),
                              );
                            }
                            if (
                              value != null &&
                              value < reportedQty &&
                              value < plannedQty
                            ) {
                              return Promise.reject(
                                new Error('不能低于已上报的 ' + reportedQty),
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <InputNumber
                        placeholder="计划量(可选)"
                        min={0}
                        max={order?.qty}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    {reportedQty > 0 ? (
                      <Typography.Text type="secondary">
                        已报 {reportedQty} / 计划 {plannedQty} / 剩余{' '}
                        {Math.max(0, plannedQty - reportedQty)}
                      </Typography.Text>
                    ) : null}
                    {reportedQty > 0 ? (
                      <Typography.Text type="secondary">
                        已有进度，不能删除
                      </Typography.Text>
                    ) : (
                      <Button
                        type="text"
                        danger
                        disabled={!capabilities.canManage}
                        aria-label={'删除第 ' + (index + 1) + ' 个步骤'}
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    )}
                  </div>
                );
              })}
              <Button
                type="dashed"
                disabled={!capabilities.canManage}
                onClick={() => add({ name: '' })}
                icon={<PlusOutlined />}
                block
              >
                添加步骤
              </Button>
            </>
          )}
        </Form.List>
        <Space wrap style={{ marginTop: 12 }}>
          <Button
            type="primary"
            loading={saving}
            disabled={!capabilities.canManage}
            onClick={handleSaveSteps}
          >
            保存步骤
          </Button>
          <Popconfirm
            title="重新生成会让已发出的旧二维码立即失效，确定？"
            onConfirm={handleRegenerateQr}
            okText="重新生成"
            cancelText="取消"
          >
            <Button
              icon={<QrcodeOutlined />}
              disabled={!capabilities.canManage}
            >
              重新生成（作废旧码）
            </Button>
          </Popconfirm>
        </Space>
      </Form>

      {qrUrl ? (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            textAlign: 'center',
          }}
        >
          {capabilities.renderQr(qrUrl, { size: 180, level: 'M', marginSize: 0 })}
          <Typography.Paragraph
            copyable={{ text: qrUrl }}
            style={{ marginTop: 8, wordBreak: 'break-all' }}
          >
            {qrUrl}
          </Typography.Paragraph>
          {qrExpiresAt ? (
            <Typography.Text type="secondary">
              有效期至 {capabilities.formatDateTime(qrExpiresAt)}
            </Typography.Text>
          ) : null}
          <div>
            <Typography.Text type="secondary">
              把二维码发给供应商，扫码即可免登录报工
            </Typography.Text>
          </div>
        </div>
      ) : null}

      <Typography.Title level={5} style={{ marginTop: 24 }}>
        进度上报记录
      </Typography.Title>
      {reports.length === 0 ? (
        <Empty description="暂无进度上报" />
      ) : (
        <Table
          rowKey="id"
          size="small"
          loading={loading}
          dataSource={reports}
          columns={reportColumns}
          pagination={false}
          scroll={{ x: 720 }}
        />
      )}
    </Drawer>
  );
}

export default OutsourcingProgressDrawer;
