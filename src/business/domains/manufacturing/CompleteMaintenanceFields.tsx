import { UploadOutlined } from '@ant-design/icons';
import { ProFormTextArea } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Form,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import type { CompleteMaintenanceFieldsProps } from './complete-maintenance-fields-types';

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Preserves host maintenance completion step fields, required photo uploads, and overall remarks while field help copy comes from the host.
 */
export function CompleteMaintenanceFields({
  record,
  capabilities,
}: CompleteMaintenanceFieldsProps) {
  if (!record) {
    return (
      <Alert
        showIcon
        type="warning"
        message="未加载到保养详情，请关闭弹层后重试。"
      />
    );
  }

  const steps = record.steps ?? [];
  const templateLabel = record.maintenanceTemplateCode
    ? `${record.maintenanceTemplateCode} - ${record.maintenanceTemplateName ?? ''}`
    : record.maintenanceTemplateName;

  return (
    <>
      {templateLabel ? (
        <Alert
          showIcon
          type="info"
          message={`模板来源：${templateLabel}`}
          description={
            steps.length > 0
              ? `本次保养已带出 ${steps.length} 个标准步骤，请逐项填写执行结果。`
              : '当前保养单来自模板，但未带出标准步骤，可直接填写整体完成备注。'
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}

      {steps.length > 0 ? (
        <Form.List name="steps">
          {(fields) => (
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              {fields.map((field, index) => {
                const step = steps[index];
                const isRequired = step?.required !== false;

                return (
                  <Card
                    key={field.key}
                    size="small"
                    title={
                      <Space size="small">
                        <span>{`${index + 1}. ${step?.name ?? `步骤 ${index + 1}`}`}</span>
                        <Tag color={isRequired ? 'gold' : 'default'}>
                          {isRequired ? '必填' : '可选'}
                        </Tag>
                        {step?.photoRequired ? (
                          <Tag color="blue">必拍照片</Tag>
                        ) : null}
                      </Space>
                    }
                  >
                    {step?.content ? (
                      <Typography.Paragraph
                        type="secondary"
                        style={{ marginBottom: 16 }}
                      >
                        {step.content}
                      </Typography.Paragraph>
                    ) : null}
                    <ProFormTextArea
                      name={[field.name, 'result']}
                      {...capabilities.getFieldHelpProps(
                        isRequired ? '执行结果' : '执行结果（可选）',
                        'maintenanceStepResult',
                      )}
                      rules={
                        isRequired
                          ? [
                              {
                                required: true,
                                message: '请填写该步骤的执行结果',
                              },
                            ]
                          : undefined
                      }
                      fieldProps={{
                        autoSize: { minRows: 2, maxRows: 4 },
                        placeholder: '如：已完成、已更换、运行正常',
                      }}
                    />
                    <ProFormTextArea
                      name={[field.name, 'remark']}
                      {...capabilities.getFieldHelpProps(
                        '步骤备注',
                        'maintenanceStepRemark',
                      )}
                      fieldProps={{
                        autoSize: { minRows: 2, maxRows: 4 },
                        placeholder: '补充异常说明、测量结果或耗材更换记录',
                      }}
                    />
                    {step?.photoRequired ? (
                      <Form.Item
                        name={[field.name, 'photoFiles']}
                        label="必拍照片"
                        valuePropName="fileList"
                        getValueFromEvent={(
                          event: UploadChangeParam<UploadFile>,
                        ) => event.fileList}
                        rules={[
                          {
                            type: 'array',
                            required: true,
                            min: 1,
                            message: '请上传该步骤的现场照片',
                          },
                        ]}
                        extra="最多上传 5 张图片"
                      >
                        <Upload
                          accept="image/*"
                          listType="picture-card"
                          maxCount={5}
                          beforeUpload={() => false}
                        >
                          <Button icon={<UploadOutlined />}>选择照片</Button>
                        </Upload>
                      </Form.Item>
                    ) : null}
                  </Card>
                );
              })}
            </Space>
          )}
        </Form.List>
      ) : (
        <Alert
          showIcon
          type="info"
          message="当前保养单未带出模板步骤，可直接填写整体完成备注。"
          style={{ marginBottom: 16 }}
        />
      )}

      <ProFormTextArea
        name="remark"
        {...capabilities.getFieldHelpProps(
          steps.length > 0 ? '整体完成备注' : '完成备注',
          'maintenanceCompleteRemark',
        )}
        placeholder="请输入完成情况说明"
        fieldProps={{ autoSize: { minRows: 3, maxRows: 6 } }}
      />
    </>
  );
}
