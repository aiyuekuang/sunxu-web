import { Typography } from 'antd';
import React from 'react';

export interface CustomerMaterialSnapshot {
  code?: string | null;
  name?: string | null;
  spec?: string | null;
}

export interface CustomerMaterialAliasItem {
  customerMaterialCode?: string | null;
  customerMaterialName?: string | null;
  customerMaterialSpec?: string | null;
  material?: CustomerMaterialSnapshot | null;
}

export type CustomerMaterialField = 'code' | 'name' | 'spec';
export type CustomerMaterialDisplayMode = 'combined' | 'internal' | 'customer';

const ALIAS_KEY: Record<
  CustomerMaterialField,
  keyof CustomerMaterialAliasItem
> = {
  code: 'customerMaterialCode',
  name: 'customerMaterialName',
  spec: 'customerMaterialSpec',
};

function readAlias(
  item: CustomerMaterialAliasItem,
  field: CustomerMaterialField,
): string | undefined {
  const value = item[ALIAS_KEY[field]];
  return typeof value === 'string' && value ? value : undefined;
}

function readInternal(
  item: CustomerMaterialAliasItem,
  field: CustomerMaterialField,
): string | undefined {
  return item.material?.[field] ?? undefined;
}

/** Sort/export value: customer alias first, then the internal material snapshot. */
export function customerMaterialSortValue(
  item: CustomerMaterialAliasItem,
  field: CustomerMaterialField,
): string | undefined {
  return readAlias(item, field) ?? readInternal(item, field);
}

export interface CustomerMaterialCellProps {
  item: CustomerMaterialAliasItem;
  field: CustomerMaterialField;
  /** Use separate internal/customer columns when both values must be compared. */
  displayMode?: CustomerMaterialDisplayMode;
  /** Only applies to the name field; shows the matching source's specification. */
  showSpec?: boolean;
}

/**
 * @sunxu-layer business
 * @sunxu-domain sales
 * @sunxu-reason Keeps frozen customer material aliases visibly tied to the authoritative internal material.
 * Keeps the customer alias and authoritative internal material identifiable together.
 * `materialId` remains the source-of-truth identity; customer fields are frozen
 * aliases for sales documents. Customer-facing print templates should render
 * their own customer-only value instead of using this internal comparison cell.
 */
export function CustomerMaterialCell({
  item,
  field,
  displayMode = 'combined',
  showSpec = false,
}: CustomerMaterialCellProps) {
  const alias = readAlias(item, field);
  const internal = readInternal(item, field);
  const displayValue =
    displayMode === 'customer'
      ? alias
      : displayMode === 'internal'
        ? internal
        : alias ?? internal;

  if (displayMode !== 'combined') {
    const spec =
      field === 'name' && showSpec
        ? displayMode === 'customer'
          ? readAlias(item, 'spec')
          : readInternal(item, 'spec')
        : undefined;

    return (
      <>
        <div>{displayValue || '-'}</div>
        {spec ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {spec}
          </Typography.Text>
        ) : null}
      </>
    );
  }

  if (!alias) return <>{internal || '-'}</>;
  if (!internal || internal === alias) return <>{alias}</>;

  return (
    <>
      <div>{alias}</div>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {internal}
      </Typography.Text>
    </>
  );
}
