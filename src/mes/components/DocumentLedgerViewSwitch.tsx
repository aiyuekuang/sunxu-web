import { createDocumentViewSwitch } from './DocumentViewSwitch';

/** Shared switch for a document list and its read-only detail ledger. */
export const DocumentLedgerViewSwitch = createDocumentViewSwitch({
  ariaLabel: '单据与明细视图切换',
});
