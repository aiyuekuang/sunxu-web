import {
  ModalForm,
  type ProColumns,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DocumentLineBatchSettingsButton,
  type DocumentLineBatchField,
} from '../documents/DocumentLineBatchSettingsButton';
import { ResizableProTable as ProTable } from '../shared/ResizableTable';
import { StockCountLineFormList } from './StockCountLineFormList';
import type {
  StockCountDateValue,
  StockCountDetailDrawerProps,
  StockCountDetailLine,
  StockCountDetailModel,
  StockCountLineFormValue,
  StockCountLineInputPayload,
  StockCountSubmitLinePayload,
} from './stock-count-document-components-types';

interface StockCountLineFormValues {
  lines?: StockCountLineFormValue[];
}

interface StockCountBusinessDateFormValues {
  businessDate: StockCountDateValue;
}

interface StockCountReasonFormValues {
  reason: string;
}

/**
 * @sunxu-layer business
 * @sunxu-domain inventory
 * @sunxu-reason Preserves count status and blind-count display, line editing, actual-count entry, batch updates, and approve/reverse/cancel forms while APIs, permission results, custom fields, date policy, navigation, and messages stay host-owned.
 */
export function StockCountDetailDrawer({
  open,
  loading,
  detail,
  showLocationControl,
  onClose,
  onDetailChange,
  onReloadList,
  onPrint,
  capabilities,
}: StockCountDetailDrawerProps) {
  const [lineForm] = Form.useForm<StockCountLineFormValues>();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [lineDrafts, setLineDrafts] = useState<StockCountDetailLine[]>([]);
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);

  useEffect(() => {
    setLineDrafts(
      (detail?.lines ?? []).map((line) => ({
        ...line,
        inputActualQty: line.actualQty ?? undefined,
        inputRemarks: line.remarks ?? undefined,
      })),
    );
  }, [detail]);

  const availableActions = detail?.availableActions ?? [];
  const canEditLines = availableActions.includes(capabilities.actionKeys.update);
  const canInputActual = availableActions.includes(capabilities.actionKeys.submit);
  const isPreCount = detail
    ? capabilities.isPreCountStatus(detail.status)
    : false;
  const isBlindPreCount =
    isPreCount && detail?.countMode === capabilities.blindCountModeValue;
  const canShowDifference = !isPreCount;
  const canEditHeaderCustomFields = canEditLines;
  const allActualEntered =
    lineDrafts.length > 0 &&
    lineDrafts.every(
      (line) => !capabilities.isActualQtyBlank(line.inputActualQty),
    );
  const labels = capabilities.labels;

  const lineBatchSettingFields = useMemo<
    DocumentLineBatchField<StockCountDetailLine>[]
  >(
    () => [
      {
        key: 'actualQty',
        label: labels.batchActualQty,
        type: 'number',
        required: true,
        min: capabilities.validation.actualQtyMin,
        precision: capabilities.validation.actualQtyPrecision,
        patch: (inputActualQty) => ({ inputActualQty }),
      },
      {
        key: 'remarks',
        label: labels.batchRemarks,
        type: 'text',
        maxLength: capabilities.validation.remarksBatchMaxLength,
        patch: (inputRemarks) => ({ inputRemarks }),
      },
    ],
    [capabilities.validation, labels.batchActualQty, labels.batchRemarks],
  );

  const patchLine = useCallback(
    (lineId: string, patch: Partial<StockCountDetailLine>) => {
      setLineDrafts((current) =>
        current.map((line) =>
          line.id === lineId ? { ...line, ...patch } : line,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    const availableIds = new Set(lineDrafts.map((line) => line.id));
    setSelectedLineIds((current) => {
      const next = current.filter((lineId) => availableIds.has(lineId));
      return next.length === current.length ? current : next;
    });
  }, [lineDrafts]);

  const applyLineBatchSettings = useCallback(
    (patches: Array<Partial<StockCountDetailLine>>) => {
      const selectedIds = new Set(selectedLineIds);
      const mergedPatch: Partial<StockCountDetailLine> = {};
      for (const patch of patches) Object.assign(mergedPatch, patch);
      setLineDrafts((current) =>
        current.map((line) =>
          selectedIds.has(line.id) ? { ...line, ...mergedPatch } : line,
        ),
      );
    },
    [selectedLineIds],
  );

  const clearSelectedLines = useCallback(() => setSelectedLineIds([]), []);

  const runDetailAction = useCallback(
    async (
      action: () => Promise<StockCountDetailModel>,
      successText: string,
    ) => {
      const updatedDetail = await action();
      onDetailChange(updatedDetail);
      onReloadList();
      capabilities.notifySuccess(successText);
    },
    [capabilities, onDetailChange, onReloadList],
  );

  const handleSubmit = useCallback(async () => {
    if (!detail) return;
    const missingLine = lineDrafts.find((line) =>
      capabilities.isActualQtyBlank(line.inputActualQty),
    );
    if (missingLine) {
      capabilities.notifyWarning(labels.missingActualQty);
      return;
    }
    const lines: StockCountSubmitLinePayload[] = lineDrafts.map((line) =>
      capabilities.buildSubmitLinePayload(
        line,
        capabilities.lineCustomFieldSchema,
      ),
    );
    await runDetailAction(
      () => capabilities.submitStockCount(detail.id, lines),
      labels.submitted,
    );
  }, [capabilities, detail, labels, lineDrafts, runDetailAction]);

  const handleApproveFinish = useCallback(
    async (values: StockCountBusinessDateFormValues) => {
      if (!detail) return false;
      await runDetailAction(
        () =>
          capabilities.approveStockCount(
            detail.id,
            capabilities.normalizeBusinessDate(values.businessDate),
          ),
        labels.approved,
      );
      setApproveOpen(false);
      return true;
    },
    [capabilities, detail, labels.approved, runDetailAction],
  );

  const handleLineModalFinish = useCallback(
    async (values: StockCountLineFormValues) => {
      if (!detail) return false;
      const lines: StockCountLineInputPayload[] = (values.lines ?? []).map(
        (line) =>
          capabilities.buildLineInputPayload(
            line,
            capabilities.lineCustomFieldSchema,
          ),
      );
      if (lines.length === 0) {
        capabilities.notifyWarning(labels.minimumLineMessage);
        return false;
      }
      await runDetailAction(
        () => capabilities.updateStockCountLines(detail.id, lines),
        labels.linesUpdated,
      );
      setLineModalOpen(false);
      return true;
    },
    [capabilities, detail, labels, runDetailAction],
  );

  const handleReverseFinish = useCallback(
    async (values: StockCountReasonFormValues & StockCountBusinessDateFormValues) => {
      if (!detail) return false;
      const reason = values.reason.trim();
      if (!reason) {
        capabilities.notifyWarning(labels.reverseReasonWarning);
        return false;
      }
      await runDetailAction(
        () =>
          capabilities.reverseStockCount(
            detail.id,
            capabilities.normalizeBusinessDate(values.businessDate),
            reason,
          ),
        labels.reversed,
      );
      return true;
    },
    [capabilities, detail, labels, runDetailAction],
  );

  const handleCancelFinish = useCallback(
    async (values: StockCountReasonFormValues) => {
      if (!detail) return false;
      const reason = values.reason.trim();
      if (!reason) {
        capabilities.notifyWarning(labels.cancelReasonWarning);
        return false;
      }
      await runDetailAction(
        () => capabilities.cancelStockCount(detail.id, reason),
        labels.cancelled,
      );
      return true;
    },
    [capabilities, detail, labels, runDetailAction],
  );

  const lineColumns = useMemo<ProColumns<StockCountDetailLine>[]>(
    () => [
      {
        title: labels.materialName,
        dataIndex: ['material', 'name'],
        width: 180,
        ellipsis: true,
        render: (_, record) => record.material?.name || record.materialId,
      },
      {
        title: labels.materialCode,
        dataIndex: ['material', 'code'],
        width: 150,
        render: (_, record) => record.material?.code || '-',
      },
      {
        title: labels.stockOwner,
        dataIndex: 'ownerType',
        width: 120,
        render: (_, record) => {
          const owner = capabilities.getOwnerPresentation(record.ownerType);
          return <Tag color={owner.color}>{owner.label}</Tag>;
        },
      },
      {
        title: labels.locationColumn,
        dataIndex: ['location', 'pathName'],
        width: 160,
        ellipsis: true,
        hideInTable: !showLocationControl,
        render: (_, record) =>
          record.location?.pathName ||
          record.location?.name ||
          record.storageLocationSnapshot ||
          '-',
      },
      {
        title: labels.batchNo,
        dataIndex: 'batchNo',
        width: 130,
        render: (_, record) => record.batchNo || '-',
      },
      {
        title: labels.bookQty,
        dataIndex: 'bookQty',
        width: 100,
        align: 'right',
        hideInTable: isBlindPreCount,
        render: (_, record) => capabilities.formatQuantity(record.bookQty),
      },
      {
        title: labels.reservedQty,
        dataIndex: 'reservedQty',
        width: 90,
        align: 'right',
        hideInTable: isBlindPreCount,
        render: (_, record) => capabilities.formatQuantity(record.reservedQty),
      },
      {
        title: labels.frozenQty,
        dataIndex: 'frozenQty',
        width: 90,
        align: 'right',
        hideInTable: isBlindPreCount,
        render: (_, record) => capabilities.formatQuantity(record.frozenQty),
      },
      {
        title: labels.actualQty,
        dataIndex: 'actualQty',
        width: 150,
        render: (_, record) =>
          canInputActual ? (
            <InputNumber
              min={capabilities.validation.actualQtyMin}
              precision={capabilities.validation.actualQtyPrecision}
              value={record.inputActualQty}
              style={{ width: 128 }}
              onChange={(value) =>
                patchLine(record.id, { inputActualQty: value })
              }
            />
          ) : (
            capabilities.formatQuantity(record.actualQty)
          ),
      },
      {
        title: labels.differenceQty,
        dataIndex: 'varianceQty',
        width: 100,
        align: 'right',
        hideInTable: !canShowDifference,
        render: (_, record) => {
          const variance =
            record.inputActualQty !== undefined &&
            record.inputActualQty !== null
              ? Number(record.inputActualQty) - Number(record.bookQty ?? 0)
              : record.varianceQty;
          return (
            <Typography.Text
              type={capabilities.getVarianceTextType(variance)}
            >
              {capabilities.formatQuantity(variance)}
            </Typography.Text>
          );
        },
      },
      {
        title: labels.remarks,
        dataIndex: 'remarks',
        width: 180,
        render: (_, record) =>
          canInputActual ? (
            <Input
              value={record.inputRemarks}
              placeholder={labels.differenceReason}
              onChange={(event) =>
                patchLine(record.id, { inputRemarks: event.target.value })
              }
            />
          ) : (
            record.remarks || '-'
          ),
      },
      ...capabilities.renderLineCustomFieldColumns(
        capabilities.lineCustomFieldSchema,
      ),
      {
        title: labels.postingTransaction,
        dataIndex: 'adjustTransactionId',
        width: 150,
        render: (_, record) =>
          record.adjustTransaction?.transactionNo ||
          record.adjustTransactionId ||
          '-',
      },
    ],
    [
      canInputActual,
      canShowDifference,
      capabilities,
      isBlindPreCount,
      labels,
      patchLine,
      showLocationControl,
    ],
  );

  const statusPresentation = detail
    ? capabilities.getStatusPresentation(detail.status)
    : undefined;
  const canPrint =
    capabilities.permissions.canPrintJob &&
    capabilities.permissions.canViewStockList;
  const hasAction = (action: string) => availableActions.includes(action);

  return (
    <>
      <Drawer
        title={
          detail ? labels.countTitle(detail.countNo) : labels.emptyTitle
        }
        open={open}
        size="86vw"
        onClose={onClose}
        destroyOnHidden
      >
        {detail ? (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Space wrap>
              {statusPresentation ? (
                <Tag color={statusPresentation.color}>
                  {statusPresentation.label}
                </Tag>
              ) : null}
              <span>
                {labels.warehouse}：{detail.warehouse?.name ?? detail.warehouseId}
              </span>
              {showLocationControl ? (
                <span>
                  {labels.location}：
                  {detail.location?.pathName ||
                    detail.location?.name ||
                    detail.storageLocationSnapshot ||
                    labels.warehouseLevel}
                </span>
              ) : null}
              <span>
                {labels.countDate}：{capabilities.formatDateTime(detail.countDate)}
              </span>
              <span>
                {labels.countMode}：{capabilities.getCountModeLabel(detail.countMode)}
              </span>
            </Space>

            {isPreCount ? (
              <Alert
                showIcon
                type="info"
                message={labels.preCountGuidanceTitle}
                description={
                  isBlindPreCount
                    ? labels.blindPreCountGuidance
                    : labels.openPreCountGuidance
                }
              />
            ) : null}

            <Space wrap>
              {canPrint ? (
                <Button onClick={() => onPrint(detail.id)}>
                  {capabilities.getPrintActionLabel(detail.status)}
                </Button>
              ) : null}
              {hasAction(capabilities.actionKeys.start) &&
              capabilities.permissions.canAdjustStock ? (
                <Button
                  onClick={() =>
                    runDetailAction(
                      () => capabilities.startStockCount(detail.id),
                      labels.started,
                    )
                  }
                >
                  {labels.startCount}
                </Button>
              ) : null}
              {hasAction(capabilities.actionKeys.submit) &&
              capabilities.permissions.canAdjustStock ? (
                <Button
                  type="primary"
                  disabled={!allActualEntered}
                  onClick={handleSubmit}
                >
                  {labels.submitCount}
                </Button>
              ) : null}
              {canEditLines && capabilities.permissions.canAdjustStock ? (
                <Button
                  onClick={() => {
                    lineForm.resetFields();
                    lineForm.setFieldValue(
                      'lines',
                      capabilities.toLineInputValues(
                        detail,
                        capabilities.lineCustomFieldSchema,
                      ),
                    );
                    setLineModalOpen(true);
                  }}
                >
                  {labels.maintainLines}
                </Button>
              ) : null}
              {hasAction(capabilities.actionKeys.approve) &&
              capabilities.permissions.canAdjustStock ? (
                <Button type="primary" onClick={() => setApproveOpen(true)}>
                  {labels.approveAndPost}
                </Button>
              ) : null}
              {hasAction(capabilities.actionKeys.reverse) &&
              capabilities.permissions.canReverseStock ? (
                <Button danger onClick={() => setReverseOpen(true)}>
                  {labels.reverseCount}
                </Button>
              ) : null}
              {hasAction(capabilities.actionKeys.cancel) &&
              capabilities.permissions.canAdjustStock ? (
                <Button danger onClick={() => setCancelOpen(true)}>
                  {labels.cancelCount}
                </Button>
              ) : null}
            </Space>

            {capabilities.renderHeaderCustomFields(
              detail,
              capabilities.permissions.canAdjustStock && canEditHeaderCustomFields,
            )}

            <div role="region" aria-label={labels.lineTable} aria-busy={loading}>
              <ProTable<StockCountDetailLine>
                rowKey="id"
                search={false}
                loading={loading}
                dataSource={lineDrafts}
                columns={lineColumns}
                rowSelection={
                  canInputActual
                    ? {
                        selectedRowKeys: selectedLineIds,
                        onChange: (keys) =>
                          setSelectedLineIds(keys.map(String)),
                      }
                    : undefined
                }
                tableAlertOptionRender={
                  canInputActual
                    ? ({ onCleanSelected }) => (
                        <Space>
                          <DocumentLineBatchSettingsButton<StockCountDetailLine>
                            selectedCount={selectedLineIds.length}
                            fields={lineBatchSettingFields}
                            onApply={applyLineBatchSettings}
                          />
                          <Button
                            type="link"
                            onClick={() => {
                              onCleanSelected();
                              clearSelectedLines();
                            }}
                          >
                            {labels.clearSelection}
                          </Button>
                        </Space>
                      )
                    : undefined
                }
                pagination={false}
                scroll={{ x: 'max-content', y: 'calc(100dvh - 360px)' }}
                options={false}
              />
            </div>
          </Space>
        ) : null}
      </Drawer>

      <ModalForm<StockCountLineFormValues>
        key={detail?.id ?? 'stock-count-lines'}
        title={labels.lineUpdateTitle}
        width={900}
        open={lineModalOpen}
        form={lineForm}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{
          lines: detail
            ? capabilities.toLineInputValues(
                detail,
                capabilities.lineCustomFieldSchema,
              )
            : [],
        }}
        onOpenChange={(nextOpen) => {
          setLineModalOpen(nextOpen);
          if (!nextOpen) lineForm.resetFields();
        }}
        onFinish={handleLineModalFinish}
      >
        <Alert
          showIcon
          type="warning"
          style={{ marginBottom: 16 }}
          message={labels.lineUpdateWarning}
          description={labels.lineUpdateMessage}
        />
        <StockCountLineFormList
          form={lineForm}
          warehouseId={detail?.warehouseId}
          showLocationControl={showLocationControl}
          lineCustomFieldSchema={capabilities.lineCustomFieldSchema}
          titlePrefix={labels.maintainLines}
          minLineCount={capabilities.validation.minimumLineCount}
          capabilities={capabilities.lineFormCapabilities}
        />
      </ModalForm>

      <ModalForm<StockCountBusinessDateFormValues>
        key={`approve-${detail?.id ?? 'empty'}`}
        title={labels.approveTitle}
        open={approveOpen}
        modalProps={{ destroyOnHidden: true }}
        onOpenChange={setApproveOpen}
        onFinish={handleApproveFinish}
      >
        <Alert
          showIcon
          type="warning"
          message={labels.approveWarning}
          description={labels.approveDescription}
          style={{ marginBottom: 16 }}
        />
        {capabilities.renderBusinessDateField({
          name: 'businessDate',
          label: labels.approveDateLabel,
          extra: labels.approveDateExtra,
          required: true,
          initialValue: capabilities.getBusinessDateInitialValue(),
          disabledDate: capabilities.isBusinessDateDisabled,
        })}
      </ModalForm>

      <ModalForm<StockCountReasonFormValues & StockCountBusinessDateFormValues>
        key={`reverse-${detail?.id ?? 'empty'}`}
        title={labels.reverseTitle}
        open={reverseOpen}
        modalProps={{ destroyOnHidden: true }}
        onOpenChange={setReverseOpen}
        onFinish={handleReverseFinish}
      >
        <Alert
          showIcon
          type="warning"
          message={labels.reverseWarning}
          description={labels.reverseDescription}
          style={{ marginBottom: 16 }}
        />
        {capabilities.renderBusinessDateField({
          name: 'businessDate',
          label: labels.reverseDateLabel,
          extra: labels.reverseDateExtra,
          required: true,
          initialValue: capabilities.getBusinessDateInitialValue(),
          disabledDate: capabilities.isBusinessDateDisabled,
        })}
        <ProFormTextArea
          name="reason"
          label={labels.reverseReason}
          rules={[
            {
              required: true,
              whitespace: true,
              message: labels.reverseReasonRequired,
            },
          ]}
          fieldProps={{
            rows: 3,
            maxLength: capabilities.validation.reasonMaxLength,
            showCount: true,
          }}
        />
      </ModalForm>

      <ModalForm<StockCountReasonFormValues>
        title={labels.cancelTitle}
        open={cancelOpen}
        modalProps={{ destroyOnHidden: true }}
        onOpenChange={setCancelOpen}
        onFinish={handleCancelFinish}
      >
        <ProFormTextArea
          name="reason"
          label={labels.cancelReason}
          rules={[
            {
              required: true,
              whitespace: true,
              message: labels.cancelReasonRequired,
            },
          ]}
          fieldProps={{ rows: 3 }}
        />
      </ModalForm>
    </>
  );
}
