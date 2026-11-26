/**
 * @deprecated Compatibility entry for existing consumers of `sunxu-web/mes`.
 * New integrations should import from `sunxu-web/business/<domain>`.
 * Remove this package subpath in the next major release after all tracked
 * consumers have migrated to the neutral business entry points.
 */
export * from '../index';
export * from './mesAliases';
export { ContextualHelp } from '../../components/ContextualHelp';
export { StatusDisplay } from '../../components/StatusDisplay';
export type {
  StatusDisplayMode,
  StatusDisplayProps,
  StatusMap,
  StatusMapItem,
} from '../../components/StatusDisplay';

/** @deprecated Use `StatusMapItem` from `sunxu-web`. */
export interface MesStatusEnumItem {
  text: string;
  status?: string;
  color?: string;
}

/** @deprecated Use `StatusMap` from `sunxu-web`. */
export type MesStatusEnum = Readonly<Record<string, MesStatusEnumItem>>;
