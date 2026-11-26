import type { ReactNode } from 'react';

/** Host-provided copy for one configuration label and its contextual help. */
export interface OperationConfigHelpCopy {
  label: string;
  description?: string;
}

export type OperationConfigHelpCopyById = Readonly<
  Record<string, OperationConfigHelpCopy>
>;

export interface OperationConfigHelpProviderProps {
  copyById: OperationConfigHelpCopyById;
  children: ReactNode;
}

export interface ConfigHelpIconProps {
  id?: string;
  label?: string;
  description?: string;
  className?: string;
}

export interface ConfigLabelProps {
  id: string;
  label?: string;
}

export interface ConfigOptionTextProps {
  id: string;
  label?: string;
}
