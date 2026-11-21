export interface VoiceBroadcastSettings {
  enabled: boolean;
  minIntervalSec: number;
  /** Event types not present in the map remain enabled. */
  types: Record<string, boolean>;
}

export type VoiceEventGroup = 'alert' | 'production';

export interface VoiceEventTypeOption {
  value: string;
  label: string;
  group: VoiceEventGroup;
}

export interface VoiceBroadcastSettingsPanelProps {
  settings: VoiceBroadcastSettings;
  onChange: (settings: VoiceBroadcastSettings) => void;
  onResetSpoken: () => void;
  queueLength: number;
  onClose: () => void;
  eventTypeOptions?: readonly VoiceEventTypeOption[];
  eventGroupLabels?: Readonly<Record<VoiceEventGroup, string>>;
  eventGroups?: readonly VoiceEventGroup[];
  intervalOptions?: readonly number[];
  confirmReset?: (message: string) => boolean;
}
