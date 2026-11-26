/**
 * Compatibility entry for consumers migrating from `sunxu-web/mes` to
 * `sunxu-web/business`.
 */
export * from '../business';
export { ContextualHelp } from '../components/ContextualHelp';
export { MesStatusTag } from '../business/components/MesStatusTag';
export type {
  MesStatusTagEnumItem,
  MesStatusTagProps,
} from '../business/components/MesStatusTag';
export { StatusDisplay } from '../components/StatusDisplay';
export type {
  StatusDisplayMode,
  StatusDisplayProps,
  StatusMap,
  StatusMapItem,
} from '../components/StatusDisplay';

/** @deprecated Use `StatusMapItem` from `sunxu-web`. */
export interface MesStatusEnumItem {
  text: string;
  status?: string;
  color?: string;
}

/** @deprecated Use `StatusMap` from `sunxu-web`. */
export type MesStatusEnum = Readonly<Record<string, MesStatusEnumItem>>;
