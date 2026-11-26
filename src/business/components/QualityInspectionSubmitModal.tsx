/** @sunxu-layer business @sunxu-domain quality-inspection @sunxu-reason Preserves inspection submission fields, automatic form synchronization, defect coverage, and validation while calculations, services, dictionary fields, and feedback remain host supplied. */
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, Button, Col, Form, Input, Row } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useMemo, useState } from 'react';
import { StatusDisplay } from '../../components/StatusDisplay';
import { QualityInspectionDefectModal } from './QualityInspectionDefectModal';
import type {
  QualityInspectionSubmitRecordPayload,
  QualityInspectionSubmitFormValues,
  QualityInspectionSubmitModalProps,
} from './quality-inspection-modal-types';

const numericMeasurementField = (itemId: string, measurementIndex: number) =>
  `measured_${itemId}_${measurementIndex}`;

/** Inspection record entry form; host owns the authoritative submit and rule adapters. */
export function QualityInspectionSubmitModal({
  open,
  onOpenChange,
  inspectionId,
  inspectionType,
  recheckSource,
  items,
  defects,
  initialValues,
  lineCustomFieldSchema,
  onDefectsChange,
  onSuccess,
  capabilities,
}: QualityInspectionSubmitModalProps) {
  const [form] = Form.useForm<QualityInspectionSubmitFormValues>();
  const [defectOpen, setDefectOpen] = useState(false);
  const [createdDefects, setCreatedDefects] = useState(defects.slice(0, 0));
  const failQtyValue = Form.useWatch('failQty', form);
  const conclusionValue = Form.useWatch('conclusion', form);
  const conclusion =
    typeof conclusionValue === 'string' ? conclusionValue : undefined;
  const mergedDefects = useMemo(() => {
    const byId = new Map<string, (typeof defects)[number]>();
    [...defects, ...createdDefects].forEach((defect) => {
      byId.set(defect.id, defect);
    });
    return [...byId.values()];
  }, [createdDefects, defects]);
  const defectCoverage = useMemo(
    () => capabilities.summarizeDefectCoverage(failQtyValue, mergedDefects),
    [capabilities, failQtyValue, mergedDefects],
  );

  const syncAutoFields = (params?: {
    changedQtyField?: 'sampleQty' | 'passQty';
    autoJudgeItemIds?: string[];
    initializeBlankResults?: boolean;
  }) => {
    const nextValues: QualityInspectionSubmitFormValues = {};
    const autoJudgeItemIds = new Set(params?.autoJudgeItemIds ?? []);

    if (params?.changedQtyField) {
      const qtyPatch = capabilities.deriveInspectionQuantitiesFromPass({
        sampleQty: form.getFieldValue('sampleQty'),
        passQty: form.getFieldValue('passQty'),
      });
      (['passQty', 'failQty'] as const).forEach((fieldName) => {
        if (
          Object.hasOwn(qtyPatch, fieldName) &&
          form.getFieldValue(fieldName) !== qtyPatch[fieldName]
        ) {
          nextValues[fieldName] = qtyPatch[fieldName];
        }
      });
    }

    items.forEach((item) => {
      const measuredField = `measured_${item.id}`;
      const resultField = `passed_${item.id}`;
      const shouldAutoJudge =
        autoJudgeItemIds.has(item.id) ||
        (params?.initializeBlankResults === true &&
          capabilities.hasAutomaticInspectionJudgement(item));
      if (!shouldAutoJudge) return;
      const nextResult =
        item.resultType === 'numeric'
          ? (() => {
              const measuredValues = Array.from(
                { length: capabilities.getRequiredMeasurementCount(item) },
                (_, measurementIndex) =>
                  form.getFieldValue(
                    numericMeasurementField(item.id, measurementIndex),
                  ) as number | undefined,
              );
              if (
                measuredValues.some(
                  (value) => value === undefined || !Number.isFinite(value),
                )
              ) {
                return undefined;
              }
              const results = measuredValues.map((value) =>
                capabilities.evaluateInspectionItem(item, value),
              );
              return results.some((result) => result === false)
                ? false
                : results.every((result) => result === true)
                  ? true
                  : undefined;
            })()
          : capabilities.evaluateInspectionItem(
              item,
              form.getFieldValue(measuredField) as string | number | undefined,
            );
      const normalizedResult =
        nextResult === undefined ? undefined : nextResult ? 'pass' : 'fail';
      if (form.getFieldValue(resultField) !== normalizedResult) {
        nextValues[resultField] = normalizedResult;
      }
    });

    const sampleQty = form.getFieldValue('sampleQty');
    const passQty = Number(
      nextValues.passQty ?? form.getFieldValue('passQty') ?? 0,
    );
    const failQty = Number(
      nextValues.failQty ?? form.getFieldValue('failQty') ?? 0,
    );
    const hasFailedItem = items.some((item) => {
      const fieldName = `passed_${item.id}`;
      const currentValue =
        (nextValues[fieldName] as string | undefined) ??
        (form.getFieldValue(fieldName) as string | undefined);
      return currentValue === 'fail';
    });
    const nextConclusion = capabilities.hasCompleteInspectionQuantities({
      sampleQty,
      passQty,
      failQty,
    })
      ? capabilities.deriveInspectionConclusion({
          passQty,
          failQty,
          hasFailedItem,
        })
      : undefined;
    if (form.getFieldValue('conclusion') !== nextConclusion) {
      nextValues.conclusion = nextConclusion;
    }

    if (Object.keys(nextValues).length > 0) {
      form.setFieldsValue(nextValues);
    }
  };

  const handleValuesChange = (
    changedValues: QualityInspectionSubmitFormValues,
  ) => {
    const changedFieldNames = Object.keys(changedValues);
    const changedQtyField = (['sampleQty', 'passQty'] as const).find(
      (fieldName) => Object.hasOwn(changedValues as object, fieldName),
    );
    const autoJudgeItemIds = changedFieldNames.flatMap((fieldName) => {
      if (fieldName.startsWith('measured_')) {
        const item = items.find((candidate) =>
          fieldName.startsWith(`measured_${candidate.id}`),
        );
        return item ? [item.id] : [];
      }
      if (
        fieldName.startsWith('passed_') &&
        changedValues[fieldName] === undefined
      ) {
        return fieldName.slice('passed_'.length);
      }
      return [];
    });
    const shouldSync = changedFieldNames.some(
      (fieldName) =>
        fieldName === 'sampleQty' ||
        fieldName === 'passQty' ||
        fieldName.startsWith('measured_') ||
        fieldName.startsWith('passed_'),
    );
    if (shouldSync) {
      syncAutoFields({
        changedQtyField,
        autoJudgeItemIds,
      });
    }
  };

  const handleSubmit = async (values: QualityInspectionSubmitFormValues) => {
    const recordType =
      inspectionType === 'ipqc' &&
      capabilities.isProcessRecordType(values.recordType)
        ? values.recordType
        : 'other';
    if (
      inspectionType === 'ipqc' &&
      !capabilities.isProcessRecordType(values.recordType)
    ) {
      capabilities.notifyError('请选择过程检验的检查方式');
      return false;
    }
    const sampleQty = capabilities.normalizeInspectionQty(values.sampleQty);
    const passQty = capabilities.normalizeInspectionQty(values.passQty);
    const failQty = capabilities.normalizeInspectionQty(values.failQty);
    const conclusionValue = values.conclusion as string | undefined;

    if (sampleQty === undefined || sampleQty < capabilities.inspectionQtyMin) {
      capabilities.notifyError('请输入有效的抽检数量');
      return false;
    }
    if (
      passQty === undefined ||
      failQty === undefined ||
      passQty < 0 ||
      failQty < 0
    ) {
      capabilities.notifyError(
        '请输入有效的合格数量，系统将自动计算不合格数量',
      );
      return false;
    }
    if (!capabilities.isInspectionQtyClosed(sampleQty, passQty, failQty)) {
      capabilities.notifyError('合格数量和不合格数量之和必须等于抽检数量');
      return false;
    }
    if (!conclusionValue) {
      capabilities.notifyError('请先填写抽检数量和合格数量');
      return false;
    }

    const itemCustomValues =
      values.itemCustomValues &&
      typeof values.itemCustomValues === 'object' &&
      !Array.isArray(values.itemCustomValues)
        ? (values.itemCustomValues as Record<string, unknown>)
        : {};
    const mappedItems: QualityInspectionSubmitRecordPayload['items'] = [];
    for (const item of items) {
      let measuredValues: number[] | undefined;
      let measuredValue: string | undefined;
      if (item.resultType === 'numeric') {
        measuredValues = Array.from(
          { length: capabilities.getRequiredMeasurementCount(item) },
          (_, measurementIndex) =>
            Number(values[numericMeasurementField(item.id, measurementIndex)]),
        );
        if (measuredValues.some((value) => !Number.isFinite(value))) {
          capabilities.notifyError(
            `检验项「${item.itemName}」要求录入${capabilities.getRequiredMeasurementCount(item)}个有效测量值`,
          );
          return false;
        }
      } else {
        measuredValue =
          values[`measured_${item.id}`] == null
            ? undefined
            : String(values[`measured_${item.id}`]);
      }
      let photoUrls: string[] | undefined;
      if (item.photoRequired) {
        const photoFiles = (
          (values[`photos_${item.id}`] as UploadFile[] | undefined) ?? []
        ).flatMap((file) => (file.originFileObj ? [file.originFileObj] : []));
        if (photoFiles.length === 0) {
          capabilities.notifyError(`请上传检验项「${item.itemName}」的照片`);
          return false;
        }
        photoUrls = await capabilities.uploadInspectionImages(photoFiles);
        if (photoUrls.length !== photoFiles.length) {
          capabilities.notifyError(
            `检验项「${item.itemName}」照片上传失败，请重试`,
          );
          return false;
        }
      }
      mappedItems.push({
        id: item.id,
        photoUrls,
        measuredValue,
        measuredValues,
        isPassed:
          values[`passed_${item.id}`] === undefined
            ? undefined
            : values[`passed_${item.id}`] === 'pass',
        remarks: (values[`remark_${item.id}`] as string) ?? undefined,
        ...(capabilities.buildItemCustomValuePayload(
          itemCustomValues[item.id],
          lineCustomFieldSchema,
        ) ?? {}),
      });
    }

    await capabilities.submitRecord({
      id: inspectionId,
      recordType,
      recheckOfRecordId: recheckSource?.id,
      operatorId:
        inspectionType === 'ipqc' ? (values.operatorId as string) : undefined,
      sampleQty,
      passQty,
      failQty,
      remarks: (values.remarks as string) ?? undefined,
      items: mappedItems,
    });
    capabilities.notifySuccess(
      recheckSource ? '复检记录已保存' : '检查记录已保存',
    );
    onSuccess();
    return true;
  };

  const typeLabel =
    capabilities.inspectionTypeLabels[inspectionType] ?? inspectionType;

  return (
    <>
      <ModalForm<QualityInspectionSubmitFormValues>
        title={recheckSource ? '发起复检' : '新增检查记录'}
        open={open}
        width={800}
        form={form}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            form.resetFields();
            setCreatedDefects([]);
            setDefectOpen(false);
          }
          onOpenChange(nextOpen);
        }}
        onValuesChange={handleValuesChange}
        onFinish={handleSubmit}
        modalProps={{
          destroyOnHidden: true,
          ...capabilities.scrollableModalProps,
          afterOpenChange: (nextOpen) => {
            if (nextOpen) {
              form.setFieldsValue(initialValues);
              syncAutoFields({
                changedQtyField: 'sampleQty',
                initializeBlankResults: true,
              });
            }
          },
        }}
        initialValues={initialValues}
      >
        <Alert
          showIcon
          type="info"
          message={`检验阶段：${typeLabel}`}
          description={
            recheckSource
              ? `本次复检关联第 ${recheckSource.sequenceNo} 次不合格检查记录；复检结果不会自动覆盖原不合格，仍需按处置流程放行。`
              : inspectionType === 'ipqc'
                ? '检验阶段由当前质检单确定；本次选择实际检查方式。'
                : '检验阶段和抽样方式均由当前质检单及其检验模板确定，本次无需选择过程检查方式。'
          }
          style={{ marginBottom: 16 }}
        />
        {inspectionType === 'ipqc' ? (
          <>
            <ProFormSelect
              name="recordType"
              label="检查方式"
              rules={[{ required: true, message: '请选择检查方式' }]}
              options={[
                { label: '首件检', value: 'first' },
                { label: '过程/巡检', value: 'process' },
                { label: '末件检', value: 'last' },
                { label: '其他检查', value: 'other' },
              ]}
            />
            <ProFormSelect
              name="operatorId"
              label="本次作业人"
              rules={[{ required: true, message: '请选择本次受检作业人' }]}
              showSearch
              debounceTime={300}
              request={capabilities.requestUsers}
              fieldProps={{
                filterOption: false,
                placeholder: '选择本次受检工件的实际作业人',
              }}
              extra="跨班或换人时，每次检查记录分别选择实际作业人；检查人由当前登录账号自动记录。"
            />
          </>
        ) : null}
        <Row gutter={16}>
          <Col span={8}>
            <ProFormDigit
              name="sampleQty"
              {...capabilities.getFieldHelpProps('sampleQty')}
              rules={[{ required: true, message: '请输入抽检数量' }]}
              min={capabilities.inspectionQtyMin}
              fieldProps={{ precision: 4 }}
            />
          </Col>
          <Col span={8}>
            <ProFormDigit
              name="passQty"
              {...capabilities.getFieldHelpProps('passQty')}
              rules={[{ required: true, message: '请输入合格数量' }]}
              min={0}
              fieldProps={{ precision: 4 }}
            />
          </Col>
          <Col span={8}>
            <ProFormDigit
              name="failQty"
              {...capabilities.getFieldHelpProps('failQty')}
              rules={[{ required: true, message: '请输入不合格数量' }]}
              min={0}
              fieldProps={{ precision: 4, readOnly: true }}
              extra="按抽检数量减去合格数量自动计算"
            />
          </Col>
        </Row>

        {defectCoverage.requiredQty > 0 && (
          <Alert
            showIcon
            type={defectCoverage.isCovered ? 'success' : 'warning'}
            message={`缺陷记录：已记录 ${defectCoverage.recordedQty} / 不合格 ${defectCoverage.requiredQty}`}
            description={
              defectCoverage.isCovered
                ? '缺陷数量已覆盖当前累计不合格数量。'
                : `当前还差 ${defectCoverage.missingQty}。检查记录可先保存，完成质检单前需补齐缺陷。`
            }
            action={
              <Button
                size="small"
                type={defectCoverage.isCovered ? 'default' : 'primary'}
                onClick={() => setDefectOpen(true)}
              >
                {defectCoverage.recordedQty > 0 ? '继续添加缺陷' : '添加缺陷'}
              </Button>
            }
            style={{ marginBottom: 16 }}
          />
        )}

        {items.length > 0 &&
          capabilities.renderInspectionItemFields(
            items,
            lineCustomFieldSchema,
          )}

        <Form.Item
          {...capabilities.getFieldHelpProps('conclusion')}
          extra="填写抽检数量和合格数量后，系统自动计算不合格数量，并结合检验项结果判定结论。"
        >
          <Form.Item name="conclusion" hidden>
            <Input />
          </Form.Item>
          <div aria-live="polite">
            {conclusion ? (
              <StatusDisplay
                value={conclusion}
                enumMap={capabilities.conclusionEnum}
              />
            ) : (
              <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                系统自动判定
              </span>
            )}
          </div>
        </Form.Item>
        <ProFormTextArea
          name="remarks"
          {...capabilities.getFieldHelpProps('inspectionRemarks')}
          fieldProps={{ rows: 2 }}
          placeholder="其他说明（可选）"
        />
      </ModalForm>
      <QualityInspectionDefectModal
        open={defectOpen}
        onOpenChange={setDefectOpen}
        inspectionId={inspectionId}
        initialQty={
          defectCoverage.missingQty > 0
            ? defectCoverage.missingQty
            : undefined
        }
        capabilities={capabilities.defectModal}
        onSuccess={(defect) => {
          setCreatedDefects((current) => [...current, defect]);
          onDefectsChange();
        }}
      />
    </>
  );
}
