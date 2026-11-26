import { MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown } from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useHostPermissionChecker } from '../../providers/BusinessUiProvider';

export interface DocumentActionState {
  id: string;
  availableActions?: string[];
}

export interface DocumentActionDefinition<T extends DocumentActionState> {
  key: string;
  label: string | ((document: T) => string);
  permission?: string;
  /** Additional required permissions for combined actions such as preview plus submit. */
  requiredPermissions?: readonly string[];
  requiredAvailableAction?: string;
  danger?: boolean;
  visible?: (document: T) => boolean;
}

/** Apply the server action projection, host permissions, and page visibility together. */
export function getAvailableDocumentActions<T extends DocumentActionState>(
  actions: readonly DocumentActionDefinition<T>[],
  document: T,
  hasPermission: (permission: string) => boolean,
): DocumentActionDefinition<T>[] {
  const availableActions = document.availableActions ?? [];

  return actions.filter(
    (action) =>
      (!action.permission || hasPermission(action.permission)) &&
      (!action.requiredPermissions ||
        action.requiredPermissions.every((permission) =>
          hasPermission(permission),
        )) &&
      (!action.requiredAvailableAction ||
        availableActions.includes(action.requiredAvailableAction)) &&
      (action.visible?.(document) ?? true),
  );
}

export interface DocumentActionsDropdownProps<
  T extends DocumentActionState,
> {
  documentId: string;
  documentNo?: string | null;
  loadDocument?: (id: string) => Promise<T | null | undefined>;
  /** A safe list projection used when the host must not request full detail. */
  fallbackDocument?: T | null;
  actions: readonly DocumentActionDefinition<T>[];
  onAction: (key: string, document: T) => void | Promise<void>;
}

/**
 * @sunxu-reason Preserves host document action filtering while receiving permissions and detail loading from the host.
 * The server's availableActions remain authoritative for each document.
 */
/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Presents reusable document actions dropdown behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function DocumentActionsDropdown<T extends DocumentActionState>({
  documentId,
  documentNo,
  loadDocument,
  fallbackDocument,
  actions,
  onAction,
}: DocumentActionsDropdownProps<T>) {
  const hasPermission = useHostPermissionChecker();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState<T | null>(null);
  const [loadError, setLoadError] = useState(false);
  const keepOpenAfterRetryRef = useRef(false);

  useEffect(() => {
    setOpen(false);
    setLoading(false);
    setDocument(null);
    setLoadError(false);
  }, [documentId]);

  const loadAvailableActions = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const nextDocument = loadDocument
        ? await loadDocument(documentId)
        : fallbackDocument;
      setDocument(nextDocument ?? null);
    } catch {
      // The host request layer owns the global error message; preserve a retryable menu state here.
      setDocument(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [documentId, fallbackDocument, loadDocument]);

  const menuItems = useMemo<MenuProps['items']>(() => {
    if (loading) {
      return [{ key: 'loading', label: '正在加载可用操作…', disabled: true }];
    }
    if (loadError) {
      return [{ key: 'retry', label: '加载失败，点击重试' }];
    }
    if (!document) {
      return [{ key: 'not-found', label: '未找到单据', disabled: true }];
    }

    return getAvailableDocumentActions(actions, document, hasPermission).map(
      (action) => ({
        key: action.key,
        label:
          typeof action.label === 'function'
            ? action.label(document)
            : action.label,
        danger: action.danger,
      }),
    );
  }, [actions, document, hasPermission, loadError, loading]);

  const hasPermittedAction = useMemo(
    () =>
      actions.some(
        (action) =>
          (!action.permission || hasPermission(action.permission)) &&
          (!action.requiredPermissions ||
            action.requiredPermissions.every((permission) =>
              hasPermission(permission),
            )),
      ),
    [actions, hasPermission],
  );

  if (!hasPermittedAction) return null;

  return (
    <Dropdown
      trigger={['click']}
      open={open}
      menu={{
        items: menuItems,
        onClick: ({ key }) => {
          if (key === 'retry') {
            keepOpenAfterRetryRef.current = true;
            void loadAvailableActions();
            return;
          }
          if (key === 'loading' || key === 'not-found' || !document) return;
          setOpen(false);
          void onAction(String(key), document);
        },
      }}
      onOpenChange={(nextOpen, { source }) => {
        if (!nextOpen && source === 'menu' && keepOpenAfterRetryRef.current) {
          keepOpenAfterRetryRef.current = false;
          return;
        }
        setOpen(nextOpen);
        if (nextOpen) {
          void loadAvailableActions();
        } else {
          setDocument(null);
          setLoadError(false);
        }
      }}
    >
      <Button
        type="text"
        size="small"
        icon={<MoreOutlined />}
        aria-label={`更多操作 ${documentNo ?? ''}`}
        title="更多操作"
        loading={loading}
      />
    </Dropdown>
  );
}
