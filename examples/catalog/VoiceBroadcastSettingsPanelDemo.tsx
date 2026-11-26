import { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  VOICE_EVENT_TYPE_OPTIONS,
  VoiceBroadcastSettingsPanel,
  type VoiceBroadcastSettings,
} from '../../src/business/domains/application';

const initialSettings: VoiceBroadcastSettings = {
  enabled: true,
  minIntervalSec: 30,
  types: {},
};

export function VoiceBroadcastSettingsPanelDemo() {
  const [settings, setSettings] = useState(initialSettings);
  const [open, setOpen] = useState(false);
  const [resetCount, setResetCount] = useState(0);

  return (
    <SectionCard title="大屏语音播报设置">
      <Typography.Paragraph type="secondary">
        控制播报间隔和事件类型；偏好持久化与已播记录清理由宿主注入。
      </Typography.Paragraph>
      <Space>
        <Button onClick={() => setOpen((value) => !value)}>
          {open ? '关闭设置' : '打开设置'}
        </Button>
        <Typography.Text type="secondary">
          {VOICE_EVENT_TYPE_OPTIONS.filter(
            (option) => settings.types[option.value] !== false,
          ).length}{' '}
          类事件已开启 · 清理记录 {resetCount} 次
        </Typography.Text>
      </Space>
      {open ? (
        <div
          style={{
            position: 'relative',
            minHeight: 340,
            marginTop: 16,
            background: '#020617',
          }}
        >
          <VoiceBroadcastSettingsPanel
            settings={settings}
            onChange={setSettings}
            queueLength={3}
            onResetSpoken={() => setResetCount((count) => count + 1)}
            confirmReset={() => true}
            onClose={() => setOpen(false)}
          />
        </div>
      ) : null}
    </SectionCard>
  );
}
