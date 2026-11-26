import { MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown } from 'antd';
import { useMemo } from 'react';
import { useHostPermissionChecker } from '../../providers/BusinessUiProvider';
import {
  type DocumentActionDefinition,
  type DocumentActionState,
  getAvailableDocumentActions,
} from './DocumentActionsDropdown';

export type DetailDocumentActionsProps<T extends DocumentActionState> = {
  /** 已由详情接口返回的权威单据；详情页不应为展开动作再发一次请求。 */
  document: T;
  actions: readonly DocumentActionDefinition<T>[];
  /** 高优先级动作在详情页使用主按钮，其余直接动作使用普通按钮。 */
  primaryActionKeys?: readonly string[];
  /** 未列入直显列表的低频动作收进有文字的“更多操作”。 */
  directActionKeys: readonly string[];
  onAction: (key: string, document: T) => void | Promise<void>;
};

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Keeps host document action presentation aligned with server-provided actions and host permission results.
 * Detail-page action layout sharing the list action permission/state rules.
 */
export function DetailDocumentActions<T extends DocumentActionState>({
  document,
  actions,
  primaryActionKeys = [],
  directActionKeys,
  onAction,
}: DetailDocumentActionsProps<T>) {
  const hasPermission = useHostPermissionChecker();
  const directActionKeySet = useMemo(
    () => new Set(directActionKeys),
    [directActionKeys],
  );
  const primaryActionKeySet = useMemo(
    () => new Set(primaryActionKeys),
    [primaryActionKeys],
  );
  const visibleActions = useMemo(
    () => getAvailableDocumentActions(actions, document, hasPermission),
    [actions, document, hasPermission],
  );
  const directActions = visibleActions.filter((action) =>
    directActionKeySet.has(action.key),
  );
  const overflowActions = visibleActions.filter(
    (action) => !directActionKeySet.has(action.key),
  );

  const overflowItems = useMemo<NonNullable<MenuProps['items']>>(
    () =>
      overflowActions.map((action) => ({
        key: action.key,
        label:
          typeof action.label === 'function'
            ? action.label(document)
            : action.label,
        danger: action.danger,
      })),
    [document, overflowActions],
  );

  return (
    <>
      {directActions.map((action) => (
        <Button
          key={action.key}
          type={primaryActionKeySet.has(action.key) ? 'primary' : 'default'}
          danger={action.danger}
          onClick={() => void onAction(action.key, document)}
        >
          {typeof action.label === 'function'
            ? action.label(document)
            : action.label}
        </Button>
      ))}
      {overflowItems.length > 0 ? (
        <Dropdown
          trigger={['click']}
          menu={{
            items: overflowItems,
            onClick: ({ key }) => void onAction(String(key), document),
          }}
        >
          <Button>
            更多操作 <MoreOutlined />
          </Button>
        </Dropdown>
      ) : null}
    </>
  );
}
