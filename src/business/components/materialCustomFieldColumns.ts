import type { ProColumns } from '@ant-design/pro-components';
import type { ReactNode } from 'react';
import type { MesCustomFieldDefinition } from './custom-field-form-types';
import { renderCustomFieldCell } from './CustomFieldCell';

/** Row contract shared with the MES editable line-table adapter. */
export interface DocumentLineRow {
  _key: string;
}

export interface DocumentLineColumn<T extends DocumentLineRow> {
  key: string;
  title: ReactNode;
  required?: boolean;
  width?: number | string;
  fixed?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  render: (
    row: T,
    index: number,
    update: (patch: Partial<T>) => void,
  ) => ReactNode;
}

interface CreateMaterialCustomFieldColumnsOptions<T> {
  getMaterial: (record: T) => unknown;
  prefixTitle?: string;
  maskAmount?: (value: string | number | null | undefined, priceAllowed: boolean) => string;
  priceAllowed?: boolean;
  amountVisibilityRevision?: string;
}

interface CreateMaterialCustomFieldLineColumnsOptions<T extends DocumentLineRow> {
  getMaterial: (record: T) => unknown;
  getSelectedOption?: (record: T) => unknown;
  prefixTitle?: string;
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function resolveListSortOrder(field: MesCustomFieldDefinition): number {
  const displaySortOrder = readObject(field.displayJson).sortOrder;
  return typeof displaySortOrder === 'number'
    ? displaySortOrder
    : (field.sortOrder ?? 0);
}

export function resolveMaterialCustomFieldWidth(
  field: MesCustomFieldDefinition,
): number {
  const listWidth = readObject(field.displayJson).listWidth;
  return typeof listWidth === 'number' && listWidth > 0 ? listWidth : 120;
}

export function getVisibleMaterialCustomFields(
  schema: MesCustomFieldDefinition[],
): MesCustomFieldDefinition[] {
  return schema
    .filter(
      (field) =>
        field.isActive !== false &&
        readObject(field.displayJson).showInList === true,
    )
    .slice()
    .sort(
      (left, right) => resolveListSortOrder(left) - resolveListSortOrder(right),
    );
}

export function sumMaterialCustomFieldColumnWidths(
  schema: MesCustomFieldDefinition[],
): number {
  return getVisibleMaterialCustomFields(schema).reduce(
    (sum, field) => sum + resolveMaterialCustomFieldWidth(field),
    0,
  );
}

/** Material custom-field table columns share the same display/error policy. */
export function createMaterialCustomFieldColumns<T>(
  schema: MesCustomFieldDefinition[],
  options: CreateMaterialCustomFieldColumnsOptions<T>,
): ProColumns<T>[] {
  const titlePrefix = options.prefixTitle ?? '物料';
  return getVisibleMaterialCustomFields(schema).map((field) => {
    const column: ProColumns<T> & { __mesAmountVisibilityRevision?: string } = {
      title: `${titlePrefix}·${field.label}`,
      key: `material-custom-${field.fieldKey}`,
      width: resolveMaterialCustomFieldWidth(field),
      ellipsis: true,
      search: false,
      sorter: false,
      render: (_value: unknown, record: T) => {
        const material = readObject(options.getMaterial(record));
        const rendered = renderCustomFieldCell(field, {
          computedValues: material.customComputedValues,
          rawValues: material.customValues,
          errors: material.customComputedErrors,
        });
        if (
          field.dataType === 'money' &&
          typeof rendered === 'string' &&
          rendered !== '-' &&
          options.maskAmount
        ) {
          return options.maskAmount(rendered, options.priceAllowed ?? false);
        }
        return rendered;
      },
    };
    if (field.dataType === 'money' && options.amountVisibilityRevision) {
      column.__mesAmountVisibilityRevision = options.amountVisibilityRevision;
    }
    return column;
  });
}

/** Material custom fields for editable document-line table adapters. */
export function createMaterialCustomFieldLineColumns<
  T extends DocumentLineRow,
>(
  schema: MesCustomFieldDefinition[],
  options: CreateMaterialCustomFieldLineColumnsOptions<T>,
): DocumentLineColumn<T>[] {
  const titlePrefix = options.prefixTitle ?? '物料';
  return getVisibleMaterialCustomFields(schema).map((field) => ({
    key: `material-custom-${field.fieldKey}`,
    title: `${titlePrefix}·${field.label}`,
    width: resolveMaterialCustomFieldWidth(field),
    render: (record) => {
      const selectedOption = readObject(options.getSelectedOption?.(record));
      const material = readObject(options.getMaterial(record));
      return renderCustomFieldCell(field, {
        computedValues:
          selectedOption.customComputedValues ?? material.customComputedValues,
        rawValues: selectedOption.customValues ?? material.customValues,
        errors:
          selectedOption.customComputedErrors ?? material.customComputedErrors,
      });
    },
  }));
}
