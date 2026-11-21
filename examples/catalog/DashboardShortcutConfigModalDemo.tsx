import { useCallback, useMemo, useRef, useState } from 'react';
import { Button, Space, Typography } from 'antd';
import type {
  DashboardShortcutConfigCapabilities,
  DashboardShortcutPreferences,
} from '../../src/mes/components/dashboard-shortcut-config-types';
import { SectionCard } from '../../src';
import { DashboardShortcutConfigModal } from '../../src/mes';

const initialPreferences: DashboardShortcutPreferences = {
  systemItems: [
    { key: 'production', businessModule: 'large_screen', visible: true, sortOrder: 0 },
    { key: 'quality', businessModule: 'large_screen', visible: true, sortOrder: 1 },
    { key: 'equipment', businessModule: 'large_screen', visible: true, sortOrder: 2 },
    { key: 'warehouse', businessModule: 'large_screen', visible: true, sortOrder: 3 },
    { key: 'workforce', businessModule: 'large_screen', visible: true, sortOrder: 4 },
  ],
  customItems: [
    {
      id: 'shortcut-1',
      name: '供应商交付分析',
      url: 'https://example.com/supplier-dashboard',
      businessModule: 'large_screen',
      supportedPlatforms: 'both',
      visible: true,
      sortOrder: 5,
    },
    {
      id: 'shortcut-2',
      name: '外部业务看板',
      url: 'https://example.com/business',
      businessModule: 'custom_business',
      supportedPlatforms: 'pc',
      visible: false,
      sortOrder: 6,
    },
  ],
};

const systemShortcuts: DashboardShortcutConfigCapabilities['systemShortcuts'] = [
  { key: 'production', label: '生产总览', accessible: true },
  { key: 'quality', label: '质量监控', accessible: true },
  { key: 'equipment', label: '设备运维', accessible: false },
  { key: 'warehouse', label: '仓储物流', accessible: true },
  { key: 'workforce', label: '人员绩效', accessible: false },
];

export function DashboardShortcutConfigModalDemo() {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [lastAction, setLastAction] = useState('尚未保存快捷入口偏好。');
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;

  const onPreferencesChange = useCallback(
    (next: DashboardShortcutPreferences) => {
      preferencesRef.current = next;
      setPreferences(next);
    },
    [],
  );

  const capabilities = useMemo<DashboardShortcutConfigCapabilities>(
    () => ({
      systemShortcuts,
      async loadPreferences() {
        return preferencesRef.current;
      },
      async savePreferences(payload) {
        const next: DashboardShortcutPreferences = {
          systemItems: payload.systemItems,
          customItems: payload.customItems.map((item, index) => ({
            ...item,
            id: item.id ?? `demo-shortcut-${Date.now()}-${index}`,
          })),
        };
        preferencesRef.current = next;
        setPreferences(next);
        return next;
      },
      notify(type, message) {
        setLastAction(`${type === 'success' ? '成功' : '失败'}：${message}`);
      },
    }),
    [],
  );

  return (
    <SectionCard title="看板快捷入口配置">
      <Typography.Paragraph type="secondary">
        配置固定大屏入口和自定义业务入口的显示、模块顺序、支持端及链接。系统入口访问权限仍由宿主判定；本 Demo 将设备和人员入口设为无访问权限。
      </Typography.Paragraph>
      <Space wrap>
        <Button type="primary" onClick={() => setOpen(true)}>
          打开入口配置
        </Button>
        <Typography.Text type="secondary">
          自定义入口 {preferences.customItems.length}/20
        </Typography.Text>
      </Space>
      <Typography.Text
        type="secondary"
        aria-live="polite"
        style={{ display: 'block', marginTop: 8 }}
      >
        {lastAction}
      </Typography.Text>
      <DashboardShortcutConfigModal
        open={open}
        onClose={() => setOpen(false)}
        onPreferencesChange={onPreferencesChange}
        capabilities={capabilities}
      />
    </SectionCard>
  );
}
