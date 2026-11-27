import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, type InputRef } from 'antd';
import { useEffect, useId, useRef, useState } from 'react';

export type DocumentKeywordSearchMode = 'expanded' | 'collapsible';

export interface DocumentKeywordSearchProps {
  value?: string;
  placeholder?: string;
  loading?: boolean;
  /** Defaults to expanded; use collapsible when toolbar width is limited. */
  mode?: DocumentKeywordSearchMode;
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
  mode = 'expanded',
  onSearch,
}: DocumentKeywordSearchProps) {
  const [draft, setDraft] = useState(value);
  const [isOpen, setIsOpen] = useState(
    mode === 'expanded' || Boolean(value.trim()),
  );
  const searchId = useId();
  const inputRef = useRef<InputRef>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const shouldFocusInputRef = useRef(false);
  const shouldReturnFocusRef = useRef(false);
  const hasCommittedQuery = Boolean(value.trim());

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (mode === 'expanded') {
      setIsOpen(true);
      return;
    }

    if (hasCommittedQuery) setIsOpen(true);
  }, [hasCommittedQuery, mode]);

  useEffect(() => {
    if (mode !== 'collapsible') return;

    if (isOpen && shouldFocusInputRef.current) {
      inputRef.current?.focus({ cursor: 'end' });
      shouldFocusInputRef.current = false;
    }

    if (!isOpen && shouldReturnFocusRef.current) {
      toggleRef.current?.focus();
      shouldReturnFocusRef.current = false;
    }
  }, [isOpen, mode]);

  const handleChange = (nextValue: string) => {
    setDraft(nextValue);
    if (!nextValue) onSearch('');
  };

  return (
    <div
      className="sxw-document-keyword-search"
      style={{
        alignItems: 'center',
        display: 'inline-flex',
        maxWidth: '100%',
      }}
    >
      {mode === 'collapsible' && !isOpen ? (
        <Button
          ref={toggleRef}
          aria-controls={searchId}
          aria-expanded={false}
          aria-label="展开关键词搜索"
          htmlType="button"
          icon={<SearchOutlined aria-hidden="true" />}
          shape="circle"
          title="展开关键词搜索"
          type="text"
          onClick={() => {
            shouldFocusInputRef.current = true;
            setIsOpen(true);
          }}
        />
      ) : null}
      <div
        id={searchId}
        hidden={mode === 'collapsible' && !isOpen}
        style={{
          alignItems: 'center',
          display: 'inline-flex',
          gap: 4,
          maxWidth: '100%',
          minWidth: 0,
          ...(mode === 'collapsible' && !isOpen ? { display: 'none' } : {}),
        }}
      >
        <Input.Search
          ref={inputRef}
          aria-label="关键字搜索"
          allowClear
          loading={loading}
          placeholder={placeholder}
          value={draft}
          style={{
            maxWidth: '100%',
            width: 'clamp(160px, 20vw, 256px)',
          }}
          onChange={(event) => handleChange(event.target.value)}
          onSearch={(nextValue) => onSearch(nextValue.trim())}
        />
        {mode === 'collapsible' && isOpen && !hasCommittedQuery ? (
          <Button
            aria-controls={searchId}
            aria-expanded={true}
            aria-label="收起关键词搜索"
            htmlType="button"
            icon={<CloseOutlined aria-hidden="true" />}
            shape="circle"
            title="收起关键词搜索"
            type="text"
            onClick={() => {
              if (hasCommittedQuery) return;
              setDraft(value);
              shouldReturnFocusRef.current = true;
              setIsOpen(false);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
