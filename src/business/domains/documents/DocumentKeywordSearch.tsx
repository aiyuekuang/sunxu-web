import { useEffect, useState } from 'react';
import { ListKeywordSearch } from '../../../components/ListKeywordSearch';
import type { ListKeywordSearchMode } from '../../../components/ListKeywordSearch';

export type DocumentKeywordSearchMode = ListKeywordSearchMode;

export interface DocumentKeywordSearchProps {
  value?: string;
  placeholder?: string;
  loading?: boolean;
  /** Defaults to expanded; use collapsible when toolbar width is limited. */
  mode?: DocumentKeywordSearchMode;
  onSearch: (value: string) => void;
}

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Preserves document-list search wording and draft behavior while reusing the shared keyword presentation.
 * The host owns the applied query, data request, and saved-view state.
 */
export function DocumentKeywordSearch({
  value = '',
  placeholder = '输入单号、客户、供应商或物料搜索',
  loading = false,
  mode = 'expanded',
  onSearch,
}: DocumentKeywordSearchProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className="sxw-document-keyword-search">
      <ListKeywordSearch
        ariaLabel="关键字搜索"
        hasCommittedQuery={Boolean(value.trim())}
        loading={loading}
        mode={mode}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraft(nextValue);
          if (!nextValue) onSearch('');
        }}
        onSearch={(nextValue, _event, info) => {
          if (info?.source !== 'clear') onSearch(nextValue.trim());
        }}
      />
    </div>
  );
}
