import { useMemo, useRef, useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import { ServerInfoCard } from '../../src/business/domains/application/ServerInfoCard';
import type {
  ServerInfoCardCapabilities,
  ServerSystemStats,
} from '../../src/business/domains/application/server-info-card-types';

const initialStats: ServerSystemStats = {
  cpu: {
    model: 'Intel(R) Xeon(R) Gold 6338 CPU @ 2.00GHz',
    cores: 16,
    usagePercent: 28,
    loadAvg: [1.24, 1.08, 0.96],
  },
  memory: {
    totalBytes: 32 * 1024 ** 3,
    usedBytes: 18.4 * 1024 ** 3,
    freeBytes: 13.6 * 1024 ** 3,
    usagePercent: 58,
  },
  disk: {
    totalBytes: 512 * 1024 ** 3,
    usedBytes: 337 * 1024 ** 3,
    freeBytes: 175 * 1024 ** 3,
    usagePercent: 66,
  },
  os: {
    hostname: 'sunxu-app-node-01',
    platform: 'linux',
    arch: 'x64',
    release: '6.8.0',
    uptime: 86_400 * 12 + 3_600 * 5,
  },
  node: {
    version: 'v22.11.0',
    processUptime: 3_600 * 8 + 60 * 24,
    pid: 18432,
    heapUsedBytes: 418 * 1024 ** 2,
    heapTotalBytes: 640 * 1024 ** 2,
    rssBytes: 1.2 * 1024 ** 3,
  },
  timestamp: '2026-11-21T08:30:00.000Z',
};

const fileStats = {
  totalCount: 128_420,
  totalSize: 84.6 * 1024 ** 3,
  byStatus: [
    { status: 'active', count: 127_910, size: 83.9 * 1024 ** 3 },
    { status: 'orphaned', count: 510, size: 0.7 * 1024 ** 3 },
  ],
  byEntityType: [
    { entityType: 'material', count: 41_280, size: 21.4 * 1024 ** 3 },
    { entityType: 'work-order', count: 87_140, size: 63.2 * 1024 ** 3 },
  ],
  byMimeType: [
    { mimeCategory: 'image', count: 78_000, size: 38.2 * 1024 ** 3 },
    { mimeCategory: 'document', count: 43_420, size: 30.1 * 1024 ** 3 },
    { mimeCategory: 'other', count: 7_000, size: 16.3 * 1024 ** 3 },
  ],
} as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = -1;
  do {
    value /= 1024;
    unit += 1;
  } while (value >= 1024 && unit < units.length - 1);
  return `${value.toFixed(1)} ${units[unit]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return [days ? `${days}天` : '', hours ? `${hours}小时` : '', `${minutes}分钟`]
    .filter(Boolean)
    .join(' ');
}

export function ServerInfoCardDemo() {
  const [requestFailure, setRequestFailure] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const listeners = useRef(new Set<(stats: ServerSystemStats) => void>());
  const capabilities = useMemo<ServerInfoCardCapabilities>(
    () => ({
      requestSystemStats: async () => {
        if (requestFailure) throw new Error('示例服务器暂不可用');
        return initialStats;
      },
      subscribeSystemStats: (onStats) => {
        listeners.current.add(onStats);
        return () => listeners.current.delete(onStats);
      },
      formatBytes,
      formatCompactNumber: (value) => new Intl.NumberFormat('zh-CN').format(value),
      formatUptime,
      formatPlatformLabel: (platform) =>
        ({ darwin: 'macOS', linux: 'Linux', win32: 'Windows' })[platform] ?? platform,
      formatErrorMessage: (error, fallback) =>
        error instanceof Error && error.message ? error.message : fallback,
    }),
    [requestFailure],
  );

  const publishLiveStats = () => {
    const nextStats: ServerSystemStats = {
      ...initialStats,
      cpu: {
        ...initialStats.cpu,
        usagePercent: 28 + ((liveCount + 1) % 6) * 8,
      },
      timestamp: new Date().toISOString(),
    };
    listeners.current.forEach((onStats) => onStats(nextStats));
    setLiveCount((count) => count + 1);
  };

  return (
    <SectionCard title="服务器与文件存储概览">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          服务器遥测、实时订阅、平台/容量/时长格式化与错误文案由宿主注入；此组件展示资源、运行环境及文件存储统计。
        </Typography.Paragraph>
        <Space wrap>
          <Button onClick={publishLiveStats}>推送一条实时指标</Button>
          <Button
            onClick={() => setRequestFailure((failure) => !failure)}
          >
            {requestFailure ? '恢复服务器请求' : '模拟服务器请求错误'}
          </Button>
        </Space>
        <ServerInfoCard
          key={requestFailure ? 'request-failure' : 'request-ready'}
          capabilities={capabilities}
          fileStats={fileStats}
        />
        <Typography.Text type="secondary" role="status">
          已推送实时指标：{liveCount} 条
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
