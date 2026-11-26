import React, { type ReactNode } from 'react';
import { DocumentKeywordSearch } from './DocumentKeywordSearch';

export interface DocumentTableTitleProps {
  /** @deprecated Query scope belongs in the search placeholder. This compatibility prop is ignored. */
  title: ReactNode;
  keyword?: string;
  keywordPlaceholder?: string;
  keywordLoading?: boolean;
  onKeywordSearch: (value: string) => void;
}

/**
 * @deprecated Use DocumentKeywordSearch directly. A visible title beside a
 * cross-field keyword search duplicates the current route and wastes toolbar space.
 * @sunxu-reason Backwards-compatible adapter for older host consumers.
 */
/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Presents reusable document table title behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function DocumentTableTitle({
  keyword,
  keywordPlaceholder,
  keywordLoading = false,
  onKeywordSearch,
}: DocumentTableTitleProps) {
  return (
    <DocumentKeywordSearch
      value={keyword}
      placeholder={keywordPlaceholder}
      loading={keywordLoading}
      onSearch={onKeywordSearch}
    />
  );
}
