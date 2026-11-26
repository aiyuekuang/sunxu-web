import type { AccountingAccountSelectOption } from './accounting-account-modal-types';
import type { AccountingBookSelectOption } from './accounting-book-modal-types';

/** MES accounting book/account choices mirrored from the current domain enums. */
export const ACCOUNTING_BOOK_TYPE_OPTIONS: readonly AccountingBookSelectOption[] = [
  { label: '主账簿', value: 'primary' },
  { label: '模拟账簿', value: 'simulation' },
  { label: '对比账簿', value: 'comparison' },
];

export const ACCOUNTING_ACCOUNT_TYPE_OPTIONS: readonly AccountingAccountSelectOption[] = [
  { label: '资产', value: 'asset' },
  { label: '负债', value: 'liability' },
  { label: '权益', value: 'equity' },
  { label: '收入', value: 'revenue' },
  { label: '成本', value: 'cost' },
  { label: '费用', value: 'expense' },
  { label: '损益', value: 'profit_loss' },
  { label: '表外', value: 'off_balance' },
];

export const ACCOUNTING_ACCOUNT_NORMAL_BALANCE_OPTIONS: readonly AccountingAccountSelectOption[] = [
  { label: '借', value: 'debit' },
  { label: '贷', value: 'credit' },
];

export const ACCOUNTING_ACCOUNT_STATUS_OPTIONS: readonly AccountingAccountSelectOption[] = [
  { label: '草稿', value: 'draft' },
  { label: '启用', value: 'active' },
  { label: '暂停', value: 'suspended' },
  { label: '停用', value: 'disabled' },
];

export const ACCOUNTING_BOOK_STATUS_OPTIONS: readonly AccountingBookSelectOption[] = [
  { label: '草稿', value: 'draft' },
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '归档', value: 'archived' },
];

export const ACCOUNTING_DIMENSION_TYPE_OPTIONS: readonly AccountingAccountSelectOption[] = [
  { label: '客户', value: 'customer' },
  { label: '供应商', value: 'supplier' },
  { label: '部门', value: 'department' },
  { label: '成本中心', value: 'cost_center' },
  { label: '物料', value: 'material' },
  { label: '仓库', value: 'warehouse' },
  { label: '工单', value: 'work_order' },
  { label: '项目', value: 'project' },
  { label: '员工', value: 'employee' },
  { label: '银行账户', value: 'bank_account' },
  { label: '税码', value: 'tax_code' },
  { label: '其他', value: 'other' },
];

export const ACCOUNTING_DIMENSION_REQUIREMENT_OPTIONS: readonly AccountingAccountSelectOption[] = [
  { label: '可选', value: 'optional' },
  { label: '必填', value: 'required' },
];
