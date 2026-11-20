import { Space } from 'antd';
import React, { type ReactNode } from 'react';
import { DocumentKeywordSearch } from './DocumentKeywordSearch';

export interface DocumentTableTitleProps {
  title: ReactNode;
  keyword?: string;
  keywordPlaceholder?: string;
  keywordLoading?: boolean;
  onKeywordSearch: (value: string) => void;
}

/**
 * @sunxu-reason Keeps the MES table title and temporary keyword entry together in the result heading.
 * Field filters retain their own host-owned entry point.
 */
export function DocumentTableTitle({
  title,
  keyword,
  keywordPlaceholder,
  keywordLoading = false,
  onKeywordSearch,
}: DocumentTableTitleProps) {
  return (
    <Space align="center" size={12} wrap>
      <span>{title}</span>
      <DocumentKeywordSearch
        value={keyword}
        placeholder={keywordPlaceholder}
        loading={keywordLoading}
        onSearch={onKeywordSearch}
      />
    </Space>
  );
}
