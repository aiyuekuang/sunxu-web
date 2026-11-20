/**
 * 数量 + 单位双口径展示工具。
 *
 * 采购入库单、采购退料等单据的数量存在两个口径：业务(收货)单位数量（如 10 L）与基础库存
 * 单位数量（如 10000 mL）。展示必须统一为「业务量（基础 基础量）」，避免只显示裸基础量
 * 造成单位误判。采购入库单是该口径的权威来源，下游单据（退货等）必须复用本工具对齐，
 * 不得各自实现一套格式化。
 */
export type UnitLabelMap = Record<string, string>;

function formatQty(
  value?: number | string | null,
  unit?: string | null,
): string {
  if (value === undefined || value === null || value === '') return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(num)) return '-';
  const formatted = num.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
  return unit ? `${formatted} ${unit}` : formatted;
}

export function normalizeUnit(value?: string | null): string {
  return value?.trim() || '';
}

/**
 * 单位字段落库保存 material_unit 字典值（如 PC / EA / kg），界面展示转为字典标签。
 * 命不中字典时保留原值，兼容存量自由文本或字典未配置数据。
 */
export function formatUnitLabel(
  unit: string | null | undefined,
  unitLabelMap: UnitLabelMap = {},
): string {
  const normalized = normalizeUnit(unit);
  if (!normalized) return '';
  return unitLabelMap[normalized] ?? normalized;
}

export function isDifferentUnit(
  left?: string | null,
  right?: string | null,
): boolean {
  const normalizedLeft = normalizeUnit(left);
  const normalizedRight = normalizeUnit(right);
  return Boolean(
    normalizedLeft && normalizedRight && normalizedLeft !== normalizedRight,
  );
}

/**
 * 按「业务量 业务单位（基础 基础量 基础单位）」展示。
 * 业务/基础单位相同或任一缺失时，只展示主口径，不画蛇添足加括号。
 */
export function formatQtyWithBaseUnit(params: {
  businessQty?: number | string | null;
  businessUnit?: string | null;
  baseQty?: number | string | null;
  baseUnit?: string | null;
  unitLabelMap?: UnitLabelMap;
}): string {
  const businessUnitValue = normalizeUnit(
    params.businessUnit ?? params.baseUnit,
  );
  const baseUnitValue = normalizeUnit(params.baseUnit);
  const primary = formatQty(
    params.businessQty ?? params.baseQty,
    formatUnitLabel(businessUnitValue, params.unitLabelMap),
  );

  if (!isDifferentUnit(businessUnitValue, baseUnitValue)) {
    return primary;
  }

  return `${primary}（基础 ${formatQty(
    params.baseQty,
    formatUnitLabel(baseUnitValue, params.unitLabelMap),
  )}）`;
}

/**
 * 由基础数量与换算系数还原业务(收货)单位数量。无有效换算系数时退化为基础数量本身。
 * 与后端 PurchaseReturnService.resolveDisplayQty 保持同一口径。
 */
export function toBusinessQty(
  baseQty?: number | string | null,
  conversionFactorToBase?: number | string | null,
): number | null {
  if (baseQty === null || baseQty === undefined || baseQty === '') return null;
  const base = Number(baseQty);
  if (!Number.isFinite(base)) return null;
  const factor = Number(conversionFactorToBase);
  if (!Number.isFinite(factor) || factor <= 0) return base;
  return base / factor;
}
