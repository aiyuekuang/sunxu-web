/** @sunxu-component mes-specific @sunxu-domain business-invoice-lines @sunxu-reason Preserves invoice line entry, custom fields, unit dictionary slot, minimum row validation, and source-allocation lock behavior while the host supplies the schema and dictionary field. */
import {
  ProFormDigit,
  ProFormGroup,
  ProFormList,
  ProFormText,
} from '@ant-design/pro-components';
import { Row } from 'antd';
import { DocumentLineCustomFieldFormItems } from './DocumentLineCustomFieldFormItems';
import type { BusinessInvoiceLineFormListProps } from './business-invoice-workflow-types';

/** Shared purchase/sales invoice line editor used by both create and edit drawers. */
export function BusinessInvoiceLineFormList({
  objectType = 'sales_invoice_line',
  locked = false,
  creatorText = '新增发票明细',
  enabled = true,
  lineCustomFieldSchema,
  renderUnitField,
}: BusinessInvoiceLineFormListProps) {
  return (
    <ProFormList
      name="lines"
      label="发票明细"
      min={1}
      copyIconProps={false}
      deleteIconProps={locked ? false : undefined}
      creatorButtonProps={locked ? false : { creatorButtonText: creatorText }}
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
    >
      {(field) => (
        <ProFormGroup
          spaceProps={{
            style: { width: '100%' },
            wrap: true,
          }}
        >
          <ProFormText
            name="itemCode"
            label="项目编码"
            width="sm"
            disabled={locked}
          />
          <ProFormText
            name="itemName"
            label="项目名称"
            width="md"
            disabled={locked}
            rules={[{ required: true }]}
          />
          {renderUnitField({
            name: 'unit',
            label: '单位',
            width: 'xs',
            disabled: locked,
            enabled,
            typeCode: 'material_unit',
            showSearch: true,
            optionFilterProp: 'label',
          })}
          <ProFormDigit
            name="quantity"
            label="数量"
            width="xs"
            min={0.0001}
            disabled={locked}
            rules={[{ required: true }]}
          />
          <ProFormDigit
            name="unitPrice"
            label="单价"
            width="sm"
            min={0}
            disabled={locked}
            rules={[{ required: true }]}
          />
          <ProFormDigit
            name="amountWithoutTax"
            label="未税金额"
            width="sm"
            min={0}
            disabled={locked}
            rules={[{ required: true }]}
          />
          <ProFormDigit
            name="taxRate"
            label="税率(%)"
            width="xs"
            min={0}
            max={100}
            disabled={locked}
            rules={[{ required: true }]}
          />
          <ProFormDigit
            name="taxAmount"
            label="税额"
            width="sm"
            min={0}
            disabled={locked}
            rules={[{ required: true }]}
          />
          <ProFormDigit
            name="totalAmount"
            label="价税合计"
            width="sm"
            min={0}
            disabled={locked}
            rules={[{ required: true }]}
          />
          {!locked ? (
            <Row gutter={[16, 4]} style={{ width: '100%' }}>
              <DocumentLineCustomFieldFormItems
                schema={lineCustomFieldSchema}
                namePrefix={['lines', field.name]}
                colSpan={8}
              />
            </Row>
          ) : null}
        </ProFormGroup>
      )}
    </ProFormList>
  );
}
