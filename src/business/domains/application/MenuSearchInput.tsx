import { SearchOutlined } from '@ant-design/icons';
import { AutoComplete, Input } from 'antd';
import type { InputRef } from 'antd';
import type { KeyboardEvent, ReactNode, Ref } from 'react';
import './menu-search-input.css';

export type MenuSearchOption = {
  value: string;
  title: ReactNode;
  context?: ReactNode;
};

export type MenuSearchInputProps = {
  options: readonly MenuSearchOption[];
  value: string;
  onSearch: (value: string) => void;
  onSelect: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: Ref<InputRef>;
  placeholder?: string;
  ariaLabel?: string;
};

/**
 * @sunxu-layer business
 * @sunxu-domain application
 * @sunxu-reason Shares the menu-search input and result presentation while filtering, keyboard shortcuts, permissions and navigation stay in the host.
 */
export function MenuSearchInput({
  options,
  value,
  onSearch,
  onSelect,
  onKeyDown,
  inputRef,
  placeholder = '搜索菜单',
  ariaLabel = '搜索菜单',
}: MenuSearchInputProps) {
  return (
    <div className="sxw-mes-menu-search">
      <AutoComplete
        allowClear
        filterOption={false}
        getPopupContainer={(triggerNode) =>
          triggerNode.parentElement ?? document.body
        }
        notFoundContent="未找到菜单"
        onSelect={(selectedValue) => onSelect(String(selectedValue))}
        onSearch={onSearch}
        options={options.map(({ value: optionValue, title, context }) => ({
          label: (
            <div className="sxw-mes-menu-search__option" title={optionValue}>
              <span className="sxw-mes-menu-search__option-title">{title}</span>
              {context ? (
                <span className="sxw-mes-menu-search__option-context">
                  {context}
                </span>
              ) : null}
            </div>
          ),
          value: optionValue,
        }))}
        classNames={{ popup: { root: 'sxw-mes-menu-search__dropdown' } }}
        value={value}
      >
        <Input
          ref={inputRef}
          aria-label={ariaLabel}
          className="sxw-mes-menu-search__input"
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          prefix={<SearchOutlined aria-hidden="true" />}
        />
      </AutoComplete>
    </div>
  );
}
