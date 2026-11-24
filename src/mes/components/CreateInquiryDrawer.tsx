import {
  ProFormDatePicker,
  ProFormGroup,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Checkbox, InputNumber } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { MasterDataQuickCreateSelect } from './MasterDataQuickCreateSelect';
import { DocumentModalForm } from './DocumentModalForm';
import type {
  CreateInquiryDrawerProps,
  InquiryRequisitionItem,
} from './create-inquiry-drawer-types';

type InquiryLineDraft = {
  requisitionItemId: string;
  materialLabel: string;
  remainingQty: number;
  inquiryQty: number;
  selected: boolean;
};

type CreateInquiryFormValues = {
  supplierIds?: string[];
  quoteDeadline?: unknown;
  remarks?: string;
};

const FORM_GROUP_SIZE: [number, number] = [24, 0];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeDateValue(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value.slice(0, 10) || undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (isObject(value) && 'format' in value && typeof value.format === 'function') {
    const formatted = value.format('YYYY-MM-DD');
    return typeof formatted === 'string' ? formatted : undefined;
  }
  return undefined;
}

function materialLabel(item: InquiryRequisitionItem): string {
  return [item.material?.code, item.material?.name].filter(Boolean).join(' - ');
}

/** @sunxu-component mes-specific @sunxu-domain purchase inquiry @sunxu-reason Preserves requisition-to-inquiry line selection and quantity validation while the host supplies supplier search, create APIs, notifications, and navigation. */
export function CreateInquiryDrawer({
  open,
  requisition,
  onOpenChange,
  onSuccess,
  onOpenCreated,
  navigateToCreated = true,
  capabilities,
}: CreateInquiryDrawerProps) {
  const initialLines = useMemo(
    () =>
      (requisition.items ?? [])
        .map((item) => {
          const remainingQty =
            Number(item.requiredQty ?? 0) - Number(item.orderedQty ?? 0);
          return {
            requisitionItemId: item.id,
            materialLabel: materialLabel(item),
            remainingQty,
            inquiryQty: remainingQty > 0 ? remainingQty : 0,
            selected: remainingQty > 0,
          };
        })
        .filter((item) => item.remainingQty > 0),
    [requisition.items],
  );
  const [lines, setLines] = useState<InquiryLineDraft[]>(initialLines);

  useEffect(() => {
    if (open) setLines(initialLines);
  }, [initialLines, open]);

  return (
    <DocumentModalForm<CreateInquiryFormValues>
      title="从采购申请发起询价"
      width="100vw"
      layout="vertical"
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{
        destroyOnHidden: true,
        centered: false,
        mask: { closable: false },
        className: 'document-form-modal',
      }}
      onFinish={async (values) => {
        const selectedLines = lines.filter((line) => line.selected);
        if (selectedLines.length === 0) {
          capabilities.notifyWarning('请至少选择一条申请明细');
          return false;
        }
        const invalidLine = selectedLines.find(
          (line) => line.inquiryQty <= 0 || line.inquiryQty > line.remainingQty,
        );
        if (invalidLine) {
          capabilities.notifyWarning(`${invalidLine.materialLabel} 的询价数量不正确`);
          return false;
        }
        const inquiry = await capabilities.createFromRequisition({
          requisitionId: requisition.id,
          supplierIds: values.supplierIds,
          quoteDeadline: normalizeDateValue(values.quoteDeadline),
          remarks: values.remarks,
          items: selectedLines.map((line) => ({
            requisitionItemId: line.requisitionItemId,
            inquiryQty: line.inquiryQty,
          })),
        });
        capabilities.notifySuccess('创建成功');
        onSuccess?.();
        onOpenChange(false);
        if (inquiry.id && navigateToCreated) onOpenCreated?.(inquiry.id);
        return true;
      }}
    >
      <div className="document-form-layout">
        <section className="document-form-section">
          <div className="document-form-section-title">询价信息</div>
          <ProFormGroup size={FORM_GROUP_SIZE}>
            <ProFormDatePicker
              name="quoteDeadline"
              label="报价截止日期"
              width="md"
            />
            <MasterDataQuickCreateSelect
              name="supplierIds"
              quickCreateEntity="supplier"
              label="手工追加候选供应商"
              width="lg"
              mode="multiple"
              request={capabilities.requestSupplierOptions}
              showSearch
              debounceTime={300}
              fieldProps={{ filterOption: false }}
            />
          </ProFormGroup>
        </section>
        <section className="document-form-section document-form-section-lines">
          <div className="document-form-section-title">申请明细</div>
          <div style={{ marginBottom: 16 }}>
            {lines.map((line, index) => (
              <div
                key={line.requisitionItemId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                }}
              >
                <Checkbox
                  aria-label={`选择${line.materialLabel}发起询价`}
                  checked={line.selected}
                  onChange={(event) =>
                    setLines((previous) =>
                      previous.map((item, currentIndex) =>
                        currentIndex === index
                          ? { ...item, selected: event.target.checked }
                          : item,
                      ),
                    )
                  }
                />
                <span style={{ flex: 1 }}>{line.materialLabel}</span>
                <span>剩余 {line.remainingQty}</span>
                <InputNumber
                  aria-label={`${line.materialLabel}询价数量`}
                  min={0.0001}
                  max={line.remainingQty}
                  precision={4}
                  value={line.inquiryQty}
                  onChange={(value) =>
                    setLines((previous) =>
                      previous.map((item, currentIndex) =>
                        currentIndex === index
                          ? { ...item, inquiryQty: Number(value ?? 0) }
                          : item,
                      ),
                    )
                  }
                />
              </div>
            ))}
          </div>
        </section>
        <section className="document-form-section">
          <div className="document-form-section-title">备注</div>
          <ProFormTextArea name="remarks" label="备注" />
        </section>
      </div>
    </DocumentModalForm>
  );
}
