import './voice-broadcast-settings.css';
import type { VoiceBroadcastSettingsPanelProps } from './voice-broadcast-settings-types';

export const VOICE_EVENT_TYPE_OPTIONS = [
  { value: 'work_order_overdue', label: '交期逾期工单', group: 'alert' },
  { value: 'quality_abnormal', label: '质检异常', group: 'alert' },
  { value: 'equipment_fault', label: '设备故障', group: 'alert' },
  { value: 'stock_warning', label: '库存预警', group: 'alert' },
  { value: 'work_order_created', label: '新工单下达', group: 'production' },
  { value: 'work_order_completed', label: '工单完工', group: 'production' },
  { value: 'work_report', label: '报工', group: 'production' },
] as const;

export const VOICE_EVENT_GROUP_LABELS = {
  alert: '异常事件',
  production: '生产动态',
} as const;

export const VOICE_INTERVAL_OPTIONS = [15, 30, 60, 120] as const;

const EVENT_GROUPS = ['alert', 'production'] as const;
const RESET_CONFIRM =
  '确定清空播报记录？清空后所有事件视为未播，但已存在的历史事件会在下一次刷新时重建基线、不会追播。';

/**
 * @sunxu-layer business
 * @sunxu-domain application
 * @sunxu-reason Keeps the host voice-broadcast settings overlay and event grouping while settings persistence and spoken-event reset remain host controlled.
 */
export function VoiceBroadcastSettingsPanel({
  settings,
  onChange,
  onResetSpoken,
  queueLength,
  onClose,
  eventTypeOptions = VOICE_EVENT_TYPE_OPTIONS,
  eventGroupLabels = VOICE_EVENT_GROUP_LABELS,
  eventGroups = EVENT_GROUPS,
  intervalOptions = VOICE_INTERVAL_OPTIONS,
  confirmReset,
}: VoiceBroadcastSettingsPanelProps) {
  const toggleType = (type: string, checked: boolean) => {
    onChange({
      ...settings,
      types: { ...settings.types, [type]: checked },
    });
  };

  return (
    <section className="sxw-mes-voice-panel" aria-label="语音播报设置">
      <div className="sxw-mes-voice-panel-head">
        <span>语音播报设置</span>
        <button
          type="button"
          className="sxw-mes-voice-panel-close"
          aria-label="关闭语音播报设置"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="sxw-mes-voice-panel-section">播报间隔</div>
      <div className="sxw-mes-voice-panel-row">
        {intervalOptions.map((seconds) => (
          <button
            key={seconds}
            type="button"
            className={`sxw-mes-voice-interval-btn${
              settings.minIntervalSec === seconds ? ' active' : ''
            }`}
            aria-pressed={settings.minIntervalSec === seconds}
            onClick={() => onChange({ ...settings, minIntervalSec: seconds })}
          >
            {seconds}秒
          </button>
        ))}
      </div>

      <div className="sxw-mes-voice-panel-section">播报事件类型</div>
      {eventGroups.map((group) => (
        <div key={group}>
          <div className="sxw-mes-voice-panel-group">
            {eventGroupLabels[group]}
          </div>
          <div className="sxw-mes-voice-panel-types">
            {eventTypeOptions
              .filter((option) => option.group === group)
              .map((option) => (
                <label
                  key={option.value}
                  className="sxw-mes-voice-type-item"
                >
                  <input
                    type="checkbox"
                    checked={settings.types[option.value] !== false}
                    onChange={(event) =>
                      toggleType(option.value, event.target.checked)
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
          </div>
        </div>
      ))}

      <div className="sxw-mes-voice-panel-hint">
        只播开启之后新出现的事件，同一事件只播一次；异常优先播报，生产动态较多时可单独关闭。
        当前待播 {queueLength} 条。
      </div>

      <button
        type="button"
        className="sxw-mes-voice-reset-btn"
        onClick={() => {
          const confirmed = confirmReset
            ? confirmReset(RESET_CONFIRM)
            : window.confirm(RESET_CONFIRM);
          if (!confirmed) return;
          onResetSpoken();
          onClose();
        }}
      >
        清空播报记录
      </button>
    </section>
  );
}

export type { VoiceBroadcastSettingsPanelProps };
