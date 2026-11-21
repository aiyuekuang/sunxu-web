import type { ProFormInstance } from '@ant-design/pro-components';

export type DashboardShortcutBusinessModule =
  | 'large_screen'
  | 'custom_business';
export type DashboardShortcutPlatform = 'pc' | 'app' | 'both';
export type DashboardShortcutSystemKey =
  | 'production'
  | 'quality'
  | 'equipment'
  | 'warehouse'
  | 'workforce';

export interface DashboardSystemShortcutPreference {
  key: DashboardShortcutSystemKey;
  businessModule: DashboardShortcutBusinessModule;
  visible: boolean;
  sortOrder: number;
}

export interface DashboardCustomShortcutPreference {
  id?: string;
  name: string;
  url: string;
  businessModule?: DashboardShortcutBusinessModule;
  supportedPlatforms?: DashboardShortcutPlatform;
  visible: boolean;
  sortOrder: number;
}

export interface DashboardShortcutPreferences {
  systemItems: DashboardSystemShortcutPreference[];
  customItems: Array<DashboardCustomShortcutPreference & { id: string }>;
}

export interface DashboardShortcutPreferencesPayload {
  systemItems: DashboardSystemShortcutPreference[];
  customItems: DashboardCustomShortcutPreference[];
}

export interface DashboardSystemShortcutDefinition {
  key: DashboardShortcutSystemKey;
  label: string;
  accessible: boolean;
}

export interface DashboardShortcutRow {
  rowKey: string;
  kind: 'system' | 'custom';
  systemKey?: DashboardShortcutSystemKey;
  customId?: string;
  name: string;
  url: string;
  businessModule: DashboardShortcutBusinessModule;
  supportedPlatforms: DashboardShortcutPlatform;
  visible: boolean;
  sortOrder: number;
  accessible: boolean;
}

export interface DashboardShortcutFormValues {
  name: string;
  url: string;
  businessModule: DashboardShortcutBusinessModule;
  supportedPlatforms: DashboardShortcutPlatform;
}

export interface DashboardShortcutConfigCapabilities {
  /** Host supplies the current permission results alongside system labels and keys. */
  systemShortcuts: readonly DashboardSystemShortcutDefinition[];
  loadPreferences: () => Promise<DashboardShortcutPreferences>;
  savePreferences: (
    payload: DashboardShortcutPreferencesPayload,
  ) => Promise<DashboardShortcutPreferences>;
  notify: (type: 'success' | 'error', message: string) => void;
}

export interface DashboardShortcutConfigModalProps {
  open: boolean;
  onClose: () => void;
  onPreferencesChange: (preferences: DashboardShortcutPreferences) => void;
  capabilities: DashboardShortcutConfigCapabilities;
}

export type DashboardShortcutFormInstance = ProFormInstance<DashboardShortcutFormValues>;
