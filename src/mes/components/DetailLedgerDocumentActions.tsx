import { useCallback } from 'react';
import { useMesDocumentNavigation } from '../MesUiProvider';
import {
  type DocumentActionDefinition,
  type DocumentActionState,
  DocumentActionsDropdown,
} from './DocumentActionsDropdown';

export type DetailLedgerDocumentActionsProps<
  T extends DocumentActionState,
> = {
  actions: readonly DocumentActionDefinition<T>[];
  documentId: string;
  documentNo?: string | null;
  documentPath: string;
  loadDocument: (id: string) => Promise<T | null | undefined>;
  /** 详情页支持 URL action 的动作可直接打开对应表单。 */
  actionIntentKeys?: readonly string[];
  /** 当前台账上下文可直接承接的高频业务动作。 */
  actionHandlers?: Partial<Record<string, (document: T) => void | Promise<void>>>;
};

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-document-ledger
 * @sunxu-reason Retains MES ledger action routing while the host owns detail loading, permissions, navigation, and operation handlers.
 * Ledger action adapter with host-owned router and operation handlers.
 */
export function DetailLedgerDocumentActions<
  T extends DocumentActionState,
>({
  actions,
  actionIntentKeys = [],
  documentId,
  documentNo,
  documentPath,
  loadDocument,
  actionHandlers = {},
}: DetailLedgerDocumentActionsProps<T>) {
  const navigation = useMesDocumentNavigation();
  const onAction = useCallback(
    (key: string, document: T) => {
      const handler = actionHandlers[key];
      if (handler) {
        void handler(document);
        return;
      }
      if (key !== 'detail' && actionIntentKeys.includes(key)) {
        navigation?.push(`${documentPath}?action=${encodeURIComponent(key)}`);
        return;
      }
      navigation?.push(documentPath);
    },
    [actionHandlers, actionIntentKeys, documentPath, navigation],
  );

  return (
    <DocumentActionsDropdown<T>
      documentId={documentId}
      documentNo={documentNo}
      loadDocument={loadDocument}
      actions={actions}
      onAction={onAction}
    />
  );
}
