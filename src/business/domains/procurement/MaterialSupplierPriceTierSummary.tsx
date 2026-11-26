import { Space, Tag } from 'antd';
import { useAmountMask, useSupplierPriceTierCapabilities } from '../../providers/BusinessUiProvider';
import type { SupplierPriceTierSummaryRecord } from './supplier-price-tier-types';

function sortPriceTiers(
  left: SupplierPriceTierSummaryRecord,
  right: SupplierPriceTierSummaryRecord,
): number {
  const gradeCompare = (left.grade ?? '').localeCompare(right.grade ?? '');
  if (gradeCompare !== 0) return gradeCompare;
  if (left.isDefault !== right.isDefault) return left.isDefault ? -1 : 1;
  return (
    (left.priority ?? Number.MAX_SAFE_INTEGER) -
    (right.priority ?? Number.MAX_SAFE_INTEGER)
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain procurement
 * @sunxu-reason Shows host supplier price tiers while grade labels, default currency, and amount masking remain host provided.
 */
export function MaterialSupplierPriceTierSummary({
  priceTiers,
}: {
  priceTiers?: readonly SupplierPriceTierSummaryRecord[];
}) {
  const { materialGradeLabelMap, defaultCurrency = 'CNY' } =
    useSupplierPriceTierCapabilities() ?? {};
  const maskAmount = useAmountMask();
  const tiers = [...(priceTiers ?? [])].sort(sortPriceTiers);
  if (tiers.length === 0) return '-';
  const visibleTiers = tiers.slice(0, 3);

  return (
    <Space size={[0, 4]} wrap>
      {visibleTiers.map((tier) => (
        <Tag key={tier.id} color={tier.isDefault ? 'blue' : undefined}>
          {tier.grade
            ? (materialGradeLabelMap?.[tier.grade] ?? tier.grade)
            : '无等级'}{' '}
          {maskAmount(
            `${tier.currency ?? defaultCurrency} ${Number(
              tier.unitPrice,
            ).toFixed(4)}`,
          )}
        </Tag>
      ))}
      {tiers.length > visibleTiers.length ? (
        <Tag>+{tiers.length - visibleTiers.length}</Tag>
      ) : null}
    </Space>
  );
}
