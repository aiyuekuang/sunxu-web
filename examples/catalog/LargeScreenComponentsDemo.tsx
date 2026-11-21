import { useMemo, useState } from 'react';
import { Button, Space, Typography } from 'antd';
import {
  AutoScrollTable,
  EmptyChart,
  PanelHeader,
  ScreenHeader,
  ScreenScaler,
  StatCard,
} from '../../src/mes';
import { SectionCard } from '../../src';

type DemoRow = {
  id: number;
  code: string;
  description: string;
  status: string;
};

const demoRows: DemoRow[] = Array.from({ length: 28 }, (_, index) => ({
  id: index + 1,
  code: `WO-2026-${String(index + 1).padStart(4, '0')}`,
  description: `生产任务 ${index + 1}`,
  status: index % 5 === 0 ? '待处理' : '进行中',
}));

export function LargeScreenComponentsDemo() {
  const [open, setOpen] = useState(false);
  const [autoPlaying, setAutoPlaying] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const columns = useMemo(
    () => [
      { title: '工单编号', dataIndex: 'code' as const, width: '34%' },
      { title: '生产任务', dataIndex: 'description' as const, width: '38%' },
      { title: '状态', dataIndex: 'status' as const, align: 'center' as const },
    ],
    [],
  );

  return (
    <SectionCard title="MES 大屏组件">
      <Typography.Paragraph type="secondary">
        指标卡、面板标题、空态、全屏缩放、顶部操作栏与自动滚动表格；表格提供可键盘操作的暂停按钮，并遵循系统减少动态效果设置。
      </Typography.Paragraph>
      <Space wrap align="center">
        <Button type="primary" onClick={() => setOpen(true)}>
          打开全屏示例
        </Button>
        <Typography.Text type="secondary">
          ESC、返回首页或下方退出按钮均会关闭示例画布
        </Typography.Text>
      </Space>
      {open ? (
        <ScreenScaler>
          <div
            style={{
              display: 'flex',
              height: '100%',
              flexDirection: 'column',
              gap: 8,
              padding: 16,
              background: 'var(--sunxu-mes-large-screen-bg, #020617)',
              color: 'var(--sunxu-mes-large-screen-text, #f1f5f9)',
            }}
          >
            <ScreenHeader
              capabilities={{ navigate: () => setOpen(false) }}
              title="MES 组件目录大屏预览"
              lastUpdated={lastUpdated}
              autoPlaying={autoPlaying}
              onToggleAutoPlay={() => setAutoPlaying((value) => !value)}
              onRefresh={() => setLastUpdated(new Date())}
              onToggleVoice={() => undefined}
              voiceEnabled={false}
            />
            <Space size={8} style={{ display: 'flex' }}>
              <StatCard
                label="在制工单"
                value={12840}
                prev={12120}
                suffix="单"
                hint="当前班次 · 全部车间"
                pulse
              />
              <StatCard
                label="计划达成率"
                value={94.6}
                prev={96.1}
                percentCompare
                suffix="%"
              />
              <StatCard label="异常事件" value={0} prev={0} color="#22c55e" />
            </Space>
            <div
              style={{
                display: 'grid',
                flex: 1,
                minHeight: 0,
                gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  minWidth: 0,
                  flexDirection: 'column',
                  overflow: 'hidden',
                  border: '1px solid var(--sunxu-mes-large-screen-border, #334155)',
                  borderRadius: 6,
                  background: 'var(--sunxu-mes-large-screen-panel-bg, #0f172a)',
                }}
              >
                <PanelHeader
                  title="生产任务进度"
                  tag={`${demoRows.length} 条`}
                  extra={
                    <Button size="small" onClick={() => setOpen(false)}>
                      退出目录示例
                    </Button>
                  }
                />
                <AutoScrollTable
                  columns={columns}
                  data={demoRows}
                  rowKey="id"
                  ariaLabel="生产任务进度"
                  rowHeight={54}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  minWidth: 0,
                  flexDirection: 'column',
                  border: '1px solid var(--sunxu-mes-large-screen-border, #334155)',
                  borderRadius: 6,
                  background: 'var(--sunxu-mes-large-screen-panel-bg, #0f172a)',
                }}
              >
                <PanelHeader title="异常监控" tag="实时" />
                <EmptyChart text="当前没有异常事件" />
              </div>
            </div>
          </div>
        </ScreenScaler>
      ) : null}
    </SectionCard>
  );
}
