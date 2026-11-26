import type { ReactNode } from 'react';

export interface BomVersionHistoryRecord {
  id: string;
  version: string;
  status: string;
  changeRemark?: string | null;
  updatedAt?: string | null;
}

export interface BomVersionHistoryMaster<T extends BomVersionHistoryRecord> {
  name: string;
  versions?: readonly T[];
}

export interface BomVersionHistoryAction {
  key: string;
  label: string;
  onClick: () => unknown | Promise<unknown>;
  render?: () => ReactNode;
  standalone?: boolean;
  danger?: boolean;
  permission?: string;
  visible?: boolean;
  confirm?:
    | string
    | {
        title: string;
        content?: ReactNode;
        danger?: boolean;
        okText?: string;
        cancelText?: string;
      };
  successMessage?: string;
  onSuccess?: () => void;
}

export interface BomVersionHistoryDrawerProps<
  T extends BomVersionHistoryRecord,
> {
  open: boolean;
  master: BomVersionHistoryMaster<T> | null;
  selectedBomId?: string;
  onOpenChange: (open: boolean) => void;
  onSelectVersion: (version: T) => void;
  getActionItems: (version: T) => BomVersionHistoryAction[];
  hasPermission?: (permission: string) => boolean;
  statusLabels?: Readonly<Record<string, string>>;
  statusColors?: Readonly<Record<string, string>>;
  formatDateTime?: (value?: string | null) => ReactNode;
}
