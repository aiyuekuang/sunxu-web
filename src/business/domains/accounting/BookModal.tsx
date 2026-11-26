/** @sunxu-layer business @sunxu-domain accounting @sunxu-reason Preserves host accounting book create/edit fields and locks historic organization and currency values while leaving requests and permission decisions with the host. */
import {
  ModalForm,
  ProFormDependency,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Button } from 'antd';
import type {
  AccountingBookFormValues,
  AccountingBookModalCapabilities,
  BookModalProps,
} from './accounting-book-modal-types';

/** Form used to create or update a general ledger book. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable book modal behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function BookModal({ record, onDone, capabilities }: BookModalProps) {
  const isEdit = Boolean(record);
  const isCurrentPrimary =
    record?.isPrimary === true && record.status === 'active';

  return (
    <ModalForm<AccountingBookFormValues>
      title={isEdit ? '编辑' : '新增'}
      trigger={
        capabilities.canManage ? (
          <Button type={isEdit ? 'link' : 'primary'}>
            {isEdit ? '编辑' : '新增'}
          </Button>
        ) : undefined
      }
      initialValues={
        record
          ? {
              code: record.code,
              name: record.name,
              accountingOrganizationCode: record.accountingOrganizationCode,
              bookType: record.bookType,
              isPrimary: record.isPrimary ?? undefined,
              baseCurrencyCode: record.baseCurrencyCode,
              status: record.status,
              remark: record.remark ?? undefined,
            }
          : {
              bookType: 'primary',
              isPrimary: true,
              baseCurrencyCode: 'CNY',
              status: 'active',
            }
      }
      modalProps={{ destroyOnHidden: true }}
      onFinish={async (values) => {
        const payload = {
          ...values,
          isPrimary: values.bookType === 'primary' && values.isPrimary === true,
        };
        if (record) {
          await capabilities.update(record.id, payload);
          capabilities.notifySuccess('已更新');
        } else {
          await capabilities.create(payload);
          capabilities.notifySuccess('已创建');
        }
        onDone();
        return true;
      }}
    >
      <ProFormText
        name="code"
        label="账簿编码"
        disabled={isEdit}
        rules={[{ required: !isEdit, message: '请输入账簿编码' }]}
      />
      <ProFormText name="name" label="账簿名称" rules={[{ required: true }]} />
      {capabilities.renderOrganizationSelect({
        name: 'accountingOrganizationCode',
        label: '所属会计组织',
        disabled: isEdit,
        tooltip:
          '账簿创建后不能修改所属组织；需新建正确账簿，避免既有账务历史串账。',
        rules: [{ required: true, message: '请选择所属会计组织' }],
        fieldProps: { showSearch: true, optionFilterProp: 'label' },
        request: capabilities.requestOrganizationOptions,
        configTarget: 'accountingOrganizations',
      })}
      <ProFormSelect
        name="bookType"
        label="账簿类型"
        options={[...capabilities.bookTypeOptions]}
        fieldProps={{ disabled: isCurrentPrimary }}
        rules={[{ required: true }]}
      />
      {capabilities.renderBaseCurrencySelect({
        name: 'baseCurrencyCode',
        label: '本位币',
        disabled: isEdit,
        tooltip:
          '账簿创建后不能修改本位币；需新建正确账簿，避免既有金额口径被改写。',
        rules: [{ required: true }],
        fieldProps: { showSearch: true, optionFilterProp: 'label' },
        request: capabilities.requestCurrencyOptions,
        configTarget: 'accountingCurrencies',
      })}
      <ProFormDependency name={['bookType', 'isPrimary']}>
        {({ bookType, isPrimary }) => (
          <>
            {bookType === 'primary' ? (
              <ProFormSwitch
                name="isPrimary"
                label="设为主账簿"
                tooltip="主账簿用于承接未指定账簿的凭证和来源单。"
                disabled={record?.isPrimary === true}
              />
            ) : null}
            <ProFormSelect
              name="status"
              label="状态"
              options={
                bookType === 'primary' && isPrimary
                  ? [...capabilities.statusOptions].filter(
                      (option) => option.value === 'active',
                    )
                  : [...capabilities.statusOptions]
              }
              fieldProps={{ disabled: isCurrentPrimary }}
            />
          </>
        )}
      </ProFormDependency>
      <ProFormTextArea name="remark" label="备注" />
    </ModalForm>
  );
}
