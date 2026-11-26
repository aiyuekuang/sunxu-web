import { App } from 'antd';
import dayjs from 'dayjs';
import { DocumentModalForm } from './DocumentModalForm';
import { WorkOrderFormFields } from './WorkOrderFormFields';
import type {
  WorkOrderDetailRecord,
  WorkOrderFormDrawerProps,
  WorkOrderFormValues,
} from './work-order-form-types';

function toFormValues(record: WorkOrderDetailRecord): WorkOrderFormValues {
  return {
    materialId: record.materialId ?? record.material?.id ?? undefined,
    plannedQty: record.plannedQty ?? undefined,
    priority: record.priority ?? undefined,
    planStartTime: record.planStartTime ?? undefined,
    planEndTime: record.planEndTime ?? undefined,
    routeId: record.routeId ?? undefined,
    bomHeaderId: record.bomHeaderId ?? undefined,
    bomCostSnapshot: record.bomCostSnapshot ?? undefined,
    assigneeId: record.assigneeId ?? record.assignee?.id ?? undefined,
    customerId: record.customerId ?? record.customer?.id ?? undefined,
    receiptWarehouseId: record.receiptWarehouseId ?? undefined,
    dueDate: record.dueDate ?? undefined,
    drawingUrls: record.drawingUrls ?? undefined,
    description: record.description ?? undefined,
    status: record.status,
  };
}

/**
 * The backend treats field presence as a request to rebuild planning/BOM snapshots,
 * so edit payloads include only changed, editable keys.
 */
const EDITABLE_KEYS = [
  'plannedQty',
  'priority',
  'planStartTime',
  'planEndTime',
  'routeId',
  'assigneeId',
  'customerId',
  'receiptWarehouseId',
  'dueDate',
  'drawingUrls',
  'description',
] as const;

const DRAFT_ONLY_KEYS = new Set<string>([
  'routeId',
  'receiptWarehouseId',
  'drawingUrls',
]);
const DATE_KEYS = new Set<string>(['planStartTime', 'planEndTime', 'dueDate']);
const NUMBER_KEYS = new Set<string>(['plannedQty', 'priority']);
const STRUCTURED_KEYS = new Set<string>(['drawingUrls']);

function normalizeForCompare(key: string, value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value) && value.length === 0) return '';
  if (DATE_KEYS.has(key)) {
    const date = dayjs(value as string | number | Date);
    return date.isValid() ? date.format('YYYY-MM-DD') : String(value);
  }
  if (STRUCTURED_KEYS.has(key)) return JSON.stringify(value);
  if (NUMBER_KEYS.has(key)) return String(Number(value));
  return String(value);
}

function buildUpdatePayload(
  record: WorkOrderDetailRecord,
  values: Record<string, unknown>,
): Record<string, unknown> | null {
  const isDraft = record.status === 'draft';
  const base = toFormValues(record);
  const payload: Record<string, unknown> = { id: record.id };

  for (const key of EDITABLE_KEYS) {
    if (!isDraft && DRAFT_ONLY_KEYS.has(key)) continue;
    if (!(key in values)) continue;
    if (normalizeForCompare(key, values[key]) === normalizeForCompare(key, base[key])) {
      continue;
    }
    payload[key] = values[key] ?? null;
  }

  return Object.keys(payload).length > 1 ? payload : null;
}

/** @sunxu-layer business @sunxu-domain manufacturing @sunxu-reason Preserves the shared MES work-order create/edit lifecycle while injecting services, navigation, and field capabilities. */
export function WorkOrderFormDrawer({
  open,
  onOpenChange,
  record,
  onSuccess,
  capabilities,
}: WorkOrderFormDrawerProps) {
  const { message } = App.useApp();

  return (
    <DocumentModalForm<WorkOrderFormValues, Record<string, unknown>>
      title="工单"
      open={open}
      onOpenChange={onOpenChange}
      initialValues={record ? toFormValues(record) : undefined}
      onFinish={async (values) => {
        if (!record) {
          let created: { id: string; orderNo: string };
          try {
            const { orderNo, ...createValues } = values;
            created = await capabilities.createWorkOrder({
              ...createValues,
              orderNo: orderNo?.trim() || undefined,
              receiptWarehouseId:
                'receiptWarehouseId' in values
                  ? values.receiptWarehouseId ?? null
                  : undefined,
            });
          } catch (error) {
            message.error(capabilities.getErrorMessage(error, '创建工单失败'));
            return false;
          }
          message.success(
            <span>
              草稿工单 {created.orderNo} 已创建{' '}
              <a
                href={capabilities.getWorkOrderDetailsHref(created.id)}
                onClick={(event) => {
                  event.preventDefault();
                  capabilities.openWorkOrderDetails(created.id);
                }}
              >
                查看详情
              </a>
            </span>,
          );
          onSuccess?.();
          return true;
        }

        const payload = buildUpdatePayload(record, values);
        if (!payload) {
          onSuccess?.();
          return true;
        }
        try {
          await capabilities.updateWorkOrder(payload);
        } catch (error) {
          message.error(capabilities.getErrorMessage(error, '编辑工单失败'));
          return false;
        }
        message.success('更新成功');
        onSuccess?.();
        return true;
      }}
    >
      <WorkOrderFormFields record={record} capabilities={capabilities} />
    </DocumentModalForm>
  );
}

export type { WorkOrderFormDrawerProps } from './work-order-form-types';
