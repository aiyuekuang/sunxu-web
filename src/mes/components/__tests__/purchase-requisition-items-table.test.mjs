import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite;
let PurchaseRequisitionItemsTable;

before(async () => {
  vite = await createServer({
    configFile: 'vite.lib.config.ts',
    ssr: { noExternal: ['@ant-design/pro-components'] },
    server: { middlewareMode: true },
    appType: 'custom',
  });
  const component = await vite.ssrLoadModule(
    '/src/mes/components/PurchaseRequisitionItemsTable.tsx',
  );
  PurchaseRequisitionItemsTable = component.PurchaseRequisitionItemsTable;
});

after(async () => {
  await vite?.close();
});

const formatters = {
  formatUnit: (unit) => `单位:${unit ?? '无'}`,
  formatQty: (value) => `数量:${value ?? 0}`,
  formatDate: (value) => `日期:${value ?? '无'}`,
};

function render(items) {
  return renderToStaticMarkup(
    React.createElement(PurchaseRequisitionItemsTable, { items, formatters }),
  );
}

test('expanded requisition item columns put material identity and quantities first', () => {
  const html = render([
    {
      id: 'line-1',
      lineNo: 7,
      requiredQty: 12,
      orderedQty: 2,
      material: { name: '铝合金支架', code: 'AL-001', spec: '6061', unit: '件' },
      supplier: { name: '示例供应商' },
      suggestedPurchaseDate: '2026-11-24',
      expectedArrivalDate: '2026-12-01',
      remarks: '行备注',
      createdAt: '2026-11-20',
      updatedAt: '2026-11-21',
    },
  ]);

  const headings = [
    '物料名称',
    '物料编码',
    '规格',
    '单位',
    '需求数量',
    '已下单',
    '剩余可转',
    '建议供应商',
    '建议采购日期',
    '期望到货日期',
    '行号',
    '行备注',
    '创建日期',
    '更新日期',
  ];
  const headingOffsets = headings.map((heading) => html.indexOf(heading));

  assert.ok(headingOffsets.every((offset) => offset >= 0));
  assert.deepEqual(headingOffsets, [...headingOffsets].sort((a, b) => a - b));
  assert.match(html, /mes-expanded-detail-table/);
  assert.match(html, /AL-001/);
  assert.match(html, /单位:件/);
  assert.match(html, /数量:12/);
  assert.match(html, /数量:2/);
  assert.match(html, /数量:10/);
  assert.match(html, /日期:2026-11-24/);
  assert.match(html, /日期:2026-12-01/);
  assert.match(html, />7</);
});

test('missing arrival dates are surfaced and remaining quantity derives from required minus ordered', () => {
  const html = render([
    {
      id: 'line-missing-arrival',
      sortOrder: 3,
      requiredQty: '8',
      orderedQty: '5',
      material: { name: '缺少日期的物料' },
    },
  ]);

  assert.match(html, /未填写/);
  assert.match(html, /数量:3/);
  assert.match(html, />4</);
});
