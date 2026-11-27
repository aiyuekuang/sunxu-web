import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import type { InputRef } from 'antd';
import type { SearchProps } from 'antd/es/input';
import { useId, useLayoutEffect, useRef, useState } from 'react';

export type ListKeywordSearchMode = 'expanded' | 'collapsible';

type ListKeywordSearchBaseProps = Omit<
  SearchProps,
  | 'allowClear'
  | 'className'
  | 'classNames'
  | 'defaultValue'
  | 'enterButton'
  | 'hidden'
  | 'mode'
  | 'onChange'
  | 'onSearch'
  | 'rootClassName'
  | 'searchIcon'
  | 'style'
  | 'styles'
  | 'value'
> & {
  /** Accessible name for both the search landmark and the input. */
  ariaLabel: string;
  /** Defaults to expanded. Collapse only when the containing toolbar is constrained. */
  mode?: ListKeywordSearchMode;
  /** Whether the host has applied a keyword; independent from the input draft. */
  hasCommittedQuery?: boolean;
  /** Required host callback for Enter, the search button, and clear. */
  onSearch: NonNullable<SearchProps['onSearch']>;
  /** Notifies the host when the compact entry opens or closes. */
  onExpandedChange?: (expanded: boolean) => void;
};

export type ListKeywordSearchControlledProps = {
  /** The host-owned input draft. */
  value: string;
  /** Updates the host-owned input draft. */
  onChange: NonNullable<SearchProps['onChange']>;
};

/** A named Ant Design Form.Item injects the same controlled value and handler. */
type ListKeywordSearchFormInjectedProps = {
  value?: undefined;
  onChange?: undefined;
};

export type ListKeywordSearchProps = ListKeywordSearchBaseProps &
  (ListKeywordSearchControlledProps | ListKeywordSearchFormInjectedProps);

/**
 * @sunxu-layer atomic
 * @sunxu-page list
 * @sunxu-use filters
 * @sunxu-reason Unifies one temporary keyword query while the host owns its draft, applied query, and data request.
 */
export function ListKeywordSearch({
  ariaLabel,
  mode = 'expanded',
  hasCommittedQuery = false,
  value,
  onChange,
  onSearch,
  onExpandedChange,
  ...searchProps
}: ListKeywordSearchProps) {
  const [open, setOpen] = useState(mode === 'expanded' || hasCommittedQuery);
  const inputRef = useRef<InputRef>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pendingFocusRef = useRef<'input' | 'toggle' | null>(null);
  const previousModeRef = useRef(mode);
  const searchId = `sxw-list-keyword-search-${useId().replaceAll(':', '')}`;
  const isExpanded = mode === 'expanded' || hasCommittedQuery || open;

  useLayoutEffect(() => {
    if (mode !== previousModeRef.current) {
      previousModeRef.current = mode;
      setOpen(mode === 'expanded' || hasCommittedQuery);
      return;
    }

    if (mode === 'expanded' || hasCommittedQuery) setOpen(true);
  }, [hasCommittedQuery, mode]);

  useLayoutEffect(() => {
    const pendingFocus = pendingFocusRef.current;
    if (!pendingFocus) return;

    if (pendingFocus === 'input' && isExpanded) {
      inputRef.current?.focus({ cursor: 'end' });
      pendingFocusRef.current = null;
    } else if (pendingFocus === 'toggle' && !isExpanded) {
      toggleRef.current?.focus();
      pendingFocusRef.current = null;
    }
  }, [isExpanded]);

  return (
    <search
      className="sxw-list-keyword-search"
      aria-label={ariaLabel}
      data-mode={mode}
      data-expanded={isExpanded}
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: 4,
        maxWidth: '100%',
        minWidth: 0,
        width: mode === 'collapsible' && !isExpanded ? 'auto' : '100%',
      }}
    >
      {mode === 'collapsible' && !isExpanded ? (
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
            pendingFocusRef.current = 'input';
            setOpen(true);
            onExpandedChange?.(true);
          }}
        />
      ) : null}
      <div
        id={searchId}
        hidden={mode === 'collapsible' && !isExpanded}
        style={{
          alignItems: 'center',
          display: mode === 'collapsible' && !isExpanded ? 'none' : 'flex',
          flex: '1 1 auto',
          gap: 4,
          maxWidth: '100%',
          minWidth: 0,
          width: '100%',
        }}
      >
        {mode === 'collapsible' && !isExpanded ? null : (
          <Input.Search
            {...searchProps}
            ref={inputRef}
            aria-label={ariaLabel}
            allowClear
            enterButton={
              <Button aria-label="搜索" htmlType="button" icon={<SearchOutlined aria-hidden="true" />} type="primary" />
            }
            style={{
              boxSizing: 'border-box',
              flex: '1 1 auto',
              minWidth: 0,
              maxWidth: '100%',
              width: '100%',
            }}
            value={value}
            onChange={onChange}
            onSearch={onSearch}
          />
        )}
        {mode === 'collapsible' && isExpanded && !hasCommittedQuery ? (
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
              pendingFocusRef.current = 'toggle';
              setOpen(false);
              onExpandedChange?.(false);
            }}
          />
        ) : null}
      </div>
    </search>
  );
}
