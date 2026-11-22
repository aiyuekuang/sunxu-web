import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const read = (path) =>
  readFileSync(join(process.cwd(), path), 'utf8');

function section(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.ok(start >= 0, `missing section start: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(end > start, `missing section end: ${endMarker}`);
  return source.slice(start, end);
}

function assertOrdered(source, markers) {
  let previousIndex = -1;
  for (const marker of markers) {
    const index = source.indexOf(marker);
    assert.ok(index > previousIndex, `expected ${marker} after preceding marker`);
    previousIndex = index;
  }
}

test('account import keeps full-sheet validation and row-level correction feedback', () => {
  const source = section(
    read('src/mes/components/AccountingImportComponents.tsx'),
    'export function AccountImportModal',
    'export function OpeningBalanceImportModal',
  );

  assert.match(source, /submitText: '导入并校验'/);
  assert.match(source, /row\.status === 'error'/);
  assert.match(source, /问题说明/);
  assert.match(source, /未导入任何科目/);
  assert.match(source, /capabilities\.importAccounts/);
});

test('opening balance import stays a precheck flow and reports row validation issues', () => {
  const file = read('src/mes/components/AccountingImportComponents.tsx');
  const start = file.indexOf('export function OpeningBalanceImportModal');
  assert.ok(start >= 0, 'missing opening balance import modal');
  const source = file.slice(start);

  assert.match(source, /导入并预检/);
  assert.match(source, /导入只生成预检批次，不会直接改科目余额/);
  assert.match(source, /capabilities\.importOpeningBalances/);
  assert.match(source, /onImported\(detail\)/);
});

test('inventory results keep direction and pending-cost filters in one table', () => {
  const file = read('src/mes/components/AccountingInventoryComponents.tsx');
  const source = section(
    file,
    'export function InventoryResultTable',
    'export function InventoryStockSummaryTable',
  );
  const query = section(
    file,
    'function getResultFilterQuery',
    'function toValueEnum',
  );

  assert.match(source, /Segmented/);
  assert.match(source, /label: '入库'/);
  assert.match(source, /label: '出库'/);
  assert.match(source, /待成本结果/);
  assert.match(query, /direction: 'receipt'/);
  assert.match(query, /direction: 'issue'/);
  assert.match(query, /status: 'pending_cost'/);
});

test('inventory opening balance edits preserve the selected material and warehouse', () => {
  const source = section(
    read('src/mes/components/AccountingInventoryComponents.tsx'),
    'export function InventoryOpeningBalancePanel',
    'export function InventoryResultTable',
  );

  assert.match(source, /disabled: Boolean\(editingRecord\)/);
  assert.match(source, /capabilities\.requestMaterialOptions/);
  assert.match(source, /capabilities\.requestWarehouseOptions/);
  assert.match(source, /capabilities\.saveOpeningBalance/);
});

test('narrative summary filters submit and reset through the shared ledger query', () => {
  const source = section(
    read('src/mes/components/AccountingLedgerComponents.tsx'),
    'export function NarrativeSummaryTable',
    'export function TrialBalanceButton',
  );

  assert.match(source, /onSubmit=\{\(values\) =>/);
  assert.match(source, /onQueryChange\(\{/);
  assert.match(source, /onReset=\{\(\) => onQueryChange\(\{\}\)\}/);
  assert.match(source, /capabilities\.requestRows/);
});

test('purchase accrual preview preserves selection totals and confirmation safeguards', () => {
  const file = read('src/mes/components/PurchaseAccrualComponents.tsx');
  const start = file.indexOf('export function PurchaseAccrualPreviewDrawer');
  assert.ok(start >= 0, 'missing purchase accrual preview drawer');
  const source = file.slice(start);

  assert.match(source, /closable=\{!confirming\}/);
  assert.match(source, /keyboard=\{!confirming\}/);
  assert.match(source, /maskClosable=\{!confirming\}/);
  assert.match(source, /footer=\{/);
  assert.match(source, /已选 \{selectedLineIds\.length\} 行，金额/);
  assert.match(source, /确认暂估/);
  assert.match(source, /<strong>合计<\/strong>/);
  assert.doesNotMatch(source, /当前页合计/);
});

test('purchase accrual detail uses shared status and resizable-table components', () => {
  const file = read('src/mes/components/PurchaseAccrualComponents.tsx');
  const source = section(
    file,
    'export function PurchaseAccrualDetailDrawer',
    'export function PurchaseAccrualPreviewDrawer',
  );

  assert.match(file, /ResizableTable as Table/);
  assert.match(source, /<Table</);
  assert.match(source, /StatusDisplay/);
  assert.match(source, /capabilities\.reverseRun/);
  assert.match(source, /capabilities\.onOpenPurchaseReceipt/);
});

test('requisition form preserves draft, submit, duplicate-submit, and failure recovery behavior', () => {
  const source = read('src/mes/components/RequisitionFormModal.tsx');

  assert.match(source, /<Dropdown\.Button/);
  assert.match(source, /保存并提交审批/);
  assert.match(source, /仅保存草稿/);
  assert.match(source, /if \(submittingRef\.current\) return false/);
  assert.match(source, /capabilities\.submit\(\{ id: result\.id \}\)/);
  assert.match(source, /capabilities\.onOpenCreated\?\.\(result\.id\)/);
  assert.match(source, /onSuccess\?\.\(submittedResult\)/);
});

test('BOM expansion and conversion preserve material-first line columns', () => {
  const bom = section(
    read('src/mes/components/BomExpansionCreateModal.tsx'),
    'const previewColumns',
    "title: '来源'",
  );
  const conversion = section(
    read('src/mes/components/ConvertToOrderDrawer.tsx'),
    'dataSource={remainingItems}',
    "title: '行号'",
  );
  const titles = [
    "title: '物料名称'",
    "title: '物料编码'",
    "title: '规格'",
    "title: '单位'",
    "title: '需求数量'",
  ];

  assertOrdered(bom, titles);
  assertOrdered(conversion, titles);
});

test('package management and sales conversion preserve material-first columns', () => {
  const packageManager = read('src/mes/components/PackageSpecManager.tsx');
  const conversion = section(
    read('src/mes/components/ConvertToProductionDrawer.tsx'),
    'columns={[',
    "title: '订单图纸'",
  );

  assertOrdered(packageManager, [
    "title: '物料名称'",
    "title: '物料编码'",
  ]);
  assertOrdered(conversion, [
    "title: '物料名称'",
    "title: '物料编码'",
  ]);
});

test('quotation drawer keeps host success callback and shared custom-field section', () => {
  const source = read('src/mes/components/QuotationFormDrawer.tsx');

  assert.match(source, /capabilitiesRef\.current\.createQuotation\(payload\)/);
  assert.match(source, /onSuccess\?\.\(quotation\)/);
  assert.match(source, /CustomFieldFormSection/);
  assert.doesNotMatch(source, /document-form-section-title">自定义字段/);
});

test('sales order detail ledger keeps filters, material-first columns, actions, and totals', () => {
  const sales = read('src/mes/components/SalesDetailLedgerComponents.tsx');
  const ledger = section(
    sales,
    'export function SaleOrderDetailLedger',
    'function SaleOrderLedgerFooter',
  );
  const footer = section(
    sales,
    'function SaleOrderLedgerFooter',
    'function saleReturnDocumentActions',
  );
  const filterFields = section(
    ledger,
    'const filterColumns:',
    'const priceColumns:',
  );
  const materialColumns = section(
    ledger,
    "title: '物料名称'",
    "title: '订单号'",
  );

  assertOrdered(filterFields, [
    "dataIndex: 'customerId'",
    "dataIndex: 'materialId'",
    "dataIndex: 'keyword'",
    "dataIndex: 'createdAtRange'",
  ]);
  assertOrdered(materialColumns, [
    "title: '物料名称'",
    "title: '物料编码'",
    "title: '规格'",
    "title: '单位'",
    "title: '订购数量'",
    "title: '已发数量'",
    "title: '未发数量'",
    "title: '已退数量'",
  ]);
  for (const key of ['view-deliveries', 'procurement-demand', 'view-production-plans']) {
    assert.ok(ledger.includes(`'${key}': (document) =>`), `missing ${key} handler`);
  }
  for (const label of ['订单数', '明细行', '订购数量', '已发数量', '金额', '折扣金额', '折后金额', '税额', '总金额']) {
    assert.ok(footer.includes(`<span>${label}`), `missing ${label} summary`);
  }
  assert.match(ledger, /<SaleOrderShipActionModal/);
  assert.match(ledger, /footer=\{summary \?/);
});

test('sales return detail ledger keeps host-driven actions and saved-view filtering', () => {
  const sales = read('src/mes/components/SalesDetailLedgerComponents.tsx');
  const ledger = section(
    sales,
    'export function SaleReturnDetailLedger',
    'function SaleReturnLedgerFooter',
  );

  assert.match(ledger, /SaleReturnEditDrawer/);
  assert.match(ledger, /SaleReturnReceiveModal/);
  assert.match(ledger, /SaleReturnStockConversionDrawer/);
  assert.match(ledger, /savedViewController \? \{ controller: savedViewController \}/);
  assert.match(ledger, /lightFilter=\{lightFilter\}/);
});

test('sales-order shipping delegates the gated action to the host editor', () => {
  const source = read('src/mes/components/SaleOrderShipActionModal.tsx');

  assert.match(source, /capabilities\.renderDeliveryEditor\(\{/);
  assert.match(source, /open: open && Boolean\(order\?\.id\)/);
  assert.match(source, /saleOrderId: order\?\.id \?\? undefined/);
  assert.match(source, /onClose,/);
  assert.match(source, /onSuccess,/);
  assert.doesNotMatch(source, /saleDeliveryControllerShip|<Form/);
});
