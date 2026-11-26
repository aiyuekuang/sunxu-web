import {
  CopyOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { FormRule } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import React from 'react';
import type { ReactNode } from 'react';

export type QualityTemplateResultType =
  | 'numeric'
  | 'judgement'
  | 'selection'
  | 'text';

export interface QualityTemplateItemFormValue extends Record<string, unknown> {
  id?: string;
  code?: string;
  name: string;
  resultType: QualityTemplateResultType;
  specType?: string;
  unit?: string;
  standard?: string;
  requiredMeasurementCount?: number;
  lowerLimit?: number;
  upperLimit?: number;
  spcEnabled?: boolean;
  options?: string[];
  acceptedValues?: string[];
  isRequired?: boolean;
  photoRequired?: boolean;
}

export type QualityTemplateItemsEditorProps = {
  emptyItem: QualityTemplateItemFormValue;
  renderSpecTypeField: (props: {
    name: NamePath;
    label: string;
    rules: FormRule[];
    typeCode: 'spec_type';
  }) => ReactNode;
  /** Optional full-width host fields, rendered between the standard and result settings. The index is relative to the Form.List name `items`. */
  renderItemExtraFields?: (props: { itemIndex: number }) => ReactNode;
};

const RESULT_TYPE_OPTIONS = [
  { label: '数值', value: 'numeric' },
  { label: '合格/不合格', value: 'judgement' },
  { label: '选项', value: 'selection' },
  { label: '文本记录', value: 'text' },
];

function clearFieldsForResultType(
  form: ReturnType<typeof Form.useFormInstance>,
  itemIndex: number,
  resultType: QualityTemplateResultType,
) {
  if (resultType !== 'numeric') {
    form.setFieldValue(['items', itemIndex, 'unit'], undefined);
    form.setFieldValue(['items', itemIndex, 'lowerLimit'], undefined);
    form.setFieldValue(['items', itemIndex, 'upperLimit'], undefined);
    form.setFieldValue(['items', itemIndex, 'spcEnabled'], false);
    form.setFieldValue(['items', itemIndex, 'requiredMeasurementCount'], 1);
  }
  if (resultType !== 'selection') {
    form.setFieldValue(['items', itemIndex, 'options'], undefined);
    form.setFieldValue(['items', itemIndex, 'acceptedValues'], undefined);
  }
}

/**
 * @sunxu-layer business
 * @sunxu-domain quality-inspection-templates
 * @sunxu-reason Preserves the dynamic inspection-item editor, result-type cleanup, numeric/selection rules, copy/remove actions, and required/photo/SPC flags while specification dictionary options and optional per-item fields are supplied by the host.
 */
export function QualityTemplateItemsEditor({
  emptyItem,
  renderSpecTypeField,
  renderItemExtraFields,
}: QualityTemplateItemsEditorProps) {
  const form = Form.useFormInstance();

  return (
    <Form.List
      name="items"
      rules={[
        {
          validator: async (_, items) => {
            if (!items || items.length === 0) {
              return Promise.reject(new Error('至少添加一个检验项'));
            }
          },
        },
      ]}
    >
      {(fields, { add, remove }, { errors }) => (
        <>
          {fields.map(({ key, name }) => (
            <div
              key={key}
              style={{
                border: '1px solid var(--ant-color-border)',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                background: 'var(--ant-color-bg-layout)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <Space size={6}>
                  <Typography.Text strong>检验项 #{name + 1}</Typography.Text>
                  <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) => {
                      const resultType = getFieldValue([
                        'items',
                        name,
                        'resultType',
                      ]) as QualityTemplateResultType | undefined;
                      const lowerLimit = getFieldValue([
                        'items',
                        name,
                        'lowerLimit',
                      ]);
                      const upperLimit = getFieldValue([
                        'items',
                        name,
                        'upperLimit',
                      ]);
                      return resultType === 'numeric' &&
                        (lowerLimit != null || upperLimit != null) ? (
                        <Tag color="processing">按实测值自动判定</Tag>
                      ) : null;
                    }}
                  </Form.Item>
                </Space>
                <Space size={0}>
                  <Button
                    type="text"
                    size="small"
                    aria-label={`复制检验项 ${name + 1}`}
                    icon={<CopyOutlined />}
                    onClick={() => {
                      const currentItems =
                        (form.getFieldValue('items') as
                          | QualityTemplateItemFormValue[]
                          | undefined) ?? [];
                      const sourceItem = currentItems[name];
                      if (!sourceItem) return;
                      add(
                        {
                          ...sourceItem,
                          name: `${sourceItem.name}（副本）`,
                          code: undefined,
                        },
                        name + 1,
                      );
                    }}
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    aria-label={`删除检验项 ${name + 1}`}
                    icon={<MinusCircleOutlined />}
                    onClick={() => remove(name)}
                    disabled={fields.length === 1}
                  />
                </Space>
              </div>

              <Row gutter={[12, 0]}>
                <Col xs={24} lg={8}>
                  <Form.Item
                    name={[name, 'name']}
                    label="检验项名称"
                    rules={[{ required: true, message: '请输入名称' }]}
                  >
                    <Input placeholder="例如：厚度" />
                  </Form.Item>
                </Col>
                <Col xs={12} lg={5}>
                  <Form.Item
                    name={[name, 'resultType']}
                    label="结果类型"
                    rules={[{ required: true, message: '请选择结果类型' }]}
                  >
                    <Select
                      placeholder="请选择"
                      options={RESULT_TYPE_OPTIONS}
                      onChange={(value: QualityTemplateResultType) =>
                        clearFieldsForResultType(form, name, value)
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={12} lg={5}>
                  {renderSpecTypeField({
                    name: [name, 'specType'],
                    label: '规格类型',
                    rules: [{ required: true, message: '请选择规格类型' }],
                    typeCode: 'spec_type',
                  })}
                </Col>
                <Col xs={12} lg={3}>
                  <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) => (
                      <Form.Item name={[name, 'unit']} label="单位">
                        <Input
                          placeholder="如 mm"
                          disabled={
                            getFieldValue(['items', name, 'resultType']) !==
                            'numeric'
                          }
                        />
                      </Form.Item>
                    )}
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[12, 0]}>
                <Col xs={24}>
                  <Form.Item
                    name={[name, 'standard']}
                    label="检验标准"
                    rules={[{ required: true, message: '请输入检验标准' }]}
                  >
                    <Input placeholder="说明怎么测、用什么方法或依据哪份图纸" />
                  </Form.Item>
                </Col>
              </Row>

              {renderItemExtraFields?.({ itemIndex: name })}

              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => {
                  const resultType = getFieldValue([
                    'items',
                    name,
                    'resultType',
                  ]) as QualityTemplateResultType | undefined;
                  const unit =
                    (getFieldValue(['items', name, 'unit']) as
                      | string
                      | undefined) || undefined;
                  const optionValues =
                    (getFieldValue(['items', name, 'options']) as
                      | string[]
                      | undefined) ?? [];

                  if (resultType === 'numeric') {
                    return (
                      <div
                        style={{
                          padding: 12,
                          marginBottom: 12,
                          border: '1px solid var(--ant-color-border-secondary)',
                          borderRadius: 8,
                          background: 'var(--ant-color-bg-container)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            marginBottom: 10,
                          }}
                        >
                          <Typography.Text strong>合格范围</Typography.Text>
                          <Typography.Text type="secondary">
                            边界值计入合格范围
                          </Typography.Text>
                        </div>
                        <Row gutter={[12, 0]}>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name={[name, 'requiredMeasurementCount']}
                              label="测量要求数量"
                              rules={[
                                {
                                  required: true,
                                  message: '请输入测量要求数量',
                                },
                              ]}
                            >
                              <InputNumber
                                min={1}
                                max={100}
                                precision={0}
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name={[name, 'lowerLimit']}
                              label="合格下限（≥）"
                            >
                              <InputNumber
                                placeholder="不限制下限"
                                addonAfter={unit}
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name={[name, 'upperLimit']}
                              label="合格上限（≤）"
                              dependencies={[['items', name, 'lowerLimit']]}
                              rules={[
                                ({ getFieldValue: getValue }) => ({
                                  validator(_, value) {
                                    const lower = getValue([
                                      'items',
                                      name,
                                      'lowerLimit',
                                    ]);
                                    if (
                                      value != null &&
                                      lower != null &&
                                      value < lower
                                    ) {
                                      return Promise.reject(
                                        new Error('上限不能小于下限'),
                                      );
                                    }
                                    return Promise.resolve();
                                  },
                                }),
                              ]}
                            >
                              <InputNumber
                                placeholder="不限制上限"
                                addonAfter={unit}
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Typography.Text
                          type="secondary"
                          style={{ display: 'block', marginTop: 8 }}
                        >
                          配置至少一个限值后，质检员录入实测值，系统会立即自动判定合格或不合格；两项都留空时仍需人工判定。
                        </Typography.Text>
                      </div>
                    );
                  }

                  if (resultType === 'selection') {
                    return (
                      <div
                        style={{
                          padding: 12,
                          marginBottom: 12,
                          border: '1px solid var(--ant-color-border-secondary)',
                          borderRadius: 8,
                          background: 'var(--ant-color-bg-container)',
                        }}
                      >
                        <Row gutter={[12, 0]}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name={[name, 'options']}
                              label="可选结果"
                              rules={[
                                {
                                  required: true,
                                  message: '请至少配置一个可选结果',
                                },
                              ]}
                            >
                              <Select
                                mode="tags"
                                placeholder="输入后回车添加，例如：无划痕"
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name={[name, 'acceptedValues']}
                              label="其中哪些结果合格"
                            >
                              <Select
                                mode="multiple"
                                placeholder="可不选，不选时由质检员人工判定"
                                options={optionValues.map((value) => ({
                                  label: value,
                                  value,
                                }))}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    );
                  }

                  return null;
                }}
              </Form.Item>

              <Space size={20} wrap>
                <Form.Item
                  name={[name, 'isRequired']}
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>必检</Checkbox>
                </Form.Item>
                <Form.Item
                  name={[name, 'photoRequired']}
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>必拍照片</Checkbox>
                </Form.Item>
                <Form.Item noStyle shouldUpdate>
                  {({ getFieldValue }) => (
                    <Form.Item
                      name={[name, 'spcEnabled']}
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Checkbox
                        disabled={
                          getFieldValue(['items', name, 'resultType']) !==
                          'numeric'
                        }
                      >
                        用于 SPC
                      </Checkbox>
                    </Form.Item>
                  )}
                </Form.Item>
                <Form.Item noStyle shouldUpdate>
                  {({ getFieldValue }) =>
                    getFieldValue(['items', name, 'photoRequired']) ? (
                      <Typography.Text type="secondary">
                        必拍项目提交时也需录入检验结果；“必检”选项保持原值
                      </Typography.Text>
                    ) : null
                  }
                </Form.Item>
              </Space>
            </div>
          ))}

          <Form.ErrorList errors={errors} />

          <Button
            type="dashed"
            onClick={() => add({ ...emptyItem })}
            icon={<PlusOutlined />}
            style={{ width: '100%', marginTop: 4 }}
          >
            添加检验项
          </Button>
        </>
      )}
    </Form.List>
  );
}
