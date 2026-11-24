import {
  CloudServerOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  FileOutlined,
  FolderOutlined,
  HddOutlined,
  NodeIndexOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Card,
  Col,
  Divider,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import type {
  ServerInfoCardCapabilities,
  ServerInfoCardProps,
  ServerSystemStats,
} from './server-info-card-types';

function getProgressStatus(
  percent: number,
): 'success' | 'normal' | 'exception' {
  if (percent >= 90) return 'exception';
  if (percent >= 70) return 'normal';
  return 'success';
}

function getOrphanStats(
  fileStats: ServerInfoCardProps['fileStats'],
): { count: number; size: number } | undefined {
  return fileStats?.byStatus.find((item) => item.status === 'orphaned');
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain system-files
 * @sunxu-reason Preserves the server resource and file-storage overview while the host supplies REST/WebSocket data, reconnect subscription behavior, and number/date formatting.
 */
export function ServerInfoCard({
  fileStats,
  capabilities,
}: ServerInfoCardProps) {
  const { token } = theme.useToken();
  const capabilitiesRef = useRef<ServerInfoCardCapabilities>(capabilities);
  capabilitiesRef.current = capabilities;
  const [stats, setStats] = useState<ServerSystemStats | null>(null);
  const [realtime, setRealtime] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void capabilitiesRef.current
      .requestSystemStats()
      .then((nextStats) => {
        if (!active) return;
        setStats(nextStats);
        setErrorMessage(null);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(
            capabilitiesRef.current.formatErrorMessage(
              error,
              '服务器信息加载失败',
            ),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const unsubscribe = capabilitiesRef.current.subscribeSystemStats(
      (nextStats) => {
        setStats(nextStats);
        setRealtime(true);
        setLoading(false);
        setErrorMessage(null);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (!stats && !fileStats && !loading && !errorMessage) return null;

  const orphanStats = getOrphanStats(fileStats);

  return (
    <Card
      title={
        <Space>
          <CloudServerOutlined />
          <span>系统概览</span>
          {realtime ? (
            <Tag color="success" style={{ marginLeft: 4, fontWeight: 'normal' }}>
              实时
            </Tag>
          ) : null}
        </Space>
      }
      style={{ marginBottom: 16 }}
      size="small"
    >
      {!stats && loading ? (
        <Spin description="正在加载服务器信息" />
      ) : null}
      {!stats && errorMessage ? (
        <Alert type="error" showIcon message={errorMessage} />
      ) : null}

      {stats ? (
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Space orientation="vertical" style={{ width: '100%' }} size={4}>
              <Space>
                <DashboardOutlined style={{ color: token.colorPrimary }} />
                <Typography.Text strong>CPU</Typography.Text>
              </Space>
              <Progress
                aria-label="CPU 使用率"
                percent={stats.cpu.usagePercent}
                size="small"
                status={getProgressStatus(stats.cpu.usagePercent)}
                format={(percent) => `${percent}%`}
              />
              <Tooltip title={stats.cpu.model}>
                <Typography.Text
                  type="secondary"
                  ellipsis
                  style={{ fontSize: 12 }}
                >
                  {stats.cpu.cores} 核 ·{' '}
                  {stats.cpu.model.split(/\s+/).slice(0, 3).join(' ')}
                </Typography.Text>
              </Tooltip>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                负载: {stats.cpu.loadAvg.map((value) => value.toFixed(2)).join(' / ')}
              </Typography.Text>
            </Space>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Space orientation="vertical" style={{ width: '100%' }} size={4}>
              <Space>
                <DesktopOutlined style={{ color: token.colorInfo }} />
                <Typography.Text strong>内存</Typography.Text>
              </Space>
              <Progress
                aria-label="内存使用率"
                percent={stats.memory.usagePercent}
                size="small"
                status={getProgressStatus(stats.memory.usagePercent)}
                format={(percent) => `${percent}%`}
              />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {capabilities.formatBytes(stats.memory.usedBytes)} /{' '}
                {capabilities.formatBytes(stats.memory.totalBytes)}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                可用: {capabilities.formatBytes(stats.memory.freeBytes)}
              </Typography.Text>
            </Space>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Space orientation="vertical" style={{ width: '100%' }} size={4}>
              <Space>
                <HddOutlined style={{ color: token.colorSuccess }} />
                <Typography.Text strong>磁盘</Typography.Text>
              </Space>
              <Progress
                aria-label="磁盘使用率"
                percent={stats.disk.usagePercent}
                size="small"
                status={getProgressStatus(stats.disk.usagePercent)}
                format={(percent) => `${percent}%`}
              />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {capabilities.formatBytes(stats.disk.usedBytes)} /{' '}
                {capabilities.formatBytes(stats.disk.totalBytes)}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                可用: {capabilities.formatBytes(stats.disk.freeBytes)}
              </Typography.Text>
            </Space>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Space orientation="vertical" style={{ width: '100%' }} size={4}>
              <Space>
                <NodeIndexOutlined style={{ color: token.colorWarning }} />
                <Typography.Text strong>运行环境</Typography.Text>
              </Space>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                <DatabaseOutlined />{' '}
                {capabilities.formatPlatformLabel(stats.os.platform)} {stats.os.arch}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                主机: {stats.os.hostname}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Node {stats.node.version} · PID {stats.node.pid}
              </Typography.Text>
              <Space size={16} wrap style={{ fontSize: 12 }}>
                <Statistic
                  title="系统运行"
                  value={capabilities.formatUptime(stats.os.uptime)}
                  styles={{ content: { fontSize: 13 } }}
                />
                <Statistic
                  title="进程运行"
                  value={capabilities.formatUptime(stats.node.processUptime)}
                  styles={{ content: { fontSize: 13 } }}
                />
              </Space>
            </Space>
          </Col>
        </Row>
      ) : null}

      {fileStats ? (
        <>
          {stats ? <Divider style={{ margin: '16px 0 12px' }} /> : null}
          <Row gutter={[24, 16]} align="middle">
            <Col xs={12} sm={6} lg={4}>
              <Statistic
                title={
                  <Space size={4}>
                    <FolderOutlined />
                    <span>文件总数</span>
                  </Space>
                }
                value={capabilities.formatCompactNumber(fileStats.totalCount)}
                suffix="个"
              />
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <Statistic
                title={
                  <Space size={4}>
                    <FileOutlined />
                    <span>总存储</span>
                  </Space>
                }
                value={capabilities.formatBytes(fileStats.totalSize)}
              />
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <Statistic
                title={
                  <Space size={4}>
                    <WarningOutlined />
                    <span>孤儿文件</span>
                  </Space>
                }
                value={capabilities.formatCompactNumber(orphanStats?.count ?? 0)}
                suffix={`个 (${capabilities.formatBytes(orphanStats?.size ?? 0)})`}
                styles={{
                  content: {
                    color: orphanStats?.count
                      ? token.colorError
                      : token.colorSuccess,
                  },
                }}
              />
            </Col>
            {stats ? (
              <Col xs={12} sm={6} lg={4}>
                <Space size={24} wrap>
                  <Statistic
                    title="Node RSS"
                    value={capabilities.formatBytes(stats.node.rssBytes)}
                    styles={{ content: { fontSize: 14 } }}
                  />
                  <Statistic
                    title="Heap 已用"
                    value={capabilities.formatBytes(stats.node.heapUsedBytes)}
                    styles={{ content: { fontSize: 14 } }}
                  />
                </Space>
              </Col>
            ) : null}
            <Col xs={24} sm={24} lg={8}>
              <Space orientation="vertical" style={{ width: '100%' }} size={2}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  按类型分布
                </Typography.Text>
                {fileStats.byMimeType.map((item) => (
                  <div
                    key={item.mimeCategory}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Typography.Text style={{ width: 60, fontSize: 12 }}>
                      {item.mimeCategory}
                    </Typography.Text>
                    <Progress
                      aria-label={`${item.mimeCategory} 存储占比`}
                      percent={
                        fileStats.totalSize > 0
                          ? Math.round((item.size / fileStats.totalSize) * 100)
                          : 0
                      }
                      size="small"
                      style={{ flex: 1 }}
                      format={() => capabilities.formatBytes(item.size)}
                    />
                  </div>
                ))}
              </Space>
            </Col>
          </Row>
        </>
      ) : null}
    </Card>
  );
}
