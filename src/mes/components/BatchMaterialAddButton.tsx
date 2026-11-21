import { App } from 'antd';
import type { MaterialFilteredSelectOption } from './material-select-types';
import { MaterialTablePicker } from './MaterialTablePicker';
import type { BatchMaterialAddButtonProps, BatchMaterialRecord } from './batch-material-add-types';

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function pickMaterialCustomFieldRuntime(material: unknown) {
  const source = readRecord(material);
  const readRuntime = (key: string) => readRecord(source?.[key]);
  return {
    customValues: readRuntime('customValues'),
    customComputedValues: readRuntime('customComputedValues'),
    customComputedErrors: readRuntime('customComputedErrors'),
  };
}

export function buildBatchMaterialOption(
  material: BatchMaterialRecord,
): MaterialFilteredSelectOption {
  const label = [material.code, material.name, material.spec]
    .filter(Boolean)
    .join(' - ');
  return {
    label: label || material.id,
    value: material.id,
    title: label || material.name || material.code || undefined,
    code: material.code,
    name: material.name,
    unit: material.unit,
    familyId: material.familyId,
    baseType: material.baseType,
    categoryId: material.categoryId,
    categoryName: material.materialCategory?.name ?? material.category,
    spec: material.spec,
    hasBatchTracking: material.hasBatchTracking,
    shelfLifeDays:
      material.shelfLifeDays ?? material.family?.defaultShelfLifeDays ?? null,
    traceabilityMode: material.traceabilityMode,
    procurementType: material.procurementType,
    ...pickMaterialCustomFieldRuntime(material),
  };
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain material
 * @sunxu-reason Keeps MES batch material row filtering and insertion behavior while leaving row construction and selection services with the host.
 * Adds only new material rows and removes empty placeholders when at least one row is added.
 */
export function BatchMaterialAddButton<
  TRow,
  TMaterial extends BatchMaterialRecord = BatchMaterialRecord,
>({
  rows,
  onRowsChange,
  createRow,
  getMaterialId,
  isEmptyRow,
  onAdded,
  disabled = false,
  label = '批量新增',
  title = '批量新增物料',
  quantityLabel,
  maxRows,
  requestParams,
  customerId,
  trigger,
}: BatchMaterialAddButtonProps<TRow, TMaterial>) {
  const { message } = App.useApp();

  return (
    <MaterialTablePicker<TMaterial>
      mode="multiple"
      disabled={disabled}
      title={title}
      placeholder={label}
      trigger={trigger}
      quantityLabel={quantityLabel}
      customerId={customerId}
      requestParams={{ ...requestParams, isActive: true }}
      onValuesChange={(_values, selectedMaterials, selections) => {
        const quantities = new Map(
          selections?.map((selection) => [
            selection.material.id,
            selection.quantity,
          ]),
        );
        const existingIds = new Set(
          rows.map(getMaterialId).filter((id): id is string => Boolean(id)),
        );
        const selectedIds = new Set<string>();
        const candidateMaterials = selectedMaterials.filter((material) => {
          if (existingIds.has(material.id) || selectedIds.has(material.id)) {
            return false;
          }
          selectedIds.add(material.id);
          return true;
        });
        const duplicateCount =
          selectedMaterials.length - candidateMaterials.length;
        const retainedRows = rows.filter((row) => !isEmptyRow(row));
        const remainingSlots =
          maxRows == null
            ? candidateMaterials.length
            : Math.max(0, maxRows - retainedRows.length);
        const materials = candidateMaterials.slice(0, remainingSlots);
        const overflowCount = candidateMaterials.length - materials.length;

        if (materials.length === 0) {
          if (overflowCount > 0 && maxRows != null) {
            message.info(`明细最多只能添加 ${maxRows} 行`);
          } else {
            message.info('所选物料已在当前明细中');
          }
          return;
        }

        const addedRows = materials.map((material) =>
          createRow(material, quantities.get(material.id) ?? 1),
        );
        const nextRows = [...retainedRows, ...addedRows];
        onRowsChange(nextRows);
        onAdded?.(addedRows, materials, nextRows);

        const notices: string[] = [];
        if (duplicateCount > 0) {
          notices.push(`已跳过 ${duplicateCount} 个重复物料`);
        }
        if (overflowCount > 0 && maxRows != null) {
          notices.push(
            `明细最多 ${maxRows} 行，另有 ${overflowCount} 个物料未添加`,
          );
        }
        if (notices.length > 0) message.info(notices.join('；'));
      }}
    />
  );
}
