/** @sunxu-layer business @sunxu-domain funds-transactions @sunxu-reason Preserves MES spreadsheet import and manual funds transaction forms while injecting account/category/counterparty requests, permission decisions, config-entry fields, notifications, template downloads, and persistence. */
import {
  ModalForm,
  ProFormDatePicker,
  ProFormDependency,
  ProFormDigit,
  type ProFormInstance,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProFormUploadDragger,
  type ProFormSelectProps,
} from '@ant-design/pro-components';
import { Button } from 'antd';
import dayjs from 'dayjs';
import { useRef } from 'react';
import type {
  CreateFundsTransactionModalProps,
  FundsCounterpartyType,
  FundsDirection,
  FundsTransactionCreateFormValues,
  FundsTransactionImportFormValues,
  FundsTransactionImportModalProps,
} from './funds-transaction-modals-types';

function isFundsCounterpartyType(value: unknown): value is FundsCounterpartyType {
  return (
    value === 'customer' ||
    value === 'supplier' ||
    value === 'employee' ||
    value === 'other'
  );
}

function isFundsDirection(value: unknown): value is FundsDirection {
  return value === 'in' || value === 'out';
}

function accountOptionRequest(
  capabilities: CreateFundsTransactionModalProps['capabilities'],
): NonNullable<ProFormSelectProps['request']> {
  return async ({ keyWords }) => {
    const accounts = await capabilities.requestFundsAccounts({
      keyword: keyWords,
      pageSize: 100,
    });
    return accounts.map((account) => ({
      label: `${account.name}（${account.code}）`,
      value: account.id,
    }));
  };
}

/** Imports one Excel file as an atomic validation-and-import operation. */
export function FundsTransactionImportModal({
  onDone,
  capabilities,
}: FundsTransactionImportModalProps) {
  if (!capabilities.canCreate) return null;

  return (
    <ModalForm<FundsTransactionImportFormValues>
      title="导入"
      trigger={<Button>导入</Button>}
      modalProps={{ destroyOnHidden: true }}
      onFinish={async (values) => {
        const file = values.file?.[0]?.originFileObj;
        if (!(file instanceof File)) {
          capabilities.notifyError('请选择资金流水 Excel 文件');
          return false;
        }
        const result = await capabilities.importTransactions(file);
        if (!result.imported) {
          capabilities.notifyError(
            result.rows.find((row) => row.message)?.message ??
              '文件校验未通过，未导入任何资金流水',
          );
          return false;
        }
        capabilities.notifySuccess(`已导入 ${result.imported} 条资金流水`);
        onDone();
        return true;
      }}
    >
      <Button
        style={{ marginBottom: 16 }}
        onClick={capabilities.downloadTemplate}
      >
        下载模板
      </Button>
      <ProFormUploadDragger
        name="file"
        label="Excel 文件"
        extra="外部流水号在同一资金账户内必须唯一；整份文件校验失败时不会影响账户余额。"
        max={1}
        fieldProps={{ beforeUpload: () => false, accept: '.xlsx' }}
        rules={[{ required: true }]}
      />
    </ModalForm>
  );
}

/** Creates a single manually entered funds transaction. */
export function CreateFundsTransactionModal({
  onDone,
  capabilities,
}: CreateFundsTransactionModalProps) {
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  if (!capabilities.canCreate) return null;

  return (
    <ModalForm<FundsTransactionCreateFormValues>
      title="新增"
      layout="vertical"
      trigger={<Button type="primary">新增</Button>}
      modalProps={{ destroyOnHidden: true, ...capabilities.scrollableModalProps }}
      formRef={formRef}
      onFinish={async (values) => {
        const isMasterDataCounterparty =
          Boolean(values.counterpartyType) && values.counterpartyType !== 'other';
        await capabilities.createTransaction({
          ...values,
          counterpartyId: isMasterDataCounterparty
            ? values.counterpartyId
            : undefined,
          counterpartyName: isMasterDataCounterparty
            ? undefined
            : values.counterpartyName,
        });
        capabilities.notifySuccess('已记账');
        onDone();
        return true;
      }}
    >
      {capabilities.renderFundsAccountSelect({
        name: 'accountId',
        label: '资金账户',
        request: accountOptionRequest(capabilities),
        configTarget: 'fundsAccounts',
        rules: [{ required: true }],
      })}
      <ProFormSelect
        name="direction"
        label="收支方向"
        options={[...capabilities.directionOptions]}
        rules={[{ required: true }]}
        fieldProps={{
          onChange: () => formRef.current?.setFieldValue('categoryId', undefined),
        }}
      />
      <ProFormDigit
        name="amount"
        label="金额"
        min={0.01}
        rules={[{ required: true }]}
      />
      <ProFormDependency name={['direction']}>
        {({ direction }) => {
          const selectedDirection = isFundsDirection(direction)
            ? direction
            : undefined;
          return capabilities.renderFundsCategorySelect({
            name: 'categoryId',
            label: '收支类别',
            tooltip:
              '客户或供应商收付款可不选类别并按应收应付核销；其他手工收支必须选择类别。',
            params: { direction: selectedDirection },
            request: async () => {
              if (!selectedDirection) return [];
              const categories = await capabilities.requestFundsCategories({
                direction: selectedDirection,
                isActive: true,
              });
              return categories.map((category) => ({
                label: `${category.name}${
                  category.code ? `（${category.code}）` : ''
                }${
                  category.costNature === 'inventory_cost'
                    ? '（需采购附加费用分摊）'
                    : ''
                }`,
                value: category.id,
                disabled: category.costNature === 'inventory_cost',
              }));
            },
            configTarget: 'fundsCategories',
            configWhen: (params) => isFundsDirection(params.direction),
            rules: [
              ({ getFieldValue }) => ({
                validator: async (_, value) => {
                  const counterpartyType = getFieldValue('counterpartyType');
                  if (
                    value ||
                    counterpartyType === 'customer' ||
                    counterpartyType === 'supplier'
                  ) {
                    return;
                  }
                  throw new Error('未选择客户/供应商往来时，必须选择收支类别');
                },
              }),
            ],
          });
        }}
      </ProFormDependency>
      <ProFormDatePicker
        name="bizDate"
        label="业务日期"
        initialValue={dayjs().format('YYYY-MM-DD')}
        rules={[{ required: true }]}
      />
      <ProFormSelect
        name="counterpartyType"
        label="往来类型"
        options={[...capabilities.counterpartyTypeOptions]}
        fieldProps={{
          allowClear: true,
          onChange: () => {
            formRef.current?.setFieldsValue({
              counterpartyId: undefined,
              counterpartyName: undefined,
            });
          },
        }}
      />
      <ProFormDependency name={['counterpartyType']}>
        {({ counterpartyType }) => {
          if (!isFundsCounterpartyType(counterpartyType)) return null;
          if (counterpartyType === 'other') {
            return (
              <ProFormText
                name="counterpartyName"
                label="往来对象名称"
                rules={[{ required: true, message: '请填写往来对象名称' }]}
              />
            );
          }

          const configTarget =
            counterpartyType === 'customer'
              ? 'customer'
              : counterpartyType === 'supplier'
                ? 'supplier'
                : 'systemUsers';
          const request: NonNullable<ProFormSelectProps['request']> = async ({ keyWords }) =>
            capabilities.requestCounterpartyOptions({
              type: counterpartyType,
              keyWords,
            });
          return capabilities.renderCounterpartySelect({
            key: counterpartyType,
            name: 'counterpartyId',
            label: '往来对象',
            request,
            configTarget,
            showSearch: true,
            fieldProps: { filterOption: false },
            rules: [{ required: true, message: '请选择往来对象' }],
          });
        }}
      </ProFormDependency>
      <ProFormTextArea name="remark" label="备注" />
    </ModalForm>
  );
}
