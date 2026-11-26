import { useState } from 'react';
import { Button, Col, Row, Select, Space, Switch, Typography } from 'antd';
import { ChartPanel, DetailCard, MetricCard, PermissionGuard, ProfileIdentity, SectionCard, SettingsRow, StatusTag } from '../../src';

export function StatesPage({ onMessage }: { onMessage: (text: string) => void }) {
  const [chartState, setChartState] = useState<'ready' | 'loading' | 'empty' | 'error'>('ready');
  const [permitted, setPermitted] = useState(true);

  return (
    <div className="sxw-docs-page-content">
      <SectionCard title="状态标签">
        <Space size={[8, 8]} wrap>
          <StatusTag color="grey">草稿</StatusTag>
          <StatusTag color="purple">审批中</StatusTag>
          <StatusTag color="blue">已确认</StatusTag>
          <StatusTag color="orange">生产中</StatusTag>
          <StatusTag color="cyan">已发货</StatusTag>
          <StatusTag color="green">已完工</StatusTag>
          <StatusTag color="red">已取消</StatusTag>
        </Space>
      </SectionCard>

      <SectionCard title="状态预览">
        <div className="sxw-state-toolbar">
          <Typography.Text>图表面板状态</Typography.Text>
          <Select
            aria-label="选择图表面板状态"
            value={chartState}
            onChange={setChartState}
            options={[
              { value: 'ready', label: '内容' },
              { value: 'loading', label: '加载中' },
              { value: 'empty', label: '空结果' },
              { value: 'error', label: '错误' },
            ]}
            style={{ width: 140 }}
          />
        </div>
        <ChartPanel
          title="宿主提供的可视化插槽"
          state={chartState}
          emptyDescription="当前筛选没有结果"
          errorDescription="数据暂时不可用"
          onRetry={() => setChartState('loading')}
        >
          <div className="sxw-chart-placeholder" aria-label="示例图表区域">
            <div className="sxw-chart-placeholder__bars"><i /><i /><i /><i /><i /></div>
            <Typography.Text type="secondary">此区域由宿主图表组件渲染</Typography.Text>
          </div>
        </ChartPanel>
      </SectionCard>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <SectionCard title="身份摘要">
            <ProfileIdentity
              displayName="示例用户"
              metadata={<span>组织名称 · 岗位名称由宿主字段提供</span>}
              onAvatarPress={() => onMessage('头像选择由宿主负责')}
            />
          </SectionCard>
        </Col>
        <Col xs={24} lg={12}>
          <SectionCard title="设置行与授权结果">
            <SettingsRow label="主题偏好" value="跟随项目设置" showDisclosure onClick={() => onMessage('主题偏好由宿主项目管理')} />
            <div className="sxw-state-permission">
              <Switch checked={permitted} aria-label="切换宿主授权结果" onChange={setPermitted} />
              <span>宿主传入的 permitted</span>
            </div>
            <PermissionGuard
              permitted={permitted}
              fallback={<Typography.Text type="secondary">宿主提供的无权内容替代项</Typography.Text>}
            >
              <Button onClick={() => onMessage('业务动作仍由宿主处理')}>授权状态允许时显示的操作</Button>
            </PermissionGuard>
          </SectionCard>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} md={12}>
          <MetricCard title="示例统计值" value={128} suffix="项" />
        </Col>
        <Col xs={24} md={12}>
          <DetailCard
            title="详情字段组合"
            items={[
              { key: 'name', label: '对象', children: '示例记录' },
              { key: 'state', label: '状态', children: '可用' },
            ]}
          />
        </Col>
      </Row>
    </div>
  );
}
