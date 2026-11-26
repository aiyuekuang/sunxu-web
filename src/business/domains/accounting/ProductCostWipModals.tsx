/** @sunxu-layer business @sunxu-domain accounting @sunxu-reason Preserves opening and closing WIP forms, completion-rate rules, edit locks, save feedback, and refresh lifecycle while the host supplies accounting selectors, work-order options, and persistence. */
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
} from '@ant-design/pro-components';
import { Col, Row } from 'antd';
import type {
  ClosingWipModalProps,
  OpeningWipModalProps,
  ProductCostClosingWipFormValues,
  ProductCostOpeningWipFormValues,
} from './product-cost-wip-modal-types';

/** Creates opening WIP input for the host-selected accounting period and work order. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable opening wip modal behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function OpeningWipModal({
  query,
  editingRecord,
  open,
  onOpenChange,
  onSuccess,
  capabilities,
}: OpeningWipModalProps) {
  return (
    <ModalForm<ProductCostOpeningWipFormValues>
      title={editingRecord ? '编辑期初在产品' : '新增期初在产品'}
      width={720}
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnHidden: true }}
      initialValues={
        query && editingRecord
          ? { ...query, ...editingRecord }
          : (query ?? undefined)
      }
      onFinish={async (values) => {
        try {
          await capabilities.saveOpeningWip(values);
          capabilities.notifySuccess('期初在产品已保存');
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
        <Col span={24}>
          <ProFormSelect
            name="workOrderId"
            label="工单成本对象"
            disabled={Boolean(editingRecord)}
            request={capabilities.requestWorkOrderOptions}
            fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
            rules={[{ required: true }]}
          />
        </Col>
        <Col span={12}>
          <ProFormDigit
            name="openingQuantity"
            label="期初在产品数量"
            min={0}
            fieldProps={{ precision: 6 }}
            rules={[{ required: true }]}
          />
        </Col>
        <Col span={12}>
          <ProFormDigit
            name="openingMaterialCost"
            label="期初直接材料成本"
            min={0}
            fieldProps={{ precision: 6 }}
            rules={[{ required: true }]}
          />
        </Col>
        <Col span={12}>
          <ProFormDigit
            name="openingLaborCost"
            label="期初直接人工成本"
            min={0}
            fieldProps={{ precision: 6 }}
            rules={[{ required: true }]}
          />
        </Col>
        <Col span={12}>
          <ProFormDigit
            name="openingOverheadCost"
            label="期初制造费用"
            min={0}
            fieldProps={{ precision: 6 }}
            rules={[{ required: true }]}
          />
        </Col>
      </Row>
    </ModalForm>
  );
}

/** Creates closing WIP input with total and cost-category completion rates. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable closing wip modal behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function ClosingWipModal({
  query,
  editingRecord,
  open,
  onOpenChange,
  onSuccess,
  capabilities,
}: ClosingWipModalProps) {
  return (
    <ModalForm<ProductCostClosingWipFormValues>
      title={editingRecord ? '编辑月末在产品' : '新增月末在产品'}
      width={720}
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnHidden: true }}
      initialValues={
        query && editingRecord
          ? { ...query, ...editingRecord }
          : (query ?? undefined)
      }
      onFinish={async (values) => {
        try {
          await capabilities.saveClosingWip(values);
          capabilities.notifySuccess('月末在产品已保存');
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
        <Col span={24}>
          <ProFormSelect
            name="workOrderId"
            label="工单成本对象"
            disabled={Boolean(editingRecord)}
            request={capabilities.requestWorkOrderOptions}
            fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
            rules={[{ required: true }]}
          />
        </Col>
        <Col span={12}>
          <ProFormDigit
            name="wipQuantity"
            label="月末在产品数量"
            min={0}
            fieldProps={{ precision: 6 }}
            rules={[{ required: true }]}
          />
        </Col>
        <Col span={12}>
          <ProFormDigit
            name="completionRatePercent"
            label="完工程度"
            min={0}
            max={100}
            fieldProps={{ precision: 4 }}
            rules={[{ required: true }]}
            tooltip="未单独填写各成本项目时，三类成本均按此比例计算。"
          />
        </Col>
        <Col span={8}>
          <ProFormDigit
            name="materialCompletionRatePercent"
            label="材料完工程度"
            min={0}
            max={100}
            fieldProps={{ precision: 4 }}
          />
        </Col>
        <Col span={8}>
          <ProFormDigit
            name="laborCompletionRatePercent"
            label="人工完工程度"
            min={0}
            max={100}
            fieldProps={{ precision: 4 }}
          />
        </Col>
        <Col span={8}>
          <ProFormDigit
            name="overheadCompletionRatePercent"
            label="制造费用完工程度"
            min={0}
            max={100}
            fieldProps={{ precision: 4 }}
          />
        </Col>
      </Row>
    </ModalForm>
  );
}
