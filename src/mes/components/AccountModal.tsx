/** @sunxu-component mes-specific @sunxu-domain mes-accounting-accounts @sunxu-reason Preserves MES account create/edit constraints and dimension validation while the host supplies accounting selectors, permissions, and persistence. */
import {
  ModalForm,
  ProFormDependency,
  ProFormDigit,
  ProFormGroup,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Button } from 'antd';
import type {
  AccountModalProps,
  AccountingAccountFormValues,
  AccountingAccountModalCapabilities,
  AccountingAccountRecord,
  AccountingDimensionRequirement,
} from './accounting-account-modal-types';

function hasRepeatedDimensionType(
  requirements?: AccountingDimensionRequirement[],
): boolean {
  const types =
    requirements?.map((requirement) => requirement.dimensionType) ?? [];
  return new Set(types).size !== types.length;
}

export function AccountModal({
  record,
  onDone,
  capabilities,
}: AccountModalProps) {
  const isEdit = Boolean(record);

  return (
    <ModalForm<AccountingAccountFormValues>
      title={isEdit ? '编辑' : '新增'}
      trigger={
        capabilities.canManage ? (
          <Button type={isEdit ? 'link' : 'primary'}>
            {isEdit ? '编辑' : '新增'}
          </Button>
        ) : undefined
      }
      initialValues={{
        ...(record
          ? {
              code: record.code,
              name: record.name,
              accountingBookCode: record.accountingBookCode,
              parentCode: record.parentCode ?? undefined,
              accountType: record.accountType,
              normalBalance: record.normalBalance,
              level: record.level,
              isLeaf: record.isLeaf ?? undefined,
              allowPosting: record.allowPosting ?? undefined,
              currencyCode: record.currencyCode ?? undefined,
              status: record.status,
              remark: record.remark ?? undefined,
            }
          : {
              accountType: 'asset',
              normalBalance: 'debit',
              level: 1,
              isLeaf: true,
              allowPosting: true,
              status: 'active',
            }),
        dimensionRequirements: (record?.dimensionRequirements ?? []).filter(
          (requirement) => requirement.requirement !== 'none',
        ),
      }}
      modalProps={{ destroyOnHidden: true, ...capabilities.scrollableModalProps }}
      onFinish={async (values) => {
        if (hasRepeatedDimensionType(values.dimensionRequirements)) {
          capabilities.notifyError('同一个核算维度只能添加一次');
          return false;
        }
        if (record) {
          await capabilities.update(record.id, values);
          capabilities.notifySuccess('已更新');
        } else {
          await capabilities.create(values);
          capabilities.notifySuccess('已创建');
        }
        onDone();
        return true;
      }}
    >
      <ProFormText
        name="code"
        label="科目编码"
        disabled={isEdit}
        rules={[{ required: !isEdit }]}
      />
      <ProFormText name="name" label="科目名称" rules={[{ required: true }]} />
      {capabilities.renderAccountingBookField({
        name: 'accountingBookCode',
        label: '账簿',
        disabled: isEdit,
        required: !isEdit,
      })}
      <ProFormSelect
        name="accountType"
        label="科目类型"
        options={[...capabilities.accountTypeOptions]}
        tooltip="发生已过账分录后不能修改；需新建正确科目并用调整凭证转移余额。"
        rules={[{ required: true }]}
      />
      <ProFormDependency name={['accountingBookCode', 'accountType']}>
        {({ accountingBookCode, accountType }) =>
          capabilities.renderParentAccountSelect({
            name: 'parentCode',
            label: '上级科目',
            accountingBookCode:
              typeof accountingBookCode === 'string'
                ? accountingBookCode
                : undefined,
            accountType:
              typeof accountType === 'string'
                ? (accountType as AccountingAccountFormValues['accountType'])
                : undefined,
            excludeCode: record?.code,
            request: ({ keyWords }) =>
              capabilities.requestParentAccountOptions({
                accountingBookCode:
                  typeof accountingBookCode === 'string'
                    ? accountingBookCode
                    : undefined,
                accountType:
                  typeof accountType === 'string'
                    ? (accountType as AccountingAccountFormValues['accountType'])
                    : undefined,
                excludeCode: record?.code,
                keyWords,
              }),
            debounceTime: 300,
            configTarget: 'accountingAccounts',
            configWhen: () => Boolean(accountingBookCode),
            disabled: !accountingBookCode,
            placeholder: accountingBookCode
              ? '留空为一级科目'
              : '请先选择账簿',
            tooltip:
              '仅显示当前账簿中与科目类型一致、启用的非末级且不可记账科目；保存时仍会校验级次和层级关系。',
            fieldProps: { allowClear: true, showSearch: true, filterOption: false },
          })
        }
      </ProFormDependency>
      <ProFormSelect
        name="normalBalance"
        label="余额方向"
        options={[...capabilities.normalBalanceOptions]}
        tooltip="发生已过账分录后不能修改；需新建正确科目并用调整凭证转移余额。"
        rules={[{ required: true }]}
      />
      <ProFormDigit
        name="level"
        label="级次"
        min={1}
        fieldProps={{ precision: 0 }}
        rules={[{ required: true }]}
      />
      {capabilities.renderCurrencySelect({
        name: 'currencyCode',
        label: '币种',
        request: capabilities.requestCurrencyOptions,
        configTarget: 'accountingCurrencies',
        fieldProps: {
          allowClear: true,
          showSearch: true,
          optionFilterProp: 'label',
        },
        placeholder: '留空取账簿本位币',
      })}
      <ProFormList<AccountingDimensionRequirement>
        name="dimensionRequirements"
        label="核算维度"
        tooltip="只有需要按客户、供应商、部门或项目等辅助核算时才添加；普通科目留空即可。"
        creatorButtonProps={{ creatorButtonText: '添加核算维度' }}
        creatorRecord={{ requirement: 'optional' }}
        copyIconProps={false}
        alwaysShowItemLabel
        containerStyle={{ minWidth: 0, width: '100%' }}
        itemRender={({ listDom, action }) => (
          <div
            style={{
              alignItems: 'flex-start',
              display: 'flex',
              gap: 8,
              minWidth: 0,
              width: '100%',
            }}
          >
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>{listDom}</div>
            {action ? (
              <div style={{ flex: '0 0 auto', paddingTop: 30 }}>{action}</div>
            ) : null}
          </div>
        )}
        rules={[
          {
            validator: async (_, requirements?: AccountingDimensionRequirement[]) => {
              if (hasRepeatedDimensionType(requirements)) {
                throw new Error('同一个核算维度只能添加一次');
              }
            },
          },
        ]}
      >
        <ProFormGroup
          spaceProps={{
            style: { width: '100%' },
            wrap: true,
          }}
        >
          <ProFormSelect
            name="dimensionType"
            label="维度类型"
            width="sm"
            options={[...capabilities.dimensionTypeOptions]}
            rules={[{ required: true, message: '请选择维度类型' }]}
          />
          <ProFormSelect
            name="requirement"
            label="要求"
            width="xs"
            options={[...capabilities.dimensionRequirementOptions]}
            rules={[{ required: true, message: '请选择要求级别' }]}
          />
        </ProFormGroup>
      </ProFormList>
      <ProFormSwitch name="isLeaf" label="明细（末级）科目" />
      <ProFormSwitch name="allowPosting" label="允许记账" />
      <ProFormSelect
        name="status"
        label="状态"
        options={[...capabilities.statusOptions]}
      />
      <ProFormTextArea name="remark" label="备注" />
    </ModalForm>
  );
}

export type { AccountingAccountRecord } from './accounting-account-modal-types';
