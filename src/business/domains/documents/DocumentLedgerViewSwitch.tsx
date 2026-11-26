import { createDocumentViewSwitch } from './DocumentViewSwitch';

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Shares document and read-only ledger view switching with a stable accessible name while the host owns selected view state.
 */
export const DocumentLedgerViewSwitch = createDocumentViewSwitch({
  ariaLabel: '单据与明细视图切换',
});
