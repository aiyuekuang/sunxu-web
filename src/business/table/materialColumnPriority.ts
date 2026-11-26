export type MaterialColumnPriorityMode = 'auto' | 'preserve';

export interface MaterialColumnPriorityConfig {
  /**
   * auto 仅调整系统默认列序；个人视图中的显式 order 仍由 ProTable 覆盖。
   * preserve 用于审批、异常、时间线等以任务状态为第一判断对象的明确例外。
   */
  mode?: MaterialColumnPriorityMode;
  /** 多数量场景可显式指定主业务数量，避免把占用、冻结等辅助数量前置。 */
  primaryQuantityKeys?: readonly string[];
}

export type MaterialColumnPriority =
  | MaterialColumnPriorityMode
  | MaterialColumnPriorityConfig;

type PrioritizableColumn = {
  title?: unknown;
  key?: unknown;
  dataIndex?: unknown;
  valueType?: unknown;
  hideInSetting?: boolean;
  hideInTable?: boolean;
  hidden?: boolean;
  children?: PrioritizableColumn[];
};

type MaterialColumnRole =
  | 'structural'
  | 'action'
  | 'name'
  | 'code'
  | 'spec'
  | 'unit'
  | 'primaryQuantity'
  | 'secondaryQuantity'
  | 'context'
  | 'extension'
  | 'auxiliary'
  | 'other';

const ROLE_RANK: Record<MaterialColumnRole, number> = {
  structural: 0,
  name: 10,
  code: 20,
  spec: 30,
  unit: 40,
  primaryQuantity: 50,
  secondaryQuantity: 55,
  context: 60,
  other: 65,
  extension: 70,
  auxiliary: 80,
  // 行内操作列是控件列而不是业务信息列，必须排在业务列和辅助列之后。
  action: 95,
};

const QUANTITY_TITLE_PATTERN = /(数量|数量\([^)]*\)|^数量$)/;
const QUANTITY_KEY_PATTERN = /(qty|quantity|count)$/i;
const SECONDARY_QUANTITY_TITLE_PATTERN = /(可用|预警|安全库存|库存上下限)/;
const SECONDARY_QUANTITY_KEY_PATTERN = /(available|alert|threshold)/i;
const AUXILIARY_QUANTITY_TITLE_PATTERN = /(锁定|冻结|占用|预留)/;
const AUXILIARY_QUANTITY_KEY_PATTERN =
  /(reserved|frozen|locked|occupied|allocated|hold)/i;
const EXTENSION_KEY_PATTERN =
  /(^|[-_.])(material-custom|line-custom|customfield|custom_field|cfexport)([-_.]|$)/i;
const AUXILIARY_KEY_PATTERN =
  /(thumbnail|image|photo|drawing|attachment|file|remark|note|comment|created|updated|deleted|audit|timestamp|creator|updater|operator|owner)/i;
const AUXILIARY_TITLE_PATTERN =
  /(缩略图|图片|照片|附件|备注|说明|创建时间|更新时间|修改时间|创建人|更新人|操作人|审计|货主)/;
const CONTEXT_KEY_PATTERN =
  /(order|source|customer|supplier|vendor|warehouse|location|bin|batch|lot|process|operation|workcenter|work_center|status|state|type|category|project|contract|delivery|due|date)/i;
const CONTEXT_TITLE_PATTERN =
  /(单号|来源|客户|供应商|仓库|仓位|库位|批次|流程|工序|工位|状态|类型|类别|项目|合同|交期|交付|日期)/;

function normalizeIdentity(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join('.').toLowerCase();
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim().toLowerCase();
  }
  return '';
}

function getColumnIdentity(column: PrioritizableColumn): string {
  return normalizeIdentity(column.key) || normalizeIdentity(column.dataIndex);
}

function getColumnTitle(column: PrioritizableColumn): string {
  return typeof column.title === 'string' ? column.title.trim() : '';
}

const ROW_NUMBER_TITLES = new Set(['序号', '行号', '行次', '#']);
const ROW_INDEX_COLUMN_KEY = '__sxw_row_index__';

/**
 * 表格组件自动注入的展示序号列（行号 / 序号）：没有业务字段归属，在列设置里不可见，
 * 位置由表格结构决定，必须留在首位。
 *
 * 页面自己声明的业务行号列（单据 lineNo、工序 sequence 等）不在此列，仍按业务列排序；
 * 这也是“辅助字段后置”口径的边界：被挤位的只有组件注入的结构列。
 */
function isInjectedRowNumberColumn(column: PrioritizableColumn): boolean {
  const identity = getColumnIdentity(column);
  if (identity === ROW_INDEX_COLUMN_KEY) return true;
  // valueType=index/indexBorder 是 ProTable 专门的行号渲染类型，本身就是结构列。
  if (column.valueType === 'index' || column.valueType === 'indexBorder') {
    return true;
  }
  if (identity !== 'rowindex' && column.hideInSetting !== true) return false;
  if (!ROW_NUMBER_TITLES.has(getColumnTitle(column))) return false;
  const dataIndex = normalizeIdentity(column.dataIndex);
  return dataIndex === '' || dataIndex === 'index' || dataIndex === 'rowindex';
}

function isStructuralColumn(column: PrioritizableColumn): boolean {
  const identity = getColumnIdentity(column);
  const title = getColumnTitle(column);
  return (
    identity === ROW_INDEX_COLUMN_KEY ||
    identity === 'index' ||
    title === '序号' ||
    isInjectedRowNumberColumn(column)
  );
}

/**
 * 行内操作列（ProTable 的 valueType=option，或旧版 title=操作 / 共享 actions 列）。
 * 它是控件列，不是业务信息列；不带 fixed: 'right' 时同样必须排在业务列最后。
 */
function isActionColumn(column: PrioritizableColumn): boolean {
  const identity = getColumnIdentity(column);
  return (
    column.valueType === 'option' ||
    getColumnTitle(column) === '操作' ||
    identity === 'actions' ||
    identity === '__actions'
  );
}

function isMaterialNameColumn(column: PrioritizableColumn): boolean {
  const identity = getColumnIdentity(column);
  const title = getColumnTitle(column);
  return (
    /(material|product|goods|part).*name$/i.test(identity) ||
    /^(客户)?(物料|产品|成品|半成品|原料|材料|备件)(名称|品名)$/.test(title) ||
    /^(品名|品名规格|产品名称\s*\/\s*规格|物料名称\s*\/\s*规格)$/.test(title)
  );
}

function isMaterialCodeColumn(column: PrioritizableColumn): boolean {
  const identity = getColumnIdentity(column);
  const title = getColumnTitle(column);
  return (
    /(material|product|goods|part).*(code|no|number)$/i.test(identity) ||
    /^(客户)?(物料|产品|成品|半成品|原料|材料|备件)(编码|编号|料号)$/.test(
      title,
    ) ||
    /^(客户料号|客户料号\s*\/\s*物料编码|客户料号\s*\/\s*编码)$/.test(title)
  );
}

function isMaterialSpecColumn(column: PrioritizableColumn): boolean {
  const identity = getColumnIdentity(column);
  const title = getColumnTitle(column);
  return (
    /(material|product|goods|part).*(spec|model)$/i.test(identity) ||
    /^(客户)?(物料|产品)?(规格|规格型号|型号)$/.test(title)
  );
}

function isMaterialUnitColumn(column: PrioritizableColumn): boolean {
  const identity = getColumnIdentity(column);
  const title = getColumnTitle(column);
  return (
    /(material|product|goods|part).*unit$/i.test(identity) ||
    /^(物料|产品|计量|基本|基础)?单位$/.test(title)
  );
}

function isQuantityColumn(column: PrioritizableColumn): boolean {
  const identity = getColumnIdentity(column);
  const title = getColumnTitle(column);
  return (
    QUANTITY_KEY_PATTERN.test(identity) || QUANTITY_TITLE_PATTERN.test(title)
  );
}

function isSecondaryQuantityColumn(column: PrioritizableColumn): boolean {
  return (
    SECONDARY_QUANTITY_TITLE_PATTERN.test(getColumnTitle(column)) ||
    SECONDARY_QUANTITY_KEY_PATTERN.test(getColumnIdentity(column))
  );
}

function isAuxiliaryQuantityColumn(column: PrioritizableColumn): boolean {
  return (
    AUXILIARY_QUANTITY_TITLE_PATTERN.test(getColumnTitle(column)) ||
    AUXILIARY_QUANTITY_KEY_PATTERN.test(getColumnIdentity(column))
  );
}

function isExtensionColumn(column: PrioritizableColumn): boolean {
  const identity = getColumnIdentity(column);
  const title = getColumnTitle(column);
  return EXTENSION_KEY_PATTERN.test(identity) || title.includes('·');
}

function isAuxiliaryColumn(column: PrioritizableColumn): boolean {
  return (
    AUXILIARY_KEY_PATTERN.test(getColumnIdentity(column)) ||
    AUXILIARY_TITLE_PATTERN.test(getColumnTitle(column))
  );
}

function isContextColumn(column: PrioritizableColumn): boolean {
  return (
    CONTEXT_KEY_PATTERN.test(getColumnIdentity(column)) ||
    CONTEXT_TITLE_PATTERN.test(getColumnTitle(column))
  );
}

function resolveConfig(
  priority: MaterialColumnPriority | false | undefined,
): MaterialColumnPriorityConfig {
  if (priority === false || priority === 'preserve') {
    return { mode: 'preserve' };
  }
  if (priority === undefined || priority === 'auto') return { mode: 'auto' };
  return { ...priority, mode: priority.mode ?? 'auto' };
}

function isVisibleColumn(column: PrioritizableColumn): boolean {
  return column.hideInTable !== true && column.hidden !== true;
}

function reorderVisibleColumns<T extends PrioritizableColumn>(
  columns: readonly T[],
  config: MaterialColumnPriorityConfig,
): T[] {
  const normalizedColumns = columns.map((column) => {
    if (!column.children?.length) return column;
    return {
      ...column,
      children: reorderVisibleColumns(column.children, config),
    } as T;
  });
  const visibleColumns = normalizedColumns.filter(isVisibleColumn);
  const explicitQuantityKeys = new Set(
    (config.primaryQuantityKeys ?? []).map((key) => normalizeIdentity(key)),
  );
  const quantityColumns = visibleColumns.filter(isQuantityColumn);
  const primaryQuantityColumn =
    quantityColumns.find((column) =>
      explicitQuantityKeys.has(getColumnIdentity(column)),
    ) ??
    quantityColumns.find((column) => !isSecondaryQuantityColumn(column)) ??
    quantityColumns[0];
  const hasName = visibleColumns.some(isMaterialNameColumn);
  const hasCode = visibleColumns.some(isMaterialCodeColumn);
  const hasSpec = visibleColumns.some(isMaterialSpecColumn);
  const hasUnit = visibleColumns.some(isMaterialUnitColumn);
  const isMaterialSurface =
    (hasName &&
      (hasCode || hasSpec || hasUnit || quantityColumns.length > 0)) ||
    (hasCode && (hasSpec || hasUnit || quantityColumns.length > 0));
  if (!isMaterialSurface) return normalizedColumns;

  const rankedVisibleColumns = visibleColumns
    .map((column, index) => {
      let role: MaterialColumnRole = 'other';
      if (isStructuralColumn(column)) role = 'structural';
      else if (isActionColumn(column)) role = 'action';
      else if (isMaterialNameColumn(column)) role = 'name';
      else if (isMaterialCodeColumn(column)) role = 'code';
      else if (isMaterialSpecColumn(column)) role = 'spec';
      else if (isMaterialUnitColumn(column)) role = 'unit';
      else if (isQuantityColumn(column)) {
        role =
          column === primaryQuantityColumn
            ? 'primaryQuantity'
            : isAuxiliaryQuantityColumn(column)
              ? 'auxiliary'
              : 'secondaryQuantity';
      } else if (isExtensionColumn(column)) role = 'extension';
      else if (isAuxiliaryColumn(column)) role = 'auxiliary';
      else if (isContextColumn(column)) role = 'context';
      return { column, index, rank: ROLE_RANK[role] };
    })
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map(({ column }) => column);

  let visibleIndex = 0;
  return normalizedColumns.map((column) =>
    isVisibleColumn(column) ? rankedVisibleColumns[visibleIndex++] : column,
  );
}

/**
 * 统一物料明细的系统默认列序：物料识别 → 场景数量 → 业务上下文 → 动态扩展 → 辅助信息。
 * 搜索专用列保留原位置；同组列保持相对顺序；个人列序在 ProTable 层继续优先。
 */
export function prioritizeMaterialDetailColumns<T extends PrioritizableColumn>(
  columns: readonly T[] | undefined,
  priority?: MaterialColumnPriority | false,
): T[] | undefined {
  if (!columns) return undefined;
  const config = resolveConfig(priority);
  if (config.mode === 'preserve') return [...columns];
  return reorderVisibleColumns(columns, config);
}
