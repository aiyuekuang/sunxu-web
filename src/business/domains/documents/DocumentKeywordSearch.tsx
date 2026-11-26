import { Input } from 'antd';
import React, { useEffect, useState } from 'react';

export interface DocumentKeywordSearchProps {
  value?: string;
  placeholder?: string;
  loading?: boolean;
  onSearch: (value: string) => void;
}

/**
 * @sunxu-reason Keeps host list keyword drafts temporary while preserving its clear and submit behavior.
 * The host owns query execution and any saved-view or filter state.
 */
/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Presents reusable document keyword search behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function DocumentKeywordSearch({
  value = '',
  placeholder = '输入单号、客户、供应商或物料搜索',
  loading = false,
  onSearch,
}: DocumentKeywordSearchProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleChange = (nextValue: string) => {
    setDraft(nextValue);
    if (!nextValue) onSearch('');
  };

  return (
    <Input.Search
      aria-label="关键字搜索"
      allowClear
      loading={loading}
      placeholder={placeholder}
      value={draft}
      style={{ width: 'clamp(160px, 20vw, 256px)' }}
      onChange={(event) => handleChange(event.target.value)}
      onSearch={(nextValue) => onSearch(nextValue.trim())}
    />
  );
}
