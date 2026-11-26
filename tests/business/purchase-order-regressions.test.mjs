import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const editableTableSource = readFileSync(
  'src/business/domains/documents/DocumentLineEditableTable.tsx',
  'utf8',
);
const purchaseOrderLedgerSource = readFileSync(
  'src/business/domains/procurement/PurchaseOrderDetailLedger.tsx',
  'utf8',
);

test('document line row actions commit against the latest rows snapshot', () => {
  assert.match(editableTableSource, /const rowsRef = useRef\(rows\);/);
  assert.match(editableTableSource, /const commitRows = useCallback\(/);

  const rowMutations = editableTableSource.slice(
    editableTableSource.indexOf('  const addRow = useCallback('),
    editableTableSource.indexOf('  const rowSelection = useMemo'),
  );

  for (const action of [
    'const addRow = useCallback(',
    'const insertAfter = useCallback(',
    'const copyAfter = useCallback(',
    'const removeRow = useCallback(',
    'const copySelectedRows = useCallback(',
    'const removeSelectedRows = useCallback(',
    'const applyBatchPatches = useCallback(',
  ]) {
    const actionStart = rowMutations.indexOf(action);
    assert.notEqual(actionStart, -1, `${action} exists`);
    const nextActionStart = rowMutations.indexOf('\n  const ', actionStart + 1);
    const actionSource = rowMutations.slice(
      actionStart,
      nextActionStart < 0 ? undefined : nextActionStart,
    );
    assert.match(actionSource, /commitRows\(/, `${action} uses the latest-row commit path`);
    assert.doesNotMatch(actionSource, /onRowsChange\(/, `${action} does not submit a captured rows array`);
  }

  assert.match(rowMutations, /currentRows\.findIndex\(\(row\) => row\._key === rowKey\)/);
});

test('purchase order detail menu is marked as a complete host action menu', () => {
  assert.match(
    purchaseOrderLedgerSource,
    /markCompleteActionMenuColumn<PurchaseOrderDetailLedgerRow>\(\{\s*title: '更多操作'/,
  );
  assert.match(purchaseOrderLedgerSource, /capabilities\.renderDocumentActions\(row, \{/);
});
