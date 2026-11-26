/** @sunxu-layer business @sunxu-domain quality @sunxu-reason Preserves inspection-item result inputs and photo/custom-field interactions while template judgement and dynamic field rendering remain host supplied. */
import { PlusOutlined } from '@ant-design/icons';
import {
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import {
  Card,
  Col,
  Form,
  Input,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import type {
  QualityInspectionItemResultFieldsProps,
  QualityInspectionItemResultType,
  QualityInspectionResultItem,
} from './quality-inspection-item-result-fields-types';

const RESULT_OPTIONS = [
  { label: '合格', value: 'pass' },
  { label: '不合格', value: 'fail' },
];

const numericMeasurementField = (itemId: string, measurementIndex: number) =>
  `measured_${itemId}_${measurementIndex}`;

function renderResultTag(value: unknown, isAutomatic: boolean) {
  if (value === 'pass') {
    return <Tag color="success">{isAutomatic ? '自动合格' : '合格'}</Tag>;
  }
  if (value === 'fail') {
    return <Tag color="error">{isAutomatic ? '自动不合格' : '不合格'}</Tag>;
  }
  return <Tag>{isAutomatic ? '录入后自动判定' : '待判定'}</Tag>;
}

/** Renders template-driven inspection result fields inside a host form. */
/**
 * @sunxu-layer business
 * @sunxu-domain quality
 * @sunxu-reason Presents reusable quality inspection item result fields behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function QualityInspectionItemResultFields<TSchema = unknown>({
  items,
  lineCustomFieldSchema,
  capabilities,
}: QualityInspectionItemResultFieldsProps<TSchema>) {
  return (
    <Card
      title="检验项结果录入"
      size="small"
      styles={{ body: { padding: 0 } }}
      extra={
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          数值和合格选项按模板标准自动判定
        </Typography.Text>
      }
      style={{ marginBottom: 16 }}
    >
      {items.map((item, index) => {
        const resultType: QualityInspectionItemResultType =
          item.resultType ??
          (item.upperLimit != null || item.lowerLimit != null
            ? 'numeric'
            : 'text');
        const itemWithResultType = { ...item, resultType };
        const measuredField = `measured_${item.id}`;
        const requiredMeasurementCount =
          resultType === 'numeric' ? item.requiredMeasurementCount || 1 : 1;
        const resultField = `passed_${item.id}`;
        const isAutomatic =
          capabilities.hasAutomaticInspectionJudgement(itemWithResultType);
        const needsMeasuredValue = resultType !== 'judgement';
        const manualJudgementHelp =
          resultType === 'numeric'
            ? '当前模板未配置上下限，需要人工判定'
            : resultType === 'selection'
              ? '当前模板未配置合格选项，需要人工判定'
              : undefined;

        return (
          <div
            key={item.id}
            style={{
              padding: 16,
              borderBottom:
                index === items.length - 1
                  ? undefined
                  : '1px solid var(--ant-color-border-secondary)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <Space size={6} wrap>
                  <Typography.Text strong>{item.itemName}</Typography.Text>
                  {item.isRequired && <Tag color="red">必检</Tag>}
                  {item.photoRequired && <Tag color="blue">必拍照片</Tag>}
                  {isAutomatic && <Tag color="processing">自动判定</Tag>}
                </Space>
                <div style={{ marginTop: 4 }}>
                  <Typography.Text type="secondary">
                    合格范围：
                    {capabilities.formatInspectionStandard(itemWithResultType)}
                  </Typography.Text>
                </div>
              </div>
              <Form.Item
                noStyle
                shouldUpdate={(previousValues, currentValues) =>
                  previousValues[resultField] !== currentValues[resultField]
                }
              >
                {({ getFieldValue }) =>
                  renderResultTag(getFieldValue(resultField), isAutomatic)
                }
              </Form.Item>
            </div>

            {isAutomatic && (
              <Form.Item name={resultField} hidden>
                <Input />
              </Form.Item>
            )}

            <Row gutter={[12, 4]} align="top">
              {resultType === 'numeric' &&
                Array.from(
                  { length: requiredMeasurementCount },
                  (_, valueIndex) => (
                    <Col
                      key={numericMeasurementField(item.id, valueIndex)}
                      xs={24}
                      md={
                        requiredMeasurementCount === 1
                          ? isAutomatic
                            ? 12
                            : 8
                          : 8
                      }
                    >
                      <ProFormDigit
                        name={numericMeasurementField(item.id, valueIndex)}
                        label={
                          requiredMeasurementCount === 1
                            ? '实测值'
                            : `测量值 ${valueIndex + 1}/${requiredMeasurementCount}`
                        }
                        placeholder="请输入实测值"
                        rules={[{ required: true, message: '请输入实测值' }]}
                        fieldProps={{
                          precision: 6,
                          addonAfter: item.unit || undefined,
                        }}
                      />
                    </Col>
                  ),
                )}
              {needsMeasuredValue && resultType !== 'numeric' && (
                <Col xs={24} md={isAutomatic ? 12 : 8}>
                  {resultType === 'selection' && (
                    <ProFormSelect
                      name={measuredField}
                      label="检验结果"
                      placeholder="请选择检验结果"
                      options={(item.options ?? []).map((value) => ({
                        label: value,
                        value,
                      }))}
                    />
                  )}
                  {resultType === 'text' && (
                    <ProFormText
                      name={measuredField}
                      label="检验记录"
                      placeholder="请输入检验记录"
                    />
                  )}
                </Col>
              )}

              {!isAutomatic && (
                <Col xs={24} md={needsMeasuredValue ? 8 : 10}>
                  <Form.Item
                    name={resultField}
                    label="判定结果"
                    initialValue="pass"
                    extra={manualJudgementHelp}
                    getValueProps={(value: unknown) => ({
                      value: typeof value === 'string' ? value : '',
                    })}
                  >
                    <Segmented block options={RESULT_OPTIONS} />
                  </Form.Item>
                </Col>
              )}

              <Col xs={24} md={isAutomatic ? 12 : needsMeasuredValue ? 8 : 14}>
                <ProFormText
                  name={`remark_${item.id}`}
                  label="备注"
                  placeholder="选填"
                />
              </Col>

              {capabilities.renderCustomFieldFormItems({
                schema: lineCustomFieldSchema,
                namePrefix: ['itemCustomValues', item.id],
                colSpan: 8,
              })}
              {item.photoRequired && (
                <Col xs={24}>
                  <Form.Item
                    name={`photos_${item.id}`}
                    label="必拍照片"
                    valuePropName="fileList"
                    getValueFromEvent={(event: UploadChangeParam<UploadFile>) =>
                      event.fileList
                    }
                    rules={[
                      {
                        type: 'array',
                        required: true,
                        min: 1,
                        message: `请上传检验项「${item.itemName}」的照片`,
                      },
                    ]}
                  >
                    <Upload
                      accept="image/*"
                      listType="picture-card"
                      maxCount={5}
                      beforeUpload={() => false}
                    >
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>添加照片</div>
                      </div>
                    </Upload>
                  </Form.Item>
                </Col>
              )}
            </Row>
          </div>
        );
      })}
    </Card>
  );
}
