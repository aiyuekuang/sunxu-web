/** @sunxu-layer business @sunxu-domain accounting @sunxu-reason Preserves manual and source-draft expense collection forms, allocation basis rules, work-order allocation editing, date validation, and feedback while the host supplies selectors, requests, and date normalization. */
import {
  ModalForm,
  ProFormDatePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormGroup,
  ProFormList,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Col, Row } from 'antd';
import { PRODUCT_COST_ALLOCATION_BASIS_OPTIONS } from './accounting-options';
import type {
  AllocateProductCostExpenseCollectionValues,
  CreateProductCostExpenseCollectionValues,
  ExpenseCollectionModalProps,
  ProductCostManualAllocationItem,
} from './product-cost-collection-types';

function ManualAllocationFields({
  requestWorkOrderOptions,
}: Pick<ExpenseCollectionModalProps['capabilities'], 'requestWorkOrderOptions'>) {
  return (
    <ProFormDependency name={['allocationBasis']}>
      {({ allocationBasis }) =>
        allocationBasis === 'manual' ? (
          <ProFormList<ProductCostManualAllocationItem>
            name="manualAllocations"
            label="按工单手工分配"
            creatorButtonProps={{ creatorButtonText: '新增工单分配' }}
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
          >
            <ProFormGroup
              spaceProps={{
                style: { width: '100%' },
                wrap: true,
              }}
            >
              <ProFormSelect
                name="workOrderId"
                label="工单"
                request={requestWorkOrderOptions}
                fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
                rules={[{ required: true }]}
              />
              <ProFormDigit
                name="allocatedAmount"
                label="分配金额"
                min={0}
                fieldProps={{ precision: 6 }}
                rules={[{ required: true }]}
              />
            </ProFormGroup>
          </ProFormList>
        ) : null
      }
    </ProFormDependency>
  );
}

/** Creates a manual collection or edits the allocation of a draft-linked collection. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable expense collection modal behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function ExpenseCollectionModal({
  query,
  expenseTypes,
  editingDetail,
  open,
  onOpenChange,
  onSuccess,
  capabilities,
}: ExpenseCollectionModalProps) {
  if (editingDetail) {
    const { collection, manualAllocations } = editingDetail;
    return (
      <ModalForm<AllocateProductCostExpenseCollectionValues>
        title={`编辑费用分配 — ${collection.collectionNo}`}
        width={720}
        open={open}
        onOpenChange={onOpenChange}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{
          businessDate: collection.businessDate ?? undefined,
          allocationBasis: collection.allocationBasis,
          manualAllocations,
        }}
        onFinish={async (values) => {
          const businessDate = capabilities.normalizeDateOnlyValue(
            values.businessDate,
          );
          if (!businessDate) {
            capabilities.notifyError('请填写有效的业务发生日');
            return false;
          }
          try {
            await capabilities.allocateExpenseCollection({
              ...values,
              id: collection.id,
              businessDate,
            });
            capabilities.notifySuccess('费用分配已保存');
            await onSuccess();
            return true;
          } catch {
            return false;
          }
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <ProFormDatePicker
              name="businessDate"
              label="业务发生日"
              rules={[{ required: true }]}
            />
          </Col>
          <Col span={12}>
            <ProFormSelect
              name="allocationBasis"
              label="费用分配标准"
              options={PRODUCT_COST_ALLOCATION_BASIS_OPTIONS}
              rules={[{ required: true }]}
            />
          </Col>
        </Row>
        <ManualAllocationFields
          requestWorkOrderOptions={capabilities.requestWorkOrderOptions}
        />
      </ModalForm>
    );
  }

  return (
    <ModalForm<CreateProductCostExpenseCollectionValues>
      title="新增费用归集单"
      width={760}
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnHidden: true }}
      initialValues={
        query ? { ...query, allocationBasis: 'output_quantity' } : undefined
      }
      onFinish={async (values) => {
        const businessDate = capabilities.normalizeDateOnlyValue(
          values.businessDate,
        );
        if (!businessDate) {
          capabilities.notifyError('请填写有效的业务发生日');
          return false;
        }
        try {
          await capabilities.createExpenseCollection({
            ...values,
            businessDate,
          });
          capabilities.notifySuccess('费用归集单已新增，请确认后参与成本计算');
          await onSuccess();
          return true;
        } catch {
          return false;
        }
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          {capabilities.renderAccountingBookField({
            name: 'accountingBookCode',
            label: '账簿编码',
            disabled: true,
            required: true,
            width: 'md',
          })}
        </Col>
        <Col span={12}>
          {capabilities.renderFiscalPeriodField({
            name: 'fiscalPeriod',
            label: '会计期间',
            disabled: true,
            required: true,
            width: 'md',
          })}
        </Col>
        <Col span={12}>
          <ProFormDatePicker
            name="businessDate"
            label="业务发生日"
            rules={[{ required: true }]}
          />
        </Col>
        <Col span={12}>
          <ProFormSelect
            name="expenseTypeCode"
            label="费用类型"
            options={expenseTypes.map((item) => ({
              label: `${item.name}（${item.code}）`,
              value: item.code,
            }))}
            fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
            rules={[{ required: true }]}
          />
        </Col>
        <Col span={12}>
          <ProFormSelect
            name="allocationBasis"
            label="费用分配标准"
            options={PRODUCT_COST_ALLOCATION_BASIS_OPTIONS}
            rules={[{ required: true }]}
          />
        </Col>
        <Col span={12}>
          <ProFormDigit
            name="amount"
            label="归集金额（不含税）"
            min={0.000001}
            fieldProps={{ precision: 6 }}
            rules={[{ required: true }]}
          />
        </Col>
        <Col span={12}>
          <ProFormText name="sourceLabel" label="来源说明" />
        </Col>
        <Col span={24}>
          <ProFormTextArea name="remark" label="备注" />
        </Col>
      </Row>
      <ManualAllocationFields
        requestWorkOrderOptions={capabilities.requestWorkOrderOptions}
      />
    </ModalForm>
  );
}
