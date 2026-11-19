import { createContext, useContext, type ReactNode } from 'react';

export interface MesUiProviderProps {
  /** MES 宿主的权限判断；权限码和权限策略由宿主维护。 */
  hasPermission: (permission: string) => boolean;
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
  children: ReactNode;
}

type MesUiContextValue = Pick<
  MesUiProviderProps,
  'hasPermission' | 'resolveRowEditAction' | 'isTableActionColumn'
>;

const MesUiContext = createContext<MesUiContextValue | null>(null);

export function MesUiProvider({
  hasPermission,
  resolveRowEditAction,
  isTableActionColumn,
  children,
}: MesUiProviderProps) {
  return (
    <MesUiContext.Provider
      value={{ hasPermission, resolveRowEditAction, isTableActionColumn }}
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

/** Permission checks fail closed when a host has not supplied an authorization provider. */
export function useMesPermission(permission?: string): boolean {
  const host = useContext(MesUiContext);
  if (!permission) return true;
  return host?.hasPermission(permission) ?? false;
}
