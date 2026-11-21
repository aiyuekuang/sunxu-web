import {
  ModalForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormGroup,
  ProFormList,
} from '@ant-design/pro-components';
import type { BatchReleaseFormValues, BatchReleaseModalProps } from './production-schedule-planning-types';
import './production-schedule-planning.css';

/**
 * @sunxu-component mes-specific
 * @sunxu-domain production-plans
 * @sunxu-reason Preserves the plan batch draft editor while loading, protected-line filtering, date serialization, save, notification, and refresh are owned by the host.
 */
export function BatchReleaseModal({
  planId,
  planNo,
  trigger,
  open,
  onOpenChange,
  onSaved,
  capabilities,
}: BatchReleaseModalProps) {
  return (
    <ModalForm<BatchReleaseFormValues>
      title={capabilities.labels.title(planNo)}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnHidden: true }}
      request={async () => {
        const lines = await capabilities.loadEditableDraftLines(planId);
        return {
          lines: lines.map((line) => ({
            plannedQty: Number(line.plannedQty),
            dueDate: line.dueDate ?? undefined,
          })),
        };
      }}
      onFinish={async (values) => {
        const lines = (values.lines ?? []).map((line) => ({
          plannedQty: line.plannedQty,
          dueDate: capabilities.serializeDate(line.dueDate),
        }));
        await capabilities.saveDraftLines(planId, lines);
        capabilities.notifySaved(capabilities.labels.saveSuccess);
        onSaved?.();
        return true;
      }}
    >
      <ProFormList
        name="lines"
        label={capabilities.labels.linesLabel}
        creatorButtonProps={{ creatorButtonText: capabilities.labels.addLine }}
        containerStyle={{ minWidth: 0, width: '100%' }}
        itemRender={({ listDom, action }) => (
          <div className="sunxu-mes-batch-release-row">
            <div className="sunxu-mes-batch-release-fields">{listDom}</div>
            {action ? <div className="sunxu-mes-batch-release-remove">{action}</div> : null}
          </div>
        )}
      >
        <ProFormGroup
          spaceProps={{
            style: { width: '100%' },
            wrap: true,
          }}
        >
          <ProFormDigit
            name="plannedQty"
            label={capabilities.labels.plannedQuantity}
            min={capabilities.minimumPlannedQuantity}
            width="sm"
            rules={[
              {
                required: true,
                message: capabilities.labels.plannedQuantityRequired,
              },
            ]}
          />
          <ProFormDatePicker
            name="dueDate"
            label={capabilities.labels.dueDate}
            width="sm"
          />
        </ProFormGroup>
      </ProFormList>
    </ModalForm>
  );
}
