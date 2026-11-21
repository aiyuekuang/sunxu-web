import { Checkbox, Form, Input, InputNumber, Select } from 'antd';
import type { ReportDynamicFieldsProps } from './report-dynamic-fields-types';

/**
 * @sunxu-component mes-specific
 * @sunxu-domain production
 * @sunxu-reason Renders the dynamic work-report inputs selected by the authoritative precheck while report fields and number formatting remain host supplied.
 */
export function ReportDynamicFields({
  precheck,
  formatNumber,
}: ReportDynamicFieldsProps) {
  const requiredInputs = precheck?.requiredInputs ?? [];
  const batchOptions = precheck?.batchOptions ?? [];

  return (
    <>
      {precheck?.quantityInputMode === 'operation' ? (
        <>
          <Form.Item
            name="reportedOperationQty"
            preserve={false}
            label={`本次完成数量（${precheck.operationReportUnit || '工序单位'}）`}
            rules={[{ required: true, message: '请输入完成数量' }]}
          >
            <InputNumber min={0} precision={4} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="reportedOperationScrappedQty"
            preserve={false}
            label={`本次报废数量（${precheck.operationReportUnit || '工序单位'}）`}
          >
            <InputNumber min={0} precision={4} style={{ width: '100%' }} />
          </Form.Item>
        </>
      ) : (
        <>
          <Form.Item
            name="completedQty"
            preserve={false}
            label="本次完成数量"
            rules={[{ required: true, message: '请输入完成数量' }]}
          >
            <InputNumber min={0} precision={4} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="scrappedQty" label="本次报废数量" preserve={false}>
            <InputNumber min={0} precision={4} style={{ width: '100%' }} />
          </Form.Item>
        </>
      )}

      {requiredInputs.includes('batchNo') && batchOptions.length > 0 ? (
        <Form.Item
          name="batchNo"
          preserve={false}
          label="生产批号"
          rules={[{ required: true, message: '请选择本次报工的生产批号' }]}
        >
          <Select<string>
            placeholder="请选择实际生产批号"
            options={batchOptions.map((batchNo) => ({
              value: batchNo,
              label: batchNo,
            }))}
            showSearch={{ optionFilterProp: 'label' }}
            size="large"
          />
        </Form.Item>
      ) : null}

      {requiredInputs.includes('scheduleEntryId') ? (
        <Form.Item
          name="scheduleEntryId"
          preserve={false}
          label="本次作业设备/时间段"
          rules={[{ required: true, message: '请选择实际作业排产' }]}
        >
          <Select
            options={(precheck?.scheduleOptions ?? []).map((item) => ({
              value: item.id,
              label: `${item.label}${
                item.remainingQty == null
                  ? ''
                  : ` · 可报${formatNumber(item.remainingQty, { maximumFractionDigits: 4 })}`
              }`,
            }))}
          />
        </Form.Item>
      ) : null}

      <Form.Item name="durationMinutes" label="工时（分钟）">
        <InputNumber min={0} precision={2} style={{ width: '100%' }} />
      </Form.Item>

      {requiredInputs.includes('zeroQuantityReason') ? (
        <Form.Item
          name="zeroQuantityReason"
          preserve={false}
          label="零数量报工原因"
          rules={[{ required: true, message: '请填写零数量报工原因' }]}
        >
          <Input.TextArea maxLength={500} rows={2} />
        </Form.Item>
      ) : null}

      {requiredInputs.includes('scrapReason') ? (
        <Form.Item
          name="scrapReason"
          preserve={false}
          label="报废原因"
          rules={[{ required: true, message: '请填写报废原因' }]}
        >
          <Input.TextArea maxLength={500} rows={2} />
        </Form.Item>
      ) : null}

      {requiredInputs.includes('abnormalDurationConfirmed') ? (
        <>
          <Form.Item
            name="abnormalDurationConfirmed"
            preserve={false}
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error('请确认异常工时')),
              },
            ]}
          >
            <Checkbox>确认本次为跨日作业或事后补录</Checkbox>
          </Form.Item>
          <Form.Item
            name="abnormalDurationNote"
            preserve={false}
            label="跨日/补录说明"
            rules={[{ required: true, message: '请填写异常工时说明' }]}
          >
            <Input.TextArea maxLength={500} rows={2} />
          </Form.Item>
        </>
      ) : null}
    </>
  );
}

export type { ReportDynamicFieldsProps };
