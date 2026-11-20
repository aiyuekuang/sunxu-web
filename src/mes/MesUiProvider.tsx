import { createContext, useCallback, useContext, type ReactNode } from 'react';
import type { MesMaterialSelectCapabilities } from './components/material-select-types';

export interface MesUiRoute {
  pathname: string;
  search: string;
  /** The host applies its router's replace operation. */
  replace: (path: string) => void;
}

export interface MesCustomFieldDisplayState {
  loading: boolean;
  hasFields: boolean;
  hasError: boolean;
}

export interface MesCustomFieldPanelRenderProps {
  objectType: string;
  objectId: string;
  editable: boolean;
  showEmpty: false;
  onDisplayStateChange: (state: MesCustomFieldDisplayState) => void;
}

export interface MesUiProviderProps {
  /** MES 宿主的权限判断；权限码和权限策略由宿主维护。 */
  hasPermission: (permission: string) => boolean;
  /**
   * Format or mask a price string using the host's amount-visibility policy.
   * The MES suite never imports Umi access state or price permission codes.
   */
  maskAmount?: (
    formattedAmount: string | number | null | undefined,
  ) => string;
  /**
   * Resolve a visible row edit action from the host's action-column metadata.
   * MES keeps its permission and action definitions; the table suite only calls
   * the returned action after a valid double click.
   */
  resolveRowEditAction?: (
    columns: readonly object[] | undefined,
    record: unknown,
  ) => { onClick: () => unknown | Promise<unknown> } | undefined;
  /** Identify action columns created by the host so the suite does not nest menus. */
  isTableActionColumn?: (column: object) => boolean;
  /** Current route and replace adapter for MES action-intent deep links. */
  actionIntentRoute?: MesUiRoute;
  /** Render MES custom-field content while the shared shell owns visibility and identity transitions. */
  renderCustomFieldPanel?: (
    props: MesCustomFieldPanelRenderProps,
  ) => ReactNode;
  /** Material data, dictionaries, configuration links, and scanner bridge. */
  materialSelectCapabilities?: MesMaterialSelectCapabilities;
  children: ReactNode;
}

type MesUiContextValue = Pick<
  MesUiProviderProps,
  | 'hasPermission'
  | 'maskAmount'
  | 'resolveRowEditAction'
  | 'isTableActionColumn'
  | 'actionIntentRoute'
  | 'renderCustomFieldPanel'
  | 'materialSelectCapabilities'
>;

const MesUiContext = createContext<MesUiContextValue | null>(null);

export function MesUiProvider({
  hasPermission,
  maskAmount,
  resolveRowEditAction,
  isTableActionColumn,
  actionIntentRoute,
  renderCustomFieldPanel,
  materialSelectCapabilities,
  children,
}: MesUiProviderProps) {
  return (
    <MesUiContext.Provider
      value={{
        hasPermission,
        maskAmount,
        resolveRowEditAction,
        isTableActionColumn,
        actionIntentRoute,
        renderCustomFieldPanel,
        materialSelectCapabilities,
      }}
    >
      {children}
    </MesUiContext.Provider>
  );
}

/** Host capabilities used by MES-specific table adapters. */
export function useMesTableCapabilities(): Pick<
  MesUiContextValue,
  'resolveRowEditAction' | 'isTableActionColumn'
> {
  const host = useContext(MesUiContext);
  return {
    resolveRowEditAction: host?.resolveRowEditAction,
    isTableActionColumn: host?.isTableActionColumn,
  };
}

/**
 * Price visibility stays with the host. Missing host capability fails closed.
 */
export function useMesAmountMask(): NonNullable<MesUiContextValue['maskAmount']> {
  const host = useContext(MesUiContext);
  return (
    host?.maskAmount ??
    ((formattedAmount) => (formattedAmount == null ? '-' : '****'))
  );
}

/** Permission checks fail closed when a host has not supplied an authorization provider. */
export function useMesPermission(permission?: string): boolean {
  const host = useContext(MesUiContext);
  if (!permission) return true;
  return host?.hasPermission(permission) ?? false;
}

/** Permission predicate for compound MES UI components; absent providers deny access. */
export function useMesPermissionChecker(): (permission: string) => boolean {
  const host = useContext(MesUiContext);
  return useCallback(
    (permission: string) => host?.hasPermission(permission) ?? false,
    [host],
  );
}

/** Router capability used by document action-intent deep links. */
export function useMesActionIntentRoute(): MesUiRoute | undefined {
  return useContext(MesUiContext)?.actionIntentRoute;
}

/** Host-owned schema, requests, and field editors for a shared document-field shell. */
export function useMesCustomFieldPanelRenderer():
  | MesUiProviderProps['renderCustomFieldPanel']
  | undefined {
  return useContext(MesUiContext)?.renderCustomFieldPanel;
}

/** Host capabilities for MES material selectors and scan-gun integration. */
export function useMesMaterialSelectCapabilities():
  | MesMaterialSelectCapabilities
  | undefined {
  return useContext(MesUiContext)?.materialSelectCapabilities;
}
