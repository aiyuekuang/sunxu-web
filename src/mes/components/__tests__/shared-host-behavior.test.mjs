import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

let vite;
let prioritizeMaterialDetailColumns;
let landedCostPreview;
let receiptLogic;

before(async () => {
  vite = await createServer({
    configFile: 'vite.lib.config.ts',
    server: { middlewareMode: true },
    appType: 'custom',
  });
  const [material, landedCost, receipt] = await Promise.all([
    vite.ssrLoadModule('/src/mes/table/materialColumnPriority.ts'),
    vite.ssrLoadModule('/src/mes/components/landedCostAllocationPreview.ts'),
    vite.ssrLoadModule('/src/mes/components/purchase-receipt-action-modal.logic.ts'),
  ]);
  prioritizeMaterialDetailColumns = material.prioritizeMaterialDetailColumns;
  landedCostPreview = landedCost.buildLandedCostAllocationPreview;
  receiptLogic = receipt;
});

after(async () => {
  await vite?.close();
});

function visibleTitles(columns) {
  return (columns ?? [])
    .filter((column) => column.hideInTable !== true)
    .map((column) => column.title);
}

test('material columns keep identification and primary quantity ahead of context and auxiliary fields', () => {
  const columns = [
    { title: '仓库', dataIndex: 'warehouseName' },
    { title: '物料编码', key: 'materialCode' },
    { title: '缩略图', dataIndex: 'thumbnailUrl' },
    { title: '物料名称', key: 'materialName' },
    { title: '规格型号', key: 'materialSpec' },
    { title: '物料·颜色', key: 'material-custom-color' },
    { title: '单位', key: 'materialUnit' },
    { title: '账面数量', key: 'quantity' },
    { title: '货主', dataIndex: 'ownerType' },
    { title: '锁定数量', key: 'reservedQty' },
    { title: '冻结数量', key: 'frozenQty' },
  ];

  assert.deepEqual(visibleTitles(prioritizeMaterialDetailColumns(columns)), [
    '物料名称', '物料编码', '规格型号', '单位', '账面数量', '仓库',
    '物料·颜色', '缩略图', '货主', '锁定数量', '冻结数量',
  ]);
});

test('hidden search columns keep their declared position without affecting visible column priority', () => {
  const columns = [
    { title: '库存范围', dataIndex: 'scope', hideInTable: true },
    { title: '仓库', dataIndex: 'warehouseName' },
    { title: '物料名称', key: 'materialName' },
    { title: '物料编码', key: 'materialCode' },
    { title: '数量', key: 'qty' },
  ];
  const result = prioritizeMaterialDetailColumns(columns);

  assert.equal(result[0], columns[0]);
  assert.deepEqual(visibleTitles(result), ['物料名称', '物料编码', '数量', '仓库']);
});

test('an explicit primary quantity wins over secondary stock quantities', () => {
  const columns = [
    { title: '物料名称', key: 'materialName' },
    { title: '可用数量', key: 'availableQty' },
    { title: '来源单', key: 'sourceNo' },
    { title: '需求数量', key: 'requiredQty' },
    { title: '物料编码', key: 'materialCode' },
    { title: '单位', key: 'unit' },
  ];

  assert.deepEqual(
    visibleTitles(
      prioritizeMaterialDetailColumns(columns, {
        primaryQuantityKeys: ['requiredQty'],
      }),
    ),
    ['物料名称', '物料编码', '单位', '需求数量', '可用数量', '来源单'],
  );
});

test('preserve mode retains a task-specific declared column order', () => {
  const columns = [
    { title: '异常状态', key: 'status' },
    { title: '物料名称', key: 'materialName' },
    { title: '物料编码', key: 'materialCode' },
    { title: '数量', key: 'qty' },
  ];

  assert.deepEqual(prioritizeMaterialDetailColumns(columns, 'preserve'), columns);
});

test('injected row index stays first and an ordinary business line number stays with auxiliary fields', () => {
  const injected = [
    { title: '行号', key: 'rowIndex', hideInSetting: true },
    { title: '物料编码', key: 'materialCode' },
    { title: '规格', key: 'materialSpec' },
    { title: '单位', key: 'unit' },
    { title: '数量', key: 'quantity' },
  ];
  const business = [
    { title: '行号', dataIndex: 'lineNo' },
    { title: '物料编码', key: 'materialCode' },
    { title: '规格', key: 'materialSpec' },
    { title: '单位', key: 'unit' },
    { title: '数量', key: 'quantity' },
  ];

  assert.deepEqual(visibleTitles(prioritizeMaterialDetailColumns(injected)), [
    '行号', '物料编码', '规格', '单位', '数量',
  ]);
  assert.deepEqual(visibleTitles(prioritizeMaterialDetailColumns(business)), [
    '物料编码', '规格', '单位', '数量', '行号',
  ]);
});

test('action columns follow business and auxiliary columns', () => {
  const columns = [
    { title: '', key: 'actions', dataIndex: '__actions', valueType: 'option' },
    { title: '物料名称', key: 'materialName' },
    { title: '物料编码', key: 'materialCode' },
    { title: '规格', key: 'materialSpec' },
    { title: '用量', key: 'quantity' },
    { title: '单位', key: 'unit' },
    { title: '物料·颜色', key: 'material-custom-color' },
    { title: '备注', dataIndex: 'remark' },
  ];

  assert.deepEqual(visibleTitles(prioritizeMaterialDetailColumns(columns)), [
    '物料名称', '物料编码', '规格', '单位', '用量', '物料·颜色', '备注', '',
  ]);
  assert.deepEqual(
    visibleTitles(
      prioritizeMaterialDetailColumns([
        { title: '操作', key: 'tableActions' },
        { title: '物料编码', key: 'materialCode' },
        { title: '规格', key: 'materialSpec' },
        { title: '数量', key: 'quantity' },
        { title: '备注', dataIndex: 'remark' },
      ]),
    ),
    ['物料编码', '规格', '数量', '备注', '操作'],
  );
});

test('non-material tables and disabled prioritization keep declared order', () => {
  const columns = [
    { title: '客户名称', key: 'customerName' },
    { title: '状态', key: 'status' },
    { title: '数量', key: 'qty' },
  ];

  assert.deepEqual(prioritizeMaterialDetailColumns(columns), columns);
  assert.deepEqual(prioritizeMaterialDetailColumns(columns, false), columns);
});

test('landed cost preview allocates proportional estimates and preserves the server as authority', () => {
  const allocations = [
    {
      receiptItemId: 'receipt-item-1',
      receiptOrderId: 'receipt-1',
      display: '采购入库单 1 / 物料 A',
      previewBases: { amount: 20, quantity: 1 },
    },
    {
      receiptItemId: 'receipt-item-2',
      receiptOrderId: 'receipt-1',
      display: '采购入库单 1 / 物料 B',
      previewBases: { amount: 60, quantity: 3 },
    },
  ];

  assert.deepEqual(landedCostPreview(allocations, 'quantity', 90), {
    allocationBasis: 'quantity',
    capitalizableAmount: 90,
    totalBase: 4,
    allocatedAmount: 90,
    pendingAmount: 0,
    lines: [
      {
        receiptItemId: 'receipt-item-1',
        display: '采购入库单 1 / 物料 A',
        allocationBase: 1,
        estimatedAllocationAmount: 22.5,
      },
      {
        receiptItemId: 'receipt-item-2',
        display: '采购入库单 1 / 物料 B',
        allocationBase: 3,
        estimatedAllocationAmount: 67.5,
      },
    ],
  });
  assert.equal(landedCostPreview(allocations, undefined, 90), undefined);
});

test('manual landed cost preview reports assigned and pending amounts', () => {
  const preview = landedCostPreview(
    [
      { receiptItemId: '1', receiptOrderId: 'r', display: 'A', allocationAmount: 60 },
      { receiptItemId: '2', receiptOrderId: 'r', display: 'B', allocationAmount: 25 },
    ],
    'manual',
    100,
  );

  assert.equal(preview.allocatedAmount, 85);
  assert.equal(preview.pendingAmount, 15);
  assert.deepEqual(preview.lines.map((line) => line.manualAllocationAmount), [60, 25]);
});

test('receipt defaults and submitted rows use server receivable quantity and actual arrived or rejected quantities', () => {
  assert.equal(receiptLogic.getDefaultReceiptQuantity(100), 100);
  assert.equal(receiptLogic.getDefaultReceiptQuantity(Number.NaN), 0);
  const items = [
    { id: 'received', arrivalReceiptQty: 12, rejectedReceiptQty: 0 },
    { id: 'rejected', arrivalReceiptQty: 0, rejectedReceiptQty: 2 },
    { id: 'not-delivered', arrivalReceiptQty: 0, rejectedReceiptQty: 0 },
  ];
  assert.deepEqual(receiptLogic.selectSubmittedReceiptItems(items), items.slice(0, 2));
});

test('receipt split capacity sums only actual arrivals for the same source line', () => {
  assert.equal(
    receiptLogic.getReceiptSourceAllocation(
      [
        { purchaseOrderItemId: 'line-1', arrivalReceiptQty: 3, rejectedReceiptQty: 1 },
        { purchaseOrderItemId: 'line-1', arrivalReceiptQty: 2, rejectedReceiptQty: 0 },
        { purchaseOrderItemId: 'line-2', arrivalReceiptQty: 9, rejectedReceiptQty: 0 },
      ],
      'line-1',
    ),
    5,
  );
});

test('receipt validation requires batches, shelf-life dates, warehouse and reject reasons only when applicable', () => {
  const base = {
    purchaseOrderItemId: 'line-1',
    arrivalReceiptQty: 1,
    rejectedReceiptQty: 0,
    maxQuantity: 10,
    warehouseId: 'warehouse-1',
  };
  assert.equal(
    receiptLogic.findInvalidReceiptItem([
      { ...base, requiresBatchNo: true, requiresShelfLifeDate: true },
    ]).reason,
    'batch_required',
  );
  assert.equal(
    receiptLogic.findInvalidReceiptItem([
      { ...base, requiresBatchNo: true, requiresShelfLifeDate: true, batchNo: 'BN-001' },
    ]).reason,
    'batch_date_required',
  );
  assert.equal(
    receiptLogic.findInvalidReceiptItem([
      {
        ...base,
        requiresBatchNo: true,
        requiresShelfLifeDate: true,
        batchNo: 'BN-001',
        productionDate: '2026-10-01',
      },
    ]),
    undefined,
  );
  assert.equal(
    receiptLogic.findInvalidReceiptItem([
      { purchaseOrderItemId: 'line-1', arrivalReceiptQty: 1, rejectedReceiptQty: 0 },
    ]).reason,
    'warehouse_required',
  );
  assert.equal(
    receiptLogic.findInvalidReceiptItem([
      {
        purchaseOrderItemId: 'line-1',
        arrivalReceiptQty: 1,
        rejectedReceiptQty: 1,
        rejectReason: '外观破损',
      },
    ]),
    undefined,
  );
  assert.equal(
    receiptLogic.findInvalidReceiptItem([
      { purchaseOrderItemId: 'line-1', arrivalReceiptQty: 1, rejectedReceiptQty: 0, incomingInspectionRequired: true },
    ]),
    undefined,
  );
});

test('receipt validation blocks invalid quantities, over-rejection, missing reasons and split capacity overflow', () => {
  const invalid = receiptLogic.findInvalidReceiptItem([
    { purchaseOrderItemId: 'line-1', arrivalReceiptQty: Number.NaN, rejectedReceiptQty: 0 },
  ]);
  assert.equal(invalid.reason, 'invalid_quantity');

  const overRejected = receiptLogic.findInvalidReceiptItem([
    { purchaseOrderItemId: 'line-1', arrivalReceiptQty: 3, rejectedReceiptQty: 4, maxQuantity: 10 },
  ]);
  assert.equal(overRejected.reason, 'rejected_quantity_exceeds_arrival');

  const missingReason = receiptLogic.findInvalidReceiptItem([
    { purchaseOrderItemId: 'line-1', arrivalReceiptQty: 1, rejectedReceiptQty: 1 },
  ]);
  assert.equal(missingReason.reason, 'reject_reason_required');

  const overflow = receiptLogic.findInvalidReceiptItem([
    { purchaseOrderItemId: 'line-1', arrivalReceiptQty: 6, rejectedReceiptQty: 0, warehouseId: 'w', maxQuantity: 10 },
    { purchaseOrderItemId: 'line-1', arrivalReceiptQty: 5, rejectedReceiptQty: 2, warehouseId: 'w', maxQuantity: 10, rejectReason: '包装破损' },
  ]);
  assert.equal(overflow.reason, 'source_capacity_exceeded');
});

test('accepted receipt quantity is derived only without incoming inspection', () => {
  assert.equal(
    receiptLogic.getAcceptedReceiptQuantity({ arrivalReceiptQty: 10, rejectedReceiptQty: 2 }),
    8,
  );
  assert.equal(
    receiptLogic.getAcceptedReceiptQuantity({
      arrivalReceiptQty: 10,
      rejectedReceiptQty: 2,
      incomingInspectionRequired: true,
    }),
    undefined,
  );
});
