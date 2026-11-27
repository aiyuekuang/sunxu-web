import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const componentSource = readFileSync(
  'src/business/domains/manufacturing/ProductionShiftCalendarComponents.tsx',
  'utf8',
);
const typesSource = readFileSync(
  'src/business/domains/manufacturing/production-shift-calendar-types.ts',
  'utf8',
);
const exceptionRecordSource = typesSource.slice(
  typesSource.indexOf('export interface CalendarExceptionRecord {'),
  typesSource.indexOf('\n}\n', typesSource.indexOf('export interface CalendarExceptionRecord {')),
);

test('calendar exceptions expose active state and accept partial status updates', () => {
  assert.match(exceptionRecordSource, /isActive\?: boolean \| null;/);
  assert.match(
    typesSource,
    /export type CalendarExceptionUpdatePayload =\s*Partial<CalendarExceptionUpsertPayload> & \{ isActive\?: boolean \};/,
  );
  assert.match(
    typesSource,
    /updateCalendarException: \(id: string, payload: CalendarExceptionUpdatePayload\)/,
  );
});

test('status action is permission-gated, confirmed, and writes only isActive', () => {
  const handlerStart = componentSource.indexOf('  const handleToggleActive = async (record: CalendarExceptionRecord) => {');
  const handlerEnd = componentSource.indexOf('\n  const columns = useMemo', handlerStart);
  const handler = componentSource.slice(handlerStart, handlerEnd);
  const statusColumnStart = componentSource.indexOf("      title: '状态', dataIndex: 'isActive'");
  const statusColumnEnd = componentSource.indexOf("    { title: '班次'", statusColumnStart);
  const statusColumn = componentSource.slice(statusColumnStart, statusColumnEnd);

  assert.notEqual(handlerStart, -1, 'status update handler exists');
  assert.notEqual(statusColumnStart, -1, 'status column exists');
  assert.match(handler, /const isActive = record\.isActive === false;/);
  assert.match(handler, /updateCalendarException\(record\.id, \{ isActive \}\)/);
  assert.doesNotMatch(handler, /startDate:|endDate:|type:/);
  assert.match(handler, /catch \(error\)/);
  assert.match(handler, /actionRef\.current\?\.reload\(\)/);
  assert.match(statusColumn, /const isActive = record\.isActive !== false;/);
  assert.match(statusColumn, /can\.edit \? \(/);
  assert.match(statusColumn, /<Popconfirm/);
  assert.match(statusColumn, /onConfirm=\{\(\) => handleToggleActive\(record\)\}/);
  assert.match(statusColumn, /aria-label=\{`\$\{action\} \$\{date\} \$\{typeLabel\}例外`\}/);
});
