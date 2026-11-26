import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const testUiDependencies = {
  name: 'document-line-custom-field-test-ui-dependencies',
  enforce: 'pre',
  resolveId(source, importer) {
    if (source === 'antd') return '\0document-line-custom-field-test-antd';
    if (
      source === './CustomFieldCell' &&
      importer?.endsWith('/documentLineCustomFieldColumns.tsx')
    ) {
      return '\0document-line-custom-field-test-custom-field-cell';
    }
    return null;
  },
  load(id) {
    if (id === '\0document-line-custom-field-test-antd') {
      return `
        export const DatePicker = () => null;
        export const Input = Object.assign(() => null, { TextArea: () => null });
        export const InputNumber = () => null;
        export const Select = () => null;
        export const Switch = () => null;
      `;
    }
    if (id === '\0document-line-custom-field-test-custom-field-cell') {
      return `
        export function renderCustomFieldCell(field, source) {
          const value = source.computedValues?.[field.fieldKey] ?? source.rawValues?.[field.fieldKey];
          return value == null ? '-' : String(value);
        }
      `;
    }
    return null;
  },
};

const vite = await createServer({
  configFile: false,
  root: process.cwd(),
  appType: 'custom',
  server: { middlewareMode: true },
  plugins: [testUiDependencies],
});

const {
  applyDocumentLineCustomFieldRuntimePreview,
  buildDocumentLineCustomFieldRuntimePreviewItems,
  buildDocumentLineCustomValuePayload,
  createDocumentLineCustomFieldColumnsForAntd,
  createDocumentLineCustomFieldLineColumns,
  getVisibleDocumentLineCustomFields,
  resolveDocumentLineCustomFieldWidth,
  summarizeDocumentLineCustomFields,
} = await vite.ssrLoadModule(
  '/src/business/domains/documents/documentLineCustomFieldColumns.tsx',
);

after(async () => {
  await vite.close();
});

function makeField(fieldKey, displayJson, overrides = {}) {
  return {
    fieldKey,
    label: fieldKey,
    dataType: 'text',
    fieldKind: 'input',
    requiredPolicy: 'none',
    displayJson,
    optionsJson: {},
    sortOrder: 0,
    isActive: true,
    ...overrides,
  };
}

function makeSchema(fields) {
  return {
    schemaVersion: 7,
    systemFields: [{ key: 'quantity', label: '数量', dataType: 'decimal' }],
    fields,
  };
}

test('filters active visible fields and sorts them by display sort order', () => {
  const fields = getVisibleDocumentLineCustomFields(
    makeSchema([
      makeField('late', { showInDetail: true, sortOrder: 20 }),
      makeField('hidden', { showInDetail: false }, { sortOrder: 5 }),
      makeField('inactive', { showInDetail: true }, { isActive: false }),
      makeField('early', { showInDetail: true, sortOrder: 10 }),
    ]),
    'showInDetail',
  );
  assert.deepEqual(fields.map((field) => field.fieldKey), ['early', 'late']);
});

test('builds schema-versioned payloads and preserves hidden input values', () => {
  const payload = buildDocumentLineCustomValuePayload(
    {
      _key: 'row-1',
      customValues: {
        visible: '已填',
        hiddenInput: '保留',
        formulaValue: '不回传',
        staleValue: '不回传',
      },
    },
    makeSchema([
      makeField('visible', { showInForm: true }),
      makeField('blankVisible', { showInForm: true }),
      makeField('hiddenInput', { showInForm: false }),
      makeField('formulaValue', { showInForm: true }, { fieldKind: 'formula' }),
    ]),
  );
  assert.deepEqual(payload, {
    customFieldSchemaVersion: 7,
    customValues: { visible: '已填', hiddenInput: '保留' },
  });
});

test('omits blank downstream values while preserving an explicit clear', () => {
  const schema = makeSchema([
    makeField('mappedField', { showInForm: true }),
    makeField('manualField', { showInForm: true }),
  ]);
  assert.deepEqual(
    buildDocumentLineCustomValuePayload({ _key: 'new-row' }, schema),
    { customFieldSchemaVersion: 7, customValues: {} },
  );
  assert.deepEqual(
    buildDocumentLineCustomValuePayload(
      { _key: 'existing-row', customValues: { mappedField: null } },
      schema,
    ),
    { customFieldSchemaVersion: 7, customValues: { mappedField: null } },
  );
});

test('creates plain Ant Design columns without ProTable-only search or sort keys', () => {
  const columns = createDocumentLineCustomFieldColumnsForAntd(
    makeSchema([
      makeField('visible', { showInDetail: true, sortOrder: 10 }),
      makeField('hidden', { showInDetail: false }, { sortOrder: 5 }),
    ]),
    { displayKey: 'showInDetail', prefixTitle: '明细' },
  );
  assert.equal(columns.length, 1);
  assert.deepEqual(
    {
      title: columns[0].title,
      key: columns[0].key,
      width: columns[0].width,
      ellipsis: columns[0].ellipsis,
    },
    {
      title: '明细·visible',
      key: 'line-custom-visible',
      width: 140,
      ellipsis: true,
    },
  );
  assert.equal('search' in columns[0], false);
  assert.equal('sorter' in columns[0], false);
});

test('uses configured narrow custom-field widths', () => {
  assert.equal(
    resolveDocumentLineCustomFieldWidth(
      makeField('packageNo', { listWidth: 25 }),
    ),
    25,
  );
});

test('renders formula columns readonly and excludes formulas from payloads', () => {
  const schema = makeSchema([
    makeField('cf_a', { showInForm: true }, { label: 'A' }),
    makeField(
      'cf_c',
      { showInForm: true },
      { label: 'C', dataType: 'decimal', fieldKind: 'formula' },
    ),
  ]);
  const columns = createDocumentLineCustomFieldLineColumns(schema);
  const update = () => assert.fail('formula render must not update the row');
  const formulaColumn = columns.find(
    (column) => column.key === 'line-custom-cf_c',
  );
  const formulaCell = formulaColumn?.render(
    {
      _key: 'row-1',
      customValues: { cf_a: 2 },
      customComputedValues: { cf_c: 5 },
      customComputedErrors: {},
    },
    0,
    update,
  );
  assert.deepEqual(
    columns.map((column) => column.key),
    ['line-custom-cf_a', 'line-custom-cf_c'],
  );
  assert.equal(formulaCell, '5');
  assert.deepEqual(
    buildDocumentLineCustomValuePayload(
      {
        _key: 'row-1',
        customValues: { cf_a: 2, cf_c: 5 },
      },
      schema,
    ),
    { customFieldSchemaVersion: 7, customValues: { cf_a: 2 } },
  );
});

test('projects quantity from qty and applies runtime values by row order', () => {
  const rows = [
    {
      _key: 'row-1',
      qty: 4,
      customValues: { cf_a: 2, cf_b: 3 },
      customComputedValues: { cf_c: 0 },
      customComputedErrors: { cf_c: '旧错误' },
    },
    {
      _key: 'row-2',
      quantity: 9,
      customValues: { cf_a: 8 },
      customComputedValues: { cf_c: 1 },
      customComputedErrors: {},
    },
  ];
  assert.deepEqual(
    buildDocumentLineCustomFieldRuntimePreviewItems(rows, makeSchema([])),
    [
      { quantity: 4, customValues: { cf_a: 2, cf_b: 3 } },
      { quantity: 9, customValues: { cf_a: 8 } },
    ],
  );
  assert.deepEqual(
    applyDocumentLineCustomFieldRuntimePreview(rows, [
      { customComputedValues: { cf_c: 5 }, customComputedErrors: {} },
      { customComputedValues: { cf_c: 11 }, customComputedErrors: {} },
    ]),
    [
      {
        _key: 'row-1',
        qty: 4,
        customValues: { cf_a: 2, cf_b: 3 },
        customComputedValues: { cf_c: 5 },
        customComputedErrors: {},
      },
      {
        _key: 'row-2',
        quantity: 9,
        customValues: { cf_a: 8 },
        customComputedValues: { cf_c: 11 },
        customComputedErrors: {},
      },
    ],
  );
});

test('builds dense runtime preview items for sparse and invalid draft rows', () => {
  const rows = new Array(2);
  rows[1] = null;
  assert.deepEqual(
    buildDocumentLineCustomFieldRuntimePreviewItems(rows, makeSchema([])),
    [{ customValues: {} }, { customValues: {} }],
  );
});

test('returns null for invalid aggregate values instead of treating them as zero', () => {
  const schema = makeSchema([
    makeField('cf_weight', { aggregateMode: 'sum' }, { dataType: 'decimal' }),
    makeField(
      'cf_score',
      { aggregateMode: 'avg' },
      { dataType: 'decimal', fieldKind: 'formula' },
    ),
    makeField('cf_note', { aggregateMode: 'count_non_empty' }),
  ]);
  assert.deepEqual(
    summarizeDocumentLineCustomFields(
      [
        {
          customValues: { cf_weight: 2, cf_note: 'A' },
          customComputedValues: { cf_score: 6 },
        },
        {
          customValues: { cf_weight: 3, cf_note: '' },
          customComputedValues: { cf_score: 10 },
        },
      ],
      schema,
    ),
    [
      { fieldKey: 'cf_weight', label: 'cf_weight', mode: 'sum', value: 5 },
      { fieldKey: 'cf_score', label: 'cf_score', mode: 'avg', value: 8 },
      {
        fieldKey: 'cf_note',
        label: 'cf_note',
        mode: 'count_non_empty',
        value: 1,
      },
    ],
  );
  const invalidSummary = summarizeDocumentLineCustomFields(
    [{ customValues: { cf_weight: 'invalid' } }],
    schema,
  );
  assert.equal(invalidSummary[0].value, null);
});
