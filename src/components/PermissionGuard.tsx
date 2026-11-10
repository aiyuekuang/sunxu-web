import type { ReactNode } from 'react';

export type PermissionGuardProps = {
  permitted: boolean;
  children: ReactNode;
  fallback?: ReactNode;
};

/** Renders a host-computed authorization result; it never reads permissions itself. */
export function PermissionGuard({ permitted, children, fallback = null }: PermissionGuardProps) {
  return permitted ? children : fallback;
}
